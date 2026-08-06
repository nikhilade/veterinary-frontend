import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "./api-client";

/** Refresh cadences for the admin analytics dashboard. */
export const POLL_LIVE_MS = 15_000; // appointment-related widgets
export const POLL_AGGREGATE_MS = 15 * 60_000; // analytics aggregates

/**
 * Fetches `path` through the API client and re-fetches it on an interval.
 * No sockets — plain polling, paused while the tab is hidden.
 */
export function usePolledQuery<T>(path: string, intervalMs: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    try {
      const next = await apiClient.get<T>(path);
      if (!alive.current) return;
      setData(next);
      setError(null);
      setUpdatedAt(Date.now());
    } catch (e) {
      if (!alive.current) return;
      setError(e instanceof Error ? e.message : "Failed to load data.");
    }
  }, [path]);

  useEffect(() => {
    alive.current = true;
    load();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, intervalMs);
    return () => {
      alive.current = false;
      window.clearInterval(id);
    };
  }, [load, intervalMs]);

  return { data, error, updatedAt, refresh: load };
}
