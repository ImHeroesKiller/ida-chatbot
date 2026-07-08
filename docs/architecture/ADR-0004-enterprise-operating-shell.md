# ADR-0004: Enterprise Operating Shell

**Status:** Accepted + Frozen  
**Date:** 2026-07-08  
**Deciders:** Ary Wibowo  
**Version:** v1.0 (Frozen)

## Context

Kita membutuhkan satu lapisan antarmuka yang konsisten di seluruh modul agar pengguna mendapatkan pengalaman yang kohesif, tanpa menduplikasi logika bisnis di berbagai tempat.

## Decision

Kita mendefinisikan **Enterprise Operating Shell** sebagai satu-satunya lapisan yang bertanggung jawab terhadap:

- Navigation Region
- Context Region (Reality, Knowledge, Memory)
- Command Layer (Global Search & Command Palette)
- Perspective View, Capability View, dan Object View rendering
- Global interaction dan shortcut

**Enterprise Operating Shell tidak boleh** mengandung business logic.

## Consequences

- Hampir semua halaman authenticated harus dibungkus oleh Enterprise Operating Shell.
- Tidak diperbolehkan membuat Sidebar, Header, atau layout custom di dalam halaman individual.
- Shell hanya merender state yang diberikan oleh Runtime.
- Pemisahan yang jelas antara Shell (UI framework) dan Runtime (state & orchestration).

## References

- ADR-0000, ADR-0003
- ADR-0006 (Design Principles)