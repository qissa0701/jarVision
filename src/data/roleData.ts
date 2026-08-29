// Role mock data for the Jarvis AI Dashboard.
// Moved verbatim from the original src/app/App.tsx monolith (Requirement 1.2).
// No content, text, or values are altered so the dashboard renders identically.

import type { Role, RoleData } from "@/types";

// ─── Role Data ───────────────────────────────────────────────────────────────

export const ROLE_DATA: Record<Role, RoleData> = {
  engineer: {
    name: "Alex Chen", firstName: "Alex", title: "Solution Architect", avatar: "AC",
    priorities: [
      { id: "p1", title: "PR #847: Auth service memory leak — blocking tonight's deploy", urgency: "critical", context: "Open 3 days · 0 reviews" },
      { id: "p2", title: "Sprint deadline Friday — 8 story points still in progress", urgency: "high", context: "3 stories in-flight" },
      { id: "p3", title: "Security audit failing — 4 OWASP findings due to CTO today", urgency: "high", context: "EOD deadline" },
      { id: "p4", title: "12 API endpoints undocumented — PM escalation pending", urgency: "medium", context: "Requested this week" },
    ],
    tasks: [
      {
        id: "t1", title: "Fix memory leak in auth service", due: "Today", category: "Bug",
        steps: [
          { num: 1, title: "Capture heap snapshot in staging", description: "Use clinic.js or Chrome DevTools under simulated load. Focus on the JWT middleware and session store.", tool: "clinic.js" },
          { num: 2, title: "Identify retention paths", description: "Look for unclosed DB connections or unbounded event listener registrations introduced in the last 3 PRs.", tool: "Chrome DevTools" },
          { num: 3, title: "Implement fix and add cleanup hooks", description: "Ensure proper teardown in middleware lifecycle. Enforce connection pool limits via pg-pool config.", tool: "pg-pool" },
          { num: 4, title: "Add memory regression test to CI", description: "Assert heap stays under 512MB threshold at p95 load. Wire into the integration test pipeline.", tool: "Jest" },
          { num: 5, title: "Open PR and tag reviewers", description: "Tag @sarah-kim and @devops team. Mark as priority given deploy blocker status.", tool: "GitHub" },
        ],
      },
      {
        id: "t2", title: "Review PR #834: New payment flow", due: "Today", category: "Review",
        steps: [
          { num: 1, title: "Read the diff end-to-end", description: "Focus on Stripe integration changes and idempotency key handling. Check for race conditions.", tool: "GitHub" },
          { num: 2, title: "Run integration tests locally", description: "npm run test:integration -- --grep payment. Verify all Stripe error codes surface correctly to the UI.", tool: "Stripe API" },
          { num: 3, title: "Leave review with actionable feedback", description: "Approve or request changes with specific line-level comments. Prioritize error handling gaps.", tool: "GitHub" },
        ],
      },
      {
        id: "t3", title: "Update OpenAPI documentation", due: "Tomorrow", category: "Docs",
        steps: [
          { num: 1, title: "Audit spec against production endpoints", description: "Run openapi-diff to enumerate the 12 undocumented endpoints. Export as CSV.", tool: "openapi-diff" },
          { num: 2, title: "Write missing schemas", description: "Add request/response shapes and error models. Follow existing naming conventions.", tool: "OpenAPI" },
          { num: 3, title: "Lint and validate", description: "Run spectral lint and fix any breaking rule violations before publishing.", tool: "Spectral" },
          { num: 4, title: "Publish and notify PM", description: "Update Confluence API index and post link to #product-eng Slack channel.", tool: "Confluence" },
        ],
      },
      {
        id: "t4", title: "Run Q4 load tests on release branch", due: "Thu", category: "Testing",
        steps: [
          { num: 1, title: "Configure k6 test scenarios", description: "Define ramp-up, sustained, and spike scenarios matching predicted Q4 peak traffic (3× baseline).", tool: "k6" },
          { num: 2, title: "Capture baseline against main", description: "Record p50/p95/p99 latency and error rate on current main branch.", tool: "k6" },
          { num: 3, title: "Run against release branch and compare", description: "Flag any p95 regression > 10%. Investigate root cause before signing off.", tool: "Grafana" },
          { num: 4, title: "Post results to #platform-infra", description: "Include charts, pass/fail summary, and recommendation for go/no-go.", tool: "Slack" },
        ],
      },
    ],
    emails: [
      { id: "e1", sender: "Sarah Kim", senderRole: "CTO", subject: "Security audit results — action needed", gist: "4 critical OWASP findings flagged. Auth service is the primary concern. Needs owner assignment by EOD.", time: "8:42 AM", initials: "SK", color: "#4f46e5" },
      { id: "e2", sender: "Marcus Lee", senderRole: "Product Manager", subject: "Payment feature spec — sign-off needed", gist: "New Stripe integration spec attached. Need your API contract approval before next sprint starts Monday.", time: "7:15 AM", initials: "ML", color: "#0891b2" },
      { id: "e3", sender: "CI/CD Bot", senderRole: "DevOps", subject: "Build #2847 failed — rollback complete", gist: "main branch failing on integration tests since 6:12 AM. Rollback to #2843 complete. Logs attached.", time: "6:31 AM", initials: "CI", color: "#dc2626" },
    ],
    meetings: [
      { id: "m1", title: "Sprint Standup", startTime: "9:00", endTime: "9:15", type: "video", attendees: "Team (8)" },
      { id: "m2", title: "Architecture Review", startTime: "10:30", endTime: "11:30", type: "video", attendees: "Eng leads (5)" },
      { id: "m3", title: "1:1 with Sarah Kim", startTime: "14:00", endTime: "14:30", type: "video", attendees: "Sarah K." },
      { id: "m4", title: "Q4 Release Demo Prep", startTime: "16:00", endTime: "16:30", type: "in-person", attendees: "Team (6)" },
    ],
    suggestions: [
      { id: "s1", text: "PR #847 has been open 3 days with no reviewer activity. Ping @devops directly to avoid missing tonight's deploy window.", action: "Send ping", kind: "warning" },
      { id: "s2", text: "Deploy window opens at 11pm. Auth fix needs to be merged by 10:30pm to make it into tonight's release.", action: "View timeline", kind: "info" },
      { id: "s3", text: "Sprint velocity is on track if you scope out the API docs update to next sprint. 6 points is achievable by Friday.", action: "Update scope", kind: "success" },
    ],
  },
  portfolio: {
    name: "Priya Sharma", firstName: "Priya", title: "Portfolio Manager", avatar: "PS",
    priorities: [
      { id: "p1", title: "Q3 portfolio review deck — board presentation Thursday 9 AM", urgency: "critical", context: "CEO pre-read by 5pm today" },
      { id: "p2", title: "Project Nova flagged RED — 6-week timeline slip confirmed", urgency: "high", context: "Steering committee needed" },
      { id: "p3", title: "Budget variance report overdue — $2.4M underspend to explain", urgency: "high", context: "2 days past due date" },
      { id: "p4", title: "5 key stakeholder accounts with no update in 3+ weeks", urgency: "medium", context: "Relationship risk" },
    ],
    tasks: [
      {
        id: "t1", title: "Finalize Q3 portfolio review deck", due: "Today 5pm", category: "Presentation",
        steps: [
          { num: 1, title: "Pull latest RAG status for all 12 initiatives", description: "Query portfolio tracker and update status. Flag any changes from last week's snapshot." },
          { num: 2, title: "Synthesize 3 strategic risks for board input", description: "Frame each risk as a specific decision request with options and recommendation." },
          { num: 3, title: "Build financial summary slide", description: "Pull Q3 actuals vs. budget from Finance. Calculate variance and add Q4 forecast with assumptions." },
          { num: 4, title: "Review narrative with VP Strategy", description: "30-min sync with David Chen to pressure-test the story arc before sending to CEO." },
          { num: 5, title: "Submit to CEO with 3-bullet pre-read", description: "Send final deck with executive summary by 5pm. Include decision items clearly marked." },
        ],
      },
      {
        id: "t2", title: "Escalate Project Nova status", due: "Today", category: "Escalation",
        steps: [
          { num: 1, title: "Document root cause of 6-week slip", description: "Interview Nova PM. Get written summary of the legacy data migration dependency." },
          { num: 2, title: "Model 3 recovery scenarios", description: "Scope reduction, resource addition, timeline extension. Calculate cost and risk for each." },
          { num: 3, title: "Write one-page escalation brief", description: "Context, options, recommended path forward. No longer than a page." },
          { num: 4, title: "Schedule emergency steering committee", description: "45-min session with CTO, CFO, and business owners within 48 hours." },
        ],
      },
      {
        id: "t3", title: "Board presentation: strategic portfolio", due: "Wed", category: "Presentation",
        steps: [
          { num: 1, title: "Align on 3 board narrative themes with CEO", description: "30-min pre-call to confirm priorities before building slides." },
          { num: 2, title: "Build portfolio health visualization", description: "One-page portfolio map: RAG status, investment levels, strategic alignment by theme." },
          { num: 3, title: "Draft appendix deep-dives", description: "Slides for Nova, Atlas, and Horizon — the initiatives most likely to draw questions." },
        ],
      },
      {
        id: "t4", title: "Send 5 stakeholder status updates", due: "Tomorrow", category: "Communication",
        steps: [
          { num: 1, title: "Pull latest milestone data from tracker", description: "Update dates and deliverables for all 5 accounts from the PM system." },
          { num: 2, title: "Draft personalized updates", description: "Tailor each update to the stakeholder's concern: timeline, budget, or scope." },
          { num: 3, title: "Send and log in CRM", description: "Send via email and log touchpoint in Salesforce under each account." },
        ],
      },
    ],
    emails: [
      { id: "e1", sender: "David Park", senderRole: "CFO", subject: "Q3 budget variance — audit committee", gist: "$2.4M Transformation underspend needs written explanation before Thursday's audit committee meeting.", time: "8:15 AM", initials: "DP", color: "#0891b2" },
      { id: "e2", sender: "Rachel Torres", senderRole: "VP Engineering", subject: "Project Nova: 6-week delay confirmed", gist: "Legacy data migration dependency pushed delivery to Q1. Portfolio plan needs to reflect this immediately.", time: "7:50 AM", initials: "RT", color: "#7c3aed" },
      { id: "e3", sender: "James Okonkwo", senderRole: "Strategic Partner", subject: "Contract renewal — ready to sign at +8%", gist: "Commercial terms agreed. Need your sign-off this week before their fiscal year-end on Friday.", time: "Yesterday", initials: "JO", color: "#059669" },
    ],
    meetings: [
      { id: "m1", title: "Weekly Portfolio Review", startTime: "9:00", endTime: "10:00", type: "video", attendees: "PMs (12)" },
      { id: "m2", title: "Project Nova Escalation", startTime: "11:00", endTime: "11:45", type: "video", attendees: "Nova team (6)" },
      { id: "m3", title: "CEO deck review call", startTime: "14:00", endTime: "14:30", type: "video", attendees: "CEO, Chief of Staff" },
      { id: "m4", title: "Partner call: Okonkwo Group", startTime: "15:30", endTime: "16:00", type: "video", attendees: "James O." },
    ],
    suggestions: [
      { id: "s1", text: "Project Nova and Project Atlas share the same data migration dependency. Resolving Nova's blocker may unblock Atlas two weeks early.", action: "View dependencies", kind: "info" },
      { id: "s2", text: "Board deck is due in 48 hours and 3 slides still have placeholder data from last quarter.", action: "Open deck", kind: "warning" },
      { id: "s3", text: "4 of 5 stakeholder accounts have had zero touchpoint in over 3 weeks. This week is a natural opportunity to reconnect.", action: "Draft updates", kind: "info" },
    ],
  },
  infrastructure: {
    name: "Jordan Park", firstName: "Jordan", title: "Security / 1LoD", avatar: "JP",
    priorities: [
      { id: "p1", title: "P1 INCIDENT: prod-db-03 at 94% disk — full in ~4 hours", urgency: "critical", context: "PagerDuty active · bridge open" },
      { id: "p2", title: "Change window tonight: kernel patches for 12 prod servers", urgency: "high", context: "CAB approval pending" },
      { id: "p3", title: "Compliance audit Monday — 3 open CIS benchmark findings", urgency: "high", context: "Evidence due Friday 5pm" },
      { id: "p4", title: "Q4 capacity forecast — 40% compute growth projected", urgency: "medium", context: "Due Friday" },
    ],
    tasks: [
      {
        id: "t1", title: "Resolve P1: prod-db-03 disk space", due: "ASAP", category: "Incident",
        steps: [
          { num: 1, title: "Identify top disk consumers", description: "Run du -sh /var/lib/postgresql/* and check pg_wal directory for runaway WAL segments.", tool: "SSH" },
          { num: 2, title: "Clear safe-to-delete artifacts", description: "Remove old base backups older than 7 days. Run VACUUM FULL on the 5 largest tables.", tool: "psql" },
          { num: 3, title: "Submit emergency disk expansion", description: "Cloud provider request to expand EBS from 2TB to 3TB. Estimated 15-minute provisioning window.", tool: "AWS EBS" },
          { num: 4, title: "Fix archive_cleanup_command", description: "Misconfigured since the last Postgres major version upgrade. Test fix in staging first.", tool: "Postgres" },
          { num: 5, title: "Write post-incident review", description: "Schedule 30-min PIR within 24 hours. Update runbook with detection thresholds and remediation steps.", tool: "Confluence" },
        ],
      },
      {
        id: "t2", title: "Submit kernel patch change request", due: "Today 3pm", category: "Change Mgmt",
        steps: [
          { num: 1, title: "Inventory 12 affected servers", description: "Export from vulnerability scanner. All require CVE-2024-1086 kernel patch." },
          { num: 2, title: "Stage rolling patch sequence", description: "Order to maintain HA — never take down both members of a pair simultaneously." },
          { num: 3, title: "Write and test rollback procedure", description: "Document grub rollback steps. Validate against staging node before submitting." },
          { num: 4, title: "Submit to CAB in ServiceNow", description: "Risk assessment + rollback plan attached. Needs 2 approvals before tonight's window." },
        ],
      },
      {
        id: "t3", title: "Remediate 3 CIS compliance findings", due: "Fri 5pm", category: "Compliance",
        steps: [
          { num: 1, title: "Review findings #14, #23, #31", description: "SSH protocol version (#14), audit logging (#23), and sysctl hardening (#31)." },
          { num: 2, title: "Apply Ansible remediation playbook", description: "Findings #14 and #23 share the same playbook. Run in staging, then prod with --check first." },
          { num: 3, title: "Capture before/after evidence", description: "Screenshots and config diffs uploaded to audit evidence folder in Confluence." },
          { num: 4, title: "Get CISO sign-off", description: "Share evidence package with CISO office and request written approval for auditor submission." },
        ],
      },
      {
        id: "t4", title: "Q4 capacity planning forecast", due: "Fri", category: "Planning",
        steps: [
          { num: 1, title: "Export 90-day utilization from Datadog", description: "CPU, memory, and storage trends across all production clusters." },
          { num: 2, title: "Model 3 growth scenarios", description: "Base (40%), accelerated (60%), contingency (80%). Map to required instance types." },
          { num: 3, title: "Calculate reserved capacity commitments", description: "Identify 1-year vs 3-year RI opportunities. Estimate savings vs. on-demand delta." },
          { num: 4, title: "Present to engineering leadership", description: "1-page brief with cost projections and procurement recommendation." },
        ],
      },
    ],
    emails: [
      { id: "e1", sender: "PagerDuty", senderRole: "Monitoring Alert", subject: "CRITICAL: prod-db-03 disk at 94%", gist: "Threshold crossed at 09:01. At current write rate, storage exhausted in approximately 4 hours. Bridge link included.", time: "9:01 AM", initials: "PD", color: "#dc2626" },
      { id: "e2", sender: "Lisa Huang", senderRole: "Change Advisory Board", subject: "CR #8821 awaiting risk assessment", gist: "One of two required approvals received. Your updated risk assessment is the final blocker before tonight's window.", time: "8:45 AM", initials: "LH", color: "#0891b2" },
      { id: "e3", sender: "Compliance Team", senderRole: "Security & Compliance", subject: "Audit prep — evidence upload deadline", gist: "3 CIS benchmark findings need remediation evidence in the audit portal by Friday 5pm or they become findings.", time: "Yesterday", initials: "CT", color: "#7c3aed" },
    ],
    meetings: [
      { id: "m1", title: "P1 Incident Bridge", startTime: "9:30", endTime: "10:00", type: "video", attendees: "On-call team (4)" },
      { id: "m2", title: "Change Advisory Board", startTime: "11:00", endTime: "11:30", type: "video", attendees: "CAB members (6)" },
      { id: "m3", title: "Infra Weekly Sync", startTime: "13:00", endTime: "14:00", type: "video", attendees: "Infra team (9)" },
      { id: "m4", title: "Compliance pre-audit walkthrough", startTime: "15:00", endTime: "15:45", type: "video", attendees: "CISO, Auditors (3)" },
    ],
    suggestions: [
      { id: "s1", text: "The pg_wal directory is 380GB — 60% of total disk usage on prod-db-03. archive_cleanup_command broke during the Postgres 16 upgrade in March.", action: "Fix WAL config", kind: "warning" },
      { id: "s2", text: "All 12 patch targets have been validated in staging. Change request can be submitted now with high confidence for tonight's window.", action: "Submit CR", kind: "success" },
      { id: "s3", text: "CIS findings #14 and #23 share the same Ansible remediation playbook. One run resolves both — cuts your compliance work in half.", action: "View playbook", kind: "info" },
    ],
  },
  people: {
    name: "Morgan Rivera", firstName: "Morgan", title: "People & Culture / L&D", avatar: "MR",
    priorities: [
      { id: "p1", title: "Offer to Jamie Tran (Sr. SWE L5) expires TODAY at 5pm", urgency: "critical", context: "Competing FAANG offer on table" },
      { id: "p2", title: "Platform Eng interview loop stalled — 2 panelists dropped out", urgency: "high", context: "Candidate waiting 8 days" },
      { id: "p3", title: "Q3 headcount plan approval — $2.1M budget impact", urgency: "high", context: "CHRO review tomorrow 9am" },
      { id: "p4", title: "Q3 DEI metrics report due to leadership by end of week", urgency: "medium", context: "Board presentation Friday" },
    ],
    tasks: [
      {
        id: "t1", title: "Send revised offer to Jamie Tran", due: "Today 3pm", category: "Offer",
        steps: [
          { num: 1, title: "Pull Radford comp benchmarks for Sr. SWE L5", description: "Run model for candidate's location. Check against 75th percentile to ensure competitiveness." },
          { num: 2, title: "Prepare revised offer with comp team", description: "Increase base by $15K, add 1-year cliff accelerator. Get written sign-off from hiring manager and comp." },
          { num: 3, title: "Hiring manager calls candidate first", description: "Personal call before formal letter. Reinforce team culture, mission, and equity upside." },
          { num: 4, title: "Send DocuSign offer letter by 3pm", description: "Generate package with updated terms. Ensure candidate has 2 hours to review before 5pm expiry." },
          { num: 5, title: "Brief recruiter on negotiation guardrails", description: "Prepare response playbook in case of counter-offer. Max authorization is $5K additional base." },
        ],
      },
      {
        id: "t2", title: "Fill interview panel for Platform Eng", due: "Today", category: "Recruiting",
        steps: [
          { num: 1, title: "Identify 2 replacement panelists", description: "Find certified L5 interviewers in Platform org with Thu–Fri availability this week." },
          { num: 2, title: "Run 30-min panel prep call", description: "Brief on job description, behavioral scorecard, and calibration examples for this level." },
          { num: 3, title: "Reschedule candidate Amir Hassan", description: "Candidate has been waiting 8 days. Priority window is Thursday–Friday this week." },
          { num: 4, title: "Lock all 4 panel slots in Greenhouse", description: "Confirm schedule and notify interview coordinator to send calendar invites." },
        ],
      },
      {
        id: "t3", title: "Q3 headcount approval deck for CHRO", due: "Tomorrow 8am", category: "Planning",
        steps: [
          { num: 1, title: "Export 23 open reqs from Workday", description: "Include business justification, hiring manager, target start date, and comp band for each." },
          { num: 2, title: "Map each req to a strategic priority", description: "Classify as critical (must hire Q4), important (hire Q1), or nice-to-have (defer)." },
          { num: 3, title: "Build total cost model", description: "Full comp cost including benefits load (28%) and recruiter fees. Show 12-month run rate." },
          { num: 4, title: "Write CHRO executive brief", description: "One-page summary + appendix. Lead with critical hires and risk of not filling them." },
        ],
      },
      {
        id: "t4", title: "Compile Q3 DEI metrics report", due: "Fri", category: "Reporting",
        steps: [
          { num: 1, title: "Pull representation data from Workday", description: "Gender, ethnicity, and seniority breakdown by org. Compare to Q2 and external benchmarks." },
          { num: 2, title: "Calculate hiring funnel diversity rates", description: "Track diverse candidate rates at application, screen, and offer stages." },
          { num: 3, title: "Write gap analysis and program narrative", description: "Where underrepresentation persists, name the specific programs addressing it in Q4." },
          { num: 4, title: "Share with DEI Council before submitting", description: "Send draft to council for 24-hour review. Incorporate feedback before leadership submission." },
        ],
      },
    ],
    emails: [
      { id: "e1", sender: "Jamie Tran", senderRole: "Candidate — Sr. SWE", subject: "Re: Offer — still waiting to hear", gist: "Competing offer expires Friday. Very excited about the role but needs updated terms confirmed today to make a decision.", time: "8:55 AM", initials: "JT", color: "#059669" },
      { id: "e2", sender: "Chen Wei", senderRole: "Engineering Manager", subject: "Platform Eng interview loop — help needed", gist: "Two panelists cancelled. Candidate Amir Hassan has been waiting 8 days. This is becoming embarrassing for the team.", time: "8:20 AM", initials: "CW", color: "#0891b2" },
      { id: "e3", sender: "Anita Desai", senderRole: "CHRO", subject: "Headcount deck needed by COB tomorrow", gist: "Board asked for Q4 hiring plan at the last minute. Need your deck with cost model before my 9am Thursday meeting.", time: "Yesterday", initials: "AD", color: "#7c3aed" },
    ],
    meetings: [
      { id: "m1", title: "Talent Acquisition Weekly", startTime: "9:00", endTime: "9:45", type: "video", attendees: "Recruiters (7)" },
      { id: "m2", title: "Hiring Mgr: Platform Eng", startTime: "10:00", endTime: "10:30", type: "video", attendees: "Chen Wei" },
      { id: "m3", title: "Offer strategy: Jamie Tran", startTime: "11:00", endTime: "11:20", type: "video", attendees: "Recruiter, HM" },
      { id: "m4", title: "CHRO prep — headcount review", startTime: "15:00", endTime: "15:30", type: "video", attendees: "Anita D." },
    ],
    suggestions: [
      { id: "s1", text: "Jamie Tran's competing offer is from Google. Recommend the hiring manager emphasize equity upside and product scope — they cannot compete on base alone.", action: "Prep call points", kind: "warning" },
      { id: "s2", text: "3 of your 5 highest-priority open roles have been open more than 60 days. Consider a job description refresh — stale copy reduces application quality.", action: "Review JDs", kind: "info" },
      { id: "s3", text: "Q3 diverse hire rate is 38%, up 7 points from Q2. Strong positive signal — worth leading with this in Friday's leadership presentation.", action: "View metrics", kind: "success" },
    ],
  },
  leadership: {
    name: "Taylor Brooks", firstName: "Taylor", title: "Innovation Lead", avatar: "TB",
    priorities: [
      { id: "p1", title: "Approve Q4 roadmap deck before it goes to the exec review", urgency: "critical", context: "Exec review tomorrow 10am" },
      { id: "p2", title: "Review Sam's promotion packet — due to the calibration committee today", urgency: "high", context: "Committee deadline EOD" },
      { id: "p3", title: "Sign off on the platform team's architecture proposal", urgency: "high", context: "Blocking next sprint's kickoff" },
      { id: "p4", title: "3 direct reports have skip-level 1:1s unscheduled this month", urgency: "medium", context: "Monthly cadence slipping" },
    ],
    tasks: [
      {
        id: "t1", title: "Review and approve Q4 roadmap deck", due: "Today", category: "Review",
        steps: [
          { num: 1, title: "Read the full deck end-to-end", description: "Focus on the three strategic bets and their resourcing asks. Flag anything that conflicts with the headcount plan." },
          { num: 2, title: "Check narrative against last quarter's commitments", description: "Confirm carried-over items are explicitly called out rather than quietly dropped." },
          { num: 3, title: "Leave comments for the PM leads", description: "Prioritize feedback on the riskiest bet's success metrics — they're currently too vague to review progress against." },
          { num: 4, title: "Approve or send back with required changes", description: "Give a clear go/no-go so the deck can move to the exec review on schedule." },
        ],
      },
      {
        id: "t2", title: "Review Sam Ortiz's promotion packet", due: "Today", category: "Review",
        steps: [
          { num: 1, title: "Read the self-assessment and peer feedback", description: "Cross-check specific examples against the L5 rubric, especially the 'scope of influence' criterion." },
          { num: 2, title: "Compare against two recent L5 precedent cases", description: "Make sure the bar being applied is consistent with the last two approved promotions." },
          { num: 3, title: "Write the manager's calibration statement", description: "One paragraph, concrete examples, explicit recommendation. This is what the committee reads first." },
          { num: 4, title: "Submit ahead of the calibration meeting", description: "Packet and statement are due in the calibration tool before end of day." },
        ],
      },
      {
        id: "t3", title: "Sign off on platform team's architecture proposal", due: "Tomorrow", category: "Review",
        steps: [
          { num: 1, title: "Read the RFC and prior review comments", description: "Pay particular attention to the migration risk section — that's where the last proposal stalled." },
          { num: 2, title: "Confirm the rollback plan is concrete", description: "Ask for a specific rollback trigger and owner if the current draft is vague." },
          { num: 3, title: "Sync with the platform lead on open questions", description: "15-minute call to resolve anything that would otherwise bounce back for another review cycle." },
          { num: 4, title: "Approve in the RFC tool and unblock sprint planning", description: "Sprint kickoff is waiting on this sign-off." },
        ],
      },
      {
        id: "t4", title: "Schedule skip-level 1:1s with 3 direct reports' teams", due: "This week", category: "People",
        steps: [
          { num: 1, title: "Identify the 3 teams overdue for a skip-level", description: "Cross-reference the last skip-level date per team against the monthly cadence target." },
          { num: 2, title: "Send scheduling holds for 20-minute slots", description: "Keep them informal and low-prep so they don't feel like a status review." },
          { num: 3, title: "Prepare 2-3 open-ended discussion prompts", description: "Focus on team health and blockers rather than project status, which the manager already reports." },
        ],
      },
    ],
    emails: [
      { id: "e1", sender: "Priya Sharma", senderRole: "VP Product", subject: "Q4 roadmap deck — need your sign-off today", gist: "Exec review is tomorrow morning. Please review and approve or flag concerns before end of day so there's time to revise.", time: "8:10 AM", initials: "PS", color: "#7c3aed" },
      { id: "e2", sender: "Sam Ortiz", senderRole: "Senior Engineer", subject: "Promotion packet ready for your review", gist: "Packet and peer feedback are attached. Calibration committee meets today — really appreciate a quick turnaround.", time: "7:40 AM", initials: "SO", color: "#0891b2" },
      { id: "e3", sender: "Devon Ellis", senderRole: "Platform Lead", subject: "Architecture proposal — blocked on your approval", gist: "Sprint planning is waiting on sign-off for the migration proposal. Happy to hop on a call if anything is unclear.", time: "Yesterday", initials: "DE", color: "#059669" },
    ],
    meetings: [
      { id: "m1", title: "Leadership Sync", startTime: "9:00", endTime: "9:30", type: "video", attendees: "Directors (5)" },
      { id: "m2", title: "Promotion Calibration Committee", startTime: "11:00", endTime: "12:00", type: "video", attendees: "Committee (7)" },
      { id: "m3", title: "1:1 with Devon Ellis", startTime: "14:00", endTime: "14:30", type: "video", attendees: "Devon E." },
      { id: "m4", title: "Q4 Roadmap Exec Pre-read", startTime: "15:30", endTime: "16:00", type: "video", attendees: "Priya S., CTO" },
    ],
    suggestions: [
      { id: "s1", text: "Sam Ortiz's promotion packet is strong on delivery examples but light on cross-team influence. Consider asking for one more example before submitting your calibration statement.", action: "Request example", kind: "warning" },
      { id: "s2", text: "The platform team's rollback plan has been the sticking point in two prior review cycles. Confirming it upfront could avoid a third round.", action: "View RFC", kind: "info" },
      { id: "s3", text: "All 3 overdue skip-levels are on teams with recent attrition. Prioritizing these this week could catch issues before they compound.", action: "Schedule now", kind: "success" },
    ],
  },
};
