import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { EmptyState, Loading, Panel, StatusPill, formatDate, formatMoney } from "@/components/app/ui";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Invoice } from "@/lib/api/types";

export const Route = createFileRoute("/portal/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices | Pet Good Owner Portal" },
      { name: "description", content: "View and track your Pet Good invoices, amounts due and payment status." },
      { property: "og:title", content: "Invoices | Pet Good Owner Portal" },
      { property: "og:description", content: "Billing history and outstanding balances." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Invoices,
});

function Invoices() {
  const [items, setItems] = useState<Invoice[] | null>(null);

  useEffect(() => {
    apiClient.get<Invoice[]>(endpoints.invoices.mine).then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <PortalLayout title="Invoices">
      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState message="No invoices yet." />
      ) : (
        <div className="space-y-4">
          {items.map((inv) => (
            <Panel key={inv.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg">{inv.number}</p>
                  <p className="mt-1 text-sm text-foreground/60">Due {formatDate(inv.due_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-forest">{formatMoney(inv.amount)}</p>
                  <div className="mt-2">
                    <StatusPill status={inv.status} />
                  </div>
                </div>
              </div>
              <ul className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                {inv.items.map((it) => (
                  <li key={it.label} className="flex justify-between">
                    <span className="text-foreground/70">{it.label}</span>
                    <span>{formatMoney(it.amount)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
