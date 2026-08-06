import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Appointment, Branch, Doctor, Pet, PetOwner } from "@/lib/api/types";
import { PetPicker } from "./PetPicker";
import { SlotPicker, todayISODate } from "./SlotPicker";
import { IdempotentSubmitButton } from "./IdempotentSubmitButton";
import { bookingErrorCopy, createAppointment } from "@/lib/booking";

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

const SERVICES = ["Consultation", "Vaccination", "Dental Cleaning", "Grooming", "Surgery Follow-up", "Lab Work"];

/** Staff-side appointment creation: pet → branch → doctor → slot → confirm. */
export function NewAppointmentForm({
  defaultDate,
  onCreated,
}: {
  defaultDate?: string;
  onCreated?: (appointment: Appointment) => void;
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [owner, setOwner] = useState<PetOwner | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);
  const [branchId, setBranchId] = useState("br_1");
  const [doctorId, setDoctorId] = useState("doc_1");
  const [service, setService] = useState(SERVICES[0]);
  const [date, setDate] = useState(defaultDate ?? todayISODate());
  const [slot, setSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const [refreshToken, setRefreshToken] = useState(0);
  const [shake, setShake] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiClient.get<Branch[]>(endpoints.branches.list),
      apiClient.get<Doctor[]>(endpoints.doctors.list),
    ])
      .then(([b, d]) => {
        setBranches(b);
        setDoctors(d);
      })
      .catch(() => undefined);
  }, []);

  const branch = branches.find((b) => b.id === branchId) ?? null;

  async function submit(headers: { "Idempotency-Key": string }) {
    setError("");
    if (!pet || !slot) {
      setError("Pick a pet and a time slot first.");
      throw new Error("incomplete");
    }
    try {
      const created = await createAppointment(
        {
          pet_id: pet.id,
          doctor_id: doctorId,
          branch_id: branchId,
          service,
          scheduled_at: slot,
          notes,
          source_channel: "WALK_IN",
        },
        headers,
        {
          onLockRetry: () => setRetrying(true),
          onDoubleBooking: () => {
            setSlot(null);
            setShake(true);
            setRefreshToken((n) => n + 1);
            setTimeout(() => setShake(false), 600);
          },
        },
      );
      setRetrying(false);
      setSlot(null);
      setRefreshToken((n) => n + 1);
      onCreated?.(created);
      return created;
    } catch (err) {
      setRetrying(false);
      setError(bookingErrorCopy(err));
      throw err;
    }
  }

  return (
    <div className="space-y-5">
      <PetPicker owner={owner} onOwnerChange={setOwner} value={pet} onChange={setPet} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/60">Branch</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={field}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/60">Doctor</label>
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={field}>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/60">Service</label>
          <select value={service} onChange={(e) => setService(e.target.value)} className={field}>
            {SERVICES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <SlotPicker
        branchId={branchId}
        branch={branch}
        doctorId={doctorId}
        date={date}
        onDateChange={(d) => {
          setDate(d);
          setSlot(null);
        }}
        value={slot}
        onChange={setSlot}
        refreshToken={refreshToken}
        shake={shake}
        busyLabel={retrying ? "Checking availability…" : undefined}
      />

      <textarea
        rows={2}
        value={notes}
        placeholder="Notes for the vet (optional)"
        onChange={(e) => setNotes(e.target.value)}
        className={field}
      />

      {retrying ? (
        <p className="flex items-center gap-2 text-sm text-clay">
          <Loader2 className="size-4 animate-spin" /> Checking availability…
        </p>
      ) : null}
      {error ? (
        <p className="flex items-start gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      ) : null}

      <IdempotentSubmitButton onSubmit={submit} disabled={!pet || !slot}>
        Create appointment
      </IdempotentSubmitButton>
    </div>
  );
}
