import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2, Search } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel, StatCard, formatDate, InitialsAvatar } from "@/components/app/ui";
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

export function SubscriptionBadge({ status }: { status?: SubscriptionStatus | string }) {
  const normalizedStatus = (status?.toUpperCase() ?? "TRIAL") as SubscriptionStatus;
  const tone = statusTone[normalizedStatus] || "bg-muted text-foreground/60";
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone}`}>{normalizedStatus}</span>
  );
}

function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [status, setStatus] = useState<"ALL" | SubscriptionStatus>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setTenants(null);
    apiClient
      .get<any[]>(endpoints.tenants.list, { status, search })
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped: Tenant[] = data.map((t: any) => ({
            id: t.id,
            name: t.name || t.hospitalName || "Hospital",
            slug: t.slug || "",
            city: t.city || "—",
            ownerName: t.ownerName || "—",
            owner_email: t.owner_email || t.ownerEmail || "—",
            phone: t.phone || "—",
            plan_id: t.plan_id || t.planId || "",
            plan_name: t.plan_name || t.planName || "Starter",
            subscription_status: (t.subscription_status || t.status || "TRIAL") as SubscriptionStatus,
            branches_count: t.branches_count ?? t.branchesCount ?? 1,
            staff_count: t.staff_count ?? t.staffCount ?? 1,
            trial_ends_at: t.trial_ends_at || t.trialEndsAt || null,
            renews_at: t.renews_at || t.renewsAt || null,
            mrr: Number(t.mrr ?? 0),
            createdAt: t.createdAt || t.created_at || "",
            hospitalStatus: t.hospitalStatus || "ACTIVE",
          }));
          setTenants(mapped);
        } else {
          setTenants([]);
        }
      })
      .catch(() => setTenants([]));
  }, [status, search]);

  const totals = useMemo(() => {
    const list = tenants ?? [];
    return {
      count: list.length,
      active: list.filter((t) => (t.subscription_status || (t as any).status) === "ACTIVE").length,
      trial: list.filter((t) => (t.subscription_status || (t as any).status) === "TRIAL").length,
      mrr: list.reduce((s, t) => s + (t.mrr || 0), 0),
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tenants.map((t) => (
                <div key={t.id} className="flex flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-5 transition-shadow hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={t.name} className="size-12 text-lg" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-forest">{t.name}</p>
                          {t.hospitalStatus === 'PENDING' && (
                            <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground/60">{t.city}</p>
                      </div>
                    </div>
                    <SubscriptionBadge status={t.subscription_status} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-muted p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">Plan</p>
                      <p className="mt-0.5 font-medium truncate">{t.plan_name}</p>
                    </div>
                    <div className="rounded-xl bg-muted p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">MRR</p>
                      <p className="mt-0.5 font-medium truncate">₹{(t.mrr || 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 rounded-xl border border-border/50 p-3 text-xs text-foreground/70">
                    <div className="flex items-center justify-between">
                      <span>Owner</span>
                      <span className="font-medium text-foreground truncate max-w-[120px]">{t.ownerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Email</span>
                      <span className="font-medium text-foreground truncate max-w-[120px]">{t.owner_email}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between border-t border-border/50 pt-2">
                      <span>Staff</span>
                      <span className="font-medium text-foreground">{t.staff_count} member(s)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </StaffLayout>
  );
}

