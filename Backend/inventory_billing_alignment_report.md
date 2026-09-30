# 🔍 Inventory & Billing Module Alignment Report

> Full analysis of misalignments between the current implementation of the Inventory/Billing modules, other modules, and the BRD requirements. This report is based on a deep-dive code review of the actual implemented files.

---

## 📊 Summary

| Category | Inventory Issues | Billing Issues | Both |
|----------|:---:|:---:|:---:|
| **Critical Bugs** (Will Crash/Fail) | 0 | 3 | 0 |
| **Missing BRD APIs** | 6 | 6 | 0 |
| **Logic & Data Flaws** | 1 | 1 | 2 |
| **API Path & Architecture** | 1 | 1 | 1 |

---

## 🔴 CRITICAL BUGS (Fix Immediately)

### 1. Missing `@PostMapping` on Billing API
The `BillingController.createInvoice` method is completely missing the HTTP method annotation. The endpoint will not be exposed by Spring Boot.
**Fix:** Add `@PostMapping("/invoices")` to the method in `BillingController.java`.

### 2. Typo Breaking Data Mapping (`qunatity`)
In `InvoiceItem.java` entity, the `quantity` field is misspelled as `qunatity`.
In the `InvoiceItemRequest` DTO, it is spelled correctly as `quantity`.
Because they do not match, **MapStruct will silently fail to map this field**, leaving the entity's quantity as null, leading to database constraint violations or `NullPointerException` during calculations.
**Fix:** Rename `qunatity` to `quantity` in `InvoiceItem.java` and generate getters/setters.

### 3. Wrong `@Param` Import in Repository
`InvoiceRepository.java` imports `io.lettuce.core.dynamic.annotation.Param` (a Redis library annotation) instead of `org.springframework.data.repository.query.Param`.
This will cause the native query `findLastInvoiceNumberForFinancialYear` to fail at runtime because Spring Data JPA won't recognize the parameter bindings.
**Fix:** Change the import in `InvoiceRepository.java`.

---

## 🟠 HIGH PRIORITY — Logical Flaws

### 4. Invoice Number Generation Query is Unsafe
The native query in `InvoiceRepository.findLastInvoiceNumberForFinancialYear` orders by `invoice_date DESC LIMIT 1`.
If multiple invoices are created in the same millisecond, or if server clocks differ slightly, the latest date might not correspond to the highest invoice number.
**Fix:** It should order by `invoice_number DESC LIMIT 1` to strictly ensure the highest sequence number is retrieved.

### 5. Multi-Tenancy Field Missing
The BRD specifies table partitioning by `(tenant_id, invoice_date)`. Neither `Invoice` nor `InventoryItem` (nor `BaseEntity`) has a `hospital_id` or `tenant_id` field.
**Fix:** Add `private UUID hospitalId;` to `Invoice`, `InventoryItem`, `Supplier`, and `StockEntry`.

### 6. Idempotency Key is Ignored
Controllers in both modules accept an `@RequestHeader(value = "idempotency-key")` but the key is never passed to a service or cached. The BRD mandates Redis/in-memory caching of responses for 24 hours to prevent double-charging.
**Fix:** Implement an Idempotency interceptor or filter globally.

---

## 🟡 MEDIUM PRIORITY — Missing BRD Requirements

### 7. Missing Billing APIs
The BRD (§5.2) mandates the following APIs which are currently absent:
- `PUT /invoices/{id}` (Update draft invoice)
- `GET /invoices/{id}/download` (Download PDF)
- `POST /invoices/{id}/cancel` (Cancel invoice)
- `GET /gst/report` (GST Report)
- `GET /invoices` (List invoices)
- `GET /invoices/{id}` (Get by ID)

### 8. Missing Inventory APIs
The BRD (§5.1) mandates the following APIs which are currently absent:
- `POST /stock/transfer` (Initiate inter-branch transfer)
- `GET /low-stock` (Fetch items below reorder level)
- `GET /expiry` (Items expiring soon)
- `GET /suppliers` (List suppliers)
- `PUT /suppliers/{id}` (Update supplier)
- `GET /items` (List items)
- `PUT /items/{id}` (Update item)

### 9. Incorrect API Base Paths
Both `BillingController` and `InventoryController` map to `/v1/...` instead of the BRD-specified `/api/v1/...`.
**Fix:** Change `@RequestMapping("/v1/...")` to `@RequestMapping("/api/v1/...")` in all controllers.

### 10. Generic Exception Handling
The BRD (§14.6.2) mandates specific error codes like `ERR_INSUFFICIENT_STOCK` (409) and `ERR_DUPLICATE_INVOICE`. Currently, the services throw generic `RuntimeException` (e.g., in `InventoryServiceImpl.adjustStock` for negative stock).
**Fix:** Implement custom exceptions and map them in a `GlobalExceptionHandler`.

### 11. Missing Pagination
None of the list endpoints (once implemented) have cursor-based pagination as required by BRD §14.6.1.
