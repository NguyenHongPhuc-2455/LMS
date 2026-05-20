const prisma = require('../configs/prisma');
const { isUserInScope } = require('../utils/scope');


const include = {
    instructor: { select: { id: true, username: true, full_name: true, avatar: true } },
    courses: {
        where: {
            course: { deleted_at: null }
        },
        orderBy: { order: 'asc' },
        include: {
            course: {
                select: {
                    id: true, title: true, thumbnail: true, level: true, description: true,
                    instructor: { select: { id: true, full_name: true } },
                    _count: { select: { sections: true, enrollments: true } }
                }
            }
        }
    },

    _count: { select: { enrollments: true, courses: true } }
};

const getAllPrograms = async ({ search = '', status, instructorId, user = null } = {}) => {
    let programs = await prisma.learningProgram.findMany({
        where: {
            deleted_at: null,
            ...(status ? { status } : {}),
            ...(instructorId ? { instructor_id: parseInt(instructorId) } : {}),
            ...(search ? { title: { contains: search, mode: 'insensitive' } } : {})
        },
        include,
        orderBy: { created_at: 'desc' }
    });

    // Lọc các Lộ trình hiển thị theo Phạm vi áp dụng (Nếu không phải admin/instructor)
    if (user) {
        const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('instructor');
        if (!isAdmin) {
            const userData = await prisma.user.findUnique({ 
                where: { id: user.id }, 
                select: { id: true, department_id: true, position_id: true, join_date: true } 
            });
            
            if (userData) {
                const enrolledPrograms = await prisma.programEnrollment.findMany({
                    where: { user_id: user.id },
                    select: { program_id: true }
                });
                const enrolledProgramIds = new Set(enrolledPrograms.map(ep => ep.program_id));

                programs = programs.filter(program => {
                    const isEnrolled = enrolledProgramIds.has(program.id);
                    return isUserInScope(userData, program, isEnrolled);
                });
            }
        }
    }

    return programs.map(p => ({
        ...p,
        _count: {
            ...p._count,
            courses: p.courses.length
        }
    }));
};

const getProgramById = async (id) => {
    const program = await prisma.learningProgram.findUnique({
        where: { id: parseInt(id), deleted_at: null },
        include
    });
    if (!program) return null;
    return {
        ...program,
        _count: {
            ...program._count,
            courses: program.courses.length
        }
    };
};

const createProgram = async (data) => {
    const { _count, ...createInclude } = include;
    const program = await prisma.learningProgram.create({
        data,
        include: createInclude
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
    const { _count, ...updateInclude } = include;
    const program = await prisma.learningProgram.update({
        where: { id: parseInt(id) },
        data: { ...data, updated_at: new Date() },
        include: updateInclude
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

const ApiError = require('../utils/ApiError');

const enrollProgram = async (userId, programId) => {
    const program = await getProgramById(programId);
    if (!program) return null;

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

        // Kiểm tra phạm vi hiển thị (Visibility Scope)
        const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('instructor');
        const isOwner = program.instructor_id === userId;
        if (!isAdmin && !isOwner) {
            const userData = await prisma.user.findUnique({ 
                where: { id: userId }, 
                select: { id: true, department_id: true, position_id: true, join_date: true } 
            });
            if (userData) {
                const inScope = isUserInScope(userData, program, isEnrolled);
                if (!inScope) {
                    throw new ApiError(403, 'Bạn không thuộc đối tượng được phân phối lộ trình học này.');
                }
            }
        }
    }

    if (isEnrolled && userId) {
        const sortedCourses = program.courses.sort((a, b) => a.order - b.order);
        const courseIds = sortedCourses.map(pc => pc.course.id);

        // Tối ưu N+1: Lấy tất cả bài học và trạng thái hoàn thành trong 2 queries
        const allLessons = await prisma.lesson.findMany({
            where: { section: { course_id: { in: courseIds } } },
            select: { id: true, section: { select: { course_id: true } } }
        });

        const allCompleted = await prisma.lessonCompleted.findMany({
            where: { user_id: userId, lesson_id: { in: allLessons.map(l => l.id) } },
            select: { lesson_id: true }
        });

        const completedIds = new Set(allCompleted.map(c => c.lesson_id));
        const courseLessonMap = {};
        allLessons.forEach(l => {
            const cid = l.section.course_id;
            if (!courseLessonMap[cid]) courseLessonMap[cid] = [];
            courseLessonMap[cid].push(l.id);
        });

        let previousCourseFinished = true;
        const isAdmin = user?.roles?.includes('admin');
        const isInstructor = program.instructor_id === userId;

        program.courses = sortedCourses.map(pc => {
            const cid = pc.course.id;
            const lessonIds = courseLessonMap[cid] || [];
            const total = lessonIds.length;
            const completed = lessonIds.filter(id => completedIds.has(id)).length;
            const isFinished = total === 0 || completed === total;
            const isLocked = (isAdmin || isInstructor) ? false : !previousCourseFinished;

            previousCourseFinished = isFinished;

            return {
                ...pc,
                isLocked,
                isFinished,
                progressPercent: total === 0 ? 0 : Math.round((completed / total) * 100)
            };
        });
    }

    const currentCourse = isEnrolled ? program.courses.find(pc => !pc.isFinished)?.course : null;
    return { ...program, isEnrolled, requestStatus, currentCourseId: currentCourse?.id || null };
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
    const courseStatsMap = {}; // courseId -> { total, completed }

    allLessons.forEach(l => {
        const cid = l.section.course_id;
        if (!courseStatsMap[cid]) courseStatsMap[cid] = { total: 0, completed: 0 };
        courseStatsMap[cid].total++;
        if (completedIds.has(l.id)) courseStatsMap[cid].completed++;
    });

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
    getMyPrograms
};


