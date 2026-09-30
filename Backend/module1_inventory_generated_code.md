# Module 1 - Inventory Generated Code

This file contains the complete, updated code for the remaining parts of the Inventory module, extending `BaseEntity`. You can refer to this file when you implement the changes later.

### 1. Enums & Entities

**`enums/EntryType.java`**
```java
package com.koderz.pawcareos.inventory.enums;

public enum EntryType {
    PURCHASE,
    RETURN,
    OPENING,
    ADJUSTMENT
}
```

**`entity/Supplier.java`**
```java
package com.koderz.pawcareos.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@Entity
@Table(name = "suppliers")
@SQLRestriction("is_deleted = false")
public class Supplier extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "contact_person", length = 100)
    private String contactPerson;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 20)
    private String gstin;

    @Column(name = "payment_terms", length = 100)
    private String paymentTerms;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
```

**`entity/StockEntry.java`**
```java
package com.koderz.pawcareos.inventory.entity;

import com.koderz.pawcareos.inventory.enums.EntryType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@Entity
@Table(name = "stock_entries")
@SQLRestriction("is_deleted = false")
public class StockEntry extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private InventoryItem item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(name = "batch_number", nullable = false, length = 50)
    private String batchNumber;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "purchase_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal purchasePrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal mrp;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 20)
    private EntryType entryType;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
```

---

### 2. DTOs

**`dto/request/SupplierCreateRequest.java`**
```java
package com.koderz.pawcareos.inventory.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SupplierCreateRequest {
    @NotBlank(message = "Supplier name is required")
    private String name;
    private String contactPerson;
    @NotBlank(message = "Phone number is required")
    private String phone;
    private String email;
    private String gstin;
    private String paymentTerms;
    private Integer leadTimeDays;
}
```

**`dto/request/StockEntryRequest.java`**
```java
package com.koderz.pawcareos.inventory.dto.request;

import com.koderz.pawcareos.inventory.enums.EntryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class StockEntryRequest {
    @NotNull(message = "Item ID is required")
    private UUID itemId;
    private UUID supplierId;
    
    @NotBlank(message = "Batch number is required")
    private String batchNumber;
    
    @NotNull
    @Positive(message = "Quantity must be positive")
    private BigDecimal quantity;
    
    @NotNull
    private BigDecimal purchasePrice;
    
    @NotNull
    private BigDecimal mrp;
    
    private LocalDate expiryDate;
    
    @NotNull(message = "Entry type is required")
    private EntryType entryType;
    
    private String notes;
}
```

**`dto/request/StockAdjustRequest.java`**
```java
package com.koderz.pawcareos.inventory.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class StockAdjustRequest {
    @NotNull(message = "Item ID is required")
    private UUID itemId;
    
    @NotNull(message = "Quantity to adjust is required")
    private BigDecimal quantity;
    
    private String notes;
}
```

---

### 3. Repositories

**`repository/SupplierRepository.java`**
```java
package com.koderz.pawcareos.inventory.repository;

import com.koderz.pawcareos.inventory.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface SupplierRepository extends JpaRepository<Supplier, UUID> {
    boolean existsByGstin(String gstin);
}
```

**`repository/StockEntryRepository.java`**
```java
package com.koderz.pawcareos.inventory.repository;

import com.koderz.pawcareos.inventory.entity.StockEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface StockEntryRepository extends JpaRepository<StockEntry, UUID> {
}
```

**`repository/InventoryItemRepository.java`** (Add this locking method to your existing interface)
```java
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

@Lock(LockModeType.PESSIMISTIC_WRITE)
@QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "0")})
@Query("SELECT i FROM InventoryItem i WHERE i.id = :id")
Optional<InventoryItem> findByIdWithPessimisticLock(@Param("id") UUID id);
```

---

### 4. Services

**`service/impl/SupplierServiceImpl.java`**
```java
package com.koderz.pawcareos.inventory.service.impl;

import com.koderz.pawcareos.inventory.dto.request.SupplierCreateRequest;
import com.koderz.pawcareos.inventory.entity.Supplier;
import com.koderz.pawcareos.inventory.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SupplierServiceImpl { 

    private final SupplierRepository supplierRepository;

    @Transactional
    public Supplier createSupplier(SupplierCreateRequest request) {
        if (request.getGstin() != null && supplierRepository.existsByGstin(request.getGstin())) {
            throw new RuntimeException("Supplier with this GSTIN already exists");
        }

        Supplier supplier = new Supplier();
        supplier.setName(request.getName());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setPhone(request.getPhone());
        supplier.setEmail(request.getEmail());
        supplier.setGstin(request.getGstin());
        supplier.setPaymentTerms(request.getPaymentTerms());
        supplier.setLeadTimeDays(request.getLeadTimeDays());

        return supplierRepository.save(supplier);
    }
}
```

**`service/impl/InventoryServiceImpl.java`** (Add these transactional methods to your existing service)
```java
import com.koderz.pawcareos.inventory.dto.request.StockEntryRequest;
import com.koderz.pawcareos.inventory.dto.request.StockAdjustRequest;
import com.koderz.pawcareos.inventory.entity.StockEntry;
import com.koderz.pawcareos.inventory.entity.Supplier;
import com.koderz.pawcareos.inventory.enums.EntryType;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Transactional
public void addStockEntry(StockEntryRequest request) {
    InventoryItem item = inventoryItemRepository.findById(request.getItemId())
            .orElseThrow(() -> new RuntimeException("Item not found"));
            
    Supplier supplier = null;
    if (request.getSupplierId() != null) {
        supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
    }

    // 1. Record the entry
    StockEntry entry = new StockEntry();
    entry.setItem(item);
    entry.setSupplier(supplier);
    entry.setBatchNumber(request.getBatchNumber());
    entry.setQuantity(request.getQuantity());
    entry.setPurchasePrice(request.getPurchasePrice());
    entry.setMrp(request.getMrp());
    entry.setExpiryDate(request.getExpiryDate());
    entry.setEntryType(request.getEntryType());
    entry.setNotes(request.getNotes());
    stockEntryRepository.save(entry);

    // 2. Update Master Stock
    item.setCurrentStock(item.getCurrentStock().add(request.getQuantity()));
    inventoryItemRepository.save(item);
}

@Transactional
public void adjustStock(StockAdjustRequest request) {
    // 1. PESSIMISTIC LOCK: Locks the row to prevent race conditions during updates
    InventoryItem item = inventoryItemRepository.findByIdWithPessimisticLock(request.getItemId())
            .orElseThrow(() -> new RuntimeException("Item not found"));

    // 2. Validate sufficient stock if reducing
    BigDecimal newStock = item.getCurrentStock().add(request.getQuantity());
    if (newStock.compareTo(BigDecimal.ZERO) < 0) {
        throw new RuntimeException("ERR_INSUFFICIENT_STOCK: Cannot reduce below 0");
    }

    // 3. Record Audit Entry
    StockEntry entry = new StockEntry();
    entry.setItem(item);
    entry.setBatchNumber("ADJUSTMENT");
    entry.setQuantity(request.getQuantity());
    entry.setPurchasePrice(BigDecimal.ZERO);
    entry.setMrp(BigDecimal.ZERO);
    entry.setEntryType(EntryType.ADJUSTMENT);
    entry.setNotes(request.getNotes());
    stockEntryRepository.save(entry);

    // 4. Update Stock
    item.setCurrentStock(newStock);
    inventoryItemRepository.save(item);
}
```

---

### 5. Controllers

**`controller/SupplierController.java`**
```java
package com.koderz.pawcareos.inventory.controller;

import com.koderz.pawcareos.inventory.dto.request.SupplierCreateRequest;
import com.koderz.pawcareos.inventory.service.impl.SupplierServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inventory/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierServiceImpl supplierService;

    @PostMapping
    public ResponseEntity<?> createSupplier(@Valid @RequestBody SupplierCreateRequest request) {
        return ResponseEntity.ok(supplierService.createSupplier(request));
    }
}
```

**`controller/InventoryController.java`** (Add these endpoints to your existing controller)
```java
import com.koderz.pawcareos.inventory.dto.request.StockEntryRequest;
import com.koderz.pawcareos.inventory.dto.request.StockAdjustRequest;
import org.springframework.web.bind.annotation.RequestHeader;

@PostMapping("/stock/entry")
public ResponseEntity<?> addStockEntry(
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
        @Valid @RequestBody StockEntryRequest request) {
        
    inventoryService.addStockEntry(request);
    return ResponseEntity.ok().build();
}

@PostMapping("/stock/adjust")
public ResponseEntity<?> adjustStock(
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
        @Valid @RequestBody StockAdjustRequest request) {
        
    inventoryService.adjustStock(request);
    return ResponseEntity.ok().build();
}
```
