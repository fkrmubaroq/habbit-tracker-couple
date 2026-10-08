# ai-discoverability

## Apa ini
Skill untuk membuat konten website bisa ditemukan, diparse, dan dikutip oleh AI crawler/answer engine (ChatGPT, Perplexity, Claude, Gemini, dll) serta search engine tradisional — mencakup `llms.txt`, structured data (schema.org/JSON-LD), aturan `robots.txt` untuk bot AI, canonical URL, `sitemap.xml`, meta tag Open Graph, dan memastikan konten bisa dibaca crawler yang tidak menjalankan JS (SSR/prerendering). Ini pelengkap `modern-web-guidance`: skill itu soal detail implementasi platform browser, skill ini soal apakah konten bisa ditemukan/dipahami sistem di luar browser sama sekali.

## Kapan dipakai
Saat user minta situs "terindeks AI"/discoverable oleh AI agent, butuh SEO dasar tanpa spesialis SEO khusus, atau saat mengirim halaman/route baru yang seharusnya bisa dikutip AI answer engine.

## Bukan untuk
- Keputusan visual/UI — itu tanggung jawab tim UI/UX/template project.
- Detail implementasi level browser-API (Core Web Vitals, pola ARIA, registrasi tool WebMCP) — lihat `modern-web-guidance` untuk itu.
- Menjamin ranking/kutipan — skill ini membuat situs *layak* ditemukan dan dikutip dengan benar, bukan menjamin peringkat pertama.

## File terkait
- `SKILL.md` — instruksi lengkap skill ini.
- `cursor.mdc` — versi untuk platform Cursor.
