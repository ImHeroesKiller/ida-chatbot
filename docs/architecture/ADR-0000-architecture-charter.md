# ADR-0000: Architecture Charter

**Status:** Accepted  
**Date:** 2026-07-08  
**Deciders:** Ary Wibowo  
**Version:** v1.0 (Frozen)

## Context

Proyek IDA membutuhkan fondasi arsitektur yang kuat, konsisten, dan dapat bertahan dalam jangka panjang. Tanpa aturan yang jelas mengenai bagaimana keputusan arsitektur dibuat dan diubah, proyek berisiko mengalami pergeseran visi secara bertahap (architecture drift) seiring berjalannya waktu dan bertambahnya kontributor.

## Decision

Kita menetapkan **Architecture Charter** ini sebagai dokumen tertinggi dalam hierarki keputusan arsitektur IDA.

### 1. Tujuan Architecture Decision Record (ADR)

- Merekam keputusan arsitektur yang penting secara eksplisit.
- Menjadi sumber kebenaran tunggal (single source of truth) bagi seluruh tim dan AI Agent.
- Mencegah hilangnya konteks keputusan di masa depan.
- Memungkinkan evolusi arsitektur yang terkontrol.

### 2. Aturan Pembuatan dan Perubahan ADR

- Semua keputusan arsitektur yang bersifat **fundamental** harus didokumentasikan melalui ADR baru.
- ADR yang telah berstatus **Accepted + Frozen** tidak boleh diubah secara langsung.
- Perubahan terhadap ADR yang sudah dibekukan harus dilakukan melalui **ADR superseding** (ADR baru yang secara eksplisit menggantikan ADR sebelumnya).
- Kode dan implementasi **harus mengikuti ADR**, bukan sebaliknya.
- Jika implementasi ditemukan bertentangan dengan ADR yang sudah diterima, maka implementasi yang harus diperbaiki (kecuali ADR resmi direvisi melalui proses yang benar).

### 3. Status ADR

| Status | Arti | Keterangan |
|--------|------|------------|
| Proposed | Usulan baru | Masih dalam diskusi |
| Accepted | Diterima | Sudah disetujui |
| Frozen | Dibekukan | Berlaku sebagai baseline v1.0 |
| Superseded | Digantikan | Sudah ada ADR baru yang menggantikannya |
| Deprecated | Tidak digunakan lagi | Sudah tidak relevan |

### 4. Arsitektur v1.0 sebagai Baseline

Arsitektur IDA v1.0 yang telah dibekukan melalui ADR-0001 sampai ADR-0006 berlaku sebagai **baseline resmi** hingga diputuskan versi berikutnya melalui proses ADR.

Setiap perubahan besar yang melampaui cakupan v1.0 harus melalui proses superseding dan persetujuan eksplisit.

## Consequences

- Semua engineer, kontributor, dan AI Agent wajib merujuk ke ADR sebelum membuat keputusan desain arsitektur.
- Diskusi arsitektur di masa depan akan lebih terstruktur dan terdokumentasi.
- Risiko architecture drift dapat ditekan secara signifikan.
- Proses pengembangan menjadi lebih disiplin dan dapat diaudit.

## References

- ADR-0001 sampai ADR-0006 (IDA Architecture v1.0)