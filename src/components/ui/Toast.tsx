"use client"

/**
 * Toast provider + hook wrapper around `sonner`.
 *
 * Usage:
 *   1. Wrap your root layout:  <ToastProvider />
 *   2. In any client component: import { toast } from "@/components/ui/Toast"
 *      toast.success("Lưu thành công!")
 *      toast.error("Có lỗi xảy ra")
 *      toast.warning("Cần xác nhận")
 *      toast.info("Đang xử lý...")
 */

import React from "react"
import { Toaster, toast as sonnerToast } from "sonner"

// ─── Re-export typed helpers ──────────────────────────────────────────────────
export const toast = {
  success: (msg: string, opts?: Parameters<typeof sonnerToast.success>[1]) =>
    sonnerToast.success(msg, { duration: 3000, ...opts }),

  error: (msg: string, opts?: Parameters<typeof sonnerToast.error>[1]) =>
    sonnerToast.error(msg, { duration: 5000, ...opts }),

  warning: (msg: string, opts?: Parameters<typeof sonnerToast.warning>[1]) =>
    sonnerToast.warning(msg, { duration: 4000, ...opts }),

  info: (msg: string, opts?: Parameters<typeof sonnerToast.info>[1]) =>
    sonnerToast.info(msg, { duration: 3000, ...opts }),

  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
}

// ─── Provider component ───────────────────────────────────────────────────────
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "font-sans text-sm rounded-xl border border-slate-200 shadow-lg",
          title: "font-semibold text-slate-800",
          description: "text-slate-500 text-xs mt-0.5",
          actionButton: "bg-indigo-600 text-white text-xs rounded-md px-2 py-1",
          cancelButton: "bg-slate-100 text-slate-600 text-xs rounded-md px-2 py-1",
          closeButton: "text-slate-400 hover:text-slate-600",
        },
      }}
    />
  )
}
