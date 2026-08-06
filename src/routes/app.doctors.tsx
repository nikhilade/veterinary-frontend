import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Stethoscope, CalendarClock } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel } from "@/components/app/ui";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/store";
import { can } from "@/lib/auth/permissions";
import type { Branch, DoctorProfile } from "@/lib/api/types";

export const Route = createFileRoute("/app/doctors")({
  head: () => ({
    meta: [
      { title: "Doctor Directory | Pet Good Console" },
      { name: "description", content: "Add, edit and browse the veterinary team with specialties, fees and registration details." },
      { property: "og:title", content: "Doctor Directory | Pet Good Console" },
      { property: "og:description", content: "Manage the clinical team roster." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DoctorsPage,
});

const field = "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";
const labelCls = "block text-xs font-medium uppercase tracking-wide text-foreground/50";

type Draft = {
  name: string;
  specialty: string;
  email: string;
  phone: string;
  registration_no: string;
  branch_id: string;
  consultation_fee: string;
  bio: string;
  active: boolean;
};

const emptyDraft: Draft = {
  name: "",
  specialty: "General Medicine",
  email: "",
  phone: "",
  registration_no: "",
  branch_id: "br_1",
  consultation_fee: "800",
  bio: "",
  active: true,
};

function DoctorsPage() {
  const { role } = useAuth();
  const canWrite = can(role, "doctors:write");
  const [doctors, setDoctors] = useState<DoctorProfile[] | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    apiClient.get<DoctorProfile[]>(endpoints.doctors.list).then(setDoctors).catch(() => setDoctors([]));
  }

  useEffect(() => {
    load();
    apiClient.get<Branch[]>(endpoints.branches.list).then(setBranches).catch(() => setBranches([]));
  }, []);

  function startCreate() {
    setEditing(null);
    setDraft(emptyDraft);
    setError("");
    setOpen(true);
  }

  function startEdit(d: DoctorProfile) {
    setEditing(d.id);
    setDraft({
      name: d.name,
      specialty: d.specialty,
      email: d.email ?? "",
      phone: d.phone ?? "",
      registration_no: d.registration_no ?? "",
      branch_id: d.branch_id ?? "br_1",
      consultation_fee: String(d.consultation_fee ?? 800),
      bio: d.bio ?? "",
      active: d.active ?? true,
    });
    setError("");
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setError("");
    const body = { ...draft, consultation_fee: Number(draft.consultation_fee) || 0 };
    try {
      if (editing) await apiClient.patch<DoctorProfile>(endpoints.doctors.update(editing), body);
      else await apiClient.post<DoctorProfile>(endpoints.doctors.create, body);
      setOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the doctor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StaffLayout title="Doctors" subtitle="Clinical team directory" permission="doctors:read">
      {canWrite ? (
        <div className="mb-5 flex justify-end">
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Plus className="size-4" />
            New doctor
          </button>
        </div>
      ) : null}

      {open ? (
        <div className="mb-6">
          <Panel title={editing ? "Edit doctor" : "Add doctor"}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="doc-name">Full name</label>
                <input id="doc-name" className={`${field} mt-1.5`} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Dr. Amelia Reed" />
              </div>
              <div>
                <label className={labelCls} htmlFor="doc-spec">Specialty</label>
                <input id="doc-spec" className={`${field} mt-1.5`} value={draft.specialty} onChange={(e) => setDraft({ ...draft, specialty: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="doc-email">Email</label>
                <input id="doc-email" type="email" className={`${field} mt-1.5`} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="doc-phone">Phone</label>
                <input id="doc-phone" className={`${field} mt-1.5`} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="doc-reg">Registration no.</label>
                <input id="doc-reg" className={`${field} mt-1.5`} value={draft.registration_no} onChange={(e) => setDraft({ ...draft, registration_no: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="doc-branch">Branch</label>
                <select id="doc-branch" className={`${field} mt-1.5`} value={draft.branch_id} onChange={(e) => setDraft({ ...draft, branch_id: e.target.value })}>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="doc-fee">Consultation fee (₹)</label>
                <input id="doc-fee" inputMode="numeric" className={`${field} mt-1.5`} value={draft.consultation_fee} onChange={(e) => setDraft({ ...draft, consultation_fee: e.target.value })} />
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="size-4 accent-[var(--color-forest)]" />
                Accepting appointments
              </label>
              <div className="md:col-span-2">
                <label className={labelCls} htmlFor="doc-bio">Bio</label>
                <textarea id="doc-bio" rows={2} className={`${field} mt-1.5`} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
              </div>
            </div>
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
            <div className="mt-5 flex gap-3">
              <button onClick={save} disabled={saving} className="rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
                {saving ? "Saving…" : editing ? "Save changes" : "Create doctor"}
              </button>
              <button onClick={() => setOpen(false)} className="rounded-full border border-border px-6 py-2.5 text-sm">
                Cancel
              </button>
            </div>
          </Panel>
        </div>
      ) : null}

      {!doctors ? (
        <Loading />
      ) : doctors.length === 0 ? (
        <EmptyState title="No doctors yet" message="Add your first veterinarian to start scheduling." icon={<Stethoscope className="size-6" />} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map((d) => (
            <Panel key={d.id} title={d.name}>
              <p className="text-sm text-foreground/70">{d.specialty}</p>
              <dl className="mt-3 space-y-1 text-sm text-foreground/70">
                {d.registration_no ? <div>Reg. {d.registration_no}</div> : null}
                {d.email ? <div>{d.email}</div> : null}
                {d.phone ? <div>{d.phone}</div> : null}
                {d.consultation_fee ? <div>Consultation ₹{d.consultation_fee}</div> : null}
              </dl>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${d.active === false ? "bg-destructive/10 text-destructive" : "bg-forest/10 text-forest"}`}>
                {d.active === false ? "inactive" : "accepting appointments"}
              </span>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/app/doctor-schedule"
                  search={{ doctor: d.id }}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs"
                >
                  <CalendarClock className="size-3.5" />
                  Availability
                </Link>
                {canWrite ? (
                  <button onClick={() => startEdit(d)} className="rounded-full border border-border px-4 py-2 text-xs">
                    Edit
                  </button>
                ) : null}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </StaffLayout>
  );
}
