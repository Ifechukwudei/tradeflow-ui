import api from "./client";

export const getInventory = (params) => api.get("/inventory", { params });
export const getLowStock = () => api.get("/inventory/low-stock");
export const adjustStock = (productId, data) =>
  api.post(`/inventory/${productId}/adjust`, data);
export const getHistory = (productId) =>
  api.get(`/inventory/${productId}/history`);
