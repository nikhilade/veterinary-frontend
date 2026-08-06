import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, PawPrint } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/store";
import type { SubscriptionPlan } from "@/lib/api/tenancy-types";
import { Loading } from "@/components/app/ui";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing Plans for Veterinary Hospitals | Pet Good" },
      {
        name: "description",
        content:
          "Simple monthly and yearly pricing for veterinary hospitals — appointments, billing, pharmacy and analytics from ₹2,999 a month.",
      },
      { property: "og:title", content: "Pricing Plans for Veterinary Hospitals | Pet Good" },
      {
        property: "og:description",
        content: "Compare Starter, Growth and Enterprise plans for your veterinary hospital.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const { isAuthenticated, role } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [cycle, setCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canUpgrade = isAuthenticated && (role === "HOSPITAL_ADMIN" || role === "SUPER_ADMIN");

  useEffect(() => {
    apiClient
      .get<SubscriptionPlan[]>(endpoints.subscriptions.plans)
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  async function upgrade(plan: SubscriptionPlan) {
    setBusy(plan.id);
    setError("");
    setMessage("");
    try {
      const res = await apiClient.post<{ invoice_amount: number }>(endpoints.subscriptions.upgrade(plan.id), {
        tenant_id: "ten_1",
        billing_cycle: cycle,
      });
      setMessage(
        `You're on the ${plan.name} plan. ₹${res.invoice_amount.toLocaleString("en-IN")} has been billed for this ${
          cycle === "YEARLY" ? "year" : "month"
        }.`,
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upgrade failed. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-sand">
      <header className="flex items-center justify-between px-5 py-5 lg:px-12">
        <Link to="/" className="flex items-center text-xl font-bold text-forest">
          Pet G<PawPrint className="inline size-4 -rotate-12 text-clay" />
          od
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {isAuthenticated ? (
            <Link to="/app/dashboard" className="rounded-full bg-forest px-5 py-2.5 text-primary-foreground">
              Go to console
            </Link>
          ) : (
            <>
              <Link to="/login" className="rounded-full border border-border px-5 py-2.5 text-forest">
                Log in
              </Link>
              <Link to="/signup" className="rounded-full bg-forest px-5 py-2.5 text-primary-foreground">
                Start free trial
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-6 lg:px-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-forest lg:text-5xl">Pricing that grows with your practice</h1>
          <p className="mx-auto mt-4 max-w-xl text-foreground/70">
            Every plan includes appointments, consultations and GST-ready invoicing. Start with a 14-day trial — no card
            needed.
          </p>
          <div className="mt-8 inline-flex rounded-full border border-border bg-card p-1">
            {(["MONTHLY", "YEARLY"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCycle(c)}
                className={`rounded-full px-5 py-2 text-sm ${cycle === c ? "bg-forest text-primary-foreground" : "text-foreground/70"}`}
              >
                {c === "MONTHLY" ? "Monthly" : "Yearly · 2 months free"}
              </button>
            ))}
          </div>
        </div>

        {message ? (
          <p className="mx-auto mt-8 max-w-xl rounded-2xl bg-forest/10 px-5 py-3 text-center text-sm text-forest">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mx-auto mt-8 max-w-xl rounded-2xl bg-destructive/10 px-5 py-3 text-center text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {plans === null ? (
          <Loading />
        ) : (
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <section
                key={p.id}
                className={`flex flex-col rounded-[1.75rem] border bg-card p-7 ${p.popular ? "border-forest shadow-lg" : "border-border"}`}
              >
                {p.popular ? (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-clay/15 px-3 py-1 text-xs font-medium text-clay">
                    Most popular
                  </span>
                ) : null}
                <h2 className="text-2xl text-forest">{p.name}</h2>
                <p className="mt-1 text-sm text-foreground/60">{p.tagline}</p>
                <p className="mt-6 text-4xl font-bold text-forest">
                  ₹{(cycle === "YEARLY" ? p.price_yearly : p.price_monthly).toLocaleString("en-IN")}
                  <span className="text-base font-normal text-foreground/60">
                    /{cycle === "YEARLY" ? "year" : "month"}
                  </span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-forest" />
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>
                {canUpgrade ? (
                  <button
                    type="button"
                    onClick={() => upgrade(p)}
                    disabled={busy !== null}
                    className="mt-7 rounded-full bg-forest px-6 py-3 text-sm text-primary-foreground disabled:opacity-60"
                  >
                    {busy === p.id ? "Upgrading…" : `Upgrade to ${p.name}`}
                  </button>
                ) : (
                  <Link
                    to="/signup"
                    className="mt-7 rounded-full bg-forest px-6 py-3 text-center text-sm text-primary-foreground"
                  >
                    Start 14-day trial
                  </Link>
                )}
              </section>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-sm text-foreground/60">
          Already running a hospital with us?{" "}
          <Link to="/login" className="text-forest underline">
            Log in
          </Link>{" "}
          as a Hospital Admin to upgrade instantly.
        </p>
      </main>
    </div>
  );
}
