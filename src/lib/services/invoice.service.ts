import api from '../api';
import { Invoice, Payment, RecordPaymentPayload } from '@/types/invoice';

export const InvoiceService = {
  async getAll(params?: { page?: number; limit?: number }) {
    const res = await api.get<{ data: Invoice[] }>('/invoices', { params });
    return res.data.data;
  },

  async getById(id: number) {
    const res = await api.get<{ data: Invoice }>(`/invoices/${id}`);
    return res.data.data;
  },

  async recordPayment(id: number, payload: RecordPaymentPayload) {
    const res = await api.post<{ data: Payment }>(`/invoices/${id}/payments`, payload);
    return res.data.data;
  },
};
