import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { EmptyState, Loading, Panel } from "@/components/app/ui";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { can } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/store";
import type { Supplier } from "@/lib/api/billing-types";

export const Route = createFileRoute("/app/suppliers")({
  head: () => ({
    meta: [
      { title: "Suppliers | Pet Good Console" },
      { name: "description", content: "Manage the clinic's medicine and consumable suppliers." },
      { property: "og:title", content: "Suppliers | Pet Good Console" },
      { property: "og:description", content: "Supplier directory with GSTIN and contact details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuppliersPage,
});

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

const blank = { name: "", contact_person: "", phone: "", email: "", gstin: "", address: "", active: true };

function SuppliersPage() {
  const { role } = useAuth();
  const canWrite = can(role, "suppliers:write");
  const [items, setItems] = useState<Supplier[] | null>(null);
  const [form, setForm] = useState<typeof blank>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    apiClient.get<Supplier[]>(endpoints.suppliers.list).then(setItems).catch(() => setItems([]));
  }, []);

  useEffect(() => load(), [load]);

  async function save() {
    setError("");
    if (!form.name.trim()) {
      setError("Supplier name is required.");
      return;
    }
    try {
      if (editingId) await apiClient.patch<Supplier>(endpoints.suppliers.detail(editingId), { ...form });
      else await apiClient.post<Supplier>(endpoints.suppliers.create, { ...form });
      setForm(blank);
      setEditingId(null);
      setOpen(false);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save this supplier.");
    }
  }

  async function remove(id: string) {
    setError("");
    try {
      await apiClient.delete<Supplier>(endpoints.suppliers.detail(id));
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not remove this supplier.");
    }
  }

  return (
    <StaffLayout title="Suppliers" subtitle="Vendors and purchase contacts" permission="suppliers:read">
      {!items ? (
        <Loading />
      ) : (
        <div className="space-y-5">
          {error ? <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}

          {open && canWrite ? (
            <Panel title={editingId ? "Edit supplier" : "New supplier"}>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["name", "Supplier name"],
                    ["contact_person", "Contact person"],
                    ["phone", "Phone"],
                    ["email", "Email"],
                    ["gstin", "GSTIN"],
                    ["address", "Address"],
                  ] as const
                ).map(([key, label]) => (
                  <input
                    key={key}
                    className={field}
                    placeholder={label}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                ))}
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="size-4"
                />
                Active supplier
              </label>
              <div className="mt-4 flex gap-2">
                <button onClick={save} className="rounded-full bg-forest px-5 py-2.5 text-sm text-primary-foreground">
                  {editingId ? "Save changes" : "Add supplier"}
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    setEditingId(null);
                    setForm(blank);
                  }}
                  className="rounded-full border border-border px-5 py-2.5 text-sm"
                >
                  Cancel
                </button>
              </div>
            </Panel>
          ) : null}

          <Panel
            title={`${items.length} suppliers`}
            action={
              canWrite && !open ? (
                <button
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm text-primary-foreground"
                >
                  <Plus className="size-4" /> New supplier
                </button>
              ) : undefined
            }
          >
            {items.length === 0 ? (
              <EmptyState title="No suppliers" message="Add the vendors you purchase medicines and consumables from." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="text-xs uppercase text-foreground/50">
                    <tr>
                      <th className="pb-3">Supplier</th>
                      <th className="pb-3">Contact</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">GSTIN</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((s) => (
                      <tr key={s.id} className="border-t border-border">
                        <td className="py-3">
                          <span className="font-medium">{s.name}</span>
                          <span className="block text-xs text-foreground/55">{s.address}</span>
                        </td>
                        <td className="py-3 text-foreground/70">
                          {s.contact_person}
                          <span className="block text-xs text-foreground/50">{s.email}</span>
                        </td>
                        <td className="py-3 text-foreground/70">{s.phone}</td>
                        <td className="py-3 font-mono text-xs text-foreground/70">{s.gstin}</td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              s.active ? "bg-forest/10 text-forest" : "bg-muted text-foreground/60"
                            }`}
                          >
                            {s.active ? "active" : "inactive"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {canWrite ? (
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => {
                                  setEditingId(s.id);
                                  setForm({
                                    name: s.name,
                                    contact_person: s.contact_person,
                                    phone: s.phone,
                                    email: s.email,
                                    gstin: s.gstin,
                                    address: s.address,
                                    active: s.active,
                                  });
                                  setOpen(true);
                                }}
                                className="text-xs font-medium text-forest underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => remove(s.id)}
                                className="text-foreground/40 hover:text-destructive"
                                aria-label={`Remove ${s.name}`}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}
    </StaffLayout>
  );
}
