import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StaffLayout } from "@/components/app/StaffLayout";
import { AdminHospitalSelector } from "@/components/app/AdminHospitalSelector";

import { Loading, Panel, StatCard, StatusPill, formatDate, formatMoney } from "@/components/app/ui";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import type { DashboardStats } from "@/lib/api/types";
import type { StaffMember } from "@/lib/api/tenancy-types";
import { CheckCircle2, Clock, LogIn, LogOut } from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "Staff Dashboard | Pet Good Console" },
      { name: "description", content: "Clinic overview: today's appointments, revenue, invoices and stock alerts." },
      { property: "og:title", content: "Staff Dashboard | Pet Good Console" },
      { property: "og:description", content: "Daily clinic operations at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffDashboard,
});

function StaffDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Attendance state
  const [myStaffProfile, setMyStaffProfile] = useState<StaffMember | null>(null);
  const [myAttendance, setMyAttendance] = useState<any>(null);

  const loadAttendance = () => {
    apiClient.get<StaffMember>(endpoints.staff.me).then((profile: any) => {
      setMyStaffProfile(profile.data);
      if (profile.data && profile.data.id) {
        const today = new Date().toISOString().split("T")[0];
        apiClient.get<any[]>(endpoints.staff.attendanceByDate(today)).then((attRes: any) => {
          const arr = Array.isArray(attRes) ? attRes : attRes.data;
          if (arr) {
            const myAtt = arr.find((a: any) => a.staffId === profile.data.id);
            setMyAttendance(myAtt || null);
          }
        }).catch(console.error);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    function load() {
      apiClient.get<DashboardStats>(endpoints.dashboard.staff).then(setStats).catch(() => setStats(null));
    }
    load();
    loadAttendance();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const handleCheckIn = async () => {
    if (!myStaffProfile) return;
    try {
      await apiClient.post(endpoints.staff.checkIn, { staffId: myStaffProfile.id, remarks: "" });
      loadAttendance();
    } catch (e) {
      console.error("Failed to check in", e);
    }
  };

  const handleCheckOut = async () => {
    if (!myAttendance) return;
    try {
      await apiClient.put(endpoints.staff.checkOut(myAttendance.id), { remarks: "" });
      loadAttendance();
    } catch (e) {
      console.error("Failed to check out", e);
    }
  };

  return (
    <StaffLayout title="Dashboard" subtitle="Today at Pet Good">
      <AdminHospitalSelector />
      {!stats ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          {myStaffProfile && (
            <Panel>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="size-5 text-forest" />
                    My Shift Today
                  </h3>
                  <p className="text-sm text-foreground/70 mt-1">
                    {!myAttendance 
                      ? "You haven't started your shift yet."
                      : !myAttendance.checkOutTime
                      ? `You checked in at ${new Date(myAttendance.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`
                      : `Shift completed. You worked for ${Math.round(myAttendance.workingMinutes / 60)}h ${myAttendance.workingMinutes % 60}m.`}
                  </p>
                </div>
                <div>
                  {!myAttendance || myAttendance.status !== "PRESENT" ? (
                    <button
                      onClick={handleCheckIn}
                      className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-forest/90"
                    >
                      <LogIn className="size-4" />
                      Check In
                    </button>
                  ) : !myAttendance.checkOutTime ? (
                    <button
                      onClick={handleCheckOut}
                      className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-amber-600"
                    >
                      <LogOut className="size-4" />
                      Check Out
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full bg-muted px-6 py-2.5 text-sm font-medium text-foreground/60">
                      <CheckCircle2 className="size-4 text-forest" />
                      Completed
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Appointments today" value={stats.appointmentsToday} />
            <StatCard label="Active patients" value={stats.activePatients} />
            <StatCard label="Revenue (month)" value={formatMoney(stats.revenueMonth)} />
            <StatCard label="Pending invoices" value={stats.pendingInvoices} />
            <StatCard label="Low stock items" value={stats.lowStockItems} />
          </div>

          <Panel title="Upcoming appointments">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase text-foreground/50">
                  <tr>
                    <th className="pb-3">Pet</th>
                    <th className="pb-3">Owner</th>
                    <th className="pb-3">Doctor</th>
                    <th className="pb-3">Service</th>
                    <th className="pb-3">When</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.upcoming || []).map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="py-3 font-medium">{a.petName}</td>
                      <td className="py-3 text-foreground/70">{a.ownerName}</td>
                      <td className="py-3 text-foreground/70">{a.doctorName}</td>
                      <td className="py-3 text-foreground/70">{a.service}</td>
                      <td className="py-3 text-foreground/70">{formatDate(a.scheduledAt)}</td>
                      <td className="py-3">
                        <StatusPill status={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}
    </StaffLayout>
  );
}
