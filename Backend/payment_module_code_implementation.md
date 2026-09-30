# Payment Module Code Guide

Here is the step-by-step code implementation for the Payment Module.

---

## Step 1: Enums (`enums` package)

**PaymentMode.java**
```java
package com.koderz.pawcareos.payment.enums;

public enum PaymentMode {
    CASH, CARD, UPI, ONLINE
}
```

**PaymentStatus.java**
```java
package com.koderz.pawcareos.payment.enums;

public enum PaymentStatus {
    PENDING, SUCCESS, FAILED, UNKNOWN
}
```

**CreditNoteStatus.java**
```java
package com.koderz.pawcareos.payment.enums;

public enum CreditNoteStatus {
    DRAFT, ISSUED, FILED
}
```

**RefundReasonCode.java**
```java
package com.koderz.pawcareos.payment.enums;

public enum RefundReasonCode {
    SERVICE_ERROR, GOODS_RETURN, DUPLICATE_PAYMENT, OTHER
}
```

---

## Step 2: Entities (`entity` package)

**Payment.java**
```java
package com.koderz.pawcareos.payment.entity;

import com.koderz.pawcareos.billing.entity.Invoice;
import com.koderz.pawcareos.common.entity.BaseEntity;
import com.koderz.pawcareos.hospital.entity.Hospital;
import com.koderz.pawcareos.payment.enums.PaymentMode;
import com.koderz.pawcareos.payment.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice; 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital; 

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMode paymentMode;

    @Column(nullable = false)
    private BigDecimal amount;

    private String gatewayRef;
    private String gateway;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    private LocalDateTime paidAt;
    
    @Column(columnDefinition = "TEXT")
    private String remarks;

    private String maskedPan;
    private String gatewayToken;
    private String cardBrand;
}
```

**CreditNote.java**
```java
package com.koderz.pawcareos.payment.entity;

import com.koderz.pawcareos.auth.entity.User;
import com.koderz.pawcareos.billing.entity.Invoice;
import com.koderz.pawcareos.common.entity.BaseEntity;
import com.koderz.pawcareos.hospital.entity.Hospital;
import com.koderz.pawcareos.payment.enums.CreditNoteStatus;
import com.koderz.pawcareos.payment.enums.RefundReasonCode;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "credit_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditNote extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_invoice_id", nullable = false)
    private Invoice originalInvoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(nullable = false, unique = true)
    private String creditNoteNumber;

    @Column(nullable = false)
    private LocalDate issueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RefundReasonCode reasonCode;

    private String reasonDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CreditNoteStatus status;

    private BigDecimal subtotalReversal;
    private BigDecimal cgstReversal;
    private BigDecimal sgstReversal;
    private BigDecimal igstReversal;
    private BigDecimal totalReversal;
}
```

---

## Step 3: DTOs & Mapper (`dto` & `mapper` package)

### DTOs

**PaymentRequest.java**
```java
package com.koderz.pawcareos.payment.dto.request;

import com.koderz.pawcareos.payment.enums.PaymentMode;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PaymentRequest {
    @NotNull(message = "Invoice ID is required")
    private UUID invoiceId;

    @NotNull(message = "Payment mode is required")
    private PaymentMode paymentMode;

    @NotNull(message = "Amount is required")
    @Min(value = 0, message = "Amount must be positive")
    private BigDecimal amount;

    private String gatewayRef;
    private String gatewayToken;
    private String remarks;
    private String rawPan;
}
```

**RefundRequest.java**
```java
package com.koderz.pawcareos.payment.dto.request;

import com.koderz.pawcareos.payment.enums.RefundReasonCode;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RefundRequest {
    @NotNull(message = "Reason code is required")
    private RefundReasonCode reasonCode;

    private String reasonDescription;

    @NotNull(message = "Amount is required")
    @Min(value = 0, message = "Amount must be positive")
    private BigDecimal amount;
}
```

**PaymentResponse.java**
```java
package com.koderz.pawcareos.payment.dto.response;

import com.koderz.pawcareos.payment.enums.PaymentMode;
import com.koderz.pawcareos.payment.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PaymentResponse {
    private UUID id;
    private UUID invoiceId;
    private PaymentMode paymentMode;
    private BigDecimal amount;
    private String gatewayRef;
    private PaymentStatus status;
    private LocalDateTime paidAt;
    private String remarks;
    private String maskedPan;
}
```

### Mapper

**PaymentMapper.java**
```java
package com.koderz.pawcareos.payment.mapper;

import com.koderz.pawcareos.payment.dto.response.PaymentResponse;
import com.koderz.pawcareos.payment.entity.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PaymentMapper {

    @Mapping(source = "invoice.id", target = "invoiceId")
    PaymentResponse toDto(Payment payment);
}
```

---

## Step 4: Repositories (`repository` package)

**PaymentRepository.java**
```java
package com.koderz.pawcareos.payment.repository;

import com.koderz.pawcareos.payment.entity.Payment;
import com.koderz.pawcareos.payment.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByInvoiceId(UUID invoiceId);
    List<Payment> findByStatusAndCreatedAtBefore(PaymentStatus status, LocalDateTime threshold);
}
```

**CreditNoteRepository.java**
```java
package com.koderz.pawcareos.payment.repository;

import com.koderz.pawcareos.payment.entity.CreditNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CreditNoteRepository extends JpaRepository<CreditNote, UUID> {
    @Query("SELECT COUNT(c) FROM CreditNote c WHERE YEAR(c.issueDate) = YEAR(CURRENT_DATE)")
    long countByCurrentYear();
}
```

---

## Step 5: Service Implementation (`service` package)

**PaymentService.java**
```java
package com.koderz.pawcareos.payment.service;

import com.koderz.pawcareos.payment.dto.request.PaymentRequest;
import com.koderz.pawcareos.payment.dto.request.RefundRequest;
import com.koderz.pawcareos.payment.dto.response.PaymentResponse;
import java.util.UUID;
import java.util.List;

public interface PaymentService {
    PaymentResponse processPayment(PaymentRequest request);
    void processRefund(UUID paymentId, RefundRequest request);
    void handleGatewayWebhook(String payload, String signature);
    PaymentResponse getPaymentById(UUID id);
    List<PaymentResponse> getPaymentsByInvoice(UUID invoiceId);
}
```

**PaymentServiceImpl.java**
```java
package com.koderz.pawcareos.payment.service.impl;

import com.koderz.pawcareos.payment.dto.request.PaymentRequest;
import com.koderz.pawcareos.payment.dto.request.RefundRequest;
import com.koderz.pawcareos.payment.dto.response.PaymentResponse;
import com.koderz.pawcareos.payment.entity.CreditNote;
import com.koderz.pawcareos.payment.entity.Payment;
import com.koderz.pawcareos.payment.enums.CreditNoteStatus;
import com.koderz.pawcareos.payment.enums.PaymentStatus;
import com.koderz.pawcareos.payment.mapper.PaymentMapper;
import com.koderz.pawcareos.payment.repository.CreditNoteRepository;
import com.koderz.pawcareos.payment.repository.PaymentRepository;
import com.koderz.pawcareos.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final CreditNoteRepository creditNoteRepository;
    private final PaymentMapper paymentMapper;

    @Override
    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        String masked = null;
        if (request.getRawPan() != null && request.getRawPan().length() >= 4) {
            masked = "**** " + request.getRawPan().substring(request.getRawPan().length() - 4);
        }

        Payment payment = Payment.builder()
                .paymentMode(request.getPaymentMode())
                .amount(request.getAmount())
                .gatewayRef(request.getGatewayRef())
                .status(PaymentStatus.SUCCESS)
                .paidAt(LocalDateTime.now())
                .remarks(request.getRemarks())
                .maskedPan(masked)
                .gatewayToken(request.getGatewayToken())
                .build();

        payment = paymentRepository.save(payment);
        return paymentMapper.toDto(payment);
    }

    @Override
    @Transactional
    public void processRefund(UUID paymentId, RefundRequest request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (request.getAmount().compareTo(new BigDecimal("10000")) > 0) {
            boolean isSuperAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                    .stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
            if (!isSuperAdmin) {
                throw new AccessDeniedException("SuperAdmin approval required for refunds over ₹10,000");
            }
        }

        long count = creditNoteRepository.countByCurrentYear() + 1;
        String cnNumber = String.format("CN-%d-%04d", LocalDate.now().getYear(), count);

        CreditNote creditNote = CreditNote.builder()
                .payment(payment)
                .creditNoteNumber(cnNumber)
                .issueDate(LocalDate.now())
                .reasonCode(request.getReasonCode())
                .reasonDescription(request.getReasonDescription())
                .status(CreditNoteStatus.ISSUED)
                .totalReversal(request.getAmount())
                .build();

        creditNoteRepository.save(creditNote);
        log.info("Generated credit note: {}", cnNumber);
    }

    @Override
    public void handleGatewayWebhook(String payload, String signature) {
        log.info("Webhook received");
    }

    @Override
    public PaymentResponse getPaymentById(UUID id) {
        Payment payment = paymentRepository.findById(id).orElseThrow();
        return paymentMapper.toDto(payment);
    }

    @Override
    public List<PaymentResponse> getPaymentsByInvoice(UUID invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId).stream()
                .map(paymentMapper::toDto)
                .collect(Collectors.toList());
    }
}
```

---

## Step 6: Controller (`controller` package)

**PaymentController.java**
```java
package com.koderz.pawcareos.payment.controller;

import com.koderz.pawcareos.payment.dto.request.PaymentRequest;
import com.koderz.pawcareos.payment.dto.request.RefundRequest;
import com.koderz.pawcareos.payment.dto.response.PaymentResponse;
import com.koderz.pawcareos.payment.service.PaymentService;
import com.koderz.pawcareos.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> processPayment(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody PaymentRequest request) {
        
        PaymentResponse response = paymentService.processPayment(request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<PaymentResponse>builder()
                        .success(true)
                        .message("Payment processed successfully")
                        .data(response)
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @PostMapping("/{id}/refund")
    public ResponseEntity<ApiResponse<String>> initiateRefund(
            @PathVariable UUID id,
            @Valid @RequestBody RefundRequest request) {
        
        paymentService.processRefund(id, request);
        
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Refund initiated successfully")
                .data("Refund processing started")
                .timestamp(LocalDateTime.now())
                .build());
    }

    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse<Void>> handleWebhook(
            @RequestHeader("X-Gateway-Signature") String signature,
            @RequestBody String payload) {
        
        paymentService.handleGatewayWebhook(payload, signature);
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Webhook received successfully")
                .data(null)
                .timestamp(LocalDateTime.now())
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(@PathVariable UUID id) {
        PaymentResponse response = paymentService.getPaymentById(id);
        
        return ResponseEntity.ok(ApiResponse.<PaymentResponse>builder()
                .success(true)
                .message("Payment fetched successfully")
                .data(response)
                .timestamp(LocalDateTime.now())
                .build());
    }

    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentsByInvoice(@PathVariable UUID invoiceId) {
        List<PaymentResponse> responses = paymentService.getPaymentsByInvoice(invoiceId);
        
        return ResponseEntity.ok(ApiResponse.<List<PaymentResponse>>builder()
                .success(true)
                .message("Payments for invoice fetched successfully")
                .data(responses)
                .timestamp(LocalDateTime.now())
                .build());
    }
}
```
