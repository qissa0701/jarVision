// Adoption Path (FR-4) — an interactive tree simulation with an executive
// summary, multi-select candidate "checkout", and deep evaluation per use case.
//
// Flow: an Executive Summary frames how the technology fits PMI. Below it, an
// expandable tree runs Technology → candidate Functions → Use Cases. Opening a
// use case reveals its evaluation — opportunities, a similarity / reuse check
// against existing projects, an explorable risk register (severity +
// mitigations) and an adjustable cost-benefit scenario explorer. Users can add
// several candidates to a checkout on the right; only the top (primary)
// candidate is carried forward to the next steps.

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
  GitCompare,
  GraduationCap,
  LayoutGrid,
  Lightbulb,
  Loader2,
  Plus,
  Recycle,
  ScrollText,
  Sparkles,
  Star,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { ExecutiveSummary, Journey, SimilarProject, UseCase, VisionIdea } from "@/types/vision";
import { deriveSimilarProjects, topSimilarity } from "@/lib/visionEconomics";
import { RiskExplorer } from "./RiskExplorer";
import { CostBenefitExplorer } from "./CostBenefitExplorer";
import { VisionSection, VisionButton, StageBadge } from "./visionUi";

export interface AdoptionPathViewProps {
  journey: Journey;
  idea: VisionIdea;
  onPositionFunction: (fn: string) => void;
  onToggleUseCase: (useCaseId: string) => void;
  onSetPrimaryUseCase: (useCaseId: string) => void;
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
  onToggleUseCase,
  onSetPrimaryUseCase,
  onContinue,
}: AdoptionPathViewProps) {
  const [openFunction, setOpenFunction] = useState<string | null>(idea.positionedFunction);
  const [openUseCase, setOpenUseCase] = useState<string | null>(
    idea.selectedUseCaseId ?? journey.recommendedUseCaseId,
  );

  const candidatesFor = (fn: string) => journey.useCases.filter((u) => u.function === fn);
  const selectedIds = idea.selectedUseCaseIds ?? [];

  const toggleFunction = (fn: string) => {
    const isOpen = openFunction === fn;
    onPositionFunction(fn);
    setOpenFunction(isOpen ? null : fn);
  };

  return (
    <div className="space-y-4">
      {/* Top row: executive summary + candidate checkout side by side */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0">
          {journey.executiveSummary && (
            <ExecutiveSummaryCard summary={journey.executiveSummary} journey={journey} />
          )}
        </div>
        <aside className="w-full lg:w-80 flex-shrink-0">
          <div className="lg:sticky lg:top-4">
            <CheckoutPanel
              journey={journey}
              selectedIds={selectedIds}
              onSetPrimary={onSetPrimaryUseCase}
              onRemove={onToggleUseCase}
              onContinue={onContinue}
            />
          </div>
        </aside>
      </div>

      {/* Full-width adoption tree */}
      <div>
          <VisionSection
            title="Adoption Path"
            description="An interactive simulation — expand the tree from technology to functions and use cases, and evaluate each candidate."
            icon={<Target className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
          >
            <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
              Click a <span className="font-semibold text-foreground">function</span> to position the
              technology, open a <span className="font-semibold text-foreground">use case</span> to
              evaluate it, then <span className="font-semibold text-foreground">add candidates</span> to
              your checkout. Explore several — only the top one is carried forward.
            </p>

            <div className="space-y-2">
              {/* Root: the technology */}
              <TreeNode icon={Cpu} title={journey.techName} subtitle={journey.tagline} active tone="root" />

              {/* Branch: candidate functions */}
              <Branch>
                {journey.targetFunctions.map((fn) => {
                  const isOpen = openFunction === fn;
                  const positioned = idea.positionedFunction === fn;
                  const ucs = candidatesFor(fn);
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
                                    onToggleSelect={() => onToggleUseCase(uc.id)}
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
      </div>
    </div>
  );
}

/* ── Executive summary ─────────────────────────────────────────── */

function ExecutiveSummaryCard({ summary, journey }: { summary: ExecutiveSummary; journey: Journey }) {
  return (
    <VisionSection
      title="Executive summary"
      description={`How ${journey.techName} fits PMI — the opportunity, what's already in place, and the candidates.`}
      icon={<ScrollText className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SummaryBlock icon={Target} title="Strategic fit at PMI" body={summary.fit} />
        <SummaryBlock icon={Lightbulb} title="The opportunity" body={summary.opportunity} tone="blue" />
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Already adopted at PMI
            </p>
          </div>
          <ul className="space-y-1">
            {summary.alreadyAdopted.map((a) => (
              <li key={a} className="flex items-start gap-2 text-[11px] text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                <span className="leading-relaxed">{a}</span>
              </li>
            ))}
          </ul>
        </div>
        <SummaryBlock icon={Boxes} title="Use cases explored" body={summary.useCaseSummary} />
      </div>
    </VisionSection>
  );
}

function SummaryBlock({
  icon: Icon,
  title,
  body,
  tone = "default",
}: {
  icon: typeof Target;
  title: string;
  body: string;
  tone?: "default" | "blue";
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        tone === "blue"
          ? "border-blue-200 dark:border-blue-400/30 bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-500/10 dark:to-blue-500/5"
          : "border-border bg-muted/40"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      </div>
      <p className="text-[11px] text-foreground leading-relaxed">{body}</p>
    </div>
  );
}

/* ── Candidate checkout ────────────────────────────────────────── */

function CheckoutPanel({
  journey,
  selectedIds,
  onSetPrimary,
  onRemove,
  onContinue,
}: {
  journey: Journey;
  selectedIds: string[];
  onSetPrimary: (id: string) => void;
  onRemove: (id: string) => void;
  onContinue: () => void;
}) {
  const selected = selectedIds
    .map((id) => journey.useCases.find((u) => u.id === id))
    .filter((u): u is UseCase => Boolean(u));

  return (
    <section className="bg-gradient-to-br from-card to-muted/40 rounded-2xl border border-border shadow-sm p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-300" />
          <h2 className="text-sm font-semibold text-foreground">Candidate checkout</h2>
        </div>
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-blue-600 text-white">
          {selected.length}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
        Humans can explore many paths. Add the candidates worth pursuing — for the next steps only the{" "}
        <span className="font-semibold text-foreground">top (primary)</span> one is carried forward.
      </p>

      {selected.length === 0 ? (
        <div className="rounded-xl bg-muted p-4 text-center">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            No candidates yet. Open a use case in the tree and{" "}
            <span className="font-semibold text-foreground">add it to your checkout</span>.
          </p>
          <p className="text-[10px] text-muted-foreground mt-2">
            Recommended: {shortTitle(
              journey.useCases.find((u) => u.id === journey.recommendedUseCaseId)?.description ?? "",
            )}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {selected.map((uc, i) => {
            const isPrimary = i === 0;
            const isRecommended = uc.id === journey.recommendedUseCaseId;
            return (
              <motion.li
                key={uc.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-2.5 ${
                  isPrimary
                    ? "border-blue-300 dark:border-blue-400/40 bg-blue-50/60 dark:bg-blue-500/10"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isPrimary && <StageBadge label="Top / primary" tone="blue" />}
                      {isRecommended && <StageBadge label="Recommended" tone="green" />}
                    </div>
                    <p className="text-[11px] font-semibold text-foreground mt-1 leading-tight">
                      {uc.function}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {shortTitle(uc.description)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(uc.id)}
                    aria-label={`Remove ${uc.function} from checkout`}
                    className="w-6 h-6 rounded-md border border-border bg-card flex items-center justify-center flex-shrink-0 hover:bg-muted text-muted-foreground"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {!isPrimary && (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(uc.id)}
                    className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-300 hover:underline"
                  >
                    <Star className="w-3 h-3" />
                    Make primary
                  </button>
                )}
              </motion.li>
            );
          })}
        </ul>
      )}

      <div className="mt-4">
        <VisionButton onClick={onContinue} disabled={selected.length === 0}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Continue with top candidate
          <ChevronRight className="w-3.5 h-3.5" />
        </VisionButton>
        {selected.length > 1 && (
          <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            {selected.length} candidates saved. The other {selected.length - 1} remain in your checklist to
            explore later.
          </p>
        )}
      </div>
    </section>
  );
}

/* ── Use-case node + evaluation widget + roadmap ───────────────── */

function UseCaseNode({
  uc,
  journey,
  idea,
  open,
  onToggle,
  onToggleSelect,
  onContinue,
}: {
  uc: UseCase;
  journey: Journey;
  idea: VisionIdea;
  open: boolean;
  onToggle: () => void;
  onToggleSelect: () => void;
  onContinue: () => void;
}) {
  const isRecommended = uc.id === journey.recommendedUseCaseId;
  const isSelected = (idea.selectedUseCaseIds ?? []).includes(uc.id);
  const isPrimary = idea.selectedUseCaseId === uc.id;
  const badges: NodeBadge[] = [];
  if (isRecommended) badges.push({ label: "Recommended", tone: "blue" });
  if (isPrimary) badges.push({ label: "Primary", tone: "green" });
  else if (isSelected) badges.push({ label: "In checkout", tone: "green" });

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
                {uc.image && (
                  <figure className="overflow-hidden rounded-xl border border-border">
                    <img
                      src={uc.image}
                      alt={uc.imageAlt ?? `Illustrative concept for ${uc.function}`}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  </figure>
                )}

                {uc.meaningForPmi && (
                  <div className="rounded-xl border border-blue-200 dark:border-blue-400/30 bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-500/10 dark:to-blue-500/5 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Lightbulb className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        What this means for PMI
                      </p>
                    </div>
                    <p className="text-[11px] text-foreground leading-relaxed">{uc.meaningForPmi}</p>
                  </div>
                )}

                <EvalList title="Opportunities" items={uc.opportunities} tone="green" />

                <SimilarityPanel uc={uc} />

                <RiskExplorer useCase={uc} />

                <CostBenefitExplorer useCase={uc} />

                <MiniFact label="Timeline (indicative)" value={uc.timeline} />

                <div className="pt-0.5">
                  <VisionButton onClick={onToggleSelect} variant={isSelected ? "ghost" : "primary"}>
                    {isSelected ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {isSelected ? "Remove from checkout" : "Add to candidates"}
                  </VisionButton>
                </div>
              </div>
            </DelayedReveal>

            {/* Selecting a candidate expands the tree again → adoption roadmap. */}
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

/* ── Similarity / reuse check ──────────────────────────────────── */

function SimilarityPanel({ uc }: { uc: UseCase }) {
  const sims = deriveSimilarProjects(uc);
  const top = topSimilarity(uc);

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <GitCompare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
          <p className="text-[11px] font-semibold text-foreground">Similarity &amp; reuse check</p>
        </div>
        {sims.length > 0 && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              top >= 70
                ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300"
                : top >= 45
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300"
                  : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            top similarity {top}%
          </span>
        )}
      </div>

      {sims.length === 0 ? (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          No overlapping PMI projects found — this candidate looks net-new.
        </p>
      ) : (
        <>
          {top >= 70 && (
            <p className="text-[11px] text-red-700 dark:text-red-300 leading-relaxed mb-2">
              High overlap — position as an extension, not a duplicate, and reuse existing components.
            </p>
          )}
          <ul className="space-y-2">
            {sims.map((s) => (
              <SimilarProjectRow key={s.name} project={s} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function SimilarProjectRow({ project }: { project: SimilarProject }) {
  return (
    <li className="rounded-lg border border-border bg-muted/40 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-foreground leading-tight">{project.name}</p>
          <p className="text-[10px] text-muted-foreground">{project.status}</p>
        </div>
        <span className="text-[10px] font-bold text-foreground tabular-nums flex-shrink-0">
          {project.similarityScore}% match
        </span>
      </div>
      {project.overlappingComponents.length > 0 && (
        <ChipRow icon={GitCompare} label="Overlaps" items={project.overlappingComponents} tone="amber" />
      )}
      {project.reusableComponents.length > 0 && (
        <ChipRow icon={Recycle} label="Reusable" items={project.reusableComponents} tone="green" />
      )}
    </li>
  );
}

function ChipRow({
  icon: Icon,
  label,
  items,
  tone,
}: {
  icon: typeof Recycle;
  label: string;
  items: string[];
  tone: "amber" | "green";
}) {
  const chip =
    tone === "amber"
      ? "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300"
      : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  return (
    <div className="mt-1.5">
      <div className="flex items-center gap-1 mb-1">
        <Icon className={`w-3 h-3 ${tone === "amber" ? "text-amber-500" : "text-emerald-500"}`} />
        <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((it) => (
          <span key={it} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${chip}`}>
            {it}
          </span>
        ))}
      </div>
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
  const base = "w-full flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all";
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
          <span className={`text-xs font-semibold ${isRoot ? "text-white" : "text-foreground"}`}>{title}</span>
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
  return <div className="ml-4 pl-4 border-l-2 border-dashed border-border space-y-2">{children}</div>;
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
