import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Dog,
  FileText,
  FlaskConical,
  History,
  Lock,
  Pill,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
} from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { AdminHospitalSelector } from "@/components/app/AdminHospitalSelector";

import { EmptyState, Loading, Panel, StatCard, formatDate } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/kit/StatusBadge";
import { SpeciesName, BreedName } from "@/components/app/MasterData";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/store";
import type {
  Appointment,
  Consultation,
  ConsultationVitals,
  DiagnosisItem,
  DiagnosisSeverity,
  LabOrderDto,
  LabPriority,
  MedicalEvent,
  Pet,
} from "@/lib/api/types";
import { toast } from "sonner";

export const Route = createFileRoute("/app/consultations")({
  head: () => ({
    meta: [
      { title: "Consultation Editor | Pet Good Console" },
      { name: "description", content: "Record structured SOAP consultation notes, vitals, diagnoses and treatments for checked-in patients." },
      { property: "og:title", content: "Consultation Editor | Pet Good Console" },
      { property: "og:description", content: "Subjective, objective, assessment and plan notes per visit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConsultationsPage,
});

const field = "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest transition-colors";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-foreground/60";

const sections = [
  {
    key: "subjective",
    title: "S — Subjective",
    badge: "History",
    hint: "Owner's report: chief complaints, onset, behavioral changes, diet and home environment.",
    placeholder: "e.g. Pet presented with 3-day history of lethargy, reduced appetite and intermittent coughing...",
  },
  {
    key: "objective",
    title: "O — Objective",
    badge: "Exam & Vitals",
    hint: "Physical examination findings, mucous membranes, thoracic auscultation, abdominal palpation.",
    placeholder: "e.g. Alert, responsive. CRT < 2s. Mild bilateral ocular discharge. Lungs clear bilaterally...",
  },
  {
    key: "assessment",
    title: "A — Assessment",
    badge: "Diagnosis",
    hint: "Clinical diagnosis, differential diagnosis list, severity and health status.",
    placeholder: "e.g. Suspected acute upper respiratory tract infection (URI); rule out canine infectious tracheobronchitis...",
  },
  {
    key: "plan",
    title: "P — Plan",
    badge: "Treatment",
    hint: "Therapeutic interventions, medication regimen, dietary advice, client counseling and lab orders.",
    placeholder: "e.g. Prescribe course of supportive oral antibiotics and mucolytics. Rest for 7 days. Follow up in 5 days...",
  },
] as const;

type SoapKey = (typeof sections)[number]["key"];
const emptySoap: Record<SoapKey, string> = { subjective: "", objective: "", assessment: "", plan: "" };

const severityColors: Record<DiagnosisSeverity, string> = {
  Mild: "bg-forest/10 text-forest border-forest/20",
  Moderate: "bg-clay/15 text-clay border-clay/30",
  Severe: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Critical: "bg-destructive/15 text-destructive border-destructive/30",
};

const COMMON_LAB_TESTS = [
  { id: "lab_cbc", name: "Complete Blood Count (CBC)" },
  { id: "lab_biochem", name: "Serum Biochemistry 12-Panel" },
  { id: "lab_urinalysis", name: "Complete Urinalysis" },
  { id: "lab_fecal", name: "Fecal Parasite Screen" },
  { id: "lab_xray", name: "Thoracic Radiography (2-View)" },
  { id: "lab_skin", name: "Skin Scraping & Cytology" },
];

function ConsultationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [past, setPast] = useState<Consultation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePet, setActivePet] = useState<Pet | null>(null);
  const [petHistory, setPetHistory] = useState<MedicalEvent[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Form State
  const [soap, setSoap] = useState(emptySoap);
  const [vitals, setVitals] = useState<ConsultationVitals>({
    temperatureC: "",
    weightKg: "",
    heartRate: "",
    respRate: "",
  });
  const [followUpDate, setFollowUpDate] = useState("");
  const [diagnoses, setDiagnoses] = useState<DiagnosisItem[]>([]);
  const [diagInput, setDiagInput] = useState({ name: "", severity: "Moderate" as DiagnosisSeverity, description: "" });
  const [labOrders, setLabOrders] = useState<Array<{ testName: string; priority: LabPriority; notes: string }>>([]);
  const [labInput, setLabInput] = useState({ testName: COMMON_LAB_TESTS[0].name, priority: "NORMAL" as LabPriority, notes: "" });

  const [searchFilter, setSearchFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSavedConsultation, setLastSavedConsultation] = useState<{ id: string; petName: string; petId: string } | null>(null);

  const [queueTab, setQueueTab] = useState<"pending" | "completed" | "all">("pending");
  const [editingConsultationId, setEditingConsultationId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    Promise.all([
      apiClient.get<any[]>(endpoints.appointments.queue).catch(() => []),
      apiClient.get<Appointment[]>(endpoints.appointments.list).catch(() => []),
      apiClient.get<Consultation[]>(endpoints.consultations.list).catch(() => []),
    ]).then(([queueItems, apptList, consultList]) => {
      const queueList = queueItems ?? [];
      const appointmentsRaw = apptList ?? [];

      // Filter appointments to today or active queue statuses
      const todayISO = new Date().toISOString().split("T")[0];
      const todayAppointments = appointmentsRaw.filter((a) => {
        const d = a.scheduledAt ? a.scheduledAt.split("T")[0] : a.appointmentDate;
        return !d || d === todayISO || ["CHECKED_IN", "IN_PROGRESS"].includes(a.status);
      });

      // Map queue items by appointmentId or queue id
      const queueByApptId = new Map<string, any>();
      queueList.forEach((q: any) => {
        if (q.appointmentId) queueByApptId.set(String(q.appointmentId), q);
        if (q.id) queueByApptId.set(String(q.id), q);
      });

      // Helper to map queue status to standard Appointment status
      const mapQueueStatus = (qStatus?: string, fallback: Appointment["status"] = "CHECKED_IN"): Appointment["status"] => {
        if (!qStatus) return fallback;
        if (qStatus === "CALLED" || qStatus === "IN_PROGRESS") return "IN_PROGRESS";
        if (qStatus === "COMPLETED") return "COMPLETED";
        if (qStatus === "WAITING" || qStatus === "CHECKED_IN") return "CHECKED_IN";
        if (qStatus === "SKIPPED") return "SCHEDULED";
        if (qStatus === "NO_SHOW") return "NO_SHOW";
        if (qStatus === "CANCELLED") return "CANCELLED";
        return fallback;
      };

      const combined: Appointment[] = [];
      const seenApptIds = new Set<string>();

      // 1. Process today's appointments, enriching with live queue status & tokenNumber
      todayAppointments.forEach((a) => {
        const apptId = String(a.id);
        seenApptIds.add(apptId);
        const q = queueByApptId.get(apptId);

        if (q) {
          combined.push({
            ...a,
            status: mapQueueStatus(q.status, a.status),
            tokenNumber: q.tokenNumber ?? a.tokenNumber,
            doctorId: a.doctorId || q.doctorId,
            doctorName: a.doctorName || q.doctorName,
            petId: a.petId || q.petId,
            petName: a.petName || q.petName,
            ownerId: a.ownerId || q.ownerId,
            ownerName: a.ownerName || q.ownerName,
          });
        } else {
          combined.push(a);
        }
      });

      // 2. Add any active queue items not already present in todayAppointments
      queueList.forEach((q: any) => {
        const apptId = String(q.appointmentId || q.id || "");
        if (apptId && !seenApptIds.has(apptId)) {
          seenApptIds.add(apptId);
          combined.push({
            id: apptId,
            appointmentNumber: q.appointmentNumber || "",
            petId: q.petId || "",
            petName: q.petName || "Patient",
            ownerId: q.ownerId || "",
            ownerName: q.ownerName || "Owner",
            doctorId: q.doctorId || "",
            doctorName: q.doctorName || "Doctor",
            tokenNumber: q.tokenNumber ?? null,
            status: mapQueueStatus(q.status, "CHECKED_IN"),
            service: q.service || "Consultation",
            scheduledAt: q.checkInTime || q.scheduledAt || new Date().toISOString(),
            appointmentDate: q.appointmentDate || new Date().toISOString().split("T")[0],
            startTime: q.startTime || "09:00",
            endTime: q.endTime || "09:30",
            notes: q.remarks || q.notes || "",
          });
        }
      });

      setAppointments(combined);
      setPast(consultList ?? []);
    });
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Map consultations by appointment ID
  const consultByApptId = useMemo(() => {
    const map = new Map<string, Consultation>();
    past.forEach((c) => {
      if (c.appointmentId) {
        map.set(c.appointmentId, c);
      }
    });
    return map;
  }, [past]);

  const allRelevantAppointments = useMemo(() => {
    return (appointments ?? []).filter((a) => ["CHECKED_IN", "IN_PROGRESS", "COMPLETED"].includes(a.status));
  }, [appointments]);

  const eligible = useMemo(() => {
    if (queueTab === "pending") {
      return allRelevantAppointments.filter(
        (a) => ["CHECKED_IN", "IN_PROGRESS"].includes(a.status) && !consultByApptId.has(a.id)
      );
    }
    if (queueTab === "completed") {
      return allRelevantAppointments.filter(
        (a) => a.status === "COMPLETED" || consultByApptId.has(a.id)
      );
    }
    return allRelevantAppointments;
  }, [allRelevantAppointments, queueTab, consultByApptId]);

  const selected = useMemo(() => {
    return allRelevantAppointments.find((a) => a.id === selectedId) ?? null;
  }, [allRelevantAppointments, selectedId]);

  // When patient selection changes, load existing consultation or initialize fresh form
  const handleSelectAppointment = useCallback(
    (appt: Appointment) => {
      setSelectedId(appt.id);
      setLastSavedConsultation(null);

      const existing = consultByApptId.get(appt.id);
      if (existing) {
        setEditingConsultationId(existing.id);
        setSoap({
          subjective: existing.subjective || "",
          objective: existing.objective || "",
          assessment: existing.assessment || "",
          plan: existing.plan || "",
        });
        setVitals(
          existing.vitals || {
            temperatureC: "",
            weightKg: "",
            heartRate: "",
            respRate: "",
          }
        );
        setFollowUpDate(existing.followUpDate ? String(existing.followUpDate).slice(0, 10) : "");
        setDiagnoses([]);
        setLabOrders([]);
      } else {
        setEditingConsultationId(null);
        setSoap(emptySoap);
        setVitals({
          temperatureC: "",
          weightKg: "",
          heartRate: "",
          respRate: "",
        });
        setFollowUpDate("");
        setDiagnoses([]);
        setLabOrders([]);
      }
    },
    [consultByApptId]
  );

  // Load detailed pet context when an appointment is selected
  useEffect(() => {
    if (!selected?.petId) {
      setActivePet(null);
      setPetHistory([]);
      return;
    }

    let active = true;
    apiClient
      .get<Pet>(endpoints.pets.detail(selected.petId))
      .then((p) => {
        if (!active) return;
        setActivePet(p);
        if (p?.weightKg && !vitals.weightKg) {
          setVitals((v) => ({ ...v, weightKg: String(p.weightKg) }));
        }
      })
      .catch(() => setActivePet(null));

    apiClient
      .get<MedicalEvent[]>(endpoints.pets.history(selected.petId))
      .then((h) => {
        if (!active) return;
        setPetHistory(Array.isArray(h) ? h : []);
      })
      .catch(() => setPetHistory([]));

    return () => {
      active = false;
    };
  }, [selected?.petId]);

  // Handle calling patient into consultation room
  async function callPatient(apptId: string) {
    try {
      await apiClient.post(endpoints.appointments.status(apptId), { status: "IN_PROGRESS" });
      toast.success("Patient called into consultation room");
      loadData();
    } catch {
      // Fallback
    }
  }

  function handleAddDiagnosis() {
    if (!diagInput.name.trim()) {
      toast.error("Please enter a diagnosis name.");
      return;
    }
    setDiagnoses((prev) => [
      ...prev,
      {
        diagnosisName: diagInput.name.trim(),
        severity: diagInput.severity,
        description: diagInput.description.trim(),
      },
    ]);
    setDiagInput({ name: "", severity: "Moderate", description: "" });
  }

  function handleRemoveDiagnosis(index: number) {
    setDiagnoses((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddLabOrder() {
    if (!labInput.testName.trim()) return;
    setLabOrders((prev) => [...prev, { ...labInput }]);
    setLabInput({ testName: COMMON_LAB_TESTS[0].name, priority: "NORMAL", notes: "" });
  }

  function handleRemoveLabOrder(index: number) {
    setLabOrders((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveConsultation(completeVisit: boolean = false) {
    if (!selected) return;
    setSaving(true);
    setLastSavedConsultation(null);

    try {
      // 1. Build composite assessment including tagged diagnoses if available
      let finalAssessment = soap.assessment.trim();
      if (diagnoses.length > 0) {
        const diagSummary = diagnoses
          .map((d) => `${d.diagnosisName} (${d.severity})${d.description ? `: ${d.description}` : ""}`)
          .join("; ");
        finalAssessment = finalAssessment ? `${finalAssessment}\n\nDiagnoses: ${diagSummary}` : `Diagnoses: ${diagSummary}`;
      }

      // 2. Build composite plan including requested lab orders if available
      let finalPlan = soap.plan.trim();
      if (labOrders.length > 0) {
        const labSummary = labOrders
          .map((l) => `${l.testName} [${l.priority}]${l.notes ? ` - ${l.notes}` : ""}`)
          .join(", ");
        finalPlan = finalPlan ? `${finalPlan}\n\nLab Orders: ${labSummary}` : `Lab Orders: ${labSummary}`;
      }

      const isUuid = (val?: string | null): boolean => {
        if (!val) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      };

      let consultId = editingConsultationId;

      if (editingConsultationId) {
        // Update existing consultation
        const updatePayload = {
          subjective: soap.subjective.trim() || "Routine clinical evaluation.",
          objective: soap.objective.trim() || "Physical exam performed within acceptable limits.",
          assessment: finalAssessment || "General wellness examination.",
          plan: finalPlan || "Continue standard home care and monitor.",
          followUpDate: followUpDate || null,
        };

        await apiClient.put(endpoints.consultations.update(editingConsultationId), updatePayload);
        toast.success(`Consultation notes updated for ${selected.petName}.`);
      } else {
        // Create new consultation payload matching AddConsultationRequest
        const payload: Record<string, any> = {
          appointmentId: selected.id,
          subjective: soap.subjective.trim() || "Routine clinical evaluation.",
          objective: soap.objective.trim() || "Physical exam performed within acceptable limits.",
          assessment: finalAssessment || "General wellness examination.",
          plan: finalPlan || "Continue standard home care and monitor.",
          followUpDate: followUpDate && followUpDate.trim() ? followUpDate.trim() : null,
          vitals,
        };

        if (isUuid(selected.doctorId)) {
          payload.doctorId = selected.doctorId;
        }

        if (isUuid(selected.petId)) {
          payload.petId = selected.petId;
        }

        const savedRes = await apiClient.post<Consultation>(endpoints.consultations.create, payload);
        if (savedRes?.id) {
          consultId = savedRes.id;
        }

        // Optional backend sub-entity calls
        if (diagnoses.length > 0 && savedRes?.id) {
          for (const d of diagnoses) {
            apiClient
              .post(endpoints.diagnoses.create, {
                consultationId: savedRes.id,
                diagnosisName: d.diagnosisName,
                severity: d.severity,
                description: d.description,
              })
              .catch(() => {});
          }
        }

        toast.success(
          completeVisit
            ? `Consultation finalized and visit completed for ${selected.petName}!`
            : `Consultation saved for ${selected.petName}.`
        );
      }

      // Reset form and active selection
      setSelectedId(null);
      setEditingConsultationId(null);
      setActivePet(null);
      setPetHistory([]);
      setShowHistoryDrawer(false);
      setSoap(emptySoap);
      setVitals({ temperatureC: "", weightKg: "", heartRate: "", respRate: "" });
      setFollowUpDate("");
      setDiagnoses([]);
      setLabOrders([]);

      setLastSavedConsultation({
        id: consultId || `c_${Date.now()}`,
        petName: selected.petName,
        petId: selected.petId,
      });

      // Refresh data
      loadData();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to save consultation.");
    } finally {
      setSaving(false);
    }
  }

  const filteredPast = useMemo(() => {
    if (!searchFilter.trim()) return past;
    const q = searchFilter.toLowerCase();
    return past.filter(
      (c) =>
        c.petName?.toLowerCase().includes(q) ||
        c.doctorName?.toLowerCase().includes(q) ||
        c.assessment?.toLowerCase().includes(q) ||
        c.subjective?.toLowerCase().includes(q)
    );
  }, [past, searchFilter]);

  const pendingList = allRelevantAppointments.filter(
    (a) => ["CHECKED_IN", "IN_PROGRESS"].includes(a.status) && !consultByApptId.has(a.id)
  );
  const serving = pendingList.find((a) => a.status === "IN_PROGRESS");
  const waitingCount = pendingList.filter((a) => a.status === "CHECKED_IN").length;

  return (
    <StaffLayout
      title="Consultations"
      subtitle="SOAP clinical notes, vitals, diagnoses and prescriptions"
      permission="consultations:read"
    >
      <AdminHospitalSelector />
      <div className="space-y-6">
        {/* KPI Cards Header */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="In Consultation"
            value={serving ? `#${serving.tokenNumber || "1"} ${serving.petName}` : "None"}
            hint={serving ? `with ${serving.doctorName}` : "Exam room available"}
          />
          <StatCard label="Checked-In Waiting" value={waitingCount} hint="Ready for examination" />
          <StatCard label="Consultations Today" value={past.length} hint="Recorded clinical visits" />
          <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-border bg-card p-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-foreground/50">Actions</p>
              <p className="mt-1 text-sm font-semibold text-foreground">Clinic Queue</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/app/queue"
                className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-3.5 py-2 text-xs font-medium text-forest hover:bg-forest/15 transition-colors"
              >
                Queue <ArrowRight className="size-3.5" />
              </Link>
              <button
                type="button"
                aria-label="Refresh consultations"
                onClick={loadData}
                className="rounded-full border border-border p-2 text-foreground/70 hover:text-forest transition-colors cursor-pointer"
              >
                <RefreshCw className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Post-Save Quick Actions Banner */}
        {lastSavedConsultation ? (
          <div className="rounded-[1.75rem] border border-forest/30 bg-forest/5 p-5 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest text-primary-foreground">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-forest">Consultation Record Saved Successfully!</p>
                  <p className="text-xs text-foreground/70">
                    Clinical documentation completed for <span className="font-medium">{lastSavedConsultation.petName}</span>. Choose your next action:
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/app/prescriptions"
                  className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-forest/90 transition-colors"
                >
                  <Pill className="size-3.5" /> Create Prescription
                </Link>
                <Link
                  to="/app/billing"
                  className="inline-flex items-center gap-1.5 rounded-full border border-forest/40 bg-card px-4 py-2 text-xs font-medium text-forest hover:bg-forest/10 transition-colors"
                >
                  <Receipt className="size-3.5" /> Generate Invoice
                </Link>
                <Link
                  to="/app/pets/$id"
                  params={{ id: lastSavedConsultation.petId }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium text-foreground/70 hover:bg-muted transition-colors"
                >
                  <Dog className="size-3.5" /> Patient Record
                </Link>
                <button
                  type="button"
                  onClick={() => setLastSavedConsultation(null)}
                  className="text-xs text-foreground/50 hover:text-foreground cursor-pointer px-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Section 1: Checked-in Patients Waiting Room */}
        <Panel
          title="Patients Queue & Consultation Status"
          action={
            <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-border bg-background p-1 text-xs">
              <button
                type="button"
                onClick={() => setQueueTab("pending")}
                className={`rounded-full px-3 py-1 font-medium transition-all ${
                  queueTab === "pending"
                    ? "bg-forest text-primary-foreground shadow-xs"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                Waiting / In-Progress ({pendingList.length})
              </button>
              <button
                type="button"
                onClick={() => setQueueTab("completed")}
                className={`rounded-full px-3 py-1 font-medium transition-all ${
                  queueTab === "completed"
                    ? "bg-forest text-primary-foreground shadow-xs"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                Completed Today ({allRelevantAppointments.filter((a) => a.status === "COMPLETED" || consultByApptId.has(a.id)).length})
              </button>
              <button
                type="button"
                onClick={() => setQueueTab("all")}
                className={`rounded-full px-3 py-1 font-medium transition-all ${
                  queueTab === "all"
                    ? "bg-forest text-primary-foreground shadow-xs"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                All ({allRelevantAppointments.length})
              </button>
            </div>
          }
        >
          {!appointments ? (
            <Loading />
          ) : eligible.length === 0 ? (
            <EmptyState
              title={
                queueTab === "pending"
                  ? "No patients waiting"
                  : queueTab === "completed"
                  ? "No completed visits yet today"
                  : "No appointments today"
              }
              message={
                queueTab === "pending"
                  ? "All checked-in patients have been examined or no patients are currently waiting."
                  : "Consultations completed today will appear here."
              }
              icon={<Lock className="size-6 text-foreground/40" />}
              action={
                <Link
                  to="/app/queue"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-forest/90"
                >
                  Open Reception Queue
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {eligible.map((a) => {
                const isSelected = selectedId === a.id;
                const isInProgress = a.status === "IN_PROGRESS";
                const isDone = a.status === "COMPLETED" || consultByApptId.has(a.id);

                return (
                  <div
                    key={a.id}
                    onClick={() => handleSelectAppointment(a)}
                    className={`group relative flex flex-col justify-between rounded-[1.35rem] border p-4.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-forest bg-forest/5 ring-2 ring-forest/20 shadow-sm"
                        : isDone
                        ? "border-border/80 bg-muted/25 hover:border-forest/40"
                        : "border-border bg-card hover:border-forest/50 hover:shadow-xs"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            isDone ? "bg-emerald-500/10 text-emerald-600" : "bg-forest/10 text-forest"
                          }`}>
                            {a.tokenNumber ? (String(a.tokenNumber).startsWith("#") ? a.tokenNumber : `#${a.tokenNumber}`) : "#—"}
                          </span>
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-forest transition-colors">
                              {a.petName}
                            </h3>
                            <p className="text-xs text-foreground/60">{a.ownerName}</p>
                          </div>
                        </div>
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="size-3" /> Done
                          </span>
                        ) : (
                          <StatusBadge status={a.status} />
                        )}
                      </div>

                      <div className="mt-3.5 space-y-1 rounded-xl bg-background/60 p-2.5 text-xs text-foreground/70">
                        <div className="flex items-center justify-between">
                          <span className="text-foreground/50">Service:</span>
                          <span className="font-medium text-foreground">{a.service}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-foreground/50">Doctor:</span>
                          <span className="font-medium">{a.doctorName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-foreground/50">Time:</span>
                          <span>{formatDate(a.scheduledAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-border/60">
                      <span className="text-xs font-medium text-forest flex items-center gap-1">
                        {isSelected
                          ? editingConsultationId
                            ? "Active (Editing)"
                            : "Active in Editor"
                          : isDone
                          ? "Edit Consultation"
                          : "Select Patient"}
                        <ChevronRight className="size-3" />
                      </span>
                      {!isInProgress && !isDone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAppointment(a);
                            callPatient(a.id);
                          }}
                          className="rounded-full bg-forest/10 hover:bg-forest hover:text-primary-foreground px-3 py-1 text-xs font-medium text-forest transition-all cursor-pointer"
                        >
                          Call In
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* Section 2: Active SOAP Consultation Workspace */}
        <Panel
          title={
            selected
              ? editingConsultationId
                ? `Edit Consultation — ${selected.petName} (Owner: ${selected.ownerName})`
                : `SOAP Consultation — ${selected.petName} (Owner: ${selected.ownerName})`
              : "Clinical SOAP Consultation Workspace"
          }
          action={
            selected ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground/80 hover:border-forest/40 hover:text-forest transition-colors cursor-pointer"
                >
                  <History className="size-3.5" />
                  {showHistoryDrawer ? "Hide History" : "Past Medical History"}
                </button>
                <Link
                  to="/app/pets/$id"
                  params={{ id: selected.petId }}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground/80 hover:border-forest/40 hover:text-forest transition-colors"
                >
                  <Dog className="size-3.5" /> Full Record
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setEditingConsultationId(null);
                    setActivePet(null);
                    setSoap(emptySoap);
                    setVitals({ temperatureC: "", weightKg: "", heartRate: "", respRate: "" });
                    setFollowUpDate("");
                    setDiagnoses([]);
                    setLabOrders([]);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : null
          }
        >
          {!selected ? (
            <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-muted/40 py-12 px-4 text-center">
              <Stethoscope className="size-10 text-forest/40 mb-3" />
              <p className="text-base font-medium text-foreground">No patient selected</p>
              <p className="mt-1 max-w-md text-sm text-foreground/60">
                Click on any patient card above to begin recording SOAP notes, logging vitals, issuing prescriptions, or editing an existing consultation record.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Edit Mode Notice Banner */}
              {editingConsultationId && (
                <div className="flex items-center justify-between rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3.5 text-xs text-amber-800 dark:text-amber-200">
                  <div className="flex items-center gap-2.5">
                    <FileText className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      Loaded existing consultation record for <strong className="font-semibold">{selected.petName}</strong>. Editing fields will update this clinical record.
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Edit Mode
                  </span>
                </div>
              )}
              {/* Patient Quick Context Card with Allergy Warning */}
              <div className="rounded-2xl border border-border bg-sand/30 p-4.5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3.5">
                    {activePet?.photoUrl ? (
                      <img
                        src={activePet.photoUrl}
                        alt={selected.petName}
                        className="size-14 rounded-2xl object-cover border border-border"
                      />
                    ) : (
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-forest/10 text-forest font-bold text-lg">
                        {selected.petName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">{selected.petName}</h3>
                        <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-semibold text-forest">
                          {activePet?.gender || "Patient"}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/70 mt-0.5">
                        {activePet?.speciesId ? <SpeciesName id={activePet.speciesId} /> : "Canine"} ·{" "}
                        {activePet?.breedId ? <BreedName id={activePet.breedId} /> : "Mixed"} ·{" "}
                        {activePet?.age ? `${activePet.age} yrs` : "Age N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Allergy Highlight Banner */}
                  {activePet?.allergies ? (
                    <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2 text-xs font-semibold text-destructive">
                      <AlertTriangle className="size-4 shrink-0" />
                      <span>Known Allergies: {activePet.allergies}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl bg-forest/10 px-3.5 py-2 text-xs text-forest">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>No known adverse drug allergies recorded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Collapsible Medical History Drawer */}
              {showHistoryDrawer && (
                <div className="rounded-2xl border border-border bg-card p-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <History className="size-4 text-forest" /> Previous Medical Events & Visits for {selected.petName}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowHistoryDrawer(false)}
                      className="text-xs text-foreground/50 hover:text-foreground cursor-pointer"
                    >
                      Close History
                    </button>
                  </div>

                  {petHistory.length === 0 ? (
                    <p className="text-xs text-foreground/60 py-4">No previous recorded visits for this patient.</p>
                  ) : (
                    <ol className="mt-3 relative space-y-3.5 border-l border-border/80 pl-5">
                      {petHistory.slice(0, 5).map((e) => (
                        <li key={e.id} className="relative">
                          <span className="absolute -left-[1.65rem] top-1.5 size-2.5 rounded-full bg-clay" />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase text-forest">{e.type}</span>
                            <span className="text-xs text-foreground/50">{formatDate(e.occurredAt)}</span>
                          </div>
                          <p className="text-xs font-medium text-foreground mt-0.5">{e.title}</p>
                          <p className="text-xs text-foreground/70">{e.detail}</p>
                          <p className="text-[11px] text-foreground/50 mt-0.5">Attending: {e.doctorName}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}

              {/* Physiological Vitals Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-forest mb-3 flex items-center gap-1.5">
                  <Activity className="size-4" /> Patient Physiological Vitals
                </h4>
                <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className={labelCls} htmlFor="vit-temp">
                      Temp (°C)
                    </label>
                    <input
                      id="vit-temp"
                      placeholder="e.g. 38.5"
                      className={`${field} mt-1.5`}
                      value={vitals.temperatureC || ""}
                      onChange={(e) => setVitals({ ...vitals, temperatureC: e.target.value })}
                    />
                    <span className="text-[11px] text-foreground/50 mt-1 block">Normal: 38.0–39.2 °C</span>
                  </div>

                  <div>
                    <label className={labelCls} htmlFor="vit-weight">
                      Weight (kg)
                    </label>
                    <input
                      id="vit-weight"
                      placeholder="e.g. 14.2"
                      className={`${field} mt-1.5`}
                      value={vitals.weightKg || ""}
                      onChange={(e) => setVitals({ ...vitals, weightKg: e.target.value })}
                    />
                    <span className="text-[11px] text-foreground/50 mt-1 block">Body weight</span>
                  </div>

                  <div>
                    <label className={labelCls} htmlFor="vit-hr">
                      Heart Rate (bpm)
                    </label>
                    <input
                      id="vit-hr"
                      placeholder="e.g. 110"
                      className={`${field} mt-1.5`}
                      value={vitals.heartRate || ""}
                      onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                    />
                    <span className="text-[11px] text-foreground/50 mt-1 block">Normal: 60–140 bpm</span>
                  </div>

                  <div>
                    <label className={labelCls} htmlFor="vit-rr">
                      Resp. Rate (rpm)
                    </label>
                    <input
                      id="vit-rr"
                      placeholder="e.g. 24"
                      className={`${field} mt-1.5`}
                      value={vitals.respRate || ""}
                      onChange={(e) => setVitals({ ...vitals, respRate: e.target.value })}
                    />
                    <span className="text-[11px] text-foreground/50 mt-1 block">Normal: 15–30 rpm</span>
                  </div>
                </div>
              </div>

              {/* SOAP 4-Quadrant Clinical Notes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-forest mb-3 flex items-center gap-1.5">
                  <ClipboardList className="size-4" /> Structured SOAP Notes
                </h4>
                <div className="grid gap-4.5 lg:grid-cols-2">
                  {sections.map((s) => (
                    <section
                      key={s.key}
                      className="flex flex-col justify-between rounded-[1.35rem] border border-border bg-card p-4.5 hover:border-forest/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-forest">{s.title}</h3>
                          <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-[11px] font-semibold text-forest">
                            {s.badge}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-foreground/60">{s.hint}</p>
                      </div>
                      <textarea
                        aria-label={s.title}
                        rows={5}
                        placeholder={s.placeholder}
                        className={`${field} mt-3.5 resize-y font-mono text-xs leading-relaxed`}
                        value={soap[s.key]}
                        onChange={(e) => setSoap({ ...soap, [s.key]: e.target.value })}
                      />
                    </section>
                  ))}
                </div>
              </div>

              {/* Clinical Diagnoses & Severity Tagging */}
              <div className="rounded-[1.35rem] border border-border bg-card p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                    <Sparkles className="size-4" /> Clinical Diagnoses & Severity
                  </h4>
                  <span className="text-xs text-foreground/50">Tagged diagnoses saved with visit record</span>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-[1fr_140px_1fr_auto]">
                  <input
                    placeholder="Diagnosis condition (e.g. Otitis Externa)"
                    className={field}
                    value={diagInput.name}
                    onChange={(e) => setDiagInput({ ...diagInput, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDiagnosis();
                      }
                    }}
                  />
                  <select
                    className={field}
                    value={diagInput.severity}
                    onChange={(e) => setDiagInput({ ...diagInput, severity: e.target.value as DiagnosisSeverity })}
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                    <option value="Critical">Critical</option>
                  </select>
                  <input
                    placeholder="Optional clinical notes / differentials"
                    className={field}
                    value={diagInput.description}
                    onChange={(e) => setDiagInput({ ...diagInput, description: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDiagnosis();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddDiagnosis}
                    className="inline-flex items-center justify-center gap-1 rounded-2xl bg-forest/10 hover:bg-forest hover:text-primary-foreground px-4 py-2.5 text-xs font-semibold text-forest transition-colors cursor-pointer"
                  >
                    <Plus className="size-4" /> Add
                  </button>
                </div>

                {diagnoses.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {diagnoses.map((d, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium ${
                          severityColors[d.severity as DiagnosisSeverity] || severityColors.Moderate
                        }`}
                      >
                        <span className="font-semibold">{d.diagnosisName}</span>
                        <span className="text-[11px] opacity-80">({d.severity})</span>
                        {d.description ? <span className="opacity-70">· {d.description}</span> : null}
                        <button
                          type="button"
                          onClick={() => handleRemoveDiagnosis(idx)}
                          className="hover:opacity-100 opacity-60 ml-1 cursor-pointer"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Lab Orders & Diagnostic Requests */}
              <div className="rounded-[1.35rem] border border-border bg-card p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                    <FlaskConical className="size-4" /> Laboratory & Diagnostics Request (Optional)
                  </h4>
                  <span className="text-xs text-foreground/50">Send order to laboratory technician</span>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-[1fr_130px_1fr_auto]">
                  <select
                    className={field}
                    value={labInput.testName}
                    onChange={(e) => setLabInput({ ...labInput, testName: e.target.value })}
                  >
                    {COMMON_LAB_TESTS.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className={field}
                    value={labInput.priority}
                    onChange={(e) => setLabInput({ ...labInput, priority: e.target.value as LabPriority })}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                    <option value="STAT">STAT / Emergency</option>
                  </select>
                  <input
                    placeholder="Specific test instructions / notes"
                    className={field}
                    value={labInput.notes}
                    onChange={(e) => setLabInput({ ...labInput, notes: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={handleAddLabOrder}
                    className="inline-flex items-center justify-center gap-1 rounded-2xl bg-forest/10 hover:bg-forest hover:text-primary-foreground px-4 py-2.5 text-xs font-semibold text-forest transition-colors cursor-pointer"
                  >
                    <Plus className="size-4" /> Request
                  </button>
                </div>

                {labOrders.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {labOrders.map((l, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-foreground"
                      >
                        <FlaskConical className="size-3.5 text-forest" />
                        <span className="font-semibold">{l.testName}</span>
                        <span className="text-[11px] text-forest font-semibold">[{l.priority}]</span>
                        {l.notes ? <span className="text-foreground/60">· {l.notes}</span> : null}
                        <button
                          type="button"
                          onClick={() => handleRemoveLabOrder(idx)}
                          className="text-foreground/50 hover:text-destructive ml-1 cursor-pointer"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Follow-up Date Scheduling */}
              <div className="rounded-[1.35rem] border border-border bg-card p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                    <Calendar className="size-4" /> Next Follow-Up Date (Optional)
                  </h4>
                  <p className="text-xs text-foreground/60 mt-0.5">
                    Schedule when the patient should return for re-evaluation.
                  </p>
                </div>
                <div className="w-full sm:w-64">
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    className={field}
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Submission Controls */}
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between border-t border-border">
                <p className="text-xs text-foreground/60">
                  Doctor: <span className="font-semibold text-foreground">{selected.doctorName || user?.name}</span> ·
                  Patient: <span className="font-semibold text-foreground">{selected.petName}</span>
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  {editingConsultationId ? (
                    <button
                      type="button"
                      onClick={() => handleSaveConsultation(false)}
                      disabled={saving}
                      className="rounded-full bg-forest px-8 py-3 text-xs font-semibold text-primary-foreground hover:bg-forest/90 disabled:opacity-60 transition-all shadow-sm cursor-pointer inline-flex items-center gap-2"
                    >
                      <CheckCircle2 className="size-4" />
                      {saving ? "Updating Record…" : "Update Consultation Record"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveConsultation(false)}
                        disabled={saving}
                        className="rounded-full border border-forest/40 bg-card px-6 py-3 text-xs font-semibold text-forest hover:bg-forest/10 disabled:opacity-60 transition-all cursor-pointer"
                      >
                        {saving ? "Saving…" : "Save Consultation Draft"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveConsultation(true)}
                        disabled={saving}
                        className="rounded-full bg-forest px-7 py-3 text-xs font-semibold text-primary-foreground hover:bg-forest/90 disabled:opacity-60 transition-all shadow-sm cursor-pointer"
                      >
                        {saving ? "Finalizing…" : "Save & Complete Visit"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </Panel>

        {/* Section 3: Recent Consultations Audit Trail */}
        <Panel
          title="Past Consultations & Medical Audit Records"
          action={
            <div className="relative w-64 max-w-full">
              <Search className="absolute left-3 top-2.5 size-3.5 text-foreground/40" />
              <input
                placeholder="Search patient, doctor, diagnosis..."
                className={`${field} pl-8 py-1.5 text-xs`}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          }
        >
          {filteredPast.length === 0 ? (
            <EmptyState
              message={
                searchFilter
                  ? `No consultations matching "${searchFilter}".`
                  : "No consultations recorded yet. Saved consultations will appear here."
              }
              icon={<ClipboardList className="size-6 text-foreground/40" />}
            />
          ) : (
            <div className="space-y-3.5">
              {filteredPast.map((c) => {
                const matchingAppt = allRelevantAppointments.find((a) => a.id === c.appointmentId);

                return (
                  <details
                    key={c.id}
                    className="group rounded-[1.35rem] border border-border bg-card p-4.5 hover:border-forest/40 transition-all"
                  >
                    <summary className="flex cursor-pointer items-center justify-between text-sm font-medium list-none">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-forest/10 text-xs font-bold text-forest">
                          <Dog className="size-3.5" />
                        </span>
                        <span className="font-bold text-foreground">{c.petName}</span>
                        <span className="text-xs text-foreground/60">
                          · {c.doctorName ? (c.doctorName.startsWith("Dr") ? c.doctorName : `Dr. ${c.doctorName}`) : "Attending Doctor"}
                        </span>
                        <span className="text-xs text-foreground/50">
                          · {c.createdAt ? formatDate(c.createdAt) : "Today"}
                        </span>
                        {c.followUpDate ? (
                          <span className="rounded-full bg-clay/15 px-2.5 py-0.5 text-[11px] font-medium text-clay">
                            Follow-up: {c.followUpDate}
                          </span>
                        ) : null}
                      </div>
                      <ChevronDown className="size-4 text-foreground/50 transition-transform group-open:rotate-180" />
                    </summary>

                    <div className="mt-4 pt-4 border-t border-border space-y-4 text-xs">
                      {/* Vitals Summary Pill Row */}
                      {c.vitals && (
                        <div className="flex flex-wrap gap-2 text-foreground/80 bg-sand/30 p-2.5 rounded-xl">
                          {c.vitals.temperatureC ? <span>🌡️ Temp: {c.vitals.temperatureC} °C</span> : null}
                          {c.vitals.weightKg ? <span>⚖️ Weight: {c.vitals.weightKg} kg</span> : null}
                          {c.vitals.heartRate ? <span>❤️ HR: {c.vitals.heartRate} bpm</span> : null}
                          {c.vitals.respRate ? <span>🫁 RR: {c.vitals.respRate} rpm</span> : null}
                        </div>
                      )}

                      {/* Full SOAP Details */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        {sections.map((s) => (
                          <div key={s.key} className="rounded-xl border border-border/80 p-3 bg-background/50">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-forest">{s.title}</p>
                            <p className="mt-1 text-foreground/80 whitespace-pre-wrap leading-relaxed">
                              {c[s.key] || "—"}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                        {matchingAppt ? (
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectAppointment(matchingAppt);
                              window.scrollTo({ top: 400, behavior: "smooth" });
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-3.5 py-1.5 text-xs font-semibold text-forest hover:bg-forest hover:text-primary-foreground transition-all cursor-pointer"
                          >
                            <FileText className="size-3.5" /> Edit in Workspace
                          </button>
                        ) : (
                          <span />
                        )}

                        <Link
                          to="/app/pets/$id"
                          params={{ id: c.petId }}
                          className="inline-flex items-center gap-1 text-xs text-forest hover:underline"
                        >
                          View Patient Timeline <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </StaffLayout>
  );
}

