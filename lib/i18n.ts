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
    chatHistory: string;
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
    clearAllChats: string;
    shareMessage: string;
    shareSuccess: string;
    regenerate: string;
    thumbsUp: string;
    thumbsDown: string;
    reactionThanks: string;
    reactionFeedback: string;
    scrollToBottom: string;
    emptyStateSubtitle: string;
    clearAllConfirm: string;
    attachFile: string;
    uploadUnsupported: string;
    uploadTooLarge: string;
    uploadSuccess: string;
    fileAttached: string;
    pendingOcrHint: string;
    extractingFile: string;
    extractedTextLabel: string;
    removeAttachment: string;
    ocrFailed: string;
    ocrEmpty: string;
    ocrNetworkError: string;
    ocrUnavailable: string;
    listening: string;
    listeningPlaceholder: string;
    startListening: string;
    stopListening: string;
    voiceError: string;
    voiceErrorNotAllowed: string;
    voiceErrorNoSpeech: string;
    voiceErrorNetwork: string;
    voiceErrorUnsupported: string;
    voiceErrorMic: string;
    voiceErrorTranscribe: string;
    voiceTranscribing: string;
    voiceRecorderMode: string;
    holdToRecord: string;
    releaseToSend: string;
    voiceRecording: string;
    voiceNoteLabel: string;
    speakMessage: string;
    stopSpeaking: string;
    autoSpeak: string;
    account: string;
    loginWithGoogle: string;
    loginSubtitle: string;
    loginTagline: string;
    logout: string;
    profileTitle: string;
    profileEmail: string;
    profileName: string;
    profileUserId: string;
    backToChat: string;
    authError: string;
    voiceSettings: string;
    appLanguage: string;
    reviewVoiceBeforeSend: string;
    voiceLanguage: string;
    speechRate: string;
    speechPitch: string;
    sendAsVoiceNote: string;
    webSearchSources: string;
    webSearchToggle: string;
    webSearchOn: string;
    webSearchOff: string;
    webSearchUnavailable: string;
    editMessage: string;
    editSave: string;
    editCancel: string;
    copyCode: string;
    fontSizeSetting: string;
    fontSizeSmall: string;
    fontSizeMedium: string;
    fontSizeLarge: string;
    errors: {
      generic: string;
      rateLimit: string;
      tooLong: string;
    };
  }
> = {
  id: {
    welcome:
      "Halo! Saya **IDA** — Intelligent Digital Assistant yang siap membantu Anda.\n\nSaya bisa membantu dengan:\n- Pertanyaan umum & penjelasan\n- Brainstorming ide\n- Panduan langkah demi langkah\n\nApa yang ingin Anda tanyakan hari ini?",
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
    emptyStateTitle: "Selamat datang di IDA",
    emptyStateSubtitle: "Asisten AI mandiri, multilingual, siap 24/7",
    emptyStateHint: "Ketik pesan di bawah atau pilih saran cepat untuk memulai percakapan.",
    emptyStateTipsTitle: "Tips",
    emptyStateTips: [
      "Tanyakan apa saja — IDA mendukung Bahasa Indonesia, Inggris, dan Mandarin.",
      "Gunakan quick reply untuk memulai dengan cepat.",
      "Tekan ⌘/Ctrl + Enter untuk mengirim pesan.",
    ],
    copyMessage: "Salin pesan",
    copySuccess: "Pesan disalin",
    toggleTheme: "Ganti tema",
    sendShortcut: "Enter untuk kirim · ⌘/Ctrl + Enter untuk baris baru",
    chatHistory: "Riwayat Chat",
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
    clearAllChats: "Hapus semua chat",
    shareMessage: "Bagikan",
    shareSuccess: "Pesan disalin untuk dibagikan",
    regenerate: "Buat ulang",
    thumbsUp: "Membantu",
    thumbsDown: "Kurang membantu",
    reactionThanks: "Terima kasih atas masukannya!",
    reactionFeedback: "Masukan dicatat, terima kasih!",
    scrollToBottom: "Ke bawah",
    clearAllConfirm: "Hapus semua percakapan? Tindakan ini tidak dapat dibatalkan.",
    attachFile: "Lampirkan gambar atau PDF",
    uploadUnsupported: "Format file tidak didukung. Gunakan JPG, PNG, WebP, GIF, atau PDF.",
    uploadTooLarge: "File terlalu besar. Maksimal 10 MB.",
    uploadSuccess: "File berhasil diproses",
    fileAttached: "File dilampirkan — OCR saat kirim",
    pendingOcrHint: "Teks akan diekstrak saat Anda mengirim pesan",
    extractingFile: "Mengekstrak teks dari file...",
    extractedTextLabel: "Teks diekstrak",
    removeAttachment: "Hapus lampiran",
    ocrFailed: "Gagal mengekstrak teks. Coba file lain atau kirim ulang.",
    ocrEmpty: "Tidak ada teks yang terbaca di file ini.",
    ocrNetworkError: "Koneksi gagal saat OCR. Periksa internet lalu coba lagi.",
    ocrUnavailable: "Layanan OCR belum tersedia. Coba lagi nanti.",
    listening: "Mendengarkan...",
    listeningPlaceholder: "Bicara sekarang...",
    startListening: "Mulai rekaman suara",
    stopListening: "Hentikan rekaman",
    voiceError: "Gagal mengenali suara. Coba lagi.",
    voiceErrorNotAllowed: "Akses mikrofon ditolak. Izinkan di pengaturan browser.",
    voiceErrorNoSpeech: "Tidak terdengar suara. Coba bicara lebih dekat ke mic.",
    voiceErrorNetwork: "Koneksi gagal saat transkripsi suara.",
    voiceErrorUnsupported: "Browser ini tidak mendukung input suara.",
    voiceErrorMic: "Tidak dapat mengakses mikrofon. Periksa perangkat Anda.",
    voiceErrorTranscribe: "Gagal mentranskripsikan rekaman. Coba rekam ulang.",
    voiceTranscribing: "Mentranskripsikan rekaman...",
    voiceRecorderMode: "Mode rekaman — bicara lalu hentikan",
    holdToRecord: "Tahan untuk merekam",
    releaseToSend: "Lepas untuk kirim",
    voiceRecording: "Merekam...",
    voiceNoteLabel: "Pesan suara",
    speakMessage: "Dengarkan pesan",
    stopSpeaking: "Hentikan suara",
    autoSpeak: "Suara otomatis",
    account: "Akun",
    loginWithGoogle: "Masuk dengan Google",
    loginSubtitle: "Masuk untuk menyimpan riwayat chat di semua perangkat.",
    loginTagline: "Asisten AI cerdas dengan RAG, memori, dan dukungan multibahasa.",
    logout: "Keluar",
    profileTitle: "Profil Akun",
    profileEmail: "Email",
    profileName: "Nama",
    profileUserId: "User ID",
    backToChat: "Kembali ke chat",
    authError: "Gagal masuk. Silakan coba lagi.",
    voiceSettings: "Pengaturan suara",
    appLanguage: "Bahasa antarmuka",
    reviewVoiceBeforeSend: "Edit suara sebelum kirim",
    voiceLanguage: "Bahasa suara",
    speechRate: "Kecepatan bicara",
    speechPitch: "Nada suara",
    sendAsVoiceNote: "Kirim sebagai voice note",
    webSearchSources: "Sumber",
    webSearchToggle: "Cari di internet",
    webSearchOn: "Pencarian web aktif",
    webSearchOff: "Pencarian web nonaktif",
    webSearchUnavailable: "Pencarian web belum dikonfigurasi",
    editMessage: "Edit pesan",
    editSave: "Kirim ulang",
    editCancel: "Batal",
    copyCode: "Salin kode",
    fontSizeSetting: "Ukuran teks",
    fontSizeSmall: "Kecil",
    fontSizeMedium: "Sedang",
    fontSizeLarge: "Besar",
    errors: {
      generic: "Gagal mendapatkan respons. Coba lagi.",
      rateLimit: "Terlalu banyak permintaan. Tunggu sebentar.",
      tooLong: "Pesan terlalu panjang.",
    },
  },
  en: {
    welcome:
      "Hello! I'm **IDA** — your Intelligent Digital Assistant.\n\nI can help with:\n- General questions & explanations\n- Idea brainstorming\n- Step-by-step guidance\n\nWhat would you like to ask today?",
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
    emptyStateTitle: "Welcome to IDA",
    emptyStateSubtitle: "Independent, multilingual AI assistant — available 24/7",
    emptyStateHint: "Type a message below or pick a quick suggestion to get started.",
    emptyStateTipsTitle: "Tips",
    emptyStateTips: [
      "Ask anything — IDA supports Indonesian, English, and Chinese.",
      "Use quick replies to get started faster.",
      "Press ⌘/Ctrl + Enter to send a message.",
    ],
    copyMessage: "Copy message",
    copySuccess: "Message copied",
    toggleTheme: "Toggle theme",
    sendShortcut: "Enter to send · ⌘/Ctrl + Enter for new line",
    chatHistory: "History",
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
    clearAllChats: "Clear all chats",
    shareMessage: "Share",
    shareSuccess: "Message copied for sharing",
    regenerate: "Regenerate",
    thumbsUp: "Helpful",
    thumbsDown: "Not helpful",
    reactionThanks: "Thanks for your feedback!",
    reactionFeedback: "Feedback noted, thank you!",
    scrollToBottom: "Scroll down",
    clearAllConfirm: "Delete all conversations? This cannot be undone.",
    attachFile: "Attach image or PDF",
    uploadUnsupported: "Unsupported file type. Use JPG, PNG, WebP, GIF, or PDF.",
    uploadTooLarge: "File is too large. Maximum 10 MB.",
    uploadSuccess: "File processed successfully",
    fileAttached: "File attached — OCR runs on send",
    pendingOcrHint: "Text will be extracted when you send the message",
    extractingFile: "Extracting text from file...",
    extractedTextLabel: "Extracted text",
    removeAttachment: "Remove attachment",
    ocrFailed: "Failed to extract text. Try another file or resend.",
    ocrEmpty: "No readable text found in this file.",
    ocrNetworkError: "Network error during OCR. Check your connection and retry.",
    ocrUnavailable: "OCR service is unavailable. Please try again later.",
    listening: "Listening...",
    listeningPlaceholder: "Speak now...",
    startListening: "Start voice input",
    stopListening: "Stop recording",
    voiceError: "Voice recognition failed. Please try again.",
    voiceErrorNotAllowed: "Microphone access denied. Allow it in browser settings.",
    voiceErrorNoSpeech: "No speech detected. Try speaking closer to the mic.",
    voiceErrorNetwork: "Network error during voice transcription.",
    voiceErrorUnsupported: "This browser does not support voice input.",
    voiceErrorMic: "Cannot access microphone. Check your device.",
    voiceErrorTranscribe: "Failed to transcribe recording. Try recording again.",
    voiceTranscribing: "Transcribing recording...",
    voiceRecorderMode: "Recording mode — speak then stop",
    holdToRecord: "Hold to record",
    releaseToSend: "Release to send",
    voiceRecording: "Recording...",
    voiceNoteLabel: "Voice note",
    speakMessage: "Listen to message",
    stopSpeaking: "Stop speaking",
    autoSpeak: "Auto-speak",
    account: "Account",
    loginWithGoogle: "Sign in with Google",
    loginSubtitle: "Sign in to sync chat history across all your devices.",
    loginTagline: "Smart AI assistant with RAG, memory, and multilingual support.",
    logout: "Sign out",
    profileTitle: "Account Profile",
    profileEmail: "Email",
    profileName: "Name",
    profileUserId: "User ID",
    backToChat: "Back to chat",
    authError: "Sign-in failed. Please try again.",
    voiceSettings: "Voice settings",
    appLanguage: "Interface language",
    reviewVoiceBeforeSend: "Edit voice before sending",
    voiceLanguage: "Voice language",
    speechRate: "Speech rate",
    speechPitch: "Voice pitch",
    sendAsVoiceNote: "Send as voice note",
    webSearchSources: "Sources",
    webSearchToggle: "Search the web",
    webSearchOn: "Web search on",
    webSearchOff: "Web search off",
    webSearchUnavailable: "Web search is not configured",
    editMessage: "Edit message",
    editSave: "Resend",
    editCancel: "Cancel",
    copyCode: "Copy code",
    fontSizeSetting: "Text size",
    fontSizeSmall: "Small",
    fontSizeMedium: "Medium",
    fontSizeLarge: "Large",
    errors: {
      generic: "Failed to get a response. Please try again.",
      rateLimit: "Too many requests. Please wait a moment.",
      tooLong: "Message is too long.",
    },
  },
  zh: {
    welcome:
      "你好！我是 **IDA** — 你的智能数字助手。\n\n我可以帮助你：\n- 解答常见问题\n- 头脑风暴创意\n- 提供分步指导\n\n今天想问我什么？",
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
    emptyStateTitle: "欢迎使用 IDA",
    emptyStateSubtitle: "独立多语言 AI 助手，全天候在线",
    emptyStateHint: "在下方输入消息或选择快捷建议开始对话。",
    emptyStateTipsTitle: "小贴士",
    emptyStateTips: [
      "随意提问 — IDA 支持印尼语、英语和中文。",
      "使用快捷回复更快开始。",
      "按 ⌘/Ctrl + Enter 发送消息。",
    ],
    copyMessage: "复制消息",
    copySuccess: "消息已复制",
    toggleTheme: "切换主题",
    sendShortcut: "Enter 发送 · ⌘/Ctrl + Enter 换行",
    chatHistory: "历史记录",
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
    clearAllChats: "清除所有对话",
    shareMessage: "分享",
    shareSuccess: "消息已复制，可分享",
    regenerate: "重新生成",
    thumbsUp: "有帮助",
    thumbsDown: "没帮助",
    reactionThanks: "感谢你的反馈！",
    reactionFeedback: "已记录反馈，谢谢！",
    scrollToBottom: "回到底部",
    clearAllConfirm: "删除所有对话？此操作无法撤销。",
    attachFile: "附加图片或 PDF",
    uploadUnsupported: "不支持的文件格式。请使用 JPG、PNG、WebP、GIF 或 PDF。",
    uploadTooLarge: "文件过大。最大 10 MB。",
    uploadSuccess: "文件处理成功",
    fileAttached: "文件已附加 — 发送时进行 OCR",
    pendingOcrHint: "发送消息时将提取文本",
    extractingFile: "正在从文件中提取文本...",
    extractedTextLabel: "提取的文本",
    removeAttachment: "移除附件",
    ocrFailed: "文本提取失败。请换文件或重试。",
    ocrEmpty: "文件中未找到可读文本。",
    ocrNetworkError: "OCR 时网络错误。请检查连接后重试。",
    ocrUnavailable: "OCR 服务暂不可用，请稍后再试。",
    listening: "正在聆听...",
    listeningPlaceholder: "请说话...",
    startListening: "开始语音输入",
    stopListening: "停止录音",
    voiceError: "语音识别失败，请重试。",
    voiceErrorNotAllowed: "麦克风权限被拒绝。请在浏览器设置中允许。",
    voiceErrorNoSpeech: "未检测到语音。请靠近麦克风说话。",
    voiceErrorNetwork: "语音转录时网络错误。",
    voiceErrorUnsupported: "此浏览器不支持语音输入。",
    voiceErrorMic: "无法访问麦克风。请检查设备。",
    voiceErrorTranscribe: "转录失败。请重新录音。",
    voiceTranscribing: "正在转录录音...",
    voiceRecorderMode: "录音模式 — 说话后停止",
    holdToRecord: "按住录音",
    releaseToSend: "松开发送",
    voiceRecording: "录音中...",
    voiceNoteLabel: "语音消息",
    speakMessage: "播放消息",
    stopSpeaking: "停止播放",
    autoSpeak: "自动朗读",
    account: "账户",
    loginWithGoogle: "使用 Google 登录",
    loginSubtitle: "登录后可在所有设备同步聊天记录。",
    loginTagline: "具备 RAG、记忆和多语言支持的智能 AI 助手。",
    logout: "退出登录",
    profileTitle: "账户资料",
    profileEmail: "邮箱",
    profileName: "姓名",
    profileUserId: "用户 ID",
    backToChat: "返回聊天",
    authError: "登录失败，请重试。",
    voiceSettings: "语音设置",
    appLanguage: "界面语言",
    reviewVoiceBeforeSend: "发送前编辑语音",
    voiceLanguage: "语音语言",
    speechRate: "语速",
    speechPitch: "音调",
    sendAsVoiceNote: "作为语音消息发送",
    webSearchSources: "来源",
    webSearchToggle: "联网搜索",
    webSearchOn: "已开启联网搜索",
    webSearchOff: "已关闭联网搜索",
    webSearchUnavailable: "联网搜索未配置",
    editMessage: "编辑消息",
    editSave: "重新发送",
    editCancel: "取消",
    copyCode: "复制代码",
    fontSizeSetting: "字体大小",
    fontSizeSmall: "小",
    fontSizeMedium: "中",
    fontSizeLarge: "大",
    errors: {
      generic: "获取回复失败，请重试。",
      rateLimit: "请求过多，请稍后再试。",
      tooLong: "消息过长。",
    },
  },
};