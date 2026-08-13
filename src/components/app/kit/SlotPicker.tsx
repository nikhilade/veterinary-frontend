import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, CalendarOff } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { AppointmentSlot, Branch } from "@/lib/api/types";

export interface SlotPickerProps {
  branchId?: string;
  branch?: Branch | null;
  doctorId: string;
  date: string; // yyyy-mm-dd
  onDateChange?: (date: string) => void;
  value?: string | null; // ISO startAt
  onChange?: (startAt: string) => void;
  /** Hide the built-in date input when the parent owns date state. */
  showDateInput?: boolean;
  /** Bump to force a refetch (used after ERR_DOUBLE_BOOKING). */
  refreshToken?: number;
  /** Shake the grid to signal "that slot just went". */
  shake?: boolean;
  /** Overrides the loading copy, e.g. while auto-retrying a locked slot. */
  busyLabel?: string;
  onSlotsLoaded?: (slots: AppointmentSlot[]) => void;
}

export function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Available-slot grid, shared by the staff booking flow and the owner portal.
 * Past times and hours outside the branch's configured working hours are never
 * selectable — the server response is filtered, and the client re-checks.
 */
export function SlotPicker({
  branchId = "br_1",
  branch = null,
  doctorId,
  date,
  onDateChange,
  value = null,
  onChange,
  showDateInput = true,
  refreshToken = 0,
  shake = false,
  busyLabel,
  onSlotsLoaded,
}: SlotPickerProps) {
  const [slots, setSlots] = useState<AppointmentSlot[] | null>(null);
  const loadedRef = useRef(onSlotsLoaded);
  loadedRef.current = onSlotsLoaded;

  const closedToday = (() => {
    if (!branch || !branch.workingHours || !branch.workingHours.closedDays) return false;
    const d = new Date(`${date}T00:00:00`);
    return branch.workingHours.closedDays.includes(d.getDay());
  })();

  const load = useCallback(() => {
    let active = true;
    setSlots(null);
    apiClient
      .get<AppointmentSlot[]>(endpoints.appointments.availableSlots, {
        branchId: branchId,
        doctorId: doctorId,
        date,
      })
      .then((s) => {
        if (!active) return;
        setSlots(s);
        loadedRef.current?.(s);
      })
      .catch(() => active && setSlots([]));
    return () => {
      active = false;
    };
  }, [branchId, doctorId, date]);

  useEffect(() => load(), [load, refreshToken]);

  const minDate = todayISODate();

  return (
    <div className="space-y-3">
      {showDateInput ? (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/60">Date</label>
          <input
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => onDateChange?.(e.target.value)}
            className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-forest"
          />
        </div>
      ) : null}

      {branch ? (
        <p className="text-xs text-foreground/50">
          {branch.branchName}
          {branch.workingHours ? (
            <>
              {" "}· open {String(branch.workingHours.openHour).padStart(2, "0")}:00–
              {String(branch.workingHours.closeHour).padStart(2, "0")}:00
            </>
          ) : null}
        </p>
      ) : null}

      {closedToday ? (
        <p className="flex items-center justify-center gap-2 rounded-2xl bg-muted px-4 py-6 text-center text-sm text-foreground/60">
          <CalendarOff className="size-4" /> The branch is closed on this day.
        </p>
      ) : !slots ? (
        <p className="flex items-center gap-2 py-4 text-sm text-foreground/60">
          <Loader2 className="size-4 animate-spin" /> {busyLabel ?? "Loading slots…"}
        </p>
      ) : slots.length === 0 ? (
        <p className="rounded-2xl bg-muted px-4 py-6 text-center text-sm text-foreground/60">No slots for this day.</p>
      ) : (
        <div
          key={`${refreshToken}-${shake}`}
          className={`grid grid-cols-3 gap-2 sm:grid-cols-5 ${shake ? "animate-shake" : ""}`}
        >
          {slots.map((s) => {
            const start = new Date(s.startAt);
            const label = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
            const past = start.getTime() < Date.now();
            const selectable = s.available && !past;
            const selected = value === s.startAt;
            return (
              <button
                key={s.startAt}
                type="button"
                disabled={!selectable}
                title={past ? "This time has already passed" : !s.available ? "Already booked" : undefined}
                onClick={() => onChange?.(s.startAt)}
                className={`rounded-full border px-2 py-2 text-xs font-medium transition ${
                  selected
                    ? "border-forest bg-forest text-primary-foreground"
                    : selectable
                      ? "border-border bg-background hover:border-forest"
                      : "cursor-not-allowed border-border bg-muted text-foreground/35 line-through"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      <p className="text-xs text-foreground/50">Struck-through slots are already booked or in the past.</p>
    </div>
  );
}
