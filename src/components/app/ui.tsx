import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, Check, Home, ChevronRight, type LucideIcon } from "lucide-react";

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`admin-panel rounded-lg border border-border bg-card p-5 shadow-sm lg:p-6 ${className || ''}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h2 className="text-base font-bold">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ 
  label, 
  value, 
  hint, 
  className,
  trend,
  trendDirection,
  sparklineData,
  icon: Icon,
  accent = false,
}: { 
  label: string; 
  value: string | number; 
  hint?: string; 
  className?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
  icon?: LucideIcon;
  accent?: boolean;
}) {
  const chartData = sparklineData?.map((val, i) => ({ value: val, index: i }));

  return (
    <div className={`admin-stat group relative flex min-h-36 flex-col justify-between overflow-hidden rounded-lg border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${accent ? 'border-forest bg-forest text-primary-foreground' : 'border-border bg-card'} ${className || ''}`}>
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${accent ? 'text-primary-foreground/65' : 'text-muted-foreground'}`}>{label}</p>
          {Icon ? <span className={`flex size-8 items-center justify-center rounded-md ${accent ? 'bg-primary-foreground/12 text-primary-foreground' : 'bg-sage text-forest'}`}><Icon className="size-4" /></span> : null}
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <p className={`text-3xl font-bold ${accent ? 'text-primary-foreground' : 'text-forest'}`}>{value}</p>
          {trend && (
            <span className={`flex items-center text-xs font-semibold ${accent ? 'text-primary-foreground/75' : trendDirection === 'up' ? 'text-forest' : trendDirection === 'down' ? 'text-destructive' : 'text-foreground/50'}`}>
              {trendDirection === 'up' && <TrendingUp className="mr-1 size-3" />}
              {trendDirection === 'down' && <TrendingDown className="mr-1 size-3" />}
              {trendDirection === 'neutral' && <Minus className="mr-1 size-3" />}
              {trend}
            </span>
          )}
        </div>
        {hint ? <p className={`mt-1 text-xs ${accent ? 'text-primary-foreground/60' : 'text-foreground/50'}`}>{hint}</p> : null}
      </div>
      
      {chartData && chartData.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-15">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={accent ? "var(--color-primary-foreground)" : "var(--color-forest)"}
                strokeWidth={3} 
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
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
    <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${tone}`}>
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
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/60 px-5 py-10 text-center">
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

export function InitialsAvatar({ name, className = '' }: { name?: string | null; className?: string }) {
  const getInitials = (n: string) => {
    const parts = n.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    if (parts.length === 1 && parts[0].length >= 2) return (parts[0].substring(0, 2)).toUpperCase();
    return (n.substring(0, 2)).toUpperCase();
  };
  const hash = (str: string) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return Math.abs(h);
  };
  const gradients = [
    'from-rose-400 to-red-500', 'from-blue-400 to-indigo-500', 'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500', 'from-purple-400 to-fuchsia-500', 'from-cyan-400 to-blue-500'
  ];
  const safeName = name || '?';
  const bg = gradients[hash(safeName) % gradients.length];
  
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white font-semibold shadow-sm ${bg} ${className}`}>
      {getInitials(safeName)}
    </div>
  );
}

export function FormTimeline({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="relative space-y-8 py-2">
      <div className="absolute left-3.5 top-3 bottom-3 w-px bg-border -z-10" />
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;
        return (
          <div key={step} className="flex items-start gap-4">
            <div className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-500 ${isCompleted ? 'border-forest bg-forest text-primary-foreground' : isCurrent ? 'border-forest bg-background text-forest' : 'border-border bg-background text-foreground/40'}`}>
              {isCompleted ? <Check className="size-3.5" /> : <span className="text-xs font-medium">{idx + 1}</span>}
            </div>
            <div className="pt-1">
              <p className={`text-sm font-medium transition-colors duration-300 ${isCompleted || isCurrent ? 'text-foreground' : 'text-foreground/40'}`}>{step}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Breadcrumbs({ paths }: { paths: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-[13px] sm:space-x-2">
      <Link
        to="/app/dashboard"
        className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
        title="Dashboard"
      >
        <Home className="size-4" />
      </Link>
      
      {paths.map((path, idx) => {
        const isLast = idx === paths.length - 1;
        return (
          <div key={idx} className="flex items-center">
            <ChevronRight className="mx-1 size-3.5 text-muted-foreground/50" />
            {isLast || !path.to ? (
              <span className="font-semibold text-forest">
                {path.label}
              </span>
            ) : (
              <Link
                to={path.to}
                className="font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {path.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
