import type {
  ChargeableItem,
  CreditNote,
  InvoiceDetail,
  Payment,
  Refund,
  StockItem,
  StockMovement,
  Supplier,
} from "../api/billing-types";

const day = (offset: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const date = (offset: number) => day(offset).slice(0, 10);

export const chargeableItems: ChargeableItem[] = [
  { id: "chg_1", type: "CONSULTATION", label: "General consultation", unit_price: 600, gst_rate: 18 },
  { id: "chg_2", type: "CONSULTATION", label: "Specialist consultation", unit_price: 1200, gst_rate: 18 },
  { id: "chg_3", type: "CONSULTATION", label: "Follow-up visit", unit_price: 350, gst_rate: 18 },
  { id: "chg_4", type: "CONSULTATION", label: "Emergency / after-hours visit", unit_price: 2000, gst_rate: 18 },
  { id: "chg_5", type: "LAB", label: "Complete blood count (CBC)", unit_price: 850, gst_rate: 12 },
  { id: "chg_6", type: "LAB", label: "Liver function panel", unit_price: 1400, gst_rate: 12 },
  { id: "chg_7", type: "LAB", label: "Urinalysis", unit_price: 500, gst_rate: 12 },
  { id: "chg_8", type: "LAB", label: "Digital X-ray (per plate)", unit_price: 1800, gst_rate: 12 },
  { id: "chg_9", type: "PHARMACY", label: "Carprofen 75mg (strip of 10)", unit_price: 420, gst_rate: 12 },
  { id: "chg_10", type: "PHARMACY", label: "Rabies vaccine dose", unit_price: 650, gst_rate: 5 },
  { id: "chg_11", type: "PHARMACY", label: "Deworming syrup 30ml", unit_price: 240, gst_rate: 12 },
  { id: "chg_12", type: "PHARMACY", label: "IV fluids 500ml", unit_price: 380, gst_rate: 12 },
  { id: "chg_13", type: "GROOMING", label: "Full groom — small breed", unit_price: 900, gst_rate: 18 },
  { id: "chg_14", type: "GROOMING", label: "Full groom — large breed", unit_price: 1500, gst_rate: 18 },
  { id: "chg_15", type: "GROOMING", label: "Nail trim & ear clean", unit_price: 350, gst_rate: 18 },
  { id: "chg_16", type: "GROOMING", label: "Medicated bath", unit_price: 750, gst_rate: 18 },
  { id: "chg_17", type: "MISC", label: "Boarding — per night", unit_price: 800, gst_rate: 18 },
  { id: "chg_18", type: "MISC", label: "Ambulance pickup", unit_price: 1100, gst_rate: 18 },
  { id: "chg_19", type: "MISC", label: "Microchip registration", unit_price: 1600, gst_rate: 18 },
];

export const invoiceDetails: InvoiceDetail[] = [
  {
    id: "binv_1",
    number: "PG/INV/0001",
    owner_id: "own_1",
    owner_name: "Sarah Johnson",
    pet_name: "Max",
    status: "PAID",
    line_items: [
      { id: "li_1", type: "CONSULTATION", label: "General consultation", quantity: 1, unit_price: 600, amount: 600 },
      { id: "li_2", type: "LAB", label: "Complete blood count (CBC)", quantity: 1, unit_price: 850, amount: 850 },
    ],
    subtotal: 1450,
    discount: 0,
    gst_rate: 18,
    inter_state: false,
    tax: 261,
    grand_total: 1711,
    amount_paid: 1711,
    gst_finalised: true,
    issued_at: day(-24),
    due_at: day(-10),
  },
  {
    id: "binv_2",
    number: "PG/INV/0002",
    owner_id: "own_2",
    owner_name: "Ethan Brooks",
    pet_name: "Biscuit",
    status: "DUE",
    line_items: [
      { id: "li_3", type: "GROOMING", label: "Full groom — large breed", quantity: 1, unit_price: 1500, amount: 1500 },
      { id: "li_4", type: "PHARMACY", label: "Deworming syrup 30ml", quantity: 2, unit_price: 240, amount: 480 },
    ],
    subtotal: 1980,
    discount: 180,
    gst_rate: 18,
    inter_state: false,
    tax: 324,
    grand_total: 2124,
    amount_paid: 0,
    gst_finalised: true,
    issued_at: day(-3),
    due_at: day(11),
  },
  {
    id: "binv_3",
    number: "PG/INV/0003",
    owner_id: "own_3",
    owner_name: "Maya Torres",
    pet_name: "Pepper",
    status: "OVERDUE",
    line_items: [
      { id: "li_5", type: "CONSULTATION", label: "Emergency / after-hours visit", quantity: 1, unit_price: 2000, amount: 2000 },
      { id: "li_6", type: "LAB", label: "Digital X-ray (per plate)", quantity: 3, unit_price: 1800, amount: 5400 },
      { id: "li_7", type: "MISC", label: "Boarding — per night", quantity: 4, unit_price: 800, amount: 3200 },
    ],
    subtotal: 10600,
    discount: 600,
    gst_rate: 18,
    inter_state: true,
    tax: 1800,
    grand_total: 11800,
    amount_paid: 0,
    gst_finalised: true,
    issued_at: day(-40),
    due_at: day(-26),
  },
  {
    id: "binv_4",
    number: "PG/INV/0004",
    owner_id: "own_4",
    owner_name: "Liam Carter",
    pet_name: "Scout",
    status: "CANCELLED",
    line_items: [
      { id: "li_8", type: "GROOMING", label: "Nail trim & ear clean", quantity: 1, unit_price: 350, amount: 350 },
    ],
    subtotal: 350,
    discount: 0,
    gst_rate: 18,
    inter_state: false,
    tax: 63,
    grand_total: 413,
    amount_paid: 0,
    gst_finalised: false,
    issued_at: day(-14),
    due_at: day(0),
  },
];

export const payments: Payment[] = [
  {
    id: "pay_1",
    invoice_id: "binv_1",
    invoice_number: "PG/INV/0001",
    method: "UPI",
    amount: 1711,
    status: "SUCCESS",
    reference: "UPI-8841207",
    created_at: day(-24, 12),
  },
];

export const refunds: Refund[] = [
  {
    id: "ref_1",
    invoice_id: "binv_1",
    invoice_number: "PG/INV/0001",
    owner_name: "Sarah Johnson",
    amount: 850,
    reason: "Lab panel billed twice at reception.",
    status: "PENDING_APPROVAL",
    requested_by: "Billing Staff",
    requested_at: day(-2, 15),
    approved_by: null,
    approved_at: null,
    requires_super_admin: false,
    credit_note: null,
  },
];

export const creditNotes: CreditNote[] = [];

/** Sequential counters — credit notes and invoices must never reuse a number. */
export const billingCounters = { invoice: invoiceDetails.length, creditNote: 0, payment: payments.length };

/** Payments returned as UNKNOWN, with the poll count that resolves them. */
export const pendingReconciliation = new Map<string, { polls: number; resolveTo: "SUCCESS" | "FAILED" }>();

export const suppliers: Supplier[] = [
  {
    id: "sup_1",
    name: "VetMed Distributors Pvt Ltd",
    contact_person: "Rahul Menon",
    phone: "+91 98200 41122",
    email: "orders@vetmeddist.in",
    gstin: "27AABCV1234F1Z5",
    address: "Plot 14, MIDC Andheri, Mumbai 400093",
    active: true,
  },
  {
    id: "sup_2",
    name: "PawCare Supplies",
    contact_person: "Nisha Verma",
    phone: "+91 99100 77341",
    email: "sales@pawcaresupplies.in",
    gstin: "07AAGCP8899K1ZP",
    address: "B-22 Okhla Phase 1, New Delhi 110020",
    active: true,
  },
  {
    id: "sup_3",
    name: "Northline Pharma",
    contact_person: "Arjun Rao",
    phone: "+91 98450 22890",
    email: "arjun@northlinepharma.com",
    gstin: "29AACCN4455L1Z2",
    address: "45 Industrial Layout, Bengaluru 560058",
    active: false,
  },
];

export const stockItems: StockItem[] = [
  {
    id: "itm_1",
    name: "Carprofen 75mg (100ct)",
    category: "Pharmacy",
    stock: 12,
    reorder_level: 10,
    unit_price: 420,
    supplier_id: "sup_1",
    supplier_name: "VetMed Distributors Pvt Ltd",
    batches: [
      { batch_no: "CRP-8821", quantity: 4, expiry_date: date(21) },
      { batch_no: "CRP-9014", quantity: 8, expiry_date: date(210) },
    ],
    nearest_expiry: date(21),
  },
  {
    id: "itm_2",
    name: "Rabies Vaccine",
    category: "Vaccines",
    stock: 6,
    reorder_level: 15,
    unit_price: 650,
    supplier_id: "sup_1",
    supplier_name: "VetMed Distributors Pvt Ltd",
    batches: [{ batch_no: "RB-2291", quantity: 6, expiry_date: date(48) }],
    nearest_expiry: date(48),
  },
  {
    id: "itm_3",
    name: "Surgical Gloves (Box)",
    category: "Supplies",
    stock: 40,
    reorder_level: 20,
    unit_price: 340,
    supplier_id: "sup_2",
    supplier_name: "PawCare Supplies",
    batches: [{ batch_no: "SG-5510", quantity: 40, expiry_date: date(640) }],
    nearest_expiry: date(640),
  },
  {
    id: "itm_4",
    name: "Hypoallergenic Shampoo",
    category: "Grooming",
    stock: 8,
    reorder_level: 12,
    unit_price: 480,
    supplier_id: "sup_2",
    supplier_name: "PawCare Supplies",
    batches: [{ batch_no: "HS-1180", quantity: 8, expiry_date: date(-6) }],
    nearest_expiry: date(-6),
  },
  {
    id: "itm_5",
    name: "IV Fluid Bag 500ml",
    category: "Supplies",
    stock: 34,
    reorder_level: 15,
    unit_price: 380,
    supplier_id: "sup_3",
    supplier_name: "Northline Pharma",
    batches: [
      { batch_no: "IV-7702", quantity: 14, expiry_date: date(75) },
      { batch_no: "IV-7811", quantity: 20, expiry_date: date(300) },
    ],
    nearest_expiry: date(75),
  },
  {
    id: "itm_6",
    name: "Deworming Syrup 30ml",
    category: "Pharmacy",
    stock: 5,
    reorder_level: 18,
    unit_price: 240,
    supplier_id: "sup_1",
    supplier_name: "VetMed Distributors Pvt Ltd",
    batches: [{ batch_no: "DW-3390", quantity: 5, expiry_date: date(12) }],
    nearest_expiry: date(12),
  },
];

export const stockMovements: StockMovement[] = [
  {
    id: "mov_1",
    item_id: "itm_2",
    item_name: "Rabies Vaccine",
    type: "ENTRY",
    quantity: 10,
    reason: "Purchase order PO-4471",
    batch_no: "RB-2291",
    created_at: day(-30, 11),
  },
  {
    id: "mov_2",
    item_id: "itm_4",
    item_name: "Hypoallergenic Shampoo",
    type: "ADJUST",
    quantity: -2,
    reason: "Damaged in transit",
    batch_no: "HS-1180",
    created_at: day(-9, 16),
  },
];

export function recomputeStock(item: StockItem) {
  item.stock = item.batches.reduce((sum, b) => sum + b.quantity, 0);
  const sorted = [...item.batches].filter((b) => b.quantity > 0).sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));
  item.nearest_expiry = sorted[0]?.expiry_date ?? null;
}
