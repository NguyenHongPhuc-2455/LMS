const prisma = require('../configs/prisma');

const moment = require('moment');
const { getLearningReportData } = require('./stats/learningReport.service');
const { getStudentsProgressByCourse, searchStudentsProgress } = require('./stats/progress.service');

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
/**
 * Lấy số liệu tổng quan (Sinh viên, Khóa học, Đăng ký, Yêu cầu chờ)
 */
const getOverviewStats = async (departmentId = null) => {
    const yesterday = moment().subtract(1, 'day').endOf('day').toDate();

    if (departmentId) {
        const deptId = parseInt(departmentId);
        const deptIds = await require('../utils/departmentHierarchy').getSubDepartmentIds(deptId);

        // 1. Tổng nhân sự thuộc phòng ban (bao gồm phòng ban con)
        const totalStudents = await prisma.user.count({ 
            where: { department_id: { in: deptIds }, deleted_at: null } 
        });
        const yesterdayStudents = await prisma.user.count({ 
            where: { department_id: { in: deptIds }, created_at: { lte: yesterday }, deleted_at: null } 
        });

        // 2. Tổng khóa học đang học (các khóa học có ít nhất 1 học viên phòng ban này đăng ký)
        const enrolledCoursesCount = await prisma.enrollment.groupBy({
            by: ['course_id'],
            where: {
                user: { department_id: { in: deptIds } },
                course: { deleted_at: null }
            }
        });
        const totalCourses = enrolledCoursesCount.length;

        const yesterdayEnrolledCoursesCount = await prisma.enrollment.groupBy({
            by: ['course_id'],
            where: {
                user: { department_id: { in: deptIds } },
                course: { deleted_at: null },
                enrolled_at: { lte: yesterday }
            }
        });
        const yesterdayCourses = yesterdayEnrolledCoursesCount.length;

        // 3. Tổng lượt tham gia phòng ban
        const totalEnrollments = await prisma.enrollment.count({
            where: {
                user: { department_id: { in: deptIds } },
                course: { deleted_at: null }
            }
        });
        const yesterdayEnrollments = await prisma.enrollment.count({
            where: {
                enrolled_at: { lte: yesterday },
                user: { department_id: { in: deptIds } },
                course: { deleted_at: null }
            }
        });

        // 4. Các yêu cầu đang chờ xử lý của nhân viên thuộc phòng ban
        const [
            coursePending, programPending,
            yesterdayCourseRequests, yesterdayProgramRequests,
            currentCourseRequests, currentProgramRequests
        ] = await Promise.all([
            prisma.courseRequest.count({ where: { user: { department_id: { in: deptIds } }, status: 'PENDING' } }),
            prisma.programRequest.count({ where: { user: { department_id: { in: deptIds } }, status: 'PENDING' } }),
            prisma.courseRequest.count({ where: { user: { department_id: { in: deptIds } }, created_at: { lte: yesterday } } }),
            prisma.programRequest.count({ where: { user: { department_id: { in: deptIds } }, created_at: { lte: yesterday } } }),
            prisma.courseRequest.count({ where: { user: { department_id: { in: deptIds } } } }),
            prisma.programRequest.count({ where: { user: { department_id: { in: deptIds } } } })
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
    }

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
const getEnrollmentTrends = async (departmentId = null) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return d;
    });

    let deptIds = null;
    if (departmentId) {
        deptIds = await require('../utils/departmentHierarchy').getSubDepartmentIds(parseInt(departmentId));
    }

    return await Promise.all(
        last7Days.map(async (date) => {
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const count = await prisma.enrollment.count({
                where: { 
                    enrolled_at: { gte: date, lt: nextDate },
                    course: { deleted_at: null },
                    ...(deptIds && {
                        user: { department_id: { in: deptIds } }
                    })
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
const getTopCoursesByEnrollment = async (departmentId = null) => {
    let deptIds = null;
    if (departmentId) {
        deptIds = await require('../utils/departmentHierarchy').getSubDepartmentIds(parseInt(departmentId));
    }

    const topCoursesData = await prisma.enrollment.groupBy({
        where: { 
            course: { deleted_at: null },
            ...(deptIds && {
                user: { department_id: { in: deptIds } }
            })
        },
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

const getDashboardStats = async (departmentId = null) => {
    try {
        const redisClient = require('../utils/redisClient');
        
        const cacheKey = `stats:dashboard:${departmentId || 'global'}`;
        
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        const [overview, enrollmentTrends, topCourses] = await Promise.all([
            getOverviewStats(departmentId),
            getEnrollmentTrends(departmentId),
            getTopCoursesByEnrollment(departmentId)
        ]);

        const result = { overview, enrollmentTrends, topCourses };
        
        await redisClient.setex(cacheKey, 300, JSON.stringify(result));

        return result;
    } catch (error) {
        console.error('Error in stats service:', error);
        throw error;
    }
};

const getPendingRequestsCount = async (departmentId = null) => {
    try {
        if (departmentId) {
            const deptId = parseInt(departmentId);
            const [coursePending, programPending] = await Promise.all([
                prisma.courseRequest.count({ where: { user: { department_id: deptId }, status: 'PENDING' } }),
                prisma.programRequest.count({ where: { user: { department_id: deptId }, status: 'PENDING' } })
            ]);
            return coursePending + programPending;
        }

        const [coursePending, programPending] = await Promise.all([
            prisma.courseRequest.count({ where: { status: 'PENDING' } }),
            prisma.programRequest.count({ where: { status: 'PENDING' } })
        ]);
        return coursePending + programPending;
    } catch (error) {
        console.error('Error in getPendingRequestsCount service:', error);
        throw error;
    }
};



const emitPendingRequestsCountToAdmins = async (departmentId = null) => {
    try {
        const socketUtils = require('../utils/socket');
        
        // 1. Gửi cho Admins (số lượng toàn hệ thống)
        const coursePendingGlobal = await prisma.courseRequest.count({
            where: { status: 'PENDING' }
        });
        const programPendingGlobal = await prisma.programRequest.count({
            where: { status: 'PENDING' }
        });
        const totalGlobal = coursePendingGlobal + programPendingGlobal;
        await socketUtils.emitToAdmins('updatePendingRequestCount', { count: totalGlobal });

        // 2. Gửi cho các Managers thuộc phòng ban liên quan (nếu có departmentId)
        if (departmentId) {
            const deptId = parseInt(departmentId);
            const coursePendingDept = await prisma.courseRequest.count({
                where: { user: { department_id: deptId }, status: 'PENDING' }
            });
            const programPendingDept = await prisma.programRequest.count({
                where: { user: { department_id: deptId }, status: 'PENDING' }
            });
            const totalDept = coursePendingDept + programPendingDept;

            // Tìm các managers của phòng ban này
            const managers = await prisma.user.findMany({
                where: {
                    department_id: deptId,
                    user_roles: {
                        some: {
                            role: {
                                name: 'manager'
                            }
                        }
                    }
                },
                select: { id: true }
            });

            // Phát sự kiện tới từng manager đang online
            managers.forEach(manager => {
                socketUtils.emitToUser(manager.id, 'updatePendingRequestCount', { count: totalDept });
            });
        }
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


module.exports = {
    getDashboardStats,
    getPendingRequestsCount,
    getStudentsProgressByCourse,
    searchStudentsProgress,
    emitPendingRequestsCountToAdmins,
    trackLearningTime,
    getUserLearningStats,
    getUserLearningSummary,
    getGlobalLearningTrends,
    getTopLearners,
    getLearningReportData
};
