# 🧾 Billing Module — Remaining API Implementation Steps

> Based on analysis of [inventory_billing_fixes_guide.md](file:///C:/Koderz/PawCareOs/Backend/veternaryBE/inventory_billing_fixes_guide.md) and current codebase state.

---

## ✅ What's Already Done

| Item | Status |
|------|--------|
| `createInvoice` POST API | ✅ Working |
| `@PostMapping` annotation (Issue #1) | ✅ Fixed |
| `quantity` typo (Issue #2) | ✅ Fixed |
| `@Param` import (Issue #3) | ✅ Fixed (using `org.springframework.data.repository.query.Param`) |
| Invoice number ORDER BY (Issue #4) | ✅ Fixed (`ORDER BY invoice_number DESC`) |
| Hospital relationship on Invoice (Issue #5) | ✅ Done (uses `@ManyToOne` to `Hospital` entity) |
| Base path `api/v1/billing` (Issue #9) | ✅ Fixed |
| `InsufficientStockException` (Issue #10) | ✅ Created |
| `BadRequestException` & `DuplicateResourceException` | ✅ Created |

---

## 🔴 What's Remaining — 4 Missing Billing APIs + Supporting Changes

These are the 4 APIs from **Issue #7** in the fixes guide that need to be implemented end-to-end.

---

## Step 1: Create `InvoiceUpdateRequest` DTO

**Create file:** `src/main/java/com/koderz/pawcareos/billing/dto/request/InvoiceUpdateRequest.java`

```java
package com.koderz.pawcareos.billing.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class InvoiceUpdateRequest {
    private UUID visitId;

    @NotEmpty(message = "At least one item is required")
    private List<InvoiceItemRequest> items;

    @Min(value = 0, message = "Discount cannot be negative")
    private BigDecimal discount = BigDecimal.ZERO;

    private boolean isInterState = false;
}
```

> [!NOTE]
> Unlike `InvoiceCreateRequest`, we don't allow changing `patientId` or `hospitalId` on update. Only items, discount, and tax type can be updated.

---

## Step 2: Create `GstReportResponse` DTO

**Create file:** `src/main/java/com/koderz/pawcareos/billing/dto/response/GstReportResponse.java`

```java
package com.koderz.pawcareos.billing.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class GstReportResponse {
    private LocalDate startDate;
    private LocalDate endDate;
    private long totalInvoices;
    private BigDecimal totalSubtotal;
    private BigDecimal totalCgst;
    private BigDecimal totalSgst;
    private BigDecimal totalIgst;
    private BigDecimal totalDiscount;
    private BigDecimal totalGrandTotal;
}
```

---

## Step 3: Add `cancellationReason` Field to `Invoice` Entity

**Edit file:** [Invoice.java](file:///C:/Koderz/PawCareOs/Backend/veternaryBE/src/main/java/com/koderz/pawcareos/billing/entity/Invoice.java)

Add this field after the `dueDate` field (around line 68):

```java
    @Column(name = "cancellation_reason")
    private String cancellationReason;
```

> [!IMPORTANT]
> After adding this field, Hibernate will auto-create the column if you have `spring.jpa.hibernate.ddl-auto=update`. Otherwise, run this SQL manually:
> ```sql
> ALTER TABLE invoices ADD COLUMN cancellation_reason VARCHAR(500);
> ```

---

## Step 4: Add Repository Query Methods

**Edit file:** [InvoiceRepository.java](file:///C:/Koderz/PawCareOs/Backend/veternaryBE/src/main/java/com/koderz/pawcareos/billing/repository/InvoiceRepository.java)

Add these methods inside the interface (after the existing `findLastInvoiceNumberForFinancialYear` method):

```java
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;

    // For listing invoices with pagination
    Page<Invoice> findAllByOrderByInvoiceDateDesc(Pageable pageable);

    // For GST report — fetch all PAID/PENDING invoices within a date range
    @Query("SELECT i FROM Invoice i WHERE i.invoiceDate >= :startDate AND i.invoiceDate <= :endDate AND i.status <> 'CANCELLED'")
    List<Invoice> findInvoicesForGstReport(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
```

> [!NOTE]
> The full import list at the top of the file should now include:
> ```java
> import org.springframework.data.domain.Page;
> import org.springframework.data.domain.Pageable;
> import java.util.List;
> ```

---

## Step 5: Update `BillingService` Interface

**Edit file:** [BillingService.java](file:///C:/Koderz/PawCareOs/Backend/veternaryBE/src/main/java/com/koderz/pawcareos/billing/service/BillingService.java)

Replace the entire content with:

```java
package com.koderz.pawcareos.billing.service;

import com.koderz.pawcareos.billing.dto.request.InvoiceCreateRequest;
import com.koderz.pawcareos.billing.dto.request.InvoiceUpdateRequest;
import com.koderz.pawcareos.billing.dto.response.GstReportResponse;
import com.koderz.pawcareos.billing.dto.response.InvoiceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface BillingService {
    InvoiceResponse generateInvoice(InvoiceCreateRequest request);

    InvoiceResponse getInvoiceById(UUID id);

    Page<InvoiceResponse> listInvoices(Pageable pageable);

    InvoiceResponse updateInvoice(UUID id, InvoiceUpdateRequest request);

    InvoiceResponse cancelInvoice(UUID id, String reason);

    GstReportResponse getGstReport(LocalDate startDate, LocalDate endDate);
}
```

---

## Step 6: Implement Service Methods in `BillingServiceImpl`

**Edit file:** [BillingServiceImpl.java](file:///C:/Koderz/PawCareOs/Backend/veternaryBE/src/main/java/com/koderz/pawcareos/billing/service/impl/BillingServiceImpl.java)

Add these imports at the top (merge with existing):

```java
import com.koderz.pawcareos.billing.dto.request.InvoiceUpdateRequest;
import com.koderz.pawcareos.billing.dto.response.GstReportResponse;
import com.koderz.pawcareos.common.exception.BadRequestException;
import com.koderz.pawcareos.common.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
```

Add these 4 methods **after** the existing `generateInvoice()` method and **before** the `generateNextInvoiceNumber()` method:

### 6a. `getInvoiceById`
```java
    @Override
    public InvoiceResponse getInvoiceById(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        return invoiceMapper.toDto(invoice);
    }
```

### 6b. `listInvoices`
```java
    @Override
    public Page<InvoiceResponse> listInvoices(Pageable pageable) {
        return invoiceRepository.findAllByOrderByInvoiceDateDesc(pageable)
                .map(invoiceMapper::toDto);
    }
```

### 6c. `updateInvoice`
```java
    @Override
    @Transactional
    public InvoiceResponse updateInvoice(UUID id, InvoiceUpdateRequest request) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));

        // Only DRAFT invoices can be updated
        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT invoices can be updated. Current status: " + invoice.getStatus());
        }

        // Delete existing items
        List<InvoiceItem> existingItems = invoiceItemRepository.findByInvoiceId(id);
        invoiceItemRepository.deleteAll(existingItems);

        // Recalculate with new items (same logic as generateInvoice)
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTaxAmount = BigDecimal.ZERO;
        List<InvoiceItem> newItems = new ArrayList<>();

        for (InvoiceItemRequest itemReq : request.getItems()) {
            InvoiceItem item = invoiceMapper.toItemEntity(itemReq);

            BigDecimal lineSubtotal = item.getQuantity().multiply(item.getUnitPrice());
            subtotal = subtotal.add(lineSubtotal);

            BigDecimal taxAmount = lineSubtotal.multiply(item.getTaxRate())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            item.setTaxAmount(taxAmount);
            totalTaxAmount = totalTaxAmount.add(taxAmount);

            item.setLineTotal(lineSubtotal.add(taxAmount));
            item.setInvoice(invoice);
            newItems.add(item);
        }

        BigDecimal cgst = BigDecimal.ZERO;
        BigDecimal sgst = BigDecimal.ZERO;
        BigDecimal igst = BigDecimal.ZERO;

        if (request.isInterState()) {
            igst = totalTaxAmount;
        } else {
            cgst = totalTaxAmount.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
            sgst = totalTaxAmount.subtract(cgst);
        }

        // Update invoice fields
        if (request.getVisitId() != null) {
            invoice.setVisitId(request.getVisitId());
        }
        invoice.setSubtotal(subtotal);
        invoice.setCgst(cgst);
        invoice.setSgst(sgst);
        invoice.setIgst(igst);
        invoice.setDiscount(request.getDiscount());

        BigDecimal grandTotal = subtotal.add(totalTaxAmount).subtract(request.getDiscount());
        invoice.setGrandTotal(grandTotal);

        Invoice savedInvoice = invoiceRepository.save(invoice);
        invoiceItemRepository.saveAll(newItems);

        return invoiceMapper.toDto(savedInvoice);
    }
```

### 6d. `cancelInvoice`
```java
    @Override
    @Transactional
    public InvoiceResponse cancelInvoice(UUID id, String reason) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BadRequestException("Invoice is already cancelled");
        }

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BadRequestException("Cannot cancel a PAID invoice. Issue a credit note instead.");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        invoice.setCancellationReason(reason);

        Invoice savedInvoice = invoiceRepository.save(invoice);
        return invoiceMapper.toDto(savedInvoice);
    }
```

### 6e. `getGstReport`
```java
    @Override
    public GstReportResponse getGstReport(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        List<Invoice> invoices = invoiceRepository.findInvoicesForGstReport(start, end);

        BigDecimal totalSubtotal = BigDecimal.ZERO;
        BigDecimal totalCgst = BigDecimal.ZERO;
        BigDecimal totalSgst = BigDecimal.ZERO;
        BigDecimal totalIgst = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalGrandTotal = BigDecimal.ZERO;

        for (Invoice inv : invoices) {
            totalSubtotal = totalSubtotal.add(inv.getSubtotal());
            totalCgst = totalCgst.add(inv.getCgst());
            totalSgst = totalSgst.add(inv.getSgst());
            totalIgst = totalIgst.add(inv.getIgst());
            totalDiscount = totalDiscount.add(inv.getDiscount());
            totalGrandTotal = totalGrandTotal.add(inv.getGrandTotal());
        }

        return GstReportResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalInvoices(invoices.size())
                .totalSubtotal(totalSubtotal)
                .totalCgst(totalCgst)
                .totalSgst(totalSgst)
                .totalIgst(totalIgst)
                .totalDiscount(totalDiscount)
                .totalGrandTotal(totalGrandTotal)
                .build();
    }
```

---

## Step 7: Update `BillingController` — Add All Missing Endpoints

**Edit file:** [BillingController.java](file:///C:/Koderz/PawCareOs/Backend/veternaryBE/src/main/java/com/koderz/pawcareos/billing/controller/BillingController.java)

Replace the entire file with:

```java
package com.koderz.pawcareos.billing.controller;

import com.koderz.pawcareos.billing.dto.request.InvoiceCreateRequest;
import com.koderz.pawcareos.billing.dto.request.InvoiceUpdateRequest;
import com.koderz.pawcareos.billing.dto.response.GstReportResponse;
import com.koderz.pawcareos.billing.dto.response.InvoiceResponse;
import com.koderz.pawcareos.billing.service.BillingService;
import com.koderz.pawcareos.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("api/v1/billing")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
public class BillingController {

    private final BillingService billingService;

    // ==================== EXISTING API ====================

    @PostMapping("/invoices")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(
            @RequestHeader(value = "idempotency-key", required = false) String idempotencyKey,
            @Valid @RequestBody InvoiceCreateRequest request) {

        InvoiceResponse response = billingService.generateInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<InvoiceResponse>builder()
                        .success(true)
                        .message("Invoice Generated Successfully")
                        .data(response)
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    // ==================== NEW APIs ====================

    // GET single invoice by ID
    @GetMapping("/invoices/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(@PathVariable UUID id) {
        InvoiceResponse response = billingService.getInvoiceById(id);
        return ResponseEntity.ok(
                ApiResponse.<InvoiceResponse>builder()
                        .success(true)
                        .message("Invoice fetched successfully")
                        .data(response)
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    // GET list of invoices with pagination
    @GetMapping("/invoices")
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> listInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<InvoiceResponse> invoices = billingService.listInvoices(pageable);

        return ResponseEntity.ok(
                ApiResponse.<Page<InvoiceResponse>>builder()
                        .success(true)
                        .message("Invoices fetched successfully")
                        .data(invoices)
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    // PUT update a DRAFT invoice
    @PutMapping("/invoices/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> updateInvoice(
            @PathVariable UUID id,
            @Valid @RequestBody InvoiceUpdateRequest request) {

        InvoiceResponse response = billingService.updateInvoice(id, request);
        return ResponseEntity.ok(
                ApiResponse.<InvoiceResponse>builder()
                        .success(true)
                        .message("Invoice updated successfully")
                        .data(response)
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    // POST cancel an invoice
    @PostMapping("/invoices/{id}/cancel")
    public ResponseEntity<ApiResponse<InvoiceResponse>> cancelInvoice(
            @PathVariable UUID id,
            @RequestParam String reason) {

        InvoiceResponse response = billingService.cancelInvoice(id, reason);
        return ResponseEntity.ok(
                ApiResponse.<InvoiceResponse>builder()
                        .success(true)
                        .message("Invoice cancelled successfully")
                        .data(response)
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    // GET GST report for a date range
    @GetMapping("/gst/report")
    public ResponseEntity<ApiResponse<GstReportResponse>> getGstReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        GstReportResponse report = billingService.getGstReport(startDate, endDate);
        return ResponseEntity.ok(
                ApiResponse.<GstReportResponse>builder()
                        .success(true)
                        .message("GST report generated successfully")
                        .data(report)
                        .timestamp(LocalDateTime.now())
                        .build());
    }
}
```

---

## Step 8: Add `DuplicateInvoiceException` Handler to `GlobalExceptionHandler`

**Edit file:** [GlobalExceptionHandler.java](file:///C:/Koderz/PawCareOs/Backend/veternaryBE/src/main/java/com/koderz/pawcareos/common/exception/GlobalExceptionHandler.java)

Add this method at the bottom of the class (before the closing `}`):

```java
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiResponse<Object>> handleDuplicateResource(
            DuplicateResourceException ex) {

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(
                        ApiResponse.builder()
                                .success(false)
                                .message("ERR_DUPLICATE_INVOICE : " + ex.getMessage())
                                .build()
                );
    }
```

---

## 📋 Implementation Checklist

Follow the steps **in order**. Check each one off as you complete it:

| # | File to Create/Edit | What to Do |
|---|---------------------|------------|
| 1 | **CREATE** `billing/dto/request/InvoiceUpdateRequest.java` | New DTO for update requests |
| 2 | **CREATE** `billing/dto/response/GstReportResponse.java` | New DTO for GST report |
| 3 | **EDIT** `billing/entity/Invoice.java` | Add `cancellationReason` field |
| 4 | **EDIT** `billing/repository/InvoiceRepository.java` | Add pagination query + GST report query |
| 5 | **EDIT** `billing/service/BillingService.java` | Add 5 new method signatures |
| 6 | **EDIT** `billing/service/impl/BillingServiceImpl.java` | Implement all 5 new methods |
| 7 | **REPLACE** `billing/controller/BillingController.java` | Full controller with 6 endpoints |
| 8 | **EDIT** `common/exception/GlobalExceptionHandler.java` | Add `DuplicateResourceException` handler |

---

## 🧪 Testing — Postman Requests

After implementation, test with these requests:

### Get Invoice by ID
```
GET http://localhost:8080/api/v1/billing/invoices/{invoice-id}
Authorization: Bearer <token>
```

### List Invoices (paginated)
```
GET http://localhost:8080/api/v1/billing/invoices?page=0&size=10
Authorization: Bearer <token>
```

### Update Draft Invoice
```
PUT http://localhost:8080/api/v1/billing/invoices/{invoice-id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "itemType": "CONSULTATION",
      "description": "General Checkup - Updated",
      "quantity": 1,
      "unitPrice": 800.00,
      "taxRate": 18.00
    }
  ],
  "discount": 50.00,
  "isInterState": false
}
```

### Cancel Invoice
```
POST http://localhost:8080/api/v1/billing/invoices/{invoice-id}/cancel?reason=Customer%20requested%20cancellation
Authorization: Bearer <token>
```

### GST Report
```
GET http://localhost:8080/api/v1/billing/gst/report?startDate=2026-04-01&endDate=2027-03-31
Authorization: Bearer <token>
```

> [!WARNING]
> The **PDF download** endpoint (`GET /invoices/{id}/download`) is **NOT included** in these steps because it requires a PDF generation library (like iText or OpenPDF) as a dependency. That should be a separate task. Let me know if you want steps for that too.
