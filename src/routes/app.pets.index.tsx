import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { Dog, Plus, Trash2, Loader2 } from "lucide-react";
import { SpeciesName, BreedName } from "@/components/app/MasterData";
import { StaffLayout } from "@/components/app/StaffLayout";
import { Panel } from "@/components/app/ui";
import { DataTable, type DataTableColumn } from "@/components/app/kit/DataTable";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Pet } from "@/lib/api/types";
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

function PetsPage() {
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPage = useCallback(
    (cursor: string | null) => apiClient.list<Pet>(endpoints.pets.list, { limit: 10, cursor: cursor ?? undefined }),
    [],
  );

  const handleDeletePet = async () => {
    if (!petToDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(endpoints.pets.delete(petToDelete.id));
      toast.success(`Pet ${petToDelete.petName} deleted successfully`);
      setPetToDelete(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete this pet");
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<Pet>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Pet",
        sortValue: (p) => p.petName,
        cell: (p) => (
          <Link to="/app/pets/$id" params={{ id: p.id }} className="font-medium text-forest underline-offset-4 hover:underline">
            {p.petName}
          </Link>
        ),
      },
      {
        key: "owner",
        header: "Owner",
        sortValue: (p) => p.ownerName || p.ownerId,
        cell: (p) => (
          <Link to="/app/owners/$id" params={{ id: p.ownerId }} className="text-forest hover:underline underline-offset-4">
            {p.ownerName || p.ownerId}
          </Link>
        ),
      },
      { key: "species", header: "Species", sortValue: (p) => p.speciesId, cell: (p) => <SpeciesName id={p.speciesId} /> },
      { key: "breed", header: "Breed", cell: (p) => <BreedName id={p.breedId} /> },
      { key: "age", header: "Age", sortValue: (p) => p.age, cell: (p) => (p.age != null ? `${p.age} yrs` : "—") },
      { key: "weight", header: "Weight", sortValue: (p) => p.weightKg, cell: (p) => (p.weightKg != null ? `${p.weightKg} kg` : "—") },
      {
        key: "actions",
        header: "Actions",
        className: "text-right",
        cell: (p) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPetToDelete(p)}
              title="Delete pet"
              className="inline-flex items-center justify-center size-8 rounded-full text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ),
      },
    ],
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
          key={refreshKey}
          columns={columns}
          rowKey={(p) => p.id}
          fetchPage={fetchPage}
          emptyMessage="No patients registered yet — add your first pet to get started."
        />
        <p className="mt-3 flex items-center gap-2 text-xs text-foreground/50">
          <Dog className="size-3.5" /> Open a patient to view their medical history timeline.
        </p>
      </Panel>

      <AlertDialog open={!!petToDelete} onOpenChange={(open) => !open && setPetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{petToDelete?.petName}</span>? This action cannot be undone and will permanently delete this patient record.
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
