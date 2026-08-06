/** Shared API envelope + domain types. */

export type ApiErrorPayload = {
  code: string;
  message: string;
  data: Record<string, unknown>;
} | null;

export interface ApiMeta {
  total_count: number;
  has_next_page: boolean;
  next_cursor: string | null;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: ApiErrorPayload;
  meta: ApiMeta;
}

export const ROLES = [
  "SUPER_ADMIN",
  "HOSPITAL_ADMIN",
  "RECEPTIONIST",
  "DOCTOR",
  "LAB_TECH",
  "PHARMACIST",
  "GROOMER",
  "BILLING_STAFF",
  "PET_OWNER",
] as const;

export type Role = (typeof ROLES)[number];

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar_url: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface PetOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  pets_count: number;
  created_at: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  owner_name: string;
  name: string;
  species: "Dog" | "Cat" | "Bird" | "Rabbit";
  breed: string;
  sex: "Male" | "Female";
  age_years: number;
  weight_kg: number;
  photo_url: string | null;
  microchip_id: string | null;
  allergies?: string;
  color?: string;
  notes?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  available_slots: string[];
}

export interface AppointmentSlot {
  start_at: string;
  available: boolean;
}

export interface BranchWorkingHours {
  /** 24h clock, e.g. 9 = 09:00 */
  open_hour: number;
  close_hour: number;
  slot_minutes: number;
  /** 0 = Sunday … 6 = Saturday */
  closed_days: number[];
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  working_hours: BranchWorkingHours;
}

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type SourceChannel = "WALK_IN" | "PHONE" | "ONLINE";

export interface Appointment {
  id: string;
  pet_id: string;
  pet_name: string;
  owner_id: string;
  owner_name: string;
  doctor_id: string;
  doctor_name: string;
  service: string;
  scheduled_at: string;
  status: AppointmentStatus;
  notes: string;
  branch_id?: string;
  token_number?: number | null;
  checked_in_at?: string | null;
  source_channel?: SourceChannel;
}


export interface Prescription {
  id: string;
  pet_id: string;
  pet_name: string;
  doctor_name: string;
  medication: string;
  dosage: string;
  instructions: string;
  issued_at: string;
  refills_left: number;
}

export type InvoiceStatus = "PAID" | "DUE" | "OVERDUE";

export interface Invoice {
  id: string;
  number: string;
  owner_id: string;
  owner_name: string;
  amount: number;
  status: InvoiceStatus;
  issued_at: string;
  due_at: string;
  items: { label: string; amount: number }[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  reorder_level: number;
  unit_price: number;
}

export interface DashboardStats {
  appointments_today: number;
  active_patients: number;
  revenue_month: number;
  pending_invoices: number;
  low_stock_items: number;
  upcoming: Appointment[];
}

export interface OwnerDocument {
  id: string;
  owner_id: string;
  name: string;
  type: "ID Proof" | "Consent Form" | "Insurance" | "Lab Report" | "Other";
  size_kb: number;
  uploaded_at: string;
}

export interface CommunicationLog {
  id: string;
  owner_id: string;
  channel: "SMS" | "Email" | "Call" | "WhatsApp";
  subject: string;
  body: string;
  direction: "OUTBOUND" | "INBOUND";
  sent_at: string;
}

export interface MedicalEvent {
  id: string;
  pet_id: string;
  type: "VISIT" | "VACCINE" | "LAB" | "SURGERY" | "PRESCRIPTION" | "GROOMING";
  title: string;
  detail: string;
  doctor_name: string;
  occurred_at: string;
}

export interface Vaccine {
  id: string;
  pet_id: string;
  pet_name: string;
  owner_id: string;
  owner_name: string;
  vaccine_name: string;
  batch_no: string;
  vaccination_date: string;
  next_due_date: string;
  administered_by: string;
}

/* ---------- Clinical: doctors, consultations, prescriptions ---------- */

export interface DoctorProfile extends Doctor {
  email: string;
  phone: string;
  registration_no: string;
  branch_id: string;
  consultation_fee: number;
  bio?: string;
  active: boolean;
}

/** Weekly recurring availability. day_of_week: 0 = Sunday … 6 = Saturday */
export interface AvailabilityRule {
  day_of_week: number;
  start_hour: number;
  end_hour: number;
  enabled: boolean;
}

export interface DoctorLeave {
  id: string;
  doctor_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  type: "LEAVE" | "CONFERENCE" | "HALF_DAY";
}

export interface DoctorAvailability {
  doctor_id: string;
  rules: AvailabilityRule[];
  leaves: DoctorLeave[];
}

export interface Consultation {
  id: string;
  appointment_id: string;
  pet_id: string;
  pet_name: string;
  owner_id: string;
  doctor_id: string;
  doctor_name: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  vitals: { temperature_c: string; weight_kg: string; heart_rate: string; resp_rate: string };
  created_at: string;
}

export interface Medicine {
  id: string;
  name: string;
  strength: string;
  form: "Tablet" | "Capsule" | "Syrup" | "Injection" | "Topical" | "Chew";
  default_dosage: string;
  stock: number;
}

export interface PrescriptionItem {
  medicine_id: string;
  name: string;
  strength: string;
  form: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  notes: string;
}

export interface PrescriptionDetail extends Prescription {
  owner_id: string;
  owner_name: string;
  appointment_id: string | null;
  consultation_id: string | null;
  items: PrescriptionItem[];
}

export interface PrescriptionPdf {
  filename: string;
  mime_type: string;
  content_base64: string;
}
