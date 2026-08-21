export type StockStatus = 'ok' | 'low_stock' | 'out_of_stock';

export interface InventoryItem {
  product_id: number;
  name: string;
  sku: string;
  qty_on_hand: number;
  qty_reserved: number;
  qty_available: number;
  reorder_point: number;
  stock_status: StockStatus;
}

export interface InventoryAdjustment {
  id: number;
  tenant_id: number;
  product_id: number;
  delta: number;
  reason: string;
  created_at: string;
}

export interface StockAdjustmentPayload {
  delta: number;
  reason: string;
}
