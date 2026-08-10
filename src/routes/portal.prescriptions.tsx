import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { EmptyState, Loading, Panel, formatDate } from "@/components/app/ui";
import { PrescriptionPdfButton } from "@/components/app/kit/PrescriptionPdfButton";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { PrescriptionDetail } from "@/lib/api/types";

export const Route = createFileRoute("/portal/prescriptions")({
  head: () => ({
    meta: [
      { title: "Prescriptions | Pet Good Owner Portal" },
      { name: "description", content: "Review your pet's medications, dosage instructions and refills left, and download the PDF." },
      { property: "og:title", content: "Prescriptions | Pet Good Owner Portal" },
      { property: "og:description", content: "Medications and refills for your pets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Prescriptions,
});

function Prescriptions() {
  const [items, setItems] = useState<PrescriptionDetail[] | null>(null);

  useEffect(() => {
    apiClient.get<PrescriptionDetail[]>(endpoints.prescriptions.mine).then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <PortalLayout title="Prescriptions">
      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState message="No active prescriptions." />
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <Panel key={p.id} title={p.petName}>
              <p className="text-sm text-foreground/70">Prescribed by {p.doctorName}</p>

              <ul className="mt-3 space-y-3">
                {(p.items.length
                  ? p.items
                  : [
                      {
                        medicineId: "",
                        name: p.medication,
                        strength: "",
                        form: "",
                        dosage: p.dosage,
                        frequency: "",
                        durationDays: 0,
                        notes: p.instructions,
                      },
                    ]
                ).map((it, i) => (
                  <li key={i} className="rounded-[1.25rem] bg-muted px-4 py-3">
                    <p className="text-sm font-medium">
                      {it.name} {it.strength}
                    </p>
                    <p className="mt-1 text-sm text-foreground/70">
                      {[it.dosage, it.frequency, it.durationDays ? `${it.durationDays} days` : ""]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {it.notes ? <p className="mt-1 text-xs text-foreground/60">{it.notes}</p> : null}
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-xs text-foreground/50">
                Issued {formatDate(p.issuedAt)} · {p.refillsLeft} refills left · read-only
              </p>
              <PrescriptionPdfButton prescriptionId={p.id} label="View / download PDF" className="mt-3" />
            </Panel>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}

