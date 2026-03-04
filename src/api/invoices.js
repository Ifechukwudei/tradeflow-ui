import api from "./client";

export const getInvoices = (params) => api.get("/invoices", { params });
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const recordPayment = (id, data) =>
  api.post(`/invoices/${id}/payments`, data);
