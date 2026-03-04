import api from "./client";

export const getRevenue = (params) => api.get("/reports/revenue", { params });
export const getOrdersSummary = () => api.get("/reports/orders-summary");
export const getTopProducts = (params) =>
  api.get("/reports/top-products", { params });
export const getInventoryStatus = () => api.get("/reports/inventory-status");
export const getPaymentsSummary = () => api.get("/reports/payments-summary");
