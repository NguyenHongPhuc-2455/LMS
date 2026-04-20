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
    getAllPending: async () => {
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
    },
    bulkAction: async (action: 'approve' | 'reject', ids: number[]) => {
        const response = await api.post(`/course-requests/${action}-bulk`, { ids });
        return response.data;
    }
};
