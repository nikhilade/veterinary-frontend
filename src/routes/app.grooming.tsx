import { createFileRoute } from "@tanstack/react-router";
import { StaffLayout } from "@/components/app/StaffLayout";
import { Panel } from "@/components/app/ui";

export const Route = createFileRoute("/app/grooming")({
  head: () => ({
    meta: [
      { title: "Grooming | Pet Good Console" },
      { name: "description", content: "Grooming bookings, groomer assignments and service checklists." },
      { property: "og:title", content: "Grooming | Pet Good Console" },
      { property: "og:description", content: "Grooming schedule and service tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GroomingPage,
});

function GroomingPage() {
  return (
    <StaffLayout title="Grooming" subtitle="Salon schedule" permission="grooming:read">
      <Panel title="Coming next">
        <p className="text-sm text-foreground/70">
          Groomer rosters, service checklists and before/after photo uploads will live here.
        </p>
      </Panel>
    </StaffLayout>
  );
}
