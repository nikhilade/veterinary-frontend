import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { Loading, Panel, StatCard, StatusPill, formatDate, formatMoney } from "@/components/app/ui";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { DashboardStats } from "@/lib/api/types";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "Staff Dashboard | Pet Good Console" },
      { name: "description", content: "Clinic overview: today's appointments, revenue, invoices and stock alerts." },
      { property: "og:title", content: "Staff Dashboard | Pet Good Console" },
      { property: "og:description", content: "Daily clinic operations at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffDashboard,
});

function StaffDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    function load() {
      apiClient.get<DashboardStats>(endpoints.dashboard.staff).then(setStats).catch(() => setStats(null));
    }
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <StaffLayout title="Dashboard" subtitle="Today at Pet Good">
      {!stats ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Appointments today" value={stats.appointmentsToday} />
            <StatCard label="Active patients" value={stats.activePatients} />
            <StatCard label="Revenue (month)" value={formatMoney(stats.revenueMonth)} />
            <StatCard label="Pending invoices" value={stats.pendingInvoices} />
            <StatCard label="Low stock items" value={stats.lowStockItems} />
          </div>

          <Panel title="Upcoming appointments">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
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
                  {(stats.upcoming || []).map((a) => (
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
        </div>
      )}
    </StaffLayout>
  );
}
