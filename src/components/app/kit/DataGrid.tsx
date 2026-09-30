import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import type { ApiMeta } from "@/lib/api/types";

export interface DataGridProps<T> {
  /** Fetches one page. `cursor` is null for the first page. */
  fetchPage: (cursor: string | null) => Promise<{ items: T[]; meta: ApiMeta }>;
  rowKey: (row: T) => string;
  renderCard: (row: T) => ReactNode;
  emptyMessage?: string;
}

/** Cursor-paginated grid layout. Reads { data, meta } straight from the API envelope. */
export function DataGrid<T>({ fetchPage, rowKey, renderCard, emptyMessage = "Nothing here yet." }: DataGridProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPage(null)
      .then((r) => {
        if (!active) return;
        setItems(r.items);
        setMeta(r.meta);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    if (!meta?.nextCursor) return;
    setLoading(true);
    try {
      const r = await fetchPage(meta.nextCursor);
      setItems((prev) => [...prev, ...r.items]);
      setMeta(r.meta);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {items.length === 0 && !loading ? (
        <div className="py-12 text-center text-sm text-foreground/60">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((row) => (
            <div key={rowKey(row)}>
              {renderCard(row)}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 text-xs text-foreground/60">
        <span>
          Showing {items.length}
          {meta ? ` of ${meta.totalCount}` : ""}
        </span>
        {meta?.hasNextPage ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-forest disabled:opacity-60 transition-colors hover:bg-forest/5"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null} Load more
          </button>
        ) : null}
      </div>
    </div>
  );
}
