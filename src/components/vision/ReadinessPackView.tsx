// Readiness Pack assembly (FR-8 for G0, FR-12 for G3).
//
// VISION assembles DRAFT inputs mapped to PMI's DISD gate template — never an
// approval. Every drafted section is labelled "draft — requires review"
// (FR-8.4 / FR-12.5), the pack shows a checklist against the template, and the
// user can export/hand off the bundle with a list of open human owners.

import { toast } from "sonner";
import { ClipboardList, Download, FileText, Send } from "lucide-react";
import type { Gate, Journey, PackSection } from "@/types/vision";
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

  // The two mandatory G3 artefacts + everything is drafted; "open owners" are
  // simply every section (each needs a human owner to finalize).
  const openOwners = sections.map((s) => s.title);

  const handleExport = () => {
    toast.success(`${title} exported`, {
      description: `${sections.length} drafted sections bundled for hand-off to ePPM. ${openOwners.length} items still need a human owner.`,
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
        icon={<FileText className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />}
        right={generated ? <StageBadge label="Assembled" tone="green" /> : undefined}
      >
        {!generated ? (
          <div className="rounded-xl bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              VISION will assemble {sections.length} draft sections mapped to PMI's{" "}
              {gate} template
              {gate === "G3" ? ", including the SteerCo Stakeholder Agreement and DISD G3 Decision Sheet" : ""}.
            </p>
            <VisionButton onClick={onGenerate}>
              <ClipboardList className="w-3.5 h-3.5" />
              Generate {gate} Readiness Pack
            </VisionButton>
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {sections.map((s) => (
                <li key={s.id} className="rounded-xl border border-border bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <span className="text-xs font-semibold text-foreground">{s.title}</span>
                    <DraftBadge />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{s.draft}</p>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-xl border border-border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Checklist against the DISD {gate} template
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {sections.length} of {sections.length} inputs drafted. Every item still needs a human
                owner to review and finalize before the real ePPM submission.
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
    </div>
  );
}
