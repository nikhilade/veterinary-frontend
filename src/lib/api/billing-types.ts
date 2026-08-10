/** Billing, payments, refunds, inventory and supplier domain types. */

export type LineItemType = "CONSULTATION" | "LAB" | "PHARMACY" | "GROOMING" | "MISC";

export const LINE_ITEM_TYPES: LineItemType[] = ["CONSULTATION", "LAB", "PHARMACY", "GROOMING", "MISC"];

/** Master catalogue of chargeable services, grouped by line-item type. */
export interface ChargeableItem {
  id: string;
  type: LineItemType;
  label: string;
  unitPrice: number;
  gst_rate: number;
}

export interface InvoiceLineItem {
  id: string;
  type: LineItemType;
  label: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export type InvoiceDetailStatus = "DRAFT" | "DUE" | "OVERDUE" | "PAID" | "CANCELLED";

export interface InvoiceDetail {
  id: string;
  number: string;
  ownerId: string;
  ownerName: string;
  petName: string | null;
  status: InvoiceDetailStatus;
  line_items: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  gst_rate: number;
  inter_state: boolean;
  tax: number;
  grand_total: number;
  amountPaid: number;
  /** Once GST-finalised, corrections must go through a credit note. */
  gst_finalised: boolean;
  issuedAt: string;
  dueAt: string;
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
  createdAt: string;
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
  issuedAt: string;
}

export interface Refund {
  id: string;
  invoice_id: string;
  invoice_number: string;
  ownerName: string;
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
  batchNo: string;
  quantity: number;
  expiry_date: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  reorderLevel: number;
  unitPrice: number;
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
  batchNo: string | null;
  createdAt: string;
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
