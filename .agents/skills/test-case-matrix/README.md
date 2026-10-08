# test-case-matrix

## Apa ini
Skill untuk menulis skenario test sebelum implementasi atau sebelum otomasi test dimulai. Membaca PRD/issue/spec sebuah fitur (atau menanyakan deskripsi singkat kalau belum ada), opsional membangun matrix kombinasi parameter/nilai untuk fitur dengan banyak variabel yang saling berinteraksi, mengelompokkan skenario per PB (Product Backlog/requirement), lalu menulis satu file markdown yang meniru layout spreadsheet manual-tester: metadata header, Summary dua bagian (jumlah pass/fail + persentase penggunaan otomasi), traceability index mini per PB, dan tabel test case dengan urutan kolom persis spreadsheet "FORMAT TEST CASE V4" (Group No, Feature, Process No (FC), TYPE, Test Case ID seperti `TC1-1`, Test Variable, Scenario, Test Case, Pre-Condition, Test Data, Test Steps, Expected Result, Status, Evidence, Remarks, Automation Tools, Date). Header metadata V4, traceability berbentuk checkbox `[x]`/`[ ]`, nilai Status sesuai dropdown V4 (+ Skip), dan ambang "Memenuhi Syarat" > 24%. Isi sel dalam Bahasa Indonesia dengan langkah yang akurat sesuai UI.

## Kapan dipakai
Trigger: `/test-case-matrix`, "buatkan test matrix", "buatkan test case", "test scenario apa aja", atau sebagai langkah wajib pertama saat agent bergaya qa-engineer dipanggil.

## Bukan untuk
Menulis atau menjalankan kode test — itu tugas `react-testing`/`e2e-testing`/`webapp-testing`. Skill ini hanya menghasilkan daftar skenario yang jadi acuan skill-skill tersebut.

## File terkait
- `SKILL.md` — instruksi lengkap skill ini.
- `assets/test-matrix-template.md` — template dokumen matrix.
