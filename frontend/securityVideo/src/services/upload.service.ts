import api from "./api";

export const uploadService = {
    image: async (formData: FormData) => {
        const response = await api.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
