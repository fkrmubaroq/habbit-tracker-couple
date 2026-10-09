import { createRootRouteWithContext, Link, Outlet, useLocation } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  BarChart3,
  Wallet,
  Settings,
  Plus,
  Coins,
} from "lucide-react";
import { useFinanceUIStore } from "../stores/finance-ui.store.js";
import { TransactionFormDialog } from "../components/TransactionFormDialog.js";
import { QuickThemeToggle } from "../components/ThemeSwitcher.js";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const { openTransactionModal } = useFinanceUIStore();

  const navItems = [
    { label: "Dashboard", to: "/", icon: LayoutDashboard },
    { label: "Transaksi", to: "/transactions", icon: ArrowLeftRight },
    { label: "Budget", to: "/budget", icon: PieChart },
    { label: "Laporan", to: "/reports", icon: BarChart3 },
    { label: "Net Worth", to: "/net-worth", icon: Coins },
    { label: "Pengaturan", to: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-shared-bg flex flex-col md:flex-row text-text-primary">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card-surface border-r-2 border-border-color h-screen fixed top-0 left-0 p-5 justify-between z-40 shadow-[1px_0_0_0_var(--border-color)]">
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-highlight border-2 border-border-color flex items-center justify-center text-primary shadow-[0_2px_0_0_var(--border-color)]">
                <Wallet className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-text-primary">
                  Keuangan Pasutri
                </span>
                <span className="text-xs font-semibold text-text-secondary">
                  Finance Tracker
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-highlight text-primary border-2 border-primary shadow-[0_2px_0_0_var(--border-color)] font-extrabold"
                      : "text-text-secondary hover:bg-highlight hover:text-text-primary border-2 border-transparent"
                  }`}
                >
                  <item.icon className="h-5 w-5 stroke-[2.2]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Quick Theme & Action Button */}
        <div className="pt-4 border-t-2 border-border-color flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-text-secondary">Tema:</span>
            <QuickThemeToggle />
          </div>

          <button
            onClick={() => openTransactionModal("expense")}
            className="btn-3d w-full py-3 px-4 rounded-xl font-extrabold flex items-center justify-center gap-2 text-sm shadow-[0_4px_0_0_color-mix(in_srgb,var(--primary)_75%,#000)]"
          >
            <Plus className="h-5 w-5 stroke-[3]" />
            <span>+ Transaksi</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-20 md:pb-6">
        {/* Top Header Mobile */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card-surface border-b-2 border-border-color sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-highlight border border-border-color flex items-center justify-center text-primary">
              <Wallet className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-base text-text-primary">Keuangan Pasutri</span>
          </div>

          <div className="flex items-center gap-2">
            <QuickThemeToggle />
            <button
              onClick={() => openTransactionModal("expense")}
              className="btn-3d py-1.5 px-3 rounded-lg text-xs font-extrabold flex items-center gap-1"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Catat</span>
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card-surface border-t-2 border-border-color flex items-center justify-around py-2 px-1 z-40 shadow-lg">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-bold text-xs transition-colors ${
                active ? "text-primary font-black" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <item.icon className="h-5 w-5 stroke-[2.2]" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Global Transaction Form Dialog */}
      <TransactionFormDialog />
    </div>
  );
}
