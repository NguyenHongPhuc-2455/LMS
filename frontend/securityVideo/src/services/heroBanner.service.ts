import api from './api';

export interface HeroBanner {
    id: number;
    title: string;
    description: string;
    image_url?: string;
    button_text?: string;
    button_link?: string;
    stat_value?: string;
    color_code?: string;
    order: number;
    is_active: boolean;
}

export const heroBannerService = {
    getAll: async (): Promise<HeroBanner[]> => {
        const response = await api.get('/hero-banners');
        return response.data;
    },
    getAllAdmin: async (): Promise<HeroBanner[]> => {
        const response = await api.get('/hero-banners/admin');
        return response.data;
    },
    create: async (data: Partial<HeroBanner>): Promise<HeroBanner> => {
        const response = await api.post('/hero-banners', data);
        return response.data;
    },
    update: async (id: number, data: Partial<HeroBanner>): Promise<HeroBanner> => {
        const response = await api.put(`/hero-banners/${id}`, data);
        return response.data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/hero-banners/${id}`);
    }
};
