import type { Representation } from "@ida/representation";

import type { BusinessExtraction } from "../types";
import { resolveAccount } from "./account-linker";

const DEADLINE_PATTERNS = [
  /due\s+(\d{1,2}\s+\w+\s+\d{4})/i,
  /jatuh tempo\s+(\d{1,2}\s+\w+\s+\d{4})/i,
  /deadline[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
  /due\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
];

const STAKEHOLDER_PATTERNS = [
  /(?:owner|pic|contact|attendees?)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
  /(?:from|prepared by)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
];

export function extractFromDocument(rep: Representation): BusinessExtraction {
  const text = `${rep.title}\n${rep.content}`;
  const lower = text.toLowerCase();
  const fromEmail = rep.participants.find((p) => p.role === "from")?.email;

  const account = resolveAccount(text, fromEmail);
  const company = account?.name ?? null;

  let type: BusinessExtraction["type"] = "Other";
  if (rep.metadata.docKind === "pdf") {
    if (lower.includes("invoice") || lower.includes("tagihan")) type = "Invoice";
    else if (lower.includes("proposal") || lower.includes("quotation")) type = "Proposal";
    else if (lower.includes("contract") || lower.includes("kontrak")) type = "Contract";
    else if (lower.includes("purchase order") || lower.includes("po ")) type = "Purchase Order";
    else type = "Information";
  } else if (rep.metadata.docKind === "docx") {
    if (lower.includes("minutes") || lower.includes("meeting") || lower.includes("notulen")) {
      type = "Meeting";
    } else if (lower.includes("commitment") || lower.includes("action item")) {
      type = "Information";
    } else {
      type = "Meeting";
    }
  }

  let amount: number | undefined;
  const amountMatch = text.match(/rp\s*([\d.,]+)/i);
  if (amountMatch) {
    amount = Number.parseInt(amountMatch[1].replace(/[.,]/g, ""), 10);
  }

  let deadline: string | undefined;
  for (const pattern of DEADLINE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      deadline = match[1];
      break;
    }
  }

  let stakeholder: string | undefined;
  for (const pattern of STAKEHOLDER_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      stakeholder = match[1];
      break;
    }
  }

  let priority: BusinessExtraction["priority"] = "medium";
  if (lower.includes("urgent") || lower.includes("segera") || deadline) {
    priority = "high";
  }

  const summary =
    rep.title.length > 80 ? `${rep.title.slice(0, 77)}...` : rep.title;

  return {
    company,
    companyId: account?.id,
    type,
    summary,
    amount,
    date: rep.timestamp.toISOString().split("T")[0],
    deadline,
    stakeholder,
    priority,
  };
}