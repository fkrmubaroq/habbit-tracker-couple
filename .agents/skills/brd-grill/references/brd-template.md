# Default BRD template

Use this when the repo has no existing BRD convention (SKILL.md Step 0). If
it does, match that convention's section names instead — this is a
fallback, not a mandate.

```markdown
# BRD — {Nama Product Backlog}

> Ringkas: backlog item apa yang dicakup dokumen ini, siapa requester-nya
> (kalau diketahui), dan tanggal dibuat.

## 1. Pemahaman Product Backlog

Penjelasan requirement dalam bahasa requester, belum diterjemahkan ke
istilah implementasi. Termasuk latar belakang/motivasi kalau ada.

## 2. Dampak Proses / Alur

Salah satu dari dua bentuk, tergantung jawaban grill:
- **Ada perubahan flow:** deskripsi proses baru/berubah, plus
  workflow/flowchart (bisa berupa diagram teks, langkah bernomor, atau link
  ke diagram terpisah).
- **Tidak ada perubahan flow:** nyatakan eksplisit "Tidak ada perubahan
  proses/alur bisnis" — jangan dikosongkan begitu saja.

## 3. Dampak UI

- **Ada perubahan UI:** daftar layar/form yang terdampak, sebutkan
  identifier-nya kalau repo ini punya konvensi penomoran UI (mis. kode UI),
  baru vs. update.
- **Tidak ada perubahan UI:** nyatakan eksplisit.

## 4. Dampak Kamus Data

- **Ada perubahan data:** field/tabel baru atau berubah, tipe data, makna
  bisnisnya.
- **Tidak ada perubahan data:** nyatakan eksplisit.

## 5. Yang TIDAK termasuk

Scope negatif eksplisit — selalu ada, tidak pernah dilewatkan.

## 6. Estimasi Effort (opsional)

Lihat `effort-estimation.md` kalau BRD ini perlu tabel estimasi jam kerja.

## 7. Approval

- [ ] Direview requester
- [ ] Disetujui — siap lanjut ke perencanaan implementasi (`prd-grill`)
```
