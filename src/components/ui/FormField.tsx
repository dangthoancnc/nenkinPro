import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormFieldProps {
  label: string
  required?: boolean
  errorMessage?: string
  className?: string
  children: React.ReactNode
}

/**
 * FormField
 * Wraps label + input + error message into one consistent unit.
 * Usage:
 *   <FormField label="Họ và tên" required errorMessage={errors.fullName?.message}>
 *     <Input {...register('fullName')} />
 *   </FormField>
 */
export function FormField({
  label,
  required,
  errorMessage,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <label className="text-xs font-medium text-slate-500 select-none">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {errorMessage && (
        <span className="text-[10px] text-rose-500 mt-0.5">{errorMessage}</span>
      )}
    </div>
  )
}
