import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Wrapper variants ───────────────────────────────────────────────────────
const inputWrapperVariants = cva(
  "flex items-center w-full rounded-md border bg-white transition-all shadow-sm",
  {
    variants: {
      size: {
        sm: "h-7 px-2 text-[11px]",
        md: "h-8 px-2.5 text-xs",
        lg: "h-9 px-3 text-sm",
      },
      state: {
        default:  "border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100",
        error:    "border-rose-400   focus-within:border-rose-500   focus-within:ring-2 focus-within:ring-rose-100   bg-rose-50/30",
        warning:  "border-amber-400  focus-within:border-amber-500  focus-within:ring-2 focus-within:ring-amber-100  bg-amber-50/30",
        verified: "border-emerald-300 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 bg-emerald-50/20",
        disabled: "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed",
      },
    },
    defaultVariants: { size: "md", state: "default" },
  }
)

// ─── Types ───────────────────────────────────────────────────────────────────
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputWrapperVariants> {
  /** Icon hoặc node hiển thị bên trái */
  leftIcon?: React.ReactNode
  /** Icon hoặc node hiển thị bên phải (trước verify button) */
  rightIcon?: React.ReactNode
  /** Text prefix cố định (VD: "¥", "VND") */
  prefix?: string
  /** Text suffix cố định (VD: "%", "JPY") */
  suffix?: string
  /** Trạng thái đã xác nhận khớp */
  verified?: boolean
  /** Callback khi nhấn verify button */
  onVerify?: () => void
  /** Hiện verify button hay không */
  showVerify?: boolean
  /** Thông báo lỗi, hiện dưới input */
  errorMessage?: string
  /** Override state tự động theo disabled / verified / errorMessage */
  state?: "default" | "error" | "warning" | "verified" | "disabled"
}

// ─── Component ───────────────────────────────────────────────────────────────
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      type,
      size = "md",
      state,
      leftIcon,
      rightIcon,
      prefix,
      suffix,
      verified,
      onVerify,
      showVerify = false,
      errorMessage,
      disabled,
      ...props
    },
    ref
  ) => {
    // Tự suy ra state nếu không override
    const resolvedState: "default" | "error" | "warning" | "verified" | "disabled" =
      state ??
      (disabled
        ? "disabled"
        : errorMessage
        ? "error"
        : verified
        ? "verified"
        : "default")

    const inputPadding = {
      sm: "py-0 text-[11px]",
      md: "py-0.5 text-xs",
      lg: "py-1 text-sm",
    }[size ?? "md"]

    return (
      <div className="flex flex-col gap-0.5 w-full">
        <div
          className={cn(
            inputWrapperVariants({ size, state: resolvedState }),
            className
          )}
        >
          {/* Prefix text */}
          {prefix && (
            <span className="text-slate-400 font-medium shrink-0 pr-1 select-none">
              {prefix}
            </span>
          )}

          {/* Left icon */}
          {leftIcon && (
            <span className="text-slate-400 shrink-0 mr-1 flex items-center">
              {leftIcon}
            </span>
          )}

          {/* Native input */}
          <input
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              "flex-1 min-w-0 bg-transparent outline-none placeholder:text-slate-300",
              "disabled:cursor-not-allowed",
              inputPadding
            )}
            {...props}
          />

          {/* Suffix text */}
          {suffix && (
            <span className="text-slate-400 font-medium shrink-0 pl-1 select-none">
              {suffix}
            </span>
          )}

          {/* Right icon */}
          {rightIcon && (
            <span className="text-slate-500 shrink-0 ml-1 flex items-center">
              {rightIcon}
            </span>
          )}

          {/* Verify button */}
          {showVerify && onVerify && (
            <button
              type="button"
              onClick={onVerify}
              className={cn(
                "ml-1 shrink-0 p-0.5 rounded transition-colors flex items-center justify-center",
                verified
                  ? "text-emerald-600 hover:text-emerald-700"
                  : "text-slate-300 hover:text-slate-500"
              )}
              title={verified ? "Đã xác nhận khớp" : "Xác nhận khớp dữ liệu"}
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Error icon inline */}
          {resolvedState === "error" && !showVerify && (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 ml-1" />
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <span className="text-[10px] text-rose-500 flex items-center gap-0.5 mt-0.5">
            {errorMessage}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
