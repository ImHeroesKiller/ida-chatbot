import { IDA_CONFIG } from "@/lib/config";

export const LANDING_FEATURES = [
  {
    title: "RAG & Knowledge Base",
    description:
      "Jawaban berbasis dokumen dan pengetahuan terkurasi agar respons IDA akurat dan relevan.",
  },
  {
    title: "Memori Percakapan",
    description:
      "Riwayat chat tersimpan per akun sehingga Anda dapat melanjutkan percakapan di perangkat mana pun.",
  },
  {
    title: "Multibahasa",
    description:
      "Dukungan Bahasa Indonesia, English, dan 中文 untuk pengalaman chat yang nyaman.",
  },
  {
    title: "Privasi & Keamanan",
    description:
      "Login melalui Google OAuth. Data pengguna dikelola sesuai kebijakan privasi dan syarat layanan kami.",
  },
] as const;

export const LANDING_COPY = {
  headline: `${IDA_CONFIG.name} — Intelligent Digital Assistant`,
  subheadline:
    "Asisten AI untuk percakapan cerdas, brainstorming, dan bantuan informasi harian.",
  description:
    "IDA (Intelligent Digital Assistant) adalah aplikasi chatbot AI yang membantu Anda bertanya, belajar, dan menyelesaikan tugas melalui percakapan natural. Fitur RAG, memori sesi, dan dukungan multibahasa dirancang untuk pengalaman yang konsisten dan personal.",
  signInTitle: "Masuk untuk memulai chat",
  signInDescription:
    "Gunakan akun Google untuk mengakses chat room IDA dan menyinkronkan riwayat percakapan Anda. Login bersifat opsional untuk menjelajahi informasi aplikasi di halaman ini.",
  googleSignInLabel: "Masuk dengan Google",
  privacyNote:
    "Dengan masuk, Anda menyetujui Syarat Layanan dan Kebijakan Privasi IDA.",
  continueToChat: "Lanjut ke Chat",
  privacyLink: "Kebijakan Privasi",
  termsLink: "Syarat Layanan",
} as const;