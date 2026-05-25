const prisma = require('../../configs/prisma');
const moment = require('moment');

const getLearningReportData = async ({ groupBy = 'day', period = 'last_7_days', startDate, endDate, departmentId = null, courseId = null }) => {
    try {
        let start, end;

        if (period === 'last_7_days') {
            start = moment().subtract(6, 'days').startOf('day');
            end = moment().endOf('day');
        } else if (period === 'last_30_days') {
            start = moment().subtract(29, 'days').startOf('day');
            end = moment().endOf('day');
        } else if (period === 'this_month') {
            start = moment().startOf('month');
            end = moment().endOf('day');
        } else if (period === 'last_month') {
            start = moment().subtract(1, 'month').startOf('month');
            end = moment().subtract(1, 'month').endOf('month');
        } else if (period === 'last_3_months') {
            start = moment().subtract(3, 'months').startOf('day');
            end = moment().endOf('day');
        } else if (period === 'custom' && startDate && endDate) {
            start = moment(startDate).startOf('day');
            end = moment(endDate).endOf('day');
        } else {
            start = moment().subtract(6, 'days').startOf('day');
            end = moment().endOf('day');
        }

        const startJS = start.toDate();
        const endJS = end.toDate();

        const deptId = departmentId ? parseInt(departmentId) : null;
        const crseId = courseId ? parseInt(courseId) : null;

        // Lấy tất cả ID phòng ban con cháu (bao gồm chính nó) để lọc theo cây
        const { getSubDepartmentIds } = require('../../../utils/departmentHierarchy');
        const deptIds = deptId ? await getSubDepartmentIds(deptId) : null;

        // Lấy danh sách ID của các khóa học chưa bị xóa để lọc
        const activeCourses = await prisma.course.findMany({
            where: { deleted_at: null },
            select: { id: true }
        });
        const activeCourseIds = activeCourses.map(c => c.id);

        // Tìm danh sách user có hoàn thành ít nhất 1 bài học trong khoảng thời gian này
        const recentCompletions = await prisma.lessonCompleted.findMany({
            where: {
                completed_at: { gte: startJS, lte: endJS },
                lesson: {
                    section: {
                        course: { deleted_at: null },
                        ...(crseId && { course_id: crseId })
                    }
                },
                ...(deptIds && { user: { department_id: { in: deptIds } } }),
                user: { deleted_at: null }
            },
            select: { user_id: true }
        });
        const activeUserIds = [...new Set(recentCompletions.map(c => c.user_id))];

        const [sessions, enrollments, allCompletedLessons] = await Promise.all([
            prisma.learningSession.findMany({
                where: {
                    date: { gte: startJS, lte: endJS },
                    ...(crseId ? { course_id: crseId } : {
                        OR: [
                            { course_id: null },
                            { course_id: { in: activeCourseIds } }
                        ]
                    }),
                    ...(deptIds && { user: { department_id: { in: deptIds } } }),
                    user: { deleted_at: null }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            full_name: true,
                            username: true,
                            employee_id: true,
                            department: { select: { name: true } }
                        }
                    }
                }
            }),
            prisma.enrollment.findMany({
                where: {
                    enrolled_at: { gte: startJS, lte: endJS },
                    course: { deleted_at: null },
                    ...(crseId && { course_id: crseId }),
                    ...(deptIds && { user: { department_id: { in: deptIds } } }),
                    user: { deleted_at: null }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            full_name: true,
                            username: true,
                            employee_id: true,
                            department: { select: { name: true } }
                        }
                    }
                }
            }),
            activeUserIds.length > 0 ? prisma.lessonCompleted.findMany({
                where: {
                    user_id: { in: activeUserIds },
                    lesson: {
                        section: {
                            course: { deleted_at: null },
                            ...(crseId && { course_id: crseId })
                        }
                    },
                    ...(deptIds && { user: { department_id: { in: deptIds } } }),
                    user: { deleted_at: null }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            full_name: true,
                            username: true,
                            employee_id: true,
                            department: { select: { name: true } }
                        }
                    }
                }
            }) : Promise.resolve([])
        ]);

        // Get courses and their lesson list
        const coursesWithLessons = await prisma.course.findMany({
            where: {
                deleted_at: null,
                ...(crseId && { id: crseId })
            },
            select: {
                id: true,
                sections: {
                    select: {
                        lessons: {
                            select: { id: true }
                        }
                    }
                }
            }
        });

        const courseLessonsMap = {};
        coursesWithLessons.forEach(c => {
            const lessonIds = [];
            c.sections.forEach(s => {
                s.lessons.forEach(l => {
                    lessonIds.push(l.id);
                });
            });
            courseLessonsMap[c.id] = lessonIds;
        });

        // Group completed lessons by user
        const userCompletions = {};
        allCompletedLessons.forEach(cl => {
            if (!cl.user) return;
            const uId = cl.user_id;
            if (!userCompletions[uId]) {
                userCompletions[uId] = {
                    user: cl.user,
                    completedLessons: new Set(),
                    completedDates: {}
                };
            }
            userCompletions[uId].completedLessons.add(cl.lesson_id);
            userCompletions[uId].completedDates[cl.lesson_id] = cl.completed_at;
        });

        // Find completed courses for each user
        const completedCourses = [];
        Object.entries(userCompletions).forEach(([uIdStr, data]) => {
            const userId = parseInt(uIdStr);
            Object.entries(courseLessonsMap).forEach(([courseIdStr, lessonIds]) => {
                const courseId = parseInt(courseIdStr);
                if (lessonIds.length === 0) return; // ignore courses with no lessons

                const hasCompletedAll = lessonIds.every(lid => data.completedLessons.has(lid));
                if (hasCompletedAll) {
                    // Find completion date
                    let maxDate = null;
                    lessonIds.forEach(lid => {
                        const date = data.completedDates[lid];
                        if (!maxDate || date > maxDate) {
                            maxDate = date;
                        }
                    });

                    completedCourses.push({
                        user: data.user,
                        user_id: userId,
                        course_id: courseId,
                        completed_at: maxDate
                    });
                }
            });
        });

        // Filter course completions in target period
        const periodCompletions = completedCourses.filter(cc => {
            const cDate = cc.completed_at;
            return cDate >= startJS && cDate <= endJS;
        });

        const chartBuckets = [];
        let current = moment(start);

        if (groupBy === 'day') {
            while (current.isSameOrBefore(end, 'day')) {
                chartBuckets.push({
                    key: current.format('YYYY-MM-DD'),
                    label: current.format('DD/MM'),
                    hours: 0,
                    enrollments: 0,
                    completions: 0
                });
                current.add(1, 'day');
            }
        } else if (groupBy === 'week') {
            while (current.isSameOrBefore(end, 'week')) {
                const weekStart = moment(current).startOf('week');
                const weekEnd = moment(current).endOf('week');
                chartBuckets.push({
                    key: weekStart.format('YYYY-[W]WW'),
                    label: `Tuần ${weekStart.format('WW')} (${weekStart.format('DD/MM')} - ${weekEnd.format('DD/MM')})`,
                    hours: 0,
                    enrollments: 0,
                    completions: 0,
                    start: weekStart.toDate(),
                    end: weekEnd.toDate()
                });
                current.add(1, 'week');
            }
        } else if (groupBy === 'month') {
            while (current.isSameOrBefore(end, 'month')) {
                chartBuckets.push({
                    key: current.format('YYYY-MM'),
                    label: `Tháng ${current.format('MM/YYYY')}`,
                    hours: 0,
                    enrollments: 0,
                    completions: 0,
                    start: moment(current).startOf('month').toDate(),
                    end: moment(current).endOf('month').toDate()
                });
                current.add(1, 'month');
            }
        }

        sessions.forEach(s => {
            const sDate = moment(s.date);
            let bucket = null;

            if (groupBy === 'day') {
                const dateStr = sDate.format('YYYY-MM-DD');
                bucket = chartBuckets.find(b => b.key === dateStr);
            } else if (groupBy === 'week') {
                const weekStr = sDate.format('YYYY-[W]WW');
                bucket = chartBuckets.find(b => b.key === weekStr);
            } else if (groupBy === 'month') {
                const monthStr = sDate.format('YYYY-MM');
                bucket = chartBuckets.find(b => b.key === monthStr);
            }

            if (bucket) {
                bucket.hours += s.duration / 3600;
            }
        });

        enrollments.forEach(e => {
            const eDate = moment(e.enrolled_at);
            let bucket = null;

            if (groupBy === 'day') {
                const dateStr = eDate.format('YYYY-MM-DD');
                bucket = chartBuckets.find(b => b.key === dateStr);
            } else if (groupBy === 'week') {
                const weekStr = eDate.format('YYYY-[W]WW');
                bucket = chartBuckets.find(b => b.key === weekStr);
            } else if (groupBy === 'month') {
                const monthStr = eDate.format('YYYY-MM');
                bucket = chartBuckets.find(b => b.key === monthStr);
            }

            if (bucket) {
                bucket.enrollments += 1;
            }
        });

        periodCompletions.forEach(c => {
            const cDate = moment(c.completed_at);
            let bucket = null;

            if (groupBy === 'day') {
                const dateStr = cDate.format('YYYY-MM-DD');
                bucket = chartBuckets.find(b => b.key === dateStr);
            } else if (groupBy === 'week') {
                const weekStr = cDate.format('YYYY-[W]WW');
                bucket = chartBuckets.find(b => b.key === weekStr);
            } else if (groupBy === 'month') {
                const monthStr = cDate.format('YYYY-MM');
                bucket = chartBuckets.find(b => b.key === monthStr);
            }

            if (bucket) {
                bucket.completions += 1;
            }
        });

        chartBuckets.forEach(b => {
            b.hours = parseFloat(b.hours.toFixed(2));
            delete b.start;
            delete b.end;
        });

        const userMap = {};
        const getOrInitUser = (u) => {
            if (!userMap[u.id]) {
                userMap[u.id] = {
                    userId: u.id,
                    fullName: u.full_name || u.username,
                    employeeId: u.employee_id || 'Chưa có',
                    departmentName: u.department?.name || 'Chưa phân phòng',
                    learningHours: 0,
                    enrollments: 0,
                    completions: 0
                };
            }
            return userMap[u.id];
        };

        sessions.forEach(s => {
            if (s.user) {
                const uData = getOrInitUser(s.user);
                uData.learningHours += s.duration / 3600;
            }
        });

        enrollments.forEach(e => {
            if (e.user) {
                const uData = getOrInitUser(e.user);
                uData.enrollments += 1;
            }
        });

        periodCompletions.forEach(c => {
            if (c.user) {
                const uData = getOrInitUser(c.user);
                uData.completions += 1;
            }
        });

        const tableData = Object.values(userMap).map((u) => {
            u.learningHours = parseFloat(u.learningHours.toFixed(2));
            return u;
        });

        const totalDurationSeconds = sessions.reduce((acc, s) => acc + s.duration, 0);
        const totalHours = parseFloat((totalDurationSeconds / 3600).toFixed(2));
        const totalEnrollments = enrollments.length;
        const totalCompletions = periodCompletions.length;

        return {
            summary: {
                totalHours,
                totalEnrollments,
                totalCompletions
            },
            chartData: chartBuckets,
            tableData
        };
    } catch (error) {
        console.error('Error in getLearningReportData:', error);
        throw error;
    }
};


module.exports = {
    getLearningReportData
};
