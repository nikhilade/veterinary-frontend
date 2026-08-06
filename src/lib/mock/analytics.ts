/** Analytics aggregates for the admin dashboard. Mock layer only. */

import type { ApiResponse } from "../api/types";
import { invoiceDetails, payments } from "./billing";
import { doctors } from "./data";

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

/** Deterministic pseudo-random so numbers look stable between polls. */
function seeded(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function dayIso(offset: number) {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

export interface AdminKpis {
  today_revenue: number;
  total_invoices: number;
  outstanding: number;
  refunds: number;
  active_patients_today: number;
  new_registrations: number;
  /** Percent change vs. the previous comparable period. */
  deltas: Record<string, number>;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface ServiceRevenue {
  service: string;
  revenue: number;
}

export interface DoctorPerformance {
  doctor_id: string;
  doctor_name: string;
  patients: number;
  revenue: number;
  avg_visit_value: number;
}

export interface InventoryAlerts {
  low_stock_count: number;
  expiring_30d_count: number;
  low_stock_items: { id: string; name: string; stock: number; reorder_level: number }[];
  expiring_items: { id: string; name: string; batch_no: string; expiry_date: string; quantity: number }[];
}

export interface PaymentModeSplit {
  method: string;
  amount: number;
  count: number;
}

export interface HeatmapCell {
  day_of_week: number;
  hour: number;
  count: number;
}

export interface PendingInvoice {
  id: string;
  number: string;
  owner_name: string;
  pet_name: string | null;
  outstanding: number;
  issued_at: string;
  due_at: string;
  days_overdue: number;
  status: string;
}

function buildKpis(): AdminKpis {
  const tick = Math.floor(Date.now() / 15000);
  const unpaid = invoiceDetails.filter((i) => i.status === "DUE" || i.status === "OVERDUE");
  return {
    today_revenue: 18400 + Math.round(seeded(tick) * 2600),
    total_invoices: invoiceDetails.length + 118,
    outstanding: unpaid.reduce((s, i) => s + (i.grand_total - i.amount_paid), 0) + 24600,
    refunds: 3820,
    active_patients_today: 26 + Math.round(seeded(tick + 7) * 8),
    new_registrations: 5 + Math.round(seeded(tick + 13) * 4),
    deltas: {
      today_revenue: 12.4,
      total_invoices: 6.1,
      outstanding: -4.8,
      refunds: 2.3,
      active_patients_today: 9.7,
      new_registrations: -3.2,
    },
  };
}

function buildRevenueDaily(): RevenuePoint[] {
  return Array.from({ length: 30 }, (_, i) => {
    const offset = i - 29;
    const base = 14000 + seeded(i * 3.7) * 12000;
    const weekendDip = [0, 6].includes(new Date(dayIso(offset)).getDay()) ? 0.65 : 1;
    return { date: dayIso(offset).slice(0, 10), revenue: Math.round((base * weekendDip) / 50) * 50 };
  });
}

function buildRevenueByService(): ServiceRevenue[] {
  return [
    { service: "Consultation", revenue: 186400 },
    { service: "Pharmacy", revenue: 124900 },
    { service: "Laboratory", revenue: 92300 },
    { service: "Grooming", revenue: 61200 },
    { service: "Surgery", revenue: 48700 },
  ];
}

function buildDoctorPerformance(): DoctorPerformance[] {
  return doctors.map((d, i) => {
    const patients = 42 + Math.round(seeded(i * 5.3) * 60);
    const revenue = Math.round((patients * (780 + seeded(i * 2.1) * 900)) / 10) * 10;
    return {
      doctor_id: d.id,
      doctor_name: d.name,
      patients,
      revenue,
      avg_visit_value: Math.round(revenue / patients),
    };
  });
}

function buildInventoryAlerts(): InventoryAlerts {
  const low = [
    { id: "stk_1", name: "Amoxicillin 250mg", stock: 8, reorder_level: 25 },
    { id: "stk_2", name: "Rabies vaccine vial", stock: 4, reorder_level: 15 },
    { id: "stk_3", name: "Surgical gloves (M)", stock: 12, reorder_level: 40 },
    { id: "stk_4", name: "IV fluid — Ringer lactate", stock: 6, reorder_level: 20 },
  ];
  const expiring = [
    { id: "stk_2", name: "Rabies vaccine vial", batch_no: "RB-2291", expiry_date: dayIso(9).slice(0, 10), quantity: 4 },
    { id: "stk_5", name: "Deworming syrup 30ml", batch_no: "DW-1180", expiry_date: dayIso(17).slice(0, 10), quantity: 11 },
    { id: "stk_6", name: "Tick spot-on (large)", batch_no: "TS-0455", expiry_date: dayIso(26).slice(0, 10), quantity: 7 },
  ];
  return {
    low_stock_count: low.length,
    expiring_30d_count: expiring.length,
    low_stock_items: low,
    expiring_items: expiring,
  };
}

function buildPaymentModes(): PaymentModeSplit[] {
  const base: Record<string, { amount: number; count: number }> = {
    CASH: { amount: 42800, count: 61 },
    CARD: { amount: 68400, count: 47 },
    UPI: { amount: 91200, count: 118 },
    ONLINE: { amount: 37600, count: 29 },
  };
  payments
    .filter((p) => p.status === "SUCCESS")
    .forEach((p) => {
      const row = base[p.method];
      if (row) {
        row.amount += p.amount;
        row.count += 1;
      }
    });
  return Object.entries(base).map(([method, v]) => ({ method, ...v }));
}

function buildHeatmap(): HeatmapCell[] {
  const tick = Math.floor(Date.now() / 15000);
  const cells: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 9; hour <= 19; hour++) {
      const peak = hour >= 10 && hour <= 12 ? 1.7 : hour >= 16 && hour <= 18 ? 1.5 : 0.8;
      const weekend = day === 0 ? 0.35 : day === 6 ? 0.9 : 1;
      const noise = seeded(day * 31 + hour * 7 + (day === new Date().getDay() ? tick % 3 : 0));
      cells.push({ day_of_week: day, hour, count: Math.round(peak * weekend * (2 + noise * 8)) });
    }
  }
  return cells;
}

function buildPendingInvoices(): PendingInvoice[] {
  const now = Date.now();
  const extra: PendingInvoice[] = Array.from({ length: 9 }, (_, i) => {
    const issued = dayIso(-(6 + i * 4));
    const due = dayIso(-(i * 3));
    return {
      id: `pinv_${i + 1}`,
      number: `PG/INV/0${105 + i}`,
      owner_name: [
        "Aarav Mehta",
        "Sofia Ramos",
        "Kabir Sethi",
        "Nina Fischer",
        "Rohan Iyer",
        "Grace O'Neill",
        "Dev Patel",
        "Hana Suzuki",
        "Marco Rossi",
      ][i]!,
      pet_name: ["Nutmeg", "Olive", "Rocky", "Mochi", "Simba", "Waffles", "Tofu", "Yuki", "Bruno"][i]!,
      outstanding: Math.round((1200 + seeded(i * 4.4) * 9000) / 10) * 10,
      issued_at: issued,
      due_at: due,
      days_overdue: Math.max(0, Math.round((now - new Date(due).getTime()) / 86400000)),
      status: i % 3 === 0 ? "OVERDUE" : "DUE",
    };
  });

  const fromBilling: PendingInvoice[] = invoiceDetails
    .filter((i) => i.status === "DUE" || i.status === "OVERDUE")
    .map((i) => ({
      id: i.id,
      number: i.number,
      owner_name: i.owner_name,
      pet_name: i.pet_name,
      outstanding: i.grand_total - i.amount_paid,
      issued_at: i.issued_at,
      due_at: i.due_at,
      days_overdue: Math.max(0, Math.round((now - new Date(i.due_at).getTime()) / 86400000)),
      status: i.status,
    }));

  return [...fromBilling, ...extra]
    .sort((a, b) => new Date(a.issued_at).getTime() - new Date(b.issued_at).getTime())
    .slice(0, 10);
}

export const analyticsRoutes: MockRoute[] = [
  { pattern: /^\/analytics\/kpis$/, handler: () => envelope(buildKpis()) },
  { pattern: /^\/analytics\/revenue\/daily$/, handler: () => envelope(buildRevenueDaily()) },
  { pattern: /^\/analytics\/revenue\/by-service$/, handler: () => envelope(buildRevenueByService()) },
  { pattern: /^\/analytics\/doctor-performance$/, handler: () => envelope(buildDoctorPerformance()) },
  { pattern: /^\/analytics\/inventory-alerts$/, handler: () => envelope(buildInventoryAlerts()) },
  { pattern: /^\/analytics\/payment-modes$/, handler: () => envelope(buildPaymentModes()) },
  { pattern: /^\/analytics\/appointment-heatmap$/, handler: () => envelope(buildHeatmap()) },
  { pattern: /^\/analytics\/pending-invoices$/, handler: () => envelope(buildPendingInvoices()) },
];
