import { IDA_CONFIG } from "@/lib/config";

export const LANDING_FEATURES = [
  {
    title: "Jawaban Berbasis Pengetahuan",
    description:
      "RAG dan knowledge base membuat IDA menjawab dengan konteks yang relevan, bukan tebakan kosong.",
    highlight: "RAG",
  },
  {
    title: "Memori Percakapan",
    description:
      "Riwayat chat tersimpan per akun Google Anda — lanjutkan dari laptop, tablet, atau ponsel.",
    highlight: "Sync",
  },
  {
    title: "Multibahasa",
    description:
      "Ngobrol dalam Bahasa Indonesia, English, atau 中文 dengan pengalaman yang konsisten.",
    highlight: "ID · EN · 中文",
  },
  {
    title: "Aman & Transparan",
    description:
      "Login via Google OAuth. Kebijakan privasi dan syarat layanan tersedia untuk transparansi penuh.",
    highlight: "OAuth",
  },
] as const;

export const LANDING_COPY = {
  badge: "Intelligent Digital Assistant",
  headline: "Asisten AI yang Mengerti Konteks Anda",
  headlineAccent: "Lebih Cerdas. Lebih Personal.",
  subheadline:
    "Tanya apa saja, brainstorm ide, atau selesaikan tugas — IDA siap membantu lewat percakapan natural.",
  description:
    "IDA (Intelligent Digital Assistant) adalah chatbot AI dengan RAG, memori sesi, dan dukungan multibahasa. Dirancang untuk produktivitas harian, belajar, dan bantuan informasi yang cepat serta terpercaya.",
  primaryCta: "Coba IDA Sekarang",
  primaryCtaShort: "Try IDA",
  heroSecondaryCta: "Lihat Fitur",
  signInTitle: "Siap memulai?",
  signInDescription:
    "Masuk dengan Google untuk membuka chat room IDA dan menyimpan riwayat percakapan Anda.",
  googleSignInLabel: "Masuk dengan Google",
  privacyNote:
    "Dengan masuk, Anda menyetujui Syarat Layanan dan Kebijakan Privasi IDA.",
  continueToChat: "Lanjut ke Chat",
  privacyLink: "Kebijakan Privasi",
  termsLink: "Syarat Layanan",
  featuresTitle: "Kenapa IDA?",
  featuresSubtitle:
    "Semua yang Anda butuhkan dari asisten AI modern — dalam satu pengalaman chat yang rapi.",
  trustLine: "Gratis untuk digunakan · Login Google · Tanpa login wall di halaman ini",
} as const;

export const LANDING_AGENTFLOW = {
  badge: "AgentFlow AI",
  title: "Otomatisasi Workflow dengan AI Agent",
  description:
    "AgentFlow membantu Anda menganalisis dokumen, membuat workflow otomatis, dan menjalankan proses bisnis dengan bantuan AI serta persetujuan manusia.",
  benefits: [
    "Analisis dokumen multi-format secara otomatis",
    "Pembuatan workflow dengan human-in-the-loop",
    "Integrasi dengan Worksheet dan data perusahaan",
    "Eksekusi sandbox yang aman dan terkontrol",
  ],
  cta: "Mulai Gunakan AgentFlow",
  previewTitle: "Contoh Kemampuan AgentFlow",
  headerLink: "AgentFlow",
} as const;

export { IDA_CONFIG };