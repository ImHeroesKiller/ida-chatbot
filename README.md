

![Logo](public/ida-logo.png)

![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)

# IDA Chatbot

IDA Chatbot adalah aplikasi chatbot AI canggih dan modular yang dibangun menggunakan Next.js. Proyek ini berfungsi sebagai platform asisten digital yang mengintegrasikan fitur riset, produktivitas,[...]

## Lisensi

Proyek ini dilisensikan di bawah Apache License 2.0. Anda dapat menggunakan, memodifikasi, dan mengkomersialkan perangkat lunak ini sesuai ketentuan Apache-2.0. Untuk detail hukum, lihat file LICENSE dan NOTICE.

## Fitur Utama

IDA Chatbot menawarkan berbagai fitur yang dikelompokkan berdasarkan kategori:

### Riset
*   **Web Search:** Pencarian web real-time melalui Tavily, menyuntikkan konteks ke prompt LLM.
*   **Map:** Peta interaktif berbasis Leaflet dengan geocoding dan penanda lokasi.
*   **Research:** Riset multi-sumber yang lebih mendalam, sintesis dari beberapa query, dan ringkasan.

### Produktivitas
*   **Worksheet:** Editor dokumen rich-text (TipTap) untuk membuat, mengedit, mengekspor (PDF/DOCX), dan berbagi dokumen. Mendukung template dan branding letterhead.
*   **Workflow:** Otomasi alur kerja visual (React Flow) dengan integrasi chat, eksekusi backend, multi-agent, RBAC, penjadwalan, dan persistensi per sesi.

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
    Buat file `.env.local` di root proyek dan tambahkan variabel lingkungan yang diperlukan, seperti `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `TAVILY_API_KEY`, dll. Lihat `docs/SETUP.md` untuk daftar lengkap.

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

---

(isi README selanjutnya tetap sama)
