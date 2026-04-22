import api from "./api";

export const commentService = {
    getByLesson: async (lessonId: number) => {
        const response = await api.get(`/comments/lesson/${lessonId}`);
        return response.data;
    },
    create: async (data: { lesson_id: number; content: string; parent_id?: number }) => {
        const response = await api.post('/comments', data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/comments/${id}`);
        return response.data;
    },
    update: async (id: number, data: { content: string }) => {
        const response = await api.put(`/comments/${id}`, data);
        return response.data;
    }
};
