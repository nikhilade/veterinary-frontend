import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Plus, Users } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Panel } from "@/components/app/ui";
import { DataTable, type DataTableColumn } from "@/components/app/kit/DataTable";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { PetOwner } from "@/lib/api/types";

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

const columns: DataTableColumn<PetOwner>[] = [
  {
    key: "name",
    header: "Name",
    sortValue: (o) => o.name,
    cell: (o) => (
      <Link to="/app/owners/$id" params={{ id: o.id }} className="font-medium text-forest underline-offset-4 hover:underline">
        {o.name}
      </Link>
    ),
  },
  { key: "phone", header: "Phone", sortValue: (o) => o.phone, cell: (o) => o.phone },
  { key: "email", header: "Email", cell: (o) => o.email || "—" },
  { key: "pets", header: "Pets", sortValue: (o) => o.pets_count, cell: (o) => o.pets_count },
];

function OwnersPage() {
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [empty, setEmpty] = useState(false);

  const fetchPage = useCallback(
    async (cursor: string | null) => {
      const res = await apiClient.list<PetOwner>(endpoints.petOwners.search, {
        q: applied,
        limit: 10,
        cursor: cursor ?? undefined,
      });
      if (!cursor) setEmpty(res.items.length === 0);
      return res;
    },
    [applied],
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
            key={applied}
            columns={columns}
            rowKey={(o) => o.id}
            fetchPage={fetchPage}
            emptyMessage={`No owners match “${applied}”. Try a phone number, or add a new owner.`}
          />
        )}
      </Panel>
    </StaffLayout>
  );
}
