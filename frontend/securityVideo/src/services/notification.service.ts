import api from "./api";

export const notificationService = {
    getAll: async () => {
        const response = await api.get('/notifications');
        return response.data;
    },
    markAsRead: async (id: number) => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },
    markAllAsRead: async () => {
        const response = await api.patch('/notifications/read-all');
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    },
    deleteAll: async () => {
        const response = await api.delete('/notifications');
        return response.data;
    }
};