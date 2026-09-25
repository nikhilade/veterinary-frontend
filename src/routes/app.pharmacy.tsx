import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Filter,
  Package,
  Pill,
  Search,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { AdminHospitalSelector } from "@/components/app/AdminHospitalSelector";


import { EmptyState, Loading, Panel, StatCard, formatDate } from "@/components/app/ui";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { can } from "@/lib/auth/permissions";
import { useAuth, authStore } from "@/lib/auth/store";
import type { Prescription, PrescriptionMedicineItem, PharmacyDispenseRequest } from "@/lib/api/types";
import type { StockItem } from "@/lib/api/billing-types";
import { toast } from "sonner";

type Hospital = { id: string; name: string };

export const Route = createFileRoute("/app/pharmacy")({
  head: () => ({
    meta: [
      { title: "Pharmacy | Pet Good Console" },
      { name: "description", content: "Dispense prescriptions and review medication instructions, live inventory matching and batch deduction." },
      { property: "og:title", content: "Pharmacy | Pet Good Console" },
      { property: "og:description", content: "Prescription queue and inventory dispensing for the pharmacy team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PharmacyPage,
});

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest transition-colors";

function statusBadge(status?: string) {
  switch (status) {
    case "DISPENSED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-forest/15 px-2.5 py-0.5 text-xs font-medium text-forest">
          <CheckCircle2 className="size-3.5" /> Dispensed
        </span>
      );
    case "PARTIALLY_DISPENSED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-400">
          <Clock className="size-3.5" /> Partial
        </span>
      );
    case "CANCELLED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground/50">
          <X className="size-3.5" /> Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-clay/20 px-2.5 py-0.5 text-xs font-medium text-clay">
          <Clock className="size-3.5" /> Pending Dispense
        </span>
      );
  }
}

function PharmacyPage() {
  const { role, hospitalId } = useAuth();
  const canWrite = can(role, "pharmacy:write");
  const activeHospitalId = role === "SUPER_ADMIN" ? authStore.get().adminHospitalId : hospitalId;

  const [prescriptions, setPrescriptions] = useState<Prescription[] | null>(null);
  const [inventoryItems, setInventoryItems] = useState<StockItem[]>([]);

  const [activeTab, setActiveTab] = useState<"PENDING" | "DISPENSED" | "ALL">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [dispenseModalPrescription, setDispenseModalPrescription] = useState<Prescription | null>(null);

  const loadData = useCallback(() => {
    // Fetch queue from backend
    apiClient
      .get<Prescription[]>(endpoints.pharmacy.queue)
      .then((res) => {
        setPrescriptions(res || []);
      })
      .catch(() => {
        // Fallback to prescriptions list if needed
        apiClient
          .get<Prescription[]>(endpoints.prescriptions.list)
          .then((res) => setPrescriptions(res || []))
          .catch(() => setPrescriptions([]));
      });

    // Fetch inventory items to match medications and check stock
    apiClient
      .get<StockItem[]>(endpoints.inventory.list)
      .then((items) => setInventoryItems(items || []))
      .catch(() => setInventoryItems([]));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived metrics
  const pendingCount = useMemo(
    () => (prescriptions ?? []).filter((p) => p.status !== "DISPENSED" && p.status !== "CANCELLED").length,
    [prescriptions]
  );

  const dispensedTodayCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return (prescriptions ?? []).filter(
      (p) => p.status === "DISPENSED" && p.dispensedAt && p.dispensedAt.startsWith(today)
    ).length;
  }, [prescriptions]);

  const lowStockMeds = useMemo(() => {
    return inventoryItems.filter(
      (i) => i.category === "MEDICINE" && i.currentStock <= i.reorderLevel
    ).length;
  }, [inventoryItems]);

  // Filtered prescriptions
  const filteredPrescriptions = useMemo(() => {
    return (prescriptions ?? []).filter((p) => {
      // Tab filter
      if (activeTab === "PENDING" && (p.status === "DISPENSED" || p.status === "CANCELLED")) {
        return false;
      }
      if (activeTab === "DISPENSED" && p.status !== "DISPENSED") {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchPet = p.petName?.toLowerCase().includes(q);
        const matchOwner = p.ownerName?.toLowerCase().includes(q);
        const matchDoctor = p.doctorName?.toLowerCase().includes(q);
        const matchId = p.id?.toLowerCase().includes(q);
        const matchMeds = (p.items ?? []).some((item) =>
          item.medicineName?.toLowerCase().includes(q)
        );
        if (!matchPet && !matchOwner && !matchDoctor && !matchId && !matchMeds) {
          return false;
        }
      }

      return true;
    });
  }, [prescriptions, activeTab, searchQuery]);

  // Download PDF helper
  async function downloadPdf(prescriptionId: string) {
    try {
      toast.info("Preparing prescription PDF...");
      const url = `${import.meta.env.VITE_API_BASE_URL || ""}${endpoints.prescriptions.pdf(prescriptionId)}`;
      const authData = window.localStorage.getItem("petgood.auth");
      const token = authData ? JSON.parse(authData).token : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error("Failed to download PDF");
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `prescription-${prescriptionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
      toast.success("PDF downloaded!");
    } catch (e: any) {
      toast.error(e?.message || "Could not download PDF");
    }
  }


  return (
    <StaffLayout title="Pharmacy" subtitle="Prescription queue and inventory dispensing" permission="pharmacy:read">
      <AdminHospitalSelector />
      {!prescriptions ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          {/* Metric Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Pending Dispense" value={pendingCount} hint="Waiting in queue" />
            <StatCard label="Dispensed Today" value={dispensedTodayCount} hint="Completed prescriptions" />
            <StatCard label="Total Tracked" value={prescriptions.length} hint="All historical prescriptions" />
            <StatCard label="Low Stock Medicines" value={lowStockMeds} hint="At or below reorder level" />
          </div>

          {/* Main Pharmacy Panel */}
          <Panel
            title="Prescription Queue"
            action={
              <div className="flex items-center gap-1 rounded-full bg-muted p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("PENDING")}
                  className={`rounded-full px-3.5 py-1.5 font-medium transition-colors ${activeTab === "PENDING"
                      ? "bg-forest text-primary-foreground shadow-xs"
                      : "text-foreground/70 hover:text-foreground"
                    }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("DISPENSED")}
                  className={`rounded-full px-3.5 py-1.5 font-medium transition-colors ${activeTab === "DISPENSED"
                      ? "bg-forest text-primary-foreground shadow-xs"
                      : "text-foreground/70 hover:text-foreground"
                    }`}
                >
                  Dispensed ({prescriptions.length - pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ALL")}
                  className={`rounded-full px-3.5 py-1.5 font-medium transition-colors ${activeTab === "ALL"
                      ? "bg-forest text-primary-foreground shadow-xs"
                      : "text-foreground/70 hover:text-foreground"
                    }`}
                >
                  All ({prescriptions.length})
                </button>
              </div>
            }
          >
            {/* Search & Filter Bar */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative min-w-[260px] flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
                <input
                  type="text"
                  className="w-full rounded-full border border-border bg-background pl-9 pr-8 py-2 text-xs outline-none focus:border-forest"
                  placeholder="Search by pet, owner, doctor, or medication…"
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
            </div>

            {/* Prescriptions List */}
            {filteredPrescriptions.length === 0 ? (
              <EmptyState
                message={
                  searchQuery
                    ? "No prescriptions match your search query."
                    : activeTab === "PENDING"
                      ? "No pending prescriptions in the pharmacy queue! All medications are up to date."
                      : "No prescriptions found in this view."
                }
              />
            ) : (
              <div className="space-y-4">
                {filteredPrescriptions.map((p) => {
                  const isDispensed = p.status === "DISPENSED";
                  const items = p.items && p.items.length > 0 ? p.items : (
                    p.medication ? [{
                      id: "legacy",
                      medicineName: p.medication,
                      dosage: p.dosage || "As prescribed",
                      frequency: "Daily",
                      duration: "5 days",
                      instructions: p.instructions,
                      quantity: 1,
                      dispensedQuantity: isDispensed ? 1 : 0
                    }] : []
                  );

                  return (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-border/80 bg-card p-4.5 shadow-2xs transition-all hover:border-forest/40"
                    >
                      {/* Card Header: Patient, Doctor & Status */}
                      <div className="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-2xl bg-forest/10 text-forest">
                            <Pill className="size-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {p.petName || "Patient Pet"}
                              </span>
                              {p.petSpecies || p.petBreed ? (
                                <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-foreground/65">
                                  {[p.petSpecies, p.petBreed].filter(Boolean).join(" · ")}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/60">
                              <span>Owner: <strong className="font-medium text-foreground/80">{p.ownerName || "—"}</strong></span>
                              {p.ownerPhone ? <span>Tel: {p.ownerPhone}</span> : null}
                              <span>Doctor: <strong className="font-medium text-foreground/80">{p.doctorName || "Attending Vet"}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {statusBadge(p.status)}
                          <button
                            type="button"
                            onClick={() => downloadPdf(p.id)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted text-foreground/80"
                            title="Download Prescription PDF"
                          >
                            <Download className="size-3.5" /> PDF
                          </button>
                          {canWrite && !isDispensed ? (
                            <button
                              type="button"
                              onClick={() => setDispenseModalPrescription(p)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-1.5 text-xs font-medium text-primary-foreground shadow-2xs transition-all hover:opacity-90"
                            >
                              <Send className="size-3.5" /> Dispense
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {/* Card Body: Prescribed Medications */}
                      <div className="mt-3.5">
                        <p className="mb-2 text-xs font-medium text-foreground/60 uppercase tracking-wider">
                          Prescribed Medication ({items.length} item{items.length > 1 ? "s" : ""}):
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {items.map((item, idx) => {
                            // Find matching inventory item by name
                            const matchedInv = inventoryItems.find(
                              (inv) =>
                                inv.name.toLowerCase() === item.medicineName.toLowerCase() ||
                                inv.name.toLowerCase().includes(item.medicineName.toLowerCase()) ||
                                item.medicineName.toLowerCase().includes(inv.name.toLowerCase())
                            );

                            const isStockAvailable = matchedInv && matchedInv.currentStock >= (item.quantity || 1);

                            return (
                              <div
                                key={item.id || idx}
                                className="rounded-xl border border-border/70 bg-background/70 p-3 text-xs flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-semibold text-foreground">
                                      {item.medicineName}
                                    </span>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/75">
                                      Qty: {item.quantity || 1}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-foreground/70">
                                    {item.dosage} · {item.frequency} ({item.duration})
                                  </p>
                                  {item.instructions ? (
                                    <p className="mt-1 text-[11px] text-foreground/55 italic">
                                      "{item.instructions}"
                                    </p>
                                  ) : null}
                                </div>

                                <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                                  {matchedInv ? (
                                    <span
                                      className={`inline-flex items-center gap-1 font-medium ${isStockAvailable ? "text-forest" : "text-destructive"
                                        }`}
                                    >
                                      <Package className="size-3" />
                                      {matchedInv.currentStock} {matchedInv.unit} in stock
                                    </span>
                                  ) : (
                                    <span className="text-foreground/45">No direct stock match</span>
                                  )}

                                  {isDispensed ? (
                                    <span className="text-forest font-medium">✓ Dispensed</span>
                                  ) : isStockAvailable ? (
                                    <span className="text-forest">Ready</span>
                                  ) : (
                                    <span className="text-destructive font-medium">Stock low</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Card Footer Info */}
                      <div className="mt-3 pt-2.5 border-t border-border/40 flex flex-wrap items-center justify-between text-xs text-foreground/55">
                        <span>Issued: {formatDate(p.issuedAt || new Date().toISOString())}</span>
                        {p.dispensedAt ? (
                          <span>
                            Dispensed on {formatDate(p.dispensedAt)}
                            {p.dispensedByName ? ` by ${p.dispensedByName}` : ""}
                          </span>
                        ) : null}
                        {p.dispensedNotes ? (
                          <span className="italic text-foreground/70">Notes: {p.dispensedNotes}</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          {/* Interactive Dispense Modal */}
          {dispenseModalPrescription && (
            <DispenseModal
              prescription={dispenseModalPrescription}
              inventoryItems={inventoryItems}
              activeHospitalId={activeHospitalId}
              onClose={() => setDispenseModalPrescription(null)}
              onSuccess={() => {
                setDispenseModalPrescription(null);
                loadData();
              }}
            />
          )}
        </div>
      )}
    </StaffLayout>
  );
}

/** Interactive Dispense Modal with Live Inventory Matching */
function DispenseModal({
  prescription,
  inventoryItems,
  activeHospitalId,
  onClose,
  onSuccess,
}: {
  prescription: Prescription;
  inventoryItems: StockItem[];
  activeHospitalId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const items = prescription.items && prescription.items.length > 0
    ? prescription.items
    : prescription.medication
      ? [{
        id: "legacy",
        medicineName: prescription.medication,
        dosage: prescription.dosage || "",
        frequency: "Daily",
        duration: "5 days",
        instructions: prescription.instructions,
        quantity: 1,
        dispensedQuantity: 0,
      }]
      : [];

  // Match items to inventory items by default
  const [dispenseItems, setDispenseItems] = useState(() => {
    return items.map((pi) => {
      const match = inventoryItems.find(
        (inv) =>
          inv.name.toLowerCase() === pi.medicineName.toLowerCase() ||
          inv.name.toLowerCase().includes(pi.medicineName.toLowerCase()) ||
          pi.medicineName.toLowerCase().includes(inv.name.toLowerCase())
      );

      const batch = match?.batches && match.batches.length > 0 ? match.batches[0].batchNo : "";

      return {
        prescriptionItemId: pi.id,
        medicineName: pi.medicineName,
        requiredQuantity: pi.quantity || 1,
        inventoryItemId: match?.id || "",
        batchNumber: batch,
        quantityToDispense: pi.quantity || 1,
      };
    });
  });

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const hasUnmapped = dispenseItems.some((di) => !di.inventoryItemId);
  const hasInsufficientStock = dispenseItems.some((di) => {
    const inv = inventoryItems.find((i) => i.id === di.inventoryItemId);
    return !inv || inv.currentStock < di.quantityToDispense;
  });

  async function handleConfirmDispense() {
    setErrorMessage("");
    setSubmitting(true);

    const payload: PharmacyDispenseRequest = {
      prescriptionId: prescription.id,
      notes,
      items: dispenseItems.map((di) => ({
        prescriptionItemId: di.prescriptionItemId,
        inventoryItemId: di.inventoryItemId,
        batchNumber: di.batchNumber || undefined,
        quantity: di.quantityToDispense,
      })),
    };

    try {
      const headers = activeHospitalId ? { "hospital-id": activeHospitalId } : undefined;
      await apiClient.post(endpoints.pharmacy.dispense, payload, headers);
      toast.success("Prescription dispensed and inventory stock deducted successfully!");
      onSuccess();
    } catch (e: any) {
      setErrorMessage(e?.message || "Failed to dispense prescription.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Pill className="size-5 text-forest" /> Dispense Prescription
            </h2>
            <p className="text-xs text-foreground/60">
              Patient: <strong className="text-foreground">{prescription.petName}</strong> · Owner: {prescription.ownerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border p-1.5 hover:bg-muted text-foreground/70"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Medication Items to Dispense:
          </p>

          {dispenseItems.map((di, idx) => {
            const currentInv = inventoryItems.find((i) => i.id === di.inventoryItemId);
            const isShort = currentInv && currentInv.currentStock < di.quantityToDispense;

            return (
              <div key={di.prescriptionItemId || idx} className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">
                    {idx + 1}. {di.medicineName}
                  </span>
                  <span className="rounded-full bg-forest/15 px-2.5 py-0.5 text-xs font-medium text-forest">
                    Required: {di.requiredQuantity}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block mb-1 font-medium text-foreground/70">
                      Match Inventory Item:
                    </label>
                    <select
                      className={field}
                      value={di.inventoryItemId}
                      onChange={(e) => {
                        const newId = e.target.value;
                        const match = inventoryItems.find((i) => i.id === newId);
                        const batch = match?.batches && match.batches.length > 0 ? match.batches[0].batchNo : "";
                        setDispenseItems((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, inventoryItemId: newId, batchNumber: batch } : item
                          )
                        );
                      }}
                    >
                      <option value="">Select inventory medicine…</option>
                      {inventoryItems
                        .map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} ({inv.currentStock} {inv.unit} in stock)
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-medium text-foreground/70">
                      Batch Selection:
                    </label>
                    <select
                      className={field}
                      value={di.batchNumber}
                      onChange={(e) =>
                        setDispenseItems((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, batchNumber: e.target.value } : item))
                        )
                      }
                      disabled={!currentInv}
                    >
                      <option value="">Earliest expiring (FEFO auto-select)</option>
                      {(currentInv?.batches ?? []).map((b) => (
                        <option key={b.batchNo} value={b.batchNo}>
                          {b.batchNo} · {b.quantity} {currentInv?.unit} · Exp {b.expiryDate}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div>
                    {currentInv ? (
                      <span className={isShort ? "text-destructive font-semibold" : "text-forest font-medium"}>
                        Available: {currentInv.currentStock} {currentInv.unit}
                        {isShort ? " (Insufficient stock!)" : ""}
                      </span>
                    ) : (
                      <span className="text-destructive font-medium">Please match an inventory item</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-foreground/70">Dispense Qty:</label>
                    <input
                      type="number"
                      min={1}
                      className="w-20 rounded-xl border border-border bg-background px-2.5 py-1 text-right text-xs outline-none focus:border-forest"
                      value={di.quantityToDispense}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value));
                        setDispenseItems((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, quantityToDispense: val } : item))
                        );
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-1">
            Dispensing Notes / Special Instructions (Optional):
          </label>
          <input
            className={field}
            placeholder="e.g. Advised pet parent on proper refrigeration and dosage timing…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-5 py-2.5 text-xs font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDispense}
            disabled={submitting || hasUnmapped || hasInsufficientStock}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Dispensing..." : "Complete Dispensation"}
          </button>
        </div>
      </div>
    </div>
  );
}
