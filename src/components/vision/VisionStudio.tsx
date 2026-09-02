// VisionStudio — the distinct "Studio" shell (FR-1.2).
//
// Rendered in place of the Jarvis dashboard when the user enters VISION Studio.
// It keeps its own header/branding but preserves the Jarvis session (the user
// is never logged out), and offers a persistent "Back to Jarvis" control
// (FR-1.3). Internally it routes between Home, the New-Simulation chatbot, and
// a per-idea JourneyWorkspace.

import { useEffect, useRef, useState } from "react";
import { Eye, Moon, Sun, LayoutDashboard } from "lucide-react";
import type { Theme } from "@/hooks/useTheme";
import type { VisionStudio as VisionStudioApi } from "@/hooks/useVisionStudio";
import { getJourney } from "@/data/visionJourneys";
import { VisionHome } from "./VisionHome";
import { VisionChatbot } from "./VisionChatbot";
import { JourneyWorkspace } from "./JourneyWorkspace";

type Screen = { view: "home" } | { view: "chatbot" } | { view: "workspace"; ideaId: string };

export interface VisionStudioProps {
  vision: VisionStudioApi;
  /** Return to the Jarvis dashboard, preserving the session (FR-1.3). */
  onExitToJarvis: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  /** Optional journey to auto-open on entry (from a Jarvis trend nudge, FR-13.2). */
  preloadJourneyId?: string | null;
}

export function VisionStudio({
  vision,
  onExitToJarvis,
  theme,
  onToggleTheme,
  preloadJourneyId,
}: VisionStudioProps) {
  const [screen, setScreen] = useState<Screen>({ view: "home" });

  // Auto-open a preloaded journey exactly once (deep-link from Jarvis).
  const preloadedRef = useRef(false);
  useEffect(() => {
    if (preloadedRef.current) return;
    if (preloadJourneyId) {
      preloadedRef.current = true;
      const id = vision.startJourney(preloadJourneyId);
      if (id) setScreen({ view: "workspace", ideaId: id });
    }
  }, [preloadJourneyId, vision]);

  const openJourney = (journeyId: string) => {
    const id = vision.startJourney(journeyId);
    if (id) setScreen({ view: "workspace", ideaId: id });
  };

  const workspaceIdea =
    screen.view === "workspace" ? vision.getIdea(screen.ideaId) : undefined;
  const workspaceJourney = workspaceIdea ? getJourney(workspaceIdea.journeyId) : undefined;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* VISION header (distinct from the Jarvis top bar). */}
      <header className="h-[60px] flex-shrink-0 border-b border-border px-6 flex items-center gap-4 bg-gradient-to-r from-blue-600/10 to-transparent">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-sm flex-shrink-0">
            <Eye className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight bg-gradient-to-r from-blue-700 to-sky-500 dark:from-blue-300 dark:to-sky-300 bg-clip-text text-transparent">
              JARVISION
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight truncate">
              Emerging Tech Adoption Simulator
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-pressed={theme === "dark"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onExitToJarvis}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold border border-border text-foreground hover:bg-muted transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to Jarvis
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-gradient-to-b from-blue-50/60 via-background to-background dark:from-blue-950/25 dark:via-background">
        <div className="max-w-5xl mx-auto">
          {screen.view === "home" && (
            <VisionHome
              vision={vision}
              onOpenIdea={(ideaId) => setScreen({ view: "workspace", ideaId })}
              onStartJourney={openJourney}
              onNewSimulation={() => setScreen({ view: "chatbot" })}
            />
          )}
          {screen.view === "chatbot" && (
            <VisionChatbot onLaunchJourney={openJourney} onBack={() => setScreen({ view: "home" })} />
          )}
          {screen.view === "workspace" &&
            (workspaceIdea && workspaceJourney ? (
              <JourneyWorkspace
                journey={workspaceJourney}
                idea={workspaceIdea}
                vision={vision}
                onBackToHome={() => setScreen({ view: "home" })}
              />
            ) : (
              <p className="text-sm text-muted-foreground">That idea could not be found.</p>
            ))}
        </div>
      </main>
    </div>
  );
}
