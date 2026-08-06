import type { ApiResponse } from "../api/types";
import type {
  CreditNote,
  InvoiceDetail,
  InvoiceLineItem,
  Payment,
  PaymentMethod,
  Refund,
  StockItem,
  Supplier,
} from "../api/billing-types";
import { SUPER_ADMIN_REFUND_THRESHOLD } from "../api/billing-types";
import {
  billingCounters,
  chargeableItems,
  creditNotes,
  invoiceDetails,
  payments,
  pendingReconciliation,
  recomputeStock,
  refunds,
  stockItems,
  stockMovements,
  suppliers,
} from "./billing";

export type MockRoute = {
  pattern: RegExp;
  handler: (ctx: { method: string; body: Record<string, unknown>; query: URLSearchParams }) => ApiResponse<unknown>;
};

function envelope<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    meta: {
      total_count: Array.isArray(data) ? data.length : 1,
      has_next_page: false,
      next_cursor: null,
      limit: 50,
    },
  };
}

function failure(code: string, message: string, data: Record<string, unknown> = {}): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: { code, message, data },
    meta: { total_count: 0, has_next_page: false, next_cursor: null, limit: 50 },
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const pad = (n: number, len = 4) => String(n).padStart(len, "0");

function priceInvoice(
  lineItems: InvoiceLineItem[],
  discount: number,
  gstRate: number,
): { subtotal: number; tax: number; grand_total: number } {
  const subtotal = round2(lineItems.reduce((sum, i) => sum + i.amount, 0));
  const taxable = Math.max(0, subtotal - discount);
  const tax = round2((taxable * gstRate) / 100);
  return { subtotal, tax, grand_total: round2(taxable + tax) };
}

/** Locked invoices reject every mutation — the UI mirrors this client-side. */
function editableOrError(invoice: InvoiceDetail) {
  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    return failure(
      "ERR_INVOICE_NOT_EDITABLE",
      `Invoice ${invoice.number} is ${invoice.status.toLowerCase()} and can no longer be edited.`,
    );
  }
  return null;
}

function normaliseLineItems(raw: unknown): InvoiceLineItem[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((entry, index) => {
    const item = entry as Partial<InvoiceLineItem>;
    const quantity = Math.max(1, Number(item.quantity ?? 1));
    const unitPrice = Math.max(0, Number(item.unit_price ?? 0));
    return {
      id: item.id ?? `li_${Date.now()}_${index}`,
      type: (item.type ?? "MISC") as InvoiceLineItem["type"],
      label: String(item.label ?? "Item"),
      quantity,
      unit_price: unitPrice,
      amount: round2(quantity * unitPrice),
    };
  });
}

/* ------------------------------- payments ------------------------------- */

/** Card/online rails can time out; cash never does. Deterministic per amount. */
function simulateStatus(method: PaymentMethod, amount: number): Payment["status"] {
  if (method === "CASH") return "SUCCESS";
  const seed = Math.round(amount * 100);
  if ((method === "ONLINE" || method === "UPI") && seed % 3 === 0) return "UNKNOWN";
  if (method === "CARD" && seed % 7 === 0) return "UNKNOWN";
  return "SUCCESS";
}

function settlePayment(payment: Payment, status: "SUCCESS" | "FAILED") {
  payment.status = status;
  if (status !== "SUCCESS") return;
  const invoice = invoiceDetails.find((i) => i.id === payment.invoice_id);
  if (!invoice) return;
  invoice.amount_paid = round2(invoice.amount_paid + payment.amount);
  if (invoice.amount_paid >= invoice.grand_total - 0.5) {
    invoice.amount_paid = invoice.grand_total;
    invoice.status = "PAID";
  }
}

export const billingRoutes: MockRoute[] = [
  /* ------------------------------ invoices ------------------------------ */
  {
    pattern: /^\/billing\/chargeable-items$/,
    handler: ({ query }) => {
      const type = query.get("type");
      return envelope(type ? chargeableItems.filter((c) => c.type === type) : chargeableItems);
    },
  },
  {
    pattern: /^\/billing\/invoices\/([^/]+)$/,
    handler: ({ method, body, query }) => {
      const invoice = invoiceDetails.find((i) => i.id === query.get("__p1"));
      if (!invoice) return failure("NOT_FOUND", "Invoice not found.");
      if (method === "GET") return envelope(invoice);

      const locked = editableOrError(invoice);
      if (locked) return locked;

      if (body.status === "CANCELLED") {
        invoice.status = "CANCELLED";
        return envelope(invoice);
      }
      const lineItems = body.line_items ? normaliseLineItems(body.line_items) : invoice.line_items;
      if (!lineItems.length) return failure("ERR_NO_LINE_ITEMS", "Add at least one line item.");
      const discount = Math.max(0, Number(body.discount ?? invoice.discount));
      const gstRate = Number(body.gst_rate ?? invoice.gst_rate);
      const totals = priceInvoice(lineItems, discount, gstRate);
      Object.assign(invoice, {
        line_items: lineItems,
        discount,
        gst_rate: gstRate,
        inter_state: Boolean(body.inter_state ?? invoice.inter_state),
        ...totals,
      });
      return envelope(invoice);
    },
  },
  {
    pattern: /^\/billing\/invoices$/,
    handler: ({ method, body }) => {
      if (method !== "POST") return envelope(invoiceDetails);

      const lineItems = normaliseLineItems(body.line_items);
      if (!lineItems.length) return failure("ERR_NO_LINE_ITEMS", "Add at least one line item before invoicing.");
      const ownerId = String(body.owner_id ?? "");
      if (!ownerId) return failure("ERR_OWNER_REQUIRED", "Select the pet owner being billed.");

      const discount = Math.max(0, Number(body.discount ?? 0));
      const gstRate = Number(body.gst_rate ?? 18);
      const totals = priceInvoice(lineItems, discount, gstRate);
      if (discount > totals.subtotal) return failure("ERR_INVALID_DISCOUNT", "Discount cannot exceed the subtotal.");

      billingCounters.invoice += 1;
      const now = new Date();
      const due = new Date(now);
      due.setDate(due.getDate() + 14);

      const created: InvoiceDetail = {
        id: `binv_${billingCounters.invoice}`,
        number: `PG/INV/${pad(billingCounters.invoice)}`,
        owner_id: ownerId,
        owner_name: String(body.owner_name ?? "Walk-in client"),
        pet_name: (body.pet_name as string | undefined) ?? null,
        status: "DUE",
        line_items: lineItems,
        discount,
        gst_rate: gstRate,
        inter_state: Boolean(body.inter_state ?? false),
        amount_paid: 0,
        gst_finalised: Boolean(body.gst_finalised ?? true),
        issued_at: now.toISOString(),
        due_at: due.toISOString(),
        ...totals,
      };
      invoiceDetails.unshift(created);
      return envelope(created);
    },
  },

  /* ------------------------------ payments ------------------------------ */
  {
    pattern: /^\/payments\/reconcile$/,
    handler: ({ query, body }) => {
      const id = String(body.payment_id ?? query.get("payment_id") ?? "");
      const payment = payments.find((p) => p.id === id);
      if (!payment) return failure("NOT_FOUND", "Payment not found.");
      if (payment.status !== "UNKNOWN") return envelope(payment);

      const pending = pendingReconciliation.get(payment.id);
      if (!pending) {
        settlePayment(payment, "SUCCESS");
        return envelope(payment);
      }
      pending.polls -= 1;
      if (pending.polls <= 0) {
        pendingReconciliation.delete(payment.id);
        settlePayment(payment, pending.resolveTo);
      }
      return envelope(payment);
    },
  },
  {
    pattern: /^\/payments$/,
    handler: ({ method, body, query }) => {
      if (method !== "POST") {
        const invoiceId = query.get("invoice_id");
        return envelope(invoiceId ? payments.filter((p) => p.invoice_id === invoiceId) : payments);
      }
      const invoice = invoiceDetails.find((i) => i.id === body.invoice_id);
      if (!invoice) return failure("NOT_FOUND", "Invoice not found.");
      if (invoice.status === "PAID") return failure("ERR_INVOICE_ALREADY_PAID", "This invoice is already settled.");
      if (invoice.status === "CANCELLED") return failure("ERR_INVOICE_NOT_EDITABLE", "This invoice was cancelled.");

      const amount = round2(Number(body.amount ?? 0));
      if (amount <= 0) return failure("ERR_INVALID_AMOUNT", "Enter an amount greater than zero.");
      const outstanding = round2(invoice.grand_total - invoice.amount_paid);
      if (amount > outstanding + 0.5) {
        return failure("ERR_AMOUNT_EXCEEDS_DUE", `Amount exceeds the outstanding balance of ₹${outstanding}.`);
      }

      const method_ = String(body.method ?? "CASH").toUpperCase() as PaymentMethod;
      billingCounters.payment += 1;
      const status = simulateStatus(method_, amount);
      const payment: Payment = {
        id: `pay_${billingCounters.payment}`,
        invoice_id: invoice.id,
        invoice_number: invoice.number,
        method: method_,
        amount,
        status,
        reference: String(body.reference ?? `${method_}-${Date.now().toString().slice(-7)}`),
        created_at: new Date().toISOString(),
      };
      payments.unshift(payment);
      if (status === "UNKNOWN") {
        // Gateway timed out — resolves after a couple of reconcile polls.
        pendingReconciliation.set(payment.id, { polls: 3, resolveTo: "SUCCESS" });
      } else {
        settlePayment(payment, "SUCCESS");
      }
      return envelope(payment);
    },
  },

  /* ------------------------- refunds & credit notes ------------------------- */
  {
    pattern: /^\/refunds\/([^/]+)\/reject$/,
    handler: ({ body, query }) => {
      const refund = refunds.find((r) => r.id === query.get("__p1"));
      if (!refund) return failure("NOT_FOUND", "Refund request not found.");
      if (refund.status !== "PENDING_APPROVAL") return failure("ERR_REFUND_NOT_PENDING", "This request is already resolved.");
      refund.status = "REJECTED";
      refund.approved_by = String(body.approver_name ?? "Administrator");
      refund.approved_at = new Date().toISOString();
      refund.rejection_reason = String(body.reason ?? "Not approved.");
      return envelope(refund);
    },
  },
  {
    pattern: /^\/refunds\/([^/]+)\/approve$/,
    handler: ({ body, query }) => {
      const refund = refunds.find((r) => r.id === query.get("__p1"));
      if (!refund) return failure("NOT_FOUND", "Refund request not found.");
      if (refund.status !== "PENDING_APPROVAL") {
        return failure("ERR_REFUND_NOT_PENDING", "This request has already been resolved.");
      }
      const role = String(body.approver_role ?? "");
      if (!["HOSPITAL_ADMIN", "SUPER_ADMIN"].includes(role)) {
        return failure("ERR_APPROVAL_FORBIDDEN", "Only an administrator can approve refunds.");
      }
      if (refund.requires_super_admin && role !== "SUPER_ADMIN") {
        return failure(
          "ERR_SUPER_ADMIN_REQUIRED",
          `Refunds above ₹${SUPER_ADMIN_REFUND_THRESHOLD.toLocaleString("en-IN")} need Super Admin authorisation.`,
        );
      }

      const invoice = invoiceDetails.find((i) => i.id === refund.invoice_id);
      // GST-finalised invoices cannot be edited — issue a sequential credit note first.
      if (invoice?.gst_finalised && !refund.credit_note) {
        billingCounters.creditNote += 1;
        const taxable = round2(refund.amount / (1 + invoice.gst_rate / 100));
        const note: CreditNote = {
          id: `cn_${billingCounters.creditNote}`,
          number: `PG/CN/${pad(billingCounters.creditNote)}`,
          invoice_id: invoice.id,
          invoice_number: invoice.number,
          refund_id: refund.id,
          amount: refund.amount,
          tax: round2(refund.amount - taxable),
          issued_at: new Date().toISOString(),
        };
        creditNotes.unshift(note);
        refund.credit_note = note;
      }

      refund.status = "COMPLETED";
      refund.approved_by = String(body.approver_name ?? "Administrator");
      refund.approved_at = new Date().toISOString();
      if (invoice) invoice.amount_paid = round2(Math.max(0, invoice.amount_paid - refund.amount));
      return envelope(refund);
    },
  },
  {
    pattern: /^\/refunds$/,
    handler: ({ method, body }) => {
      if (method !== "POST") return envelope(refunds);
      const invoice = invoiceDetails.find((i) => i.id === body.invoice_id);
      if (!invoice) return failure("NOT_FOUND", "Invoice not found.");
      const amount = round2(Number(body.amount ?? 0));
      if (amount <= 0) return failure("ERR_INVALID_AMOUNT", "Enter a refund amount greater than zero.");
      if (amount > invoice.amount_paid) {
        return failure("ERR_REFUND_EXCEEDS_PAID", `Only ₹${invoice.amount_paid} has been collected on this invoice.`);
      }
      const reason = String(body.reason ?? "").trim();
      if (reason.length < 5) return failure("ERR_REASON_REQUIRED", "Give a reason of at least 5 characters.");

      const refund: Refund = {
        id: `ref_${refunds.length + 1}`,
        invoice_id: invoice.id,
        invoice_number: invoice.number,
        owner_name: invoice.owner_name,
        amount,
        reason,
        status: "PENDING_APPROVAL",
        requested_by: String(body.requested_by ?? "Billing Staff"),
        requested_at: new Date().toISOString(),
        approved_by: null,
        approved_at: null,
        requires_super_admin: amount > SUPER_ADMIN_REFUND_THRESHOLD,
        credit_note: null,
      };
      refunds.unshift(refund);
      return envelope(refund);
    },
  },
  { pattern: /^\/credit-notes$/, handler: () => envelope(creditNotes) },

  /* ------------------------------ inventory ------------------------------ */
  {
    pattern: /^\/inventory\/low-stock$/,
    handler: () => envelope(stockItems.filter((i) => i.stock <= i.reorder_level)),
  },
  {
    pattern: /^\/inventory\/expiry$/,
    handler: ({ query }) => {
      const days = Number(query.get("within_days") ?? 60);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);
      const iso = cutoff.toISOString().slice(0, 10);
      return envelope(stockItems.filter((i) => i.nearest_expiry && i.nearest_expiry <= iso));
    },
  },
  { pattern: /^\/inventory\/movements$/, handler: () => envelope(stockMovements) },
  {
    pattern: /^\/inventory\/stock\/entry$/,
    handler: ({ body }) => {
      const item = stockItems.find((i) => i.id === body.item_id);
      if (!item) return failure("NOT_FOUND", "Inventory item not found.");
      const quantity = Math.round(Number(body.quantity ?? 0));
      if (quantity <= 0) return failure("ERR_INVALID_QUANTITY", "Entry quantity must be greater than zero.");
      const batchNo = String(body.batch_no ?? "").trim();
      if (!batchNo) return failure("ERR_BATCH_REQUIRED", "Batch number is required for a stock entry.");
      const expiry = String(body.expiry_date ?? "").trim();
      if (!expiry) return failure("ERR_EXPIRY_REQUIRED", "Expiry date is required for a stock entry.");

      const existing = item.batches.find((b) => b.batch_no === batchNo);
      if (existing) existing.quantity += quantity;
      else item.batches.push({ batch_no: batchNo, quantity, expiry_date: expiry });
      if (body.unit_price) item.unit_price = Number(body.unit_price);
      recomputeStock(item);

      stockMovements.unshift({
        id: `mov_${stockMovements.length + 1}`,
        item_id: item.id,
        item_name: item.name,
        type: "ENTRY",
        quantity,
        reason: String(body.reason ?? "Stock received"),
        batch_no: batchNo,
        created_at: new Date().toISOString(),
      });
      return envelope(item);
    },
  },
  {
    pattern: /^\/inventory\/stock\/adjust$/,
    handler: ({ body }) => {
      const item = stockItems.find((i) => i.id === body.item_id);
      if (!item) return failure("NOT_FOUND", "Inventory item not found.");
      const delta = Math.round(Number(body.quantity ?? 0));
      if (!delta) return failure("ERR_INVALID_QUANTITY", "Enter a non-zero adjustment.");
      const reason = String(body.reason ?? "").trim();
      if (reason.length < 3) return failure("ERR_REASON_REQUIRED", "An adjustment reason is required.");

      const batchNo = String(body.batch_no ?? "");
      const batch = item.batches.find((b) => b.batch_no === batchNo) ?? item.batches[0];
      if (!batch) return failure("ERR_NO_BATCH", "This item has no stock batch to adjust.");
      if (batch.quantity + delta < 0) {
        return failure("ERR_INSUFFICIENT_STOCK", `Batch ${batch.batch_no} only holds ${batch.quantity} units.`);
      }
      batch.quantity += delta;
      recomputeStock(item);

      stockMovements.unshift({
        id: `mov_${stockMovements.length + 1}`,
        item_id: item.id,
        item_name: item.name,
        type: "ADJUST",
        quantity: delta,
        reason,
        batch_no: batch.batch_no,
        created_at: new Date().toISOString(),
      });
      return envelope(item);
    },
  },
  { pattern: /^\/inventory$/, handler: () => envelope(stockItems as StockItem[]) },

  /* ------------------------------ suppliers ------------------------------ */
  {
    pattern: /^\/suppliers\/([^/]+)$/,
    handler: ({ method, body, query }) => {
      const index = suppliers.findIndex((s) => s.id === query.get("__p1"));
      if (index < 0) return failure("NOT_FOUND", "Supplier not found.");
      if (method === "DELETE") {
        const [removed] = suppliers.splice(index, 1);
        return envelope(removed);
      }
      const supplier = suppliers[index]!;
      Object.assign(supplier, {
        name: String(body.name ?? supplier.name),
        contact_person: String(body.contact_person ?? supplier.contact_person),
        phone: String(body.phone ?? supplier.phone),
        email: String(body.email ?? supplier.email),
        gstin: String(body.gstin ?? supplier.gstin),
        address: String(body.address ?? supplier.address),
        active: body.active === undefined ? supplier.active : Boolean(body.active),
      });
      return envelope(supplier);
    },
  },
  {
    pattern: /^\/suppliers$/,
    handler: ({ method, body }) => {
      if (method !== "POST") return envelope(suppliers);
      const name = String(body.name ?? "").trim();
      if (!name) return failure("ERR_NAME_REQUIRED", "Supplier name is required.");
      const created: Supplier = {
        id: `sup_${suppliers.length + 1}`,
        name,
        contact_person: String(body.contact_person ?? ""),
        phone: String(body.phone ?? ""),
        email: String(body.email ?? ""),
        gstin: String(body.gstin ?? ""),
        address: String(body.address ?? ""),
        active: body.active === undefined ? true : Boolean(body.active),
      };
      suppliers.push(created);
      return envelope(created);
    },
  },
];
