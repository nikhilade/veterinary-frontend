import { createFileRoute } from "@tanstack/react-router";
import { StaffLayout } from "@/components/app/StaffLayout";
import { Panel } from "@/components/app/ui";

export const Route = createFileRoute("/app/lab")({
  head: () => ({
    meta: [
      { title: "Laboratory | Pet Good Console" },
      { name: "description", content: "Lab requests, sample tracking and diagnostic results for clinic patients." },
      { property: "og:title", content: "Laboratory | Pet Good Console" },
      { property: "og:description", content: "Diagnostics workflow for the clinic lab team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LabPage,
});

function LabPage() {
  return (
    <StaffLayout title="Laboratory" subtitle="Diagnostics workflow" permission="lab:read">
      <Panel title="Coming next">
        <p className="text-sm text-foreground/70">
          Lab request queue, sample tracking and result entry will be built here on top of the existing API client.
        </p>
      </Panel>
    </StaffLayout>
  );
}
