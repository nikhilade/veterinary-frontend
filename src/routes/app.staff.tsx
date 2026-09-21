import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { AdminHospitalSelector } from "@/components/app/AdminHospitalSelector";
import { EmptyState, Loading, Panel, StatCard } from "@/components/app/ui";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { can, roleLabels } from "@/lib/auth/permissions";
import { authStore, useAuth } from "@/lib/auth/store";
import type { AttendanceStatus, BranchRecord, StaffMember } from "@/lib/api/tenancy-types";

type Hospital = { id: string; name: string };
type Department = { id: string; name: string };
type Designation = { id: string; name: string };

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

const attendance: AttendanceStatus[] = ["PRESENT", "HALF_DAY", "ON_LEAVE", "ABSENT"];

const tone: Record<AttendanceStatus, string> = {
  PRESENT: "bg-forest text-primary-foreground",
  HALF_DAY: "bg-clay text-primary-foreground",
  ON_LEAVE: "bg-amber-500 text-white",
  ABSENT: "bg-destructive text-white",
};

const extractArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.content)) return data.content;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  const values = Object.values(data);
  const arr = values.find(Array.isArray);
  if (arr) return arr as any[];
  if (data._embedded && typeof data._embedded === "object") {
    const embeddedArr = Object.values(data._embedded).find(Array.isArray);
    if (embeddedArr) return embeddedArr as any[];
  }
  return [];
};

const blank = { firstName: "", lastName: "", email: "", phone: "", branchId: "", departmentId: "", designationId: "", role: "", employeeCode: "", joinDate: new Date().toISOString().split("T")[0] };

function StaffPage() {
  const { role, hospitalId } = useAuth();
  const canWrite = can(role, "staff:write");
  const activeHospitalId = role === "SUPER_ADMIN" ? authStore.get().adminHospitalId : hospitalId;
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [todayAttendances, setTodayAttendances] = useState<Record<string, any>>({});
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const [deptForm, setDeptForm] = useState({ name: "", code: "" });
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptError, setDeptError] = useState("");
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  const [desigForm, setDesigForm] = useState({ name: "", code: "", departmentId: "" });
  const [desigOpen, setDesigOpen] = useState(false);
  const [desigError, setDesigError] = useState("");
  const [editingDesigId, setEditingDesigId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  const headers = undefined; // Automatically handled by apiClient using adminHospitalId

  const load = useCallback(() => {
    // Relying on global adminHospitalId handled by StaffLayout
    if (role === "SUPER_ADMIN" && !authStore.get().adminHospitalId) return;
    
    Promise.all([
      apiClient.get<StaffMember[]>(endpoints.staff.list, undefined, headers).catch(() => null),
      apiClient.get<any[]>(endpoints.staff.attendanceByDate(attendanceDate), undefined, headers).catch(() => null)
    ]).then(([staffData, attData]) => {
      setStaff(staffData ? extractArray(staffData) : []);
      
      const attMap: Record<string, any> = {};
      if (attData) {
        const attArr = extractArray(attData);
        attArr.forEach(a => {
          if (a.staffId) attMap[a.staffId] = a;
        });
      }
      setTodayAttendances(attMap);
    });
  }, [role, attendanceDate]);

  useEffect(() => {
    if (role === "SUPER_ADMIN" && !authStore.get().adminHospitalId) return;
    setStaff(null);
    load();
    apiClient
      .get<BranchRecord[]>(endpoints.branchAdmin.list, undefined, headers)
      .then((data: any) => {
        const arr = extractArray(data);
        setBranches(arr);
      })
      .catch(() => setBranches([]));

    const loadDepartments = () => {
      if (activeHospitalId) {
        apiClient
          .get<Department[]>(endpoints.hospitals.departments(activeHospitalId), undefined, headers)
          .then((data: any) => {
            const arr = extractArray(data);
            setDepartments(arr);
          })
          .catch(() => setDepartments([]));
      }
    };
    loadDepartments();
    // Expose it so createDepartment can use it
    (window as any).__loadDepartments = loadDepartments;

    apiClient
      .get<Designation[]>(endpoints.masterData.list("designations"), undefined, headers)
      .then((data: any) => {
        const arr = extractArray(data);
        console.log("Designations fetched:", arr);
        setDesignations(arr);
      })
      .catch(() => setDesignations([]));

    const loadDesignations = () => {
      apiClient
        .get<Designation[]>(endpoints.masterData.list("designations"), undefined, headers)
        .then((data: any) => setDesignations(extractArray(data)))
        .catch(() => setDesignations([]));
    };
    (window as any).__loadDesignations = loadDesignations;
  }, [role, activeHospitalId, headers, load]);

  const summary = useMemo(() => {
    const list = staff ?? [];
    return {
      total: list.length,
      present: list.filter((s) => s.attendanceToday === "PRESENT").length,
      leave: list.filter((s) => s.attendanceToday === "ON_LEAVE").length,
      absent: list.filter((s) => s.attendanceToday === "ABSENT").length,
    };
  }, [staff]);

  const filteredStaff = useMemo(() => {
    if (!staff) return null;
    return staff.filter((m) => {
      const matchSearch =
        (m.firstName + " " + m.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Match department using departmentName
      const matchDept = departmentFilter 
        ? departments.find(d => d.id === departmentFilter)?.name === m.departmentName
        : true;
      const matchDesig = designationFilter 
        ? designations.find(d => d.id === designationFilter)?.name === m.designationName
        : true;
        
      return matchSearch && matchDept && matchDesig;
    });
  }, [staff, searchQuery, departmentFilter, designationFilter, departments, designations]);

  async function create() {
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("First name, last name, and email are required.");
      return;
    }
    if (!form.departmentId || !form.designationId || !form.employeeCode || !form.role) {
      setError("Department, designation, role, and employee code are required.");
      return;
    }
    try {
      const payload = {
        hospitalId: activeHospitalId,
        branchId: form.branchId || branches[0]?.id,
        departmentId: form.departmentId,
        designationId: form.designationId,
        role: form.role,
        employeeCode: form.employeeCode,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        joinDate: form.joinDate,
        status: "ACTIVE"
      };
      
      if (editingStaffId) {
        await apiClient.put(endpoints.staff.detail(editingStaffId), payload, headers);
      } else {
        await apiClient.post(endpoints.staff.create, payload, headers);
      }
      
      setForm(blank);
      setOpen(false);
      setEditingStaffId(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : `Could not ${editingStaffId ? 'update' : 'add'} staff member.`);
    }
  }

  async function startEdit(m: StaffMember) {
    setForm({
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      phone: m.phone || "",
      branchId: m.branchId || "",
      departmentId: departments.find(d => d.name === m.departmentName)?.id || "",
      designationId: designations.find(d => d.name === m.designationName)?.id || "",
      role: m.role || "STAFF",
      employeeCode: m.employeeCode || "",
      joinDate: m.joinDate ? m.joinDate.split("T")[0] : new Date().toISOString().split("T")[0],
    });
    setEditingStaffId(m.id);
    setOpen(true);
  }

  async function deleteStaff(id: string) {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      await apiClient.delete(endpoints.staff.detail(id), headers);
      load();
    } catch (e) {
      alert("Could not delete staff member. They may have active records linked to them.");
    }
  }

  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  async function createDepartment() {
    setDeptError("");
    if (!deptForm.name.trim()) {
      setDeptError("Department name is required.");
      return;
    }
    if (!deptForm.code.trim()) {
      setDeptError("Department code is required.");
      return;
    }
    try {
      if (editingDeptId) {
        await apiClient.put(endpoints.hospitals.departmentDetail(activeHospitalId as string, editingDeptId), { name: deptForm.name, code: deptForm.code }, headers);
      } else {
        await apiClient.post(endpoints.hospitals.departments(activeHospitalId as string), { name: deptForm.name, code: deptForm.code }, headers);
      }
      setDeptForm({ name: "", code: "" });
      setDeptOpen(false);
      setEditingDeptId(null);
      if ((window as any).__loadDepartments) (window as any).__loadDepartments();
    } catch (e) {
      setDeptError(e instanceof ApiError ? e.message : `Could not ${editingDeptId ? 'update' : 'add'} department.`);
    }
  }

  function startEditDepartment(d: any) {
    setDeptForm({ name: d.name || d.departmentName || "", code: d.code || "" });
    setEditingDeptId(d.id || d.departmentId || "");
    setDeptOpen(true);
  }

  async function deleteDepartment(id: string) {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await apiClient.delete(endpoints.hospitals.departmentDetail(activeHospitalId as string, id), headers);
      if ((window as any).__loadDepartments) (window as any).__loadDepartments();
    } catch (e) {
      alert("Could not delete department.");
    }
  }

  async function createDesignation() {
    setDesigError("");
    if (!desigForm.name.trim() || !desigForm.code.trim() || !desigForm.departmentId) {
      setDesigError("Name, code and department are required.");
      return;
    }
    try {
      const payload = {
        name: desigForm.name,
        code: desigForm.code,
        departmentId: desigForm.departmentId,
        hospitalId: activeHospitalId as string,
      };
      if (editingDesigId) {
        await apiClient.put(endpoints.masterData.detail("designations", editingDesigId), payload, headers);
      } else {
        await apiClient.post(endpoints.masterData.list("designations"), payload, headers);
      }
      setDesigForm({ name: "", code: "", departmentId: "" });
      setDesigOpen(false);
      setEditingDesigId(null);
      if ((window as any).__loadDesignations) (window as any).__loadDesignations();
    } catch (e) {
      setDesigError(e instanceof ApiError ? e.message : `Could not ${editingDesigId ? 'update' : 'add'} designation.`);
    }
  }

  function startEditDesignation(d: any) {
    setDesigForm({ name: d.name || d.designationName || "", code: d.code || "", departmentId: d.departmentId || "" });
    setEditingDesigId(d.id || d.designationId || "");
    setDesigOpen(true);
  }

  async function deleteDesignation(id: string) {
    if (!confirm("Are you sure you want to delete this designation?")) return;
    try {
      await apiClient.delete(endpoints.masterData.detail("designations", id), headers);
      if ((window as any).__loadDesignations) (window as any).__loadDesignations();
    } catch (e) {
      alert("Could not delete designation.");
    }
  }

  async function mark(id: string, status: AttendanceStatus) {
    setStaff((s) => (s ? s.map((m) => (m.id === id ? { ...m, attendanceToday: status } : m)) : s));
    // Also optimistically update the attendance record if marking as absent/leave
    if (status === "ABSENT" || status === "ON_LEAVE" || status === "HALF_DAY") {
      setTodayAttendances(prev => ({
        ...prev,
        [id]: { staffId: id, status, checkInTime: null, checkOutTime: null }
      }));
    }
    
    try {
      await apiClient.post(
        endpoints.staff.markAttendance, 
        { staffId: id, status, date: new Date().toISOString().split("T")[0], hospitalId: activeHospitalId as string }, 
        headers
      );
      load();
    } catch {
      load();
    }
  }

  async function handleCheckIn(staffId: string) {
    setTodayAttendances(prev => ({
      ...prev,
      [staffId]: { staffId, status: "PRESENT", checkInTime: new Date().toISOString() }
    }));
    try {
      await apiClient.post(endpoints.staff.checkIn, { staffId, remarks: "" }, headers);
      load();
    } catch {
      load();
    }
  }

  async function handleCheckOut(staffId: string, attendanceId: string) {
    setTodayAttendances(prev => ({
      ...prev,
      [staffId]: { ...prev[staffId], checkOutTime: new Date().toISOString() }
    }));
    try {
      await apiClient.put(endpoints.staff.checkOut(attendanceId), { remarks: "" }, headers);
      load();
    } catch {
      load();
    }
  }

  return (
    <StaffLayout title="Staff & Attendance" subtitle="Directory and today's register" permission="staff:read">
      <AdminHospitalSelector />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <div className="mb-6 flex flex-col sm:flex-row gap-4 items-end bg-background/50 p-4 rounded-2xl border border-border/50">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-foreground/60 mb-1.5 block font-medium">Search Staff</label>
                    <input
                      type="text"
                      placeholder="Search by name, email or code..."
                      className={field}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-[180px]">
                    <label className="text-xs text-foreground/60 mb-1.5 block font-medium">Department</label>
                    <select className={field} value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                      <option value="">All Departments</option>
                      {departments.map((d: any) => (
                        <option key={d.id || d.departmentId} value={d.id || d.departmentId}>
                          {d.name || d.departmentName || d.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-[180px]">
                    <label className="text-xs text-foreground/60 mb-1.5 block font-medium">Designation</label>
                    <select className={field} value={designationFilter} onChange={(e) => setDesignationFilter(e.target.value)}>
                      <option value="">All Designations</option>
                      {designations.map((d: any) => (
                        <option key={d.id || d.designationId} value={d.id || d.designationId}>
                          {d.name || d.designationName || d.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-[160px]">
                    <label className="text-xs text-foreground/60 mb-1.5 block font-medium">Attendance Date</label>
                    <input
                      type="date"
                      className={field}
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                    />
                  </div>
                </div>

                {open && canWrite ? (
                  <div className="mb-5 grid gap-3 rounded-[1.25rem] bg-muted p-4 sm:grid-cols-3">
                    <label className="space-y-1.5 text-sm">
                      <span className="text-foreground/70">First name</span>
                      <input className={field} value={form.firstName} onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))} />
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="text-foreground/70">Last name</span>
                      <input className={field} value={form.lastName} onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))} />
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
                      <span className="text-foreground/70">Branch</span>
                      <select
                        className={field}
                        value={form.branchId}
                        onChange={(e) => setForm((s) => ({ ...s, branchId: e.target.value }))}
                      >
                        <option value="">Select a branch</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.branchName || b.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="text-foreground/70">Department</span>
                      <select
                        className={field}
                        value={form.departmentId}
                        onChange={(e) => setForm((s) => ({ ...s, departmentId: e.target.value }))}
                      >
                        <option value="">Select department</option>
                        {departments.map((d: any) => (
                          <option key={d.id || d.departmentId || Math.random()} value={d.id || d.departmentId}>
                            {d.name || d.departmentName || d.title || `Unnamed (${d.id || d.departmentId})`}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="text-foreground/70">Designation</span>
                      <select
                        className={field}
                        value={form.designationId}
                        onChange={(e) => setForm((s) => ({ ...s, designationId: e.target.value }))}
                      >
                        <option value="">Select designation</option>
                        {designations.map((d: any) => (
                          <option key={d.id || d.designationId || Math.random()} value={d.id || d.designationId}>
                            {d.name || d.designationName || d.title || `Unnamed (${d.id || d.designationId})`}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="text-foreground/70">System Role</span>
                      <select
                        className={field}
                        value={form.role}
                        onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
                      >
                        <option value="">Select role</option>
                        {Object.entries(roleLabels).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="text-foreground/70">Employee Code</span>
                      <input className={field} value={form.employeeCode} onChange={(e) => setForm((s) => ({ ...s, employeeCode: e.target.value }))} />
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="text-foreground/70">Joining date</span>
                      <input
                        className={field}
                        type="date"
                        value={form.joinDate}
                        onChange={(e) => setForm((s) => ({ ...s, joinDate: e.target.value }))}
                      />
                    </label>
                    <div className="sm:col-span-3 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={create}
                        className="rounded-full bg-forest px-6 py-2.5 text-sm text-primary-foreground"
                      >
                        {editingStaffId ? "Update staff member" : "Add staff member"}
                      </button>
                      {editingStaffId && (
                        <button
                          type="button"
                          onClick={() => { setEditingStaffId(null); setForm(blank); setOpen(false); }}
                          className="text-sm text-foreground/60 underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}

                {filteredStaff === null ? (
                  <Loading />
                ) : filteredStaff.length === 0 ? (
                  <EmptyState icon={<UserRound className="size-6" />} message="No staff found." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1020px] text-left text-sm">
                      <thead className="text-xs uppercase text-foreground/50">
                        <tr>
                          <th className="pb-3 pr-4">Member</th>
                          <th className="pb-3 pr-4">Dept / Desig</th>
                          <th className="pb-3 pr-4">Branch</th>
                          <th className="pb-3 pr-4">Code</th>
                          <th className="pb-3 pr-4">Present (30d)</th>
                          <th className="pb-3 pr-4">Attendance</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStaff.map((m) => (
                          <tr key={m.id} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                            <td className="py-4 pr-4">
                              <p className="font-medium text-forest text-[15px]">{m.firstName} {m.lastName}</p>
                              <p className="text-xs text-foreground/60 mt-0.5">{m.email}</p>
                            </td>
                            <td className="py-4 pr-4">
                              <p className="font-medium text-foreground/90">{m.departmentName || "—"}</p>
                              <p className="text-xs text-foreground/60 mt-0.5">{m.designationName || "—"}</p>
                            </td>
                            <td className="py-4 pr-4 text-foreground/80">{m.branchName || "—"}</td>
                            <td className="py-4 pr-4 font-mono text-xs text-foreground/70">{m.employeeCode || "—"}</td>
                            <td className="py-4 pr-4 text-foreground/80">
                              <span className="bg-muted px-2.5 py-1 rounded-md text-xs font-medium">
                                {m.presentDays30 ?? 0}/30
                              </span>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                  <div className="min-w-[90px]">
                                    {!todayAttendances[m.id] || todayAttendances[m.id].status !== "PRESENT" ? (
                                      <button
                                        type="button"
                                        disabled={!canWrite}
                                        onClick={() => handleCheckIn(m.id)}
                                        className="rounded-full bg-forest px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60 shadow-sm transition-all hover:bg-forest/90 active:scale-95"
                                      >
                                        Check In
                                      </button>
                                    ) : !todayAttendances[m.id].checkOutTime ? (
                                      <button
                                        type="button"
                                        disabled={!canWrite}
                                        onClick={() => handleCheckOut(m.id, todayAttendances[m.id].id)}
                                        className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-medium text-white disabled:opacity-60 shadow-sm transition-all hover:bg-amber-600 active:scale-95"
                                      >
                                        Check Out
                                      </button>
                                    ) : (
                                      <span className="rounded-full bg-muted border border-border/50 px-4 py-1.5 text-xs font-medium text-foreground/60 shadow-sm">
                                        Completed
                                      </span>
                                    )}
                                  </div>
                                  
                                  {canWrite && (
                                    <select
                                      className="text-[11px] border border-border rounded-md px-2 py-1.5 bg-background shadow-sm text-foreground/80 outline-none focus:border-forest transition-colors"
                                      value={todayAttendances[m.id]?.status || ""}
                                      onChange={(e) => mark(m.id, e.target.value as AttendanceStatus)}
                                    >
                                      <option value="" disabled>Mark Manual</option>
                                      {attendance.map(a => (
                                        <option key={a} value={a}>{a.replace("_", " ")}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                                
                                {todayAttendances[m.id] && (todayAttendances[m.id].checkInTime || todayAttendances[m.id].checkOutTime) && (
                                  <div className="text-[11px] text-foreground/60 bg-muted/50 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 w-fit font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-forest/70"></span>
                                    {formatTime(todayAttendances[m.id].checkInTime)} - {formatTime(todayAttendances[m.id].checkOutTime) || 'Now'}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              {canWrite && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button 
                                    onClick={() => startEdit(m)} 
                                    className="p-1.5 rounded-full text-foreground/50 hover:text-forest hover:bg-forest/10 transition-colors group"
                                    title="Edit Staff"
                                  >
                                    <Pencil className="size-4" />
                                  </button>
                                  <button 
                                    onClick={() => deleteStaff(m.id)} 
                                    className="p-1.5 rounded-full text-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors group"
                                    title="Delete Staff"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </div>

            <div className="mt-6">
              <Panel
                title="Departments"
                action={
                  canWrite ? (
                    <button
                      type="button"
                      onClick={() => setDeptOpen((v) => !v)}
                      className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm text-primary-foreground"
                    >
                      {deptOpen ? <X className="size-4" /> : <Plus className="size-4" />}
                      {deptOpen ? "Close" : "Add department"}
                    </button>
                  ) : null
                }
              >
                {deptOpen && canWrite ? (
                  <div className="mb-5 grid gap-3 rounded-[1.25rem] bg-muted p-4 sm:grid-cols-3">
                    <label className="space-y-1.5 text-sm">
                      <span className="text-foreground/70">Department Name</span>
                      <input 
                        className={field} 
                        value={deptForm.name} 
                        onChange={(e) => setDeptForm((s) => ({ ...s, name: e.target.value }))} 
                        placeholder="e.g. Surgery"
                      />
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="text-foreground/70">Department Code</span>
                      <input 
                        className={field} 
                        value={deptForm.code} 
                        onChange={(e) => setDeptForm((s) => ({ ...s, code: e.target.value }))} 
                        placeholder="e.g. SUR"
                      />
                    </label>
                    <div className="flex items-end pb-[2px] gap-2">
                      <button
                        type="button"
                        onClick={createDepartment}
                        className="rounded-full bg-forest px-6 py-2.5 text-sm text-primary-foreground"
                      >
                        {editingDeptId ? "Update" : "Save"}
                      </button>
                      {editingDeptId && (
                        <button
                          type="button"
                          onClick={() => { setEditingDeptId(null); setDeptForm({ name: "", code: "" }); setDeptOpen(false); }}
                          className="text-sm text-foreground/60 underline pb-3"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    {deptError ? <p className="col-span-3 text-sm text-destructive">{deptError}</p> : null}
                  </div>
                ) : null}

                {departments.length === 0 ? (
                  <EmptyState message="No departments added yet." />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {departments.map((d: any) => (
                      <div key={d.id || d.departmentId || Math.random()} className="group flex items-center gap-2 rounded-full border border-border pl-4 pr-2 py-1.5 text-sm bg-background">
                        <span>{d.name || d.departmentName || d.title || `Unnamed (${d.id || d.departmentId})`}</span>
                        {canWrite && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEditDepartment(d)} className="p-1 hover:text-forest hover:bg-forest/10 rounded-full text-foreground/60">
                              <Pencil className="size-3" />
                            </button>
                            <button onClick={() => deleteDepartment(d.id || d.departmentId)} className="p-1 hover:text-destructive hover:bg-destructive/10 rounded-full text-foreground/60">
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            <div className="mt-6">
              <Panel
                title="Designations"
                action={
                  canWrite ? (
                    <button
                      type="button"
                      onClick={() => setDesigOpen((v) => !v)}
                      className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm text-primary-foreground"
                    >
                      {desigOpen ? <X className="size-4" /> : <Plus className="size-4" />}
                      {desigOpen ? "Close" : "Add designation"}
                    </button>
                  ) : null
                }
              >
                {desigOpen && canWrite ? (
                  <div className="mb-5 grid gap-3 rounded-[1.25rem] bg-muted p-4 sm:grid-cols-4">
                    <label className="space-y-1.5 text-sm">
                      <span className="text-foreground/70">Name</span>
                      <input 
                        className={field} 
                        value={desigForm.name} 
                        onChange={(e) => setDesigForm((s) => ({ ...s, name: e.target.value }))} 
                        placeholder="e.g. Surgeon"
                      />
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="text-foreground/70">Code</span>
                      <input 
                        className={field} 
                        value={desigForm.code} 
                        onChange={(e) => setDesigForm((s) => ({ ...s, code: e.target.value }))} 
                        placeholder="e.g. SRG"
                      />
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="text-foreground/70">Department</span>
                      <select 
                        className={field} 
                        value={desigForm.departmentId} 
                        onChange={(e) => setDesigForm((s) => ({ ...s, departmentId: e.target.value }))}
                      >
                        <option value="">Select department</option>
                        {departments.map((d: any) => (
                          <option key={d.id || d.departmentId || Math.random()} value={d.id || d.departmentId}>
                            {d.name || d.departmentName || d.title || `Unnamed (${d.id || d.departmentId})`}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-end pb-[2px] gap-2">
                      <button
                        type="button"
                        onClick={createDesignation}
                        className="rounded-full bg-forest px-6 py-2.5 text-sm text-primary-foreground"
                      >
                        {editingDesigId ? "Update" : "Save"}
                      </button>
                      {editingDesigId && (
                        <button
                          type="button"
                          onClick={() => { setEditingDesigId(null); setDesigForm({ name: "", code: "", departmentId: "" }); setDesigOpen(false); }}
                          className="text-sm text-foreground/60 underline pb-3"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    {desigError ? <p className="col-span-4 text-sm text-destructive">{desigError}</p> : null}
                  </div>
                ) : null}

                {designations.length === 0 ? (
                  <EmptyState message="No designations added yet." />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {designations.map((d: any) => (
                      <div key={d.id || d.designationId || Math.random()} className="group flex items-center gap-2 rounded-full border border-border pl-4 pr-2 py-1.5 text-sm bg-background">
                        <span>{d.name || d.designationName || d.title || `Unnamed (${d.id || d.designationId})`}</span>
                        {canWrite && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEditDesignation(d)} className="p-1 hover:text-forest hover:bg-forest/10 rounded-full text-foreground/60">
                              <Pencil className="size-3" />
                            </button>
                            <button onClick={() => deleteDesignation(d.id || d.designationId)} className="p-1 hover:text-destructive hover:bg-destructive/10 rounded-full text-foreground/60">
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
      </div>
    </StaffLayout>
  );
}


