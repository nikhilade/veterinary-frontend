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

const blank = {
  name: "",
  city: "",
  gstin: "",
  owner_name: "",
  owner_email: "",
  phone: "",
  branch_name: "",
  branch_address: "",
  latitude: "",
  longitude: "",
  plan_id: "plan_growth",
  billing_cycle: "MONTHLY" as "MONTHLY" | "YEARLY",
};

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(blank);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient
      .get<SubscriptionPlan[]>(endpoints.subscriptions.plans)
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  const set = (k: keyof typeof blank, v: string) => setForm((s) => ({ ...s, [k]: v }));

  function validate(current: number) {
    if (current === 0 && !form.name.trim()) return "Hospital name is required.";
    if (current === 1 && (!form.owner_name.trim() || !form.owner_email.trim()))
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
      const res = await apiClient.post<{ tenant: Tenant; trial_days: number }>(endpoints.tenants.provision, {
        ...form,
        latitude: form.latitude === "" ? null : Number(form.latitude),
        longitude: form.longitude === "" ? null : Number(form.longitude),
      });
      setCreated(res.tenant);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Provisioning failed. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <StaffLayout title="Onboard a Hospital" subtitle="Provisioning complete" permission="tenants:manage">
        <Panel>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <PartyPopper className="size-8 text-clay" />
            <h2 className="text-xl text-forest">{created.name} is live</h2>
            <p className="max-w-md text-sm text-foreground/60">
              A 14-day trial has started on the {created.plan_name} plan, and the first branch has been created. The
              owner can sign in with {created.owner_email}.
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
                  setForm(blank);
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
                <input className={field} value={form.name} onChange={(e) => set("name", e.target.value)} />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">City</span>
                <input className={field} value={form.city} onChange={(e) => set("city", e.target.value)} />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">GSTIN (optional)</span>
                <input className={field} value={form.gstin} onChange={(e) => set("gstin", e.target.value)} />
              </label>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Owner name</span>
                <input className={field} value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Owner email</span>
                <input
                  className={field}
                  type="email"
                  value={form.owner_email}
                  onChange={(e) => set("owner_email", e.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Phone</span>
                <input className={field} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </label>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Branch name</span>
                <input
                  className={field}
                  value={form.branch_name}
                  onChange={(e) => set("branch_name", e.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Address</span>
                <input
                  className={field}
                  value={form.branch_address}
                  onChange={(e) => set("branch_address", e.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Latitude</span>
                <input
                  className={field}
                  inputMode="decimal"
                  value={form.latitude}
                  onChange={(e) => set("latitude", e.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Longitude</span>
                <input
                  className={field}
                  inputMode="decimal"
                  value={form.longitude}
                  onChange={(e) => set("longitude", e.target.value)}
                />
              </label>
            </>
          ) : null}

          {step === 3 ? (
            <div className="sm:col-span-2 space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => set("plan_id", p.id)}
                    className={`rounded-[1.5rem] border p-5 text-left ${form.plan_id === p.id ? "border-forest bg-forest/5" : "border-border"}`}
                  >
                    <p className="font-medium text-forest">{p.name}</p>
                    <p className="mt-1 text-2xl font-bold text-forest">₹{p.price_monthly.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-foreground/60">per month</p>
                    <p className="mt-2 text-xs text-foreground/60">{p.tagline}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {(["MONTHLY", "YEARLY"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((s) => ({ ...s, billing_cycle: c }))}
                    className={`rounded-full border px-4 py-2 text-sm ${form.billing_cycle === c ? "border-forest bg-forest text-primary-foreground" : "border-border text-foreground/70"}`}
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
                ["Owner", `${form.owner_name} · ${form.owner_email}`],
                ["Phone", form.phone || "—"],
                ["First branch", `${form.branch_name}${form.branch_address ? ` · ${form.branch_address}` : ""}`],
                ["GPS", form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : "Not set"],
                ["Plan", `${plans.find((p) => p.id === form.plan_id)?.name ?? form.plan_id} · ${form.billing_cycle}`],
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
