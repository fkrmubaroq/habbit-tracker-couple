// apps/finance-tracker-web/tests/qa-inline-form-runner.mjs
// Automated verification for docs/qa/inline-transaction-form/test-matrix.md
// (PB-2 navigasi, PB-3 pembersihan modal/store, masking nominal, quality gate wiring).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const financeWeb = path.resolve(repoRoot, "apps/finance-tracker-web");
const srcDir = path.join(financeWeb, "src");

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function test(id, name, fn) {
  process.stdout.write(`[${id}] ${name}... `);
  try {
    fn();
    passed++;
    console.log("PASSED");
    results.push({ id, name, status: "Passed", error: null });
  } catch (err) {
    failed++;
    console.log(`FAILED -> ${err.message}`);
    results.push({ id, name, status: "Failed", error: err.message });
  }
}

function walkFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

console.log("=================================================");
console.log("QA Suite — inline transaction form (/transactions/create)");
console.log("=================================================");

const createRoute = path.join(srcDir, "routes/transactions_.create.tsx");

// ------------------------------------------------------------- TC1-2 (struktur field)
test("TC1-2", "Route form memuat 6 field yang dijanjikan PRD", () => {
  assert(fs.existsSync(createRoute), "transactions_.create.tsx tidak ada");
  const src = read(createRoute);
  assert(/createFileRoute\("\/transactions_\/create"\)/.test(src), "Path route bukan /transactions_/create");
  assert(/Catat Transaksi Baru/.test(src), "Judul halaman tidak ada");
  for (const label of [
    "Jenis Transaksi",
    "Nominal (Rp)",
    "Kategori",
    "Tanggal",
    "Deskripsi / Keterangan",
    "Catatan Tambahan",
  ]) {
    assert(src.includes(label), `Field "${label}" tidak ada`);
  }
  assert(/inputMode="numeric"/.test(src), "Nominal tidak memakai inputMode numeric");
  assert(/type="date"/.test(src), "Field tanggal bukan type=date");
  assert(/<Textarea/.test(src), "Catatan bukan Textarea");
  assert(/<Select/.test(src), "Kategori bukan Select");
});

// ------------------------------------------------------------- TC2-2 (confetti income)
test("TC2-2", "Simpan pemasukan memicu confetti lalu kembali", () => {
  const src = read(createRoute);
  assert(/confetti\(/.test(src), "Confetti tidak dipanggil");
  assert(/data\.type === "income"/.test(src), "Confetti tidak dikondisikan ke income");
  assert(/navigate\(\{ to: "\/transactions" \}\)/.test(src), "Tidak kembali ke /transactions setelah simpan");
});

// ------------------------------------------------------------- TC2-3 (validasi)
test("TC2-3", "Validasi form memakai createTransactionSchema", () => {
  const src = read(createRoute);
  assert(/zodResolver\(createTransactionSchema\)/.test(src), "Form tidak memakai createTransactionSchema");
  assert(/errors\.amount/.test(src), "Tidak menampilkan error amount");
  assert(/errors\.description/.test(src), "Tidak menampilkan error description");
});

// ------------------------------------------------------------- TC2-4 (filter kategori)
test("TC2-4", "Kategori difilter berdasarkan tipe", () => {
  const src = read(createRoute);
  assert(
    /filter\(\(c\) => c\.type === selectedType\)/.test(src),
    "Kategori tidak difilter per tipe"
  );
  assert(/setValue\("category_id", filteredCategories\[0\]\.id\)/.test(src), "Kategori default tidak di-reset");
});

// ------------------------------------------------------------- TC3-1 / TC3-2
test("TC3-1", "Tombol Batal kembali tanpa menyimpan", () => {
  const src = read(createRoute);
  assert(/const handleCancel = \(\) => \{\s*navigate\(\{ to: "\/transactions" \}\);/.test(src), "handleCancel salah");
  assert(/onClick=\{handleCancel\}/.test(src), "Tombol Batal tidak memakai handleCancel");
});

test("TC3-2", "Tautan Kembali ke Riwayat menuju /transactions", () => {
  const src = read(createRoute);
  assert(/Kembali ke Riwayat/.test(src), "Tautan kembali tidak ada");
  assert(/<Link\s+to="\/transactions"/.test(src), "Tautan tidak menuju /transactions");
});

// ------------------------------------------------------------- TC4-1 / TC4-2 / TC4-3 / TC4-4
test("TC4-1", "Nominal diformat ribuan saat ditampilkan", () => {
  const src = read(createRoute);
  assert(/function formatThousands/.test(src), "formatThousands tidak ada");
  assert(/replace\(\/\\B\(\?=\(\\d\{3\}\)\+\(\?!\\d\)\)\/g, "\."\)/.test(src), "Pola pemisah ribuan salah");
  assert(/value=\{formatThousands\(field\.value\)\}/.test(src), "Input tidak memakai formatThousands");
  assert(!/type="number"/.test(src), "Masih ada input type=number");
});

test("TC4-2", "Nilai amount tetap digit murni (number)", () => {
  const src = read(createRoute);
  assert(/function parseThousands/.test(src), "parseThousands tidak ada");
  assert(/const digits = raw\.replace\(\/\\D\/g, ""\)/.test(src), "parseThousands tidak membuang non-digit");
  assert(/return Number\(digits\)/.test(src), "parseThousands tidak mengembalikan number");
  assert(/onChange=\{\(e\) => field\.onChange\(parseThousands\(e\.target\.value\)\)\}/.test(src), "onChange tidak memakai parseThousands");
});

test("TC4-3", "Input dikosongkan menjadi undefined", () => {
  const src = read(createRoute);
  assert(/if \(!digits\) return undefined;/.test(src), "Nilai kosong tidak dikembalikan sebagai undefined");
  assert(/if \(!digits\) return "";/.test(src), "Display kosong tidak dikembalikan sebagai string kosong");
});

test("TC4-4", "Karakter non-digit diabaikan", () => {
  const src = read(createRoute);
  // formatThousands juga menyanitasi nilai yang sudah terlanjur berisi non-digit
  const fn = src.match(/function formatThousands[\s\S]*?\n\}/);
  assert(fn, "formatThousands tidak ditemukan");
  assert(/replace\(\/\\D\/g, ""\)/.test(fn[0]), "formatThousands tidak menyanitasi non-digit");
});

// ------------------------------------------------------------- TC5-1 / TC5-2 / TC5-3
test("TC5-1", "Tombol + Transaksi sidebar menuju route form", () => {
  const root = read(path.join(srcDir, "routes/__root.tsx"));
  assert(/<Link to="\/transactions\/create"/.test(root), "Tombol sidebar tidak menuju /transactions/create");
  assert(/\+ Transaksi/.test(root), "Label + Transaksi tidak ada");
  assert(!/TransactionFormDialog/.test(root), "__root masih merender TransactionFormDialog");
  assert(!/isTransactionModalOpen/.test(root), "__root masih memakai isTransactionModalOpen");
});

test("TC5-2", "Tombol Catat header mobile menuju route form", () => {
  const root = read(path.join(srcDir, "routes/__root.tsx"));
  const idx = root.indexOf("Catat");
  assert(idx > -1, "Label Catat tidak ada");
  const window = root.slice(Math.max(0, idx - 400), idx);
  assert(/to="\/transactions\/create"/.test(window), "Tombol Catat tidak menuju /transactions/create");
});

test("TC5-3", "Tombol riwayat & empty state menuju route form", () => {
  const src = read(path.join(srcDir, "routes/transactions.tsx"));
  const matches = src.match(/\/transactions\/create/g) || [];
  assert(matches.length >= 2, `Hanya ${matches.length} tautan ke /transactions/create (butuh >= 2)`);
  assert(/Transaksi Baru/.test(src), "Label Transaksi Baru tidak ada");
});

// ------------------------------------------------------------- TC6-1 .. TC6-4
test("TC6-1", "TransactionFormDialog.tsx sudah dihapus", () => {
  assert(
    !fs.existsSync(path.join(srcDir, "components/TransactionFormDialog.tsx")),
    "File TransactionFormDialog.tsx masih ada"
  );
});

test("TC6-2", "Tidak ada render modal transaksi", () => {
  const root = read(path.join(srcDir, "routes/__root.tsx"));
  assert(!/TransactionFormDialog/.test(root), "__root masih memuat TransactionFormDialog");
  assert(!/<Dialog[^>]*>[\s\S]*Transaksi/.test(root), "__root masih memuat Dialog transaksi");
});

test("TC6-3", "Store finance-ui bersih dari state modal transaksi", () => {
  const store = read(path.join(srcDir, "stores/finance-ui.store.ts"));
  assert(!/isTransactionModalOpen/.test(store), "isTransactionModalOpen masih ada");
  assert(!/TransactionModal/.test(store), "Action modal transaksi masih ada");
});

test("TC6-4", "Tidak ada sisa referensi modal transaksi di src", () => {
  const offenders = [];
  for (const file of walkFiles(srcDir)) {
    const content = read(file);
    if (/TransactionFormDialog|isTransactionModalOpen|openTransactionModal|closeTransactionModal/.test(content)) {
      offenders.push(path.relative(repoRoot, file));
    }
  }
  assert(offenders.length === 0, `Sisa referensi di: ${offenders.join(", ")}`);
});

// ------------------------------------------------------------- TC7-1 .. TC7-4 (wiring)
test("TC7-4", "Runner QA UI components sudah disesuaikan", () => {
  const runnerPath = path.join(financeWeb, "tests/qa-ui-components-runner.mjs");
  assert(fs.existsSync(runnerPath), "qa-ui-components-runner.mjs tidak ada");
  const runner = read(runnerPath);
  assert(!/TransactionFormDialog/.test(runner), "Runner masih menguji TransactionFormDialog");
  assert(/transactions\/create/.test(runner), "Runner tidak memvalidasi route /transactions/create");
});

test("TC7-1", "Script check-types tersedia di app finance", () => {
  const pkg = JSON.parse(read(path.join(financeWeb, "package.json")));
  assert(pkg.scripts["check-types"], "script check-types tidak ada");
  assert(pkg.scripts.lint, "script lint tidak ada");
  assert(pkg.scripts.build, "script build tidak ada");
  const rootPkg = JSON.parse(read(path.join(repoRoot, "package.json")));
  assert(rootPkg.scripts["check-types"] === "turbo run check-types", "Root check-types bukan turbo");
  assert(rootPkg.scripts.lint === "turbo run lint", "Root lint bukan turbo");
  assert(rootPkg.scripts.build === "turbo run build", "Root build bukan turbo");
});

console.log("=================================================");
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("=================================================");
if (failed > 0) process.exit(1);
