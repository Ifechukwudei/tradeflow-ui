import api from "./client";

export const getReturns = (params) => api.get("/returns", { params });
export const getReturn = (id) => api.get(`/returns/${id}`);
export const createReturn = (data) => api.post("/returns", data);
export const approveReturn = (id) => api.patch(`/returns/${id}/approve`);
export const rejectReturn = (id, data) =>
  api.patch(`/returns/${id}/reject`, data);
export const restockReturn = (id) => api.patch(`/returns/${id}/restock`);
export const refundReturn = (id) => api.patch(`/returns/${id}/refund`);
