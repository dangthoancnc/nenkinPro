"use client";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

// ─── CVA Variants ────────────────────────────────────────────────────────────
const badgeVariants = cva(
  // Base styles
  "inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors select-none whitespace-nowrap",
  {
    variants: {
      variant: {
        default:  "bg-slate-100  text-slate-700  border-slate-200",
        success:  "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning:  "bg-amber-50   text-amber-700   border-amber-200",
        error:    "bg-red-50     text-red-700     border-red-200",
        info:     "bg-blue-50    text-blue-700    border-blue-200",
        indigo:   "bg-indigo-50  text-indigo-700  border-indigo-200",
        outline:  "bg-transparent text-foreground border-border",
        ghost:    "bg-transparent text-muted-foreground border-transparent",
      },
      size: {
        sm: "text-[10px] px-2    py-0.5",
        md: "text-xs    px-2.5  py-1",
        lg: "text-sm    px-3    py-1.5",
      },
      dot: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      dot: false,
    },
  }
);

// Dot color map
const dotColorMap: Record<string, string> = {
  default: "bg-slate-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error:   "bg-red-500",
  info:    "bg-blue-500",
  indigo:  "bg-indigo-500",
  outline: "bg-foreground",
  ghost:   "bg-muted-foreground",
};

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Show a leading status dot */
  dot?: boolean;
  /** Custom icon before label */
  icon?: React.ReactNode;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  dot = false,
  icon,
  children,
  ...props
}: BadgeProps) {
  const dotColor = dotColorMap[variant ?? "default"] ?? "bg-slate-500";
  return (
    <span
      className={cn(badgeVariants({ variant, size, dot }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "rounded-full shrink-0 animate-pulse",
            size === "sm" ? "w-1.5 h-1.5" : size === "lg" ? "w-2.5 h-2.5" : "w-2 h-2",
            dotColor
          )}
        />
      )}
      {icon && <span className="shrink-0 -ml-0.5">{icon}</span>}
      {children}
    </span>
  );
}

export { badgeVariants };
