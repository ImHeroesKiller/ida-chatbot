# Chat Tools Module

Struktur modular untuk fitur Tools di chat (Worksheet, Web Search, Map, Research).

## Struktur Folder

```
components/chat/tools/
├── index.ts              # Barrel export utama
├── types.ts              # ToolId, Tool, ToolState
├── registry.ts           # Daftar tool & helper (getTool, getAllTools, isToolEnabled)
├── tool-ui-config.ts     # Ikon, label i18n, dan perilaku UI per tool
├── tools-menu.tsx        # (di parent) Menu toggle tools di composer
├── worksheet/            # Modul Worksheet
│   ├── index.ts
│   ├── worksheet-tool.ts
│   ├── use-worksheet.ts
│   ├── worksheet-panel.tsx
│   └── ...komponen UI worksheet
└── web-search/           # Placeholder modul Web Search (fase berikutnya)
    └── index.ts
```

## Cara Menambah Tool Baru

1. Tambahkan `ToolId` di `types.ts`
2. Daftarkan tool di `registry.ts` dengan `enabled: true/false`
3. Tambahkan konfigurasi UI di `tool-ui-config.ts` (ikon, label, kind)
4. Buat folder modul di `tools/<nama-tool>/` jika perlu komponen khusus

## Registry vs UI Config

- **registry.ts** — metadata tool (id, label, enabled) untuk logika bisnis
- **tool-ui-config.ts** — mapping ke ikon Lucide, key i18n, dan aksi (toggle / buka panel)

Menu Tools (`tools-menu.tsx`) dan Right Rail (`right-tools-rail.tsx`) membaca dari registry + `tool-ui-config`, bukan hardcode daftar tool.