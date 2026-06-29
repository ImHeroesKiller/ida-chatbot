# Changelog

Semua perubahan penting pada proyek IDA AI didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versi mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-06-29

Rilis stabil pertama IDA AI setelah refactoring arsitektur besar.

### Added

#### Chat & Tools
- Sistem tool modular dengan coordinator (`useToolsCoordinator`)
- Tool aktif: **Web Search**, **Research**, **Map**, **Worksheet**
- **Right Tools Rail** dengan 4 grup: Riset, Produktivitas, Kreatif, Lanjutan
- Placeholder Coming Soon: Workflow, Gambar, Video, Musik, Coding, Integration, Virtual Computer
- Placeholder dapat diklik dengan toast notifikasi Coming Soon
- **Tools Menu** mobile dengan grouping sama seperti right rail
- Stream tool bridge untuk aktivasi tool dari respons SSE

#### Autentikasi & Akun
- **Google OAuth** via Supabase Auth (`AuthProvider`)
- Halaman **`/account`** — profil, avatar, logout
- **Custom Prompt** per pengguna (max 2.000 karakter, kolom `custom_prompt`)
- TanStack Query untuk cache profil (`useUserProfile`, `useUserProfileMutations`)
- Route group **`app/(app)/`** — chat, account, agent dengan provider terpusat

#### Admin
- **Dashboard** statistik platform (users, sessions, worksheets, research)
- Daftar **active users** dengan auto-refresh 60 detik
- Tab **Agent** — konfigurasi `toolModels` per tool
- Runtime **`resolveToolModel()`** — model berbeda untuk research, web search, agent workflow
- Validasi schema admin: `features.webSearch`, validasi key `toolModels`

#### Sidebar
- Refactor layout: Logo → New Chat → Chat History → Settings
- Hapus tab Chat/Agent dari sidebar chat (Agent tetap di `/agent`)
- Sidebar settings diorganisir: Tampilan, Suara, Data
- Mode collapsed (icon-only) dan expanded (label + search)

#### Infrastruktur
- `lib/admin/platform-stats.ts` — query statistik platform
- `lib/admin/tool-model.ts` — resolver model per tool
- `components/chat/tool-rail-config.ts` — konfigurasi grup rail terpusat
- `components/chat/tool-rail-notify.ts` — toast Coming Soon
- Migrasi `017_user_profile_prefs.sql` — custom prompt

#### Dokumentasi
- `docs/` — dokumentasi lengkap v1.0 (README, Architecture, Setup, Features, Admin, Adding Tool, Custom Prompt)

### Changed

- Chat hooks diekstrak ke modul terpisah (`use-chat-send`, stream-tool-bridge)
- Tools coordinator modular: runtime, panel, persistence, UI actions
- `prepareIdaChatContext` memilih model berdasarkan tool aktif (research > web search > default)
- Agent workflow proposal menggunakan `resolveToolModel("workflow", "agent")`
- Admin config merge menyertakan `toolModels` dan `features.webSearch`
- Perbaikan bug judul "New Chat" (`createChat()` dalam `flushSync`)

### Fixed

- Navigasi account setelah login (route group + TanStack Query cache)
- Validasi Zod admin config saat save Settings (field `webSearch` hilang)
- Sidebar skeleton disesuaikan dengan layout baru

### Security

- Custom prompt divalidasi server-side (max 2000 chars, tidak dari client chat payload)
- Admin panel terpisah dari Supabase Auth (password-based)
- OAuth redirect dibatasi path yang diizinkan

---

## Catatan Upgrade ke v1.0

1. Jalankan migrasi `017_user_profile_prefs.sql`
2. Set `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` untuk OAuth
3. Review konfigurasi `toolModels` di Admin → tab Agent
4. Baca `docs/SETUP.md` untuk environment variables lengkap

---

[1.0.0]: https://github.com/ImHeroesKiller/ida-chatbot/releases/tag/v1.0.0