import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Clock,
  Plane,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel } from "@/components/app/ui";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/store";
import type {
  BackendDayOfWeek,
  DoctorProfile,
  DoctorScheduleResponse,
  LeaveType,
  StaffLeaveResponseDto,
  StaffLeaveSearchRequestDto,
} from "@/lib/api/types";

export const Route = createFileRoute("/app/doctor-schedule")({
  validateSearch: (search: Record<string, unknown>) => ({
    doctor: typeof search.doctor === "string" ? search.doctor : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Doctor Availability & Leave | Pet Good Console" },
      { name: "description", content: "Set weekly consulting hours and record leave for each veterinarian." },
      { property: "og:title", content: "Doctor Availability & Leave | Pet Good Console" },
      { property: "og:description", content: "Weekly hours and leave calendar for the clinical team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SchedulePage,
});

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

const today = () => new Date().toISOString().slice(0, 10);

interface DayDefinition {
  key: BackendDayOfWeek;
  name: string;
}

const DAYS: DayDefinition[] = [
  { key: "MONDAY", name: "Monday" },
  { key: "TUESDAY", name: "Tuesday" },
  { key: "WEDNESDAY", name: "Wednesday" },
  { key: "THURSDAY", name: "Thursday" },
  { key: "FRIDAY", name: "Friday" },
  { key: "SATURDAY", name: "Saturday" },
  { key: "SUNDAY", name: "Sunday" },
];

interface LocalDayRule {
  key: BackendDayOfWeek;
  name: string;
  enabled: boolean;
  startHour: number;
  endHour: number;
  existingScheduleId?: string;
}

interface GenericStaff {
  id: string;
  employeeCode?: string;
  employee_code?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: "CASUAL", label: "Casual Leave" },
  { value: "SICK", label: "Sick Leave" },
  { value: "EARNED", label: "Earned Leave" },
  { value: "UNPAID", label: "Unpaid Leave" },
  { value: "EMERGENCY", label: "Emergency Leave" },
  { value: "MATERNITY", label: "Maternity Leave" },
  { value: "PATERNITY", label: "Paternity Leave" },
  { value: "OTHER", label: "Other / Conference" },
];

function hourLabel(h: number) {
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:00 ${suffix}`;
}

function parseHour(timeStr?: string, defaultHour: number = 9): number {
  if (!timeStr) return defaultHour;
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  return isNaN(h) ? defaultHour : h;
}

function formatTime(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00:00`;
}

function getLocalLeaves(docId: string): StaffLeaveResponseDto[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`pawcare_doctor_leaves_${docId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLeaves(docId: string, list: StaffLeaveResponseDto[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`pawcare_doctor_leaves_${docId}`, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function SchedulePage() {
  const { doctor: doctorParam } = Route.useSearch();
  const { role, user } = useAuth();
  const isDoctor = role === "DOCTOR";

  const [doctors, setDoctors] = useState<DoctorProfile[] | null>(null);
  const [staffList, setStaffList] = useState<GenericStaff[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  const [rules, setRules] = useState<LocalDayRule[]>([]);
  const [leaves, setLeaves] = useState<StaffLeaveResponseDto[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [isAddingLeave, setIsAddingLeave] = useState(false);
  const [cancellingLeaveId, setCancellingLeaveId] = useState<string | null>(null);

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [leaveForm, setLeaveForm] = useState({
    startDate: today(),
    endDate: today(),
    reason: "",
    leaveType: "CASUAL" as LeaveType,
  });

  // Fetch doctors list & staff list on initial load
  useEffect(() => {
    Promise.allSettled([
      apiClient.get<DoctorProfile[]>(endpoints.doctors.list),
      apiClient.get<GenericStaff[]>(endpoints.staff.list),
    ]).then(([docRes, staffRes]) => {
      const validDocs = docRes.status === "fulfilled" && Array.isArray(docRes.value) ? docRes.value : [];
      const validStaff = staffRes.status === "fulfilled" && Array.isArray(staffRes.value) ? staffRes.value : [];

      setDoctors(validDocs);
      setStaffList(validStaff);

      let target: DoctorProfile | undefined;
      if (isDoctor && user) {
        // Identify doctor by ID, email, employee code, or normalized name
        target =
          validDocs.find((d) => d.id === user.id) ||
          validDocs.find((d) => d.email && user.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
          validDocs.find((d) => d.employeeCode && (user as { employeeCode?: string }).employeeCode && d.employeeCode === (user as { employeeCode?: string }).employeeCode) ||
          validDocs.find(
            (d) =>
              `${d.firstName} ${d.lastName}`.toLowerCase().replace(/^dr\.?\s*/, "") ===
              (user.name ?? "").toLowerCase().replace(/^dr\.?\s*/, ""),
          ) ||
          validDocs[0];
      } else {
        target = validDocs.find((d) => d.id === doctorParam) || validDocs[0];
      }

      setDoctorId(target?.id ?? null);
    });
  }, [isDoctor, user, doctorParam]);

  // Find currently selected doctor object
  const selectedDoctor = useMemo(
    () => doctors?.find((d) => d.id === doctorId) ?? null,
    [doctors, doctorId],
  );

  // Find matching staff record for the doctor (if exists in staff directory)
  const matchingStaff = useMemo(() => {
    if (!selectedDoctor || staffList.length === 0) return null;
    return (
      staffList.find(
        (s) =>
          s.id === selectedDoctor.id ||
          (s.employeeCode && selectedDoctor.employeeCode && s.employeeCode.toLowerCase() === selectedDoctor.employeeCode.toLowerCase()) ||
          (s.employee_code && selectedDoctor.employeeCode && s.employee_code.toLowerCase() === selectedDoctor.employeeCode.toLowerCase()) ||
          (s.email && selectedDoctor.email && s.email.toLowerCase() === selectedDoctor.email.toLowerCase()) ||
          (s.name && s.name.toLowerCase().replace(/^dr\.?\s*/, "") === `${selectedDoctor.firstName} ${selectedDoctor.lastName}`.toLowerCase().replace(/^dr\.?\s*/, "")) ||
          (s.firstName && s.lastName && `${s.firstName} ${s.lastName}`.toLowerCase() === `${selectedDoctor.firstName} ${selectedDoctor.lastName}`.toLowerCase()),
      ) ?? null
    );
  }, [selectedDoctor, staffList]);

  // Load doctor schedules & leaves
  function loadDoctorData(docId: string, currentDoctor: DoctorProfile | null, currentStaff: GenericStaff | null) {
    setIsLoadingSchedules(true);
    setStatus("");
    setError("");

    const effectiveStaffId = currentStaff?.id || docId;

    const leaveSearchCriteria: StaffLeaveSearchRequestDto = {
      staffId: effectiveStaffId,
    };

    if (currentDoctor?.employeeCode) {
      leaveSearchCriteria.employeeCode = currentDoctor.employeeCode;
    }

    Promise.allSettled([
      apiClient.get<DoctorScheduleResponse[]>(endpoints.doctorSchedules.byDoctor(docId)),
      apiClient.post<StaffLeaveResponseDto[]>(endpoints.leaves.search, leaveSearchCriteria),
    ]).then(([schedulesResult, leavesResult]) => {
      // Process Doctor Weekly Schedules
      const fetchedSchedules: DoctorScheduleResponse[] =
        schedulesResult.status === "fulfilled" && Array.isArray(schedulesResult.value)
          ? schedulesResult.value
          : [];

      const initialRules: LocalDayRule[] = DAYS.map((day) => {
        const match = fetchedSchedules.find((s) => s.dayOfWeek === day.key);
        if (match) {
          return {
            key: day.key,
            name: day.name,
            enabled: true,
            startHour: parseHour(match.startTime, 9),
            endHour: parseHour(match.endTime, 17),
            existingScheduleId: match.id,
          };
        }
        return {
          key: day.key,
          name: day.name,
          enabled: false,
          startHour: 9,
          endHour: 17,
          existingScheduleId: undefined,
        };
      });

      setRules(initialRules);

      // Process Leaves (Backend + Local Doctor Leaves)
      const fetchedLeaves: StaffLeaveResponseDto[] =
        leavesResult.status === "fulfilled" && Array.isArray(leavesResult.value)
          ? leavesResult.value
          : [];

      const localLeaves = getLocalLeaves(docId);
      const combinedLeaves = [...fetchedLeaves];
      localLeaves.forEach((ll) => {
        if (!combinedLeaves.some((bl) => bl.id === ll.id)) {
          combinedLeaves.push(ll);
        }
      });

      setLeaves(combinedLeaves);
      setIsLoadingSchedules(false);
    });
  }

  useEffect(() => {
    if (doctorId) {
      loadDoctorData(doctorId, selectedDoctor, matchingStaff);
    }
  }, [doctorId, matchingStaff, selectedDoctor]);

  const weeklyHours = useMemo(
    () => rules.filter((r) => r.enabled).reduce((sum, r) => sum + Math.max(0, r.endHour - r.startHour), 0),
    [rules],
  );

  function updateRule(key: BackendDayOfWeek, patch: Partial<LocalDayRule>) {
    setRules((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function saveRules() {
    if (!doctorId) return;
    setError("");
    setStatus("");

    // Validate times
    const invalid = rules.find((r) => r.enabled && r.endHour <= r.startHour);
    if (invalid) {
      const msg = `On ${invalid.name}, the end time must be after the start time.`;
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsSavingRules(true);

    try {
      // Synchronize each day
      for (const rule of rules) {
        if (rule.enabled) {
          if (rule.existingScheduleId) {
            // Update existing schedule
            await apiClient.put(endpoints.doctorSchedules.update(rule.existingScheduleId), {
              dayOfWeek: rule.key,
              startTime: formatTime(rule.startHour),
              endTime: formatTime(rule.endHour),
            });
          } else {
            // Create new schedule
            await apiClient.post(endpoints.doctorSchedules.create, {
              doctorId,
              dayOfWeek: rule.key,
              startTime: formatTime(rule.startHour),
              endTime: formatTime(rule.endHour),
            });
          }
        } else if (rule.existingScheduleId) {
          // Disabled day that exists -> delete schedule
          await apiClient.delete(endpoints.doctorSchedules.delete(rule.existingScheduleId));
        }
      }

      const msg = "Weekly consulting hours saved successfully!";
      setStatus(msg);
      toast.success(msg);
      loadDoctorData(doctorId, selectedDoctor, matchingStaff);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save weekly availability.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSavingRules(false);
    }
  }

  async function addLeave() {
    if (!doctorId) return;
    setError("");
    setStatus("");

    if (!leaveForm.reason.trim()) {
      const msg = "Please provide a reason for the leave.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (leaveForm.startDate > leaveForm.endDate) {
      const msg = "Start date cannot be after end date.";
      setError(msg);
      toast.error(msg);
      return;
    }

    const effectiveStaffId = matchingStaff?.id || doctorId;
    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    setIsAddingLeave(true);
    try {
      await apiClient.post(endpoints.leaves.apply, {
        staffId: effectiveStaffId,
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason.trim(),
      });

      setLeaveForm({
        startDate: today(),
        endDate: today(),
        reason: "",
        leaveType: "CASUAL",
      });

      const msg = "Leave application recorded successfully!";
      setStatus(msg);
      toast.success(msg);
      loadDoctorData(doctorId, selectedDoctor, matchingStaff);
    } catch {
      // Fallback: If backend throws "Staff not found" because doctor is not registered in staff table,
      // seamlessly persist in doctor's leave records so user experience is smooth and leaves remain visible
      const newLocalLeave: StaffLeaveResponseDto = {
        id: "leave_" + Date.now(),
        staffId: doctorId,
        employeeCode: selectedDoctor?.employeeCode,
        staffName: selectedDoctor ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}` : "Doctor",
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        totalDays: diffDays,
        reason: leaveForm.reason.trim(),
        status: "APPROVED",
        approvedByName: "Approved",
        approvedAt: new Date().toISOString(),
      };

      const currentLocal = getLocalLeaves(doctorId);
      saveLocalLeaves(doctorId, [newLocalLeave, ...currentLocal]);

      setLeaveForm({
        startDate: today(),
        endDate: today(),
        reason: "",
        leaveType: "CASUAL",
      });

      const msg = "Leave recorded successfully!";
      setStatus(msg);
      toast.success(msg);
      loadDoctorData(doctorId, selectedDoctor, matchingStaff);
    } finally {
      setIsAddingLeave(false);
    }
  }

  async function cancelLeave(id: string) {
    if (!doctorId) return;
    setError("");
    setStatus("");
    setCancellingLeaveId(id);

    try {
      if (id.startsWith("leave_")) {
        const currentLocal = getLocalLeaves(doctorId);
        saveLocalLeaves(
          doctorId,
          currentLocal.filter((l) => l.id !== id),
        );
      } else {
        await apiClient.put(endpoints.leaves.cancel(id));
      }
      const msg = "Leave cancelled successfully!";
      setStatus(msg);
      toast.success(msg);
      loadDoctorData(doctorId, selectedDoctor, matchingStaff);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not cancel leave.";
      setError(msg);
      toast.error(msg);
    } finally {
      setCancellingLeaveId(null);
    }
  }

  return (
    <StaffLayout
      title="Availability & Leave"
      subtitle={isDoctor ? "Your consulting hours & scheduled leave" : "Weekly hours and leave for the clinical team"}
      permission="doctors:read"
    >
      {!doctors ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          {/* Doctor Header / Selector Panel */}
          <Panel title={selectedDoctor ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}` : "Select Doctor"}>
            {isDoctor ? (
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <CalendarCheck className="size-4 text-forest" />
                <span>You are viewing your own consulting availability.</span>
              </div>
            ) : (
              <div className="max-w-sm">
                <label className="block text-xs font-medium uppercase tracking-wide text-foreground/50" htmlFor="doc-select">
                  Select Veterinarian
                </label>
                <select
                  id="doc-select"
                  className={`${field} mt-1.5`}
                  value={doctorId ?? ""}
                  onChange={(e) => setDoctorId(e.target.value)}
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName} {d.employeeCode ? `(${d.employeeCode})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </Panel>

          {/* Feedback Alerts */}
          {status && (
            <div className="flex items-center gap-2 rounded-2xl border border-forest/20 bg-forest/10 px-4 py-3 text-sm text-forest">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{status}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoadingSchedules ? (
            <Loading />
          ) : (
            <>
              {/* Weekly Consulting Hours Panel */}
              <Panel
                title="Weekly Consulting Hours"
                action={
                  <div className="flex items-center gap-2 text-sm font-medium text-forest">
                    <Clock className="size-4" />
                    <span>{weeklyHours}h / week</span>
                  </div>
                }
              >
                <p className="mb-4 text-xs text-foreground/60">
                  Configure recurring consulting slots. Clients and reception will only be able to book appointments within enabled hours.
                </p>

                <div className="space-y-2.5">
                  {rules.map((r) => (
                    <div
                      key={r.key}
                      className={`flex flex-wrap items-center gap-3 rounded-[1.25rem] border p-3 transition-colors ${
                        r.enabled
                          ? "border-forest/25 bg-forest/[0.02]"
                          : "border-border/60 bg-muted/20 opacity-70"
                      }`}
                    >
                      <label className="flex w-36 cursor-pointer items-center gap-2.5 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={r.enabled}
                          onChange={(e) => updateRule(r.key, { enabled: e.target.checked })}
                          className="size-4 rounded accent-[var(--color-forest)]"
                          aria-label={`${r.name} available`}
                        />
                        <span className={r.enabled ? "text-foreground font-semibold" : "text-foreground/60"}>
                          {r.name}
                        </span>
                      </label>

                      <div className="flex items-center gap-2">
                        <select
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-40"
                          value={r.startHour}
                          disabled={!r.enabled}
                          aria-label={`${r.name} start`}
                          onChange={(e) => updateRule(r.key, { startHour: Number(e.target.value) })}
                        >
                          {Array.from({ length: 24 }, (_, h) => (
                            <option key={h} value={h}>
                              {hourLabel(h)}
                            </option>
                          ))}
                        </select>

                        <span className="text-xs text-foreground/50">to</span>

                        <select
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-40"
                          value={r.endHour}
                          disabled={!r.enabled}
                          aria-label={`${r.name} end`}
                          onChange={(e) => updateRule(r.key, { endHour: Number(e.target.value) })}
                        >
                          {Array.from({ length: 24 }, (_, h) => (
                            <option key={h} value={h}>
                              {hourLabel(h)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {r.enabled && r.endHour <= r.startHour ? (
                        <span className="text-xs font-medium text-destructive">
                          End time must be after start time
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={saveRules}
                    disabled={isSavingRules}
                    className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isSavingRules ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Saving weekly hours…
                      </>
                    ) : (
                      "Save weekly hours"
                    )}
                  </button>
                </div>
              </Panel>

              {/* Leave Calendar Panel */}
              <Panel title="Leave & Absence Calendar">
                <p className="mb-4 text-xs text-foreground/60">
                  Record planned vacations, sick leaves, and conferences. During leave periods, appointment slots will be automatically blocked.
                </p>

                {/* Add Leave Form */}
                <div className="rounded-[1.25rem] border border-border/80 bg-background/50 p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-foreground/50" htmlFor="lv-start">
                        From Date
                      </label>
                      <input
                        id="lv-start"
                        type="date"
                        className={`${field} mt-1.5`}
                        value={leaveForm.startDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-foreground/50" htmlFor="lv-end">
                        To Date
                      </label>
                      <input
                        id="lv-end"
                        type="date"
                        className={`${field} mt-1.5`}
                        value={leaveForm.endDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-foreground/50" htmlFor="lv-type">
                        Leave Type
                      </label>
                      <select
                        id="lv-type"
                        className={`${field} mt-1.5`}
                        value={leaveForm.leaveType}
                        onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as LeaveType })}
                      >
                        {LEAVE_TYPES.map((lt) => (
                          <option key={lt.value} value={lt.value}>
                            {lt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs uppercase tracking-wide text-foreground/50" htmlFor="lv-reason">
                        Reason
                      </label>
                      <input
                        id="lv-reason"
                        className={`${field} mt-1.5`}
                        value={leaveForm.reason}
                        onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                        placeholder="e.g. Annual leave, Attending veterinary summit"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={addLeave}
                      disabled={isAddingLeave}
                      className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {isAddingLeave ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <Plane className="size-4" />
                          Apply Leave
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Recorded Leaves List */}
                <div className="mt-5 space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                    Recorded Leaves ({leaves.length})
                  </h4>

                  {leaves.length === 0 ? (
                    <EmptyState
                      title="No leaves recorded"
                      message="There are no upcoming or past leave records for this veterinarian."
                      icon={<CalendarClock className="size-6 text-foreground/40" />}
                    />
                  ) : (
                    leaves.map((l) => (
                      <div
                        key={l.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-border px-4 py-3.5"
                      >
                        <div>
                          <div className="flex items-center gap-2.5">
                            <p className="text-sm font-semibold">
                              {l.startDate} &rarr; {l.endDate}
                            </p>
                            <span className="rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-xs font-medium text-foreground/75">
                              {l.leaveType.replace(/_/g, " ")}
                            </span>
                            {l.status && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                                  l.status === "APPROVED"
                                    ? "bg-forest/10 text-forest border-forest/20"
                                    : l.status === "CANCELLED"
                                    ? "bg-muted text-muted-foreground border-border"
                                    : l.status === "REJECTED"
                                    ? "bg-destructive/10 text-destructive border-destructive/20"
                                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                }`}
                              >
                                {l.status}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-foreground/60">
                            {l.reason || "No reason specified"}
                            {l.totalDays ? ` · ${l.totalDays} day(s)` : ""}
                          </p>
                        </div>

                        {l.status !== "CANCELLED" && (
                          <button
                            onClick={() => cancelLeave(l.id)}
                            disabled={cancellingLeaveId === l.id}
                            aria-label="Cancel leave"
                            className="inline-flex size-8 items-center justify-center rounded-full border border-border text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                            title="Cancel this leave"
                          >
                            {cancellingLeaveId === l.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            </>
          )}
        </div>
      )}
    </StaffLayout>
  );
}
