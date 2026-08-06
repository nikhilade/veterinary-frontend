/** Billing, payments, refunds, inventory and supplier domain types. */

export type LineItemType = "CONSULTATION" | "LAB" | "PHARMACY" | "GROOMING" | "MISC";

export const LINE_ITEM_TYPES: LineItemType[] = ["CONSULTATION", "LAB", "PHARMACY", "GROOMING", "MISC"];

/** Master catalogue of chargeable services, grouped by line-item type. */
export interface ChargeableItem {
  id: string;
  type: LineItemType;
  label: string;
  unit_price: number;
  gst_rate: number;
}

export interface InvoiceLineItem {
  id: string;
  type: LineItemType;
  label: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export type InvoiceDetailStatus = "DRAFT" | "DUE" | "OVERDUE" | "PAID" | "CANCELLED";

export interface InvoiceDetail {
  id: string;
  number: string;
  owner_id: string;
  owner_name: string;
  pet_name: string | null;
  status: InvoiceDetailStatus;
  line_items: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  gst_rate: number;
  inter_state: boolean;
  tax: number;
  grand_total: number;
  amount_paid: number;
  /** Once GST-finalised, corrections must go through a credit note. */
  gst_finalised: boolean;
  issued_at: string;
  due_at: string;
}

export type PaymentMethod = "CASH" | "CARD" | "UPI" | "ONLINE";
/** UNKNOWN = gateway timed out. Not a failure — must be reconciled. */
export type PaymentStatus = "SUCCESS" | "FAILED" | "UNKNOWN";

export interface Payment {
  id: string;
  invoice_id: string;
  invoice_number: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  reference: string;
  created_at: string;
}

export type RefundStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

export interface CreditNote {
  id: string;
  number: string;
  invoice_id: string;
  invoice_number: string;
  refund_id: string;
  amount: number;
  tax: number;
  issued_at: string;
}

export interface Refund {
  id: string;
  invoice_id: string;
  invoice_number: string;
  owner_name: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  requested_by: string;
  requested_at: string;
  approved_by: string | null;
  approved_at: string | null;
  /** Approvals above the threshold need a Super Admin. */
  requires_super_admin: boolean;
  credit_note: CreditNote | null;
  rejection_reason?: string;
}

/** Refunds above this value escalate to Super Admin approval. */
export const SUPER_ADMIN_REFUND_THRESHOLD = 10000;

export interface StockBatch {
  batch_no: string;
  quantity: number;
  expiry_date: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  reorder_level: number;
  unit_price: number;
  supplier_id: string | null;
  supplier_name: string | null;
  batches: StockBatch[];
  /** Earliest expiry across batches. */
  nearest_expiry: string | null;
}

export interface StockMovement {
  id: string;
  item_id: string;
  item_name: string;
  type: "ENTRY" | "ADJUST";
  quantity: number;
  reason: string;
  batch_no: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  active: boolean;
}
