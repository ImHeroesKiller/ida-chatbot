/** Maps email domains and known addresses to enterprise accounts. */
export const ACCOUNT_DIRECTORY: Array<{
  id: string;
  name: string;
  domains: string[];
  emails?: string[];
  keywords: string[];
}> = [
  {
    id: "pln",
    name: "PT PLN Indonesia Power",
    domains: ["pln.co.id", "plnindonesiapower.co.id"],
    emails: ["support@pln.co.id", "budi.santoso@pln.co.id"],
    keywords: ["pln", "indonesia power", "scada", "grid modernization"],
  },
  {
    id: "mayora",
    name: "PT Mayora Indah Tbk",
    domains: ["mayora.com", "mayoraindah.co.id"],
    keywords: ["mayora", "po-8821", "distribution analytics"],
  },
  {
    id: "telkom",
    name: "PT Telkom Indonesia (Persero) Tbk",
    domains: ["telkom.co.id"],
    keywords: ["telkom", "enterprise review", "network audit"],
  },
  {
    id: "hutama",
    name: "PT Hutama Karya (Persero)",
    domains: ["hutamakarya.com", "abcconstruction.co.id"],
    keywords: ["hutama karya", "segment 7", "inv-203", "abc construction"],
  },
];

export type ResolvedAccount = {
  id: string;
  name: string;
  matchedBy: "email" | "domain" | "keyword";
};

export function resolveAccountFromEmail(email: string): ResolvedAccount | null {
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split("@")[1];

  for (const account of ACCOUNT_DIRECTORY) {
    if (account.emails?.includes(normalized)) {
      return { id: account.id, name: account.name, matchedBy: "email" };
    }
    if (domain && account.domains.includes(domain)) {
      return { id: account.id, name: account.name, matchedBy: "domain" };
    }
  }
  return null;
}

export function resolveAccountFromText(text: string): ResolvedAccount | null {
  const lower = text.toLowerCase();
  for (const account of ACCOUNT_DIRECTORY) {
    if (account.keywords.some((kw) => lower.includes(kw))) {
      return { id: account.id, name: account.name, matchedBy: "keyword" };
    }
  }
  return null;
}

export function resolveAccount(
  text: string,
  email?: string,
): ResolvedAccount | null {
  if (email) {
    const byEmail = resolveAccountFromEmail(email);
    if (byEmail) return byEmail;
  }
  return resolveAccountFromText(text);
}