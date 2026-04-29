import axios from 'axios';
const API_URL = 'http://localhost:5000/api/hero-banners';

const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
});

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
        const response = await axios.get(API_URL);
        return response.data;
    },
    getAllAdmin: async (): Promise<HeroBanner[]> => {
        const response = await axios.get(`${API_URL}/admin`, getAuthHeader());
        return response.data;
    },
    create: async (data: Partial<HeroBanner>): Promise<HeroBanner> => {
        const response = await axios.post(API_URL, data, getAuthHeader());
        return response.data;
    },
    update: async (id: number, data: Partial<HeroBanner>): Promise<HeroBanner> => {
        const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeader());
        return response.data;
    },
    delete: async (id: number): Promise<void> => {
        await axios.delete(`${API_URL}/${id}`, getAuthHeader());
    }
};
