import { useEffect, useState } from "react";
import { PawPrint, Plus, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Pet, PetOwner } from "@/lib/api/types";
import { OwnerSearchCombobox } from "./OwnerSearchCombobox";
import { useMasterData } from "@/hooks/use-master-data";

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

export interface PetPickerProps {
  owner?: PetOwner | null;
  onOwnerChange?: (owner: PetOwner | null) => void;
  value?: Pet | null;
  onChange?: (pet: Pet | null) => void;
}

/** Cascading owner → pet selector with an inline "add new pet" option. */
export function PetPicker({ owner: ownerProp, onOwnerChange, value = null, onChange }: PetPickerProps) {
  const [owner, setOwner] = useState<PetOwner | null>(ownerProp ?? null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", speciesId: "", breedId: "", sex: "Male", age: "1" });

  const { data: speciesList = [] } = useMasterData("species");
  const { data: breedsList = [] } = useMasterData("breeds");
  const breeds = breedsList.filter((b) => !b.speciesId || b.speciesId === draft.speciesId);

  useEffect(() => {
    if (ownerProp !== undefined) setOwner(ownerProp);
  }, [ownerProp]);

  useEffect(() => {
    if (!owner) {
      setPets([]);
      return;
    }
    if (owner.pets && owner.pets.length > 0) {
      setPets(owner.pets);
      return;
    }
    let active = true;
    setLoading(true);
    apiClient
      .get<Pet[]>(endpoints.pets.byOwner(owner.id))
      .then((p) => active && setPets(p))
      .catch(() => active && setPets([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [owner]);

  async function addPet() {
    if (!owner || !draft.name.trim() || !draft.speciesId || !draft.breedId) return;
    const created = await apiClient.post<Pet>(
      endpoints.pets.lookupOrCreate,
      undefined,
      undefined,
      {
        ownerId: owner.id,
        petName: draft.name,
        speciesId: draft.speciesId,
        breedId: draft.breedId,
      }
    );
    setPets((p) => [...p, created]);
    onChange?.(created);
    setAdding(false);
    setDraft({ name: "", speciesId: "", breedId: "", sex: "Male", age: "1" });
  }

  return (
    <div className="space-y-4">
      <OwnerSearchCombobox
        value={owner}
        onChange={(o) => {
          setOwner(o);
          onOwnerChange?.(o);
          onChange?.(null);
        }}
      />

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/60">Pet</label>
        {!owner ? (
          <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-foreground/60">Select an owner first.</p>
        ) : loading ? (
          <p className="flex items-center gap-2 px-1 py-2 text-sm text-foreground/60">
            <Loader2 className="size-4 animate-spin" /> Loading pets…
          </p>
        ) : (
          <div className="space-y-2">
            {pets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange?.(p)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm ${
                  value?.id === p.id ? "border-forest bg-forest/5" : "border-border bg-background"
                }`}
              >
                <PawPrint className="size-4 text-clay" />
                <span>
                  <span className="block font-medium">{p.name || (p as any).petName || "Unnamed Pet"}</span>
                  <span className="block text-xs text-foreground/60">
                    {p.species || speciesList.find(s => s.id === (p as any).speciesId)?.name || "Unknown Species"} · {p.breed || breedsList.find(b => b.id === (p as any).breedId)?.name || "Unknown Breed"} · {p.age}y
                  </span>
                </span>
              </button>
            ))}
            {adding ? (
              <div className="space-y-2 rounded-2xl border border-border p-4">
                <input className={field} placeholder="Pet name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <select className={field} value={draft.speciesId} onChange={(e) => setDraft({ ...draft, speciesId: e.target.value, breedId: "" })}>
                    <option value="">Species</option>
                    {speciesList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <select className={field} value={draft.sex} onChange={(e) => setDraft({ ...draft, sex: e.target.value })}>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                  <select className={field} value={draft.breedId} onChange={(e) => setDraft({ ...draft, breedId: e.target.value })}>
                    <option value="">Breed</option>
                    {breeds.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <input className={field} placeholder="Age (years)" value={draft.age} onChange={(e) => setDraft({ ...draft, age: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={addPet} className="rounded-full bg-forest px-4 py-2 text-sm text-primary-foreground">
                    Save pet
                  </button>
                  <button type="button" onClick={() => setAdding(false)} className="rounded-full border border-border px-4 py-2 text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-forest"
              >
                <Plus className="size-4" /> Add new pet
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
