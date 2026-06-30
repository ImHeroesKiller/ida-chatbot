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
*   **Workflow:** Otomasi alur kerja multi-langkah (sedang dalam pengembangan).

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
