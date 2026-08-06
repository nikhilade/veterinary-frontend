import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { Loading, Panel, StatusPill, formatDate } from "@/components/app/ui";
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

  useEffect(() => {
    apiClient.get<Appointment[]>(endpoints.appointments.list).then(setItems).catch(() => setItems([]));
  }, []);

  const filtered = (items ?? []).filter((a) => status === "ALL" || a.status === status);

  return (
    <StaffLayout title="Appointments" subtitle="Clinic schedule" permission="appointments:read">
      {!items ? (
        <Loading />
      ) : (
        <Panel
          title={`${filtered.length} appointments`}
          action={
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
                    <td className="py-3 font-medium">{a.pet_name}</td>
                    <td className="py-3 text-foreground/70">{a.owner_name}</td>
                    <td className="py-3 text-foreground/70">{a.doctor_name}</td>
                    <td className="py-3 text-foreground/70">{a.service}</td>
                    <td className="py-3 text-foreground/70">{formatDate(a.scheduled_at)}</td>
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
    </StaffLayout>
  );
}
