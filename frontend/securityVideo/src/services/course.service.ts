import api from "./api";

export const courseService = {
    getAll: async (search?: string, categoryId?: number) => {
        let url = '/courses';
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (categoryId) params.append('categoryId', categoryId.toString());
        if (params.toString()) url += `?${params.toString()}`;

        const response = await api.get(url);
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


