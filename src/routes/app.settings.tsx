import { createFileRoute } from "@tanstack/react-router";
import { StaffLayout } from "@/components/app/StaffLayout";
import { AdminHospitalSelector } from "@/components/app/AdminHospitalSelector";
import { Panel, Loading } from "@/components/app/ui";
import { roleLabels, rolePermissions } from "@/lib/auth/permissions";
import { ROLES, HospitalSettings, HospitalSettingsRequest } from "@/lib/api/types";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/store";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";
import { toast } from "sonner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Pet Good Console" },
      { name: "description", content: "Clinic configuration, roles and permission matrix for staff accounts." },
      { property: "og:title", content: "Settings | Pet Good Console" },
      { property: "og:description", content: "Roles, permissions and clinic configuration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

const fieldClasses = "w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-forest transition-colors";
const labelClasses = "block text-xs font-medium text-foreground/70 mb-1.5";

function SettingsPage() {
  const { role, hospitalId, adminHospitalId } = useAuth();
  const activeHospitalId = role === "SUPER_ADMIN" ? adminHospitalId : hospitalId;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<HospitalSettingsRequest>({
    openingTime: "09:00",
    closingTime: "18:00",
    appointmentSlotDuration: 15,
    maxAdvanceBookingDays: 30,
    currency: "USD",
    timezone: "UTC",
    paymentModes: "Cash, Card",
    gstRate: 0,
  });
  
  const [hasExistingSettings, setHasExistingSettings] = useState(false);

  useEffect(() => {
    if (!activeHospitalId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    apiClient.get<HospitalSettings>(endpoints.hospitals.settings(activeHospitalId))
      .then(res => {
        if (res) {
          setHasExistingSettings(true);
          setSettings({
            openingTime: res.openingTime || "09:00",
            closingTime: res.closingTime || "18:00",
            appointmentSlotDuration: res.appointmentSlotDuration || 15,
            maxAdvanceBookingDays: res.maxAdvanceBookingDays || 30,
            currency: res.currency || "USD",
            timezone: res.timezone || "UTC",
            paymentModes: res.paymentModes || "Cash, Card",
            gstRate: res.gstRate || 0,
          });
        }
      })
      .catch((err) => {
        // 404 means settings not created yet, which is fine
        console.log("No existing settings found", err);
        setHasExistingSettings(false);
      })
      .finally(() => setLoading(false));
  }, [activeHospitalId]);

  const handleSave = async () => {
    if (!activeHospitalId) return;
    
    setSaving(true);
    try {
      if (hasExistingSettings) {
        await apiClient.put(endpoints.hospitals.settings(activeHospitalId), settings);
      } else {
        await apiClient.post(endpoints.hospitals.settings(activeHospitalId), settings);
        setHasExistingSettings(true);
      }
      toast.success("Hospital settings saved successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  return (
    <StaffLayout title="Settings" subtitle="Clinic configuration and permissions" permission="settings:write">
      <AdminHospitalSelector />
      
      <div className="space-y-6 max-w-5xl">
        <Panel 
          title="Hospital Configuration" 
          action={
            <button
              onClick={handleSave}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <Save className="size-3.5" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          }
        >
          {loading ? (
            <div className="py-8"><Loading /></div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelClasses}>Opening Time</label>
                <input type="time" name="openingTime" value={settings.openingTime} onChange={handleChange} className={fieldClasses} />
              </div>
              
              <div>
                <label className={labelClasses}>Closing Time</label>
                <input type="time" name="closingTime" value={settings.closingTime} onChange={handleChange} className={fieldClasses} />
              </div>
              
              <div>
                <label className={labelClasses}>Slot Duration (mins)</label>
                <input type="number" name="appointmentSlotDuration" min={5} max={120} value={settings.appointmentSlotDuration} onChange={handleChange} className={fieldClasses} />
              </div>
              
              <div>
                <label className={labelClasses}>Max Booking Advance (days)</label>
                <input type="number" name="maxAdvanceBookingDays" min={1} max={365} value={settings.maxAdvanceBookingDays} onChange={handleChange} className={fieldClasses} />
              </div>
              
              <div>
                <label className={labelClasses}>Currency</label>
                <input type="text" name="currency" value={settings.currency} onChange={handleChange} placeholder="e.g. USD, INR" className={fieldClasses} />
              </div>
              
              <div>
                <label className={labelClasses}>Timezone</label>
                <input type="text" name="timezone" value={settings.timezone} onChange={handleChange} placeholder="e.g. UTC, Asia/Kolkata" className={fieldClasses} />
              </div>
              
              <div>
                <label className={labelClasses}>Payment Modes</label>
                <input type="text" name="paymentModes" value={settings.paymentModes} onChange={handleChange} placeholder="Cash, Card, UPI" className={fieldClasses} />
              </div>
              
              <div>
                <label className={labelClasses}>GST Rate (%)</label>
                <input type="number" name="gstRate" min={0} max={100} step="0.1" value={settings.gstRate} onChange={handleChange} className={fieldClasses} />
              </div>
            </div>
          )}
        </Panel>
      
        <Panel title="Permission matrix">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase text-foreground/50">
                <tr>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Permissions</th>
                </tr>
              </thead>
              <tbody>
                {ROLES.map((r) => (
                  <tr key={r} className="border-t border-border align-top">
                    <td className="py-3 font-medium">{roleLabels[r]}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {rolePermissions[r].map((p) => (
                          <span key={p} className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/70">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </StaffLayout>
  );
}
