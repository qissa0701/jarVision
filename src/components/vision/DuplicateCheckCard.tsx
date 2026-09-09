// DuplicateCheckCard — pre-G0 duplicate / reuse check for a candidate use case.
//
// Shows how similar the candidate is to existing projects, which components
// overlap (potential duplication to avoid), and which components could be
// reused instead of rebuilt. Helps humans avoid funding a near-duplicate.

import { useMemo } from "react";
import { Copy, GitFork, PackageCheck } from "lucide-react";
import type { UseCase } from "@/types/vision";
import { deriveDuplicateCheck } from "@/data/visionAnalysis";

function similarityTone(score: number): string {
  if (score >= 65) return "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10";
  if (score >= 45) return "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10";
  return "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10";
}

export function DuplicateCheckCard({ useCase, compact }: { useCase: UseCase; compact?: boolean }) {
  const dup = useMemo(() => deriveDuplicateCheck(useCase), [useCase]);
  const verdict =
    dup.topSimilarity >= 65
      ? "High overlap — confirm this isn't a duplicate before G0."
      : dup.topSimilarity >= 45
        ? "Moderate overlap — reuse where possible, position as an extension."
        : dup.topSimilarity > 0
          ? "Low overlap — mostly net-new, some reusable building blocks."
          : "No similar project found — net-new capability.";

  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/40 p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Duplicate &amp; reuse check
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${similarityTone(dup.topSimilarity)}`}>
          {dup.topSimilarity}% max similarity
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">{verdict}</p>

      {dup.projects.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Similar existing projects
          </p>
          <ul className="space-y-1">
            {dup.projects.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between gap-2 rounded-lg bg-card border border-border px-2 py-1.5"
              >
                <span className="text-[11px] font-medium text-foreground truncate">{p.name}</span>
                <span className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">{p.status}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${similarityTone(p.similarity)}`}>
                    {p.similarity}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="rounded-lg bg-card border border-border p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <GitFork className="w-3 h-3 text-amber-500" />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Overlapping
              </p>
            </div>
            <ul className="space-y-0.5">
              {dup.overlappingComponents.map((c) => (
                <li key={c} className="text-[10px] text-foreground leading-tight">
                  · {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-card border border-border p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <PackageCheck className="w-3 h-3 text-emerald-500" />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Reusable
              </p>
            </div>
            <ul className="space-y-0.5">
              {dup.reusableComponents.map((c) => (
                <li key={c} className="text-[10px] text-foreground leading-tight">
                  · {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
