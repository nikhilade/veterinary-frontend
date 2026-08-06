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
  const [draft, setDraft] = useState({ name: "", phone: "", email: "", address: "" });
  const [error, setError] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    const t = setTimeout(() => {
      apiClient
        .get<PetOwner[]>(endpoints.petOwners.search, { q: query })
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
    if (!draft.name.trim() || draft.phone.replace(/\D/g, "").length < 6) {
      setError("Name and a valid phone number are required.");
      return;
    }
    try {
      const owner = await apiClient.post<PetOwner>(endpoints.petOwners.create, draft);
      onChange?.(owner);
      setCreating(false);
      setOpen(false);
      setDraft({ name: "", phone: "", email: "", address: "" });
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
          value={open ? query : (value?.name ?? "")}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
      </div>
      {value && !open ? (
        <p className="mt-1.5 text-xs text-foreground/60">
          {value.phone} · {value.pets_count} pet{value.pets_count === 1 ? "" : "s"}
        </p>
      ) : null}

      {open ? (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          {creating ? (
            <div className="space-y-2 p-4">
              <p className="text-sm font-medium">New owner</p>
              {(["name", "phone", "email", "address"] as const).map((k) => (
                <input
                  key={k}
                  className={field}
                  placeholder={k[0].toUpperCase() + k.slice(1)}
                  value={draft[k]}
                  onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                />
              ))}
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
                          <span className="block text-sm font-medium">{o.name}</span>
                          <span className="block text-xs text-foreground/60">
                            {o.phone} · {o.email}
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
                  setDraft((d) => ({ ...d, name: /\d/.test(query) ? d.name : query, phone: /\d/.test(query) ? query : d.phone }));
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
