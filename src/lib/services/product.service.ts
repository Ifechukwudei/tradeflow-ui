import api from '../api';
import { CreateProductPayload, Product, UpdateProductPayload } from '@/types/product';
import { PaginatedResult } from '@/types/api';

export const ProductService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }) {
    const res = await api.get<{ data: PaginatedResult<Product> | Product[] }>('/products', { params });
    // Handle both wrapped and array responses
    const raw = res.data.data;
    if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray(raw.data)) {
      return raw as PaginatedResult<Product>;
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

  async getById(id: number) {
    const res = await api.get<{ data: Product }>(`/products/${id}`);
    return res.data.data;
  },

  async create(payload: CreateProductPayload) {
    const res = await api.post<{ data: Product }>('/products', payload);
    return res.data.data;
  },

  async update(id: number, payload: UpdateProductPayload) {
    const res = await api.put<{ data: Product }>(`/products/${id}`, payload);
    return res.data.data;
  },

  async delete(id: number) {
    const res = await api.delete<{ data: Product }>(`/products/${id}`);
    return res.data.data;
  },
};
