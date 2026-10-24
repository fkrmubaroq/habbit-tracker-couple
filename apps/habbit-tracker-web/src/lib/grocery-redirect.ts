import { GROCERY_APP_URL } from "../config/apps.config";

/**
 * Grocery lives in its own app now (`apps/grocery-tracker-web`). This maps an
 * old habit-app path to the equivalent grocery path:
 *
 *   /grocery-list          -> <grocery>/
 *   /grocery-list/manage   -> <grocery>/manage
 *   /grocery-list/settings -> <grocery>/settings
 */
export function groceryAppUrlFor(pathname: string): string {
  const suffix = pathname.replace(/^\/grocery-list/, "");
  return `${GROCERY_APP_URL}${suffix}`;
}

export function redirectToGroceryApp(pathname: string): void {
  window.location.replace(groceryAppUrlFor(pathname));
}
