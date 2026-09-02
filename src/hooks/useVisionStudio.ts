// useVisionStudio — owns all VISION Studio runtime state.
//
// Manages the user's started/saved ideas, the cascaded action items, the
// auditable gate Decision Log, and dismissed trend nudges — all persisted to
// localStorage so explorations survive reloads (FR-2.1). Every lifecycle
// transition is an explicit action here; the UI never mutates state directly.
//
// Human-in-the-loop is enforced structurally: nothing advances past a gate
// without a recorded human decision. `recordGateDecision` is the only path that
// moves an idea from "awaiting_g0"/"awaiting_g3", and seed funding can only be
// released once a G0 "Go" exists.

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CascadeItem,
  Gate,
  GateDecision,
  GateDecisionKind,
  PoCOutcome,
  PoCStage,
  VisionIdea,
} from "@/types/vision";
import { getJourney } from "@/data/visionJourneys";
import { STORAGE_KEYS } from "@/constants/layout";

/** The subset of Storage this hook needs. */
export type VisionStorage = Pick<Storage, "getItem" | "setItem">;

interface VisionState {
  ideas: Record<string, VisionIdea>;
  cascade: Record<string, CascadeItem>;
  decisions: Record<string, GateDecision>;
  dismissedTrends: string[];
}

function emptyState(): VisionState {
  return { ideas: {}, cascade: {}, decisions: {}, dismissedTrends: [] };
}

function loadState(storage: Pick<Storage, "getItem">): VisionState {
  try {
    const raw = storage.getItem(STORAGE_KEYS.vision);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<VisionState>;
    // Migrate older persisted ideas that predate multi-select candidates.
    const ideas: Record<string, VisionIdea> = {};
    for (const [id, idea] of Object.entries(parsed.ideas ?? {})) {
      ideas[id] = {
        ...idea,
        selectedUseCaseIds:
          idea.selectedUseCaseIds && idea.selectedUseCaseIds.length > 0
            ? idea.selectedUseCaseIds
            : idea.selectedUseCaseId
              ? [idea.selectedUseCaseId]
              : [],
      };
    }
    return {
      ideas,
      cascade: parsed.cascade ?? {},
      decisions: parsed.decisions ?? {},
      dismissedTrends: parsed.dismissedTrends ?? [],
    };
  } catch {
    console.warn("Failed to load VISION Studio state; starting empty.");
    return emptyState();
  }
}

let idCounter = 0;
/** Monotonic-ish unique id (time + counter) — sufficient for a single-user prototype. */
function uid(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export interface VisionStudio {
  ideas: VisionIdea[];
  cascadeItems: CascadeItem[];
  decisions: GateDecision[];
  dismissedTrends: string[];
  getIdea: (ideaId: string) => VisionIdea | undefined;
  cascadeForIdea: (ideaId: string) => CascadeItem[];
  decisionForIdeaGate: (ideaId: string, gate: Gate) => GateDecision | undefined;
  /** Start (or reopen) an idea from a seed journey. Returns the idea id. */
  startJourney: (journeyId: string) => string | null;
  /** Position the tech into a chosen function (FR-4.4). */
  positionFunction: (ideaId: string, fn: string) => void;
  /** Carry a single recommended use case forward, replacing any selection (FR-4.5). */
  selectUseCase: (ideaId: string, useCaseId: string) => void;
  /** Toggle a candidate use case in the multi-select checkout (FR-4). */
  toggleUseCase: (ideaId: string, useCaseId: string) => void;
  /** Promote a selected candidate to the "top" one carried forward. */
  setPrimaryUseCase: (ideaId: string, useCaseId: string) => void;
  /** Approve the recommendation and cascade role-scoped action items (FR-7). */
  approveAndCascade: (ideaId: string) => void;
  /** Generate the G0 Readiness Pack and submit for the G0 decision (FR-8/9). */
  submitForG0: (ideaId: string) => void;
  /** Generate the G3 Business Case and submit for the G3 decision (FR-12). */
  submitForG3: (ideaId: string) => void;
  /** Record an explicit human gate decision — the only way past a gate (FR-9.3/12.3). */
  recordGateDecision: (
    ideaId: string,
    gate: Gate,
    decision: GateDecisionKind,
    decisionMaker: string,
    rationale: string,
  ) => void;
  /** Advance the PoC through an optional PM-managed checkpoint (FR-11.2). */
  advancePoCStage: (ideaId: string, stage: PoCStage) => void;
  /** Record the PoC evidence outcome (FR-11.5). */
  recordPoCOutcome: (ideaId: string, outcome: PoCOutcome) => void;
  /** Dismiss/snooze a trend nudge (FR-13.3). */
  dismissTrend: (trendId: string) => void;
  /** Delete an idea and its cascade items + decisions. */
  deleteIdea: (ideaId: string) => void;
}

export function useVisionStudio(
  storage: VisionStorage = window.localStorage,
): VisionStudio {
  const [state, setState] = useState<VisionState>(() => loadState(storage));

  useEffect(() => {
    try {
      storage.setItem(STORAGE_KEYS.vision, JSON.stringify(state));
    } catch {
      console.warn("Failed to persist VISION Studio state.");
    }
  }, [storage, state]);

  const startJourney = useCallback((journeyId: string): string | null => {
    const journey = getJourney(journeyId);
    if (!journey) return null;

    // Reopen an existing idea for this journey if one exists (FR-2.4).
    const existing = Object.values(state.ideas).find((i) => i.journeyId === journeyId);
    if (existing) return existing.id;

    const id = uid("idea");
    const now = Date.now();
    const idea: VisionIdea = {
      id,
      journeyId,
      techName: journey.techName,
      stage: "exploring",
      positionedFunction: null,
      selectedUseCaseId: null,
      selectedUseCaseIds: [],
      cascadeItemIds: [],
      g0PackGenerated: false,
      g0DecisionId: null,
      seedFunding: null,
      pocStage: "G0",
      completedG1: false,
      completedG2: false,
      pocOutcome: null,
      g3PackGenerated: false,
      g3DecisionId: null,
      createdAt: now,
      updatedAt: now,
    };
    setState((prev) => ({ ...prev, ideas: { ...prev.ideas, [id]: idea } }));
    return id;
  }, [state.ideas]);

  /** Patch an idea and bump updatedAt. */
  const patchIdea = useCallback(
    (ideaId: string, patch: Partial<VisionIdea>) => {
      setState((prev) => {
        const idea = prev.ideas[ideaId];
        if (!idea) return prev;
        return {
          ...prev,
          ideas: {
            ...prev.ideas,
            [ideaId]: { ...idea, ...patch, updatedAt: Date.now() },
          },
        };
      });
    },
    [],
  );

  const positionFunction = useCallback(
    (ideaId: string, fn: string) => patchIdea(ideaId, { positionedFunction: fn }),
    [patchIdea],
  );

  const selectUseCase = useCallback(
    (ideaId: string, useCaseId: string) =>
      patchIdea(ideaId, { selectedUseCaseId: useCaseId, selectedUseCaseIds: [useCaseId] }),
    [patchIdea],
  );

  const toggleUseCase = useCallback(
    (ideaId: string, useCaseId: string) => {
      setState((prev) => {
        const idea = prev.ideas[ideaId];
        if (!idea) return prev;
        const current = idea.selectedUseCaseIds ?? [];
        const next = current.includes(useCaseId)
          ? current.filter((id) => id !== useCaseId)
          : [...current, useCaseId];
        return {
          ...prev,
          ideas: {
            ...prev.ideas,
            [ideaId]: {
              ...idea,
              selectedUseCaseIds: next,
              selectedUseCaseId: next[0] ?? null,
              updatedAt: Date.now(),
            },
          },
        };
      });
    },
    [],
  );

  const setPrimaryUseCase = useCallback(
    (ideaId: string, useCaseId: string) => {
      setState((prev) => {
        const idea = prev.ideas[ideaId];
        if (!idea) return prev;
        const current = idea.selectedUseCaseIds ?? [];
        if (!current.includes(useCaseId)) return prev;
        const next = [useCaseId, ...current.filter((id) => id !== useCaseId)];
        return {
          ...prev,
          ideas: {
            ...prev.ideas,
            [ideaId]: { ...idea, selectedUseCaseIds: next, selectedUseCaseId: useCaseId, updatedAt: Date.now() },
          },
        };
      });
    },
    [],
  );

  const approveAndCascade = useCallback((ideaId: string) => {
    setState((prev) => {
      const idea = prev.ideas[ideaId];
      if (!idea) return prev;
      const journey = getJourney(idea.journeyId);
      if (!journey) return prev;
      // Idempotent: don't double-cascade if already approved.
      if (idea.cascadeItemIds.length > 0) return prev;

      const now = Date.now();
      const cascade = { ...prev.cascade };
      const ids: string[] = [];
      journey.cascade.forEach((tpl) => {
        const cid = uid("cascade");
        cascade[cid] = {
          id: cid,
          ideaId,
          targetRole: tpl.targetRole,
          actionText: tpl.actionText,
          layerOrigin: tpl.layerOrigin,
          sourceJourneyId: journey.id,
          sourceUseCaseId: idea.selectedUseCaseId ?? journey.recommendedUseCaseId,
          createdAt: now,
        };
        ids.push(cid);
      });

      return {
        ...prev,
        cascade,
        ideas: {
          ...prev.ideas,
          [ideaId]: {
            ...idea,
            stage: "approved",
            selectedUseCaseId: idea.selectedUseCaseId ?? journey.recommendedUseCaseId,
            selectedUseCaseIds:
              idea.selectedUseCaseIds && idea.selectedUseCaseIds.length > 0
                ? idea.selectedUseCaseIds
                : [journey.recommendedUseCaseId],
            cascadeItemIds: ids,
            updatedAt: now,
          },
        },
      };
    });
  }, []);

  const submitForG0 = useCallback(
    (ideaId: string) => patchIdea(ideaId, { g0PackGenerated: true, stage: "awaiting_g0" }),
    [patchIdea],
  );

  const submitForG3 = useCallback(
    (ideaId: string) => patchIdea(ideaId, { g3PackGenerated: true, stage: "awaiting_g3" }),
    [patchIdea],
  );

  const recordGateDecision = useCallback(
    (
      ideaId: string,
      gate: Gate,
      decision: GateDecisionKind,
      decisionMaker: string,
      rationale: string,
    ) => {
      setState((prev) => {
        const idea = prev.ideas[ideaId];
        if (!idea) return prev;

        const decisionId = uid("decision");
        const now = Date.now();
        const log: GateDecision = {
          id: decisionId,
          ideaId,
          gate,
          decision,
          decisionMaker,
          rationale,
          timestamp: now,
        };

        // Compute the resulting idea state from the decision.
        // Note: the decision is always written to the Decision Log (below) for
        // auditability. For rework/pivot we deliberately leave the idea's
        // gate-decision pointer unset so the candidate can be re-submitted and
        // re-decided after another iteration.
        const patch: Partial<VisionIdea> = { updatedAt: now };
        if (gate === "G0") {
          if (decision === "go") {
            // Human "Go" unlocks seed funding + PoC tracking (FR-10).
            patch.g0DecisionId = decisionId;
            patch.stage = "poc";
            patch.pocStage = "G0";
            patch.seedFunding = {
              amountIndicative: getJourney(idea.journeyId)?.seedFundingIndicative ?? "≤ ~$100K OPEX",
              releasedAfterDecisionId: decisionId,
              releasedAt: now,
            };
          } else if (decision === "nogo") {
            patch.g0DecisionId = decisionId;
            patch.stage = "rejected";
          } else {
            // rework → back to exploration; pack must be re-assembled & re-submitted.
            patch.stage = "exploring";
            patch.g0PackGenerated = false;
          }
        } else {
          if (decision === "go") {
            patch.g3DecisionId = decisionId;
            patch.stage = "complete"; // handed to delivery; VISION stops at G3.
          } else if (decision === "nogo") {
            patch.g3DecisionId = decisionId;
            patch.stage = "rejected";
          } else {
            // pivot → back to PoC tracking to gather more evidence.
            patch.stage = "poc";
            patch.g3PackGenerated = false;
          }
        }

        return {
          ...prev,
          decisions: { ...prev.decisions, [decisionId]: log },
          ideas: { ...prev.ideas, [ideaId]: { ...idea, ...patch } },
        };
      });
    },
    [],
  );

  const advancePoCStage = useCallback(
    (ideaId: string, stage: PoCStage) => {
      setState((prev) => {
        const idea = prev.ideas[ideaId];
        if (!idea) return prev;
        const patch: Partial<VisionIdea> = { pocStage: stage, updatedAt: Date.now() };
        if (stage === "G1") patch.completedG1 = true;
        if (stage === "G2") { patch.completedG1 = true; patch.completedG2 = true; }
        return { ...prev, ideas: { ...prev.ideas, [ideaId]: { ...idea, ...patch } } };
      });
    },
    [],
  );

  const recordPoCOutcome = useCallback(
    (ideaId: string, outcome: PoCOutcome) => patchIdea(ideaId, { pocOutcome: outcome }),
    [patchIdea],
  );

  const dismissTrend = useCallback((trendId: string) => {
    setState((prev) =>
      prev.dismissedTrends.includes(trendId)
        ? prev
        : { ...prev, dismissedTrends: [...prev.dismissedTrends, trendId] },
    );
  }, []);

  const deleteIdea = useCallback((ideaId: string) => {
    setState((prev) => {
      const ideas = { ...prev.ideas };
      delete ideas[ideaId];
      const cascade = Object.fromEntries(
        Object.entries(prev.cascade).filter(([, c]) => c.ideaId !== ideaId),
      );
      const decisions = Object.fromEntries(
        Object.entries(prev.decisions).filter(([, d]) => d.ideaId !== ideaId),
      );
      return { ...prev, ideas, cascade, decisions };
    });
  }, []);

  const ideas = useMemo(
    () => Object.values(state.ideas).sort((a, b) => b.updatedAt - a.updatedAt),
    [state.ideas],
  );
  const cascadeItems = useMemo(() => Object.values(state.cascade), [state.cascade]);
  const decisions = useMemo(
    () => Object.values(state.decisions).sort((a, b) => b.timestamp - a.timestamp),
    [state.decisions],
  );

  const getIdea = useCallback((ideaId: string) => state.ideas[ideaId], [state.ideas]);
  const cascadeForIdea = useCallback(
    (ideaId: string) => cascadeItems.filter((c) => c.ideaId === ideaId),
    [cascadeItems],
  );
  const decisionForIdeaGate = useCallback(
    (ideaId: string, gate: Gate) =>
      decisions.find((d) => d.ideaId === ideaId && d.gate === gate),
    [decisions],
  );

  return {
    ideas,
    cascadeItems,
    decisions,
    dismissedTrends: state.dismissedTrends,
    getIdea,
    cascadeForIdea,
    decisionForIdeaGate,
    startJourney,
    positionFunction,
    selectUseCase,
    toggleUseCase,
    setPrimaryUseCase,
    approveAndCascade,
    submitForG0,
    submitForG3,
    recordGateDecision,
    advancePoCStage,
    recordPoCOutcome,
    dismissTrend,
    deleteIdea,
  };
}

/** Compute a G3-readiness percentage from a PoC's progress (FR-11.4). */
export function computeG3Readiness(idea: {
  cascadeItemIds: string[];
  completedG1: boolean;
  completedG2: boolean;
  pocOutcome: PoCOutcome | null;
  g3PackGenerated: boolean;
}): number {
  let done = 0;
  const total = 5;
  if (idea.cascadeItemIds.length > 0) done += 1; // interim inputs captured via cascade
  if (idea.completedG1) done += 1;
  if (idea.completedG2) done += 1;
  if (idea.pocOutcome) done += 1;
  if (idea.g3PackGenerated) done += 1;
  return Math.round((done / total) * 100);
}
