import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Pet } from "@/lib/api/types";

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

export const SPECIES = ["Dog", "Cat", "Bird", "Rabbit"] as const;

export const BREEDS: Record<string, string[]> = {
  Dog: ["Golden Retriever", "Labrador", "German Shepherd", "French Bulldog", "Border Collie", "Indie / Mixed"],
  Cat: ["Persian", "British Shorthair", "Siamese", "Maine Coon", "Indie / Mixed"],
  Bird: ["Budgerigar", "Cockatiel", "Lovebird", "African Grey"],
  Rabbit: ["Holland Lop", "Netherland Dwarf", "Rex", "Mixed"],
};

export interface PetFormProps {
  ownerId: string;
  pet?: Pet | null;
  onSaved: (pet: Pet) => void;
  submitLabel?: string;
}

/** Create / edit a pet. Uses POST /pets/lookup-or-create so duplicates are merged. */
export function PetForm({ ownerId, pet = null, onSaved, submitLabel = "Save pet" }: PetFormProps) {
  const [form, setForm] = useState({
    name: pet?.name ?? "",
    species: (pet?.species ?? "Dog") as Pet["species"],
    breed: pet?.breed ?? "",
    sex: (pet?.sex ?? "Male") as Pet["sex"],
    age_years: String(pet?.age_years ?? "1"),
    weight_kg: String(pet?.weight_kg ?? ""),
    microchip_id: pet?.microchip_id ?? "",
    color: pet?.color ?? "",
    allergies: pet?.allergies ?? "",
    notes: pet?.notes ?? "",
  });
  const [photo, setPhoto] = useState<string | null>(pet?.photo_url ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function onPhoto(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function submit() {
    setError(null);
    if (!form.name.trim()) {
      setError("Pet name is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        owner_id: ownerId,
        age_years: Number(form.age_years) || 0,
        weight_kg: Number(form.weight_kg) || 0,
        photo_url: photo,
      };
      const saved = pet
        ? await apiClient.patch<Pet>(endpoints.pets.update(pet.id), payload)
        : (await apiClient.post<{ pet: Pet; created: boolean }>(endpoints.pets.lookupOrCreate, payload)).pet;
      onSaved(saved);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save the pet.");
    } finally {
      setSaving(false);
    }
  }

  const breeds = BREEDS[form.species] ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <label className="flex size-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted">
          {photo ? (
            <img src={photo} alt={`${form.name || "Pet"} photo`} className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-foreground/40" />
          )}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
        </label>
        <input className={field} placeholder="Pet name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          className={field}
          value={form.species}
          onChange={(e) => setForm({ ...form, species: e.target.value as Pet["species"], breed: "" })}
        >
          {SPECIES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className={field} value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })}>
          <option value="">Select breed</option>
          {breeds.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <select className={field} value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value as Pet["sex"] })}>
          <option>Male</option>
          <option>Female</option>
        </select>
        <input className={field} placeholder="Colour / markings" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
        <input className={field} placeholder="Age (years)" value={form.age_years} onChange={(e) => setForm({ ...form, age_years: e.target.value })} />
        <input className={field} placeholder="Weight (kg)" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
      </div>

      <input
        className={field}
        placeholder="Microchip ID (optional)"
        value={form.microchip_id ?? ""}
        onChange={(e) => setForm({ ...form, microchip_id: e.target.value })}
      />
      <textarea
        className={field}
        rows={2}
        placeholder="Allergies (e.g. chicken protein, penicillin)"
        value={form.allergies}
        onChange={(e) => setForm({ ...form, allergies: e.target.value })}
      />
      <textarea
        className={field}
        rows={2}
        placeholder="Other notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="rounded-full bg-forest px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-50"
      >
        {saving ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}
