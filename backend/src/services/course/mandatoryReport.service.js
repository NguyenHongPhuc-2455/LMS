const prisma = require('../../configs/prisma');
const { isUserInScope } = require('../../utils/scope');

const isUserInCourseScope = (userData, course, isEnrolled = false, departmentMap = null) => {
    return isUserInScope(userData, course, isEnrolled, departmentMap);
};

const getMandatoryOverdueReport = async (type = 'overdue', departmentId = null, timeframe = 'all') => {
    const moment = require('moment');

    const isDateInTimeframe = (date, timeframe) => {
        if (!date) return false;
        if (timeframe === 'all') return true;

        const mDate = moment(date);
        const now = moment();

        if (timeframe === 'day') {
            return mDate.isSame(now, 'day');
        }
        if (timeframe === 'week') {
            return mDate.isSame(now, 'week');
        }
        if (timeframe === 'month') {
            return mDate.isSame(now, 'month');
        }
        return true;
    };

    // 1. Lấy tất cả khóa học bắt buộc
    const mandatoryCourses = await prisma.course.findMany({
        where: { is_mandatory: true, deleted_at: null },
        select: {
            id: true, title: true, is_mandatory: true, mandatory_at: true, created_at: true,
            mandatory_deadline_days: true, mandatory_start_date: true, mandatory_end_date: true,
            allow_early_access: true, apply_scope: true, mandatory_targets: true
        }
    });

    if (mandatoryCourses.length === 0) return [];

    let deptIds = null;
    if (departmentId) {
        deptIds = await require('../../utils/departmentHierarchy').getSubDepartmentIds(parseInt(departmentId));
    }

    // 2. Lấy tất cả user (lọc theo phòng ban nếu là Manager)
    const users = await prisma.user.findMany({
        where: {
            deleted_at: null,
            ...(deptIds && { department_id: { in: deptIds } })
        },
        select: {
            id: true, full_name: true, email: true, phone: true,
            employee_id: true, join_date: true, created_at: true, department_id: true,
            position_id: true, department: { select: { name: true } },
            user_roles: {
                include: { role: true }
            }
        }
    });

    const filteredUsers = users.filter(u => {
        const roles = (u.user_roles || []).map(ur => ur.role.name.toLowerCase());
        return !roles.includes('admin');
    });

    const { calculateCourseStatus } = require('../../utils/courseStatus');
    const resultList = [];
    const today = new Date();

    const depts = await prisma.department.findMany({ select: { id: true, parent_id: true } });
    const departmentMap = new Map(depts.map(d => [d.id, d.parent_id]));

    for (const user of filteredUsers) {
        const userCourses = [];


        const enrollments = await prisma.enrollment.findMany({
            where: { user_id: user.id, course_id: { in: mandatoryCourses.map(c => c.id) } },
            select: { course_id: true, enrolled_at: true }
        });
        const enrollmentMap = {};
        enrollments.forEach(e => { enrollmentMap[e.course_id] = e.enrolled_at; });

        for (const course of mandatoryCourses) {
            const isEnrolled = !!enrollmentMap[course.id];
            if (!isUserInCourseScope(user, course, isEnrolled, departmentMap)) continue;

            // Kiểm tra tiến độ thực tế trước
            const lessons = await prisma.lesson.findMany({
                where: { section: { course_id: course.id } },
                select: { id: true }
            });
            const lessonIds = lessons.map(l => l.id);

            let isCompleted = false;
            let progress = 0;
            if (lessonIds.length > 0) {
                const completedCount = await prisma.lessonCompleted.count({
                    where: { user_id: user.id, lesson_id: { in: lessonIds } }
                });
                isCompleted = completedCount === lessonIds.length;
                progress = Math.round((completedCount / lessonIds.length) * 100);
            }

            const statusInfo = calculateCourseStatus(course, user, progress, enrollmentMap[course.id]);

            // Phân loại dựa trên trạng thái thời hạn thực tế
            const isOverdue = statusInfo.isOverdue;
            const isOnTime = !statusInfo.isOverdue;

            if (type === 'overdue' && isOverdue) {
                // Filter by timeframe
                if (timeframe !== 'all' && !isDateInTimeframe(statusInfo.deadlineDate, timeframe)) {
                    continue;
                }
                userCourses.push({
                    courseId: course.id,
                    courseTitle: course.title,
                    daysOverdue: Math.abs(statusInfo.remainingDays),
                    progress
                });
            } else if (type === 'ontime' && isOnTime) {
                let completionDate = null;
                if (isCompleted && lessonIds.length > 0) {
                    const lastCompleted = await prisma.lessonCompleted.findFirst({
                        where: { user_id: user.id, lesson_id: { in: lessonIds } },
                        orderBy: { completed_at: 'desc' },
                        select: { completed_at: true }
                    });
                    completionDate = lastCompleted?.completed_at || null;
                }

                // Filter by timeframe
                if (timeframe !== 'all') {
                    const dateToCheck = isCompleted ? completionDate : statusInfo.deadlineDate;
                    if (!dateToCheck || !isDateInTimeframe(dateToCheck, timeframe)) {
                        continue;
                    }
                }

                userCourses.push({
                    courseId: course.id,
                    courseTitle: course.title,
                    isCompleted,
                    progress,
                    remainingDays: statusInfo.remainingDays
                });
            }
        }

        if (userCourses.length > 0) {
            resultList.push({
                userId: user.id,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                employeeId: user.employee_id,
                department: user.department?.name,
                joinDate: user.join_date,
                courses: userCourses
            });
        }
    }

    return resultList;
};

module.exports = {
    getMandatoryOverdueReport
};
