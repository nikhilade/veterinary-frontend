import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Activity, Pencil, Syringe } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel, formatDate } from "@/components/app/ui";
import { PetForm } from "@/components/app/kit/PetForm";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { MedicalEvent, Pet, Vaccine } from "@/lib/api/types";

export const Route = createFileRoute("/app/pets/$id")({
  head: () => ({
    meta: [
      { title: "Patient Record | Pet Good Console" },
      { name: "description", content: "Patient profile with allergies and a full medical history timeline." },
      { property: "og:title", content: "Patient Record | Pet Good Console" },
      { property: "og:description", content: "Medical history timeline for one patient." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PetDetailPage,
});

const typeTone: Record<MedicalEvent["type"], string> = {
  VISIT: "bg-forest/10 text-forest",
  VACCINE: "bg-clay/15 text-clay",
  LAB: "bg-muted text-foreground/70",
  SURGERY: "bg-destructive/10 text-destructive",
  PRESCRIPTION: "bg-forest/10 text-forest",
  GROOMING: "bg-clay/15 text-clay",
};

function PetDetailPage() {
  const { id } = Route.useParams();
  const [pet, setPet] = useState<Pet | null>(null);
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      apiClient.get<Pet>(endpoints.pets.detail(id)),
      apiClient.get<MedicalEvent[]>(endpoints.pets.history(id)),
      apiClient.get<Vaccine[]>(endpoints.vaccines.byPet(id)),
    ])
      .then(([p, h, v]) => {
        if (!active) return;
        setPet(p);
        setEvents(h);
        setVaccines(v);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <StaffLayout title={pet?.name ?? "Patient"} subtitle="Patient record" permission="pets:read">
      <Link to="/app/pets" className="mb-4 inline-flex items-center gap-1.5 text-sm text-forest">
        <ArrowLeft className="size-4" /> Back to patients
      </Link>

      {loading || !pet ? (
        <Loading />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-5">
            <Panel
              title="Profile"
              action={
                <button onClick={() => setEditing((v) => !v)} className="inline-flex items-center gap-1.5 text-sm text-forest">
                  <Pencil className="size-4" /> {editing ? "Cancel" : "Edit"}
                </button>
              }
            >
              {editing ? (
                <PetForm
                  ownerId={pet.owner_id}
                  pet={pet}
                  submitLabel="Save changes"
                  onSaved={(p) => {
                    setPet(p);
                    setEditing(false);
                  }}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {pet.photo_url ? (
                      <img src={pet.photo_url} alt={`${pet.name}`} className="size-20 rounded-2xl object-cover" />
                    ) : null}
                    <div>
                      <p className="text-lg font-medium">{pet.name}</p>
                      <Link to="/app/owners/$id" params={{ id: pet.owner_id }} className="text-sm text-forest underline underline-offset-4">
                        {pet.owner_name}
                      </Link>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-foreground/60">Species</dt>
                      <dd>{pet.species}</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/60">Breed</dt>
                      <dd>{pet.breed}</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/60">Age</dt>
                      <dd>{pet.age_years} yrs</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/60">Weight</dt>
                      <dd>{pet.weight_kg} kg</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/60">Sex</dt>
                      <dd>{pet.sex}</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/60">Microchip</dt>
                      <dd>{pet.microchip_id ?? "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-foreground/60">Allergies</dt>
                      <dd className={pet.allergies ? "text-destructive" : ""}>{pet.allergies || "None recorded"}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </Panel>

            <Panel title="Vaccinations">
              {vaccines.length === 0 ? (
                <EmptyState icon={<Syringe className="size-7" />} title="No vaccines logged" message="Record this pet's first vaccination from the Vaccinations module." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {vaccines.map((v) => (
                    <li key={v.id} className="rounded-2xl border border-border px-4 py-3">
                      <p className="font-medium">{v.vaccine_name}</p>
                      <p className="text-xs text-foreground/60">
                        Given {v.vaccination_date} · next due {v.next_due_date}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title="Medical history">
            {events.length === 0 ? (
              <EmptyState
                icon={<Activity className="size-7" />}
                title="No history yet"
                message="Visits, labs, prescriptions and surgeries will build this timeline automatically."
              />
            ) : (
              <ol className="relative space-y-5 border-l border-border pl-6">
                {events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[1.9rem] top-1.5 size-3 rounded-full border-2 border-card bg-clay" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeTone[e.type]}`}>
                        {e.type.toLowerCase()}
                      </span>
                      <span className="text-xs text-foreground/50">{formatDate(e.occurred_at)}</span>
                    </div>
                    <p className="mt-1 font-medium">{e.title}</p>
                    <p className="text-sm text-foreground/70">{e.detail}</p>
                    <p className="mt-0.5 text-xs text-foreground/50">{e.doctor_name}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      )}
    </StaffLayout>
  );
}
