/** Billing, payments, refunds, inventory and supplier domain types. */

export type LineItemType = "CONSULTATION" | "LAB" | "PHARMACY" | "GROOMING" | "SURGERY" | "MISC";

export const LINE_ITEM_TYPES: LineItemType[] = ["CONSULTATION", "LAB", "PHARMACY", "GROOMING", "SURGERY", "MISC"];

/** Master catalogue of chargeable services, grouped by line-item type. */
export interface ChargeableItem {
  id: string;
  code: string;
  name: string;
  description: string;
  itemType: LineItemType;
  price: number;
  taxRate: number;
  active: boolean;
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
  invoiceNumber: string;
  ownerId: string;
  ownerName: string;
  petName: string | null;
  status: InvoiceDetailStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  gstRate: number;
  interState: boolean;
  tax: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  grandTotal: number;
  amountPaid: number;
  /** Once GST-finalised, corrections must go through a credit note. */
  gstFinalised: boolean;
  invoiceDate: string;
  dueDate: string;
}

export type PaymentMethod = "CASH" | "CARD" | "UPI" | "ONLINE";
/** UNKNOWN = gateway timed out. Not a failure — must be reconciled. */
export type PaymentStatus = "SUCCESS" | "FAILED" | "UNKNOWN";

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
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
  invoiceId: string;
  invoiceNumber: string;
  refundId: string;
  amount: number;
  tax: number;
  issuedAt: string;
}

export interface Refund {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  ownerName: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  requestedBy: string;
  requestedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  /** Approvals above the threshold need a Super Admin. */
  requiresSuperAdmin: boolean;
  creditNote: CreditNote | null;
  rejectionReason?: string;
}

/** Refunds above this value escalate to Super Admin approval. */
export const SUPER_ADMIN_REFUND_THRESHOLD = 10000;

export interface StockBatch {
  batchNo: string;
  quantity: number;
  expiryDate: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  reorderLevel: number;
  unitPrice: number;
  supplierId: string | null;
  supplierName: string | null;
  batches: StockBatch[];
  /** Earliest expiry across batches. */
  nearestExpiry: string | null;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: "ENTRY" | "ADJUST";
  quantity: number;
  reason: string;
  batchNo: string | null;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  active: boolean;
}
