/** Official AgentFlow AI v1.0 workflow diagram from Technical Specification §8 */
export const AGENTFLOW_SPEC_MERMAID = `flowchart TD
A[User: Chat + Upload Documents] --> B[LLM Analysis & Validation]
B --> C[Propose Automation Workflow]
C --> D{User Approve?}
D -->|No| C
D -->|Yes| E[Request Company Templates]
E --> F[User Upload Templates]
F --> G[Validate Templates & Inject Placeholders]
G --> H[Execute in Isolated Sandbox]
H --> I[Document Processing + Playwright Automation]
I --> J[LangGraph Branched Execution + Lead Time Handling]
J --> K[Generate Final Documents & Reports]
K --> L[Notify User + Store Audit Logs]
L --> M{More Tasks?}
M -->|Yes| A
M -->|No| N[Workflow Complete]`;

export const AGENTFLOW_TECH_STACK = [
  { layer: "Presentation", tech: "Next.js + Vercel", role: "Chat UI, upload, approval, progress, artifacts" },
  { layer: "Orchestration", tech: "LangGraph + LLM", role: "Stateful workflow, branching, approval gates" },
  { layer: "Execution", tech: "E2B (prototype)", role: "Isolated Python sandbox, scoped FS & network" },
  { layer: "Tools", tech: "python-docx, openpyxl, Playwright", role: "Document I/O, placeholder injection, browser automation" },
  { layer: "State", tech: "Memory / Redis checkpointer", role: "Workflow persistence, retry, recovery" },
  { layer: "Observability", tech: "Structured JSON logs", role: "Audit trail, correlation IDs" },
] as const;