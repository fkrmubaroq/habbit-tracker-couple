# Effort estimation for a BRD (optional add-on)

Use this when the user wants a calibrated work-hour estimate table attached
to the BRD — a common need when the BRD feeds a planning/scheduling
process. This is a **rubric to reason with**, not a script to run verbatim;
adapt the step names to what this repo/team actually calls them if
different from the defaults below.

## The 7 standard steps (default rubric)

1. Pemahaman Product Backlog
2. Cek ketersediaan Flowchart untuk Product Backlog
3. Permintaan list proses & list penjagaan kepada Developer
4. Pembuatan Workflow & Flowchart sesuai list proses & penjagaan
5. Buat / Update UI (only if Step 2's grill established a UI impact —
   otherwise this step is 0, don't estimate it)
6. Buat / Update Kamus Data (only if Step 2's grill established a data
   impact — otherwise 0)
7. Pembuatan BRD (writing the document itself)

Output as a markdown table: `| Step | Deskripsi Aktivitas | Durasi (jam) |
Peran Terlibat |`. Durasi is a single number (decimals like 0.5 allowed),
never a range.

## Rule hierarchy — read this before estimating anything

When rules conflict, higher priority always wins:

1. **Absolute/critical rules** (below) — non-negotiable.
2. **Calibration adjustments for specific scenarios** (below).
3. **Prior similar examples**, if any are available (e.g. past estimates
   for a similarly-worded backlog item) — use these *only* for stylistic
   consistency. If a prior example's numbers conflict with rule 1 or 2,
   ignore the example and follow the rule.

## Complexity calibration — the most common failure mode

Pick **one** overall complexity level (Rendah / Sedang / Tinggi / Sangat
Tinggi) for the whole backlog item, and use it consistently across all
steps below — don't re-assess complexity per step.

**Critical rule:** a backlog item bundling 2-3 individually-simple requests
(e.g. "update an icon" + "add a form field") must **never** be rated
Tinggi. It is Sedang. This is the single most common miscalibration — an
agent bundling small asks and over-rating the total because there are
"several things" listed. Count what each individual ask actually requires,
not how many bullet points the backlog has.

- **Rendah** — a minor change to one feature (text update, icon swap,
  simple bugfix).
- **Sedang** — a simple new feature, several minor changes across
  features, OR a bundle of 2-3 small requests in different areas (the rule
  above).
- **Tinggi** — ONLY for a genuinely complex new feature (multi-step flow,
  many validations), a base architecture change, or external system
  integration. A technical change like swapping a data source or protocol
  is Tinggi only if it materially affects core business logic or many
  modules — if it's a like-for-like technical replacement with a similar
  data shape, treat it as Sedang instead.
- **Sangat Tinggi** — a new module built from scratch, involving multiple
  integrations, or a fundamental change touching many parts of the app.

## Per-step duration guidance

| Step | Rendah | Sedang | Tinggi | Sangat Tinggi |
|---|---|---|---|---|
| Pemahaman Product Backlog | 1-2h | 2-4h (2h if it's a bundle-of-small-requests case above) | 4-8h | — |
| Pembuatan Workflow & Flowchart | 2-4h | 3-5h | 8-16h | — |
| Pembuatan BRD | 2-4h | 4-6h | 9-16h | 17-24h |
| Cek ketersediaan Flowchart | 1-2h (coordination activity, keep low regardless of complexity) | | | |
| Permintaan list proses & penjagaan | 1-2h (same — coordination, not analysis) | | | |

**UI step** (only if UI impact confirmed in the grill): count unique UI
items — deduplicate by identifier (e.g. the same UI code mentioned 3 times
is still 1 UI) and count named forms the same way (deduplicate by name).
Sum unique-UI-count + unique-form-count, then: 1-2 total → 0.5h; 3-5 total →
1-1.5h; more than 5 → 2h+ depending on complexity.

**Kamus Data step** (only if data impact confirmed): 0.5-1h depending on
how much new data is described.

**If Step 2's grill established no flow change:** the flowchart-related
steps (2, 3, 4) are forced to 0 regardless of any other calibration
guidance — this overrides the per-step table above.

## Buffer and total

For Tinggi/Sangat Tinggi complexity, apply a 5% buffer to the subtotal and
show the arithmetic explicitly, not just the final number:

```
Subtotal Durasi: [step1] + [step2] + ... = [subtotal] jam
Buffer (5%): [subtotal] * 0.05 = [buffer] jam
Total Estimasi: [subtotal] + [buffer] = [total] jam
```

For Rendah/Sedang, show the total without a buffer line.

Display the final total with day-equivalence, 1 hari kerja = 8 jam:
- `27.5 jam (setara 3 hari 3.5 jam)` — remainder shown when not a clean
  multiple of 8
- `16 jam (setara 2 hari)` — no remainder shown when exactly a multiple
- `7 jam` — no day-equivalence shown when under 8 hours

## Verifying the total programmatically, not trusting the LLM's arithmetic

If this estimation is automated (an agent or a script parses the generated
table), **recompute the subtotal and buffer from the individual step
durations** rather than trusting whatever total the model wrote in prose —
model arithmetic on multi-term sums is not reliable. Extract each step's
duration from the table, sum them, apply the buffer rule, and format the
total yourself. Only fall back to parsing a total out of the response text
if the table itself is somehow unparseable.

## Consistency

For similar backlog items, estimates should land within roughly 5% of each
other. If producing an estimate for something clearly similar to a past
one, treat that as a soft anchor — but never let it override the
complexity-calibration rules above (see rule hierarchy).
