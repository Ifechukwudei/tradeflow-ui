import api from '../api';
import { CreateUserPayload, User } from '@/types/auth';

export const UsersService = {
  async getAll() {
    const res = await api.get<{ data: User[] }>('/auth/users');
    return res.data.data;
  },

  async create(payload: CreateUserPayload) {
    const res = await api.post<{ data: { user: User } }>('/auth/register', payload);
    return res.data.data.user;
  },

  async updateRole(id: number, role: 'admin' | 'staff' | 'viewer') {
    const res = await api.patch<{ data: User }>(`/auth/users/${id}/role`, { role });
    return res.data.data;
  },

  async deactivate(id: number) {
    const res = await api.patch<{ data: User }>(`/auth/users/${id}/deactivate`);
    return res.data.data;
  },
};
