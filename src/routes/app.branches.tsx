import { createFileRoute } from "@tanstack/react-router";
import { CrudTable } from "@/components/app/kit/CrudTable";
import { StaffLayout } from "@/components/app/StaffLayout";
import { endpoints } from "@/lib/api/endpoints";
import { can } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/store";

export const Route = createFileRoute("/app/branches")({
  head: () => ({
    meta: [
      { title: "Branches | Pet Good Console" },
      { name: "description", content: "Manage hospital branches with addresses, GPS coordinates and hours." },
      { property: "og:title", content: "Branches | Pet Good Console" },
      { property: "og:description", content: "Branch directory with location and working hours." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BranchesPage,
});

function BranchesPage() {
  const { role } = useAuth();
  return (
    <StaffLayout title="Branches" subtitle="Locations and working hours" permission="branches:read">
      <CrudTable
        title="Branch directory"
        description="Latitude and longitude power the branch map and travel-time estimates in the owner portal."
        canWrite={can(role, "branches:write")}
        listPath={endpoints.branchAdmin.list}
        createPath={endpoints.branchAdmin.create}
        detailPath={endpoints.branchAdmin.detail}
        emptyMessage="No branches yet — add your first location."
        fields={[
          { key: "name", label: "Branch name", required: true },
          { key: "city", label: "City" },
          { key: "address", label: "Address" },
          { key: "phone", label: "Phone" },
          { key: "latitude", label: "Latitude", type: "number" },
          { key: "longitude", label: "Longitude", type: "number" },
          { key: "open_hour", label: "Opens (hour)", type: "number" },
          { key: "close_hour", label: "Closes (hour)", type: "number" },
          { key: "active", label: "Status", type: "boolean" },
        ]}
      />
    </StaffLayout>
  );
}
