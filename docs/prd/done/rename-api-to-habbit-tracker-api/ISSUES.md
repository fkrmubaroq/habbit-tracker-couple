# ISSUES — Checklist Implementasi Rename apps/api Menjadi apps/habbit-tracker-api

Daftar tugas implementasi untuk memindahkan folder dan memperbarui package metadata backend service:

### Fase 1: Pemindahan Folder & Pembaruan Package Metadata
- [x] Pindahkan direktori `apps/api/` ke `apps/habbit-tracker-api/` menggunakan git mv / file move
- [x] Ubah nama package pada `apps/habbit-tracker-api/package.json` dari `"@repo/api"` menjadi `"@repo/habbit-tracker-api"`

### Fase 2: Pembaruan Root Scripts & Konfigurasi Workspace
- [x] Perbarui root `package.json` untuk mengganti `--filter=@repo/api` menjadi `--filter=@repo/habbit-tracker-api` pada script `db:migrate` dan `db:seed`
- [x] Jalankan `pnpm install` pada root workspace untuk meregenerasi lockfile dan symlink workspace

### Fase 3: Pembaruan Deployment Script & Dokumentasi Operasional
- [x] Perbarui path transfer berkas backend di `scripts/deploy.sh` agar merujuk ke `${ROOT_DIR}/apps/habbit-tracker-api/`
- [x] Perbarui dokumentasi `AGENTS.md` pada bagian Technology Stack, Verified Commands, dan Directory Structure agar merefleksikan `apps/habbit-tracker-api` dan `@repo/habbit-tracker-api`

### Fase 4: Verifikasi Workspace & Build Pipeline
- [x] Jalankan `pnpm check-types` untuk memastikan type checking lolos di seluruh workspace
- [x] Jalankan `pnpm lint` untuk memvalidasi linting workspace
- [x] Jalankan `pnpm build` untuk memverifikasi kompilasi build `@repo/habbit-tracker-api` dan `@repo/habbit-tracker-web`
- [x] Jalankan `pnpm turbo run dev --dry=json` untuk memvalidasi orchestrator task graph dev mencakup `@repo/habbit-tracker-api`
