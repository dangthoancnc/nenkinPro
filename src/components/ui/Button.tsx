"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ─── Variant definitions ─────────────────────────────────────────────────────
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap",
    "rounded-lg font-semibold transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1",
    "disabled:pointer-events-none disabled:opacity-40",
    "select-none",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-indigo-600 text-white border border-indigo-600 shadow-sm hover:bg-indigo-700 active:bg-indigo-800",
        secondary:
          "bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50 active:bg-indigo-100",
        outline:
          "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800 active:bg-slate-100",
        ghost:
          "bg-transparent text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-800",
        danger:
          "bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 active:bg-red-100",
        "danger-solid":
          "bg-red-600 text-white border border-red-600 shadow-sm hover:bg-red-700 active:bg-red-800",
        success:
          "bg-emerald-600 text-white border border-emerald-600 shadow-sm hover:bg-emerald-700",
        warning:
          "bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 active:bg-amber-200",
      },
      size: {
        xs:       "h-7  px-2.5 text-[11px]",
        sm:       "h-8  px-3   text-xs",
        md:       "h-9  px-4   text-sm",
        lg:       "h-10 px-5   text-sm",
        icon:     "h-9  w-9    p-0",
        "icon-sm": "h-7  w-7    p-0",
        "icon-xs": "h-6  w-6    p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Left-side icon element */
  iconLeft?: React.ReactNode
  /** Right-side icon element */
  iconRight?: React.ReactNode
  /** Shows a spinner and disables interaction */
  loading?: boolean
  /** Loading text override (defaults to children) */
  loadingText?: string
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5 text-current shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
      />
    </svg>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      iconLeft,
      iconRight,
      loading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? <Spinner /> : iconLeft}
        {loading && loadingText ? loadingText : children}
        {!loading && iconRight}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
