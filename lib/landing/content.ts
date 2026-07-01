import { IDA_CONFIG } from "@/lib/config";

export const LANDING_TOOLS = [
  {
    id: "worksheet",
    title: "Worksheet",
    description:
      "Buat dan kelola dokumen profesional langsung dari percakapan — tanpa bolak-balik antar aplikasi.",
    benefit: "Surat, memo, dan draft siap pakai dalam hitungan menit.",
  },
  {
    id: "web-search",
    title: "Web Search",
    description:
      "Cari informasi terkini langsung di dalam chat. IDA bantu rangkum hasilnya dengan cepat.",
    benefit: "Jawaban selalu relevan dengan kondisi terbaru.",
  },
  {
    id: "research",
    title: "Research",
    description:
      "Lakukan riset yang lebih dalam dan terstruktur untuk topik yang butuh analisis menyeluruh.",
    benefit: "Dapat gambaran lengkap tanpa browsing berjam-jam.",
  },
  {
    id: "map",
    title: "Map",
    description:
      "Visualisasikan dan analisis data lokasi untuk kebutuhan perencanaan atau eksplorasi wilayah.",
    benefit: "Pahami konteks geografis dengan lebih mudah.",
  },
] as const;

export const LANDING_BENEFITS = [
  {
    title: "Hemat waktu setiap hari",
    description:
      "Satu tempat untuk chat, riset, dokumen, dan peta — tugas harian jadi lebih ringan.",
  },
  {
    title: "Lebih produktif",
    description:
      "Fokus pada hasil, bukan ribetnya alat. IDA bantu dari ide sampai output.",
  },
  {
    title: "Informasi selalu update",
    description:
      "Dengan Web Search, kamu nggak ketinggalan info terbaru yang penting buat keputusan.",
  },
  {
    title: "Nyaman dipakai di mana saja",
    description:
      "Di laptop atau HP, pengalaman chat tetap rapi dan mudah dipahami.",
  },
] as const;

export const LANDING_STEPS = [
  {
    step: "1",
    title: "Masuk & mulai chat",
    description:
      "Login dengan Google, lalu langsung ngobrol dengan IDA seperti chat biasa.",
  },
  {
    step: "2",
    title: "Aktifkan tools yang kamu butuh",
    description:
      "Pilih Worksheet, Web Search, Research, atau Map sesuai kebutuhan tugasmu.",
  },
  {
    step: "3",
    title: "Dapatkan hasilnya",
    description:
      "IDA bantu menyelesaikan — dari jawaban cepat sampai dokumen atau riset yang rapi.",
  },
] as const;

export const LANDING_WHY_IDA = [
  "Dibuat untuk pengguna Indonesia — bahasa natural dan konteks lokal.",
  "Tools yang relevan dengan kebutuhan sehari-hari: dokumen, riset, dan peta.",
  "Antarmuka chat yang bersih, nggak bikin pusing.",
  "Gratis untuk dicoba — cukup login Google dan langsung mulai.",
] as const;

export const LANDING_COPY = {
  badge: "Asisten AI buatan Indonesia",
  headline: "Chat pintar dengan tools yang benar-benar kamu pakai",
  headlineAccent: "Ngobrol, riset, buat dokumen — semua di satu tempat.",
  subheadline:
    "IDA (Intelligent Digital Assistant) adalah asisten AI yang siap bantu kerja, belajar, dan cari informasi lewat percakapan yang natural.",
  description:
    "Coba chat gratis, aktifkan tools sesuai kebutuhan, dan rasakan cara kerja yang lebih praktis tanpa ribet.",
  primaryCta: "Mulai Chat Gratis",
  primaryCtaShort: "Mulai Chat",
  heroSecondaryCta: "Lihat Fitur",
  signInTitle: "Siap mencoba IDA?",
  signInDescription:
    "Masuk dengan Google untuk membuka chat room dan mulai pakai tools favoritmu.",
  googleSignInLabel: "Masuk dengan Google",
  privacyNote:
    "Dengan masuk, Anda menyetujui Syarat Layanan dan Kebijakan Privasi IDA.",
  continueToChat: "Lanjut ke Chat",
  privacyLink: "Kebijakan Privasi",
  termsLink: "Syarat Layanan",
  toolsTitle: "Tools utama di dalam chat",
  toolsSubtitle:
    "Empat tools ini jadi inti pengalaman IDA — aktifkan kapan saja langsung dari composer chat.",
  benefitsTitle: "Apa yang kamu dapat?",
  benefitsSubtitle:
    "Bukan cuma jawaban cepat — IDA bantu kamu menyelesaikan hal yang biasanya makan waktu.",
  howItWorksTitle: "Cara kerjanya simpel",
  howItWorksSubtitle: "Tiga langkah, langsung praktik.",
  whyIdaTitle: "Kenapa IDA?",
  whyIdaSubtitle:
    "Asisten AI buatan Indonesia yang paham kebutuhanmu — dari bahasa sampai tools sehari-hari.",
  finalCtaTitle: "Yuk, coba sekarang — gratis",
  finalCtaSubtitle:
    "Ribuan kemungkinan dimulai dari satu percakapan. Mulai chat dan aktifkan tools yang kamu butuh.",
  testimonialTitle: "Apa kata pengguna",
  testimonialPlaceholder: "Testimonial akan ditampilkan di sini.",
  trustLine: "Gratis untuk dicoba · Login Google · Tanpa kartu kredit",
} as const;

export const LANDING_AGENTFLOW = {
  badge: "Fitur lanjutan",
  title: "Butuh otomatisasi workflow?",
  description:
    "AgentFlow hadir untuk tim yang ingin mengotomasi proses dokumen dan workflow bisnis — di luar pengalaman chat utama IDA.",
  cta: "Pelajari AgentFlow",
  headerLink: "AgentFlow",
} as const;

export { IDA_CONFIG };