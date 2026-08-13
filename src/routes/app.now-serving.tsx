import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Appointment } from "@/lib/api/types";

export const Route = createFileRoute("/app/now-serving")({
  head: () => ({
    meta: [
      { title: "Now Serving | Pet Good Waiting Room" },
      { name: "description", content: "Large-format waiting-room display showing the token currently being served." },
      { property: "og:title", content: "Now Serving | Pet Good Waiting Room" },
      { property: "og:description", content: "Live token queue for the clinic waiting room." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NowServing,
});

/** Full-screen, large-text variant meant for a waiting-room TV. */
function NowServing() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(() => {
    apiClient
      .get<Appointment[]>(endpoints.appointments.queue, { branchId: "br_1" })
      .then(setItems)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 10000);
    const clock = setInterval(() => setNow(new Date()), 30000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [load]);

  const serving = items.find((a) => a.status === "IN_PROGRESS" || (a.status as string) === "CALLED") ?? null;
  const waiting = items.filter((a) => (a.status === "CHECKED_IN" || (a.status as string) === "WAITING") && a.tokenNumber).slice(0, 6);

  return (
    <main className="min-h-screen bg-forest px-8 py-10 text-primary-foreground">
      <header className="flex items-center justify-between">
        <p className="text-2xl font-bold tracking-tight">Pet Good Veterinary</p>
        <p className="text-2xl tabular-nums">
          {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
        </p>
      </header>

      <section className="mt-10 rounded-[2.5rem] bg-primary-foreground/10 px-10 py-16 text-center">
        <h1 className="text-3xl uppercase tracking-[0.4em] opacity-80">Now serving</h1>
        <p className="mt-6 text-[10rem] font-black leading-none tabular-nums">
          {serving?.tokenNumber ? `#${serving.tokenNumber}` : "—"}
        </p>
        <p className="mt-6 text-4xl">
          {serving ? `${serving.petName} · ${serving.doctorName}` : "Please wait to be called"}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl uppercase tracking-[0.3em] opacity-70">Up next</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {waiting.length === 0 ? (
            <p className="text-3xl opacity-70">No one waiting.</p>
          ) : (
            waiting.map((a) => (
              <div key={a.id} className="rounded-3xl bg-primary-foreground/10 px-8 py-6">
                <p className="text-6xl font-black tabular-nums">#{a.tokenNumber}</p>
                <p className="mt-2 text-2xl opacity-80">{a.petName}</p>
                <p className="text-xl opacity-60">{a.doctorName}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
