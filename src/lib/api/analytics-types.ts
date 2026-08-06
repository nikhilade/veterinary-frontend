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
