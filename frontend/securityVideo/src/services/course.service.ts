import api from "./api";

export const courseService = {
    getAll: async (search?: string, categoryId?: number, includeInactive?: boolean, page?: number, limit?: number) => {
        let url = '/courses';
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (categoryId) params.append('categoryId', categoryId.toString());
        if (includeInactive) params.append('includeInactive', 'true');
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());
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
    getMandatoryCourses: async () => {
        const response = await api.get('/courses/mandatory');
        return response.data;
    },
    getMandatoryOverdueReport: async (type: string = 'overdue', timeframe: string = 'all') => {
        const response = await api.get(`/courses/mandatory-overdue-report?type=${type}&timeframe=${timeframe}`);
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
    },
    restore: async (id: number) => {
        const response = await api.post(`/courses/${id}/restore`);
        return response.data;
    },
    toggleActive: async (id: number, active: boolean) => {
        const response = await api.patch(`/courses/${id}/toggle-active`, { active });
        return response.data;
    },
    batchDelete: async (ids: number[]) => {
        const response = await api.delete('/courses/batch', { data: { ids } });
        return response.data;
    }
};


