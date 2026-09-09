// Human Readiness (FR-6) — certifications, skills, and trainings mapped to the
// roles they affect, so adoption accounts for people, not just tech.
//
// Also includes a "recommended change drivers" finder: VISION (mock-)scans the
// organization for people/teams who already have the relevant experience and
// could lead the change, then reveals them after a short loading animation.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Loader2,
  Radar,
  Sparkles,
  Users,
  UserRound,
} from "lucide-react";
import type { ChangeDriver, Journey, ReadinessItem, ReadinessType, VisionIdea } from "@/types/vision";
import { getChangeDrivers, primaryUseCase } from "@/data/visionJourneys";
import { VisionSection, VisionButton } from "./visionUi";

export interface HumanReadinessViewProps {
  journey: Journey;
  /** The idea in progress — used to ground readiness in its primary use case. */
  idea?: VisionIdea;
  onContinue: () => void;
}

const TYPE_META: Record<ReadinessType, { label: string; icon: typeof Award; tone: string }> = {
  certification: { label: "Certification", icon: Award, tone: "text-blue-500 dark:text-blue-300" },
  skill: { label: "Skill", icon: GraduationCap, tone: "text-emerald-500 dark:text-emerald-300" },
  training: { label: "Training", icon: BookOpen, tone: "text-amber-500 dark:text-amber-300" },
};

/** How long the mock org-scan runs before revealing the change drivers. */
const SCAN_DURATION_MS = 2400;

const SCAN_STATUSES = [
  "Scanning the org directory…",
  "Matching skills & certifications…",
  "Weighing hands-on experience…",
  "Ranking potential change drivers…",
];

export function HumanReadinessView({ journey, idea, onContinue }: HumanReadinessViewProps) {
  // Prefer the primary use case's own readiness items when present.
  const uc = primaryUseCase(journey, idea);
  const readiness: ReadinessItem[] = uc?.readiness ?? journey.readiness;

  return (
    <div className="space-y-4">
      <VisionSection
        title="Human readiness"
        description="How people become ready — certifications, skills, and trainings, mapped to affected roles."
        icon={<Users className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
      >
        <ul className="space-y-2">
          {readiness.map((r) => {
            const meta = TYPE_META[r.type];
            const Icon = meta.icon;
            return (
              <li key={r.id} className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3">
                <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${meta.tone}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {meta.label}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">
                      {r.role}
                    </span>
                  </div>
                  <p className="text-xs text-foreground mt-1 leading-relaxed">{r.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-muted-foreground mt-3">
          On approval, these readiness items are cascaded to People &amp; Culture / L&amp;D as tracked
          action items (see Approve &amp; Cascade).
        </p>
      </VisionSection>

      <ChangeDriversFinder journey={journey} idea={idea} />

      <div className="flex justify-end">
        <VisionButton onClick={onContinue}>
          Continue to approve &amp; cascade
          <ChevronRight className="w-3.5 h-3.5" />
        </VisionButton>
      </div>
    </div>
  );
}

type ScanPhase = "idle" | "scanning" | "done";

function ChangeDriversFinder({ journey, idea }: { journey: Journey; idea?: VisionIdea }) {
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [statusIndex, setStatusIndex] = useState(0);
  // Prefer the primary use case's own change drivers when present.
  const uc = primaryUseCase(journey, idea);
  const drivers = uc?.changeDrivers ?? getChangeDrivers(journey.id);
  const timers = useRef<number[]>([]);

  // Reset when the journey changes.
  useEffect(() => {
    setPhase("idle");
    setStatusIndex(0);
  }, [journey.id]);

  // Clear any pending timers on unmount.
  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, []);

  const startScan = () => {
    if (drivers.length === 0) return;
    setPhase("scanning");
    setStatusIndex(0);

    const perStatus = SCAN_DURATION_MS / SCAN_STATUSES.length;
    SCAN_STATUSES.forEach((_, i) => {
      if (i === 0) return;
      timers.current.push(window.setTimeout(() => setStatusIndex(i), perStatus * i));
    });
    timers.current.push(window.setTimeout(() => setPhase("done"), SCAN_DURATION_MS));
  };

  return (
    <VisionSection
      title="Recommended change drivers"
      description="People and teams who already have the experience to lead this change — surfaced from across the organization."
      icon={<Radar className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
    >
      {phase === "idle" && (
        <div className="rounded-xl bg-muted p-4 text-center">
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            JARVISION can scan the organization for potential drivers of {journey.techName} adoption —
            people whose current skills and experience make them a natural fit to lead.
          </p>
          <VisionButton onClick={startScan}>
            <Sparkles className="w-3.5 h-3.5" />
            Find change drivers
          </VisionButton>
        </div>
      )}

      {phase === "scanning" && (
        <div className="rounded-xl bg-muted p-6 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-6 h-6 text-blue-500 dark:text-blue-300 animate-spin mb-3" />
          <p className="text-xs font-semibold text-foreground">Scanning the organization…</p>
          <motion.p
            key={statusIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-muted-foreground mt-1"
          >
            {SCAN_STATUSES[statusIndex]}
          </motion.p>
        </div>
      )}

      {phase === "done" && (
        <div>
          <p className="text-[11px] text-muted-foreground mb-3">
            Found {drivers.length} recommended change {drivers.length === 1 ? "driver" : "drivers"} for{" "}
            <span className="font-semibold text-foreground">{journey.techName}</span>, ranked by fit.
          </p>

          <ul className="space-y-2">
            {drivers.map((d, i) => (
              <DriverCard key={d.id} driver={d} index={i} />
            ))}
          </ul>
        </div>
      )}
    </VisionSection>
  );
}

function DriverCard({ driver, index }: { driver: ChangeDriver; index: number }) {
  const Icon = driver.isTeam ? Users : UserRound;
  const [showMembers, setShowMembers] = useState(false);
  const members = driver.members ?? [];
  const hasMembers = driver.isTeam && members.length > 0;

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.08 }}
      className="rounded-xl border border-border bg-muted/40 p-3"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-blue-600 dark:text-blue-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{driver.name}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              {driver.matchScore}% fit
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {driver.role} · {driver.team}
            {driver.isTeam ? " · team" : ""}
          </p>
          <p className="text-xs text-foreground mt-1.5 leading-relaxed">{driver.rationale}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {driver.skills.map((s) => (
              <span
                key={s}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
              >
                {s}
              </span>
            ))}
          </div>

          {hasMembers && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => setShowMembers((v) => !v)}
                aria-expanded={showMembers}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-300 hover:underline"
              >
                {showMembers ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                {showMembers ? "Hide" : "View"} {members.length} team members &amp; roles
              </button>

              <AnimatePresence initial={false}>
                {showMembers && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-2 space-y-1"
                  >
                    {members.map((m) => (
                      <li
                        key={m.name}
                        className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5"
                      >
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                          <UserRound className="w-3 h-3 text-blue-600 dark:text-blue-300" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-foreground leading-tight truncate">
                            {m.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-tight truncate">{m.role}</p>
                        </div>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
}
