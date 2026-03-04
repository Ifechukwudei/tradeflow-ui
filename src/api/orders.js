import api from './client';

export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const confirmOrder = (id) => api.patch(`/orders/${id}/confirm`);
export const shipOrder = (id) => api.patch(`/orders/${id}/ship`);
export const invoiceOrder = (id, data) => api.patch(`/orders/${id}/invoice`, data);
export const cancelOrder = (id) => api.patch(`/orders/${id}/cancel`);