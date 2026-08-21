export interface Customer {
  id: number;
  tenant_id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerPayload {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}
