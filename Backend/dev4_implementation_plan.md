# Developer 4 (Business, Revenue & Analytics) Implementation Plan

This document tracks the progress of the Phase 1 implementation for Developer 4 in the VetCare HMS monolith application.

## 🏛️ Step 1: Core Architectural Foundations

- [ ] **Global Exception Handler**
  - Create `@ControllerAdvice` for standardized error responses (`{ success, data, error, meta }`).
  - Implement custom exceptions (`ERR_INSUFFICIENT_STOCK`, `ERR_STOCK_LOCK_TIMEOUT`, `ERR_IDEMPOTENCY_CONFLICT`, `ERR_GATEWAY_TIMEOUT`, `ERR_DUPLICATE_INVOICE`, `ERR_CREDIT_NOTE_REQUIRED`, etc.).
- [ ] **Idempotency Interceptor**
  - Create a filter/interceptor to handle `Idempotency-Key` headers for POST requests.
  - Set up Redis/In-memory caching for 24-hour response caching.
- [ ] **Pagination Utility**
  - Implement cursor-based pagination default utility (Base64-encoded opaque string with sort key + record ID).
- [ ] **Service Interfaces (Contracts)**
  - Define `InventoryService`, `BillingService`, `PaymentService` interfaces.
  - Coordinate with Dev 1, Dev 2, and Dev 3 for required external interfaces.

## 📁 Standard Internal Module Structure

All modules must strictly follow this internal package structure. Below is the example structure applied to an `Inventory` module:

```text
inventory
├── controller
│   └── InventoryController
├── service
│   ├── InventoryService
│   └── impl
│       └── InventoryServiceImpl
├── repository
│   └── InventoryRepository
├── entity
│   └── InventoryItem
├── dto
│   ├── request
│   │   ├── InventoryCreateRequest
│   │   └── InventoryUpdateRequest
│   └── response
│       └── InventoryResponse
├── mapper
│   └── InventoryMapper
├── enums
│   └── InventoryCategory
└── validator
    └── InventoryValidator
```

## 📦 Step 2: Database Entities & Tables (Phase 1)

*Note: All tables include `created_at`, `updated_at`, `created_by`, `deleted_by` audit columns and an `is_deleted` flag for soft deletes. PKs are `UUID`.*

### 🗄️ Database Partitioning Strategy (Critical)
As per BRD 14.3.1, apply the following partitioning:
- `invoices`: RANGE + LIST (`tenant_id`, `invoice_date`) monthly
- `invoice_items`: RANGE (`invoice_date`) monthly
- `stock_entries`: RANGE (`entry_date`) monthly
- `payments`: RANGE (`paid_at`) monthly
- `audit_logs`: RANGE (`created_at`) yearly

### Module 1: Inventory Management

#### Table: `inventory_items` (Entity: `InventoryItem`)
*Why needed: Master catalog for SKUs, tax info, and concurrency-controlled stock levels.*

| Column | Type | Constraints / Relations | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, NOT NULL | Unique identifier |
| `sku` | VARCHAR(50) | NOT NULL | Stock Keeping Unit code |
| `name` | VARCHAR(200)| NOT NULL | Item display name |
| `category` | VARCHAR(100)| NOT NULL | Medicine, Consumable, Grooming |
| `hsn_code` | VARCHAR(20) | NULL | HSN code for GST |
| `tax_rate` | DECIMAL(5,2)| NOT NULL | GST percentage |
| `unit` | VARCHAR(30) | NOT NULL | UOM (tablet, ml, kg, pack) |
| `reorder_level`| INTEGER | NOT NULL | Min qty before low-stock alert |
| `current_stock`| DECIMAL(10,2)| NOT NULL | Real-time stock (Pessimistic Locking & CHECK >= 0 constraint required) |
| `is_active` | BOOLEAN | NOT NULL | Soft enable/disable |
| `created_at` | TIMESTAMP | NOT NULL | Audit creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Audit update timestamp |
| `created_by` | UUID | NULL | User ID who created |
| `deleted_by` | UUID | NULL | User ID who soft-deleted |
| `is_deleted` | BOOLEAN | NOT NULL | Soft delete flag |

#### Table: `stock_entries` (Entity: `StockEntry`)
*Why needed: Audit trail of goods received (GRN) and batch expiry tracking.*

| Column | Type | Constraints / Relations | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, NOT NULL | Entry ID |
| `item_id` | UUID | FK (inventory_items), NOT NULL | Link to inventory item |
| `supplier_id` | UUID | FK (suppliers), NULL | Link to supplier |
| `batch_number` | VARCHAR(50) | NOT NULL | Supplier batch number |
| `quantity` | DECIMAL(10,2)| NOT NULL | Quantity received / adjusted |
| `purchase_price`| DECIMAL(10,2)| NOT NULL | Cost per unit |
| `mrp` | DECIMAL(10,2)| NOT NULL | Maximum retail price |
| `expiry_date` | DATE | NULL | Expiry date of batch |
| `entry_type` | VARCHAR(20) | NOT NULL | PURCHASE / RETURN / OPENING |
| `notes` | TEXT | NULL | Additional remarks |
| `created_at` | TIMESTAMP | NOT NULL | Audit creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Audit update timestamp |
| `created_by` | UUID | NULL | User ID who created |
| `deleted_by` | UUID | NULL | User ID who soft-deleted |
| `is_deleted` | BOOLEAN | NOT NULL | Soft delete flag |

#### Table: `suppliers` (Entity: `Supplier`)
*Why needed: 3rd party vendor procurement history and payment term definitions.*

| Column | Type | Constraints / Relations | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, NOT NULL | Supplier ID |
| `name` | VARCHAR(200)| NOT NULL | Supplier company name |
| `contact_person`| VARCHAR(100)| NULL | Primary contact |
| `phone` | VARCHAR(20) | NOT NULL | Contact phone |
| `email` | VARCHAR(100)| NULL | Contact email |
| `gstin` | VARCHAR(20) | NULL | GST registration number |
| `payment_terms` | VARCHAR(100)| NULL | e.g., Net 30 |
| `lead_time_days`| INTEGER | NULL | Average delivery lead time |
| `is_active` | BOOLEAN | NOT NULL | Active status |
| `created_at` | TIMESTAMP | NOT NULL | Audit creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Audit update timestamp |
| `created_by` | UUID | NULL | User ID who created |
| `deleted_by` | UUID | NULL | User ID who soft-deleted |
| `is_deleted` | BOOLEAN | NOT NULL | Soft delete flag |

### Module 2: Billing Management

#### Table: `invoices` (Entity: `Invoice`)
*Why needed: Core immutable billing record aggregating GST liability for a patient visit.*

| Column | Type | Constraints / Relations | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, NOT NULL | Invoice ID |
| `invoice_number`| VARCHAR(30) | NOT NULL | Sequential formatted number (must be sequential & non-repeating within a financial year) |
| `patient_id` | UUID | FK (patients), NOT NULL | Ref: patients.id |
| `visit_id` | UUID | FK (visits), NULL | Ref: visits.id |
| `invoice_date` | TIMESTAMP | NOT NULL | Date/time of generation |
| `subtotal` | DECIMAL(12,2)| NOT NULL | Pre-tax total |
| `cgst` | DECIMAL(10,2)| NOT NULL | Central GST amount |
| `sgst` | DECIMAL(10,2)| NOT NULL | State GST amount |
| `igst` | DECIMAL(10,2)| NOT NULL | Integrated GST amount |
| `discount` | DECIMAL(10,2)| NOT NULL | Discount applied |
| `grand_total` | DECIMAL(12,2)| NOT NULL | Final payable amount |
| `status` | VARCHAR(20) | NOT NULL | DRAFT/PENDING/PAID/CANCELLED |
| `due_date` | DATE | NULL | Payment due date |
| `created_at` | TIMESTAMP | NOT NULL | Audit creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Audit update timestamp |
| `created_by` | UUID | NULL | User ID who created |
| `deleted_by` | UUID | NULL | User ID who soft-deleted |
| `is_deleted` | BOOLEAN | NOT NULL | Soft delete flag |

#### Table: `invoice_items` (Entity: `InvoiceItem`)
*Why needed: Line items for multi-service billing (Lab + Consult + Pharmacy).*

| Column | Type | Constraints / Relations | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, NOT NULL | Line item ID |
| `invoice_id` | UUID | FK (invoices), NOT NULL | Parent invoice |
| `item_type` | VARCHAR(30) | NOT NULL | CONSULTATION/LAB/PHARMACY etc. |
| `description` | VARCHAR(300)| NOT NULL | Display description |
| `quantity` | DECIMAL(8,2) | NOT NULL | Quantity billed |
| `unit_price` | DECIMAL(10,2)| NOT NULL | Price per unit |
| `tax_rate` | DECIMAL(5,2) | NOT NULL | Applicable GST % |
| `tax_amount` | DECIMAL(10,2)| NOT NULL | Computed tax |
| `line_total` | DECIMAL(12,2)| NOT NULL | qty × unit_price + tax |
| `created_at` | TIMESTAMP | NOT NULL | Audit creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Audit update timestamp |
| `created_by` | UUID | NULL | User ID who created |
| `deleted_by` | UUID | NULL | User ID who soft-deleted |
| `is_deleted` | BOOLEAN | NOT NULL | Soft delete flag |

### Module 3: Payment Management

#### Table: `payments` (Entity: `Payment`)
*Why needed: Reconciles cash/gateway collections against an invoice. (Revised for PCI-DSS)*

| Column | Type | Constraints / Relations | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, NOT NULL | Payment ID |
| `invoice_id` | UUID | FK (invoices), NOT NULL | Parent invoice |
| `payment_mode` | VARCHAR(30) | NOT NULL | CASH/CARD/UPI/ONLINE |
| `amount` | DECIMAL(12,2)| NOT NULL | Amount paid |
| `gateway_ref` | VARCHAR(100)| NULL | Payment gateway reference |
| `gateway` | VARCHAR(50) | NULL | Razorpay / PayU / Stripe |
| `status` | VARCHAR(20) | NOT NULL | PENDING/SUCCESS/FAILED/UNKNOWN |
| `paid_at` | TIMESTAMP | NULL | Success timestamp |
| `remarks` | TEXT | NULL | Cashier notes |
| `masked_pan` | VARCHAR(25) | NULL | Display only (e.g., **** 4242) |
| `gateway_token` | VARCHAR(200)| NULL | Opaque token from gateway |
| `card_brand` | VARCHAR(20) | NULL | VISA/MASTERCARD etc. |
| `created_at` | TIMESTAMP | NOT NULL | Audit creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Audit update timestamp |
| `created_by` | UUID | NULL | User ID who created |
| `deleted_by` | UUID | NULL | User ID who soft-deleted |
| `is_deleted` | BOOLEAN | NOT NULL | Soft delete flag |

#### Table: `credit_notes` (Entity: `CreditNote`)
*Why needed: GST compliance. Reverses tax liability for refunded finalized invoices.*

| Column | Type | Constraints / Relations | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, NOT NULL | Credit Note ID |
| `credit_note_number`| VARCHAR(30) | NOT NULL | Sequential CN-YYYY-NNNN |
| `original_invoice_id`| UUID | FK (invoices), NOT NULL | Linked invoice |
| `payment_id` | UUID | FK (payments), NOT NULL | The refund payment record |
| `issue_date` | DATE | NOT NULL | Date of issuance |
| `reason_code` | VARCHAR(50) | NOT NULL | SERVICE_ERROR/GOODS_RETURN etc. |
| `reason_description`| TEXT | NULL | Free-text reason |
| `subtotal_reversal`| DECIMAL(12,2)| NOT NULL | Pre-tax amount reversed |
| `cgst_reversal` | DECIMAL(10,2)| NOT NULL | CGST reversed |
| `sgst_reversal` | DECIMAL(10,2)| NOT NULL | SGST reversed |
| `igst_reversal` | DECIMAL(10,2)| NOT NULL | IGST reversed |
| `total_reversal`| DECIMAL(12,2)| NOT NULL | Total credit amount |
| `status` | VARCHAR(20) | NOT NULL | DRAFT/ISSUED/FILED |
| `approved_by` | UUID | FK (users), NOT NULL | Admin who approved refund |
| `created_at` | TIMESTAMP | NOT NULL | Audit creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Audit update timestamp |
| `created_by` | UUID | NULL | User ID who created |
| `deleted_by` | UUID | NULL | User ID who soft-deleted |
| `is_deleted` | BOOLEAN | NOT NULL | Soft delete flag |

### Module 5: Subscription Management (Phase 2 - SaaS)
*Note: Phase 2 implementation. Added here for entity awareness.*

#### Table: `subscription_plans` (Entity: `SubscriptionPlan`)

| Column | Type | Constraints / Relations | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, NOT NULL | Plan ID |
| `name` | VARCHAR(100)| NOT NULL | Starter/Pro/Enterprise |
| `price_monthly` | DECIMAL(10,2)| NOT NULL | Monthly price |
| `price_annual` | DECIMAL(10,2)| NOT NULL | Annual price |
| `max_users` | INTEGER | NOT NULL | Seat limit |
| `max_branches` | INTEGER | NOT NULL | Branch limit |
| `feature_flags` | JSONB | NOT NULL | JSON array of features |
| `is_active` | BOOLEAN | NOT NULL | Availability |
| `created_at` | TIMESTAMP | NOT NULL | Audit creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Audit update timestamp |
| `created_by` | UUID | NULL | User ID who created |
| `deleted_by` | UUID | NULL | User ID who soft-deleted |
| `is_deleted` | BOOLEAN | NOT NULL | Soft delete flag |

### Module 6: Marketplace Management (Phase 3 - Future)
*Note: Phase 3 implementation. Entities: `Product`, `Vendor`, `Order`, etc. (To be detailed in Phase 3)*

### Module 7: Insurance Management (Phase 3 - Future)
*Note: Phase 3 implementation. Entities: `InsuranceProvider`, `Policy`, `Claim`, etc. (To be detailed in Phase 3)*

## 🛠️ Step 3: Module 1 - Inventory Implementation
- [x] **Database Entities & Enums**
  - `InventoryItem`, `Supplier`, `StockEntry`, `InventoryCategory`, `EntryType`.
- [x] **Controllers & APIs**
  - `InventoryController` (`GET /inventory/items`, `POST /inventory/items`, etc.)
- [x] **Services & DTOs**
  - `InventoryService` implementation
- [x] **Repositories**
  - `InventoryItemRepository`, `SupplierRepository`, `StockEntryRepository`.
- [x] **Idempotent APIs**
  - `POST /inventory/stock/entry`, `POST /inventory/stock/adjust`
- [x] **Concurrency Control**
  - Implement pessimistic locking (`SELECT ... FOR UPDATE NOWAIT`) on stock reduction.
  - *Verified*: Postman tests successfully validated the endpoints under pessimistic write locks.

### 📝 Module 1 - Verification Log (July 3, 2026)
- [x] **Local PostgreSQL Integration** (Created database `pawcareos_db` and verified automatic table schema generation).
- [x] **Service Integration** (Integrated `SupplierMapper` and Lombok annotations, including `@EqualsAndHashCode`).
- [x] **Endpoint Verification** (Validated all endpoints using Postman).

## 💳 Step 4: Module 2 & 3 - Billing & Payments Implementation
- [ ] **Billing Engine**: GST calculation based on HSN/SAC. Idempotent POST `/billing/invoices`. 
  - [ ] Enforce sequential invoice numbers per financial year (April-March).
- [ ] **Payments Processing**: Idempotent POST `/payments`. Prevent storage of raw PAN/CVV (PCI-DSS SAQ A). 
  - [ ] Implement `UNKNOWN` gateway status polling job (every 30s for up to 10m) for `ERR_GATEWAY_TIMEOUT`.
  - [ ] Verify gateway webhooks with HMAC signature before processing.
- [ ] **Refunds Flow**: Idempotent POST `/payments/:id/refund`. Workflow: Refund Approval -> Generate `CreditNote` -> Gateway Refund -> Update Invoice.
  - [ ] Enforce SuperAdmin approval for refunds exceeding ₹10,000.

## 📊 Step 5: Module 4 - Analytics Implementation
- [ ] Specialized repository queries for analytics (`/reports/revenue`, `/reports/inventory`). Align with partitioning strategy.

## 📝 General Constraints
- [ ] All monetary values must be stored with 2 decimal places; rounding follows Indian rounding standard (round half up).

---
**Last Updated**: July 3, 2026
