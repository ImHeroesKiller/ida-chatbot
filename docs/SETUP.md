# Setup & Instalasi IDA AI v1.0

Panduan ini menjelaskan cara menyiapkan lingkungan development dan production untuk IDA AI.

---

## Prasyarat

| Software | Versi minimum |
|----------|---------------|
| Node.js | 20.x |
| npm | 10.x (atau pnpm/yarn) |
| Akun Supabase | Proyek dengan Auth + Database |
| Google Gemini API Key | Wajib untuk chat & RAG |

Opsional tetapi direkomendasikan:

- Tavily API Key (Web Search & Research)
- Groq API Key (Speech-to-Text)
- Google OAuth di Supabase (login pengguna)

---

## 1. Clone & Install

```bash
git clone https://github.com/ImHeroesKiller/ida-chatbot.git
cd ida-chatbot
npm install
```

---

## 2. Environment Variables

Salin template environment:

```bash
cp .env.example .env.local
```

Isi variabel berikut:

### Wajib

| Variabel | Deskripsi |
|----------|-----------|
| `GEMINI_API_KEY` | API key Google AI — chat, embedding RAG, OCR, STT fallback |
| `SUPABASE_URL` | URL proyek Supabase (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (hanya server, jangan expose ke client) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key untuk browser OAuth |

### Direkomendasikan

| Variabel | Deskripsi |
|----------|-----------|
| `TAVILY_API_KEY` | Mengaktifkan Web Search & Research ([tavily.com](https://tavily.com)) |
| `GROQ_API_KEY` | Speech-to-Text Whisper (lebih cepat dari fallback Gemini) |
| `ADMIN_PASSWORD` | Password panel admin di `/admin` |

### Opsional

| Variabel | Deskripsi |
|----------|-----------|
| `OPENAI_API_KEY` | TTS engine OpenAI di admin |
| `XAI_API_KEY` | Model xAI + TTS xAI |
| `HUGGINGFACE_API_KEY` | Model Hugging Face di library admin |
| `E2B_API_KEY` | Sandbox AgentFlow AI (tanpa ini = mode simulasi) |
| `UPSTASH_REDIS_REST_URL` | Checkpointer Redis untuk agent workflow |
| `UPSTASH_REDIS_REST_TOKEN` | Token Upstash Redis |
| `REDIS_URL` | Alternatif Redis standar |
| `NEXT_PUBLIC_APP_URL` | URL production (SEO, share link) |

> **Penting:** `NEXT_PUBLIC_SUPABASE_URL` harus berupa URL root proyek (`https://xxx.supabase.co`), **bukan** `/rest/v1`.

---

## 3. Database Supabase

### Terapkan migrasi

Jalankan skrip SQL di Supabase SQL Editor:

```bash
# Opsi A: satu file gabungan
# Buka supabase/apply-all.sql di Supabase Dashboard → SQL Editor → Run

# Opsi B: migrasi individual (urutan 001 → 017)
# supabase/migrations/
```

Migrasi penting untuk v1.0:

| File | Isi |
|------|-----|
| `001_documents_pgvector.sql` | Tabel dokumen + pgvector untuk RAG |
| `004_admin_panel.sql` | Tabel config & request logs |
| `009_users_auth.sql` | Tabel `ida_users` |
| `017_user_profile_prefs.sql` | Kolom `custom_prompt` |

### Google OAuth di Supabase

1. Supabase Dashboard → **Authentication** → **Providers** → aktifkan **Google**
2. Masukkan Client ID & Secret dari Google Cloud Console
3. Tambahkan redirect URL: `https://<domain>/auth/callback`
4. Untuk development: `http://localhost:3000/auth/callback`

---

## 4. Index Knowledge Base (RAG)

Setelah database siap, index chunk dokumen IDA:

```bash
npm run index:ida
```

Skrip ini menjalankan `scripts/seed-ida-chunks.mjs` untuk mengisi vector store.

---

## 5. Menjalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

| URL | Halaman |
|-----|---------|
| `http://localhost:3000/chat` | Chat utama |
| `http://localhost:3000/account` | Profil & Custom Prompt |
| `http://localhost:3000/admin` | Panel admin |
| `http://localhost:3000/agent` | AgentFlow AI |

---

## 6. Build Production

```bash
npm run build
npm start
```

Atau deploy ke Vercel:

```bash
npm run vercel-build   # index RAG + next build
```

Pastikan semua environment variables sudah diset di dashboard Vercel.

---

## 7. Verifikasi Setup

### Cek TypeScript

```bash
npx tsc --noEmit
```

### Cek fitur API

```bash
# RAG precision
npm run test:rag

# Web search (butuh TAVILY_API_KEY)
npm run test:web-search

# Worksheet
npm run test:worksheet
```

### Cek admin

1. Buka `/admin`
2. Login dengan `ADMIN_PASSWORD`
3. Tab **Dashboard** — pastikan statistik platform tampil (butuh data di Supabase)
4. Tab **Settings** — simpan konfigurasi tanpa error validasi

### Cek auth

1. Buka `/chat`
2. Login dengan Google
3. Buka `/account` — edit Custom Prompt dan simpan

---

## 8. Troubleshooting Umum

| Masalah | Solusi |
|---------|--------|
| OAuth redirect error | Pastikan `NEXT_PUBLIC_SUPABASE_URL` tanpa `/rest/v1`; cek redirect URL di Supabase & Google Console |
| Chat "not configured" | Set `GEMINI_API_KEY`; pastikan model default di admin terkonfigurasi |
| Web Search tidak tersedia | Set `TAVILY_API_KEY` + aktifkan `features.webSearch` di admin |
| Admin save gagal | Pastikan schema Zod valid — `features.webSearch` harus ikut dikirim |
| RAG tidak aktif | Jalankan `npm run index:ida`; cek threshold di admin Settings |
| Profil tidak update | Pastikan migrasi `017` sudah dijalankan |

---

## 9. Struktur Environment per Lingkungan

| Lingkungan | File env |
|------------|----------|
| Development lokal | `.env.local` |
| Vercel Preview | Environment Variables di dashboard |
| Vercel Production | Environment Variables di dashboard |

Jangan commit `.env.local` ke repository. File `.env.example` berisi daftar variabel tanpa nilai sensitif.