import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, ChevronDown, ChevronUp, Package, PackagePlus, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { AdminHospitalSelector } from "@/components/app/AdminHospitalSelector";

import { EmptyState, Loading, Panel, StatCard } from "@/components/app/ui";
import { INR } from "@/components/app/kit/MoneyInput";
import { IdempotentSubmitButton } from "@/components/app/kit/IdempotentSubmitButton";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { can } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/store";
import type { StockItem, StockMovement, Supplier } from "@/lib/api/billing-types";

type Hospital = { id: string; name: string };

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

const blankItem = {
  sku: "",
  name: "",
  category: "MEDICINE",
  hsnCode: "",
  taxRate: 5.0,
  unit: "VIAL",
  reorderLevel: 10,
};

function InventoryPage() {
  const { role, hospitalId, adminHospitalId } = useAuth();
  const canWrite = can(role, "inventory:write");
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [expiring, setExpiring] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [tab, setTab] = useState<"entry" | "adjust">("entry");
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState(blankItem);
  const [itemError, setItemError] = useState("");
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "LOW_STOCK" | "EXPIRING">("ALL");

  const toggleExpand = (id: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeHospitalId = role === "SUPER_ADMIN" ? (adminHospitalId || hospitalId) : hospitalId;

  const load = useCallback(() => {
    apiClient.get<StockItem[]>(endpoints.inventory.list).then(setItems).catch(() => setItems([]));
    apiClient
      .get<any[]>(endpoints.inventory.expiry, { days: 90, within_days: 90 })
      .then(setExpiring)
      .catch(() => setExpiring([]));
    apiClient.get<StockMovement[]>(endpoints.inventory.movements).then(setMovements).catch(() => setMovements([]));
  }, []);

  useEffect(() => {
    load();
    apiClient.get<Supplier[]>(endpoints.suppliers.list).then(setSuppliers).catch(() => setSuppliers([]));
  }, [load]);

  const lowStock = useMemo(() => (items ?? []).filter((i) => i.currentStock <= i.reorderLevel), [items]);
  const expiringIds = useMemo(() => new Set(expiring.map((i: any) => i.itemId ?? i.id).filter(Boolean)), [expiring]);
  const expiringCount = useMemo(
    () => (items ?? []).filter((i) => expiringIds.has(i.id) || (i.nearestExpiry && daysUntil(i.nearestExpiry) <= 90)).length,
    [items, expiringIds]
  );
  const stockValue = (items ?? []).reduce((sum, i) => sum + (i.currentStock || 0) * (i.unitPrice || 0), 0);

  const filteredItems = useMemo(() => {
    return (items ?? []).filter((i) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = i.name?.toLowerCase().includes(q);
        const matchSku = i.sku?.toLowerCase().includes(q);
        if (!matchName && !matchSku) return false;
      }
      if (categoryFilter !== "ALL" && i.category !== categoryFilter) {
        return false;
      }
      if (statusFilter === "LOW_STOCK") {
        if (i.currentStock > i.reorderLevel) return false;
      } else if (statusFilter === "EXPIRING") {
        const isExpiring = expiringIds.has(i.id) || (i.nearestExpiry && daysUntil(i.nearestExpiry) <= 90);
        if (!isExpiring) return false;
      }
      return true;
    });
  }, [items, searchQuery, categoryFilter, statusFilter, expiringIds]);

  async function saveItem() {
    setItemError("");
    if (!itemForm.sku.trim() || !itemForm.name.trim()) {
      setItemError("SKU and Item name are required.");
      return;
    }
    try {
      await apiClient.post(endpoints.inventory.create, {
        ...itemForm,
        hospitalId: activeHospitalId,
      });
      setItemForm(blankItem);
      setNewItemOpen(false);
      load();
    } catch (e: any) {
      setItemError(e?.message || "Failed to create inventory item.");
    }
  }

  return (
    <StaffLayout title="Inventory" subtitle="Stock, batches and expiry" permission="inventory:read">
      <AdminHospitalSelector />
      {!items ? (
        <Loading />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Items tracked" value={items.length} hint="Across all categories" />
            <StatCard label="Low stock" value={lowStock.length} hint="At or below reorder level" />
            <StatCard label="Expiring soon" value={expiringCount} hint="Within 90 days or expired" />
            <StatCard label="Stock value" value={INR(stockValue)} hint="Quantity × unit price" />
          </div>

          {newItemOpen && canWrite ? (
            <Panel title="New inventory item">
              {itemError ? <p className="mb-3 rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{itemError}</p> : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className={field}
                  placeholder="SKU (e.g. VAC-003)"
                  value={itemForm.sku}
                  onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                />
                <input
                  className={field}
                  placeholder="Item name"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                />
                <select
                  className={field}
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                >
                  <option value="MEDICINE">Medicine</option>
                  <option value="CONSUMABLE">Consumable</option>
                  <option value="FOOD">Food</option>
                  <option value="PET_FOOD">Pet Food</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="HYGIENE">Hygiene</option>
                  <option value="TOYS">Toys</option>
                  <option value="ACCESSORY">Accessory</option>
                  <option value="GROOMING">Grooming</option>
                </select>
                <input
                  className={field}
                  placeholder="HSN Code (optional)"
                  value={itemForm.hsnCode}
                  onChange={(e) => setItemForm({ ...itemForm, hsnCode: e.target.value })}
                />
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  className={field}
                  placeholder="Tax rate %"
                  value={itemForm.taxRate}
                  onChange={(e) => setItemForm({ ...itemForm, taxRate: Number(e.target.value) })}
                />
                <select
                  className={field}
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                >
                  <option value="VIAL">Vial</option>
                  <option value="BAG">Bag</option>
                  <option value="BOX">Box</option>
                  <option value="STRIP">Strip</option>
                  <option value="BOTTLE">Bottle</option>
                  <option value="UNIT">Unit</option>
                  <option value="ROLL">Roll</option>
                  <option value="PIECE">Piece</option>
                  <option value="PACK">Pack</option>
                </select>
                <input
                  type="number"
                  min={0}
                  className={field}
                  placeholder="Reorder level"
                  value={itemForm.reorderLevel}
                  onChange={(e) => setItemForm({ ...itemForm, reorderLevel: Number(e.target.value) })}
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={saveItem} className="rounded-full bg-forest px-5 py-2.5 text-sm text-primary-foreground">
                  Save item
                </button>
                <button
                  onClick={() => {
                    setNewItemOpen(false);
                    setItemForm(blankItem);
                    setItemError("");
                  }}
                  className="rounded-full border border-border px-5 py-2.5 text-sm"
                >
                  Cancel
                </button>
              </div>
            </Panel>
          ) : null}
          <div className="space-y-5">
            <Panel
              title={`${filteredItems.length}${filteredItems.length !== (items?.length ?? 0) ? ` of ${items.length}` : ""} items`}
              action={
                canWrite && !newItemOpen ? (
                  <button
                    onClick={() => setNewItemOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm text-primary-foreground"
                  >
                    <Plus className="size-4" /> New item
                  </button>
                ) : undefined
              }
            >
              {/* Search & Filter Bar */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <div className="relative min-w-[220px] flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
                    <input
                      type="text"
                      className="w-full rounded-full border border-border bg-background pl-9 pr-8 py-1.5 text-xs outline-none focus:border-forest"
                      placeholder="Search by name or SKU…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <select
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-forest"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="ALL">All Categories</option>
                    <option value="MEDICINE">Medicine</option>
                    <option value="CONSUMABLE">Consumable</option>
                    <option value="FOOD">Food</option>
                    <option value="PET_FOOD">Pet Food</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="HYGIENE">Hygiene</option>
                    <option value="TOYS">Toys</option>
                    <option value="ACCESSORY">Accessory</option>
                    <option value="GROOMING">Grooming</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ALL")}
                    className={`rounded-full px-3 py-1 font-medium transition-colors ${
                      statusFilter === "ALL"
                        ? "bg-forest text-primary-foreground"
                        : "bg-muted text-foreground/70 hover:bg-muted/80"
                    }`}
                  >
                    All ({items.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("LOW_STOCK")}
                    className={`rounded-full px-3 py-1 font-medium transition-colors ${
                      statusFilter === "LOW_STOCK"
                        ? "bg-destructive text-primary-foreground"
                        : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    }`}
                  >
                    Low stock ({lowStock.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("EXPIRING")}
                    className={`rounded-full px-3 py-1 font-medium transition-colors ${
                      statusFilter === "EXPIRING"
                        ? "bg-clay text-primary-foreground"
                        : "bg-clay/15 text-clay hover:bg-clay/25"
                    }`}
                  >
                    Expiring ({expiringCount})
                  </button>
                </div>
              </div>

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
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-sm text-foreground/50">
                          No inventory items match your criteria.
                        </td>
                      </tr>
                    ) : null}
                    {filteredItems.map((i) => {
                      const isExpanded = expandedItemIds.has(i.id);
                      const low = i.currentStock <= i.reorderLevel;

                      // Identify batches expiring within 90 days or already expired
                      const expiringBatches = (i.batches ?? []).filter((b) => {
                        if (!b.expiryDate) return false;
                        const d = daysUntil(b.expiryDate);
                        return d <= 90 && b.quantity > 0;
                      });
                      const expiringQty = expiringBatches.reduce((sum, b) => sum + b.quantity, 0);

                      // Match the batch that corresponds to nearestExpiry
                      const nearestBatch = (i.batches ?? []).find((b) => b.expiryDate === i.nearestExpiry);

                      const soon = expiringQty > 0 || expiringIds.has(i.id) || (i.nearestExpiry ? daysUntil(i.nearestExpiry) <= 90 : false);
                      const isExpired = i.nearestExpiry ? daysUntil(i.nearestExpiry) < 0 : false;
                      const daysLeft = i.nearestExpiry ? daysUntil(i.nearestExpiry) : null;

                      // Craft informative, transparent badge text
                      let badgeText = "Expiring soon";
                      if (isExpired) {
                        badgeText = expiringQty > 0 && expiringQty < i.currentStock
                          ? `${expiringQty} of ${i.currentStock} ${i.unit} expired`
                          : "Expired";
                      } else if (daysLeft !== null) {
                        badgeText = expiringQty > 0 && expiringQty < i.currentStock
                          ? `${expiringQty} of ${i.currentStock} ${i.unit} exp in ${daysLeft}d`
                          : `Expires in ${daysLeft}d`;
                      }

                      return (
                        <Fragment key={i.id}>
                          <tr className="border-t border-border align-top transition-colors hover:bg-muted/20">
                            <td className="py-3">
                              <span className="font-medium">{i.name}</span>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {low ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                                    <AlertTriangle className="size-3" /> Low stock
                                  </span>
                                ) : null}
                                {soon && i.nearestExpiry ? (
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                      isExpired
                                        ? "bg-destructive/10 text-destructive"
                                        : "bg-clay/15 text-clay"
                                    }`}
                                    title={
                                      expiringBatches.length > 0
                                        ? `Expiring batches: ${expiringBatches.map((b) => `${b.batchNo} (${b.quantity} ${i.unit})`).join(", ")}`
                                        : undefined
                                    }
                                  >
                                    <CalendarClock className="size-3" />
                                    {badgeText}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="py-3 text-foreground/70">{i.category}</td>
                            <td className="py-3 text-foreground/70">
                              <span>{i.supplierName ?? "—"}</span>
                              {i.supplierAddress ? (
                                <span className="block text-xs text-foreground/50">{i.supplierAddress}</span>
                              ) : null}
                            </td>
                            <td className="py-3 tabular-nums">
                              <div className={low ? "font-semibold text-destructive" : "text-foreground/70"}>
                                {i.currentStock} {i.unit}
                              </div>
                              {(i.batches ?? []).length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(i.id)}
                                  className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-forest hover:underline cursor-pointer"
                                >
                                  <span>
                                    {i.batches.length} batch{i.batches.length > 1 ? "es" : ""}
                                  </span>
                                  {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                                </button>
                              ) : null}
                            </td>
                            <td className="py-3 tabular-nums text-foreground/70">{i.reorderLevel}</td>
                            <td className="py-3 text-foreground/70">
                              {i.nearestExpiry ? (
                                <div>
                                  <span className="tabular-nums font-medium">{i.nearestExpiry}</span>
                                  {nearestBatch ? (
                                    <span className="block text-[11px] text-foreground/55">
                                      Batch {nearestBatch.batchNo} · <strong className="font-medium text-foreground/80">{nearestBatch.quantity} {i.unit}</strong>
                                    </span>
                                  ) : null}
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="py-3 tabular-nums text-foreground/70">{INR(i.unitPrice)}</td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-muted/30 border-t border-border/40">
                              <td colSpan={7} className="px-4 py-3">
                                <div className="rounded-xl border border-border/60 bg-card/95 p-3.5 shadow-xs">
                                  <div className="flex items-center justify-between mb-2.5">
                                    <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                                      <Package className="size-3.5 text-forest" /> Batch Breakdown for {i.name} ({i.currentStock} {i.unit} total)
                                    </span>
                                    <span className="text-[11px] text-foreground/50">
                                      {i.batches.length} active batch{i.batches.length > 1 ? "es" : ""}
                                    </span>
                                  </div>
                                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {i.batches.map((b) => {
                                      const bDays = b.expiryDate ? daysUntil(b.expiryDate) : null;
                                      const bExpired = bDays !== null && bDays < 0;
                                      const bSoon = bDays !== null && bDays >= 0 && bDays <= 90;
                                      return (
                                        <div
                                          key={b.batchNo}
                                          className={`rounded-xl border p-2.5 text-xs flex flex-col justify-between transition-all ${
                                            bExpired
                                              ? "border-destructive/30 bg-destructive/5"
                                              : bSoon
                                              ? "border-clay/40 bg-clay/5"
                                              : "border-border bg-background"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between font-medium">
                                            <span className="text-foreground">Batch: <strong className="font-semibold">{b.batchNo}</strong></span>
                                            <span className="tabular-nums font-semibold text-foreground/90">
                                              {b.quantity} {i.unit}
                                            </span>
                                          </div>
                                          <div className="mt-2 flex items-center justify-between text-[11px]">
                                            <span className="text-foreground/60 tabular-nums">
                                              Exp: {b.expiryDate ?? "None"}
                                            </span>
                                            {bExpired ? (
                                              <span className="rounded-full bg-destructive/15 px-2 py-0.5 font-semibold text-destructive">Expired</span>
                                            ) : bSoon ? (
                                              <span className="rounded-full bg-clay/20 px-2 py-0.5 font-medium text-clay">In {bDays}d</span>
                                            ) : (
                                              <span className="rounded-full bg-forest/10 px-2 py-0.5 font-medium text-forest">Safe</span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
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
                    <StockEntryForm items={items} suppliers={suppliers} onDone={load} activeHospitalId={activeHospitalId} />
                  ) : (
                    <StockAdjustForm items={items} onDone={load} activeHospitalId={activeHospitalId} />
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
                          <span className="block font-medium">{m.itemName}</span>
                          <span className="block text-xs text-foreground/55">
                            {m.type.toLowerCase()} · {m.batchNo ?? "—"} · {m.reason}
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
  activeHospitalId
}: {
  items: StockItem[];
  suppliers: Supplier[];
  onDone: () => void;
  activeHospitalId: string | null;
}) {
  const [form, setForm] = useState({ itemId: "", quantity: 0, batchNumber: "", expiryDate: "", supplierId: "", purchasePrice: 0, mrp: 0, entryType: "PURCHASE", notes: "" });

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name)), [items]);

  async function submit(headers: { "Idempotency-Key": string }) {
    const combinedHeaders = {
      ...headers,
      ...(activeHospitalId ? { "hospital-id": activeHospitalId } : {}),
    };
    return apiClient.post<StockItem>(
      endpoints.inventory.stockEntry,
      { ...form, hospitalId: activeHospitalId, supplierId: form.supplierId || null },
      combinedHeaders
    );
  }

  return (
    <div className="space-y-3">
      <select
        className={field}
        value={form.itemId}
        onChange={(e) => setForm({ ...form, itemId: e.target.value })}
      >
        <option value="">Select item…</option>
        {sortedItems.map((i) => (
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
          value={form.batchNumber}
          onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          min={0}
          className={field}
          placeholder="Purchase Price"
          value={form.purchasePrice || ""}
          onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })}
        />
        <input
          type="number"
          min={0}
          className={field}
          placeholder="MRP"
          value={form.mrp || ""}
          onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })}
        />
      </div>
      <input
        type="date"
        className={field}
        value={form.expiryDate}
        onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
      />
      <select
        className={field}
        value={form.supplierId}
        onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
      >
        <option value="">Supplier (optional)…</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <select
        className={field}
        value={form.entryType}
        onChange={(e) => setForm({ ...form, entryType: e.target.value })}
      >
        <option value="PURCHASE">Purchase</option>
        <option value="OPENING">Opening Stock</option>
        <option value="RETURN">Return</option>
        <option value="TRANSFER">Transfer</option>
      </select>
      <input
        className={field}
        placeholder="Notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      <IdempotentSubmitButton
        key={`${form.itemId}-${form.batchNumber}`}
        disabled={!form.itemId || form.quantity <= 0 || !form.batchNumber}
        onSubmit={submit}
        onSuccess={() => {
          setForm({ itemId: "", quantity: 0, batchNumber: "", expiryDate: "", supplierId: "", purchasePrice: 0, mrp: 0, entryType: "PURCHASE", notes: "" });
          onDone();
        }}
      >
        Record entry
      </IdempotentSubmitButton>
    </div>
  );
}

function StockAdjustForm({
  items,
  onDone,
  activeHospitalId,
}: {
  items: StockItem[];
  onDone: () => void;
  activeHospitalId: string | null;
}) {
  const [form, setForm] = useState({
    itemId: "",
    quantity: 0,
    batchNumber: "",
    notes: "",
    entryType: "ADJUSTMENT",
  });
  const [direction, setDirection] = useState<"DEDUCT" | "ADD">("DEDUCT");

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name)), [items]);
  const item = items.find((i) => i.id === form.itemId);

  const absQty = Math.abs(form.quantity || 0);
  const signedQty = direction === "DEDUCT" ? -absQty : absQty;
  const projectedStock = item ? Math.max(0, item.currentStock + signedQty) : 0;
  const isOverDeducting = direction === "DEDUCT" && item ? item.currentStock < absQty : false;

  async function submit(headers: { "Idempotency-Key": string }) {
    const combinedHeaders = {
      ...headers,
      ...(activeHospitalId ? { "hospital-id": activeHospitalId } : {}),
    };
    return apiClient.post<StockItem>(
      endpoints.inventory.stockAdjust,
      {
        ...form,
        hospitalId: activeHospitalId,
        batchNumber: form.batchNumber || null,
        quantity: signedQty,
      },
      combinedHeaders
    );
  }

  return (
    <div className="space-y-3">
      <select
        className={field}
        value={form.itemId}
        onChange={(e) => setForm({ ...form, itemId: e.target.value, batchNumber: "" })}
      >
        <option value="">Select item…</option>
        {sortedItems.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name} · {i.currentStock} in stock
          </option>
        ))}
      </select>
      <select
        className={field}
        value={form.batchNumber}
        onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
        disabled={!item}
      >
        <option value="">Batch (earliest by default)…</option>
        {(item?.batches ?? []).map((b) => (
          <option key={b.batchNo} value={b.batchNo}>
            {b.batchNo} · {b.quantity} units · exp {b.expiryDate}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <select
          className={field}
          value={direction}
          onChange={(e) => setDirection(e.target.value as "DEDUCT" | "ADD")}
        >
          <option value="DEDUCT">Reduce stock (Damage, Expiry, Lost)</option>
          <option value="ADD">Add stock (Found, Correction)</option>
        </select>
        <input
          type="number"
          min={1}
          className={field}
          placeholder="Quantity"
          value={form.quantity || ""}
          onChange={(e) => setForm({ ...form, quantity: Math.abs(Number(e.target.value)) })}
        />
      </div>

      {item && form.quantity > 0 ? (
        <div className="rounded-xl bg-muted/60 px-3 py-2 text-xs text-foreground/75 flex items-center justify-between">
          <span>Current: <strong className="tabular-nums">{item.currentStock}</strong> {item.unit}</span>
          <span>Adjustment: <strong className={`tabular-nums ${signedQty < 0 ? "text-destructive" : "text-forest"}`}>{signedQty > 0 ? `+${signedQty}` : signedQty}</strong></span>
          <span>Projected: <strong className="tabular-nums">{projectedStock}</strong> {item.unit}</span>
        </div>
      ) : null}

      {isOverDeducting && item ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" />
          <span>Cannot reduce by {absQty} {item.unit}. Only {item.currentStock} {item.unit} available in stock.</span>
        </div>
      ) : null}

      <input
        className={field}
        placeholder="Reason / Notes (damage, expiry write-off…)"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      <IdempotentSubmitButton
        key={`${form.itemId}-${form.batchNumber}-${direction}`}
        disabled={!form.itemId || !form.quantity || form.notes.trim().length < 3 || isOverDeducting}
        onSubmit={submit}
        onSuccess={() => {
          setForm({ itemId: "", quantity: 0, batchNumber: "", notes: "", entryType: "ADJUSTMENT" });
          onDone();
        }}
      >
        Apply adjustment
      </IdempotentSubmitButton>
    </div>
  );
}
