import { createFileRoute } from "@tanstack/react-router";
import { StaffLayout } from "@/components/app/StaffLayout";
import { Panel } from "@/components/app/ui";
import { roleLabels, rolePermissions } from "@/lib/auth/permissions";
import { ROLES } from "@/lib/api/types";

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

function SettingsPage() {
  return (
    <StaffLayout title="Settings" subtitle="Roles and permissions" permission="settings:write">
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
    </StaffLayout>
  );
}
