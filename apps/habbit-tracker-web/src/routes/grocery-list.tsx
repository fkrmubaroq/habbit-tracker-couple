import { createFileRoute, Outlet } from "@tanstack/react-router";
import { GROCERY_APP_URL } from "../config/apps.config";
import { redirectToGroceryApp } from "../lib/grocery-redirect";

/**
 * Compatibility shim: `/grocery-list` used to be a page in this app. It now
 * only forwards to the standalone grocery app so old bookmarks and the
 * `HABIT_APP_URL/grocery-list` link in the finance app keep working. No menu
 * item points here.
 */
export const Route = createFileRoute("/grocery-list")({
  beforeLoad: ({ location }) => {
    redirectToGroceryApp(location.pathname);
  },
  component: GroceryRedirectPage,
});

function GroceryRedirectPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
      <span className="text-4xl">🛒</span>
      <p className="text-sm font-bold text-text-secondary">
        Daftar belanja sekarang punya aplikasi sendiri. Mengalihkan...
      </p>
      <a
        href={GROCERY_APP_URL}
        className="text-sm font-black text-primary underline underline-offset-4"
      >
        Buka Grocery List
      </a>
      <Outlet />
    </div>
  );
}
