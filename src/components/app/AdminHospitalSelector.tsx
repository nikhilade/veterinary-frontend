import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { useAuth, authStore } from "@/lib/auth/store";

export function AdminHospitalSelector() {
  const { role, adminHospitalId } = useAuth();
  const [hospitals, setHospitals] = useState<{ id: string; name: string; hospitalStatus?: string }[]>([]);

  useEffect(() => {
    if (role === "SUPER_ADMIN") {
      apiClient.get<any[]>(endpoints.tenants.list).then((res: any) => {
        let arr: any[] = [];
        if (Array.isArray(res)) arr = res;
        else if (res && Array.isArray(res.data)) arr = res.data;
        else if (res && Array.isArray(res.content)) arr = res.content;
        else if (res && Array.isArray(res.items)) arr = res.items;

        const mapped = arr.map((t: any) => ({
          id: t.hospitalId || t.id,
          name: t.name || t.hospitalName || "Unnamed Hospital",
          hospitalStatus: t.hospitalStatus
        }));

        setHospitals(mapped);
        if (mapped.length > 0 && !authStore.get().adminHospitalId) {
          const firstActive = mapped.find(h => h.hospitalStatus !== 'PENDING');
          if (firstActive) {
            authStore.setAdminHospital(firstActive.id);
          }
        }
      }).catch(console.error);
    }
  }, [role]);

  if (role !== "SUPER_ADMIN" || hospitals.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <span className="size-2 rounded-full bg-forest" />
      <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Hospital context</label>
      <select
        className="min-w-56 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-muted focus:border-forest"
        value={adminHospitalId || ""}
        onChange={(e) => authStore.setAdminHospital(e.target.value)}
      >
        {hospitals.map(h => (
          <option key={h.id} value={h.id} disabled={h.hospitalStatus === 'PENDING'}>
            {h.name} {h.hospitalStatus === 'PENDING' ? '(Pending Verification)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
