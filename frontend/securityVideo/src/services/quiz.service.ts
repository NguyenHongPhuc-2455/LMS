import api from "./api";

export const quizService = {
    getByLesson: async (lessonId: number) => {
        const response = await api.get(`/quizzes/lesson/${lessonId}`);
        return response.data;
    },
    submit: async (lessonId: number, answers: any) => {
        const response = await api.post(`/quizzes/submit/${lessonId}`, { answers });
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/quizzes/create', data); // Wait, backend use /quizzes/create? Let's check.
        return response.data;
    },
    update: async (quizId: number, data: any) => {
        const response = await api.put(`/quizzes/${quizId}`, data);
        return response.data;
    }
};

