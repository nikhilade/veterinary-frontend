/**
 * Central endpoint map — the ONLY place URLs live.
 *
 * Paths target the Java Spring Boot backend (see frontend_integration_plan.md):
 * everything is prefixed with /api/v1 and points at the real controllers.
 * While VITE_API_BASE_URL is unset, src/lib/api/adapter.ts translates these
 * back to the in-memory mock layer, so switching to the real backend is just:
 *   1. set VITE_API_BASE_URL="https://api.example.com"
 *   2. delete src/lib/mock/*  (and the mock import in src/lib/api-client.ts)
 * No component changes required.
 */
const V1 = "/api/v1";

export const endpoints = {
  auth: {
    login: "/api/auth/login",
    signup: "/api/auth/signup",
    me: "/api/auth/me",
    logout: "/api/auth/logout",
  },
  files: {
    upload: `${V1}/files/upload`,
  },
  hospitals: {
    list: `${V1}/hospitals`,
  },
  petOwners: {
    list: `${V1}/pet-owners`,
    search: `${V1}/pet-owners/search`,
    detail: (id: string) => `${V1}/pet-owners/${id}`,
    create: `${V1}/pet-owners`,
    update: (id: string) => `${V1}/pet-owners/${id}`,
    delete: (id: string) => `${V1}/pet-owners/${id}`,
    lookupOrCreate: `${V1}/pet-owners/lookup-or-create`,
    documents: (id: string) => `${V1}/pet-owners/${id}/documents`,
    communications: (id: string) => `${V1}/pet-owners/${id}/communications`,
  },
  pets: {
    list: `${V1}/pets`,
    detail: (id: string) => `${V1}/pets/${id}`,
    create: `${V1}/pets`,
    byOwner: (ownerId: string) => `${V1}/pet-owners/${ownerId}/pets`,
    lookupOrCreate: `${V1}/pets/lookup-or-create`,
    update: (id: string) => `${V1}/pets/${id}`,
    delete: (id: string) => `${V1}/pets/${id}`,
    history: (id: string) => `${V1}/pets/history/${id}`,
  },
  vaccines: {
    list: `${V1}/vaccinations`,
    due: `${V1}/vaccinations/due`,
    create: `${V1}/vaccinations`,
    update: (id: string) => `${V1}/vaccinations/${id}`,
    delete: (id: string) => `${V1}/vaccinations/${id}`,
    byPet: (petId: string) => `${V1}/vaccinations/pet/${petId}`,
  },
  doctors: {
    list: `${V1}/doctors`,
    detail: (id: string) => `${V1}/doctors/${id}`,
    create: `${V1}/doctors`,
    update: (id: string) => `${V1}/doctors/${id}`,
    availability: (id: string) => `${V1}/doctors/${id}/availability`,
    /** StaffLeaveController — queried by staff id. */
    leave: (id: string) => `${V1}/staff-leaves/search/${id}`,
  },
  doctorSchedules: {
    byDoctor: (doctorId: string) => `${V1}/doctor-schedules/doctor/${doctorId}`,
    create: `${V1}/doctor-schedules`,
    update: (scheduleId: string) => `${V1}/doctor-schedules/${scheduleId}`,
    delete: (scheduleId: string) => `${V1}/doctor-schedules/${scheduleId}`,
    getById: (scheduleId: string) => `${V1}/doctor-schedules/${scheduleId}`,
  },
  leaves: {
    search: `${V1}/staff-leaves/search`,
    apply: `${V1}/staff-leaves`,
    cancel: (leaveId: string) => `${V1}/staff-leaves/${leaveId}/cancel`,
    approve: (leaveId: string) => `${V1}/staff-leaves/${leaveId}/approve`,
    reject: (leaveId: string) => `${V1}/staff-leaves/${leaveId}/reject`,
    getById: (leaveId: string) => `${V1}/staff-leaves/${leaveId}`,
  },
  medicines: {
    /** Inventory items filtered to the medicine category on the frontend. */
    list: `${V1}/inventory/items`,
  },
  consultations: {
    list: `${V1}/consultations`,
    create: `${V1}/consultations`,
    detail: (id: string) => `${V1}/consultations/${id}`,
  },
  branches: {
    list: `${V1}/branches`,
  },

  appointments: {
    list: `${V1}/appointments`,
    detail: (id: string) => `${V1}/appointments/${id}`,
    create: `${V1}/appointments`,
    /** POST — user constraints go in the request body. */
    mine: `${V1}/appointments/search`,
    availableSlots: `${V1}/appointments/slots/available`,
    /** ReceptionQueueController */
    queue: `${V1}/reception/queue`,
    checkIn: `${V1}/reception/check-in`,
    callNext: `${V1}/reception/call-next`,
    skip: (id: string) => `${V1}/reception/${id}/skip`,
    recall: (id: string) => `${V1}/reception/${id}/recall`,
    complete: (id: string) => `${V1}/reception/${id}/complete`,
    noShow: (id: string) => `${V1}/reception/${id}/no-show`,
    status: (id: string) => `${V1}/appointments/${id}/status`,
    reschedule: (id: string) => `${V1}/appointments/${id}/reschedule`,
    cancel: (id: string) => `${V1}/appointments/${id}/cancel`,
  },

  prescriptions: {
    list: `${V1}/prescriptions`,
    mine: `${V1}/prescriptions/mine`,
    create: `${V1}/prescriptions`,
    detail: (id: string) => `${V1}/prescriptions/${id}`,
    pdf: (id: string) => `${V1}/prescriptions/${id}/pdf`,
  },

  invoices: {
    list: `${V1}/invoices`,
    detail: (id: string) => `${V1}/invoices/${id}`,
    mine: `${V1}/invoices/mine`,
  },
  billing: {
    chargeableItems: `${V1}/billing/chargeable-items`,
    invoices: `${V1}/billing/invoices`,
    invoice: (id: string) => `${V1}/billing/invoices/${id}`,
    invoiceStatus: (id: string) => `${V1}/billing/invoices/${id}/status`,
  },
  payments: {
    list: `${V1}/payments`,
    create: `${V1}/payments`,
    reconcile: `${V1}/payments/reconcile`,
  },
  refunds: {
    list: `${V1}/refunds`,
    create: `${V1}/refunds`,
    approve: (id: string) => `${V1}/refunds/${id}/approve`,
    reject: (id: string) => `${V1}/refunds/${id}/reject`,
  },
  creditNotes: {
    list: `${V1}/credit-notes`,
  },
  inventory: {
    list: `${V1}/inventory`,
    lowStock: `${V1}/inventory/low-stock`,
    expiry: `${V1}/inventory/expiry`,
    stockEntry: `${V1}/inventory/stock/entry`,
    stockAdjust: `${V1}/inventory/stock/adjust`,
    movements: `${V1}/inventory/stock/transfer`,
  },
  suppliers: {
    list: `${V1}/suppliers`,
    create: `${V1}/suppliers`,
    detail: (id: string) => `${V1}/suppliers/${id}`,
  },
  reports: {
    overview: `${V1}/reports/overview`,
  },
  analytics: {
    kpis: `${V1}/analytics/kpis`,
    revenueDaily: `${V1}/analytics/revenue/daily`,
    revenueByService: `${V1}/analytics/revenue/by-service`,
    doctorPerformance: `${V1}/analytics/doctor-performance`,
    inventoryAlerts: `${V1}/analytics/inventory-alerts`,
    paymentModes: `${V1}/analytics/payment-modes`,
    appointmentHeatmap: `${V1}/analytics/appointment-heatmap`,
    pendingInvoices: `${V1}/analytics/pending-invoices`,
  },

  dashboard: {
    admin: `${V1}/dashboard/admin`,
    staff: `${V1}/dashboard/staff`,
    portal: `${V1}/dashboard/daily-summary`,
  },

  tenants: {
    list: `${V1}/admin/tenants`,
    provision: `${V1}/tenants/provision`,
  },
  subscriptions: {
    plans: `${V1}/subscriptions/plans`,
    upgrade: (planId: string) => `${V1}/subscriptions/${planId}/upgrade`,
  },
  branchAdmin: {
    list: `${V1}/branches`,
    create: `${V1}/branches`,
    detail: (id: string) => `${V1}/branches/${id}`,
  },
  staff: {
    list: `${V1}/staff`,
    create: `${V1}/staff`,
    detail: (id: string) => `${V1}/staff/${id}`,
    attendance: (id: string) => `${V1}/staff-attendance/staff/${id}`,
  },
  masterData: {
    list: (resource: string) => {
      const paths: Record<string, string> = {
        cities: `${V1}/cities`,
        states: `${V1}/states`,
        designations: `${V1}/designations`,
        breeds: `/api/breeds`,
        species: `/api/species`,
        specializations: `${V1}/specializations`,
        "lab-tests": `${V1}/lab-tests`,
        hospitals: `${V1}/hospitals`,
      };
      if (resource.startsWith("cities-by-state/")) {
        return `${V1}/cities/state/${resource.split("/")[1]}`;
      }
      return paths[resource] || `${V1}/master-data/${resource}`;
    },
    create: (resource: string) => {
      const paths: Record<string, string> = {
        cities: `${V1}/cities`,
        states: `${V1}/states`,
        designations: `${V1}/designations`,
        breeds: `/api/breeds`,
        species: `/api/species`,
        specializations: `${V1}/specializations`,
        "lab-tests": `${V1}/lab-tests`,
      };
      return paths[resource] || `${V1}/master-data/${resource}`;
    },
    detail: (resource: string, id: string) => {
      const paths: Record<string, string> = {
        cities: `${V1}/cities/${id}`,
        states: `${V1}/states/${id}`,
        designations: `${V1}/designations/${id}`,
        breeds: `/api/breeds/${id}`,
        species: `/api/species/${id}`,
        specializations: `${V1}/specializations/${id}`,
        "lab-tests": `${V1}/lab-tests/${id}`,
      };
      return paths[resource] || `${V1}/master-data/${resource}/${id}`;
    },
  },
} as const;
