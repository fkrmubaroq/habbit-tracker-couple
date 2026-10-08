# modern-web-guidance

## Apa ini
Skill pencarian best-practice platform web modern — performa, aksesibilitas, keamanan, forms, built-in AI, dan WebMCP. Berbeda dari skill lain di katalog ini, isinya bukan konten statis: skill ini membungkus `npx modern-web-guidance` yang query ke database panduan semantik yang di-maintain tim Chrome Google. Alasannya: API browser berubah terlalu cepat untuk didokumentasikan sebagai file statis yang gampang basi.

## Kapan dipakai
Di awal implementasi fitur web yang menyentuh performa (Core Web Vitals), aksesibilitas, keamanan/privasi browser API, built-in AI (Prompt/Summarizer/Translator API on-device), atau WebMCP (expose fungsi halaman jadi tool buat AI agent/browser assistant).

## Catatan scope di katalog ini
Project ini sudah punya tim UI/UX dan template sendiri, jadi kategori guide yang soal **visual/layout** (`ui-atoms`, `ui-behaviors`, `ui-components`, `visual-design` — modal, glassmorphism, view transitions, dsb) **sengaja di luar scope** skill ini di sini. Kalau hasil search kebetulan dari kategori itu, jangan diterapkan — serahkan ke tim desain/template.

## Bukan untuk
- Keputusan visual/layout — sudah dipegang tim UI/UX & template.
- Discoverability oleh AI crawler/answer engine (llms.txt, structured data, robots.txt) — lihat skill `ai-discoverability` untuk itu, skill ini tidak mencakupnya sama sekali.

## Atribusi
Diadopsi dari [`GoogleChrome/modern-web-guidance`](https://github.com/GoogleChrome/modern-web-guidance) (Apache-2.0) — instruksi inti (search/retrieve via npx) tidak diubah, hanya ditambah frontmatter dan catatan scope untuk katalog ini.

## File terkait
- `SKILL.md` — instruksi lengkap skill ini.
- `cursor.mdc` — versi untuk platform Cursor.
