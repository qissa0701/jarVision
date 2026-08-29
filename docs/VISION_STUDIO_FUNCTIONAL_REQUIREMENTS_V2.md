## Functional Requirements Document (FRD)

### VISION Studio — Emerging Tech Adoption Simulator

**Version:** 1.2 **Status:** Draft — pre-G0 → G3 lifecycle prototype (human-gated) **Date:** 2026-08-29
**Companion to:** Jarvis AI Dashboard FRD v1.0
**Author:** Yudiva, Carissa Almira (PMI Tech R&D — Agentverse, Group 1)

---

### 1. Purpose and Scope

This document describes the functional requirements of **VISION Studio**, an AI-powered **Emerging Tech Adoption Simulator** built on top of the existing Jarvis AI Dashboard. Where **Jarvis = AI adoption for humans** (helping individuals work with AI), **VISION Studio = tech adoption for the organization** (helping PMI decide *whether and how* to adopt an emerging technology).

The core premise, aligned with sponsor feedback from Frey Sigurjonsson and Szymon: this is **not** about predicting or building future technologies. It is about creating an **organizational capability** that helps PMI become an **early yet responsible adopter** of emerging technologies — systematically identifying, evaluating, and simulating adoption *before* significant investment or organizational commitment.

**Positioning in the PMI lifecycle:** VISION Studio now spans the journey **from pre-G0 exploration all the way to Gate 3 (G3) Business Case Approval** in PMI's Digital Investment & Strategy Deployment (DISD) lifecycle. It explores potential use cases, recommends a viable candidate, assembles the documents needed to enter **G0**, and — once a human has approved — continues to **track the funded PoC through to a G3 business case**. Critically, VISION Studio **never approves or funds anything itself**: every gate is a **human decision**. The DISD (or the AI Steering Committee for AI initiatives) makes the actual **G0 go/no-go and seed-funding release**, and the **G3 funding decision**. VISION prepares, simulates, and tracks; humans decide.

**Lifecycle arc VISION supports (all gates are human-decided):**

| Stage | What VISION does | Who decides |
| --- | --- | --- |
| **Pre-G0** (Opportunity exploration) | Simulate adoption paths, recommend a candidate, draft the G0 Readiness Pack | Innovation Lead recommends |
| **G0 — Opportunity Definition** | Present the go/no-go decision brief; **wait for human approval** | **DISD / AI Steering Committee** (Go/No-go for PoC) |
| **Post-G0 → PoC** | On human "Go", record seed-funding release (up to ~$100K OPEX) and kick off PoC tracking | DISD releases seed fund; Portfolio Manager confirms G0 in ePPM |
| **PoC execution** (optional G1/G2) | Track PoC against success criteria; simulate Experience Design (G1) & Market Alignment (G2) checkpoints | PM manages non-mandatory gates |
| **G3 — Business Case Approval** | Assemble the G3 Business Case / Readiness Pack (Advanced Financials, SteerCo agreement, DISD G3 Decision Sheet); present go/no-go | **DISD** (Go/No-go for Pilot + budget) |

It stops at *"business case ready + human G3 decision"* — execution, pilot, and everything ≥ G4 remain outside VISION.

> **Guiding design principle (not a feature):** Michael Voegele's point that the most important human trait in the AI era is **curiosity — but curiosity that takes the right action**. VISION Studio is designed to channel curiosity into a *structured, responsible* evaluation path rather than unfocused exploration. This is a design north-star woven through the UX, not a standalone product feature.

#### 1.1 In Scope
- Entry point from Jarvis ("Enter VISION Studio")
- VISION Studio home (current ideas + emerging tech library)
- New simulation via chatbot (paste an article / tech release)
- **Pre-scripted simulation journeys** driven by a fixed set of seed articles
- Adoption Path output (tech → functions → use cases → evaluation)
- Multi-layer impact simulation (Enterprise / Domain / Individual)
- Human readiness output (certifications, skills, trainings)
- Approve → cascade action items to org-level roles inside Jarvis
- **Pre-G0 Readiness Pack** generation (drafts of G0-required inputs)
- **G0 human decision gate** (go/no-go decision brief; nothing proceeds without explicit human approval)
- **Seed-funding release & PoC kickoff** tracking (up to ~$100K OPEX, simulated on human "Go")
- **PoC execution tracking** against success criteria (incl. optional G1 Experience Design / G2 Market Alignment checkpoints)
- **G3 Business Case / Readiness Pack** assembly (Advanced Financials, SteerCo agreement, DISD G3 Decision Sheet)
- **G3 human decision gate** (go/no-go for Pilot + budget)
- Jarvis notification integration (proactive "want to simulate this?" nudge)

#### 1.2 Out of Scope
- **Making the actual gate decisions** — VISION only presents the brief; the **human/DISD** (or AI Steering Committee) decides G0 and G3
- Actual movement of money (VISION records/simulates the seed-fund release; Finance/DISD executes it)
- Execution phase and everything from **G4 onward** (Build, Go-Live, Deployment, Closure)
- Live web-scraping of technology news (articles are seeded/pasted, not auto-crawled)
- Real financial forecasting engine (benefit/cost figures are illustrative at this stage)
- Multi-user real-time collaboration
- Production security / authentication (inherits Jarvis prototype limitations)

#### 1.3 Implementation status
Like Jarvis, this build is a **frontend prototype**. Simulation journeys are **pre-scripted** (canned) and triggered by a fixed library of **three seed articles** that Carissa curates (see Appendix A). There is no live LLM, no backend, and no persistence beyond localStorage. This document treats the pre-scripted behavior as the specified functional behavior and flags where a production system would need real services.

---

### 2. Definitions

<table>
<tr><th>Term</th><th>Definition</th></tr>
<tr><td>VISION Studio</td><td>The Emerging Tech Adoption Simulator module, entered from Jarvis</td></tr>
<tr><td>Journey</td><td>A pre-scripted, end-to-end simulation flow seeded by one emerging-tech article</td></tr>
<tr><td>Adoption Path</td><td>The output diagram: technology → candidate functions → use cases → evaluation</td></tr>
<tr><td>Impact Layer</td><td>One of three simulation lenses: Enterprise, Domain, or Individual</td></tr>
<tr><td>Readiness Pack</td><td>The bundle of pre-G0 draft documents VISION assembles for a chosen use case</td></tr>
<tr><td>Cascade</td><td>The act of pushing simulation-derived action items to org roles inside Jarvis</td></tr>
<tr><td>Example Market</td><td>An illustrative PMI business context a technology is positioned against (e.g., SRC)</td></tr>
<tr><td>G0 (Gate 0)</td><td>PMI's first DISD decision gate — Opportunity Definition; authorizes seed funding (up to ~$100K OPEX) for a PoC/MVP, not execution</td></tr>
</table>

**Example Market — SRC:** *Sampoerna Retail Community (SRC)* is PMI/Sampoerna's Indonesian ecosystem of **250,000+ digitized traditional grocery stores (toko kelontong)** across 38 provinces, contributing ~IDR 263 trillion/year to the economy. In VISION Studio, SRC is used as **one of several** illustrative markets/functions a technology can be positioned against — not the only one.

---

### 3. User Roles

VISION Studio extends Jarvis's persona model. Because VISION is about **organizational** adoption (not individual productivity), it introduces **new org-level roles** used primarily by the **Approve → Cascade** flow. These roles should also be reflected in Jarvis's Role Switcher so cascaded action items land in the right persona's task list.

**New / extended org-level roles:**
- **Innovation Lead / Explorer** — runs simulations, reviews adoption paths, recommends candidates (primary VISION user)
- **Portfolio Manager** — receives G0-candidate recommendations; the eventual G0 decision-maker
- **Project Manager (PM)** — receives cascaded planning & G0-prep action items
- **Solution Architect** — receives architecture-assessment & technology-approach action items
- **Enterprise / Governance Architect** — receives fit-with-IT-strategy & capability-overlap checks
- **Security / 1LoD** — receives initial cybersecurity assessment action items
- **Data Privacy Manager** — receives high-level DPIA action items
- **Finance / IT Finance** — receives indicative cost & benefit-hypothesis action items
- **People & Culture / L&D** — receives human-readiness (skills, training, certification) action items

> **Design note (implemented):** The five Jarvis personas have been **re-mapped/renamed** to org-level roles so cascade targets are consistent across both products, while keeping the login/auth model (no role switcher). Because VISION names more org roles than there are Jarvis accounts, related roles are consolidated into the five accounts:
>
> | Jarvis account | Presents as | Also receives cascades for |
> | --- | --- | --- |
> | `leadership` | **Innovation Lead** | Finance / IT Finance |
> | `portfolio` | **Portfolio Manager** | Project Manager (PM) |
> | `engineer` | **Solution Architect** | Enterprise / Governance Architect |
> | `infrastructure` | **Security / 1LoD** | Data Privacy Manager |
> | `people` | **People & Culture / L&D** | — |
>
> The mapping lives in `src/constants/visionRoleMap.ts`; on approval each cascaded action item lands in its owning account's Jarvis task list (surfaced under a "From VISION Studio" group in the Tasks widget).

---

### 4. Functional Requirements

Each requirement is written as a user story — *"As a &lt;role&gt;, I can … so that …"* — with capability tables (**User can… / System can…**) per page.

#### FR-1: Entry from Jarvis

- **FR-1.1** — As a Jarvis user, I can see an **"Enter VISION Studio"** action (button in the top bar / sidebar), so that I can move from personal AI assistance into organizational tech-adoption simulation.
- **FR-1.2** — As a user, when I enter VISION Studio, I want the app to switch into a distinct "Studio" shell (its own header/branding) while preserving my session, so that I understand I've changed modes without logging in again.
- **FR-1.3** — As a user, I can return to the Jarvis Dashboard from VISION Studio at any time, so that I can move fluidly between the two capabilities.

| User can… | System can… |
|---|---|
| Click "Enter VISION Studio" from Jarvis | Render a distinct Studio shell/route while keeping the session |
| Return to Jarvis Dashboard | Preserve any in-progress simulation state on switch |
| See a one-line explainer of VISION's purpose on first entry | Show a first-run intro reflecting the "curiosity that acts" principle |

*(Alternative button labels if preferred: "Open VISION", "Launch Simulation Studio", "Explore in VISION".)*

#### FR-2: VISION Studio Home

- **FR-2.1** — As a user, I can see a **list of current ideas** (simulations already started or saved), showing tech name, target function/market, status, and last-updated, so that I can resume or review prior explorations.
- **FR-2.2** — As a user, I can see a **library of emerging technologies** (the seed articles), each as a card, so that I can pick a pre-scripted journey to run.
- **FR-2.3** — As a user, I can start a **new simulation** from the home page (either from a library card or via the chatbot), so that I can begin evaluating a technology quickly.
- **FR-2.4** — As a user, I can open any current idea to jump straight to its Adoption Path output, so that I don't have to re-run a simulation I've already explored.

| User can… | System can… |
|---|---|
| Browse "Current Ideas" and "Emerging Tech" lists | Render both lists from the seeded/mock dataset |
| Select an emerging-tech card to launch its journey | Load the correct pre-scripted journey for that article |
| Start a new simulation | Route to the chatbot input (FR-3) |
| Reopen a saved idea | Restore its saved Adoption Path + impact views |

**Seed emerging-tech library (pre-scripted journeys — one per article). The demo ships with exactly these three seeded articles; full journey scripts are in Appendix A:**

1. **Agentic AI** — *"What is Agentic AI?"* (IBM) — `https://www.ibm.com/think/topics/agentic-ai` — autonomous, goal-driven AI agents that plan and act with limited supervision, coordinated via orchestration.
2. **Physical AI** — *"What is Physical AI?"* (IBM) — `https://www.ibm.com/think/topics/physical-ai` — AI combined with sensors/actuators to perceive and act in the physical world (robotics, smart factories, fleets), trained heavily via simulation and digital twins.
3. **Wicked Intelligence** — *"Wicked Intelligence Will Decide Who Wins the AGI Race"* (Dave Aron / Gartner, LinkedIn) — `https://www.linkedin.com/posts/davearon_unthink-unask-unlearn-share-7366203509345554432-QwPr/` — using AI on **wicked (very hard) problems humans have struggled with**, rather than replicating what humans already do well (#unthink #unask #unlearn).

#### FR-3: New Simulation — Chatbot Input

- **FR-3.1** — As a user, I can open a **chatbot interface** and paste an article, link, or short description of an emerging technology, so that I can ask VISION to simulate its adoption.
- **FR-3.2** — As a user, when I submit a seeded article, I want the agent to recognize it and launch the matching **pre-scripted journey**, so that I get a consistent, high-quality walkthrough.
- **FR-3.3** — As a user, I can converse with the agent (ask follow-ups, refine the scope, request a specific function/market focus), so that the simulation reflects my intent.
- **FR-3.4** — As a user, when I paste an **un-seeded** article, I want the agent to gracefully explain that a scripted journey isn't available yet and offer the closest seeded example, so that I'm never left with a broken flow. *(Prototype limitation.)*

| User can… | System can… |
|---|---|
| Paste an article / link / description | Match input against the seed library and launch a journey |
| Ask follow-up questions | Return scripted, context-appropriate responses |
| Choose a target function/market to focus on | Bias the Adoption Path toward the chosen context |
| Submit an un-seeded article | Fall back gracefully and suggest the nearest seeded journey |

#### FR-4: Simulation Output — Adoption Path

- **FR-4.1** — As a user, I can view an **Adoption Path diagram** that flows: **Technology → candidate Functions → Use Cases / Ideas → Evaluation**, so that I can see, at a glance, where a technology could land in PMI and why.
- **FR-4.2** — As a user, I can see **multiple candidate functions** a technology could serve (e.g., Manufacturing, Commercial, SRC retail network, Supply Chain, HR), so that I don't anchor on a single obvious use.
- **FR-4.3** — As a user, I can expand any use case to see its **evaluation**: opportunities/risks, a benefit–cost simulation, an indicative timeline, and **potential clashes with existing projects**, so that I can judge which idea is worth pursuing.
- **FR-4.4** — As a user, I can decide **where a technology is positioned** (which function it best fits), so that the recommendation is deliberate, not automatic.
- **FR-4.5** — As a user, I can select a **recommended use case** to carry forward into the multi-layer impact view and the Readiness Pack, so that I can move from exploration to a concrete candidate.

| User can… | System can… |
|---|---|
| View the tech → functions → use cases → evaluation diagram | Render the pre-scripted Adoption Path for the journey |
| Expand a use case for opportunities/risks, benefit–cost, timeline, project clashes | Surface scripted evaluation data per use case |
| Position the tech into a chosen function | Highlight the selected branch of the path |
| Pick a recommended use case to carry forward | Pass the selection to FR-5 and FR-7 |

*(See Appendix A for the full pre-scripted Adoption Path of each of the three journeys.)*

#### FR-5: Multi-Layer Impact Simulation

- **FR-5.1** — As a user, I can simulate a technology's impact across **three layers — Enterprise, Domain, and Individual** — so that I understand its effect beyond just the use case itself.
- **FR-5.2 (Enterprise layer)** — As a user, I can see **governance and cost** implications, including whether the technology could drive **organizational restructuring** (does it change the org structure or not), so that leadership understands the strategic footprint.
- **FR-5.3 (Domain layer)** — As a user, I can see **security implications and possible solution options** for the domain the tech touches, so that architecture and security concerns surface early.
- **FR-5.4 (Individual layer)** — As a user, I can see the **skills and training** impact on individuals, so that I understand what people need to be ready (links to FR-6).
- **FR-5.5** — As a user, I can compare the three layers side by side for a chosen use case, so that I get a holistic readiness picture in one place.

| User can… | System can… |
|---|---|
| Toggle Enterprise / Domain / Individual layers | Render scripted impact content per layer |
| See governance, cost, and restructuring impact (Enterprise) | Flag whether org-structure change is implied |
| See security + possible solutions (Domain) | Surface domain risks and candidate solution patterns |
| See skills + training needs (Individual) | Feed the Human Readiness view (FR-6) |
| Compare layers side by side | Present a consolidated readiness summary |

#### FR-6: Human Readiness

- **FR-6.1** — As a user, I can view **how humans can be ready** for the technology — required **certifications, skills, and trainings** — so that adoption accounts for people, not just tech.
- **FR-6.2** — As a user, I can see readiness mapped to the **roles** affected (e.g., PM, Solution Architect, Security), so that L&D can target the right people.
- **FR-6.3** — As a user, I can push readiness items into the cascade (FR-7) as **People & Culture / L&D** action items, so that upskilling becomes a tracked follow-up.

| User can… | System can… |
|---|---|
| View certifications / skills / trainings for the tech | Render scripted readiness recommendations |
| See readiness per affected role | Map readiness items to org-level roles |
| Send readiness items to the cascade | Create L&D action items in Jarvis |

#### FR-7: Approve & Cascade to Jarvis

- **FR-7.1** — As a user, I can **approve a simulation** (endorse a recommended use case as a G0 candidate), so that exploration converts into coordinated action.
- **FR-7.2** — As a user, when I approve, I want VISION to **cascade role-specific action items** into Jarvis for the relevant org roles (PM, Solution Architect, Security, Data Privacy, Finance, L&D, Portfolio Manager), so that each function knows exactly what to do next.
- **FR-7.3** — As a user, I want each cascaded action item to carry context (the tech, the use case, the layer it came from), so that recipients understand the "why" without re-reading the whole simulation.
- **FR-7.4** — As a user, I want the approval and cascade to be **human-in-the-loop** — nothing is cascaded until I explicitly approve — so that I stay in control (consistent with Jarvis's approval-gating principle).
- **FR-7.5** — As a user, I can track cascaded items back to their source simulation, so that there is traceability from idea to action.

| User can… | System can… |
|---|---|
| Approve a recommended use case | Lock the recommendation and enable cascade |
| Cascade action items to org roles | Create role-scoped tasks in Jarvis per recipient |
| See context attached to each item | Attach tech/use-case/layer metadata to each task |
| Review before anything is sent | Gate all cascades behind explicit approval |
| Trace items back to the simulation | Maintain a link from each task to its source journey |

#### FR-8: Pre-G0 Readiness Pack

The pre-G0 output. VISION assembles **draft inputs** that a PM would need to open a G0 submission in PMI's DISD lifecycle. These are **drafts to accelerate G0 prep — not an approval**.

- **FR-8.1** — As a user, I can generate a **G0 Readiness Pack** for an approved use case, so that the team has a head start on the formal G0 submission.
- **FR-8.2** — As a user, I want the pack to pre-populate the **G0-required inputs** PMI expects, so that it aligns with the DISD G0 template.
- **FR-8.3** — As a user, I can export/hand off the pack (and see which items still need a human owner), so that it can be finalized and uploaded to ePPM.
- **FR-8.4** — As a user, I want each drafted item clearly labeled **"draft — requires review"**, so that nothing is mistaken for an approved artifact.

**G0-required inputs the pack drafts (per PMI DISD / ITPM guidance):**

<table>
<tr><th>G0 Input</th><th>What VISION drafts</th></tr>
<tr><td>Benefit / Value Hypothesis</td><td>Initial benefit statement + realistic assumptions from the evaluation</td></tr>
<tr><td>Experiment Definition (PoC/MVP)</td><td>Tactics, stages, measurements, KPIs, success criteria</td></tr>
<tr><td>Objectives & Key Deliverables</td><td>Initiation-phase goals (planned PoC/MVP activities)</td></tr>
<tr><td>Indicative Financials</td><td>High-level initiation + execution cost estimate; expected benefits (revenue / productivity / opex)</td></tr>
<tr><td>Timeline & Milestones</td><td>High-level PoC → G3 timeline with key milestones</td></tr>
<tr><td>Risk Assessment</td><td>Risk level overview from the opportunity/risk evaluation</td></tr>
<tr><td>Technology & Architecture</td><td>Initial architectural assessment, technology approach, capability-overlap notes, buy-vs-build</td></tr>
<tr><td>Initial Cybersecurity Assessment</td><td>High-level InfoSec risk flag (engage 1LoD)</td></tr>
<tr><td>Data Privacy (high-level)</td><td>Data classification, personal-data processing flags for DPIA consult</td></tr>
</table>

| User can… | System can… |
|---|---|
| Generate a Readiness Pack for an approved use case | Assemble drafts mapped to PMI's G0 inputs |
| Review each drafted section | Label every item "draft — requires review" |
| Export / hand off the pack | Produce a shareable bundle + list of open owners |
| See what's still needed for G0 | Show a checklist against the DISD G0 template |

> **Note:** Mandatory G0 partners per PMI guidance — **Architects and Security/1LoD are mandatory**; UX is recommended; Data Privacy is consulted early. VISION pre-drafts the inputs but the actual submission, ePPM record, and gate decision remain human/DISD responsibilities.

#### FR-9: G0 Decision Gate (Human-in-the-Loop Go / No-Go)

This is the **hard human checkpoint**. After the G0 Readiness Pack is prepared, VISION presents a **decision brief** and **stops** — nothing advances, and **no funding is released**, until a human with authority explicitly records a **Go** decision. This mirrors PMI's rule that G0 is a Go/No-go decision made by the **Functional/Regional DISD**, or by the **AI Steering Committee** for AI/innovation initiatives.

- **FR-9.1** — As an Innovation Lead, I can submit a candidate (with its Readiness Pack) into a **G0 decision view**, so that the right decision-maker can review it.
- **FR-9.2** — As a **DISD / AI Steering Committee decision-maker**, I can review the value hypothesis, experiment, financials, risk, and tech approach in one brief, so that I can make an informed call.
- **FR-9.3** — As a decision-maker, I can record an explicit **Go / No-go / Rework** decision **with a rationale**, so that the gate is deliberate and auditable — **VISION never auto-approves**.
- **FR-9.4** — As a user, until a **Go** is recorded, I can see the candidate held at **"Awaiting G0 decision"**, so that it is unambiguous that nothing is funded or started yet.
- **FR-9.5** — As a user, on a **No-go** or **Rework**, I can send the candidate back to simulation with the reviewer's notes, so that curiosity converts into a better next iteration.

| User can… | System can… |
|---|---|
| Submit a candidate + pack for a G0 decision | Route it to a G0 decision view and set status "Awaiting G0 decision" |
| Record Go / No-go / Rework with rationale | Log the decision, decision-maker, and timestamp to a Decision Log |
| Block progress until a human decides | Hard-gate: no funding/kickoff without a recorded "Go" |
| Return a No-go/Rework to the journey | Re-open the simulation with reviewer notes attached |

> **Design principle:** Consistent with Jarvis's approval-gating — the human is the gate. VISION prepares and presents; the **human decides G0**.

#### FR-10: Seed-Funding Release & PoC Kickoff (Post-G0)

Only **after** a human "Go" at FR-9 does VISION unlock the post-G0 flow: it records the **seed-funding release** (PMI allows up to **~$100K OPEX** kick-start / "seed" funding for a PoC/MVP, released by DISD before G3) and kicks off PoC tracking.

- **FR-10.1** — As a user, once G0 is approved, I can record the **seed-funding release** (indicative amount, up to ~$100K OPEX), so that the PoC has a funded envelope.
- **FR-10.2** — As a user, I can convert the qualified demand into a **tracked PoC** (the candidate now shows as a project, not just an idea), reflecting PMI's "demand becomes a project at G0" rule.
- **FR-10.3** — As a user, I can see the **PoC charter** auto-populated from the Readiness Pack (objectives, success criteria, KPIs, timeline to G3), so that the team starts aligned.
- **FR-10.4** — As a user, I want the funding amount to remain **clearly labeled "indicative / simulated"**, so that no one mistakes it for a real financial commitment.

| User can… | System can… |
|---|---|
| Record seed-funding release after G0 Go | Enforce that this is only available once a "Go" exists (else greyed out) |
| Promote the idea to a tracked PoC | Flip entity status idea → PoC/project and surface it under "Active PoCs" |
| Auto-fill the PoC charter | Carry objectives, KPIs, success criteria, and timeline from the Readiness Pack |
| See funding as indicative | Label every figure "indicative / simulated — not a financial commitment" |

#### FR-11: PoC Execution Tracking (G0 → G3, incl. optional G1 / G2)

Between G0 and G3, VISION **tracks** the PoC against its success criteria and simulates the intermediate (non-mandatory) checkpoints — **G1 Experience Design** and **G2 Market Alignment** — that a Complex project may pass through. These are **PM-managed** gates, not DISD decisions.

- **FR-11.1** — As a user, I can track the PoC against the **success criteria / KPIs** defined at G0, so that I know whether the experiment is proving or rejecting the benefit hypothesis.
- **FR-11.2** — As a user, I can advance the PoC through optional **G1 (Experience Design)** and **G2 (Market Alignment)** checkpoints, so that the journey reflects PMI's stage-gate model.
- **FR-11.3** — As a user, I can capture **interim outputs** the PoC generates (architectural assessments for G3, 1LoD/2LoD & Data Privacy impact assessments, sourcing/RFP notes, interim risk), so that G3 prep is a by-product of execution.
- **FR-11.4** — As a user, I can see a **G3-readiness meter** showing which G3 inputs are complete vs. outstanding, so that I always know how far the PoC is from a business case.
- **FR-11.5** — As a user, I can record a **PoC outcome** (hypothesis proven / partially proven / rejected), so that the G3 decision is evidence-based.

| User can… | System can… |
|---|---|
| Track PoC vs. success criteria | Show KPI progress against the G0-defined targets |
| Advance through G1 / G2 checkpoints | Treat these as PM-confirmed (non-mandatory) stage moves |
| Capture interim G3 inputs during the PoC | Map each output to the G3 business-case checklist |
| See a G3-readiness meter | Compute % of G3 inputs complete vs. outstanding |
| Record the PoC outcome | Feed the outcome into the G3 Business Case (FR-12) |

#### FR-12: G3 Business Case Assembly & Decision Gate (Human Go / No-Go for Pilot)

The end of VISION's arc. VISION assembles the **G3 Business Case / Readiness Pack** and presents a **second human decision gate**. G3 is the **pivotal DISD funding decision** — Go/No-go for the Pilot and allocation of project budget. It requires a **Project Stakeholder Agreement (SteerCo)** and a **DISD G3 Decision Sheet**, both linked in ePPM, and DISD-aligned **Advanced Financials** (NPV, Payback).

- **FR-12.1** — As a user, I can generate a **G3 Business Case pack** for a completed PoC, pre-populating the DISD G3 template, so that the team has a head start on the funding submission.
- **FR-12.2** — As a user, I want the pack to draft the **G3-required inputs**: outcome & key deliverables, **Advanced Financials (NPV, Payback, cost/benefit by benefit level)**, benefits, refined technology/architecture, and the two mandatory artefacts (**SteerCo Stakeholder Agreement + DISD G3 Decision Sheet**).
- **FR-12.3** — As a **DISD decision-maker**, I can review the business case and record an explicit **G3 Go / No-go / Pivot** decision **with rationale**, so that funding is a deliberate human call — **VISION never approves or allocates budget itself**.
- **FR-12.4** — As a user, until a G3 **Go** is recorded, the candidate is held at **"Awaiting G3 decision"**, so that nothing enters execution prematurely.
- **FR-12.5** — As a user, I can export/hand off the G3 pack (with a list of open human owners) for the real ePPM submission, and every drafted item stays labeled **"draft — requires review"**.
- **FR-12.6** — As a user, on a **G3 Go**, VISION marks the journey **complete** ("Business case approved — handed to delivery"); **everything from G4 onward is out of scope** and owned by the delivery team/DISD.

**G3-required inputs the pack drafts (per PMI DISD / ITPM guidance):**

<table>
<tr><th>G3 Input</th><th>What VISION drafts</th></tr>
<tr><td>Outcome (why invest?)</td><td>Refined value statement, validated/updated from PoC results</td></tr>
<tr><td>Key Deliverables (what do we get?)</td><td>Execution-phase deliverables carried from the PoC</td></tr>
<tr><td>Advanced Financials</td><td>NPV, Payback period, cost/benefit breakdown per benefit level (indicative)</td></tr>
<tr><td>Benefits</td><td>Revenue / productivity / opex / risk-reduction / foundation categories</td></tr>
<tr><td>Technology & Architecture</td><td>Matured Solution Outline, hosting, app-portfolio impact, buy-vs-build, ARB notes</td></tr>
<tr><td>Impact Assessments</td><td>1LoD/2LoD security + Data Privacy (DPIA) status carried from the PoC</td></tr>
<tr><td>SteerCo Stakeholder Agreement</td><td>Draft Project Stakeholder Agreement for signature</td></tr>
<tr><td>DISD G3 Decision Sheet</td><td>Draft decision sheet to be linked in ePPM</td></tr>
</table>

| User can… | System can… |
|---|---|
| Generate a G3 Business Case pack | Assemble drafts mapped to PMI's G3 inputs + the two mandatory artefacts |
| Review Advanced Financials (NPV/Payback) | Surface indicative NPV/Payback and cost/benefit by benefit level |
| Record G3 Go / No-go / Pivot with rationale | Hard-gate funding behind a human decision; log to the Decision Log |
| Hold at "Awaiting G3 decision" | Block execution until a human "Go" exists |
| Export the pack for ePPM | Produce a shareable bundle + open-owner list; label items "draft — requires review" |
| Close the journey on G3 Go | Mark "Business case approved — handed to delivery"; stop at the G3 boundary |

> **Note:** G3 is decided by **DISD** (Central for large/cross-functional; Functional/Regional for smaller). High-risk/high-impact AI initiatives request **G3 from the AI Steering Committee**. VISION drafts and presents; the **human/DISD decides and funds**. No project may begin execution without explicit **written** DISD approval.

#### FR-13: Jarvis Notification Integration (Proactive Nudge)

- **FR-13.1** — As a Jarvis user, I can receive a **proactive notification** when a new relevant emerging-tech trend appears (e.g., *"There's a new technology — want to simulate it?"*), so that I'm nudged toward timely exploration.
- **FR-13.2** — As a user, I can click the notification to jump **straight into VISION Studio** with that technology pre-loaded, so that acting on curiosity is frictionless.
- **FR-13.3** — As a user, I can dismiss or snooze the nudge, so that I stay in control of my attention.

| User can… | System can… |
|---|---|
| Receive a "new tech — want to simulate?" nudge | Surface a scripted trend notification in Jarvis |
| Click through into VISION with the tech pre-loaded | Deep-link into the matching journey |
| Dismiss / snooze | Respect the user's notification preferences |

*(Prototype note: recommendations are drawn from the seeded library, not a live trend feed.)*

---

### 5. Data Entities (Prototype)

All entities are seeded/mock, consistent with the Jarvis build:
- **Journey**: id, techName, sourceArticle, status, targetFunctions[], useCases[]
- **UseCase**: id, function, description, opportunities[], risks[], benefitCost, timeline, projectClashes[]
- **ImpactLayer**: layer (enterprise/domain/individual), content, restructuringFlag (enterprise only)
- **ReadinessItem**: id, type (certification/skill/training), role, description
- **CascadeItem**: id, targetRole, actionText, sourceJourneyId, layerOrigin, status
- **ReadinessPack**: id, useCaseId, gate (G0/G3), sections[], openOwners[], status
- **GateDecision**: id, gate (G0/G3), decision (go/nogo/rework/pivot), decisionMaker, rationale, timestamp *(the Decision Log)*
- **SeedFunding**: id, journeyId, amountIndicative (≤ ~$100K OPEX), releasedAfterGateDecisionId, label ("indicative/simulated")
- **PoC**: id, journeyId, charter, successCriteria[], kpiProgress[], g3ReadinessPct, outcome (proven/partial/rejected), stage (G0/G1/G2/G3)
- **TrendNotification**: id, techName, journeyId, message, state (unread/dismissed)

---

### 6. Non-Functional Considerations

<table>
<tr><th>Area</th><th>Observation</th></tr>
<tr><td>Persistence</td><td>localStorage only (saved ideas, cascade state), inherited from Jarvis</td></tr>
<tr><td>Security</td><td>No auth; not production-ready — same limitation as Jarvis</td></tr>
<tr><td>AI/Backend</td><td>Journeys are pre-scripted; production would need a real LLM/agent + a trend-ingestion feed</td></tr>
<tr><td>Integration</td><td>Cascade writes to Jarvis's task model; requires the shared role re-mapping (see §3)</td></tr>
<tr><td>Data realism</td><td>Financials, timelines, and risks are illustrative at pre-G0; must be validated before any real G0</td></tr>
</table>

---

### 7. Assumptions
- VISION Studio spans **pre-G0 → G3**; its deliverables are a **recommended candidate, a funded & tracked PoC, and a draft G3 Business Case** — but **every gate decision (G0 and G3) is made by a human/DISD**, never by VISION.
- **No funding is released and no PoC starts** until a human records an explicit **"Go" at G0**; likewise nothing enters execution without a human **"Go" at G3**.
- Seed-funding figures (≤ ~$100K OPEX) and all financials (incl. NPV/Payback) are **indicative/simulated** and must be validated before any real DISD submission.
- G1 (Experience Design) and G2 (Market Alignment) are treated as **optional, PM-managed** checkpoints; only G0 and G3 are modelled as mandatory human decision gates in this scope.
- The three seeded journeys (Agentic AI, Physical AI, Wicked Intelligence) represent the initial demo scope; more articles can be seeded later.
- SRC and other functions are **illustrative markets** to demonstrate positioning, not committed pilots.
- Jarvis personas will be re-mapped to the org-level roles so cascades land correctly.
- "Curiosity that takes the right action" is a **design principle** guiding the UX, not a built feature.

---

### 8. Open Questions / Coordination Points
1. ~~Confirm the shared **role re-mapping** between Jarvis personas and VISION's org-level roles.~~ **Resolved** — implemented per the § 3 mapping table (`src/constants/visionRoleMap.ts`); login/auth model retained, no role switcher.
2. Confirm the final **entry-button label** ("Enter VISION Studio" vs alternatives).
3. Decide whether the **Readiness Pack** exports as a single doc or per-input drafts for individual owners.
4. Confirm the **Wicked Intelligence** journey framing (wicked-problem selection lens) resonates with sponsors before demo.
5. Confirm **who the G0 and G3 decision-makers are** per initiative type (Functional/Regional DISD vs. AI Steering Committee for AI projects) so the decision gates route correctly.
6. Decide how far the **PoC tracking** should go for the demo — full G1/G2 checkpoints, or a simplified G0 → PoC → G3 line.
7. Confirm whether VISION should **write the seed-funding release and gate decisions back to ePPM**, or remain a simulation that hands off drafts.

---

## Appendix A — Pre-Scripted Journey Scripts

The demo ships with **three** canned journeys, one per seed article. Each journey follows the same structure the UI walks through: **Source → Adoption Path (functions → use cases → evaluation) → Multi-Layer Impact → Human Readiness → Recommended Candidate → Example Cascade → G0 Readiness Pack highlights.** All figures are **illustrative** for demo purposes.

> **Lifecycle note (v1.2):** After the G0 Readiness Pack, every journey continues through the **human-gated arc** — **G0 decision (human Go/No-go) → seed-funding release & PoC kickoff → PoC tracking (opt. G1/G2) → G3 Business Case → G3 decision (human Go/No-go)** — per FR-9 to FR-12. The scripts below focus on the pre-G0 exploration; the post-G0 steps reuse the same shared flow for all three.

---

### Journey A — Agentic AI

**Source:** *"What is Agentic AI?"* — IBM (`https://www.ibm.com/think/topics/agentic-ai`)
**Tech in one line:** AI systems that pursue a goal with limited supervision, built from AI agents that perceive, reason, set goals, decide, execute, learn, and are coordinated via **orchestration**. Key traits: autonomous, proactive, specialized, adaptable, intuitive (natural-language driven).

**Adoption Path — candidate functions → use cases:**

| Candidate Function | Illustrative Use Case |
|---|---|
| Project Management Excellence (ePPM) | Multi-agent assistant that drafts G-gate documents, checks portfolio conflicts, and monitors project health (extends Platypus) |
| Commercial / Consumer Care | Agentic customer-service resolver that queries systems, takes actions (refunds, orders) and escalates with a human-in-the-loop |
| Supply Chain | Agents that autonomously adjust production schedules / place supplier orders to hold optimal inventory |
| Cybersecurity | Agents continuously monitoring network traffic, logs, and user behavior for anomalies |
| SRC retail network *(example market)* | Agent that helps toko kelontong owners auto-reorder stock and respond to customer queries in natural language |

**Recommended candidate:** *Agentic assistant for ePPM / Project Management Excellence* — highest strategic fit (builds on existing Platypus momentum), clear productivity benefit, contained blast radius.

**Evaluation (recommended use case):**
- **Opportunities:** Collapses multi-tab SaaS work into natural-language commands; automates multistep, long-horizon tasks; frees PMs for higher-value work.
- **Risks:** Autonomy "off the rails" — poorly designed reward/goal leads to unintended actions; cascading failures across multiple agents; transparency is hard to guarantee; ROI is indirect and may not materialize short-term.
- **Benefit–cost (indicative):** PoC ~$60–90K OPEX; benefit via PM hours saved + faster gate cycles.
- **Timeline (indicative):** 6-month PoC → G3.
- **Project clashes:** Overlaps with Platypus and Jarvis — must be positioned as an extension, not a duplicate.

**Multi-Layer Impact:**
- **Enterprise (governance, cost, restructuring):** Needs an agent-governance model (goal definition, guardrails, measurable feedback loops, Agent Ops); *possible* light restructuring — a new "Agent Ops / orchestration" ownership function. Cost centers on orchestration platform + oversight.
- **Domain (security, solutions):** Agent identity & access control (e.g., per-agent identity), API/tool permissioning, audit logging; solution patterns: conductor-and-workers vs. decentralized agents depending on workflow.
- **Individual (skills, training):** Shift from "doing tasks" to "supervising agents"; humans define goals and review outputs.

**Human Readiness:**
- *Skills:* agent orchestration, prompt & guardrail design, human-in-the-loop review, reward/goal design.
- *Certifications:* cloud/AI practitioner (e.g., AWS AI Practitioner), responsible-AI governance.
- *Trainings:* Agent Ops, monitoring & failure recovery ("what to do when an agent gets stuck").

**Example cascade (on approve):**
- *PM* → draft PoC plan + success criteria for the ePPM agent
- *Solution Architect* → orchestration architecture (conductor vs. decentralized), tool/API integration
- *Security / 1LoD* → agent identity, permissioning, audit approach
- *Data Privacy* → data the agent can read/act on; classification
- *Finance* → PoC cost + PM-hours-saved benefit model
- *L&D* → Agent Ops / oversight upskilling plan

**G0 Readiness Pack highlights:**
- *Value hypothesis:* "Agentic assistance reduces gate-document prep time by X% and portfolio-conflict misses by Y%."
- *Experiment:* PoC on N live projects; measure hours saved & error reduction.
- *Tech approach:* orchestration platform, buy-vs-build (extend Platypus vs. new build).
- *Risk:* medium (autonomy/guardrails); *Security:* engage 1LoD (agent identity).

---

### Journey B — Physical AI

**Source:** *"What is Physical AI?"* — IBM (`https://www.ibm.com/think/topics/physical-ai`)
**Tech in one line:** AI that perceives and acts on the **physical world** via sensors/actuators — robotics, smart factories, autonomous fleets — trained heavily in **simulation / digital twins** with reinforcement learning and synthetic data. Positioned by Nvidia's Jensen Huang as "the ChatGPT moment for robotics."

**Adoption Path — candidate functions → use cases:**

| Candidate Function | Illustrative Use Case |
|---|---|
| Manufacturing / Operations | Robotic AI for predictive maintenance & flexible assembly; a **digital twin** of a factory line for simulation-first optimization |
| Supply Chain / Warehousing | Fleets of autonomous mobile robots (AMRs) for picking and moving goods |
| Quality Control | Computer-vision inspection on the production line |
| SRC retail network *(example market)* | Vision-based **smart-shelf / inventory sensing** for toko kelontong stock accuracy |
| Facilities / Sustainability | AI-optimized, energy-efficient smart-grid / building systems |

**Recommended candidate:** *Digital-twin-driven predictive maintenance in Manufacturing* — strongest data availability, safety-contained via simulation-first, measurable downtime savings.

**Evaluation (recommended use case):**
- **Opportunities:** Reduced downtime, labor efficiency, safer operations; simulation-first lowers real-world risk before deployment.
- **Risks:** High capex; **"data is expensive"** (real robot-interaction data, hardware wear); **"physics is hard"** (sim-to-real gap); **real stakes** (safety); latency-sensitive control; overfitting to synthetic data.
- **Benefit–cost (indicative):** Higher than software-only — PoC likely near the top of the seed band (~$90–100K+); benefit via downtime & maintenance-cost reduction.
- **Timeline (indicative):** Longer runway — sim build + real-world fine-tuning; 6-month PoC is tight, may need staging.
- **Project clashes:** Overlaps with existing manufacturing automation / IoT initiatives — capability-overlap check required.

**Multi-Layer Impact:**
- **Enterprise (governance, cost, restructuring):** Significant capex governance; safety & compliance oversight; **likely restructuring** — new roles around robotics/automation ops and simulation engineering. Highest org footprint of the three journeys.
- **Domain (security, solutions):** OT/physical safety, sensor/edge security, digital-twin data integrity; solution patterns: hybrid control (simple algorithms for stability + learning models for perception/decision), world foundation models, domain randomization.
- **Individual (skills, training):** New operational + safety competencies; simulation/robotics literacy for engineers and floor staff.

**Human Readiness:**
- *Skills:* reinforcement learning, simulation/digital-twin engineering, sensor/edge integration, robotics safety.
- *Certifications:* industrial safety, robotics/automation, relevant cloud/edge-AI.
- *Trainings:* sim-to-real transfer, human oversight of autonomous physical systems.

**Example cascade (on approve):**
- *PM* → staged PoC plan (sim → constrained real-world)
- *Solution Architect* → digital-twin + hybrid control architecture; buy-vs-build (vendor robotics platform vs. custom)
- *Enterprise Architect* → overlap check vs. existing automation/IoT programs
- *Security / 1LoD* → OT/edge security + physical-safety assessment
- *Finance* → capex-heavy cost model + downtime-savings benefit
- *L&D* → robotics-ops & safety upskilling

**G0 Readiness Pack highlights:**
- *Value hypothesis:* "Predictive-maintenance robotics reduces unplanned downtime by X% at pilot line."
- *Experiment:* simulation-first, then constrained real-world pilot; measure downtime & maintenance cost.
- *Tech approach:* digital twin + WFM, hybrid control; heavy buy-vs-build call.
- *Risk:* high (capex, safety, sim-to-real); *Security:* mandatory 1LoD + physical-safety review.

---

### Journey C — Wicked Intelligence

**Source:** *"Wicked Intelligence Will Decide Who Wins the AGI Race"* — Dave Aron / Gartner, LinkedIn (`https://www.linkedin.com/posts/davearon_unthink-unask-unlearn-share-7366203509345554432-QwPr/`)
**Tech in one line:** A **framing/strategy**, not a product — using AI to tackle **"wicked" (very hard) problems humans have historically struggled with**, rather than automating what humans already do well. Provocation to **#unthink, #unask, #unlearn** — reframe the problems worth solving on the path to AGI.

> **Note:** This journey is deliberately different — it's a **lens for problem selection**, so its Adoption Path positions the *approach* across functions rather than a single technology product. This directly reflects Michael Voegele's "curiosity that takes the right action."

**Adoption Path — candidate functions → "wicked problem" use cases:**

| Candidate Function | Illustrative Wicked-Problem Use Case |
|---|---|
| Portfolio / Strategy | AI to untangle cross-portfolio interdependencies & resource conflicts humans can't fully hold in their heads |
| Regulatory / Scientific Affairs | AI to navigate the multi-market, ever-shifting regulatory maze for reduced-risk products |
| R&D | AI to explore vast design/formulation spaces beyond human search capacity |
| Sustainability / Supply Chain | AI to optimize deeply interdependent, multi-objective sustainability trade-offs |
| SRC retail network *(example market)* | AI to model complex, hyper-local demand across 250K+ diverse stores |

**Recommended candidate:** *Wicked-problem triage capability for Portfolio/Strategy* — a lightweight capability that helps leadership **pick the right hard problems** to point AI at, feeding a shortlist of high-value candidates.

**Evaluation (recommended use case):**
- **Opportunities:** Focus AI investment on high-value, previously-intractable problems (higher payoff than automating known tasks); differentiation; disciplined "curiosity that acts."
- **Risks:** Ambiguity — wicked problems are hard to scope and measure; success criteria fuzzy; risk of over-promising toward "AGI"; needs strong problem-framing discipline.
- **Benefit–cost (indicative):** Low direct build cost (it's a method/capability); PoC ~$40–60K to run structured problem-framing sprints.
- **Timeline (indicative):** Short — a framing/prioritization sprint feeding other journeys.
- **Project clashes:** Complements rather than clashes — acts as an upstream lens that feeds candidates into Journeys A and B and the wider portfolio.

**Multi-Layer Impact:**
- **Enterprise (governance, cost, restructuring):** Governance = how PMI *chooses* wicked problems and allocates AI investment; likely **no structural change** — more a decision-making/curiosity ritual than a new org unit.
- **Domain (security, solutions):** Depends on the chosen problem; solution = a repeatable problem-framing method (#unthink/#unask/#unlearn) rather than a fixed tech stack.
- **Individual (skills, training):** Curiosity, critical thinking, problem reframing, "unlearning" assumptions — the human capability Voegele highlights.

**Human Readiness:**
- *Skills:* problem framing, systems thinking, hypothesis design, AI literacy to know what's now solvable.
- *Certifications:* less certification-driven; more facilitation / design-thinking / strategy.
- *Trainings:* "unthink/unask/unlearn" workshops; wicked-problem selection & scoping.

**Example cascade (on approve):**
- *Portfolio Manager* → run a wicked-problem shortlisting sprint; feed candidates to G0 pipeline
- *Innovation Lead* → facilitate #unthink/#unask/#unlearn framing sessions
- *PM* → capture shortlisted problems as candidate demands
- *L&D* → curiosity / problem-reframing capability building
- *(Security/Privacy/Finance engaged later, once a concrete problem is selected)*

**G0 Readiness Pack highlights:**
- *Value hypothesis:* "Focusing AI on 2–3 wicked problems yields higher expected value than automating known tasks."
- *Experiment:* structured framing sprint → shortlist → feed 1–2 candidates into deeper journeys.
- *Tech approach:* method-first; minimal build; leverages existing AI tooling.
- *Risk:* medium (ambiguity/measurability); *Security/Privacy:* deferred until a concrete problem is chosen.
