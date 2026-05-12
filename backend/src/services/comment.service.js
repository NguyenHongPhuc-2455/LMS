const prisma = require('../configs/prisma');
const events = require('../utils/events');

exports.createComment = async (data) => {
    let finalParentId = data.parent_id ? parseInt(data.parent_id) : null;

    // Nếu đang phản hồi vào một bình luận mà bản thân nó cũng là phản hồi (Level 2)
    // thì gán parent_id là cha của nó (Level 1) để giữ cấu trúc tối đa 2 cấp
    if (finalParentId) {
        const parentComment = await prisma.comment.findUnique({
            where: { id: finalParentId }
        });
        if (parentComment && parentComment.parent_id) {
            finalParentId = parentComment.parent_id;
        }
    }

    const newComment = await prisma.comment.create({
        data: {
            content: data.content,
            user_id: data.user_id,
            lesson_id: data.lesson_id,
            parent_id: finalParentId
        },
        include: {
            user: {
                select: {
                    id: true,
                    full_name: true,
                    avatar: true,
                    username: true
                }
            }
        }
    });

    // Thông báo cho chủ sở hữu bình luận cha nếu đây là một phản hồi (reply)
    if (data.parent_id) {
        try {
            const parentComment = await prisma.comment.findUnique({
                where: { id: parseInt(data.parent_id) },
                include: {
                    lesson: {
                        select: {
                            id: true,
                            title: true,
                            section: {
                                select: { course_id: true }
                            }
                        }
                    }
                }
            });

            if (parentComment && parentComment.user_id !== data.user_id) {
                events.emit('comment.reply', {
                    parentComment,
                    newComment,
                    lesson: parentComment.lesson
                });
            }
        } catch (error) {
            console.error('Error creating notification for comment reply:', error);
        }
    }

    return newComment;
};

exports.getCommentsByLesson = async (lessonId) => {
    // Lấy toàn bộ bình luận của bài học để xây dựng cây (Tree structure)
    const allComments = await prisma.comment.findMany({
        where: {
            lesson_id: parseInt(lessonId),
        },
        include: {
            user: {
                select: {
                    id: true,
                    full_name: true,
                    avatar: true,
                    username: true
                }
            }
        },
        orderBy: {
            created_at: 'asc'
        }
    });

    const commentMap = {};
    const roots = [];

    // Khởi tạo map
    allComments.forEach(comment => {
        comment.replies = [];
        commentMap[comment.id] = comment;
    });

    // Xây dựng cây
    allComments.forEach(comment => {
        if (comment.parent_id && commentMap[comment.parent_id]) {
            commentMap[comment.parent_id].replies.push(comment);
        } else {
            roots.push(comment);
        }
    });

    // Sắp xếp các bình luận gốc (cha) theo thời gian mới nhất lên đầu
    return roots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

exports.deleteComment = async (commentId, userId, isAdmin = false) => {
    const comment = await prisma.comment.findUnique({
        where: { id: parseInt(commentId) }
    });

    if (!comment) throw new Error('Không tìm thấy bình luận');

    // Chỉ cho phép chủ nhân của bình luận hoặc admin xóa
    if (comment.user_id !== userId && !isAdmin) {
        throw new Error('Bạn không có quyền xóa bình luận này');
    }

    return await prisma.comment.delete({
        where: { id: parseInt(commentId) }
    });
};

exports.updateComment = async (commentId, userId, data) => {
    const comment = await prisma.comment.findUnique({
        where: { id: parseInt(commentId) }
    });

    if (!comment) throw new Error('Không tìm thấy bình luận');

    if (comment.user_id !== userId) {
        throw new Error('Bạn không có quyền sửa bình luận này');
    }

    return await prisma.comment.update({
        where: { id: parseInt(commentId) },
        data: { content: data.content }
    });
};

