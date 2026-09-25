/** Multi-tenant administration, subscriptions, branches, staff and master data. */

export const SUBSCRIPTION_STATUSES = ["TRIAL", "ACTIVE", "GRACE", "EXPIRED", "CANCELLED"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  city: string;
  ownerName: string;
  owner_email: string;
  phone: string;
  plan_id: string;
  plan_name: string;
  subscription_status: SubscriptionStatus;
  branches_count: number;
  staff_count: number;
  trial_ends_at: string | null;
  renews_at: string | null;
  mrr: number;
  createdAt: string;
  hospitalStatus?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tagline: string;
  price_monthly: number;
  price_yearly: number;
  branch_limit: number;
  staff_limit: number;
  features: string[];
  popular: boolean;
}

export interface ProvisionTenantPayload {
  name: string;
  city: string;
  ownerName: string;
  owner_email: string;
  phone: string;
  plan_id: string;
  billing_cycle: "MONTHLY" | "YEARLY";
  gstin?: string;
}

export interface BranchRecord {
  id: string;
  tenant_id: string;
  name: string;
  branchName?: string;
  address: string;
  city: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  openHour: number;
  closeHour: number;
  active: boolean;
}

export type AttendanceStatus = "PRESENT" | "ABSENT" | "ON_LEAVE" | "HALF_DAY";

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentName: string;
  designationName: string;
  role: string;
  branchId: string;
  branchName: string;
  employeeCode: string;
  joinDate: string;
  active: boolean;
  attendanceToday: AttendanceStatus;
  presentDays30: number;
  userStatus?: string;
  emailVerified?: boolean;
}

export interface MasterDataRecord {
  id: string;
  [key: string]: string | number | boolean | null;
}
