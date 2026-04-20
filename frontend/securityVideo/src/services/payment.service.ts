import api from "./api";

export const paymentService = {
    createVNPayUrl: async (courseId: number) => {
        const response = await api.post('/payments/create-vnpay-url', { courseId });
        return response.data;
    },
    verifyVNPayReturn: async (queryString: string) => {
        const response = await api.get(`/payments/vnpay-return?${queryString}`);
        return response.data;
    }
};

