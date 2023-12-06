import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const logoVariants = cva(
  "font-bold text-3xl bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text hover:cursor-pointer",
  {
    variants: {
      variant: {
        default: "hover:text-primary",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9",
        sm: "h-8text-xs",
        lg: "h-10",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface LogoProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof logoVariants> {
  asChild?: boolean;
}

const Logo = React.forwardRef<HTMLButtonElement, LogoProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(logoVariants({ variant, size, className }))} ref={ref} {...props}>
        {siteConfig.name}
      </Comp>
    );
  },
);
Logo.displayName = "Logo";

export { Logo, logoVariants };
