import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PawPrint } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { homeRouteFor } from "@/lib/auth/permissions";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account | Pet Good Veterinary" },
      { name: "description", content: "Create a Pet Good account to manage your pets, appointments and invoices." },
      { property: "og:title", content: "Create Account | Pet Good Veterinary" },
      { property: "og:description", content: "Join Pet Good and manage your pet's care online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await authStore.signup({ ...form, role: "PET_OWNER" });
      navigate({ to: homeRouteFor(user.role), replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sage px-5 py-12">
      <div className="w-full max-w-md rounded-[2rem] bg-card p-8">
        <Link to="/" className="flex items-center text-2xl font-bold text-forest">
          Pet G<PawPrint className="inline size-5 -rotate-12 text-clay" />
          od
        </Link>
        <h1 className="mt-6 text-3xl">Create your account</h1>
        <p className="mt-2 text-sm text-foreground/70">Pet owner accounts get instant portal access.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input
            required
            value={form.name}
            onChange={set("name")}
            placeholder="Full name"
            className="w-full rounded-full border border-border bg-background px-5 py-3 text-[15px] outline-none focus:border-forest"
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="Email address"
            className="w-full rounded-full border border-border bg-background px-5 py-3 text-[15px] outline-none focus:border-forest"
          />
          <input
            required
            type="password"
            value={form.password}
            onChange={set("password")}
            placeholder="Password (min 4 characters)"
            className="w-full rounded-full border border-border bg-background px-5 py-3 text-[15px] outline-none focus:border-forest"
          />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-forest px-8 py-3.5 font-medium text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-foreground/70">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-clay">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
