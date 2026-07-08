# ADR-0002: Core Operating Entities

**Status:** Accepted + Frozen  
**Date:** 2026-07-08  
**Deciders:** Ary Wibowo  
**Version:** v1.0 (Frozen)

## Context

Dalam merancang sistem enterprise yang kompleks, kita perlu menentukan entitas mana yang benar-benar fundamental dan tidak boleh berubah-ubah di masa depan tanpa proses yang ketat.

## Decision

Kita menetapkan **5 Core Operating Entities** sebagai fondasi IDA v1.0:

| No | Entity | Definisi | Status |
|----|--------|----------|--------|
| 1 | **Organization** | Identitas dan struktur organisasi | Frozen |
| 2 | **Perspective** | Sudut pandang dinamis (bisa stackable) dalam melihat organisasi | Frozen |
| 3 | **Mission** | Tujuan bisnis yang ingin dicapai | Frozen |
| 4 | **Reality** | Representasi kondisi nyata organisasi yang hidup | Frozen |
| 5 | **Decision** | Mekanisme untuk mengubah Reality menuju Mission | Frozen |

Semua entitas lain dianggap sebagai **Supporting Entities**.

## Consequences

- Setiap fitur baru harus dapat dijelaskan dalam konteks kelima entitas ini.
- Tidak diperbolehkan menambahkan Core Entity baru tanpa melalui proses ADR superseding.
- Perspective bersifat dinamis dan dapat berubah dalam satu sesi pengguna.
- Kelima entitas ini menjadi referensi utama dalam perancangan Runtime, Shell, dan View.

## References

- ADR-0000, ADR-0001
- ADR-0003 (Runtime Architecture)