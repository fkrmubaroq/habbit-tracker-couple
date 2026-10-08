# api-testing

## Apa ini
Skill untuk menulis dan menjalankan test backend/API yang langsung memanggil HTTP endpoint (tanpa browser) — REST atau GraphQL, lewat Supertest/Vitest (TS/JS) atau httpx/pytest (Python). Untuk setiap test, skill ini memutuskan apakah perlu mock database, database asli dengan transaction rollback, atau hit black-box lewat HTTP dengan skrip teardown eksplisit — dan memastikan data test tidak pernah tertinggal (tidak ada sampah data).

## Kapan dipakai
- Menulis atau menjalankan test API/backend.
- Flow yang ditest bergantung pada entity milik repo/service lain (misalnya test pembatalan order padahal pembuatan order ada di service lain) — skill ini akan berhenti dan menanyakan dependensi itu dulu, bukan menebak bentuknya.

## Bukan untuk
- E2E berbasis browser (lihat `webapp-testing` / `e2e-testing`).
- Test komponen React (lihat `react-testing`).

## File terkait
- `SKILL.md` — instruksi lengkap skill ini.
- `assets/cleanup_test_data.py` — skrip bantuan pembersihan data test.
