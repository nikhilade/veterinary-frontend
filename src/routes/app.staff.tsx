import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, UserRound, X } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel, StatCard } from "@/components/app/ui";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { ROLES } from "@/lib/api/types";
import { roleLabels, can } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/store";
import type { AttendanceStatus, BranchRecord, StaffMember } from "@/lib/api/tenancy-types";

export const Route = createFileRoute("/app/staff")({
  head: () => ({
    meta: [
      { title: "Staff & Attendance | Pet Good Console" },
      { name: "description", content: "Staff directory with roles, branches and daily attendance marking." },
      { property: "og:title", content: "Staff & Attendance | Pet Good Console" },
      { property: "og:description", content: "Directory of clinic staff and today's attendance register." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffPage,
});

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

const attendance: AttendanceStatus[] = ["PRESENT", "HALF_DAY", "LEAVE", "ABSENT"];

const tone: Record<AttendanceStatus, string> = {
  PRESENT: "bg-forest text-primary-foreground",
  HALF_DAY: "bg-clay text-primary-foreground",
  LEAVE: "bg-amber-500 text-white",
  ABSENT: "bg-destructive text-white",
};

const blank = { name: "", email: "", phone: "", role: "RECEPTIONIST", branch_id: "", employee_code: "", joined_on: "" };

function StaffPage() {
  const { role } = useAuth();
  const canWrite = can(role, "staff:write");
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  function load() {
    apiClient
      .get<StaffMember[]>(endpoints.staff.list)
      .then(setStaff)
      .catch(() => setStaff([]));
  }

  useEffect(() => {
    load();
    apiClient
      .get<BranchRecord[]>(endpoints.branchAdmin.list)
      .then(setBranches)
      .catch(() => setBranches([]));
  }, []);

  const summary = useMemo(() => {
    const list = staff ?? [];
    return {
      total: list.length,
      present: list.filter((s) => s.attendance_today === "PRESENT").length,
      leave: list.filter((s) => s.attendance_today === "LEAVE").length,
      absent: list.filter((s) => s.attendance_today === "ABSENT").length,
    };
  }, [staff]);

  async function create() {
    setError("");
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    try {
      await apiClient.post(endpoints.staff.create, { ...form, branch_id: form.branch_id || branches[0]?.id });
      setForm(blank);
      setOpen(false);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not add staff member.");
    }
  }

  async function mark(id: string, status: AttendanceStatus) {
    setStaff((s) => (s ? s.map((m) => (m.id === id ? { ...m, attendance_today: status } : m)) : s));
    try {
      await apiClient.post(endpoints.staff.attendance(id), { status });
    } catch {
      load();
    }
  }

  return (
    <StaffLayout title="Staff & Attendance" subtitle="Directory and today's register" permission="staff:read">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Team members" value={summary.total} />
        <StatCard label="Present today" value={summary.present} />
        <StatCard label="On leave" value={summary.leave} />
        <StatCard label="Absent" value={summary.absent} />
      </div>

      <div className="mt-6">
        <Panel
          title="Staff directory"
          action={
            canWrite ? (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm text-primary-foreground"
              >
                {open ? <X className="size-4" /> : <Plus className="size-4" />}
                {open ? "Close" : "Add staff"}
              </button>
            ) : null
          }
        >
          {open && canWrite ? (
            <div className="mb-5 grid gap-3 rounded-[1.25rem] bg-muted p-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Full name</span>
                <input className={field} value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Email</span>
                <input
                  className={field}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Phone</span>
                <input className={field} value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Role</span>
                <select
                  className={field}
                  value={form.role}
                  onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
                >
                  {ROLES.filter((r) => r !== "PET_OWNER").map((r) => (
                    <option key={r} value={r}>
                      {roleLabels[r]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Branch</span>
                <select
                  className={field}
                  value={form.branch_id}
                  onChange={(e) => setForm((s) => ({ ...s, branch_id: e.target.value }))}
                >
                  <option value="">Select a branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-foreground/70">Joining date</span>
                <input
                  className={field}
                  type="date"
                  value={form.joined_on}
                  onChange={(e) => setForm((s) => ({ ...s, joined_on: e.target.value }))}
                />
              </label>
              <div className="sm:col-span-2">
                {error ? <p className="mb-2 text-sm text-destructive">{error}</p> : null}
                <button
                  type="button"
                  onClick={create}
                  className="rounded-full bg-forest px-6 py-2.5 text-sm text-primary-foreground"
                >
                  Add staff member
                </button>
              </div>
            </div>
          ) : null}

          {staff === null ? (
            <Loading />
          ) : staff.length === 0 ? (
            <EmptyState icon={<UserRound className="size-6" />} message="No staff added yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="text-xs uppercase text-foreground/50">
                  <tr>
                    <th className="pb-3 pr-4">Member</th>
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 pr-4">Branch</th>
                    <th className="pb-3 pr-4">Code</th>
                    <th className="pb-3 pr-4">Present (30d)</th>
                    <th className="pb-3">Attendance today</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((m) => (
                    <tr key={m.id} className="border-t border-border">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-forest">{m.name}</p>
                        <p className="text-xs text-foreground/60">{m.email}</p>
                      </td>
                      <td className="py-3 pr-4">{roleLabels[m.role as keyof typeof roleLabels] ?? m.role}</td>
                      <td className="py-3 pr-4">{m.branch_name || "—"}</td>
                      <td className="py-3 pr-4">{m.employee_code}</td>
                      <td className="py-3 pr-4">{m.present_days_30}/30</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {attendance.map((a) => (
                            <button
                              key={a}
                              type="button"
                              disabled={!canWrite}
                              onClick={() => mark(m.id, a)}
                              className={`rounded-full px-3 py-1 text-[11px] ${
                                m.attendance_today === a ? tone[a] : "border border-border text-foreground/60"
                              } disabled:opacity-60`}
                            >
                              {a.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </StaffLayout>
  );
}
