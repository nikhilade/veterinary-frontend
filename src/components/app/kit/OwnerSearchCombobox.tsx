import { useEffect, useRef, useState } from "react";
import { Search, UserPlus, Check, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { PetOwner } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

export interface OwnerSearchComboboxProps {
  value?: PetOwner | null;
  onChange?: (owner: PetOwner | null) => void;
  label?: string;
  placeholder?: string;
}

/**
 * Searchable owner combobox. Phone is the primary search key (owners are
 * deduped by phone). Falls back to a quick-create form when nothing matches.
 */
export function OwnerSearchCombobox({
  value = null,
  onChange,
  label = "Pet owner",
  placeholder = "Search by phone, name or email",
}: OwnerSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PetOwner[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ firstName: "", lastName: "", phoneNumber: "", email: "", address: "" });
  const [error, setError] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    const t = setTimeout(() => {
      apiClient
        .get<PetOwner[]>(endpoints.petOwners.search, { query: query })
        .then((r) => active && setResults(r))
        .catch(() => active && setResults([]))
        .finally(() => active && setLoading(false));
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function createOwner() {
    setError("");
    if (!draft.firstName.trim() || draft.phoneNumber.replace(/\D/g, "").length < 6) {
      setError("First name and a valid phone number are required.");
      return;
    }
    try {
      const owner = await apiClient.post<PetOwner>(
        endpoints.petOwners.lookupOrCreate,
        undefined,
        undefined,
        { phoneNumber: draft.phoneNumber, firstName: draft.firstName }
      );
      onChange?.(owner);
      setCreating(false);
      setOpen(false);
      setDraft({ firstName: "", lastName: "", phoneNumber: "", email: "", address: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the owner.");
    }
  }

  return (
    <div ref={box} className="relative">
      <label className="mb-1.5 block text-xs font-medium text-foreground/60">{label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
        <input
          className={cn(field, "pl-10")}
          placeholder={placeholder}
          value={open ? query : (value ? `${value.firstName || ""} ${value.lastName || ""}`.trim() : "")}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
      </div>
      {value && !open ? (
        <p className="mt-1.5 text-xs text-foreground/60">
          {value.phoneNumber} · {value.pets?.length || value.petsCount || 0} pet{(value.pets?.length || value.petsCount || 0) === 1 ? "" : "s"}
        </p>
      ) : null}

      {open ? (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          {creating ? (
            <div className="space-y-2 p-4">
              <p className="text-sm font-medium">New owner</p>
              <div className="grid grid-cols-2 gap-2">
                <input className={field} placeholder="First name" value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} />
                <input className={field} placeholder="Last name" value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} />
              </div>
              <input className={field} placeholder="Phone number" value={draft.phoneNumber} onChange={(e) => setDraft({ ...draft, phoneNumber: e.target.value })} />
              <input className={field} placeholder="Email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
              <input className={field} placeholder="Address" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={createOwner}
                  className="rounded-full bg-forest px-4 py-2 text-sm text-primary-foreground"
                >
                  Save owner
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="rounded-full border border-border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <ul className="max-h-64 overflow-auto">
                {loading ? (
                  <li className="flex items-center gap-2 px-4 py-3 text-sm text-foreground/60">
                    <Loader2 className="size-4 animate-spin" /> Searching…
                  </li>
                ) : results.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-foreground/60">No owners match “{query}”.</li>
                ) : (
                  results.map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange?.(o);
                          setOpen(false);
                          setQuery("");
                        }}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted"
                      >
                        <span>
                          <span className="block text-sm font-medium">{o.firstName} {o.lastName}</span>
                          <span className="block text-xs text-foreground/60">
                            {o.phoneNumber} · {o.email}
                          </span>
                        </span>
                        {value?.id === o.id ? <Check className="size-4 text-forest" /> : null}
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <button
                type="button"
                onClick={() => {
                  setCreating(true);
                  setDraft((d) => ({ ...d, firstName: /\d/.test(query) ? d.firstName : query, phoneNumber: /\d/.test(query) ? query : d.phoneNumber }));
                }}
                className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-sm text-forest hover:bg-muted"
              >
                <UserPlus className="size-4" /> Add new owner
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
