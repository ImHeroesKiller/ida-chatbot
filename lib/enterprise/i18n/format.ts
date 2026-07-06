import type { EnterpriseLocale } from "./types";

const LOCALE_MAP: Record<EnterpriseLocale, string> = {
  en: "en-US",
  id: "id-ID",
};

export function getIntlLocale(locale: EnterpriseLocale): string {
  return LOCALE_MAP[locale];
}

export function formatMoney(
  locale: EnterpriseLocale,
  amount: number,
  currency = "IDR",
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactMoney(locale: EnterpriseLocale, label: string): string {
  const match = label.match(/Rp\s*([\d,.]+)\s*([MBK])?/i);
  if (!match) return label;

  const raw = match[1].replace(/,/g, "");
  const num = Number(raw);
  if (Number.isNaN(num)) return label;

  const suffix = match[2]?.toUpperCase();
  const multiplier =
    suffix === "B" ? 1_000_000_000 : suffix === "M" ? 1_000_000 : suffix === "K" ? 1_000 : 1;

  return formatMoney(locale, num * multiplier);
}

export function formatNumber(
  locale: EnterpriseLocale,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), options).format(value);
}

export function formatPercent(locale: EnterpriseLocale, value: number): string {
  return formatNumber(locale, value / 100, { style: "percent", maximumFractionDigits: 0 });
}

export function formatDate(
  locale: EnterpriseLocale,
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    dateStyle: "medium",
    ...options,
  }).format(d);
}

export function formatTime(
  locale: EnterpriseLocale,
  date: Date | string | number,
): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatRelativeTimeKey(
  locale: EnterpriseLocale,
  key: string,
  count?: number,
  messages?: Record<string, string>,
): string {
  const defaults: Record<EnterpriseLocale, Record<string, string>> = {
    en: {
      justNow: "Just now",
      minutesAgo: "{count} min ago",
      hoursAgo: "{count} hours ago",
      hourAgo: "1 hour ago",
      yesterday: "Yesterday",
      today: "Today",
      daysAgo: "{count} days ago",
    },
    id: {
      justNow: "Baru saja",
      minutesAgo: "{count} menit lalu",
      hoursAgo: "{count} jam lalu",
      hourAgo: "1 jam lalu",
      yesterday: "Kemarin",
      today: "Hari ini",
      daysAgo: "{count} hari lalu",
    },
  };

  const template = messages?.[key] ?? defaults[locale][key] ?? key;
  return count !== undefined ? template.replace("{count}", String(count)) : template;
}

/** Map legacy English mock strings to relative-time keys. */
export function localizeRelativeLabel(
  locale: EnterpriseLocale,
  label: string,
  relativeMessages: Record<string, string>,
): string {
  const patterns: Array<{ re: RegExp; key: string; count?: number }> = [
    { re: /^just now$/i, key: "justNow" },
    { re: /^(\d+)\s*min(?:ute)?s?\s*ago$/i, key: "minutesAgo" },
    { re: /^1\s*hour\s*ago$/i, key: "hourAgo" },
    { re: /^(\d+)\s*hours?\s*ago$/i, key: "hoursAgo" },
    { re: /^yesterday$/i, key: "yesterday" },
    { re: /^today$/i, key: "today" },
    { re: /^(\d+)\s*days?\s*ago$/i, key: "daysAgo" },
  ];

  for (const { re, key } of patterns) {
    const m = label.match(re);
    if (m) {
      const count = m[1] ? Number(m[1]) : undefined;
      return formatRelativeTimeKey(locale, key, count, relativeMessages);
    }
  }

  return label;
}