import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Activity, Pencil, Syringe, Trash2, Loader2 } from "lucide-react";
import { SpeciesName, BreedName } from "@/components/app/MasterData";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel, formatDate } from "@/components/app/ui";
import { PetForm } from "@/components/app/kit/PetForm";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { MedicalEvent, Pet, Vaccine } from "@/lib/api/types";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        setEvents(Array.isArray(h) ? h : []);
        setVaccines(v || []);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  async function handleDeletePet() {
    if (!pet) return;
    setDeleting(true);
    try {
      await apiClient.delete(endpoints.pets.delete(id));
      toast.success(`Pet ${pet.petName} deleted successfully`);
      navigate({ to: "/app/pets" });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete this pet");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <StaffLayout title={pet?.petName ?? "Patient"} subtitle="Patient record" permission="pets:read">
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
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditing((v) => !v)} className="inline-flex items-center gap-1.5 text-sm text-forest cursor-pointer">
                    <Pencil className="size-4" /> {editing ? "Cancel" : "Edit"}
                  </button>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="inline-flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-4" /> Delete
                  </button>
                </div>
              }
            >
              {editing ? (
                <PetForm
                  ownerId={pet.ownerId}
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
                    {pet.photoUrl ? (
                      <img src={pet.photoUrl} alt={`${pet.petName}`} className="size-20 rounded-2xl object-cover" />
                    ) : null}
                    <div>
                      <p className="text-lg font-medium">{pet.petName}</p>
                      <Link to="/app/owners/$id" params={{ id: pet.ownerId }} className="text-sm text-forest underline underline-offset-4">
                        {pet.ownerName || "View Owner"}
                      </Link>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-foreground/60">Species</dt>
                      <dd><SpeciesName id={pet.speciesId} /></dd>
                    </div>
                    <div>
                      <dt className="text-foreground/60">Breed</dt>
                      <dd><BreedName id={pet.breedId} /></dd>
                    </div>
                    <div>
                      <dt className="text-foreground/60">Age</dt>
                      <dd>{pet.age} yrs</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/60">Weight</dt>
                      <dd>{pet.weightKg} kg</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/60">Sex</dt>
                      <dd>{pet.gender}</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/60">Microchip</dt>
                      <dd>{pet.microchipNumber ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/60">Color</dt>
                      <dd>{pet.color || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/60">Status</dt>
                      <dd className={pet.status === "Deceased" ? "text-destructive font-medium" : ""}>{pet.status || "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-foreground/60">Allergies</dt>
                      <dd className={pet.allergies ? "text-destructive" : ""}>{pet.allergies || "None recorded"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-foreground/60">Notes</dt>
                      <dd className="whitespace-pre-wrap">{pet.notes || "No notes recorded"}</dd>
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
                      <p className="font-medium">{v.vaccineName}</p>
                      <p className="text-xs text-foreground/60">
                        Given {v.vaccinationDate} · next due {v.nextDueDate}
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
                      <span className="text-xs text-foreground/50">{formatDate(e.occurredAt)}</span>
                    </div>
                    <p className="mt-1 font-medium">{e.title}</p>
                    <p className="text-sm text-foreground/70">{e.detail}</p>
                    <p className="mt-0.5 text-xs text-foreground/50">{e.doctorName}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{pet?.petName}</span>? This action cannot be undone and will permanently remove this patient record and medical history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePet}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Deleting…
                </>
              ) : (
                "Delete pet"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StaffLayout>
  );
}
