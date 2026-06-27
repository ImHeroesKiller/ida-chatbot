import type { Locale } from "@/lib/config";

export const COPY: Record<
  Locale,
  {
    welcome: string;
    subtitle: string;
    windowLabel: string;
    open: string;
    close: string;
    inputLabel: string;
    inputPlaceholder: string;
    send: string;
    disclaimer: string;
    handoff: string;
    handoffTitle: string;
    handoffTopic: string;
    handoffDescription: string;
    handoffClose: string;
    handoffCopy: string;
    newChat: string;
    sessionsLabel: string;
    noSessions: string;
    openSessions: string;
    expandSidebar: string;
    collapseSidebar: string;
    emptyStateTitle: string;
    emptyStateHint: string;
    emptyStateTipsTitle: string;
    emptyStateTips: string[];
    copyMessage: string;
    copySuccess: string;
    toggleTheme: string;
    sendShortcut: string;
    searchSessions: string;
    noSearchResults: string;
    noSessionsHint: string;
    sessionMenu: string;
    pinSession: string;
    unpinSession: string;
    renameSession: string;
    renameLabel: string;
    renameSave: string;
    deleteSession: string;
    deleteConfirm: string;
    settings: string;
    compactMode: string;
    clearAllChats: string;
    clearAllConfirm: string;
    errors: {
      generic: string;
      rateLimit: string;
      tooLong: string;
    };
  }
> = {
  id: {
    welcome:
      "Halo! Saya IDA — asisten AI mandiri yang siap membantu. Ada yang bisa saya bantu hari ini?",
    subtitle: "Intelligent Digital Assistant",
    windowLabel: "Jendela chat IDA",
    open: "Buka chat IDA",
    close: "Tutup chat",
    inputLabel: "Pesan untuk IDA",
    inputPlaceholder: "Ketik pesan Anda...",
    send: "Kirim",
    disclaimer: "IDA adalah asisten AI. Verifikasi info penting secara mandiri.",
    handoff: "Hubungi tim manusia",
    handoffTitle: "Handoff ke Tim Manusia",
    handoffTopic: "Topik",
    handoffDescription: "Ringkasan percakapan",
    handoffClose: "Tutup",
    handoffCopy: "Salin ringkasan",
    newChat: "Chat Baru",
    sessionsLabel: "Daftar percakapan",
    noSessions: "Belum ada percakapan",
    openSessions: "Buka daftar percakapan",
    expandSidebar: "Perluas sidebar",
    collapseSidebar: "Ciutkan sidebar",
    emptyStateTitle: "Mulai percakapan",
    emptyStateHint: "Ketik pesan di bawah atau pilih saran cepat untuk memulai.",
    emptyStateTipsTitle: "Tips",
    emptyStateTips: [
      "Tanyakan apa saja — IDA mendukung Bahasa Indonesia, Inggris, dan Mandarin.",
      "Gunakan quick reply untuk memulai dengan cepat.",
      "Tekan ⌘/Ctrl + Enter untuk mengirim pesan.",
    ],
    copyMessage: "Salin pesan",
    copySuccess: "Pesan disalin",
    toggleTheme: "Ganti tema",
    sendShortcut: "⌘/Ctrl + Enter untuk kirim",
    searchSessions: "Cari percakapan...",
    noSearchResults: "Tidak ada percakapan yang cocok",
    noSessionsHint: "Mulai chat baru untuk menyimpan riwayat di sini.",
    sessionMenu: "Menu percakapan",
    pinSession: "Sematkan",
    unpinSession: "Lepas sematan",
    renameSession: "Ubah nama",
    renameLabel: "Nama percakapan",
    renameSave: "Simpan",
    deleteSession: "Hapus",
    deleteConfirm: "Hapus percakapan ini? Tindakan tidak dapat dibatalkan.",
    settings: "Pengaturan",
    compactMode: "Mode ringkas",
    clearAllChats: "Hapus semua chat",
    clearAllConfirm: "Hapus semua percakapan? Tindakan ini tidak dapat dibatalkan.",
    errors: {
      generic: "Gagal mendapatkan respons. Coba lagi.",
      rateLimit: "Terlalu banyak permintaan. Tunggu sebentar.",
      tooLong: "Pesan terlalu panjang.",
    },
  },
  en: {
    welcome:
      "Hello! I'm IDA — an independent AI assistant ready to help. What can I do for you today?",
    subtitle: "Intelligent Digital Assistant",
    windowLabel: "IDA chat window",
    open: "Open IDA chat",
    close: "Close chat",
    inputLabel: "Message to IDA",
    inputPlaceholder: "Type your message...",
    send: "Send",
    disclaimer: "IDA is an AI assistant. Verify important information independently.",
    handoff: "Talk to a human",
    handoffTitle: "Human Handoff",
    handoffTopic: "Topic",
    handoffDescription: "Conversation summary",
    handoffClose: "Close",
    handoffCopy: "Copy summary",
    newChat: "New Chat",
    sessionsLabel: "Chat sessions",
    noSessions: "No conversations yet",
    openSessions: "Open chat sessions",
    expandSidebar: "Expand sidebar",
    collapseSidebar: "Collapse sidebar",
    emptyStateTitle: "Start a conversation",
    emptyStateHint: "Type a message below or pick a quick suggestion to begin.",
    emptyStateTipsTitle: "Tips",
    emptyStateTips: [
      "Ask anything — IDA supports Indonesian, English, and Chinese.",
      "Use quick replies to get started faster.",
      "Press ⌘/Ctrl + Enter to send a message.",
    ],
    copyMessage: "Copy message",
    copySuccess: "Message copied",
    toggleTheme: "Toggle theme",
    sendShortcut: "⌘/Ctrl + Enter to send",
    searchSessions: "Search conversations...",
    noSearchResults: "No matching conversations",
    noSessionsHint: "Start a new chat to save history here.",
    sessionMenu: "Conversation menu",
    pinSession: "Pin",
    unpinSession: "Unpin",
    renameSession: "Rename",
    renameLabel: "Conversation name",
    renameSave: "Save",
    deleteSession: "Delete",
    deleteConfirm: "Delete this conversation? This cannot be undone.",
    settings: "Settings",
    compactMode: "Compact mode",
    clearAllChats: "Clear all chats",
    clearAllConfirm: "Delete all conversations? This cannot be undone.",
    errors: {
      generic: "Failed to get a response. Please try again.",
      rateLimit: "Too many requests. Please wait a moment.",
      tooLong: "Message is too long.",
    },
  },
  zh: {
    welcome:
      "你好！我是 IDA — 独立的 AI 助手，随时为你提供帮助。今天有什么可以帮你的？",
    subtitle: "智能数字助手",
    windowLabel: "IDA 聊天窗口",
    open: "打开 IDA 聊天",
    close: "关闭聊天",
    inputLabel: "发送给 IDA 的消息",
    inputPlaceholder: "输入消息...",
    send: "发送",
    disclaimer: "IDA 是 AI 助手。请自行核实重要信息。",
    handoff: "联系人工客服",
    handoffTitle: "转接人工客服",
    handoffTopic: "主题",
    handoffDescription: "对话摘要",
    handoffClose: "关闭",
    handoffCopy: "复制摘要",
    newChat: "新对话",
    sessionsLabel: "对话列表",
    noSessions: "暂无对话",
    openSessions: "打开对话列表",
    expandSidebar: "展开侧边栏",
    collapseSidebar: "收起侧边栏",
    emptyStateTitle: "开始对话",
    emptyStateHint: "在下方输入消息或选择快捷建议开始。",
    emptyStateTipsTitle: "小贴士",
    emptyStateTips: [
      "随意提问 — IDA 支持印尼语、英语和中文。",
      "使用快捷回复更快开始。",
      "按 ⌘/Ctrl + Enter 发送消息。",
    ],
    copyMessage: "复制消息",
    copySuccess: "消息已复制",
    toggleTheme: "切换主题",
    sendShortcut: "⌘/Ctrl + Enter 发送",
    searchSessions: "搜索对话...",
    noSearchResults: "没有匹配的对话",
    noSessionsHint: "开始新对话以在此保存记录。",
    sessionMenu: "对话菜单",
    pinSession: "置顶",
    unpinSession: "取消置顶",
    renameSession: "重命名",
    renameLabel: "对话名称",
    renameSave: "保存",
    deleteSession: "删除",
    deleteConfirm: "删除此对话？此操作无法撤销。",
    settings: "设置",
    compactMode: "紧凑模式",
    clearAllChats: "清除所有对话",
    clearAllConfirm: "删除所有对话？此操作无法撤销。",
    errors: {
      generic: "获取回复失败，请重试。",
      rateLimit: "请求过多，请稍后再试。",
      tooLong: "消息过长。",
    },
  },
};