"use client"

import React from "react"
import { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form"
import { ApplicationStatus } from "@prisma/client"
import { User, Calendar, Calculator } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { WorkflowTimeline } from "@/components/ui/WorkflowTimeline"

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  DRAFT:        "Bản nháp",
  PENDING:      "Cần duyệt",
  SENT_1ST:     "Đã gửi Lần 1",
  RECEIVED_1ST: "Đã nhận Lần 1",
  SENT_2ND:     "Đã gửi Lần 2",
  RECEIVED_2ND: "Đã nhận Lần 2",
  COMPLETED:    "Hoàn thành",
  CANCELLED:    "Đã hủy",
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT:        "bg-slate-100 text-slate-600 border-slate-200",
  PENDING:      "bg-amber-50 text-amber-700 border-amber-200",
  SENT_1ST:     "bg-blue-50 text-blue-700 border-blue-200",
  RECEIVED_1ST: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SENT_2ND:     "bg-purple-50 text-purple-700 border-purple-200",
  RECEIVED_2ND: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED:    "bg-green-100 text-green-700 border-green-200",
  CANCELLED:    "bg-red-50 text-red-600 border-red-200",
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function DateField({
  label,
  name,
  register,
  disabled,
}: {
  label: string
  name: string
  register: UseFormRegister<any>
  disabled: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
        <Calendar className="w-3 h-3" />{label}
      </label>
      <input
        type="date"
        {...register(name)}
        disabled={disabled}
        className={cn(
          "h-8 px-2.5 text-[12px] font-medium text-slate-700 border border-slate-200 rounded-lg bg-white",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
          "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-default",
          "transition-colors"
        )}
      />
    </div>
  )
}

function FinanceField({
  label,
  name,
  register,
  disabled,
  tone = "neutral",
  step,
}: {
  label: string
  name: string
  register: UseFormRegister<any>
  disabled: boolean
  tone?: "neutral" | "blue" | "green"
  step?: string
}) {
  const toneClasses = {
    neutral: "bg-white",
    blue:    "bg-blue-50 border-blue-100",
    green:   "bg-emerald-50 border-emerald-100",
  }
  return (
    <div className="flex flex-col gap-1">
      <label className={cn(
        "text-[10px] font-semibold uppercase tracking-wide",
        tone === "blue"  && "text-blue-600",
        tone === "green" && "text-emerald-600",
        tone === "neutral" && "text-slate-400"
      )}>
        {label}
      </label>
      <input
        type="number"
        step={step}
        {...register(name)}
        disabled={disabled}
        className={cn(
          "h-8 px-2.5 text-[12px] font-medium text-slate-700 border border-slate-200 rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
          "disabled:opacity-60 disabled:cursor-default transition-colors",
          toneClasses[tone]
        )}
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface ClientSummaryCardProps {
  register: UseFormRegister<any>
  watch: UseFormWatch<any>
  setValue: UseFormSetValue<any>
  customerCode?: string
  customerName?: string
  dob?: string
  nationality?: string
  isEditing: boolean
}

export function ClientSummaryCard({
  register,
  watch,
  setValue,
  customerCode,
  customerName,
  dob,
  nationality,
  isEditing,
}: ClientSummaryCardProps) {
  const currentStatus = watch("status") || "DRAFT"

  // ─ Financial auto-calculate
  const calculateFees = () => {
    const r1  = parseFloat(watch("received1stJpy")?.toString() || "0")
    const r2  = parseFloat(watch("received2ndJpy")?.toString() || "0")
    const rate = parseFloat(watch("exchangeRate")?.toString()  || "165")
    const feeJpy = (r1 + r2) * 0.2
    setValue("serviceFeeJpy", feeJpy)
    setValue("serviceFeeVnd", feeJpy * rate)
    if (!watch("exchangeRate")) setValue("exchangeRate", 165)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

      {/* ── Client Header ─────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
        {/* Avatar */}
        <div className="w-10 h-12 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 border border-indigo-200 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-indigo-400" />
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-bold text-slate-900 truncate">
              {customerName || "—"}
            </span>
            {customerCode && (
              <span className="text-[10px] font-mono bg-slate-100 text-slate-400 px-2 py-0.5 rounded border border-slate-200">
                #{customerCode}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {dob && <span>NS: {dob}</span>}
            {dob && nationality && <span className="mx-1.5 text-slate-200">·</span>}
            {nationality && <span>GT: {nationality}</span>}
          </div>
        </div>

        {/* Status badge + selector */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Trạng thái</span>
          <select
            {...register("status")}
            disabled={!isEditing}
            className={cn(
              "h-7 pl-2 pr-6 text-[11px] font-bold rounded-lg border appearance-none",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500",
              "disabled:cursor-default transition-colors",
              STATUS_BADGE[currentStatus] ?? STATUS_BADGE.DRAFT
            )}
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Workflow Timeline ──────────────────────────── */}
      <WorkflowTimeline
        currentStatus={currentStatus}
        dates={{
          sent1st:     watch("sent1stDate")    || null,
          received1st: watch("received1stDate") || null,
          sent2nd:     watch("sent2ndDate")    || null,
          received2nd: watch("received2ndDate") || null,
        }}
      />

      {/* ── Date Milestones ────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-2.5">
          Các mốc ngày xử lý
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <DateField label="Nộp Lần 1"  name="sent1stDate"     register={register} disabled={!isEditing} />
          <DateField label="Nhận Lần 1" name="received1stDate" register={register} disabled={!isEditing} />
          <DateField label="Nộp Lần 2"  name="sent2ndDate"     register={register} disabled={!isEditing} />
          <DateField label="Nhận Lần 2" name="received2ndDate" register={register} disabled={!isEditing} />
        </div>
      </div>

      {/* ── Financial Section ──────────────────────────── */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
            Thông tin Tài chính
          </p>
          {isEditing && (
            <Button
              variant="secondary"
              size="xs"
              iconLeft={<Calculator className="w-3 h-3" />}
              onClick={calculateFees}
              type="button"
            >
              Tính phí (20%)
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <FinanceField label="Dự kiến tổng (JPY)" name="totalExpectedJpy" register={register} disabled={!isEditing} />
          <FinanceField label="Tỷ giá (VND/JPY)"    name="exchangeRate"    register={register} disabled={!isEditing} step="0.01" />
          <FinanceField label="Đã nhận L1 (JPY)"    name="received1stJpy"  register={register} disabled={!isEditing} />
          <FinanceField label="Đã nhận L2 (JPY)"    name="received2ndJpy"  register={register} disabled={!isEditing} />
          <FinanceField label="Phí DV (JPY)"         name="serviceFeeJpy"   register={register} disabled={!isEditing} tone="blue" />
          <FinanceField label="Phí DV (VND)"         name="serviceFeeVnd"   register={register} disabled={!isEditing} tone="green" />
        </div>
      </div>

    </div>
  )
}
