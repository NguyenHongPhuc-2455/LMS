import api from "./api";

export const contentService = {
    // Sections
    getSections: async (courseId: number) => {
        const response = await api.get(`/courses/${courseId}/sections`);
        return response.data;
    },
    createSection: async (data: any) => {
        const response = await api.post('/courses/sections', data);
        return response.data;
    },
    updateSection: async (id: number, data: any) => {
        const response = await api.put(`/courses/sections/${id}`, data);
        return response.data;
    },
    deleteSection: async (id: number) => {
        const response = await api.delete(`/courses/sections/${id}`);
        return response.data;
    },

    // Lessons
    getLesson: async (id: number) => {
        const response = await api.get(`/videos/${id}`);
        return response.data;
    },
    getLessonsBySection: async (sectionId: number) => {
        const response = await api.get(`/sections/${sectionId}/lessons`);
        return response.data;
    },
    createLesson: async (formData: FormData) => {
        const response = await api.post('/videos/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    updateLesson: async (id: number, data: any) => {
        const response = await api.put(`/videos/${id}`, data);
        return response.data;
    },
    deleteLesson: async (id: number) => {
        const response = await api.delete(`/videos/${id}`);
        return response.data;
    },
    completeLesson: async (id: number) => {
        const response = await api.post(`/videos/complete/${id}`);
        return response.data;
    },
    uploadAttachment: async (lessonId: number, formData: FormData) => {
        const response = await api.post(`/videos/upload-attachment/${lessonId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
