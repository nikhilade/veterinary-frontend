import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CrudTable } from "@/components/app/kit/CrudTable";
import { StaffLayout } from "@/components/app/StaffLayout";
import { AdminHospitalSelector } from "@/components/app/AdminHospitalSelector";

import { endpoints } from "@/lib/api/endpoints";
import { can } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/store";
import { useMasterData } from "@/hooks/use-master-data";

type Hospital = { id: string; name: string };

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
  const { role, adminHospitalId } = useAuth();

  const { data: allStates = [] } = useMasterData("states");
  
  const countries = useMemo(() => {
    const map = new Map<string, any>();
    allStates.forEach((s: any) => {
      if (s.countryId && !map.has(s.countryId)) {
        map.set(s.countryId, { id: s.countryId, name: s.countryName || s.countryId });
      }
    });
    return Array.from(map.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [allStates]);

  const ready = role !== "SUPER_ADMIN" || !!adminHospitalId;

  return (
    <StaffLayout title="Branches" subtitle="Locations and working hours" permission="branches:read">
      <AdminHospitalSelector />
      <div className="space-y-6">
        {ready ? (
          <CrudTable
            key={adminHospitalId || "user-context"}
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
              { key: "country", label: "Country", type: "select", options: countries, required: true },
              { 
                key: "stateId", 
                label: "State", 
                type: "select", 
                lookup: "states", 
                optionsFilter: (options, form) => options.filter((s: any) => s.countryId === form.country),
                required: true 
              },
              { key: "cityId", label: "City", type: "select", lookup: (form) => form.stateId ? `cities-by-state/${form.stateId}` : null, required: true },
              { key: "pincode", label: "Pincode", required: true },
              { key: "addressLine1", label: "Address", required: true },
              { key: "phone", label: "Phone", required: true },
              { key: "email", label: "Email", required: true },
              { key: "latitude", label: "Latitude", type: "number" },
              { key: "longitude", label: "Longitude", type: "number" },
              { key: "isHeadBranch", label: "Head Branch", type: "boolean" },
            ]}
          />
        ) : null}
      </div>
    </StaffLayout>
  );
}
