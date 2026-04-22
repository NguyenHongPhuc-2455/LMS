import api from "./api";

export const quizService = {
    getByLesson: async (lessonId: number) => {
        const response = await api.get(`/quizzes/lesson/${lessonId}`);
        return response.data;
    },
    submit: async (quizId: number, answers: any) => {
        const response = await api.post(`/quizzes/${quizId}/submit`, { answers });
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/quizzes', data);
        return response.data;
    },
    update: async (quizId: number, data: any) => {
        const response = await api.put(`/quizzes/${quizId}`, data);
        return response.data;
    }
};

