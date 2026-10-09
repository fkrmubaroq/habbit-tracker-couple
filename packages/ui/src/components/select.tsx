import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            "w-full h-11 px-3 py-2 rounded-xl outline-none border-2 border-border-color bg-card-surface text-text-primary font-semibold text-sm appearance-none pr-10 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:border-primary",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-text-primary opacity-50">
          <ChevronDown className="h-4 w-4 stroke-[2.5]" />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
