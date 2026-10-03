import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { Plus, Trash2, Users, Loader2 } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { AdminHospitalSelector } from "@/components/app/AdminHospitalSelector";

import { EmptyState, Panel, InitialsAvatar } from "@/components/app/ui";
import { DataGrid } from "@/components/app/kit/DataGrid";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { PetOwner } from "@/lib/api/types";
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

export const Route = createFileRoute("/app/owners/")({
  head: () => ({
    meta: [
      { title: "Pet Owners | Pet Good Console" },
      {
        name: "description",
        content: "Search and manage registered pet owner records for the clinic.",
      },
      { property: "og:title", content: "Pet Owners | Pet Good Console" },
      { property: "og:description", content: "Owner directory and contact details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnersPage,
});

const getPageNumbers = (currentPage: number, totalPages: number) => {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      );
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
  }
  return pages;
};

function OwnersPage() {
  const [owners, setOwners] = useState<PetOwner[] | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const [empty, setEmpty] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<PetOwner | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setOwners(null);
    apiClient
      .get<any>(endpoints.petOwners.search, {
        query: search,
        page: currentPage - 1,
        size: pageSize,
      })
      .then((data) => {
        if (data && data.content) {
          setOwners(data.content);
          setTotalPages(data.totalPages || 0);
          setTotalElements(data.totalElements || 0);
          if (!search && currentPage === 1) setEmpty(data.totalElements === 0);
        } else if (Array.isArray(data)) {
          // Fallback if not returning a page
          setOwners(data);
          setTotalPages(Math.ceil(data.length / pageSize));
          setTotalElements(data.length);
          if (!search && currentPage === 1) setEmpty(data.length === 0);
        } else {
          setOwners([]);
          setTotalPages(0);
          setTotalElements(0);
        }
      })
      .catch(() => setOwners([]));
  }, [search, currentPage]);

  const handleDelete = async () => {
    if (!ownerToDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(endpoints.petOwners.delete(ownerToDelete.id));
      toast.success(
        `Owner ${ownerToDelete.firstName} ${ownerToDelete.lastName || ""} deleted successfully`,
      );
      setOwnerToDelete(null);
      // reload current page
      const current = currentPage;
      setCurrentPage(1);
      setTimeout(() => setCurrentPage(current), 10);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete this owner");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <StaffLayout title="Pet Owners" subtitle="Client directory" permission="owners:read">
      <AdminHospitalSelector />
      <Panel
        title="Owners"
        action={
          <div className="flex items-center gap-3">
            <Link
              to="/app/owners/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-sm text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="size-4" /> Add owner
            </Link>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] flex gap-2">
            <div className="relative flex-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearch(searchInput);
                    setCurrentPage(1);
                  }
                }}
                placeholder="Search by phone or name"
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

        {owners === null ? (
          <div className="flex justify-center p-8">
            <Loader2 className="size-6 animate-spin text-forest" />
          </div>
        ) : empty && !search ? (
          <EmptyState
            icon={<Users className="size-8" />}
            title="No owners yet"
            message="Your client directory is empty. Add your first pet owner to start booking visits and tracking patients."
            action={
              <Link
                to="/app/owners/new"
                className="rounded-full bg-forest px-5 py-2.5 text-sm text-primary-foreground"
              >
                Add your first owner
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {owners.map((o) => (
                <div key={o.id} className="flex flex-col justify-between h-full gap-4 rounded-[1.5rem] border border-border bg-card p-5 transition-shadow hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar
                        name={`${o.firstName} ${o.lastName || ""}`}
                        className="size-12 text-lg"
                      />
                      <div>
                        <Link
                          to="/app/owners/$id"
                          params={{ id: o.id }}
                          className="font-semibold text-forest underline-offset-4 hover:underline"
                        >
                          {o.firstName} {o.lastName || ""}
                        </Link>
                        <p className="text-xs text-foreground/60 mt-0.5">
                          {o.pets?.length || o.petsCount || 0} pet(s)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOwnerToDelete(o)}
                      title="Delete owner"
                      className="inline-flex shrink-0 items-center justify-center size-8 rounded-full text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 rounded-xl bg-muted p-3 text-xs text-foreground/70">
                    <div className="flex items-center justify-between">
                      <span>Phone</span>
                      <span className="font-medium text-foreground">{o.phoneNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Email</span>
                      <span className="font-medium text-foreground truncate max-w-[140px]">
                        {o.email || ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-between border-t border-border pt-4">
                <div className="text-sm text-foreground/60">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalElements)} of {totalElements} owners
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
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
                    onClick={() => setCurrentPage((p) => p + 1)}
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
                          const val = parseInt(e.currentTarget.value);
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
      </Panel>

      <AlertDialog open={!!ownerToDelete} onOpenChange={(open) => !open && setOwnerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pet Owner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {ownerToDelete?.firstName} {ownerToDelete?.lastName || ""}
              </span>
              ? This action cannot be undone and will permanently delete this owner record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Deleting…
                </>
              ) : (
                "Delete owner"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StaffLayout>
  );
}
