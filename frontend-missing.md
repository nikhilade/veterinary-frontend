# Missing Frontend & Backend Integrations

After cross-referencing the **Frontend React Routes** (`src/routes/*`) with the **Backend APIs** (`api-endpoints.md`), there are several gaps where the frontend has features the backend doesn't support yet, and vice versa.

The 5-Day Integration plan covers the core medical and administrative flows, but it misses these gaps:

## 1. Frontend UI exists, but Backend APIs are MISSING
These modules have full UI screens in the frontend, but there are no corresponding endpoints defined in `api-endpoints.md` to power them.

- **Grooming (`app.grooming.tsx`)**: The UI has a grooming section, but the backend lacks a `GroomingController` or endpoints for grooming appointments/services.
- **Pharmacy (`app.pharmacy.tsx`)**: While the backend handles `Prescriptions` and `Inventory`, there are no specific Pharmacy POS/Dispensation APIs.
- **Refunds (`app.refunds.tsx`)**: The frontend has a refunds screen, but the backend `BillingController` and `PaymentController` do not explicitly define refund processing endpoints.
- **Tenant Management (`app.tenants.tsx`)**: The frontend has a Super-Admin tenant onboarding screen, but the backend only has multi-tenancy *filters* (TenantContext), not actual CRUD endpoints for managing Tenants.

## 2. Backend APIs exist, but Frontend UI is MISSING
The backend has fully developed endpoints for these features, but the React frontend does not have any routes or pages built for them yet.

- **Inpatient Management (Admissions, Wards, Beds)**:
  - The backend has `AdmissionController`, `WardController`, and `BedController`.
  - **Missing UI**: There are no `app.admissions.tsx` or `app.wards.tsx` screens to actually admit patients and assign beds.
- **Communication History**:
  - The backend has `CommunicationHistoryController` and `OwnerDocumentController`.
  - **Missing UI**: The frontend `app.owners.$id.tsx` profile lacks the tabs/components to display SMS/Email logs.

## 3. Modules missing from the 5-Day Plan
The 5-day plan focuses heavily on the Staff/Admin side of the application. It needs to be expanded to include:

- **The Client Portal (`portal.*.tsx`)**: 
  - The frontend contains a dedicated app for Pet Owners (`portal.dashboard`, `portal.book-appointment`, `portal.my-pets`, `portal.invoices`).
  - **Action**: Developer A or B needs to spend time mapping the existing `PetOwner`, `Pet`, and `Appointment` backend APIs to these client-facing views.
- **Analytics & Reports (`app.analytics.tsx`, `app.reports.tsx`)**:
  - Requires tying in the `DashboardController` summary data to the Recharts graphs on the frontend.
