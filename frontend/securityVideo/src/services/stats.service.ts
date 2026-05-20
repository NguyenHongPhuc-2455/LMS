import api from "./api";

export const statsService = {
    getDashboardStats: async () => {
        const response = await api.get('/stats/dashboard');
        return response.data;
    },
    getCourseProgress: async (courseId: number, departmentId?: number) => {
        const response = await api.get(`/stats/course-progress/${courseId}`, {
            params: departmentId ? { departmentId } : {}
        });
        return response.data;
    },
    searchProgress: async (query: string, courseId?: number, departmentId?: number) => {
        const response = await api.get(`/stats/progress-search`, {
            params: { q: query, courseId, ...(departmentId ? { departmentId } : {}) }
        });
        return response.data;
    },
    trackLearningTime: async (payload: { courseId?: number, lessonId?: number, duration: number }) => {
        const response = await api.post('/stats/track', payload);
        return response.data;
    },
    getMyLearningTime: async (days: number = 7) => {
        const response = await api.get(`/stats/my-learning-time?days=${days}`);
        return response.data;
    },
    getMyLearningSummary: async () => {
        const response = await api.get('/stats/my-learning-summary');
        return response.data;
    },
    getGlobalLearningTrends: async (days: number = 7) => {
        const response = await api.get(`/stats/global-learning-trends?days=${days}`);
        return response.data;
    },
    getTopLearners: async () => {
        const response = await api.get('/stats/top-learners');
        return response.data;
    }
};
