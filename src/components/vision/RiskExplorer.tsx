// Risk explorer — per-risk severity + explorable mitigation strategies.
//
// For each evaluated risk the user sees a severity band and can expand the four
// canonical risk-response techniques — avoidance, reduction, transference,
// acceptance — each showing a concrete strategy and the residual severity once
// applied. VISION highlights a recommended technique but the human explores.

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronRight, ShieldCheck, TriangleAlert } from "lucide-react";
import type { MitigationTechnique, RiskItem, RiskSeverity, UseCase } from "@/types/vision";
import {
  SEVERITY_LABEL,
  TECHNIQUE_BLURB,
  TECHNIQUE_LABEL,
  deriveRiskItems,
} from "@/lib/visionEconomics";

const SEVERITY_TONE: Record<RiskSeverity, string> = {
  low: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/30",
  medium: "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-400/30",
  high: "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-400/30",
  critical: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-400/30",
};

export function SeverityBadge({ severity }: { severity: RiskSeverity }) {
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${SEVERITY_TONE[severity]}`}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

export function RiskExplorer({ useCase }: { useCase: UseCase }) {
  const risks = deriveRiskItems(useCase);
  if (risks.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <TriangleAlert className="w-3 h-3 text-amber-500" />
        <p className="text-[11px] font-semibold text-foreground">
          Risks &amp; mitigations · explore strategies
        </p>
      </div>
      <ul className="space-y-1.5">
        {risks.map((risk) => (
          <RiskRow key={risk.id} risk={risk} />
        ))}
      </ul>
    </div>
  );
}

function RiskRow({ risk }: { risk: RiskItem }) {
  const [open, setOpen] = useState(false);
  const [technique, setTechnique] = useState<MitigationTechnique>(risk.recommendedTechnique);
  const active = risk.mitigations.find((m) => m.technique === technique) ?? risk.mitigations[0];

  return (
    <li className="rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-start gap-2 p-2.5 text-left"
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
        )}
        <span className="min-w-0 flex-1 text-[11px] text-foreground leading-relaxed">{risk.title}</span>
        <SeverityBadge severity={risk.severity} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-2.5 pb-2.5 pt-0 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {risk.mitigations.map((m) => {
                  const isActive = m.technique === technique;
                  const isRec = m.technique === risk.recommendedTechnique;
                  return (
                    <button
                      key={m.technique}
                      type="button"
                      onClick={() => setTechnique(m.technique)}
                      aria-pressed={isActive}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-muted text-foreground border-border hover:bg-muted/70"
                      }`}
                    >
                      {TECHNIQUE_LABEL[m.technique]}
                      {isRec && (
                        <span
                          className={`inline-flex items-center gap-0.5 ${isActive ? "text-blue-100" : "text-emerald-600 dark:text-emerald-300"}`}
                          title="Recommended"
                        >
                          <ShieldCheck className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <motion.div
                key={technique}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-muted/60 border border-border p-2.5"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {TECHNIQUE_LABEL[active.technique]}
                    {active.technique === risk.recommendedTechnique && (
                      <span className="ml-1.5 text-emerald-600 dark:text-emerald-300">· recommended</span>
                    )}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    residual
                    <SeverityBadge severity={active.residualSeverity} />
                  </span>
                </div>
                <p className="text-[11px] text-foreground leading-relaxed">{active.strategy}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{TECHNIQUE_BLURB[active.technique]}</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
