import type { Representation } from "@ida/representation";

import type { BusinessExtraction } from "../types";
import { resolveAccount } from "./account-linker";

export function extractBusinessInfo(rep: Representation): BusinessExtraction {
  const text = `${rep.title} ${rep.content}`;
  const lower = text.toLowerCase();
  const fromEmail = rep.participants.find((p) => p.role === "from")?.email;

  const account = resolveAccount(text, fromEmail);
  const company = account?.name ?? null;

  let type: BusinessExtraction["type"] = "Other";

  if (lower.includes("tagihan") || lower.includes("invoice") || lower.includes("inv-")) {
    type = "Invoice";
  } else if (lower.includes("meeting") || lower.includes("q3") || lower.includes("planning") || lower.includes("review")) {
    type = "Meeting";
  } else if (lower.includes("proposal")) {
    type = "Proposal";
  } else if (lower.includes("keluhan") || lower.includes("complaint") || lower.includes("urgent")) {
    type = "Complaint";
  } else if (lower.includes("purchase order") || lower.includes("po-") || lower.includes("po ")) {
    type = "Purchase Order";
  } else if (lower.includes("kontrak") || lower.includes("contract")) {
    type = "Contract";
  } else if (lower.includes("pembayaran") || lower.includes("payment")) {
    type = "Payment";
  } else if (lower.includes("reminder") || lower.includes("jatuh tempo")) {
    type = "Reminder";
  } else {
    type = "Information";
  }

  const summary =
    rep.title.length > 60 ? `${rep.title.substring(0, 57)}...` : rep.title;

  let amount: number | undefined;
  const amountMatch = lower.match(/rp\s*([\d.]+)/i);
  if (amountMatch) {
    amount = Number.parseInt(amountMatch[1].replace(/\./g, ""), 10);
  }

  let priority: BusinessExtraction["priority"] = "medium";
  if (
    lower.includes("urgent") ||
    lower.includes("segera") ||
    lower.includes("jatuh tempo")
  ) {
    priority = "high";
  }

  return {
    company,
    companyId: account?.id,
    type,
    summary,
    amount,
    date: rep.timestamp.toISOString().split("T")[0],
    priority,
    stakeholder: rep.participants.find((p) => p.role === "from")?.name,
  };
}