// Adoption Path (FR-4) — an interactive tree simulation.
//
// Technology → candidate Functions → Use Cases → Evaluation, drawn as an
// expandable tree. Clicking a function node positions the tech into it (FR-4.4)
// and branches out its candidate use cases; opening a use case expands an
// evaluation widget; carrying a use case forward (FR-4.5) grows the tree again
// into a projected adoption roadmap. Short "analysing" loaders between reveals
// make it feel like a live simulation.

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  GitBranch,
  GraduationCap,
  LayoutGrid,
  Loader2,
  Sparkles,
  Target,
  TriangleAlert,
  Users,
} from "lucide-react";
import type { Journey, UseCase, VisionIdea } from "@/types/vision";
import { VisionSection, VisionButton, StageBadge } from "./visionUi";

export interface AdoptionPathViewProps {
  journey: Journey;
  idea: VisionIdea;
  onPositionFunction: (fn: string) => void;
  onSelectUseCase: (useCaseId: string) => void;
  onContinue: () => void;
}

function shortTitle(desc: string): string {
  const clean = desc.split(/[;.]/)[0].trim();
  return clean.length > 60 ? `${clean.slice(0, 57)}…` : clean;
}

export function AdoptionPathView({
  journey,
  idea,
  onPositionFunction,
  onSelectUseCase,
  onContinue,
}: AdoptionPathViewProps) {
  const [openFunction, setOpenFunction] = useState<string | null>(idea.positionedFunction);
  const [openUseCase, setOpenUseCase] = useState<string | null>(
    idea.selectedUseCaseId ?? journey.recommendedUseCaseId,
  );

  const useCasesFor = (fn: string) => journey.useCases.filter((u) => u.function === fn);

  const toggleFunction = (fn: string) => {
    const isOpen = openFunction === fn;
    onPositionFunction(fn);
    setOpenFunction(isOpen ? null : fn);
  };

  return (
    <div className="space-y-4">
      <VisionSection
        title="Adoption Path"
        description="An interactive simulation — expand the tree from technology to functions, use cases, and a projected roadmap."
        icon={<Target className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
      >
        <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
          Click a <span className="font-semibold text-foreground">function</span> to position the
          technology, open a <span className="font-semibold text-foreground">use case</span> to
          evaluate it, then carry one forward to grow the adoption roadmap.
        </p>

        {/* ── Tree ─────────────────────────────────────────────── */}
        <div className="space-y-2">
          {/* Root: the technology */}
          <TreeNode
            icon={Cpu}
            title={journey.techName}
            subtitle={journey.tagline}
            active
            tone="root"
          />

          {/* Branch: candidate functions */}
          <Branch>
            {journey.targetFunctions.map((fn) => {
              const isOpen = openFunction === fn;
              const positioned = idea.positionedFunction === fn;
              const ucs = useCasesFor(fn);
              return (
                <div key={fn}>
                  <TreeNode
                    icon={Building2}
                    title={fn}
                    subtitle={`${ucs.length} candidate use case${ucs.length === 1 ? "" : "s"}`}
                    expandable
                    expanded={isOpen}
                    active={positioned}
                    badges={positioned ? [{ label: "Positioned", tone: "blue" }] : []}
                    onClick={() => toggleFunction(fn)}
                  />
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <BranchAnimated>
                        <DelayedReveal label="Scanning candidate use cases…">
                          {ucs.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground py-1.5 pl-1">
                              No scripted use case for this function.
                            </p>
                          ) : (
                            ucs.map((uc) => (
                              <UseCaseNode
                                key={uc.id}
                                uc={uc}
                                journey={journey}
                                idea={idea}
                                open={openUseCase === uc.id}
                                onToggle={() => setOpenUseCase(openUseCase === uc.id ? null : uc.id)}
                                onSelect={() => onSelectUseCase(uc.id)}
                                onContinue={onContinue}
                              />
                            ))
                          )}
                        </DelayedReveal>
                      </BranchAnimated>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </Branch>
        </div>
      </VisionSection>

      {/* Recommended candidate summary (FR-4.5). */}
      <VisionSection
        title="Recommended candidate"
        icon={<Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
      >
        <p className="text-xs text-foreground leading-relaxed">{journey.recommendationRationale}</p>
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[11px] text-muted-foreground">
            {idea.selectedUseCaseId
              ? "A candidate is carried forward. Continue to the multi-layer impact simulation."
              : "Open a use case above and carry it forward (or use the recommended one) to continue."}
          </p>
          <VisionButton onClick={onContinue}>
            Continue to impact simulation
            <ChevronRight className="w-3.5 h-3.5" />
          </VisionButton>
        </div>
      </VisionSection>
    </div>
  );
}

/* ── Use-case node + evaluation widget + roadmap ───────────────── */

function UseCaseNode({
  uc,
  journey,
  idea,
  open,
  onToggle,
  onSelect,
  onContinue,
}: {
  uc: UseCase;
  journey: Journey;
  idea: VisionIdea;
  open: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onContinue: () => void;
}) {
  const isRecommended = uc.id === journey.recommendedUseCaseId;
  const isSelected = idea.selectedUseCaseId === uc.id;
  const badges: NodeBadge[] = [];
  if (isRecommended) badges.push({ label: "Recommended", tone: "blue" });
  if (isSelected) badges.push({ label: "Carried forward", tone: "green" });

  return (
    <div>
      <TreeNode
        icon={Boxes}
        title={shortTitle(uc.description)}
        subtitle={uc.description}
        expandable
        expanded={open}
        active={isSelected}
        badges={badges}
        onClick={onToggle}
      />

      <AnimatePresence initial={false}>
        {open && (
          <BranchAnimated>
            <DelayedReveal label="Running evaluation…" delay={620}>
              <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/40 p-3 space-y-3">
                <EvalList title="Opportunities" items={uc.opportunities} tone="green" />
                <EvalList title="Risks" items={uc.risks} tone="amber" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <MiniFact label="Benefit–cost (indicative)" value={uc.benefitCost} />
                  <MiniFact label="Timeline (indicative)" value={uc.timeline} />
                </div>
                <EvalList title="Potential project clashes" items={uc.projectClashes} tone="amber" />
                <div className="pt-0.5">
                  <VisionButton onClick={onSelect} variant={isSelected ? "ghost" : "primary"}>
                    <Sparkles className="w-3.5 h-3.5" />
                    {isSelected ? "Selected as candidate" : "Carry this use case forward"}
                  </VisionButton>
                </div>
              </div>
            </DelayedReveal>

            {/* Choosing a use case expands the tree again → adoption roadmap. */}
            <AnimatePresence initial={false}>
              {isSelected && (
                <BranchAnimated>
                  <DelayedReveal label="Projecting adoption roadmap…" delay={900}>
                    <AdoptionRoadmap onContinue={onContinue} />
                  </DelayedReveal>
                </BranchAnimated>
              )}
            </AnimatePresence>
          </BranchAnimated>
        )}
      </AnimatePresence>
    </div>
  );
}

const ROADMAP_STEPS: { icon: typeof LayoutGrid; title: string; detail: string }[] = [
  { icon: LayoutGrid, title: "Multi-layer impact", detail: "Enterprise, domain & individual effects" },
  { icon: Users, title: "Human readiness", detail: "Skills, certifications & change drivers" },
  { icon: GitBranch, title: "Approve & cascade", detail: "Role-scoped action items into the org" },
  { icon: GraduationCap, title: "G0 readiness pack", detail: "Draft inputs for the human gate" },
];

function AdoptionRoadmap({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-400/30 bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-500/10 dark:to-blue-500/5 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
        <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
          Projected adoption roadmap
        </p>
      </div>
      <ol className="space-y-1.5">
        {ROADMAP_STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12 }}
              className="flex items-center gap-2.5"
            >
              <span className="w-6 h-6 rounded-lg bg-white/70 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-foreground leading-tight">{s.title}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{s.detail}</p>
              </div>
              {i < ROADMAP_STEPS.length - 1 && (
                <ArrowRight className="w-3 h-3 text-blue-400 ml-auto flex-shrink-0" />
              )}
            </motion.li>
          );
        })}
      </ol>
      <div className="mt-3">
        <VisionButton onClick={onContinue}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Begin the simulation
        </VisionButton>
      </div>
    </div>
  );
}

/* ── Tree primitives ───────────────────────────────────────────── */

interface NodeBadge {
  label: string;
  tone: "neutral" | "amber" | "green" | "red" | "blue";
}

function TreeNode({
  icon: Icon,
  title,
  subtitle,
  badges = [],
  expandable = false,
  expanded = false,
  active = false,
  tone = "default",
  onClick,
}: {
  icon: typeof Cpu;
  title: string;
  subtitle?: string;
  badges?: NodeBadge[];
  expandable?: boolean;
  expanded?: boolean;
  active?: boolean;
  tone?: "default" | "root";
  onClick?: () => void;
}) {
  const isRoot = tone === "root";
  const base =
    "w-full flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all";
  const skin = isRoot
    ? "border-blue-300 dark:border-blue-400/40 bg-gradient-to-br from-blue-600 to-blue-500 dark:from-blue-600 dark:to-blue-500 text-white shadow-sm"
    : active
      ? "border-blue-300 dark:border-blue-400/40 bg-gradient-to-br from-blue-50 to-blue-100/40 dark:from-blue-500/15 dark:to-blue-500/5"
      : "border-border bg-gradient-to-br from-card to-muted/40 hover:border-blue-200 dark:hover:border-blue-400/30 hover:shadow-sm";

  const iconWrap = isRoot
    ? "bg-white/20 text-white"
    : active
      ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300"
      : "bg-muted text-muted-foreground";

  const content = (
    <>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconWrap}`}>
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold ${isRoot ? "text-white" : "text-foreground"}`}>
            {title}
          </span>
          {badges.map((b) => (
            <StageBadge key={b.label} label={b.label} tone={b.tone} />
          ))}
        </div>
        {subtitle && (
          <p
            className={`text-[11px] mt-0.5 leading-relaxed ${
              isRoot ? "text-blue-50/90" : "text-muted-foreground"
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
      {expandable &&
        (expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        ))}
    </>
  );

  if (!onClick) {
    return <div className={`${base} ${skin}`}>{content}</div>;
  }
  return (
    <button type="button" onClick={onClick} aria-expanded={expandable ? expanded : undefined} className={`${base} ${skin}`}>
      {content}
    </button>
  );
}

/** Static indented branch container with a connector line. */
function Branch({ children }: { children: ReactNode }) {
  return (
    <div className="ml-4 pl-4 border-l-2 border-dashed border-border space-y-2">{children}</div>
  );
}

/** Animated (expand/collapse) indented branch. */
function BranchAnimated({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="ml-4 pl-4 border-l-2 border-dashed border-border space-y-2 mt-2">{children}</div>
    </motion.div>
  );
}

/** Shows a short spinner/loader, then reveals children — mimics analysis time. */
function DelayedReveal({
  label,
  delay = 700,
  children,
}: {
  label: string;
  delay?: number;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);

  if (!ready) {
    return (
      <div className="flex items-center gap-2 py-2 pl-1 text-[11px] text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 dark:text-blue-300" />
        {label}
      </div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="space-y-2">
      {children}
    </motion.div>
  );
}

function EvalList({ title, items, tone }: { title: string; items: string[]; tone: "green" | "amber" }) {
  if (items.length === 0) return null;
  const dot = tone === "green" ? "bg-emerald-500" : "bg-amber-500";
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {tone === "amber" && <TriangleAlert className="w-3 h-3 text-amber-500" />}
        <p className="text-[11px] font-semibold text-foreground">{title}</p>
      </div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${dot}`} />
            <span className="leading-relaxed">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card border border-border p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-[11px] text-foreground mt-0.5 leading-relaxed">{value}</p>
    </div>
  );
}
