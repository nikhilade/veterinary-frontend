import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { Loading, Panel, StatusPill, formatDate } from "@/components/app/ui";
import { NewAppointmentForm } from "@/components/app/kit/NewAppointmentForm";
import { todayISODate } from "@/components/app/kit/SlotPicker";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Appointment } from "@/lib/api/types";

export const Route = createFileRoute("/app/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments | Pet Good Console" },
      { name: "description", content: "Clinic-wide appointment schedule across doctors, services and statuses." },
      { property: "og:title", content: "Appointments | Pet Good Console" },
      { property: "og:description", content: "The full clinic schedule." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [status, setStatus] = useState("ALL");
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    apiClient
      .get<Appointment[]>(endpoints.appointments.list)
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = (items ?? []).filter((a) => status === "ALL" || a.status === status);

  return (
    <StaffLayout title="Appointments" subtitle="Clinic schedule" permission="appointments:read">
      <div className="space-y-5">
        {creating && (
          <Panel title="New appointment">
            <NewAppointmentForm
              defaultDate={todayISODate()}
              onCreated={() => {
                load();
                setCreating(false);
              }}
            />
          </Panel>
        )}

        {!items ? (
          <Loading />
        ) : (
          <Panel
            title={`${filtered.length} appointments`}
            action={
              <div className="flex items-center gap-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-forest"
                >
                  {["ALL", "SCHEDULED", "CHECKED_IN", "COMPLETED", "CANCELLED"].map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setCreating((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  {creating ? <X className="size-4" /> : <Plus className="size-4" />}
                  {creating ? "Close" : "New appointment"}
                </button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase text-foreground/50">
                  <tr>
                    <th className="pb-3">Pet</th>
                    <th className="pb-3">Owner</th>
                    <th className="pb-3">Doctor</th>
                    <th className="pb-3">Service</th>
                    <th className="pb-3">When</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="py-3 font-medium">{a.petName}</td>
                      <td className="py-3 text-foreground/70">{a.ownerName}</td>
                      <td className="py-3 text-foreground/70">{a.doctorName}</td>
                      <td className="py-3 text-foreground/70">{a.service}</td>
                      <td className="py-3 text-foreground/70">{formatDate(a.scheduledAt)}</td>
                      <td className="py-3">
                        <StatusPill status={a.status} />
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

