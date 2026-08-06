import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api-client";
import { EmptyState, Loading, Panel } from "@/components/app/ui";

export type CrudFieldType = "text" | "number" | "select" | "boolean";

export interface CrudField {
  key: string;
  label: string;
  type?: CrudFieldType;
  options?: string[];
  required?: boolean;
  /** Hidden from the table, still editable in the form. */
  hideInTable?: boolean;
}

export interface CrudTableProps<T extends { id: string }> {
  title: string;
  description?: string;
  fields: CrudField[];
  listPath: string;
  createPath: string;
  detailPath: (id: string) => string;
  canWrite?: boolean;
  emptyMessage?: string;
}

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

function blankFor(fields: CrudField[]) {
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f.key] = f.type === "boolean" ? true : f.type === "number" ? 0 : (f.options?.[0] ?? "");
  return out;
}

/** One generic, configurable CRUD screen. Every master-data list reuses this. */
export function CrudTable<T extends { id: string }>({
  title,
  description,
  fields,
  listPath,
  createPath,
  detailPath,
  canWrite = true,
  emptyMessage = "No records yet.",
}: CrudTableProps<T>) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(() => blankFor(fields));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setRows(null);
    apiClient
      .get<T[]>(listPath)
      .then(setRows)
      .catch(() => setRows([]));
  }, [listPath]);

  useEffect(() => {
    load();
    setOpen(false);
    setEditingId(null);
    setForm(blankFor(fields));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  async function save() {
    setError("");
    const missing = fields.find((f) => f.required && !String(form[f.key] ?? "").trim());
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    try {
      if (editingId) await apiClient.patch(detailPath(editingId), form);
      else await apiClient.post(createPath, form);
      setOpen(false);
      setEditingId(null);
      setForm(blankFor(fields));
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save this record.");
    }
  }

  async function remove(id: string) {
    try {
      await apiClient.delete(detailPath(id));
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not delete this record.");
    }
  }

  const tableFields = fields.filter((f) => !f.hideInTable);

  return (
    <Panel
      title={title}
      action={
        canWrite ? (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(blankFor(fields));
              setError("");
              setOpen((v) => !v);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm text-primary-foreground"
          >
            {open ? <X className="size-4" /> : <Plus className="size-4" />}
            {open ? "Close" : "Add"}
          </button>
        ) : null
      }
    >
      {description ? <p className="-mt-2 mb-4 text-sm text-foreground/60">{description}</p> : null}

      {open && canWrite ? (
        <div className="mb-5 grid gap-3 rounded-[1.25rem] bg-muted p-4 sm:grid-cols-2">
          {fields.map((f) => (
            <label key={f.key} className="space-y-1.5 text-sm">
              <span className="text-foreground/70">{f.label}</span>
              {f.type === "select" ? (
                <select
                  className={field}
                  value={String(form[f.key] ?? "")}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                >
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.type === "boolean" ? (
                <select
                  className={field}
                  value={form[f.key] ? "yes" : "no"}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value === "yes" }))}
                >
                  <option value="yes">Active</option>
                  <option value="no">Inactive</option>
                </select>
              ) : (
                <input
                  className={field}
                  type={f.type === "number" ? "number" : "text"}
                  value={String(form[f.key] ?? "")}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))
                  }
                />
              )}
            </label>
          ))}
          <div className="sm:col-span-2">
            {error ? <p className="mb-2 text-sm text-destructive">{error}</p> : null}
            <button
              type="button"
              onClick={save}
              className="rounded-full bg-forest px-6 py-2.5 text-sm text-primary-foreground"
            >
              {editingId ? "Save changes" : "Create"}
            </button>
          </div>
        </div>
      ) : null}

      {rows === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase text-foreground/50">
              <tr>
                {tableFields.map((f) => (
                  <th key={f.key} className="pb-3 pr-4">
                    {f.label}
                  </th>
                ))}
                {canWrite ? <th className="pb-3 text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  {tableFields.map((f) => {
                    const value = (row as Record<string, unknown>)[f.key];
                    return (
                      <td key={f.key} className="py-3 pr-4">
                        {typeof value === "boolean" ? (
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs ${value ? "bg-forest/10 text-forest" : "bg-muted text-foreground/60"}`}
                          >
                            {value ? "Active" : "Inactive"}
                          </span>
                        ) : (
                          String(value ?? "—")
                        )}
                      </td>
                    );
                  })}
                  {canWrite ? (
                    <td className="py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          aria-label={`Edit ${row.id}`}
                          onClick={() => {
                            setEditingId(row.id);
                            setForm({ ...(row as Record<string, unknown>) });
                            setError("");
                            setOpen(true);
                          }}
                          className="rounded-full border border-border p-2 text-forest"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${row.id}`}
                          onClick={() => remove(row.id)}
                          className="rounded-full border border-border p-2 text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
