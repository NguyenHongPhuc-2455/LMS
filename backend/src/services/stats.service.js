const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getLocalDate = (date) => {
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};

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

const trackLearningTime = async (userId, courseId, lessonId, duration) => {
    try {
        const todayStr = getLocalDate(new Date());
        const today = new Date(todayStr); // Neutral date for @db.Date storage

        // Upsert: Find if record for today/user/course exists, if so increment duration, else create
        // Note: Using a unique constraint [user_id, course_id, date]
        const session = await prisma.learningSession.upsert({
            where: {
                user_id_course_id_date: {
                    user_id: parseInt(userId),
                    course_id: courseId ? parseInt(courseId) : null,
                    date: today
                }
            },
            update: {
                duration: {
                    increment: parseInt(duration)
                },
                lesson_id: lessonId ? parseInt(lessonId) : undefined
            },
            create: {
                user_id: parseInt(userId),
                course_id: courseId ? parseInt(courseId) : null,
                lesson_id: lessonId ? parseInt(lessonId) : null,
                duration: parseInt(duration),
                date: today
            }
        });

        return session;
    } catch (error) {
        console.error('Error in trackLearningTime:', error);
        throw error;
    }
};

const getUserLearningStats = async (userId, days = 7) => {
    try {
        const id = parseInt(userId);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0);

        const sessions = await prisma.learningSession.findMany({
            where: {
                user_id: id,
                date: {
                    gte: startDate
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        console.log(`[DEBUG] getUserLearningStats for userId: ${id}, days: ${days}, found ${sessions.length} sessions in range`);

        // Generate full range of days to ensure 0-duration days are included
        const dailyData = Array.from({ length: days }, (_, i) => {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = getLocalDate(date);

            const sessionForDay = sessions.filter(s => getLocalDate(s.date) === dateStr);
            const totalSeconds = sessionForDay.reduce((acc, s) => acc + s.duration, 0);
            const totalMinutes = Math.round(totalSeconds / 60);

            return {
                date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                fullDate: dateStr,
                minutes: totalMinutes
            };
        });

        return dailyData;
    } catch (error) {
        console.error('Error in getUserLearningStats:', error);
        throw error;
    }
};

const getUserLearningSummary = async (userId) => {
    try {
        const id = parseInt(userId);

        // 1. All time stats
        const allSessions = await prisma.learningSession.findMany({
            where: { user_id: id },
            orderBy: { date: 'desc' }
        });

        console.log(`[DEBUG] getUserLearningSummary for userId: ${id}, found ${allSessions.length} sessions`);

        const totalSeconds = allSessions.reduce((acc, s) => acc + s.duration, 0);
        const totalHours = Math.floor(totalSeconds / 3600);
        const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
        const totalHoursDisplay = `${totalHours}h${totalMinutes}p`;

        // 2. Average per day (of active days)
        const activeDaysCount = new Set(allSessions.map(s => getLocalDate(s.date))).size;
        const avgTotalSeconds = activeDaysCount === 0 ? 0 : totalSeconds / activeDaysCount;
        const avgHours = Math.floor(avgTotalSeconds / 3600);
        const avgMinutes = Math.floor((avgTotalSeconds % 3600) / 60);
        const avgHoursDisplay = `${avgHours}h${avgMinutes}p`;
        const avgHoursPerDay = activeDaysCount === 0 ? 0 : parseFloat((totalHours / activeDaysCount).toFixed(1));

        // 3. Peak Day (Day of week)
        const dayOfWeekStats = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
        allSessions.forEach(s => {
            const day = s.date.getDay();
            dayOfWeekStats[day] += s.duration;
        });
        const peakDayIndex = dayOfWeekStats.indexOf(Math.max(...dayOfWeekStats));
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const peakDay = activeDaysCount === 0 ? 'Chưa có' : dayNames[peakDayIndex];

        // 4. Longest Streak (Record)
        let longestStreak = 0;
        if (allSessions.length > 0) {
            const sessionDates = Array.from(new Set(allSessions.map(s => getLocalDate(s.date))))
                .map(d => new Date(d).getTime())
                .sort((a, b) => b - a); // Sort descending (latest first)

            if (sessionDates.length > 0) {
                let currentRunningStreak = 1;
                let maxStreak = 1;

                for (let i = 0; i < sessionDates.length - 1; i++) {
                    const diffDays = Math.round((sessionDates[i] - sessionDates[i + 1]) / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        currentRunningStreak++;
                    } else {
                        maxStreak = Math.max(maxStreak, currentRunningStreak);
                        currentRunningStreak = 1;
                    }
                }
                longestStreak = Math.max(maxStreak, currentRunningStreak);
            }
        }

        return {
            totalHoursDisplay,
            totalHours,
            avgHoursDisplay,
            avgHoursPerDay,
            peakDay,
            currentStreak: longestStreak
        };
    } catch (error) {
        console.error('Error in getUserLearningSummary:', error);
        throw error;
    }
};

const getGlobalLearningTrends = async (days = 7) => {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0);

        const sessions = await prisma.learningSession.findMany({
            where: {
                date: {
                    gte: startDate
                }
            }
        });

        const trendData = Array.from({ length: days }, (_, i) => {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = getLocalDate(date);

            const sessionsForDay = sessions.filter(s => getLocalDate(s.date) === dateStr);
            const totalSeconds = sessionsForDay.reduce((acc, s) => acc + s.duration, 0);
            const totalHours = parseFloat((totalSeconds / 3600).toFixed(1));

            return {
                name: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                hours: totalHours
            };
        });

        return trendData;
    } catch (error) {
        console.error('Error in getGlobalLearningTrends:', error);
        throw error;
    }
};

module.exports = {
    getDashboardStats,
    getStudentsProgressByCourse,
    emitPendingRequestsCountToAdmins,
    trackLearningTime,
    getUserLearningStats,
    getUserLearningSummary,
    getGlobalLearningTrends
};
