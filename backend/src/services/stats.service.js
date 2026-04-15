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

        const pendingRequests = await prisma.courseRequest.count({
            where: { status: 'PENDING' }
        });

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

module.exports = {
    getDashboardStats
};
