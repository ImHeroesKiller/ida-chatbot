# IDA AI — Dokumentasi v1.0

**IDA** (*Intelligent Digital Assistant*) adalah platform AI Chatbot SaaS berbasis Next.js dengan sistem tool modular, panel admin, dan autentikasi pengguna melalui Google OAuth.

Dokumentasi ini mencakup arsitektur, setup, fitur, panduan admin, serta panduan pengembangan untuk versi **1.0**.

---

## Apa itu IDA?

IDA adalah asisten AI percakapan yang dirancang untuk:

- Menjawab pertanyaan dengan konteks RAG (Retrieval-Augmented Generation)
- Mengaktifkan tool khusus per sesi chat (Web Search, Research, Map, Worksheet)
- Menyimpan riwayat percakapan dan preferensi pengguna
- Dikonfigurasi sepenuhnya oleh admin (model, fitur, knowledge base, tampilan)

Pengguna dapat login dengan Google, mengatur **Custom Prompt** pribadi, dan menggunakan berbagai tool dari **Right Tools Rail** di sisi kanan antarmuka chat.

---

## Fitur Utama (v1.0)

| Kategori | Fitur |
|----------|-------|
| **Chat** | Streaming SSE, multi-bahasa (ID/EN/ZH), RAG, handoff ke tim manusia |
| **Tools aktif** | Web Search, Research, Map, Worksheet |
| **Tools Coming Soon** | Workflow, Gambar, Video, Musik, Coding, Integration, Virtual Computer |
| **Akun** | Google OAuth, profil, avatar, Custom Prompt |
| **Admin** | Dashboard statistik, model per tool (`toolModels`), knowledge base, logs |
| **Agent** | Halaman `/agent` terpisah (AgentFlow AI / workflow automation) |

---

## Tech Stack

| Lapisan | Teknologi |
|---------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Lucide Icons |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (PostgreSQL + pgvector) |
| State & cache | TanStack Query v5 |
| AI / LLM | LangChain, Google Gemini (utama), Groq, xAI, Hugging Face |
| Search | Tavily API (Web Search & Research) |
| Peta | Leaflet |
| Editor dokumen | TipTap |
| Validasi | Zod v4 |

---

## Struktur Dokumentasi

| Dokumen | Isi |
|---------|-----|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arsitektur aplikasi, auth, tool system, `toolModels`, caching |
| [SETUP.md](./SETUP.md) | Instalasi lokal, environment variables, database, menjalankan proyek |
| [FEATURES.md](./FEATURES.md) | Penjelasan detail semua fitur pengguna |
| [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) | Panduan halaman Admin |
| [ADDING_NEW_TOOL.md](./ADDING_NEW_TOOL.md) | Cara menambahkan tool baru ke sistem |
| [CUSTOM_PROMPT.md](./CUSTOM_PROMPT.md) | Custom Prompt per pengguna |

Catatan rilis: [CHANGELOG.md](../CHANGELOG.md) (root repository).

---

## Struktur Folder Penting

```
ida-chatbot/
├── app/
│   ├── (app)/          # Route group: chat, account, agent (dengan AuthProvider)
│   ├── (public)/       # Landing page
│   ├── admin/          # Panel admin (/admin)
│   └── api/            # API routes (chat, auth, admin, worksheet, dll.)
├── components/
│   ├── auth/           # AuthProvider, tombol login
│   ├── chat/           # Chat room, sidebar, tools rail, tools coordinator
│   └── admin/          # Tab admin (dashboard, models, agent, KB, dll.)
├── lib/
│   ├── admin/          # Konfigurasi app, model library, toolModels
│   ├── auth/           # User service, profile query (TanStack Query)
│   ├── chat-handler.ts # Orkestrasi chat server-side
│   └── tools/          # Web search, research, handoff
├── supabase/migrations/ # Skema database
└── docs/               # Dokumentasi ini
```

---

## Route Utama

| Path | Deskripsi |
|------|-----------|
| `/` | Landing page publik |
| `/chat` | Antarmuka chat utama |
| `/account` | Profil & Custom Prompt |
| `/agent` | AgentFlow AI (workflow automation) |
| `/admin` | Panel administrasi (password-protected) |

---

## Versi

**IDA AI v1.0** — rilis stabil setelah refactoring besar pada Sidebar, Right Tools Rail, Route Group `(app)`, Admin Dashboard, dan runtime `toolModels`.

Untuk detail perubahan, lihat [CHANGELOG.md](../CHANGELOG.md).