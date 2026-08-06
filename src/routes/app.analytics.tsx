import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  PackageSearch,
} from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { Loading, Panel } from "@/components/app/ui";
import { endpoints } from "@/lib/api/endpoints";
import type {
  AdminKpis,
  DoctorPerformance,
  HeatmapCell,
  InventoryAlerts,
  PaymentModeSplit,
  PendingInvoice,
  RevenuePoint,
  ServiceRevenue,
} from "@/lib/api/analytics-types";
import { POLL_AGGREGATE_MS, POLL_LIVE_MS, usePolledQuery } from "@/lib/use-polled-query";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics Dashboard | Pet Good Console" },
      {
        name: "description",
        content:
          "Hospital admin analytics: revenue trends, doctor performance, payment mix, appointment heatmap and pending invoices.",
      },
      { property: "og:title", content: "Analytics Dashboard | Pet Good Console" },
      { property: "og:description", content: "Live clinic KPIs, revenue analytics and collections." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalyticsDashboard,
});

const INR = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const SERVICE_COLORS = [
  "var(--forest)",
  "var(--clay)",
  "oklch(0.55 0.09 158)",
  "oklch(0.78 0.11 80)",
  "oklch(0.66 0.06 200)",
];

const METHOD_COLORS: Record<string, string> = {
  CASH: "var(--forest)",
  CARD: "var(--clay)",
  UPI: "oklch(0.6 0.1 200)",
  ONLINE: "oklch(0.72 0.12 120)",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function AnalyticsDashboard() {
  /* Appointment-related widgets refresh every 15 seconds. */
  const kpis = usePolledQuery<AdminKpis>(endpoints.analytics.kpis, POLL_LIVE_MS);
  const heatmap = usePolledQuery<HeatmapCell[]>(endpoints.analytics.appointmentHeatmap, POLL_LIVE_MS);
  const pending = usePolledQuery<PendingInvoice[]>(endpoints.analytics.pendingInvoices, POLL_LIVE_MS);

  /* Aggregates refresh every 15 minutes. */
  const revenue = usePolledQuery<RevenuePoint[]>(endpoints.analytics.revenueDaily, POLL_AGGREGATE_MS);
  const byService = usePolledQuery<ServiceRevenue[]>(endpoints.analytics.revenueByService, POLL_AGGREGATE_MS);
  const doctorsPerf = usePolledQuery<DoctorPerformance[]>(endpoints.analytics.doctorPerformance, POLL_AGGREGATE_MS);
  const inventory = usePolledQuery<InventoryAlerts>(endpoints.analytics.inventoryAlerts, POLL_AGGREGATE_MS);
  const modes = usePolledQuery<PaymentModeSplit[]>(endpoints.analytics.paymentModes, POLL_LIVE_MS);

  return (
    <StaffLayout
      title="Analytics"
      subtitle="Hospital performance — live operations every 15s, aggregates every 15 min"
      permission="reports:read"
    >
      <div className="space-y-6">
        {/* 1 — KPI row */}
        {!kpis.data ? (
          <Loading />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <Kpi label="Today revenue" value={INR(kpis.data.today_revenue)} delta={kpis.data.deltas["today_revenue"]} />
            <Kpi label="Total invoices" value={kpis.data.total_invoices} delta={kpis.data.deltas["total_invoices"]} />
            <Kpi label="Outstanding" value={INR(kpis.data.outstanding)} delta={kpis.data.deltas["outstanding"]} invert />
            <Kpi label="Refunds" value={INR(kpis.data.refunds)} delta={kpis.data.deltas["refunds"]} invert />
            <Kpi
              label="Active patients today"
              value={kpis.data.active_patients_today}
              delta={kpis.data.deltas["active_patients_today"]}
            />
            <Kpi
              label="New registrations"
              value={kpis.data.new_registrations}
              delta={kpis.data.deltas["new_registrations"]}
            />
          </div>
        )}

        {/* 2 — Revenue line + service donut */}
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Panel title="Daily revenue — last 30 days">
            {!revenue.data ? (
              <Loading />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenue.data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d: string) => d.slice(5)}
                      tick={{ fontSize: 11 }}
                      stroke="var(--muted-foreground)"
                      interval={4}
                    />
                    <YAxis
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                      tick={{ fontSize: 11 }}
                      stroke="var(--muted-foreground)"
                      width={44}
                    />
                    <Tooltip
                      formatter={(v) => [INR(Number(v)), "Revenue"]}
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--forest)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <Panel title="Revenue by service">
            {!byService.data ? (
              <Loading />
            ) : (
              <>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byService.data}
                        dataKey="revenue"
                        nameKey="service"
                        innerRadius="58%"
                        outerRadius="86%"
                        paddingAngle={2}
                        stroke="none"
                      >
                        {byService.data.map((s, i) => (
                          <Cell key={s.service} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, n) => [INR(Number(v)), String(n)]}
                        contentStyle={{
                          borderRadius: 14,
                          border: "1px solid var(--border)",
                          background: "var(--card)",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {byService.data.map((s, i) => (
                    <li key={s.service} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-foreground/70">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: SERVICE_COLORS[i % SERVICE_COLORS.length] }}
                        />
                        {s.service}
                      </span>
                      <span className="tabular-nums font-medium">{INR(s.revenue)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        </div>

        {/* 3 + 4 — Doctor performance & inventory */}
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Panel title="Doctor performance">
            {!doctorsPerf.data ? (
              <Loading />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-xs uppercase text-foreground/50">
                    <tr>
                      <th className="pb-3">Doctor</th>
                      <th className="pb-3 text-right">Patients</th>
                      <th className="pb-3 text-right">Revenue</th>
                      <th className="pb-3 text-right">Avg visit value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorsPerf.data.map((d) => (
                      <tr key={d.doctor_id} className="border-t border-border">
                        <td className="py-3 font-medium">{d.doctor_name}</td>
                        <td className="py-3 text-right tabular-nums text-foreground/70">{d.patients}</td>
                        <td className="py-3 text-right tabular-nums text-foreground/70">{INR(d.revenue)}</td>
                        <td className="py-3 text-right tabular-nums font-medium text-forest">
                          {INR(d.avg_visit_value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Inventory alerts">
            {!inventory.data ? (
              <Loading />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[1.25rem] bg-muted p-4">
                    <p className="flex items-center gap-2 text-xs uppercase text-foreground/55">
                      <PackageSearch className="size-4 text-clay" /> Low stock
                    </p>
                    <p className="mt-2 text-3xl font-bold text-forest">{inventory.data.low_stock_count}</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-muted p-4">
                    <p className="flex items-center gap-2 text-xs uppercase text-foreground/55">
                      <CalendarClock className="size-4 text-clay" /> Expiring 30d
                    </p>
                    <p className="mt-2 text-3xl font-bold text-forest">{inventory.data.expiring_30d_count}</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  {inventory.data.low_stock_items.slice(0, 3).map((i) => (
                    <li key={`low-${i.id}`} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-foreground/75">
                        <AlertTriangle className="size-3.5 text-destructive" />
                        {i.name}
                      </span>
                      <span className="tabular-nums text-xs text-foreground/60">
                        {i.stock} / {i.reorder_level}
                      </span>
                    </li>
                  ))}
                  {inventory.data.expiring_items.slice(0, 3).map((i) => (
                    <li key={`exp-${i.id}-${i.batch_no}`} className="flex items-center justify-between gap-3">
                      <span className="text-foreground/75">
                        {i.name} <span className="text-xs text-foreground/50">· {i.batch_no}</span>
                      </span>
                      <span className="tabular-nums text-xs text-clay">{i.expiry_date}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/app/inventory"
                  className="inline-flex rounded-full border border-border px-4 py-2 text-sm text-forest hover:bg-muted"
                >
                  Open inventory
                </Link>
              </div>
            )}
          </Panel>
        </div>

        {/* 5 + 6 — Payment mode split & heatmap */}
        <div className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
          <Panel title="Payment mode split">
            {!modes.data ? (
              <Loading />
            ) : (
              <>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={modes.data}
                        dataKey="amount"
                        nameKey="method"
                        outerRadius="86%"
                        stroke="none"
                        paddingAngle={1}
                      >
                        {modes.data.map((m) => (
                          <Cell key={m.method} fill={METHOD_COLORS[m.method] ?? "var(--forest)"} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, n) => [INR(Number(v)), String(n)]}
                        contentStyle={{
                          borderRadius: 14,
                          border: "1px solid var(--border)",
                          background: "var(--card)",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {modes.data.map((m) => (
                    <li key={m.method} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-foreground/70">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: METHOD_COLORS[m.method] ?? "var(--forest)" }}
                        />
                        {m.method}
                      </span>
                      <span className="tabular-nums text-xs">{m.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>

          <Panel title="Appointment heatmap — hour × day">
            {!heatmap.data ? <Loading /> : <Heatmap cells={heatmap.data} />}
          </Panel>
        </div>

        {/* 7 — Pending invoices */}
        <Panel title="Pending invoices — 10 oldest unpaid">
          {!pending.data ? (
            <Loading />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase text-foreground/50">
                  <tr>
                    <th className="pb-3">Invoice</th>
                    <th className="pb-3">Owner</th>
                    <th className="pb-3">Pet</th>
                    <th className="pb-3">Issued</th>
                    <th className="pb-3 text-right">Outstanding</th>
                    <th className="pb-3 text-right">Overdue</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.data.map((i) => (
                    <tr key={i.id} className="border-t border-border">
                      <td className="py-3 font-medium">{i.number}</td>
                      <td className="py-3 text-foreground/70">{i.owner_name}</td>
                      <td className="py-3 text-foreground/70">{i.pet_name ?? "—"}</td>
                      <td className="py-3 text-foreground/70">{i.issued_at.slice(0, 10)}</td>
                      <td className="py-3 text-right tabular-nums font-medium">{INR(i.outstanding)}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs tabular-nums ${
                            i.days_overdue > 0 ? "bg-destructive/10 text-destructive" : "bg-clay/15 text-clay"
                          }`}
                        >
                          {i.days_overdue > 0 ? `${i.days_overdue}d` : "Due"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to="/app/payments"
                          className="inline-flex rounded-full bg-forest px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                        >
                          Collect payment
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </StaffLayout>
  );
}

function Kpi({
  label,
  value,
  delta,
  invert,
}: {
  label: string;
  value: string | number;
  delta?: number;
  invert?: boolean;
}) {
  const up = (delta ?? 0) >= 0;
  const good = invert ? !up : up;
  return (
    <div className="rounded-[1.5rem] border border-border bg-card p-5">
      <p className="text-sm text-foreground/60">{label}</p>
      <p className="mt-2 text-2xl font-bold text-forest tabular-nums">{value}</p>
      {delta !== undefined && (
        <p className={`mt-1 flex items-center gap-1 text-xs ${good ? "text-forest" : "text-destructive"}`}>
          {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {Math.abs(delta)}% vs last period
        </p>
      )}
    </div>
  );
}

function Heatmap({ cells }: { cells: HeatmapCell[] }) {
  const hours = [...new Set(cells.map((c) => c.hour))].sort((a, b) => a - b);
  const max = Math.max(1, ...cells.map((c) => c.count));
  const lookup = new Map(cells.map((c) => [`${c.day_of_week}-${c.hour}`, c.count]));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[560px] border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="w-10" />
            {hours.map((h) => (
              <th key={h} className="font-normal text-foreground/50">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, di) => (
            <tr key={day}>
              <td className="pr-1 text-foreground/50">{day}</td>
              {hours.map((h) => {
                const count = lookup.get(`${di}-${h}`) ?? 0;
                const intensity = count / max;
                return (
                  <td key={h}>
                    <div
                      title={`${day} ${h}:00 — ${count} appointments`}
                      className="flex h-7 min-w-7 items-center justify-center rounded-md text-[10px] font-medium"
                      style={{
                        background: `color-mix(in oklab, var(--forest) ${Math.round(intensity * 90) + 6}%, var(--muted))`,
                        color: intensity > 0.55 ? "var(--primary-foreground)" : "var(--foreground)",
                      }}
                    >
                      {count}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-foreground/50">Live volume — refreshes every 15 seconds.</p>
    </div>
  );
}
