/** Shared API envelope + domain types. */

export type ApiErrorPayload = {
  code: string;
  message: string;
  data: Record<string, unknown>;
} | null;

export interface ApiMeta {
  totalCount: number;
  hasNextPage: boolean;
  nextCursor: string | null;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
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
  avatarUrl: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface PetOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  pets?: Pet[];
  petsCount?: number;
  createdAt: string;
}

export interface Pet {
  id: string;
  ownerId: string;
  ownerName?: string;
  petName: string;
  speciesId: string;
  breedId: string;
  gender: "Male" | "Female";
  age: number;
  weightKg: number;
  photoUrl: string | null;
  microchipNumber: string | null;
  allergies?: string;
  color?: string;
  notes?: string;
  dateOfBirth?: string;
  status?: string;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  status: string;
  consultationFee: number;
  consultationDurationMin: number;
  employeeCode?: string;
}

export interface AppointmentSlot {
  startAt: string;
  available: boolean;
}

export interface BranchWorkingHours {
  /** 24h clock, e.g. 9 = 09:00 */
  openHour: number;
  closeHour: number;
  slotMinutes: number;
  /** 0 = Sunday … 6 = Saturday */
  closedDays: number[];
}

export interface Branch {
  id: string;
  hospitalId: string;
  hospitalName: string;
  branchName: string;
  branchCode: string;
  email: string;
  phone: string;
  addressLine1: string;
  stateId: string;
  stateName: string;
  cityId: string;
  cityName: string;
  pincode: string;
  country: string;
  latitude: number;
  longitude: number;
  isHeadBranch: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
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
  petId: string;
  petName: string;
  ownerId: string;
  ownerName: string;
  doctorId: string;
  doctorName: string;
  service: string;
  scheduledAt: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string;
  branchId?: string;
  tokenNumber?: number | null;
  checkedInAt?: string | null;
  sourceChannel?: SourceChannel;
}


export interface Prescription {
  id: string;
  petId: string;
  petName: string;
  doctorName: string;
  medication: string;
  dosage: string;
  instructions: string;
  issuedAt: string;
  refillsLeft: number;
}

export type InvoiceStatus = "PAID" | "DUE" | "OVERDUE";

export interface Invoice {
  id: string;
  number: string;
  ownerId: string;
  ownerName: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
  items: { label: string; amount: number }[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  reorderLevel: number;
  unitPrice: number;
}

export interface DashboardStats {
  appointmentsToday: number;
  activePatients: number;
  revenueMonth: number;
  pendingInvoices: number;
  lowStockItems: number;
  upcoming: Appointment[];
}

export interface OwnerDocument {
  id: string;
  ownerId: string;
  name: string;
  type: "ID Proof" | "Consent Form" | "Insurance" | "Lab Report" | "Other";
  sizeKb: number;
  uploadedAt: string;
}

export interface CommunicationLog {
  id: string;
  ownerId: string;
  communicationType: string;
  messageContent: string;
  sentAt: string;
  status: string;
}

export interface MedicalEvent {
  id: string;
  petId: string;
  type: "VISIT" | "VACCINE" | "LAB" | "SURGERY" | "PRESCRIPTION" | "GROOMING";
  title: string;
  detail: string;
  doctorName: string;
  occurredAt: string;
}

export interface Vaccine {
  id: string;
  petId: string;
  petName: string;
  ownerId: string;
  ownerName: string;
  vaccineName: string;
  batchNo: string;
  vaccinationDate: string;
  nextDueDate: string;
  administeredBy: string;
}

/* ---------- Clinical: doctors, consultations, prescriptions ---------- */

export interface DoctorProfile extends Doctor {
  dob?: string;
  joiningDate?: string;
}

/** Backend DayOfWeek enum */
export type BackendDayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface DoctorScheduleResponse {
  id: string;
  doctorId: string;
  doctorName?: string;
  dayOfWeek: BackendDayOfWeek;
  startTime: string; // "09:00:00"
  endTime: string;   // "17:00:00"
}

export interface AddDoctorScheduleRequest {
  doctorId: string;
  dayOfWeek: BackendDayOfWeek;
  startTime: string;
  endTime: string;
}

export interface UpdateDoctorScheduleRequest {
  dayOfWeek: BackendDayOfWeek;
  startTime: string;
  endTime: string;
}

export type LeaveType =
  | "CASUAL"
  | "SICK"
  | "EARNED"
  | "MATERNITY"
  | "PATERNITY"
  | "UNPAID"
  | "EMERGENCY"
  | "OTHER";

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface StaffLeaveRequestDto {
  staffId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string;
}

export interface StaffLeaveSearchRequestDto {
  hospitalId?: string;
  branchId?: string;
  staffId?: string;
  leaveType?: LeaveType;
  status?: LeaveStatus;
  startDate?: string;
  endDate?: string;
  employeeCode?: string;
  search?: string;
}

export interface StaffLeaveResponseDto {
  id: string;
  staffId: string;
  employeeCode?: string;
  staffName?: string;
  department?: string;
  designation?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays?: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  attachmentUrl?: string;
}

/** Weekly recurring availability. dayOfWeek: 0 = Sunday … 6 = Saturday */
export interface AvailabilityRule {
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  enabled: boolean;
}

export interface DoctorLeave {
  id: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: "LEAVE" | "CONFERENCE" | "HALF_DAY";
}

export interface DoctorAvailability {
  doctorId: string;
  rules: AvailabilityRule[];
  leaves: DoctorLeave[];
}

export interface Consultation {
  id: string;
  appointmentId: string;
  petId: string;
  petName: string;
  ownerId: string;
  doctorId: string;
  doctorName: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  vitals: { temperatureC: string; weightKg: string; heartRate: string; respRate: string };
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  strength: string;
  form: "Tablet" | "Capsule" | "Syrup" | "Injection" | "Topical" | "Chew";
  defaultDosage: string;
  stock: number;
}

export interface PrescriptionItem {
  medicineId: string;
  name: string;
  strength: string;
  form: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  notes: string;
}

export interface PrescriptionDetail extends Prescription {
  ownerId: string;
  ownerName: string;
  appointmentId: string | null;
  consultationId: string | null;
  items: PrescriptionItem[];
}

export interface PrescriptionPdf {
  filename: string;
  mimeType: string;
  contentBase64: string;
}
