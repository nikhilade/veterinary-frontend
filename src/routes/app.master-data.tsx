import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CrudTable, type CrudField } from "@/components/app/kit/CrudTable";
import { StaffLayout } from "@/components/app/StaffLayout";
import { endpoints } from "@/lib/api/endpoints";
import { can } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/store";

export const Route = createFileRoute("/app/master-data")({
  head: () => ({
    meta: [
      { title: "Master Data | Pet Good Console" },
      { name: "description", content: "Govern species, breeds, vaccines, medicines and lab tests in one place." },
      { property: "og:title", content: "Master Data | Pet Good Console" },
      { property: "og:description", content: "One configurable CRUD table for every reference list." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MasterDataPage,
});

/** Five screens, one component — each entry is just configuration. */
const collections: { key: string; label: string; description: string; fields: CrudField[] }[] = [
  {
    key: "states",
    label: "States",
    description: "States and provinces used for branch and client addresses.",
    fields: [
      { key: "name", label: "State", required: true },
      { key: "code", label: "Code", required: true },
      { key: "isActive", label: "Status", type: "boolean" },
    ],
  },
  {
    key: "cities",
    label: "Cities",
    description: "Cities mapped to states.",
    fields: [
      { key: "name", label: "City", required: true },
      { key: "stateId", label: "State", type: "select", lookup: "states", displayKey: "stateName", required: true },
      { key: "isActive", label: "Status", type: "boolean" },
    ],
  },
  {
    key: "species",
    label: "Species",
    description: "Top-level animal types offered by the hospital.",
    fields: [
      { key: "name", label: "Species", required: true },
      { key: "code", label: "Code" },
      { key: "description", label: "Description" },
      { key: "active", label: "Status", type: "boolean" },
    ],
  },
  {
    key: "breeds",
    label: "Breeds",
    description: "Breeds mapped to a species, used by the pet registration form.",
    fields: [
      { key: "name", label: "Breed", required: true },
      { key: "speciesId", label: "Species", type: "select", lookup: "species", displayKey: "speciesName", required: true },
      { key: "description", label: "Description" },
      { key: "active", label: "Status", type: "boolean" },
    ],
  },
  {
    key: "vaccines",
    label: "Vaccines",
    description: "Vaccine catalogue with default booster intervals for due-date calculation.",
    fields: [
      { key: "name", label: "Vaccine", required: true },
      { key: "speciesId", label: "Species", type: "select", lookup: "species", displayKey: "speciesName" },
      { key: "interval_months", label: "Booster interval (months)", type: "number" },
      { key: "active", label: "Status", type: "boolean" },
    ],
  },
  {
    key: "medicines",
    label: "Medicines",
    description: "Master medicine list backing prescription autocomplete and pharmacy stock.",
    fields: [
      { key: "name", label: "Medicine", required: true },
      { key: "form", label: "Form", type: "select", options: ["Tablet", "Capsule", "Suspension", "Injection", "Topical"] },
      { key: "strength", label: "Strength" },
      { key: "hsn", label: "HSN code" },
      { key: "active", label: "Status", type: "boolean" },
    ],
  },
  {
    key: "lab-tests",
    label: "Lab tests",
    description: "Diagnostics catalogue with pricing and turnaround time.",
    fields: [
      { key: "name", label: "Test", required: true },
      { key: "code", label: "Code" },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: [
          "HEMATOLOGY",
          "BIOCHEMISTRY",
          "MICROBIOLOGY",
          "SEROLOGY",
          "URINALYSIS",
          "RADIOLOGY",
          "PARASITOLOGY",
          "PATHOLOGY",
          "OTHER",
        ],
      },
      { key: "description", label: "Description" },
      { key: "normalTurnaroundHours", label: "Turnaround (hours)", type: "number" },
      { key: "isActive", label: "Status", type: "boolean" },
    ],
  },
];

function MasterDataPage() {
  const { role } = useAuth();
  const [active, setActive] = useState(collections[0].key);
  const config = collections.find((c) => c.key === active) ?? collections[0];

  return (
    <StaffLayout title="Master Data" subtitle="Reference lists used across the app" permission="masterdata:read">
      <div className="mb-5 flex flex-wrap gap-2">
        {collections.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setActive(c.key)}
            className={`rounded-full border px-4 py-2 text-sm ${active === c.key ? "border-forest bg-forest text-primary-foreground" : "border-border text-foreground/70"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <CrudTable
        key={config.key}
        title={config.label}
        description={config.description}
        fields={config.fields}
        canWrite={can(role, "masterdata:write")}
        listPath={endpoints.masterData.list(config.key)}
        createPath={endpoints.masterData.create(config.key)}
        detailPath={(id) => endpoints.masterData.detail(config.key, id)}
      />
    </StaffLayout>
  );
}
