import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

export interface CheckboxProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  size?: "sm" | "md";
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, size = "sm", ...props }, ref) => {
    let computedClassName = "";

    if (size === "sm") {
      computedClassName = cn(
        "checkbox-duo",
        checked && "completed animate-heart-pop",
        className
      );
    } else {
      computedClassName = cn(
        "h-12 w-12 flex items-center justify-center rounded-2xl border-2 border-border-color cursor-pointer transition-all shadow-[0_3px_0_0_#1f2937] active:translate-y-[2px] active:shadow-[0_0px_0_0_#1f2937]",
        checked ? "bg-primary text-text-primary" : "bg-card-surface hover:bg-highlight",
        className
      );
    }

    const checkIconSize = size === "sm" ? "h-5 w-5" : "h-6 w-6";

    return (
      <button
        ref={ref}
        type="button"
        className={computedClassName}
        {...props}
      >
        {checked ? <Check className={cn(checkIconSize, "stroke-[3.5]")} /> : null}
      </button>
    );
  }
);

Checkbox.displayName = "Checkbox";
