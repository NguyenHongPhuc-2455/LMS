const prisma = require('../configs/prisma');
const ApiError = require('../utils/ApiError');
const { programInclude, withoutCountInclude, normalizeProgramCourseCount } = require('./program/program.include');
const { filterProgramsForUserScope, assertProgramVisibleToUser, getDepartmentMap } = require('./program/programScope.service');
const { enrichProgramCoursesWithProgress, buildCourseStatsMap } = require('./program/programProgress.service');
const { isUserInScope } = require('../utils/scope');
const getAllPrograms = async ({ search = '', status, instructorId, user = null, page = null, limit = null } = {}) => {
    let programs = await prisma.learningProgram.findMany({
        where: {
            deleted_at: null,
            ...(status ? { status } : {}),
            ...(instructorId ? { instructor_id: parseInt(instructorId) } : {}),
            ...(search ? { title: { contains: search, mode: 'insensitive' } } : {})
        },
        include: programInclude,
        orderBy: { created_at: 'desc' }
    });
    programs = await filterProgramsForUserScope(programs, user);

    const normalized = programs.map(normalizeProgramCourseCount);

    if (page !== null && limit !== null) {
        const total = normalized.length;
        const skip = (page - 1) * limit;
        return {
            programs: normalized.slice(skip, skip + limit),
            total
        };
    }

    return normalized;
};

const getProgramById = async (id) => {
    const program = await prisma.learningProgram.findUnique({
        where: { id: parseInt(id), deleted_at: null },
        include: programInclude
    });
    if (!program) return null;
    return normalizeProgramCourseCount(program);
};

const createProgram = async (data) => {
    const program = await prisma.learningProgram.create({
        data,
        include: withoutCountInclude()
    });
    return {
        ...program,
        _count: {
            enrollments: 0,
            courses: 0
        }
    };
};

const updateProgram = async (id, data) => {
    const program = await prisma.learningProgram.update({
        where: { id: parseInt(id) },
        data: { ...data, updated_at: new Date() },
        include: withoutCountInclude()
    });

    // Fetch counts separately or use current ones
    const counts = await prisma.learningProgram.findUnique({
        where: { id: parseInt(id) },
        select: {
            _count: { select: { enrollments: true, courses: true } }
        }
    });

    return {
        ...program,
        _count: counts._count
    };
};

const softDeleteProgram = async (id) => {

    return await prisma.learningProgram.update({
        where: { id: parseInt(id) },
        data: { deleted_at: new Date() }
    });
};

const addCourse = async (programId, courseId, order) => {
    const program = await prisma.learningProgram.findUnique({
        where: { id: parseInt(programId) },
        select: { is_mandatory: true, mandatory_deadline_days: true }
    });
    if (!program) throw new ApiError(404, 'Không tìm thấy lộ trình học');

    const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) },
        select: { title: true, is_mandatory: true, mandatory_deadline_days: true }
    });
    if (!course) throw new ApiError(404, 'Không tìm thấy khóa học');

    // Kiểm tra ràng buộc thời hạn hoàn thành giữa lộ trình và khóa học con
    if (program.is_mandatory && program.mandatory_deadline_days !== null) {
        if (course.is_mandatory && course.mandatory_deadline_days !== null) {
            if (course.mandatory_deadline_days > program.mandatory_deadline_days) {
                throw new ApiError(
                    400,
                    'Khóa học có deadline dài hơn lộ trình'
                );
            }
        }
    }

    const count = await prisma.programCourse.count({ where: { program_id: parseInt(programId) } });
    const programCourse = await prisma.programCourse.create({
        data: {
            program_id: parseInt(programId),
            course_id: parseInt(courseId),
            order: order !== undefined ? parseInt(order) : count
        },
        include: { course: { select: { id: true, title: true, thumbnail: true, level: true } } }
    });

    // Tự động ghi danh toàn bộ học viên hiện tại của chương trình vào khóa học mới này
    const programParticipants = await prisma.programEnrollment.findMany({
        where: { program_id: parseInt(programId) }
    });

    if (programParticipants.length > 0) {
        const enrollments = programParticipants.map(participant => ({
            user_id: participant.user_id,
            course_id: parseInt(courseId)
        }));

        // Sử dụng createMany với skipDuplicates: true để tránh lỗi nếu user đã được ghi danh trước đó
        await prisma.enrollment.createMany({
            data: enrollments,
            skipDuplicates: true
        });
    }

    return programCourse;
};

const removeCourse = async (programId, courseId) => {
    return await prisma.programCourse.delete({
        where: { program_id_course_id: { program_id: parseInt(programId), course_id: parseInt(courseId) } }
    });
};

const enrollProgram = async (userId, programId) => {
    const program = await getProgramById(programId);
    if (!program) return null;

    // Kiểm tra quyền truy cập sớm (Early Access)
    const { calculateProgramStatus } = require('../utils/courseStatus');
    const statusInfo = calculateProgramStatus(program);
    if (!statusInfo.canAccess) {
        throw new ApiError(400, statusInfo.reason || 'Lộ trình học chưa đến ngày mở.');
    }

    // 1. Ghi danh vào lộ trình
    await prisma.programEnrollment.upsert({
        where: { user_id_program_id: { user_id: userId, program_id: parseInt(programId) } },
        update: {},
        create: { user_id: userId, program_id: parseInt(programId) }
    });

    // 2. Tối ưu: Ghi danh vào toàn bộ khóa học con bằng createMany
    if (program.courses && program.courses.length > 0) {
        const enrollments = program.courses.map(pc => ({
            user_id: userId,
            course_id: pc.course_id
        }));

        await prisma.enrollment.createMany({
            data: enrollments,
            skipDuplicates: true
        });
    }

    return program;
};

/**
 * Lấy chi tiết lộ trình học với thông tin tiến độ và quyền truy cập (Đã tối ưu N+1)
 */
const getEnrichedProgramDetail = async (id, user) => {
    const program = await getProgramById(id);
    if (!program) throw new ApiError(404, 'Không tìm thấy chương trình học');

    const userId = user?.id;
    let isEnrolled = false;
    let requestStatus = null;

    if (userId) {
        const [enrollment, request] = await Promise.all([
            prisma.programEnrollment.findUnique({
                where: { user_id_program_id: { user_id: userId, program_id: parseInt(id) } }
            }),
            prisma.programRequest.findFirst({
                where: { user_id: userId, program_id: parseInt(id) },
                orderBy: { created_at: 'desc' }
            })
        ]);
        isEnrolled = !!enrollment;
        requestStatus = request?.status || null;

        await assertProgramVisibleToUser({ program, user, isEnrolled, ApiError });
    }

    if (isEnrolled && userId) {
        Object.assign(program, await enrichProgramCoursesWithProgress({ program, user }));
    }

    const { calculateProgramStatus } = require('../utils/courseStatus');
    const statusInfo = calculateProgramStatus(program);

    const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('instructor');
    const isOwner = program.instructor_id === userId;

    let canAccess = statusInfo.canAccess;
    let accessReason = statusInfo.reason;

    if (isAdmin || isOwner) {
        canAccess = true;
        accessReason = null;
    }

    // Nếu không có quyền truy cập sớm, chặn isEnrolled để không cho vào học
    if (!canAccess && isEnrolled) {
        isEnrolled = false;
    }

    const currentCourse = isEnrolled ? program.courses.find(pc => !pc.isFinished)?.course : null;
    return { 
        ...program, 
        isEnrolled, 
        requestStatus, 
        currentCourseId: currentCourse?.id || null,
        canAccess,
        accessReason
    };
};

/**
 * Lấy danh sách lộ trình của tôi kèm tiến độ (Đã tối ưu N+1)
 */
const getEnrichedMyPrograms = async (userId) => {
    const programs = await getMyPrograms(userId);
    if (programs.length === 0) return [];

    const allCourseIds = [...new Set(programs.flatMap(p => p.courses.map(pc => pc.course.id)))];

    // Tối ưu N+1: Lấy toàn bộ bài học và hoàn thành của tất cả lộ trình
    const [allLessons, allCompleted] = await Promise.all([
        prisma.lesson.findMany({
            where: { section: { course_id: { in: allCourseIds } } },
            select: { id: true, section: { select: { course_id: true } } }
        }),
        prisma.lessonCompleted.findMany({
            where: {
                user_id: userId, lesson_id: {
                    in: (await prisma.lesson.findMany({
                        where: { section: { course_id: { in: allCourseIds } } },
                        select: { id: true }
                    })).map(l => l.id)
                }
            },
            select: { lesson_id: true }
        })
    ]);

    const completedIds = new Set(allCompleted.map(c => c.lesson_id));
    const courseStatsMap = buildCourseStatsMap(allLessons, completedIds);

    return programs.map(p => {
        let totalProg = 0;
        const totalCourses = p.courses.length;

        p.courses.forEach(pc => {
            const stats = courseStatsMap[pc.course.id];
            if (stats && stats.total > 0) {
                totalProg += (stats.completed / stats.total) * 100;
            }
        });

        return {
            ...p,
            _count: {
                ...p._count,
                courses: totalCourses // Cập nhật số lượng chuẩn
            },
            progressPercent: totalCourses === 0 ? 0 : Math.round(totalProg / totalCourses)
        };
    });
};

const getMyPrograms = async (userId) => {
    const enrollments = await prisma.programEnrollment.findMany({
        where: {
            user_id: userId,
            program: { deleted_at: null }
        },
        include: {
            program: {
                include: {
                    instructor: { select: { id: true, full_name: true } },
                    courses: {
                        where: { course: { deleted_at: null } },
                        orderBy: { order: 'asc' },
                        include: { course: { select: { id: true, title: true } } }
                    },
                    _count: { select: { courses: true } }
                }
            }
        },
        orderBy: { enrolled_at: 'desc' }
    });
    return enrollments.map(e => ({ ...e.program, enrolled_at: e.enrolled_at }));
};


const reorderCourses = async (programId, courses) => {
    const updates = courses.map(c =>
        prisma.programCourse.update({
            where: { program_id_course_id: { program_id: parseInt(programId), course_id: parseInt(c.courseId) } },
            data: { order: parseInt(c.order) }
        })
    );
    return await prisma.$transaction(updates);
};

const getMandatoryProgramsForUser = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            join_date: true,
            department_id: true,
            position_id: true,
            user_roles: {
                include: { role: true }
            }
        }
    });

    if (!user) return [];

    const roles = (user.user_roles || []).map(ur => ur.role.name.toLowerCase());
    if (roles.includes('admin')) {
        return [];
    }

    if (!user.join_date) return [];

    let mandatoryPrograms = await prisma.learningProgram.findMany({
        where: { is_mandatory: true, deleted_at: null },
        include: {
            instructor: { select: { full_name: true } },
            courses: {
                where: { course: { deleted_at: null } },
                include: {
                    course: {
                        select: {
                            id: true,
                            sections: {
                                include: {
                                    lessons: { select: { id: true } }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const enrolledPrograms = await prisma.programEnrollment.findMany({
        where: { user_id: userId },
        select: { program_id: true, enrolled_at: true }
    });
    const enrolledProgramMap = {};
    enrolledPrograms.forEach(ep => { enrolledProgramMap[ep.program_id] = ep.enrolled_at; });

    const departmentMap = await getDepartmentMap();

    mandatoryPrograms = mandatoryPrograms.filter(program => {
        const isEnrolled = !!enrolledProgramMap[program.id];
        return isUserInScope(user, program, isEnrolled, departmentMap);
    });

    const completedLessons = await prisma.lessonCompleted.findMany({
        where: { user_id: userId },
        select: { lesson_id: true }
    });
    const completedLessonSet = new Set(completedLessons.map(c => c.lesson_id));

    const { calculateCourseStatus } = require('../utils/courseStatus');

    return mandatoryPrograms.map(program => {
        let totalLessons = 0;
        let completedLessonsCount = 0;

        program.courses.forEach(pc => {
            if (pc.course && pc.course.sections) {
                const lessons = pc.course.sections.flatMap(s => s.lessons || []);
                totalLessons += lessons.length;
                completedLessonsCount += lessons.filter(l => completedLessonSet.has(l.id)).length;
            }
        });

        const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessonsCount / totalLessons) * 100);
        
        const statusInfo = calculateCourseStatus(program, user, progressPercent, enrolledProgramMap[program.id]);

        return {
            id: program.id,
            title: program.title,
            thumbnail: program.thumbnail,
            level: program.level,
            is_mandatory: true,
            mandatory_deadline_days: program.mandatory_deadline_days,
            deadlineDate: statusInfo.deadlineDate,
            remainingDays: statusInfo.remainingDays,
            progressPercent,
            completedLessons: completedLessonsCount,
            totalLessons,
            status: statusInfo.status,
            isOverdue: statusInfo.isOverdue,
            canAccess: statusInfo.canAccess,
            reason: statusInfo.reason,
            instructor: program.instructor
        };
    }).filter(p => p.canAccess !== false);
};

module.exports = {
    getAllPrograms,
    getProgramById,
    getEnrichedProgramDetail,
    getEnrichedMyPrograms,
    createProgram,
    updateProgram,
    softDeleteProgram,
    addCourse,
    removeCourse,
    reorderCourses,
    enrollProgram,
    getMyPrograms,
    getMandatoryProgramsForUser
};



