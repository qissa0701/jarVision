// AgentNetworkPanel — the per-exploration "agent network" view, shown inside a
// journey workspace (the exploring page for one emerging tech).
//
// It reads as a SESSION LOG: as the user explores a technology step by step,
// JARVISION calls specialized agents through NEXUS. This panel records which
// agents have been engaged so far for *this* tech, in the order the steps were
// explored, and shows the agent network with the engaged agents highlighted.

import type { ReactNode } from "react";
import { Bot, Boxes, CheckCircle2, Database, Network, Workflow } from "lucide-react";
import type { Journey } from "@/types/vision";
import {
  AGENT_REGISTRY,
  CORE_AGENTS,
  NEXUS,
  SECTION_AGENT_IDS,
  SECTION_LABELS,
  agentLabel,
  agentsForSections,
  orchestrationFor,
  type JourneySection,
  type RegistryAgent,
} from "@/data/agentNetwork";
import { VisionSection } from "./visionUi";

export interface AgentNetworkPanelProps {
  journey: Journey;
  /** Steps explored this session, in the order they were first opened. */
  visited: JourneySection[];
}

export function AgentNetworkPanel({ journey, visited }: AgentNetworkPanelProps) {
  const engaged = agentsForSections(visited);
  const usedIds = new Set(engaged.map((a) => a.id));
  // Only steps that actually call an agent belong in the "agents used" log.
  const loggedSections = visited.filter((s) => (SECTION_AGENT_IDS[s] ?? []).length > 0);
  // Registry list: engaged agents first, then the rest (registry order).
  const registryOrdered = [...engaged, ...AGENT_REGISTRY.filter((a) => !usedIds.has(a.id))];

  return (
    <div className="space-y-4">
      <VisionSection
        title={`Agent network · ${journey.techName}`}
        description="JARVISION orchestrates an ecosystem of specialized agents."
        icon={<Network className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
      >
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          {NEXUS.blurb} As you explore {journey.techName}, JARVISION calls the specialized agents below
          through NEXUS and aggregates their responses into each step.
        </p>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-foreground">
            {engaged.length} agent{engaged.length === 1 ? "" : "s"} engaged this session:
          </span>
          {engaged.length === 0 ? (
            <span className="text-[11px] text-muted-foreground">none yet — explore a step to begin.</span>
          ) : (
            engaged.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
              >
                <Bot className="w-3 h-3" />
                {agentLabel(a)}
              </span>
            ))
          )}
        </div>
      </VisionSection>

      {/* Session log */}
      <VisionSection
        title="Session log"
        description={`Agents used to explore ${journey.techName}, in the order you explored each step.`}
        icon={<Workflow className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
      >
        {loggedSections.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No agents called yet. Open a step (Adoption Path, Human Readiness, …) and JARVISION will
            orchestrate the relevant agents — each call is recorded here.
          </p>
        ) : (
          <ol className="space-y-3">
            {loggedSections.map((s) => (
              <li key={s} className="rounded-xl border border-border bg-muted/40 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Network className="w-3.5 h-3.5 text-blue-500 dark:text-blue-300" />
                  <span className="text-xs font-semibold text-foreground">{SECTION_LABELS[s]}</span>
                </div>
                <ul className="space-y-1.5">
                  {orchestrationFor(s, journey).map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-foreground">{step.label}</span>
                          {step.agent && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300">
                              <Bot className="w-3 h-3" />
                              {step.agent}
                              <span className="font-normal text-muted-foreground">· via NEXUS</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </VisionSection>

      {/* Network diagram, engaged agents highlighted */}
      <VisionSection
        title="How the network is wired"
        description="Agent Registry → NEXUS → specialized agents → their data. Highlighted agents were engaged this session."
        icon={<Boxes className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
      >
        <NetworkDiagram usedIds={usedIds} />
      </VisionSection>

      {/* Registry, with engaged state */}
      <VisionSection
        title="Specialized agents in the registry"
        description="Each agent is grounded in its own data domain and reached through NEXUS."
        icon={<Bot className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
      >
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {registryOrdered.map((a) => (
            <AgentCard key={a.id} agent={a} used={usedIds.has(a.id)} />
          ))}
        </ul>
      </VisionSection>
    </div>
  );
}

function AgentCard({ agent, used }: { agent: RegistryAgent; used: boolean }) {
  return (
    <li
      className={`rounded-xl border p-3 ${
        used
          ? "border-blue-200 dark:border-blue-400/30 bg-blue-50/60 dark:bg-blue-500/10"
          : "border-border bg-muted/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-blue-600 dark:text-blue-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{agentLabel(agent)}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              <Database className="w-3 h-3" />
              {agent.dataSource}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{agent.description}</p>
          <div className="mt-2">
            {used ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-3 h-3" />
                Engaged this session
              </span>
            ) : (
              <span className="text-[10px] font-medium text-muted-foreground">Available in registry</span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/** A node in the wiring diagram. */
function DiagramNode({
  icon,
  label,
  sub,
  tone = "slate",
  dim,
}: {
  icon: ReactNode;
  label: string;
  sub?: string;
  tone?: "slate" | "blue" | "gradient";
  dim?: boolean;
}) {
  const tones: Record<string, string> = {
    slate: "border-border bg-card text-foreground",
    blue: "border-blue-200 dark:border-blue-400/30 bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-200",
    gradient: "border-transparent bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-sm",
  };
  return (
    <div
      className={`inline-flex flex-col items-center text-center rounded-xl border px-3 py-2 min-w-[7.5rem] transition-opacity ${tones[tone]} ${
        dim ? "opacity-40" : ""
      }`}
    >
      <span className="inline-flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </span>
      {sub && (
        <span
          className={`text-[10px] mt-0.5 leading-tight ${
            tone === "gradient" ? "text-white/80" : "text-muted-foreground"
          }`}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

function VLine({ tall }: { tall?: boolean }) {
  return <div className={`w-px bg-border ${tall ? "h-6" : "h-4"}`} aria-hidden="true" />;
}

function NetworkDiagram({ usedIds }: { usedIds: Set<string> }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 overflow-x-auto">
      <div className="flex flex-col items-center min-w-[20rem]">
        <DiagramNode icon={<Boxes className="w-3.5 h-3.5" />} label="Agent Registry" />
        <VLine />
        <DiagramNode
          icon={<Network className="w-3.5 h-3.5" />}
          label={NEXUS.name}
          sub={NEXUS.role}
          tone="blue"
        />
        <VLine />

        <div className="w-full max-w-2xl">
          <div className="flex justify-center">
            <div className="h-px bg-border w-2/3" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {CORE_AGENTS.map((a) => {
              const used = usedIds.has(a.id);
              return (
                <div key={a.id} className="flex flex-col items-center">
                  <VLine />
                  <DiagramNode
                    icon={<Bot className="w-3.5 h-3.5" />}
                    label={agentLabel(a)}
                    tone="blue"
                    dim={!used}
                  />
                  <VLine />
                  <DiagramNode icon={<Database className="w-3.5 h-3.5" />} label={a.dataSource} dim={!used} />
                </div>
              );
            })}
          </div>
        </div>

        <VLine tall />
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-semibold text-muted-foreground mb-1">orchestrates ↑</span>
          <DiagramNode
            icon={<Workflow className="w-3.5 h-3.5" />}
            label="JARVISION"
            sub="Orchestrates the ecosystem"
            tone="gradient"
          />
        </div>
      </div>
    </div>
  );
}
