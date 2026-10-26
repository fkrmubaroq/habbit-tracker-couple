import { createFileRoute } from "@tanstack/react-router";
import { redirectToGroceryApp } from "../lib/grocery-redirect";

/**
 * Splat counterpart of the `/grocery-list` shim: matches every sub-path
 * (`/grocery-list/manage`, `/grocery-list/settings`, and anything else) and
 * forwards it to the same path inside the standalone grocery app.
 */
export const Route = createFileRoute("/grocery-list/$")({
  beforeLoad: ({ location }) => {
    redirectToGroceryApp(location.pathname);
  },
  component: GroceryRedirectSplat,
});

function GroceryRedirectSplat() {
  return null;
}
