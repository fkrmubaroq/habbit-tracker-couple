# Personal Finance Tracker

Kamu ditugaskan untuk merancang dan mengembangkan aplikasi **Personal Finance Tracker** yang sederhana, modern, dan intuitif untuk membantu pengguna mengelola keuangan pribadi dalam satu tempat.

Aplikasi harus memungkinkan pengguna mencatat dan mengelola **pemasukan dan pengeluaran**, memantau **cash flow**, membuat **budget**, melihat **laporan keuangan**, serta memantau **net worth**.

Prioritaskan pengalaman pengguna yang:

- Sederhana
- Minimalis
- Intuitif
- Mobile-first
- Responsif
- Cepat digunakan
- Mudah dipahami

Meskipun tampilannya sederhana, struktur aplikasi dan data harus dirancang dengan baik agar mudah dikembangkan di masa depan.

---

# 1. Konsep Utama

Aplikasi memiliki dua jenis transaksi utama:

```text
Transaction
├── Income      → Pemasukan
└── Expense     → Pengeluaran
```

### Pemasukan

Uang yang masuk ke keuangan pengguna.

Contoh:

- Gaji
- Freelance
- Bisnis
- Bonus
- Bunga
- Dividen
- Hadiah
- Lainnya

### Pengeluaran

Uang yang digunakan untuk kebutuhan atau aktivitas pengguna.

Contoh:

- Makanan
- Transportasi
- Belanja
- Tagihan
- Hiburan
- Kesehatan
- Pendidikan
- Tempat tinggal
- Langganan
- Lainnya

Sistem harus memperlakukan pemasukan dan pengeluaran sebagai bagian dari **cash flow**.

---

# 2. Dashboard

Buat dashboard utama yang memberikan gambaran kondisi keuangan pengguna secara cepat.

Tampilkan:

- Total pemasukan
- Total pengeluaran
- Net cash flow
- Saldo
- Budget yang sedang berjalan
- Pengeluaran berdasarkan kategori
- Tren pemasukan dan pengeluaran
- Transaksi terbaru
- Perubahan net worth

Contoh:

```text
┌─────────────────────────────┐
│ Selamat Pagi 👋             │
│ Berikut ringkasan keuangan  │
│ Anda                        │
├─────────────────────────────┤
│ Saldo                       │
│ Rp15.500.000                │
│                             │
│ ↑ Rp2.500.000 bulan ini     │
├──────────────┬──────────────┤
│ Pemasukan    │ Pengeluaran  │
│ Rp10.000.000 │ Rp7.500.000  │
├──────────────┴──────────────┤
│ Cash Flow                   │
│                             │
│      ╭──╮                   │
│  ╭───╯  ╰───╮               │
│                             │
├─────────────────────────────┤
│ Budget                      │
│ Makanan       Rp1.2M / 2M   │
│ Transport     Rp800K / 1M   │
├─────────────────────────────┤
│ Transaksi Terbaru           │
│                             │
│ Gaji            +Rp8M       │
│ Makanan         -Rp50K      │
│ Bensin          -Rp100K     │
└─────────────────────────────┘
```

Dashboard harus memiliki hierarki visual yang jelas sehingga pengguna dapat memahami kondisi keuangannya dalam beberapa detik.

---

# 3. Manajemen Pemasukan

Pengguna dapat mencatat dan mengelola pemasukan.

Setiap pemasukan memiliki:

- Jumlah
- Deskripsi
- Tanggal
- Kategori
- Catatan opsional

Pengguna dapat:

- Menambahkan pemasukan
- Mengedit pemasukan
- Menghapus pemasukan
- Melihat detail pemasukan
- Memfilter berdasarkan tanggal
- Memfilter berdasarkan kategori
- Melihat riwayat pemasukan
- Melihat ringkasan pemasukan

Contoh:

```text
+ Tambah Pemasukan

Jumlah
Rp8.000.000

Kategori
Gaji

Tanggal
08 Oktober 2026

Deskripsi
Gaji bulan Oktober

Catatan
Opsional

[ Simpan Pemasukan ]
```

---

# 4. Manajemen Pengeluaran

Pengguna dapat mencatat dan mengelola pengeluaran.

Setiap pengeluaran memiliki:

- Jumlah
- Deskripsi
- Tanggal
- Kategori
- Catatan opsional

Pengguna dapat:

- Menambahkan pengeluaran
- Mengedit pengeluaran
- Menghapus pengeluaran
- Melihat detail pengeluaran
- Memfilter berdasarkan tanggal
- Memfilter berdasarkan kategori
- Melihat riwayat pengeluaran
- Melihat ringkasan pengeluaran

Contoh:

```text
+ Tambah Pengeluaran

Jumlah
Rp50.000

Kategori
Makanan

Tanggal
08 Oktober 2026

Deskripsi
Makan siang

Catatan
Opsional

[ Simpan Pengeluaran ]
```

---

# 5. Manajemen Kategori

Sediakan fitur CRUD kategori yang lengkap.

Pengguna dapat:

- Membuat kategori
- Mengedit kategori
- Menghapus kategori
- Menentukan apakah kategori digunakan untuk pemasukan atau pengeluaran
- Memberikan nama kategori
- Memilih ikon kategori
- Memilih warna kategori

Contoh:

```text
Kategori Pemasukan
├── Gaji
├── Freelance
├── Bisnis
├── Bonus
└── Lainnya

Kategori Pengeluaran
├── Makanan
├── Transportasi
├── Tagihan
├── Belanja
├── Hiburan
└── Lainnya
```

### Perhatikan Penghapusan Kategori

Jika kategori sudah digunakan oleh transaksi, jangan sampai menghapus kategori menyebabkan transaksi kehilangan referensi.

Gunakan pendekatan yang aman, misalnya:

- Soft delete kategori
- Memindahkan transaksi ke kategori "Lainnya"
- Atau meminta pengguna memilih kategori pengganti

Pilih pendekatan yang paling sesuai dengan arsitektur aplikasi.

---

# 6. Cash Flow

Sediakan fitur untuk memahami arus kas pengguna.

Gunakan formula:

```text
Net Cash Flow = Total Pemasukan - Total Pengeluaran
```

Contoh:

```text
Pemasukan       Rp10.000.000
Pengeluaran     Rp 7.500.000
────────────────────────────
Net Cash Flow   Rp 2.500.000
```

Tampilkan cash flow:

- Harian
- Mingguan
- Bulanan
- Tahunan
- Custom date range

Gunakan grafik untuk memperlihatkan tren cash flow.

---

# 7. Saldo

Sediakan informasi saldo keuangan pengguna.

Secara sederhana:

```text
Saldo = Total Pemasukan - Total Pengeluaran
```

Jika aplikasi menggunakan saldo awal, gunakan:

```text
Saldo = Saldo Awal + Total Pemasukan - Total Pengeluaran
```

Pastikan saldo dihitung secara konsisten dan tidak terjadi double counting.

---

# 8. Budget

Sediakan fitur untuk membuat budget berdasarkan kategori pengeluaran.

Pengguna dapat:

- Membuat budget
- Mengedit budget
- Menghapus budget
- Menentukan batas budget
- Menentukan periode budget
- Melihat jumlah yang sudah digunakan
- Melihat sisa budget

Contoh:

```text
Budget Makanan

Batas
Rp2.000.000

Terpakai
Rp1.650.000

Sisa
Rp350.000

82,5% digunakan
```

Gunakan indikator visual untuk menunjukkan kondisi budget.

Status:

```text
Aman       → penggunaan masih rendah
Mendekati  → mendekati batas
Melebihi   → melewati batas
```

Berikan peringatan ketika pengguna mendekati atau melewati batas budget.

---

# 9. Laporan Keuangan

Sediakan halaman laporan yang memungkinkan pengguna menganalisis kondisi keuangan.

Pengguna dapat memilih periode:

- Hari ini
- Minggu ini
- Bulan ini
- Bulan lalu
- Tahun ini
- Custom date range

Laporan harus menampilkan:

- Total pemasukan
- Total pengeluaran
- Net cash flow
- Pengeluaran berdasarkan kategori
- Pemasukan berdasarkan kategori
- Perbandingan pemasukan dan pengeluaran
- Perubahan saldo
- Penggunaan budget

---

# 10. Visualisasi

Gunakan grafik yang informatif dan mudah dipahami.

### Income vs Expense

Gunakan bar chart atau line chart untuk membandingkan pemasukan dan pengeluaran.

### Cash Flow

Tampilkan perubahan cash flow dari waktu ke waktu.

### Expense by Category

Gunakan pie chart atau donut chart untuk menunjukkan distribusi pengeluaran.

Contoh:

```text
Makanan          30%
Transportasi     20%
Tagihan          20%
Belanja          15%
Hiburan          10%
Lainnya           5%
```

### Income by Category

Tampilkan sumber pemasukan pengguna.

### Budget Usage

Tampilkan persentase penggunaan budget setiap kategori.

### Net Worth

Jika fitur net worth digunakan, tampilkan perubahan kekayaan bersih dari waktu ke waktu.

Semua grafik harus:

- Responsif
- Mudah dibaca
- Memiliki tooltip yang informatif
- Memiliki animasi yang halus
- Tidak menggunakan animasi berlebihan

---

# 11. Net Worth

Sediakan fitur untuk mencatat dan memantau **net worth** pengguna.

Gunakan formula:

```text
Net Worth = Total Aset - Total Liabilitas
```

Aset dapat berupa:

- Uang tunai
- Saldo rekening
- Tabungan
- Aset lainnya

Liabilitas dapat berupa:

- Pinjaman
- Hutang
- Kartu kredit
- Liabilitas lainnya

Pengguna dapat mencatat aset dan liabilitas secara manual.

Tampilkan:

- Total aset
- Total liabilitas
- Net worth
- Perubahan net worth

Contoh:

```text
Total Aset
Rp50.000.000

Total Liabilitas
Rp15.000.000

Net Worth
Rp35.000.000
```

---

# 12. Filter dan Pencarian

Sediakan sistem filter yang mudah digunakan.

Filter berdasarkan:

- Jenis transaksi
- Kategori
- Rentang tanggal
- Jumlah
- Kata kunci

Sediakan preset tanggal:

```text
Hari ini
7 hari terakhir
Bulan ini
Bulan lalu
3 bulan terakhir
Tahun ini
Custom
```

Pengguna juga dapat mencari transaksi berdasarkan deskripsi.

---

# 13. Transaksi Terbaru

Dashboard harus menampilkan transaksi terbaru.

Contoh:

```text
Transaksi Terbaru

08 Okt
Gaji                  +Rp8.000.000
Gaji

08 Okt
Makan siang           -Rp50.000
Makanan

07 Okt
Bensin                -Rp100.000
Transportasi

06 Okt
Freelance             +Rp1.500.000
Freelance
```

Gunakan visual yang jelas untuk membedakan pemasukan dan pengeluaran.

---

# 14. Navigasi

Gunakan navigasi berbasis tab yang sederhana.

Struktur:

```text
Dashboard
   ↓
Transaksi
   ├── Semua
   ├── Pemasukan
   └── Pengeluaran
   ↓
Budget
   ↓
Laporan
   ↓
Pengaturan
```

Gunakan ikon yang intuitif dan label yang jelas.

### Mobile

Gunakan bottom navigation.

Contoh:

```text
┌───────────────────────────────┐
│                               │
│          Content              │
│                               │
├───────────────────────────────┤
│ 🏠       💳       📊      ⚙️  │
│ Home   Transaksi  Laporan  Set│
└───────────────────────────────┘
```

### Desktop

Gunakan sidebar navigation.

---

# 15. Desain & UX

Gunakan desain yang:

- Bersih
- Modern
- Minimalis
- Mobile-first
- Responsif
- Konsisten
- Mudah dipahami
- Cepat digunakan

Gunakan whitespace yang cukup dan hindari informasi yang terlalu padat.

Fokus utama UI adalah membuat pengguna dapat:

1. Melihat kondisi keuangan.
2. Mencatat transaksi dengan cepat.
3. Memahami ke mana uang mereka digunakan.
4. Melihat apakah pengeluaran masih sesuai budget.

---

Jangan hanya mengandalkan warna untuk menyampaikan informasi. Gunakan kombinasi:

- Warna
- Ikon
- Label
- Typography

---

Pastikan alignment dan spacing konsisten di seluruh aplikasi.

---

# 16. Animasi

Gunakan animasi yang halus dan bermakna.

Animasi dapat digunakan pada:

- Page transition
- Modal
- Dialog
- Button interaction
- Penambahan transaksi
- Penghapusan transaksi
- Perubahan angka
- Chart rendering
- Progress budget

Hindari animasi berlebihan.

Tujuan animasi adalah memberikan feedback kepada pengguna, bukan sekadar dekorasi.

---

# 17. Data Model

Gunakan struktur data yang sederhana namun scalable.

Struktur utama:

```text
User
├── Transactions
│   ├── Income
│   └── Expense
│
├── Categories
│
├── Budgets
│
├── Assets
│
└── Liabilities
```

Contoh model transaksi:

```ts
type TransactionType = "income" | "expense";

type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

Contoh model kategori:

```ts
type CategoryType = "income" | "expense";

type Category = {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  isArchived?: boolean;
};
```

Contoh model budget:

```ts
type Budget = {
  id: string;
  categoryId: string;
  amount: number;
  period: "monthly" | "yearly";
  startDate: string;
  endDate?: string;
};
```

---

# 18. Arsitektur Aplikasi

Rancang arsitektur yang modular dan mudah dipelihara.

Pisahkan tanggung jawab menjadi:

```text
UI
 ↓
Components
 ↓
Features
 ↓
Business Logic
 ↓
Data Access
 ↓
Database
```

Gunakan reusable components sebanyak mungkin.

Hindari membuat komponen yang terlalu besar dan sulit dipelihara.

---

# 19. Rekomendasi Technology Stack

Gunakan teknologi modern yang sesuai dengan kebutuhan aplikasi.

Pertimbangkan:

- TypeScript
- React / Next.js
- Tailwind CSS
- shadcn/ui
- Recharts atau library chart lainnya
- Zustand atau state management ringan lainnya
- MySQL (mysql2)
- @tanstack/react-query
- @tanstack/react-router
- react-hook-form (gunakan konsep <Controller {...props} />)
- axios

Pilih teknologi berdasarkan:

- Kesederhanaan
- Maintainability
- Performance
- Scalability
- Developer Experience

Jelaskan alasan pemilihan setiap teknologi.

---

# 20. Responsive Design

Aplikasi harus bekerja dengan baik pada:

- Mobile kecil
- Mobile standar
- Mobile besar
- Tablet
- Desktop

### Mobile

- Gunakan bottom navigation.
- Gunakan card untuk informasi penting.
- Hindari tabel yang terlalu lebar.
- Gunakan horizontal scrolling jika diperlukan untuk chart.
- Letakkan tombol utama pada posisi yang mudah dijangkau.
- Prioritaskan informasi yang paling penting.

### Desktop

- Gunakan sidebar navigation.
- Gunakan dashboard multi-column.
- Manfaatkan ruang layar secara optimal.
- Gunakan tabel ketika lebih efektif daripada card.
- Tampilkan chart dengan ukuran yang lebih besar.

---

# 21. Validasi

Validasi seluruh input pengguna.

Contoh:

- Jumlah tidak boleh kosong.
- Jumlah harus lebih besar dari 0.
- Kategori wajib dipilih.
- Tanggal harus valid.
- Deskripsi dapat bersifat opsional.
- Budget harus memiliki nilai positif.
- Rentang tanggal harus valid.
- Tanggal akhir tidak boleh lebih awal dari tanggal mulai.

Berikan error message yang jelas dan mudah dipahami.

---

# 22. Edge Cases

Pertimbangkan kasus berikut:

- Tidak ada transaksi.
- Tidak ada pemasukan.
- Tidak ada pengeluaran.
- Tidak ada kategori.
- Kategori yang digunakan oleh transaksi dihapus.
- Tidak ada data pada rentang tanggal tertentu.
- Budget belum digunakan.
- Budget sudah mencapai batas.
- Budget melebihi batas.
- Jumlah transaksi sangat besar.
- Jumlah transaksi memiliki angka desimal.
- Saldo bernilai negatif.
- Net worth bernilai negatif.
- Banyak transaksi pada tanggal yang sama.
- Pengguna memasukkan tanggal yang tidak valid.

Pastikan aplikasi tetap stabil dan memberikan feedback yang jelas pada semua kondisi tersebut.

---

# 23. Perhitungan Keuangan

Gunakan perhitungan yang konsisten.

### Total Pemasukan

```text
Total Income = Σ seluruh transaksi dengan type = income
```

### Total Pengeluaran

```text
Total Expense = Σ seluruh transaksi dengan type = expense
```

### Net Cash Flow

```text
Net Cash Flow = Total Income - Total Expense
```

### Saldo

Jika terdapat saldo awal:

```text
Balance = Initial Balance + Total Income - Total Expense
```

### Net Worth

```text
Net Worth = Total Assets - Total Liabilities
```

Hindari masalah floating-point precision untuk perhitungan uang.

Pertimbangkan penggunaan integer dalam satuan terkecil atau library decimal apabila diperlukan.

---

# 24. Tahapan Pengembangan

Ikuti tahapan berikut:

1. Tentukan arsitektur aplikasi.
2. Rancang data model.
3. Buat design system.
4. Buat reusable UI components.
5. Implementasikan navigasi.
6. Implementasikan transaksi.
7. Implementasikan pemasukan.
8. Implementasikan pengeluaran.
9. Implementasikan CRUD kategori.
10. Implementasikan budget.
11. Implementasikan laporan.
12. Implementasikan dashboard.
13. Implementasikan visualisasi.
14. Implementasikan net worth.
15. Implementasikan filter dan pencarian.
16. Tambahkan animasi.
17. Optimalkan responsive layout.
18. Implementasikan validasi.
19. Uji seluruh perhitungan keuangan.
20. Uji UI pada berbagai ukuran layar.

---

# 25. Output yang Diharapkan

Berikan **rencana desain dan pengembangan yang detail** dengan struktur berikut:

## 1. Arsitektur

Jelaskan:

- Arsitektur aplikasi
- Alur data
- State management
- Struktur folder
- Struktur database
- Component architecture

## 2. Technology Stack

Jelaskan:

- Teknologi yang digunakan
- Alasan pemilihan teknologi
- Alternatif jika diperlukan

## 3. Data Model

Berikan:

- Entity relationship
- Database schema
- TypeScript types/interfaces

## 4. UI/UX

Jelaskan desain:

- Dashboard
- Halaman transaksi
- Halaman kategori
- Halaman budget
- Halaman laporan
- Halaman net worth
- Pengaturan
- Navigasi mobile
- Navigasi desktop

## 5. Implementasi Fitur

Berikan detail implementasi:

- CRUD pemasukan
- CRUD pengeluaran
- CRUD kategori
- CRUD budget
- Asset management
- Liability management
- Cash flow
- Net worth
- Filter transaksi
- Search transaksi
- Financial reports

## 6. Visualisasi

Berikan contoh implementasi:

- Grafik pemasukan vs pengeluaran
- Grafik cash flow
- Grafik pengeluaran berdasarkan kategori
- Grafik pemasukan berdasarkan kategori
- Grafik penggunaan budget
- Grafik net worth

Gunakan animasi yang halus dan responsif.

## 7. Sample Code

Berikan contoh kode yang relevan untuk menunjukkan implementasi fungsi inti.

## 8. Responsive Layout

Berikan contoh layout untuk:

- Mobile
- Tablet
- Desktop

## 9. Validasi & Edge Cases

Jelaskan bagaimana aplikasi menangani:

- Invalid input
- Empty state
- Error state
- Loading state
- Budget exceeded
- Negative balance
- Deleted categories
- Empty reports

---

# Prinsip Utama

Seluruh keputusan desain dan implementasi harus memprioritaskan:

**Simplicity + Accuracy + Maintainability + Responsive UX + Financial Visibility**

Aplikasi harus terasa **sangat mudah digunakan untuk mencatat transaksi sehari-hari**, tetapi memiliki struktur data dan arsitektur yang cukup baik untuk dikembangkan menjadi aplikasi personal finance yang lebih lengkap di masa depan.
