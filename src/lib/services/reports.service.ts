import api from '../api';
import {
  InventoryStatusItem,
  OrdersSummaryItem,
  PaymentsSummary,
  RevenueSummary,
  TopProduct,
} from '@/types/reports';

export const ReportsService = {
  async getRevenue(params?: { from?: string; to?: string }) {
    const res = await api.get<{ data: RevenueSummary }>('/reports/revenue', { params });
    return res.data.data;
  },

  async getOrdersSummary() {
    const res = await api.get<{ data: OrdersSummaryItem[] }>('/reports/orders');
    return res.data.data;
  },

  async getTopProducts(limit = 10) {
    const res = await api.get<{ data: TopProduct[] }>('/reports/top-products', { params: { limit } });
    return res.data.data;
  },

  async getInventoryStatus() {
    const res = await api.get<{ data: InventoryStatusItem[] }>('/reports/inventory');
    return res.data.data;
  },

  async getPaymentsSummary() {
    const res = await api.get<{ data: PaymentsSummary }>('/reports/payments');
    return res.data.data;
  },
};
