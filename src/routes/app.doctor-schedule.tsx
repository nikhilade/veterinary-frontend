import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Plane, Trash2 } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel } from "@/components/app/ui";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/store";
import type { AvailabilityRule, DoctorAvailability, DoctorProfile } from "@/lib/api/types";

export const Route = createFileRoute("/app/doctor-schedule")({
  validateSearch: (search: Record<string, unknown>) => ({
    doctor: typeof search.doctor === "string" ? search.doctor : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Doctor Availability & Leave | Pet Good Console" },
      { name: "description", content: "Set weekly consulting hours and record leave for each veterinarian." },
      { property: "og:title", content: "Doctor Availability & Leave | Pet Good Console" },
      { property: "og:description", content: "Weekly hours and leave calendar for the clinical team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SchedulePage,
});

const field = "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const today = () => new Date().toISOString().slice(0, 10);

function hourLabel(h: number) {
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:00 ${suffix}`;
}

function SchedulePage() {
  const { doctor: doctorParam } = Route.useSearch();
  const { role, user } = useAuth();
  const isDoctor = role === "DOCTOR";

  const [doctors, setDoctors] = useState<DoctorProfile[] | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [data, setData] = useState<DoctorAvailability | null>(null);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [leave, setLeave] = useState({ start_date: today(), end_date: today(), reason: "", type: "LEAVE" });

  useEffect(() => {
    apiClient
      .get<DoctorProfile[]>(endpoints.doctors.list)
      .then((list) => {
        setDoctors(list);
        // A doctor only ever sees their own schedule.
        const own = isDoctor
          ? list.find((d) => d.name.toLowerCase().replace(/^dr\.?\s*/, "") === (user?.name ?? "").toLowerCase().replace(/^dr\.?\s*/, "")) ?? list[0]
          : list.find((d) => d.id === doctorParam) ?? list[0];
        setDoctorId(own?.id ?? null);
      })
      .catch(() => setDoctors([]));
  }, [isDoctor, user?.name, doctorParam]);

  function load(id: string) {
    setData(null);
    apiClient
      .get<DoctorAvailability>(endpoints.doctors.availability(id))
      .then((d) => {
        setData(d);
        setRules(d.rules);
      })
      .catch(() => setData({ doctor_id: id, rules: [], leaves: [] }));
  }

  useEffect(() => {
    if (doctorId) load(doctorId);
  }, [doctorId]);

  const weeklyHours = useMemo(
    () => rules.filter((r) => r.enabled).reduce((sum, r) => sum + Math.max(0, r.end_hour - r.start_hour), 0),
    [rules],
  );

  function updateRule(dayIndex: number, patch: Partial<AvailabilityRule>) {
    setRules((prev) => prev.map((r) => (r.day_of_week === dayIndex ? { ...r, ...patch } : r)));
  }

  async function saveRules() {
    if (!doctorId) return;
    setError("");
    setStatus("");
    try {
      const updated = await apiClient.request<DoctorAvailability>(endpoints.doctors.availability(doctorId), {
        method: "PUT",
        body: { rules },
      });
      setData(updated.data);
      setRules(updated.data.rules);
      setStatus("Weekly hours saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save availability.");
    }
  }

  async function addLeave() {
    if (!doctorId) return;
    setError("");
    setStatus("");
    try {
      await apiClient.post(endpoints.doctors.leave(doctorId), leave);
      setLeave({ start_date: today(), end_date: today(), reason: "", type: "LEAVE" });
      load(doctorId);
      setStatus("Leave recorded.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record leave.");
    }
  }

  async function removeLeave(id: string) {
    if (!doctorId) return;
    await apiClient.request(endpoints.doctors.leave(doctorId), { method: "DELETE", body: { leave_id: id } });
    load(doctorId);
  }

  const selected = doctors?.find((d) => d.id === doctorId);

  return (
    <StaffLayout
      title="Availability & Leave"
      subtitle={isDoctor ? "Your consulting hours" : "Weekly hours and leave for the clinical team"}
      permission="doctors:read"
    >
      {!doctors ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          <Panel title={selected ? selected.name : "Select a doctor"}>
            {isDoctor ? (
              <p className="text-sm text-foreground/60">
                You are viewing your own schedule. {selected?.specialty}
              </p>
            ) : (
              <div className="max-w-sm">
                <label className="block text-xs font-medium uppercase tracking-wide text-foreground/50" htmlFor="doc-select">
                  Doctor
                </label>
                <select
                  id="doc-select"
                  className={`${field} mt-1.5`}
                  value={doctorId ?? ""}
                  onChange={(e) => setDoctorId(e.target.value)}
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialty}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </Panel>

          {!data ? (
            <Loading />
          ) : (
            <>
              <Panel
                title="Weekly consulting hours"
                action={<span className="text-sm text-foreground/60">{weeklyHours}h / week</span>}
              >
                <div className="space-y-2">
                  {rules
                    .slice()
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((r) => (
                      <div
                        key={r.day_of_week}
                        className="flex flex-wrap items-center gap-3 rounded-[1.25rem] border border-border px-4 py-3"
                      >
                        <label className="flex w-36 items-center gap-2 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={r.enabled}
                            onChange={(e) => updateRule(r.day_of_week, { enabled: e.target.checked })}
                            className="size-4 accent-[var(--color-forest)]"
                            aria-label={`${dayNames[r.day_of_week]} available`}
                          />
                          {dayNames[r.day_of_week]}
                        </label>
                        <select
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-40"
                          value={r.start_hour}
                          disabled={!r.enabled}
                          aria-label={`${dayNames[r.day_of_week]} start`}
                          onChange={(e) => updateRule(r.day_of_week, { start_hour: Number(e.target.value) })}
                        >
                          {Array.from({ length: 24 }, (_, h) => (
                            <option key={h} value={h}>{hourLabel(h)}</option>
                          ))}
                        </select>
                        <span className="text-sm text-foreground/50">to</span>
                        <select
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-40"
                          value={r.end_hour}
                          disabled={!r.enabled}
                          aria-label={`${dayNames[r.day_of_week]} end`}
                          onChange={(e) => updateRule(r.day_of_week, { end_hour: Number(e.target.value) })}
                        >
                          {Array.from({ length: 24 }, (_, h) => (
                            <option key={h} value={h}>{hourLabel(h)}</option>
                          ))}
                        </select>
                        {r.enabled && r.end_hour <= r.start_hour ? (
                          <span className="text-xs text-destructive">End must be after start</span>
                        ) : null}
                      </div>
                    ))}
                </div>
                <button onClick={saveRules} className="mt-5 rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-primary-foreground">
                  Save weekly hours
                </button>
              </Panel>

              <Panel title="Leave calendar">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <label className="block text-xs uppercase text-foreground/50" htmlFor="lv-start">From</label>
                    <input id="lv-start" type="date" className={`${field} mt-1.5`} value={leave.start_date} onChange={(e) => setLeave({ ...leave, start_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-foreground/50" htmlFor="lv-end">To</label>
                    <input id="lv-end" type="date" className={`${field} mt-1.5`} value={leave.end_date} onChange={(e) => setLeave({ ...leave, end_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-foreground/50" htmlFor="lv-type">Type</label>
                    <select id="lv-type" className={`${field} mt-1.5`} value={leave.type} onChange={(e) => setLeave({ ...leave, type: e.target.value })}>
                      <option value="LEAVE">Leave</option>
                      <option value="HALF_DAY">Half day</option>
                      <option value="CONFERENCE">Conference</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase text-foreground/50" htmlFor="lv-reason">Reason</label>
                    <input id="lv-reason" className={`${field} mt-1.5`} value={leave.reason} onChange={(e) => setLeave({ ...leave, reason: e.target.value })} placeholder="Annual leave" />
                  </div>
                </div>
                <button onClick={addLeave} className="mt-4 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-primary-foreground">
                  <Plane className="size-4" />
                  Add leave
                </button>

                <div className="mt-5 space-y-2">
                  {data.leaves.length === 0 ? (
                    <EmptyState message="No leave recorded." icon={<CalendarClock className="size-6" />} />
                  ) : (
                    data.leaves.map((l) => (
                      <div key={l.id} className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-border px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">
                            {l.start_date} → {l.end_date}
                          </p>
                          <p className="text-xs text-foreground/60">
                            {l.type.replace(/_/g, " ").toLowerCase()} · {l.reason}
                          </p>
                        </div>
                        <button onClick={() => removeLeave(l.id)} aria-label="Remove leave" className="rounded-full border border-border p-2 text-destructive">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </Panel>

              {status ? <p className="text-sm text-forest">{status}</p> : null}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </>
          )}
        </div>
      )}
    </StaffLayout>
  );
}
