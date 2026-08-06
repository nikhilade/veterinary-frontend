import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2, Search } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel, StatCard, formatDate } from "@/components/app/ui";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { SUBSCRIPTION_STATUSES, type SubscriptionStatus, type Tenant } from "@/lib/api/tenancy-types";

export const Route = createFileRoute("/app/tenants")({
  head: () => ({
    meta: [
      { title: "Hospitals | Pet Good Console" },
      { name: "description", content: "Super admin view of every hospital tenant and its subscription status." },
      { property: "og:title", content: "Hospitals | Pet Good Console" },
      { property: "og:description", content: "Tenant directory with subscription lifecycle badges." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TenantsPage,
});

const statusTone: Record<SubscriptionStatus, string> = {
  TRIAL: "bg-clay/15 text-clay",
  ACTIVE: "bg-forest/10 text-forest",
  GRACE: "bg-amber-500/15 text-amber-700",
  EXPIRED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-foreground/60",
};

export function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusTone[status]}`}>{status}</span>
  );
}

function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [status, setStatus] = useState<"ALL" | SubscriptionStatus>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setTenants(null);
    apiClient
      .get<Tenant[]>(endpoints.tenants.list, { status, search })
      .then(setTenants)
      .catch(() => setTenants([]));
  }, [status, search]);

  const totals = useMemo(() => {
    const list = tenants ?? [];
    return {
      count: list.length,
      active: list.filter((t) => t.subscription_status === "ACTIVE").length,
      trial: list.filter((t) => t.subscription_status === "TRIAL").length,
      mrr: list.reduce((s, t) => s + t.mrr, 0),
    };
  }, [tenants]);

  return (
    <StaffLayout title="Hospitals" subtitle="All tenants on the platform" permission="tenants:manage">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Hospitals" value={totals.count} />
        <StatCard label="Active subscriptions" value={totals.active} />
        <StatCard label="On trial" value={totals.trial} />
        <StatCard label="MRR" value={`₹${totals.mrr.toLocaleString("en-IN")}`} />
      </div>

      <div className="mt-6">
        <Panel title="Tenant directory">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search hospital, city or owner"
                className="w-full rounded-full border border-border bg-background py-2.5 pl-11 pr-4 text-sm outline-none focus:border-forest"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["ALL", ...SUBSCRIPTION_STATUSES] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs ${status === s ? "border-forest bg-forest text-primary-foreground" : "border-border text-foreground/70"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {tenants === null ? (
            <Loading />
          ) : tenants.length === 0 ? (
            <EmptyState icon={<Building2 className="size-6" />} message="No hospitals match this filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="text-xs uppercase text-foreground/50">
                  <tr>
                    <th className="pb-3 pr-4">Hospital</th>
                    <th className="pb-3 pr-4">Owner</th>
                    <th className="pb-3 pr-4">Plan</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Branches</th>
                    <th className="pb-3 pr-4">Staff</th>
                    <th className="pb-3 pr-4">Renews / trial ends</th>
                    <th className="pb-3 text-right">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-forest">{t.name}</p>
                        <p className="text-xs text-foreground/60">{t.city}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p>{t.owner_name}</p>
                        <p className="text-xs text-foreground/60">{t.owner_email}</p>
                      </td>
                      <td className="py-3 pr-4">{t.plan_name}</td>
                      <td className="py-3 pr-4">
                        <SubscriptionBadge status={t.subscription_status} />
                      </td>
                      <td className="py-3 pr-4">{t.branches_count}</td>
                      <td className="py-3 pr-4">{t.staff_count}</td>
                      <td className="py-3 pr-4 text-xs text-foreground/70">
                        {t.trial_ends_at
                          ? `Trial ends ${formatDate(t.trial_ends_at)}`
                          : t.renews_at
                            ? formatDate(t.renews_at)
                            : "—"}
                      </td>
                      <td className="py-3 text-right">₹{t.mrr.toLocaleString("en-IN")}</td>
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
