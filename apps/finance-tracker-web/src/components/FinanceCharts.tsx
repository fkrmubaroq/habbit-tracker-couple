import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";
import { CategoryBreakdownItem, CashFlowTrendItem } from "@repo/types";

function formatRupiahShort(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}Jt`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}Rb`;
  }
  return String(amount);
}

function formatRupiahFull(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface IncomeExpenseChartProps {
  totalIncome: number;
  totalExpense: number;
}

export function IncomeExpenseBarChart({ totalIncome, totalExpense }: IncomeExpenseChartProps) {
  const data = [
    { name: "Pemasukan", amount: totalIncome, fill: "var(--primary)" },
    { name: "Pengeluaran", amount: totalExpense, fill: "#f43f5e" },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} vertical={false} />
          <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
          <YAxis stroke="var(--text-secondary)" fontSize={12} tickFormatter={formatRupiahShort} tickLine={false} />
          <Tooltip
            formatter={(value: any) => [formatRupiahFull(Number(value)), "Nominal"]}
            contentStyle={{
              backgroundColor: "var(--card-surface)",
              borderRadius: "16px",
              border: "2px solid var(--border-color)",
              boxShadow: "0 4px 0 0 var(--border-color)",
              color: "var(--text-primary)",
              fontWeight: "bold",
            }}
          />
          <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CategoryPieChartProps {
  categories: CategoryBreakdownItem[];
  title?: string;
}

export function CategoryDonutChart({ categories, title }: CategoryPieChartProps) {
  if (categories.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs font-bold text-text-secondary">
        Belum ada data transaksi
      </div>
    );
  }

  return (
    <div className="w-full h-64 flex flex-col items-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            formatter={(value: any) => [formatRupiahFull(Number(value)), "Nominal"]}
            contentStyle={{
              backgroundColor: "var(--card-surface)",
              borderRadius: "16px",
              border: "2px solid var(--border-color)",
              boxShadow: "0 4px 0 0 var(--border-color)",
              color: "var(--text-primary)",
              fontWeight: "bold",
            }}
          />
          <Pie
            data={categories}
            dataKey="amount"
            nameKey="category_name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
          >
            {categories.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || "var(--primary)"} />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(val) => <span className="text-xs font-bold text-text-primary mr-2">{val}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CashFlowTrendChartProps {
  trend: CashFlowTrendItem[];
}

export function CashFlowAreaChart({ trend }: CashFlowTrendChartProps) {
  if (trend.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs font-bold text-text-secondary">
        Belum ada data arus kas
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trend} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} vertical={false} />
          <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
          <YAxis stroke="var(--text-secondary)" fontSize={11} tickFormatter={formatRupiahShort} tickLine={false} />
          <Tooltip
            formatter={(value: any, name: any) => [
              formatRupiahFull(Number(value)),
              name === "income" ? "Pemasukan" : "Pengeluaran",
            ]}
            contentStyle={{
              backgroundColor: "var(--card-surface)",
              borderRadius: "16px",
              border: "2px solid var(--border-color)",
              boxShadow: "0 4px 0 0 var(--border-color)",
              color: "var(--text-primary)",
              fontWeight: "bold",
            }}
          />
          <Legend
            formatter={(name) => (
              <span className="text-xs font-bold text-text-primary mr-3">
                {name === "income" ? "Pemasukan" : "Pengeluaran"}
              </span>
            )}
          />
          <Area type="monotone" dataKey="income" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
          <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
