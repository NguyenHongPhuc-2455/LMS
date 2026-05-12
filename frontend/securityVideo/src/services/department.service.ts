import api from './api';

export const departmentService = {
    getAll: async () => {
        const response = await api.get('/departments');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/departments', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/departments/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/departments/${id}`);
        return response.data;
    }
};
