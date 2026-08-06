import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PawPrint } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { homeRouteFor } from "@/lib/auth/permissions";
import { ROLES, type Role } from "@/lib/api/types";
import { roleLabels } from "@/lib/auth/permissions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In | Pet Good Veterinary" },
      { name: "description", content: "Sign in to the Pet Good pet owner portal or staff console." },
      { property: "og:title", content: "Sign In | Pet Good Veterinary" },
      { property: "og:description", content: "Access your pet records, appointments and invoices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("owner@example.com");
  const [password, setPassword] = useState("password");
  const [role, setRole] = useState<Role | "">("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await authStore.login(email, password, role || undefined);
      navigate({ to: homeRouteFor(user.role), replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
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
        <h1 className="mt-6 text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-foreground/70">Sign in to your portal or staff console.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full rounded-full border border-border bg-background px-5 py-3 text-[15px] outline-none focus:border-forest"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-full border border-border bg-background px-5 py-3 text-[15px] outline-none focus:border-forest"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role | "")}
            className="w-full rounded-full border border-border bg-background px-5 py-3 text-[15px] outline-none focus:border-forest"
          >
            <option value="">Detect role from email (demo)</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabels[r]}
              </option>
            ))}
          </select>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-forest px-8 py-3.5 font-medium text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-sm text-foreground/70">
          No account?{" "}
          <Link to="/signup" className="font-medium text-clay">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
