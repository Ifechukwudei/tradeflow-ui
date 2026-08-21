import api from '../api';
import { CreateOrderPayload, Order } from '@/types/order';
import { PaginatedResult } from '@/types/api';
import { Invoice } from '@/types/invoice';

export const OrderService = {
  async getAll(params?: { page?: number; limit?: number; status?: string; customer_id?: number }) {
    const res = await api.get<PaginatedResult<Order>>('/orders', { params });
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<{ data: Order }>(`/orders/${id}`);
    return res.data.data;
  },

  async create(payload: CreateOrderPayload) {
    const res = await api.post<{ data: Order }>('/orders', payload);
    return res.data.data;
  },

  async confirm(id: number) {
    const res = await api.patch<{ data: Order }>(`/orders/${id}/confirm`);
    return res.data.data;
  },

  async ship(id: number) {
    const res = await api.patch<{ data: Order }>(`/orders/${id}/ship`);
    return res.data.data;
  },

  async generateInvoice(id: number, due_days = 30) {
    const res = await api.post<{ data: Invoice }>(`/orders/${id}/invoice`, { due_days });
    return res.data.data;
  },

  async cancel(id: number) {
    const res = await api.patch<{ data: Order }>(`/orders/${id}/cancel`);
    return res.data.data;
  },
};
