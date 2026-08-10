# Frontend Integration Plan

This document outlines the necessary changes to the frontend codebase (`src/lib/api/endpoints.ts` and `src/lib/api/types.ts`) to successfully integrate with the existing Java Spring Boot backend. **No changes will be made to the backend.**

## 1. API Endpoint Mappings

The frontend `endpoints.ts` must be updated to point to the correct backend paths. The backend universally uses an `/api/v1` or `/api` prefix.

| Frontend Feature | Current \`endpoints.ts\` Path | Target Backend Path | Notes |
| :--- | :--- | :--- | :--- |
| **Auth Login** | \`/auth/login\` | *(Verify if backend has \`/api/auth/login\` or similar)* | |
| **Auth Signup** | \`/auth/signup\` | *(Needs custom implementation, backend lacks standard signup)* | |
| **Appointments Queue** | \`/appointments/queue\` | \`/api/v1/reception/queue\` | Handled by \`ReceptionQueueController\` |
| **Appointments Check-in**| \`/appointments/{id}/check-in\`| \`/api/v1/reception/check-in\` | Handled by \`ReceptionQueueController\` |
| **My Appointments** | \`/appointments/mine\` | \`POST /api/v1/appointments/search\`| Pass user constraints in request body |
| **Medicines** | \`/medicines\` | \`GET /api/v1/inventory/items\` | Requires filtering by category on frontend |
| **Inventory Movements** | \`/inventory/movements\` | \`POST /api/v1/inventory/stock/transfer\`| |
| **Doctor Leaves** | \`/doctors/{id}/leave\` | \`GET /api/v1/staff-leaves/search\` | Query by staff ID |
| **Staff Attendance** | \`/staff/{id}/attendance\` | \`/api/v1/staff-attendance/staff/{id}\`| |
| **Dashboard** | \`/dashboard/portal\` | \`/api/v1/dashboard/daily-summary\` | Use the closest summary available |

*Note: You must prefix almost all other standard endpoints with `/api/v1/` (e.g., `/api/v1/pets`, `/api/v1/pet-owners`).*

---

## 2. Variable Name & Data Model Changes

The frontend uses `snake_case` properties and specific field names, while the backend relies entirely on `camelCase` and different field names. 

Because we are **not changing the backend**, you must update `src/lib/api/types.ts` to match the backend's expected JSON structure, or create an API adapter layer (Axios interceptors or fetch wrappers) to transform the JSON.

### A. Pet Owner (\`PetOwner\`)

| Frontend Interface (\`PetOwner\`) | Backend Response (\`PetOwnerResponse\`) | Change Required |
| :--- | :--- | :--- |
| \`name\` | \`firstName\`, \`lastName\` | Split/Merge names in UI components |
| \`phone\` | \`phoneNumber\` | Rename variable |
| \`pets_count\` | *(Not provided)* | Calculate in frontend using \`pets.length\` |
| \`email\` | \`email\` | No change |
| \`address\` | \`address\` | No change |
| \`created_at\` | *(Not provided)* | Remove from UI or rely on mock date |

### B. Pet (\`Pet\`)

| Frontend Interface (\`Pet\`) | Backend Response (\`PetResponse\`) | Change Required |
| :--- | :--- | :--- |
| \`name\` | \`petName\` | Rename variable |
| \`sex\` | \`gender\` | Rename variable |
| \`age_years\` | \`age\` | Rename variable |
| \`weight_kg\` | \`weight\` | Rename variable |
| \`photo_url\` | \`photoUrl\` | Update to camelCase |
| \`microchip_id\` | \`microchipNumber\`| Rename variable |
| \`species\` *(String Literal)* | \`speciesId\` *(UUID)* | Frontend must fetch Species list and map UUID to String |
| \`breed\` *(String Literal)* | \`breedId\` *(UUID)* | Frontend must fetch Breed list and map UUID to String |
| \`owner_name\` | *(Not provided)* | Needs to be derived from the parent PetOwner object |

### C. Global Convention Updates
To match the backend, apply the following sweeping changes across all frontend components and types:
1. **Snake Case to Camel Case**: Update fields like \`created_at\` -> \`createdAt\`, \`invoice_amount\` -> \`invoiceAmount\`.
2. **ID References**: If the frontend expects an embedded object name (like \`breed: "Poodle"\`), it must now handle a UUID (\`breedId: "123e4567-e89b-12d3..."\`) and fetch the corresponding display name from Master Data APIs.

---

## 3. Implementation Strategy

Since changes are restricted to the frontend, follow these steps:

1. **Update `endpoints.ts`**: Remap all strings to include `/api/v1/` and point to the actual backend controllers (e.g., mapping `/medicines` to `/api/v1/inventory/items`).
2. **Update `types.ts`**: Refactor all interfaces to exactly match the backend DTOs (e.g., `PetResponse`, `PetOwnerResponse`).
3. **Refactor Components**: Fix the resulting TypeScript errors across all components (`.tsx` files). For instance, replace `pet.name` with `pet.petName`.
4. **Implement Adapters for Missing Data**: For fields like `pets_count` or `owner_name` that the backend no longer returns, calculate them on the fly inside the React components or custom hooks.
