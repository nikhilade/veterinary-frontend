/** Shared analytics DTOs for the admin dashboard. */

export interface AdminKpis {
  today_revenue: number;
  total_invoices: number;
  outstanding: number;
  refunds: number;
  active_patients_today: number;
  new_registrations: number;
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
  doctorId: string;
  doctorName: string;
  patients: number;
  revenue: number;
  avg_visit_value: number;
}

export interface InventoryAlerts {
  low_stock_count: number;
  expiring_30d_count: number;
  lowStockItems: { id: string; name: string; stock: number; reorderLevel: number }[];
  expiring_items: { id: string; name: string; batchNo: string; expiry_date: string; quantity: number }[];
}

export interface PaymentModeSplit {
  method: string;
  amount: number;
  count: number;
}

export interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  count: number;
}

export interface PendingInvoice {
  id: string;
  number: string;
  ownerName: string;
  petName: string | null;
  outstanding: number;
  issuedAt: string;
  dueAt: string;
  days_overdue: number;
  status: string;
}
