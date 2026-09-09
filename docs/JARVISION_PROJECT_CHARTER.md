# JARVISION — Project Charter

**Product:** JARVISION (VISION Studio — Emerging Tech Adoption Simulator)
**Built on:** Jarvis AI Dashboard
**Owner / Author:** Carissa Almira Yudiva — PMI Tech R&D (Agentverse, Group 1)
**Status:** Prototype (pre-G0 → G3 lifecycle, human-gated)
**Date:** 2026-09-02
**Companion docs:** VISION Studio FRD v1.2, ITPM Fundamentals Knowledge

---

## 1. Purpose

JARVISION is an organizational capability that helps PMI become an **early yet responsible adopter** of emerging technologies. Where Jarvis helps *individuals* work with AI, JARVISION helps the *organization* decide **whether and how** to adopt an emerging technology — systematically identifying, evaluating, and simulating adoption *before* significant investment or organizational commitment.

It is deliberately **not** about predicting or building future technology. It channels curiosity into a structured, responsible evaluation path that lands inside PMI's existing DISD stage-gate governance.

Guiding principle: *curiosity that takes the right action.* JARVISION prepares, simulates, and tracks; **humans decide every gate.**

---

## 2. Problem

Emerging technology moves faster than PMI's ability to evaluate it responsibly. Today the front-end of tech adoption is slow, inconsistent, and risky:

- **Unstructured exploration.** Interest in a new technology (e.g. Agentic AI, a frontier model) rarely turns into a disciplined evaluation. Teams either over-invest on hype or ignore an opportunity until it's late.
- **Single-use-case anchoring.** Evaluations fixate on one obvious application and miss where the technology could actually create the most value across functions.
- **Blind spots on impact.** Enterprise governance, security/domain, and people-readiness implications surface late — often after money is committed.
- **Slow, manual G0 prep.** Assembling the inputs a PM needs to open a Gate 0 submission (benefit hypothesis, experiment definition, indicative financials, risk, tech approach, security, privacy) is repetitive, manual work.
- **Weak traceability.** There's no clean line from "an idea we explored" to "the action items each function now owns," and no evidence trail from exploration to a G3 business case.
- **Governance drift.** Ad-hoc evaluations don't map to PMI's DISD / ITPF stage gates, so promising ideas still stall at the formal gates.

The cost is real: missed early-adopter advantage, wasted spend on poorly-scoped bets, and responsible-adoption risk when technology is deployed without the right guardrails.

---

## 3. Solution

JARVISION is an **AI-orchestrated adoption simulator** layered on the Jarvis Dashboard. A user pastes an article or picks a seeded technology, and JARVISION orchestrates specialized agents to walk that technology through PMI's lifecycle — **from pre-G0 exploration all the way to a G3 business case** — producing decision-ready artifacts at each step while keeping a human firmly in control of every gate.

The arc it supports (all gates human-decided):

| Stage | What JARVISION does | Who decides |
| --- | --- | --- |
| **Pre-G0** | Simulate adoption paths, recommend a candidate, draft the G0 Readiness Pack | Innovation Lead recommends |
| **G0 — Opportunity Definition** | Present a go/no-go decision brief, then stop | DISD / AI Steering Committee |
| **Post-G0 → PoC** | Record seed-funding release (up to ~$100K OPEX), promote idea to a tracked PoC | DISD releases seed; Portfolio Manager confirms in ePPM |
| **PoC execution (opt. G1/G2)** | Track PoC vs. success criteria; simulate Experience Design / Market Alignment checkpoints | PM manages non-mandatory gates |
| **G3 — Business Case Approval** | Assemble the G3 pack (Advanced Financials, SteerCo agreement, DISD G3 Decision Sheet), present go/no-go | DISD |

It stops at *"business case ready + human G3 decision."* Everything from G4 (execution, go-live, closure) onward stays out of scope and owned by delivery/DISD.

**What makes it work:**

- **Human-in-the-loop by design.** JARVISION never approves, funds, or allocates budget. Every gate (G0, G3) is an explicit, auditable human decision, consistent with Jarvis's approval-gating principle.
- **Grounded in PMI governance.** Outputs map directly to DISD stage gates and ITPF document requirements (G0 Submission inputs, Project Stakeholder Agreement, DISD G3 Decision Sheet, ePPM records).
- **Agent orchestration.** JARVISION coordinates specialized agents to produce each step, with a visible "thinking" narration and an Agent Network view showing which agents explored a given technology.
- **Cascade into the org.** An approved recommendation turns into role-scoped action items that land in the right persona's Jarvis task list, with full traceability back to the source simulation.

---

## 4. Big Features

1. **Entry from Jarvis & Studio shell** — one click from personal AI assistance into the organizational adoption studio, preserving the session and switching into a distinct branded shell.

2. **VISION Studio Home** — a workspace of *current ideas* (resume/review prior explorations) plus a *library of seeded emerging technologies*, each launchable as a pre-scripted journey.

3. **New Simulation via Chatbot** — paste an article, link, or short description; JARVISION recognizes seeded technologies and launches the matching journey, converses to refine scope/target function, and falls back gracefully on un-seeded input.

4. **Adoption Path** — an interactive tree: **Technology → candidate Functions → Use Cases → Evaluation.** Each use case expands to opportunities, an explorable risk register with mitigation techniques, a similarity/reuse (duplicate) check against existing PMI projects, an adjustable cost-benefit scenario explorer, an indicative timeline, and project clashes. Users position the tech into a function and pick a recommended candidate to carry forward.

5. **Multi-Layer Impact Simulation** — models the ripple across three lenses — **Enterprise** (governance, cost, and whether the tech drives org restructuring), **Domain** (security implications and solution options), and **Individual** (skills and mindset shift) — with a side-by-side compare view for a holistic readiness picture.

6. **Human Readiness** — the certifications, skills, and trainings needed, mapped to affected roles, plus a "recommended change drivers" finder that surfaces people and teams who already have the experience to lead the change.

7. **Approve & Cascade to Jarvis** — endorse a recommendation as a G0 candidate and cascade role-scoped action items (PM, Solution Architect, Security/1LoD, Data Privacy, Finance, L&D, Portfolio Manager) into Jarvis task lists, each carrying context and traceable back to its source journey.

8. **Pre-G0 Readiness Pack** — auto-drafts the G0-required inputs aligned to PMI's DISD template (Benefit/Value Hypothesis, Experiment Definition, Objectives & Deliverables, Indicative Financials, Timeline, Risk Assessment, Technology & Architecture, Initial Cybersecurity Assessment, Data Privacy) — every item labeled "draft — requires review."

9. **G0 Decision Gate (human Go/No-Go)** — a hard checkpoint: JARVISION presents a decision brief and holds the candidate at *"Awaiting G0 decision"* until a human records an explicit Go / No-go / Rework with rationale, logged to an auditable Decision Log. No-go/Rework returns the candidate to simulation with reviewer notes.

10. **Seed-Funding Release & PoC Kickoff** — after a human Go, records the indicative seed-funding release (up to ~$100K OPEX), promotes the idea to a tracked PoC, and auto-populates a PoC charter from the Readiness Pack — funding always labeled "indicative / simulated."

11. **PoC Execution Tracking (G0 → G3)** — tracks the PoC against G0 success criteria/KPIs, advances through optional G1 (Experience Design) and G2 (Market Alignment) checkpoints, captures interim G3 inputs, shows a G3-readiness meter, and records the PoC outcome (proven / partial / rejected).

12. **G3 Business Case Assembly & Decision Gate** — assembles the G3 pack (Outcome, Advanced Financials with NPV/Payback, Benefits, refined Technology/Architecture, plus the mandatory Project Stakeholder Agreement and DISD G3 Decision Sheet) and presents a second human Go / No-go / Pivot gate. On Go, the journey is marked complete and handed to delivery.

13. **Agent Network view** — a session log of which specialized agents were orchestrated to explore a given technology, plus the underlying network, making JARVISION's reasoning transparent.

14. **Jarvis Trend Nudges** — proactive "there's a new technology — want to simulate its adoption?" notifications inside Jarvis, turning passive awareness into a structured evaluation.

---

## 5. Scope Boundaries

**In scope:** everything from pre-G0 exploration through a human G3 decision — simulation, recommendation, readiness packs, cascades, PoC tracking, and business-case assembly.

**Out of scope:** making the actual gate decisions (humans/DISD decide), real movement of money, execution and everything G4 onward, live web-scraping of tech news, a real financial forecasting engine, multi-user real-time collaboration, and production auth/security (inherits Jarvis prototype limitations).

---

## 6. Users & Decision Bodies

**Primary user:** Innovation Lead / Explorer (runs simulations, recommends candidates).

**Cascade recipients (org-level roles):** Portfolio Manager, Project Manager, Solution Architect, Enterprise/Governance Architect, Security/1LoD, Data Privacy Manager, Finance/IT Finance, People & Culture / L&D.

**Decision-makers (the gates):** Functional/Regional DISD or the AI Steering Committee at G0; DISD at G3. The Portfolio Manager confirms mandatory gates in ePPM.

---

## 7. Guardrails & Success Signals

**Guardrails**
- No gate is ever auto-approved — a recorded human decision with rationale is mandatory.
- All financial figures are indicative/simulated and clearly labeled; no real commitment is made.
- Every drafted artifact is labeled "draft — requires review."
- Full traceability from cascaded action item back to the source simulation.

**Success signals**
- Faster, more consistent G0 prep (draft pack assembled as a by-product of exploration).
- Broader, less-anchored evaluation (multiple candidate functions considered per technology).
- Earlier surfacing of enterprise, domain, and people-readiness implications.
- A clean, auditable line from curiosity → recommendation → human G0 → tracked PoC → G3 business case.

---

*JARVISION prepares, simulates, and tracks. Humans decide.*
