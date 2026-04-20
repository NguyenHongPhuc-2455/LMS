import api from "./api";

export const statsService = {
    getDashboardStats: async () => {
        const response = await api.get('/stats/dashboard');
        return response.data;
    }
};
