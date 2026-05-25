import api from "./api";

export const programService = {
    getAll: async (search?: string, page?: number, limit?: number) => {
        let url = '/programs';
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());
        if (params.toString()) url += `?${params.toString()}`;

        const response = await api.get(url);
        return response.data;
    },
    getById: async (id: string | number) => {
        const response = await api.get(`/programs/${id}`);
        return response.data;
    },
    enroll: async (programId: number) => {
        const response = await api.post(`/programs/${programId}/enroll`);
        return response.data;
    },
    getMyPrograms: async () => {
        const response = await api.get('/programs/my-programs');
        return response.data;
    },
    getMandatoryPrograms: async () => {
        const response = await api.get('/programs/mandatory');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/programs', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/programs/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/programs/${id}`);
        return response.data;
    },
    addCourse: async (programId: number, courseId: number) => {
        const response = await api.post(`/programs/${programId}/courses`, { course_id: courseId });
        return response.data;
    },
    removeCourse: async (programId: number, courseId: number) => {
        const response = await api.delete(`/programs/${programId}/courses/${courseId}`);
        return response.data;
    },
    reorderCourses: async (programId: number, courses: { courseId: number, order: number }[]) => {
        const response = await api.put(`/programs/${programId}/courses/reorder`, { courses });
        return response.data;
    }
};

