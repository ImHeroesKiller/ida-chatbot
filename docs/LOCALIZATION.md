# IDA Enterprise Localization Guide

Sprint 4.1 introduces client-side localization for the `/demo` and `/enterprise` experience. Default locale is **English (Presentation Mode)** for investor demos. **Bahasa Indonesia (Internal Mode)** is one click away — no page reload.

## Architecture

```
messages/
  en/
    enterprise.json    # Nav, brief, memory, import, modes
    workforce.json     # Digital Workforce, perspectives, workers
    vocabulary.json    # Business term dictionary (tv())
    ask.json           # Ask IDA UI strings
    ask-responses.json # Ask IDA API response templates
    content.json       # Brief cards, relative time, metrics
  id/
    (same structure)
```

Runtime wiring:

- `lib/enterprise/i18n/messages.ts` — static catalog, default `en`
- `components/enterprise/i18n/enterprise-locale-provider.tsx` — React context, `localStorage`
- `useEnterpriseLocale()` — `t()`, `tv()`, `format.*`, `setLocale()`

Landing pages (`/[locale]`) continue using `next-intl` with flat `messages/en.json`. Enterprise demo uses the modular `messages/{locale}/` tree independently.

## Modes

| Mode | Locale | Label | Audience |
|------|--------|-------|----------|
| Presentation Mode | `en` | Presentation | Investors, global demos |
| Internal Mode | `id` | Internal | Indonesian teams, internal reviews |

Switch via topbar **Presentation / Internal** toggle. Persists to `localStorage` key `ida-enterprise-locale`.

## Usage in components

```tsx
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";

function MyView() {
  const { t, tv, format, locale } = useEnterpriseLocale();

  return (
    <>
      <h1>{t("enterprise", "brief.eyebrow")}</h1>
      <p>{tv("organizationMemory")}</p>
      <span>{format.relative("2 min ago")}</span>
      <span>{format.money("Rp 4.2B")}</span>
    </>
  );
}
```

### `t(scope, key, params?)`

Nested dot-path lookup into `enterprise`, `workforce`, `ask`, or `content` scopes.

### `tv(term)`

Business vocabulary from `vocabulary.json` — use for consistent terms:

| Key | EN | ID |
|-----|----|----|
| `organizationMemory` | Organization Memory | Pengetahuan Organisasi |
| `executiveBrief` | Executive Brief | Ringkasan Eksekutif |
| `digitalWorkforce` | Digital Workforce | Tenaga Kerja Digital |

### `format.*`

| Helper | Purpose |
|--------|---------|
| `format.money(label)` | Locale-aware IDR formatting |
| `format.number(n)` | `Intl.NumberFormat` |
| `format.date(d)` | Medium date style |
| `format.time(d)` | Short time |
| `format.relative(label)` | Maps `"2 min ago"` → localized string |

## Tone of voice

- **English:** Microsoft / Linear / Notion / Stripe — clear, confident, no jargon stacking
- **Indonesian:** Natural business Bahasa — not literal translation. Prefer *Pengetahuan Organisasi* over *Memori Organisasi*, *Ringkasan Eksekutif* over *Brief Eksekutif*

## Adding strings

1. Add key to `messages/en/{file}.json`
2. Add natural Indonesian equivalent to `messages/id/{file}.json`
3. Use `t("enterprise", "your.key")` in the component
4. For shared business terms, add to both `vocabulary.json` files and use `tv()`

## Ask IDA localization

Client sends `{ q, locale }` to `POST /api/reality/ask`. Server uses `lib/enterprise/i18n/ask-format.ts` with `ask-responses.json` templates.

## Digital Workforce workers

Worker names live in `workforce.json` under `workers.{id}.name`. IDs stay stable in code; display names change per locale:

| ID | EN | ID |
|----|----|----|
| `proposal-analyst` | Proposal Analyst | Analis Proposal |
| `contract-reviewer` | Contract Reviewer | Peninjau Kontrak |

## Executive Brief cards

Card copy is keyed by mock ID in `content.json` → `briefCards.{id}`. `localizeBriefCards()` merges at runtime.

## Checklist for new views

- [ ] All user-visible strings in `messages/{locale}/`
- [ ] Empty states use natural copy, not literal EN→ID
- [ ] Dates, money, relative time via `format.*`
- [ ] Business terms via `tv()`, not hardcoded
- [ ] Test both Presentation and Internal modes without reload