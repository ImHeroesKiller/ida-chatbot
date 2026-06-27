import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { IDA_CONFIG } from "@/lib/config";
import { getCanonicalUrl } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: `Syarat Layanan — ${IDA_CONFIG.name}`,
  description: `Syarat dan ketentuan penggunaan ${IDA_CONFIG.name}.`,
  alternates: {
    canonical: getCanonicalUrl("/terms"),
  },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "27 Juni 2026";

export default function TermsPage() {
  return (
    <LegalPage title="Syarat Layanan" lastUpdated={LAST_UPDATED}>
      <p>
        Dengan mengakses atau menggunakan {IDA_CONFIG.name} (&quot;IDA&quot;,
        &quot;layanan&quot;), Anda setuju untuk terikat oleh Syarat Layanan ini.
        Jika tidak setuju, harap tidak menggunakan layanan.
      </p>

      <LegalSection title="1. Deskripsi Layanan">
        <p>
          IDA adalah asisten digital berbasis kecerdasan buatan yang menyediakan
          percakapan, pencarian knowledge base (RAG), input suara, dan fitur
          terkait. Layanan ditujukan untuk membantu informasi umum dan tidak
          menggantikan nasihat profesional (medis, hukum, keuangan, dll.).
        </p>
      </LegalSection>

      <LegalSection title="2. Akun Pengguna">
        <ul className="list-disc space-y-2 pl-5">
          <li>Anda harus masuk dengan akun Google yang valid.</li>
          <li>Anda bertanggung jawab menjaga keamanan sesi dan perangkat Anda.</li>
          <li>Anda setuju memberikan informasi yang akurat dan tidak menyalahgunakan akun orang lain.</li>
          <li>Kami dapat menangguhkan atau menghentikan akun yang melanggar syarat ini.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Penggunaan yang Diperbolehkan">
        <p>Anda setuju untuk tidak:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Menggunakan layanan untuk aktivitas ilegal, berbahaya, atau menyesatkan.</li>
          <li>Mengirim spam, malware, atau konten yang melanggar hak pihak ketiga.</li>
          <li>Mencoba mengakses sistem, API, atau data pengguna lain tanpa izin.</li>
          <li>Menghindari batasan teknis (rate limit, autentikasi, dll.).</li>
          <li>Menggunakan output AI untuk keputusan kritis tanpa verifikasi independen.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Konten & Respons AI">
        <p>
          Respons IDA dihasilkan oleh model AI dan dapat tidak akurat, tidak
          lengkap, atau usang. Anda bertanggung jawab mengevaluasi dan
          memverifikasi informasi sebelum mengambil tindakan. Kami tidak
          menjamin keakuratan, ketersediaan, atau kesesuaian respons untuk
          tujuan tertentu.
        </p>
      </LegalSection>

      <LegalSection title="5. Hak Kekayaan Intelektual">
        <p>
          Nama, logo, antarmuka, dan kode sumber IDA dilindungi oleh hukum yang
          berlaku. Anda tidak boleh menyalin, memodifikasi, atau mendistribusikan
          bagian layanan tanpa izin tertulis, kecuali diizinkan oleh lisensi
          open-source proyek (jika ada).
        </p>
        <p>
          Anda mempertahankan hak atas konten yang Anda kirim. Dengan
          menggunakan layanan, Anda memberi kami lisensi terbatas untuk
          memproses konten tersebut guna menyediakan dan meningkatkan layanan.
        </p>
      </LegalSection>

      <LegalSection title="6. Layanan Pihak Ketiga">
        <p>
          IDA mengandalkan layanan pihak ketiga (Supabase, Google, Groq, dan
          penyedia model lain yang dikonfigurasi). Ketersediaan dan ketentuan
          mereka berlaku secara terpisah. Kami tidak bertanggung jawab atas
          gangguan yang disebabkan oleh pihak ketiga.
        </p>
      </LegalSection>

      <LegalSection title="7. Batasan Tanggung Jawab">
        <p>
          Sejauh diizinkan hukum, IDA dan pengelolanya tidak bertanggung jawab
          atas kerugian tidak langsung, insidental, khusus, atau konsekuensial
          yang timbul dari penggunaan layanan, termasuk kehilangan data, gangguan
          bisnis, atau keputusan yang diambil berdasarkan output AI.
        </p>
        <p>
          Total tanggung jawab kami terbatas pada jumlah yang dibayarkan Anda
          untuk layanan dalam 12 bulan terakhir, atau nol jika layanan
          disediakan gratis.
        </p>
      </LegalSection>

      <LegalSection title="8. Penghentian">
        <p>
          Kami dapat mengubah, menangguhkan, atau menghentikan layanan kapan
          saja. Anda dapat berhenti menggunakan layanan dengan keluar dari akun
          dan tidak lagi mengakses aplikasi.
        </p>
      </LegalSection>

      <LegalSection title="9. Perubahan Syarat">
        <p>
          Syarat ini dapat diperbarui. Tanggal pembaruan terakhir tercantum di
          atas. Penggunaan berkelanjutan setelah perubahan berarti Anda
          menerima syarat yang diperbarui.
        </p>
      </LegalSection>

      <LegalSection title="10. Hukum yang Berlaku">
        <p>
          Syarat ini diatur oleh hukum Republik Indonesia, tanpa memperhatikan
          konflik ketentuan hukum, kecuali diwajibkan lain oleh peraturan
          yang berlaku.
        </p>
      </LegalSection>

      <LegalSection title="11. Kontak">
        <p>
          Pertanyaan mengenai syarat layanan dapat diajukan melalui saluran resmi
          pengelola IDA.
        </p>
      </LegalSection>
    </LegalPage>
  );
}