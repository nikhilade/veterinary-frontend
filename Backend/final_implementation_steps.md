# 🚀 Final Implementation Checklist

This guide contains the exact steps and code snippets needed to finalize the Inventory and Billing modules. Issues that were already resolved in the codebase have been excluded.

---

### Step 1: Update API Base Paths & Fix Billing Mapping (Fix 1 & 9)
Open your controller files and update the `@RequestMapping` at the top of the class, and fix the missing slash on the `invoices` endpoint.
* **`BillingController.java`:** Change `@RequestMapping("/v1/billing")` to `@RequestMapping("/api/v1/billing")`.
* **`BillingController.java`:** Change `@PostMapping("invoices")` to `@PostMapping("/invoices")`.
* **`InventoryController.java`:** Change `@RequestMapping("/v1/inventory")` to `@RequestMapping("/api/v1/inventory")`.
* **`SupplierController.java`:** Change `@RequestMapping("/v1/inventory/suppliers")` to `@RequestMapping("/api/v1/inventory/suppliers")`.

---

### Step 2: Add Missing API Stubs (Fix 7 & 8)
Add these missing endpoints to your controllers so they align with the BRD.

**In `BillingController.java`**, add these methods:
```java
    @PutMapping("/invoices/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> updateInvoice(@PathVariable java.util.UUID id, @RequestBody Object updateRequest) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_IMPLEMENTED).build();
    }

    @GetMapping("/invoices/{id}/download")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable java.util.UUID id) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_IMPLEMENTED).build();
    }

    @PostMapping("/invoices/{id}/cancel")
    public ResponseEntity<ApiResponse<InvoiceResponse>> cancelInvoice(@PathVariable java.util.UUID id, @RequestParam String reason) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_IMPLEMENTED).build();
    }

    @GetMapping("/gst/report")
    public ResponseEntity<ApiResponse<Object>> getGstReport(@RequestParam java.time.LocalDate startDate, @RequestParam java.time.LocalDate endDate) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_IMPLEMENTED).build();
    }
```

**In `InventoryController.java`**, add these methods:
```java
    @PostMapping("/stock/transfer")
    public ResponseEntity<ApiResponse<Void>> transferStock(@RequestBody Object transferRequest) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_IMPLEMENTED).build();
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<java.util.List<InventoryItemResponse>>> getLowStock() {
        return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_IMPLEMENTED).build();
    }

    @GetMapping("/expiry")
    public ResponseEntity<ApiResponse<java.util.List<Object>>> getExpiringItems(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_IMPLEMENTED).build();
    }
```

---

### Step 3: Implement Idempotency (Fix 6)

**1. Create the Interceptor** (`src/main/java/com/koderz/pawcareos/common/interceptor/IdempotencyInterceptor.java`):
```java
package com.koderz.pawcareos.common.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class IdempotencyInterceptor implements HandlerInterceptor {
    private final Set<String> processedKeys = Collections.newSetFromMap(new ConcurrentHashMap<>());

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!"POST".equalsIgnoreCase(request.getMethod())) return true; 

        String idempotencyKey = request.getHeader("idempotency-key");
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            if (!processedKeys.add(idempotencyKey)) {
                response.setStatus(HttpStatus.CONFLICT.value());
                response.getWriter().write("{\"success\":false,\"message\":\"ERR_IDEMPOTENCY_CONFLICT\"}");
                response.setContentType("application/json");
                return false;
            }
        }
        return true;
    }
}
```

**2. Register it** (`src/main/java/com/koderz/pawcareos/common/config/WebMvcConfig.java`):
```java
package com.koderz.pawcareos.common.config;

import com.koderz.pawcareos.common.interceptor.IdempotencyInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {
    private final IdempotencyInterceptor idempotencyInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(idempotencyInterceptor).addPathPatterns("/api/v1/**");
    }
}
```

---

### Step 4: Fix Multi-Tenancy Fields (Fix 5)
Your `Invoice` already has the `hospital_id`. Open the following three files in `src/main/java/com/koderz/pawcareos/inventory/entity/`:
1. `InventoryItem.java`
2. `Supplier.java`
3. `StockEntry.java`

**Add this into each class:**
```java
    @jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @jakarta.persistence.JoinColumn(name = "hospital_id", nullable = false)
    private com.koderz.pawcareos.hospital.entity.Hospital hospital;
```

---

### Step 5: Custom Exceptions (Fix 10)

**1. Create `InsufficientStockException.java`** (`src/main/java/com/koderz/pawcareos/common/exception/InsufficientStockException.java`):
```java
package com.koderz.pawcareos.common.exception;
public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String message) { super(message); }
}
```

**2. Add the handler in `GlobalExceptionHandler.java`:**
```java
    @org.springframework.web.bind.annotation.ExceptionHandler(InsufficientStockException.class)
    public org.springframework.http.ResponseEntity<com.koderz.pawcareos.common.response.ApiResponse<?>> handleInsufficientStock(InsufficientStockException ex) {
        return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT).body(com.koderz.pawcareos.common.response.ApiResponse.builder()
                .success(false).message("ERR_INSUFFICIENT_STOCK: " + ex.getMessage()).build());
    }
```

**3. Throw it in `InventoryServiceImpl.java`:** 
Find where a generic `RuntimeException` is thrown for negative stock and replace it with:
```java
throw new com.koderz.pawcareos.common.exception.InsufficientStockException("Insufficient stock available");
```
