import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Lock, Plus, Trash2, X } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel } from "@/components/app/ui";
import { GstBreakdown } from "@/components/app/kit/GstBreakdown";
import { INR, MoneyInput } from "@/components/app/kit/MoneyInput";
import { IdempotentSubmitButton } from "@/components/app/kit/IdempotentSubmitButton";
import { OwnerSearchCombobox } from "@/components/app/kit/OwnerSearchCombobox";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { PetOwner } from "@/lib/api/types";
import { LINE_ITEM_TYPES } from "@/lib/api/billing-types";
import type { ChargeableItem, InvoiceDetail, InvoiceLineItem, LineItemType } from "@/lib/api/billing-types";

export const Route = createFileRoute("/app/billing")({
  head: () => ({
    meta: [
      { title: "Billing | Pet Good Console" },
      { name: "description", content: "Build GST invoices from consultation, lab, pharmacy and grooming charges." },
      { property: "og:title", content: "Billing | Pet Good Console" },
      { property: "og:description", content: "Clinic invoicing with automatic GST breakdown." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingPage,
});

const statusTone: Record<InvoiceDetail["status"], string> = {
  DRAFT: "bg-muted text-foreground/70",
  DUE: "bg-clay/15 text-clay",
  OVERDUE: "bg-destructive/10 text-destructive",
  PAID: "bg-forest/10 text-forest",
  CANCELLED: "bg-foreground/10 text-foreground/60",
};

/** Mirrors the server's ERR_INVOICE_NOT_EDITABLE rule client-side. */
const isLocked = (invoice: InvoiceDetail | null) =>
  invoice?.status === "PAID" || invoice?.status === "CANCELLED";

function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceDetail[] | null>(null);
  const [catalog, setCatalog] = useState<ChargeableItem[]>([]);
  const [editing, setEditing] = useState<InvoiceDetail | null>(null);
  const [building, setBuilding] = useState(false);

  const load = useCallback(() => {
    apiClient
      .get<InvoiceDetail[]>(endpoints.billing.invoices)
      .then(setInvoices)
      .catch(() => setInvoices([]));
  }, []);

  useEffect(() => {
    load();
    apiClient.get<ChargeableItem[]>(endpoints.billing.chargeableItems).then(setCatalog).catch(() => setCatalog([]));
  }, [load]);

  const outstanding = (invoices ?? [])
    .filter((i) => i.status === "DUE" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + (i.grand_total - i.amount_paid), 0);

  return (
    <StaffLayout title="Billing" subtitle="Invoices, line items and GST" permission="billing:read">
      {!invoices ? (
        <Loading />
      ) : building || editing ? (
        <InvoiceBuilder
          catalog={catalog}
          invoice={editing}
          onClose={() => {
            setBuilding(false);
            setEditing(null);
          }}
          onSaved={() => {
            load();
            setBuilding(false);
            setEditing(null);
          }}
        />
      ) : (
        <Panel
          title={`Outstanding: ${INR(outstanding)}`}
          action={
            <button
              onClick={() => setBuilding(true)}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm text-primary-foreground"
            >
              <Plus className="size-4" /> New invoice
            </button>
          }
        >
          {invoices.length === 0 ? (
            <EmptyState title="No invoices yet" message="Create the first invoice to start billing clients." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase text-foreground/50">
                  <tr>
                    <th className="pb-3">Invoice</th>
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Issued</th>
                    <th className="pb-3">Items</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Paid</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((i) => (
                    <tr key={i.id} className="border-t border-border">
                      <td className="py-3 font-medium">{i.number}</td>
                      <td className="py-3 text-foreground/70">
                        {i.owner_name}
                        {i.pet_name ? <span className="text-foreground/45"> · {i.pet_name}</span> : null}
                      </td>
                      <td className="py-3 text-foreground/70">{new Date(i.issued_at).toLocaleDateString()}</td>
                      <td className="py-3 text-foreground/70">{i.line_items.length}</td>
                      <td className="py-3 tabular-nums">{INR(i.grand_total)}</td>
                      <td className="py-3 tabular-nums text-foreground/70">{INR(i.amount_paid)}</td>
                      <td className="py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusTone[i.status]}`}>
                          {i.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button onClick={() => setEditing(i)} className="text-xs font-medium text-forest underline">
                          {isLocked(i) ? "View" : "Edit"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </StaffLayout>
  );
}

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest disabled:opacity-60";

function InvoiceBuilder({
  catalog,
  invoice,
  onClose,
  onSaved,
}: {
  catalog: ChargeableItem[];
  invoice: InvoiceDetail | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const locked = isLocked(invoice);
  const [owner, setOwner] = useState<PetOwner | null>(null);
  const [petName, setPetName] = useState(invoice?.pet_name ?? "");
  const [type, setType] = useState<LineItemType>("CONSULTATION");
  const [items, setItems] = useState<InvoiceLineItem[]>(invoice?.line_items ?? []);
  const [discount, setDiscount] = useState(invoice?.discount ?? 0);
  const [gstRate, setGstRate] = useState(invoice?.gst_rate ?? 18);
  const [interState, setInterState] = useState(invoice?.inter_state ?? false);
  const [error, setError] = useState("");

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.amount, 0), [items]);
  const options = catalog.filter((c) => c.type === type);

  function addItem(entry: ChargeableItem) {
    if (locked) return;
    setItems((current) => {
      const existing = current.find((i) => i.label === entry.label && i.type === entry.type);
      if (existing) {
        return current.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1, amount: (i.quantity + 1) * i.unit_price } : i,
        );
      }
      return [
        ...current,
        {
          id: `li_${entry.id}_${current.length}`,
          type: entry.type,
          label: entry.label,
          quantity: 1,
          unit_price: entry.unit_price,
          amount: entry.unit_price,
        },
      ];
    });
  }

  function setQuantity(id: string, quantity: number) {
    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, quantity, amount: Math.max(1, quantity) * i.unit_price } : i)),
    );
  }

  async function submit(headers: { "Idempotency-Key": string }) {
    setError("");
    if (locked) throw new Error("This invoice can no longer be edited.");
    if (!items.length) throw new Error("Add at least one line item.");
    const payload = {
      owner_id: invoice?.owner_id ?? owner?.id,
      owner_name: invoice?.owner_name ?? owner?.name,
      pet_name: petName || null,
      line_items: items,
      discount,
      gst_rate: gstRate,
      inter_state: interState,
    };
    if (invoice) return apiClient.patch<InvoiceDetail>(endpoints.billing.invoice(invoice.id), payload, headers);
    if (!owner) throw new Error("Select the client being billed.");
    return apiClient.post<InvoiceDetail>(endpoints.billing.invoices, payload, headers);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-5">
        <Panel
          title={invoice ? `Invoice ${invoice.number}` : "New invoice"}
          action={
            <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm">
              <X className="size-4" /> Close
            </button>
          }
        >
          {locked ? (
            <div className="mb-4 flex items-start gap-3 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
              <Lock className="mt-0.5 size-4 shrink-0" />
              <p>
                <span className="font-medium">Invoice not editable.</span> This invoice is{" "}
                {invoice?.status.toLowerCase()} — corrections must go through the refund and credit-note flow.
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {invoice ? (
              <div>
                <p className="mb-1.5 text-xs font-medium text-foreground/60">Client</p>
                <p className="rounded-2xl bg-muted px-4 py-2.5 text-sm">{invoice.owner_name}</p>
              </div>
            ) : (
              <OwnerSearchCombobox value={owner} onChange={setOwner} />
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/60">Patient (optional)</label>
              <input
                className={field}
                disabled={locked}
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Pet name"
              />
            </div>
          </div>
        </Panel>

        <Panel title="Add charges">
          <div className="flex flex-wrap gap-2">
            {LINE_ITEM_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                disabled={locked}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                  type === t ? "bg-forest text-primary-foreground" : "bg-muted text-foreground/70"
                }`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {options.map((c) => (
              <button
                key={c.id}
                onClick={() => addItem(c)}
                disabled={locked}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 text-left text-sm transition-colors hover:border-forest disabled:opacity-50"
              >
                <span>{c.label}</span>
                <span className="shrink-0 tabular-nums text-foreground/60">{INR(c.unit_price)}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={`Line items (${items.length})`}>
          {items.length === 0 ? (
            <EmptyState message="Pick charges above to build this invoice." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase text-foreground/50">
                  <tr>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Rate</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id} className="border-t border-border">
                      <td className="py-3 text-xs uppercase text-foreground/50">{i.type}</td>
                      <td className="py-3">{i.label}</td>
                      <td className="py-3 tabular-nums text-foreground/70">{INR(i.unit_price)}</td>
                      <td className="py-3">
                        <input
                          type="number"
                          min={1}
                          disabled={locked}
                          value={i.quantity}
                          onChange={(e) => setQuantity(i.id, Number(e.target.value))}
                          className="w-16 rounded-xl border border-border bg-background px-2 py-1 text-sm tabular-nums disabled:opacity-60"
                        />
                      </td>
                      <td className="py-3 tabular-nums">{INR(i.amount)}</td>
                      <td className="py-3 text-right">
                        <button
                          disabled={locked}
                          onClick={() => setItems((c) => c.filter((x) => x.id !== i.id))}
                          className="text-foreground/40 hover:text-destructive disabled:opacity-40"
                          aria-label={`Remove ${i.label}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel title="Tax & totals">
          <div className="space-y-4">
            <MoneyInput label="Discount" value={discount} onChange={setDiscount} disabled={locked} />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/60">GST rate</label>
              <select
                className={field}
                disabled={locked}
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
              >
                {[0, 5, 12, 18, 28].map((r) => (
                  <option key={r} value={r}>
                    {r}%
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={locked}
                checked={interState}
                onChange={(e) => setInterState(e.target.checked)}
                className="size-4 accent-[oklch(var(--forest))]"
              />
              Inter-state supply (IGST)
            </label>
            <GstBreakdown subtotal={subtotal} discount={discount} gstRate={gstRate} interState={interState} />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <IdempotentSubmitButton
              disabled={locked || items.length === 0}
              showKey
              onSubmit={submit}
              onSuccess={onSaved}
            >
              {invoice ? "Save invoice" : "Create invoice"}
            </IdempotentSubmitButton>
            {locked ? (
              <p className="text-xs text-foreground/50">All controls are disabled because the invoice is finalised.</p>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
