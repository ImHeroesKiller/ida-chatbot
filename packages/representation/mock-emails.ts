import type { GmailEmailInput } from "./types";

/** Demo seed data for investor vertical slice when Gmail OAuth is unavailable. */
export const DEMO_GMAIL_EMAILS: GmailEmailInput[] = [
  {
    id: "demo-pln-001",
    subject: "RE: Q3 Planning — PLN Grid Modernization",
    from: "Budi Santoso <budi.santoso@pln.co.id>",
    date: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    snippet:
      "Following our meeting last week, PLN would like to confirm the proposal timeline for grid modernization phase 2.",
  },
  {
    id: "demo-invoice-203",
    subject: "Invoice #INV-203 — PT ABC Construction",
    from: "Finance ABC <finance@abcconstruction.co.id>",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    snippet:
      "Tagihan invoice INV-203 sebesar Rp 1.200.000 jatuh tempo besok. Mohon konfirmasi pembayaran.",
  },
  {
    id: "demo-alpha-stalled",
    subject: "URGENT: Project Alpha — No update for 9 days",
    from: "PM Office <pm@internal.ida>",
    date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    snippet:
      "Project Alpha deliverables pending. Budget Rp 45M. Complaint from stakeholder — segera follow up.",
  },
  {
    id: "demo-mayora-po",
    subject: "Purchase Order PO-8821 — Mayora",
    from: "Procurement Mayora <procurement@mayora.com>",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    snippet:
      "Mayora issued purchase order PO-8821 for distribution analytics module. Contract attached.",
  },
  {
    id: "demo-telkom-meeting",
    subject: "Meeting invite: Telkom Enterprise Review Q3",
    from: "Calendar Telkom <noreply@telkom.co.id>",
    date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    snippet:
      "Telkom scheduled Q3 enterprise review meeting. Please confirm attendance for planning session.",
  },
];