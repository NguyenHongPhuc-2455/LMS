import api from "./api";

export const courseRequestService = {
    submitRequest: async (courseId: number, reason?: string) => {
        const response = await api.post('/course-requests', { courseId, reason });
        return response.data;
    },
    getMyRequests: async () => {
        const response = await api.get('/course-requests/my-requests');
        return response.data;
    },
    getAllPending: async (page?: number, limit?: number) => {
        const params = new URLSearchParams();
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await api.get(`/course-requests/pending${query}`);
        return response.data;
    },
    approve: async (requestId: number) => {
        const response = await api.patch(`/course-requests/${requestId}/approve`);
        return response.data;
    },
    reject: async (requestId: number) => {
        const response = await api.patch(`/course-requests/${requestId}/reject`);
        return response.data;
    },
    bulkAction: async (action: 'approve' | 'reject', ids: number[]) => {
        const response = await api.post(`/course-requests/${action}-bulk`, { ids });
        return response.data;
    }
};
