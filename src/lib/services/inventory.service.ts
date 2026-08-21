import api from '../api';
import { InventoryAdjustment, InventoryItem, StockAdjustmentPayload } from '@/types/inventory';
import { PaginatedResult } from '@/types/api';

export const InventoryService = {
  async getAll(params?: { page?: number; limit?: number; stock_status?: string }) {
    const res = await api.get<{ data: PaginatedResult<InventoryItem> | InventoryItem[] }>('/inventory', { params });
    const raw = res.data.data;
    if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray(raw.data)) {
      return raw as PaginatedResult<InventoryItem>;
    }
    return {
      data: Array.isArray(raw) ? raw : [],
      pagination: {
        total: Array.isArray(raw) ? raw.length : 0,
        page: 1,
        limit: 20,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
    };
  },

  async getLowStock() {
    const res = await api.get<{ data: InventoryItem[] }>('/inventory/low-stock');
    return res.data.data;
  },

  async adjustStock(productId: number, payload: StockAdjustmentPayload) {
    const res = await api.post<{ data: InventoryItem }>(`/inventory/${productId}/adjust`, payload);
    return res.data.data;
  },

  async getHistory(productId: number) {
    const res = await api.get<{ data: InventoryAdjustment[] }>(`/inventory/${productId}/history`);
    return res.data.data;
  },

  async updateReorderPoint(productId: number, reorder_point: number) {
    const res = await api.patch<{ data: InventoryItem }>(`/inventory/${productId}/reorder-point`, { reorder_point });
    return res.data.data;
  },
};
