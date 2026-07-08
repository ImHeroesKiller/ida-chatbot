# IDA Architecture Documentation

**Version:** v1.0 (Frozen)  
**Status:** Official Constitution  
**Last Updated:** 2026-07-08

---

## Apa itu Architecture Decision Record (ADR)?

Architecture Decision Record (ADR) adalah dokumen yang merekam keputusan arsitektur penting dalam proyek. Setiap ADR menjelaskan:

- **Context** — Mengapa keputusan ini diperlukan
- **Decision** — Apa yang diputuskan
- **Consequences** — Dampak positif dan negatif dari keputusan tersebut

ADR berfungsi sebagai **sumber kebenaran tunggal** (single source of truth) bagi seluruh tim dan AI Agent dalam mengembangkan IDA.

---

## Status Arsitektur Saat Ini

**IDA Architecture v1.0** telah dibekukan.

Semua ADR dari ADR-0000 sampai ADR-0006 berstatus **Accepted + Frozen** dan berlaku sebagai baseline resmi.

> Perubahan terhadap arsitektur v1.0 harus dilakukan melalui proses ADR superseding, bukan dengan mengubah dokumen yang sudah dibekukan.

---

## Urutan Membaca ADR

Disarankan membaca ADR dalam urutan berikut:

1. **ADR-0000** — Architecture Charter (Aturan main)
2. **ADR-0001** — IDA as Enterprise Cognitive Operating System
3. **ADR-0002** — Core Operating Entities
4. **ADR-0003** — Runtime Architecture
5. **ADR-0004** — Enterprise Operating Shell
6. **ADR-0005** — Enterprise Cognitive Architecture
7. **ADR-0006** — Design Principles & Layer Rules

---

## Hubungan Antar ADR

```
ADR-0000 (Architecture Charter)
    ↓
ADR-0001 (Operating System Vision)
    ↓
ADR-0002 (Core Entities) ↔ ADR-0005 (Cognitive Flow)
    ↓
ADR-0003 (Runtime Layers)
    ↓
ADR-0004 (Shell)
    ↓
ADR-0006 (Design Principles)
```

---

## Cara Mengusulkan Perubahan Arsitektur

1. Buat ADR baru dengan nomor berikutnya (contoh: `ADR-0007-xxx.md`).
2. Jelaskan Context, Decision, dan Consequences dengan jelas.
3. Ajukan melalui proses review.
4. Jika disetujui, ADR baru dapat berstatus `Accepted`.
5. Jika ADR baru menggantikan ADR lama, ubah status ADR lama menjadi `Superseded`.

> ADR yang sudah berstatus **Frozen** tidak boleh diedit langsung.

---

## Struktur Folder

```
docs/architecture/
├── README.md
├── ADR-0000-architecture-charter.md
├── ADR-0001-ida-operating-system.md
├── ADR-0002-core-operating-entities.md
├── ADR-0003-runtime-architecture.md
├── ADR-0004-enterprise-operating-shell.md
├── ADR-0005-cognitive-architecture.md
└── ADR-0006-design-principles.md
```

---

## Prinsip v1.0

> “Jika sebuah konsep belum diperlukan dalam 6 bulan ke depan, jangan jadikan bagian dari Architecture v1.0.”

Tujuan utama arsitektur v1.0 adalah menciptakan fondasi yang **cukup sederhana untuk dibangun**, tetapi **cukup kuat untuk dikembangkan** tanpa perlu dibongkar ulang di masa depan.

---

**Arsitektur IDA v1.0 telah dibekukan.**

Mulai saat ini, fokus bergeser ke implementasi berdasarkan keputusan yang tercatat dalam ADR ini.