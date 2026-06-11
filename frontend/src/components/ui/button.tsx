import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-98 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-text-primary hover:opacity-90 border-2 border-text-primary shadow-[0_3px_0_0_#1f2937]",
        "3d": "btn-3d",
        "3d-secondary": "btn-3d btn-3d-secondary",
        "3d-accent": "btn-3d btn-3d-accent",
        "3d-white": "btn-3d btn-3d-white",
        outline: "border-2 border-border-color bg-card-surface text-text-primary hover:bg-highlight",
        secondary: "bg-secondary text-text-primary hover:opacity-90 border-2 border-text-primary shadow-[0_3px_0_0_#1f2937]",
        accent: "bg-accent text-text-primary hover:opacity-90 border-2 border-text-primary shadow-[0_3px_0_0_#1f2937]",
        ghost: "hover:bg-highlight hover:text-text-primary",
        link: "text-primary underline-offset-4 hover:underline font-semibold",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
