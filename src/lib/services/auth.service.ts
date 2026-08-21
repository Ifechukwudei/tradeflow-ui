import api from '../api';
import { AuthResponseData, LoginPayload, RegisterTenantPayload, User } from '@/types/auth';

export const AuthService = {
  async login(payload: LoginPayload) {
    const res = await api.post<{ data: AuthResponseData }>('/auth/login', payload);
    return res.data.data;
  },

  async registerTenant(payload: RegisterTenantPayload) {
    const res = await api.post<{ data: AuthResponseData }>('/auth/register', payload);
    return res.data.data;
  },

  async getMe() {
    const res = await api.get<{ data: User }>('/auth/me');
    return res.data.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
  },
};
