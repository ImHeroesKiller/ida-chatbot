![Logo](public/ida-logo.png)



# IDA Chatbot

IDA Chatbot adalah aplikasi chatbot AI canggih dan modular yang dibangun menggunakan Next.js. Proyek ini berfungsi sebagai platform asisten digital yang mengintegrasikan fitur riset, produktivitas, dan otomasi alur kerja.

## Fitur Utama

IDA Chatbot menawarkan berbagai fitur yang dikelompokkan berdasarkan kategori:

### Riset
*   **Web Search:** Pencarian web real-time melalui Tavily, menyuntikkan konteks ke prompt LLM.
*   **Map:** Peta interaktif berbasis Leaflet dengan geocoding dan penanda lokasi.
*   **Research:** Riset multi-sumber yang lebih mendalam, sintesis dari beberapa query, dan ringkasan.

### Produktivitas
*   **Worksheet:** Editor dokumen rich-text (TipTap) untuk membuat, mengedit, mengekspor (PDF/DOCX), dan berbagi dokumen. Mendukung template dan branding letterhead.
*   **Workflow:** Otomasi alur kerja visual (React Flow) dengan integrasi chat, eksekusi backend, dan persistensi per sesi.

### Multimedia
*   **Voice (STT & TTS):** Konversi suara ke teks (Speech-to-Text) menggunakan Groq Whisper atau Gemini, dan teks ke suara (Text-to-Speech) menggunakan browser, OpenAI, atau xAI.
*   **Vision:** OCR dan analisis gambar (sedang dalam pengembangan).

### Agentic Capabilities
*   **AgentFlow AI:** Halaman terpisah untuk otomasi workflow, analisis dokumen, proposal workflow, dan eksekusi kode opsional melalui sandbox E2B.

### Admin & Pengaturan
*   **Panel Admin:** Mengelola konfigurasi, model, pricing, dan memantau log permintaan.
*   **Pengaturan Pengguna:** Profil, custom prompt untuk gaya respons pribadi, dan manajemen sesi.

## Teknologi yang Digunakan

*   **Framework:** Next.js (App Router) dengan TypeScript.
*   **UI/Styling:** TailwindCSS dan Shadcn UI.
*   **Database & Autentikasi:** Supabase (PostgreSQL, Autentikasi).
*   **AI Orchestration:** LangGraph untuk alur kerja agen.
*   **Editor:** TipTap.
*   **Peta:** Leaflet.

## Memulai Proyek

Untuk menjalankan proyek ini secara lokal, ikuti langkah-langkah berikut:

1.  **Clone repositori:**
    ```bash
    git clone https://github.com/ImHeroesKiller/ida-chatbot.git
    cd ida-chatbot
    ```

2.  **Instal dependensi:**
    ```bash
    npm install
    # atau
    yarn install
    # atau
    pnpm install
    # atau
    bun install
    ```

3.  **Konfigurasi Environment Variables:**
    Buat file `.env.local` di root proyek dan tambahkan variabel lingkungan yang diperlukan, seperti `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `TAVILY_API_KEY`, dll. Lihat `docs/SETUP.md` untuk detail lebih lanjut.

4.  **Jalankan server pengembangan:**
    ```bash
    npm run dev
    # atau
    yarn dev
    # atau
    pnpm dev
    # atau
    bun dev
    ```

    Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000).

## Workflow Automation

Tool **Workflow** di chat IDA memungkinkan pengguna merancang dan menjalankan otomatisasi multi-langkah langsung dari panel kanan.

### Cara pakai

1. Buka chat di `/chat`, lalu klik ikon **Workflow** di Right Tools Rail (grup Produktivitas).
2. **Buat manual:** klik *New Workflow*, tambahkan node (Trigger / Action / Condition / Output), hubungkan di kanvas, isi **LLM Prompt** di panel properti.
3. **Buat dari chat:** dengan Workflow armed, kirim pesan natural language, contoh:

   ```
   buatkan workflow follow up pinjaman yang jatuh tempo
   ```

   IDA akan mengisi kanvas dari respons LLM (penanda `<<<IDA_WORKFLOW>>>`).

4. Klik **Execute** untuk menjalankan workflow via `POST /api/workflow/execute` (model: `toolModels.workflow` di Admin).

### Demo template

Template bawaan tersedia di `lib/workflow.ts`:

```typescript
import { createDemoDebtFollowUpWorkspace } from "@/lib/workflow";

// 5-node example: Loan Due Trigger → Check Payment → Condition → Reminder → CRM Log
const workspace = createDemoDebtFollowUpWorkspace();
```

### Arsitektur singkat

```
workflow-panel.tsx → useWorkflow (SSOT) → syncToPersistLayer() → ChatSession.workflow
Chat stream (workflow: true) → parseWorkflowFromResponse → importWorkflowFromStream
Execute → /api/workflow/execute → lib/workflow-executor.ts
```

Detail lengkap: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#workflow-tool-fase-13)

## Dokumentasi

Untuk informasi lebih lanjut mengenai arsitektur, fitur, panduan admin, dan kustomisasi, silakan lihat folder `docs/`:

*   [ARCHITECTURE.md](docs/ARCHITECTURE.md)
*   [FEATURES.md](docs/FEATURES.md)
*   [ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md)
*   [CUSTOM_PROMPT.md](docs/CUSTOM_PROMPT.md)
*   [SETUP.md](docs/SETUP.md)

## Deploy di Vercel

Cara termudah untuk mendeploy aplikasi Next.js Anda adalah menggunakan [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Lihat [dokumentasi deployment Next.js](https://nextjs.org/docs/app/building-your-application/deploying) untuk detail lebih lanjut.

---

## Worksheet Modularization (Completed)

Proses modularisasi **Worksheet** telah selesai dengan hasil sebagai berikut:

### Hasil Akhir
- `use-worksheet.ts` berfungsi sebagai **Single Source of Truth (SSOT)** untuk runtime state dan semua mutasi dokumen.
- `useWorksheetWorkspace` diposisikan sebagai **pure persist layer** (hanya bertanggung jawab menyimpan state ke `ChatSession`).
- Hampir seluruh handler di `worksheet-panel.tsx` sudah menggunakan Tool Hook (`tools.worksheet.*`) sebagai jalur utama.
- Alur sinkronisasi diperbaiki menjadi lebih satu arah dan stabil.
- Berhasil memperbaiki **React Infinite Loop (Error #185)** yang disebabkan oleh bidirectional sync.

### Arsitektur Saat Ini
```
use-worksheet.ts (SSOT Runtime + Mutasi)
        ↓ syncToPersistLayer()
useWorksheetWorkspace (Persist Layer)
        ↓
ChatSession.worksheet
```

### Progress
- **Overall Modularisasi Worksheet**: ±92–94%
- Fase 1–4 telah diselesaikan secara bertahap.

### Perubahan Utama
- Semua mutasi dokumen utama (`updateDocument`, `applyTemplate`, `markDocumentAsExported`, dll) sekarang terpusat di `use-worksheet.ts`.
- `commitWorkspace` masih ada sebagai fallback, tetapi tidak lagi menjadi jalur utama.
- Duplikasi state workspace disengaja untuk kebutuhan persistensi.
