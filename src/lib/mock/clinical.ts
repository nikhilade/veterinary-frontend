import type { AvailabilityRule, Consultation, DoctorLeave, Medicine, PrescriptionItem } from "../api/types";

const day = (offset: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const dateOnly = (offset: number) => day(offset).slice(0, 10);

const weekday = (start: number, end: number): AvailabilityRule[] =>
  [0, 1, 2, 3, 4, 5, 6].map((d) => ({
    day_of_week: d,
    start_hour: start,
    end_hour: end,
    enabled: d !== 0,
  }));

/** doctor_id -> weekly rules */
export const doctorAvailability: Record<string, AvailabilityRule[]> = {
  doc_1: weekday(9, 17),
  doc_2: weekday(10, 18),
  doc_3: weekday(9, 15),
};

export const doctorLeaves: DoctorLeave[] = [
  {
    id: "lv_1",
    doctor_id: "doc_1",
    start_date: dateOnly(6),
    end_date: dateOnly(8),
    reason: "Annual leave",
    type: "LEAVE",
  },
  {
    id: "lv_2",
    doctor_id: "doc_2",
    start_date: dateOnly(2),
    end_date: dateOnly(2),
    reason: "Veterinary surgery conference",
    type: "CONFERENCE",
  },
];

export const medicines: Medicine[] = [
  { id: "med_1", name: "Carprofen", strength: "75mg", form: "Tablet", default_dosage: "1 tablet", stock: 120 },
  { id: "med_2", name: "Apoquel", strength: "5.4mg", form: "Tablet", default_dosage: "1 tablet", stock: 64 },
  { id: "med_3", name: "Amoxicillin–Clavulanate", strength: "250mg", form: "Tablet", default_dosage: "1 tablet", stock: 90 },
  { id: "med_4", name: "Meloxicam", strength: "1.5mg/ml", form: "Syrup", default_dosage: "0.5 ml/kg", stock: 30 },
  { id: "med_5", name: "Metronidazole", strength: "400mg", form: "Tablet", default_dosage: "1/2 tablet", stock: 75 },
  { id: "med_6", name: "Bravecto", strength: "500mg", form: "Chew", default_dosage: "1 chew", stock: 42 },
  { id: "med_7", name: "Cerenia", strength: "16mg", form: "Tablet", default_dosage: "1 tablet", stock: 25 },
  { id: "med_8", name: "Gabapentin", strength: "100mg", form: "Capsule", default_dosage: "1 capsule", stock: 58 },
  { id: "med_9", name: "Ceftriaxone", strength: "1g", form: "Injection", default_dosage: "1 vial", stock: 18 },
  { id: "med_10", name: "Otomax Ear Ointment", strength: "15g", form: "Topical", default_dosage: "3 drops", stock: 22 },
  { id: "med_11", name: "Prednisolone", strength: "5mg", form: "Tablet", default_dosage: "1 tablet", stock: 66 },
  { id: "med_12", name: "Panacur Dewormer", strength: "250mg", form: "Tablet", default_dosage: "1 tablet", stock: 88 },
];

export const consultations: Consultation[] = [
  {
    id: "con_1",
    appointment_id: "apt_4",
    pet_id: "pet_5",
    pet_name: "Scout",
    owner_id: "own_4",
    doctor_id: "doc_1",
    doctor_name: "Dr. Amelia Reed",
    subjective: "Owner reports normal appetite and activity. Here for annual rabies booster.",
    objective: "BAR. Temp 38.4 C, HR 96 bpm. Mucous membranes pink, CRT < 2s. No abnormalities on auscultation.",
    assessment: "Healthy adult dog. Due for rabies vaccination.",
    plan: "Rabies vaccine administered SQ right hind. Recheck in 12 months. Monitor injection site for 24h.",
    vitals: { temperature_c: "38.4", weight_kg: "19.8", heart_rate: "96", resp_rate: "22" },
    created_at: day(-6, 10),
  },
];

export const prescriptionItems: Record<string, PrescriptionItem[]> = {
  rx_1: [
    {
      medicine_id: "med_1",
      name: "Carprofen",
      strength: "75mg",
      form: "Tablet",
      dosage: "1 tablet",
      frequency: "Twice daily",
      duration_days: 10,
      notes: "Give with food.",
    },
  ],
  rx_2: [
    {
      medicine_id: "med_2",
      name: "Apoquel",
      strength: "5.4mg",
      form: "Tablet",
      dosage: "1 tablet",
      frequency: "Once daily",
      duration_days: 21,
      notes: "Continue until skin irritation clears.",
    },
  ],
  rx_3: [
    {
      medicine_id: "med_6",
      name: "Bravecto",
      strength: "500mg",
      form: "Chew",
      dosage: "1 chew",
      frequency: "Every 12 weeks",
      duration_days: 84,
      notes: "Flea and tick prevention.",
    },
  ],
};

/** Extra profile fields layered onto the base doctor records. */
export const doctorProfiles: Record<
  string,
  { email: string; phone: string; registration_no: string; branch_id: string; consultation_fee: number; bio: string; active: boolean }
> = {
  doc_1: {
    email: "amelia.reed@petgood.vet",
    phone: "(310) 555-0301",
    registration_no: "VET-CA-10432",
    branch_id: "br_1",
    consultation_fee: 850,
    bio: "Internal medicine and preventive care, 11 years in practice.",
    active: true,
  },
  doc_2: {
    email: "noah.fletcher@petgood.vet",
    phone: "(310) 555-0302",
    registration_no: "VET-CA-11876",
    branch_id: "br_1",
    consultation_fee: 1200,
    bio: "Soft-tissue and orthopaedic surgery.",
    active: true,
  },
  doc_3: {
    email: "isabella.parker@petgood.vet",
    phone: "(213) 555-0303",
    registration_no: "VET-CA-12550",
    branch_id: "br_2",
    consultation_fee: 950,
    bio: "Dermatology and allergy management.",
    active: true,
  },
};
