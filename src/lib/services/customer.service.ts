import api from '../api';
import { Customer, CustomerPayload } from '@/types/customer';
import { PaginatedResult } from '@/types/api';

export const CustomerService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }) {
    const res = await api.get<PaginatedResult<Customer>>('/customers', { params });
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<{ data: Customer }>(`/customers/${id}`);
    return res.data.data;
  },

  async create(payload: CustomerPayload) {
    const res = await api.post<{ data: Customer }>('/customers', payload);
    return res.data.data;
  },

  async update(id: number, payload: Partial<CustomerPayload>) {
    const res = await api.put<{ data: Customer }>(`/customers/${id}`, payload);
    return res.data.data;
  },
};
