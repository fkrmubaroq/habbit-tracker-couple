import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

export interface SidebarItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /**
   * How the item's active state is matched against `activePath`.
   * - `exact` (default): active only when the path is identical.
   * - `prefix`: active when the path is identical or a child of `to`
   *   (e.g. `/transactions` stays active on `/transactions/create`).
   */
  match?: "exact" | "prefix";
}

export interface SidebarLinkProps {
  to: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Injected by the consuming app so `@repo/ui` stays router-agnostic.
 * Apps pass their router's link component (e.g. TanStack Router's `Link`).
 */
export type SidebarLinkComponent = React.ComponentType<SidebarLinkProps>;

export interface SidebarClassNames {
  body?: string;
  nav?: string;
  item?: string;
  itemActive?: string;
  itemInactive?: string;
  icon?: string;
  label?: string;
}

export interface SidebarProps {
  items: SidebarItem[];
  activePath: string;
  linkComponent: SidebarLinkComponent;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  classNames?: SidebarClassNames;
  ariaLabel?: string;
}

const baseClassName =
  "hidden md:flex flex-col w-64 bg-card-surface border-r-2 border-border-color h-screen fixed top-0 left-0 justify-between z-40";

const defaultClassNames: Required<SidebarClassNames> = {
  body: "flex flex-col gap-5",
  nav: "flex flex-col gap-2",
  item: "flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold border-2 transition-all cursor-pointer",
  itemActive: "bg-highlight text-primary border-primary",
  itemInactive: "border-transparent text-text-secondary hover:bg-highlight hover:text-text-primary",
  icon: "h-5 w-5",
  label: "",
};

export function isSidebarItemActive(item: SidebarItem, activePath: string): boolean {
  if (item.match === "prefix") {
    return activePath === item.to || activePath.startsWith(`${item.to}/`);
  }

  return activePath === item.to;
}

export function Sidebar({
  items,
  activePath,
  linkComponent: LinkComponent,
  header,
  footer,
  className,
  classNames,
  ariaLabel,
}: SidebarProps) {
  const merged = { ...defaultClassNames, ...classNames };

  return (
    <aside className={cn(baseClassName, className)}>
      <div className={merged.body}>
        {header}

        <nav className={merged.nav} aria-label={ariaLabel}>
          {items.map((item) => {
            const active = isSidebarItemActive(item, activePath);
            const Icon = item.icon;

            return (
              <LinkComponent
                key={item.to}
                to={item.to}
                className={cn(merged.item, active ? merged.itemActive : merged.itemInactive)}
              >
                <Icon className={merged.icon} />
                <span className={merged.label}>{item.label}</span>
              </LinkComponent>
            );
          })}
        </nav>
      </div>

      {footer}
    </aside>
  );
}
