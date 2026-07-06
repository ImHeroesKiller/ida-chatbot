import type { GmailEmailInput } from "./types";

/** Demo seed emails when Gmail OAuth is unavailable — realistic PLN / enterprise context. */
export const DEMO_GMAIL_EMAILS: GmailEmailInput[] = [
  {
    id: "demo-pln-001",
    subject: "RE: SCADA Phase II — Commercial Annex v4",
    from: "Budi Santoso <budi.santoso@pln.co.id>",
    date: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    snippet:
      "Following our technical design review, PLN Indonesia Power would like to confirm the commercial annex for SCADA Modernization Phase II. Contract value Rp 4.200.000.000. Board submission targeted 11 July 2026.",
  },
  {
    id: "demo-pln-support",
    subject: "Support: Integration gateway handover",
    from: "PLN Support <support@pln.co.id>",
    date: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    snippet:
      "Engineering team requests confirmation on API gateway scope for Phase II. Deadline for SLA appendix sign-off: 8 July 2026. Contact: Hendra Wijaya.",
  },
  {
    id: "demo-hutama-inv",
    subject: "Invoice INV-203 — PT Hutama Karya (Persero)",
    from: "Rina Wijaya <rina.wijaya@hutamakarya.com>",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    snippet:
      "Invoice INV-203 for Toll Road Segment 7 milestone 3 — Rp 127.000.000. Payment due 7 July 2026. URGENT confirmation required.",
  },
  {
    id: "demo-mayora-po",
    subject: "Purchase Order PO-8821 — Mayora Indah",
    from: "Siti Rahmawati <siti.rahmawati@mayora.com>",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    snippet:
      "Mayora issued purchase order PO-8821 for National Distribution Analytics Platform. Value Rp 850.000.000. Kickoff meeting scheduled.",
  },
  {
    id: "demo-telkom-meeting",
    subject: "Meeting invite: Telkom Enterprise Review Q3",
    from: "Agung Prasetyo <agung.prasetyo@telkom.co.id>",
    date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    snippet:
      "Telkom scheduled Q3 enterprise network audit renewal review. Renewal scope Rp 1.200.000.000. Please confirm attendance.",
  },
];