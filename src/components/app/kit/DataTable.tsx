import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import type { ApiMeta } from "@/lib/api/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  /** Fetches one page. `cursor` is null for the first page. */
  fetchPage: (cursor: string | null) => Promise<{ items: T[]; meta: ApiMeta }>;
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

/** Cursor-paginated, sortable table. Reads { data, meta } straight from the API envelope. */
export function DataTable<T>({ columns, fetchPage, rowKey, emptyMessage = "Nothing here yet." }: DataTableProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPage(null)
      .then((r) => {
        if (!active) return;
        setRows(r.items);
        setMeta(r.meta);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    if (!meta?.next_cursor) return;
    setLoading(true);
    try {
      const r = await fetchPage(meta.next_cursor);
      setRows((prev) => [...prev, ...r.items]);
      setMeta(r.meta);
    } finally {
      setLoading(false);
    }
  }

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      return av === bv ? 0 : (av > bv ? 1 : -1) * factor;
    });
  }, [rows, sort, columns]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                const Icon = !c.sortValue ? null : active ? (sort!.dir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
                return (
                  <TableHead key={c.key} className={c.className}>
                    {c.sortValue ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() =>
                          setSort((s) =>
                            s?.key === c.key ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "asc" },
                          )
                        }
                      >
                        {c.header}
                        {Icon ? <Icon className="size-3.5 opacity-60" /> : null}
                      </button>
                    ) : (
                      c.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-sm text-foreground/60">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.className}>
                      {c.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-foreground/60">
        <span>
          Showing {sorted.length}
          {meta ? ` of ${meta.total_count}` : ""}
        </span>
        {meta?.has_next_page ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-forest disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null} Load more
          </button>
        ) : null}
      </div>
    </div>
  );
}
