# Fitur IDA AI v1.0

Dokumen ini menjelaskan semua fitur yang tersedia bagi pengguna akhir, termasuk tool yang masih dalam tahap Coming Soon.

---

## Chat Percakapan

### Inti

- **Streaming real-time** — respons ditampilkan token per token via Server-Sent Events (SSE)
- **Multi-bahasa** — Indonesia, English, 中文 (pengaturan di sidebar)
- **Riwayat sesi** — percakapan tersimpan dan dapat dilanjutkan
- **New Chat** — membuat sesi baru tanpa kehilangan riwayat lama
- **Pin, rename, delete** — kelola sesi dari sidebar

### RAG (Knowledge Base)

IDA dapat mengambil konteks dari knowledge base internal sebelum menjawab:

- Aktif/nonaktif dikontrol admin (`features.rag`)
- Threshold confidence dapat disesuaikan admin
- Jika similarity di bawah threshold, IDA menjawab tanpa RAG dan mencatat alasan fallback di log

### Handoff ke Tim Manusia

Pengguna dapat meminta eskalasi ke tim manusia. IDA:

- Mendeteksi intent handoff
- Menyusun ringkasan topik & percakapan
- Menampilkan dialog prefill untuk disalin/dibagikan

### Lampiran & Multimodal

- Upload file (gambar, dokumen) di composer
- OCR / vision extraction untuk gambar
- Voice input (STT) — Groq Whisper atau fallback Gemini

### TTS (Text-to-Speech)

- Baca respons dengan suara (jika diaktifkan admin)
- Engine: Browser, OpenAI, xAI (tergantung API key)

---

## Sidebar Kiri

Setelah refactoring v1.0, sidebar chat disederhanakan:

```
[Logo IDA]
───────────
[+ New Chat]
───────────
[Riwayat Chat]  ← expandable, dengan search
───────────
[Settings]      ← Tampilan, Suara, Data
```

| Mode | Perilaku |
|------|----------|
| **Collapsed** | Icon-only — logo, new chat, history, settings |
| **Expanded** | Label + search bar untuk filter riwayat |

Tab Chat/Agent **tidak** ada di sidebar chat. Halaman Agent (`/agent`) diakses terpisah.

### Settings (Sidebar)

| Grup | Opsi |
|------|------|
| **Tampilan** | Ukuran teks, tema |
| **Suara** | Preferensi TTS |
| **Data** | Hapus riwayat lokal, preferensi |

---

## Right Tools Rail

Panel vertikal di sisi kanan chat (desktop). Tool dikelompokkan dalam 4 kategori:

### Grup 1 — Riset

| Tool | Status | Deskripsi |
|------|--------|-----------|
| **Web Search** | ✅ Aktif | Pencarian web real-time via Tavily; konteks disuntikkan ke prompt |
| **Map** | ✅ Aktif | Peta interaktif (Leaflet); geocoding & marker |
| **Research** | ✅ Aktif | Riset multi-sumber lebih mendalam; sintesis dari beberapa query |

### Grup 2 — Produktivitas

| Tool | Status | Deskripsi |
|------|--------|-----------|
| **Worksheet** | ✅ Aktif | Editor dokumen TipTap; generate, edit, export PDF/DOCX, share |
| **Workflow** | 🔜 Coming Soon | Otomasi alur kerja multi-langkah |

### Grup 3 — Kreatif

| Tool | Status | Deskripsi |
|------|--------|-----------|
| **Gambar** | 🔜 Coming Soon | Generasi & editing gambar AI |
| **Video** | 🔜 Coming Soon | Generasi & editing video AI |
| **Musik** | 🔜 Coming Soon | Generasi musik AI |

### Grup 4 — Lanjutan

| Tool | Status | Deskripsi |
|------|--------|-----------|
| **Coding** | 🔜 Coming Soon | Asisten coding & eksekusi kode |
| **Integration** | 🔜 Coming Soon | Konektor pihak ketiga (API, webhook) |
| **Virtual Computer** | 🔜 Coming Soon | Desktop/sandbox virtual di browser |

### Perilaku tool

**Tool aktif:**
- Klik icon → aktifkan tool + buka panel kanan
- Toggle on/off — tool "armed" saat kirim pesan berikutnya
- Indikator dot biru saat tool armed tapi panel tertutup

**Tool Coming Soon:**
- Dapat diklik
- Menampilkan toast: `"[Nama Tool] — Segera hadir"`
- Tidak membuka panel

### Mobile

Di layar kecil, tools diakses melalui tombol **wrench** (Tools Menu) di composer — grouping sama dengan right rail.

---

## Worksheet

Fitur dokumen lengkap:

- Generate dokumen dari chat (IDA menulis konten terstruktur)
- Editor rich-text (heading, tabel, link, alignment)
- Template & letterhead branding (admin)
- Export PDF, DOCX
- Share link publik (`/worksheet/share/[id]`)
- Riwayat versi dokumen
- Simpan sebagai template

---

## Web Search

- Membutuhkan `TAVILY_API_KEY` di server
- Toggle di rail/menu sebelum kirim pesan
- Hasil: konteks untuk LLM + daftar sumber di UI
- Model LLM dapat dikonfigurasi terpisah via admin `toolModels.webSearch`

---

## Research

- Riset lebih mendalam dari web search tunggal
- Multi-query, sintesis, ringkasan
- Panel kanan menampilkan sumber, query, dan summary
- Sesi riset dapat disimpan ke worksheet
- Model via `toolModels.research`

---

## Map

- Peta interaktif berbasis Leaflet
- Geocoding via `/api/map/geocode`
- Marker list dengan salin koordinat
- State peta di-persist per sesi chat

---

## Akun Pengguna

Akses via `/account` (perlu login Google):

| Fitur | Deskripsi |
|-------|-----------|
| **Profil** | Nama tampilan, avatar (upload atau dari Google) |
| **Custom Prompt** | Instruksi gaya respons pribadi (max 2000 karakter) |
| **Logout** | Keluar dari sesi |

Lihat [CUSTOM_PROMPT.md](./CUSTOM_PROMPT.md) untuk detail Custom Prompt.

---

## AgentFlow AI (`/agent`)

Halaman terpisah untuk otomasi workflow:

- Upload dokumen → analisis LLM → proposal workflow
- Approval gate sebelum eksekusi
- Sandbox E2B (opsional) untuk eksekusi kode
- Model via `toolModels.workflow` / `toolModels.agent`

> AgentFlow berada di luar chat utama dan memiliki sidebar sendiri.

---

## Halaman Publik

| Path | Isi |
|------|-----|
| `/` | Landing page |
| `/privacy` | Kebijakan privasi |
| `/terms` | Syarat & ketentuan |
| `/worksheet/share/[id]` | Share dokumen publik |

---

## Fitur yang Dikontrol Admin

Beberapa fitur hanya aktif jika diaktifkan admin:

| Fitur | Flag admin |
|-------|------------|
| RAG | `features.rag` |
| Web Search | `features.webSearch` + `TAVILY_API_KEY` |
| Voice / STT | `features.voice` |
| OCR | `features.ocr` |
| Auto-speak | `features.autoSpeak` |

---

## Batasan v1.0

- Tool kreatif (Gambar, Video, Musik) belum diimplementasikan
- Workflow, Coding, Integration, Virtual Computer masih placeholder
- `toolModels` untuk key creative belum ada di admin (hanya key yang terdaftar di `TOOL_MODEL_KEYS`)
- Agent sandbox memerlukan `E2B_API_KEY` untuk eksekusi nyata