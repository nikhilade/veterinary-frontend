import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { Loading, Panel, formatDate } from "@/components/app/ui";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Prescription } from "@/lib/api/types";

export const Route = createFileRoute("/app/pharmacy")({
  head: () => ({
    meta: [
      { title: "Pharmacy | Pet Good Console" },
      { name: "description", content: "Dispense prescriptions and review medication instructions and refills." },
      { property: "og:title", content: "Pharmacy | Pet Good Console" },
      { property: "og:description", content: "Prescription queue for the pharmacy team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PharmacyPage,
});

function PharmacyPage() {
  const [items, setItems] = useState<Prescription[] | null>(null);

  useEffect(() => {
    apiClient.get<Prescription[]>(endpoints.prescriptions.list).then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <StaffLayout title="Pharmacy" subtitle="Prescription queue" permission="pharmacy:read">
      {!items ? (
        <Loading />
      ) : (
        <Panel title={`${items.length} prescriptions`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-xs uppercase text-foreground/50">
                <tr>
                  <th className="pb-3">Medication</th>
                  <th className="pb-3">Pet</th>
                  <th className="pb-3">Doctor</th>
                  <th className="pb-3">Dosage</th>
                  <th className="pb-3">Issued</th>
                  <th className="pb-3">Refills</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="py-3 font-medium">{p.medication}</td>
                    <td className="py-3 text-foreground/70">{p.pet_name}</td>
                    <td className="py-3 text-foreground/70">{p.doctor_name}</td>
                    <td className="py-3 text-foreground/70">{p.dosage}</td>
                    <td className="py-3 text-foreground/70">{formatDate(p.issued_at)}</td>
                    <td className="py-3 text-foreground/70">{p.refills_left}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </StaffLayout>
  );
}
