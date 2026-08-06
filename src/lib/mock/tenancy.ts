import type { ApiResponse } from "../api/types";
import type {
  BranchRecord,
  MasterDataRecord,
  StaffMember,
  SubscriptionPlan,
  Tenant,
} from "../api/tenancy-types";

export type MockRoute = {
  pattern: RegExp;
  handler: (ctx: { method: string; body: Record<string, unknown>; query: URLSearchParams }) => ApiResponse<unknown>;
};

function envelope<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    meta: {
      total_count: Array.isArray(data) ? data.length : 1,
      has_next_page: false,
      next_cursor: null,
      limit: 50,
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

function day(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

export const plans: SubscriptionPlan[] = [
  {
    id: "plan_starter",
    name: "Starter",
    tagline: "For a single-vet clinic finding its feet.",
    price_monthly: 2999,
    price_yearly: 29990,
    branch_limit: 1,
    staff_limit: 8,
    features: ["1 branch", "Up to 8 staff logins", "Appointments & consultations", "GST invoicing", "Email support"],
    popular: false,
  },
  {
    id: "plan_growth",
    name: "Growth",
    tagline: "Multi-branch hospitals with a full front desk.",
    price_monthly: 7499,
    price_yearly: 74990,
    branch_limit: 5,
    staff_limit: 40,
    features: [
      "Up to 5 branches",
      "40 staff logins",
      "Pharmacy & inventory",
      "Analytics dashboard",
      "Refunds & credit notes",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "plan_enterprise",
    name: "Enterprise",
    tagline: "Hospital groups that need control and audit trails.",
    price_monthly: 18999,
    price_yearly: 189990,
    branch_limit: 999,
    staff_limit: 999,
    features: [
      "Unlimited branches & staff",
      "Master data governance",
      "Dual-authorisation refunds",
      "Custom roles & audit log",
      "Dedicated success manager",
      "99.9% uptime SLA",
    ],
    popular: false,
  },
];

export const tenants: Tenant[] = [
  {
    id: "ten_1",
    name: "Pet Good Veterinary Hospital",
    slug: "petgood",
    city: "Bengaluru",
    owner_name: "Dr. Amelia Reyes",
    owner_email: "amelia@petgood.test",
    phone: "+91 98450 11223",
    plan_id: "plan_growth",
    plan_name: "Growth",
    subscription_status: "ACTIVE",
    branches_count: 3,
    staff_count: 22,
    trial_ends_at: null,
    renews_at: day(19),
    mrr: 7499,
    created_at: day(-420),
  },
  {
    id: "ten_2",
    name: "Whiskers & Paws Clinic",
    slug: "whiskers-paws",
    city: "Pune",
    owner_name: "Dr. Rahul Menon",
    owner_email: "rahul@whiskers.test",
    phone: "+91 98220 44551",
    plan_id: "plan_starter",
    plan_name: "Starter",
    subscription_status: "TRIAL",
    branches_count: 1,
    staff_count: 5,
    trial_ends_at: day(6),
    renews_at: null,
    mrr: 0,
    created_at: day(-8),
  },
  {
    id: "ten_3",
    name: "Nova Animal Care",
    slug: "nova-animal",
    city: "Hyderabad",
    owner_name: "Dr. Sneha Iyer",
    owner_email: "sneha@novacare.test",
    phone: "+91 90000 77332",
    plan_id: "plan_growth",
    plan_name: "Growth",
    subscription_status: "GRACE",
    branches_count: 2,
    staff_count: 14,
    trial_ends_at: null,
    renews_at: day(-4),
    mrr: 7499,
    created_at: day(-260),
  },
  {
    id: "ten_4",
    name: "Happy Tails Superspeciality",
    slug: "happy-tails",
    city: "Mumbai",
    owner_name: "Dr. Kabir Shah",
    owner_email: "kabir@happytails.test",
    phone: "+91 99300 12009",
    plan_id: "plan_enterprise",
    plan_name: "Enterprise",
    subscription_status: "ACTIVE",
    branches_count: 7,
    staff_count: 61,
    trial_ends_at: null,
    renews_at: day(11),
    mrr: 18999,
    created_at: day(-700),
  },
  {
    id: "ten_5",
    name: "Barks Avenue Pet Hospital",
    slug: "barks-avenue",
    city: "Delhi",
    owner_name: "Dr. Priya Nair",
    owner_email: "priya@barksave.test",
    phone: "+91 98111 55887",
    plan_id: "plan_starter",
    plan_name: "Starter",
    subscription_status: "EXPIRED",
    branches_count: 1,
    staff_count: 4,
    trial_ends_at: null,
    renews_at: day(-38),
    mrr: 0,
    created_at: day(-310),
  },
  {
    id: "ten_6",
    name: "Furry Friends Clinic",
    slug: "furry-friends",
    city: "Kochi",
    owner_name: "Dr. Anand Varma",
    owner_email: "anand@furryfriends.test",
    phone: "+91 94470 33221",
    plan_id: "plan_starter",
    plan_name: "Starter",
    subscription_status: "CANCELLED",
    branches_count: 1,
    staff_count: 3,
    trial_ends_at: null,
    renews_at: null,
    mrr: 0,
    created_at: day(-540),
  },
];

export const branchRecords: BranchRecord[] = [
  {
    id: "br_1",
    tenant_id: "ten_1",
    name: "Pet Good — Downtown",
    address: "24 Maple Street, Downtown",
    city: "Bengaluru",
    phone: "+91 80 4123 5566",
    latitude: 12.9716,
    longitude: 77.5946,
    open_hour: 9,
    close_hour: 18,
    active: true,
  },
  {
    id: "br_2",
    tenant_id: "ten_1",
    name: "Pet Good — Riverside",
    address: "8 Riverside Walk",
    city: "Bengaluru",
    phone: "+91 80 4123 7788",
    latitude: 12.9352,
    longitude: 77.6245,
    open_hour: 10,
    close_hour: 16,
    active: true,
  },
  {
    id: "br_3",
    tenant_id: "ten_1",
    name: "Pet Good — Whitefield",
    address: "112 Garden Road, Whitefield",
    city: "Bengaluru",
    phone: "+91 80 4123 9911",
    latitude: 12.9698,
    longitude: 77.75,
    open_hour: 9,
    close_hour: 20,
    active: false,
  },
];

export const staffMembers: StaffMember[] = [
  {
    id: "stf_1",
    name: "Dr. Amelia Reyes",
    email: "amelia@petgood.test",
    phone: "+91 98450 11223",
    role: "DOCTOR",
    branch_id: "br_1",
    branch_name: "Pet Good — Downtown",
    employee_code: "PG-001",
    joined_on: day(-900).slice(0, 10),
    active: true,
    attendance_today: "PRESENT",
    present_days_30: 26,
  },
  {
    id: "stf_2",
    name: "Dr. Noah Patel",
    email: "noah@petgood.test",
    phone: "+91 98450 33445",
    role: "DOCTOR",
    branch_id: "br_2",
    branch_name: "Pet Good — Riverside",
    employee_code: "PG-002",
    joined_on: day(-700).slice(0, 10),
    active: true,
    attendance_today: "LEAVE",
    present_days_30: 21,
  },
  {
    id: "stf_3",
    name: "Riya Sharma",
    email: "reception@petgood.test",
    phone: "+91 98450 55667",
    role: "RECEPTIONIST",
    branch_id: "br_1",
    branch_name: "Pet Good — Downtown",
    employee_code: "PG-011",
    joined_on: day(-420).slice(0, 10),
    active: true,
    attendance_today: "PRESENT",
    present_days_30: 28,
  },
  {
    id: "stf_4",
    name: "Vikram Rao",
    email: "pharmacy@petgood.test",
    phone: "+91 98450 77889",
    role: "PHARMACIST",
    branch_id: "br_1",
    branch_name: "Pet Good — Downtown",
    employee_code: "PG-014",
    joined_on: day(-300).slice(0, 10),
    active: true,
    attendance_today: "HALF_DAY",
    present_days_30: 24,
  },
  {
    id: "stf_5",
    name: "Meera Joshi",
    email: "billing@petgood.test",
    phone: "+91 98450 99001",
    role: "BILLING_STAFF",
    branch_id: "br_2",
    branch_name: "Pet Good — Riverside",
    employee_code: "PG-021",
    joined_on: day(-180).slice(0, 10),
    active: true,
    attendance_today: "ABSENT",
    present_days_30: 19,
  },
];

/** Master data collections — all served by one generic endpoint pair. */
export const masterData: Record<string, MasterDataRecord[]> = {
  species: [
    { id: "sp_1", name: "Dog", code: "DOG", active: true },
    { id: "sp_2", name: "Cat", code: "CAT", active: true },
    { id: "sp_3", name: "Rabbit", code: "RAB", active: true },
    { id: "sp_4", name: "Bird", code: "BRD", active: true },
  ],
  breeds: [
    { id: "br_gr", name: "Golden Retriever", species: "Dog", size: "Large", active: true },
    { id: "br_lb", name: "Labrador", species: "Dog", size: "Large", active: true },
    { id: "br_ps", name: "Persian", species: "Cat", size: "Medium", active: true },
    { id: "br_in", name: "Indie", species: "Dog", size: "Medium", active: true },
  ],
  vaccines: [
    { id: "vx_1", name: "DHPP", species: "Dog", interval_months: 12, active: true },
    { id: "vx_2", name: "Rabies", species: "Dog", interval_months: 12, active: true },
    { id: "vx_3", name: "FVRCP", species: "Cat", interval_months: 12, active: true },
  ],
  medicines: [
    { id: "md_1", name: "Amoxicillin 250mg", form: "Tablet", strength: "250 mg", hsn: "3004", active: true },
    { id: "md_2", name: "Meloxicam Oral", form: "Suspension", strength: "1.5 mg/ml", hsn: "3004", active: true },
    { id: "md_3", name: "Ivermectin", form: "Injection", strength: "1%", hsn: "3004", active: true },
  ],
  "lab-tests": [
    { id: "lt_1", name: "Complete Blood Count", category: "Haematology", price: 650, tat_hours: 6, active: true },
    { id: "lt_2", name: "Liver Function Panel", category: "Biochemistry", price: 1200, tat_hours: 12, active: true },
    { id: "lt_3", name: "Urine Routine", category: "Pathology", price: 400, tat_hours: 4, active: true },
  ],
};

let seq = 100;
const nextId = (prefix: string) => `${prefix}_${++seq}`;

export const tenancyRoutes: MockRoute[] = [
  // ---- Subscription plans (public) ----
  { pattern: /^\/subscriptions\/plans$/, handler: () => envelope(plans) },
  {
    pattern: /^\/subscriptions\/([^/]+)\/upgrade$/,
    handler: ({ body, query }) => {
      const planId = query.get("__p1") ?? "";
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return failure("ERR_PLAN_NOT_FOUND", "That plan is no longer available.");
      const tenantId = String(body.tenant_id ?? "ten_1");
      const tenant = tenants.find((t) => t.id === tenantId);
      if (!tenant) return failure("ERR_TENANT_NOT_FOUND", "Hospital not found.");
      const cycle = body.billing_cycle === "YEARLY" ? "YEARLY" : "MONTHLY";
      tenant.plan_id = plan.id;
      tenant.plan_name = plan.name;
      tenant.subscription_status = "ACTIVE";
      tenant.trial_ends_at = null;
      tenant.renews_at = day(cycle === "YEARLY" ? 365 : 30);
      tenant.mrr = cycle === "YEARLY" ? Math.round(plan.price_yearly / 12) : plan.price_monthly;
      return envelope({
        tenant,
        invoice_amount: cycle === "YEARLY" ? plan.price_yearly : plan.price_monthly,
        billing_cycle: cycle,
      });
    },
  },

  // ---- Tenants ----
  {
    pattern: /^\/admin\/tenants$/,
    handler: ({ query }) => {
      const status = query.get("status");
      const search = (query.get("search") ?? "").toLowerCase();
      let list = [...tenants];
      if (status && status !== "ALL") list = list.filter((t) => t.subscription_status === status);
      if (search) list = list.filter((t) => `${t.name} ${t.city} ${t.owner_email}`.toLowerCase().includes(search));
      return envelope(list);
    },
  },
  {
    pattern: /^\/tenants\/provision$/,
    handler: ({ body }) => {
      const name = String(body.name ?? "").trim();
      const email = String(body.owner_email ?? "").trim();
      if (!name || !email) return failure("ERR_VALIDATION", "Hospital name and owner email are required.");
      if (tenants.some((t) => t.owner_email.toLowerCase() === email.toLowerCase())) {
        return failure("ERR_TENANT_EXISTS", "A hospital is already registered with that owner email.");
      }
      const plan = plans.find((p) => p.id === body.plan_id) ?? plans[0];
      const id = nextId("ten");
      const tenant: Tenant = {
        id,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        city: String(body.city ?? ""),
        owner_name: String(body.owner_name ?? ""),
        owner_email: email,
        phone: String(body.phone ?? ""),
        plan_id: plan.id,
        plan_name: plan.name,
        subscription_status: "TRIAL",
        branches_count: 1,
        staff_count: 1,
        trial_ends_at: day(14),
        renews_at: null,
        mrr: 0,
        created_at: day(0),
      };
      tenants.unshift(tenant);
      branchRecords.push({
        id: nextId("br"),
        tenant_id: id,
        name: String(body.branch_name ?? `${name} — Main`),
        address: String(body.branch_address ?? ""),
        city: String(body.city ?? ""),
        phone: String(body.phone ?? ""),
        latitude: body.latitude === null || body.latitude === undefined ? null : Number(body.latitude),
        longitude: body.longitude === null || body.longitude === undefined ? null : Number(body.longitude),
        open_hour: 9,
        close_hour: 18,
        active: true,
      });
      return envelope({ tenant, trial_days: 14 });
    },
  },

  // ---- Branches ----
  {
    pattern: /^\/branches\/([^/]+)$/,
    handler: ({ method, body, query }) => {
      const id = query.get("__p1") ?? "";
      const idx = branchRecords.findIndex((b) => b.id === id);
      if (idx === -1) return failure("NOT_FOUND", "Branch not found.");
      if (method === "DELETE") {
        const [removed] = branchRecords.splice(idx, 1);
        return envelope(removed);
      }
      if (method === "PATCH") {
        branchRecords[idx] = { ...branchRecords[idx], ...(body as Partial<BranchRecord>) };
        return envelope(branchRecords[idx]);
      }
      return envelope(branchRecords[idx]);
    },
  },
  {
    pattern: /^\/branches$/,
    handler: ({ method, body }) => {
      if (method !== "POST") return envelope(branchRecords);
      const name = String(body.name ?? "").trim();
      if (!name) return failure("ERR_VALIDATION", "Branch name is required.");
      const branch: BranchRecord = {
        id: nextId("br"),
        tenant_id: String(body.tenant_id ?? "ten_1"),
        name,
        address: String(body.address ?? ""),
        city: String(body.city ?? ""),
        phone: String(body.phone ?? ""),
        latitude: body.latitude === "" || body.latitude == null ? null : Number(body.latitude),
        longitude: body.longitude === "" || body.longitude == null ? null : Number(body.longitude),
        open_hour: Number(body.open_hour ?? 9),
        close_hour: Number(body.close_hour ?? 18),
        active: body.active !== false,
      };
      branchRecords.push(branch);
      return envelope(branch);
    },
  },

  // ---- Staff + attendance ----
  {
    pattern: /^\/staff\/([^/]+)\/attendance$/,
    handler: ({ body, query }) => {
      const member = staffMembers.find((s) => s.id === query.get("__p1"));
      if (!member) return failure("NOT_FOUND", "Staff member not found.");
      const status = String(body.status ?? "PRESENT") as StaffMember["attendance_today"];
      member.attendance_today = status;
      member.present_days_30 = Math.min(30, member.present_days_30 + (status === "PRESENT" ? 1 : 0));
      return envelope(member);
    },
  },
  {
    pattern: /^\/staff\/([^/]+)$/,
    handler: ({ method, body, query }) => {
      const idx = staffMembers.findIndex((s) => s.id === query.get("__p1"));
      if (idx === -1) return failure("NOT_FOUND", "Staff member not found.");
      if (method === "DELETE") return envelope(staffMembers.splice(idx, 1)[0]);
      if (method === "PATCH") {
        staffMembers[idx] = { ...staffMembers[idx], ...(body as Partial<StaffMember>) };
        return envelope(staffMembers[idx]);
      }
      return envelope(staffMembers[idx]);
    },
  },
  {
    pattern: /^\/staff$/,
    handler: ({ method, body }) => {
      if (method !== "POST") return envelope(staffMembers);
      const name = String(body.name ?? "").trim();
      const email = String(body.email ?? "").trim();
      if (!name || !email) return failure("ERR_VALIDATION", "Name and email are required.");
      if (staffMembers.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
        return failure("ERR_STAFF_EXISTS", "A staff member with that email already exists.");
      }
      const branch = branchRecords.find((b) => b.id === body.branch_id) ?? branchRecords[0];
      const member: StaffMember = {
        id: nextId("stf"),
        name,
        email,
        phone: String(body.phone ?? ""),
        role: String(body.role ?? "RECEPTIONIST"),
        branch_id: branch?.id ?? "",
        branch_name: branch?.name ?? "",
        employee_code: String(body.employee_code ?? `PG-${100 + staffMembers.length}`),
        joined_on: String(body.joined_on ?? day(0).slice(0, 10)),
        active: true,
        attendance_today: "PRESENT",
        present_days_30: 0,
      };
      staffMembers.push(member);
      return envelope(member);
    },
  },

  // ---- Generic master data ----
  {
    pattern: /^\/master-data\/([^/]+)\/([^/]+)$/,
    handler: ({ method, body, query }) => {
      const set = masterData[query.get("__p1") ?? ""];
      if (!set) return failure("NOT_FOUND", "Unknown master data collection.");
      const idx = set.findIndex((r) => r.id === query.get("__p2"));
      if (idx === -1) return failure("NOT_FOUND", "Record not found.");
      if (method === "DELETE") return envelope(set.splice(idx, 1)[0]);
      if (method === "PATCH") {
        set[idx] = { ...set[idx], ...(body as MasterDataRecord), id: set[idx].id };
        return envelope(set[idx]);
      }
      return envelope(set[idx]);
    },
  },
  {
    pattern: /^\/master-data\/([^/]+)$/,
    handler: ({ method, body, query }) => {
      const key = query.get("__p1") ?? "";
      const set = masterData[key];
      if (!set) return failure("NOT_FOUND", "Unknown master data collection.");
      if (method !== "POST") return envelope(set);
      if (!String(body.name ?? "").trim()) return failure("ERR_VALIDATION", "Name is required.");
      const record: MasterDataRecord = { ...(body as MasterDataRecord), id: nextId(key.slice(0, 2)) };
      set.push(record);
      return envelope(record);
    },
  },
];
