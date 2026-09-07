# Supplier and Inventory Integration Summary

**Date**: September 2, 2026  
**Module**: Inventory, Suppliers & Master Data  
**Repository**: `veterinary-frontend` & `Backend` (PawCareOS)

---

## 1. Issues Identified & Resolved

### Issue 1: Supplier Address Not Displaying in Supplier Table
* **Symptoms**: The PostgreSQL database had the `address` column and stored address values, but on the frontend (`/app/suppliers`), all suppliers showed *"No address provided"*.
* **Root Causes**:
  1. Migration `V61__add_address_to_suppliers.sql` created the `address` column in PostgreSQL without populating addresses for pre-existing seed data (`V15`).
  2. MapStruct generates `SupplierMapperImpl.java` at compile-time. Running the backend in IntelliJ IDEA without a full rebuild caused the JVM to execute older bytecode where the `address` field wasn't mapped to `SupplierResponseDto`.
* **Fixes Applied**:
  * Created migration [`V62__seed_supplier_addresses.sql`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/resources/db/migration/V62__seed_supplier_addresses.sql) to populate addresses for all default suppliers.
  * Updated existing records in PostgreSQL (`Animal Health Inc.`, `Pet Supplies Co.`, `VetPharma Distributors`, `Ayush Supplier`, etc.).
  * Updated [`src/routes/app.suppliers.tsx`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/src/routes/app.suppliers.tsx) to render `{s.address}` under `{s.name}` with an italic fallback (`"No address provided"`) and fixed form state initialization.
  * Synchronized Flyway schema history checksums.

---

### Issue 2: Inventory "Select Item…" Dropdown Was Empty (HTTP 500 Error)
* **Symptoms**: In the Inventory tab (`/app/inventory`), the "Select item…" dropdown in the Stock Entry form was empty, and tracked items showed `0`.
* **Root Cause**:
  * `GET /api/v1/inventory/items` failed with a `500 Internal Server Error`:
    ```
    No enum constant com.koderz.pawcareos.inventory.enums.InventoryCategory.FOOD
    ```
  * The database contains seeded items with categories `FOOD`, `EQUIPMENT`, `HYGIENE`, `TOYS`, and `ACCESSORY`.
  * The Java enum [`InventoryCategory.java`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/java/com/koderz/pawcareos/inventory/enums/InventoryCategory.java) was missing those values, crashing the endpoint when JPA loaded entity records.
* **Fixes Applied**:
  * Updated [`InventoryCategory.java`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/java/com/koderz/pawcareos/inventory/enums/InventoryCategory.java) to include all valid categories (`FOOD`, `EQUIPMENT`, `HYGIENE`, `TOYS`, `ACCESSORY`, `MEDICINE`, `CONSUMABLE`, `GROOMING`, `PET_FOOD`).
  * Recompiled the Java backend with Maven (`mvnw compile` BUILD SUCCESS).
  * Added hospital tenant headers when loading inventory items and suppliers in [`app.inventory.tsx`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/src/routes/app.inventory.tsx).

---

### Issue 3: Supplier Address in Inventory Items Table
* **Enhancements**:
  * Added `supplierAddress` to [`InventoryItemResponse.java`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/java/com/koderz/pawcareos/inventory/dto/response/InventoryItemResponse.java) and mapped it from the latest purchase supplier in [`InventoryServiceImpl.java`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/java/com/koderz/pawcareos/inventory/service/impl/InventoryServiceImpl.java).
  * Added `supplierAddress?: string | null;` to [`StockItem`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/src/lib/api/billing-types.ts).
  * Rendered the supplier address under the supplier name in the inventory items table.

---

### Issue 4: Adding New Catalog Items & Stock
* **Enhancements**:
  * Added `+ New item` button and dialog panel to [`app.inventory.tsx`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/src/routes/app.inventory.tsx) allowing staff to create new product catalog items (SKU, Item Name, Category, HSN, Tax Rate, Unit, and Reorder Level).
  * Added `create` endpoint to `endpoints.inventory` in [`endpoints.ts`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/src/lib/api/endpoints.ts).

---

### Issue 5: Stock Adjustment Failed (null value in column "hospital_id" of relation "stock_entries")
* **Symptoms**: When submitting a stock adjustment in `/app/inventory` (e.g., deducting 2 units for damage), the action crashed with HTTP 500:
  ```
  ERROR: null value in column "hospital_id" of relation "stock_entries" violates not-null constraint
  ```
* **Root Causes**:
  1. `adjustStock` in `InventoryServiceImpl.java` created a `StockEntry` audit record without setting the `hospital` property (`entry.setHospital(...)`), violating the database NOT NULL constraint.
  2. The frontend form lacked a direction selector ("Reduce stock" vs "Add stock"), leaving ambiguity on whether users had to type a negative sign for damage/loss.
* **Fixes Applied**:
  * Updated [`StockAdjustRequest.java`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/java/com/koderz/pawcareos/inventory/dto/request/StockAdjustRequest.java) with `hospitalId` and `batchNumber`.
  * Updated [`InventoryController.java`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/java/com/koderz/pawcareos/inventory/controller/InventoryController.java) to accept `hospital-id` request header.
  * Updated [`InventoryServiceImpl.java`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/java/com/koderz/pawcareos/inventory/service/impl/InventoryServiceImpl.java) to set `entry.setHospital(hospital)`, link the specific batch number and expiry date, and track the adjustment quantity accurately.
  * Recompiled the Java backend with Maven (`mvnw compile` BUILD SUCCESS).
  * Enhanced `StockAdjustForm` in [`app.inventory.tsx`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/src/routes/app.inventory.tsx) with:
    * Direction selector: "Reduce stock (Damage, Expiry, Lost)" vs "Add stock (Found, Correction)".
    * Live stock projection preview pill showing `Current: 50 -> Adjustment: -2 -> Projected: 48`.
    * Automatic negative/positive sign normalization.
    * Hospital context headers and form state reset on completion.

---

### Issue 6: Expiry Alert Detection & Badging Fixes
* **Symptoms**:
  * Existing items with expiring or expired batches did not display the `Expires in Xd` or `Expired` badges in the inventory table.
  * The `/inventory/expiry` endpoint received `within_days=90`, but Spring Boot expected `@RequestParam int days`, defaulting to 30 days.
  * In the frontend, `expiringIds` mapped `i.id` instead of `i.itemId` as returned by `ExpiringStockResponse`.
  * The backend `nearestExpiry` calculation filtered out all dates before `LocalDate.now()`, which blanked out expiry dates for items that were already expired.
* **Fixes Applied**:
  * Refined `nearestExpiry` in [`InventoryServiceImpl.java`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/java/com/koderz/pawcareos/inventory/service/impl/InventoryServiceImpl.java) to find the nearest upcoming expiry date, or fallback to the earliest expired date if all batches are expired.
  * Recompiled the Java backend with Maven (`mvnw compile` BUILD SUCCESS).
  * Updated [`app.inventory.tsx`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/src/routes/app.inventory.tsx):
    * Sent `{ days: 90, within_days: 90 }` in the API call.
    * Mapped `i.itemId ?? i.id` in `expiringIds`.
    * Added **`Expiring soon`** metric card to the top stats grid.
    * Styled expired items with red badges (`bg-destructive/10 text-destructive`) and upcoming expiry with amber badges (`bg-clay/15 text-clay`).

---

### Issue 7: Batch vs. Aggregated Stock Expiry Ambiguity
* **Symptoms**:
  * For an item with multiple batches (e.g. `Premium Cat Food 3kg` with 43 BAG total: 3 BAG expiring in 27 days and 40 BAG safe until 2028), the generic badge `Expires in 27d` caused confusion about whether all 43 bags or only 3 bags were expiring.
* **Fixes Applied**:
  * **Batch-Aware Quantity Badges**: Badges now calculate the exact expiring batch quantity and display transparent counts (e.g., `3 of 43 BAG exp in 27d` or `All 43 BAG exp in 27d`).
  * **Detailed Nearest Expiry Column**: The expiry date column displays the specific batch number and its quantity beneath the date (e.g. `2026-10-01` over `Batch 3006 · 3 BAG`).
  * **Inline Collapsible Batch Breakdown**: Under the stock count (`43 BAG`), clicking `2 batches ▾` slides open a sub-row card listing every batch, its units, expiry date, and individual status (`Expired`, `In Xd`, or `Safe`).

---

## 2. Testing & Verification Guide

### How to Verify Suppliers (`/app/suppliers`)
1. **View Suppliers**: Verify all suppliers display their name with the address rendered in secondary text underneath.
2. **Create Supplier**: Click `+ New supplier`, enter details including address, and verify it appears in the list.
3. **Edit Supplier**: Click `Edit` on any supplier, modify the address, and click `Save changes`.
4. **Delete Supplier**: Click the trash icon to soft-delete a supplier.

---

### How to Add Stock & Catalog Items (`/app/inventory`)

#### Method A: Recording Stock for an Existing Item (Stock Entry)
1. Navigate to `/app/inventory`.
2. Under the **Stock movement** panel on the left, select the **Stock entry** tab.
3. Fill out the fields:
   * **Select item…**: Choose the product from the dropdown.
   * **Quantity**: e.g., `50`.
   * **Batch no.**: e.g., `BATCH-2026-09A`.
   * **Purchase Price** & **MRP**.
   * **Expiry Date**.
   * **Supplier (optional)**: Pick a supplier from the dropdown.
   * **Entry Type**: `Purchase`, `Opening Stock`, `Return`, or `Transfer`.
4. Click **Record entry**. Stock level updates immediately and the movement is recorded.

#### Method B: Registering a Brand New Catalog Item
1. On `/app/inventory`, click **`+ New item`** at the top right of the items panel.
2. Enter **SKU** (e.g. `VAC-003`), **Item name**, **Category**, **Tax rate**, **Unit**, and **Reorder level**.
3. Click **Save item**.

#### Method C: Adjusting Stock (Damage, Loss, or Correction)
1. On `/app/inventory`, click the **Adjust** tab in the **Stock movement** panel.
2. Select the item and batch.
3. Choose the action: **Reduce stock** (for damage/loss) or **Add stock**.
4. Enter quantity (e.g. `2`) and reason (e.g. `Broken during handling`).
5. Click **Apply adjustment**. Stock updates immediately, and the adjustment entry appears in **Recent movements**.

---

## 3. Key Files Modified

| File | Description |
| :--- | :--- |
| [`Backend/.../db/migration/V62__seed_supplier_addresses.sql`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/resources/db/migration/V62__seed_supplier_addresses.sql) | Database migration populating supplier addresses |
| [`Backend/.../inventory/enums/InventoryCategory.java`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/java/com/koderz/pawcareos/inventory/enums/InventoryCategory.java) | Added missing category enum constants (`FOOD`, `EQUIPMENT`, `HYGIENE`, `TOYS`, `ACCESSORY`) |
| [`Backend/.../inventory/dto/response/InventoryItemResponse.java`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/java/com/koderz/pawcareos/inventory/dto/response/InventoryItemResponse.java) | Added `supplierAddress` and `batches` response fields |
| [`Backend/.../inventory/dto/request/StockAdjustRequest.java`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/java/com/koderz/pawcareos/inventory/dto/request/StockAdjustRequest.java) | Added `hospitalId` and `batchNumber` to adjustment request DTO |
| [`Backend/.../inventory/repository/InventoryItemRepository.java`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/java/com/koderz/pawcareos/inventory/repository/InventoryItemRepository.java) | Added `findByHospitalId(UUID hospitalId)` for multi-tenant item isolation |
| [`Backend/.../inventory/service/InventoryService.java`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/java/com/koderz/pawcareos/inventory/service/InventoryService.java) | Added overloaded `getItems(UUID hospitalId)` |
| [`Backend/.../inventory/service/impl/InventoryServiceImpl.java`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/java/com/koderz/pawcareos/inventory/service/impl/InventoryServiceImpl.java) | Scoped items by hospital, filtered zero-stock batches from `nearestExpiry` / batch list, set `hospital` and `batchNumber` on adjustment entries |
| [`Backend/.../inventory/controller/InventoryController.java`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/Backend/src/main/java/com/koderz/pawcareos/inventory/controller/InventoryController.java) | Accepted `hospital-id` header in `/items` (GET) and `/stock/adjust` (POST) with role-based scoping |
| [`src/lib/api/billing-types.ts`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/src/lib/api/billing-types.ts) | Added `supplierAddress` and `batches` to `StockItem` interface |
| [`src/lib/api/endpoints.ts`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/src/lib/api/endpoints.ts) | Added `endpoints.inventory.create` |
| [`src/routes/app.suppliers.tsx`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/src/routes/app.suppliers.tsx) | Address rendering, edit form state, and fallback display |
| [`src/routes/app.inventory.tsx`](file:///d:/koderz/Vet/Frontend/veterinary-frontend/src/routes/app.inventory.tsx) | `+ New item` creation, batch-aware expiry badging & breakdown drawer, search & category/status filters, sorted dropdowns, over-deduction warning, and valuation NaN guard |

---

## 4. Multi-Tenant Scoping, Batch Expiry & UI Enhancements


### 4.1 Batch-Level Expiry Tracking & Breakdown
- **Problem**: When an item had 43 units in stock and a new batch of 3 units was added with an upcoming expiry date (< 1 month), the badge displayed "Expires in 27d", misleading clinic staff into thinking all 43 units were expiring soon.
- **Solution**:
  - The badge now clarifies exact quantities: e.g. **`3 of 43 Bags exp in 27d`**.
  - If hovered or expanded, users see the exact batch breakdown cards displaying each active batch's batch number, remaining quantity, expiry date, and status (`Safe`, `In Xd`, or `Expired`).
  - Added expandable batch drawer per item in the table to view all active batches.

### 4.2 Multi-Tenant Isolation for Items (`GET /api/v1/inventory/items`)
- **Problem**: `getItems` in `InventoryServiceImpl` called `inventoryItemRepository.findAll()`, leaking catalog items across all hospitals in the system.
- **Solution**:
  - Added `findByHospitalId(UUID hospitalId)` in `InventoryItemRepository`.
  - Updated `InventoryController` to read the `hospital-id` header and pass it down to `InventoryService`.
  - Non-super admins and scoped super admins now only see items belonging to their active hospital.

### 4.3 Ghost Expiry & Depleted Batch Filtering
- **Problem**: Depleted batches (where quantity was adjusted or sold down to 0) were still being counted toward `nearestExpiry` and rendered in the batch list, triggering false expiry alerts.
- **Solution**:
  - In `InventoryServiceImpl`, filtered `batches` with `.filter(b -> b.getQuantity().compareTo(BigDecimal.ZERO) > 0)`.
  - Calculated `nearestFutureExpiry` and `nearestExpiry` exclusively from active batches with `quantity > 0`.
  - In `getExpiringItems`, filtered out items whose `currentStock <= 0`.

### 4.4 Search, Category Filter & Status Quick-Pills
- Added search input in `/app/inventory` matching on item name and SKU.
- Added category dropdown filtering (`All Categories`, `Medicine`, `Consumable`, `Food`, etc.).
- Added status quick-filter pills: `All`, `Low stock`, and `Expiring`.
- Added empty state when no items match the filter criteria.

### 4.5 Valuation NaN Guard & Over-Deduction Protection
- Fixed `stockValue` calculation using `(i.currentStock || 0) * (i.unitPrice || 0)` so items with null unit prices don't cause `₹NaN` on the summary card.
- Alphabetically sorted item selection dropdowns in both **Stock Entry** and **Stock Adjust** forms.
- Added a visual warning banner in the **Stock Adjust** form when a user attempts to deduct more units than are currently in stock.

---

## 5. Pharmacy & Prescription Dispensing Integration

### 5.1 End-to-End Clinical Flow
- Doctor issues prescription during/after consultation with specific medications, dosage, frequency, and duration.
- Prescriptions arrive automatically in the **Pharmacy Command Center** (`/app/pharmacy`) under the **Pending Dispensation** tab.
- Pharmacists view full patient context (Pet name, species, breed, owner contact, attending vet).
- Pharmacists review itemized medications with real-time inventory stock match indicators and available batch expirations.
- Clicking **Dispense** opens the **Interactive Dispensation Modal**:
  - Matches each prescribed item to an active inventory medication.
  - Allows batch selection (defaults to earliest-expiring active batch via FEFO).
  - Verifies quantity against available stock with live short-stock warnings.
  - Submits to `POST /api/v1/pharmacy/dispense`.

### 5.2 Automatic Stock Deduction & Movement Ledger
- When dispensed, backend locks the inventory item (pessimistic lock) and deducts the quantity.
- Creates a `StockEntry` with entry type **`DISPENSATION`**, recording negative quantity and linking the prescription number.
- Updates `prescription.status = 'DISPENSED'` and records `dispensed_at` and `dispensed_by`.
- Prescriptions immediately move from **Pending** to **Dispensed History**.
- Official prescription PDF can be downloaded or printed anytime directly from the queue.


