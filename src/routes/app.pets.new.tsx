import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { Panel } from "@/components/app/ui";
import { PetForm } from "@/components/app/kit/PetForm";
import { OwnerSearchCombobox } from "@/components/app/kit/OwnerSearchCombobox";
import type { PetOwner } from "@/lib/api/types";

export const Route = createFileRoute("/app/pets/new")({
  head: () => ({
    meta: [
      { title: "Add Patient | Pet Good Console" },
      { name: "description", content: "Register a new pet with species, breed, allergies and a photo." },
      { property: "og:title", content: "Add Patient | Pet Good Console" },
      { property: "og:description", content: "Create a new patient record." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewPetPage,
});

function NewPetPage() {
  const navigate = useNavigate();
  const [owner, setOwner] = useState<PetOwner | null>(null);

  return (
    <StaffLayout title="Add Patient" subtitle="Owner first, then pet details" permission="pets:write">
      <Link to="/app/pets" className="mb-4 inline-flex items-center gap-1.5 text-sm text-forest">
        <ArrowLeft className="size-4" /> Back to patients
      </Link>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Owner">
          <OwnerSearchCombobox value={owner} onChange={setOwner} />
        </Panel>
        <Panel title="Pet details">
          {owner ? (
            <PetForm
              key={owner.id}
              ownerId={owner.id}
              onSaved={(pet) => navigate({ to: "/app/pets/$id", params: { id: pet.id } })}
            />
          ) : (
            <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-foreground/60">
              Search for the owner by phone number first — pets always belong to an owner.
            </p>
          )}
        </Panel>
      </div>
    </StaffLayout>
  );
}
