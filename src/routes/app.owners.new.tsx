import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { Panel } from "@/components/app/ui";
import { PetForm } from "@/components/app/kit/PetForm";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { PetOwner } from "@/lib/api/types";
import { toast } from "sonner";

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

function NewOwnerPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [checking, setChecking] = useState(false);
  const [match, setMatch] = useState<PetOwner | null>(null);
  const [checked, setChecked] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", address: "" });
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
        // Use the search endpoint to check for duplicates by phone number
        const res = await apiClient.get<PetOwner[]>(
          endpoints.petOwners.search,
          { q: phone }
        );
        if (!active) return;
        // Strictly find exact match to avoid fuzzy search false-positives
        const exactMatch = (res || []).find(o => o.phoneNumber === phone);
        setMatch(exactMatch || null);
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
        // Use the standard POST /pet-owners to create the new owner with a JSON body
      const res = await apiClient.post<PetOwner>(
        endpoints.petOwners.create,
        { phoneNumber: phone, ...form }
      );
      if (res && res.id) {
        toast.success("Owner created successfully!");
        navigate({ to: "/app/owners/$id", params: { id: res.id } });
      } else {
        throw new Error("Invalid response from server.");
      }
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
                <p className="font-medium">{`${match.firstName} ${match.lastName}`}</p>
                <p className="text-foreground/70">{match.phoneNumber}</p>
                <p className="text-foreground/70">{match.email || "No email on file"}</p>
                <p className="text-foreground/60">{match.pets?.length || match.petsCount || 0} pet(s) registered</p>
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
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className={field}
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
                <input
                  className={field}
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
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
                disabled={saving || !checked || !form.firstName.trim()}
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
