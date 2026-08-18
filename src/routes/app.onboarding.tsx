import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, PartyPopper } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { Panel } from "@/components/app/ui";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { SubscriptionPlan, Tenant } from "@/lib/api/tenancy-types";

export const Route = createFileRoute("/app/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboard a Hospital | Pet Good Console" },
      { name: "description", content: "Multi-step wizard to provision a new veterinary hospital tenant." },
      { property: "og:title", content: "Onboard a Hospital | Pet Good Console" },
      { property: "og:description", content: "Provision hospital, first branch and subscription plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

const steps = ["Hospital", "Owner", "First branch", "Plan", "Review"];

const fallbackPlans: SubscriptionPlan[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Starter",
    tagline: "For single-doctor clinics getting started",
    price_monthly: 999,
    price_yearly: 9999,
    branch_limit: 1,
    staff_limit: 5,
    features: ["Appointments", "Billing"],
    popular: false,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Pro",
    tagline: "For growing multi-doctor veterinary practices",
    price_monthly: 2999,
    price_yearly: 29999,
    branch_limit: 5,
    staff_limit: 25,
    features: ["Appointments", "Billing", "Analytics"],
    popular: true,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Enterprise",
    tagline: "For multi-branch hospitals with advanced needs",
    price_monthly: 9999,
    price_yearly: 99999,
    branch_limit: 999,
    staff_limit: 999,
    features: ["Appointments", "Billing", "Analytics", "Multi-branch"],
    popular: false,
  },
];

const blank = {
  name: "",
  city: "",
  gstin: "",
  ownerName: "",
  owner_email: "",
  phone: "",
  branch_name: "",
  branch_address: "",
  latitude: "",
  longitude: "",
  plan_id: "",
  billing_cycle: "MONTHLY" as "MONTHLY" | "YEARLY",
};

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(blank);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(fallbackPlans);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient
      .get<any[]>(endpoints.subscriptions.plans)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: SubscriptionPlan[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            tagline:
              p.tagline ||
              (p.name === "Starter"
                ? "For single-doctor clinics getting started"
                : p.name === "Pro"
                  ? "For growing multi-doctor veterinary practices"
                  : "For multi-branch hospitals with advanced needs"),
            price_monthly: Number(p.price_monthly ?? p.priceMonthly ?? 999),
            price_yearly: Number(p.price_yearly ?? p.priceAnnual ?? 9999),
            branch_limit: p.branch_limit ?? p.maxBranches ?? 1,
            staff_limit: p.staff_limit ?? p.maxUsers ?? 5,
            features: Array.isArray(p.features) ? p.features : ["Appointments", "Billing"],
            popular: p.name === "Pro" || p.popular === true,
          }));
          setPlans(mapped);
          setForm((s) => ({
            ...s,
            plan_id: s.plan_id ? s.plan_id : (mapped[0]?.id ?? ""),
          }));
        } else {
          setForm((s) => ({
            ...s,
            plan_id: s.plan_id ? s.plan_id : fallbackPlans[0].id,
          }));
        }
      })
      .catch(() => {
        setPlans(fallbackPlans);
        setForm((s) => ({
          ...s,
          plan_id: s.plan_id ? s.plan_id : fallbackPlans[0].id,
        }));
      });
  }, []);

  const set = (k: keyof typeof blank, v: string) => setForm((s) => ({ ...s, [k]: v }));

  function validate(current: number) {
    if (current === 0 && !form.name.trim()) return "Hospital name is required.";
    if (current === 1 && (!form.ownerName.trim() || !form.owner_email.trim()))
      return "Owner name and email are required.";
    if (current === 2 && !form.branch_name.trim()) return "First branch name is required.";
    return "";
  }

  function next() {
    const msg = validate(step);
    if (msg) return setError(msg);
    setError("");
    setStep((s) => Math.min(steps.length - 1, s + 1));
  }

  async function submit() {
    setSaving(true);
    setError("");
    try {
      const selectedPlanId = form.plan_id || plans[0]?.id;
      const res = await apiClient.post<any>(endpoints.tenants.provision, {
        ...form,
        plan_id: selectedPlanId,
        latitude: form.latitude === "" ? null : Number(form.latitude),
        longitude: form.longitude === "" ? null : Number(form.longitude),
      });

      const tenantData: Tenant = res?.tenant || res;
      setCreated(tenantData);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Provisioning failed. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    const hospitalName = created.name || (created as any).hospitalName || form.name;
    const planName =
      created.plan_name ||
      (created as any).planName ||
      plans.find((p) => p.id === form.plan_id)?.name ||
      "Starter";
    const ownerEmail = created.owner_email || (created as any).ownerEmail || form.owner_email;

    return (
      <StaffLayout title="Onboard a Hospital" subtitle="Provisioning complete" permission="tenants:manage">
        <Panel>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <PartyPopper className="size-8 text-clay" />
            <h2 className="text-xl text-forest">{hospitalName} is live</h2>
            <p className="max-w-md text-sm text-foreground/60">
              A 14-day trial has started on the {planName} plan, and the first branch has been created. The
              owner can sign in with {ownerEmail}.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate({ to: "/app/tenants" })}
                className="rounded-full bg-forest px-6 py-2.5 text-sm text-primary-foreground"
              >
                View all hospitals
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreated(null);
                  setForm({ ...blank, plan_id: plans[0]?.id ?? "" });
                  setStep(0);
                }}
                className="rounded-full border border-border px-6 py-2.5 text-sm text-forest"
              >
                Onboard another
              </button>
            </div>
          </div>
        </Panel>
      </StaffLayout>
    );
  }

  const currentPlan = plans.find((p) => p.id === form.plan_id) ?? plans[0];

  return (
    <StaffLayout title="Onboard a Hospital" subtitle="Provision a new tenant" permission="tenants:manage">
      <Panel>
        <ol className="mb-6 flex flex-wrap gap-2">
          {steps.map((label, i) => (
            <li
              key={label}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs ${
                i === step
                  ? "bg-forest text-primary-foreground"
                  : i < step
                    ? "bg-forest/10 text-forest"
                    : "bg-muted text-foreground/60"
              }`}
            >
              {i < step ? <Check className="size-3.5" /> : <span>{i + 1}</span>}
              {label}
            </li>
          ))}
        </ol>

        <div className="grid gap-3 sm:grid-cols-2">
          {step === 0 ? (
            <>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Hospital name</span>
                <input className={field} placeholder="e.g. Apollo Pet Hospital" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">City</span>
                <input className={field} placeholder="e.g. Mumbai" value={form.city} onChange={(e) => set("city", e.target.value)} />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">GSTIN (optional)</span>
                <input className={field} placeholder="e.g. 27AAAAA0000A1Z5" value={form.gstin} onChange={(e) => set("gstin", e.target.value)} />
              </label>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Owner name</span>
                <input className={field} placeholder="e.g. Dr. Sarah Jenkins" value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Owner email</span>
                <input
                  className={field}
                  type="email"
                  placeholder="e.g. sarah@example.com"
                  value={form.owner_email}
                  onChange={(e) => set("owner_email", e.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Phone</span>
                <input className={field} placeholder="e.g. +91 98765 43210" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </label>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Branch name</span>
                <input
                  className={field}
                  placeholder="e.g. Main Clinic - Bandra"
                  value={form.branch_name}
                  onChange={(e) => set("branch_name", e.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Address</span>
                <input
                  className={field}
                  placeholder="e.g. 42 Hill Road, Bandra West"
                  value={form.branch_address}
                  onChange={(e) => set("branch_address", e.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Latitude (optional)</span>
                <input
                  className={field}
                  inputMode="decimal"
                  placeholder="e.g. 19.0596"
                  value={form.latitude}
                  onChange={(e) => set("latitude", e.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Longitude (optional)</span>
                <input
                  className={field}
                  inputMode="decimal"
                  placeholder="e.g. 72.8295"
                  value={form.longitude}
                  onChange={(e) => set("longitude", e.target.value)}
                />
              </label>
            </>
          ) : null}

          {step === 3 ? (
            <div className="sm:col-span-2 space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                {plans.map((p) => {
                  const price = (p.price_monthly ?? (p as any).priceMonthly ?? 0).toLocaleString("en-IN");
                  const isSelected = (form.plan_id || plans[0]?.id) === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => set("plan_id", p.id)}
                      className={`rounded-[1.5rem] border p-5 text-left transition-all ${
                        isSelected ? "border-forest bg-forest/5 shadow-sm" : "border-border hover:border-forest/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-forest">{p.name}</p>
                        {p.popular ? (
                          <span className="rounded-full bg-clay/15 px-2.5 py-0.5 text-[10px] font-semibold text-clay uppercase tracking-wider">
                            Popular
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-2xl font-bold text-forest">₹{price}</p>
                      <p className="text-xs text-foreground/60">per month</p>
                      <p className="mt-2 text-xs text-foreground/70">{p.tagline}</p>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                {(["MONTHLY", "YEARLY"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((s) => ({ ...s, billing_cycle: c }))}
                    className={`rounded-full border px-4 py-2 text-sm transition-all ${
                      form.billing_cycle === c
                        ? "border-forest bg-forest text-primary-foreground font-medium"
                        : "border-border text-foreground/70 hover:bg-muted"
                    }`}
                  >
                    {c === "MONTHLY" ? "Monthly" : "Yearly (2 months free)"}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <dl className="sm:col-span-2 grid gap-3 rounded-[1.25rem] bg-muted p-5 text-sm sm:grid-cols-2">
              {[
                ["Hospital", form.name],
                ["City", form.city || "—"],
                ["Owner", `${form.ownerName} · ${form.owner_email}`],
                ["Phone", form.phone || "—"],
                ["First branch", `${form.branch_name}${form.branch_address ? ` · ${form.branch_address}` : ""}`],
                ["GPS", form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : "Not set"],
                ["Plan", `${currentPlan?.name ?? "Starter"} · ${form.billing_cycle}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase text-foreground/50">{k}</dt>
                  <dd className="mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-forest disabled:opacity-40"
          >
            <ChevronLeft className="size-4" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm text-primary-foreground"
            >
              Continue <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="rounded-full bg-forest px-6 py-2.5 text-sm text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Provisioning…" : "Provision hospital"}
            </button>
          )}
        </div>
      </Panel>
    </StaffLayout>
  );
}

