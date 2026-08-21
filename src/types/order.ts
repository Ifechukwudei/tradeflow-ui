export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'invoiced' | 'paid' | 'cancelled';

export interface OrderItem {
  id?: number;
  tenant_id?: number;
  order_id?: number;
  product_id: number;
  quantity: number;
  unit_price: number | string;
  total_price?: number | string;
  product_name?: string;
  sku?: string;
}

export interface Order {
  id: number;
  tenant_id: number;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  status: OrderStatus;
  total_amount: number | string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface CreateOrderPayload {
  customer_id: number;
  notes?: string;
  items: {
    product_id: number;
    quantity: number;
  }[];
}
