import api from "./api";

export const videoService = {
    getDetail: async (lessonId: number) => {
        const response = await api.get(`/videos/${lessonId}`);
        return response.data;
    },
    upload: async (formData: FormData) => {
        const response = await api.post('/videos/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/videos/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/videos/${id}`);
        return response.data;
    },
    uploadAttachment: async (lessonId: number, formData: FormData) => {
        const response = await api.post(`/videos/upload-attachment/${lessonId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    /**
     * Làm mới token stream trước khi hết hạn (token sống 5 phút)
     * @returns videoUrl mới với token mới
     */
    refreshVideoToken: async (lessonId: number): Promise<string> => {
        const response = await api.get(`/videos/refresh-stream/${lessonId}`);
        return response.data.videoUrl;
    }
};
