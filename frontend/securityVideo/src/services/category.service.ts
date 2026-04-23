import api from './api';

export interface Category {
    id: number;
    name: string;
    description: string | null;
    _count?: {
        courses: number;
    };
}

export const categoryService = {
    getAllCategories: async (): Promise<Category[]> => {
        const response = await api.get('/categories');
        return response.data;
    },

    createCategory: async (data: { name: string; description?: string }): Promise<Category> => {
        const response = await api.post('/categories', data);
        return response.data;
    },

    updateCategory: async (id: number, data: { name?: string; description?: string }): Promise<Category> => {
        const response = await api.put(`/categories/${id}`, data);
        return response.data;
    },

    deleteCategory: async (id: number): Promise<{ message: string }> => {
        const response = await api.delete(`/categories/${id}`);
        return response.data;
    }
};
