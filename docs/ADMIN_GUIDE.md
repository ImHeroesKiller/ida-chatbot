# Panduan Admin IDA AI v1.0

Panel admin IDA tersedia di **`/admin`**, dilindungi password terpisah dari login Google pengguna.

---

## Akses Admin

### Prasyarat

Set environment variable:

```env
ADMIN_PASSWORD=your-secure-password
```

Tanpa variabel ini, halaman admin menampilkan pesan *"Admin not configured"*.

### Login

1. Buka `https://<domain>/admin`
2. Masukkan password
3. Session disimpan di HTTP-only cookie
4. Klik **Sign out** untuk keluar

> Admin **tidak** menggunakan Supabase Auth. Satu password untuk semua operator admin.

---

## Navigasi Tab

| Tab | Ikon | Fungsi |
|-----|------|--------|
| **Dashboard** | LayoutDashboard | Statistik platform & penggunaan |
| **Models** | Sparkles | Model chat, fallback, vision utama |
| **Agent** | Bot | Model per tool (`toolModels`) |
| **Knowledge** | Database | Upload & kelola dokumen RAG |
| **Appearance** | Palette | Branding UI & worksheet |
| **Settings** | Settings | Fitur, TTS, RAG, system prompt |
| **Logs** | ScrollText | Request logs & aktivitas |

---

## Dashboard

Tab Dashboard menampilkan dua lapisan statistik:

### Statistik Platform

Data dari tabel `ida_users` dan `ida_chat_sessions`:

| Metrik | Deskripsi |
|--------|-----------|
| **Total Users** | Jumlah pengguna terdaftar |
| **Active Today** | Login dalam 24 jam terakhir |
| **Active Week** | Login dalam 7 hari terakhir |
| **Chat Sessions** | Total sesi chat |
| **Worksheets** | Sesi dengan worksheet aktif |
| **Research Sessions** | Sesi dengan riset |

Daftar **Active Users** menampilkan pengguna terbaru (nama, email, avatar, last login). Data di-refresh otomatis setiap **60 detik**.

### Statistik Penggunaan API

| Metrik | Deskripsi |
|--------|-----------|
| Request hari ini / 7 hari / bulan | Volume request chat |
| Token usage | Prompt + completion tokens |
| Estimated cost | Estimasi biaya USD per model |
| Chart per model | Grafik harian per model |
| Model health | Success rate, error count |
| Alerts | Peringatan otomatis (degraded/down) |
| Recent activity | Log request terbaru |

---

## Models (Model Utama)

Konfigurasi model default untuk seluruh aplikasi:

| Field | Deskripsi |
|-------|-----------|
| **Default Model** | Model chat utama (wajib) |
| **Fallback Model** | Model cadangan jika stream gagal (opsional) |
| **Vision Model** | Model untuk OCR / vision extraction |

Model dipilih dari **Model Library** — gabungan provider:

- Google (Gemini) — utama
- Groq
- xAI
- Hugging Face

Provider hanya tersedia jika API key-nya diset di environment.

---

## Agent (Model per Tool)

Tab **Agent** mengatur `toolModels` — model LLM khusus per tool atau agent.

### Key yang tersedia

| Key | Label | Kapan dipakai |
|-----|-------|---------------|
| `webSearch` | Web Search | Chat dengan web search aktif |
| `research` | Research | Chat dengan research aktif |
| `workflow` | Workflow | Agent workflow proposal (Coming Soon) |
| `agent` | Agent / Workflow default | Fallback orchestration agent |
| `coding` | Coding | Reserved — Coming Soon |
| `integration` | Third-party integration | Reserved — Coming Soon |
| `virtualComputer` | Virtual Computer | Reserved — Coming Soon |

### Cara mengatur

1. Buka tab **Agent**
2. Untuk setiap tool, pilih model dari dropdown
3. Pilih **"Inherit default chat model"** untuk menggunakan `defaultModel`
4. Klik **Save agent model settings**

### Resolver runtime

```
toolModels.webSearch  → (jika null) → defaultModel
toolModels.research   → (jika null) → defaultModel
toolModels.workflow   → (jika null) → toolModels.agent → defaultModel
```

Implementasi: `lib/admin/tool-model.ts` → `resolveToolModel()`.

### Validasi saat save

API `/api/admin/config` (PUT) memvalidasi:

- Key harus ada di `TOOL_MODEL_KEYS`
- Model harus ada di library dan support capability `chat`
- `features.webSearch` wajib ada di payload Settings

---

## Knowledge (RAG)

Kelola dokumen knowledge base:

| Aksi | Deskripsi |
|------|-----------|
| **Upload** | Upload PDF, DOCX, TXT, dll. |
| **Reindex** | Re-chunk & re-embed dokumen |
| **Delete** | Hapus dokumen & chunk-nya |
| **Chunks** | Lihat/edit chunk individual, re-embed per chunk |

Parameter RAG diatur di tab **Settings**:

| Parameter | Default | Deskripsi |
|-----------|---------|-----------|
| `confidenceThreshold` | 0.75 | Minimum similarity untuk pakai RAG |
| `topK` | 6 | Jumlah chunk di-retrieve |
| `retrievalThreshold` | 0.35 | Threshold awal retrieval |

---

## Appearance

Konfigurasi tampilan:

- Warna & branding UI
- Worksheet letterhead templates
- Worksheet branding (logo, footer, dll.)

Disimpan terpisah di tabel `ida_ui_config`.

---

## Settings

Konfigurasi operasional aplikasi:

### Fitur (toggles)

| Flag | Deskripsi |
|------|-----------|
| `rag` | Aktifkan RAG |
| `voice` | Aktifkan voice input |
| `ocr` | Aktifkan OCR upload |
| `autoSpeak` | Auto TTS setelah respons |
| `webSearch` | Aktifkan web search (butuh Tavily key) |

### TTS

| Field | Deskripsi |
|-------|-----------|
| `engine` | browser / openai / xai / groq |
| `voiceId` | ID suara |
| `speed` | 0.5 – 2.0 |
| `pitch` | 0 – 2.0 |

### System Prompt Override

Admin dapat mengganti system prompt global (null = default IDA prompt).

### Web Search

| Field | Deskripsi |
|-------|-----------|
| `maxResults` | Maksimum hasil Tavily per query (1–20) |

---

## Logs

Tab Logs menampilkan `ida_request_logs`:

- Model & provider yang dipakai
- Token usage (prompt, completion, total)
- Status: success / error / rate_limit
- Route: `chat`, `chat:fallback`, dll.
- Filter & pagination

---

## API Admin

| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/api/admin/login` | POST | Login password |
| `/api/admin/logout` | POST | Logout |
| `/api/admin/me` | GET | Cek session |
| `/api/admin/config` | GET/PUT | Baca/simpan config |
| `/api/admin/stats` | GET | Statistik dashboard |
| `/api/admin/logs` | GET | Request logs |
| `/api/admin/kb/*` | Various | Knowledge base CRUD |

---

## Best Practices

1. **Set fallback model** — gunakan model lebih ringan (mis. `gemini-2.5-flash-lite`) sebagai cadangan
2. **Pisahkan model research** — research butuh reasoning lebih kuat; set `toolModels.research` ke model yang lebih capable
3. **Monitor Dashboard** — pantau model health & alerts sebelum pengguna melapor
4. **Backup config** — export nilai `ida_app_config` secara berkala dari Supabase
5. **Jangan expose service role key** — hanya di server environment

---

## Troubleshooting Admin

| Masalah | Solusi |
|---------|--------|
| Save Settings gagal | Pastikan payload include `features.webSearch`; cek console network tab |
| Model tidak tersedia di dropdown | Set API key provider di env |
| Statistik platform 0 | Pastikan migrasi user & session sudah dijalankan |
| Knowledge upload gagal | Cek `GEMINI_API_KEY` untuk embedding |