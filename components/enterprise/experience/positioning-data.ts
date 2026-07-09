export const TRADITIONAL_AI_VS_IDA = [
  {
    dimension: "Organization Memory",
    traditional: "Session-only — forgets after each chat",
    ida: "Persistent memory built from emails, meetings, decisions, and commercial records",
  },
  {
    dimension: "Context",
    traditional: "Generic answers without account or stakeholder history",
    ida: "Full organizational context — who said what, when, and why it matters",
  },
  {
    dimension: "Insights",
    traditional: "Surface-level summaries with no cross-linking",
    ida: "Cross-linked intelligence across accounts, initiatives, risks, and commitments",
  },
  {
    dimension: "Decisions",
    traditional: "Suggestions with no audit trail or governance",
    ida: "Governed decision records with ownership, traceability, and executive briefs",
  },
] as const;

export const HOW_IDA_THINKS_STEPS = [
  { id: "understand", label: "Understand", desc: "Unified enterprise context from applications, communications, and Organization Memory" },
  { id: "analyze", label: "Analyze", desc: "AI-powered analysis of risks, opportunities, and cross-account signals" },
  { id: "recommend", label: "Recommend", desc: "Clear options with rationale, impact, and confidence — decision packages" },
  { id: "decide", label: "Decide", desc: "Governed decisions with policy, authority, and human approval when required" },
  { id: "orchestrate", label: "Orchestrate", desc: "Coordinate Human Workforce and Digital Workforce to execute at scale" },
  { id: "learn", label: "Learn", desc: "Outcomes feed Organization Memory and improve the next decision" },
] as const;

export const COPILOT_COMPARISON = [
  { capability: "Organizational memory", copilot: "No persistent enterprise memory", ida: "Unified knowledge layer across all interactions" },
  { capability: "Account-level context", copilot: "Generic — no CRM or project linkage", ida: "Full account intelligence (e.g. PT PLN Indonesia Power)" },
  { capability: "Cross-system insights", copilot: "Isolated to Microsoft 365", ida: "Cross-links emails, meetings, projects, and decisions" },
  { capability: "Executive briefings", copilot: "Manual prompting required", ida: "Automated brief with critical issues and actions" },
  { capability: "Decision governance", copilot: "No audit trail or ownership", ida: "Logged decisions with accountability and traceability" },
  { capability: "Relationship mapping", copilot: "Not available", ida: "Living organization map with stakeholder intelligence" },
  { capability: "Commercial awareness", copilot: "Cannot track POs, invoices, pipeline", ida: "Commercial records linked to delivery risk" },
] as const;

export const PLN_EVERYTHING_IDA_KNOWS = {
  account: "PT PLN Indonesia Power",
  health: 94,
  lastSynthesized: "6 Jul 2026, 10:42 WIB",
  categories: {
    people: {
      label: "People",
      count: 14,
      items: [
        { title: "Budi Santoso", detail: "VP Strategic Accounts — primary relationship owner, 23 engagements" },
        { title: "Dr. Hendra Wijaya", detail: "Director of Engineering — SCADA technical authority" },
        { title: "Maya Kusuma", detail: "Head of Procurement — commercial annex counterparty" },
        { title: "Agus Firmansyah", detail: "Project Director — Phase II delivery sponsor" },
      ],
    },
    meetings: {
      label: "Meetings",
      count: 6,
      items: [
        { title: "Technical Design Review", detail: "3 Jul 2026 — 4 action items, 3 resolved" },
        { title: "Commercial Annex Working Session", detail: "5 Jul 2026 — pricing schedule aligned" },
        { title: "Board Prep Briefing", detail: "Scheduled 10 Jul 2026 — 5 attendees" },
        { title: "Q3 Steering Committee", detail: "14 Jul 2026 — Phase II go/no-go" },
      ],
    },
    emails: {
      label: "Emails",
      count: 23,
      items: [
        { title: "RE: SCADA Phase II — Commercial Annex v4", detail: "18 messages this week — procurement thread" },
        { title: "FW: SLA Appendix — technical sign-off", detail: "Engineering approval pending Hendra Wijaya" },
        { title: "RE: Board submission timeline", detail: "Target 11 Jul — Budi Santoso confirmed" },
        { title: "RE: Integration architecture — Phase II", detail: "12 messages — API gateway scope clarified" },
      ],
    },
    projects: {
      label: "Projects",
      count: 2,
      items: [
        { title: "SCADA Modernization Phase II", detail: "Rp 4.2B · 71% complete · On track" },
        { title: "Operations Intelligence Pilot", detail: "Rp 180M · 34% complete · Planning" },
      ],
    },
    risks: {
      label: "Risks",
      count: 2,
      items: [
        { title: "Board submission window", detail: "Commercial annex must lock by 9 Jul for 11 Jul board review" },
        { title: "Resource overlap Q3", detail: "Telkom audit renewal may compete for shared delivery lead" },
      ],
    },
    decisions: {
      label: "Decisions",
      count: 3,
      items: [
        { title: "Technical design approved", detail: "3 Jul 2026 — architecture review signed off" },
        { title: "Procurement aligned on annex structure", detail: "5 Jul 2026 — pricing schedule accepted" },
        { title: "Board submission date confirmed", detail: "11 Jul 2026 — pending final commercial lock" },
      ],
    },
    commitments: {
      label: "Commitments",
      count: 4,
      items: [
        { title: "Deliver commercial annex v5 by 9 Jul", detail: "Owner: IDA account team · Due in 3 days" },
        { title: "Executive summary for board review", detail: "Owner: Budi Santoso · Due 10 Jul" },
        { title: "SLA appendix engineering sign-off", detail: "Owner: Hendra Wijaya · Due 8 Jul" },
        { title: "Phase II kickoff readiness assessment", detail: "Owner: Agus Firmansyah · Due 15 Jul" },
      ],
    },
  },
} as const;

export const ENTERPRISE_SCALE_METRICS = [
  { value: "2.4M+", label: "Knowledge records indexed", sub: "Communications, meetings, decisions" },
  { value: "Rp 6.5B", label: "Pipeline under management", sub: "4 enterprise accounts" },
  { value: "147", label: "Indexed relationships", sub: "Stakeholders & counterparties" },
  { value: "91%", label: "Organization intelligence", sub: "Real-time health score" },
] as const;