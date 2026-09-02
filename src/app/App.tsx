// App — composition root for the Jarvis AI Dashboard.
//
// This root gates the dashboard behind a login screen: useAuthSession owns
// whether a user is logged in and, if so, which single fixed role they're
// logged in as. There is no in-app role switching — a logged-in user's role
// never changes; "switching roles" means logging out (returning to
// LoginView) and logging back in as a different account.
//
// Once logged in, the root wires the domain hooks (useTaskPanel,
// useOvernightQueue) to the presentation layer and routes between the two
// remaining nav destinations (Dashboard, Settings) — the standalone
// Tasks/Calendar/Email/Agents views, the widget registry/picker/reorder
// system, and the email inbox were all removed as part of the dashboard
// redesign (fixed 2-widget dashboard, icon-rail sidebar, no widget picker).
// Every interactive surface is wired to a handler: sidebar nav + logout,
// top-bar search + notifications bell, dashboard task/meeting actions, and
// the Settings maintenance action. User feedback for fire-and-forget actions
// is surfaced through sonner toasts.
//
// SECURITY NOTE: this is a frontend-only prototype. Login is a client-side UI
// gate that picks which persona's mock data to display — there is no
// backend, no password, and no real authentication or access control behind
// it. See docs/FUNCTIONAL_REQUIREMENTS.md § Security Model.

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import type { Meeting, NavItem, Notification, Role, Task } from "@/types";
import { ROLE_DATA } from "@/data/roleData";
import { MOCK_DOCUMENTS } from "@/data/documents";
import { MOCK_PEOPLE } from "@/data/people";
import { buildNotifications } from "@/lib/notifications";
import type { SearchIndexEntry } from "@/lib/globalSearch";
import { STORAGE_KEYS } from "@/constants/layout";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTheme } from "@/hooks/useTheme";
import { useTaskPanel } from "@/hooks/useTaskPanel";
import { useOvernightQueue } from "@/hooks/useOvernightQueue";
import { useChatAssistant } from "@/hooks/useChatAssistant";
import { useGlobalSearchShortcut } from "@/hooks/useGlobalSearchShortcut";
import { useVisionStudio } from "@/hooks/useVisionStudio";
import { VisionStudio } from "@/components/vision/VisionStudio";
import { VISION_TRENDS } from "@/data/visionJourneys";
import { jarvisRoleForCascadeTarget } from "@/constants/visionRoleMap";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { GlobalSearchOverlay } from "@/components/layout/GlobalSearchOverlay";
import { TaskPanel } from "@/components/panels/TaskPanel";
import { ChatPanel } from "@/components/panels/ChatPanel";
import { Toaster } from "@/app/components/ui/sonner";
import { DashboardView, LoginView, SettingsView } from "@/components/views";
import type { ArtifactActionKind } from "@/components/widgets/ArtifactCard";

export default function App() {
  // Login session: null when logged out, otherwise the one fixed role the
  // user is logged in as. Gates everything else in this component.
  const { role, login, logout } = useAuthSession();

  if (role === null) {
    return (
      <>
        <LoginView onLogin={login} />
        <Toaster position="bottom-right" richColors closeButton />
      </>
    );
  }

  return <LoggedInApp role={role} onLogout={logout} />;
}

interface LoggedInAppProps {
  /** The logged-in user's fixed role for this session. */
  role: Role;
  /** Logs the user out, returning to the login screen. */
  onLogout: () => void;
}

/**
 * The dashboard shell, rendered only once a session is active. Split out
 * from `App` so its hooks (task panel, overnight queue, chat, etc.) only run
 * for a logged-in session. Logging out sets the session role back to `null`,
 * so `App` swaps back to rendering `LoginView` — fully unmounting this
 * subtree rather than re-rendering it in place — and the next login mounts a
 * fresh instance with no leftover state from the previous session.
 */
function LoggedInApp({ role, onLogout }: LoggedInAppProps) {
  // Persisted color theme (light/dark). Applies the `dark` class to the
  // document root so the theme tokens in styles/theme.css take effect.
  const { theme, setTheme, toggleTheme } = useTheme();

  // Task-panel state machine (idle → planning → executing → done).
  const taskPanel = useTaskPanel();

  // Overnight automation queue — the core "delegate tonight, review by morning"
  // workflow. Persisted independently of the theme preference.
  const overnight = useOvernightQueue();

  // VISION Studio state (org-level tech-adoption simulator) — persisted
  // independently of Jarvis. Lives here so entering/leaving VISION preserves
  // the session and never unmounts its state mid-exploration.
  const vision = useVisionStudio();

  // View-local UI state with no home elsewhere.
  const [nav, setNav] = useState<NavItem>("dashboard");
  const [chatOpen, setChatOpen] = useState(false);
  // Global_Search overlay open/closed state, owned here alongside the other
  // overlay-ish panels (chat, task panel).
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  // Which shell is showing: the Jarvis dashboard or the VISION Studio module
  // (FR-1). Switching modes preserves the logged-in session — the user is
  // never logged out. `visionPreload` optionally deep-links into a journey
  // (from a trend nudge, FR-13.2).
  const [mode, setMode] = useState<"jarvis" | "vision">("jarvis");
  const [visionPreload, setVisionPreload] = useState<string | null>(null);

  // The logged-in user's real, unfiltered data. The dashboard no longer
  // filters this in place — search now happens exclusively inside the
  // Global_Search overlay (see GlobalSearchOverlay.tsx), which maintains its
  // own query.
  const baseData = ROLE_DATA[role];

  // Chat assistant state — conversation history + simulated "thinking" delay.
  // Context is the active role's *real* data and *real* overnight run queue,
  // so the assistant's answers stay accurate regardless of what's currently
  // typed into the Global_Search overlay.
  const chatAssistant = useChatAssistant(baseData, overnight.runsFor(role));

  // Bell notifications reflect the role's real data, independent of the
  // Global_Search overlay's own query so opening/typing in the overlay never
  // hides pending alerts. VISION Studio trend nudges (FR-13.1) are prepended as
  // proactive "want to simulate this?" items, minus any the user has dismissed.
  const notifications = useMemo(() => {
    const base = buildNotifications(baseData);
    const nudges: Notification[] = VISION_TRENDS.filter(
      (t) => !vision.dismissedTrends.includes(t.id),
    ).map((t) => ({
      id: `vision-${t.id}`,
      title: t.message,
      detail: `Open JARVISION · ${t.techName}`,
      kind: "info",
      target: null,
      visionJourneyId: t.journeyId,
    }));
    return [...nudges, ...base];
  }, [baseData, vision.dismissedTrends]);

  // Action items cascaded from VISION simulations that this logged-in account
  // owns, resolved via the shared org-role mapping (FR-7). Surfaced in the
  // Tasks widget so cascades land in the right persona's task list.
  const roleCascadedItems = useMemo(
    () => vision.cascadeItems.filter((c) => jarvisRoleForCascadeTarget(c.targetRole) === role),
    [vision.cascadeItems, role],
  );

  // ─── Handlers ──────────────────────────────────────────────────────────────

  // Logging out resets the task panel and chat conversation before handing
  // control back to App's login gate — the next login (as this or a
  // different account) should never inherit stale in-progress state.
  const handleLogout = () => {
    taskPanel.reset();
    chatAssistant.reset();
    onLogout();
  };

  // At most one of {Task_Panel, Chat_Panel} is open at a time — both anchor
  // to the right side of the screen, so opening one closes the other to avoid
  // a broken double-overlay.
  const handleHandleTask = (task: Task) => {
    setChatOpen(false);
    taskPanel.open(task);
  };

  const handleToggleChat = () => {
    setChatOpen((open) => {
      const next = !open;
      if (next) taskPanel.close();
      return next;
    });
  };

  const handleSelectMeeting = (meeting: Meeting) => {
    toast(meeting.title, {
      description: `${meeting.startTime}–${meeting.endTime} · ${meeting.attendees}`,
    });
  };

  // Global_Search: Email/Document/Person results have no real destination
  // view (Email and Agents views were both removed in earlier phases), so
  // activating one is a mocked "toast naming the result" action, mirroring
  // handleArtifactAction/handleSyncToCalendar below.
  const handleSelectGlobalSearchOther = (entry: SearchIndexEntry) => {
    toast(entry.title, { description: entry.secondary });
  };

  // "Plan My Day" → "Sync to Calendar" is another fire-and-forget action,
  // mirroring how `handleSelectMeeting` surfaces a toast for meeting
  // selection. The panel itself also shows an inline confirmation.
  const handleSyncToCalendar = (syncedCount: number) => {
    toast.success("Focus time added to your calendar", {
      description: `${syncedCount} focus block${syncedCount === 1 ? "" : "s"} added to your calendar.`,
    });
  };

  const handleNotificationSelect = (notification: Notification) => {
    // VISION trend nudge → dismiss it and deep-link into VISION with the tech
    // pre-loaded (FR-13.2/13.3).
    if (notification.visionJourneyId) {
      vision.dismissTrend(notification.id.replace(/^vision-/, ""));
      setVisionPreload(notification.visionJourneyId);
      setMode("vision");
      return;
    }
    if (notification.target) setNav(notification.target);
  };

  // Enter VISION Studio from the top bar (no journey pre-loaded, FR-1.1).
  const handleEnterVision = () => {
    setVisionPreload(null);
    setMode("vision");
  };

  // Return to Jarvis, preserving the session. Reset the preload so re-entering
  // via the button later doesn't re-open a stale journey (FR-1.3).
  const handleExitVision = () => {
    setMode("jarvis");
    setVisionPreload(null);
  };

  // Mocked artifact actions (Open/Download) bubble up here for a toast,
  // mirroring how `onSelectMeeting` surfaces a toast for meeting selection.
  // Request changes / Approve call the overnight queue directly from the
  // Tasks widget, so they don't need a handler here.
  const handleArtifactAction = (kind: ArtifactActionKind, task: Task) => {
    toast(kind === "open" ? "Opening artifact" : "Downloading artifact", {
      description: task.title,
    });
  };

  // Revert = undo a completed run entirely: reset the Task_Panel back to a
  // fresh, unexecuted planning state (`taskPanel.revert()`) AND delete the
  // persisted overnight run so the task's derived status returns to
  // `not_started` and "Execute with Jarvis" reappears (`overnight.unschedule`
  // — deleting the run is exactly what "no run at all" means per
  // `deriveTaskStatus`'s precedence). Guarded on an active task existing,
  // mirroring the `completedGuardRef` effect above that bridges the panel's
  // `done` state into the overnight queue in the first place.
  const handleRevertTask = () => {
    if (!taskPanel.activeTask) return;
    const task = taskPanel.activeTask;
    taskPanel.revert();
    overnight.unschedule(role, task.id);
    toast("Changes reverted", {
      description: `${task.title} is back to not started.`,
    });
  };

  // Observe the Task_Panel's state machine (owned by `useTaskPanel`) reaching
  // its terminal `done` state and persist that completion into the overnight
  // queue exactly once via `completeNow` — this is the "Execute now" path's
  // bridge: the plan/execute UI already showed the work happening, so once
  // it's done the task's status must persist as Completed with a generated
  // artifact even after the panel is closed. The guard resets whenever the
  // panel leaves the `done` state so a subsequent re-execution of the same
  // task can complete again.
  const completedGuardRef = useRef<string | null>(null);
  useEffect(() => {
    if (taskPanel.state !== "done" || !taskPanel.activeTask) {
      completedGuardRef.current = null;
      return;
    }
    const key = `${role}:${taskPanel.activeTask.id}`;
    if (completedGuardRef.current === key) return;
    completedGuardRef.current = key;
    overnight.completeNow(role, taskPanel.activeTask);
  }, [taskPanel.state, taskPanel.activeTask, role, overnight]);

  // Cmd/Ctrl+K opens the Global_Search overlay from anywhere in the app,
  // regardless of what currently has focus.
  useGlobalSearchShortcut({ onTrigger: () => setGlobalSearchOpen(true) });

  // "Clear saved preferences" only resets the theme now — the login session
  // (STORAGE_KEYS.role) is managed by login/logout, not by this maintenance
  // action, so clearing preferences never signs the user out.
  const handleClearPreferences = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.theme);
    } catch {
      // Ignore storage failures (private mode, quota); state reset below still
      // returns the UI to a clean baseline.
    }
    setTheme("light");
    setNav("dashboard");
    toast.success("Preferences cleared", {
      description: "Reset to the default theme.",
    });
  };

  // ─── View routing ────────────────────────────────────────────────────────
  const renderView = () => {
    switch (nav) {
      case "settings":
        return (
          <SettingsView
            overnightWindow={overnight.window}
            onWindowChange={overnight.setWindow}
            onClearPreferences={handleClearPreferences}
            theme={theme}
            onThemeChange={setTheme}
          />
        );
      case "dashboard":
      default:
        return (
          <DashboardView
            data={baseData}
            role={role}
            onHandleTask={handleHandleTask}
            onSelectMeeting={handleSelectMeeting}
            onSyncToCalendar={handleSyncToCalendar}
            overnight={overnight}
            taskPanelActiveTaskId={taskPanel.activeTask?.id ?? null}
            taskPanelState={taskPanel.state}
            onArtifactAction={handleArtifactAction}
            cascadedItems={roleCascadedItems}
          />
        );
    }
  };

  // VISION Studio mode swaps the entire Jarvis shell for the Studio shell while
  // keeping the session alive. Placed after all hooks so hook order is stable.
  if (mode === "vision") {
    return (
      <>
        <VisionStudio
          vision={vision}
          onExitToJarvis={handleExitVision}
          theme={theme}
          onToggleTheme={toggleTheme}
          preloadJourneyId={visionPreload}
        />
        <Toaster position="bottom-right" richColors closeButton />
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar (nav landmark) — minimal icon rail. */}
      <Sidebar
        nav={nav}
        user={{ name: baseData.name, title: baseData.title, avatar: baseData.avatar }}
        onNavChange={setNav}
        onLogout={handleLogout}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top bar */}
        <TopBar
          firstName={baseData.firstName}
          onOpenGlobalSearch={() => setGlobalSearchOpen(true)}
          notifications={notifications}
          onNotificationSelect={handleNotificationSelect}
          theme={theme}
          onToggleTheme={toggleTheme}
          chatOpen={chatOpen}
          onToggleChat={handleToggleChat}
          onEnterVision={handleEnterVision}
        />

        {/* Routed view. Keyed by nav so switching views cross-fades. */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={nav}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Task panel */}
        <AnimatePresence>
          {taskPanel.activeTask && (
            <TaskPanel
              task={taskPanel.activeTask}
              state={taskPanel.state}
              executingStep={taskPanel.executingStep}
              completedSteps={taskPanel.completedSteps}
              input={taskPanel.input}
              onClose={taskPanel.close}
              onExecute={taskPanel.execute}
              onStop={taskPanel.stop}
              onRevert={handleRevertTask}
            />
          )}
        </AnimatePresence>

        {/* Chat panel — mutually exclusive with the Task_Panel (both anchor
            right); opening either closes the other, coordinated above. */}
        <AnimatePresence>
          {chatOpen && (
            <ChatPanel
              messages={chatAssistant.messages}
              isThinking={chatAssistant.isThinking}
              onSendMessage={chatAssistant.sendMessage}
              onClose={() => setChatOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Global_Search overlay — owns its own query state; fed the active
            role's real data plus the mock documents/people datasets. */}
        <GlobalSearchOverlay
          open={globalSearchOpen}
          onOpenChange={setGlobalSearchOpen}
          data={baseData}
          documents={MOCK_DOCUMENTS}
          people={MOCK_PEOPLE}
          onSelectTask={handleHandleTask}
          onSelectMeeting={handleSelectMeeting}
          onSelectOther={handleSelectGlobalSearchOther}
        />
      </div>

      {/* Toast host for fire-and-forget action feedback. */}
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
