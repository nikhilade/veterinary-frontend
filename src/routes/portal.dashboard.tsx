import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { EmptyState, Loading, Panel, StatCard, formatDate } from "@/components/app/ui";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { Appointment, Pet } from "@/lib/api/types";

export const Route = createFileRoute("/portal/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard | Pet Good Owner Portal" },
      { name: "description", content: "See your pets, next appointment, prescriptions and open invoices." },
      { property: "og:title", content: "My Dashboard | Pet Good Owner Portal" },
      { property: "og:description", content: "Your pet care at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalDashboard,
});

interface PortalStats {
  pets: Pet[];
  next_appointment: Appointment | null;
  open_invoices: number;
  active_prescriptions: number;
}

function PortalDashboard() {
  const [stats, setStats] = useState<PortalStats | null>(null);

  useEffect(() => {
    apiClient.get<PortalStats>(endpoints.dashboard.portal).then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <PortalLayout title="Dashboard">
      {!stats ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="My pets" value={stats.pets.length} />
            <StatCard label="Prescriptions" value={stats.active_prescriptions} />
            <StatCard label="Open invoices" value={stats.open_invoices} />
            <StatCard label="Upcoming visits" value={stats.next_appointment ? 1 : 0} />
          </div>

          <Panel title="Next appointment">
            {stats.next_appointment ? (
              <div>
                <p className="text-lg">{stats.next_appointment.service}</p>
                <p className="mt-1 text-sm text-foreground/70">
                  {stats.next_appointment.pet_name} with {stats.next_appointment.doctor_name}
                </p>
                <p className="mt-1 text-sm text-clay">{formatDate(stats.next_appointment.scheduled_at)}</p>
              </div>
            ) : (
              <EmptyState message="No upcoming visits yet." />
            )}
            <Link
              to="/portal/book-appointment"
              className="mt-5 inline-flex rounded-full bg-forest px-7 py-3 text-sm font-medium text-primary-foreground"
            >
              Book an appointment
            </Link>
          </Panel>

          <Panel title="My pets">
            <ul className="space-y-3">
              {stats.pets.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-[1.25rem] bg-muted px-4 py-3">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-sm text-foreground/60">
                    {p.species} · {p.breed}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </PortalLayout>
  );
}
