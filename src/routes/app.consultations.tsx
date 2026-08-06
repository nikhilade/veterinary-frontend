import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, Lock } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel, formatDate } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/kit/StatusBadge";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Appointment, Consultation } from "@/lib/api/types";

export const Route = createFileRoute("/app/consultations")({
  head: () => ({
    meta: [
      { title: "Consultation Editor | Pet Good Console" },
      { name: "description", content: "Record structured SOAP consultation notes for checked-in patients." },
      { property: "og:title", content: "Consultation Editor | Pet Good Console" },
      { property: "og:description", content: "Subjective, objective, assessment and plan notes per visit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConsultationsPage,
});

const field = "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";
const labelCls = "block text-xs font-medium uppercase tracking-wide text-foreground/50";

const sections = [
  { key: "subjective", title: "S — Subjective", hint: "Owner's report: history, symptoms, behaviour changes." },
  { key: "objective", title: "O — Objective", hint: "Exam findings, vitals, test results." },
  { key: "assessment", title: "A — Assessment", hint: "Diagnosis or differential list." },
  { key: "plan", title: "P — Plan", hint: "Treatment, medication, follow-up and owner instructions." },
] as const;

type SoapKey = (typeof sections)[number]["key"];
const emptySoap: Record<SoapKey, string> = { subjective: "", objective: "", assessment: "", plan: "" };

function ConsultationsPage() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [past, setPast] = useState<Consultation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [soap, setSoap] = useState(emptySoap);
  const [vitals, setVitals] = useState({ temperature_c: "", weight_kg: "", heart_rate: "", resp_rate: "" });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  function loadConsults() {
    apiClient.get<Consultation[]>(endpoints.consultations.list).then(setPast).catch(() => setPast([]));
  }

  useEffect(() => {
    apiClient
      .get<Appointment[]>(endpoints.appointments.list)
      .then(setAppointments)
      .catch(() => setAppointments([]));
    loadConsults();
  }, []);

  const eligible = (appointments ?? []).filter((a) => ["CHECKED_IN", "IN_PROGRESS"].includes(a.status));
  const selected = eligible.find((a) => a.id === selectedId) ?? null;

  async function save() {
    if (!selected) return;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      await apiClient.post<Consultation>(endpoints.consultations.create, {
        appointment_id: selected.id,
        ...soap,
        vitals,
      });
      setSaved(`Consultation saved for ${selected.pet_name}.`);
      setSoap(emptySoap);
      setVitals({ temperature_c: "", weight_kg: "", heart_rate: "", resp_rate: "" });
      setSelectedId(null);
      loadConsults();
      apiClient.get<Appointment[]>(endpoints.appointments.list).then(setAppointments).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the consultation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StaffLayout title="Consultations" subtitle="SOAP notes for checked-in patients" permission="consultations:read">
      {!appointments ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          <Panel title="Checked-in patients">
            {eligible.length === 0 ? (
              <EmptyState
                title="Nobody is checked in"
                message="A consultation can only be recorded once reception checks the patient in."
                icon={<Lock className="size-6" />}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {eligible.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setSelectedId(a.id);
                      setSaved("");
                      setError("");
                    }}
                    className={`rounded-[1.25rem] border p-4 text-left transition-colors ${
                      selectedId === a.id ? "border-forest bg-forest/5" : "border-border hover:border-forest/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{a.pet_name}</p>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="mt-1 text-sm text-foreground/60">{a.owner_name}</p>
                    <p className="mt-2 text-xs text-foreground/50">
                      {a.service} · {formatDate(a.scheduled_at)}
                    </p>
                    <p className="text-xs text-foreground/50">{a.doctor_name}</p>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <Panel title={selected ? `SOAP note — ${selected.pet_name}` : "SOAP note"}>
            {!selected ? (
              <p className="text-sm text-foreground/60">
                Select a checked-in patient above to enable the editor.
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-4">
                  {(
                    [
                      ["temperature_c", "Temp (°C)"],
                      ["weight_kg", "Weight (kg)"],
                      ["heart_rate", "Heart rate"],
                      ["resp_rate", "Resp. rate"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className={labelCls} htmlFor={`v-${key}`}>{label}</label>
                      <input
                        id={`v-${key}`}
                        className={`${field} mt-1.5`}
                        value={vitals[key]}
                        onChange={(e) => setVitals({ ...vitals, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {sections.map((s) => (
                    <section key={s.key} className="rounded-[1.25rem] border border-border p-4">
                      <h3 className="text-sm font-semibold text-forest">{s.title}</h3>
                      <p className="mt-0.5 text-xs text-foreground/50">{s.hint}</p>
                      <textarea
                        aria-label={s.title}
                        rows={6}
                        className={`${field} mt-3`}
                        value={soap[s.key]}
                        onChange={(e) => setSoap({ ...soap, [s.key]: e.target.value })}
                      />
                    </section>
                  ))}
                </div>

                {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
                <button
                  onClick={save}
                  disabled={saving}
                  className="mt-5 rounded-full bg-forest px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save consultation"}
                </button>
              </>
            )}
            {saved ? <p className="mt-3 text-sm text-forest">{saved}</p> : null}
          </Panel>

          <Panel title="Recent consultations">
            {past.length === 0 ? (
              <EmptyState message="No consultations recorded yet." icon={<ClipboardList className="size-6" />} />
            ) : (
              <div className="space-y-3">
                {past.map((c) => (
                  <details key={c.id} className="rounded-[1.25rem] border border-border p-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      {c.pet_name} · {c.doctor_name} · {formatDate(c.created_at)}
                    </summary>
                    <dl className="mt-3 space-y-2 text-sm">
                      {sections.map((s) => (
                        <div key={s.key}>
                          <dt className="text-xs uppercase text-foreground/50">{s.title}</dt>
                          <dd className="text-foreground/80">{c[s.key]}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}
    </StaffLayout>
  );
}
