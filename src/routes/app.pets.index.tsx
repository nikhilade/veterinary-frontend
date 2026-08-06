import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback } from "react";
import { Dog, Plus } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { Panel } from "@/components/app/ui";
import { DataTable, type DataTableColumn } from "@/components/app/kit/DataTable";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Pet } from "@/lib/api/types";

export const Route = createFileRoute("/app/pets/")({
  head: () => ({
    meta: [
      { title: "Patients | Pet Good Console" },
      { name: "description", content: "Full patient register with species, breed, weight and microchip data." },
      { property: "og:title", content: "Patients | Pet Good Console" },
      { property: "og:description", content: "Every pet registered with the clinic." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PetsPage,
});

const columns: DataTableColumn<Pet>[] = [
  {
    key: "name",
    header: "Pet",
    sortValue: (p) => p.name,
    cell: (p) => (
      <Link to="/app/pets/$id" params={{ id: p.id }} className="font-medium text-forest underline-offset-4 hover:underline">
        {p.name}
      </Link>
    ),
  },
  { key: "owner", header: "Owner", sortValue: (p) => p.owner_name, cell: (p) => p.owner_name },
  { key: "species", header: "Species", sortValue: (p) => p.species, cell: (p) => p.species },
  { key: "breed", header: "Breed", cell: (p) => p.breed },
  { key: "age", header: "Age", sortValue: (p) => p.age_years, cell: (p) => `${p.age_years} yrs` },
  { key: "weight", header: "Weight", sortValue: (p) => p.weight_kg, cell: (p) => `${p.weight_kg} kg` },
];

function PetsPage() {
  const fetchPage = useCallback(
    (cursor: string | null) => apiClient.list<Pet>(endpoints.pets.list, { limit: 10, cursor: cursor ?? undefined }),
    [],
  );

  return (
    <StaffLayout title="Patients" subtitle="Registered pets" permission="pets:read">
      <Panel
        title="Patients"
        action={
          <Link
            to="/app/pets/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-sm text-primary-foreground"
          >
            <Plus className="size-4" /> Add pet
          </Link>
        }
      >
        <DataTable
          columns={columns}
          rowKey={(p) => p.id}
          fetchPage={fetchPage}
          emptyMessage="No patients registered yet — add your first pet to get started."
        />
        <p className="mt-3 flex items-center gap-2 text-xs text-foreground/50">
          <Dog className="size-3.5" /> Open a patient to view their medical history timeline.
        </p>
      </Panel>
    </StaffLayout>
  );
}
