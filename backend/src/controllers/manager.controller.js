const prisma = require('../configs/prisma');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

/**
 * Lấy thông tin phòng ban của Manager đăng nhập
 */
const getManagerDeptId = async (managerId) => {
    const manager = await prisma.user.findUnique({
        where: { id: managerId },
        select: { department_id: true }
    });
    if (!manager || !manager.department_id) {
        throw new ApiError(400, 'Tài khoản Quản lý chưa được cấu hình thuộc về một phòng ban nào');
    }
    return manager.department_id;
};

/**
 * 1. Xem nhân viên thuộc phòng ban mình
 */
exports.getEmployees = catchAsync(async (req, res) => {
    const managerDeptId = await getManagerDeptId(req.user.id);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const positionId = req.query.positionId !== 'undefined' && req.query.positionId ? parseInt(req.query.positionId) : undefined;
    const filterDeptId = req.query.departmentId !== 'undefined' && req.query.departmentId ? parseInt(req.query.departmentId) : undefined;
    const skip = (page - 1) * limit;

    const { getSubDepartmentIds } = require('../utils/departmentHierarchy');
    const allowedSubDeptIds = await getSubDepartmentIds(managerDeptId);

    let targetDeptIds = allowedSubDeptIds;
    if (filterDeptId) {
        if (!allowedSubDeptIds.includes(filterDeptId)) {
            throw new ApiError(403, 'Bạn không có quyền truy cập dữ liệu của bộ phận này');
        }
        targetDeptIds = await getSubDepartmentIds(filterDeptId);
    }

    const where = {
        department_id: { in: targetDeptIds },
        deleted_at: null,
        id: { not: req.user.id }, // Không lấy tài khoản của chính Manager
        user_roles: {
            some: {
                role: {
                    name: { in: ['student', 'Employee', 'employee'] }
                }
            }
        },
        ...(positionId && { position_id: positionId }),
        OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { full_name: { contains: search, mode: 'insensitive' } },
            { employee_id: { contains: search, mode: 'insensitive' } }
        ]
    };

    const [employees, total] = await Promise.all([
        prisma.user.findMany({
            where,
            include: {
                position: true,
                department: true,
                enrollments: {
                    where: { course: { deleted_at: null } }
                },
                completed_lessons: {
                    include: {
                        lesson: {
                            select: {
                                section: {
                                    select: { course_id: true }
                                }
                            }
                        }
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { full_name: 'asc' }
        }),
        prisma.user.count({ where })
    ]);

    const formattedEmployees = employees.map(emp => {
        const totalCourses = emp.enrollments.length;
        return {
            id: emp.id,
            username: emp.username,
            email: emp.email,
            full_name: emp.full_name,
            avatar: emp.avatar,
            employee_id: emp.employee_id,
            join_date: emp.join_date,
            position: emp.position?.name || 'Chưa thiết lập',
            department: emp.department?.name || '',
            total_courses: totalCourses
        };
    });

    res.json({
        employees: formattedEmployees,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    });
});

/**
 * 2. Xem danh sách khóa học và tiến độ học tập chi tiết của từng nhân viên
 */
exports.getEmployeeProgress = catchAsync(async (req, res) => {
    const managerDeptId = await getManagerDeptId(req.user.id);
    const employeeId = parseInt(req.params.id);

    // 1. Fetch employee details and verify department
    const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        include: {
            department: true,
            position: true,
            enrollments: {
                where: { course: { deleted_at: null } },
                include: {
                    course: {
                        include: {
                            sections: {
                                include: {
                                    lessons: true
                                }
                            }
                        }
                    }
                }
            },
            completed_lessons: {
                include: {
                    lesson: true
                }
            }
        }
    });

    if (!employee || employee.deleted_at) {
        throw new ApiError(404, 'Không tìm thấy thông tin nhân viên');
    }

    // Security Guard Clause: Chỉ được xem nhân viên cùng phòng ban mình hoặc các phòng con
    const { getSubDepartmentIds } = require('../utils/departmentHierarchy');
    const subDeptIds = await getSubDepartmentIds(managerDeptId);
    if (!employee.department_id || !subDeptIds.includes(employee.department_id)) {
        throw new ApiError(403, 'Bạn không có quyền xem thông tin của nhân sự thuộc phòng ban khác');
    }

    // 2. Calculate progress for each course
    const courseProgress = employee.enrollments.map(enroll => {
        const course = enroll.course;
        const allLessons = course.sections.flatMap(s => s.lessons);
        const totalLessons = allLessons.length;
        
        // Find completed lessons in this specific course
        const completedLessonsInCourse = employee.completed_lessons.filter(cl => cl.lesson.section_id && allLessons.some(l => l.id === cl.lesson_id));
        const completedCount = completedLessonsInCourse.length;
        const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        // Check if mandatory and overdue
        let isOverdue = false;
        let deadlineDate = null;
        if (course.is_mandatory && course.mandatory_deadline_days && employee.join_date) {
            const joinDate = new Date(employee.join_date);
            deadlineDate = new Date(joinDate.getTime() + (course.mandatory_deadline_days * 24 * 60 * 60 * 1000));
            if (progressPercent < 100 && new Date() > deadlineDate) {
                isOverdue = true;
            }
        }

        return {
            course_id: course.id,
            title: course.title,
            thumbnail: course.thumbnail,
            level: course.level,
            is_mandatory: course.is_mandatory,
            progress: progressPercent,
            completed_count: completedCount,
            total_lessons: totalLessons,
            enrolled_at: enroll.enrolled_at,
            deadline_date: deadlineDate,
            is_overdue: isOverdue
        };
    });

    res.json({
        employee: {
            id: employee.id,
            full_name: employee.full_name,
            avatar: employee.avatar,
            employee_id: employee.employee_id,
            email: employee.email,
            join_date: employee.join_date,
            department: employee.department?.name || '',
            position: employee.position?.name || ''
        },
        courses: courseProgress
    });
});

/**
 * 3. Xem báo cáo nhân sự phòng mình không học (Báo cáo Inactive)
 */
exports.getInactiveEmployees = catchAsync(async (req, res) => {
    const managerDeptId = await getManagerDeptId(req.user.id);
    const days = parseInt(req.query.days) || 7; // Mặc định là 7 ngày qua
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { getSubDepartmentIds } = require('../utils/departmentHierarchy');
    const subDeptIds = await getSubDepartmentIds(managerDeptId);

    // 1. Get all employees in department
    const employees = await prisma.user.findMany({
        where: {
            department_id: { in: subDeptIds },
            deleted_at: null,
            id: { not: req.user.id },
            user_roles: { some: { role: { name: 'student' } } }
        },
        include: {
            position: true,
            learning_sessions: {
                where: {
                    date: { gte: startDate }
                }
            },
            enrollments: {
                where: { course: { deleted_at: null, is_mandatory: true } }
            },
            completed_lessons: true
        }
    });

    // 2. Filter inactive employees: 
    // - 0 completed lessons total
    // - OR 0 learning session duration in selected days
    const inactiveEmployees = employees.map(emp => {
        const totalDuration = emp.learning_sessions.reduce((sum, session) => sum + session.duration, 0);
        const totalCompletedLessons = emp.completed_lessons.length;
        const totalMandatoryCourses = emp.enrollments.length;

        // Is inactive if learning time is 0 in the period
        const isInactive = totalDuration === 0;

        return {
            id: emp.id,
            full_name: emp.full_name,
            employee_id: emp.employee_id,
            avatar: emp.avatar,
            position: emp.position?.name || 'Chưa thiết lập',
            total_duration_minutes: Math.round(totalDuration / 60),
            total_completed_lessons: totalCompletedLessons,
            total_mandatory_courses: totalMandatoryCourses,
            is_inactive: isInactive
        };
    }).filter(emp => emp.is_inactive);

    res.json({
        days,
        total_inactive: inactiveEmployees.length,
        employees: inactiveEmployees
    });
});

/**
 * 4. Gửi nhắc nhở học tập trực tiếp cho nhân viên
 */
exports.sendReminder = catchAsync(async (req, res) => {
    const managerDeptId = await getManagerDeptId(req.user.id);
    const employeeId = parseInt(req.body.employeeId);
    const messageContent = req.body.message || 'Quản lý nhắc nhở bạn tập trung hoàn thành các khóa học bắt buộc đúng hạn.';

    const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { id: true, department_id: true, full_name: true }
    });

    if (!employee) {
        throw new ApiError(404, 'Không tìm thấy nhân viên');
    }

    // Security Guard Clause
    const { getSubDepartmentIds } = require('../utils/departmentHierarchy');
    const subDeptIds = await getSubDepartmentIds(managerDeptId);
    if (!employee.department_id || !subDeptIds.includes(employee.department_id)) {
        throw new ApiError(403, 'Bạn không thể gửi nhắc nhở học tập cho nhân sự phòng ban khác');
    }

    // Tạo thông báo trong Database cho nhân viên
    const notification = await prisma.notification.create({
        data: {
            user_id: employee.id,
            title: 'Nhắc nhở học tập từ Quản lý',
            message: messageContent,
            type: 'MANAGER_REMINDER',
            link: '/my-courses'
        }
    });

    // Phát sự kiện Socket real-time (nếu socket.io được tích hợp ở app.js, 
    // ở đây ta có thể dùng socket global hoặc thông qua event emitter)
    try {
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${employee.id}`).emit('notification', {
                id: notification.id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                created_at: notification.created_at
            });
        }
    } catch (err) {
        console.error('Lỗi khi gửi Socket reminder:', err);
    }

    res.json({
        message: `Đã gửi nhắc nhở học tập thành công cho nhân viên ${employee.full_name}`
    });
});
