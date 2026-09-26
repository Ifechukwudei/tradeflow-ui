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

  downloadPDF(id: number, invoiceNumber: string) {
    const url = `${api.defaults.baseURL}/invoices/${id}/pdf`;
    
    // We fetch it via axios to attach the JWT token properly
    api.get(url, { responseType: 'blob' }).then(response => {
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    }).catch(err => {
      console.error('Failed to download PDF', err);
    });
  },
};
