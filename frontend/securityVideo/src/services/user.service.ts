import api from "./api";

export const userService = {
    getAll: async (params?: { page: number; limit: number; search?: string }) => {
        const response = await api.get('/users', { params });
        return response.data;
    },
    getRoles: async () => {
        const response = await api.get('/users/roles');
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/users/profile');
        return response.data;
    },
    updateProfile: async (data: any) => {
        const response = await api.put('/users/profile', data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
    updateRoles: async (id: number, roles: number[]) => {
        const response = await api.put(`/users/${id}/roles`, { roles });
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/users', data);
        return response.data;
    },
    updateBatch: async (users: any[]) => {
        const response = await api.post('/users/batch-update', { users });
        return response.data;
    },
    deleteBatch: async (ids: number[]) => {
        const response = await api.delete('/users/batch', { data: { ids } });
        return response.data;
    },
    revokeCourse: async (userId: number, courseId: number) => {
        const response = await api.post('/users/revoke-course', { userId, courseId });
        return response.data;
    }
};

