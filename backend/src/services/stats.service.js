const prisma = require('../configs/prisma');

const moment = require('moment');

/**
 * Lấy chuỗi ngày YYYY-MM-DD từ đối tượng Date.
 * Dùng cho các trường @db.Date của Prisma (vốn luôn trả về midnight UTC).
 */
const getDBDateStr = (date) => {
    if (!date) return '';
    return moment.utc(date).format('YYYY-MM-DD');
};

/**
 * Lấy chuỗi ngày YYYY-MM-DD của ngày hôm nay theo giờ địa phương máy chủ.
 */
const getTodayStr = () => {
    return moment().format('YYYY-MM-DD');
};

/**
 * Helper to calculate percentage trend between current and previous values
 */
const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return { percent: '0%', isUp: true };
    const diff = ((current - previous) / previous) * 100;
    return {
        percent: `${Math.abs(diff).toFixed(1)}%`,
        isUp: diff >= 0
    };
};

/**
 * Lấy số liệu tổng quan (Sinh viên, Khóa học, Đăng ký, Yêu cầu chờ)
 */
const getOverviewStats = async () => {
    const yesterday = moment().subtract(1, 'day').endOf('day').toDate();

    const [
        totalStudents, totalCourses, totalEnrollments,
        coursePending, programPending,
        yesterdayStudents, yesterdayCourses, yesterdayEnrollments,
        yesterdayCourseRequests, yesterdayProgramRequests,
        currentCourseRequests, currentProgramRequests
    ] = await Promise.all([
        // Hiện tại
        prisma.user.count({ where: { deleted_at: null } }),
        prisma.course.count({ where: { deleted_at: null } }),
        prisma.enrollment.count({ where: { course: { deleted_at: null } } }),
        prisma.courseRequest.count({ where: { status: 'PENDING' } }),
        prisma.programRequest.count({ where: { status: 'PENDING' } }),
        // Hôm qua
        prisma.user.count({ where: { created_at: { lte: yesterday }, deleted_at: null } }),
        prisma.course.count({ where: { created_at: { lte: yesterday }, deleted_at: null } }),
        prisma.enrollment.count({ where: { enrolled_at: { lte: yesterday }, course: { deleted_at: null } } }),
        prisma.courseRequest.count({ where: { created_at: { lte: yesterday } } }),
        prisma.programRequest.count({ where: { created_at: { lte: yesterday } } }),
        // Tổng yêu cầu hiện tại
        prisma.courseRequest.count(),
        prisma.programRequest.count()
    ]);

    const pendingRequests = coursePending + programPending;
    const currentTotalRequests = currentCourseRequests + currentProgramRequests;
    const yesterdayTotalRequests = yesterdayCourseRequests + yesterdayProgramRequests;

    return {
        totalStudents: { value: totalStudents, ...calculateTrend(totalStudents, yesterdayStudents) },
        totalCourses: { value: totalCourses, ...calculateTrend(totalCourses, yesterdayCourses) },
        totalEnrollments: { value: totalEnrollments, ...calculateTrend(totalEnrollments, yesterdayEnrollments) },
        pendingRequests: { value: pendingRequests, ...calculateTrend(currentTotalRequests, yesterdayTotalRequests) }
    };
};

/**
 * Lấy xu hướng đăng ký trong 7 ngày gần nhất
 */
const getEnrollmentTrends = async () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return d;
    });

    return await Promise.all(
        last7Days.map(async (date) => {
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const count = await prisma.enrollment.count({
                where: { 
                    enrolled_at: { gte: date, lt: nextDate },
                    course: { deleted_at: null }
                }
            });

            return {
                name: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                enrollments: count
            };
        })
    );
};

/**
 * Lấy danh sách 5 khóa học có nhiều học viên nhất
 */
const getTopCoursesByEnrollment = async () => {
    const topCoursesData = await prisma.enrollment.groupBy({
        where: { course: { deleted_at: null } },
        by: ['course_id'],
        _count: { course_id: true },
        orderBy: { _count: { course_id: 'desc' } },
        take: 10
    });

    const topCourses = (await Promise.all(
        topCoursesData.map(async (item) => {
            const course = await prisma.course.findFirst({
                where: { id: item.course_id, deleted_at: null },
                select: { title: true }
            });
            if (!course) return null;
            return {
                title: course.title,
                count: item._count.course_id
            };
        })
    )).filter(Boolean).slice(0, 5);

    return topCourses;
};

const getDashboardStats = async () => {
    try {
        const [overview, enrollmentTrends, topCourses] = await Promise.all([
            getOverviewStats(),
            getEnrollmentTrends(),
            getTopCoursesByEnrollment()
        ]);

        return { overview, enrollmentTrends, topCourses };
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

        const userIds = enrollments.map(e => e.user_id);

        // 3. Tối ưu: Lấy số lượng bài học đã hoàn thành của tất cả học viên trong 1 câu truy vấn
        const completionCounts = await prisma.lessonCompleted.groupBy({
            by: ['user_id'],
            where: {
                user_id: { in: userIds },
                lesson_id: { in: lessonIds }
            },
            _count: {
                lesson_id: true
            }
        });

        const completionMap = {};
        completionCounts.forEach(c => {
            completionMap[c.user_id] = c._count.lesson_id;
        });

        // 4. Tổng hợp dữ liệu
        const progressData = enrollments.map((e) => {
            const completedCount = completionMap[e.user_id] || 0;
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
        });


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
        const todayStr = getTodayStr();
        const today = new Date(todayStr); // Tạo object Date ở midnight UTC để Prisma lưu vào @db.Date

        // Upsert: Tìm xem đã có bản ghi cho ngày hôm nay/user/khóa học chưa
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
            const date = moment().subtract(days - 1 - i, 'days');
            const dateStr = date.format('YYYY-MM-DD');

            const sessionForDay = sessions.filter(s => getDBDateStr(s.date) === dateStr);
            const totalSeconds = sessionForDay.reduce((acc, s) => acc + s.duration, 0);
            const totalMinutes = Math.round(totalSeconds / 60);

            return {
                date: date.format('DD/MM'),
                fullDate: dateStr,
                minutes: totalMinutes,
                hasActivity: totalSeconds > 0
            };
        });

        return dailyData;
    } catch (error) {
        console.error('Error in getUserLearningStats:', error);
        throw error;
    }
};

/**
 * Tính toán chuỗi ngày học tập (Hiện tại & Kỷ lục)
 */
const calculateStreak = (allSessions) => {
    let currentStreak = 0;
    let longestStreak = 0;

    if (!allSessions || allSessions.length === 0) return { currentStreak, longestStreak };

    // Lấy danh sách các ngày đã học, sắp xếp từ mới nhất đến cũ nhất
    const sessionDates = Array.from(new Set(allSessions.map(s => getDBDateStr(s.date))))
        .sort((a, b) => b.localeCompare(a));

    if (sessionDates.length > 0) {
        const todayStr = getTodayStr();
        const yesterdayStr = moment().subtract(1, 'day').format('YYYY-MM-DD');

        // A. Tính chuỗi hiện tại (Current Streak)
        // Chỉ tính nếu ngày gần nhất là hôm nay hoặc hôm qua
        if (sessionDates[0] === todayStr || sessionDates[0] === yesterdayStr) {
            let streakCount = 1;
            for (let i = 0; i < sessionDates.length - 1; i++) {
                const d1 = moment(sessionDates[i]);
                const d2 = moment(sessionDates[i + 1]);
                if (d1.diff(d2, 'days') === 1) {
                    streakCount++;
                } else {
                    break;
                }
            }
            currentStreak = streakCount;
        }

        // B. Tính chuỗi kỷ lục (Longest Streak)
        let maxStreak = 1;
        let tempStreak = 1;
        for (let i = 0; i < sessionDates.length - 1; i++) {
            const d1 = moment(sessionDates[i]);
            const d2 = moment(sessionDates[i + 1]);
            if (d1.diff(d2, 'days') === 1) {
                tempStreak++;
            } else {
                maxStreak = Math.max(maxStreak, tempStreak);
                tempStreak = 1;
            }
        }
        longestStreak = Math.max(maxStreak, tempStreak);
    }

    return { currentStreak, longestStreak };
};

const getUserLearningSummary = async (userId) => {
    try {
        const id = parseInt(userId);

        const allSessions = await prisma.learningSession.findMany({
            where: { user_id: id },
            orderBy: { date: 'desc' }
        });

        console.log(`[DEBUG] getUserLearningSummary for userId: ${id}, found ${allSessions.length} sessions`);

        // 1. All time stats
        const totalSeconds = allSessions.reduce((acc, s) => acc + s.duration, 0);
        const totalHours = Math.floor(totalSeconds / 3600);
        const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
        const totalHoursDisplay = `${totalHours}h${totalMinutes}p`;

        // 2. Average per day (of active days)
        const activeDaysCount = new Set(allSessions.map(s => getDBDateStr(s.date))).size;
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

        // 4. Streak calculation
        const { currentStreak, longestStreak } = calculateStreak(allSessions);

        return {
            totalHoursDisplay,
            totalHours,
            avgHoursDisplay,
            avgHoursPerDay,
            peakDay,
            currentStreak,
            longestStreak
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
            const date = moment().subtract(days - 1 - i, 'days');
            const dateStr = date.format('YYYY-MM-DD');

            const sessionsForDay = sessions.filter(s => getDBDateStr(s.date) === dateStr);
            const totalSeconds = sessionsForDay.reduce((acc, s) => acc + s.duration, 0);
            const totalHours = parseFloat((totalSeconds / 3600).toFixed(1));

            return {
                name: date.format('DD/MM'),
                hours: totalHours
            };
        });

        return trendData;
    } catch (error) {
        console.error('Error in getGlobalLearningTrends:', error);
        throw error;
    }
};

const getTopLearners = async () => {
    try {
        const topSessions = await prisma.learningSession.groupBy({
            where: {
                user: {
                    user_roles: {
                        none: {
                            role: {
                                name: 'admin'
                            }
                        }
                    }
                }
            },
            by: ['user_id'],
            _sum: {
                duration: true
            },
            orderBy: {
                _sum: {
                    duration: 'desc'
                }
            },
            take: 5
        });

        const topUsers = await Promise.all(
            topSessions.map(async (item) => {
                const user = await prisma.user.findUnique({
                    where: { id: item.user_id },
                    select: { id: true, full_name: true, username: true, avatar: true }
                });
                return {
                    user: user ? (user.full_name || user.username) : 'Người dùng Ẩn',
                    avatar: user?.avatar,
                    totalSeconds: item._sum.duration
                };
            })
        );
        return topUsers;
    } catch (error) {
        console.error('Error in getTopLearners:', error);
        throw error;
    }
};

const searchStudentsProgress = async (searchTerm, courseId = null) => {
    try {
        const whereClause = {
            course: {
                deleted_at: null
            },
            ...(courseId && { course_id: parseInt(courseId) }),
            ...(searchTerm && {
                user: {
                    OR: [
                        { full_name: { contains: searchTerm, mode: 'insensitive' } },
                        { email: { contains: searchTerm, mode: 'insensitive' } },
                        { username: { contains: searchTerm, mode: 'insensitive' } }
                    ]
                }
            })
        };

        const enrollments = await prisma.enrollment.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        username: true,
                        avatar: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        category_id: true,
                        category: { select: { name: true } },
                        sections: {
                            select: {
                                lessons: { select: { id: true } }
                            }
                        }
                    }
                }
            }
        });

        // Lấy tất cả userIds và lessonIds cần kiểm tra để tối ưu hóa
        const userIds = enrollments.map(e => e.user_id);
        const allLessonIdsInvolved = [...new Set(enrollments.flatMap(e => e.course.sections.flatMap(s => s.lessons.map(l => l.id))))];

        // Lấy dữ liệu hoàn thành bài học trong 1 câu truy vấn
        const completionCounts = await prisma.lessonCompleted.groupBy({
            by: ['user_id', 'lesson_id'],
            where: {
                user_id: { in: userIds },
                lesson_id: { in: allLessonIdsInvolved }
            }
        });

        // Xây dựng map để truy xuất nhanh: completionMap[userId][lessonId] = true
        const completionMap = {};
        completionCounts.forEach(c => {
            if (!completionMap[c.user_id]) completionMap[c.user_id] = new Set();
            completionMap[c.user_id].add(c.lesson_id);
        });

        const progressData = enrollments.map((e) => {
            const lessonIds = e.course.sections.flatMap(s => s.lessons.map(l => l.id));
            const totalLessons = lessonIds.length;

            const completedCount = lessonIds.filter(id => completionMap[e.user_id]?.has(id)).length;
            const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

            return {
                id: e.user.id,
                fullName: e.user.full_name || e.user.username,
                email: e.user.email,
                avatar: e.user.avatar,
                completedLessons: completedCount,
                totalLessons: totalLessons,
                progressPercent: progressPercent,
                enrolledAt: e.enrolled_at,
                courseId: e.course.id,
                courseTitle: e.course.title,
                categoryId: e.course.category_id,
                categoryName: e.course.category?.name
            };
        });


        return progressData;
    } catch (error) {
        console.error('Error in searchStudentsProgress:', error);
        throw error;
    }
};

module.exports = {
    getDashboardStats,
    getStudentsProgressByCourse,
    searchStudentsProgress,
    emitPendingRequestsCountToAdmins,
    trackLearningTime,
    getUserLearningStats,
    getUserLearningSummary,
    getGlobalLearningTrends,
    getTopLearners
};
