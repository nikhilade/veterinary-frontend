import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { Loading, Panel, formatMoney } from "@/components/app/ui";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";

export const Route = createFileRoute("/app/reports")({
  head: () => ({
    meta: [
      { title: "Reports | Pet Good Console" },
      { name: "description", content: "Revenue trends and appointment volume by service for the clinic." },
      { property: "og:title", content: "Reports | Pet Good Console" },
      { property: "og:description", content: "Revenue and service performance reporting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportsPage,
});

interface Overview {
  revenue_by_month: { month: string; revenue: number }[];
  appointments_by_service: { service: string; count: number }[];
}

function ReportsPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    apiClient.get<Overview>(endpoints.reports.overview).then(setData).catch(() => setData(null));
  }, []);

  const maxRevenue = Math.max(1, ...(data?.revenue_by_month.map((r) => r.revenue) ?? [1]));
  const maxCount = Math.max(1, ...(data?.appointments_by_service.map((r) => r.count) ?? [1]));

  return (
    <StaffLayout title="Reports" subtitle="Performance overview" permission="reports:read">
      {!data ? (
        <Loading />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Revenue by month">
            <div className="flex h-56 items-end gap-4">
              {data.revenue_by_month.map((r) => (
                <div key={r.month} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs text-foreground/60">{formatMoney(r.revenue)}</span>
                  <div
                    className="w-full rounded-t-xl bg-forest"
                    style={{ height: `${(r.revenue / maxRevenue) * 160}px` }}
                  />
                  <span className="text-xs text-foreground/60">{r.month}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Appointments by service">
            <ul className="space-y-4">
              {data.appointments_by_service.map((s) => (
                <li key={s.service}>
                  <div className="flex justify-between text-sm">
                    <span>{s.service}</span>
                    <span className="text-foreground/60">{s.count}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-clay" style={{ width: `${(s.count / maxCount) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </StaffLayout>
  );
}
