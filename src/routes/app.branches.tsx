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
          { key: "hospitalId", label: "Hospital", required: true, type: "select", lookup: "hospitals", hideInTable: true },
          { key: "branchName", label: "Branch name", required: true },
          { key: "branchCode", label: "Branch code", required: true },
          { key: "stateId", label: "State", type: "select", lookup: "states", required: true },
          { key: "cityId", label: "City", type: "select", lookup: (form) => form.stateId ? `cities-by-state/${form.stateId}` : null, required: true },
          { key: "country", label: "Country" },
          { key: "pincode", label: "Pincode", required: true },
          { key: "addressLine1", label: "Address", required: true },
          { key: "phone", label: "Phone", required: true },
          { key: "email", label: "Email", required: true },
          { key: "latitude", label: "Latitude", type: "number" },
          { key: "longitude", label: "Longitude", type: "number" },
          { key: "isHeadBranch", label: "Head Branch", type: "boolean" },
        ]}
      />
    </StaffLayout>
  );
}
