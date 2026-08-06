import type { Role } from "../api/types";

export type Permission =
  | "portal:access"
  | "staff:access"
  | "owners:read"
  | "owners:write"
  | "pets:read"
  | "pets:write"
  | "appointments:read"
  | "appointments:write"
  | "doctors:read"
  | "doctors:write"
  | "consultations:read"
  | "consultations:write"
  | "prescriptions:write"
  | "billing:read"
  | "billing:write"
  | "payments:write"
  | "refunds:request"
  | "refunds:approve"
  | "suppliers:read"
  | "suppliers:write"
  | "inventory:read"
  | "inventory:write"

  | "lab:read"
  | "lab:write"
  | "pharmacy:read"
  | "pharmacy:write"
  | "grooming:read"
  | "reports:read"
  | "settings:write"
  | "tenants:manage"
  | "branches:read"
  | "branches:write"
  | "staff:read"
  | "staff:write"
  | "masterdata:read"
  | "masterdata:write";

const ALL_STAFF: Permission[] = [
  "staff:access",
  "owners:read",
  "owners:write",
  "pets:read",
  "pets:write",
  "appointments:read",
  "appointments:write",
  "doctors:read",
  "doctors:write",
  "consultations:read",
  "consultations:write",
  "prescriptions:write",
  "billing:read",
  "billing:write",
  "payments:write",
  "refunds:request",
  "refunds:approve",
  "suppliers:read",
  "suppliers:write",
  "inventory:read",
  "inventory:write",

  "lab:read",
  "lab:write",
  "pharmacy:read",
  "pharmacy:write",
  "grooming:read",
  "reports:read",
  "settings:write",
  "branches:read",
  "branches:write",
  "staff:read",
  "staff:write",
  "masterdata:read",
  "masterdata:write",
];

export const rolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: [...ALL_STAFF, "tenants:manage"],
  HOSPITAL_ADMIN: ALL_STAFF,
  RECEPTIONIST: [
    "staff:access",
    "owners:read",
    "owners:write",
    "pets:read",
    "pets:write",
    "appointments:read",
    "appointments:write",
    "doctors:read",
    "billing:read",
    "payments:write",
  ],
  DOCTOR: [
    "staff:access",
    "owners:read",
    "pets:read",
    "pets:write",
    "appointments:read",
    "appointments:write",
    "doctors:read",
    "consultations:read",
    "consultations:write",
    "prescriptions:write",
    "lab:read",
    "pharmacy:read",
  ],
  LAB_TECH: ["staff:access", "pets:read", "appointments:read", "lab:read", "lab:write"],
  PHARMACIST: [
    "staff:access",
    "pets:read",
    "pharmacy:read",
    "pharmacy:write",
    "prescriptions:write",
    "inventory:read",
    "inventory:write",
    "suppliers:read",
  ],
  GROOMER: ["staff:access", "pets:read", "appointments:read", "grooming:read"],
  BILLING_STAFF: [
    "staff:access",
    "owners:read",
    "billing:read",
    "billing:write",
    "payments:write",
    "refunds:request",
    "reports:read",
  ],

  PET_OWNER: ["portal:access"],
};

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  HOSPITAL_ADMIN: "Hospital Admin",
  RECEPTIONIST: "Receptionist",
  DOCTOR: "Doctor",
  LAB_TECH: "Lab Technician",
  PHARMACIST: "Pharmacist",
  GROOMER: "Groomer",
  BILLING_STAFF: "Billing Staff",
  PET_OWNER: "Pet Owner",
};

export function can(role: Role | null | undefined, permission: Permission) {
  if (!role) return false;
  return rolePermissions[role].includes(permission);
}

export function canAny(role: Role | null | undefined, permissions: Permission[]) {
  return permissions.some((p) => can(role, p));
}

/** Where a role lands after login. */
export function homeRouteFor(role: Role) {
  return role === "PET_OWNER" ? "/portal/dashboard" : "/app/dashboard";
}
