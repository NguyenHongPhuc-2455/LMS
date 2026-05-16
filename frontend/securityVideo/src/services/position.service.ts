import api from './api';

export const positionService = {
    getAll: async () => {
        const response = await api.get('/positions');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/positions', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/positions/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/positions/${id}`);
        return response.data;
    }
};
