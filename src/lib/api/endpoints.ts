/**
 * Central endpoint map — the ONLY place URLs live.
 *
 * Switching from mocks to the real backend:
 *   1. set VITE_API_BASE_URL="https://api.example.com"
 *   2. delete src/lib/mock/*  (and the mock import in src/lib/api-client.ts)
 * No component changes required.
 */
export const endpoints = {
  auth: {
    login: "/auth/login",
    signup: "/auth/signup",
    me: "/auth/me",
    logout: "/auth/logout",
  },
  petOwners: {
    list: "/pet-owners",
    search: "/pet-owners/search",
    detail: (id: string) => `/pet-owners/${id}`,
    create: "/pet-owners",
    update: (id: string) => `/pet-owners/${id}`,
    lookupOrCreate: "/pet-owners/lookup-or-create",
    documents: (id: string) => `/pet-owners/${id}/documents`,
    communications: (id: string) => `/pet-owners/${id}/communications`,
  },
  pets: {
    list: "/pets",
    detail: (id: string) => `/pets/${id}`,
    create: "/pets",
    byOwner: (ownerId: string) => `/pet-owners/${ownerId}/pets`,
    lookupOrCreate: "/pets/lookup-or-create",
    update: (id: string) => `/pets/${id}`,
    history: (id: string) => `/pets/history/${id}`,
  },
  vaccines: {
    list: "/vaccines",
    due: "/vaccines/due",
    create: "/vaccines",
    byPet: (petId: string) => `/pets/${petId}/vaccines`,
  },
  doctors: {
    list: "/doctors",
    detail: (id: string) => `/doctors/${id}`,
    create: "/doctors",
    update: (id: string) => `/doctors/${id}`,
    availability: (id: string) => `/doctors/${id}/availability`,
    leave: (id: string) => `/doctors/${id}/leave`,
  },
  medicines: {
    list: "/medicines",
  },
  consultations: {
    list: "/consultations",
    create: "/consultations",
    detail: (id: string) => `/consultations/${id}`,
  },
  branches: {
    list: "/branches",
  },

  appointments: {
    list: "/appointments",
    detail: (id: string) => `/appointments/${id}`,
    create: "/appointments",
    mine: "/appointments/mine",
    availableSlots: "/appointments/slots/available",
    queue: "/appointments/queue",
    checkIn: (id: string) => `/appointments/${id}/check-in`,
    status: (id: string) => `/appointments/${id}/status`,
    reschedule: (id: string) => `/appointments/${id}/reschedule`,
    cancel: (id: string) => `/appointments/${id}/cancel`,
  },

  prescriptions: {
    list: "/prescriptions",
    mine: "/prescriptions/mine",
    create: "/prescriptions",
    detail: (id: string) => `/prescriptions/${id}`,
    pdf: (id: string) => `/prescriptions/${id}/pdf`,
  },

  invoices: {
    list: "/invoices",
    detail: (id: string) => `/invoices/${id}`,
    mine: "/invoices/mine",
  },
  billing: {
    chargeableItems: "/billing/chargeable-items",
    invoices: "/billing/invoices",
    invoice: (id: string) => `/billing/invoices/${id}`,
  },
  payments: {
    list: "/payments",
    create: "/payments",
    reconcile: "/payments/reconcile",
  },
  refunds: {
    list: "/refunds",
    create: "/refunds",
    approve: (id: string) => `/refunds/${id}/approve`,
    reject: (id: string) => `/refunds/${id}/reject`,
  },
  creditNotes: {
    list: "/credit-notes",
  },
  inventory: {
    list: "/inventory",
    lowStock: "/inventory/low-stock",
    expiry: "/inventory/expiry",
    stockEntry: "/inventory/stock/entry",
    stockAdjust: "/inventory/stock/adjust",
    movements: "/inventory/movements",
  },
  suppliers: {
    list: "/suppliers",
    create: "/suppliers",
    detail: (id: string) => `/suppliers/${id}`,
  },
  reports: {
    overview: "/reports/overview",
  },
  analytics: {
    kpis: "/analytics/kpis",
    revenueDaily: "/analytics/revenue/daily",
    revenueByService: "/analytics/revenue/by-service",
    doctorPerformance: "/analytics/doctor-performance",
    inventoryAlerts: "/analytics/inventory-alerts",
    paymentModes: "/analytics/payment-modes",
    appointmentHeatmap: "/analytics/appointment-heatmap",
    pendingInvoices: "/analytics/pending-invoices",
  },

  dashboard: {
    staff: "/dashboard/staff",
    portal: "/dashboard/portal",
  },

  tenants: {
    list: "/admin/tenants",
    provision: "/tenants/provision",
  },
  subscriptions: {
    plans: "/subscriptions/plans",
    upgrade: (planId: string) => `/subscriptions/${planId}/upgrade`,
  },
  branchAdmin: {
    list: "/branches",
    create: "/branches",
    detail: (id: string) => `/branches/${id}`,
  },
  staff: {
    list: "/staff",
    create: "/staff",
    detail: (id: string) => `/staff/${id}`,
    attendance: (id: string) => `/staff/${id}/attendance`,
  },
  masterData: {
    list: (resource: string) => `/master-data/${resource}`,
    create: (resource: string) => `/master-data/${resource}`,
    detail: (resource: string, id: string) => `/master-data/${resource}/${id}`,
  },
} as const;
