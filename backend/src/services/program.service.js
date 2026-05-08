const prisma = require('../configs/prisma');

const include = {
    instructor: { select: { id: true, username: true, full_name: true, avatar: true } },
    courses: {
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

const getAllPrograms = async ({ search = '', status, instructorId } = {}) => {
    return await prisma.learningProgram.findMany({
        where: {
            deleted_at: null,
            ...(status ? { status } : {}),
            ...(instructorId ? { instructor_id: parseInt(instructorId) } : {}),
            ...(search ? { title: { contains: search, mode: 'insensitive' } } : {})
        },
        include,
        orderBy: { created_at: 'desc' }
    });
};

const getProgramById = async (id) => {
    return await prisma.learningProgram.findUnique({
        where: { id: parseInt(id), deleted_at: null },
        include
    });
};

const createProgram = async (data) => {
    return await prisma.learningProgram.create({ data, include });
};

const updateProgram = async (id, data) => {
    return await prisma.learningProgram.update({
        where: { id: parseInt(id) },
        data: { ...data, updated_at: new Date() },
        include
    });
};

const softDeleteProgram = async (id) => {
    return await prisma.learningProgram.update({
        where: { id: parseInt(id) },
        data: { deleted_at: new Date() }
    });
};

const addCourse = async (programId, courseId, order) => {
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

    await prisma.programEnrollment.upsert({
        where: { user_id_program_id: { user_id: userId, program_id: parseInt(programId) } },
        update: {},
        create: { user_id: userId, program_id: parseInt(programId) }
    });

    for (const pc of program.courses) {
        await prisma.enrollment.upsert({
            where: { user_id_course_id: { user_id: userId, course_id: pc.course_id } },
            update: {},
            create: { user_id: userId, course_id: pc.course_id }
        });
    }

    return program;
};

const getMyPrograms = async (userId) => {
    const enrollments = await prisma.programEnrollment.findMany({
        where: { 
            user_id: userId,
            program: {
                deleted_at: null
            }
        },
        include: {
            program: {
                include: {
                    instructor: { select: { id: true, full_name: true } },
                    courses: {
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
    // courses: [{ courseId: 1, order: 0 }, { courseId: 2, order: 1 }]
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
    createProgram,
    updateProgram,
    softDeleteProgram,
    addCourse,
    removeCourse,
    reorderCourses,
    enrollProgram,
    getMyPrograms
};

