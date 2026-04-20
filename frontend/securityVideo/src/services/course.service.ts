import api from "./api";

export const courseService = {
    getAll: async (search?: string) => {
        const response = await api.get(`/courses${search ? `?search=${search}` : ''}`);
        return response.data;
    },
    getById: async (id: string | number) => {
        const response = await api.get(`/courses/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/courses', data);
        return response.data;
    },
    getMyCourses: async () => {
        const response = await api.get('/courses/my-courses');
        return response.data;
    },
    enroll: async (courseId: number) => {
        const response = await api.post(`/courses/${courseId}/enroll`);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/courses/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/courses/${id}`);
        return response.data;
    }
};


