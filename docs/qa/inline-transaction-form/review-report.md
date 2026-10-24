# Review Report — Form Transaksi Tampilan Luar (`/transactions/create`)

| Field | Nilai |
|---|---|
| Plan | `docs/prd/done/inline-transaction-form/` (`PRD.md`, `ISSUES.md`) |
| Verifikasi acuan | `docs/qa/inline-transaction-form/qa-report.md` (24/24 Passed) |
| Tanggal review | 2026-10-24 |
| Tahap pipeline | REVIEW (`/gate`) — setelah `/qa`, sebelum `/promote` |
| Skill dipakai | `code-review-and-quality` (5 axis) + `security-review` (menyentuh input user & mutation data keuangan) |
| Verdict | **Approve with comments — 0 blocking finding** |

---

## 1. Ringkasan

Plan ini memindahkan form transaksi dari `TransactionFormDialog` (modal global) ke route sendiri `/transactions/create`, lalu mengganti input nominal menjadi input teks ber-mask ribuan (`80000` → `80.000`) dengan nilai form tetap `number`. Hasilnya: satu jalur pembuatan transaksi yang jelas, modal global beserta state-nya hilang, dan input nominal jauh lebih nyaman di layar kecil.

Tidak ada defect yang menghalangi merge. Seluruh temuan di bawah non-blocking; sebagian besar perilaku yang memang sudah ada di modal lama.

| Axis | Verdict | Catatan |
|---|---|---|
| Correctness | Lulus | Mask/parse benar (hanya digit, kosong → `undefined`), payload `amount` tetap number, validasi zod jalan |
| Readability | Lulus | Halaman 330 baris, terstruktur per field; helper `formatThousands`/`parseThousands` kecil dan jelas |
| Architecture | Lulus | Route top-level (`transactions_.create`) benar; modal global dan state store-nya dilepas |
| Security | Lulus | Tidak ada secret baru; tidak ada `dangerouslySetInnerHTML`; validasi tetap di client **dan** server |
| Performance | Lulus | Tidak ada perubahan berarti; 1 effect yang berjalan tiap render (N5, pre-existing) |

---

## 2. Yang diverifikasi ulang secara independen

1. **Payload `amount` benar-benar number.** `parseThousands` mengembalikan `Number(digits)` (bukan string), dan `createTransactionSchema` di `@repo/types` mensyaratkan `z.number()` — cocok. Input kosong → `undefined` → resolver menolak dengan pesan validasi, bukan mengirim `NaN`.
2. **Mask tidak merusak nilai saat mengetik ulang.** `formatThousands` membuang semua non-digit lebih dulu, jadi `12abc.000` → `12000` → tampil `12.000` (dibuktikan di E2E QA).
3. **Modal lama benar-benar hilang.** `git show 77b4c8f --name-status -M` menandai `TransactionFormDialog.tsx` → `transactions_.create.tsx` sebagai rename (R064), dan `grep -c Dialog apps/finance-tracker-web/src/routes/transactions.tsx` = 0. Tidak ada sisa `<TransactionFormDialog />` di `__root.tsx`.
4. **`useFinanceUIStore` kini tanpa konsumen.** `grep -rn "useFinanceUIStore" apps/finance-tracker-web/src` → hanya definisi file store itu sendiri (lihat N2).
5. **Tidak ada penurunan keamanan pada input.** Tidak ada `eval`, tidak ada render HTML mentah, dan nilai nominal tidak pernah masuk ke query string/`innerHTML`.

---

## 3. Temuan non-blocking

### N1 — Optional: kegagalan simpan tidak memberi umpan balik apa pun

`apps/finance-tracker-web/src/routes/transactions_.create.tsx:89-100` + `apps/finance-tracker-web/src/hooks/use-finance.ts:114-122`

`onSubmit` membungkus `mutateAsync` dalam `try/catch` dengan komentar "Handled by react-query mutation error handlers", tetapi `useCreateTransactionMutation` **tidak punya** `onError`. Jadi bila API menolak (mis. 400 validasi server atau 500), pengguna hanya melihat tombol kembali dari "Menyimpan..." ke "Simpan Transaksi" tanpa pesan apa pun.

Perilaku ini identik dengan modal lama (`git show 77b4c8f^:.../TransactionFormDialog.tsx:72-78`), jadi **bukan regresi** — tetapi sekarang halaman ini satu-satunya jalur pembuatan transaksi, sehingga dampaknya lebih terasa. Saran: tambahkan toast/inline error di `onError` mutation (atau di `catch` halaman).

### N2 — Nit: `finance-ui.store.ts` tersisa sebagai stub tanpa konsumen

`apps/finance-tracker-web/src/stores/finance-ui.store.ts:1-12`

Setelah state modal dihapus, file ini hanya menyisakan `sidebarOpen`/`setSidebarOpen` yang tidak dipakai di mana pun. Plan menyebut "bersihkan `isTransactionModalOpen` dan action modal" — membersihkan seluruh file akan lebih tuntas daripada menggantinya dengan API mati. Hapus file (dan import terakhirnya) atau hapus field stub-nya.

### N3 — Nit: `<Link>` membungkus `<Button>` menghasilkan dua elemen interaktif bersarang

`apps/finance-tracker-web/src/routes/__root.tsx` (sidebar "+ Transaksi", header "Catat"), `transactions.tsx:129,253`, `index.tsx:68,78`

Pola `<a><button/></a>` membuat dua tab stop untuk satu aksi dan `role` ganda bagi screen reader. Ini diperkenalkan oleh plan ini (sebelumnya `Button` dengan `onClick`). Saran: `Button asChild` (Radix `Slot`) sehingga hanya `<a>` yang interaktif, atau `onClick={() => navigate({ to: "/transactions/create" })}` pada `Button` seperti pola lama.

### N4 — Nit: tanggal default memakai UTC

`apps/finance-tracker-web/src/routes/transactions_.create.tsx:52`

`new Date().toISOString().substring(0, 10)` menghasilkan tanggal UTC; untuk WIB (UTC+7) antara 00:00–06:59 tanggal default menjadi **kemarin**. Pre-existing (sama di modal lama). Bila ingin akurat: `dayjs().format("YYYY-MM-DD")` (dayjs sudah dipakai di app ini).

### N5 — Nit: effect pemilih kategori berjalan setiap render

`apps/finance-tracker-web/src/routes/transactions_.create.tsx:79-87`

Dependensi `filteredCategories` adalah array baru setiap render, sehingga effect selalu dijalankan ulang; di dalamnya ada `watch()` + `setValue()` kondisional. Saat ini konvergen (hanya set bila kategori tidak ada di daftar), jadi tidak ada loop, tapi rapuh. Saran: turunkan nilai stabil (`categories`, `selectedType`) ke dependensi, atau hitung default kategori saat `type` berubah.

---

## 4. Verdict

**Approve with comments.** Tidak ada temuan blocking, sehingga tidak ada item baru yang perlu ditulis ke `ISSUES.md` dan plan ini dapat ditutup.

Catatan: plan ini tidak memiliki item checklist review khusus di `ISSUES.md` (semua item sudah `[x]` sebelum review), jadi tidak ada checkbox yang perlu dicentang di sini.
