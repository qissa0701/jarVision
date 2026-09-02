import { useState } from "react";
import { Bell, Eye, Moon, Sparkles, Sun } from "lucide-react";
import { SearchInput } from "@/components/layout/SearchInput";
import type { Notification } from "@/types";
import type { Theme } from "@/hooks/useTheme";

export interface TopBarProps {
  /** First name of the active role, used in the greeting. */
  firstName: string;
  /** Opens the Global_Search overlay (the search field is now purely a trigger). */
  onOpenGlobalSearch: () => void;
  /** Notifications derived from the active role's data. */
  notifications: Notification[];
  /** Called when a notification row is activated. */
  onNotificationSelect: (notification: Notification) => void;
  /** The active color theme, used to render the correct toggle icon/state. */
  theme: Theme;
  /** Flip between light and dark themes. */
  onToggleTheme: () => void;
  /** Whether the Jarvis chat panel is currently open. */
  chatOpen: boolean;
  /** Toggle the Jarvis chat panel open/closed. */
  onToggleChat: () => void;
  /** Enter VISION Studio — the organizational tech-adoption simulator (FR-1.1). */
  onEnterVision: () => void;
}

/** Left accent color per notification kind, mirroring the urgency/suggestion palette. */
const KIND_ACCENT: Record<Notification["kind"], string> = {
  critical: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-blue-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
  success: "bg-green-500",
};

/**
 * Dashboard top bar: time-based greeting, search field, dark-mode toggle, and
 * notifications control.
 *
 * The greeting is derived from the current hour (ported verbatim from the
 * original monolith). The notifications button toggles a dropdown anchored to
 * the bell that lists notifications derived from the active role's data; the
 * unread dot and count reflect how many are pending. Search state is owned by
 * the parent and flows through {@link SearchInput}.
 *
 * The "Add widget" action and the cross-view execution status pill were
 * removed: widgets are now fixed at exactly two (Calendar + Tasks), so there is
 * nothing to add, and the low-value status pill was dropped as part of the
 * navbar chrome cleanup.
 */
export function TopBar({
  firstName,
  onOpenGlobalSearch,
  notifications,
  onNotificationSelect,
  theme,
  onToggleTheme,
  chatOpen,
  onToggleChat,
  onEnterVision,
}: TopBarProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [open, setOpen] = useState(false);
  const count = notifications.length;
  const hasUnread = count > 0;

  return (
    <header className="h-[60px] bg-card border-b border-border px-6 flex items-center gap-4 flex-shrink-0 z-10">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground truncate">
          {greeting},{" "}
          <span className="font-semibold text-foreground">{firstName}</span>
          {" — "}
          <span className="text-muted-foreground">
            here&apos;s what needs your attention today.
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <SearchInput onOpenGlobalSearch={onOpenGlobalSearch} />
        {/* Enter VISION Studio — moves from personal AI assistance (Jarvis) into
            organizational tech-adoption simulation. Styled as a distinct
            outlined pill so it reads as a mode switch, not a utility toggle. */}
        <button
          type="button"
          onClick={onEnterVision}
          aria-label="Enter JARVISION"
          className="hidden sm:inline-flex items-center gap-1.5 h-9 pl-2.5 pr-3.5 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-400/30 text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
        >
          <Eye className="w-4 h-4" />
          JARVISION
        </button>
        {/* Jarvis chat toggle. Styled as a filled, gradient "brand" pill
            (rather than a plain icon button like the theme/bell toggles) so
            the assistant entry point is immediately recognizable — this is
            the primary way in to Jarvis, not a secondary utility action.
            aria-pressed/aria-expanded both reflect the panel's open state —
            expanded describes the disclosure semantics, pressed mirrors the
            dark-mode toggle's own convention. */}
        <button
          type="button"
          onClick={onToggleChat}
          aria-pressed={chatOpen}
          aria-expanded={chatOpen}
          aria-label={chatOpen ? "Close Jarvis Assistant" : "Open Jarvis Assistant"}
          className={`relative flex items-center gap-1.5 h-9 pl-2.5 pr-3.5 rounded-xl text-xs font-bold shadow-sm transition-all ${
            chatOpen
              ? "bg-blue-700 dark:bg-blue-600 text-white"
              : "bg-gradient-to-br from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 text-white hover:from-blue-700 hover:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-500 hover:shadow-md"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Jarvis
          {!chatOpen && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-card animate-pulse" />
          )}
        </button>
        {/* Dark mode toggle. aria-pressed reflects whether dark mode is on;
            the label describes the action the button will perform. */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-pressed={theme === "dark"}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={`View notifications${hasUnread ? `, ${count} unread` : ""}`}
            aria-haspopup="menu"
            aria-expanded={open}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <Bell className="w-4 h-4" />
            {hasUnread && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>

          {open && (
            <>
              {/* Click-away backdrop closes the dropdown. */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
                aria-hidden="true"
              />
              <div
                role="menu"
                aria-label="Notifications"
                className="absolute right-0 top-full mt-2 w-80 bg-popover text-popover-foreground rounded-2xl border border-border shadow-xl overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">Notifications</span>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-full">
                    {count}
                  </span>
                </div>
                {count === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                    You&apos;re all caught up.
                  </p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto scrollbar-hide py-1">
                    {notifications.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onNotificationSelect(n);
                            setOpen(false);
                          }}
                          className="w-full text-left flex items-start gap-2.5 px-4 py-2.5 hover:bg-muted transition-colors"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${KIND_ACCENT[n.kind]}`}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {n.detail}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
