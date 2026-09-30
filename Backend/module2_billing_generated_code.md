# Module 2: Billing Management - Implementation Steps & Code

This document outlines the detailed step-by-step implementation for the Billing module. It strictly follows the architectural guidelines established in the **Inventory module**, specifically:
- Extending `BaseEntity` to handle audit fields automatically.
- Using `@SQLRestriction("is_deleted = false")` for soft deletes.
- Applying Lombok `@EqualsAndHashCode(callSuper = true)` and `@NoArgsConstructor` on entities.
- Integrating `ApiResponse` for standard unified responses.
- Leveraging `MapStruct` for DTO-Entity mapping.
- Utilizing `@SecurityRequirement` for Swagger authentication.

---

### Step 1: Create the Enums
Create the enums for invoice statuses and line item types.

**`billing/enums/InvoiceStatus.java`**
```java
package com.koderz.pawcareos.billing.enums;

public enum InvoiceStatus {
    DRAFT,
    PENDING,
    PAID,
    CANCELLED
}
```

**`billing/enums/ItemType.java`**
```java
package com.koderz.pawcareos.billing.enums;

public enum ItemType {
    CONSULTATION,
    LAB,
    PHARMACY,
    SURGERY,
    GROOMING
}
```

---

### Step 2: Create the Database Entities

**`billing/entity/Invoice.java`**
```java
package com.koderz.pawcareos.billing.entity;

import com.koderz.pawcareos.billing.enums.InvoiceStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@Entity
@Table(name = "invoices")
@SQLRestriction("is_deleted = false")
public class Invoice extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 30)
    private String invoiceNumber;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "visit_id")
    private UUID visitId;

    @Column(name = "invoice_date", nullable = false)
    private LocalDateTime invoiceDate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal cgst;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal sgst;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal igst;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discount;

    @Column(name = "grand_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal grandTotal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvoiceStatus status;

    @Column(name = "due_date")
    private LocalDate dueDate;
}
```

**`billing/entity/InvoiceItem.java`**
```java
package com.koderz.pawcareos.billing.entity;

import com.koderz.pawcareos.billing.enums.ItemType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@Entity
@Table(name = "invoice_items")
@SQLRestriction("is_deleted = false")
public class InvoiceItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 30)
    private ItemType itemType;

    @Column(nullable = false, length = 300)
    private String description;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal taxRate; 

    @Column(name = "tax_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;
}
```

---

### Step 3: Create Repositories

**`billing/repository/InvoiceRepository.java`**
```java
package com.koderz.pawcareos.billing.repository;

import com.koderz.pawcareos.billing.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    
    @Query(value = "SELECT invoice_number FROM invoices WHERE invoice_date >= :startDate AND invoice_date <= :endDate ORDER BY invoice_date DESC LIMIT 1", nativeQuery = true)
    Optional<String> findLastInvoiceNumberForFinancialYear(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate
    );
}
```

**`billing/repository/InvoiceItemRepository.java`**
```java
package com.koderz.pawcareos.billing.repository;

import com.koderz.pawcareos.billing.entity.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, UUID> {
    List<InvoiceItem> findByInvoiceId(UUID invoiceId);
}
```

---

### Step 4: Create DTOs (Request & Response)

**Request DTOs (`billing/dto/request`)**

```java
package com.koderz.pawcareos.billing.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class InvoiceCreateRequest {
    @NotNull(message = "Patient ID is required")
    private UUID patientId;
    private UUID visitId;
    @NotEmpty(message = "At least one item is required")
    private List<InvoiceItemRequest> items;
    @Min(value = 0, message = "Discount cannot be negative")
    private BigDecimal discount = BigDecimal.ZERO;
    private boolean isInterState = false; 
}
```

```java
package com.koderz.pawcareos.billing.dto.request;

import com.koderz.pawcareos.billing.enums.ItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class InvoiceItemRequest {
    @NotNull(message = "Item type is required")
    private ItemType itemType;
    @NotBlank(message = "Description is required")
    private String description;
    @NotNull
    @Positive(message = "Quantity must be positive")
    private BigDecimal quantity;
    @NotNull
    @PositiveOrZero(message = "Unit price must be zero or positive")
    private BigDecimal unitPrice;
    @NotNull
    @PositiveOrZero(message = "Tax rate must be zero or positive")
    private BigDecimal taxRate; 
}
```

**Response DTOs (`billing/dto/response`)**

```java
package com.koderz.pawcareos.billing.dto.response;

import com.koderz.pawcareos.billing.enums.InvoiceStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class InvoiceResponse {
    private UUID id;
    private String invoiceNumber;
    private UUID patientId;
    private UUID visitId;
    private LocalDateTime invoiceDate;
    private BigDecimal subtotal;
    private BigDecimal cgst;
    private BigDecimal sgst;
    private BigDecimal igst;
    private BigDecimal discount;
    private BigDecimal grandTotal;
    private InvoiceStatus status;
    private LocalDate dueDate;
}
```

---

### Step 5: Implement MapStruct Mapper
Use MapStruct to easily convert Entities to DTOs and vice-versa.

**`billing/mapper/InvoiceMapper.java`**
```java
package com.koderz.pawcareos.billing.mapper;

import com.koderz.pawcareos.billing.dto.request.InvoiceCreateRequest;
import com.koderz.pawcareos.billing.dto.request.InvoiceItemRequest;
import com.koderz.pawcareos.billing.dto.response.InvoiceResponse;
import com.koderz.pawcareos.billing.entity.Invoice;
import com.koderz.pawcareos.billing.entity.InvoiceItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface InvoiceMapper {
    
    InvoiceResponse toDto(Invoice invoice);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "invoice", ignore = true)
    InvoiceItem toItemEntity(InvoiceItemRequest request);
}
```

---

### Step 6: Implement Service Logic
Now we return the `InvoiceResponse` DTO instead of the raw entity, and use the mapper to construct the line items.

**`billing/service/BillingService.java`**
```java
package com.koderz.pawcareos.billing.service;

import com.koderz.pawcareos.billing.dto.request.InvoiceCreateRequest;
import com.koderz.pawcareos.billing.dto.response.InvoiceResponse;

public interface BillingService {
    InvoiceResponse generateInvoice(InvoiceCreateRequest request);
}
```

**`billing/service/impl/BillingServiceImpl.java`**
```java
package com.koderz.pawcareos.billing.service.impl;

import com.koderz.pawcareos.billing.dto.request.InvoiceCreateRequest;
import com.koderz.pawcareos.billing.dto.request.InvoiceItemRequest;
import com.koderz.pawcareos.billing.dto.response.InvoiceResponse;
import com.koderz.pawcareos.billing.entity.Invoice;
import com.koderz.pawcareos.billing.entity.InvoiceItem;
import com.koderz.pawcareos.billing.enums.InvoiceStatus;
import com.koderz.pawcareos.billing.mapper.InvoiceMapper;
import com.koderz.pawcareos.billing.repository.InvoiceItemRepository;
import com.koderz.pawcareos.billing.repository.InvoiceRepository;
import com.koderz.pawcareos.billing.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingServiceImpl implements BillingService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final InvoiceMapper invoiceMapper;

    @Override
    @Transactional
    public InvoiceResponse generateInvoice(InvoiceCreateRequest request) {
        
        String invoiceNumber = generateNextInvoiceNumber();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTaxAmount = BigDecimal.ZERO;
        List<InvoiceItem> savedItems = new ArrayList<>();

        for (InvoiceItemRequest itemReq : request.getItems()) {
            // Map request to entity
            InvoiceItem item = invoiceMapper.toItemEntity(itemReq);

            BigDecimal lineSubtotal = item.getQuantity().multiply(item.getUnitPrice());
            subtotal = subtotal.add(lineSubtotal);

            BigDecimal taxAmount = lineSubtotal.multiply(item.getTaxRate())
                                               .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            item.setTaxAmount(taxAmount);
            totalTaxAmount = totalTaxAmount.add(taxAmount);
            item.setLineTotal(lineSubtotal.add(taxAmount));
            savedItems.add(item);
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

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setPatientId(request.getPatientId());
        invoice.setVisitId(request.getVisitId());
        invoice.setInvoiceDate(LocalDateTime.now());
        invoice.setStatus(InvoiceStatus.PENDING);
        
        invoice.setSubtotal(subtotal);
        invoice.setCgst(cgst);
        invoice.setSgst(sgst);
        invoice.setIgst(igst);
        invoice.setDiscount(request.getDiscount());
        
        BigDecimal grandTotal = subtotal.add(totalTaxAmount).subtract(request.getDiscount());
        invoice.setGrandTotal(grandTotal);
        
        Invoice savedInvoice = invoiceRepository.save(invoice);

        savedItems.forEach(item -> item.setInvoice(savedInvoice));
        invoiceItemRepository.saveAll(savedItems);

        return invoiceMapper.toDto(savedInvoice);
    }

    private String generateNextInvoiceNumber() {
        LocalDateTime now = LocalDateTime.now();
        int currentYear = now.getYear();
        int currentMonth = now.getMonthValue();

        // 1. Determine the Financial Year bounds (April 1st to March 31st)
        int fyStartYear;
        int fyEndYear;

        if (currentMonth >= 4) { // April to December
            fyStartYear = currentYear;
            fyEndYear = currentYear + 1;
        } else { // January to March
            fyStartYear = currentYear - 1;
            fyEndYear = currentYear;
        }

        LocalDateTime fyStart = LocalDateTime.of(fyStartYear, 4, 1, 0, 0, 0);
        LocalDateTime fyEnd = LocalDateTime.of(fyEndYear, 3, 31, 23, 59, 59);

        // Format the FY String. Example: 2026 to 2027 becomes "2627"
        String fyString = String.format("%02d%02d", fyStartYear % 100, fyEndYear % 100);
        String prefix = "INV-" + fyString + "-"; // Example: "INV-2627-"

        // 2. Fetch the highest invoice number generated in this exact Financial Year
        java.util.Optional<String> lastInvoiceNumberOpt = invoiceRepository.findLastInvoiceNumberForFinancialYear(fyStart, fyEnd);

        if (lastInvoiceNumberOpt.isEmpty()) {
            // First invoice of the financial year
            return prefix + "00001";
        }

        // 3. Parse and Increment the last number
        String lastInvoiceNumber = lastInvoiceNumberOpt.get(); // e.g., "INV-2627-00045"
        
        String[] parts = lastInvoiceNumber.split("-");
        String sequenceString = parts[parts.length - 1]; // gets "00045"
        
        int nextSequence = Integer.parseInt(sequenceString) + 1; 
        
        // Format back to a 5-digit padded string
        String nextSequenceFormatted = String.format("%05d", nextSequence);

        return prefix + nextSequenceFormatted;
    }
}
```

---

### Step 7: Create the Controller & Wrap with ApiResponse
Follow the `InventoryController` structure, returning `ApiResponse` and enforcing the bearer token.

**`billing/controller/BillingController.java`**
```java
package com.koderz.pawcareos.billing.controller;

import com.koderz.pawcareos.billing.dto.request.InvoiceCreateRequest;
import com.koderz.pawcareos.billing.dto.response.InvoiceResponse;
import com.koderz.pawcareos.billing.service.BillingService;
import com.koderz.pawcareos.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/v1/billing")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/invoices")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(
            @RequestHeader(value = "idempotency-key", required = false) String idempotencyKey, 
            @Valid @RequestBody InvoiceCreateRequest request) {
        
        InvoiceResponse response = billingService.generateInvoice(request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<InvoiceResponse>builder()
                        .success(true)
                        .message("Invoice generated successfully")
                        .data(response)
                        .timestamp(LocalDateTime.now())
                        .build());
    }
}
```
