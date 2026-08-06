import type {
  Appointment,
  Doctor,
  DashboardStats,
  InventoryItem,
  Invoice,
  Pet,
  PetOwner,
  Prescription,
  Role,
} from "../api/types";

const day = (offset: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const owners: PetOwner[] = [
  {
    id: "own_1",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "(310) 555-0142",
    address: "9400 S Normandie Ave #14, Los Angeles, CA",
    pets_count: 2,
    created_at: day(-220),
  },
  {
    id: "own_2",
    name: "Ethan Brooks",
    email: "ethan.brooks@example.com",
    phone: "(310) 555-0188",
    address: "1220 Rosewood Ave, Los Angeles, CA",
    pets_count: 1,
    created_at: day(-140),
  },
  {
    id: "own_3",
    name: "Maya Torres",
    email: "maya.torres@example.com",
    phone: "(213) 555-0110",
    address: "88 Sunset Blvd, Los Angeles, CA",
    pets_count: 3,
    created_at: day(-90),
  },
  {
    id: "own_4",
    name: "Liam Carter",
    email: "liam.carter@example.com",
    phone: "(424) 555-0166",
    address: "500 Ocean Park Blvd, Santa Monica, CA",
    pets_count: 1,
    created_at: day(-40),
  },
];

export const pets: Pet[] = [
  {
    id: "pet_1",
    owner_id: "own_1",
    owner_name: "Sarah Johnson",
    name: "Max",
    species: "Dog",
    breed: "Golden Retriever",
    sex: "Male",
    age_years: 4,
    weight_kg: 31.2,
    photo_url: null,
    microchip_id: "985141000123456",
  },
  {
    id: "pet_2",
    owner_id: "own_1",
    owner_name: "Sarah Johnson",
    name: "Luna",
    species: "Cat",
    breed: "British Shorthair",
    sex: "Female",
    age_years: 2,
    weight_kg: 4.6,
    photo_url: null,
    microchip_id: "985141000998877",
  },
  {
    id: "pet_3",
    owner_id: "own_2",
    owner_name: "Ethan Brooks",
    name: "Biscuit",
    species: "Dog",
    breed: "French Bulldog",
    sex: "Male",
    age_years: 6,
    weight_kg: 12.4,
    photo_url: null,
    microchip_id: null,
  },
  {
    id: "pet_4",
    owner_id: "own_3",
    owner_name: "Maya Torres",
    name: "Pepper",
    species: "Rabbit",
    breed: "Holland Lop",
    sex: "Female",
    age_years: 1,
    weight_kg: 1.8,
    photo_url: null,
    microchip_id: null,
  },
  {
    id: "pet_5",
    owner_id: "own_4",
    owner_name: "Liam Carter",
    name: "Scout",
    species: "Dog",
    breed: "Border Collie",
    sex: "Male",
    age_years: 3,
    weight_kg: 19.8,
    photo_url: null,
    microchip_id: "985141000445566",
  },
];

export const doctors: Doctor[] = [
  {
    id: "doc_1",
    name: "Dr. Amelia Reed",
    specialty: "General Medicine",
    available_slots: [day(1, 9), day(1, 11), day(2, 14)],
  },
  {
    id: "doc_2",
    name: "Dr. Noah Fletcher",
    specialty: "Surgery",
    available_slots: [day(1, 13), day(3, 10), day(4, 16)],
  },
  {
    id: "doc_3",
    name: "Dr. Isabella Parker",
    specialty: "Dermatology",
    available_slots: [day(2, 9), day(3, 15), day(5, 11)],
  },
];

export const appointments: Appointment[] = [
  {
    id: "apt_1",
    pet_id: "pet_1",
    pet_name: "Max",
    owner_id: "own_1",
    owner_name: "Sarah Johnson",
    doctor_id: "doc_1",
    doctor_name: "Dr. Amelia Reed",
    service: "Annual Wellness Exam",
    scheduled_at: day(0, 11),
    status: "CHECKED_IN",
    notes: "Slight limp on the rear left leg.",
  },
  {
    id: "apt_2",
    pet_id: "pet_2",
    pet_name: "Luna",
    owner_id: "own_1",
    owner_name: "Sarah Johnson",
    doctor_id: "doc_3",
    doctor_name: "Dr. Isabella Parker",
    service: "Skin Allergy Follow-up",
    scheduled_at: day(3, 15),
    status: "SCHEDULED",
    notes: "",
  },
  {
    id: "apt_3",
    pet_id: "pet_3",
    pet_name: "Biscuit",
    owner_id: "own_2",
    owner_name: "Ethan Brooks",
    doctor_id: "doc_2",
    doctor_name: "Dr. Noah Fletcher",
    service: "Dental Cleaning",
    scheduled_at: day(1, 13),
    status: "SCHEDULED",
    notes: "Pre-op bloodwork done.",
  },
  {
    id: "apt_4",
    pet_id: "pet_5",
    pet_name: "Scout",
    owner_id: "own_4",
    owner_name: "Liam Carter",
    doctor_id: "doc_1",
    doctor_name: "Dr. Amelia Reed",
    service: "Vaccination — Rabies",
    scheduled_at: day(-6, 10),
    status: "COMPLETED",
    notes: "Next booster in 12 months.",
  },
  {
    id: "apt_5",
    pet_id: "pet_4",
    pet_name: "Pepper",
    owner_id: "own_3",
    owner_name: "Maya Torres",
    doctor_id: "doc_1",
    doctor_name: "Dr. Amelia Reed",
    service: "Grooming",
    scheduled_at: day(-2, 9),
    status: "CANCELLED",
    notes: "Owner rescheduled.",
  },
];

export const prescriptions: Prescription[] = [
  {
    id: "rx_1",
    pet_id: "pet_1",
    pet_name: "Max",
    doctor_name: "Dr. Amelia Reed",
    medication: "Carprofen 75mg",
    dosage: "1 tablet twice daily",
    instructions: "Give with food for 10 days.",
    issued_at: day(-5),
    refills_left: 1,
  },
  {
    id: "rx_2",
    pet_id: "pet_2",
    pet_name: "Luna",
    doctor_name: "Dr. Isabella Parker",
    medication: "Apoquel 5.4mg",
    dosage: "1 tablet daily",
    instructions: "Continue until skin irritation clears.",
    issued_at: day(-12),
    refills_left: 3,
  },
  {
    id: "rx_3",
    pet_id: "pet_5",
    pet_name: "Scout",
    doctor_name: "Dr. Noah Fletcher",
    medication: "Bravecto Chew",
    dosage: "1 chew every 12 weeks",
    instructions: "Flea and tick prevention.",
    issued_at: day(-30),
    refills_left: 0,
  },
];

export const invoices: Invoice[] = [
  {
    id: "inv_1",
    number: "PG-2041",
    owner_id: "own_1",
    owner_name: "Sarah Johnson",
    amount: 184.5,
    status: "DUE",
    issued_at: day(-4),
    due_at: day(10),
    items: [
      { label: "Wellness exam", amount: 95 },
      { label: "Blood panel", amount: 64.5 },
      { label: "Nail trim", amount: 25 },
    ],
  },
  {
    id: "inv_2",
    number: "PG-2036",
    owner_id: "own_1",
    owner_name: "Sarah Johnson",
    amount: 62,
    status: "PAID",
    issued_at: day(-40),
    due_at: day(-26),
    items: [{ label: "Vaccination — Rabies", amount: 62 }],
  },
  {
    id: "inv_3",
    number: "PG-2028",
    owner_id: "own_2",
    owner_name: "Ethan Brooks",
    amount: 410,
    status: "OVERDUE",
    issued_at: day(-60),
    due_at: day(-46),
    items: [
      { label: "Dental cleaning", amount: 350 },
      { label: "Anesthesia", amount: 60 },
    ],
  },
  {
    id: "inv_4",
    number: "PG-2050",
    owner_id: "own_3",
    owner_name: "Maya Torres",
    amount: 128,
    status: "DUE",
    issued_at: day(-1),
    due_at: day(13),
    items: [{ label: "Grooming package", amount: 128 }],
  },
];

export const inventory: InventoryItem[] = [
  { id: "itm_1", name: "Carprofen 75mg (100ct)", category: "Pharmacy", stock: 12, reorder_level: 10, unit_price: 48 },
  { id: "itm_2", name: "Rabies Vaccine", category: "Vaccines", stock: 6, reorder_level: 15, unit_price: 22 },
  { id: "itm_3", name: "Surgical Gloves (Box)", category: "Supplies", stock: 40, reorder_level: 20, unit_price: 14 },
  { id: "itm_4", name: "Hypoallergenic Shampoo", category: "Grooming", stock: 8, reorder_level: 12, unit_price: 19 },
  { id: "itm_5", name: "IV Fluid Bag 500ml", category: "Supplies", stock: 34, reorder_level: 15, unit_price: 9.5 },
];

export const staffDashboard: DashboardStats = {
  appointments_today: 8,
  active_patients: 246,
  revenue_month: 48210,
  pending_invoices: 3,
  low_stock_items: 3,
  upcoming: appointments.filter((a) => a.status === "SCHEDULED" || a.status === "CHECKED_IN"),
};

export const roleByEmailPrefix: Record<string, Role> = {
  superadmin: "SUPER_ADMIN",
  admin: "HOSPITAL_ADMIN",
  reception: "RECEPTIONIST",
  doctor: "DOCTOR",
  lab: "LAB_TECH",
  pharmacy: "PHARMACIST",
  groomer: "GROOMER",
  billing: "BILLING_STAFF",
  owner: "PET_OWNER",
};

export const ownerDocuments: import("../api/types").OwnerDocument[] = [
  { id: "doc_1", owner_id: "own_1", name: "Aadhaar-card.pdf", type: "ID Proof", size_kb: 248, uploaded_at: day(-210) },
  { id: "doc_2", owner_id: "own_1", name: "Surgery-consent.pdf", type: "Consent Form", size_kb: 96, uploaded_at: day(-42) },
  { id: "doc_3", owner_id: "own_2", name: "Pet-insurance.pdf", type: "Insurance", size_kb: 512, uploaded_at: day(-100) },
];

export const communications: import("../api/types").CommunicationLog[] = [
  { id: "com_1", owner_id: "own_1", channel: "SMS", subject: "Appointment reminder", body: "Max's check-up is tomorrow at 10:00 AM.", direction: "OUTBOUND", sent_at: day(-3, 9) },
  { id: "com_2", owner_id: "own_1", channel: "Email", subject: "Invoice INV-1042", body: "Your invoice is ready to view.", direction: "OUTBOUND", sent_at: day(-12, 15) },
  { id: "com_3", owner_id: "own_1", channel: "Call", subject: "Vaccination follow-up", body: "Owner confirmed booster shot for Luna.", direction: "INBOUND", sent_at: day(-25, 11) },
  { id: "com_4", owner_id: "own_2", channel: "WhatsApp", subject: "Grooming slot", body: "Sent available grooming slots for Biscuit.", direction: "OUTBOUND", sent_at: day(-6, 17) },
];

export const medicalEvents: import("../api/types").MedicalEvent[] = [
  { id: "me_1", pet_id: "pet_1", type: "VISIT", title: "Annual wellness exam", detail: "Weight stable at 31.2 kg. Dental scaling advised.", doctor_name: "Dr. Amelia Reyes", occurred_at: day(-30, 10) },
  { id: "me_2", pet_id: "pet_1", type: "VACCINE", title: "Rabies booster", detail: "Batch RB-2291, 1 ml subcutaneous.", doctor_name: "Dr. Amelia Reyes", occurred_at: day(-120, 12) },
  { id: "me_3", pet_id: "pet_1", type: "LAB", title: "CBC panel", detail: "All values within normal range.", doctor_name: "Dr. Noah Patel", occurred_at: day(-118, 13) },
  { id: "me_4", pet_id: "pet_1", type: "PRESCRIPTION", title: "Apoquel 16 mg", detail: "1 tablet twice daily for 7 days.", doctor_name: "Dr. Amelia Reyes", occurred_at: day(-29, 11) },
  { id: "me_5", pet_id: "pet_2", type: "SURGERY", title: "Spay procedure", detail: "Uneventful recovery, sutures removed after 10 days.", doctor_name: "Dr. Noah Patel", occurred_at: day(-200, 9) },
  { id: "me_6", pet_id: "pet_2", type: "GROOMING", title: "Full groom", detail: "Nail trim and de-shedding treatment.", doctor_name: "Iris Kim", occurred_at: day(-15, 16) },
  { id: "me_7", pet_id: "pet_3", type: "VISIT", title: "Breathing check", detail: "Mild brachycephalic symptoms, monitor in summer.", doctor_name: "Dr. Amelia Reyes", occurred_at: day(-8, 14) },
];

export const vaccines: import("../api/types").Vaccine[] = [
  { id: "vac_1", pet_id: "pet_1", pet_name: "Max", owner_id: "own_1", owner_name: "Sarah Johnson", vaccine_name: "Rabies", batch_no: "RB-2291", vaccination_date: day(-120).slice(0, 10), next_due_date: day(-5).slice(0, 10), administered_by: "Dr. Amelia Reyes" },
  { id: "vac_2", pet_id: "pet_2", pet_name: "Luna", owner_id: "own_1", owner_name: "Sarah Johnson", vaccine_name: "FVRCP", batch_no: "FV-1180", vaccination_date: day(-330).slice(0, 10), next_due_date: day(9).slice(0, 10), administered_by: "Dr. Noah Patel" },
  { id: "vac_3", pet_id: "pet_3", pet_name: "Biscuit", owner_id: "own_2", owner_name: "Ethan Brooks", vaccine_name: "DHPP", batch_no: "DH-7741", vaccination_date: day(-340).slice(0, 10), next_due_date: day(21).slice(0, 10), administered_by: "Dr. Amelia Reyes" },
  { id: "vac_4", pet_id: "pet_5", pet_name: "Scout", owner_id: "own_4", owner_name: "Liam Carter", vaccine_name: "Leptospirosis", batch_no: "LP-3320", vaccination_date: day(-370).slice(0, 10), next_due_date: day(-14).slice(0, 10), administered_by: "Dr. Noah Patel" },
];

export const branches: import("../api/types").Branch[] = [
  {
    id: "br_1",
    name: "Pet Good — Downtown",
    address: "24 Maple Street, Downtown",
    working_hours: { open_hour: 9, close_hour: 18, slot_minutes: 30, closed_days: [0] },
  },
  {
    id: "br_2",
    name: "Pet Good — Riverside",
    address: "8 Riverside Walk",
    working_hours: { open_hour: 10, close_hour: 16, slot_minutes: 30, closed_days: [0, 6] },
  },
];

/** Today's live token sequence, incremented on check-in. */
export const tokenState = { last: 0 };

for (const a of appointments) {
  a.branch_id ??= "br_1";
  a.source_channel ??= "WALK_IN";
  a.token_number ??= null;
}

const todayAt = (hour: number, minute = 0) => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

appointments.push(
  {
    id: "apt_6",
    pet_id: "pet_2",
    pet_name: "Luna",
    owner_id: "own_1",
    owner_name: "Sarah Johnson",
    doctor_id: "doc_1",
    doctor_name: "Dr. Amelia Reed",
    service: "Consultation",
    scheduled_at: todayAt(10, 30),
    status: "CONFIRMED",
    notes: "",
    branch_id: "br_1",
    source_channel: "ONLINE",
    token_number: null,
  },
  {
    id: "apt_7",
    pet_id: "pet_3",
    pet_name: "Biscuit",
    owner_id: "own_2",
    owner_name: "Ethan Brooks",
    doctor_id: "doc_2",
    doctor_name: "Dr. Noah Fletcher",
    service: "Vaccination — Booster",
    scheduled_at: todayAt(12, 0),
    status: "SCHEDULED",
    notes: "",
    branch_id: "br_1",
    source_channel: "PHONE",
    token_number: null,
  },
  {
    id: "apt_8",
    pet_id: "pet_4",
    pet_name: "Pepper",
    owner_id: "own_3",
    owner_name: "Maya Torres",
    doctor_id: "doc_3",
    doctor_name: "Dr. Isabella Parker",
    service: "Dermatology Review",
    scheduled_at: todayAt(15, 30),
    status: "SCHEDULED",
    notes: "",
    branch_id: "br_1",
    source_channel: "WALK_IN",
    token_number: null,
  },
);
