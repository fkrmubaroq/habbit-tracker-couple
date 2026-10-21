// apps/finance-tracker-api/tests/qa-api-runner.mjs
// Automated verification suite for couple-finances REST API with tagged test data and explicit teardown.

const BASE_URL = process.env.API_URL || "http://localhost:1907";
const TAG = "qa-test-" + Date.now();

let testsPassed = 0;
let testsFailed = 0;
const results = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error("Assertion failed: " + message);
  }
}

async function runTest(id, name, fn) {
  process.stdout.write(`[${id}] ${name}... `);
  try {
    await fn();
    testsPassed++;
    console.log("PASSED");
    results.push({ id, name, status: "Passed", error: null });
  } catch (err) {
    testsFailed++;
    console.log("FAILED -> " + err.message);
    results.push({ id, name, status: "Failed", error: err.message });
  }
}

async function main() {
  console.log("=================================================");
  console.log("Starting QA Test Suite for couple-finances");
  console.log(`Target: ${BASE_URL} | Session Tag: ${TAG}`);
  console.log("=================================================");

  // Tracking created entities for teardown
  const created = {
    categories: [],
    transactions: [],
    budgets: [],
    assets: [],
    liabilities: [],
    originalInitialBalance: 0,
  };

  try {
    // TC2-1: Health check
    await runTest("TC2-1", "Health check & database connectivity", async () => {
      const res = await fetch(`${BASE_URL}/health`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.status === "ok", "Expected status ok");
      assert(json.database === "connected", "Expected database connected");
    });

    // TC1-3: Seed categories verification
    let defaultCatId = "";
    await runTest("TC1-3", "Seed categories availability (16 categories)", async () => {
      const res = await fetch(`${BASE_URL}/api/categories`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, "Expected success true");
      assert(Array.isArray(json.data) && json.data.length >= 16, `Expected >= 16 categories, got ${json.data?.length}`);
      const gaji = json.data.find((c) => c.name.includes("Gaji") || c.name.includes("Pendapatan"));
      assert(!!gaji, "Expected Gaji/Pendapatan category in seed");
      defaultCatId = json.data[0].id;
    });

    // TC2-2: Settings get and update initial balance
    await runTest("TC2-2", "Settings initial_balance get and update", async () => {
      const getRes = await fetch(`${BASE_URL}/api/settings`);
      const getJson = await getRes.json();
      assert(getRes.status === 200, `Expected 200, got ${getRes.status}`);
      created.originalInitialBalance = getJson.data?.initial_balance || 0;

      const putRes = await fetch(`${BASE_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initial_balance: 5000000 }),
      });
      assert(putRes.status === 200, `Expected 200, got ${putRes.status}`);
      const putJson = await putRes.json();
      assert(putJson.data.initial_balance === 5000000, "Expected updated balance 5000000");
    });

    // TC2-3: Categories create
    let catA_id = "";
    let catB_id = "";
    await runTest("TC2-3", "Create custom categories for couple", async () => {
      const resA = await fetch(`${BASE_URL}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${TAG}-Cat-Expense-A`,
          type: "expense",
          icon: "ShoppingBag",
          color: "#EF4444",
        }),
      });
      assert(resA.status === 201, `Expected 201, got ${resA.status}`);
      const jsonA = await resA.json();
      catA_id = jsonA.data.id;
      created.categories.push(catA_id);

      const resB = await fetch(`${BASE_URL}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${TAG}-Cat-Expense-B`,
          type: "expense",
          icon: "Coffee",
          color: "#F59E0B",
        }),
      });
      assert(resB.status === 201, `Expected 201, got ${resB.status}`);
      const jsonB = await resB.json();
      catB_id = jsonB.data.id;
      created.categories.push(catB_id);
    });

    // TC2-6: Create valid transactions (Income & Expense)
    let txIncomeId = "";
    let txExpenseId = "";
    await runTest("TC2-6", "Record Income and Expense transactions", async () => {
      // Income 10,000,000
      const resInc = await fetch(`${BASE_URL}/api/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 10000000,
          type: "income",
          category_id: defaultCatId,
          description: `${TAG} Bonus Kinerja Q3`,
          date: "2026-10-01",
          notes: "Transfer bank",
        }),
      });
      assert(resInc.status === 201, `Expected 201, got ${resInc.status}`);
      const jsonInc = await resInc.json();
      txIncomeId = jsonInc.data.id;
      created.transactions.push(txIncomeId);

      // Expense 2,500,000 in Cat-A
      const resExp = await fetch(`${BASE_URL}/api/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 2500000,
          type: "expense",
          category_id: catA_id,
          description: `${TAG} Belanja Bulanan Supermarket`,
          date: "2026-10-05",
          notes: "Kebutuhan dapur",
        }),
      });
      assert(resExp.status === 201, `Expected 201, got ${resExp.status}`);
      const jsonExp = await resExp.json();
      txExpenseId = jsonExp.data.id;
      created.transactions.push(txExpenseId);
    });

    // TC2-7: Transaction validation error on invalid input
    await runTest("TC2-7", "Validation error on missing description and negative amount", async () => {
      const res = await fetch(`${BASE_URL}/api/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: -50000,
          type: "expense",
          category_id: catA_id,
          description: "",
          date: "invalid-date",
        }),
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      const json = await res.json();
      assert(json.success === false, "Expected success false");
      assert(Array.isArray(json.details), "Expected validation error details");
    });

    // TC2-8: Filter & Search transactions
    await runTest("TC2-8", "Filter and search transactions by keyword and type", async () => {
      const res = await fetch(`${BASE_URL}/api/transactions?search=${encodeURIComponent(TAG)}&type=expense`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.length >= 1, "Expected matching expense transaction");
      assert(json.data[0].description.includes(TAG), "Expected tag match");
    });

    // TC2-10: Overview calculation & running balance
    await runTest("TC2-10", "Overview running balance = Initial + Income - Expense", async () => {
      const res = await fetch(`${BASE_URL}/api/overview`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      // Current balance should be 5000000 (initial) + 10000000 (income) - 2500000 (expense) = 12500000
      assert(json.data.initial_balance === 5000000, `Expected initial_balance 5000000, got ${json.data.initial_balance}`);
      assert(json.data.current_balance === 12500000, `Expected current_balance 12500000, got ${json.data.current_balance}`);
      assert(json.data.net_cash_flow_this_month === 7500000, `Expected net cash flow 7500000, got ${json.data.net_cash_flow_this_month}`);
    });

    // TC5-1: Budgets create and progress calculation
    await runTest("TC5-1", "Budget allocation and progress calculation", async () => {
      const now = new Date();
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const res = await fetch(`${BASE_URL}/api/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: catA_id,
          amount: 3000000,
          period: "monthly",
          month_year: monthYear,
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const json = await res.json();
      created.budgets.push(json.data.id);

      const listRes = await fetch(`${BASE_URL}/api/budgets?month_year=${monthYear}`);
      const listJson = await listRes.json();
      const budgetA = listJson.data.find((b) => b.category_id === catA_id);
      assert(!!budgetA, "Expected budget for catA in list");
      assert(budgetA.spent === 2500000, `Expected spent 2500000, got ${budgetA.spent}`);
      assert(budgetA.percentage === 83, `Expected percentage ~83%, got ${budgetA.percentage}%`);
      assert(budgetA.status === "warning", `Expected status warning (75-100%), got ${budgetA.status}`);
    });

    // TC5-2: Update budget threshold
    await runTest("TC5-2", "Update budget threshold amount", async () => {
      const bId = created.budgets[0];
      const putRes = await fetch(`${BASE_URL}/api/budgets/${bId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 5000000 }),
      });
      assert(putRes.status === 200, `Expected 200, got ${putRes.status}`);
      const putJson = await putRes.json();
      assert(Number(putJson.data.amount) === 5000000, `Expected updated amount 5000000, got ${putJson.data.amount}`);
    });

    // TC6-1: Reports aggregation
    await runTest("TC6-1", "Reports aggregated metrics and cash flow trends", async () => {
      const res = await fetch(`${BASE_URL}/api/reports?startDate=2026-10-01&endDate=2026-10-31`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.data.total_income === 10000000, `Expected total_income 10000000, got ${json.data.total_income}`);
      assert(json.data.total_expense === 2500000, `Expected total_expense 2500000, got ${json.data.total_expense}`);
      assert(json.data.net_cash_flow === 7500000, `Expected net_cash_flow 7500000, got ${json.data.net_cash_flow}`);
      assert(Array.isArray(json.data.expense_by_category), "Expected expense_by_category array");
      assert(Array.isArray(json.data.cash_flow_trend), "Expected cash_flow_trend array");
    });

    // TC7-1 & TC7-2: Net Worth with Assets and Liabilities
    let assetId = "";
    let liabId = "";
    await runTest("TC7-1", "Net Worth = Liquid Cash + Assets - Liabilities", async () => {
      // Add Asset: 20,000,000
      const aRes = await fetch(`${BASE_URL}/api/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${TAG} Tabungan Emas`,
          category: "Investasi",
          amount: 20000000,
          notes: "Logam mulia",
        }),
      });
      assert(aRes.status === 201, `Expected 201, got ${aRes.status}`);
      const aJson = await aRes.json();
      assetId = aJson.data.id;
      created.assets.push(assetId);

      // Add Liability: 5,000,000
      const lRes = await fetch(`${BASE_URL}/api/liabilities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${TAG} Cicilan Laptop`,
          category: "Elektronik",
          amount: 5000000,
          notes: "Tenor 6 bulan",
        }),
      });
      assert(lRes.status === 201, `Expected 201, got ${lRes.status}`);
      const lJson = await lRes.json();
      liabId = lJson.data.id;
      created.liabilities.push(liabId);

      // Check Net Worth: 12,500,000 (liquid cash) + 20,000,000 (assets) - 5,000,000 (liabilities) = 27,500,000
      const nwRes = await fetch(`${BASE_URL}/api/net-worth`);
      assert(nwRes.status === 200, `Expected 200, got ${nwRes.status}`);
      const nwJson = await nwRes.json();
      assert(nwJson.data.liquid_cash === 12500000, `Expected liquid cash 12500000, got ${nwJson.data.liquid_cash}`);
      assert(nwJson.data.manual_assets_total === 20000000, `Expected manual assets 20000000, got ${nwJson.data.manual_assets_total}`);
      assert(nwJson.data.total_assets === 32500000, `Expected total assets 32500000, got ${nwJson.data.total_assets}`);
      assert(nwJson.data.total_liabilities === 5000000, `Expected total liabilities 5000000, got ${nwJson.data.total_liabilities}`);
      assert(nwJson.data.net_worth === 27500000, `Expected net worth 27500000, got ${nwJson.data.net_worth}`);
    });

    // TC2-4 & TC2-5: Category deletion protection and reassign
    await runTest("TC2-4", "Category deletion blocked when transactions exist without replacement", async () => {
      const res = await fetch(`${BASE_URL}/api/categories/${catA_id}`, { method: "DELETE" });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      const json = await res.json();
      assert(json.hasTransactions === true, "Expected hasTransactions flag true");
    });

    await runTest("TC2-5", "Category deletion with reassign moves transactions to replacement category", async () => {
      // Delete Cat-A with replacement Cat-B
      const res = await fetch(`${BASE_URL}/api/categories/${catA_id}?replacementCategoryId=${catB_id}`, {
        method: "DELETE",
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);

      // Verify that txExpense now belongs to Cat-B
      const txRes = await fetch(`${BASE_URL}/api/transactions/${txExpenseId}`);
      assert(txRes.status === 200, `Expected 200, got ${txRes.status}`);
      const txJson = await txRes.json();
      assert(txJson.data.category_id === catB_id, `Expected transaction moved to catB (${catB_id}), got ${txJson.data.category_id}`);

      // Cat-A removed from created array
      created.categories = created.categories.filter((id) => id !== catA_id);
    });

    // TC2-9: Update transaction details
    await runTest("TC2-9", "Update transaction details (amount & notes)", async () => {
      const putRes = await fetch(`${BASE_URL}/api/transactions/${txExpenseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 3200000,
          notes: "Diperbarui: Tambah belanja buah segar",
        }),
      });
      assert(putRes.status === 200, `Expected 200, got ${putRes.status}`);
      const putJson = await putRes.json();
      assert(putJson.data.amount === 3200000, `Expected amount 3200000, got ${putJson.data.amount}`);
      assert(putJson.data.notes.includes("buah segar"), "Expected updated notes");
    });

    // TC7-3: Update manual asset
    await runTest("TC7-3", "Update manual asset valuation", async () => {
      const putRes = await fetch(`${BASE_URL}/api/assets/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 25000000 }),
      });
      assert(putRes.status === 200, `Expected 200, got ${putRes.status}`);
      const putJson = await putRes.json();
      assert(Number(putJson.data.amount) === 25000000, `Expected updated valuation 25000000, got ${putJson.data.amount}`);
    });

  } finally {
    console.log("-------------------------------------------------");
    console.log("Teardown: Cleaning up tagged test data...");

    for (const txId of created.transactions) {
      await fetch(`${BASE_URL}/api/transactions/${txId}`, { method: "DELETE" });
    }
    for (const bId of created.budgets) {
      await fetch(`${BASE_URL}/api/budgets/${bId}`, { method: "DELETE" });
    }
    for (const aId of created.assets) {
      await fetch(`${BASE_URL}/api/assets/${aId}`, { method: "DELETE" });
    }
    for (const lId of created.liabilities) {
      await fetch(`${BASE_URL}/api/liabilities/${lId}`, { method: "DELETE" });
    }
    for (const cId of created.categories) {
      await fetch(`${BASE_URL}/api/categories/${cId}`, { method: "DELETE" });
    }
    // Restore initial balance
    await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initial_balance: created.originalInitialBalance }),
    });

    console.log("Teardown completed cleanly!");
    console.log("=================================================");
    console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`);
    console.log("=================================================");
  }

  if (testsFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("FATAL QA TEST RUNNER ERROR:", err);
  process.exit(1);
});
