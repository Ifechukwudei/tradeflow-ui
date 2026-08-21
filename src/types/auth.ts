export interface Tenant {
  id: number;
  company_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  tenant_id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'viewer';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterTenantPayload {
  company_name: string;
  name: string;
  email: string;
  password: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'staff' | 'viewer';
}

export interface AuthResponseData {
  user: User;
  token: string;
  tenant?: Tenant;
}
