import type { Locale } from "@/lib/config";
import {
  applyWorkflowTemplateToWorkspace,
  createEmptyWorkflowWorkspace,
  normalizeWorkflowTemplateGraph,
  type WorkflowEdge,
  type WorkflowNode,
  type WorkflowNodeKind,
  type WorkflowWorkspace,
} from "@/lib/workflow";

export type WorkflowTemplateCategory =
  | "hr"
  | "operations"
  | "project-management"
  | "reporting"
  | "sales-crm"
  | "it"
  | "custom";

export type WorkflowTemplateIcon =
  | "onboarding"
  | "reporting"
  | "meeting"
  | "project"
  | "performance"
  | "crm"
  | "inventory"
  | "training"
  | "approval"
  | "standup"
  | "tender"
  | "it"
  | "custom";

export type WorkflowTemplateSource = "builtin" | "user";

export interface WorkflowTemplateDefinition {
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowTemplate {
  id: string;
  source: WorkflowTemplateSource;
  icon: WorkflowTemplateIcon;
  category: WorkflowTemplateCategory;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  definition: WorkflowTemplateDefinition;
  /** Built-in step metadata for locale resolution. */
  steps?: TemplateStepInput[];
}

export interface ResolvedWorkflowTemplate {
  id: string;
  source: WorkflowTemplateSource;
  icon: WorkflowTemplateIcon;
  category: WorkflowTemplateCategory;
  title: string;
  description: string;
  name: string;
  workflowDescription?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export type WorkflowTemplateApplyMode = "replace" | "append";

export type WorkflowTemplateApplyError =
  | "empty_template"
  | "invalid_graph"
  | "apply_failed";

export interface WorkflowTemplateApplyResult {
  workflow: import("@/lib/workflow").WorkflowDefinition | null;
  error?: WorkflowTemplateApplyError;
  fixes?: string[];
}

export const WORKFLOW_EXPORT_VERSION = 1;

export interface WorkflowExportPayload {
  version: number;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  exportedAt: number;
}

interface TemplateStepInput {
  id: string;
  label: Record<Locale, string>;
  kind: WorkflowNodeKind;
  description: Record<Locale, string>;
  prompt?: Record<Locale, string>;
  config?: Record<string, unknown>;
}

function localize(
  record: Record<Locale, string>,
  locale: Locale,
): string {
  return record[locale] ?? record.id ?? record.en;
}

function buildLinearWorkflow(steps: TemplateStepInput[]): WorkflowTemplateDefinition {
  const nodes: WorkflowNode[] = steps.map((step, index) => ({
    id: step.id,
    type: "workflow",
    position: { x: 80 + index * 200, y: 120 },
    data: {
      label: step.label.id,
      kind: step.kind,
      description: step.description.id,
      prompt: step.prompt?.id,
      config: step.config,
    },
  }));

  const edges: WorkflowEdge[] = steps.slice(0, -1).map((step, index) => ({
    id: `edge-${step.id}-${steps[index + 1]!.id}`,
    source: step.id,
    target: steps[index + 1]!.id,
  }));

  const name: Record<Locale, string> = { id: "", en: "", zh: "" };
  const description: Record<Locale, string> = { id: "", en: "", zh: "" };

  return { name, description, nodes, edges };
}

function withMeta(
  id: string,
  icon: WorkflowTemplateIcon,
  category: WorkflowTemplateCategory,
  title: Record<Locale, string>,
  description: Record<Locale, string>,
  steps: TemplateStepInput[],
): WorkflowTemplate {
  const definition = buildLinearWorkflow(steps);
  definition.name = title;
  definition.description = description;

  for (const node of definition.nodes) {
    const step = steps.find((item) => item.id === node.id);
    if (!step) continue;
    node.data.label = step.label.id;
    node.data.description = step.description.id;
    node.data.prompt = step.prompt?.id;
  }

  return {
    id,
    source: "builtin",
    icon,
    category,
    title,
    description,
    definition,
    steps,
  };
}

export const WORKFLOW_TEMPLATE_CATEGORIES: WorkflowTemplateCategory[] = [
  "hr",
  "operations",
  "project-management",
  "reporting",
  "sales-crm",
  "it",
  "custom",
];

export const BUILTIN_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  withMeta(
    "employee-onboarding",
    "onboarding",
    "hr",
    {
      id: "Onboarding Karyawan",
      en: "Employee Onboarding Workflow",
      zh: "员工入职流程",
    },
    {
      id: "Otomatisasi persiapan akun, orientasi, dan checklist minggu pertama.",
      en: "Automate account setup, orientation, and first-week checklist.",
      zh: "自动化账号开通、入职培训与首周清单。",
    },
    [
      {
        id: "onboard-trigger",
        kind: "trigger",
        label: {
          id: "Karyawan Baru Diterima",
          en: "New Hire Accepted",
          zh: "新员工已录用",
        },
        description: {
          id: "Terpicu saat offer letter ditandatangani.",
          en: "Fires when the offer letter is signed.",
          zh: "在录用通知书签署后触发。",
        },
      },
      {
        id: "onboard-accounts",
        kind: "action",
        label: {
          id: "Siapkan Akun & Akses",
          en: "Provision Accounts & Access",
          zh: "开通账号与权限",
        },
        description: {
          id: "Buat akun email, HRIS, dan tools tim.",
          en: "Create email, HRIS, and team tool accounts.",
          zh: "创建邮箱、HRIS 和团队工具账号。",
        },
        prompt: {
          id: "Buat checklist akun yang harus disiapkan untuk karyawan baru berdasarkan role dan departemen.",
          en: "Create an account checklist for the new hire based on role and department.",
          zh: "根据岗位和部门为新员工生成账号开通清单。",
        },
      },
      {
        id: "onboard-orientation",
        kind: "action",
        label: {
          id: "Jadwalkan Orientasi",
          en: "Schedule Orientation",
          zh: "安排入职培训",
        },
        description: {
          id: "Atur sesi pengenalan tim dan kebijakan perusahaan.",
          en: "Schedule team intro and company policy sessions.",
          zh: "安排团队介绍与公司制度培训。",
        },
        prompt: {
          id: "Susun agenda orientasi 3 hari pertama termasuk mentor, lokasi, dan materi wajib.",
          en: "Draft a 3-day orientation agenda including mentor, location, and required materials.",
          zh: "起草为期 3 天的入职议程，含导师、地点和必修材料。",
        },
      },
      {
        id: "onboard-output",
        kind: "output",
        label: {
          id: "Kirim Welcome Pack",
          en: "Send Welcome Pack",
          zh: "发送欢迎资料包",
        },
        description: {
          id: "Rangkum langkah onboarding untuk HR dan manager.",
          en: "Summarize onboarding steps for HR and the manager.",
          zh: "为 HR 和经理汇总入职步骤。",
        },
        prompt: {
          id: "Buat ringkasan onboarding siap kirim ke karyawan baru dan manajer langsung.",
          en: "Create an onboarding summary ready to send to the new hire and line manager.",
          zh: "生成可直接发送给新员工和直属经理的入职摘要。",
        },
      },
    ],
  ),
  withMeta(
    "monthly-report",
    "reporting",
    "reporting",
    {
      id: "Generasi Laporan Bulanan",
      en: "Monthly Report Generation",
      zh: "月度报告生成",
    },
    {
      id: "Kumpulkan KPI, susun narasi, dan format laporan eksekutif.",
      en: "Collect KPIs, draft narrative, and format executive report.",
      zh: "汇总 KPI、撰写叙述并格式化高管报告。",
    },
    [
      {
        id: "report-trigger",
        kind: "trigger",
        label: {
          id: "Akhir Bulan",
          en: "Month End",
          zh: "月末",
        },
        description: {
          id: "Terpicu setiap akhir bulan kalender.",
          en: "Fires at each calendar month end.",
          zh: "在每个自然月末触发。",
        },
      },
      {
        id: "report-collect",
        kind: "action",
        label: {
          id: "Kumpulkan Data KPI",
          en: "Collect KPI Data",
          zh: "收集 KPI 数据",
        },
        description: {
          id: "Agregasi metrik dari tim dan sistem.",
          en: "Aggregate metrics from teams and systems.",
          zh: "汇总各团队与系统的指标。",
        },
        prompt: {
          id: "Susun tabel KPI bulan ini vs target: revenue, produktivitas, SLA, dan highlight anomali.",
          en: "Build a KPI table for this month vs targets: revenue, productivity, SLA, and anomalies.",
          zh: "整理本月 KPI 与目标对比表：收入、效率、SLA 及异常项。",
        },
      },
      {
        id: "report-draft",
        kind: "action",
        label: {
          id: "Tulis Narasi Eksekutif",
          en: "Draft Executive Narrative",
          zh: "撰写高管叙述",
        },
        description: {
          id: "Ubah angka menjadi insight untuk manajemen.",
          en: "Turn numbers into management insights.",
          zh: "将数据转化为管理洞察。",
        },
        prompt: {
          id: "Tulis ringkasan eksekutif 3 paragraf: pencapaian, risiko, dan rekomendasi bulan depan.",
          en: "Write a 3-paragraph executive summary: wins, risks, and next-month recommendations.",
          zh: "撰写三段式高管摘要：成果、风险与下月建议。",
        },
      },
      {
        id: "report-output",
        kind: "output",
        label: {
          id: "Ekspor Laporan",
          en: "Export Report",
          zh: "导出报告",
        },
        description: {
          id: "Format laporan siap dibagikan ke stakeholder.",
          en: "Format report ready for stakeholders.",
          zh: "格式化报告供利益相关方使用。",
        },
        prompt: {
          id: "Gabungkan KPI dan narasi menjadi struktur laporan bulanan dengan heading dan bullet rekomendasi.",
          en: "Merge KPIs and narrative into a monthly report structure with headings and recommendation bullets.",
          zh: "将 KPI 与叙述合并为月度报告结构，含标题与建议要点。",
        },
      },
    ],
  ),
  withMeta(
    "meeting-prep",
    "meeting",
    "operations",
    {
      id: "Persiapan & Tindak Lanjut Rapat",
      en: "Meeting Preparation & Follow-up",
      zh: "会议准备与跟进",
    },
    {
      id: "Agenda pra-rapat, notulen, dan action items otomatis.",
      en: "Pre-meeting agenda, notes, and automated action items.",
      zh: "会前议程、纪要与自动行动项。",
    },
    [
      {
        id: "meet-trigger",
        kind: "trigger",
        label: { id: "Rapat Dijadwalkan", en: "Meeting Scheduled", zh: "会议已安排" },
        description: {
          id: "Terpicu saat undangan kalender dibuat.",
          en: "Fires when a calendar invite is created.",
          zh: "在创建日历邀请时触发。",
        },
      },
      {
        id: "meet-agenda",
        kind: "action",
        label: { id: "Susun Agenda", en: "Build Agenda", zh: "制定议程" },
        description: {
          id: "Siapkan topik dan materi pra-rapat.",
          en: "Prepare topics and pre-read materials.",
          zh: "准备议题与会前阅读材料。",
        },
        prompt: {
          id: "Buat agenda rapat dengan tujuan, topik berdurasi, dan pemilik diskusi.",
          en: "Create a meeting agenda with goals, timed topics, and discussion owners.",
          zh: "创建含目标、议题时长和负责人的会议议程。",
        },
      },
      {
        id: "meet-notes",
        kind: "action",
        label: { id: "Ringkas Notulen", en: "Summarize Notes", zh: "整理纪要" },
        description: {
          id: "Ekstrak keputusan dan action items.",
          en: "Extract decisions and action items.",
          zh: "提取决议与行动项。",
        },
        prompt: {
          id: "Ubah catatan rapat menjadi keputusan, action items (PIC + deadline), dan risiko terbuka.",
          en: "Turn meeting notes into decisions, action items (owner + deadline), and open risks.",
          zh: "将会议记录整理为决议、行动项（负责人+截止日期）和未决风险。",
        },
      },
      {
        id: "meet-output",
        kind: "output",
        label: { id: "Kirim Follow-up", en: "Send Follow-up", zh: "发送跟进" },
        description: {
          id: "Distribusikan ringkasan ke peserta.",
          en: "Distribute summary to attendees.",
          zh: "向参会者分发摘要。",
        },
        prompt: {
          id: "Tulis email follow-up rapat profesional dengan action items dan link materi.",
          en: "Draft a professional meeting follow-up email with action items and material links.",
          zh: "起草含行动项和资料链接的专业会议跟进邮件。",
        },
      },
    ],
  ),
  withMeta(
    "project-tasks",
    "project",
    "project-management",
    {
      id: "Penugasan & Pelacakan Tugas Proyek",
      en: "Project Task Assignment & Tracking",
      zh: "项目任务分配与跟踪",
    },
    {
      id: "Breakdown scope, assign owner, dan pantau progres sprint.",
      en: "Break down scope, assign owners, and track sprint progress.",
      zh: "拆解范围、分配负责人并跟踪迭代进度。",
    },
    [
      {
        id: "proj-trigger",
        kind: "trigger",
        label: { id: "Sprint Baru", en: "New Sprint", zh: "新迭代" },
        description: {
          id: "Terpicu di awal sprint atau fase proyek.",
          en: "Fires at sprint or project phase start.",
          zh: "在迭代或项目阶段开始时触发。",
        },
      },
      {
        id: "proj-breakdown",
        kind: "action",
        label: { id: "Breakdown Scope", en: "Break Down Scope", zh: "拆解范围" },
        description: {
          id: "Urai deliverable menjadi tugas terukur.",
          en: "Split deliverables into measurable tasks.",
          zh: "将交付物拆分为可衡量任务。",
        },
        prompt: {
          id: "Urai scope proyek menjadi user stories/tugas dengan estimasi dan dependensi.",
          en: "Break project scope into user stories/tasks with estimates and dependencies.",
          zh: "将项目范围拆解为用户故事/任务，含估算与依赖。",
        },
      },
      {
        id: "proj-assign",
        kind: "action",
        label: { id: "Assign ke Tim", en: "Assign to Team", zh: "分配给团队" },
        description: {
          id: "Tetapkan PIC dan prioritas.",
          en: "Set owners and priorities.",
          zh: "设定负责人与优先级。",
        },
        prompt: {
          id: "Buat matriks penugasan: tugas, PIC, prioritas, dan target selesai sprint ini.",
          en: "Create an assignment matrix: task, owner, priority, and sprint completion target.",
          zh: "创建分配矩阵：任务、负责人、优先级与本迭代完成目标。",
        },
      },
      {
        id: "proj-condition",
        kind: "condition",
        label: { id: "Ada Blocker?", en: "Any Blockers?", zh: "是否有阻塞？" },
        description: {
          id: "Identifikasi hambatan progres.",
          en: "Identify progress blockers.",
          zh: "识别进度阻塞项。",
        },
        prompt: {
          id: "Analisis status tugas: jawab YES jika ada blocker kritis, otherwise NO.",
          en: "Analyze task status: answer YES if critical blockers exist, otherwise NO.",
          zh: "分析任务状态：若存在关键阻塞则 YES，否则 NO。",
        },
      },
      {
        id: "proj-output",
        kind: "output",
        label: { id: "Laporan Progres", en: "Progress Report", zh: "进度报告" },
        description: {
          id: "Ringkas status untuk stakeholder proyek.",
          en: "Summarize status for project stakeholders.",
          zh: "为项目干系人汇总状态。",
        },
        prompt: {
          id: "Buat laporan progres sprint: selesai, in-progress, blocker, dan rencana minggu depan.",
          en: "Create a sprint progress report: done, in-progress, blockers, and next-week plan.",
          zh: "生成本迭代进度报告：已完成、进行中、阻塞项与下周计划。",
        },
      },
    ],
  ),
  withMeta(
    "performance-review",
    "performance",
    "hr",
    {
      id: "Proses Performance Review",
      en: "Performance Review Process",
      zh: "绩效评估流程",
    },
    {
      id: "Kumpulkan feedback 360°, susun penilaian, dan rencana pengembangan.",
      en: "Collect 360° feedback, draft ratings, and development plans.",
      zh: "收集 360 反馈、起草评分与发展计划。",
    },
    [
      {
        id: "perf-trigger",
        kind: "trigger",
        label: { id: "Siklus Review", en: "Review Cycle", zh: "评估周期" },
        description: {
          id: "Terpicu saat periode review dibuka.",
          en: "Fires when the review period opens.",
          zh: "在评估期开启时触发。",
        },
      },
      {
        id: "perf-collect",
        kind: "action",
        label: { id: "Kumpulkan Feedback", en: "Collect Feedback", zh: "收集反馈" },
        description: {
          id: "Agregasi masukan peer dan manajer.",
          en: "Aggregate peer and manager input.",
          zh: "汇总同事与经理反馈。",
        },
        prompt: {
          id: "Rangkum feedback 360° menjadi tema kekuatan, area pengembangan, dan contoh perilaku.",
          en: "Summarize 360° feedback into strengths, development areas, and behavior examples.",
          zh: "将 360 反馈归纳为优势、待提升领域与行为示例。",
        },
      },
      {
        id: "perf-rating",
        kind: "action",
        label: { id: "Draft Penilaian", en: "Draft Rating", zh: "起草评分" },
        description: {
          id: "Susun rekomendasi rating dan narasi.",
          en: "Draft rating recommendation and narrative.",
          zh: "起草评分建议与叙述。",
        },
        prompt: {
          id: "Buat draf penilaian kinerja dengan skor kompetensi, bukti, dan kalibrasi tim.",
          en: "Draft a performance rating with competency scores, evidence, and team calibration notes.",
          zh: "起草含能力评分、证据与团队校准说明的绩效评估。",
        },
      },
      {
        id: "perf-output",
        kind: "output",
        label: { id: "Rencana Pengembangan", en: "Development Plan", zh: "发展计划" },
        description: {
          id: "Output IDP untuk karyawan dan manajer.",
          en: "Output IDP for employee and manager.",
          zh: "为员工与经理输出个人发展计划。",
        },
        prompt: {
          id: "Susun Individual Development Plan 90 hari dengan tujuan, coaching, dan metrik sukses.",
          en: "Create a 90-day IDP with goals, coaching actions, and success metrics.",
          zh: "制定 90 天个人发展计划，含目标、辅导行动与成功指标。",
        },
      },
    ],
  ),
  withMeta(
    "client-followup",
    "crm",
    "sales-crm",
    {
      id: "Follow-up Klien & Update CRM",
      en: "Client Follow-up & CRM Update",
      zh: "客户跟进与 CRM 更新",
    },
    {
      id: "Prioritaskan leads, draft outreach, dan sinkronkan catatan CRM.",
      en: "Prioritize leads, draft outreach, and sync CRM notes.",
      zh: "优先处理线索、起草触达并同步 CRM 记录。",
    },
    [
      {
        id: "crm-trigger",
        kind: "trigger",
        label: { id: "Lead Baru / Idle", en: "New or Idle Lead", zh: "新线索/闲置线索" },
        description: {
          id: "Terpicu untuk lead baru atau tanpa aktivitas 7 hari.",
          en: "Fires for new leads or 7-day idle contacts.",
          zh: "针对新线索或 7 天无活动联系人触发。",
        },
      },
      {
        id: "crm-prioritize",
        kind: "action",
        label: { id: "Prioritaskan Lead", en: "Prioritize Lead", zh: "线索优先级" },
        description: {
          id: "Skor urgensi dan potensi deal.",
          en: "Score urgency and deal potential.",
          zh: "评估紧急程度与成交潜力。",
        },
        prompt: {
          id: "Beri skor lead (tinggi/sedang/rendah) berdasarkan budget, timeline, dan engagement.",
          en: "Score the lead (high/medium/low) based on budget, timeline, and engagement.",
          zh: "根据预算、时间线与互动情况为线索打分（高/中/低）。",
        },
      },
      {
        id: "crm-outreach",
        kind: "action",
        label: { id: "Draft Outreach", en: "Draft Outreach", zh: "起草触达" },
        description: {
          id: "Siapkan pesan follow-up personal.",
          en: "Prepare personalized follow-up message.",
          zh: "准备个性化跟进消息。",
        },
        prompt: {
          id: "Tulis email/WhatsApp follow-up profesional yang merujuk interaksi terakhir dan value proposition.",
          en: "Draft a professional follow-up email/WhatsApp referencing last touch and value proposition.",
          zh: "起草引用上次互动与价值主张的专业跟进邮件/消息。",
        },
      },
      {
        id: "crm-output",
        kind: "output",
        label: { id: "Update CRM", en: "Update CRM", zh: "更新 CRM" },
        description: {
          id: "Catat aktivitas dan next step di CRM.",
          en: "Log activity and next step in CRM.",
          zh: "在 CRM 中记录活动与下一步。",
        },
        prompt: {
          id: "Buat catatan CRM ringkas: status lead, pesan terkirim, dan next action + tanggal.",
          en: "Create a concise CRM note: lead status, message sent, and next action + date.",
          zh: "创建简洁 CRM 备注：线索状态、已发消息与下一步+日期。",
        },
      },
    ],
  ),
  withMeta(
    "inventory-check",
    "inventory",
    "operations",
    {
      id: "Cek Inventori & Reorder",
      en: "Inventory Check & Reorder",
      zh: "库存检查与补货",
    },
    {
      id: "Pantau stok minimum, buat PO draft, dan notifikasi procurement.",
      en: "Monitor minimum stock, draft PO, and notify procurement.",
      zh: "监控最低库存、起草采购单并通知采购。",
    },
    [
      {
        id: "inv-trigger",
        kind: "trigger",
        label: { id: "Stok di Bawah Minimum", en: "Stock Below Minimum", zh: "库存低于下限" },
        description: {
          id: "Terpicu saat SKU mencapai reorder point.",
          en: "Fires when SKU hits reorder point.",
          zh: "当 SKU 达到补货点时触发。",
        },
      },
      {
        id: "inv-verify",
        kind: "action",
        label: { id: "Verifikasi Stok", en: "Verify Stock", zh: "核实库存" },
        description: {
          id: "Validasi on-hand vs permintaan terbuka.",
          en: "Validate on-hand vs open demand.",
          zh: "核对现有库存与未满足需求。",
        },
        prompt: {
          id: "Hitung kebutuhan reorder: stok saat ini, safety stock, lead time, dan permintaan 30 hari.",
          en: "Calculate reorder need: current stock, safety stock, lead time, and 30-day demand.",
          zh: "计算补货需求：当前库存、安全库存、交期与 30 天需求。",
        },
      },
      {
        id: "inv-po",
        kind: "action",
        label: { id: "Draft Purchase Order", en: "Draft Purchase Order", zh: "起草采购单" },
        description: {
          id: "Susun PO untuk vendor terpilih.",
          en: "Prepare PO for selected vendor.",
          zh: "为选定供应商准备采购单。",
        },
        prompt: {
          id: "Buat draf PO dengan SKU, qty, harga estimasi, dan catatan pengiriman.",
          en: "Draft a PO with SKU, qty, estimated price, and delivery notes.",
          zh: "起草含 SKU、数量、预估价格与交付说明的采购单。",
        },
      },
      {
        id: "inv-output",
        kind: "output",
        label: { id: "Notifikasi Procurement", en: "Notify Procurement", zh: "通知采购" },
        description: {
          id: "Kirim ringkasan ke tim pengadaan.",
          en: "Send summary to procurement team.",
          zh: "向采购团队发送摘要。",
        },
        prompt: {
          id: "Ringkas permintaan reorder untuk tim procurement dengan prioritas dan SLA.",
          en: "Summarize reorder request for procurement with priority and SLA.",
          zh: "为采购团队汇总补货请求，含优先级与 SLA。",
        },
      },
    ],
  ),
  withMeta(
    "team-training",
    "training",
    "hr",
    {
      id: "Jadwal Pelatihan Tim",
      en: "Team Training Schedule",
      zh: "团队培训安排",
    },
    {
      id: "Identifikasi skill gap, jadwalkan sesi, dan evaluasi kebutuhan.",
      en: "Identify skill gaps, schedule sessions, and assess needs.",
      zh: "识别技能差距、安排培训并评估需求。",
    },
    [
      {
        id: "train-trigger",
        kind: "trigger",
        label: { id: "Quarterly Planning", en: "Quarterly Planning", zh: "季度规划" },
        description: {
          id: "Terpicu saat perencanaan kuartal dimulai.",
          en: "Fires at quarterly planning kickoff.",
          zh: "在季度规划启动时触发。",
        },
      },
      {
        id: "train-gap",
        kind: "action",
        label: { id: "Analisis Skill Gap", en: "Analyze Skill Gaps", zh: "分析技能差距" },
        description: {
          id: "Petakan kompetensi tim vs kebutuhan role.",
          en: "Map team competencies vs role requirements.",
          zh: "对照岗位要求梳理团队能力。",
        },
        prompt: {
          id: "Identifikasi 5 skill gap utama tim dan dampak bisnisnya.",
          en: "Identify top 5 team skill gaps and business impact.",
          zh: "识别团队前 5 项技能差距及业务影响。",
        },
      },
      {
        id: "train-schedule",
        kind: "action",
        label: { id: "Susun Jadwal", en: "Build Schedule", zh: "制定日程" },
        description: {
          id: "Rencanakan sesi pelatihan dan fasilitator.",
          en: "Plan training sessions and facilitators.",
          zh: "规划培训课程与讲师。",
        },
        prompt: {
          id: "Buat kalender pelatihan 6 minggu: topik, peserta, format, dan materi.",
          en: "Create a 6-week training calendar: topic, audience, format, and materials.",
          zh: "制定 6 周培训日历：主题、对象、形式与材料。",
        },
      },
      {
        id: "train-output",
        kind: "output",
        label: { id: "Komunikasikan ke Tim", en: "Communicate to Team", zh: "通知团队" },
        description: {
          id: "Siapkan pengumuman dan ekspektasi kehadiran.",
          en: "Prepare announcement and attendance expectations.",
          zh: "准备通知与出勤要求。",
        },
        prompt: {
          id: "Tulis pengumuman pelatihan internal dengan jadwal, tujuan, dan cara registrasi.",
          en: "Draft an internal training announcement with schedule, goals, and registration steps.",
          zh: "起草含日程、目标与报名方式的内部培训通知。",
        },
      },
    ],
  ),
  withMeta(
    "doc-approval",
    "approval",
    "operations",
    {
      id: "Rantai Persetujuan Dokumen",
      en: "Document Approval Chain",
      zh: "文档审批链",
    },
    {
      id: "Routing review, eskalasi, dan arsip versi final.",
      en: "Route reviews, escalate, and archive final versions.",
      zh: "流转审阅、升级处理并归档最终版本。",
    },
    [
      {
        id: "appr-trigger",
        kind: "trigger",
        label: { id: "Dokumen Diajukan", en: "Document Submitted", zh: "文档已提交" },
        description: {
          id: "Terpicu saat dokumen masuk antrian approval.",
          en: "Fires when a document enters the approval queue.",
          zh: "当文档进入审批队列时触发。",
        },
      },
      {
        id: "appr-review",
        kind: "action",
        label: { id: "Review Awal", en: "Initial Review", zh: "初审" },
        description: {
          id: "Cek kelengkapan dan kepatuhan.",
          en: "Check completeness and compliance.",
          zh: "检查完整性与合规性。",
        },
        prompt: {
          id: "Review dokumen: sebutkan bagian yang kurang, risiko compliance, dan saran perbaikan.",
          en: "Review the document: list missing sections, compliance risks, and fix suggestions.",
          zh: "审阅文档：列出缺失部分、合规风险与修改建议。",
        },
      },
      {
        id: "appr-condition",
        kind: "condition",
        label: { id: "Perlu Eskalasi?", en: "Needs Escalation?", zh: "需要升级？" },
        description: {
          id: "Tentukan apakah perlu approval level lebih tinggi.",
          en: "Decide if higher-level approval is required.",
          zh: "判断是否需要更高级别审批。",
        },
        prompt: {
          id: "Jawab YES jika nilai kontrak/risk memerlukan direksi, otherwise NO.",
          en: "Answer YES if contract value/risk requires director approval, otherwise NO.",
          zh: "若合同金额/风险需总监审批则 YES，否则 NO。",
        },
      },
      {
        id: "appr-output",
        kind: "output",
        label: { id: "Arsipkan Versi Final", en: "Archive Final Version", zh: "归档最终版本" },
        description: {
          id: "Catat keputusan dan simpan metadata arsip.",
          en: "Log decision and store archive metadata.",
          zh: "记录决定并保存归档元数据。",
        },
        prompt: {
          id: "Buat log approval: status, reviewer, tanggal, dan ringkasan perubahan versi final.",
          en: "Create an approval log: status, reviewer, date, and final version change summary.",
          zh: "创建审批日志：状态、审阅人、日期与最终版变更摘要。",
        },
      },
    ],
  ),
  withMeta(
    "daily-standup",
    "standup",
    "project-management",
    {
      id: "Otomasi Daily Standup",
      en: "Daily Standup Automation",
      zh: "每日站会自动化",
    },
    {
      id: "Kumpulkan update tim, deteksi blocker, dan ringkas untuk lead.",
      en: "Collect team updates, detect blockers, and summarize for leads.",
      zh: "收集团队更新、识别阻塞并向负责人汇总。",
    },
    [
      {
        id: "standup-trigger",
        kind: "trigger",
        label: { id: "Pagi Hari Kerja", en: "Weekday Morning", zh: "工作日上午" },
        description: {
          id: "Terpicu setiap pagi hari kerja.",
          en: "Fires every weekday morning.",
          zh: "在每个工作日上午触发。",
        },
      },
      {
        id: "standup-collect",
        kind: "action",
        label: { id: "Kumpulkan Update", en: "Collect Updates", zh: "收集更新" },
        description: {
          id: "Agregasi yesterday/today/blockers dari tim.",
          en: "Aggregate yesterday/today/blockers from the team.",
          zh: "汇总团队昨日/今日/阻塞项。",
        },
        prompt: {
          id: "Susun standup update per anggota: kemarin, hari ini, blocker.",
          en: "Compile per-member standup: yesterday, today, blockers.",
          zh: "按成员整理站会：昨日、今日、阻塞项。",
        },
      },
      {
        id: "standup-blockers",
        kind: "condition",
        label: { id: "Blocker Kritis?", en: "Critical Blockers?", zh: "关键阻塞？" },
        description: {
          id: "Identifikasi blocker yang butuh eskalasi.",
          en: "Identify blockers needing escalation.",
          zh: "识别需升级的阻塞项。",
        },
        prompt: {
          id: "Jawab YES jika ada blocker yang menghambat milestone minggu ini, otherwise NO.",
          en: "Answer YES if any blocker threatens this week's milestone, otherwise NO.",
          zh: "若有阻塞影响本周里程碑则 YES，否则 NO。",
        },
      },
      {
        id: "standup-output",
        kind: "output",
        label: { id: "Ringkas untuk Lead", en: "Summarize for Lead", zh: "向负责人汇总" },
        description: {
          id: "Kirim ringkasan standup ke tech lead/PM.",
          en: "Send standup summary to tech lead/PM.",
          zh: "向技术负责人/PM 发送站会摘要。",
        },
        prompt: {
          id: "Buat ringkasan standup 1 halaman: progres, risiko, dan kebutuhan dukungan.",
          en: "Create a one-page standup summary: progress, risks, and support needs.",
          zh: "生成一页站会摘要：进展、风险与支持需求。",
        },
      },
    ],
  ),
  withMeta(
    "tender-prep",
    "tender",
    "operations",
    {
      id: "Persiapan & Pengajuan Tender",
      en: "Tender Preparation & Submission",
      zh: "招标准备与提交",
    },
    {
      id: "Checklist dokumen tender, review compliance, dan paket submission.",
      en: "Tender document checklist, compliance review, and submission pack.",
      zh: "招标文件清单、合规审查与提交包。",
    },
    [
      {
        id: "tender-trigger",
        kind: "trigger",
        label: { id: "Tender Diumumkan", en: "Tender Announced", zh: "招标公告发布" },
        description: {
          id: "Terpicu saat RFP/tender baru tersedia.",
          en: "Fires when a new RFP/tender is published.",
          zh: "在新 RFP/招标发布时触发。",
        },
      },
      {
        id: "tender-checklist",
        kind: "action",
        label: { id: "Checklist Dokumen", en: "Document Checklist", zh: "文件清单" },
        description: {
          id: "Petakan persyaratan administrasi dan teknis.",
          en: "Map administrative and technical requirements.",
          zh: "梳理行政与技术要求。",
        },
        prompt: {
          id: "Buat checklist dokumen tender lengkap dengan PIC dan deadline per item.",
          en: "Create a complete tender document checklist with owners and per-item deadlines.",
          zh: "创建完整招标文件清单，含负责人与各项截止日期。",
        },
      },
      {
        id: "tender-compliance",
        kind: "action",
        label: { id: "Review Compliance", en: "Compliance Review", zh: "合规审查" },
        description: {
          id: "Pastikan proposal memenuhi kriteria wajib.",
          en: "Ensure proposal meets mandatory criteria.",
          zh: "确保方案满足强制性标准。",
        },
        prompt: {
          id: "Review kepatuhan proposal terhadap kriteria tender: sebutkan gap dan mitigasi.",
          en: "Review proposal compliance against tender criteria: list gaps and mitigations.",
          zh: "对照招标标准审查方案合规性：列出差距与缓解措施。",
        },
      },
      {
        id: "tender-output",
        kind: "output",
        label: { id: "Paket Submission", en: "Submission Pack", zh: "提交包" },
        description: {
          id: "Rangkum paket akhir siap unggah.",
          en: "Summarize final pack ready for upload.",
          zh: "汇总可上传的最终提交包。",
        },
        prompt: {
          id: "Buat ringkasan paket submission tender: daftar file, versi, dan konfirmasi checklist.",
          en: "Create a tender submission pack summary: file list, versions, and checklist confirmation.",
          zh: "创建招标提交包摘要：文件列表、版本与清单确认。",
        },
      },
    ],
  ),
  withMeta(
    "it-request",
    "it",
    "it",
    {
      id: "Workflow Permintaan Infrastruktur IT",
      en: "IT Infrastructure Request Workflow",
      zh: "IT 基础设施申请流程",
    },
    {
      id: "Intake permintaan, assess impact, dan provisioning checklist.",
      en: "Request intake, impact assessment, and provisioning checklist.",
      zh: "受理申请、影响评估与开通清单。",
    },
    [
      {
        id: "it-trigger",
        kind: "trigger",
        label: { id: "Ticket IT Baru", en: "New IT Ticket", zh: "新 IT 工单" },
        description: {
          id: "Terpicu saat permintaan infrastruktur masuk.",
          en: "Fires when an infrastructure request is filed.",
          zh: "在提交基础设施申请时触发。",
        },
      },
      {
        id: "it-triage",
        kind: "action",
        label: { id: "Triage Permintaan", en: "Triage Request", zh: "工单分诊" },
        description: {
          id: "Klasifikasi urgensi dan kategori layanan.",
          en: "Classify urgency and service category.",
          zh: "分类紧急程度与服务类别。",
        },
        prompt: {
          id: "Klasifikasikan ticket: kategori (server/network/access), prioritas, dan SLA target.",
          en: "Classify the ticket: category (server/network/access), priority, and SLA target.",
          zh: "分类工单：类别（服务器/网络/权限）、优先级与 SLA 目标。",
        },
      },
      {
        id: "it-assess",
        kind: "action",
        label: { id: "Assess Dampak", en: "Assess Impact", zh: "影响评估" },
        description: {
          id: "Evaluasi risiko dan dependensi sistem.",
          en: "Evaluate risk and system dependencies.",
          zh: "评估风险与系统依赖。",
        },
        prompt: {
          id: "Analisis dampak perubahan infrastruktur: sistem terdampak, downtime, dan rollback plan.",
          en: "Analyze infrastructure change impact: affected systems, downtime, and rollback plan.",
          zh: "分析基础设施变更影响：受影响系统、停机时间与回滚方案。",
        },
      },
      {
        id: "it-output",
        kind: "output",
        label: { id: "Checklist Provisioning", en: "Provisioning Checklist", zh: "开通清单" },
        description: {
          id: "Output langkah implementasi untuk tim IT.",
          en: "Output implementation steps for the IT team.",
          zh: "为 IT 团队输出实施步骤。",
        },
        prompt: {
          id: "Buat checklist provisioning berurutan dengan owner, validasi keamanan, dan jadwal deploy.",
          en: "Create a sequential provisioning checklist with owners, security validation, and deploy schedule.",
          zh: "创建顺序开通清单，含负责人、安全验证与部署计划。",
        },
      },
    ],
  ),
];

function localizeNode(
  node: WorkflowNode,
  steps: TemplateStepInput[],
  locale: Locale,
): WorkflowNode {
  const step = steps.find((item) => item.id === node.id);
  if (!step) {
    return {
      ...node,
      data: { ...node.data },
      position: { ...node.position },
    };
  }

  return {
    ...node,
    data: {
      ...node.data,
      label: localize(step.label, locale),
      description: localize(step.description, locale),
      prompt: step.prompt ? localize(step.prompt, locale) : undefined,
      config: step.config,
    },
    position: { ...node.position },
  };
}

function resolveBuiltinTemplate(
  template: WorkflowTemplate,
  locale: Locale,
): ResolvedWorkflowTemplate {
  const steps = template.steps ?? [];

  const localizedNodes = template.definition.nodes.map((node) =>
    localizeNode(node, steps, locale),
  );

  const graph = normalizeWorkflowTemplateGraph(
    localizedNodes,
    template.definition.edges,
  );

  return {
    id: template.id,
    source: template.source,
    icon: template.icon,
    category: template.category,
    title: localize(template.title, locale),
    description: localize(template.description, locale),
    name: localize(template.definition.name, locale),
    workflowDescription: localize(template.definition.description, locale),
    nodes: graph.nodes,
    edges: graph.edges,
  };
}

export function getBuiltinWorkflowTemplates(): WorkflowTemplate[] {
  return BUILTIN_WORKFLOW_TEMPLATES;
}

export function getWorkflowTemplateById(
  templateId: string,
): WorkflowTemplate | null {
  return BUILTIN_WORKFLOW_TEMPLATES.find((item) => item.id === templateId) ?? null;
}

export function resolveWorkflowTemplate(
  template: WorkflowTemplate,
  locale: Locale,
): ResolvedWorkflowTemplate {
  if (template.source === "builtin") {
    const builtin = BUILTIN_WORKFLOW_TEMPLATES.find((item) => item.id === template.id);
    if (builtin) {
      return resolveBuiltinTemplate(builtin, locale);
    }
  }

  const graph = normalizeWorkflowTemplateGraph(
    template.definition.nodes,
    template.definition.edges,
  );

  return {
    id: template.id,
    source: template.source,
    icon: template.icon,
    category: template.category,
    title: localize(template.title, locale),
    description: localize(template.description, locale),
    name: localize(template.definition.name, locale),
    workflowDescription: localize(template.definition.description, locale),
    nodes: graph.nodes,
    edges: graph.edges,
  };
}

export function workflowTemplateFromUserRecord(input: {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  definition: {
    name?: string;
    description?: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
}): WorkflowTemplate {
  const title = input.name;
  const description = input.description ?? "";
  const localized = (value: string): Record<Locale, string> => ({
    id: value,
    en: value,
    zh: value,
  });

  return {
    id: input.id,
    source: "user",
    icon: "custom",
    category:
      (input.category as WorkflowTemplateCategory | undefined) ?? "custom",
    title: localized(title),
    description: localized(description),
    definition: {
      name: localized(input.definition.name ?? title),
      description: localized(input.definition.description ?? description),
      nodes: input.definition.nodes,
      edges: input.definition.edges,
    },
  };
}

export function searchWorkflowTemplates(
  templates: WorkflowTemplate[],
  locale: Locale,
  query: string,
): WorkflowTemplate[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return templates;

  return templates.filter((template) => {
    const resolved = resolveWorkflowTemplate(template, locale);
    const haystack = [
      resolved.title,
      resolved.description,
      resolved.name,
      resolved.workflowDescription ?? "",
      resolved.category,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function serializeWorkflowForExport(input: {
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}): string {
  const payload: WorkflowExportPayload = {
    version: WORKFLOW_EXPORT_VERSION,
    name: input.name,
    description: input.description,
    nodes: input.nodes,
    edges: input.edges,
    exportedAt: Date.now(),
  };
  return JSON.stringify(payload, null, 2);
}

export function parseWorkflowImportJson(
  raw: string,
):
  | {
      name: string;
      description?: string;
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
      fixes: string[];
    }
  | null {
  try {
    const parsed = JSON.parse(raw) as Partial<WorkflowExportPayload> & {
      workflow?: {
        name?: string;
        description?: string;
        nodes?: unknown[];
        edges?: unknown[];
      };
    };

    const nested = parsed.workflow;
    const nodesSource = Array.isArray(parsed.nodes)
      ? parsed.nodes
      : Array.isArray(nested?.nodes)
        ? nested.nodes
        : null;

    if (!nodesSource || nodesSource.length === 0) {
      return null;
    }

    const edgesSource = Array.isArray(parsed.edges)
      ? parsed.edges
      : Array.isArray(nested?.edges)
        ? nested.edges
        : [];

    const graph = normalizeWorkflowTemplateGraph(nodesSource, edgesSource);
    if (graph.nodes.length === 0) {
      return null;
    }

    const name =
      (typeof parsed.name === "string" && parsed.name.trim()) ||
      (typeof nested?.name === "string" && nested.name.trim()) ||
      "Imported Workflow";
    const description =
      (typeof parsed.description === "string" && parsed.description.trim()) ||
      (typeof nested?.description === "string" && nested.description.trim()) ||
      undefined;

    return {
      name,
      description: description || undefined,
      nodes: graph.nodes,
      edges: graph.edges,
      fixes: graph.fixes,
    };
  } catch {
    return null;
  }
}

/** Workspace preloaded with the Employee Onboarding built-in template (tests). */
export function createDemoWorkflowWorkspace(): WorkflowWorkspace {
  const template = BUILTIN_WORKFLOW_TEMPLATES[0]!;
  const resolved = resolveWorkflowTemplate(template, "en");

  return applyWorkflowTemplateToWorkspace(createEmptyWorkflowWorkspace(), {
    name: resolved.name,
    description: resolved.workflowDescription,
    nodes: resolved.nodes,
    edges: resolved.edges,
  });
}

