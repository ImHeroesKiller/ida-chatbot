#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

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

function contentHash(content, locale, pageSlug, section) {
  return createHash("sha256")
    .update(`${locale}|${pageSlug}|${section}|${content}`)
    .digest("hex");
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

const DUMMY_CHUNKS = [
  {
    locale: "id",
    pageSlug: "tentang-ida",
    section: "pengenalan",
    sourceType: "knowledge",
    content:
      "IDA adalah asisten virtual berbasis AI yang membantu pengguna mendapatkan informasi layanan, panduan, dan jawaban pertanyaan umum secara cepat dan ramah dalam Bahasa Indonesia.",
    metadata: { topic: "intro" },
  },
  {
    locale: "id",
    pageSlug: "tentang-ida",
    section: "kemampuan",
    sourceType: "knowledge",
    content:
      "IDA dapat membantu menjelaskan produk dan layanan, memandu langkah-langkah penggunaan, menjawab FAQ, serta mengarahkan ke kontak manusia jika pertanyaan membutuhkan bantuan lebih lanjut.",
    metadata: { topic: "capabilities" },
  },
  {
    locale: "id",
    pageSlug: "faq",
    section: "siapa-ida",
    sourceType: "faq",
    content:
      "Siapa IDA? IDA adalah chatbot cerdas yang dirancang untuk memberikan dukungan informasi 24/7. Nama IDA singkatan dari Intelligent Digital Assistant.",
    metadata: { topic: "faq-identity" },
  },
  {
    locale: "id",
    pageSlug: "panduan",
    section: "mulai-chat",
    sourceType: "guide",
    content:
      "Cara memulai chat dengan IDA: ketik pertanyaan Anda dalam bahasa sehari-hari, tunggu respons streaming, lalu lanjutkan percakapan untuk topik terkait. IDA mengingat konteks singkat dalam sesi yang sama.",
    metadata: { topic: "getting-started" },
  },
  {
    locale: "id",
    pageSlug: "faq",
    section: "bantuan-manusia",
    sourceType: "faq",
    content:
      "Jika IDA tidak menemukan jawaban yang cukup, pengguna dapat meminta handoff ke agen manusia. Sertakan topik singkat agar tim support dapat merespons lebih cepat.",
    metadata: { topic: "handoff" },
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

  console.log(`Seeding ${DUMMY_CHUNKS.length} dummy chunks into ida_document_chunks...\n`);

  const rows = [];

  for (const chunk of DUMMY_CHUNKS) {
    const values = await embedText(geminiKey, chunk.content);

    rows.push({
      content: chunk.content,
      embedding: values,
      locale: chunk.locale,
      page_slug: chunk.pageSlug,
      section: chunk.section,
      source_type: chunk.sourceType,
      metadata: chunk.metadata,
      content_hash: contentHash(
        chunk.content,
        chunk.locale,
        chunk.pageSlug,
        chunk.section,
      ),
    });

    console.log(`  embedded: ${chunk.pageSlug}/${chunk.section}`);
  }

  const { data, error } = await supabase
    .from("ida_document_chunks")
    .upsert(rows, { onConflict: "content_hash" })
    .select("id, page_slug, section, locale");

  if (error) {
    throw new Error(`Upsert failed: ${error.message}`);
  }

  console.log(`\nSuccess: upserted ${data?.length ?? rows.length} chunks.`);
  for (const row of data ?? []) {
    console.log(`  - ${row.locale} | ${row.page_slug} | ${row.section} | ${row.id}`);
  }
}

main().catch((error) => {
  console.error("SEED_FAILED:", error.message);
  process.exit(1);
});