import * as React from "react";
import { useLocation } from "@tanstack/react-router";
import { CoreBottomNav } from "./core-bottom-nav";
import { GroceryBottomNav } from "./grocery-bottom-nav";

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const isGroceryApp = location.pathname.startsWith("/grocery-list");

  if (isGroceryApp) {
    return <GroceryBottomNav />;
  }

  return <CoreBottomNav />;
};
