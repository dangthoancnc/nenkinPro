"use client"

import React, { useMemo } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, AlertTriangle, ArrowRight, Copy } from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────
export type DiffFieldConfig = {
  key: string
  label: string
  required?: boolean
  /** If true, renders as multiline text block */
  multiline?: boolean
}

export type DiffStatus = "match" | "mismatch" | "empty_right" | "empty_both"

function getDiffStatus(left: string, right: string): DiffStatus {
  const l = (left || "").trim()
  const r = (right || "").trim()
  if (!l && !r) return "empty_both"
  if (!r)       return "empty_right"
  if (l === r)  return "match"
  return "mismatch"
}

const diffStyles: Record<DiffStatus, { row: string; leftCell: string; rightCell: string; badge: React.ReactNode }> = {
  match: {
    row:       "bg-emerald-50/40 hover:bg-emerald-50",
    leftCell:  "text-emerald-700 bg-emerald-50 border-emerald-200",
    rightCell: "text-emerald-700 bg-emerald-50 border-emerald-200",
    badge: (
      <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1 py-0.5 rounded">
        <CheckCircle2 className="w-2.5 h-2.5" /> Khớp
      </span>
    ),
  },
  mismatch: {
    row:       "bg-amber-50/60 hover:bg-amber-50 border-l-2 border-l-amber-400",
    leftCell:  "text-slate-600 bg-white border-slate-200",
    rightCell: "text-amber-800 bg-amber-50 border-amber-300 font-semibold",
    badge: (
      <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">
        <AlertTriangle className="w-2.5 h-2.5" /> Lệch
      </span>
    ),
  },
  empty_right: {
    row:       "bg-slate-50 hover:bg-slate-100/70",
    leftCell:  "text-slate-500 bg-white border-slate-200",
    rightCell: "text-slate-300 bg-slate-50 border-dashed border-slate-200 italic",
    badge: (
      <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
        Chưa nhập
      </span>
    ),
  },
  empty_both: {
    row:       "opacity-50 hover:opacity-100",
    leftCell:  "text-slate-300 bg-slate-50 border-slate-100 italic",
    rightCell: "text-slate-300 bg-slate-50 border-slate-100 italic",
    badge: (
      <span className="text-[9px] text-slate-300 bg-slate-100 px-1 py-0.5 rounded">Trống</span>
    ),
  },
}

// ─── Summary badge ────────────────────────────────────────────────────────
function MatchSummary({ fields, left, right }: { fields: DiffFieldConfig[]; left: Record<string, string>; right: Record<string, string> }) {
  const stats = useMemo(() => {
    let match = 0, mismatch = 0, empty = 0
    fields.forEach(f => {
      const s = getDiffStatus(left[f.key] ?? "", right[f.key] ?? "")
      if (s === "match") match++
      else if (s === "mismatch") mismatch++
      else empty++
    })
    return { match, mismatch, empty, total: fields.length }
  }, [fields, left, right])

  const pct = Math.round((stats.match / stats.total) * 100)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-emerald-700">{pct}% khớp</span>
      {stats.mismatch > 0 && (
        <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
          <AlertTriangle className="w-2.5 h-2.5" /> {stats.mismatch} lệch
        </span>
      )}
      {stats.match > 0 && (
        <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
          <CheckCircle2 className="w-2.5 h-2.5" /> {stats.match} khớp
        </span>
      )}
    </div>
  )
}

// ─── Props ─────────────────────────────────────────────────────────
export interface TaxDiffPanelProps {
  fields: DiffFieldConfig[]
  /** Source of truth — AI / NTA extracted data (left column) */
  sourceData: Record<string, string>
  /** Database / editable data (right column) */
  targetData: Record<string, string>
  sourceLabel?: string
  targetLabel?: string
  /** Called when user applies a single field from source → target */
  onSync?: (key: string, value: string) => void
  /** Called when user bulk-applies all mismatched fields */
  onSyncAll?: () => void
  /** Whether sync controls are shown */
  editable?: boolean
  className?: string
}

// ─── Main Component ────────────────────────────────────────────────────
export function TaxDiffPanel({
  fields,
  sourceData,
  targetData,
  sourceLabel = "NTA (AI)",
  targetLabel = "Hệ thống (DB)",
  onSync,
  onSyncAll,
  editable = true,
  className,
}: TaxDiffPanelProps) {
  const hasMismatches = useMemo(
    () => fields.some(f => getDiffStatus(sourceData[f.key] ?? "", targetData[f.key] ?? "") === "mismatch"),
    [fields, sourceData, targetData]
  )

  return (
    <div className={cn("flex flex-col rounded-xl border border-slate-200 overflow-hidden shadow-sm", className)}>

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center bg-slate-900 px-3 py-2 gap-2">
        {/* Source col title */}
        <div className="flex-1 text-center">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            {sourceLabel}
          </span>
        </div>

        {/* Center divider */}
        <div className="flex flex-col items-center gap-1 px-2">
          <MatchSummary fields={fields} left={sourceData} right={targetData} />
          {editable && hasMismatches && onSyncAll && (
            <button
              type="button"
              onClick={onSyncAll}
              className="flex items-center gap-1 text-[9px] font-bold text-amber-300 hover:text-white bg-amber-600/30 hover:bg-amber-600 px-2 py-0.5 rounded-full transition-all cursor-pointer"
            >
              <Copy className="w-2.5 h-2.5" /> Áp dụng tất cả lệch
            </button>
          )}
        </div>

        {/* Target col title */}
        <div className="flex-1 text-center">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
            {targetLabel}
          </span>
        </div>
      </div>

      {/* ── Column sub-headers ─────────────────────────────────── */}
      <div className="grid bg-slate-100 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wider"
        style={{ gridTemplateColumns: "1fr 28px 1fr" }}>
        <div className="px-3 py-1.5 text-emerald-700">Trích xuất tự động</div>
        <div />
        <div className="px-3 py-1.5 text-indigo-700">Dữ liệu đã lưu</div>
      </div>

      {/* ── Field rows ────────────────────────────────────────── */}
      <div className="flex flex-col divide-y divide-slate-100 overflow-y-auto">
        {fields.map((field) => {
          const leftVal  = (sourceData[field.key] ?? "").trim()
          const rightVal = (targetData[field.key] ?? "").trim()
          const status   = getDiffStatus(leftVal, rightVal)
          const style    = diffStyles[status]
          const canSync  = editable && (status === "mismatch" || status === "empty_right") && !!leftVal

          return (
            <div
              key={field.key}
              className={cn("grid transition-colors duration-150", style.row)}
              style={{ gridTemplateColumns: "1fr 28px 1fr" }}
            >
              {/* Left — Source */}
              <div className="px-2.5 py-2 flex flex-col gap-0.5">
                <div className={cn(
                  "text-[10px] px-1.5 py-1 rounded border min-h-[24px] leading-snug break-words",
                  style.leftCell,
                  !leftVal && "italic"
                )}>
                  {leftVal || "Trống"}
                </div>
              </div>

              {/* Center — sync arrow */}
              <div className="flex items-center justify-center">
                {canSync ? (
                  <button
                    type="button"
                    onClick={() => onSync?.(field.key, leftVal)}
                    title="Áp dụng sang DB"
                    className="w-5 h-5 rounded-full bg-amber-400 hover:bg-amber-500 flex items-center justify-center text-white shadow-sm transition-all hover:scale-110 cursor-pointer"
                  >
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                ) : (
                  <div className="w-5 h-5 flex items-center justify-center">
                    {status === "match" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </div>
                )}
              </div>

              {/* Right — Target */}
              <div className="px-2.5 py-2 flex flex-col gap-0.5">
                <div className="flex items-start justify-between gap-1">
                  <div className={cn(
                    "flex-1 text-[10px] px-1.5 py-1 rounded border min-h-[24px] leading-snug break-words",
                    style.rightCell,
                    !rightVal && "italic"
                  )}>
                    {rightVal || "Chưa nhập"}
                  </div>
                  <div className="flex-shrink-0 mt-0.5">
                    {style.badge}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Field label row — shown as first-column label */}
        {/* Note: labels are shown as section dividers for grouped fields */}
      </div>

      {/* ── Field legend ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex-wrap">
        <span className="text-[9px] text-slate-400 font-medium">Chú thích:</span>
        <span className="flex items-center gap-0.5 text-[9px] text-emerald-600">
          <CheckCircle2 className="w-2.5 h-2.5" /> Khớp chính xác
        </span>
        <span className="flex items-center gap-0.5 text-[9px] text-amber-600">
          <AlertTriangle className="w-2.5 h-2.5" /> Lệch / khác nhau
        </span>
        <span className="text-[9px] text-slate-400">○ Chưa nhập</span>
        <span className="text-[9px] text-slate-300">○ Cả hai trống</span>
      </div>
    </div>
  )
}
