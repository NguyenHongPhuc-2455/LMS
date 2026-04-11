const prisma = require('../configs/prisma');
const ApiError = require('../utils/ApiError');

const getAllCourses = async () => {
    return await prisma.course.findMany({
        where: { deleted_at: null },
        include: {
            category: true,
            instructor: { select: { id: true, username: true, full_name: true } },
            _count: { select: { sections: true } }
        }
    });
};

const getCourseById = async (courseId) => {
    return await prisma.course.findUnique({
        where: { id: parseInt(courseId) },
        include: {
            category: true,
            instructor: { select: { id: true, username: true, full_name: true } },
            sections: {
                orderBy: { order: 'asc' },
                include: {
                    lessons: { orderBy: { order: 'asc' } }
                }
            }
        }
    });
};

const createCourse = async (data) => {
    return await prisma.course.create({ data });
};

module.exports = {
    getAllCourses,
    getCourseById,
    createCourse
};
