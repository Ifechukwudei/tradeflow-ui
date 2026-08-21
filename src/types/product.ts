export interface Product {
  id: number;
  tenant_id: number;
  name: string;
  sku: string;
  description?: string;
  unit_price: number | string;
  qty_on_hand?: number;
  qty_reserved?: number;
  qty_available?: number;
  reorder_point?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  description?: string;
  unit_price: number;
  initial_stock?: number;
  reorder_point?: number;
}

export interface UpdateProductPayload {
  name: string;
  description?: string;
  unit_price: number;
}
