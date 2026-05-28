import api from "./api";

export const programRequestService = {
    submitRequest: async (programId: number) => {
        const response = await api.post('/program-requests/request', { programId });
        return response.data;
    },
    getAllPending: async (page?: number, limit?: number) => {
        const params = new URLSearchParams();
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await api.get(`/program-requests/pending${query}`);
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
