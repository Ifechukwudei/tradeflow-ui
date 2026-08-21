export interface RevenueSummary {
  total_orders: number;
  total_revenue: number | string;
  avg_order_value: number | string;
  total_collected: number | string;
  total_outstanding: number | string;
}

export interface OrdersSummaryItem {
  status: string;
  count: number;
  total_value: number | string;
}

export interface TopProduct {
  id: number;
  name: string;
  sku: string;
  total_orders: number;
  total_units_sold: number;
  total_revenue: number | string;
}

export interface InventoryStatusItem {
  id: number;
  name: string;
  sku: string;
  unit_price: number | string;
  qty_on_hand: number;
  qty_reserved: number;
  qty_available: number;
  reorder_point: number;
  stock_status: 'ok' | 'low_stock' | 'out_of_stock';
  stock_value: number | string;
}

export interface PaymentsSummary {
  total_invoices: number;
  total_invoiced: number | string;
  total_collected: number | string;
  total_outstanding: number | string;
  paid_invoices: number;
  partial_invoices: number;
  unpaid_invoices: number;
  overdue_invoices: number;
}
