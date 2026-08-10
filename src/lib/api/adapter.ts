/**
 * Backend adapter layer.
 *
 * The Spring Boot backend speaks camelCase and uses different field names than
 * the frontend domain types (see frontend_integration_plan.md). Rather than
 * rewriting every component, all translation happens here, inside the API
 * client boundary:
 *
 *   component  ->  snake_case frontend types  ->  adapter  ->  backend JSON
 *
 * It also maps the mock layer's legacy paths, so the in-memory mocks keep
 * working while `endpoints.ts` points at the real backend routes.
 */

/* ------------------------------------------------------------------ *
 * Path mapping (real backend path -> legacy mock path)
 * ------------------------------------------------------------------ */

const PATH_ALIASES: [RegExp, string][] = [
  [/^\/reception\/queue$/, "/appointments/queue"],
  [/^\/reception\/check-in\/([^/]+)$/, "/appointments/$1/check-in"],
  [/^\/appointments\/search$/, "/appointments/mine"],
  [/^\/inventory\/items$/, "/medicines"],
  [/^\/inventory\/stock\/transfer$/, "/inventory/movements"],
  [/^\/staff-leaves\/search\/([^/]+)$/, "/doctors/$1/leave"],
  [/^\/staff-attendance\/staff\/([^/]+)$/, "/staff/$1/attendance"],
  [/^\/dashboard\/daily-summary$/, "/dashboard/portal"],
];

/** Converts a real backend path into the path the mock layer registers. */
export function toMockPath(path: string): string {
  const stripped = path.replace(/^\/api\/v1/, "").replace(/^\/api/, "");
  for (const [pattern, replacement] of PATH_ALIASES) {
    if (pattern.test(stripped)) return stripped.replace(pattern, replacement);
  }
  return stripped;
}

/* ------------------------------------------------------------------ *
 * Field-name mapping
 * ------------------------------------------------------------------ */

/** frontend key -> backend key (applied after generic camelCase conversion). */
const FIELD_TO_BACKEND: Record<string, string> = {
  name: "petName", // only meaningful on pet payloads; see adaptOutbound
  sex: "gender",
  age_years: "age",
  weight_kg: "weight",
  microchip_id: "microchipNumber",
  phone: "phoneNumber",
  species: "speciesId",
  breed: "breedId",
};

/** backend key -> frontend key. */
const FIELD_TO_FRONTEND: Record<string, string> = {
  petName: "name",
  gender: "sex",
  age: "age_years",
  weight: "weight_kg",
  microchipNumber: "microchip_id",
  phoneNumber: "phone",
  speciesId: "species",
  breedId: "breed",
  photoUrl: "photo_url",
};

const snakeToCamel = (k: string) => k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const camelToSnake = (k: string) => k.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();

type Json = unknown;

function mapKeys(value: Json, mapKey: (key: string) => string): Json {
  if (Array.isArray(value)) return value.map((v) => mapKeys(v, mapKey));
  if (value && typeof value === "object") {
    const out: Record<string, Json> = {};
    for (const [k, v] of Object.entries(value as Record<string, Json>)) {
      out[mapKey(k)] = mapKeys(v, mapKey);
    }
    return out;
  }
  return value;
}

/** Frontend payload -> backend JSON (camelCase + renamed fields). */
export function adaptOutbound<T>(body: T): T {
  return mapKeys(body, (k) => FIELD_TO_BACKEND[k] ?? snakeToCamel(k)) as T;
}

/** Backend JSON -> frontend shape (snake_case + renamed fields). */
export function adaptInbound<T>(data: unknown): T {
  const renamed = mapKeys(data, (k) => FIELD_TO_FRONTEND[k] ?? camelToSnake(k));
  return mergeNames(renamed) as T;
}

/**
 * The backend splits owner names into firstName/lastName and never returns
 * derived counts. Rebuild the fields the UI expects.
 */
function mergeNames(value: Json): Json {
  if (Array.isArray(value)) return value.map(mergeNames);
  if (value && typeof value === "object") {
    const obj = { ...(value as Record<string, Json>) };
    if (("first_name" in obj || "last_name" in obj) && !("name" in obj)) {
      obj.name = [obj.first_name, obj.last_name].filter(Boolean).join(" ").trim();
    }
    if (Array.isArray(obj.pets) && obj.pets_count === undefined) {
      obj.pets_count = obj.pets.length;
    }
    for (const [k, v] of Object.entries(obj)) obj[k] = mergeNames(v);
    return obj;
  }
  return value;
}

/** Splits a display name into the backend's firstName/lastName pair. */
export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}
