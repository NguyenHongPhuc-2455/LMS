/**
 * Quản lý tập trung các hằng số về đường dẫn (Frontend & Backend)
 * Giúp tránh lỗi link hỏng khi thay đổi cấu trúc URL.
 */

const FRONTEND_URLS = {
    // Client
    COURSE_DETAIL: (courseId) => `/course/${courseId}`,
    COURSE_LEARNING: (courseId, lessonId, commentId) => {
        let url = `/course/${courseId}/learning?lessonId=${lessonId}`;
        if (commentId) url += `#comment-${commentId}`;
        return url;
    },
    PROGRAM_DETAIL: (programId) => `/program/${programId}`,
    
    // Admin
    ADMIN_COURSE_REQUESTS: '/admin/requests',
    ADMIN_PROGRAM_REQUESTS: '/admin/program-requests',
};

module.exports = {
    FRONTEND_URLS
};
