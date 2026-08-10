import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { EmptyState, Loading, Panel, StatusPill, formatDate } from "@/components/app/ui";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Appointment } from "@/lib/api/types";

export const Route = createFileRoute("/portal/my-appointments")({
  head: () => ({
    meta: [
      { title: "My Appointments | Pet Good Owner Portal" },
      { name: "description", content: "Track upcoming and past visits for every pet in your family." },
      { property: "og:title", content: "My Appointments | Pet Good Owner Portal" },
      { property: "og:description", content: "Upcoming and past visits at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyAppointments,
});

function MyAppointments() {
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    apiClient.post<Appointment[]>(endpoints.appointments.mine, { scope: "MINE" }).then(setItems).catch(() => setItems([]));
  }, []);

  function replace(updated: Appointment) {
    setItems((list) => (list ?? []).map((a) => (a.id === updated.id ? updated : a)));
  }

  async function cancel(a: Appointment) {
    setBusy(a.id);
    setMessage(null);
    try {
      replace(await apiClient.post<Appointment>(endpoints.appointments.cancel(a.id)));
      setMessage("Appointment cancelled.");
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Could not cancel — please call the clinic.");
    } finally {
      setBusy(null);
    }
  }

  async function reschedule(a: Appointment) {
    if (!newDate) return;
    setBusy(a.id);
    setMessage(null);
    try {
      replace(
        await apiClient.post<Appointment>(endpoints.appointments.reschedule(a.id), {
          scheduled_at: new Date(newDate).toISOString(),
        }),
      );
      setRescheduling(null);
      setNewDate("");
      setMessage("Appointment rescheduled.");
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Could not reschedule — please call the clinic.");
    } finally {
      setBusy(null);
    }
  }

  const now = Date.now();
  const upcoming = (items ?? []).filter((a) => new Date(a.scheduled_at).getTime() >= now && a.status !== "CANCELLED");
  const past = (items ?? []).filter((a) => new Date(a.scheduled_at).getTime() < now || a.status === "CANCELLED");

  const card = (a: Appointment, actions: boolean) => (
    <Panel key={a.id}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg">{a.service}</p>
          <p className="mt-1 text-sm text-foreground/70">
            {a.pet_name} · {a.doctor_name}
          </p>
          <p className="mt-1 text-sm text-clay">{formatDate(a.scheduled_at)}</p>
          {a.notes ? <p className="mt-2 text-sm text-foreground/60">{a.notes}</p> : null}
        </div>
        <StatusPill status={a.status} />
      </div>
      {actions ? (
        <div className="mt-4 space-y-3">
          {rescheduling === a.id ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="rounded-2xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-forest"
              />
              <button
                onClick={() => reschedule(a)}
                disabled={busy === a.id || !newDate}
                className="rounded-full bg-forest px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                Confirm
              </button>
              <button onClick={() => setRescheduling(null)} className="rounded-full border border-border px-4 py-2 text-sm">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setRescheduling(a.id)}
                className="rounded-full border border-border px-4 py-2 text-sm text-forest"
              >
                Reschedule
              </button>
              <button
                onClick={() => cancel(a)}
                disabled={busy === a.id}
                className="rounded-full border border-destructive/40 px-4 py-2 text-sm text-destructive disabled:opacity-50"
              >
                Cancel visit
              </button>
            </div>
          )}
        </div>
      ) : null}
    </Panel>
  );

  return (
    <PortalLayout title="My Appointments">
      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-8" />}
          title="No appointments yet"
          message="Book your pet's first visit and it will show up here with reminders."
          action={
            <Link to="/portal/book-appointment" className="rounded-full bg-forest px-5 py-2.5 text-sm text-primary-foreground">
              Book an appointment
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {message ? <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-forest">{message}</p> : null}
          <section className="space-y-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/50">Upcoming</h2>
            {upcoming.length === 0 ? (
              <EmptyState message="No upcoming visits scheduled." />
            ) : (
              upcoming.map((a) => card(a, true))
            )}
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/50">Past</h2>
            {past.length === 0 ? <EmptyState message="No past visits yet." /> : past.map((a) => card(a, false))}
          </section>
        </div>
      )}
    </PortalLayout>
  );
}
