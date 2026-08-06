import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { Panel } from "@/components/app/ui";
import { PetForm } from "@/components/app/kit/PetForm";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { PetOwner } from "@/lib/api/types";

export const Route = createFileRoute("/app/owners/new")({
  head: () => ({
    meta: [
      { title: "Add Owner | Pet Good Console" },
      { name: "description", content: "Register a new pet owner with phone-first duplicate checking." },
      { property: "og:title", content: "Add Owner | Pet Good Console" },
      { property: "og:description", content: "Phone-first owner registration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewOwnerPage,
});

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

type LookupResult = { owner: PetOwner | null; created: boolean };

function NewOwnerPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [checking, setChecking] = useState(false);
  const [match, setMatch] = useState<PetOwner | null>(null);
  const [checked, setChecked] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Live phone lookup — debounced, never creates.
  useEffect(() => {
    const digits = phone.replace(/\D/g, "");
    setMatch(null);
    setChecked(false);
    if (digits.length < 6) return;
    let active = true;
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const res = await apiClient.post<LookupResult>(endpoints.petOwners.lookupOrCreate, {
          phone,
          lookup_only: true,
        });
        if (!active) return;
        setMatch(res.owner);
        setChecked(true);
      } catch {
        if (active) setChecked(false);
      } finally {
        if (active) setChecking(false);
      }
    }, 450);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [phone]);

  async function createOwner() {
    setError(null);
    setSaving(true);
    try {
      const res = await apiClient.post<LookupResult>(endpoints.petOwners.lookupOrCreate, { phone, ...form });
      if (res.owner) navigate({ to: "/app/owners/$id", params: { id: res.owner.id } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save the owner.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StaffLayout title="Add Owner" subtitle="Phone number is checked first to avoid duplicates" permission="owners:write">
      <Link to="/app/owners" className="mb-4 inline-flex items-center gap-1.5 text-sm text-forest">
        <ArrowLeft className="size-4" /> Back to owners
      </Link>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Step 1 — Phone number">
          <label className="mb-1.5 block text-xs font-medium text-foreground/60">Mobile number</label>
          <input
            autoFocus
            className={field}
            placeholder="e.g. (310) 555-0142"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="mt-2 flex items-center gap-2 text-xs text-foreground/60">
            {checking ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Checking for an existing owner…
              </>
            ) : match ? (
              <span className="text-clay">An owner already uses this number.</span>
            ) : checked ? (
              <span className="text-forest">No match — this will create a new owner.</span>
            ) : (
              "Enter at least 6 digits to run the duplicate check."
            )}
          </p>
        </Panel>

        {match ? (
          <Panel title="Existing owner found">
            <div className="flex items-start gap-3 rounded-2xl border border-forest/30 bg-forest/5 p-4">
              <CheckCircle2 className="mt-0.5 size-5 text-forest" />
              <div className="text-sm">
                <p className="font-medium">{match.name}</p>
                <p className="text-foreground/70">{match.phone}</p>
                <p className="text-foreground/70">{match.email || "No email on file"}</p>
                <p className="text-foreground/60">{match.pets_count} pet(s) registered</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-foreground/70">
              We won&apos;t create a duplicate. Confirm this owner and add a pet to their profile instead.
            </p>
            <div className="mt-4">
              <PetForm
                ownerId={match.id}
                onSaved={() => navigate({ to: "/app/owners/$id", params: { id: match.id } })}
                submitLabel="Confirm owner & add pet"
              />
            </div>
            <Link
              to="/app/owners/$id"
              params={{ id: match.id }}
              className="mt-3 inline-block text-sm text-forest underline underline-offset-4"
            >
              Open owner profile instead
            </Link>
          </Panel>
        ) : (
          <Panel title="Step 2 — Owner details">
            <div className="space-y-3">
              <input
                className={field}
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className={field}
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <textarea
                className={field}
                rows={3}
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <button
                type="button"
                disabled={saving || !checked || !form.name.trim()}
                onClick={createOwner}
                className="rounded-full bg-forest px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-50"
              >
                {saving ? "Saving…" : "Create owner"}
              </button>
            </div>
          </Panel>
        )}
      </div>
    </StaffLayout>
  );
}
