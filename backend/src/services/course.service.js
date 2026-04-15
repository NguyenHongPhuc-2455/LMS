const prisma = require('../configs/prisma');
const ApiError = require('../utils/ApiError');

const getAllCourses = async (search = '') => {
    return await prisma.course.findMany({
        where: {
            deleted_at: null,
            ...(search && {
                title: { contains: search, mode: 'insensitive' }
            })
        },
        include: {
            category: true,
            instructor: { select: { id: true, username: true, full_name: true } },
            _count: { select: { sections: true, enrollments: true } }
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
                orderBy: [
                    { order: 'asc' },
                    { title: 'asc' },
                    { id: 'asc' }
                ],
                include: {
                    lessons: {
                        orderBy: [
                            { order: 'asc' },
                            { title: 'asc' },
                            { id: 'asc' }
                        ]
                    }
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
