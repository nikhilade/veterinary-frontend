# 💳 Module 3: Payment Management - Implementation Plan

This document outlines the step-by-step technical implementation plan for **Module 3: Payment Management** as defined in the Dev 4 FRD. 

---

## 📂 Step 1: Package Structure Setup

Create the following package structure under `src/main/java/com/koderz/pawcareos/payment`:

```text
payment
├── controller
│   └── PaymentController.java
├── service
│   ├── PaymentService.java
│   └── impl
│       ├── PaymentServiceImpl.java
│       └── PaymentPollingJob.java
├── repository
│   ├── PaymentRepository.java
│   └── CreditNoteRepository.java
├── entity
│   ├── Payment.java
│   └── CreditNote.java
├── dto
│   ├── request
│   │   ├── PaymentRequest.java
│   │   └── RefundRequest.java
│   └── response
│       ├── PaymentResponse.java
│       └── CreditNoteResponse.java
└── enums
    ├── PaymentMode.java
    ├── PaymentStatus.java
    ├── CreditNoteStatus.java
    └── RefundReasonCode.java
```

---

## 🗄️ Step 2: Enums & Entities

### 1. Enums (`enums` package)
- **`PaymentMode`**: `CASH`, `CARD`, `UPI`, `ONLINE`
- **`PaymentStatus`**: `PENDING`, `SUCCESS`, `FAILED`, `UNKNOWN`
- **`CreditNoteStatus`**: `DRAFT`, `ISSUED`, `FILED`
- **`RefundReasonCode`**: `SERVICE_ERROR`, `GOODS_RETURN`, `DUPLICATE_PAYMENT`, `OTHER`

### 2. `Payment` Entity
*Purpose: Reconciles cash/gateway collections against an invoice. PCI-DSS compliant.*
- Extend `BaseEntity` (for `created_at`, `updated_at`, `is_deleted`, etc.).
- Add `@ManyToOne` mapping for `invoice_id` and `hospital_id`.
- Core fields: `paymentMode`, `amount`, `gatewayRef`, `gateway` (e.g., Razorpay/Stripe), `status`, `paidAt`, `remarks`.
- **PCI-DSS fields**: `maskedPan` (e.g., `**** 4242`), `gatewayToken`, `cardBrand`.

### 3. `CreditNote` Entity
*Purpose: GST compliance. Reverses tax liability for refunded finalized invoices.*
- Extend `BaseEntity`.
- Add `@ManyToOne` mapping for `original_invoice_id`, `payment_id`, `hospital_id`, and `approved_by` (User).
- Core fields: `creditNoteNumber` (Sequential CN-YYYY-NNNN), `issueDate`, `reasonCode`, `reasonDescription`, `status`.
- Reversal fields: `subtotalReversal`, `cgstReversal`, `sgstReversal`, `igstReversal`, `totalReversal`.

---

## 🔌 Step 3: DTOs & Interfaces

### 1. Data Transfer Objects (`dto/request` & `dto/response`)
- **`PaymentRequest`**: `invoiceId`, `paymentMode`, `amount`, `gatewayRef`, `gatewayToken`, `remarks`.
- **`RefundRequest`**: `reasonCode`, `reasonDescription`, `amount` (partial or full refund).
- **`PaymentResponse`**: Mirrors entity fields for API responses.
- **`CreditNoteResponse`**: Mirrors credit note entity fields for API responses.

### 2. Repositories
- **`PaymentRepository`**: Add queries to find by `invoiceId`, and find all by `status = 'UNKNOWN'` (for polling).
- **`CreditNoteRepository`**: Add query to generate the next sequential `creditNoteNumber` per financial year.

---

## 🧠 Step 4: Service Implementation (`PaymentServiceImpl`)

Implement the following core business logic:

### 1. Payment Processing (`processPayment`)
- Validate invoice exists and is not already PAID.
- If `amount` matches the invoice `grandTotal`, process it.
- Prevent raw PAN/CVV storage (PCI-DSS compliance checklist). Mask any card details provided.
- Update `Invoice` status to `PAID` upon `PaymentStatus.SUCCESS`.

### 2. Refund Flow (`processRefund`)
- **Workflow**: Refund Approval -> Generate `CreditNote` -> Gateway Refund -> Update Invoice.
- **Validation**: Enforce SuperAdmin approval requirement for refunds exceeding ₹10,000 (check user roles via security context).
- Calculate proportional GST reversals (`cgst`, `sgst`, `igst`) based on the refund amount vs original invoice total.
- Persist the `CreditNote`.

### 3. Webhook Handling (`handleGatewayWebhook`)
- Verify webhook HMAC signature to ensure the payload actually came from the payment gateway (e.g., Razorpay signature verification).
- Update the payment status in the database (e.g., from `PENDING`/`UNKNOWN` to `SUCCESS`/`FAILED`).

---

## ⚙️ Step 5: Background Polling Job (`PaymentPollingJob`)

- Create a Spring `@Scheduled` component.
- **Task**: Find all payments with status `UNKNOWN` created in the last 10 minutes.
- **Action**: Poll the payment gateway API (e.g., Razorpay/Stripe) to check the real status.
- Update the payment status to `SUCCESS` or `FAILED` to recover from `ERR_GATEWAY_TIMEOUT`.

---

## 🚀 Step 6: Controller & APIs (`PaymentController`)

Implement these endpoints:

| Method | Endpoint | Description | Idempotent |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/payments` | Process a new payment | ✅ Yes (Use Interceptor) |
| **POST** | `/api/v1/payments/{id}/refund` | Initiate a refund / generate Credit Note | ✅ Yes |
| **POST** | `/api/v1/payments/webhook` | Webhook endpoint for gateways | No |
| **GET** | `/api/v1/payments/{id}` | Get payment details by ID | No |
| **GET** | `/api/v1/payments/invoice/{invoiceId}`| Get all payments for an invoice | No |

*Note: Ensure the existing `IdempotencyInterceptor` is mapped correctly so `POST /api/v1/payments` utilizes the `Idempotency-Key` header.*
