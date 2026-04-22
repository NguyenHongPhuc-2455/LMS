const commentService = require('../services/comment.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

exports.createComment = catchAsync(async (req, res) => {
    const { lesson_id, content, parent_id } = req.body;
    const userId = req.user.id;

    if (!lesson_id || !content) {
        throw new ApiError(400, 'Thiếu thông tin bài học hoặc nội dung bình luận');
    }

    const comment = await commentService.createComment({
        lesson_id: parseInt(lesson_id),
        content,
        user_id: userId,
        parent_id: parent_id ? parseInt(parent_id) : null
    });

    res.status(201).json(comment);
});

exports.getLessonComments = catchAsync(async (req, res) => {
    const { lessonId } = req.params;
    const comments = await commentService.getCommentsByLesson(lessonId);
    res.json(comments);
});

exports.deleteComment = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.roles && req.user.roles.includes('admin');

    await commentService.deleteComment(id, userId, isAdmin);
    res.json({ message: 'Đã xóa bình luận' });
});

exports.updateComment = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    const comment = await commentService.updateComment(id, userId, { content });
    res.json(comment);
});
