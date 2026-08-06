import type { ApiResponse, LoginResponse, Role } from "../api/types";
import { ROLES } from "../api/types";
import { endpoints } from "../api/endpoints";
import {
  appointments,
  branches,
  tokenState,

  communications,
  medicalEvents,
  ownerDocuments,
  vaccines,
  doctors,
  inventory,
  invoices,
  owners,
  pets,
  prescriptions,
  roleByEmailPrefix,
  staffDashboard,
} from "./data";
import {
  consultations,
  doctorAvailability,
  doctorLeaves,
  doctorProfiles,
  medicines,
  prescriptionItems,
} from "./clinical";
import { buildTextPdf } from "./pdf";
import { billingRoutes } from "./billing-handlers";
import { analyticsRoutes } from "./analytics";
import { tenancyRoutes } from "./tenancy";

import type { AvailabilityRule, Prescription, PrescriptionDetail, PrescriptionItem } from "../api/types";


/** Mock layer. Never import this from components — always go through api-client. */

function envelope<T>(data: T, overrides: Partial<ApiResponse<T>> = {}): ApiResponse<T> {
  const count = Array.isArray(data) ? data.length : 1;
  return {
    success: true,
    data,
    error: null,
    meta: { total_count: count, has_next_page: false, next_cursor: null, limit: 50 },
    ...overrides,
  };
}

/** Cursor-based pagination for list endpoints (?cursor=&limit=). */
function paginate<T>(all: T[], query: URLSearchParams): ApiResponse<T[]> {
  const limit = Math.max(1, Number(query.get("limit") ?? 10));
  const start = Number(query.get("cursor") ?? 0) || 0;
  const slice = all.slice(start, start + limit);
  const next = start + limit;
  const hasNext = next < all.length;
  return {
    success: true,
    data: slice,
    error: null,
    meta: {
      total_count: all.length,
      has_next_page: hasNext,
      next_cursor: hasNext ? String(next) : null,
      limit,
    },
  };
}

function failure(code: string, message: string): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: { code, message, data: {} },
    meta: { total_count: 0, has_next_page: false, next_cursor: null, limit: 50 },
  };
}

/**
 * Slot-lock simulation: roughly one in four slots fails its first booking
 * attempt with ERR_SLOT_LOCK_TIMEOUT so the retry UX is exercisable.
 */
const lockedSlots = new Set<string>();
function shouldLock(doctorId: string, iso: string) {
  const seed = [...`${doctorId}${iso}`].reduce((a, c) => a + c.charCodeAt(0), 0);
  return seed % 4 === 0;
}



function base64url(value: string) {
  const b64 = typeof btoa === "function" ? btoa(value) : Buffer.from(value).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function createMockJwt(payload: Record<string, unknown>) {
  const header = base64url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = base64url(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 }),
  );
  return `${header}.${body}.mock-signature`;
}

function roleFromEmail(email: string, requested?: string): Role {
  if (requested && (ROLES as readonly string[]).includes(requested)) return requested as Role;
  const prefix = email.split("@")[0]?.toLowerCase() ?? "";
  for (const [key, role] of Object.entries(roleByEmailPrefix)) {
    if (prefix.startsWith(key)) return role;
  }
  return "PET_OWNER";
}

function login(body: Record<string, unknown>): ApiResponse<LoginResponse> | ApiResponse<null> {
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  if (!email || password.length < 4) {
    return failure("INVALID_CREDENTIALS", "Email and password (min 4 characters) are required.");
  }
  const role = roleFromEmail(email, body.role as string | undefined);
  const name =
    (body.name as string | undefined) ||
    email
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const user = { id: `usr_${email.length}${role.length}`, name, email, role, avatar_url: null };
  return envelope({ token: createMockJwt({ sub: user.id, email, role }), user });
}

const currentOwnerId = "own_1";

function ownerOf(petId: string) {
  return pets.find((p) => p.id === petId)?.owner_id ?? "";
}

/** Expands a stored prescription into the detail shape (owner + line items). */
function withItems(p: Prescription): PrescriptionDetail {
  const pet = pets.find((x) => x.id === p.pet_id);
  return {
    ...p,
    owner_id: pet?.owner_id ?? "",
    owner_name: pet?.owner_name ?? "",
    appointment_id: null,
    consultation_id: null,
    items: prescriptionItems[p.id] ?? [],
  };
}


type Handler = (ctx: {
  method: string;
  body: Record<string, unknown>;
  query: URLSearchParams;
}) => ApiResponse<unknown>;

const routes: { pattern: RegExp; handler: Handler }[] = [
  ...billingRoutes,
  ...analyticsRoutes,
  ...tenancyRoutes,

  {
    pattern: /^\/pet-owners\/lookup-or-create$/,
    handler: ({ body }) => {
      const phone = String(body.phone ?? "").trim();
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 6) return failure("INVALID_PHONE", "A valid phone number is required.");
      const existing = owners.find((o) => o.phone.replace(/\D/g, "") === digits);
      if (existing) return envelope({ owner: existing, created: false });
      if (body.lookup_only) return envelope({ owner: null, created: false });
      const created = {
        id: `own_${owners.length + 1}`,
        name: String(body.name ?? "New Owner"),
        email: String(body.email ?? ""),
        phone,
        address: String(body.address ?? ""),
        pets_count: 0,
        created_at: new Date().toISOString(),
      };
      owners.push(created);
      return envelope({ owner: created, created: true });
    },
  },
  {
    pattern: /^\/pet-owners\/([^/]+)\/documents$/,
    handler: ({ method, body, query }) => {
      const ownerId = query.get("__p1")!;
      if (method === "POST") {
        const doc = {
          id: `doc_${ownerDocuments.length + 1}`,
          owner_id: ownerId,
          name: String(body.name ?? "document.pdf"),
          type: (body.type as "Other") ?? "Other",
          size_kb: Number(body.size_kb ?? 120),
          uploaded_at: new Date().toISOString(),
        };
        ownerDocuments.push(doc);
        return envelope(doc);
      }
      return envelope(ownerDocuments.filter((d) => d.owner_id === ownerId));
    },
  },
  {
    pattern: /^\/pet-owners\/([^/]+)\/communications$/,
    handler: ({ query }) =>
      envelope(
        communications
          .filter((c) => c.owner_id === query.get("__p1"))
          .sort((a, b) => b.sent_at.localeCompare(a.sent_at)),
      ),
  },
  {
    pattern: /^\/pets\/lookup-or-create$/,
    handler: ({ body }) => {
      const owner = owners.find((o) => o.id === body.owner_id) ?? owners[0];
      const name = String(body.name ?? "").trim();
      if (!name) return failure("INVALID_NAME", "Pet name is required.");
      const existing = pets.find(
        (p) => p.owner_id === owner.id && p.name.toLowerCase() === name.toLowerCase(),
      );
      if (existing) return envelope({ pet: existing, created: false });
      const created = {
        id: `pet_${pets.length + 1}`,
        owner_id: owner.id,
        owner_name: owner.name,
        name,
        species: (body.species as "Dog") ?? "Dog",
        breed: String(body.breed ?? "Mixed"),
        sex: (body.sex as "Male") ?? "Male",
        age_years: Number(body.age_years ?? 1),
        weight_kg: Number(body.weight_kg ?? 5),
        photo_url: (body.photo_url as string | null) ?? null,
        microchip_id: (body.microchip_id as string | null) || null,
        allergies: String(body.allergies ?? ""),
        color: String(body.color ?? ""),
        notes: String(body.notes ?? ""),
      };
      pets.push(created);
      owner.pets_count += 1;
      return envelope({ pet: created, created: true });
    },
  },
  {
    pattern: /^\/pets\/history\/([^/]+)$/,
    handler: ({ query }) =>
      envelope(
        medicalEvents
          .filter((e) => e.pet_id === query.get("__p1"))
          .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
      ),
  },
  {
    pattern: /^\/pets\/([^/]+)\/vaccines$/,
    handler: ({ query }) => envelope(vaccines.filter((v) => v.pet_id === query.get("__p1"))),
  },
  {
    pattern: /^\/vaccines\/due$/,
    handler: ({ query }) => {
      const withinDays = Number(query.get("within_days") ?? 30);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + withinDays);
      const due = vaccines
        .filter((v) => new Date(v.next_due_date) <= cutoff)
        .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));
      return paginate(due, query);
    },
  },
  {
    pattern: /^\/vaccines$/,
    handler: ({ method, body, query }) => {
      if (method === "POST") {
        const pet = pets.find((p) => p.id === body.pet_id);
        if (!pet) return failure("PET_REQUIRED", "Select a pet for this vaccination.");
        const vaccinationDate = String(body.vaccination_date ?? "");
        const nextDue = String(body.next_due_date ?? "");
        if (!vaccinationDate || !nextDue) return failure("INVALID_DATES", "Both dates are required.");
        if (new Date(nextDue) <= new Date(vaccinationDate)) {
          return failure("INVALID_DATES", "Next due date must be after the vaccination date.");
        }
        const created = {
          id: `vac_${vaccines.length + 1}`,
          pet_id: pet.id,
          pet_name: pet.name,
          owner_id: pet.owner_id,
          owner_name: pet.owner_name,
          vaccine_name: String(body.vaccine_name ?? "Vaccine"),
          batch_no: String(body.batch_no ?? ""),
          vaccination_date: vaccinationDate,
          next_due_date: nextDue,
          administered_by: String(body.administered_by ?? "Clinic staff"),
        };
        vaccines.push(created);
        return envelope(created);
      }
      return paginate(vaccines, query);
    },
  },
  {
    pattern: /^\/appointments\/([^/]+)\/reschedule$/,
    handler: ({ body, query }) => {
      const found = appointments.find((a) => a.id === query.get("__p1"));
      if (!found) return failure("NOT_FOUND", "Appointment not found.");
      const target = String(body.scheduled_at ?? found.scheduled_at);
      const clash = appointments.find(
        (a) =>
          a.id !== found.id &&
          a.doctor_id === (body.doctor_id ?? found.doctor_id) &&
          a.scheduled_at === target &&
          !["CANCELLED", "NO_SHOW"].includes(a.status),
      );
      if (clash) return failure("ERR_DOUBLE_BOOKING", "That slot was just taken. Pick another one.");
      found.scheduled_at = target;
      if (body.doctor_id) {
        const doc = doctors.find((d) => d.id === body.doctor_id);
        if (doc) {
          found.doctor_id = doc.id;
          found.doctor_name = doc.name;
        }
      }
      if (found.status === "CANCELLED" || found.status === "NO_SHOW") found.status = "SCHEDULED";
      return envelope(found);
    },
  },
  {
    pattern: /^\/appointments\/([^/]+)\/cancel$/,
    handler: ({ query }) => {
      const found = appointments.find((a) => a.id === query.get("__p1"));
      if (!found) return failure("NOT_FOUND", "Appointment not found.");
      found.status = "CANCELLED";
      return envelope(found);
    },
  },
  {
    pattern: /^\/appointments\/([^/]+)\/check-in$/,
    handler: ({ query }) => {
      const found = appointments.find((a) => a.id === query.get("__p1"));
      if (!found) return failure("NOT_FOUND", "Appointment not found.");
      if (found.token_number) return envelope(found);
      tokenState.last += 1;
      found.token_number = tokenState.last;
      found.status = "CHECKED_IN";
      found.checked_in_at = new Date().toISOString();
      return envelope(found);
    },
  },
  {
    pattern: /^\/appointments\/([^/]+)\/status$/,
    handler: ({ body, query }) => {
      const found = appointments.find((a) => a.id === query.get("__p1"));
      if (!found) return failure("NOT_FOUND", "Appointment not found.");
      found.status = String(body.status ?? found.status) as typeof found.status;
      return envelope(found);
    },
  },
  {
    pattern: /^\/appointments\/queue$/,
    handler: ({ query }) => {
      const branchId = query.get("branch_id") ?? "br_1";
      const today = new Date().toDateString();
      const list = appointments
        .filter((a) => (a.branch_id ?? "br_1") === branchId && new Date(a.scheduled_at).toDateString() === today)
        .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
      return envelope(list);
    },
  },
  { pattern: /^\/branches$/, handler: () => envelope(branches) },

  { pattern: new RegExp(`^${endpoints.auth.login}$`), handler: ({ body }) => login(body) },
  { pattern: new RegExp(`^${endpoints.auth.signup}$`), handler: ({ body }) => login(body) },
  {
    pattern: new RegExp(`^${endpoints.auth.logout}$`),
    handler: () => envelope({ ok: true }),
  },
  {
    pattern: /^\/pet-owners\/([^/]+)\/pets$/,
    handler: ({ query }) => {
      const ownerId = query.get("__p1")!;
      return envelope(pets.filter((p) => p.owner_id === ownerId));
    },
  },
  {
    pattern: /^\/pet-owners\/search$/,
    handler: ({ query }) => {
      const q = (query.get("q") ?? "").trim().toLowerCase();
      const digits = q.replace(/\D/g, "");
      const matches = !q
        ? owners.slice(0, 5)
        : owners.filter(
            (o) =>
              (digits.length >= 2 && o.phone.replace(/\D/g, "").includes(digits)) ||
              o.name.toLowerCase().includes(q) ||
              o.email.toLowerCase().includes(q),
          );
      return paginate(matches, query);
    },
  },
  {
    pattern: /^\/pet-owners\/([^/]+)$/,
    handler: ({ method, body, query }) => {
      const found = owners.find((o) => o.id === query.get("__p1"));
      if (!found) return failure("NOT_FOUND", "Pet owner not found.");
      if (method === "PATCH") {
        Object.assign(found, {
          name: String(body.name ?? found.name),
          email: String(body.email ?? found.email),
          phone: String(body.phone ?? found.phone),
          address: String(body.address ?? found.address),
        });
      }
      return envelope(found);
    },
  },
  {
    pattern: /^\/pet-owners$/,
    handler: ({ method, body, query }) => {
      if (method === "POST") {
        const phone = String(body.phone ?? "");
        const existing = owners.find((o) => o.phone.replace(/\D/g, "") === phone.replace(/\D/g, "") && phone !== "");
        if (existing) return envelope(existing);
        const created = {
          id: `own_${owners.length + 1}`,
          name: String(body.name ?? "New Owner"),
          email: String(body.email ?? ""),
          phone,
          address: String(body.address ?? ""),
          pets_count: 0,
          created_at: new Date().toISOString(),
        };
        owners.push(created);
        return envelope(created);
      }
      return paginate(owners, query);
    },
  },
  {
    pattern: /^\/pets\/([^/]+)$/,
    handler: ({ method, body, query }) => {
      const found = pets.find((p) => p.id === query.get("__p1"));
      if (!found) return failure("NOT_FOUND", "Pet not found.");
      if (method === "PATCH") Object.assign(found, body);
      return envelope(found);
    },
  },
  {
    pattern: /^\/pets$/,
    handler: ({ method, body, query }) => {
      if (method === "POST") {
        const owner = owners.find((o) => o.id === body.owner_id) ?? owners[0];
        const created = {
          id: `pet_${pets.length + 1}`,
          owner_id: owner.id,
          owner_name: owner.name,
          name: String(body.name ?? "New Pet"),
          species: (body.species as "Dog") ?? "Dog",
          breed: String(body.breed ?? "Mixed"),
          sex: (body.sex as "Male") ?? "Male",
          age_years: Number(body.age_years ?? 1),
          weight_kg: Number(body.weight_kg ?? 5),
          photo_url: null,
          microchip_id: null,
        };
        pets.push(created);
        owner.pets_count += 1;
        return envelope(created);
      }
      const ownerId = query.get("owner_id");
      return paginate(ownerId ? pets.filter((p) => p.owner_id === ownerId) : pets, query);
    },
  },
  {
    pattern: /^\/doctors\/([^/]+)\/availability$/,
    handler: ({ method, body, query }) => {
      const id = query.get("__p1")!;
      if (!doctors.some((d) => d.id === id)) return failure("NOT_FOUND", "Doctor not found.");
      if (method === "PUT" || method === "PATCH" || method === "POST") {
        const rules = (body.rules as AvailabilityRule[] | undefined) ?? [];
        const invalid = rules.find((r) => r.enabled && r.end_hour <= r.start_hour);
        if (invalid) return failure("ERR_INVALID_RANGE", "End time must be after the start time.");
        doctorAvailability[id] = rules;
      }
      return envelope({
        doctor_id: id,
        rules: doctorAvailability[id] ?? [],
        leaves: doctorLeaves.filter((l) => l.doctor_id === id).sort((a, b) => a.start_date.localeCompare(b.start_date)),
      });
    },
  },
  {
    pattern: /^\/doctors\/([^/]+)\/leave$/,
    handler: ({ method, body, query }) => {
      const id = query.get("__p1")!;
      if (method === "POST") {
        const start = String(body.start_date ?? "");
        const end = String(body.end_date ?? start);
        if (!start) return failure("ERR_INVALID_RANGE", "A start date is required.");
        if (end < start) return failure("ERR_INVALID_RANGE", "End date cannot be before the start date.");
        const overlap = doctorLeaves.find(
          (l) => l.doctor_id === id && l.start_date <= end && l.end_date >= start,
        );
        if (overlap) return failure("ERR_LEAVE_OVERLAP", "That range overlaps an existing leave entry.");
        const created = {
          id: `lv_${doctorLeaves.length + 1}`,
          doctor_id: id,
          start_date: start,
          end_date: end,
          reason: String(body.reason ?? "Leave"),
          type: (body.type as "LEAVE") ?? "LEAVE",
        };
        doctorLeaves.push(created);
        return envelope(created);
      }
      if (method === "DELETE") {
        const idx = doctorLeaves.findIndex((l) => l.id === body.leave_id);
        if (idx >= 0) doctorLeaves.splice(idx, 1);
        return envelope({ ok: true });
      }
      return envelope(doctorLeaves.filter((l) => l.doctor_id === id));
    },
  },
  {
    pattern: /^\/doctors\/([^/]+)$/,
    handler: ({ method, body, query }) => {
      const found = doctors.find((d) => d.id === query.get("__p1"));
      if (!found) return failure("NOT_FOUND", "Doctor not found.");
      if (method === "PATCH") {
        found.name = String(body.name ?? found.name);
        found.specialty = String(body.specialty ?? found.specialty);
        const profile = doctorProfiles[found.id];
        if (profile) {
          Object.assign(profile, {
            email: String(body.email ?? profile.email),
            phone: String(body.phone ?? profile.phone),
            registration_no: String(body.registration_no ?? profile.registration_no),
            branch_id: String(body.branch_id ?? profile.branch_id),
            consultation_fee: Number(body.consultation_fee ?? profile.consultation_fee),
            bio: String(body.bio ?? profile.bio),
            active: body.active === undefined ? profile.active : Boolean(body.active),
          });
        }
      }
      return envelope({ ...found, ...doctorProfiles[found.id] });
    },
  },
  {
    pattern: /^\/doctors$/,
    handler: ({ method, body }) => {
      if (method === "POST") {
        const name = String(body.name ?? "").trim();
        if (!name) return failure("ERR_NAME_REQUIRED", "Doctor name is required.");
        const reg = String(body.registration_no ?? "").trim();
        if (reg && Object.values(doctorProfiles).some((p) => p.registration_no === reg)) {
          return failure("ERR_DUPLICATE_REGISTRATION", "That registration number is already on file.");
        }
        const id = `doc_${doctors.length + 1}`;
        const created = { id, name, specialty: String(body.specialty ?? "General Medicine"), available_slots: [] };
        doctors.push(created);
        doctorProfiles[id] = {
          email: String(body.email ?? ""),
          phone: String(body.phone ?? ""),
          registration_no: reg,
          branch_id: String(body.branch_id ?? "br_1"),
          consultation_fee: Number(body.consultation_fee ?? 800),
          bio: String(body.bio ?? ""),
          active: body.active === undefined ? true : Boolean(body.active),
        };
        doctorAvailability[id] = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
          day_of_week: d,
          start_hour: 9,
          end_hour: 17,
          enabled: d !== 0,
        }));
        return envelope({ ...created, ...doctorProfiles[id] });
      }
      return envelope(doctors.map((d) => ({ ...d, ...doctorProfiles[d.id] })));
    },
  },
  { pattern: /^\/medicines$/, handler: ({ query }) => {
      const q = (query.get("q") ?? "").trim().toLowerCase();
      const matches = q ? medicines.filter((m) => `${m.name} ${m.strength} ${m.form}`.toLowerCase().includes(q)) : medicines;
      return envelope(matches);
    },
  },
  {
    pattern: /^\/consultations\/([^/]+)$/,
    handler: ({ query }) => {
      const found = consultations.find((c) => c.id === query.get("__p1"));
      return found ? envelope(found) : failure("NOT_FOUND", "Consultation not found.");
    },
  },
  {
    pattern: /^\/consultations$/,
    handler: ({ method, body, query }) => {
      if (method === "POST") {
        const appt = appointments.find((a) => a.id === body.appointment_id);
        if (!appt) return failure("ERR_APPOINTMENT_REQUIRED", "Select an appointment for this consultation.");
        if (!["CHECKED_IN", "IN_PROGRESS"].includes(appt.status)) {
          return failure("ERR_NOT_CHECKED_IN", "The patient must be checked in before a consultation can be recorded.");
        }
        const missing = ["subjective", "objective", "assessment", "plan"].filter(
          (k) => !String(body[k] ?? "").trim(),
        );
        if (missing.length) {
          return failure("ERR_INCOMPLETE_SOAP", `Complete all SOAP sections: ${missing.join(", ")}.`);
        }
        const created = {
          id: `con_${consultations.length + 1}`,
          appointment_id: appt.id,
          pet_id: appt.pet_id,
          pet_name: appt.pet_name,
          owner_id: appt.owner_id,
          doctor_id: appt.doctor_id,
          doctor_name: appt.doctor_name,
          subjective: String(body.subjective),
          objective: String(body.objective),
          assessment: String(body.assessment),
          plan: String(body.plan),
          vitals: (body.vitals as { temperature_c: string; weight_kg: string; heart_rate: string; resp_rate: string }) ?? {
            temperature_c: "",
            weight_kg: "",
            heart_rate: "",
            resp_rate: "",
          },
          created_at: new Date().toISOString(),
        };
        consultations.push(created);
        appt.status = "IN_PROGRESS";
        medicalEvents.push({
          id: `evt_${medicalEvents.length + 1}`,
          pet_id: appt.pet_id,
          type: "VISIT",
          title: appt.service,
          detail: created.assessment,
          doctor_name: appt.doctor_name,
          occurred_at: created.created_at,
        });
        return envelope(created);
      }
      const doctorId = query.get("doctor_id");
      const apptId = query.get("appointment_id");
      return envelope(
        consultations
          .filter((c) => (!doctorId || c.doctor_id === doctorId) && (!apptId || c.appointment_id === apptId))
          .sort((a, b) => b.created_at.localeCompare(a.created_at)),
      );
    },
  },

  { pattern: /^\/appointments\/mine$/, handler: () => envelope(appointments.filter((a) => a.owner_id === currentOwnerId)) },
  {
    pattern: /^\/appointments\/slots\/available$/,
    handler: ({ query }) => {
      const date = query.get("date") ?? new Date().toISOString().slice(0, 10);
      const doctorId = query.get("doctor_id") ?? "doc_1";
      const branchId = query.get("branch_id") ?? "br_1";
      const branch = branches.find((b) => b.id === branchId) ?? branches[0];
      const { open_hour, close_hour, slot_minutes, closed_days } = branch.working_hours;
      const dayDate = new Date(`${date}T00:00:00`);
      // Branch closed that weekday, or the whole day is in the past → no slots at all.
      if (closed_days.includes(dayDate.getDay())) return envelope([]);

      const seedBase = [...`${doctorId}${branchId}${date}`].reduce((a, c) => a + c.charCodeAt(0), 0);
      const slots: { start_at: string; available: boolean }[] = [];
      let idx = 0;
      for (let minutes = open_hour * 60; minutes < close_hour * 60; minutes += slot_minutes) {
        const start = new Date(`${date}T00:00:00`);
        start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
        const iso = start.toISOString();
        const taken = appointments.some(
          (a) =>
            a.doctor_id === doctorId &&
            (a.branch_id ?? "br_1") === branchId &&
            a.scheduled_at === iso &&
            !["CANCELLED", "NO_SHOW"].includes(a.status),
        );
        const past = start.getTime() < Date.now();
        const seeded = (seedBase + idx * 7) % 5 === 0;
        slots.push({ start_at: iso, available: !taken && !past && !seeded });
        idx += 1;
      }
      return envelope(slots);
    },
  },
  {
    pattern: /^\/appointments\/([^/]+)$/,
    handler: ({ query }) => {
      const found = appointments.find((a) => a.id === query.get("__p1"));
      return found ? envelope(found) : failure("NOT_FOUND", "Appointment not found.");
    },
  },
  {
    pattern: /^\/appointments$/,
    handler: ({ method, body }) => {
      if (method === "POST") {
        const pet = pets.find((p) => p.id === body.pet_id) ?? pets[0];
        const doctor = doctors.find((d) => d.id === body.doctor_id) ?? doctors[0];
        const scheduledAt = String(body.scheduled_at ?? new Date().toISOString());
        const branchId = String(body.branch_id ?? "br_1");
        const branch = branches.find((b) => b.id === branchId) ?? branches[0];
        const when = new Date(scheduledAt);

        if (when.getTime() < Date.now()) {
          return failure("ERR_PAST_SLOT", "That time is in the past. Pick an upcoming slot.");
        }
        const { open_hour, close_hour, closed_days } = branch.working_hours;
        if (closed_days.includes(when.getDay()) || when.getHours() < open_hour || when.getHours() >= close_hour) {
          return failure("ERR_OUTSIDE_WORKING_HOURS", `${branch.name} is closed at that time.`);
        }
        // Transient slot lock: first attempt on a given slot fails, a retry succeeds.
        if (!lockedSlots.has(`${doctor.id}|${scheduledAt}`) && shouldLock(doctor.id, scheduledAt)) {
          lockedSlots.add(`${doctor.id}|${scheduledAt}`);
          return failure("ERR_SLOT_LOCK_TIMEOUT", "Could not lock that slot in time. Retrying…");
        }
        const clash = appointments.some(
          (a) =>
            a.doctor_id === doctor.id &&
            a.scheduled_at === scheduledAt &&
            !["CANCELLED", "NO_SHOW"].includes(a.status),
        );
        if (clash) return failure("ERR_DOUBLE_BOOKING", "That slot was just taken. Pick another one.");

        const created = {
          id: `apt_${appointments.length + 1}`,
          pet_id: pet.id,
          pet_name: pet.name,
          owner_id: pet.owner_id,
          owner_name: pet.owner_name,
          doctor_id: doctor.id,
          doctor_name: doctor.name,
          service: String(body.service ?? "Consultation"),
          scheduled_at: scheduledAt,
          status: "SCHEDULED" as const,
          notes: String(body.notes ?? ""),
          branch_id: branchId,
          token_number: null,
          checked_in_at: null,
          source_channel: (body.source_channel as "WALK_IN" | "PHONE" | "ONLINE") ?? "WALK_IN",
        };
        appointments.push(created);
        return envelope(created);
      }
      return envelope(appointments);
    },

  },
  {
    pattern: /^\/prescriptions\/mine$/,
    handler: () => envelope(prescriptions.filter((p) => ownerOf(p.pet_id) === currentOwnerId).map(withItems)),
  },
  {
    pattern: /^\/prescriptions\/([^/]+)\/pdf$/,
    handler: ({ query }) => {
      const found = prescriptions.find((p) => p.id === query.get("__p1"));
      if (!found) return failure("NOT_FOUND", "Prescription not found.");
      const full = withItems(found);
      const pet = pets.find((p) => p.id === full.pet_id);
      const lines = [
        { text: "PET GOOD VETERINARY HOSPITAL", size: 16, bold: true, gap: 4 },
        { text: "9400 S Normandie Ave, Los Angeles, CA - (310) 555-0100", size: 9, gap: 16 },
        { text: "PRESCRIPTION", size: 13, bold: true, gap: 12 },
        { text: `Rx No: ${full.id}`, size: 10 },
        { text: `Issued: ${new Date(full.issued_at).toLocaleString()}`, size: 10 },
        { text: `Patient: ${full.pet_name}${pet ? ` (${pet.species}, ${pet.breed}, ${pet.weight_kg} kg)` : ""}`, size: 10 },
        { text: `Owner: ${full.owner_name}`, size: 10 },
        { text: `Prescriber: ${full.doctor_name}`, size: 10, gap: 16 },
        { text: "MEDICATIONS", size: 11, bold: true, gap: 10 },
        ...full.items.flatMap((item, i) => [
          { text: `${i + 1}. ${item.name} ${item.strength} (${item.form})`, size: 11, bold: true, gap: 4 },
          {
            text: `    ${item.dosage} - ${item.frequency} - ${item.duration_days} day(s)`,
            size: 10,
            gap: item.notes ? 4 : 10,
          },
          ...(item.notes ? [{ text: `    Note: ${item.notes}`, size: 9, gap: 10 }] : []),
        ]),
        { text: `Refills left: ${full.refills_left}`, size: 10, gap: 24 },
        { text: "_______________________", size: 10, gap: 4 },
        { text: `${full.doctor_name} - Signature`, size: 9 },
      ];
      return envelope({
        filename: `prescription-${full.id}.pdf`,
        mime_type: "application/pdf",
        content_base64: buildTextPdf(lines),
      });
    },
  },
  {
    pattern: /^\/prescriptions\/([^/]+)$/,
    handler: ({ query }) => {
      const found = prescriptions.find((p) => p.id === query.get("__p1"));
      return found ? envelope(withItems(found)) : failure("NOT_FOUND", "Prescription not found.");
    },
  },
  {
    pattern: /^\/prescriptions$/,
    handler: ({ method, body }) => {
      if (method === "POST") {
        const pet = pets.find((p) => p.id === body.pet_id);
        if (!pet) return failure("ERR_PET_REQUIRED", "Select a patient for this prescription.");
        const items = (body.items as PrescriptionItem[] | undefined) ?? [];
        if (!items.length) return failure("ERR_NO_ITEMS", "Add at least one medicine line item.");
        const bad = items.find((i) => !i.name?.trim() || !i.dosage?.trim() || !i.duration_days);
        if (bad) return failure("ERR_INVALID_ITEM", `Complete dosage and duration for ${bad.name || "each line item"}.`);
        const id = `rx_${prescriptions.length + 1}`;
        const created = {
          id,
          pet_id: pet.id,
          pet_name: pet.name,
          doctor_name: String(body.doctor_name ?? "Clinic doctor"),
          medication: items.map((i) => `${i.name} ${i.strength}`.trim()).join(", "),
          dosage: items.map((i) => `${i.dosage} ${i.frequency}`.trim()).join("; "),
          instructions: String(body.instructions ?? items.map((i) => i.notes).filter(Boolean).join(" ")),
          issued_at: new Date().toISOString(),
          refills_left: Number(body.refills_left ?? 0),
        };
        prescriptions.push(created);
        prescriptionItems[id] = items;
        medicalEvents.push({
          id: `evt_${medicalEvents.length + 1}`,
          pet_id: pet.id,
          type: "PRESCRIPTION",
          title: created.medication,
          detail: created.dosage,
          doctor_name: created.doctor_name,
          occurred_at: created.issued_at,
        });
        return envelope(withItems(created));
      }
      return envelope(prescriptions.map(withItems));
    },
  },

  { pattern: /^\/invoices\/mine$/, handler: () => envelope(invoices.filter((i) => i.owner_id === currentOwnerId)) },
  {
    pattern: /^\/invoices\/([^/]+)$/,
    handler: ({ query }) => {
      const found = invoices.find((i) => i.id === query.get("__p1"));
      return found ? envelope(found) : failure("NOT_FOUND", "Invoice not found.");
    },
  },
  { pattern: /^\/invoices$/, handler: () => envelope(invoices) },
  { pattern: /^\/inventory$/, handler: () => envelope(inventory) },
  {
    pattern: /^\/reports\/overview$/,
    handler: () =>
      envelope({
        revenue_by_month: [
          { month: "Aug", revenue: 38200 },
          { month: "Sep", revenue: 41100 },
          { month: "Oct", revenue: 39750 },
          { month: "Nov", revenue: 45300 },
          { month: "Dec", revenue: 48210 },
        ],
        appointments_by_service: [
          { service: "Veterinary", count: 128 },
          { service: "Grooming", count: 74 },
          { service: "Boarding", count: 41 },
          { service: "Training", count: 22 },
        ],
      }),
  },
  { pattern: /^\/dashboard\/staff$/, handler: () => envelope(staffDashboard) },
  {
    pattern: /^\/dashboard\/portal$/,
    handler: () =>
      envelope({
        pets: pets.filter((p) => p.owner_id === currentOwnerId),
        next_appointment:
          appointments.find((a) => a.owner_id === currentOwnerId && a.status !== "COMPLETED") ?? null,
        open_invoices: invoices.filter((i) => i.owner_id === currentOwnerId && i.status !== "PAID").length,
        active_prescriptions: prescriptions.filter((p) => ["pet_1", "pet_2"].includes(p.pet_id)).length,
      }),
  },
];

export async function handleMockRequest(
  path: string,
  method: string,
  body: Record<string, unknown>,
  search: URLSearchParams,
): Promise<ApiResponse<unknown>> {
  await new Promise((r) => setTimeout(r, 180));
  for (const route of routes) {
    const match = route.pattern.exec(path);
    if (!match) continue;
    const query = new URLSearchParams(search);
    match.slice(1).forEach((value, i) => query.set(`__p${i + 1}`, value));
    return route.handler({ method, body, query });
  }
  return failure("NOT_FOUND", `No mock handler for ${method} ${path}`);
}
