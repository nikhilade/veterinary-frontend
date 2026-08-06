import { ApiError, apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Appointment, SourceChannel } from "@/lib/api/types";

export interface BookingPayload {
  pet_id: string;
  doctor_id: string;
  branch_id: string;
  service: string;
  scheduled_at: string;
  notes?: string;
  source_channel: SourceChannel;
}

export interface BookingCallbacks {
  /** Fired when the slot lock timed out and we're about to auto-retry. */
  onLockRetry?: () => void;
  /** Fired when the slot was taken by someone else (409 double booking). */
  onDoubleBooking?: (message: string) => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST /appointments with the two 409 flows handled explicitly:
 * ERR_SLOT_LOCK_TIMEOUT auto-retries once after ~1s with the SAME idempotency
 * key; ERR_DOUBLE_BOOKING is surfaced to the caller so it can refetch slots.
 */
export async function createAppointment(
  payload: BookingPayload,
  headers: Record<string, string>,
  callbacks: BookingCallbacks = {},
): Promise<Appointment> {
  try {
    return await apiClient.post<Appointment>(endpoints.appointments.create, { ...payload }, headers);
  } catch (err) {
    if (err instanceof ApiError && err.code === "ERR_SLOT_LOCK_TIMEOUT") {
      callbacks.onLockRetry?.();
      await sleep(1000);
      return apiClient.post<Appointment>(endpoints.appointments.create, { ...payload }, headers);
    }
    if (err instanceof ApiError && err.code === "ERR_DOUBLE_BOOKING") {
      callbacks.onDoubleBooking?.(err.message);
    }
    throw err;
  }
}

export function bookingErrorCopy(err: unknown) {
  if (err instanceof ApiError) {
    switch (err.code) {
      case "ERR_DOUBLE_BOOKING":
        return "That slot was just taken — pick another one.";
      case "ERR_SLOT_LOCK_TIMEOUT":
        return "We couldn't hold that slot. Please try again.";
      case "ERR_PAST_SLOT":
        return "That time has already passed. Choose an upcoming slot.";
      case "ERR_OUTSIDE_WORKING_HOURS":
        return err.message;
      default:
        return err.message;
    }
  }
  return "Could not book the appointment.";
}
