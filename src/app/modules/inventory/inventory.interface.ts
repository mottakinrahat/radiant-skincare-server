export type StockChangeType = "ADD" | "DEDUCT" | "RESTORE" | "ADJUST";

export type StockChangeSource =
  | "MANUAL_ADD"
  | "ORDER_PLACED"
  | "ORDER_CANCELLED"
  | "ORDER_REFUNDED"
  | "ORDER_RESHIPPED"
  | "MANUAL_ADJUSTMENT"
  | "RETURN_RESTOCK";

export interface StockAdjustmentPayload {
  productId: string;
  variantId?: string | null;
  quantity: number;
  changeType: StockChangeType;
  source?: StockChangeSource;
  referenceId?: string;
  note?: string;
}
