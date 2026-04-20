import api from "./api";

export const programRequestService = {
    submitRequest: async (programId: number) => {
        const response = await api.post('/program-requests/request', { programId });
        return response.data;
    },
    getAllPending: async () => {
        const response = await api.get('/program-requests/pending');
        return response.data;
    },
    approve: async (id: number) => {
        const response = await api.post(`/program-requests/${id}/approve`);
        return response.data;
    },
    reject: async (id: number) => {
        const response = await api.post(`/program-requests/${id}/reject`);
        return response.data;
    },
    bulkAction: async (action: 'approve' | 'reject', ids: number[]) => {
        const response = await api.post(`/program-requests/${action}-bulk`, { ids });
        return response.data;
    }
};
