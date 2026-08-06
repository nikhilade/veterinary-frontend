import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Pill, Plus, Trash2 } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel, formatDate } from "@/components/app/ui";
import { PetPicker } from "@/components/app/kit/PetPicker";
import { PrescriptionPdfButton } from "@/components/app/kit/PrescriptionPdfButton";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/store";
import type { Medicine, Pet, PrescriptionDetail, PrescriptionItem } from "@/lib/api/types";

export const Route = createFileRoute("/app/prescriptions")({
  head: () => ({
    meta: [
      { title: "Prescription Builder | Pet Good Console" },
      { name: "description", content: "Build multi-line prescriptions from the master medicine list and generate a printable PDF." },
      { property: "og:title", content: "Prescription Builder | Pet Good Console" },
      { property: "og:description", content: "Medicine autocomplete, dosage, duration and PDF output." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrescriptionsPage,
});

const field = "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";
const labelCls = "block text-xs font-medium uppercase tracking-wide text-foreground/50";

const frequencies = ["Once daily", "Twice daily", "Three times daily", "Every 8 hours", "Every 12 weeks", "As needed"];

const blankItem = (): PrescriptionItem => ({
  medicine_id: "",
  name: "",
  strength: "",
  form: "",
  dosage: "",
  frequency: "Twice daily",
  duration_days: 5,
  notes: "",
});

/** Autocomplete against the master medicine list. */
function MedicineAutocomplete({
  value,
  onPick,
  onText,
}: {
  value: string;
  onPick: (m: Medicine) => void;
  onText: (text: string) => void;
}) {
  const [options, setOptions] = useState<Medicine[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      apiClient
        .get<Medicine[]>(endpoints.medicines.list, { q: value })
        .then(setOptions)
        .catch(() => setOptions([]));
    }, 150);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <input
        className={field}
        placeholder="Start typing a medicine…"
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onText(e.target.value);
          setOpen(true);
        }}
        aria-label="Medicine"
        autoComplete="off"
      />
      {open && options.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-2xl border border-border bg-card p-1 shadow-lg">
          {options.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(m);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span>
                  {m.name} <span className="text-foreground/60">{m.strength}</span>
                </span>
                <span className="text-xs text-foreground/50">
                  {m.form} · {m.stock} in stock
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PrescriptionsPage() {
  const { user } = useAuth();
  const [list, setList] = useState<PrescriptionDetail[] | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);
  const [items, setItems] = useState<PrescriptionItem[]>([blankItem()]);
  const [refills, setRefills] = useState("0");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    apiClient.get<PrescriptionDetail[]>(endpoints.prescriptions.list).then(setList).catch(() => setList([]));
  }

  useEffect(load, []);

  function patchItem(index: number, patch: Partial<PrescriptionItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  async function save() {
    setSaving(true);
    setError("");
    setCreatedId(null);
    try {
      const created = await apiClient.post<PrescriptionDetail>(endpoints.prescriptions.create, {
        pet_id: pet?.id,
        doctor_name: user?.name ?? "Clinic doctor",
        items,
        refills_left: Number(refills) || 0,
        instructions,
      });
      setCreatedId(created.id);
      setItems([blankItem()]);
      setInstructions("");
      setRefills("0");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the prescription.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StaffLayout title="Prescriptions" subtitle="Build and issue medication plans" permission="prescriptions:write">
      <div className="space-y-6">
        <Panel title="New prescription">
          <PetPicker value={pet} onChange={setPet} />

          <div className="mt-6 space-y-4">
            {items.map((item, i) => (
              <div key={i} className="rounded-[1.25rem] border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Line item {i + 1}</p>
                  {items.length > 1 ? (
                    <button
                      aria-label={`Remove line item ${i + 1}`}
                      onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                      className="rounded-full border border-border p-2 text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="lg:col-span-2">
                    <label className={labelCls}>Medicine</label>
                    <div className="mt-1.5">
                      <MedicineAutocomplete
                        value={item.name}
                        onText={(text) => patchItem(i, { name: text, medicine_id: "" })}
                        onPick={(m) =>
                          patchItem(i, {
                            medicine_id: m.id,
                            name: m.name,
                            strength: m.strength,
                            form: m.form,
                            dosage: item.dosage || m.default_dosage,
                          })
                        }
                      />
                    </div>
                    {item.strength ? (
                      <p className="mt-1.5 text-xs text-foreground/50">
                        {item.strength} · {item.form}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label className={labelCls} htmlFor={`dose-${i}`}>Dosage</label>
                    <input id={`dose-${i}`} className={`${field} mt-1.5`} value={item.dosage} placeholder="1 tablet" onChange={(e) => patchItem(i, { dosage: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor={`freq-${i}`}>Frequency</label>
                    <select id={`freq-${i}`} className={`${field} mt-1.5`} value={item.frequency} onChange={(e) => patchItem(i, { frequency: e.target.value })}>
                      {frequencies.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor={`dur-${i}`}>Duration (days)</label>
                    <input
                      id={`dur-${i}`}
                      inputMode="numeric"
                      className={`${field} mt-1.5`}
                      value={item.duration_days}
                      onChange={(e) => patchItem(i, { duration_days: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor={`note-${i}`}>Notes</label>
                    <input id={`note-${i}`} className={`${field} mt-1.5`} value={item.notes} placeholder="Give with food" onChange={(e) => patchItem(i, { notes: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setItems((prev) => [...prev, blankItem()])}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm"
          >
            <Plus className="size-4" />
            Add medicine
          </button>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls} htmlFor="rx-refills">Refills</label>
              <input id="rx-refills" inputMode="numeric" className={`${field} mt-1.5`} value={refills} onChange={(e) => setRefills(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="rx-instr">Overall instructions</label>
              <input id="rx-instr" className={`${field} mt-1.5`} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            </div>
          </div>

          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          <button
            onClick={save}
            disabled={saving || !pet}
            className="mt-5 rounded-full bg-forest px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save prescription"}
          </button>
          {!pet ? <p className="mt-2 text-xs text-foreground/50">Select an owner and pet to continue.</p> : null}

          {createdId ? (
            <div className="mt-5 rounded-[1.25rem] bg-forest/5 p-4">
              <p className="text-sm text-forest">Prescription {createdId} issued.</p>
              <PrescriptionPdfButton prescriptionId={createdId} className="mt-3" />
            </div>
          ) : null}
        </Panel>

        <Panel title="Issued prescriptions">
          {!list ? (
            <Loading />
          ) : list.length === 0 ? (
            <EmptyState message="No prescriptions issued yet." icon={<Pill className="size-6" />} />
          ) : (
            <div className="space-y-3">
              {list.map((p) => (
                <div key={p.id} className="rounded-[1.25rem] border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{p.pet_name}</p>
                    <p className="text-xs text-foreground/50">
                      {formatDate(p.issued_at)} · {p.doctor_name}
                    </p>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-foreground/75">
                    {(p.items.length ? p.items : []).map((it, i) => (
                      <li key={i}>
                        {it.name} {it.strength} — {it.dosage}, {it.frequency}, {it.duration_days} days
                      </li>
                    ))}
                    {p.items.length === 0 ? <li>{p.medication} — {p.dosage}</li> : null}
                  </ul>
                  <PrescriptionPdfButton prescriptionId={p.id} className="mt-3" />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </StaffLayout>
  );
}
