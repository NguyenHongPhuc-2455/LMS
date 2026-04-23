import api from "./api";

export const statsService = {
    getDashboardStats: async () => {
        const response = await api.get('/stats/dashboard');
        return response.data;
    },
    getCourseProgress: async (courseId: number) => {
        const response = await api.get(`/stats/course-progress/${courseId}`);
        return response.data;
    }
};
