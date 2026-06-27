import type { Locale } from "@/lib/config";

export const AGENT_COPY: Record<
  Locale,
  {
    navChat: string;
    navAgent: string;
    title: string;
    subtitle: string;
    sandboxBadge: string;
    instructionLabel: string;
    instructionPlaceholder: string;
    uploadLabel: string;
    uploadHint: string;
    analyzeButton: string;
    analyzing: string;
    newWorkflow: string;
    workflowHistory: string;
    noWorkflows: string;
    noWorkflowsHint: string;
    analysisTitle: string;
    proposalTitle: string;
    placeholdersTitle: string;
    mermaidTitle: string;
    approveExecute: string;
    editWorkflow: string;
    cancel: string;
    approveFirst: string;
    executing: string;
    executionTitle: string;
    artifactsTitle: string;
    downloadArtifact: string;
    approvalRequired: string;
    sandboxNotice: string;
    entitiesLabel: string;
    validationLabel: string;
    ragUsed: string;
    ragNotUsed: string;
    stepApproval: string;
    editSave: string;
    editCancel: string;
    removeFile: string;
    uploadError: string;
    uploadTooLarge: string;
    uploadUnsupported: string;
    apiError: string;
    openSessions: string;
    account: string;
    statusDraft: string;
    statusAnalyzing: string;
    statusProposed: string;
    statusAwaiting: string;
    statusApproved: string;
    statusExecuting: string;
    statusCompleted: string;
    statusCancelled: string;
  }
> = {
  id: {
    navChat: "Chat",
    navAgent: "Agent",
    title: "AgentFlow AI",
    subtitle:
      "Stateful agentic workflow automation dengan human-in-the-loop",
    sandboxBadge: "Sandbox Terisolasi",
    instructionLabel: "Instruksi Workflow",
    instructionPlaceholder:
      "Jelaskan workflow yang ingin Anda otomatisasi dalam bahasa natural...\n\nContoh: \"Analisis laporan keuangan Q1, ringkas temuan utama, dan buat draft email untuk tim finance.\"",
    uploadLabel: "Upload Dokumen",
    uploadHint: "PDF, DOCX, XLSX — maks. 10 MB per file, hingga 10 file",
    analyzeButton: "Analyze & Generate Workflow",
    analyzing: "Menganalisis dokumen & merancang workflow...",
    newWorkflow: "Workflow Baru",
    workflowHistory: "Riwayat Workflow",
    noWorkflows: "Belum ada workflow",
    noWorkflowsHint: "Buat instruksi dan klik Analyze untuk memulai.",
    analysisTitle: "Document Analysis & Validation",
    proposalTitle: "Workflow Proposal",
    placeholdersTitle: "Placeholder Injection Preview",
    mermaidTitle: "Diagram Workflow",
    approveExecute: "Approve & Execute",
    editWorkflow: "Edit Workflow",
    cancel: "Cancel",
    approveFirst: "Setujui workflow sebelum eksekusi di sandbox.",
    executing: "Menjalankan workflow di sandbox...",
    executionTitle: "Execution Progress",
    artifactsTitle: "Artifacts & Results",
    downloadArtifact: "Salin hasil",
    approvalRequired: "Memerlukan persetujuan Anda",
    sandboxNotice:
      "Semua eksekusi berjalan di lingkungan sandbox terisolasi. Tidak ada perubahan pada sistem produksi tanpa approval eksplisit.",
    entitiesLabel: "Entitas terdeteksi",
    validationLabel: "Validasi",
    ragUsed: "Konteks RAG perusahaan digunakan",
    ragNotUsed: "RAG tidak digunakan",
    stepApproval: "Langkah persetujuan",
    editSave: "Simpan Perubahan",
    editCancel: "Batal Edit",
    removeFile: "Hapus",
    uploadError: "Gagal memproses file.",
    uploadTooLarge: "File terlalu besar (maks. 10 MB).",
    uploadUnsupported: "Format tidak didukung. Gunakan PDF, DOCX, atau XLSX.",
    apiError: "Gagal memproses permintaan AgentFlow.",
    openSessions: "Buka sidebar",
    account: "Akun",
    statusDraft: "Draft",
    statusAnalyzing: "Menganalisis",
    statusProposed: "Proposal",
    statusAwaiting: "Menunggu Approval",
    statusApproved: "Disetujui",
    statusExecuting: "Eksekusi",
    statusCompleted: "Selesai",
    statusCancelled: "Dibatalkan",
  },
  en: {
    navChat: "Chat",
    navAgent: "Agent",
    title: "AgentFlow AI",
    subtitle: "Stateful agentic workflow automation with human-in-the-loop",
    sandboxBadge: "Isolated Sandbox",
    instructionLabel: "Workflow Instruction",
    instructionPlaceholder:
      "Describe the workflow you want to automate in natural language...\n\nExample: \"Analyze the Q1 financial report, summarize key findings, and draft an email for the finance team.\"",
    uploadLabel: "Upload Documents",
    uploadHint: "PDF, DOCX, XLSX — max 10 MB per file, up to 10 files",
    analyzeButton: "Analyze & Generate Workflow",
    analyzing: "Analyzing documents & designing workflow...",
    newWorkflow: "New Workflow",
    workflowHistory: "Workflow History",
    noWorkflows: "No workflows yet",
    noWorkflowsHint: "Write an instruction and click Analyze to get started.",
    analysisTitle: "Document Analysis & Validation",
    proposalTitle: "Workflow Proposal",
    placeholdersTitle: "Placeholder Injection Preview",
    mermaidTitle: "Workflow Diagram",
    approveExecute: "Approve & Execute",
    editWorkflow: "Edit Workflow",
    cancel: "Cancel",
    approveFirst: "Approve the workflow before sandbox execution.",
    executing: "Running workflow in sandbox...",
    executionTitle: "Execution Progress",
    artifactsTitle: "Artifacts & Results",
    downloadArtifact: "Copy result",
    approvalRequired: "Requires your approval",
    sandboxNotice:
      "All execution runs in an isolated sandbox. No production changes without explicit approval.",
    entitiesLabel: "Detected entities",
    validationLabel: "Validation",
    ragUsed: "Company RAG context used",
    ragNotUsed: "RAG not used",
    stepApproval: "Approval step",
    editSave: "Save Changes",
    editCancel: "Cancel Edit",
    removeFile: "Remove",
    uploadError: "Failed to process file.",
    uploadTooLarge: "File too large (max 10 MB).",
    uploadUnsupported: "Unsupported format. Use PDF, DOCX, or XLSX.",
    apiError: "Failed to process AgentFlow request.",
    openSessions: "Open sidebar",
    account: "Account",
    statusDraft: "Draft",
    statusAnalyzing: "Analyzing",
    statusProposed: "Proposed",
    statusAwaiting: "Awaiting Approval",
    statusApproved: "Approved",
    statusExecuting: "Executing",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
  },
  zh: {
    navChat: "聊天",
    navAgent: "Agent",
    title: "AgentFlow AI",
    subtitle: "带人工审核的有状态智能体工作流自动化",
    sandboxBadge: "隔离沙箱",
    instructionLabel: "工作流指令",
    instructionPlaceholder:
      "用自然语言描述您想自动化的工作流...\n\n示例：\"分析第一季度财务报告，总结主要发现，并为财务团队起草邮件。\"",
    uploadLabel: "上传文档",
    uploadHint: "PDF、DOCX、XLSX — 每个文件最大 10 MB，最多 10 个",
    analyzeButton: "分析并生成工作流",
    analyzing: "正在分析文档并设计工作流...",
    newWorkflow: "新工作流",
    workflowHistory: "工作流历史",
    noWorkflows: "暂无工作流",
    noWorkflowsHint: "输入指令并点击分析以开始。",
    analysisTitle: "文档分析与验证",
    proposalTitle: "工作流提案",
    placeholdersTitle: "占位符注入预览",
    mermaidTitle: "工作流图表",
    approveExecute: "批准并执行",
    editWorkflow: "编辑工作流",
    cancel: "取消",
    approveFirst: "请在沙箱执行前批准工作流。",
    executing: "正在沙箱中运行工作流...",
    executionTitle: "执行进度",
    artifactsTitle: "产物与结果",
    downloadArtifact: "复制结果",
    approvalRequired: "需要您的批准",
    sandboxNotice:
      "所有执行均在隔离沙箱中运行。未经明确批准不会更改生产系统。",
    entitiesLabel: "检测到的实体",
    validationLabel: "验证",
    ragUsed: "已使用公司 RAG 上下文",
    ragNotUsed: "未使用 RAG",
    stepApproval: "审批步骤",
    editSave: "保存更改",
    editCancel: "取消编辑",
    removeFile: "删除",
    uploadError: "文件处理失败。",
    uploadTooLarge: "文件过大（最大 10 MB）。",
    uploadUnsupported: "不支持的格式。请使用 PDF、DOCX 或 XLSX。",
    apiError: "AgentFlow 请求处理失败。",
    openSessions: "打开侧边栏",
    account: "账户",
    statusDraft: "草稿",
    statusAnalyzing: "分析中",
    statusProposed: "已提案",
    statusAwaiting: "等待批准",
    statusApproved: "已批准",
    statusExecuting: "执行中",
    statusCompleted: "已完成",
    statusCancelled: "已取消",
  },
};