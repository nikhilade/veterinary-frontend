# 5-Day Integration Plan (2 Developers)

This plan distributes the integration of all frontend API endpoints (from `api-endpoints.md`) across **Developer A** and **Developer B** over a 5-day sprint. Work is divided by domain to minimize merge conflicts and context switching.

## Day 1: Setup, Auth & Core Infrastructure

**Focus:** Get the foundational systems and reference data up and running.

### Developer A (Billing & Payments)
- **Controllers:** `BillingController`, `PaymentController`
- **Tasks:**
  - Integrate invoice generation, status updates, and GST reports.
  - Setup payment recording.

### Developer B (Master Data & Hospital Structures)
- **Controllers:** `CityController`, `StateController`, `DesignationController`, `BreedController`, `SpeciesController`, `SpecializationController`, `HospitalController`, `BranchController` (and their respective Settings/Profile/Department controllers).
- **Tasks:**
  - Integrate all drop-down and reference data (City, State, Breeds, etc.).
  - Setup multi-tenant/hospital structure and branch configuration pages.

---

## Day 2: Patients & Reception

**Focus:** Patient onboarding, owner profiles, and front-desk operations.

### Developer A (Pet Owners)
- **Controllers:** `PetOwnerController`, `OwnerDocumentController`, `CommunicationHistoryController`
- **Tasks:**
  - Build the Pet Owner search, creation, and profile views.
  - Integrate document uploads and communication logs.

### Developer B (Pets & Front Desk)
- **Controllers:** `PetController`, `VaccinationController`, `ReceptionQueueController`
- **Tasks:**
  - Build Pet creation, history, and vaccination tracking.
  - Integrate the Reception Queue (Check-in, Call Next, No-show, Complete).

---

## Day 3: Clinical Operations (Consultations)

**Focus:** The core medical workflow for doctors.

### Developer A (Appointments & Dashboard)
- **Controllers:** `AppointmentController`, `DashboardController`
- **Tasks:**
  - Build appointment booking, rescheduling, and cancellation flows.
  - Integrate the Admin and Staff dashboard summary statistics.

### Developer B (Medical Records)
- **Controllers:** `ConsultationController`, `DiagnosisController`, `TreatmentPlanController`, `PrescriptionController`, `ProcedureController`
- **Tasks:**
  - Integrate the full consultation workflow.
  - Connect Diagnoses, Treatment Plans, Prescriptions, and Procedures to their respective Consultation IDs.

---

## Day 4: Inpatient & Diagnostics

**Focus:** Wards, beds, and laboratory integrations.

### Developer A (Admissions & Wards)
- **Controllers:** `AdmissionController`, `WardController`, `BedController`
- **Tasks:**
  - Integrate Ward and Bed setup for hospitals.
  - Build the patient admission workflow, bed transfers, and discharge processes.

### Developer B (Laboratory)
- **Controllers:** `LabOrderController`, `LabResultController`, `LabTestController`
- **Tasks:**
  - Build Lab Test configuration (master list).
  - Integrate Lab Order creation and Result tracking for patients.

---

## Day 5: Inventory, Billing & Wrap-up

**Focus:** Financials, stock management, and End-to-End testing.

### Developer A (Auth & Staff Management)
- **Controllers:** `AuthController`, `StaffController`, `StaffProfileController`, `DoctorController`, `DoctorScheduleController`, `StaffAttendanceController`
- **Tasks:**
  - Establish JWT authentication flow (since the backend is ready by this day).
  - Setup Staff CRUD and Profile integrations.
  - Setup Doctor and Schedule associations.

### Developer B (Inventory & Suppliers)
- **Controllers:** `InventoryController`, `SupplierController`, `MasterDataImportController`
- **Tasks:**
  - Integrate supplier onboarding and stock entries/adjustments.
  - Implement low-stock and expiry tracking.
  - Connect the bulk master data import tool.

---

## QA & Deployment (End of Day 5)
- **Both Developers:**
  - Run End-to-End (E2E) cross-module testing (e.g., Book Appointment -> Check In -> Consultation -> Lab Order -> Billing).
  - Fix any missing data mapping issues (UUIDs vs Names).
