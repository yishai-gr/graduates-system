import { NavLink } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import {
  IconHome,
  IconUsers,
  IconSchool,
  IconLogout,
  IconPlus,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { useNavigate } from "react-router";

interface AppSidebarProps extends React.HTMLAttributes<HTMLElement> {
  onNavigate?: () => void;
}

export function AppSidebar({
  className,
  onNavigate,
  ...props
}: AppSidebarProps) {
  const { user, logout } = useAuth();
  const { isSuperAdmin, can } = usePermissions();
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        "flex h-dvh w-64 flex-col border-l bg-background shadow-md",
        className,
      )}
      {...props}
    >
      {/* Logo & User Info */}
      <div className="flex h-16 items-center border-b px-6">
        <IconSchool className="ml-2 h-6 w-6 text-primary" />
        <span className="text-lg font-bold">מערכת בוגרים</span>
      </div>

      <div className="border-b p-4 text-center hidden md:block">
        <div className="font-medium">
          {user?.firstName} {user?.lastName}
        </div>
        <div className="text-xs text-muted-foreground">{user?.email}</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <NavLink
          to="/"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
            )
          }
        >
          <IconHome size={20} />
          בית
        </NavLink>

        <NavLink
          to="/graduates"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
            )
          }
        >
          <IconSchool size={20} />
          ניהול בוגרים
        </NavLink>

        {isSuperAdmin && (
          <NavLink
            to="/users"
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
              )
            }
          >
            <IconUsers size={20} />
            ניהול משתמשים
          </NavLink>
        )}

        {/* Register Button - Only for those who can create graduates */}
        {can("create", "graduates") && (
          <div className="pt-4 mt-auto">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 border-2 border-dashed border-muted-foreground/30 text-muted-foreground px-3 hover:text-foreground"
              onClick={() => {
                navigate("/graduates/new");
                if (onNavigate) {
                  onNavigate();
                }
              }}
            >
              <IconPlus size={20} />
              רשום בוגר חדש
            </Button>
          </div>
        )}
      </nav>

      {/* Footer Actions */}
      <div className="border-t p-4 space-y-2">
        <ModeToggle />

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={logout}
        >
          <IconLogout size={16} />
          התנתקות
        </Button>
      </div>
    </aside>
  );
}
