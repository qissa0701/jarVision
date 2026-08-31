// Readiness Pack assembly (FR-8 for G0, FR-12 for G3).
//
// VISION assembles DRAFT inputs mapped to PMI's DISD gate template — never an
// approval. Every drafted section starts as "draft — requires review". The user
// can open each draft in a Review dialog and Approve it, which routes it to the
// relevant team; an "Approve all" shortcut approves the whole pack at once.
//
// Once a document is approved it animates through a routing lifecycle —
// "Sent to X" → "In Review by X" → "Approved". Approvals resolve out of order
// (randomised), but every document ends Approved within APPROVAL_MAX_DURATION_MS
// (tune that single constant to speed up / slow down the whole sequence).

import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { CheckCircle2, ClipboardList, Download, FileText, Loader2, Send } from "lucide-react";
import type { Gate, Journey, PackSection } from "@/types/vision";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { VisionSection, VisionButton, DraftBadge, StageBadge } from "./visionUi";

export interface ReadinessPackViewProps {
  gate: Gate;
  journey: Journey;
  generated: boolean;
  /** Generate the pack (marks it assembled). */
  onGenerate: () => void;
  /** Submit the pack into the gate decision view. */
  onSubmitForDecision: () => void;
}

/**
 * Total time for every approved document to finish its routing animation
 * (Sent → In Review → Approved). Change this one value to make the whole
 * sequence faster or slower for a demo. Kept ≤ 5s per the brief.
 */
const APPROVAL_MAX_DURATION_MS = 5000;

/** Placeholder document body shown in the review dialog. */
const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.";

type DocStatus = "draft" | "sent" | "review" | "approved";

/** Map a pack section to the org team it routes to on approval. */
function teamForSection(section: PackSection): string {
  const s = `${section.id} ${section.title}`.toLowerCase();
  if (s.includes("security") || s.includes("cyber")) return "Cybersecurity (1LoD)";
  if (s.includes("privacy") || s.includes("data")) return "Data Privacy Office";
  if (s.includes("financ")) return "IT Finance";
  if (s.includes("risk")) return "Risk & Governance";
  if (s.includes("tech") || s.includes("architect")) return "Enterprise Architecture";
  if (s.includes("steerco") || s.includes("decision") || s.includes("stakeholder"))
    return "DISD SteerCo";
  if (s.includes("benefit") || s.includes("outcome")) return "Portfolio Strategy";
  if (s.includes("impact")) return "Risk & Governance";
  return "PMO / ePPM";
}

export function ReadinessPackView({
  gate,
  journey,
  generated,
  onGenerate,
  onSubmitForDecision,
}: ReadinessPackViewProps) {
  const sections: PackSection[] = gate === "G0" ? journey.g0Pack : journey.g3Pack;
  const title = gate === "G0" ? "G0 Readiness Pack" : "G3 Business Case / Readiness Pack";
  const submitLabel = gate === "G0" ? "Submit for G0 decision" : "Submit for G3 decision";

  const [statuses, setStatuses] = useState<Record<string, DocStatus>>({});
  const [reviewing, setReviewing] = useState<PackSection | null>(null);
  const timers = useRef<number[]>([]);

  // Reset statuses when the pack (journey/gate) changes.
  useEffect(() => {
    setStatuses({});
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, [journey.id, gate]);

  // Clean up pending timers on unmount.
  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, []);

  const statusFor = (id: string): DocStatus => statuses[id] ?? "draft";
  const setStatus = (id: string, status: DocStatus) =>
    setStatuses((prev) => ({ ...prev, [id]: status }));

  const allApproved = sections.length > 0 && sections.every((s) => statusFor(s.id) === "approved");
  const pendingCount = sections.filter((s) => statusFor(s.id) === "draft").length;

  /**
   * Kick off the Sent → In Review → Approved animation for the given docs.
   * Each doc gets its own randomised schedule so they resolve out of order,
   * but all land Approved within APPROVAL_MAX_DURATION_MS.
   */
  const runApproval = (ids: string[]) => {
    ids.forEach((id) => {
      if (statusFor(id) === "approved") return;
      const max = APPROVAL_MAX_DURATION_MS;
      const approvedAt = max * (0.4 + Math.random() * 0.6); // 40%–100% of the window
      const sentAt = approvedAt * (0.08 + Math.random() * 0.17); // early
      const reviewAt = approvedAt * (0.45 + Math.random() * 0.25); // middle
      timers.current.push(window.setTimeout(() => setStatus(id, "sent"), sentAt));
      timers.current.push(window.setTimeout(() => setStatus(id, "review"), reviewAt));
      timers.current.push(window.setTimeout(() => setStatus(id, "approved"), approvedAt));
    });
  };

  const approveOne = (section: PackSection) => {
    setReviewing(null);
    runApproval([section.id]);
    toast.success(`${section.title} approved`, {
      description: `Routed to ${teamForSection(section)} for sign-off.`,
    });
  };

  const approveAll = () => {
    const ids = sections.filter((s) => statusFor(s.id) === "draft").map((s) => s.id);
    if (ids.length === 0) return;
    runApproval(ids);
    toast.success(`Approving ${ids.length} document${ids.length === 1 ? "" : "s"}`, {
      description: "Each draft is being routed to its relevant team for sign-off.",
    });
  };

  const handleExport = () => {
    toast.success(`${title} exported`, {
      description: `${sections.length} drafted sections bundled for hand-off to ePPM.`,
    });
  };

  return (
    <div className="space-y-4">
      <VisionSection
        title={title}
        description={
          gate === "G0"
            ? "Draft inputs to accelerate the formal G0 submission — not an approval."
            : "Draft the DISD G3 business case for a completed PoC — not an approval."
        }
        icon={<FileText className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
        right={
          generated ? (
            <StageBadge label={allApproved ? "All approved" : "Assembled"} tone="green" />
          ) : undefined
        }
      >
        {!generated ? (
          <div className="rounded-xl bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              jarVision will assemble {sections.length} draft sections mapped to PMI's {gate} template
              {gate === "G3"
                ? ", including the SteerCo Stakeholder Agreement and DISD G3 Decision Sheet"
                : ""}
              .
            </p>
            <VisionButton onClick={onGenerate}>
              <ClipboardList className="w-3.5 h-3.5" />
              Generate {gate} Readiness Pack
            </VisionButton>
          </div>
        ) : (
          <>
            {/* Approve-all shortcut */}
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3 rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {allApproved
                  ? "Every draft has been approved and routed to its team."
                  : `${pendingCount} of ${sections.length} document${
                      sections.length === 1 ? "" : "s"
                    } still need review.`}
              </p>
              <VisionButton onClick={approveAll} disabled={pendingCount === 0}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve all
              </VisionButton>
            </div>

            <ul className="space-y-2">
              {sections.map((s) => {
                const status = statusFor(s.id);
                const team = teamForSection(s);
                return (
                  <li key={s.id} className="rounded-xl border border-border bg-muted/40 p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <span className="text-xs font-semibold text-foreground">{s.title}</span>
                      <StatusPill status={status} team={team} />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{s.draft}</p>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setReviewing(s)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Review
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 rounded-xl border border-border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Checklist against the DISD {gate} template
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {sections.filter((s) => statusFor(s.id) === "approved").length} of {sections.length}{" "}
                inputs approved and routed to their owning teams.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <VisionButton variant="ghost" onClick={handleExport}>
                <Download className="w-3.5 h-3.5" />
                Export / hand off
              </VisionButton>
              <VisionButton onClick={onSubmitForDecision}>
                <Send className="w-3.5 h-3.5" />
                {submitLabel}
              </VisionButton>
            </div>
          </>
        )}
      </VisionSection>

      {/* Review dialog */}
      <Dialog open={reviewing !== null} onOpenChange={(open) => !open && setReviewing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto scrollbar-hide">
          {reviewing && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-base">{reviewing.title}</DialogTitle>
                  <DraftBadge />
                </div>
                <DialogDescription>
                  {gate} Readiness Pack · {journey.techName} · routes to {teamForSection(reviewing)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Drafted summary
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">{reviewing.draft}</p>
                </div>
                {LOREM.split("\n\n").map((para, i) => (
                  <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>

              <DialogFooter>
                <VisionButton variant="ghost" onClick={() => setReviewing(null)}>
                  Close
                </VisionButton>
                <VisionButton
                  onClick={() => approveOne(reviewing)}
                  disabled={statusFor(reviewing.id) !== "draft"}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {statusFor(reviewing.id) === "draft" ? "Approve & send to team" : "Approved"}
                </VisionButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Animated status pill reflecting a document's routing lifecycle. */
function StatusPill({ status, team }: { status: DocStatus; team: string }) {
  if (status === "draft") return <DraftBadge />;

  const config: Record<
    Exclude<DocStatus, "draft">,
    { label: string; className: string; icon: ReactNode }
  > = {
    sent: {
      label: `Sent to ${team}`,
      className:
        "bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300",
      icon: <Send className="w-3 h-3" />,
    },
    review: {
      label: `In Review by ${team}`,
      className: "bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    approved: {
      label: "Approved",
      className:
        "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
  };
  const c = config[status];

  return (
    <motion.span
      key={status}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${c.className}`}
    >
      {c.icon}
      {c.label}
    </motion.span>
  );
}
