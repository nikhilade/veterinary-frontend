import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { useAuth, authStore } from "@/lib/auth/store";

export function AdminHospitalSelector() {
  const { role, adminHospitalId } = useAuth();
  const [hospitals, setHospitals] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (role === "SUPER_ADMIN") {
      apiClient.get<any[]>(endpoints.tenants.list).then((res: any) => {
        let arr: { id: string; name: string }[] = [];
        if (Array.isArray(res)) arr = res;
        else if (res && Array.isArray(res.data)) arr = res.data;
        else if (res && Array.isArray(res.content)) arr = res.content;
        else if (res && Array.isArray(res.items)) arr = res.items;

        const mapped = arr.map(t => ({
          id: t.hospitalId || t.id,
          name: t.name || t.hospitalName || "Unnamed Hospital"
        }));

        setHospitals(mapped);
        if (mapped.length > 0 && !authStore.get().adminHospitalId) {
          authStore.setAdminHospital(mapped[0].id);
        }
      }).catch(console.error);
    }
  }, [role]);

  if (role !== "SUPER_ADMIN" || hospitals.length === 0) return null;

  return (
    <div className="mb-6 flex items-center gap-3">
      <label className="text-sm font-medium text-foreground/80">Hospital Context:</label>
      <select
        className="rounded-full border border-border px-4 py-1.5 text-sm bg-background hover:bg-background/80 transition-colors outline-none focus:border-forest shadow-sm cursor-pointer"
        value={adminHospitalId || ""}
        onChange={(e) => authStore.setAdminHospital(e.target.value)}
      >
        {hospitals.map(h => (
          <option key={h.id} value={h.id}>{h.name}</option>
        ))}
      </select>
    </div>
  );
}
