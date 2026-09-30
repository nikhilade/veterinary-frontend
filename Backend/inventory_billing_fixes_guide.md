# 🛠️ Step-by-Step Fixes for Inventory & Billing Modules

This guide provides the exact code changes and steps you need to manually fix the 11 issues identified in the alignment report.

---

## 🔴 CRITICAL BUGS (Fix Immediately)

### 1. Missing `@PostMapping` on Billing API
**File:** `src/main/java/com/koderz/pawcareos/billing/controller/BillingController.java`
**Action:** Add the `@PostMapping` annotation to the `createInvoice` method so the API is accessible.
```java
// Add this line right above the method signature
@PostMapping("/invoices")
public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(
        @RequestHeader(value = "idempotency-key", required = false) String idempotencyKey,
        @Valid @RequestBody InvoiceCreateRequest request) {
    // ... existing code
}
```

### 2. Typo Breaking Data Mapping (`qunatity`)
**File:** `src/main/java/com/koderz/pawcareos/billing/entity/InvoiceItem.java`
**Action:** Fix the typo. Because the class uses Lombok `@Data`, renaming the field will automatically fix the getter/setter, allowing MapStruct to map it correctly.
```java
// Change this:
// private BigDecimal qunatity;

// To this:
@Column(nullable = false, precision = 8, scale = 2)
private BigDecimal quantity;
```
*(Also update `BillingServiceImpl.java` around line 46 where it calls `item.getQunatity()` to `item.getQuantity()`)*.

### 3. Wrong `@Param` Import in Repository
**File:** `src/main/java/com/koderz/pawcareos/billing/repository/InvoiceRepository.java`
**Action:** Replace the incorrect Redis import with the correct Spring Data JPA import.
```java
// Remove this:
// import io.lettuce.core.dynamic.annotation.Param;

// Add this:
import org.springframework.data.repository.query.Param;
```

---

## 🟠 HIGH PRIORITY — Logical Flaws

### 4. Invoice Number Generation Query is Unsafe
**File:** `src/main/java/com/koderz/pawcareos/billing/repository/InvoiceRepository.java`
**Action:** Update the `ORDER BY` clause to sort by the invoice number itself rather than the date to avoid race conditions.
```java
@Query(value = "SELECT invoice_number FROM invoices " +
        "WHERE invoice_date >= :startDate AND invoice_date <= :endDate " +
        "ORDER BY invoice_number DESC LIMIT 1", // <-- Changed from invoice_date to invoice_number
        nativeQuery = true)
Optional<String> findLastInvoiceNumberForFinancialYear(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
);
```

### 5. Multi-Tenancy Field Missing
**Files:** `Invoice.java`, `InventoryItem.java`, `Supplier.java`, `StockEntry.java`
**Action:** Add the `hospitalId` field to support the BRD's multi-tenancy requirements. Add this inside each of those entity classes:
```java
@Column(name = "hospital_id", nullable = false) // Note: might need to be nullable=true temporarily if you already have data
private UUID hospitalId;
```
*You will also need to update your repositories to include `hospitalId` in their queries (e.g., `findByHospitalId(UUID hospitalId)`).*

### 6. Idempotency Key is Ignored
**Action:** Create a global interceptor to handle idempotency.
1. Create `src/main/java/com/koderz/pawcareos/common/interceptor/IdempotencyInterceptor.java`.
2. Check for the `Idempotency-Key` header on `POST` requests.
3. Check a cache (like Redis or a `ConcurrentHashMap` for now) to see if the key exists.
4. If it exists, return HTTP 422 `ERR_IDEMPOTENCY_CONFLICT` (or the cached response).
5. If it doesn't, allow the request to proceed and cache the response afterwards.
*(Note: Since you want to do this manually, you'll need to set up a `WebMvcConfigurer` to register this interceptor).*

---

## 🟡 MEDIUM PRIORITY — Missing BRD Requirements

### 7. Missing Billing APIs
**File:** `src/main/java/com/koderz/pawcareos/billing/controller/BillingController.java`
**Action:** Add method stubs for the missing APIs. You will need to wire these up to the `BillingService`.
```java
@PutMapping("/invoices/{id}")
public ResponseEntity<ApiResponse<InvoiceResponse>> updateInvoice(@PathVariable UUID id, @RequestBody Object updateRequest) {
    // TODO: Implement update logic for DRAFT invoices
    return null;
}

@GetMapping("/invoices/{id}/download")
public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable UUID id) {
    // TODO: Implement PDF generation
    return null;
}

@PostMapping("/invoices/{id}/cancel")
public ResponseEntity<ApiResponse<InvoiceResponse>> cancelInvoice(@PathVariable UUID id, @RequestParam String reason) {
    // TODO: Implement cancellation logic
    return null;
}

@GetMapping("/gst/report")
public ResponseEntity<ApiResponse<Object>> getGstReport(@RequestParam LocalDate startDate, @RequestParam LocalDate endDate) {
    // TODO: Implement GST aggregation logic
    return null;
}
```

### 8. Missing Inventory APIs
**File:** `src/main/java/com/koderz/pawcareos/inventory/controller/InventoryController.java`
**Action:** Add method stubs for the missing APIs.
```java
@PostMapping("/stock/transfer")
public ResponseEntity<ApiResponse<Void>> transferStock(@RequestBody Object transferRequest) {
    // TODO: Implement inter-branch transfer logic
    return null;
}

@GetMapping("/low-stock")
public ResponseEntity<ApiResponse<List<InventoryItemResponse>>> getLowStock() {
    // TODO: Query items where currentStock <= reorderLevel
    return null;
}

@GetMapping("/expiry")
public ResponseEntity<ApiResponse<List<Object>>> getExpiringItems(@RequestParam(defaultValue = "30") int days) {
    // TODO: Query stock entries where expiryDate <= (today + days)
    return null;
}
```

### 9. Incorrect API Base Paths
**Files:** `BillingController.java`, `InventoryController.java`, `SupplierController.java`
**Action:** The BRD specifies `/api/v1/...`. Change the `@RequestMapping` at the top of these controllers.
```java
// Change this:
@RequestMapping("/v1/billing")
// To this:
@RequestMapping("/api/v1/billing")

// Do the same for /v1/inventory and /v1/inventory/suppliers
```

### 10. Generic Exception Handling
**Action:** Create custom exceptions that match the BRD error codes.
1. Create `src/main/java/com/koderz/pawcareos/common/exception/InsufficientStockException.java`
2. Create `DuplicateInvoiceException.java`
3. In `GlobalExceptionHandler.java`, add handlers for these:
```java
@ExceptionHandler(InsufficientStockException.class)
public ResponseEntity<ApiResponse<?>> handleInsufficientStock(InsufficientStockException ex) {
    // BRD says this should be 409 Conflict
    return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ApiResponse.builder()
                .success(false)
                .message(ex.getMessage()) // Ensure you include the ERR_INSUFFICIENT_STOCK code
                .build());
}
```
4. In `InventoryServiceImpl.java` around line 87, change `throw new RuntimeException("ERR_INSUFFICIENT_STOCK...");` to `throw new InsufficientStockException("...");`

### 11. Missing Pagination
**Action:** When implementing the list APIs (like `GET /items` or `GET /invoices`), do not return full lists. 
1. The BRD mandates cursor-based pagination, but Spring Data JPA's `Pageable` (offset-based) is a good starting point.
2. Update your repository methods to accept `Pageable`:
   ```java
   Page<InventoryItem> findAll(Pageable pageable);
   ```
3. Update your controllers to accept `@RequestParam int page, @RequestParam int size`.
