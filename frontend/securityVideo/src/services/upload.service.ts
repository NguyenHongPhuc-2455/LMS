import api from "./api";

export const uploadService = {
    image: async (formData: FormData, type?: string) => {
        const url = type ? `/upload/image?type=${type}` : '/upload/image';
        const response = await api.post(url, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
