import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, X, AlertTriangle } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel } from "@/components/app/ui";
import { StatusBadge, statusAccent } from "@/components/app/kit/StatusBadge";
import { NewAppointmentForm } from "@/components/app/kit/NewAppointmentForm";
import { todayISODate } from "@/components/app/kit/SlotPicker";
import { ApiError, apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Appointment, Branch } from "@/lib/api/types";

export const Route = createFileRoute("/app/calendar")({
  head: () => ({
    meta: [
      { title: "Appointment Calendar | Pet Good Console" },
      { name: "description", content: "Day and week appointment calendar with drag-to-reschedule for clinic staff." },
      { property: "og:title", content: "Appointment Calendar | Pet Good Console" },
      { property: "og:description", content: "Day and week scheduling for the clinic team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CalendarPage,
});

const HOUR_START = 8;
const HOUR_END = 19;

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d: Date, n: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}
function startOfWeek(d: Date) {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  s.setHours(0, 0, 0, 0);
  return s;
}
function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function CalendarPage() {
  const [view, setView] = useState<"day" | "week">("day");
  const [anchor, setAnchor] = useState(() => new Date());
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("br_1");
  const [creating, setCreating] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [banner, setBanner] = useState("");

  const load = useCallback(() => {
    apiClient
      .get<Appointment[]>(endpoints.appointments.list)
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    load();
    apiClient
      .get<Branch[]>(endpoints.branches.list)
      .then(setBranches)
      .catch(() => undefined);
  }, [load]);

  const branch = branches.find((b) => b.id === branchId) ?? null;
  const days = useMemo(() => {
    if (view === "day") return [new Date(anchor)];
    const s = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(s, i));
  }, [view, anchor]);

  const visible = (items ?? []).filter((a) => (a.branch_id ?? "br_1") === branchId);
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

  function forCell(day: Date, hour: number) {
    return visible.filter((a) => {
      const d = new Date(a.scheduled_at);
      return isoDate(d) === isoDate(day) && d.getHours() === hour;
    });
  }

  const closedOn = (day: Date) => !!branch && branch.working_hours.closed_days.includes(day.getDay());
  const outsideHours = (day: Date, hour: number) =>
    !!branch && (hour < branch.working_hours.open_hour || hour >= branch.working_hours.close_hour || closedOn(day));

  async function drop(day: Date, hour: number) {
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const target = new Date(day);
    target.setHours(hour, 0, 0, 0);
    if (target.getTime() < Date.now()) {
      setBanner("You can't move an appointment into the past.");
      return;
    }
    if (outsideHours(day, hour)) {
      setBanner("That time is outside the branch's working hours.");
      return;
    }
    setBanner("");
    try {
      await apiClient.post(endpoints.appointments.reschedule(id), { scheduled_at: target.toISOString() });
      load();
    } catch (err) {
      setBanner(
        err instanceof ApiError && err.code === "ERR_DOUBLE_BOOKING"
          ? "That slot was just taken — pick another one."
          : "Could not reschedule that appointment.",
      );
      load();
    }
  }

  return (
    <StaffLayout title="Appointment Calendar" subtitle="Day & week schedule" permission="appointments:read">
      <div className="space-y-5">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                aria-label="Previous"
                onClick={() => setAnchor((d) => addDays(d, view === "day" ? -1 : -7))}
                className="rounded-full border border-border p-2"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => setAnchor(new Date())}
                className="rounded-full border border-border px-4 py-2 text-sm"
              >
                Today
              </button>
              <button
                aria-label="Next"
                onClick={() => setAnchor((d) => addDays(d, view === "day" ? 1 : 7))}
                className="rounded-full border border-border p-2"
              >
                <ChevronRight className="size-4" />
              </button>
              <p className="ml-2 text-sm font-medium">
                {view === "day"
                  ? anchor.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
                  : `${days[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-forest"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <div className="flex rounded-full border border-border p-1">
                {(["day", "week"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded-full px-4 py-1.5 text-sm capitalize ${
                      view === v ? "bg-forest text-primary-foreground" : "text-foreground/70"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCreating((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-primary-foreground"
              >
                {creating ? <X className="size-4" /> : <Plus className="size-4" />}
                {creating ? "Close" : "New appointment"}
              </button>
            </div>
          </div>
          {banner ? (
            <p className="mt-3 flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" /> {banner}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-foreground/50">
            Drag an appointment card onto another time slot to reschedule it. Past and out-of-hours cells are blocked.
          </p>
        </Panel>

        {creating ? (
          <Panel title="New appointment">
            <NewAppointmentForm
              defaultDate={view === "day" ? isoDate(anchor) : todayISODate()}
              onCreated={() => {
                load();
                setCreating(false);
              }}
            />
          </Panel>
        ) : null}

        {!items ? (
          <Loading />
        ) : visible.length === 0 ? (
          <Panel>
            <EmptyState
              icon={<CalendarDays className="size-8" />}
              title="Nothing booked yet"
              message="Create the first appointment for this branch and it will show up on the calendar."
            />
          </Panel>
        ) : (
          <Panel>
            <div className="overflow-x-auto">
              <div
                className="min-w-[720px]"
                style={{ display: "grid", gridTemplateColumns: `72px repeat(${days.length}, minmax(0, 1fr))` }}
              >
                <div />
                {days.map((d) => (
                  <div key={d.toISOString()} className="pb-2 text-center">
                    <p className="text-xs uppercase text-foreground/50">
                      {d.toLocaleDateString(undefined, { weekday: "short" })}
                    </p>
                    <p className={`text-sm font-medium ${isoDate(d) === isoDate(new Date()) ? "text-forest" : ""}`}>
                      {d.getDate()}
                    </p>
                  </div>
                ))}

                {hours.map((h) => (
                  <div key={h} className="contents">
                    <div className="border-t border-border py-3 pr-2 text-right text-xs text-foreground/50">
                      {String(h).padStart(2, "0")}:00
                    </div>
                    {days.map((d) => {
                      const blocked = outsideHours(d, h);
                      const cellDate = new Date(d);
                      cellDate.setHours(h, 0, 0, 0);
                      const past = cellDate.getTime() < Date.now();
                      return (
                        <div
                          key={`${d.toISOString()}-${h}`}
                          onDragOver={(e) => {
                            if (!blocked && !past) e.preventDefault();
                          }}
                          onDrop={() => drop(d, h)}
                          className={`min-h-14 space-y-1 border-t border-l border-border p-1 ${
                            blocked || past ? "bg-muted/60" : "bg-background"
                          }`}
                        >
                          {forCell(d, h).map((a) => (
                            <div
                              key={a.id}
                              draggable={a.status !== "COMPLETED" && a.status !== "CANCELLED"}
                              onDragStart={() => setDragId(a.id)}
                              onDragEnd={() => setDragId(null)}
                              className={`cursor-grab rounded-xl border border-border bg-card p-2 text-left text-xs shadow-sm active:cursor-grabbing ${
                                dragId === a.id ? "opacity-50" : ""
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <span className={`size-1.5 shrink-0 rounded-full ${statusAccent(a.status)}`} />
                                <span className="truncate font-medium">{a.pet_name}</span>
                              </span>
                              <p className="truncate text-foreground/60">{timeLabel(a.scheduled_at)} · {a.service}</p>
                              <p className="truncate text-foreground/50">{a.doctor_name}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
              {(["SCHEDULED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"] as const).map(
                (s) => (
                  <StatusBadge key={s} status={s} />
                ),
              )}
            </div>
          </Panel>
        )}
      </div>
    </StaffLayout>
  );
}
