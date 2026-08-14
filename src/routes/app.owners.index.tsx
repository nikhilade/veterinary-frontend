import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { Plus, Trash2, Users, Loader2 } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Panel } from "@/components/app/ui";
import { DataTable, type DataTableColumn } from "@/components/app/kit/DataTable";
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
      { name: "description", content: "Search and manage registered pet owner records for the clinic." },
      { property: "og:title", content: "Pet Owners | Pet Good Console" },
      { property: "og:description", content: "Owner directory and contact details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnersPage,
});

function OwnersPage() {
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [empty, setEmpty] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<PetOwner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPage = useCallback(
    async (cursor: string | null) => {
      const res = await apiClient.list<PetOwner>(endpoints.petOwners.search, {
        query: applied,
        limit: 10,
        cursor: cursor ?? undefined,
      });
      if (!cursor) setEmpty(res.items.length === 0);
      return res;
    },
    [applied],
  );

  const handleDelete = async () => {
    if (!ownerToDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(endpoints.petOwners.delete(ownerToDelete.id));
      toast.success(`Owner ${ownerToDelete.firstName} ${ownerToDelete.lastName || ""} deleted successfully`);
      setOwnerToDelete(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete this owner");
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<PetOwner>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortValue: (o) => `${o.firstName} ${o.lastName || ""}`,
        cell: (o) => (
          <Link to="/app/owners/$id" params={{ id: o.id }} className="font-medium text-forest underline-offset-4 hover:underline">
            {`${o.firstName} ${o.lastName || ""}`}
          </Link>
        ),
      },
      { key: "phone", header: "Phone", sortValue: (o) => o.phoneNumber, cell: (o) => o.phoneNumber },
      { key: "email", header: "Email", cell: (o) => o.email || "—" },
      { key: "pets", header: "Pets", sortValue: (o) => o.pets?.length || o.petsCount || 0, cell: (o) => o.pets?.length || o.petsCount || 0 },
      {
        key: "actions",
        header: "Actions",
        className: "text-right",
        cell: (o) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOwnerToDelete(o)}
              title="Delete owner"
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
    <StaffLayout title="Pet Owners" subtitle="Client directory" permission="owners:read">
      <Panel
        title="Owners"
        action={
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setApplied(q)}
              onBlur={() => setApplied(q)}
              placeholder="Search by phone or name"
              className="rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-forest"
            />
            <Link
              to="/app/owners/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-sm text-primary-foreground"
            >
              <Plus className="size-4" /> Add owner
            </Link>
          </div>
        }
      >
        {empty && !applied ? (
          <EmptyState
            icon={<Users className="size-8" />}
            title="No owners yet"
            message="Your client directory is empty. Add your first pet owner to start booking visits and tracking patients."
            action={
              <Link to="/app/owners/new" className="rounded-full bg-forest px-5 py-2.5 text-sm text-primary-foreground">
                Add your first owner
              </Link>
            }
          />
        ) : (
          <DataTable
            key={`${applied}-${refreshKey}`}
            columns={columns}
            rowKey={(o) => o.id}
            fetchPage={fetchPage}
            emptyMessage={`No owners match “${applied}”. Try a phone number, or add a new owner.`}
          />
        )}
      </Panel>

      <AlertDialog open={!!ownerToDelete} onOpenChange={(open) => !open && setOwnerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pet Owner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{ownerToDelete?.firstName} {ownerToDelete?.lastName || ""}</span>? This action cannot be undone and will permanently delete this owner record.
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
