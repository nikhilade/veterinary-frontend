import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, PackagePlus, SlidersHorizontal } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel, StatCard } from "@/components/app/ui";
import { INR } from "@/components/app/kit/MoneyInput";
import { IdempotentSubmitButton } from "@/components/app/kit/IdempotentSubmitButton";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { can } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/store";
import type { StockItem, StockMovement, Supplier } from "@/lib/api/billing-types";

export const Route = createFileRoute("/app/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory | Pet Good Console" },
      { name: "description", content: "Stock levels with low-stock and expiry alerts, batch entry and adjustments." },
      { property: "og:title", content: "Inventory | Pet Good Console" },
      { property: "og:description", content: "Batch-tracked clinic stock control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InventoryPage,
});

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

function InventoryPage() {
  const { role } = useAuth();
  const canWrite = can(role, "inventory:write");
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [expiring, setExpiring] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [tab, setTab] = useState<"entry" | "adjust">("entry");

  const load = useCallback(() => {
    apiClient.get<StockItem[]>(endpoints.inventory.list).then(setItems).catch(() => setItems([]));
    apiClient
      .get<StockItem[]>(endpoints.inventory.expiry, { within_days: 90 })
      .then(setExpiring)
      .catch(() => setExpiring([]));
    apiClient.get<StockMovement[]>(endpoints.inventory.movements).then(setMovements).catch(() => setMovements([]));
  }, []);

  useEffect(() => {
    load();
    apiClient.get<Supplier[]>(endpoints.suppliers.list).then(setSuppliers).catch(() => setSuppliers([]));
  }, [load]);

  const lowStock = useMemo(() => (items ?? []).filter((i) => i.stock <= i.reorder_level), [items]);
  const expiringIds = useMemo(() => new Set(expiring.map((i) => i.id)), [expiring]);
  const stockValue = (items ?? []).reduce((sum, i) => sum + i.stock * i.unit_price, 0);

  return (
    <StaffLayout title="Inventory" subtitle="Stock, batches and expiry" permission="inventory:read">
      {!items ? (
        <Loading />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Items tracked" value={items.length} hint="Across all categories" />
            <StatCard label="Low stock" value={lowStock.length} hint="At or below reorder level" />
            <StatCard label="Stock value" value={INR(stockValue)} hint="Quantity × unit price" />
          </div>

          <div className="space-y-5">
            <Panel title={`${items.length} items`}>
              <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full min-w-[860px] text-left text-sm">

                  <thead className="text-xs uppercase text-foreground/50">
                    <tr>
                      <th className="pb-3">Item</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Supplier</th>
                      <th className="pb-3">Stock</th>
                      <th className="pb-3">Reorder at</th>
                      <th className="pb-3">Nearest expiry</th>
                      <th className="pb-3">Unit price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => {
                      const low = i.stock <= i.reorder_level;
                      const soon = expiringIds.has(i.id);
                      return (
                        <tr key={i.id} className="border-t border-border align-top">
                          <td className="py-3">
                            <span className="font-medium">{i.name}</span>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {low ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                                  <AlertTriangle className="size-3" /> Low stock
                                </span>
                              ) : null}
                              {soon && i.nearest_expiry ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-clay/15 px-2 py-0.5 text-[11px] font-medium text-clay">
                                  <CalendarClock className="size-3" />
                                  {daysUntil(i.nearest_expiry) < 0
                                    ? "Expired"
                                    : `Expires in ${daysUntil(i.nearest_expiry)}d`}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-3 text-foreground/70">{i.category}</td>
                          <td className="py-3 text-foreground/70">{i.supplier_name ?? "—"}</td>
                          <td className={`py-3 tabular-nums ${low ? "font-semibold text-destructive" : "text-foreground/70"}`}>
                            {i.stock}
                          </td>
                          <td className="py-3 tabular-nums text-foreground/70">{i.reorder_level}</td>
                          <td className="py-3 text-foreground/70">{i.nearest_expiry ?? "—"}</td>
                          <td className="py-3 tabular-nums text-foreground/70">{INR(i.unit_price)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>

            <div className="grid gap-5 lg:grid-cols-2">

              {canWrite ? (
                <Panel title="Stock movement">
                  <div className="mb-4 flex gap-2">
                    {(["entry", "adjust"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium ${
                          tab === t ? "bg-forest text-primary-foreground" : "bg-muted text-foreground/70"
                        }`}
                      >
                        {t === "entry" ? <PackagePlus className="size-4" /> : <SlidersHorizontal className="size-4" />}
                        {t === "entry" ? "Stock entry" : "Adjust"}
                      </button>
                    ))}
                  </div>
                  {tab === "entry" ? (
                    <StockEntryForm items={items} suppliers={suppliers} onDone={load} />
                  ) : (
                    <StockAdjustForm items={items} onDone={load} />
                  )}
                </Panel>
              ) : null}

              <Panel title="Recent movements">
                {movements.length === 0 ? (
                  <EmptyState message="No stock entries or adjustments recorded yet." />
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {movements.slice(0, 8).map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                        <span>
                          <span className="block font-medium">{m.item_name}</span>
                          <span className="block text-xs text-foreground/55">
                            {m.type.toLowerCase()} · {m.batch_no ?? "—"} · {m.reason}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 tabular-nums ${m.quantity < 0 ? "text-destructive" : "text-forest"}`}
                        >
                          {m.quantity > 0 ? "+" : ""}
                          {m.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}

function StockEntryForm({
  items,
  suppliers,
  onDone,
}: {
  items: StockItem[];
  suppliers: Supplier[];
  onDone: () => void;
}) {
  const [form, setForm] = useState({ item_id: "", quantity: 0, batch_no: "", expiry_date: "", supplier_id: "" });

  async function submit(headers: { "Idempotency-Key": string }) {
    return apiClient.post<StockItem>(endpoints.inventory.stockEntry, { ...form, reason: "Stock received" }, headers);
  }

  return (
    <div className="space-y-3">
      <select
        className={field}
        value={form.item_id}
        onChange={(e) => setForm({ ...form, item_id: e.target.value })}
      >
        <option value="">Select item…</option>
        {items.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          min={1}
          className={field}
          placeholder="Quantity"
          value={form.quantity || ""}
          onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
        />
        <input
          className={field}
          placeholder="Batch no."
          value={form.batch_no}
          onChange={(e) => setForm({ ...form, batch_no: e.target.value })}
        />
      </div>
      <input
        type="date"
        className={field}
        value={form.expiry_date}
        onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
      />
      <select
        className={field}
        value={form.supplier_id}
        onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
      >
        <option value="">Supplier (optional)…</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <IdempotentSubmitButton
        key={`${form.item_id}-${form.batch_no}`}
        disabled={!form.item_id || form.quantity <= 0 || !form.batch_no || !form.expiry_date}
        onSubmit={submit}
        onSuccess={onDone}
      >
        Record entry
      </IdempotentSubmitButton>
    </div>
  );
}

function StockAdjustForm({ items, onDone }: { items: StockItem[]; onDone: () => void }) {
  const [form, setForm] = useState({ item_id: "", quantity: 0, batch_no: "", reason: "" });
  const item = items.find((i) => i.id === form.item_id);

  async function submit(headers: { "Idempotency-Key": string }) {
    return apiClient.post<StockItem>(endpoints.inventory.stockAdjust, form, headers);
  }

  return (
    <div className="space-y-3">
      <select
        className={field}
        value={form.item_id}
        onChange={(e) => setForm({ ...form, item_id: e.target.value, batch_no: "" })}
      >
        <option value="">Select item…</option>
        {items.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name} · {i.stock} in stock
          </option>
        ))}
      </select>
      <select
        className={field}
        value={form.batch_no}
        onChange={(e) => setForm({ ...form, batch_no: e.target.value })}
        disabled={!item}
      >
        <option value="">Batch (earliest by default)…</option>
        {(item?.batches ?? []).map((b) => (
          <option key={b.batch_no} value={b.batch_no}>
            {b.batch_no} · {b.quantity} units · exp {b.expiry_date}
          </option>
        ))}
      </select>
      <input
        type="number"
        className={field}
        placeholder="Adjustment (+/-)"
        value={form.quantity || ""}
        onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
      />
      <input
        className={field}
        placeholder="Reason (damage, expiry write-off…)"
        value={form.reason}
        onChange={(e) => setForm({ ...form, reason: e.target.value })}
      />
      <IdempotentSubmitButton
        key={`${form.item_id}-${form.batch_no}`}
        disabled={!form.item_id || !form.quantity || form.reason.trim().length < 3}
        onSubmit={submit}
        onSuccess={onDone}
      >
        Apply adjustment
      </IdempotentSubmitButton>
    </div>
  );
}
