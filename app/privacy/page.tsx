import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { IDA_CONFIG } from "@/lib/config";

export const metadata: Metadata = {
  title: `Kebijakan Privasi — ${IDA_CONFIG.name}`,
  description: `Kebijakan privasi ${IDA_CONFIG.name} Intelligent Digital Assistant.`,
};

const LAST_UPDATED = "27 Juni 2026";

export default function PrivacyPage() {
  return (
    <LegalPage title="Kebijakan Privasi" lastUpdated={LAST_UPDATED}>
      <p>
        Kebijakan Privasi ini menjelaskan bagaimana {IDA_CONFIG.name} (
        &quot;IDA&quot;, &quot;kami&quot;) mengumpulkan, menggunakan, dan
        melindungi informasi Anda saat menggunakan layanan chatbot AI kami.
      </p>

      <LegalSection title="1. Data yang Kami Kumpulkan">
        <p>
          <strong className="text-foreground">Data akun:</strong> Saat Anda
          masuk dengan Google, kami menerima informasi profil dasar seperti
          nama, alamat email, foto profil, dan pengenal pengguna (user ID)
          melalui Supabase Auth.
        </p>
        <p>
          <strong className="text-foreground">Data percakapan:</strong> Pesan
          yang Anda kirim dan respons asisten, riwayat chat, judul sesi, serta
          preferensi antarmuka (tema, bahasa, pengaturan suara) disimpan untuk
          menyediakan layanan dan sinkronisasi antar perangkat.
        </p>
        <p>
          <strong className="text-foreground">Data teknis:</strong> Log
          permintaan API (model, provider, token, status), alamat IP untuk
          rate limiting, dan metadata sesi untuk keamanan dan analitik operasional.
        </p>
        <p>
          <strong className="text-foreground">Unggahan file:</strong> Gambar atau
          PDF yang Anda lampirkan diproses untuk ekstraksi teks (OCR) dan tidak
          disimpan permanen kecuali sebagai bagian dari riwayat percakapan Anda.
        </p>
      </LegalSection>

      <LegalSection title="2. Cara Kami Menggunakan Data">
        <ul className="list-disc space-y-2 pl-5">
          <li>Menyediakan, memelihara, dan meningkatkan layanan chat IDA.</li>
          <li>Menyinkronkan riwayat chat Anda di berbagai perangkat.</li>
          <li>Memproses permintaan AI, pencarian knowledge base (RAG), dan fitur suara.</li>
          <li>Mencegah penyalahgunaan, spam, dan pelanggaran keamanan.</li>
          <li>Memenuhi kewajiban hukum dan menanggapi permintaan yang sah.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Penyimpanan & Retensi">
        <p>
          Data disimpan di infrastruktur Supabase (database dan autentikasi).
          Riwayat chat dipertahankan selama akun aktif atau hingga Anda
          menghapusnya. Kami dapat menghapus data yang tidak aktif setelah
          periode waktu yang wajar sesuai kebijakan internal.
        </p>
      </LegalSection>

      <LegalSection title="4. Cookies & Penyimpanan Lokal">
        <p>
          Kami menggunakan cookie sesi autentikasi (Supabase Auth) dan
          penyimpanan lokal browser (localStorage/sessionStorage) untuk tema,
          preferensi UI, dan cache konfigurasi. Cookie esensial diperlukan agar
          login dan sesi berfungsi.
        </p>
      </LegalSection>

      <LegalSection title="5. Layanan Pihak Ketiga">
        <p>IDA mengintegrasikan penyedia berikut yang memproses data sesuai kebijakan mereka:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Supabase</strong> — autentikasi,
            database, penyimpanan sesi.
          </li>
          <li>
            <strong className="text-foreground">Google</strong> — login OAuth dan
            model AI (Gemini) untuk chat, embedding, OCR, dan transkripsi.
          </li>
          <li>
            <strong className="text-foreground">Groq</strong> — transkripsi suara
            (opsional, jika dikonfigurasi).
          </li>
          <li>
            <strong className="text-foreground">xAI / OpenAI / Hugging Face</strong>{" "}
            — model AI alternatif atau TTS (jika diaktifkan oleh administrator).
          </li>
          <li>
            <strong className="text-foreground">Vercel</strong> — hosting aplikasi.
          </li>
        </ul>
        <p>
          Konten percakapan dapat dikirim ke penyedia model AI untuk menghasilkan
          respons. Jangan bagikan informasi sensitif (password, OTP, data medis
          kritis) melalui chat.
        </p>
      </LegalSection>

      <LegalSection title="6. Keamanan">
        <p>
          Kami menerapkan langkah-langkah wajar untuk melindungi data, termasuk
          enkripsi dalam transit (HTTPS), autentikasi berbasis OAuth, dan akses
          database terbatas pada sisi server. Tidak ada sistem yang 100%
          aman; gunakan layanan dengan risiko yang Anda pahami.
        </p>
      </LegalSection>

      <LegalSection title="7. Hak Anda">
        <p>Anda dapat:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Mengakses dan memperbarui profil melalui halaman Akun.</li>
          <li>Menghapus riwayat chat dari dalam aplikasi.</li>
          <li>Meminta penghapusan akun dengan menghubungi pengelola layanan.</li>
          <li>Berhenti menggunakan layanan kapan saja.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Perubahan Kebijakan">
        <p>
          Kami dapat memperbarui kebijakan ini sewaktu-waktu. Perubahan material
          akan dicantumkan di halaman ini dengan tanggal pembaruan. Penggunaan
          berkelanjutan setelah perubahan berarti Anda menerima kebijakan yang
          diperbarui.
        </p>
      </LegalSection>

      <LegalSection title="9. Kontak">
        <p>
          Untuk pertanyaan privasi, hubungi pengelola IDA melalui saluran resmi
          organisasi yang mengoperasikan layanan ini.
        </p>
      </LegalSection>
    </LegalPage>
  );
}