import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PawPrint, Plus } from "lucide-react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { EmptyState, Loading, Panel } from "@/components/app/ui";
import { PetForm } from "@/components/app/kit/PetForm";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Pet } from "@/lib/api/types";

export const Route = createFileRoute("/portal/my-pets")({
  head: () => ({
    meta: [
      { title: "My Pets | Pet Good Owner Portal" },
      { name: "description", content: "View your registered pets, breeds, ages and microchip details." },
      { property: "og:title", content: "My Pets | Pet Good Owner Portal" },
      { property: "og:description", content: "All of your pets in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyPets,
});

const OWNER_ID = "own_1";

function MyPets() {
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    apiClient.get<Pet[]>(endpoints.pets.byOwner(OWNER_ID)).then(setPets).catch(() => setPets([]));
  }, []);

  return (
    <PortalLayout title="My Pets">
      {!pets ? (
        <Loading />
      ) : (
        <div className="space-y-4">
          {adding ? (
            <Panel title="Add a pet">
              <PetForm
                ownerId={OWNER_ID}
                onSaved={(pet) => {
                  setPets((p) => [...(p ?? []), pet]);
                  setAdding(false);
                }}
              />
              <button onClick={() => setAdding(false)} className="mt-3 text-sm text-foreground/60 underline underline-offset-4">
                Cancel
              </button>
            </Panel>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-sm text-primary-foreground"
            >
              <Plus className="size-4" /> Add a pet
            </button>
          )}

          {pets.length === 0 && !adding ? (
            <EmptyState
              icon={<PawPrint className="size-8" />}
              title="No pets yet"
              message="Add your first pet so we can keep their health records, vaccinations and visits together."
            />
          ) : (
            pets.map((p) => (
              <Panel key={p.id} title={p.name}>
                {p.photo_url ? <img src={p.photo_url} alt={p.name} className="mb-3 h-40 w-full rounded-2xl object-cover" /> : null}
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-foreground/60">Species</dt>
                    <dd>{p.species}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground/60">Breed</dt>
                    <dd>{p.breed}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground/60">Age</dt>
                    <dd>{p.age_years} yrs</dd>
                  </div>
                  <div>
                    <dt className="text-foreground/60">Weight</dt>
                    <dd>{p.weight_kg} kg</dd>
                  </div>
                  <div>
                    <dt className="text-foreground/60">Sex</dt>
                    <dd>{p.sex}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground/60">Microchip</dt>
                    <dd>{p.microchip_id ?? "—"}</dd>
                  </div>
                  {p.allergies ? (
                    <div className="col-span-2">
                      <dt className="text-foreground/60">Allergies</dt>
                      <dd className="text-destructive">{p.allergies}</dd>
                    </div>
                  ) : null}
                </dl>
              </Panel>
            ))
          )}
        </div>
      )}
    </PortalLayout>
  );
}
