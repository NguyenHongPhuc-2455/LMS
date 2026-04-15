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
export const courseRequestService = {
    submitRequest: async (courseId: number, reason?: string) => {
        const response = await api.post('/course-requests', { courseId, reason });
        return response.data;
    },
    getMyRequests: async () => {
        const response = await api.get('/course-requests/my-requests');
        return response.data;
    },
    getPendingRequests: async () => {
        const response = await api.get('/course-requests/pending');
        return response.data;
    },
    approve: async (requestId: number) => {
        const response = await api.patch(`/course-requests/${requestId}/approve`);
        return response.data;
    },
    reject: async (requestId: number) => {
        const response = await api.patch(`/course-requests/${requestId}/reject`);
        return response.data;
    }
};
