# ADR-0003: Runtime Architecture

**Status:** Accepted + Frozen  
**Date:** 2026-07-08  
**Deciders:** Ary Wibowo  
**Version:** v1.0 (Frozen)

## Context

Kita membutuhkan lapisan yang mengelola keadaan dan orkestrasi organisasi secara terpisah dari antarmuka pengguna agar sistem dapat berevolusi dan mendukung multiple interface di masa depan.

## Decision

Kita mendefinisikan **10 Runtime Layers** untuk IDA v1.0:

| Runtime | Tanggung Jawab Utama | Status |
|---------|----------------------|--------|
| Enterprise Runtime | Organization, Identity, Permission, Perspective, Enterprise Policy | Frozen |
| Mission Runtime | Mission context, Reality activation | Frozen |
| Understanding Runtime | Membentuk pemahaman dari Reality | Frozen |
| Reasoning Runtime | Evaluasi opsi, probabilitas, dan trade-off | Frozen |
| Decision Runtime | Pemilihan keputusan dan pemicu eksekusi | Frozen |
| Workflow Runtime | Orkestrasi workflow dan tugas | Frozen |
| Digital Workforce Runtime | Menjalankan dan mengawasi AI Agents & Digital Workers | Frozen |
| Observation Runtime | Menangkap perubahan, event, dan signal | Frozen |
| Knowledge Runtime | Mengelola Knowledge Graph & Semantic Layer | Frozen |
| Memory Runtime | Mengelola Enterprise Memory dan riwayat | Frozen |

## Consequences

- Semua business logic, orkestrasi, dan state management harus berada di dalam Runtime.
- Runtime bersifat **UI-agnostic**.
- Setiap Runtime memiliki tanggung jawab yang jelas dan terbatas.
- AI Agents dan Workflow harus berjalan di dalam Runtime, bukan di dalam komponen UI.

## References

- ADR-0000, ADR-0001, ADR-0002
- ADR-0005 (Cognitive Architecture)