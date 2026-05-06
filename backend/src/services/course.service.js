const prisma = require('../configs/prisma');
const ApiError = require('../utils/ApiError');
const { lessonSelect } = require('./video.service');

const getAllCourses = async (search = '', categoryId = null) => {
    return await prisma.course.findMany({
        where: {
            deleted_at: null,
            ...(search && {
                title: { contains: search, mode: 'insensitive' }
            }),
            ...(categoryId !== undefined && categoryId !== null && categoryId !== '' && {
                category_id: parseInt(categoryId) === -1 ? null : parseInt(categoryId)
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
                        select: lessonSelect,
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
