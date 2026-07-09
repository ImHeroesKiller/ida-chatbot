/** One core message — used consistently across landing, demo, and all views. */
export const IDA_CORE_MESSAGE =
  "The operating system for enterprise decisions and digital workforce.";

export const LANDING_FOUR_QUESTIONS = [
  {
    id: "what",
    question: "What is IDA?",
    answer:
      "IDA is the Enterprise Decision Operating System — Intelligent Decision Automation that unites Human Workforce and Digital Workforce so leaders make trusted decisions with full organizational context.",
  },
  {
    id: "who",
    question: "Who is it for?",
    answer:
      "CEOs and leadership teams at large enterprises who need governed, decision-ready intelligence — not another chat window for individuals.",
  },
  {
    id: "why-not",
    question: "Why not ChatGPT or Copilot?",
    answer:
      "Those tools answer one-off questions. IDA is a Decision Intelligence Core with Organization Memory, governance, and orchestration of human and digital workforces.",
  },
  {
    id: "outcome",
    question: "What do you get?",
    answer:
      "Information → Decisions → Execution → Value: decision packages, executive briefs, and coordinated action from real enterprise activity — not generic AI answers.",
  },
] as const;

export const TRUST_SIGNALS = [
  {
    id: "enterprise",
    label: "Enterprise-ready",
    detail: "Built for regulated industries — energy, telecom, and infrastructure.",
  },
  {
    id: "human",
    label: "Humans in control",
    detail: "IDA recommends. Leaders decide. Every action has an owner.",
  },
  {
    id: "audit",
    label: "Full audit trail",
    detail: "Every briefing, decision, and change is recorded and traceable.",
  },
] as const;

export const INVESTOR_FAQ = [
  {
    id: "chatgpt",
    question: "How is IDA different from ChatGPT?",
    answer:
      "ChatGPT answers questions in isolation and forgets your context. IDA builds persistent organizational memory — it knows your accounts, stakeholders, projects, and history, then surfaces what leaders need today.",
  },
  {
    id: "copilot",
    question: "How is IDA different from Microsoft Copilot?",
    answer:
      "Copilot assists individuals inside Microsoft 365. IDA operates at organizational scale — cross-linking accounts like PT PLN Indonesia Power, commercial records, delivery risk, and executive briefings in one system.",
  },
  {
    id: "data",
    question: "Where does IDA get its data?",
    answer:
      "From organizational activity your enterprise already generates — emails, meetings, project updates, commercial records, and decisions. IDA indexes and connects them; it does not require replacing existing systems.",
  },
  {
    id: "decisions",
    question: "Does IDA make decisions automatically?",
    answer:
      "No. IDA prepares intelligence and recommended actions. Humans retain final authority. Every decision is logged with ownership and a complete audit trail.",
  },
  {
    id: "control",
    question: "Who is in control?",
    answer:
      "Always the leadership team. IDA is an intelligence layer — it surfaces context, risks, and opportunities. Approval, commitment, and accountability stay with people.",
  },
  {
    id: "security",
    question: "Is it enterprise-ready?",
    answer:
      "Yes. IDA is designed for enterprise governance — role-based access, audit trails, human-in-the-loop design, and deployment within your security perimeter.",
  },
  {
    id: "demo",
    question: "Is this real data in the demo?",
    answer:
      "The demo uses realistic mock data modeled on Indonesian enterprise accounts (PLN Indonesia Power, Mayora, Telkom, Hutama Karya) to show how IDA works in production.",
  },
  {
    id: "workforce",
    question: "What is the Digital Workforce?",
    answer:
      "Governed AI agents — Proposal Analyst, Contract Reviewer, Relationship Analyst — that work alongside humans using the same Organization Memory. Their output surfaces in Executive Briefs and Knowledge, visible to every role.",
  },
] as const;

export const PRODUCT_ROADMAP = {
  today: {
    label: "Today",
    tagline: "Enterprise Decision Operating System — live in demo",
    items: [
      { title: "Executive Brief", desc: "Critical issues, opportunities, risks, and recommended actions in one view." },
      { title: "Living Organization", desc: "Relationship map connecting accounts, initiatives, and functions." },
      { title: "Account Intelligence", desc: "Full context per enterprise account — stakeholders, pipeline, delivery." },
      { title: "Organization Memory", desc: "Emails, meetings, commercial records, and decisions — cross-linked." },
      { title: "Global Search", desc: "Find any account, stakeholder, initiative, or knowledge record instantly." },
    ],
  },
  next: {
    label: "Next",
    tagline: "Execution and integration — 6–12 months",
    items: [
      { title: "Digital Workforce", desc: "Proposal Analyst, Contract Reviewer, Relationship Analyst — working alongside humans in demo." },
      { title: "Workflow Integration", desc: "Connect decisions to actions across ERP, CRM, and existing tools." },
      { title: "Live Data Connectors", desc: "Gmail, calendar, and document systems feeding organizational memory." },
      { title: "Multi-Perspective Views", desc: "CEO, CFO, Sales, Project, HR — each role sees what matters, from one intelligence." },
    ],
  },
  future: {
    label: "Future",
    tagline: "Scale, prediction, and ecosystem — 12–24 months",
    items: [
      { title: "Industry Templates", desc: "Pre-built intelligence models for energy, telecom, and infrastructure." },
      { title: "Predictive Intelligence", desc: "Early warning on delivery risk, payment delays, and relationship drift." },
      { title: "Board-Ready Reporting", desc: "Automated executive and board packages from live organizational data." },
      { title: "Partner Ecosystem", desc: "Consulting and SI partners deploying IDA across enterprise portfolios." },
    ],
  },
} as const;

/** Consistent terminology — use across all demo views. */
export const DEMO_TERMS = {
  accounts: "Accounts",
  stakeholders: "Stakeholders",
  initiatives: "Initiatives",
  knowledge: "Organization Memory",
  brief: "Executive Brief",
  organization: "Organization",
} as const;
