# Chat Tools Module

Struktur modular untuk fitur Tools di chat (Worksheet, Web Search, Map, Research).

## Struktur Folder

```
components/chat/tools/
├── README.md                 # Dokumen ini
├── index.ts                  # Barrel export utama
├── types.ts                  # ToolId, Tool
├── base-tool-state.ts        # BaseToolState, BaseToolLifecycle, helpers
├── tool-panel-ids.ts         # Konstanta panel id per tool
├── registry.ts               # Daftar tool & helper (getTool, getAllTools)
├── tool-ui-config.ts         # Ikon, label i18n, dan perilaku UI per tool
├── coordinator-types.ts      # Shared coordinator types (ToolRailItem)
├── coordinator-helpers.ts    # Hydration & rail builders
├── use-tools-coordinator.ts  # Orkestrasi multi-tool (panel, persist, rail)
├── tool-panel-host.tsx       # Router panel kanan → komponen panel tiap tool
├── worksheet/
│   ├── index.ts
│   ├── worksheet-tool.ts     # Metadata registry
│   ├── use-worksheet.ts      # Hook state (BaseToolState)
│   ├── worksheet-panel.tsx
│   └── …komponen UI
├── web-search/
│   ├── index.ts
│   ├── web-search-tool.ts
│   ├── use-web-search.ts     # Hook state + hasil pencarian
│   ├── web-search-panel.tsx
│   └── …komponen UI
├── map/
│   ├── index.ts
│   ├── map-tool.ts
│   ├── use-map.ts
│   ├── map-panel.tsx
│   └── map-view.tsx
└── research/
    ├── index.ts
    ├── research-tool.ts
    ├── use-research.ts       # Hook state + sesi & hasil riset
    ├── research-panel.tsx
    └── …komponen UI
```

## Pola Arsitektur

### BaseToolState

Setiap tool hook mengimplementasikan kontrak minimum di `base-tool-state.ts`:

| Property / Method | Tujuan |
|---|---|
| `panelId` | Id panel sidebar kanan (`worksheet`, `web-search`, `research`, `map`) |
| `isEnabled` | Tool "armed" — aktif untuk kirim chat / fitur berikutnya |
| `isPanelOpen` | Panel sidebar tool sedang terbuka |
| `setEnabled()` | Set armed state; disable menutup panel + cleanup |
| `toggleTool()` | Toggle armed + buka/tutup panel sekaligus |
| `openPanel()` / `closePanel()` | Kontrol visibilitas panel saja |

### BaseToolLifecycle

Setiap hook juga menyediakan:

| Method | Tujuan |
|---|---|
| `hydrate(state)` | Restore state dari chat session yang dipersist |
| `resetForNewChat()` | Reset semua state saat chat baru dibuat |

Helper bersama: `applyBaseHydration()`, `resetBaseToolState()`, `createBaseToolActions()`.

### Coordinator (`useToolsCoordinator`)

Coordinator memanggil ketiga hook dan mengatur:

- **Eksklusivitas panel** — hanya satu panel aktif (`openPanel`, `closeAllPanels`)
- **Persist** — `getPersistPatch()` mengumpulkan flag enabled + panel aktif
- **Hydrate** — `hydrateFromChat()` memanggil `hydrate()` tiap hook dari `ChatSession`
- **Reset** — `resetForNewChat()` memanggil reset tiap hook
- **Rail & menu** — `railItems`, `handleMenuToolClick`, `handleRailClick`

`chat-room.tsx` hanya berinteraksi dengan coordinator, bukan hook individual.

## Cara Menambah Tool Baru

1. **Tambahkan `ToolId`** di `types.ts`
2. **Daftarkan tool** di `registry.ts` (`enabled: true/false`)
3. **Tambahkan panel id** di `tool-panel-ids.ts`
4. **Konfigurasi UI** di `tool-ui-config.ts` (ikon, label i18n, `kind`, `railPanel`)
5. **Buat folder modul** `tools/<nama-tool>/`:
   - `use-<tool>.ts` — hook yang return `BaseToolState & BaseToolLifecycle & { … }`
   - `<tool>-panel.tsx` — komponen panel sidebar
   - `<tool>-tool.ts` — metadata untuk registry
   - `index.ts` — barrel export
6. **Daftarkan di coordinator** — tambahkan hook, case di `openPanel` / `hydrateFromChat` / `resetForNewChat`
7. **Daftarkan di `tool-panel-host.tsx`** — render panel baru
8. **Persist** — tambahkan field di `ChatSession` jika perlu (enabled flag, data khusus)

### Template hook minimal

```ts
export function useMyTool(): BaseToolState & BaseToolLifecycle {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const baseSetters = { setIsEnabled, setIsPanelOpen };

  const { setEnabled, openPanel, closePanel, toggleTool } =
    createBaseToolActions({ ...baseSetters, onDisable: clearMyData });

  const hydrate = useCallback((state: ToolHydrationInput) => {
    applyBaseHydration(state, baseSetters);
    // restore tool-specific data…
  }, []);

  const resetForNewChat = useCallback(() => {
    resetBaseToolState(baseSetters);
    // clear tool-specific data…
  }, []);

  return { panelId, isEnabled, isPanelOpen, setEnabled, toggleTool, openPanel, closePanel, hydrate, resetForNewChat };
}
```

## Registry vs UI Config

- **registry.ts** — metadata tool (id, label, enabled) untuk logika bisnis & feature flags
- **tool-ui-config.ts** — mapping ke ikon Lucide, key i18n, dan aksi menu (`toggle-*` / `open-panel`)

Menu Tools (`tools-menu.tsx`) dan Right Rail (`right-tools-rail.tsx`) membaca dari registry + `tool-ui-config`, bukan hardcode daftar tool.