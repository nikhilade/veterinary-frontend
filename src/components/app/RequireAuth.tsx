import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, hydrateAuth } from "@/lib/auth/store";
import { can, homeRouteFor, type Permission } from "@/lib/auth/permissions";

export function RequireAuth({
  children,
  permission,
}: {
  children: ReactNode;
  permission: Permission;
}) {
  const { hydrated, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    hydrateAuth();
  }, []);

  const allowed = isAuthenticated && can(role, permission);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    } else if (!allowed && role) {
      navigate({ to: homeRouteFor(role), replace: true });
    }
  }, [hydrated, isAuthenticated, allowed, role, navigate]);

  if (!hydrated || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
