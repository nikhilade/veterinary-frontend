import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api-client";
import { EmptyState, Loading, Panel } from "@/components/app/ui";
import { useMasterData } from "@/hooks/use-master-data";

export type CrudFieldType = "text" | "number" | "select" | "boolean";

export interface CrudField {
  key: string;
  label: string;
  type?: CrudFieldType;
  options?: string[];
  /** Master data resource key to lookup for options, or a function returning the key based on form state. */
  lookup?: string | ((form: Record<string, unknown>) => string | null);
  /** Key in the record containing the display label (e.g. speciesName for speciesId) */
  displayKey?: string;
  /** Custom render function for the cell */
  render?: (row: any, value: any) => React.ReactNode;
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
  /** Default items per page (default: 10) */
  defaultPageSize?: number;
  /** Available page size choices */
  pageSizeOptions?: number[];
  /** Enable server-side pagination parameters (default: true) */
  serverSidePagination?: boolean;
}

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest";

function blankFor(fields: CrudField[]) {
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f.key] = f.type === "boolean" ? true : f.type === "number" ? 0 : (f.options?.[0] ?? "");
  return out;
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }
  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

/** One generic, configurable CRUD screen with server-side & client-side search and pagination. */
export function CrudTable<T extends { id: string }>({
  title,
  description,
  fields,
  listPath,
  createPath,
  detailPath,
  canWrite = true,
  emptyMessage = "No records yet.",
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  serverSidePagination = true,
}: CrudTableProps<T>) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(() => blankFor(fields));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  // Pagination and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Server pagination metadata
  const [isServerPaged, setIsServerPaged] = useState(false);
  const [serverTotalElements, setServerTotalElements] = useState<number | null>(null);
  const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);

  const load = useCallback(
    (pageToLoad = currentPage, sizeToLoad = pageSize) => {
      setRows(null);
      const queryParams: Record<string, string | number | boolean | undefined> = {};
      if (serverSidePagination) {
        queryParams.page = pageToLoad - 1;
        queryParams.size = sizeToLoad;
      }

      apiClient
        .get<T[] | SpringPage<T>>(listPath, serverSidePagination ? queryParams : undefined)
        .then((res) => {
          if (res && typeof res === "object" && "content" in res && Array.isArray((res as SpringPage<T>).content)) {
            const pageData = res as SpringPage<T>;
            setRows(pageData.content);
            setServerTotalElements(pageData.totalElements);
            setServerTotalPages(pageData.totalPages);
            setIsServerPaged(true);
          } else {
            setRows(Array.isArray(res) ? (res as T[]) : []);
            setIsServerPaged(false);
            setServerTotalElements(null);
            setServerTotalPages(null);
          }
        })
        .catch(() => {
          setRows([]);
          setIsServerPaged(false);
        });
    },
    [listPath, currentPage, pageSize, serverSidePagination],
  );

  useEffect(() => {
    load(currentPage, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listPath, currentPage, pageSize]);

  useEffect(() => {
    setOpen(false);
    setEditingId(null);
    setForm(blankFor(fields));
    setSearchQuery("");
    setCurrentPage(1);
  }, [listPath, fields]);

  async function save() {
    setError("");
    const missing = fields.find((f) => f.required && !String(form[f.key] ?? "").trim());
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    try {
      if (editingId) await apiClient.put(detailPath(editingId), form);
      else await apiClient.post(createPath, form);
      setOpen(false);
      setEditingId(null);
      setForm(blankFor(fields));
      load(currentPage, pageSize);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save this record.");
    }
  }

  async function remove(id: string) {
    try {
      await apiClient.delete(detailPath(id));
      load(currentPage, pageSize);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not delete this record.");
    }
  }

  const tableFields = useMemo(() => fields.filter((f) => !f.hideInTable), [fields]);

  // Filtered rows based on search
  const filteredRows = useMemo(() => {
    if (!rows) return null;
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase().trim();
    return rows.filter((row) => {
      const record = row as Record<string, unknown>;
      return tableFields.some((f) => {
        const val = record[f.key];
        const derivedDisplayKey = f.displayKey || (f.key.endsWith("Id") ? f.key.slice(0, -2) + "Name" : `${f.key}Name`);
        const displayVal = record[derivedDisplayKey];
        if (displayVal !== null && displayVal !== undefined && String(displayVal).toLowerCase().includes(q)) {
          return true;
        }
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [rows, searchQuery, tableFields]);

  // Pagination metrics
  const totalItems = isServerPaged && serverTotalElements !== null ? serverTotalElements : (filteredRows?.length ?? 0);
  const totalPages =
    isServerPaged && serverTotalPages !== null
      ? Math.max(1, serverTotalPages)
      : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = isServerPaged
    ? Math.min(startIndex + (rows?.length ?? 0), totalItems)
    : Math.min(startIndex + pageSize, totalItems);

  const displayRows = useMemo(() => {
    if (!filteredRows) return [];
    if (isServerPaged) {
      return filteredRows;
    }
    return filteredRows.slice(startIndex, endIndex);
  }, [filteredRows, isServerPaged, startIndex, endIndex]);

  const pageNumbers = useMemo(() => getPageNumbers(safeCurrentPage, totalPages), [safeCurrentPage, totalPages]);

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
            className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
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
                f.lookup ? (
                  <LookupSelect field={f} form={form} setForm={setForm} />
                ) : (
                  <select
                    className={field}
                    value={String(form[f.key] ?? "")}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    {(f.options ?? []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )
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
              className="rounded-full bg-forest px-6 py-2.5 text-sm text-primary-foreground transition-opacity hover:opacity-90"
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
        <div className="space-y-4">
          {/* Controls: Search and Page Size */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                placeholder={`Search in ${title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!isServerPaged) setCurrentPage(1);
                }}
                className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-9 text-sm outline-none transition-colors focus:border-forest"
              />
              {searchQuery ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchQuery("");
                    if (!isServerPaged) setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2 self-end text-sm text-foreground/70 sm:self-auto">
              <span className="text-xs text-foreground/60">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-forest"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table content */}
          {filteredRows && filteredRows.length === 0 ? (
            <div className="py-8 text-center text-sm text-foreground/60">
              No results found for &ldquo;{searchQuery}&rdquo;.
            </div>
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
                  {displayRows.map((row) => (
                    <tr key={row.id} className="border-t border-border hover:bg-muted/40 transition-colors">
                      {tableFields.map((f) => {
                        const record = row as Record<string, unknown>;
                        const value = record[f.key];

                        if (f.render) {
                          return (
                            <td key={f.key} className="py-3 pr-4">
                              {f.render(record, value)}
                            </td>
                          );
                        }

                        if (typeof value === "boolean") {
                          return (
                            <td key={f.key} className="py-3 pr-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs ${value ? "bg-forest/10 text-forest" : "bg-muted text-foreground/60"}`}
                              >
                                {value ? "Active" : "Inactive"}
                              </span>
                            </td>
                          );
                        }

                        if (f.lookup) {
                          return (
                            <td key={f.key} className="py-3 pr-4">
                              <LookupCell field={f} record={record} value={value} />
                            </td>
                          );
                        }

                        return (
                          <td key={f.key} className="py-3 pr-4">
                            {String(value ?? "—")}
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
                              className="rounded-full border border-border p-2 text-forest hover:bg-forest/10 transition-colors"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${row.id}`}
                              onClick={() => remove(row.id)}
                              className="rounded-full border border-border p-2 text-destructive hover:bg-destructive/10 transition-colors"
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

          {/* Pagination Footer */}
          {totalItems > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 text-xs text-foreground/60 sm:flex-row">
              <div>
                Showing <span className="font-medium text-foreground">{totalItems > 0 ? startIndex + 1 : 0}</span> to{" "}
                <span className="font-medium text-foreground">{endIndex}</span> of{" "}
                <span className="font-medium text-foreground">{totalItems}</span> entries
                {searchQuery && rows && filteredRows && filteredRows.length !== rows.length ? (
                  <span className="ml-1 text-foreground/50">(filtered from {rows.length} on this page)</span>
                ) : null}
              </div>

              {totalPages > 1 ? (
                <div className="flex items-center gap-1">
                  {/* First page button */}
                  <button
                    type="button"
                    aria-label="First page"
                    disabled={safeCurrentPage === 1}
                    onClick={() => setCurrentPage(1)}
                    className="flex size-8 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:border-forest hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronsLeft className="size-3.5" />
                  </button>

                  {/* Previous page button */}
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={safeCurrentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="flex size-8 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:border-forest hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>

                  {/* Page numbers */}
                  {pageNumbers.map((p, idx) =>
                    typeof p === "number" ? (
                      <button
                        key={`page-${p}`}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`flex size-8 items-center justify-center rounded-full text-xs font-medium transition-all ${
                          safeCurrentPage === p
                            ? "bg-forest text-primary-foreground shadow-sm"
                            : "border border-border text-foreground/70 hover:border-forest hover:text-foreground"
                        }`}
                      >
                        {p}
                      </button>
                    ) : (
                      <span key={`ellipsis-${idx}`} className="px-1 text-foreground/40">
                        ...
                      </span>
                    ),
                  )}

                  {/* Next page button */}
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="flex size-8 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:border-forest hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>

                  {/* Last page button */}
                  <button
                    type="button"
                    aria-label="Last page"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="flex size-8 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:border-forest hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronsRight className="size-3.5" />
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function LookupSelect({
  field: f,
  form,
  setForm,
}: {
  field: CrudField;
  form: Record<string, unknown>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  const lookupKey = typeof f.lookup === "function" ? f.lookup(form) : f.lookup!;
  const { data = [] } = useMasterData(lookupKey);
  return (
    <select
      className={field}
      value={String(form[f.key] ?? "")}
      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
    >
      <option value="">Select {f.label.toLowerCase()}...</option>
      {data.map((o: any) => (
        <option key={o.id} value={o.id}>
          {o.name || o.tenantName || o.hospitalName || o.branchName || o.firstName || o.id}
        </option>
      ))}
    </select>
  );
}

function LookupCell({
  field: f,
  record,
  value,
}: {
  field: CrudField;
  record: Record<string, unknown>;
  value: unknown;
}) {
  const derivedDisplayKey = f.displayKey || (f.key.endsWith("Id") ? f.key.slice(0, -2) + "Name" : `${f.key}Name`);
  const directName = record[derivedDisplayKey];

  const lookupKey = typeof f.lookup === "function" ? f.lookup(record) : f.lookup;
  const { data = [] } = useMasterData(lookupKey || "");

  if (directName !== undefined && directName !== null && String(directName).trim() !== "") {
    return <span>{String(directName)}</span>;
  }

  if (!value) return <span>—</span>;
  if (!lookupKey) return <span>{String(value)}</span>;

  const item = data.find((o: any) => String(o.id) === String(value));
  if (item) {
    return <span>{item.name || item.tenantName || item.hospitalName || item.branchName || item.firstName || String(value)}</span>;
  }

  return <span>{String(value)}</span>;
}
