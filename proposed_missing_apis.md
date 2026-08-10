# Proposed Missing APIs

The following modules exist in the frontend UI but lack any backend endpoints in the current Java Spring Boot application. Below is the proposed REST API specification for the backend team to implement in order to fully support the frontend features.

---

## 1. GroomingController

Handles grooming services, appointments, and packages.

### GET /api/v1/grooming/services
**Description**: Get all available grooming services.
**Response**: List of services (e.g., Bath, Haircut, Nail Trimming) with pricing.

### POST /api/v1/grooming/appointments
**Description**: Book a grooming appointment.
**Request Body**: 
```json
{
  "petId": "uuid",
  "serviceIds": ["uuid1", "uuid2"],
  "appointmentDate": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "notes": "string"
}
```

### GET /api/v1/grooming/appointments/{appointmentId}
**Description**: Get grooming appointment details.

### PUT /api/v1/grooming/appointments/{appointmentId}/status
**Description**: Update status (e.g., IN_PROGRESS, COMPLETED, CANCELLED).

---

## 2. PharmacyController

Handles dispensing medications and POS integration for the pharmacy module. 

### POST /api/v1/pharmacy/dispense
**Description**: Dispense medications based on a prescription. Deducts from Inventory automatically.
**Request Body**:
```json
{
  "prescriptionId": "uuid",
  "items": [
    {
      "inventoryItemId": "uuid",
      "quantity": 2
    }
  ],
  "dispensedBy": "uuid"
}
```

### GET /api/v1/pharmacy/dispensations/patient/{petId}
**Description**: Get pharmacy history for a specific patient.

### GET /api/v1/pharmacy/pending-prescriptions
**Description**: Get all active prescriptions that have not yet been dispensed by the pharmacy.

---

## 3. RefundController (or extend BillingController)

Handles processing refunds for invoices or payments.

### POST /api/v1/billing/refunds
**Description**: Process a refund for a specific payment or invoice.
**Request Body**:
```json
{
  "invoiceId": "uuid",
  "paymentId": "uuid",
  "amount": 50.00,
  "reason": "Overcharged",
  "refundMethod": "CREDIT_CARD"
}
```

### GET /api/v1/billing/refunds
**Description**: Get a list of all processed refunds for reporting.

### GET /api/v1/billing/refunds/{refundId}
**Description**: Get specific refund details.

---

## 4. TenantController (Super-Admin Only)

Handles onboarding new hospitals/clinics to the platform (multi-tenancy).

### POST /api/v1/tenants
**Description**: Register a new tenant (Hospital/Clinic).
**Request Body**:
```json
{
  "tenantName": "string",
  "contactEmail": "string",
  "contactPhone": "string",
  "subscriptionPlan": "BASIC|PREMIUM",
  "adminUser": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "password": "string"
  }
}
```

### GET /api/v1/tenants
**Description**: List all tenants on the platform.

### PUT /api/v1/tenants/{tenantId}/status
**Description**: Activate or deactivate a tenant.
