import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { Dog, Plus, Trash2, Loader2 } from "lucide-react";
import { SpeciesName, BreedName } from "@/components/app/MasterData";
import { StaffLayout } from "@/components/app/StaffLayout";
import { AdminHospitalSelector } from "@/components/app/AdminHospitalSelector";

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

const getPageNumbers = (currentPage: number, totalPages: number) => {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
  }
  return pages;
};

function PetsPage() {
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;
  
  const [empty, setEmpty] = useState(false);
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPets(null);
    apiClient
      .get<any>(endpoints.pets.search, { query: search, page: currentPage - 1, size: pageSize })
      .then((data) => {
        if (data && data.content) {
          setPets(data.content);
          setTotalPages(data.totalPages || 0);
          setTotalElements(data.totalElements || 0);
          if (!search && currentPage === 1) setEmpty(data.totalElements === 0);
        } else if (Array.isArray(data)) {
          // Fallback if not returning a page
          setPets(data);
          setTotalPages(Math.ceil(data.length / pageSize));
          setTotalElements(data.length);
          if (!search && currentPage === 1) setEmpty(data.length === 0);
        } else {
          setPets([]);
          setTotalPages(0);
          setTotalElements(0);
        }
      })
      .catch(() => setPets([]));
  }, [search, currentPage]);

  const handleDeletePet = async () => {
    if (!petToDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(endpoints.pets.delete(petToDelete.id));
      toast.success(`Pet ${petToDelete.petName} deleted successfully`);
      setPetToDelete(null);
      // reload current page
      const current = currentPage;
      setCurrentPage(1);
      setTimeout(() => setCurrentPage(current), 10);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete this pet");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <StaffLayout title="Patients" subtitle="Registered pets" permission="pets:read">
      <AdminHospitalSelector />
      <Panel
        title="Patients"
        action={
          <div className="flex items-center gap-3">
            <Link
              to="/app/pets/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-sm text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="size-4" /> Add pet
            </Link>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] flex gap-2">
            <div className="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearch(searchInput);
                    setCurrentPage(1);
                  }
                }}
                placeholder="Search by name, owner, or phone"
                className="w-full rounded-full border border-border bg-background py-2.5 pl-11 pr-4 text-sm outline-none focus:border-forest"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch(searchInput);
                setCurrentPage(1);
              }}
              className="rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </div>
        </div>

        {pets === null ? (
          <div className="flex justify-center p-8"><Loader2 className="size-6 animate-spin text-forest" /></div>
        ) : empty && !search ? (
          <div className="py-8 text-center text-sm text-foreground/60">
            No patients registered yet — add your first pet to get started.
          </div>
        ) : pets.length === 0 ? (
          <div className="py-8 text-center text-sm text-foreground/60">No patients match this search.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="text-xs uppercase text-foreground/50">
                  <tr>
                    <th className="pb-3 pr-4">Pet</th>
                    <th className="pb-3 pr-4">Owner</th>
                    <th className="pb-3 pr-4">Species</th>
                    <th className="pb-3 pr-4">Breed</th>
                    <th className="pb-3 pr-4">Age</th>
                    <th className="pb-3 pr-4">Weight</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pets.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="py-3 pr-4">
                        <Link to="/app/pets/$id" params={{ id: p.id }} className="font-medium text-forest underline-offset-4 hover:underline">
                          {p.petName}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <Link to="/app/owners/$id" params={{ id: p.ownerId }} className="text-forest hover:underline underline-offset-4">
                          {p.ownerName || p.ownerId}
                        </Link>
                      </td>
                      <td className="py-3 pr-4"><SpeciesName id={p.speciesId} /></td>
                      <td className="py-3 pr-4"><BreedName id={p.breedId} /></td>
                      <td className="py-3 pr-4">{p.age != null ? `${p.age} yrs` : "—"}</td>
                      <td className="py-3 pr-4">{p.weightKg != null ? `${p.weightKg} kg` : "—"}</td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setPetToDelete(p)}
                          title="Delete pet"
                          className="inline-flex items-center justify-center size-8 rounded-full text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-between border-t border-border pt-4">
                <div className="text-sm text-foreground/60">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalElements)} of {totalElements} patients
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg px-3 py-1 text-sm font-medium border border-border disabled:opacity-50 hover:bg-muted"
                  >
                    Prev
                  </button>
                  {getPageNumbers(currentPage, totalPages).map((p, i) => (
                    <button
                      key={i}
                      disabled={p === "..."}
                      onClick={() => typeof p === "number" && setCurrentPage(p)}
                      className={`size-8 rounded-lg text-sm font-medium ${
                        p === currentPage
                          ? "bg-forest text-primary-foreground"
                          : p === "..."
                            ? "cursor-default text-foreground/50"
                            : "hover:bg-muted"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg px-3 py-1 text-sm font-medium border border-border disabled:opacity-50 hover:bg-muted"
                  >
                    Next
                  </button>
                  <div className="ml-4 flex items-center gap-2 border-l border-border pl-4">
                    <span className="text-sm text-foreground/70">Go to:</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      className="w-14 rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-forest"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = parseInt(e.currentTarget.value, 10);
                          if (!isNaN(val) && val >= 1 && val <= totalPages) {
                            setCurrentPage(val);
                          }
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

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
