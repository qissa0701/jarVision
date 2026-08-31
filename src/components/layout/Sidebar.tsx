import { Zap, LogOut, Settings, LayoutDashboard } from "lucide-react";
import type { NavItem, RoleData } from "@/types";

export interface SidebarProps {
  /** The currently active navigation item. */
  nav: NavItem;
  /** The logged-in user's info, shown as a non-interactive identity block. */
  user: Pick<RoleData, "name" | "title" | "avatar">;
  /** Called with the chosen navigation item when the user selects one. */
  onNavChange: (nav: NavItem) => void;
  /** Logs the user out, returning to the login screen. */
  onLogout: () => void;
}

/**
 * A single icon-only nav button in the rail. `active` drives the visual and
 * `aria-current="page"` state; the accessible name comes from `label` via
 * `aria-label` (and a `title` for a mouse-hover tooltip), since the rail shows
 * no visible text.
 */
function RailButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      title={label}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
        active
          ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
      }`}
    >
      {icon}
    </button>
  );
}

/**
 * Sidebar collapsed to a minimal icon rail.
 *
 * The rail holds Dashboard, Settings, a non-interactive avatar identifying
 * the logged-in user (their role is fixed for the session — there is no
 * in-app role switcher), and a Logout control. Logging out returns the app
 * to the login screen; logging back in as a different account is how a user
 * "switches roles". No text labels are shown in the rail itself; each
 * control exposes an accessible name via `aria-label` and every interactive
 * element remains reachable by keyboard.
 */
export function Sidebar({ nav, user, onNavChange, onLogout }: SidebarProps) {
  return (
    <nav
      aria-label="Primary"
      className="w-16 flex-shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col items-center h-full z-20 relative py-4"
    >
      {/* Logo */}
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 flex items-center justify-center shadow-sm dark:shadow-none flex-shrink-0 mb-6">
        <Zap className="w-4 h-4 text-white" aria-hidden="true" />
        <span className="sr-only">Jarvis</span>
      </div>

      {/* Nav — minimal icon rail: Dashboard only (Settings sits at the bottom below). */}
      <div className="flex flex-col items-center gap-1">
        <RailButton
          icon={<LayoutDashboard className="w-4 h-4" />}
          label="Dashboard"
          active={nav === "dashboard"}
          onClick={() => onNavChange("dashboard")}
        />
      </div>

      {/* Settings, user identity, and logout, pinned to the bottom of the rail. */}
      <div className="mt-auto flex flex-col items-center gap-2">
        <RailButton
          icon={<Settings className="w-4 h-4" />}
          label="Settings"
          active={nav === "settings"}
          onClick={() => onNavChange("settings")}
        />

        {/* Non-interactive identity avatar — the logged-in user's role is
            fixed for the session, so this is informational only (no
            dropdown/switcher). */}
        <div
          aria-label={`Signed in as ${user.name}, ${user.title}`}
          title={`${user.name} · ${user.title}`}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-400 dark:to-blue-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
        >
          {user.avatar}
        </div>

        <RailButton
          icon={<LogOut className="w-4 h-4" />}
          label="Log out"
          active={false}
          onClick={onLogout}
        />
      </div>
    </nav>
  );
}
