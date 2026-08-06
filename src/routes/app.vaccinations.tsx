import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Syringe } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Panel } from "@/components/app/ui";
import { DataTable, type DataTableColumn } from "@/components/app/kit/DataTable";
import { PetPicker } from "@/components/app/kit/PetPicker";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Pet, Vaccine } from "@/lib/api/types";

export const Route = createFileRoute("/app/vaccinations")({
  head: () => ({
    meta: [
      { title: "Vaccinations | Pet Good Console" },
      { name: "description", content: "Vaccination due list and new vaccine entries with due-date validation." },
      { property: "og:title", content: "Vaccinations | Pet Good Console" },
      { property: "og:description", content: "Track boosters and record new vaccinations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VaccinationsPage,
});

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

const today = () => new Date().toISOString().slice(0, 10);

function dueTone(date: string) {
  const diff = (new Date(date).getTime() - Date.now()) / 86_400_000;
  if (diff < 0) return "bg-destructive/10 text-destructive";
  if (diff < 7) return "bg-clay/15 text-clay";
  return "bg-forest/10 text-forest";
}

function VaccinationsPage() {
  const [version, setVersion] = useState(0);
  const [pet, setPet] = useState<Pet | null>(null);
  const [form, setForm] = useState({ vaccine_name: "", batch_no: "", vaccination_date: today(), next_due_date: "", administered_by: "" });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [empty, setEmpty] = useState(false);

  useEffect(() => setOk(null), [pet]);

  const fetchPage = useCallback(async (cursor: string | null) => {
    const res = await apiClient.list<Vaccine>(endpoints.vaccines.due, { within_days: 30, limit: 10, cursor: cursor ?? undefined });
    if (!cursor) setEmpty(res.items.length === 0);
    return res;
  }, []);

  const columns: DataTableColumn<Vaccine>[] = [
    { key: "pet", header: "Pet", sortValue: (v) => v.pet_name, cell: (v) => v.pet_name },
    { key: "owner", header: "Owner", cell: (v) => v.owner_name },
    { key: "vaccine", header: "Vaccine", sortValue: (v) => v.vaccine_name, cell: (v) => v.vaccine_name },
    { key: "given", header: "Last given", sortValue: (v) => v.vaccination_date, cell: (v) => v.vaccination_date },
    {
      key: "due",
      header: "Next due",
      sortValue: (v) => v.next_due_date,
      cell: (v) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${dueTone(v.next_due_date)}`}>{v.next_due_date}</span>
      ),
    },
  ];

  async function submit() {
    setError(null);
    setOk(null);
    if (!pet) return setError("Select a pet first.");
    if (!form.vaccine_name.trim()) return setError("Vaccine name is required.");
    if (!form.next_due_date) return setError("Next due date is required.");
    if (new Date(form.next_due_date) <= new Date(form.vaccination_date)) {
      return setError("Next due date must be after the vaccination date.");
    }
    setSaving(true);
    try {
      await apiClient.post<Vaccine>(endpoints.vaccines.create, { ...form, pet_id: pet.id });
      setOk(`Vaccination recorded for ${pet.name}.`);
      setForm({ vaccine_name: "", batch_no: "", vaccination_date: today(), next_due_date: "", administered_by: "" });
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save the vaccination.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StaffLayout title="Vaccinations" subtitle="Due list and new entries" permission="pets:read">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title="Due in the next 30 days">
          {empty ? (
            <EmptyState
              icon={<Syringe className="size-7" />}
              title="Nothing due"
              message="No vaccinations are due in the next 30 days. Record a vaccine on the right to start tracking boosters."
            />
          ) : (
            <DataTable key={version} columns={columns} rowKey={(v) => v.id} fetchPage={fetchPage} emptyMessage="Nothing due right now." />
          )}
        </Panel>

        <Panel title="Record a vaccination">
          <div className="space-y-4">
            <PetPicker value={pet} onChange={setPet} />
            <input className={field} placeholder="Vaccine name" value={form.vaccine_name} onChange={(e) => setForm({ ...form, vaccine_name: e.target.value })} />
            <input className={field} placeholder="Batch number" value={form.batch_no} onChange={(e) => setForm({ ...form, batch_no: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-foreground/60">
                Vaccination date
                <input type="date" className={`${field} mt-1`} value={form.vaccination_date} onChange={(e) => setForm({ ...form, vaccination_date: e.target.value })} />
              </label>
              <label className="text-xs text-foreground/60">
                Next due date
                <input type="date" className={`${field} mt-1`} value={form.next_due_date} min={form.vaccination_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} />
              </label>
            </div>
            <input className={field} placeholder="Administered by" value={form.administered_by} onChange={(e) => setForm({ ...form, administered_by: e.target.value })} />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {ok ? <p className="text-sm text-forest">{ok}</p> : null}
            <button onClick={submit} disabled={saving} className="rounded-full bg-forest px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-50">
              {saving ? "Saving…" : "Save vaccination"}
            </button>
          </div>
        </Panel>
      </div>
    </StaffLayout>
  );
}
