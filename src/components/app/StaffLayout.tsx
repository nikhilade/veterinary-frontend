import { Link, useNavigate } from "@tanstack/react-router";
import {
  PawPrint,
  LayoutDashboard,
  Users,
  Dog,
  CalendarDays,
  Receipt,
  Boxes,
  BarChart3,
  Stethoscope,
  FlaskConical,
  Pill,
  Scissors,
  Syringe,
  ClipboardList,
  Banknote,
  RotateCcw,
  Truck,
  Building2,
  Sparkles,
  IdCard,
  Database,


  Settings,
  LogOut,
  Menu,
  Search,
  Bell,
  ChevronRight,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { authStore, useAuth } from "@/lib/auth/store";
import { can, roleLabels, type Permission } from "@/lib/auth/permissions";
import { RequireAuth } from "./RequireAuth";
import { Breadcrumbs } from "@/components/app/ui";

const navItems: { to: string; label: string; icon: typeof Users; permission: Permission }[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "staff:access" },
  { to: "/app/tenants", label: "Hospitals", icon: Building2, permission: "tenants:manage" },
  { to: "/app/onboarding", label: "Onboard Hospital", icon: Sparkles, permission: "tenants:manage" },
  { to: "/app/owners", label: "Pet Owners", icon: Users, permission: "owners:read" },
  { to: "/app/pets", label: "Pets", icon: Dog, permission: "pets:read" },
  { to: "/app/vaccinations", label: "Vaccinations", icon: Syringe, permission: "pets:read" },
  { to: "/app/appointments", label: "Appointments", icon: CalendarDays, permission: "appointments:read" },
  { to: "/app/calendar", label: "Calendar", icon: CalendarDays, permission: "appointments:read" },
  { to: "/app/queue", label: "Reception Queue", icon: Users, permission: "appointments:read" },
  { to: "/app/doctors", label: "Doctors", icon: Stethoscope, permission: "doctors:read" },
  { to: "/app/doctor-schedule", label: "Availability", icon: CalendarDays, permission: "doctors:read" },
  { to: "/app/consultations", label: "Consultations", icon: ClipboardList, permission: "consultations:read" },
  { to: "/app/prescriptions", label: "Prescriptions", icon: Pill, permission: "prescriptions:write" },
  { to: "/app/lab", label: "Laboratory", icon: FlaskConical, permission: "lab:read" },
  { to: "/app/pharmacy", label: "Pharmacy", icon: Pill, permission: "pharmacy:read" },

  { to: "/app/grooming", label: "Grooming", icon: Scissors, permission: "grooming:read" },
  { to: "/app/billing", label: "Billing", icon: Receipt, permission: "billing:read" },
  { to: "/app/payments", label: "Payments", icon: Banknote, permission: "payments:write" },
  { to: "/app/refunds", label: "Refunds", icon: RotateCcw, permission: "billing:read" },
  { to: "/app/inventory", label: "Inventory", icon: Boxes, permission: "inventory:read" },
  { to: "/app/suppliers", label: "Suppliers", icon: Truck, permission: "suppliers:read" },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3, permission: "reports:read" },
  { to: "/app/reports", label: "Reports", icon: BarChart3, permission: "reports:read" },

  { to: "/app/branches", label: "Branches", icon: Building2, permission: "branches:read" },
  { to: "/app/staff", label: "Staff", icon: IdCard, permission: "staff:read" },
  { to: "/app/attendance", label: "Attendance", icon: CalendarDays, permission: "staff:read" },
  { to: "/app/master-data", label: "Master Data", icon: Database, permission: "masterdata:read" },
  { to: "/app/settings", label: "Settings", icon: Settings, permission: "settings:write" },
];

const navGroups = [
  { label: "Overview", paths: ["/app/dashboard", "/app/analytics", "/app/reports"] },
  { label: "Patient care", paths: ["/app/owners", "/app/pets", "/app/vaccinations", "/app/appointments", "/app/calendar", "/app/queue", "/app/doctors", "/app/doctor-schedule", "/app/consultations", "/app/prescriptions", "/app/lab", "/app/grooming"] },
  { label: "Finance & stock", paths: ["/app/billing", "/app/payments", "/app/refunds", "/app/pharmacy", "/app/inventory", "/app/suppliers"] },
  { label: "Administration", paths: ["/app/tenants", "/app/onboarding", "/app/branches", "/app/staff", "/app/attendance", "/app/master-data", "/app/settings"] },
] as const;

export function StaffLayout({
  title,
  subtitle,
  breadcrumbs,
  children,
  permission = "staff:access",
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; to?: string }[];
  children: ReactNode;
  permission?: Permission;
}) {
  const { user, role, adminHospitalId } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const items = navItems.filter((i) => can(role, i.permission));
  const initials = (user?.name || "PG")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const today = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date());

  return (
    <RequireAuth permission={permission}>
      <div className="staff-console min-h-screen bg-sand lg:flex">
        {open && (
          <div
            className="fixed inset-0 z-30 bg-foreground/35 backdrop-blur-xs lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside
          data-lenis-prevent
          className={`${open ? "block" : "hidden"} fixed inset-y-0 left-0 z-40 w-[17rem] overflow-y-auto overscroll-contain no-scrollbar bg-forest px-3 py-5 text-primary-foreground lg:sticky lg:top-0 lg:block lg:h-screen lg:max-h-screen lg:shrink-0`}
        >
          <div className="flex min-h-full flex-col">
            <div className="flex items-center justify-between px-2">
              <Link to="/app/dashboard" className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground text-forest shadow-sm">
                  <PawPrint className="size-5 -rotate-12" />
                </span>
                <span>
                  <span className="block text-lg font-bold leading-none">Pet Good</span>
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/55">Clinical OS</span>
                </span>
              </Link>
              <button aria-label="Close navigation" onClick={() => setOpen(false)} className="flex size-9 items-center justify-center rounded-lg border border-primary-foreground/15 lg:hidden">
                <X className="size-4" />
              </button>
            </div>
            <nav className="mt-7 flex-1 space-y-6 pb-8">
              {navGroups.map((group) => {
                const groupItems = items.filter((item) => group.paths.includes(item.to as never));
                if (groupItems.length === 0) return null;
                return (
                  <div key={group.label}>
                    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/45">{group.label}</p>
                    <div className="space-y-1">
                      {groupItems.map(({ to, label, icon: Icon }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setOpen(false)}
                          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-primary-foreground/68 transition-all hover:bg-primary-foreground/8 hover:text-primary-foreground"
                          activeProps={{ className: "!bg-primary-foreground !text-forest shadow-sm" }}
                        >
                          <Icon className="size-4" />
                          <span className="min-w-0 flex-1 truncate">{label}</span>
                          <ChevronRight className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>
            <div className="border-t border-primary-foreground/12 px-2 pt-4">
              <p className="text-xs font-semibold">{user?.name}</p>
              <p className="mt-1 text-[11px] text-primary-foreground/55">{role ? roleLabels[role] : ""}</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-[4.5rem] items-center justify-between gap-4 border-b border-border bg-card/95 px-4 backdrop-blur-lg lg:px-8">
            <div className="flex items-center gap-3">
              <button
                aria-label="Toggle navigation"
                onClick={() => setOpen((v) => !v)}
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-background lg:hidden"
              >
                <Menu className="size-4" />
              </button>
              <div>
                <div className="hidden sm:block mb-1">
                  <Breadcrumbs paths={breadcrumbs || [{ label: title }]} />
                </div>
                <h1 className="text-lg leading-tight lg:text-xl">{title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden xl:block">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input aria-label="Search the console" placeholder="Search patients, owners…" className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-3 text-xs outline-none transition-colors focus:border-forest" />
              </div>
              <span className="hidden border-l border-border pl-3 text-xs font-medium text-muted-foreground md:block">{today}</span>
              <button aria-label="Notifications" className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted">
                <Bell className="size-4" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-clay" />
              </button>
              <span className="flex size-9 items-center justify-center rounded-lg bg-sage text-xs font-bold text-forest">{initials}</span>
              <button
                aria-label="Sign out"
                onClick={() => {
                  authStore.logout();
                  navigate({ to: "/login", replace: true });
                }}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-forest transition-colors hover:bg-muted"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </header>
          <main key={adminHospitalId || 'default'} className="mx-auto w-full max-w-[1600px] p-4 pb-24 lg:p-8">
            {subtitle ? <p className="mb-5 text-sm text-muted-foreground lg:-mt-3 lg:mb-6">{subtitle}</p> : null}
            {children}
          </main>
          <nav className="fixed inset-x-3 bottom-3 z-20 grid grid-cols-4 rounded-lg border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-lg lg:hidden">
            {items.filter((item) => ["/app/dashboard", "/app/calendar", "/app/queue", "/app/pets"].includes(item.to)).map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-2 text-[10px] font-medium text-muted-foreground" activeProps={{ className: "bg-sage !text-forest" }}>
                <Icon className="size-4" /><span className="truncate">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </RequireAuth>
  );
}
