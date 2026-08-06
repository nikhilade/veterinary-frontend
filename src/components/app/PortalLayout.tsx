import { Link, useNavigate } from "@tanstack/react-router";
import { PawPrint, LayoutDashboard, Dog, CalendarPlus, CalendarDays, Pill, Receipt, UserRound, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { authStore, useAuth } from "@/lib/auth/store";
import { RequireAuth } from "./RequireAuth";

const tabs = [
  { to: "/portal/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/portal/my-pets", label: "Pets", icon: Dog },
  { to: "/portal/book-appointment", label: "Book", icon: CalendarPlus },
  { to: "/portal/my-appointments", label: "Visits", icon: CalendarDays },
  { to: "/portal/prescriptions", label: "Meds", icon: Pill },
  { to: "/portal/invoices", label: "Bills", icon: Receipt },
  { to: "/portal/profile", label: "Profile", icon: UserRound },
] as const;

export function PortalLayout({ title, children }: { title: string; children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <RequireAuth permission="portal:access">
      <div className="min-h-screen bg-sand pb-24">
        <header className="sticky top-0 z-30 bg-forest px-5 py-5 text-primary-foreground">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <div>
              <span className="flex items-center text-lg font-bold">
                Pet G<PawPrint className="inline size-4 -rotate-12 text-clay" />
                od
              </span>
              <h1 className="mt-1 text-xl text-primary-foreground">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-primary-foreground/80 sm:inline">{user?.name}</span>
              <button
                aria-label="Sign out"
                onClick={() => {
                  authStore.logout();
                  navigate({ to: "/login", replace: true });
                }}
                className="inline-flex size-10 items-center justify-center rounded-full border border-primary-foreground/30"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-5 py-6">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card">
          <div className="mx-auto grid max-w-3xl grid-cols-4 sm:grid-cols-7">
            {tabs.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-1 py-3 text-[11px] font-medium text-foreground/60"
                activeProps={{ className: "text-clay" }}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </RequireAuth>
  );
}
