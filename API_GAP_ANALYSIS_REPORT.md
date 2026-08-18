# PawCare OS - Frontend vs Backend API Gap Analysis & Audit Report

**Generated Date:** August 17, 2026  
**Status:** Comprehensive Audit Completed  
**Scope:** `frontend/veterinary-frontend` vs `Backend/veternaryBE`

---

## Executive Summary

A complete audit of all frontend user flows, API calls, and client mappings was conducted against the Java Spring Boot backend controllers, services, repositories, and security configurations.

The system has a rich set of features already built on both sides. However, several critical APIs must be implemented in the backend, some URL routing prefixes need standardization, and a few request/response contracts require alignment before full end-to-end integration is seamless.

---

## 1. 🚨 Critical Missing APIs in Backend (Must Be Built)

These endpoints are required by the frontend client and pages but currently do not exist in the backend.

### 1.1 Appointments Available Slots API
* **Frontend Endpoint:** `GET /api/v1/appointments/slots/available?date={yyyy-MM-dd}&doctorId={uuid}&branchId={uuid}`
* **Frontend Consumers:** `SlotPicker.tsx`, `BookingForm.tsx`, `NewAppointmentForm.tsx`
* **Current Status:** Intercepted with mock slot generation in `src/lib/api-client.ts`.
* **Backend Action Required:**
  * Implement `GET /api/v1/appointments/slots/available` in `AppointmentController.java`.
  * Calculate available time intervals based on `DoctorSchedule` weekly hours, existing booked appointments in `AppointmentRepository`, and active approved leaves in `StaffLeaveRepository`.

### 1.2 User Registration / Public Signup API
* **Frontend Endpoint:** `POST /api/auth/register` (or `POST /api/auth/signup`)
* **Frontend Consumers:** `signup.tsx`, `onboarding.tsx`
* **Current Status:** Allowed in Spring Security `SecurityConfig.java`, but no corresponding endpoint exists in `AuthController.java`.
* **Backend Action Required:**
  * Add `@PostMapping("/register")` to `AuthController.java`.
  * Accept `name`, `email`, `password`, and optional `role` (e.g. `PET_OWNER`), hash password with `PasswordEncoder`, and create corresponding `User` (and `PetOwner` profile if role is `PET_OWNER`).

### 1.3 List Payments & Transaction History API
* **Frontend Endpoint:** `GET /api/v1/payments` (with pagination or filtering)
* **Frontend Consumers:** `app.payments.tsx`
* **Current Status:** `PaymentController.java` only has `POST /` (create payment) and `GET /{id}`.
* **Backend Action Required:**
  * Add `@GetMapping` in `PaymentController.java` to list payments (supports pagination, filtering by `invoiceId`, `hospitalId`, `date`, `status`).

### 1.4 Refunds Management (Listing & Dual-Approval Workflow)
* **Frontend Endpoints:**
  * `GET /api/v1/refunds` - List all refund requests
  * `POST /api/v1/refunds/{id}/approve` - Approve refund request
  * `POST /api/v1/refunds/{id}/reject` - Reject refund request
* **Frontend Consumers:** `app.refunds.tsx`
* **Current Status:** `RefundController.java` only implements `POST /` (create request) and `GET /{id}`.
* **Backend Action Required:**
  * Add `@GetMapping` to list refunds in `RefundController.java`.
  * Add `@PostMapping("/{id}/approve")` and `@PostMapping("/{id}/reject")` to execute dual-authorization rules, create `CreditNote` automatically on approval, and update refund status.

### 1.5 Credit Notes Audit Listing API
* **Frontend Endpoint:** `GET /api/v1/credit-notes`
* **Frontend Consumers:** `app.refunds.tsx`
* **Current Status:** `CreditNoteController.java` only has `POST /` and `GET /{id}`.
* **Backend Action Required:**
  * Add `@GetMapping` in `CreditNoteController.java` to return credit notes for accounting reconciliation.

### 1.6 Supplier Catalog Listing & Detail APIs
* **Frontend Endpoints:**
  * `GET /api/v1/inventory/suppliers` (or `/api/v1/suppliers`)
  * `GET /api/v1/inventory/suppliers/{id}`
* **Frontend Consumers:** `app.suppliers.tsx`, `app.inventory.tsx` (dropdowns & supplier table)
* **Current Status:** `SupplierController.java` only implements `POST /` (create supplier).
* **Backend Action Required:**
  * Add `@GetMapping` (list all suppliers) and `@GetMapping("/{id}")` in `SupplierController.java`.

### 1.7 Stock Movement & Transfer Audit History
* **Frontend Endpoint:** `GET /api/v1/inventory/stock/movements` (or `transfer/history`)
* **Frontend Consumers:** `app.inventory.tsx` (Movements audit tab)
* **Current Status:** `InventoryController.java` has `POST /stock/transfer` to execute transfers, but no `GET` endpoint for fetching audit logs / transfer history.
* **Backend Action Required:**
  * Add `@GetMapping("/stock/movements")` or `@GetMapping("/stock/transfers")` in `InventoryController.java`.

### 1.8 Prescription PDF Generation / Download API
* **Frontend Endpoint:** `GET /api/v1/prescriptions/{id}/pdf`
* **Frontend Consumers:** `PrescriptionPdfButton.tsx`, `app.prescriptions.tsx`, `portal.prescriptions.tsx`
* **Current Status:** `BillingController` has `/invoices/{id}/download` with `InvoicePdfService`, but `PrescriptionController` does not have any PDF generation service.
* **Backend Action Required:**
  * Create `PrescriptionPdfService.java` and expose `@GetMapping("/{id}/pdf")` in `PrescriptionController.java` returning `byte[]` (`application/pdf`) or a signed Cloudinary/S3 PDF URL.

### 1.9 Pet Owner Portal "Mine" APIs
* **Frontend Endpoints:**
  * `GET /api/v1/prescriptions/mine`
  * `GET /api/v1/invoices/mine`
  * `POST /api/v1/appointments/search` (resolving logged-in owner)
* **Frontend Consumers:** `portal.prescriptions.tsx`, `portal.invoices.tsx`, `portal.my-appointments.tsx`
* **Current Status:** Currently no `/mine` endpoints exist. Backend APIs require admin parameters rather than resolving the logged-in user's pet owner ID from `@AuthenticationPrincipal`.
* **Backend Action Required:**
  * Add `/prescriptions/mine` and `/invoices/mine` endpoints (or support owner-scoped queries) that filter by the authenticated pet owner.

### 1.10 Pet Owner Root List Endpoint
* **Frontend Endpoint:** `GET /api/v1/pet-owners`
* **Frontend Consumers:** `endpoints.petOwners.list`
* **Current Status:** `PetOwnerController.java` has `GET /search?query=...` and `GET /{id}`, but no root `@GetMapping` on `/`.
* **Backend Action Required:**
  * Add root `@GetMapping` on `PetOwnerController.java` (delegating to search or returning paged owners).

---

## 2. ⚠️ URL Routing & HTTP Method Mismatches

These endpoints exist on both sides, but have URL differences or HTTP method mismatches:

| Component | Backend Path / Method | Frontend Expected Path / Method | Solution / Recommendation |
|---|---|---|---|
| **Prescriptions Controller** | `@RequestMapping("/v1/prescriptions")` | `/api/v1/prescriptions` | Add missing `/api` prefix to `PrescriptionController.java`. |
| **Procedures Controller** | `@RequestMapping("/v1/procedures")` | `/api/v1/procedures` | Add missing `/api` prefix to `ProcedureController.java`. |
| **Diagnosis Controller** | `@RequestMapping("/v1/diagnosis")` | `/api/v1/diagnosis` | Add missing `/api` prefix to `DiagnosisController.java`. |
| **Treatment Plans Controller** | `@RequestMapping("/v1/treatment-plans")` | `/api/v1/treatment-plans` | Add missing `/api` prefix to `TreatmentPlanController.java`. |
| **Inventory Items** | `GET /api/v1/inventory/items` | `GET /api/v1/inventory` | Update frontend `endpoints.inventory.list` to `${V1}/inventory/items` or add alias in backend. |
| **Suppliers** | `@RequestMapping("/api/v1/inventory/suppliers")` | `/api/v1/suppliers` | Update frontend `endpoints.suppliers` to `${V1}/inventory/suppliers` or add alias in backend. |
| **Revenue by Service** | `GET /api/v1/analytics/revenue-by-service` | `GET /api/v1/analytics/revenue/by-service` | Align subpath in `endpoints.analytics.revenueByService` to match backend `/revenue-by-service`. |
| **Reports Overview** | `GET /api/v1/analytics/reports/overview` | `GET /api/v1/reports/overview` | Align frontend `endpoints.reports.overview` to `${V1}/analytics/reports/overview`. |
| **Invoice Cancellation** | `POST /api/v1/billing/invoices/{id}/cancel?reason=...` | `PATCH /api/v1/billing/invoices/{id}/status` `{status: "CANCELLED"}` | Update `app.billing.tsx` to call `POST /invoices/{id}/cancel?reason=...` or support PATCH. |
| **Payment Reconciliation** | `POST /api/v1/payments/reconcile` (body: `PaymentReconcileRequest`) | `GET /api/v1/payments/reconcile?payment_id=...` | Update `app.payments.tsx` to call `POST /reconcile` with `{ paymentId: ... }`. |

---

## 3. 📝 Contract, DTO & Integration Alignments

### 3.1 Prescription Multi-Line vs Single Item Structure
* **Frontend:** Prescriptions support multiple medication line items per prescription (`items: PrescriptionItem[]`, `petId`, `instructions`, `refillsLeft`).
* **Backend:** `AddPrescriptionRequest.java` currently maps a single medicine per prescription record tied directly to `consultationId`.
* **Recommendation:** Update backend `Prescription` to support a parent prescription record with child `PrescriptionItem` entities, or have frontend adapt to consultation-line-item submission.

### 3.2 Inventory Multi-Tenancy Headers
* **Backend:** `GET /api/v1/inventory/low-stock` and `GET /api/v1/inventory/expiry` require `@RequestHeader(value = "hospital-id") UUID hospitalId`.
* **Frontend:** Frontend does not pass `hospital-id` explicitly in header.
* **Recommendation:** Extract `hospitalId` in backend from the authenticated user token (`CustomUserPrincipal`) so frontend doesn't need to manually pass headers on every request.

### 3.3 Frontend Auth Store Integration
* **Frontend:** `src/lib/auth/store.ts` currently generates mock tokens (`mock-token`, `mock-id`).
* **Recommendation:** Wire `authStore.login()` to `apiClient.post("/api/auth/login", { email, password })` and store the returned JWT token.

---

## 4. 📦 Backend APIs Built & Ready for Frontend UI Integration

The backend already has fully operational APIs for modules that can be integrated into the UI:

1. **Hospitalization & Inpatient Management:**
   * `AdmissionController.java` (`/api/v1/admissions`) - Inpatient admission, discharge, bed transfers.
   * `WardController.java` (`/api/v1/wards`) - Ward management.
   * `BedController.java` (`/api/v1/beds`) - Real-time bed occupancy and allocation.
2. **Laboratory Management:**
   * `LabOrderController.java` (`/api/v1/lab-orders`) - Lab test ordering.
   * `LabResultController.java` (`/api/v1/lab-results`) - Diagnostic result recording and file attachments.
   * `LabTestController.java` (`/api/v1/lab-tests`) - Master lab test catalog.
   *(Frontend `/app/lab` is currently a placeholder and can be wired to these controllers).*
3. **Owner Documents & Communications:**
   * `OwnerDocumentController.java` (`/api/v1/pet-owners/{id}/documents`) - Document uploads with Cloudinary.
   * `CommunicationHistoryController.java` (`/api/v1/pet-owners/{id}/communications`) - Communication audit logs.

---

## 5. Implementation Priority Roadmap

### Phase 1: High Priority (Core Booking, Auth & Billing)
- [ ] **Auth:** Implement `POST /api/auth/register` in `AuthController.java`.
- [ ] **Appointments:** Implement `GET /api/v1/appointments/slots/available` in `AppointmentController.java`.
- [ ] **Prefixes:** Add `/api` prefix to `PrescriptionController`, `ProcedureController`, `DiagnosisController`, `TreatmentPlanController`.
- [ ] **Payments:** Add `GET /api/v1/payments` in `PaymentController.java`.

### Phase 2: Medium Priority (Refunds, Suppliers, Inventory)
- [ ] **Refunds:** Add `GET /api/v1/refunds`, `POST /{id}/approve`, and `POST /{id}/reject` in `RefundController.java`.
- [ ] **Credit Notes:** Add `GET /api/v1/credit-notes` in `CreditNoteController.java`.
- [ ] **Suppliers:** Add `GET /` and `GET /{id}` in `SupplierController.java`.
- [ ] **Inventory History:** Add `GET /stock/movements` in `InventoryController.java`.

### Phase 3: Portal & Advanced Features
- [ ] **PDF:** Implement `GET /api/v1/prescriptions/{id}/pdf`.
- [ ] **Portal:** Add `/mine` endpoints for pet owner portal access.
- [ ] **Lab UI:** Wire `app.lab.tsx` to backend `LabOrderController` and `LabResultController`.
