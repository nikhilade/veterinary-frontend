import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, MonitorPlay, RefreshCw, Users } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel, StatCard } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/kit/StatusBadge";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Appointment, AppointmentStatus } from "@/lib/api/types";

export const Route = createFileRoute("/app/queue")({
  head: () => ({
    meta: [
      { title: "Reception Check-in & Queue | Pet Good Console" },
      { name: "description", content: "Front-desk check-in with live token numbers for today's appointments." },
      { property: "og:title", content: "Reception Check-in & Queue | Pet Good Console" },
      { property: "og:description", content: "Check pets in and run the waiting-room token queue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QueuePage,
});

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function QueuePage() {
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    apiClient
      .get<Appointment[]>(endpoints.appointments.queue, { branch_id: "br_1" })
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  async function checkIn(id: string) {
    setBusy(id);
    try {
      await apiClient.post(endpoints.appointments.checkIn(id));
      load();
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(id: string, status: AppointmentStatus) {
    setBusy(id);
    try {
      await apiClient.post(endpoints.appointments.status(id), { status });
      load();
    } finally {
      setBusy(null);
    }
  }

  const list = items ?? [];
  const waiting = list.filter((a) => a.status === "CHECKED_IN");
  const serving = list.find((a) => a.status === "IN_PROGRESS") ?? null;
  const done = list.filter((a) => a.status === "COMPLETED").length;

  return (
    <StaffLayout title="Reception & Queue" subtitle="Today's check-ins" permission="appointments:read">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Now serving" value={serving?.token_number ? `#${serving.token_number}` : "—"} hint={serving?.pet_name} />
          <StatCard label="Waiting" value={waiting.length} hint="Checked in, not called" />
          <StatCard label="Completed" value={done} hint="So far today" />
          <div className="flex items-center justify-center gap-2 rounded-[1.5rem] border border-border bg-card p-5">
            <Link
              to="/app/now-serving"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <MonitorPlay className="size-4" /> TV display
            </Link>
            <button aria-label="Refresh" onClick={load} className="rounded-full border border-border p-2.5">
              <RefreshCw className="size-4" />
            </button>
          </div>
        </div>

        {!items ? (
          <Loading />
        ) : list.length === 0 ? (
          <Panel>
            <EmptyState
              icon={<Users className="size-8" />}
              title="No appointments today"
              message="Once today's appointments are booked they'll appear here ready for check-in."
            />
          </Panel>
        ) : (
          <Panel title={`${list.length} appointments today`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase text-foreground/50">
                  <tr>
                    <th className="pb-3">Token</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Pet</th>
                    <th className="pb-3">Owner</th>
                    <th className="pb-3">Doctor</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="py-3 font-mono text-base font-bold text-forest">
                        {a.token_number ? `#${a.token_number}` : "—"}
                      </td>
                      <td className="py-3 text-foreground/70">{timeLabel(a.scheduled_at)}</td>
                      <td className="py-3 font-medium">{a.pet_name}</td>
                      <td className="py-3 text-foreground/70">{a.owner_name}</td>
                      <td className="py-3 text-foreground/70">{a.doctor_name}</td>
                      <td className="py-3">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="py-3 text-right">
                        {a.status === "SCHEDULED" || a.status === "CONFIRMED" ? (
                          <button
                            disabled={busy === a.id}
                            onClick={() => checkIn(a.id)}
                            className="rounded-full bg-forest px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
                          >
                            Check in
                          </button>
                        ) : a.status === "CHECKED_IN" ? (
                          <button
                            disabled={busy === a.id}
                            onClick={() => setStatus(a.id, "IN_PROGRESS")}
                            className="rounded-full border border-forest px-4 py-2 text-xs font-medium text-forest disabled:opacity-60"
                          >
                            Call in
                          </button>
                        ) : a.status === "IN_PROGRESS" ? (
                          <button
                            disabled={busy === a.id}
                            onClick={() => setStatus(a.id, "COMPLETED")}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium disabled:opacity-60"
                          >
                            <CheckCircle2 className="size-3.5" /> Complete
                          </button>
                        ) : (
                          <span className="text-xs text-foreground/40">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>
    </StaffLayout>
  );
}
