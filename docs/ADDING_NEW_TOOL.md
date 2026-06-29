# Menambahkan Tool Baru

Panduan ini mendefinisikan standar pola tool di IDA Chatbot setelah refactor coordinator (Fase 1–4).

## Klasifikasi tool

Pilih klasifikasi sebelum implementasi — menentukan di mana state disimpan dan apakah `onDisable` diperlukan.

| Klasifikasi | Contoh | State utama | `onDisable` | Persist ke `ChatSession` |
|-------------|--------|-------------|-------------|--------------------------|
| **Session-backed** | Worksheet | Dokumen di `chat.worksheet` | Tidak | `worksheet`, `worksheetToolEnabled` |
| **Ephemeral** | Web Search | Hasil di hook; restore dari messages | Ya (clear results) | `webSearchEnabled` saja |
| **Hybrid hook-persisted** | Map, Research | State di hook + patch coordinator | Map: tidak; Research: ya (results) | `mapViewState`, `researchSessions`, dll. |
| **Async panel** | Research (panel) | `isResearching` + `error` + API | Ya | `researchEnabled`, `researchSessions` |

## Struktur folder (wajib)

```
components/chat/tools/<tool-id>/
├── index.ts                 # barrel export
├── <tool-id>-tool.ts        # metadata registry (id, label, enabled)
├── use-<tool-id>.ts         # hook: BaseToolState + lifecycle + state khusus
├── <tool-id>-panel.tsx      # UI sidebar kanan
└── …komponen UI turunan
```

Shared infrastructure (jangan duplikasi):

```
components/chat/tools/
├── base-tool-state.ts       # useBaseToolState, ToolAsyncState, helpers
├── tool-panel-ids.ts        # panel id constants
├── tool-ui-config.ts        # ikon, label i18n, menu kind, rail
├── registry.ts              # feature flag per tool
├── tool-coordinator-config.ts  # hydrate + persist per tool
├── use-tool-runtime.ts      # instantiate hook
└── tool-panel-host.tsx      # render panel
```

## Pola hook (`use-<tool>.ts`)

### 1. Tipe publik

```ts
export interface MyToolHydrationInput extends ToolHydrationInput {
  // field dari ChatSession yang di-restore
}

export type MyTool = BaseToolState &
  BaseToolLifecycle<MyToolHydrationInput> & {
    // state + actions khusus tool
  };
```

### 2. Scaffold dasar — `useBaseToolState`

Semua tool **wajib** memakai `useBaseToolState` untuk armed/panel/hydrate/reset:

```ts
const PANEL_ID = TOOL_PANEL_IDS["my-tool"];

export function useMyTool(): MyTool {
  // --- Tool-specific state ---
  const [data, setData] = useState(...);

  const resetData = useCallback(() => { ... }, []);
  const hydrateData = useCallback((state: MyToolHydrationInput) => { ... }, []);

  // --- Base armed/panel + lifecycle ---
  const base = useBaseToolState<MyToolHydrationInput>(PANEL_ID, {
    onDisable: clearEphemeralData,  // hanya tool ephemeral
    onHydrate: hydrateData,
    onReset: resetData,
  });

  // --- Tool-specific actions ---
  // ...

  return { ...base, data, /* actions */ };
}
```

Urutan section dalam file (konsisten):

1. `Tool-specific state`
2. `Base armed/panel + lifecycle` (`useBaseToolState`)
3. `Tool-specific actions`
4. `return` — urutan: base fields → state khusus → actions → `hydrate` / `resetForNewChat`

### 3. Loading & error (tool async)

Untuk tool yang memanggil API atau menunggu stream:

```ts
import { INITIAL_TOOL_ASYNC_STATE, resetToolAsyncState } from "../base-tool-state";

const [isSearching, setIsSearching] = useState(false);
const [error, setError] = useState<string | null>(null);

// Saat hydrate / reset:
resetToolAsyncState({ setIsLoading: setIsSearching, setError });

// Pola error:
// - set error message ke state
// - set isLoading false di finally
// - panel menampilkan error; jangan throw kecuali caller perlu
```

Nama domain (`isSearching`, `isResearching`) boleh dipakai di tipe publik jika lebih jelas di panel.

### 4. `onDisable` — kapan dipakai

| Pakai `onDisable` | Jangan pakai |
|-------------------|--------------|
| Hasil pencarian / riset sementara | Worksheet (konten di session) |
| Loading flags ephemeral | Map (`viewState` harus tetap untuk persist) |

## Registrasi tool (7 langkah)

### 1. `types.ts` — tambah `ToolId`

```ts
export type ToolId = "worksheet" | "web-search" | "map" | "research" | "my-tool";
```

### 2. `tool-panel-ids.ts`

```ts
export const TOOL_PANEL_IDS = {
  // ...
  "my-tool": "my-tool",
} as const satisfies Record<ToolId, RightSidebarPanel>;
```

### 3. `registry.ts` — metadata + feature flag

```ts
export const myTool: Tool = {
  id: "my-tool",
  label: "My Tool",
  enabled: true, // false = hidden dari menu/rail
};
```

### 4. `tool-ui-config.ts` — ikon & perilaku menu

```ts
"my-tool": {
  icon: MyIcon,
  labelKey: "toolsMyTool", // tambah key di lib/i18n.ts
  kind: "toggle-my-tool",    // atau "open-panel"
  railPanel: "my-tool",
},
```

Tambahkan handler kind baru di `use-tool-ui-actions.ts` hanya jika `kind` tidak mengikuti pola `toggle-*` yang sudah generik.

### 5. `tool-coordinator-config.ts`

- Entry di `buildToolRuntime`
- Case di `hydrateToolFromChat` (pakai `resolveToolEnabled`)
- Case di `getToolPersistFields`
- Tambah field di `ToolRuntimeBundle` + `use-tool-runtime.ts`

### 6. `tool-panel-host.tsx` — render panel

### 7. `lib/chat-tools.ts` — `RightSidebarPanel` union (jika panel id baru)

## Persistence: localStorage + Supabase

Alur persist **tidak** dilakukan di hook tool. Coordinator + chat store yang menangani.

```
Hook state change
  → useChatSessionSync effect
  → persistCurrentChat({ ...messages, ...tools.getPersistPatch() })
  → chat-store (localStorage per user/device)
  → sync-sessions → Supabase (jika authenticated)
```

### Menambah field persist baru

1. **`ChatSession`** di `lib/chat-store.ts` — tambah field + default di `createEmptyChat` / `normalizeChatSession`
2. **`ToolPersistPatch`** di `coordinator-types.ts`
3. **`getToolPersistFields`** di `tool-coordinator-config.ts`
4. **`hydrateToolFromChat`** — restore ke hook via `tool.hydrate({ ... })`
5. **Supabase migration** — kolom JSONB/boolean di `ida_chat_sessions`
6. **`lib/session-store/server.ts`** — map row ↔ `ChatSession`

### Contoh field per tool saat ini

| Tool | Enabled flag | Data persist |
|------|--------------|--------------|
| Worksheet | `worksheetToolEnabled` | `worksheet` (dokumen) |
| Web Search | `webSearchEnabled` | — (hasil di `messages`) |
| Research | `researchEnabled` | `researchSessions` |
| Map | `mapEnabled` | `mapViewState` |
| Semua | `activeRightPanel` | panel yang terbuka |

## Error handling di panel

Panel **wajib** menangani tiga keadaan:

1. **Loading** — skeleton / spinner (`isSearching`, `isResearching`, …)
2. **Error** — pesan + opsi retry jika relevan
3. **Empty** — CTA atau penjelasan singkat

Contoh referensi: `web-search-panel.tsx`, `research-panel.tsx`.

## Checklist sebelum merge

- [ ] `useBaseToolState` dipakai; tidak ada duplikasi `createBaseToolActions` manual
- [ ] `hydrate` / `resetForNewChat` simetris (semua state khusus di-reset)
- [ ] `onDisable` hanya jika ephemeral
- [ ] Terdaftar di registry, ui-config, coordinator-config, runtime, panel-host
- [ ] Field `ChatSession` + migration Supabase (jika persist baru)
- [ ] i18n keys untuk label menu/panel
- [ ] `npx tsc --noEmit` lulus

## Referensi implementasi

| Tool | File hook | Klasifikasi |
|------|-----------|-------------|
| Worksheet | `worksheet/use-worksheet.ts` | Session-backed (minimal hook) |
| Web Search | `web-search/use-web-search.ts` | Ephemeral + loading/error |
| Research | `research/use-research.ts` | Hybrid + async API |
| Map | `map/use-map.ts` | Hook-persisted (standar baru) |

Map direfaktor sebagai contoh pola **hook-persisted** dengan `useBaseToolState` dan helper `createDefaultMapViewState`.