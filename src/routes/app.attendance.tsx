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

export const Route = createFileRoute("/app/attendance")({
  head: () => ({
    meta: [
      { title: "Staff Attendance | Pet Good Console" },
      { name: "description", content: "Staff directory with roles, branches and daily attendance marking." },
      { property: "og:title", content: "Staff Attendance | Pet Good Console" },
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


  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


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
    <StaffLayout title="Staff Attendance" subtitle="Directory and today's register" permission="staff:read">
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
                title="Attendance Register"
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
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStaff.map((m) => (
                          <tr key={m.id} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="font-medium text-forest text-[15px]">{m.firstName} {m.lastName}</p>
                                  <p className="text-xs text-foreground/60 mt-0.5">{m.email}</p>
                                </div>
                                {m.userStatus === 'PENDING' && (
                                  <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    Pending Verification
                                  </span>
                                )}
                              </div>
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
                                  {m.userStatus !== 'PENDING' ? (
                                    <>
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
                                    </>
                                  ) : (
                                    <span className="text-xs text-foreground/50 italic">Must verify account</span>
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

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </div>


      </div>
    </StaffLayout>
  );
}


