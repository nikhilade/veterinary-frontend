import type { ReactNode } from "react";

export function Panel({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border border-border bg-card p-5 lg:p-6">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h2 className="text-lg">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-card p-5">
      <p className="text-sm text-foreground/60">{label}</p>
      <p className="mt-2 text-3xl font-bold text-forest">{value}</p>
      {hint ? <p className="mt-1 text-xs text-foreground/50">{hint}</p> : null}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "PAID" || status === "COMPLETED"
      ? "bg-forest/10 text-forest"
      : status === "OVERDUE" || status === "CANCELLED"
        ? "bg-destructive/10 text-destructive"
        : "bg-clay/15 text-clay";
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone}`}>
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

export function EmptyState({
  message,
  title,
  action,
  icon,
}: {
  message: string;
  title?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[1.25rem] bg-muted px-5 py-10 text-center">
      {icon ? <div className="text-clay">{icon}</div> : null}
      {title ? <p className="text-lg font-medium text-forest">{title}</p> : null}
      <p className="max-w-sm text-sm text-foreground/60">{message}</p>
      {action}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex justify-center py-12">
      <div className="size-7 animate-spin rounded-full border-2 border-forest border-t-transparent" />
    </div>
  );
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatMoney(amount: number | null | undefined) {
  const safeAmount = amount ?? 0;
  return `$${safeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
