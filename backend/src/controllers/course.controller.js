const prisma = require('../configs/prisma');
const courseService = require('../services/course.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { generateStreamToken } = require('../utils/streamToken');
const { createVideoToken } = require('../utils/crypto');
const { lessonSelect } = require('../services/video.service');

exports.getCourses = catchAsync(async (req, res) => {
    const { search, categoryId } = req.query;
    const courses = await courseService.getAllCourses(search, categoryId);
    res.json(courses);
});

exports.getCourseDetail = catchAsync(async (req, res) => {
    const { id } = req.params;
    const course = await courseService.getEnrichedCourseDetail(id, req.user, req.ip);
    res.json(course);
});


exports.createCourse = catchAsync(async (req, res) => {
    const { title, description, category_id, level, thumbnail, intro_video_url, learning_outcomes, requirements, is_private, is_mandatory, mandatory_deadline_days } = req.body;
    const course = await courseService.createCourse({
        title,
        description,
        is_private: is_private === true || is_private === 'true',
        is_mandatory: is_mandatory === true || is_mandatory === 'true',
        mandatory_deadline_days: mandatory_deadline_days ? parseInt(mandatory_deadline_days) : 60,
        category_id: category_id ? parseInt(category_id) : null,
        instructor_id: req.user.id,
        level,
        thumbnail,
        intro_video_url,
        learning_outcomes,
        requirements
    });
    res.status(201).json(course);
});

exports.updateCourse = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { title, description, category_id, level, thumbnail, intro_video_url, learning_outcomes, requirements, is_private, is_mandatory, mandatory_deadline_days } = req.body;
    const course = await prisma.course.update({
        where: { id: parseInt(id) },
        data: {
            title,
            description,
            is_private: is_private !== undefined ? (is_private === true || is_private === 'true') : undefined,
            is_mandatory: is_mandatory !== undefined ? (is_mandatory === true || is_mandatory === 'true') : undefined,
            mandatory_deadline_days: mandatory_deadline_days !== undefined ? parseInt(mandatory_deadline_days) : undefined,
            category_id: category_id ? parseInt(category_id) : undefined,
            level,
            thumbnail,
            intro_video_url,
            learning_outcomes,
            requirements,
            updated_at: new Date()
        }
    });
    res.json(course);
});

exports.deleteCourse = catchAsync(async (req, res) => {
    const { id } = req.params;
    await courseService.softDeleteCourse(id);
    res.json({ message: 'Đã xóa khóa học và toàn bộ nội dung liên quan' });
});


exports.createSection = catchAsync(async (req, res) => {
    const { course_id, title, order } = req.body;

    // Nếu không có order, tự động lấy số lượng hiện tại + 1 để đẩy xuống cuối
    let finalOrder = parseInt(order);
    if (isNaN(finalOrder)) {
        const count = await prisma.section.count({
            where: { course_id: parseInt(course_id) }
        });
        finalOrder = count + 1;
    }

    const section = await prisma.section.create({
        data: {
            title,
            course_id: parseInt(course_id),
            order: finalOrder
        }
    });
    res.status(201).json(section);
});

exports.deleteSection = catchAsync(async (req, res) => {
    const { id } = req.params;
    await courseService.deleteSection(id);
    res.json({ message: 'Đã xóa chương và toàn bộ bài học liên quan' });
});


exports.updateSection = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { title, order } = req.body;
    const section = await prisma.section.update({
        where: { id: parseInt(id) },
        data: {
            title,
            order: order !== undefined ? parseInt(order) : undefined
        }
    });
    res.json(section);
});

exports.getSectionDetail = catchAsync(async (req, res) => {
    const { id } = req.params;
    const section = await prisma.section.findUnique({
        where: { id: parseInt(id) },
        include: {
            lessons: {
                select: lessonSelect,
                orderBy: [
                    { order: 'asc' },
                    { id: 'asc' }
                ]
            }
        }
    });

    if (!section) throw new ApiError(404, 'Không tìm thấy chương học');

    const userId = req.user.id;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('instructor');

    // Secure URLs
    section.lessons = section.lessons.map(l => {
        let securedVideoUrl = l.video_url;
        if (securedVideoUrl && (l.is_free || isAdmin)) {
            if (securedVideoUrl.startsWith('/public/hls/')) {
                const token = generateStreamToken(userId, l.id, req.ip);
                const fileName = securedVideoUrl.split('/').pop() || 'master.m3u8';
                securedVideoUrl = `/api/videos/stream/${token}/${fileName}`;
            } else if (securedVideoUrl.includes('cloudinary.com') || securedVideoUrl.startsWith('http')) {
                const encryptedUrl = createVideoToken(securedVideoUrl, req.ip);
                securedVideoUrl = `/api/videos/secure-stream/${encodeURIComponent(encryptedUrl)}`;
            }
        }
        return { ...l, video_url: securedVideoUrl };
    });

    res.json(section);
});

exports.getMyCourses = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const enrollments = await prisma.enrollment.findMany({
        where: {
            user_id: userId,
            course: {
                deleted_at: null
            }
        },
        include: {
            course: {
                include: {
                    instructor: {
                        select: { full_name: true }
                    },
                    sections: {
                        orderBy: { order: 'asc' },
                        include: {
                            lessons: {
                                select: { id: true, order: true },
                                orderBy: [
                                    { order: 'asc' },
                                    { id: 'asc' }
                                ]
                            }
                        }
                    }
                }
            }
        }
    });

    // Thu thập toàn bộ lesson IDs từ các khóa học đã ghi danh
    const allLessonIds = enrollments.flatMap(e =>
        e.course.sections.flatMap(s => s.lessons.map(l => l.id))
    );

    // Một query duy nhất lấy toàn bộ tiến độ của user cho tất cả khóa học
    const allCompletions = await prisma.lessonCompleted.findMany({
        where: {
            user_id: userId,
            lesson_id: { in: allLessonIds }
        },
        orderBy: { completed_at: 'desc' }
    });

    // Tạo Map/Set để tra cứu nhanh
    const completedSet = new Set(allCompletions.map(c => c.lesson_id));

    // Lấy thông tin join_date để tính quá hạn
    const userData = await prisma.user.findUnique({
        where: { id: userId },
        select: { join_date: true }
    });

    const coursesWithProgress = enrollments.map((e) => {
        const course = e.course;
        const lessons = course.sections.flatMap(s => s.lessons);
        const totalLessons = lessons.length;

        const completedInThisCourse = lessons.filter(l => completedSet.has(l.id));
        const completedCount = completedInThisCourse.length;

        // Tìm bài học đầu tiên chưa hoàn thành
        const nextLesson = lessons.find(l => !completedSet.has(l.id));

        // Tìm hoạt động mới nhất cho khóa học này từ allCompletions
        const lastCompletionForCourse = allCompletions.find(c => 
            lessons.some(l => l.id === c.lesson_id)
        );

        const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

        let isOverdue = false;
        if (course.is_mandatory && userData?.join_date) {
            const deadline = new Date(userData.join_date);
            deadline.setDate(deadline.getDate() + (course.mandatory_deadline_days || 0));
            isOverdue = new Date() > deadline;
        }

        return {
            id: course.id,
            title: course.title,
            thumbnail: course.thumbnail,
            instructor: course.instructor.full_name,
            totalLessons,
            completedLessons: completedCount,
            progressPercent,
            nextLessonId: nextLesson ? nextLesson.id : (lessons[0]?.id || null),
            enrolledAt: e.enrolled_at,
            lastActivity: lastCompletionForCourse?.completed_at || e.enrolled_at,
            isOverdue
        };
    });

    // Sắp xếp theo ngày tham gia mới nhất
    coursesWithProgress.sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime());

    res.json(coursesWithProgress);
});

exports.enrollCourse = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const course = await prisma.course.findUnique({ where: { id: parseInt(id) } });
    if (!course) throw new ApiError(404, 'Không tìm thấy khóa học');
    if (course.is_private) throw new ApiError(400, 'Khóa học này là riêng tư');
    const enrollment = await prisma.enrollment.upsert({
        where: { user_id_course_id: { user_id: userId, course_id: parseInt(id) } },
        update: {},
        create: { user_id: userId, course_id: parseInt(id) }
    });
    res.json({ message: 'Tham gia thành công', data: enrollment });
});

exports.completeLesson = catchAsync(async (req, res) => {
    const { lessonId } = req.params;
    const userId = req.user.id;

    if (!lessonId) throw new ApiError(400, 'Thiếu Lesson ID');

    const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(lessonId) },
        include: { section: true }
    });

    if (!lesson) throw new ApiError(404, 'Không tìm thấy bài học');

    if (!lesson.is_free) {
        const isAdmin = req.user?.roles?.includes('admin');
        const course = await prisma.course.findUnique({ where: { id: lesson.section.course_id } });
        const isOwner = course?.instructor_id === userId;

        if (!isAdmin && !isOwner) {
            const enrollment = await prisma.enrollment.findUnique({
                where: { user_id_course_id: { user_id: userId, course_id: lesson.section.course_id } }
            });
            const programEnrollment = await prisma.programEnrollment.findFirst({
                where: { user_id: userId, program: { courses: { some: { course_id: lesson.section.course_id } } } }
            });

            if (!enrollment && !programEnrollment) {
                throw new ApiError(403, 'Bạn không thể hoàn thành bài học của khóa học chưa đăng ký');
            }
        }
    }

    const completion = await prisma.lessonCompleted.upsert({
        where: {
            user_id_lesson_id: {
                user_id: userId,
                lesson_id: parseInt(lessonId)
            }
        },
        update: { completed_at: new Date() },
        create: {
            user_id: userId,
            lesson_id: parseInt(lessonId)
        }
    });

    res.json({
        status: 'success',
        message: 'Lesson marked as completed',
        data: completion
    });
});

/**
 * Lấy danh sách nhân viên trễ hạn khóa học bắt buộc (dành cho Admin)
 */
exports.getMandatoryOverdueReport = catchAsync(async (req, res) => {
    const today = new Date();

    // 1. Lấy tất cả khóa học bắt buộc
    const mandatoryCourses = await prisma.course.findMany({
        where: { is_mandatory: true, deleted_at: null },
        select: { id: true, title: true, mandatory_deadline_days: true }
    });

    if (mandatoryCourses.length === 0) return res.json([]);

    // 2. Lấy tất cả user có join_date (nhân viên mới theo Phương án 2 - chỉ tính từ ngày hôm nay trở đi)
    const users = await prisma.user.findMany({
        where: { join_date: { not: null }, deleted_at: null },
        select: { id: true, full_name: true, email: true, phone: true, employee_id: true, join_date: true, department: { select: { name: true } } }
    });

    const overdueList = [];

    for (const user of users) {
        const userOverdueCourses = [];

        for (const course of mandatoryCourses) {
            const joinDate = new Date(user.join_date);
            const deadlineDate = new Date(joinDate);
            deadlineDate.setDate(deadlineDate.getDate() + course.mandatory_deadline_days);

            const remainingDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

            // Chỉ xét những khóa đã quá hạn (remainingDays < 0)
            if (remainingDays >= 0) continue;

            // Kiểm tra đã hoàn thành chưa
            const enrollment = await prisma.enrollment.findUnique({
                where: { user_id_course_id: { user_id: user.id, course_id: course.id } }
            });

            if (!enrollment) {
                // Chưa ghi danh = chưa học
                userOverdueCourses.push({ courseId: course.id, courseTitle: course.title, daysOverdue: Math.abs(remainingDays) });
                continue;
            }

            // Kiểm tra tiến độ hoàn thành
            const lessons = await prisma.lesson.findMany({
                where: { section: { course_id: course.id } },
                select: { id: true }
            });
            const lessonIds = lessons.map(l => l.id);
            const completedCount = await prisma.lessonCompleted.count({
                where: { user_id: user.id, lesson_id: { in: lessonIds } }
            });
            const isCompleted = lessonIds.length > 0 && completedCount === lessonIds.length;

            if (!isCompleted) {
                userOverdueCourses.push({ courseId: course.id, courseTitle: course.title, daysOverdue: Math.abs(remainingDays) });
            }
        }

        if (userOverdueCourses.length > 0) {
            overdueList.push({
                userId: user.id,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                employeeId: user.employee_id,
                department: user.department?.name,
                joinDate: user.join_date,
                overdueCourses: userOverdueCourses
            });
        }
    }

    res.json(overdueList);
});

/**
 * Lấy danh sách khóa học bắt buộc kèm trạng thái deadline của user hiện tại
 */
exports.getMyMandatoryCourses = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const today = new Date();

    // Lấy thông tin user (cần join_date)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { join_date: true }
    });

    // Nếu không có join_date hoặc join_date trước ngày thiết lập tính năng thì trả rỗng
    // Phương án 2: chỉ hiển thị nếu join_date tồn tại (Admin đã cấu hình ngày nhận việc)
    if (!user?.join_date) return res.json([]);

    // Lấy tất cả khóa học bắt buộc
    const mandatoryCourses = await prisma.course.findMany({
        where: { is_mandatory: true, deleted_at: null },
        include: {
            instructor: { select: { full_name: true } },
            _count: { select: { sections: true } }
        }
    });

    // Lấy tất cả lesson IDs của các khóa bắt buộc
    const allLessons = await prisma.lesson.findMany({
        where: { section: { course: { is_mandatory: true, deleted_at: null } } },
        select: { id: true, section: { select: { course_id: true } } }
    });

    // Lấy tiến độ của user
    const completedLessonIds = new Set(
        (await prisma.lessonCompleted.findMany({
            where: { user_id: userId, lesson_id: { in: allLessons.map(l => l.id) } },
            select: { lesson_id: true }
        })).map(c => c.lesson_id)
    );

    const result = mandatoryCourses.map(course => {
        const joinDate = new Date(user.join_date);
        const deadlineDate = new Date(joinDate);
        deadlineDate.setDate(deadlineDate.getDate() + course.mandatory_deadline_days);
        const remainingDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

        const courseLessons = allLessons.filter(l => l.section.course_id === course.id);
        const totalLessons = courseLessons.length;
        const completedCount = courseLessons.filter(l => completedLessonIds.has(l.id)).length;
        const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);
        const isCompleted = progressPercent === 100;

        let status = 'NORMAL';
        if (isCompleted) status = 'COMPLETED';
        else if (remainingDays < 0) status = 'OVERDUE';
        else if (remainingDays <= 7) status = 'WARNING';

        return {
            id: course.id,
            title: course.title,
            thumbnail: course.thumbnail,
            level: course.level,
            is_mandatory: true,
            mandatory_deadline_days: course.mandatory_deadline_days,
            deadlineDate,
            remainingDays,
            progressPercent,
            completedLessons: completedCount,
            totalLessons,
            status,  // 'NORMAL' | 'WARNING' | 'OVERDUE' | 'COMPLETED'
            isOverdue: status === 'OVERDUE',
            instructor: course.instructor,
            _count: course._count
        };
    });

    res.json(result);
});

