import type { Representation } from "@ida/representation";

import type { BusinessExtraction } from "../types";

const KNOWN_COMPANIES = [
  "pln",
  "mayora",
  "telkom",
  "bca",
  "mandiri",
  "bri",
  "bni",
  "gojek",
  "grab",
  "tokopedia",
  "shopee",
];

export function extractBusinessInfo(rep: Representation): BusinessExtraction {
  const text = `${rep.title} ${rep.content}`.toLowerCase();
  const originalTitle = rep.title;

  let company: string | null = null;
  for (const candidate of KNOWN_COMPANIES) {
    if (text.includes(candidate)) {
      company = candidate.toUpperCase();
      break;
    }
  }

  let type: BusinessExtraction["type"] = "Other";

  if (text.includes("tagihan") || text.includes("invoice") || text.includes("rp ")) {
    type = "Invoice";
  } else if (text.includes("meeting") || text.includes("q3") || text.includes("planning")) {
    type = "Meeting";
  } else if (text.includes("proposal")) {
    type = "Proposal";
  } else if (text.includes("keluhan") || text.includes("complaint")) {
    type = "Complaint";
  } else if (text.includes("purchase order") || text.includes("po ")) {
    type = "Purchase Order";
  } else if (text.includes("kontrak") || text.includes("contract")) {
    type = "Contract";
  } else if (text.includes("pembayaran") || text.includes("payment")) {
    type = "Payment";
  } else if (text.includes("reminder") || text.includes("jatuh tempo")) {
    type = "Reminder";
  } else {
    type = "Information";
  }

  const summary =
    originalTitle.length > 60
      ? `${originalTitle.substring(0, 57)}...`
      : originalTitle;

  let amount: number | undefined;
  const amountMatch = text.match(/rp\s*([\d.]+)/i);
  if (amountMatch) {
    amount = Number.parseInt(amountMatch[1].replace(/\./g, ""), 10);
  }

  let priority: BusinessExtraction["priority"] = "medium";
  if (
    text.includes("urgent") ||
    text.includes("segera") ||
    text.includes("jatuh tempo")
  ) {
    priority = "high";
  }

  return {
    company,
    type,
    summary,
    amount,
    date: rep.timestamp.toISOString().split("T")[0],
    priority,
  };
}