const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboardStats = async () => {
    try {
        // 1. Overview counts
        const totalStudents = await prisma.user.count({
            where: {
                user_roles: {
                    some: {
                        role: { name: 'student' }
                    }
                }
            }
        });

        const totalCourses = await prisma.course.count();

        const totalEnrollments = await prisma.enrollment.count();

        const coursePending = await prisma.courseRequest.count({
            where: { status: 'PENDING' }
        });

        const programPending = await prisma.programRequest.count({
            where: { status: 'PENDING' }
        });

        const pendingRequests = coursePending + programPending;

        // 2. Enrollment Trend (Last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            d.setHours(0, 0, 0, 0);
            return d;
        });

        const enrollmentTrends = await Promise.all(
            last7Days.map(async (date) => {
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);

                const count = await prisma.enrollment.count({
                    where: {
                        enrolled_at: {
                            gte: date,
                            lt: nextDate
                        }
                    }
                });

                return {
                    name: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                    enrollments: count
                };
            })
        );

        // 3. Top Courses by enrollment
        const topCoursesData = await prisma.enrollment.groupBy({
            by: ['course_id'],
            _count: {
                course_id: true
            },
            orderBy: {
                _count: {
                    course_id: 'desc'
                }
            },
            take: 5
        });

        const topCourses = await Promise.all(
            topCoursesData.map(async (item) => {
                const course = await prisma.course.findUnique({
                    where: { id: item.course_id },
                    select: { title: true }
                });
                return {
                    title: course.title,
                    count: item._count.course_id
                };
            })
        );

        return {
            overview: {
                totalStudents,
                totalCourses,
                totalEnrollments,
                pendingRequests
            },
            enrollmentTrends,
            topCourses
        };
    } catch (error) {
        console.error('Error in stats service:', error);
        throw error;
    }
};

const getStudentsProgressByCourse = async (courseId) => {
    try {
        const id = parseInt(courseId);

        // 1. Get all lessons in this course to calculate total
        const lessons = await prisma.lesson.findMany({
            where: {
                section: {
                    course_id: id
                }
            },
            select: { id: true }
        });

        const lessonIds = lessons.map(l => l.id);
        const totalLessons = lessonIds.length;

        // 2. Get students enrolled in this course
        const enrollments = await prisma.enrollment.findMany({
            where: { course_id: id },
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        username: true,
                        avatar: true
                    }
                }
            }
        });

        // 3. Calculate progress for each student
        const progressData = await Promise.all(enrollments.map(async (e) => {
            const completedCount = await prisma.lessonCompleted.count({
                where: {
                    user_id: e.user_id,
                    lesson_id: { in: lessonIds }
                }
            });

            const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

            return {
                id: e.user.id,
                fullName: e.user.full_name || e.user.username,
                email: e.user.email,
                avatar: e.user.avatar,
                completedLessons: completedCount,
                totalLessons: totalLessons,
                progressPercent: progressPercent,
                enrolledAt: e.enrolled_at
            };
        }));

        return progressData;
    } catch (error) {
        console.error('Error in getStudentsProgressByCourse:', error);
        throw error;
    }
};

const emitPendingRequestsCountToAdmins = async () => {
    try {
        const socketUtils = require('../utils/socket');
        const coursePending = await prisma.courseRequest.count({
            where: { status: 'PENDING' }
        });

        const programPending = await prisma.programRequest.count({
            where: { status: 'PENDING' }
        });

        const total = coursePending + programPending;
        await socketUtils.emitToAdmins('updatePendingRequestCount', { count: total });
    } catch (error) {
        console.error('Error emitting pending requests count:', error);
    }
};

module.exports = {
    getDashboardStats,
    getStudentsProgressByCourse,
    emitPendingRequestsCountToAdmins
};
