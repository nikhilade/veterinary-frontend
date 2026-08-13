import type { AppointmentStatus } from "@/lib/api/types";

const TONES: Record<AppointmentStatus | "WAITING" | "SKIPPED" | "CALLED", { label: string; className: string; dot: string }> = {
  SCHEDULED: { label: "Scheduled", className: "bg-clay/15 text-clay border-clay/30", dot: "bg-clay" },
  CONFIRMED: { label: "Confirmed", className: "bg-forest/10 text-forest border-forest/25", dot: "bg-forest" },
  CHECKED_IN: {
    label: "Checked in",
    className: "bg-forest/20 text-forest border-forest/40",
    dot: "bg-forest",
  },
  WAITING: {
    label: "Checked in",
    className: "bg-forest/20 text-forest border-forest/40",
    dot: "bg-forest",
  },
  IN_PROGRESS: {
    label: "In progress",
    className: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    dot: "bg-amber-500",
  },
  CALLED: {
    label: "Now serving",
    className: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    dot: "bg-amber-500",
  },
  SKIPPED: {
    label: "Skipped",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/25",
    dot: "bg-amber-500",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-muted text-foreground/70 border-border",
    dot: "bg-foreground/40",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive border-destructive/25",
    dot: "bg-destructive",
  },
  NO_SHOW: {
    label: "No show",
    className: "bg-destructive/15 text-destructive border-destructive/40",
    dot: "bg-destructive",
  },
};

/** Colour-coded appointment status chip, shared by calendar, queue and lists. */
export function StatusBadge({ status, className = "" }: { status: AppointmentStatus; className?: string }) {
  const tone = TONES[status] ?? TONES.SCHEDULED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tone.className} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${tone.dot}`} />
      {tone.label}
    </span>
  );
}

export function statusAccent(status: AppointmentStatus) {
  return (TONES[status] ?? TONES.SCHEDULED).dot;
}

export const APPOINTMENT_STATUSES = Object.keys(TONES) as AppointmentStatus[];
