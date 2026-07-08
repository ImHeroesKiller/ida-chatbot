# ADR-0006: Design Principles & Layer Rules

**Status:** Accepted + Frozen  
**Date:** 2026-07-08  
**Deciders:** Ary Wibowo  
**Version:** v1.0 (Frozen)

## Context

Untuk menjaga konsistensi arsitektur dalam jangka panjang dan mencegah architecture drift, kita membutuhkan aturan yang jelas dan dapat ditegakkan.

## Decision

Kita menetapkan prinsip dan aturan desain berikut untuk IDA v1.0:

### Prinsip Utama

| Prinsip | Penjelasan |
|---------|------------|
| Runtime tidak mengetahui UI | Runtime hanya mengelola state, orkestrasi, dan business logic |
| Shell tidak mengetahui Business Logic | Shell hanya merender dan menangani interaksi pengguna |
| View tidak mengetahui Storage | View hanya menerima data dari Runtime melalui Shell |
| Decision membaca Reality | Decision Engine membaca Reality, bukan database langsung |
| AI Agent & Workflow berjalan di Runtime | Bukan di dalam komponen UI |
| Shell hanya merender | Tidak boleh mengandung logic bisnis |

### Aturan Pengembangan

1. Setiap perubahan arsitektur yang fundamental harus melalui proses ADR baru.
2. Konsep baru hanya boleh masuk ke v1.0 jika benar-benar diperlukan dalam 6 bulan ke depan.
3. Semua fitur dan modul harus dapat dijelaskan melalui 5 Core Operating Entities.
4. Jika implementasi ditemukan bertentangan dengan ADR yang sudah Accepted + Frozen, maka implementasi yang harus diperbaiki.

## Consequences

- Developer dan AI Agent wajib merujuk ke ADR sebelum membuat keputusan desain.
- Refactor besar di masa depan dapat ditekan.
- Proses pengembangan menjadi lebih disiplin dan dapat diaudit.
- Konsistensi arsitektur dapat dijaga dalam jangka panjang.

## References

- ADR-0000 sampai ADR-0005