import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Doctor, Pet } from "@/lib/api/types";
import { Loading } from "./ui";

const SERVICES = [
  "Veterinary Care",
  "Grooming Services",
  "Boarding & Daycare",
  "Training Services",
  "Special Care Services",
];

export function BookingForm({ ownerId = "own_1" }: { ownerId?: string }) {
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [form, setForm] = useState({ pet_id: "", doctor_id: "", service: SERVICES[0], scheduled_at: "", notes: "" });
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      apiClient.get<Pet[]>(endpoints.pets.byOwner(ownerId)),
      apiClient.get<Doctor[]>(endpoints.doctors.list),
    ])
      .then(([p, d]) => {
        if (!active) return;
        setPets(p);
        setDoctors(d);
        setForm((f) => ({ ...f, pet_id: p[0]?.id ?? "", doctor_id: d[0]?.id ?? "" }));
      })
      .catch(() => active && setPets([]));
    return () => {
      active = false;
    };
  }, [ownerId]);

  if (!pets || !doctors) return <Loading />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    try {
      await apiClient.post(endpoints.appointments.create, {
        ...form,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : new Date().toISOString(),
      });
      setStatus("done");
      setMessage("Appointment requested — our team will confirm shortly.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not book the appointment.");
    }
  }

  const field = "w-full rounded-full border border-border bg-background px-5 py-3 text-[15px] outline-none focus:border-forest";

  return (
    <form onSubmit={submit} className="space-y-4">
      <select value={form.pet_id} onChange={(e) => setForm({ ...form, pet_id: e.target.value })} className={field}>
        {pets.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {p.breed}
          </option>
        ))}
      </select>
      <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className={field}>
        {SERVICES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <select value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} className={field}>
        {doctors.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} — {d.specialty}
          </option>
        ))}
      </select>
      <input
        required
        type="datetime-local"
        value={form.scheduled_at}
        onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
        className={field}
      />
      <textarea
        rows={4}
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="Anything we should know about your pet?"
        className="w-full rounded-[1.5rem] border border-border bg-background px-5 py-4 text-[15px] outline-none focus:border-forest"
      />

      {message ? (
        <p className={`text-sm ${status === "error" ? "text-destructive" : "text-forest"}`}>{message}</p>
      ) : null}

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-full bg-forest px-9 py-3.5 font-medium text-primary-foreground disabled:opacity-60"
      >
        {status === "saving" ? "Booking…" : "Request Appointment"}
      </button>
    </form>
  );
}
