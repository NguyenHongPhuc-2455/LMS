import api from '../api';

export const courseService = {
    getAll: async () => {
        const response = await api.get('/courses');
        return response.data;
    },
    getById: async (id: string | number) => {
        const response = await api.get(`/courses/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/courses', data);
        return response.data;
    }
};

export const videoService = {
    upload: async (formData: FormData) => {
        const response = await api.post('/videos/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
