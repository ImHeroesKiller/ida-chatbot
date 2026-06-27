#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createClient } from "@supabase/supabase-js";

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 150;
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;
const SEED_SOURCES = ["tentang-ida", "faq", "panduan"];

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]?.length) process.env[key] = value;
    }
  } catch {
    // .env.local optional if vars already exported
  }
}

function buildContentHash(content, locale, source, section, chunkIndex) {
  return createHash("sha256")
    .update(`${locale}|${source}|${section}|${chunkIndex}|${content}`)
    .digest("hex");
}

function buildChunkMetadata(doc, chunkIndex, totalChunks) {
  return {
    source: doc.source,
    section: doc.section,
    locale: doc.locale,
    chunkIndex: String(chunkIndex),
    totalChunks: String(totalChunks),
    ...doc.metadata,
  };
}

async function chunkSourceDocuments(documents) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  const chunks = [];

  for (const doc of documents) {
    const parts = await splitter.splitText(doc.content);

    parts.forEach((content, index) => {
      chunks.push({
        content,
        locale: doc.locale,
        pageSlug: doc.source,
        section: doc.section,
        sourceType: doc.sourceType,
        metadata: buildChunkMetadata(doc, index, parts.length),
        contentHash: buildContentHash(
          content,
          doc.locale,
          doc.source,
          doc.section,
          index,
        ),
      });
    });
  }

  return chunks;
}

async function embedText(apiKey, text) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    },
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload.error?.message ??
        `Embedding request failed with status ${response.status}`,
    );
  }

  const values = payload.embedding?.values ?? [];

  if (!values.length) {
    throw new Error("Empty embedding returned from model.");
  }

  if (values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Unexpected embedding dimensions ${values.length} (expected ${EMBEDDING_DIMENSIONS}).`,
    );
  }

  return values;
}

const SOURCE_DOCUMENTS = [
  {
    locale: "id",
    source: "tentang-ida",
    section: "pengenalan",
    sourceType: "knowledge",
    metadata: { topic: "intro" },
    content: `IDA adalah Intelligent Digital Assistant, asisten virtual berbasis AI yang dirancang untuk membantu pengguna mendapatkan informasi layanan, panduan, dan jawaban pertanyaan umum secara cepat dan ramah dalam Bahasa Indonesia.

Sebagai asisten digital mandiri, IDA hadir 24 jam sehari untuk mendampingi pengguna dalam berbagai kebutuhan informasi. IDA tidak menggantikan konsultasi profesional untuk urusan medis, hukum, atau keuangan yang kompleks, namun dapat memberikan penjelasan awal, merangkum informasi, dan mengarahkan ke kanal bantuan yang tepat.

Filosofi IDA adalah menjadi teman diskusi yang profesional namun hangat. Respons IDA dirancang ringkas, jelas, dan mudah dipahami. Pengguna dapat bertanya dengan bahasa sehari-hari tanpa perlu format khusus.

IDA mendukung percakapan multibahasa, dengan fokus utama pada Bahasa Indonesia. Sistem memori percakapan singkat memungkinkan IDA mengingat konteks dalam satu sesi chat, sehingga pengguna dapat melanjutkan topik tanpa mengulang penjelasan dari awal.`,
  },
  {
    locale: "id",
    source: "tentang-ida",
    section: "kemampuan",
    sourceType: "knowledge",
    metadata: { topic: "capabilities" },
    content: `Kemampuan utama IDA meliputi penjelasan produk dan layanan, panduan langkah demi langkah, penjawaban FAQ, serta rekomendasi tindakan lanjutan jika pertanyaan membutuhkan bantuan manusia.

Dalam konteks layanan pelanggan, IDA dapat menjelaskan prosedur umum, syarat dokumen, jam operasional, dan alur pengaduan. Untuk pertanyaan teknis yang spesifik, IDA akan menyarankan handoff ke agen manusia dengan ringkasan topik agar proses eskalasi lebih cepat.

IDA juga dapat membantu pengguna memahami fitur aplikasi atau portal digital, termasuk cara membuat tiket, melacak status permintaan, dan menemukan kontak departemen terkait. Setiap jawaban IDA disusun berdasarkan knowledge base internal yang diindeks dengan RAG (Retrieval-Augmented Generation).

Jika informasi yang diminta belum tersedia di knowledge base, IDA akan mengakui keterbatasan tersebut secara jujur dan menawarkan opsi untuk dihubungkan ke tim support. Hal ini menjaga kepercayaan pengguna dan mengurangi risiko jawaban yang tidak akurat.`,
  },
  {
    locale: "id",
    source: "faq",
    section: "siapa-ida",
    sourceType: "faq",
    metadata: { topic: "faq-identity" },
    content: `Pertanyaan Umum: Siapa IDA?

IDA adalah chatbot cerdas yang dirancang untuk memberikan dukungan informasi 24/7. Nama IDA merupakan singkatan dari Intelligent Digital Assistant. IDA bukan manusia, melainkan sistem AI yang dilatih untuk memahami pertanyaan pengguna dan memberikan respons yang relevan.

Apa perbedaan IDA dengan chatbot biasa? IDA menggunakan kombinasi model bahasa generatif dan pencarian dokumen (RAG) sehingga jawaban lebih terarah pada konten resmi organisasi. Selain itu, IDA mendukung streaming response, quick replies, dan smart handoff ke agen manusia.

Apakah IDA menyimpan data pribadi? Sesi percakapan dapat disimpan sementara untuk memori konteks dalam satu kunjungan. Pengguna disarankan tidak membagikan data sensitif seperti password, OTP, atau informasi rekening lengkap melalui chat.

Kapan sebaiknya meminta bantuan manusia? Gunakan opsi handoff jika masalah bersifat mendesak, membutuhkan verifikasi identitas, melibatkan transaksi finansial, atau jika IDA tidak menemukan jawaban yang memuaskan setelah beberapa kali percobaan.`,
  },
  {
    locale: "id",
    source: "panduan",
    section: "mulai-chat",
    sourceType: "guide",
    metadata: { topic: "getting-started" },
    content: `Panduan Memulai Chat dengan IDA

Langkah 1: Buka halaman chat IDA dan klik tombol chat di pojok kanan bawah. Langkah 2: Ketik pertanyaan Anda dalam bahasa sehari-hari, misalnya "Bagaimana cara mengajukan permintaan?" atau "Jelaskan fitur IDA". Langkah 3: Tunggu respons streaming muncul secara bertahap. Anda dapat membaca sambil IDA mengetik.

Langkah 4: Gunakan quick replies jika tersedia untuk melanjutkan percakapan dengan topik terkait. Langkah 5: Jika jawaban belum lengkap, ajukan pertanyaan lanjutan dalam sesi yang sama — IDA mengingat beberapa pesan terakhir.

Tips efektif: ajukan satu topik utama per pesan, sertakan konteks singkat (nama layanan, tanggal, atau kode referensi jika ada), dan gunakan bahasa yang jelas. Hindari pesan terlalu panjang dalam satu kiriman.

Jika IDA tidak memahami pertanyaan, coba parafrase atau gunakan kata kunci berbeda. Anda juga dapat meminta "hubungi tim manusia" untuk eskalasi ke agen support dengan ringkasan percakapan otomatis.`,
  },
  {
    locale: "id",
    source: "faq",
    section: "bantuan-manusia",
    sourceType: "faq",
    metadata: { topic: "handoff" },
    content: `FAQ: Handoff ke Agen Manusia

Kapan handoff diperlukan? Handoff disarankan ketika pertanyaan bersifat sensitif, membutuhkan verifikasi identitas, melibatkan keluhan kompleks, atau ketika IDA tidak menemukan dokumen relevan di knowledge base.

Cara meminta handoff: katakan "hubungi tim manusia", "saya butuh bantuan agen", atau pilih quick reply "Hubungi tim manusia". IDA akan menyiapkan ringkasan percakapan (handoff prefill) berisi topik dan cuplikan pertanyaan pengguna.

Apa yang perlu disertakan pengguna? Sebutkan topik singkat, nomor tiket jika ada, dan detail penting agar agen manusia dapat merespons lebih cepat tanpa mengulang seluruh riwayat chat.

Waktu respons agen manusia mengikuti jam operasional tim support. Di luar jam kerja, permintaan handoff tetap tercatat dan akan ditindaklanjuti pada hari kerja berikutnya. IDA akan memberi tahu pengguna jika eskalasi berhasil dipersiapkan.`,
  },
];

async function main() {
  loadEnvLocal();

  const geminiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!geminiKey) throw new Error("GEMINI_API_KEY is not configured.");

  if (!supabaseUrl?.length || !serviceRoleKey?.length) {
    console.warn(
      "SKIP: Supabase is not configured locally (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY empty).",
    );
    console.warn("Seed will run automatically on Vercel build when env is set.");
    process.exit(0);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(
    `Chunking ${SOURCE_DOCUMENTS.length} source documents (size=${CHUNK_SIZE}, overlap=${CHUNK_OVERLAP})...\n`,
  );

  const documentChunks = await chunkSourceDocuments(SOURCE_DOCUMENTS);

  console.log(`Generated ${documentChunks.length} chunks from splitter.\n`);

  const { error: deleteError } = await supabase
    .from("ida_document_chunks")
    .delete()
    .in("page_slug", SEED_SOURCES);

  if (deleteError) {
    throw new Error(`Failed to clear previous seed chunks: ${deleteError.message}`);
  }

  console.log(`Cleared previous chunks for sources: ${SEED_SOURCES.join(", ")}\n`);

  const rows = [];

  for (const chunk of documentChunks) {
    const values = await embedText(geminiKey, chunk.content);

    rows.push({
      content: chunk.content,
      embedding: values,
      locale: chunk.locale,
      page_slug: chunk.pageSlug,
      section: chunk.section,
      source_type: chunk.sourceType,
      metadata: chunk.metadata,
      content_hash: chunk.contentHash,
    });

    console.log(
      `  embedded: ${chunk.pageSlug}/${chunk.section} [${chunk.metadata.chunkIndex}/${chunk.metadata.totalChunks}] (${chunk.content.length} chars)`,
    );
  }

  const { data, error } = await supabase
    .from("ida_document_chunks")
    .upsert(rows, { onConflict: "content_hash" })
    .select("id, page_slug, section, locale, metadata");

  if (error) {
    throw new Error(`Upsert failed: ${error.message}`);
  }

  console.log(`\nSuccess: upserted ${data?.length ?? rows.length} chunks.`);
  for (const row of data ?? []) {
    console.log(
      `  - ${row.locale} | ${row.page_slug} | ${row.section} | chunk ${row.metadata?.chunkIndex ?? "?"} | ${row.id}`,
    );
  }
}

main().catch((error) => {
  console.error("SEED_FAILED:", error.message);
  process.exit(1);
});