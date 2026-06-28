import type { Locale } from "@/lib/config";
import { extractWorksheetTitle } from "@/lib/worksheet";

export interface WorksheetTemplate {
  id: string;
  icon: "proposal" | "report" | "letter" | "meeting" | "brief" | "checklist";
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  content: Record<Locale, string>;
}

export const WORKSHEET_TEMPLATES: WorksheetTemplate[] = [
  {
    id: "proposal",
    icon: "proposal",
    title: {
      id: "Proposal Proyek",
      en: "Project Proposal",
      zh: "项目提案",
    },
    description: {
      id: "Struktur proposal dengan ringkasan, ruang lingkup, dan estimasi.",
      en: "Proposal structure with summary, scope, and estimates.",
      zh: "包含摘要、范围和估算的提案结构。",
    },
    content: {
      id: `# Proposal Proyek

## Ringkasan Eksekutif
[Jelaskan tujuan proyek dan manfaat utama dalam 2–3 paragraf.]

## Latar Belakang
[Konteks masalah atau peluang yang ingin diselesaikan.]

## Ruang Lingkup
- [Deliverable 1]
- [Deliverable 2]
- [Deliverable 3]

## Jadwal & Tahapan
| Tahap | Durasi | Output |
| --- | --- | --- |
| Perencanaan | [x minggu] | [Output] |
| Pelaksanaan | [x minggu] | [Output] |
| Evaluasi | [x minggu] | [Output] |

## Estimasi Biaya
| Item | Estimasi |
| --- | --- |
| [Item 1] | [Rp ...] |
| [Item 2] | [Rp ...] |
| **Total** | **[Rp ...]** |

## Kesimpulan
[Ringkas ajakan atau langkah selanjutnya.]`,
      en: `# Project Proposal

## Executive Summary
[Describe the project goal and key benefits in 2–3 paragraphs.]

## Background
[Context for the problem or opportunity being addressed.]

## Scope
- [Deliverable 1]
- [Deliverable 2]
- [Deliverable 3]

## Timeline & Phases
| Phase | Duration | Output |
| --- | --- | --- |
| Planning | [x weeks] | [Output] |
| Execution | [x weeks] | [Output] |
| Review | [x weeks] | [Output] |

## Cost Estimate
| Item | Estimate |
| --- | --- |
| [Item 1] | [$ ...] |
| [Item 2] | [$ ...] |
| **Total** | **[$ ...]** |

## Conclusion
[Summarize the recommendation or next steps.]`,
      zh: `# 项目提案

## 执行摘要
[用 2–3 段说明项目目标和主要收益。]

## 背景
[说明要解决的问题或机会。]

## 范围
- [交付物 1]
- [交付物 2]
- [交付物 3]

## 时间线与阶段
| 阶段 | 周期 | 产出 |
| --- | --- | --- |
| 规划 | [x 周] | [产出] |
| 执行 | [x 周] | [产出] |
| 评估 | [x 周] | [产出] |

## 成本估算
| 项目 | 估算 |
| --- | --- |
| [项目 1] | [金额] |
| [项目 2] | [金额] |
| **合计** | **[金额]** |

## 结论
[总结建议或下一步。]`,
    },
  },
  {
    id: "report",
    icon: "report",
    title: {
      id: "Laporan",
      en: "Report",
      zh: "报告",
    },
    description: {
      id: "Format laporan formal dengan temuan dan rekomendasi.",
      en: "Formal report with findings and recommendations.",
      zh: "包含发现与建议的正式报告格式。",
    },
    content: {
      id: `# Laporan [Judul]

**Periode:** [Bulan/Tahun]  
**Disusun oleh:** [Nama]

## Ringkasan
[Highlight utama laporan dalam 1 paragraf.]

## Temuan
### [Temuan 1]
[Penjelasan dan data pendukung.]

### [Temuan 2]
[Penjelasan dan data pendukung.]

## Analisis
[Interpretasi temuan dan dampaknya.]

## Rekomendasi
1. [Rekomendasi 1]
2. [Rekomendasi 2]
3. [Rekomendasi 3]

## Lampiran
- [Data / grafik / referensi]`,
      en: `# Report: [Title]

**Period:** [Month/Year]  
**Prepared by:** [Name]

## Summary
[Key highlights in one paragraph.]

## Findings
### [Finding 1]
[Explanation and supporting data.]

### [Finding 2]
[Explanation and supporting data.]

## Analysis
[Interpret findings and their impact.]

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

## Appendix
- [Data / charts / references]`,
      zh: `# 报告：[标题]

**周期：** [月/年]  
**编制人：** [姓名]

## 摘要
[一段话概括报告要点。]

## 发现
### [发现 1]
[说明及支持数据。]

### [发现 2]
[说明及支持数据。]

## 分析
[解读发现及影响。]

## 建议
1. [建议 1]
2. [建议 2]
3. [建议 3]

## 附录
- [数据 / 图表 / 参考资料]`,
    },
  },
  {
    id: "letter",
    icon: "letter",
    title: {
      id: "Surat Resmi",
      en: "Formal Letter",
      zh: "正式信函",
    },
    description: {
      id: "Surat bisnis atau permohonan resmi.",
      en: "Business or formal request letter.",
      zh: "商务或正式申请信函。",
    },
    content: {
      id: `# Surat [Jenis Surat]

[Jakarta], [Tanggal]

Kepada Yth.  
[Nama Penerima]  
[Jabatan / Instansi]  
[Alamat]

**Perihal:** [Perihal Surat]

Dengan hormat,

[Paragraf pembuka — tujuan surat.]

[Paragraf isi — penjelasan detail permintaan atau informasi.]

[Paragraf penutup — harapan atau ajakan tindak lanjut.]

Hormat kami,

[Nama Pengirim]  
[Jabatan]  
[Kontak]`,
      en: `# [Letter Type]

[City], [Date]

To:  
[Recipient Name]  
[Title / Organization]  
[Address]

**Subject:** [Letter Subject]

Dear Sir/Madam,

[Opening paragraph — purpose of the letter.]

[Body — detailed explanation or request.]

[Closing — expected follow-up or appreciation.]

Sincerely,

[Sender Name]  
[Title]  
[Contact]`,
      zh: `# [信函类型]

[城市]，[日期]

致：  
[收件人姓名]  
[职位 / 机构]  
[地址]

**主题：** [信函主题]

尊敬的先生/女士：

[开头段 — 说明信函目的。]

[正文 — 详细说明或请求。]

[结尾 — 期望后续行动或感谢。]

此致  
敬礼

[发件人姓名]  
[职位]  
[联系方式]`,
    },
  },
  {
    id: "meeting",
    icon: "meeting",
    title: {
      id: "Notulen Rapat",
      en: "Meeting Notes",
      zh: "会议纪要",
    },
    description: {
      id: "Catatan rapat dengan agenda, keputusan, dan tindak lanjut.",
      en: "Meeting notes with agenda, decisions, and action items.",
      zh: "含议程、决议和待办事项的会议记录。",
    },
    content: {
      id: `# Notulen Rapat

**Judul:** [Nama Rapat]  
**Tanggal:** [Tanggal]  
**Peserta:** [Daftar peserta]

## Agenda
1. [Topik 1]
2. [Topik 2]

## Pembahasan
### [Topik 1]
- [Poin diskusi]

### [Topik 2]
- [Poin diskusi]

## Keputusan
- [Keputusan 1]
- [Keputusan 2]

## Tindak Lanjut
| Tugas | PIC | Deadline |
| --- | --- | --- |
| [Tugas 1] | [Nama] | [Tanggal] |
| [Tugas 2] | [Nama] | [Tanggal]`,
      en: `# Meeting Notes

**Title:** [Meeting Name]  
**Date:** [Date]  
**Attendees:** [List attendees]

## Agenda
1. [Topic 1]
2. [Topic 2]

## Discussion
### [Topic 1]
- [Discussion points]

### [Topic 2]
- [Discussion points]

## Decisions
- [Decision 1]
- [Decision 2]

## Action Items
| Task | Owner | Due Date |
| --- | --- | --- |
| [Task 1] | [Name] | [Date] |
| [Task 2] | [Name] | [Date]`,
      zh: `# 会议纪要

**标题：** [会议名称]  
**日期：** [日期]  
**参会人：** [参会名单]

## 议程
1. [议题 1]
2. [议题 2]

## 讨论
### [议题 1]
- [讨论要点]

### [议题 2]
- [讨论要点]

## 决议
- [决议 1]
- [决议 2]

## 待办事项
| 任务 | 负责人 | 截止日期 |
| --- | --- | --- |
| [任务 1] | [姓名] | [日期] |
| [任务 2] | [姓名] | [日期]`,
    },
  },
  {
    id: "brief",
    icon: "brief",
    title: {
      id: "Project Brief",
      en: "Project Brief",
      zh: "项目简报",
    },
    description: {
      id: "Ringkasan singkat untuk memulai proyek atau kampanye.",
      en: "Short brief to kick off a project or campaign.",
      zh: "用于启动项目或活动的简短简报。",
    },
    content: {
      id: `# Project Brief

## Tujuan
[Apa yang ingin dicapai?]

## Target Audiens
[Siapa pengguna atau penerima manfaat utama?]

## Pesan Utama
- [Pesan 1]
- [Pesan 2]

## Deliverables
- [Output yang diharapkan]

## KPI / Sukses
- [Metrik 1]
- [Metrik 2]

## Timeline
[Perkiraan durasi dan milestone penting.]`,
      en: `# Project Brief

## Objective
[What should this project achieve?]

## Target Audience
[Who is the primary audience or beneficiary?]

## Key Messages
- [Message 1]
- [Message 2]

## Deliverables
- [Expected outputs]

## Success Metrics
- [Metric 1]
- [Metric 2]

## Timeline
[Estimated duration and key milestones.]`,
      zh: `# 项目简报

## 目标
[项目要达成什么？]

## 目标受众
[主要用户或受益人是谁？]

## 核心信息
- [信息 1]
- [信息 2]

## 交付物
- [预期产出]

## 成功指标
- [指标 1]
- [指标 2]

## 时间线
[预计周期和关键里程碑。]`,
    },
  },
  {
    id: "checklist",
    icon: "checklist",
    title: {
      id: "Checklist / SOP",
      en: "Checklist / SOP",
      zh: "清单 / SOP",
    },
    description: {
      id: "Daftar periksa atau prosedur operasional standar.",
      en: "Checklist or standard operating procedure.",
      zh: "检查清单或标准操作流程。",
    },
    content: {
      id: `# Checklist / SOP

**Prosedur:** [Nama Prosedur]  
**Versi:** 1.0  
**Berlaku sejak:** [Tanggal]

## Tujuan
[Untuk apa prosedur ini digunakan.]

## Prasyarat
- [Alat / akses / dokumen yang diperlukan]

## Langkah-langkah
- [ ] [Langkah 1]
- [ ] [Langkah 2]
- [ ] [Langkah 3]
- [ ] [Langkah 4]

## Catatan & Pengecualian
[Hal khusus yang perlu diperhatikan.]

## Verifikasi
- [ ] Semua langkah selesai
- [ ] Dokumentasi diperbarui`,
      en: `# Checklist / SOP

**Procedure:** [Procedure Name]  
**Version:** 1.0  
**Effective:** [Date]

## Purpose
[What this procedure is for.]

## Prerequisites
- [Tools / access / documents required]

## Steps
- [ ] [Step 1]
- [ ] [Step 2]
- [ ] [Step 3]
- [ ] [Step 4]

## Notes & Exceptions
[Special cases to watch for.]

## Verification
- [ ] All steps completed
- [ ] Documentation updated`,
      zh: `# 清单 / SOP

**流程：** [流程名称]  
**版本：** 1.0  
**生效日期：** [日期]

## 目的
[本流程的用途。]

## 前置条件
- [所需工具 / 权限 / 文档]

## 步骤
- [ ] [步骤 1]
- [ ] [步骤 2]
- [ ] [步骤 3]
- [ ] [步骤 4]

## 备注与例外
[需要特别注意的情况。]

## 核验
- [ ] 所有步骤已完成
- [ ] 文档已更新`,
    },
  },
];

export function getWorksheetTemplates(_locale: Locale): WorksheetTemplate[] {
  return WORKSHEET_TEMPLATES;
}

export function resolveWorksheetTemplate(
  template: WorksheetTemplate,
  locale: Locale,
): { title: string; content: string } {
  const content = template.content[locale];
  const title =
    extractWorksheetTitle(content, locale) || template.title[locale];

  return { title, content };
}

export function findWorksheetTemplateById(
  templateId: string,
): WorksheetTemplate | undefined {
  return WORKSHEET_TEMPLATES.find((template) => template.id === templateId);
}