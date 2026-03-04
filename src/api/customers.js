import api from "./client";

export const getCustomers = (params) => api.get("/customers", { params });
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post("/customers", data);
export const updateCustomer = (id, data) => api.patch(`/customers/${id}`, data);
