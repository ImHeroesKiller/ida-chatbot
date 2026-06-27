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
    errors: {
      generic: "获取回复失败，请重试。",
      rateLimit: "请求过多，请稍后再试。",
      tooLong: "消息过长。",
    },
  },
};