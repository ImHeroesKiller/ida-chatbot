# ADR-0001: IDA as Enterprise Cognitive Operating System

**Status:** Accepted + Frozen  
**Date:** 2026-07-08  
**Deciders:** Ary Wibowo  
**Version:** v1.0 (Frozen)

## Context

Banyak platform enterprise saat ini masih berpusat pada modul, fitur, atau halaman. IDA ingin mengambil pendekatan yang berbeda dengan membangun sistem yang berpusat pada misi bisnis organisasi dan memiliki kemampuan kognitif.

## Decision

Kita mendefinisikan IDA sebagai **Enterprise Cognitive Operating System**, bukan sekadar aplikasi web atau platform kolaborasi.

IDA dirancang untuk membantu organisasi melalui alur kognitif berikut:

```
Reality → Understanding → Reasoning → Decision → Execution → Learning
```

## Consequences

- Arsitektur harus memisahkan Runtime (state & orkestrasi) dari Shell (UI framework).
- Cognitive Flow menjadi alur utama sistem.
- Semua fitur dan modul harus mendukung misi organisasi, bukan sebaliknya.
- Konsep ini menjadi dasar bagi seluruh ADR berikutnya di v1.0.

## References

- ADR-0000 (Architecture Charter)
- ADR-0002, ADR-0003, ADR-0005