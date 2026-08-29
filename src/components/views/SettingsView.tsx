// SettingsView — Appearance, Layout, and About sections.
//
// Appearance exposes a functional dark-mode switch wired to the theme controls
// from the composition root. Layout now exposes a single maintenance action —
// clearing the persisted role + theme preferences — since the dashboard's
// widget list is no longer user-configurable (there is nothing widget-related
// left to reset). About is static product info.

import { Info, Layout as LayoutIcon, Moon, Palette, ShieldCheck, Trash2 } from "lucide-react";
import type { OvernightWindow } from "@/types";
import type { Theme } from "@/hooks/useTheme";

export interface SettingsViewProps {
  /** The active overnight automation window. */
  overnightWindow: OvernightWindow;
  /** Update the overnight automation window. */
  onWindowChange: (window: OvernightWindow) => void;
  /** Clear the persisted role + theme preferences from storage. */
  onClearPreferences: () => void;
  /** The active color theme. */
  theme: Theme;
  /** Set the color theme explicitly. */
  onThemeChange: (theme: Theme) => void;
}

/** Shared section shell so each settings group has a consistent card layout. */
function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-5">
      <div className="flex items-center gap-2.5 mb-1">
        {icon}
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>
      {children}
    </section>
  );
}

export function SettingsView({
  overnightWindow,
  onWindowChange,
  onClearPreferences,
  theme,
  onThemeChange,
}: SettingsViewProps) {
  const isDark = theme === "dark";
  return (
    <div aria-labelledby="settings-view-title" className="max-w-2xl space-y-4">
      <header className="mb-1">
        <h1 id="settings-view-title" className="text-lg font-semibold text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage overnight automation, appearance, and preferences.
        </p>
      </header>

      <SettingsSection
        icon={<Moon className="w-4 h-4 text-indigo-400 dark:text-indigo-300" />}
        title="Overnight automation"
        description="The window during which Jarvis autonomously runs your delegated tasks."
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground">Starts at</span>
            <input
              type="time"
              value={overnightWindow.start}
              onChange={(e) =>
                onWindowChange({ ...overnightWindow, start: e.target.value })
              }
              className="px-3 py-2 rounded-xl border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-400/30 focus:border-indigo-300 dark:focus:border-indigo-400/50"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground">Results due by</span>
            <input
              type="time"
              value={overnightWindow.end}
              onChange={(e) =>
                onWindowChange({ ...overnightWindow, end: e.target.value })
              }
              className="px-3 py-2 rounded-xl border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-400/30 focus:border-indigo-300 dark:focus:border-indigo-400/50"
            />
          </label>
        </div>
        <div className="flex items-start gap-2.5 mt-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-400/20">
          <ShieldCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-300 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
            <span className="font-semibold">Human review required.</span> Overnight results
            are always staged for your approval — Jarvis never auto-applies changes without a
            final sign-off.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Palette className="w-4 h-4 text-muted-foreground" />}
        title="Appearance"
        description="Choose how Jarvis looks on this device."
      >
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted border border-border">
          <div>
            <p className="text-xs font-semibold text-foreground">Dark mode</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isDark ? "Dark theme is on." : "Switch to a darker color scheme."}
            </p>
          </div>
          {/* Functional theme switch. aria-checked tracks the active theme; the
              switch flips between the light and dark token sets. */}
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark mode"
            onClick={() => onThemeChange(isDark ? "light" : "dark")}
            className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-400/30 ${
              isDark ? "bg-indigo-600 dark:bg-indigo-500" : "bg-switch-background"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                isDark ? "left-[18px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<LayoutIcon className="w-4 h-4 text-muted-foreground" />}
        title="Preferences"
        description="Clear all saved preferences on this device."
      >
        <button
          type="button"
          onClick={onClearPreferences}
          className="w-full flex items-center gap-2.5 p-3 rounded-xl border border-red-100 dark:border-red-400/20 hover:bg-red-50 dark:hover:bg-red-500/10 text-left transition-colors"
        >
          <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-300">Clear saved preferences</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Reset your role and theme back to their defaults on this browser.
            </p>
          </div>
        </button>
      </SettingsSection>

      <SettingsSection
        icon={<Info className="w-4 h-4 text-muted-foreground" />}
        title="About"
        description="Your AI-powered command center."
      >
        <dl className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Product</dt>
            <dd className="font-semibold text-foreground">Jarvis AI Dashboard</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Version</dt>
            <dd className="font-semibold text-foreground">0.0.1</dd>
          </div>
        </dl>
      </SettingsSection>
    </div>
  );
}
