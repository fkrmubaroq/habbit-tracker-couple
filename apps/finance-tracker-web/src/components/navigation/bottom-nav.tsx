import { Link } from "@tanstack/react-router";
import { isSidebarItemActive, type SidebarItem } from "../ui/sidebar";

export interface BottomNavProps {
  items: SidebarItem[];
  activePath: string;
}

export function BottomNav({ items, activePath }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card-surface border-t-2 border-border-color flex items-center justify-around py-2 px-1 z-40 shadow-lg">
      {items.map((item) => {
        const active = isSidebarItemActive(item, activePath);
        const Icon = item.icon;

        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg font-bold text-xs transition-colors ${
              active ? "text-primary font-black" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Icon className="h-5 w-5 stroke-[2.2]" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
