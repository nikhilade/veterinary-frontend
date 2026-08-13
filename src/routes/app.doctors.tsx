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
  hospitalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  joiningDate: string;
  consultationFee: string;
  consultationDurationMin: string;
  status: string;
};

const emptyDraft: Draft = {
  hospitalId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "MALE",
  dob: "",
  joiningDate: "",
  consultationFee: "800",
  consultationDurationMin: "15",
  status: "ACTIVE",
};

function DoctorsPage() {
  const { role } = useAuth();
  const canWrite = can(role, "doctors:write");
  const [doctors, setDoctors] = useState<DoctorProfile[] | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
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
    apiClient.get<any[]>(endpoints.hospitals.list).then(setHospitals).catch(() => setHospitals([]));
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
      hospitalId: (d as any).hospitalId ?? "",
      firstName: d.firstName ?? "",
      lastName: d.lastName ?? "",
      email: d.email ?? "",
      phone: d.phone ?? "",
      gender: d.gender ?? "MALE",
      dob: d.dob ?? "",
      joiningDate: d.joiningDate ?? "",
      consultationFee: String(d.consultationFee ?? 800),
      consultationDurationMin: String(d.consultationDurationMin ?? 15),
      status: d.status ?? "ACTIVE",
    });
    setError("");
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setError("");
    const body: any = { ...draft, consultationFee: Number(draft.consultationFee) || 0, consultationDurationMin: Number(draft.consultationDurationMin) || 15 };
    if (!body.dob) delete body.dob;
    if (!body.joiningDate) delete body.joiningDate;
    try {
      if (editing) await apiClient.put<DoctorProfile>(endpoints.doctors.update(editing), body);
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
                <label className={labelCls} htmlFor="doc-hospital">Hospital</label>
                <select id="doc-hospital" className={`${field} mt-1.5`} value={draft.hospitalId} onChange={(e) => setDraft({ ...draft, hospitalId: e.target.value })}>
                  <option value="">Select a hospital</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.hospitalName ?? h.name ?? h.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="doc-fn">First name</label>
                <input id="doc-fn" className={`${field} mt-1.5`} value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} placeholder="Amelia" />
              </div>
              <div>
                <label className={labelCls} htmlFor="doc-ln">Last name</label>
                <input id="doc-ln" className={`${field} mt-1.5`} value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} placeholder="Reed" />
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
                <label className={labelCls} htmlFor="doc-gender">Gender</label>
                <select id="doc-gender" className={`${field} mt-1.5`} value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value })}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="doc-fee">Consultation fee (₹)</label>
                <input id="doc-fee" inputMode="numeric" className={`${field} mt-1.5`} value={draft.consultationFee} onChange={(e) => setDraft({ ...draft, consultationFee: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="doc-dur">Consultation Duration (min)</label>
                <input id="doc-dur" inputMode="numeric" className={`${field} mt-1.5`} value={draft.consultationDurationMin} onChange={(e) => setDraft({ ...draft, consultationDurationMin: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="doc-status">Status</label>
                <select id="doc-status" className={`${field} mt-1.5`} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
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
            <Panel key={d.id} title={`${d.firstName} ${d.lastName}`}>
              <p className="text-sm text-foreground/70">Emp Code: {d.employeeCode || "N/A"}</p>
              <dl className="mt-3 space-y-1 text-sm text-foreground/70">
                {d.email ? <div>{d.email}</div> : null}
                {d.phone ? <div>{d.phone}</div> : null}
                {d.consultationFee ? <div>Consultation ₹{d.consultationFee} ({d.consultationDurationMin} min)</div> : null}
              </dl>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${d.status === "INACTIVE" ? "bg-destructive/10 text-destructive" : "bg-forest/10 text-forest"}`}>
                {d.status === "INACTIVE" ? "inactive" : "active"}
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
