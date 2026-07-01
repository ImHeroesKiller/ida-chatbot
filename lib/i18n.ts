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
    openChatHistory: string;
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
    profilePhoto: string;
    accountSettingsTitle: string;
    accountSettingsDescription: string;
    uploadAvatar: string;
    useGoogleAvatar: string;
    avatarHint: string;
    avatarUploadSuccess: string;
    avatarUploadError: string;
    useGoogleAvatarSuccess: string;
    saveProfile: string;
    savingProfile: string;
    profileSaveSuccess: string;
    profileSaveError: string;
    profileNameRequired: string;
    customPromptTitle: string;
    customPromptDescription: string;
    customPromptLabel: string;
    customPromptPlaceholder1: string;
    customPromptPlaceholder2: string;
    customPromptPlaceholder3: string;
    saveCustomPrompt: string;
    savingCustomPrompt: string;
    customPromptSaveSuccess: string;
    customPromptSaveError: string;
    clearCustomPrompt: string;
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
    webSearchPanelTitle: string;
    webSearchPanelEmptyTitle: string;
    webSearchPanelEmpty: string;
    webSearchPanelSearching: string;
    webSearchPanelError: string;
    webSearchPanelLastQuery: string;
    webSearchPanelClear: string;
    webSearchUseAsContext: string;
    researchUnavailable: string;
    researchPanelTitle: string;
    researchPanelEmptyTitle: string;
    researchPanelEmpty: string;
    researchPanelSearching: string;
    researchPanelError: string;
    researchPanelLastTopic: string;
    researchPanelClear: string;
    researchPanelTopicPlaceholder: string;
    researchPanelStart: string;
    researchPanelSummary: string;
    researchPanelSaveSession: string;
    researchPanelCreateDocument: string;
    researchPanelHistory: string;
    researchPanelOpenSession: string;
    researchPanelSourceCount: string;
    researchPanelQueriesUsed: string;
    researchPanelQueryLabel: string;
    researchPanelDepthLabel: string;
    researchPanelDepthHint: {
      quick: string;
      standard: string;
      deep: string;
    };
    researchPanelProgressStage: {
      preparing: string;
      knowledge: string;
      searching: string;
      synthesizing: string;
    };
    researchPanelExecutiveSummary: string;
    researchPanelKeyFindings: string;
    researchPanelDepth: {
      quick: string;
      standard: string;
      deep: string;
    };
    researchSessionSaved: string;
    editMessage: string;
    editSave: string;
    editCancel: string;
    copyCode: string;
    fontSizeSetting: string;
    fontSizeSmall: string;
    fontSizeMedium: string;
    fontSizeLarge: string;
    toolsMenu: string;
    toolsWebSearch: string;
    toolsMap: string;
    toolsResearch: string;
    toolsWorksheet: string;
    toolsWorkflow: string;
    workflowNew: string;
    workflowAddNode: string;
    workflowAddTrigger: string;
    workflowAddAction: string;
    workflowAddCondition: string;
    workflowAddOutput: string;
    workflowSave: string;
    workflowExecute: string;
    workflowDelete: string;
    workflowEmptyTitle: string;
    workflowEmptyHint: string;
    workflowProperties: string;
    workflowNodeLabel: string;
    workflowNodeDescription: string;
    workflowNodeKind: string;
    workflowDeleteNode: string;
    workflowDeleteConfirm: string;
    workflowSaved: string;
    workflowExecuted: string;
    workflowSelectWorkflow: string;
    workflowCreated: string;
    workflowNodePrompt: string;
    workflowExecutionLogs: string;
    workflowDeleteConfirmDescription: string;
    toolsImage: string;
    toolsVideo: string;
    toolsMusic: string;
    toolsCoding: string;
    toolsIntegration: string;
    toolsVirtualComputer: string;
    railResearchTools: string;
    railProductivity: string;
    railCreativeTools: string;
    railAdvancedTools: string;
    settingsAppearance: string;
    settingsData: string;
    toolsOn: string;
    toolsOff: string;
    toolsComingSoon: string;
    rightSidebarClose: string;
    previewLabel: string;
    worksheetTitleLabel: string;
    worksheetTitlePlaceholder: string;
    worksheetEmptyTitle: string;
    worksheetEmptyHint: string;
    worksheetDocumentsTitle: string;
    worksheetDocumentsNoSummary: string;
    worksheetDocumentsBack: string;
    worksheetDocumentsCreated: string;
    worksheetDocumentsEdited: string;
    worksheetDocumentsExportedLabel: string;
    worksheetDocumentsExportedPdf: string;
    worksheetDocumentsExportedDocx: string;
    worksheetDocumentsSearchPlaceholder: string;
    worksheetDocumentsFilterLabel: string;
    worksheetDocumentsFilterStatus: string;
    worksheetDocumentsFilterStatusAll: string;
    worksheetDocumentsFilterStatusGenerated: string;
    worksheetDocumentsFilterStatusEdited: string;
    worksheetDocumentsFilterStatusExported: string;
    worksheetDocumentsFilterTime: string;
    worksheetDocumentsFilterTimeAll: string;
    worksheetDocumentsFilterTimeToday: string;
    worksheetDocumentsFilterTimeWeek: string;
    worksheetDocumentsFilterTimeMonth: string;
    worksheetDocumentsFilterResults: string;
    worksheetDocumentsFilterActive: string;
    worksheetDocumentsNoResults: string;
    worksheetDocumentsNoResultsHint: string;
    worksheetDocumentsResetFilters: string;
    worksheetEmptyStepsTitle: string;
    worksheetEmptyCreateFirst: string;
    worksheetEmptyUseTemplate: string;
    worksheetDeleteDocument: string;
    worksheetDeleteDocumentConfirm: string;
    worksheetDeleteDocumentConfirmTitle: string;
    worksheetDeleteDocumentConfirmNamed: string;
    worksheetDeleteDocumentAction: string;
    worksheetDeleteDocumentSuccess: string;
    worksheetDeleteDocumentSuccessNamed: string;
    worksheetSaveTemplate: string;
    worksheetSaveTemplateTitle: string;
    worksheetSaveTemplateDescription: string;
    worksheetSaveTemplateNameLabel: string;
    worksheetSaveTemplateNamePlaceholder: string;
    worksheetSaveTemplateAction: string;
    worksheetSaveTemplateSuccess: string;
    worksheetSaveTemplateSuccessNamed: string;
    worksheetSaveTemplateError: string;
    worksheetSaveTemplateNameRequired: string;
    worksheetSaveTemplateSaveTypeLabel: string;
    worksheetSaveTemplateBrandingOnly: string;
    worksheetSaveTemplateBrandingOnlyHint: string;
    worksheetSaveTemplateBrandingAndStructure: string;
    worksheetSaveTemplateBrandingAndStructureHint: string;
    worksheetSaveTemplatePreviewLabel: string;
    worksheetSaveTemplateReviewAction: string;
    worksheetSaveTemplateConfirmTitle: string;
    worksheetSaveTemplateConfirmDescription: string;
    worksheetSaveTemplateConfirmAction: string;
    worksheetSaveTemplateBack: string;
    worksheetSaveTemplateViewInAdmin: string;
    worksheetCopy: string;
    worksheetDownload: string;
    worksheetCopied: string;
    worksheetDownloaded: string;
    worksheetGenerating: string;
    worksheetGeneratingSubtext: string;
    worksheetGeneratingCardLabel: string;
    worksheetCreated: string;
    worksheetErrorParseFailed: string;
    worksheetErrorEmptyDocument: string;
    worksheetErrorGenerateFailed: string;
    worksheetRetry: string;
    worksheetRegenerate: string;
    worksheetClear: string;
    worksheetClearConfirm: string;
    worksheetOverwriteTitle: string;
    worksheetOverwriteDescription: string;
    worksheetOverwriteConfirm: string;
    worksheetEmptySteps: string;
    worksheetEmptyEditHint: string;
    worksheetEdit: string;
    worksheetSave: string;
    worksheetCancel: string;
    worksheetUnsavedChanges: string;
    worksheetSaved: string;
    worksheetDiscardChanges: string;
    worksheetSwitchDocumentDiscardTitle: string;
    worksheetSwitchDocumentDiscard: string;
    worksheetSwitchDocumentAction: string;
    worksheetExportPdf: string;
    worksheetExportPdfTitle: string;
    worksheetExportPdfPaper: string;
    worksheetExportPdfPaperA4: string;
    worksheetExportPdfPaperLetter: string;
    worksheetExportPdfOrientation: string;
    worksheetExportPdfPortrait: string;
    worksheetExportPdfLandscape: string;
    worksheetExportPdfGenerating: string;
    worksheetExportPdfSuccess: string;
    worksheetExportPdfError: string;
    worksheetHistory: string;
    worksheetHistoryTitle: string;
    worksheetHistoryEmpty: string;
    worksheetHistoryRestore: string;
    worksheetHistoryRestoreConfirm: string;
    worksheetHistoryRestoredToast: string;
    worksheetHistoryGenerated: string;
    worksheetHistoryManualSave: string;
    worksheetHistoryRestored: string;
    worksheetHistoryTemplate: string;
    worksheetTemplates: string;
    worksheetTemplatesTitle: string;
    worksheetTemplatesDescription: string;
    worksheetTemplateApplied: string;
    worksheetTemplateOverwriteConfirm: string;
    worksheetPrintPreview: string;
    worksheetPrintPreviewTitle: string;
    worksheetPrintPreviewDescription: string;
    worksheetPrint: string;
    worksheetPrintPreviewError: string;
    worksheetExportPdfBranding: string;
    worksheetExportPdfIncludeBranding: string;
    worksheetExportPdfPageNumbers: string;
    worksheetExportPdfExportDate: string;
    worksheetEditorToolbar: string;
    worksheetEditorBold: string;
    worksheetEditorItalic: string;
    worksheetEditorHeading1: string;
    worksheetEditorHeading2: string;
    worksheetEditorHeading3: string;
    worksheetEditorAlignLeft: string;
    worksheetEditorAlignCenter: string;
    worksheetEditorAlignRight: string;
    worksheetEditorAlignJustify: string;
    worksheetEditorUndo: string;
    worksheetEditorRedo: string;
    worksheetEditorBulletList: string;
    worksheetEditorNumberedList: string;
    worksheetEditorLink: string;
    worksheetEditorCode: string;
    worksheetEditorTable: string;
    worksheetEditorBlockquote: string;
    worksheetEditorLinkPrompt: string;
    worksheetEditVisual: string;
    worksheetEditVisualHint: string;
    worksheetEditVisualPlaceholder: string;
    worksheetBranding: string;
    worksheetBrandingTitle: string;
    worksheetBrandingDescription: string;
    worksheetBrandingBrandName: string;
    worksheetBrandingFooterText: string;
    worksheetBrandingLogo: string;
    worksheetBrandingLogoHint: string;
    worksheetBrandingRemoveLogo: string;
    worksheetBrandingSaved: string;
    worksheetBrandingReset: string;
    worksheetBrandingTabHeader: string;
    worksheetBrandingTabFooter: string;
    worksheetBrandingTabStyling: string;
    worksheetBrandingTabPreview: string;
    worksheetBrandingLetterheadSection: string;
    worksheetBrandingContactSection: string;
    worksheetBrandingFooterSection: string;
    worksheetBrandingPreviewHint: string;
    worksheetBrandingTagline: string;
    worksheetBrandingTaglinePlaceholder: string;
    worksheetBrandingAddress: string;
    worksheetBrandingAddressPlaceholder: string;
    worksheetBrandingPhone: string;
    worksheetBrandingPhonePlaceholder: string;
    worksheetBrandingEmail: string;
    worksheetBrandingEmailPlaceholder: string;
    worksheetBrandingWebsite: string;
    worksheetBrandingWebsitePlaceholder: string;
    worksheetBrandingShowHeaderDivider: string;
    worksheetBrandingFooterContact: string;
    worksheetBrandingFooterContactPlaceholder: string;
    worksheetBrandingPrimaryColor: string;
    worksheetBrandingHeaderFont: string;
    worksheetBrandingFooterFont: string;
    worksheetBrandingFontSystem: string;
    worksheetBrandingFontSans: string;
    worksheetBrandingFontSerif: string;
    worksheetBrandingPreview: string;
    worksheetBrandingPreviewDocTitle: string;
    worksheetBrandingTemplateReadOnly: string;
    worksheetBrandingSelectionSaved: string;
    worksheetLetterheadSourceTitle: string;
    worksheetLetterheadSourceDescription: string;
    worksheetLetterheadSourcePersonal: string;
    worksheetLetterheadSourcePersonalHint: string;
    worksheetLetterheadSourceTemplate: string;
    worksheetLetterheadSourceTemplateHint: string;
    worksheetLetterheadNoTemplates: string;
    worksheetLetterheadTemplateLabel: string;
    worksheetLetterheadDefaultBadge: string;
    worksheetLetterheadActiveTemplate: string;
    worksheetLetterheadActivePersonal: string;
    worksheetShare: string;
    worksheetShareCopied: string;
    worksheetShareError: string;
    worksheetMoreActions: string;
    worksheetDownloadMenu: string;
    worksheetDownloadPdf: string;
    worksheetDownloadMd: string;
    worksheetDownloadDocx: string;
    worksheetExportDocxSuccess: string;
    worksheetExportDocxError: string;
    worksheetEditMarkdown: string;
    worksheetEditSplit: string;
    worksheetEditMarkdownHint: string;
    worksheetEditSplitHint: string;
    worksheetEditPreviewEmpty: string;
    worksheetFullView: string;
    worksheetFullViewTitle: string;
    worksheetFullViewDescription: string;
    worksheetFullViewBadge: string;
    worksheetExitFullView: string;
    worksheetFullViewEditorLabel: string;
    worksheetFullViewPlaceholder: string;
    worksheetFullViewShortcutHint: string;
    mapPlaceholderDesc: string;
    mapPlaceholderContent: string;
    mapAddMarker: string;
    mapResetView: string;
    mapMarkerLabel: string;
    mapRemoveMarker: string;
    mapSearchPlaceholder: string;
    mapSearchNoResults: string;
    mapSearchError: string;
    mapClickToAdd: string;
    mapClickToAddHint: string;
    mapCopyCoordinates: string;
    mapCopiedCoordinates: string;
    mapCenterMarker: string;
    mapEditMarker: string;
    mapSaveMarker: string;
    mapCancelEdit: string;
    mapCoordinatesLabel: string;
    researchPlaceholderDesc: string;
    researchPlaceholderContent: string;
    errors: {
      generic: string;
      rateLimit: string;
      tooLong: string;
    };
  }
> = {
  id: {
    welcome:
      "Saya siap membantu kamu hari ini. Ketik pertanyaan di bawah atau pilih saran cepat untuk memulai.\n\nAda yang bisa saya bantu?",
    subtitle: "Intelligent Digital Assistant",
    windowLabel: "Jendela chat IDA",
    open: "Buka chat IDA",
    close: "Tutup chat",
    inputLabel: "Pesan untuk IDA",
    inputPlaceholder: "Ketik pesan Anda...",
    send: "Kirim",
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
    openChatHistory: "Buka riwayat chat",
    emptyStateTitle: "Selamat datang di IDA",
    emptyStateSubtitle: "Asisten AI yang siap membantu kapan saja",
    emptyStateHint: "Ketik pesan di bawah untuk memulai percakapan.",
    emptyStateTipsTitle: "Tips singkat",
    emptyStateTips: [
      "Tanyakan apa saja — bahasa Indonesia, Inggris, atau Mandarin.",
      "Gunakan menu Alat untuk pencarian web, Worksheet, dan lainnya.",
      "Tekan Enter untuk kirim pesan.",
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
    profilePhoto: "Foto Profil",
    accountSettingsTitle: "Pengaturan Akun",
    accountSettingsDescription:
      "Kelola profil Google Anda dan preferensi respons IDA.",
    uploadAvatar: "Unggah Foto",
    useGoogleAvatar: "Gunakan Foto Google",
    avatarHint: "JPG, PNG, atau WebP. Maksimal 2 MB.",
    avatarUploadSuccess: "Foto profil berhasil diperbarui.",
    avatarUploadError: "Gagal memperbarui foto profil.",
    useGoogleAvatarSuccess: "Foto Google berhasil diterapkan.",
    saveProfile: "Simpan Profil",
    savingProfile: "Menyimpan...",
    profileSaveSuccess: "Profil berhasil disimpan.",
    profileSaveError: "Gagal menyimpan profil.",
    profileNameRequired: "Nama tampilan wajib diisi.",
    customPromptTitle: "Gaya Respons & Kepribadian",
    customPromptDescription:
      "Tulis instruksi khusus agar IDA menyesuaikan gaya jawabannya dengan preferensi Anda.",
    customPromptLabel: "Custom Prompt",
    customPromptPlaceholder1:
      "Jawab dengan gaya santai dan ramah seperti teman dekat",
    customPromptPlaceholder2:
      "Selalu gunakan bahasa Indonesia yang sopan dan profesional",
    customPromptPlaceholder3:
      "Fokus pada solusi praktis dan langsung ke intinya",
    saveCustomPrompt: "Simpan Custom Prompt",
    savingCustomPrompt: "Menyimpan...",
    customPromptSaveSuccess: "Custom prompt berhasil disimpan.",
    customPromptSaveError: "Gagal menyimpan custom prompt.",
    clearCustomPrompt: "Hapus",
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
    webSearchPanelTitle: "Pencarian Web",
    webSearchPanelEmptyTitle: "Belum ada hasil",
    webSearchPanelEmpty:
      "Aktifkan Pencarian Web, lalu kirim pertanyaan yang membutuhkan informasi terkini. Hasil akan muncul di panel ini.",
    webSearchPanelSearching: "IDA sedang mencari di internet...",
    webSearchPanelError: "Pencarian web gagal",
    webSearchPanelLastQuery: "Kueri: {query}",
    webSearchPanelClear: "Hapus hasil",
    webSearchUseAsContext: "Gunakan sebagai konteks",
    researchUnavailable: "Riset belum dikonfigurasi",
    researchPanelTitle: "Riset",
    researchPanelEmptyTitle: "Belum ada hasil riset",
    researchPanelEmpty:
      "Masukkan topik riset di atas, atau aktifkan Riset lalu kirim pertanyaan di chat untuk riset mendalam.",
    researchPanelSearching: "IDA sedang melakukan riset...",
    researchPanelError: "Riset gagal",
    researchPanelLastTopic: "Topik: {topic}",
    researchPanelClear: "Hapus hasil",
    researchPanelTopicPlaceholder: "Topik riset, mis. tren AI di Indonesia 2026",
    researchPanelStart: "Mulai Riset",
    researchPanelSummary: "Ringkasan",
    researchPanelSaveSession: "Simpan sesi",
    researchPanelCreateDocument: "Buat Dokumen",
    researchPanelHistory: "Riwayat riset",
    researchPanelOpenSession: "Buka",
    researchPanelSourceCount: "{count} sumber",
    researchPanelQueriesUsed: "{count} kueri digunakan",
    researchPanelQueryLabel: "Kueri: {query}",
    researchPanelDepthLabel: "Kedalaman riset",
    researchPanelDepthHint: {
      quick: "{queries} kueri · ~{sources} sumber",
      standard: "{queries} kueri · ~{sources} sumber",
      deep: "{queries} kueri · ~{sources} sumber",
    },
    researchPanelProgressStage: {
      preparing: "Menyiapkan kueri",
      knowledge: "Memeriksa knowledge base",
      searching: "Mencari sumber web",
      synthesizing: "Menyusun ringkasan",
    },
    researchPanelExecutiveSummary: "Ringkasan eksekutif",
    researchPanelKeyFindings: "Temuan utama",
    researchPanelDepth: {
      quick: "Cepat",
      standard: "Standar",
      deep: "Mendalam",
    },
    researchSessionSaved: "Sesi riset disimpan",
    editMessage: "Edit pesan",
    editSave: "Kirim ulang",
    editCancel: "Batal",
    copyCode: "Salin kode",
    fontSizeSetting: "Ukuran teks",
    fontSizeSmall: "Kecil",
    fontSizeMedium: "Sedang",
    fontSizeLarge: "Besar",
    toolsMenu: "Alat",
    toolsWebSearch: "Pencarian Web",
    toolsMap: "Peta",
    toolsResearch: "Riset",
    toolsWorksheet: "Worksheet",
    toolsWorkflow: "Workflow",
    workflowNew: "Workflow Baru",
    workflowAddNode: "Tambah Node",
    workflowAddTrigger: "Trigger",
    workflowAddAction: "Action",
    workflowAddCondition: "Condition",
    workflowAddOutput: "Output",
    workflowSave: "Simpan",
    workflowExecute: "Jalankan",
    workflowDelete: "Hapus",
    workflowEmptyTitle: "Belum ada workflow",
    workflowEmptyHint:
      "Buat workflow baru lalu tambahkan node Trigger, Action, Condition, atau Output di kanvas.",
    workflowProperties: "Properti Node",
    workflowNodeLabel: "Label",
    workflowNodeDescription: "Deskripsi",
    workflowNodeKind: "Jenis",
    workflowDeleteNode: "Hapus Node",
    workflowDeleteConfirm: "Hapus workflow aktif?",
    workflowSaved: "Workflow disimpan",
    workflowExecuted: "Workflow dijalankan (stub)",
    workflowSelectWorkflow: "Pilih workflow",
    workflowCreated: "Workflow berhasil dibuat",
    workflowNodePrompt: "Prompt LLM",
    workflowExecutionLogs: "Log Eksekusi",
    workflowDeleteConfirmDescription:
      "Workflow aktif dan semua node-nya akan dihapus dari chat ini.",
    toolsImage: "Gambar",
    toolsVideo: "Video",
    toolsMusic: "Musik",
    toolsCoding: "Coding",
    toolsIntegration: "Integrasi",
    toolsVirtualComputer: "Virtual Computer",
    railResearchTools: "Riset",
    railProductivity: "Produktivitas",
    railCreativeTools: "Kreatif",
    railAdvancedTools: "Lanjutan",
    settingsAppearance: "Tampilan",
    settingsData: "Data",
    toolsOn: "Aktif",
    toolsOff: "Mati",
    toolsComingSoon: "Segera hadir",
    rightSidebarClose: "Tutup panel",
    previewLabel: "Pratinjau",
    worksheetTitleLabel: "Judul dokumen",
    worksheetTitlePlaceholder: "Mis. Proposal Proyek PLTS",
    worksheetEmptyTitle: "Belum ada dokumen",
    worksheetEmptyHint:
      "Minta IDA membuat dokumen lewat chat. Setelah dibuat, Anda bisa mengedit langsung di sini dan mengekspor ke PDF.",
    worksheetDocumentsTitle: "Dokumen tersimpan",
    worksheetDocumentsNoSummary: "Tanpa ringkasan",
    worksheetDocumentsBack: "Kembali ke daftar",
    worksheetDocumentsCreated: "Dibuat",
    worksheetDocumentsEdited: "Diedit",
    worksheetDocumentsExportedLabel: "Diekspor",
    worksheetDocumentsExportedPdf: "PDF",
    worksheetDocumentsExportedDocx: "DOCX",
    worksheetDocumentsSearchPlaceholder: "Cari judul, ringkasan, atau konten…",
    worksheetDocumentsFilterLabel: "Filter",
    worksheetDocumentsFilterStatus: "Status",
    worksheetDocumentsFilterStatusAll: "Semua status",
    worksheetDocumentsFilterStatusGenerated: "Generated",
    worksheetDocumentsFilterStatusEdited: "Edited",
    worksheetDocumentsFilterStatusExported: "Exported",
    worksheetDocumentsFilterTime: "Waktu",
    worksheetDocumentsFilterTimeAll: "Semua waktu",
    worksheetDocumentsFilterTimeToday: "Hari ini",
    worksheetDocumentsFilterTimeWeek: "7 hari terakhir",
    worksheetDocumentsFilterTimeMonth: "Bulan ini",
    worksheetDocumentsFilterResults: "Menampilkan {shown} dari {total} dokumen",
    worksheetDocumentsFilterActive: "filter aktif",
    worksheetDocumentsNoResults:
      "Tidak ada dokumen yang cocok dengan pencarian atau filter kamu.",
    worksheetDocumentsNoResultsHint:
      "Coba kata kunci lain atau reset filter untuk melihat semua dokumen.",
    worksheetDocumentsResetFilters: "Reset Filter",
    worksheetEmptyStepsTitle: "Cara memulai",
    worksheetEmptyCreateFirst: "Buat Dokumen Pertama",
    worksheetEmptyUseTemplate: "Gunakan Template",
    worksheetDeleteDocument: "Hapus dokumen ini",
    worksheetDeleteDocumentConfirm:
      "Hapus dokumen ini dari daftar? Tindakan ini tidak dapat dibatalkan.",
    worksheetDeleteDocumentConfirmTitle: "Hapus dokumen?",
    worksheetDeleteDocumentConfirmNamed:
      'Hapus dokumen "{title}"? Tindakan ini tidak dapat dibatalkan.',
    worksheetDeleteDocumentAction: "Ya, hapus",
    worksheetDeleteDocumentSuccess: "Dokumen dihapus",
    worksheetDeleteDocumentSuccessNamed: '"{title}" berhasil dihapus',
    worksheetSaveTemplate: "Simpan sebagai template",
    worksheetSaveTemplateTitle: "Simpan sebagai template",
    worksheetSaveTemplateDescription:
      "Simpan branding dan struktur dokumen ini sebagai template letterhead perusahaan.",
    worksheetSaveTemplateNameLabel: "Nama template",
    worksheetSaveTemplateNamePlaceholder: "Surat Resmi, Proposal Proyek…",
    worksheetSaveTemplateAction: "Simpan template",
    worksheetSaveTemplateSuccess: "Template letterhead disimpan",
    worksheetSaveTemplateSuccessNamed: 'Template "{name}" berhasil disimpan',
    worksheetSaveTemplateError: "Gagal menyimpan template",
    worksheetSaveTemplateNameRequired: "Nama template wajib diisi",
    worksheetSaveTemplateSaveTypeLabel: "Yang disimpan",
    worksheetSaveTemplateBrandingOnly: "Hanya branding",
    worksheetSaveTemplateBrandingOnlyHint:
      "Header, footer, logo, dan styling letterhead saja.",
    worksheetSaveTemplateBrandingAndStructure: "Branding + struktur",
    worksheetSaveTemplateBrandingAndStructureHint:
      "Branding plus contoh struktur/konten dokumen sebagai sample.",
    worksheetSaveTemplatePreviewLabel: "Pratinjau",
    worksheetSaveTemplateReviewAction: "Tinjau & lanjut",
    worksheetSaveTemplateConfirmTitle: "Konfirmasi simpan template",
    worksheetSaveTemplateConfirmDescription:
      "Periksa kembali detail template sebelum disimpan ke daftar letterhead perusahaan.",
    worksheetSaveTemplateConfirmAction: "Ya, simpan template",
    worksheetSaveTemplateBack: "Kembali",
    worksheetSaveTemplateViewInAdmin: "Lihat template di Admin",
    worksheetCopy: "Salin",
    worksheetDownload: "Unduh .md",
    worksheetCopied: "Dokumen disalin",
    worksheetDownloaded: "Dokumen diunduh",
    worksheetGenerating: "IDA sedang membuat dokumen...",
    worksheetGeneratingSubtext:
      "Dokumen akan muncul di panel ini setelah selesai.",
    worksheetGeneratingCardLabel: "Membuat dokumen baru...",
    worksheetCreated: "Dokumen berhasil dibuat",
    worksheetErrorParseFailed:
      "Format respons tidak dikenali. Coba kirim ulang permintaan atau perjelas isi dokumen.",
    worksheetErrorEmptyDocument:
      "Dokumen kosong. Coba kirim ulang dengan permintaan yang lebih jelas.",
    worksheetErrorGenerateFailed:
      "Gagal membuat dokumen. Periksa koneksi lalu coba lagi.",
    worksheetRetry: "Coba lagi",
    worksheetRegenerate: "Buat ulang",
    worksheetClear: "Hapus semua dokumen",
    worksheetClearConfirm:
      "Hapus semua dokumen Worksheet? Tindakan ini tidak dapat dibatalkan.",
    worksheetOverwriteTitle: "Ganti dokumen?",
    worksheetOverwriteDescription:
      "Worksheet sudah berisi dokumen. Permintaan baru akan menimpa konten yang ada.",
    worksheetOverwriteConfirm: "Ganti dokumen",
    worksheetEmptySteps:
      "1. Aktifkan Worksheet di menu Tools, lalu ketik permintaan di chat\n2. IDA membuat dokumen dan menampilkannya di panel ini\n3. Edit, simpan, lalu ekspor ke PDF atau DOCX",
    worksheetEmptyEditHint:
      "Tip: Setelah dokumen dibuat, gunakan tombol Edit untuk menyempurnakan isi sebelum diunduh.",
    worksheetEdit: "Edit",
    worksheetSave: "Simpan",
    worksheetCancel: "Batal",
    worksheetUnsavedChanges: "Perubahan belum disimpan",
    worksheetSaved: "Perubahan disimpan",
    worksheetDiscardChanges:
      "Buang perubahan yang belum disimpan dan tutup mode edit?",
    worksheetSwitchDocumentDiscardTitle: "Buang perubahan?",
    worksheetSwitchDocumentDiscard:
      "Ada perubahan yang belum disimpan. Buang perubahan dan buka dokumen lain?",
    worksheetSwitchDocumentAction: "Buang & buka dokumen",
    worksheetExportPdf: "Export PDF",
    worksheetExportPdfTitle: "Export ke PDF",
    worksheetExportPdfPaper: "Ukuran kertas",
    worksheetExportPdfPaperA4: "A4",
    worksheetExportPdfPaperLetter: "Letter",
    worksheetExportPdfOrientation: "Orientasi",
    worksheetExportPdfPortrait: "Portrait",
    worksheetExportPdfLandscape: "Landscape",
    worksheetExportPdfGenerating: "Sedang membuat PDF...",
    worksheetExportPdfSuccess: "PDF berhasil diunduh",
    worksheetExportPdfError: "Gagal membuat PDF. Coba lagi.",
    worksheetHistory: "Riwayat",
    worksheetHistoryTitle: "Riwayat dokumen",
    worksheetHistoryEmpty: "Belum ada versi tersimpan. Versi dibuat saat generate atau simpan edit.",
    worksheetHistoryRestore: "Pulihkan",
    worksheetHistoryRestoreConfirm:
      "Pulihkan versi ini? Konten saat ini akan disimpan ke riwayat terlebih dahulu.",
    worksheetHistoryRestoredToast: "Versi dokumen dipulihkan",
    worksheetHistoryGenerated: "Dibuat IDA",
    worksheetHistoryManualSave: "Simpan manual",
    worksheetHistoryRestored: "Dipulihkan",
    worksheetHistoryTemplate: "Dari template",
    worksheetTemplates: "Template",
    worksheetTemplatesTitle: "Pilih template dokumen",
    worksheetTemplatesDescription:
      "Mulai dari struktur siap pakai, lalu edit atau minta IDA melengkapi lewat chat.",
    worksheetTemplateApplied: "Template diterapkan",
    worksheetTemplateOverwriteConfirm:
      "Terapkan template ini? Konten dokumen saat ini akan diganti.",
    worksheetPrintPreview: "Pratinjau cetak",
    worksheetPrintPreviewTitle: "Pratinjau cetak",
    worksheetPrintPreviewDescription:
      "Lihat tampilan dokumen dengan header/footer sebelum mencetak.",
    worksheetPrint: "Cetak",
    worksheetPrintPreviewError:
      "Tidak dapat membuka pratinjau cetak. Izinkan pop-up lalu coba lagi.",
    worksheetExportPdfBranding: "Branding PDF",
    worksheetExportPdfIncludeBranding: "Header & footer IDA",
    worksheetExportPdfPageNumbers: "Nomor halaman",
    worksheetExportPdfExportDate: "Tanggal ekspor",
    worksheetEditorToolbar: "Toolbar editor Markdown",
    worksheetEditorBold: "Tebal",
    worksheetEditorItalic: "Miring",
    worksheetEditorHeading1: "Heading 1",
    worksheetEditorHeading2: "Heading 2",
    worksheetEditorHeading3: "Heading 3",
    worksheetEditorAlignLeft: "Rata kiri",
    worksheetEditorAlignCenter: "Rata tengah",
    worksheetEditorAlignRight: "Rata kanan",
    worksheetEditorAlignJustify: "Rata kanan-kiri",
    worksheetEditorUndo: "Urungkan",
    worksheetEditorRedo: "Ulangi",
    worksheetEditorBulletList: "Daftar bullet",
    worksheetEditorNumberedList: "Daftar bernomor",
    worksheetEditorLink: "Tautan",
    worksheetEditorCode: "Kode inline",
    worksheetEditorTable: "Tabel",
    worksheetEditorBlockquote: "Kutipan",
    worksheetEditorLinkPrompt: "URL tautan",
    worksheetEditVisual: "Visual",
    worksheetEditVisualHint: "Edit teks terformat langsung (WYSIWYG). Disimpan sebagai Markdown.",
    worksheetEditVisualPlaceholder: "Mulai mengetik dokumen Anda…",
    worksheetBranding: "Branding",
    worksheetBrandingTitle: "Branding dokumen",
    worksheetBrandingDescription:
      "Atur nama perusahaan, teks footer, dan logo untuk PDF serta pratinjau cetak. Override pribadi di browser ini; default organisasi dari admin.",
    worksheetBrandingBrandName: "Nama brand",
    worksheetBrandingFooterText: "Teks footer",
    worksheetBrandingLogo: "Logo",
    worksheetBrandingLogoHint: "PNG/JPG, maks. ~180 KB",
    worksheetBrandingRemoveLogo: "Hapus logo",
    worksheetBrandingSaved: "Branding disimpan",
    worksheetBrandingReset: "Reset default",
    worksheetBrandingTabHeader: "Header",
    worksheetBrandingTabFooter: "Footer",
    worksheetBrandingTabStyling: "Styling",
    worksheetBrandingTabPreview: "Pratinjau",
    worksheetBrandingLetterheadSection: "Kop Surat (Letterhead)",
    worksheetBrandingContactSection: "Kontak & Alamat",
    worksheetBrandingFooterSection: "Footer Dokumen",
    worksheetBrandingPreviewHint:
      "Pratinjau tampilan header dan footer pada dokumen yang diekspor.",
    worksheetBrandingTagline: "Tagline / Slogan",
    worksheetBrandingTaglinePlaceholder: "Solusi Digital Terpercaya",
    worksheetBrandingAddress: "Alamat",
    worksheetBrandingAddressPlaceholder: "Jl. Sudirman No. 123\nJakarta Pusat 10220",
    worksheetBrandingPhone: "Telepon",
    worksheetBrandingPhonePlaceholder: "+62 21 1234 5678",
    worksheetBrandingEmail: "Email",
    worksheetBrandingEmailPlaceholder: "info@perusahaan.com",
    worksheetBrandingWebsite: "Website",
    worksheetBrandingWebsitePlaceholder: "www.perusahaan.com",
    worksheetBrandingShowHeaderDivider: "Garis pembatas di bawah header",
    worksheetBrandingFooterContact: "Kontak singkat di footer",
    worksheetBrandingFooterContactPlaceholder: "Jl. Sudirman No. 123 · +62 21 1234 5678",
    worksheetBrandingPrimaryColor: "Warna utama",
    worksheetBrandingHeaderFont: "Font header",
    worksheetBrandingFooterFont: "Font footer",
    worksheetBrandingFontSystem: "Sistem",
    worksheetBrandingFontSans: "Sans-serif",
    worksheetBrandingFontSerif: "Serif",
    worksheetBrandingPreview: "Pratinjau",
    worksheetBrandingPreviewDocTitle: "Judul Dokumen",
    worksheetBrandingTemplateReadOnly:
      "Branding diatur oleh template perusahaan. Ubah template di Admin atau pilih Personal Branding.",
    worksheetBrandingSelectionSaved: "Pilihan letterhead disimpan",
    worksheetLetterheadSourceTitle: "Sumber letterhead",
    worksheetLetterheadSourceDescription:
      "Pilih branding pribadi atau template perusahaan untuk dokumen ini.",
    worksheetLetterheadSourcePersonal: "Personal Branding",
    worksheetLetterheadSourcePersonalHint: "Pengaturan branding Anda sendiri",
    worksheetLetterheadSourceTemplate: "Template Perusahaan",
    worksheetLetterheadSourceTemplateHint: "Gunakan template yang dibuat admin",
    worksheetLetterheadNoTemplates: "Belum ada template perusahaan",
    worksheetLetterheadTemplateLabel: "Pilih template",
    worksheetLetterheadDefaultBadge: "Default",
    worksheetLetterheadActiveTemplate: "Template aktif: {name}",
    worksheetLetterheadActivePersonal: "Menggunakan personal branding",
    worksheetShare: "Bagikan",
    worksheetShareCopied: "Tautan dibagikan dan disalin",
    worksheetShareError: "Gagal membuat tautan. Coba lagi.",
    worksheetMoreActions: "Lainnya",
    worksheetDownloadMenu: "Unduh",
    worksheetDownloadPdf: "PDF",
    worksheetDownloadMd: "Markdown (.md)",
    worksheetDownloadDocx: "Word (.docx)",
    worksheetExportDocxSuccess: "DOCX berhasil diunduh",
    worksheetExportDocxError: "Gagal membuat DOCX. Coba lagi.",
    worksheetEditMarkdown: "Markdown",
    worksheetEditSplit: "Split",
    worksheetEditMarkdownHint: "Mode sumber Markdown penuh.",
    worksheetEditSplitHint: "Edit Markdown dengan pratinjau langsung.",
    worksheetEditPreviewEmpty: "Pratinjau akan muncul saat Anda mengetik.",
    worksheetFullView: "Full View",
    worksheetFullViewTitle: "Full View — Tampilan Siap Cetak",
    worksheetFullViewDescription:
      "Edit dokumen dalam tampilan yang mendekati hasil PDF/export.",
    worksheetFullViewBadge: "Print Preview / Full View",
    worksheetExitFullView: "Keluar Full View",
    worksheetFullViewEditorLabel: "Editor dokumen Full View",
    worksheetFullViewPlaceholder: "Mulai mengedit dokumen…",
    worksheetFullViewShortcutHint:
      "Pintasan: F atau Ctrl/Cmd+Shift+F untuk membuka · Esc untuk keluar",
    mapPlaceholderDesc:
      "Peta interaktif akan ditampilkan di sini untuk pertanyaan berbasis lokasi.",
    mapPlaceholderContent:
      "[ Peta ]\n\nPratinjau peta akan muncul di panel ini.",
    mapAddMarker: "Tambah marker",
    mapResetView: "Reset tampilan",
    mapMarkerLabel: "Marker",
    mapRemoveMarker: "Hapus marker",
    mapSearchPlaceholder: "Cari lokasi…",
    mapSearchNoResults: "Lokasi tidak ditemukan.",
    mapSearchError: "Pencarian lokasi gagal.",
    mapClickToAdd: "Klik peta",
    mapClickToAddHint: "Aktifkan lalu klik peta untuk menambah marker",
    mapCopyCoordinates: "Salin",
    mapCopiedCoordinates: "Koordinat disalin",
    mapCenterMarker: "Fokus",
    mapEditMarker: "Edit label marker",
    mapSaveMarker: "Simpan",
    mapCancelEdit: "Batal",
    mapCoordinatesLabel: "Koordinat",
    researchPlaceholderDesc:
      "Hasil riset mendalam akan ditampilkan di panel ini.",
    researchPlaceholderContent:
      "## Ringkasan Riset\n\nHasil riset multi-sumber akan ditampilkan di sini.",
    errors: {
      generic: "Gagal mendapatkan respons. Coba lagi.",
      rateLimit: "Terlalu banyak permintaan. Tunggu sebentar.",
      tooLong: "Pesan terlalu panjang.",
    },
  },
  en: {
    welcome:
      "I'm ready to help you today. Type a question below or pick a quick suggestion to get started.\n\nWhat can I help you with?",
    subtitle: "Intelligent Digital Assistant",
    windowLabel: "IDA chat window",
    open: "Open IDA chat",
    close: "Close chat",
    inputLabel: "Message to IDA",
    inputPlaceholder: "Type your message...",
    send: "Send",
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
    openChatHistory: "Open chat history",
    emptyStateTitle: "Welcome to IDA",
    emptyStateSubtitle: "Your AI assistant, ready whenever you need",
    emptyStateHint: "Type a message below to start a conversation.",
    emptyStateTipsTitle: "Quick tips",
    emptyStateTips: [
      "Ask anything — Indonesian, English, or Chinese.",
      "Use the Tools menu for web search, Worksheet, and more.",
      "Press Enter to send a message.",
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
    profilePhoto: "Profile Photo",
    accountSettingsTitle: "Account Settings",
    accountSettingsDescription:
      "Manage your Google profile and how IDA responds in chat.",
    uploadAvatar: "Upload Photo",
    useGoogleAvatar: "Use Google Photo",
    avatarHint: "JPG, PNG, or WebP. Max 2 MB.",
    avatarUploadSuccess: "Profile photo updated.",
    avatarUploadError: "Failed to update profile photo.",
    useGoogleAvatarSuccess: "Google photo applied.",
    saveProfile: "Save Profile",
    savingProfile: "Saving...",
    profileSaveSuccess: "Profile saved.",
    profileSaveError: "Failed to save profile.",
    profileNameRequired: "Display name is required.",
    customPromptTitle: "Personality & Response Style",
    customPromptDescription:
      "Write custom instructions so IDA adapts its tone and style to your preferences.",
    customPromptLabel: "Custom Prompt",
    customPromptPlaceholder1:
      "Reply in a relaxed, friendly tone like a close friend",
    customPromptPlaceholder2:
      "Always use polite and professional Indonesian",
    customPromptPlaceholder3:
      "Focus on practical solutions and get straight to the point",
    saveCustomPrompt: "Save Custom Prompt",
    savingCustomPrompt: "Saving...",
    customPromptSaveSuccess: "Custom prompt saved.",
    customPromptSaveError: "Failed to save custom prompt.",
    clearCustomPrompt: "Clear",
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
    webSearchPanelTitle: "Web Search",
    webSearchPanelEmptyTitle: "No results yet",
    webSearchPanelEmpty:
      "Enable Web Search, then ask a question that needs up-to-date information. Results will appear in this panel.",
    webSearchPanelSearching: "IDA is searching the web...",
    webSearchPanelError: "Web search failed",
    webSearchPanelLastQuery: "Query: {query}",
    webSearchPanelClear: "Clear results",
    webSearchUseAsContext: "Use as context",
    researchUnavailable: "Research is not configured",
    researchPanelTitle: "Research",
    researchPanelEmptyTitle: "No research results yet",
    researchPanelEmpty:
      "Enter a research topic above, or enable Research and send a question in chat for in-depth research.",
    researchPanelSearching: "IDA is researching...",
    researchPanelError: "Research failed",
    researchPanelLastTopic: "Topic: {topic}",
    researchPanelClear: "Clear results",
    researchPanelTopicPlaceholder: "Research topic, e.g. AI trends in Indonesia 2026",
    researchPanelStart: "Start Research",
    researchPanelSummary: "Summary",
    researchPanelSaveSession: "Save session",
    researchPanelCreateDocument: "Create Document",
    researchPanelHistory: "Research history",
    researchPanelOpenSession: "Open",
    researchPanelSourceCount: "{count} sources",
    researchPanelQueriesUsed: "{count} queries used",
    researchPanelQueryLabel: "Query: {query}",
    researchPanelDepthLabel: "Research depth",
    researchPanelDepthHint: {
      quick: "{queries} queries · ~{sources} sources",
      standard: "{queries} queries · ~{sources} sources",
      deep: "{queries} queries · ~{sources} sources",
    },
    researchPanelProgressStage: {
      preparing: "Preparing queries",
      knowledge: "Checking knowledge base",
      searching: "Searching web sources",
      synthesizing: "Synthesizing summary",
    },
    researchPanelExecutiveSummary: "Executive summary",
    researchPanelKeyFindings: "Key findings",
    researchPanelDepth: {
      quick: "Quick",
      standard: "Standard",
      deep: "Deep",
    },
    researchSessionSaved: "Research session saved",
    editMessage: "Edit message",
    editSave: "Resend",
    editCancel: "Cancel",
    copyCode: "Copy code",
    fontSizeSetting: "Text size",
    fontSizeSmall: "Small",
    fontSizeMedium: "Medium",
    fontSizeLarge: "Large",
    toolsMenu: "Tools",
    toolsWebSearch: "Web Search",
    toolsMap: "Map",
    toolsResearch: "Research",
    toolsWorksheet: "Worksheet",
    toolsWorkflow: "Workflow",
    workflowNew: "New Workflow",
    workflowAddNode: "Add Node",
    workflowAddTrigger: "Trigger",
    workflowAddAction: "Action",
    workflowAddCondition: "Condition",
    workflowAddOutput: "Output",
    workflowSave: "Save",
    workflowExecute: "Execute",
    workflowDelete: "Delete",
    workflowEmptyTitle: "No workflow yet",
    workflowEmptyHint:
      "Create a new workflow, then add Trigger, Action, Condition, or Output nodes on the canvas.",
    workflowProperties: "Node Properties",
    workflowNodeLabel: "Label",
    workflowNodeDescription: "Description",
    workflowNodeKind: "Kind",
    workflowDeleteNode: "Delete Node",
    workflowDeleteConfirm: "Delete the active workflow?",
    workflowSaved: "Workflow saved",
    workflowExecuted: "Workflow executed (stub)",
    workflowSelectWorkflow: "Select workflow",
    workflowCreated: "Workflow created successfully",
    workflowNodePrompt: "LLM Prompt",
    workflowExecutionLogs: "Execution Logs",
    workflowDeleteConfirmDescription:
      "The active workflow and all of its nodes will be removed from this chat.",
    toolsImage: "Image",
    toolsVideo: "Video",
    toolsMusic: "Music",
    toolsCoding: "Coding",
    toolsIntegration: "Integration",
    toolsVirtualComputer: "Virtual Computer",
    railResearchTools: "Research",
    railProductivity: "Productivity",
    railCreativeTools: "Creative",
    railAdvancedTools: "Advanced",
    settingsAppearance: "Appearance",
    settingsData: "Data",
    toolsOn: "On",
    toolsOff: "Off",
    toolsComingSoon: "Coming soon",
    rightSidebarClose: "Close panel",
    previewLabel: "Preview",
    worksheetTitleLabel: "Document title",
    worksheetTitlePlaceholder: "e.g. Rooftop Solar Proposal",
    worksheetEmptyTitle: "No document yet",
    worksheetEmptyHint:
      "Ask IDA to create a document in chat. Once ready, edit it here and export to PDF.",
    worksheetDocumentsTitle: "Saved documents",
    worksheetDocumentsNoSummary: "No summary",
    worksheetDocumentsBack: "Back to list",
    worksheetDocumentsCreated: "Created",
    worksheetDocumentsEdited: "Edited",
    worksheetDocumentsExportedLabel: "Exported",
    worksheetDocumentsExportedPdf: "PDF",
    worksheetDocumentsExportedDocx: "DOCX",
    worksheetDocumentsSearchPlaceholder: "Search title, summary, or content…",
    worksheetDocumentsFilterLabel: "Filter",
    worksheetDocumentsFilterStatus: "Status",
    worksheetDocumentsFilterStatusAll: "All statuses",
    worksheetDocumentsFilterStatusGenerated: "Generated",
    worksheetDocumentsFilterStatusEdited: "Edited",
    worksheetDocumentsFilterStatusExported: "Exported",
    worksheetDocumentsFilterTime: "Time",
    worksheetDocumentsFilterTimeAll: "All time",
    worksheetDocumentsFilterTimeToday: "Today",
    worksheetDocumentsFilterTimeWeek: "Last 7 days",
    worksheetDocumentsFilterTimeMonth: "This month",
    worksheetDocumentsFilterResults: "Showing {shown} of {total} documents",
    worksheetDocumentsFilterActive: "filters active",
    worksheetDocumentsNoResults:
      "No documents match your search or filters.",
    worksheetDocumentsNoResultsHint:
      "Try a different keyword or reset filters to see all documents.",
    worksheetDocumentsResetFilters: "Reset Filters",
    worksheetEmptyStepsTitle: "Getting started",
    worksheetEmptyCreateFirst: "Create First Document",
    worksheetEmptyUseTemplate: "Use Template",
    worksheetDeleteDocument: "Delete this document",
    worksheetDeleteDocumentConfirm:
      "Delete this document from the list? This cannot be undone.",
    worksheetDeleteDocumentConfirmTitle: "Delete document?",
    worksheetDeleteDocumentConfirmNamed:
      'Delete "{title}"? This cannot be undone.',
    worksheetDeleteDocumentAction: "Yes, delete",
    worksheetDeleteDocumentSuccess: "Document deleted",
    worksheetDeleteDocumentSuccessNamed: '"{title}" was deleted',
    worksheetSaveTemplate: "Save as template",
    worksheetSaveTemplateTitle: "Save as template",
    worksheetSaveTemplateDescription:
      "Save this document branding and structure as a company letterhead template.",
    worksheetSaveTemplateNameLabel: "Template name",
    worksheetSaveTemplateNamePlaceholder: "Official Letter, Project Proposal…",
    worksheetSaveTemplateAction: "Save template",
    worksheetSaveTemplateSuccess: "Letterhead template saved",
    worksheetSaveTemplateSuccessNamed: 'Template "{name}" saved successfully',
    worksheetSaveTemplateError: "Failed to save template",
    worksheetSaveTemplateNameRequired: "Template name is required",
    worksheetSaveTemplateSaveTypeLabel: "What to save",
    worksheetSaveTemplateBrandingOnly: "Branding only",
    worksheetSaveTemplateBrandingOnlyHint:
      "Header, footer, logo, and letterhead styling only.",
    worksheetSaveTemplateBrandingAndStructure: "Branding + structure",
    worksheetSaveTemplateBrandingAndStructureHint:
      "Branding plus document structure/content as a sample.",
    worksheetSaveTemplatePreviewLabel: "Preview",
    worksheetSaveTemplateReviewAction: "Review & continue",
    worksheetSaveTemplateConfirmTitle: "Confirm save template",
    worksheetSaveTemplateConfirmDescription:
      "Review the template details before saving it to the company letterhead list.",
    worksheetSaveTemplateConfirmAction: "Yes, save template",
    worksheetSaveTemplateBack: "Back",
    worksheetSaveTemplateViewInAdmin: "View template in Admin",
    worksheetCopy: "Copy",
    worksheetDownload: "Download .md",
    worksheetCopied: "Document copied",
    worksheetDownloaded: "Document downloaded",
    worksheetGenerating: "IDA is generating your document...",
    worksheetGeneratingSubtext:
      "Your document will appear in this panel when ready.",
    worksheetGeneratingCardLabel: "Creating new document...",
    worksheetCreated: "Document created successfully",
    worksheetErrorParseFailed:
      "The response format was not recognized. Try sending your request again or clarify the document content.",
    worksheetErrorEmptyDocument:
      "The document is empty. Try again with a clearer request.",
    worksheetErrorGenerateFailed:
      "Failed to generate the document. Check your connection and try again.",
    worksheetRetry: "Retry",
    worksheetRegenerate: "Regenerate",
    worksheetClear: "Clear all documents",
    worksheetClearConfirm:
      "Clear all Worksheet documents? This cannot be undone.",
    worksheetOverwriteTitle: "Replace document?",
    worksheetOverwriteDescription:
      "The Worksheet already has a document. A new request will overwrite the existing content.",
    worksheetOverwriteConfirm: "Replace document",
    worksheetEmptySteps:
      "1. Enable Worksheet in Tools, then type your request in chat\n2. IDA creates the document and shows it in this panel\n3. Edit, save, then export to PDF or DOCX",
    worksheetEmptyEditHint:
      "Tip: After the document is created, use Edit to refine the content before downloading.",
    worksheetEdit: "Edit",
    worksheetSave: "Save",
    worksheetCancel: "Cancel",
    worksheetUnsavedChanges: "Unsaved changes",
    worksheetSaved: "Changes saved",
    worksheetDiscardChanges:
      "Discard unsaved changes and exit edit mode?",
    worksheetSwitchDocumentDiscardTitle: "Discard changes?",
    worksheetSwitchDocumentDiscard:
      "You have unsaved changes. Discard them and open another document?",
    worksheetSwitchDocumentAction: "Discard & open",
    worksheetExportPdf: "Export PDF",
    worksheetExportPdfTitle: "Export to PDF",
    worksheetExportPdfPaper: "Paper size",
    worksheetExportPdfPaperA4: "A4",
    worksheetExportPdfPaperLetter: "Letter",
    worksheetExportPdfOrientation: "Orientation",
    worksheetExportPdfPortrait: "Portrait",
    worksheetExportPdfLandscape: "Landscape",
    worksheetExportPdfGenerating: "Generating PDF...",
    worksheetExportPdfSuccess: "PDF downloaded successfully",
    worksheetExportPdfError: "Failed to generate PDF. Please try again.",
    worksheetHistory: "History",
    worksheetHistoryTitle: "Document history",
    worksheetHistoryEmpty:
      "No saved versions yet. Versions are created when IDA generates or you save edits.",
    worksheetHistoryRestore: "Restore",
    worksheetHistoryRestoreConfirm:
      "Restore this version? Your current content will be saved to history first.",
    worksheetHistoryRestoredToast: "Document version restored",
    worksheetHistoryGenerated: "IDA generated",
    worksheetHistoryManualSave: "Manual save",
    worksheetHistoryRestored: "Restored",
    worksheetHistoryTemplate: "From template",
    worksheetTemplates: "Templates",
    worksheetTemplatesTitle: "Choose a document template",
    worksheetTemplatesDescription:
      "Start from a ready-made structure, then edit or ask IDA to complete it in chat.",
    worksheetTemplateApplied: "Template applied",
    worksheetTemplateOverwriteConfirm:
      "Apply this template? Current document content will be replaced.",
    worksheetPrintPreview: "Print preview",
    worksheetPrintPreviewTitle: "Print preview",
    worksheetPrintPreviewDescription:
      "See how the document looks with header and footer before printing.",
    worksheetPrint: "Print",
    worksheetPrintPreviewError:
      "Could not open print preview. Allow pop-ups and try again.",
    worksheetExportPdfBranding: "PDF branding",
    worksheetExportPdfIncludeBranding: "IDA header & footer",
    worksheetExportPdfPageNumbers: "Page numbers",
    worksheetExportPdfExportDate: "Export date",
    worksheetEditorToolbar: "Markdown editor toolbar",
    worksheetEditorBold: "Bold",
    worksheetEditorItalic: "Italic",
    worksheetEditorHeading1: "Heading 1",
    worksheetEditorHeading2: "Heading 2",
    worksheetEditorHeading3: "Heading 3",
    worksheetEditorAlignLeft: "Align left",
    worksheetEditorAlignCenter: "Align center",
    worksheetEditorAlignRight: "Align right",
    worksheetEditorAlignJustify: "Justify",
    worksheetEditorUndo: "Undo",
    worksheetEditorRedo: "Redo",
    worksheetEditorBulletList: "Bullet list",
    worksheetEditorNumberedList: "Numbered list",
    worksheetEditorLink: "Link",
    worksheetEditorCode: "Inline code",
    worksheetEditorTable: "Table",
    worksheetEditorBlockquote: "Blockquote",
    worksheetEditorLinkPrompt: "Link URL",
    worksheetEditVisual: "Visual",
    worksheetEditVisualHint: "Edit formatted text directly (WYSIWYG). Stored as Markdown.",
    worksheetEditVisualPlaceholder: "Start typing your document…",
    worksheetBranding: "Branding",
    worksheetBrandingTitle: "Document branding",
    worksheetBrandingDescription:
      "Set company name, footer text, and logo for PDF export and print preview. Personal override in this browser; org defaults from admin.",
    worksheetBrandingBrandName: "Brand name",
    worksheetBrandingFooterText: "Footer text",
    worksheetBrandingLogo: "Logo",
    worksheetBrandingLogoHint: "PNG/JPG, max ~180 KB",
    worksheetBrandingRemoveLogo: "Remove logo",
    worksheetBrandingSaved: "Branding saved",
    worksheetBrandingReset: "Reset to default",
    worksheetBrandingTabHeader: "Header",
    worksheetBrandingTabFooter: "Footer",
    worksheetBrandingTabStyling: "Styling",
    worksheetBrandingTabPreview: "Preview",
    worksheetBrandingLetterheadSection: "Letterhead",
    worksheetBrandingContactSection: "Address & Contact",
    worksheetBrandingFooterSection: "Document Footer",
    worksheetBrandingPreviewHint:
      "Preview how the header and footer will appear on exported documents.",
    worksheetBrandingTagline: "Tagline / Slogan",
    worksheetBrandingTaglinePlaceholder: "Your Trusted Digital Partner",
    worksheetBrandingAddress: "Address",
    worksheetBrandingAddressPlaceholder: "123 Main Street\nNew York, NY 10001",
    worksheetBrandingPhone: "Phone",
    worksheetBrandingPhonePlaceholder: "+1 (555) 123-4567",
    worksheetBrandingEmail: "Email",
    worksheetBrandingEmailPlaceholder: "info@company.com",
    worksheetBrandingWebsite: "Website",
    worksheetBrandingWebsitePlaceholder: "www.company.com",
    worksheetBrandingShowHeaderDivider: "Divider line below header",
    worksheetBrandingFooterContact: "Short footer contact line",
    worksheetBrandingFooterContactPlaceholder: "123 Main St · +1 (555) 123-4567",
    worksheetBrandingPrimaryColor: "Primary color",
    worksheetBrandingHeaderFont: "Header font",
    worksheetBrandingFooterFont: "Footer font",
    worksheetBrandingFontSystem: "System",
    worksheetBrandingFontSans: "Sans-serif",
    worksheetBrandingFontSerif: "Serif",
    worksheetBrandingPreview: "Preview",
    worksheetBrandingPreviewDocTitle: "Document Title",
    worksheetBrandingTemplateReadOnly:
      "Branding is managed by the company template. Change it in Admin or switch to Personal Branding.",
    worksheetBrandingSelectionSaved: "Letterhead selection saved",
    worksheetLetterheadSourceTitle: "Letterhead source",
    worksheetLetterheadSourceDescription:
      "Choose personal branding or a company template for this document.",
    worksheetLetterheadSourcePersonal: "Personal branding",
    worksheetLetterheadSourcePersonalHint: "Your own branding settings",
    worksheetLetterheadSourceTemplate: "Company template",
    worksheetLetterheadSourceTemplateHint: "Use an admin-managed template",
    worksheetLetterheadNoTemplates: "No company templates available yet",
    worksheetLetterheadTemplateLabel: "Select template",
    worksheetLetterheadDefaultBadge: "Default",
    worksheetLetterheadActiveTemplate: "Active template: {name}",
    worksheetLetterheadActivePersonal: "Using personal branding",
    worksheetShare: "Share",
    worksheetShareCopied: "Share link created and copied",
    worksheetShareError: "Failed to create share link. Please try again.",
    worksheetMoreActions: "More",
    worksheetDownloadMenu: "Download",
    worksheetDownloadPdf: "PDF",
    worksheetDownloadMd: "Markdown (.md)",
    worksheetDownloadDocx: "Word (.docx)",
    worksheetExportDocxSuccess: "DOCX downloaded successfully",
    worksheetExportDocxError: "Failed to generate DOCX. Please try again.",
    worksheetEditMarkdown: "Markdown",
    worksheetEditSplit: "Split",
    worksheetEditMarkdownHint: "Full Markdown source mode.",
    worksheetEditSplitHint: "Edit Markdown with a live preview.",
    worksheetEditPreviewEmpty: "Preview appears as you type.",
    worksheetFullView: "Full View",
    worksheetFullViewTitle: "Full View — Print-Ready",
    worksheetFullViewDescription:
      "Edit your document in a layout close to the PDF/export output.",
    worksheetFullViewBadge: "Print Preview / Full View",
    worksheetExitFullView: "Exit Full View",
    worksheetFullViewEditorLabel: "Full View document editor",
    worksheetFullViewPlaceholder: "Start editing your document…",
    worksheetFullViewShortcutHint:
      "Shortcut: F or Ctrl/Cmd+Shift+F to open · Esc to exit",
    mapPlaceholderDesc:
      "An interactive map will appear here for location-based questions.",
    mapPlaceholderContent:
      "[ Map ]\n\nMap preview will appear in this panel.",
    mapAddMarker: "Add marker",
    mapResetView: "Reset view",
    mapMarkerLabel: "Marker",
    mapRemoveMarker: "Remove marker",
    mapSearchPlaceholder: "Search location…",
    mapSearchNoResults: "No locations found.",
    mapSearchError: "Location search failed.",
    mapClickToAdd: "Click map",
    mapClickToAddHint: "Enable then click the map to drop a marker",
    mapCopyCoordinates: "Copy",
    mapCopiedCoordinates: "Coordinates copied",
    mapCenterMarker: "Center",
    mapEditMarker: "Edit marker label",
    mapSaveMarker: "Save",
    mapCancelEdit: "Cancel",
    mapCoordinatesLabel: "Coordinates",
    researchPlaceholderDesc:
      "Deep research results will be displayed in this panel.",
    researchPlaceholderContent:
      "## Research Summary\n\nMulti-source research results will appear here.",
    errors: {
      generic: "Failed to get a response. Please try again.",
      rateLimit: "Too many requests. Please wait a moment.",
      tooLong: "Message is too long.",
    },
  },
  zh: {
    welcome:
      "我今天随时准备帮助你。在下方输入问题，或选择快捷建议开始。\n\n有什么我可以帮你的吗？",
    subtitle: "智能数字助手",
    windowLabel: "IDA 聊天窗口",
    open: "打开 IDA 聊天",
    close: "关闭聊天",
    inputLabel: "发送给 IDA 的消息",
    inputPlaceholder: "输入消息...",
    send: "发送",
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
    openChatHistory: "打开聊天记录",
    emptyStateTitle: "欢迎使用 IDA",
    emptyStateSubtitle: "随时为你提供帮助的 AI 助手",
    emptyStateHint: "在下方输入消息开始对话。",
    emptyStateTipsTitle: "小贴士",
    emptyStateTips: [
      "随意提问 — 支持印尼语、英语和中文。",
      "使用工具菜单进行联网搜索、画布等功能。",
      "按 Enter 发送消息。",
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
    profilePhoto: "头像",
    accountSettingsTitle: "账户设置",
    accountSettingsDescription: "管理 Google 资料及 IDA 的回复风格。",
    uploadAvatar: "上传照片",
    useGoogleAvatar: "使用 Google 头像",
    avatarHint: "支持 JPG、PNG 或 WebP，最大 2 MB。",
    avatarUploadSuccess: "头像已更新。",
    avatarUploadError: "头像更新失败。",
    useGoogleAvatarSuccess: "已应用 Google 头像。",
    saveProfile: "保存资料",
    savingProfile: "保存中...",
    profileSaveSuccess: "资料已保存。",
    profileSaveError: "保存资料失败。",
    profileNameRequired: "显示名称不能为空。",
    customPromptTitle: "个性与回复风格",
    customPromptDescription: "编写自定义指令，让 IDA 按您的偏好调整回复风格。",
    customPromptLabel: "自定义提示词",
    customPromptPlaceholder1: "用轻松友好的语气回复，像亲密朋友一样",
    customPromptPlaceholder2: "始终使用礼貌、专业的中文",
    customPromptPlaceholder3: "聚焦实用方案，直接切入重点",
    saveCustomPrompt: "保存自定义提示词",
    savingCustomPrompt: "保存中...",
    customPromptSaveSuccess: "自定义提示词已保存。",
    customPromptSaveError: "保存自定义提示词失败。",
    clearCustomPrompt: "清除",
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
    webSearchPanelTitle: "联网搜索",
    webSearchPanelEmptyTitle: "暂无结果",
    webSearchPanelEmpty:
      "开启联网搜索后，发送需要最新信息的问题，结果将显示在此面板。",
    webSearchPanelSearching: "IDA 正在联网搜索...",
    webSearchPanelError: "联网搜索失败",
    webSearchPanelLastQuery: "查询：{query}",
    webSearchPanelClear: "清除结果",
    webSearchUseAsContext: "用作上下文",
    researchUnavailable: "研究功能未配置",
    researchPanelTitle: "研究",
    researchPanelEmptyTitle: "暂无研究结果",
    researchPanelEmpty:
      "在上方输入研究主题，或开启研究后在聊天中发送问题以进行深度研究。",
    researchPanelSearching: "IDA 正在研究中...",
    researchPanelError: "研究失败",
    researchPanelLastTopic: "主题：{topic}",
    researchPanelClear: "清除结果",
    researchPanelTopicPlaceholder: "研究主题，例如：2026年印尼AI趋势",
    researchPanelStart: "开始研究",
    researchPanelSummary: "摘要",
    researchPanelSaveSession: "保存会话",
    researchPanelCreateDocument: "创建文档",
    researchPanelHistory: "研究历史",
    researchPanelOpenSession: "打开",
    researchPanelSourceCount: "{count} 个来源",
    researchPanelQueriesUsed: "使用了 {count} 个查询",
    researchPanelQueryLabel: "查询：{query}",
    researchPanelDepthLabel: "研究深度",
    researchPanelDepthHint: {
      quick: "{queries} 个查询 · 约 {sources} 个来源",
      standard: "{queries} 个查询 · 约 {sources} 个来源",
      deep: "{queries} 个查询 · 约 {sources} 个来源",
    },
    researchPanelProgressStage: {
      preparing: "准备查询",
      knowledge: "检索知识库",
      searching: "搜索网络来源",
      synthesizing: "生成摘要",
    },
    researchPanelExecutiveSummary: "执行摘要",
    researchPanelKeyFindings: "主要发现",
    researchPanelDepth: {
      quick: "快速",
      standard: "标准",
      deep: "深度",
    },
    researchSessionSaved: "研究会话已保存",
    editMessage: "编辑消息",
    editSave: "重新发送",
    editCancel: "取消",
    copyCode: "复制代码",
    fontSizeSetting: "字体大小",
    fontSizeSmall: "小",
    fontSizeMedium: "中",
    fontSizeLarge: "大",
    toolsMenu: "工具",
    toolsWebSearch: "联网搜索",
    toolsMap: "地图",
    toolsResearch: "研究",
    toolsWorksheet: "Worksheet",
    toolsWorkflow: "工作流",
    workflowNew: "新工作流",
    workflowAddNode: "添加节点",
    workflowAddTrigger: "触发器",
    workflowAddAction: "动作",
    workflowAddCondition: "条件",
    workflowAddOutput: "输出",
    workflowSave: "保存",
    workflowExecute: "执行",
    workflowDelete: "删除",
    workflowEmptyTitle: "暂无工作流",
    workflowEmptyHint: "创建新工作流，然后在画布上添加触发器、动作、条件或输出节点。",
    workflowProperties: "节点属性",
    workflowNodeLabel: "标签",
    workflowNodeDescription: "描述",
    workflowNodeKind: "类型",
    workflowDeleteNode: "删除节点",
    workflowDeleteConfirm: "删除当前工作流？",
    workflowSaved: "工作流已保存",
    workflowExecuted: "工作流已执行（占位）",
    workflowSelectWorkflow: "选择工作流",
    workflowCreated: "工作流创建成功",
    workflowNodePrompt: "LLM 提示词",
    workflowExecutionLogs: "执行日志",
    workflowDeleteConfirmDescription: "当前工作流及其所有节点将从本对话中删除。",
    toolsImage: "图像",
    toolsVideo: "视频",
    toolsMusic: "音乐",
    toolsCoding: "编程",
    toolsIntegration: "集成",
    toolsVirtualComputer: "虚拟电脑",
    railResearchTools: "研究工具",
    railProductivity: "效率工具",
    railCreativeTools: "创作",
    railAdvancedTools: "高级工具",
    settingsAppearance: "外观",
    settingsData: "数据",
    toolsOn: "开",
    toolsOff: "关",
    toolsComingSoon: "即将推出",
    rightSidebarClose: "关闭面板",
    previewLabel: "预览",
    worksheetTitleLabel: "文档标题",
    worksheetTitlePlaceholder: "例如：屋顶光伏项目提案",
    worksheetEmptyTitle: "尚无文档",
    worksheetEmptyHint:
      "在聊天中请求 IDA 创建文档。生成后可直接在此编辑并导出 PDF。",
    worksheetDocumentsTitle: "已保存文档",
    worksheetDocumentsNoSummary: "无摘要",
    worksheetDocumentsBack: "返回列表",
    worksheetDocumentsCreated: "创建",
    worksheetDocumentsEdited: "编辑",
    worksheetDocumentsExportedLabel: "已导出",
    worksheetDocumentsExportedPdf: "PDF",
    worksheetDocumentsExportedDocx: "DOCX",
    worksheetDocumentsSearchPlaceholder: "搜索标题、摘要或内容…",
    worksheetDocumentsFilterLabel: "筛选",
    worksheetDocumentsFilterStatus: "状态",
    worksheetDocumentsFilterStatusAll: "全部状态",
    worksheetDocumentsFilterStatusGenerated: "已生成",
    worksheetDocumentsFilterStatusEdited: "已编辑",
    worksheetDocumentsFilterStatusExported: "已导出",
    worksheetDocumentsFilterTime: "时间",
    worksheetDocumentsFilterTimeAll: "全部时间",
    worksheetDocumentsFilterTimeToday: "今天",
    worksheetDocumentsFilterTimeWeek: "最近 7 天",
    worksheetDocumentsFilterTimeMonth: "本月",
    worksheetDocumentsFilterResults: "显示 {shown} / {total} 个文档",
    worksheetDocumentsFilterActive: "筛选已启用",
    worksheetDocumentsNoResults: "没有符合搜索或筛选条件的文档。",
    worksheetDocumentsNoResultsHint: "请尝试其他关键词或重置筛选以查看全部文档。",
    worksheetDocumentsResetFilters: "重置筛选",
    worksheetEmptyStepsTitle: "开始使用",
    worksheetEmptyCreateFirst: "创建第一份文档",
    worksheetEmptyUseTemplate: "使用模板",
    worksheetDeleteDocument: "删除此文档",
    worksheetDeleteDocumentConfirm: "从列表中删除此文档？此操作无法撤销。",
    worksheetDeleteDocumentConfirmTitle: "删除文档？",
    worksheetDeleteDocumentConfirmNamed: "删除「{title}」？此操作无法撤销。",
    worksheetDeleteDocumentAction: "确认删除",
    worksheetDeleteDocumentSuccess: "文档已删除",
    worksheetDeleteDocumentSuccessNamed: "「{title}」已删除",
    worksheetSaveTemplate: "保存为模板",
    worksheetSaveTemplateTitle: "保存为模板",
    worksheetSaveTemplateDescription: "将此文档的品牌样式和结构保存为公司信笺模板。",
    worksheetSaveTemplateNameLabel: "模板名称",
    worksheetSaveTemplateNamePlaceholder: "正式信函、项目提案…",
    worksheetSaveTemplateAction: "保存模板",
    worksheetSaveTemplateSuccess: "信笺模板已保存",
    worksheetSaveTemplateSuccessNamed: "模板「{name}」已保存",
    worksheetSaveTemplateError: "保存模板失败",
    worksheetSaveTemplateNameRequired: "模板名称不能为空",
    worksheetSaveTemplateSaveTypeLabel: "保存内容",
    worksheetSaveTemplateBrandingOnly: "仅品牌样式",
    worksheetSaveTemplateBrandingOnlyHint: "仅保存页眉、页脚、徽标和信笺样式。",
    worksheetSaveTemplateBrandingAndStructure: "品牌 + 结构",
    worksheetSaveTemplateBrandingAndStructureHint:
      "品牌样式加上文档结构/内容示例。",
    worksheetSaveTemplatePreviewLabel: "预览",
    worksheetSaveTemplateReviewAction: "检查并继续",
    worksheetSaveTemplateConfirmTitle: "确认保存模板",
    worksheetSaveTemplateConfirmDescription:
      "保存到公司信笺列表前，请再次确认模板详情。",
    worksheetSaveTemplateConfirmAction: "确认保存",
    worksheetSaveTemplateBack: "返回",
    worksheetSaveTemplateViewInAdmin: "在管理后台查看模板",
    worksheetCopy: "复制",
    worksheetDownload: "下载 .md",
    worksheetCopied: "文档已复制",
    worksheetDownloaded: "文档已下载",
    worksheetGenerating: "IDA 正在生成文档...",
    worksheetGeneratingSubtext: "文档完成后将显示在此面板。",
    worksheetGeneratingCardLabel: "正在创建新文档...",
    worksheetCreated: "文档创建成功",
    worksheetErrorParseFailed:
      "无法识别响应格式。请重新发送请求或说明文档内容。",
    worksheetErrorEmptyDocument: "文档为空。请用更清晰的请求重试。",
    worksheetErrorGenerateFailed: "生成文档失败。请检查网络后重试。",
    worksheetRetry: "重试",
    worksheetRegenerate: "重新生成",
    worksheetClear: "清除所有文档",
    worksheetClearConfirm: "清除所有 Worksheet 文档？此操作无法撤销。",
    worksheetOverwriteTitle: "替换文档？",
    worksheetOverwriteDescription:
      "Worksheet 已有文档。新请求将覆盖现有内容。",
    worksheetOverwriteConfirm: "替换文档",
    worksheetEmptySteps:
      "1. 在工具菜单中启用 Worksheet，然后在聊天中输入请求\n2. IDA 会在此面板生成文档\n3. 编辑、保存后导出为 PDF 或 DOCX",
    worksheetEmptyEditHint:
      "提示：文档生成后，可先点击编辑完善内容再下载。",
    worksheetEdit: "编辑",
    worksheetSave: "保存",
    worksheetCancel: "取消",
    worksheetUnsavedChanges: "有未保存的更改",
    worksheetSaved: "更改已保存",
    worksheetDiscardChanges: "放弃未保存的更改并退出编辑模式？",
    worksheetSwitchDocumentDiscardTitle: "放弃更改？",
    worksheetSwitchDocumentDiscard:
      "您有未保存的更改。放弃更改并打开其他文档？",
    worksheetSwitchDocumentAction: "放弃并打开",
    worksheetExportPdf: "导出 PDF",
    worksheetExportPdfTitle: "导出 PDF",
    worksheetExportPdfPaper: "纸张大小",
    worksheetExportPdfPaperA4: "A4",
    worksheetExportPdfPaperLetter: "Letter",
    worksheetExportPdfOrientation: "方向",
    worksheetExportPdfPortrait: "纵向",
    worksheetExportPdfLandscape: "横向",
    worksheetExportPdfGenerating: "正在生成 PDF...",
    worksheetExportPdfSuccess: "PDF 下载成功",
    worksheetExportPdfError: "PDF 生成失败，请重试。",
    worksheetHistory: "历史",
    worksheetHistoryTitle: "文档历史",
    worksheetHistoryEmpty: "尚无保存版本。IDA 生成或手动保存时会创建版本。",
    worksheetHistoryRestore: "恢复",
    worksheetHistoryRestoreConfirm: "恢复此版本？当前内容将先保存到历史记录。",
    worksheetHistoryRestoredToast: "文档版本已恢复",
    worksheetHistoryGenerated: "IDA 生成",
    worksheetHistoryManualSave: "手动保存",
    worksheetHistoryRestored: "已恢复",
    worksheetHistoryTemplate: "来自模板",
    worksheetTemplates: "模板",
    worksheetTemplatesTitle: "选择文档模板",
    worksheetTemplatesDescription:
      "从现成结构开始，然后编辑或通过聊天让 IDA 补充内容。",
    worksheetTemplateApplied: "模板已应用",
    worksheetTemplateOverwriteConfirm: "应用此模板？当前文档内容将被替换。",
    worksheetPrintPreview: "打印预览",
    worksheetPrintPreviewTitle: "打印预览",
    worksheetPrintPreviewDescription: "打印前查看带页眉页脚的文档效果。",
    worksheetPrint: "打印",
    worksheetPrintPreviewError: "无法打开打印预览。请允许弹窗后重试。",
    worksheetExportPdfBranding: "PDF 品牌样式",
    worksheetExportPdfIncludeBranding: "IDA 页眉和页脚",
    worksheetExportPdfPageNumbers: "页码",
    worksheetExportPdfExportDate: "导出日期",
    worksheetEditorToolbar: "Markdown 编辑工具栏",
    worksheetEditorBold: "粗体",
    worksheetEditorItalic: "斜体",
    worksheetEditorHeading1: "一级标题",
    worksheetEditorHeading2: "二级标题",
    worksheetEditorHeading3: "三级标题",
    worksheetEditorAlignLeft: "左对齐",
    worksheetEditorAlignCenter: "居中",
    worksheetEditorAlignRight: "右对齐",
    worksheetEditorAlignJustify: "两端对齐",
    worksheetEditorUndo: "撤销",
    worksheetEditorRedo: "重做",
    worksheetEditorBulletList: "无序列表",
    worksheetEditorNumberedList: "有序列表",
    worksheetEditorLink: "链接",
    worksheetEditorCode: "行内代码",
    worksheetEditorTable: "表格",
    worksheetEditorBlockquote: "引用",
    worksheetEditorLinkPrompt: "链接 URL",
    worksheetEditVisual: "可视化",
    worksheetEditVisualHint: "直接编辑格式化文本（WYSIWYG），保存为 Markdown。",
    worksheetEditVisualPlaceholder: "开始输入文档内容…",
    worksheetBranding: "品牌",
    worksheetBrandingTitle: "文档品牌设置",
    worksheetBrandingDescription:
      "设置公司名称、页脚文字和 Logo，用于 PDF 导出和打印预览。本浏览器个人覆盖；组织默认来自管理后台。",
    worksheetBrandingBrandName: "品牌名称",
    worksheetBrandingFooterText: "页脚文字",
    worksheetBrandingLogo: "Logo",
    worksheetBrandingLogoHint: "PNG/JPG，最大约 180 KB",
    worksheetBrandingRemoveLogo: "移除 Logo",
    worksheetBrandingSaved: "品牌设置已保存",
    worksheetBrandingReset: "恢复默认",
    worksheetBrandingTabHeader: "页眉",
    worksheetBrandingTabFooter: "页脚",
    worksheetBrandingTabStyling: "样式",
    worksheetBrandingTabPreview: "预览",
    worksheetBrandingLetterheadSection: "信笺抬头",
    worksheetBrandingContactSection: "地址与联系方式",
    worksheetBrandingFooterSection: "文档页脚",
    worksheetBrandingPreviewHint: "预览导出文档中页眉与页脚的显示效果。",
    worksheetBrandingTagline: "标语 / Slogan",
    worksheetBrandingTaglinePlaceholder: "您值得信赖的数字化伙伴",
    worksheetBrandingAddress: "地址",
    worksheetBrandingAddressPlaceholder: "主街 123 号\n纽约 NY 10001",
    worksheetBrandingPhone: "电话",
    worksheetBrandingPhonePlaceholder: "+1 (555) 123-4567",
    worksheetBrandingEmail: "邮箱",
    worksheetBrandingEmailPlaceholder: "info@company.com",
    worksheetBrandingWebsite: "网站",
    worksheetBrandingWebsitePlaceholder: "www.company.com",
    worksheetBrandingShowHeaderDivider: "页眉下方分隔线",
    worksheetBrandingFooterContact: "页脚简短联系信息",
    worksheetBrandingFooterContactPlaceholder: "主街 123 号 · +1 (555) 123-4567",
    worksheetBrandingPrimaryColor: "主色",
    worksheetBrandingHeaderFont: "页眉字体",
    worksheetBrandingFooterFont: "页脚字体",
    worksheetBrandingFontSystem: "系统",
    worksheetBrandingFontSans: "无衬线",
    worksheetBrandingFontSerif: "衬线",
    worksheetBrandingPreview: "预览",
    worksheetBrandingPreviewDocTitle: "文档标题",
    worksheetBrandingTemplateReadOnly:
      "品牌样式由公司模板管理。请在管理后台修改，或切换为个人品牌设置。",
    worksheetBrandingSelectionSaved: "信笺模板选择已保存",
    worksheetLetterheadSourceTitle: "信笺来源",
    worksheetLetterheadSourceDescription: "为此文档选择个人品牌或公司模板。",
    worksheetLetterheadSourcePersonal: "个人品牌",
    worksheetLetterheadSourcePersonalHint: "您自己的品牌设置",
    worksheetLetterheadSourceTemplate: "公司模板",
    worksheetLetterheadSourceTemplateHint: "使用管理员创建的公司模板",
    worksheetLetterheadNoTemplates: "暂无公司模板",
    worksheetLetterheadTemplateLabel: "选择模板",
    worksheetLetterheadDefaultBadge: "默认",
    worksheetLetterheadActiveTemplate: "当前模板：{name}",
    worksheetLetterheadActivePersonal: "使用个人品牌设置",
    worksheetShare: "分享",
    worksheetShareCopied: "分享链接已创建并复制",
    worksheetShareError: "创建分享链接失败，请重试。",
    worksheetMoreActions: "更多",
    worksheetDownloadMenu: "下载",
    worksheetDownloadPdf: "PDF",
    worksheetDownloadMd: "Markdown (.md)",
    worksheetDownloadDocx: "Word (.docx)",
    worksheetExportDocxSuccess: "DOCX 下载成功",
    worksheetExportDocxError: "DOCX 生成失败，请重试。",
    worksheetEditMarkdown: "Markdown",
    worksheetEditSplit: "分屏",
    worksheetEditMarkdownHint: "完整 Markdown 源码模式。",
    worksheetEditSplitHint: "编辑 Markdown 并实时预览。",
    worksheetEditPreviewEmpty: "输入内容后将显示预览。",
    worksheetFullView: "全屏视图",
    worksheetFullViewTitle: "全屏视图 — 打印就绪",
    worksheetFullViewDescription: "在接近 PDF/导出效果的版式中编辑文档。",
    worksheetFullViewBadge: "打印预览 / 全屏视图",
    worksheetExitFullView: "退出全屏视图",
    worksheetFullViewEditorLabel: "全屏视图文档编辑器",
    worksheetFullViewPlaceholder: "开始编辑文档…",
    worksheetFullViewShortcutHint:
      "快捷键：F 或 Ctrl/Cmd+Shift+F 打开 · Esc 退出",
    mapPlaceholderDesc: "交互式地图将在此显示，用于位置相关问题。",
    mapPlaceholderContent: "[ 地图 ]\n\n地图预览将显示在此面板。",
    mapAddMarker: "添加标记",
    mapResetView: "重置视图",
    mapMarkerLabel: "标记",
    mapRemoveMarker: "删除标记",
    mapSearchPlaceholder: "搜索地点…",
    mapSearchNoResults: "未找到地点。",
    mapSearchError: "地点搜索失败。",
    mapClickToAdd: "点击地图",
    mapClickToAddHint: "启用后点击地图添加标记",
    mapCopyCoordinates: "复制",
    mapCopiedCoordinates: "坐标已复制",
    mapCenterMarker: "居中",
    mapEditMarker: "编辑标记名称",
    mapSaveMarker: "保存",
    mapCancelEdit: "取消",
    mapCoordinatesLabel: "坐标",
    researchPlaceholderDesc: "深度研究结果将显示在此面板。",
    researchPlaceholderContent:
      "## 研究摘要\n\n多来源研究结果将显示在此处。",
    errors: {
      generic: "获取回复失败，请重试。",
      rateLimit: "请求过多，请稍后再试。",
      tooLong: "消息过长。",
    },
  },
};

export type CopyStrings = (typeof COPY)[Locale];