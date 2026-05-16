const prisma = require('../configs/prisma');
const courseService = require('../services/course.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { generateStreamToken } = require('../utils/streamToken');
const { createVideoToken } = require('../utils/crypto');
const { lessonSelect } = require('../services/video.service');

/**
 * Tạo một chương học mới (Section)
 */
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

/**
 * Xóa một chương học
 */
exports.deleteSection = catchAsync(async (req, res) => {
    const { id } = req.params;
    await courseService.deleteSection(id);
    res.json({ message: 'Đã xóa chương và toàn bộ bài học liên quan' });
});

/**
 * Cập nhật thông tin chương học
 */
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

/**
 * Lấy chi tiết chương học kèm danh sách bài học (với URL bảo mật)
 */
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

    // Kiểm tra quyền truy cập sớm (Early Access) đối với học viên bình thường
    if (!isAdmin) {
        const course = await prisma.course.findUnique({
            where: { id: section.course_id },
            select: { is_mandatory: true, mandatory_start_date: true, mandatory_end_date: true, mandatory_deadline_days: true, allow_early_access: true }
        });
        
        if (course && course.is_mandatory) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { join_date: true } });
            const { calculateCourseStatus } = require('../utils/courseStatus');
            const statusInfo = calculateCourseStatus(course, user, 0); // Progress không quan trọng ở đây
            
            if (!statusInfo.canAccess) {
                throw new ApiError(403, statusInfo.reason || 'Khóa học chưa đến thời gian cho phép truy cập');
            }
        }
    }

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

/**
 * Lấy danh sách bài giảng của một chương
 */
exports.getLessonsBySection = catchAsync(async (req, res) => {
    const { sectionId } = req.params;

    const section = await prisma.section.findUnique({
        where: { id: parseInt(sectionId) },
        include: {
            lessons: {
                orderBy: [
                    { order: 'asc' },
                    { id: 'asc' }
                ]
            }
        }
    });

    if (!section) {
        throw new ApiError(404, 'Không tìm thấy chương học');
    }

    res.json(section.lessons);
});
