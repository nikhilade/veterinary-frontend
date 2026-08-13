import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Pet } from "@/lib/api/types";
import { toast } from "sonner";

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

import { useMasterData } from "@/hooks/use-master-data";

export interface PetFormProps {
  ownerId: string;
  pet?: Pet | null;
  onSaved: (pet: Pet) => void;
  submitLabel?: string;
}

/** Create / edit a pet. Uses POST /pets/lookup-or-create so duplicates are merged. */
export function PetForm({ ownerId, pet = null, onSaved, submitLabel = "Save pet" }: PetFormProps) {
  const [form, setForm] = useState({
    petName: pet?.petName ?? "",
    speciesId: pet?.speciesId ?? "",
    breedId: pet?.breedId ?? "",
    gender: pet?.gender ?? "Male",
    age: String(pet?.age ?? "1"),
    weightKg: String(pet?.weightKg ?? ""),
    microchipNumber: pet?.microchipNumber ?? "",
    color: pet?.color ?? "",
    allergies: pet?.allergies ?? "",
    notes: pet?.notes ?? "",
    dateOfBirth: pet?.dateOfBirth ?? "",
    status: pet?.status ?? "Active",
  });
  const [photo, setPhoto] = useState<string | null>(pet?.photoUrl ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: speciesList = [] } = useMasterData("species");
  const { data: breedsList = [] } = useMasterData("breeds");

  // Optional: if breeds should be filtered by species, you could do it here
  // assuming breed objects have a speciesId field. For now, filter if applicable.
  const breeds = breedsList.filter((b) => !b.speciesId || b.speciesId === form.speciesId);

  function onPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function submit() {
    setError(null);
    if (!form.petName.trim()) {
      setError("Pet name is required.");
      return;
    }
    setSaving(true);
    try {
      let finalPhotoUrl = photo;
      
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        formData.append("folder", "pets");
        
        const rawToken = window.localStorage.getItem("petgood.auth");
        const token = rawToken ? JSON.parse(rawToken).token : "";
        
        const res = await fetch(endpoints.files.upload, {
          method: "POST",
          body: formData,
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
           throw new Error("Failed to upload photo to server");
        }
        
        const json = await res.json();
        finalPhotoUrl = json.data.fileUrl;
      }

      const payload = {
        ...form,
        ownerId: ownerId,
        age: Number(form.age) || 0,
        weightKg: Number(form.weightKg) || 0,
        photoUrl: finalPhotoUrl,
      };
      const saved = pet
        ? await apiClient.put<Pet>(endpoints.pets.update(pet.id), payload)
        : await apiClient.post<Pet>(endpoints.pets.create, payload);
      
      toast.success(`Pet ${pet ? "updated" : "saved"} successfully!`);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save the pet.");
    } finally {
      setSaving(false);
    }
  }

  // breeds defined above

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <label className="flex size-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted">
          {photo ? (
            <img src={photo} alt={`${form.petName || "Pet"} photo`} className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-foreground/40" />
          )}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
        </label>
        <input className={field} placeholder="Pet name" value={form.petName} onChange={(e) => setForm({ ...form, petName: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          className={field}
          value={form.speciesId}
          onChange={(e) => setForm({ ...form, speciesId: e.target.value as Pet["speciesId"], breedId: "" })}
        >
          <option value="">Select species</option>
          {speciesList.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select className={field} value={form.breedId} onChange={(e) => setForm({ ...form, breedId: e.target.value })}>
          <option value="">Select breed</option>
          {breeds.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select className={field} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as "Male" | "Female" })}>
          <option>Male</option>
          <option>Female</option>
        </select>
        <input className={field} placeholder="Colour / markings" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
        <input className={field} placeholder="Age (years)" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
        <input className={field} type="date" title="Date of Birth" placeholder="Date of Birth" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
        <input className={field} placeholder="Weight (kg)" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
        <select className={field} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option>Active</option>
          <option>Deceased</option>
        </select>
      </div>

      <input
        className={field}
        placeholder="Microchip ID (optional)"
        value={form.microchipNumber ?? ""}
        onChange={(e) => setForm({ ...form, microchipNumber: e.target.value })}
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
