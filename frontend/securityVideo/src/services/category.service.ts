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
    getAllCategories: async (page?: number, limit?: number, search?: string, filter?: string): Promise<any> => {
        const params = new URLSearchParams();
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (filter && filter !== 'ALL') params.append('filter', filter);
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await api.get(`/categories${query}`);
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
