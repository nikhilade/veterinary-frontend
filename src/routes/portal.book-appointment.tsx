import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { Panel } from "@/components/app/ui";
import { SlotPicker, todayISODate } from "@/components/app/kit/SlotPicker";
import { IdempotentSubmitButton } from "@/components/app/kit/IdempotentSubmitButton";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { bookingErrorCopy, createAppointment } from "@/lib/booking";
import type { Appointment, Branch, Doctor, Pet } from "@/lib/api/types";

export const Route = createFileRoute("/portal/book-appointment")({
  head: () => ({
    meta: [
      { title: "Book an Appointment | Pet Good Owner Portal" },
      { name: "description", content: "Schedule a visit for your pet: choose a branch, doctor, date and time." },
      { property: "og:title", content: "Book an Appointment | Pet Good Owner Portal" },
      { property: "og:description", content: "Schedule your next visit in under a minute." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalBooking,
});

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

const SERVICES = ["Consultation", "Vaccination", "Dental Cleaning", "Grooming", "Lab Work"];

function PortalBooking() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);

  const [petId, setPetId] = useState("");
  const [branchId, setBranchId] = useState("br_1");
  const [doctorId, setDoctorId] = useState("doc_1");
  const [service, setService] = useState(SERVICES[0]);
  const [date, setDate] = useState(todayISODate());
  const [slot, setSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const [refreshToken, setRefreshToken] = useState(0);
  const [shake, setShake] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get<Branch[]>(endpoints.branches.list),
      apiClient.get<Doctor[]>(endpoints.doctors.list),
      apiClient.get<Pet[]>(endpoints.pets.list),
    ])
      .then(([b, d, p]) => {
        setBranches(b);
        setDoctors(d);
        setPets(p);
        if (p[0]) setPetId(p[0].id);
      })
      .catch(() => undefined);
  }, []);

  const branch = branches.find((b) => b.id === branchId) ?? null;

  async function submit(headers: { "Idempotency-Key": string }) {
    setError("");
    if (!petId || !slot) {
      setError("Choose a pet and a time slot.");
      throw new Error("incomplete");
    }
    try {
      const created = await createAppointment(
        {
          pet_id: petId,
          doctor_id: doctorId,
          branch_id: branchId,
          service,
          scheduled_at: slot,
          notes,
          source_channel: "ONLINE",
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
      setConfirmed(created);
      return created;
    } catch (err) {
      setRetrying(false);
      setError(bookingErrorCopy(err));
      throw err;
    }
  }

  if (confirmed) {
    return (
      <PortalLayout title="Booking confirmed">
        <Panel>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="size-10 text-forest" />
            <h2 className="text-xl">You're booked!</h2>
            <p className="text-sm text-foreground/60">
              {confirmed.pet_name} with {confirmed.doctor_name} on{" "}
              {new Date(confirmed.scheduled_at).toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <button
              onClick={() => {
                setConfirmed(null);
                setSlot(null);
                setRefreshToken((n) => n + 1);
              }}
              className="mt-2 rounded-full border border-border px-5 py-2.5 text-sm"
            >
              Book another visit
            </button>
          </div>
        </Panel>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Book Appointment">
      <Panel>
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/60">1 · Branch</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={field}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.address}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/60">2 · Doctor (optional)</label>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={field}>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.specialty}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/60">Pet</label>
              <select value={petId} onChange={(e) => setPetId(e.target.value)} className={field}>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/60">Reason</label>
              <select value={service} onChange={(e) => setService(e.target.value)} className={field}>
                {SERVICES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-foreground/60">3 · Date & time</p>
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
          </div>

          <textarea
            rows={2}
            value={notes}
            placeholder="Anything the vet should know? (optional)"
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

          <IdempotentSubmitButton onSubmit={submit} disabled={!petId || !slot}>
            4 · Confirm booking
          </IdempotentSubmitButton>
        </div>
      </Panel>
    </PortalLayout>
  );
}
