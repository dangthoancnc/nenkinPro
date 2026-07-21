import * as React from "react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────
export interface FormFieldProps {
  /** Nhãn hiển thị trên input */
  label?: string
  /** Đánh dấu bắt buộc (*) */
  required?: boolean
  /** Thông báo lỗi */
  error?: string
  /** Ghi chú nhỏ bên dưới (hint) */
  hint?: string
  /** className cho wrapper ngoài */
  className?: string
  children: React.ReactNode
}

// ─── Component ───────────────────────────────────────────────────────────────
export function FormField({
  label,
  required,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {label && (
        <label className="text-xs font-medium text-slate-500 flex items-center gap-0.5">
          {label}
          {required && <span className="text-rose-400 font-bold">*</span>}
        </label>
      )}
      {children}
      {error && (
        <span className="text-[10px] text-rose-500 leading-tight">{error}</span>
      )}
      {hint && !error && (
        <span className="text-[10px] text-slate-400 leading-tight">{hint}</span>
      )}
    </div>
  )
}
