import api from "./api";
import type { User } from "../types/user";

export interface UserListResponse {
    users: User[];
    total: number;
    page: number;
    totalPages: number;
}

export const userService = {
    getAll: async (params?: { page: number; limit: number; search?: string }): Promise<UserListResponse> => {
        const response = await api.get('/users', { params });
        return response.data;
    },
    getRoles: async (): Promise<any[]> => {
        const response = await api.get('/users/roles');
        return response.data;
    },
    getProfile: async (): Promise<User> => {
        const response = await api.get('/users/profile');
        return response.data;
    },
    updateProfile: async (data: Partial<User>): Promise<{ message: string; user: User }> => {
        const response = await api.put('/users/profile', data);
        return response.data;
    },
    delete: async (id: number): Promise<{ message: string }> => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
    updateRoles: async (id: number, roles: number[]): Promise<{ message: string }> => {
        const response = await api.put(`/users/${id}/roles`, { roles });
        return response.data;
    },
    create: async (data: Partial<User> & { password?: string }): Promise<{ message: string; user: User }> => {
        const response = await api.post('/users', data);
        return response.data;
    },
    updateBatch: async (users: Partial<User>[]): Promise<{ message: string }> => {
        const response = await api.post('/users/batch-update', { users });
        return response.data;
    },
    deleteBatch: async (ids: number[]): Promise<{ message: string }> => {
        const response = await api.delete('/users/batch', { data: { ids } });
        return response.data;
    },
    revokeCourse: async (userId: number, courseId: number): Promise<{ message: string }> => {
        const response = await api.post('/users/revoke-course', { userId, courseId });
        return response.data;
    },
    updateUser: async (id: number, data: Partial<User>): Promise<{ message: string }> => {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    }
};
