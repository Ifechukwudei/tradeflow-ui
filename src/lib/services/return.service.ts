import api from '../api';
import { CreateReturnPayload, ReturnOrder } from '@/types/return';
import { PaginatedResult } from '@/types/api';

export const ReturnService = {
  async getAll(params?: { page?: number; limit?: number; status?: string }) {
    const res = await api.get<PaginatedResult<ReturnOrder>>('/returns', { params });
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<{ data: ReturnOrder }>(`/returns/${id}`);
    return res.data.data;
  },

  async create(payload: CreateReturnPayload) {
    const res = await api.post<{ data: ReturnOrder }>('/returns', payload);
    return res.data.data;
  },

  async approve(id: number) {
    const res = await api.patch<{ data: ReturnOrder }>(`/returns/${id}/approve`);
    return res.data.data;
  },

  async reject(id: number, notes?: string) {
    const res = await api.patch<{ data: ReturnOrder }>(`/returns/${id}/reject`, { notes });
    return res.data.data;
  },

  async restock(id: number) {
    const res = await api.patch<{ data: ReturnOrder }>(`/returns/${id}/restock`);
    return res.data.data;
  },

  async refund(id: number) {
    const res = await api.patch<{ data: ReturnOrder }>(`/returns/${id}/refund`);
    return res.data.data;
  },
};
