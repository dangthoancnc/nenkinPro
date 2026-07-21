"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────
export type WorkflowStepStatus = "done" | "active" | "pending"

export type WorkflowStep = {
  key: string
  /** Status value mapped to this step becoming 'active' */
  statusKey: string
  label: string
  shortLabel: string
  dateField?: string
  color: {
    done:    string
    active:  string
    pending: string
    line:    string
  }
}

// ─── Step definitions ─────────────────────────────────────────────────────
export const NENKIN_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    key: "draft",
    statusKey: "DRAFT",
    label: "Bản nháp",
    shortLabel: "Nháp",
    color: {
      done:    "bg-slate-400   border-slate-400   text-white",
      active:  "bg-amber-500   border-amber-500   text-white ring-4 ring-amber-100",
      pending: "bg-white       border-slate-200   text-slate-300",
      line:    "bg-slate-300",
    },
  },
  {
    key: "sent_1st",
    statusKey: "SENT_1ST",
    label: "Nộp Lần 1",
    shortLabel: "Nộp L1",
    dateField: "sent1stDate",
    color: {
      done:    "bg-blue-500    border-blue-500    text-white",
      active:  "bg-blue-600    border-blue-600    text-white ring-4 ring-blue-100",
      pending: "bg-white       border-slate-200   text-slate-300",
      line:    "bg-blue-300",
    },
  },
  {
    key: "received_1st",
    statusKey: "RECEIVED_1ST",
    label: "Nhận Lần 1",
    shortLabel: "Nhận L1",
    dateField: "received1stDate",
    color: {
      done:    "bg-indigo-500  border-indigo-500  text-white",
      active:  "bg-indigo-600  border-indigo-600  text-white ring-4 ring-indigo-100",
      pending: "bg-white       border-slate-200   text-slate-300",
      line:    "bg-indigo-300",
    },
  },
  {
    key: "sent_2nd",
    statusKey: "SENT_2ND",
    label: "Nộp Lần 2",
    shortLabel: "Nộp L2",
    dateField: "sent2ndDate",
    color: {
      done:    "bg-purple-500  border-purple-500  text-white",
      active:  "bg-purple-600  border-purple-600  text-white ring-4 ring-purple-100",
      pending: "bg-white       border-slate-200   text-slate-300",
      line:    "bg-purple-300",
    },
  },
  {
    key: "received_2nd",
    statusKey: "RECEIVED_2ND",
    label: "Nhận Lần 2",
    shortLabel: "Nhận L2",
    dateField: "received2ndDate",
    color: {
      done:    "bg-emerald-500 border-emerald-500 text-white",
      active:  "bg-emerald-600 border-emerald-600 text-white ring-4 ring-emerald-100",
      pending: "bg-white       border-slate-200   text-slate-300",
      line:    "bg-emerald-300",
    },
  },
  {
    key: "completed",
    statusKey: "COMPLETED",
    label: "Hoàn thành",
    shortLabel: "Xong",
    color: {
      done:    "bg-green-500   border-green-500   text-white",
      active:  "bg-green-600   border-green-600   text-white ring-4 ring-green-100",
      pending: "bg-white       border-slate-200   text-slate-300",
      line:    "bg-green-300",
    },
  },
]

const STATUS_INDEX: Record<string, number> = {
  DRAFT: 0,
  SENT_1ST: 1,
  RECEIVED_1ST: 2,
  SENT_2ND: 3,
  RECEIVED_2ND: 4,
  COMPLETED: 5,
}

// ─── Helpers ────────────────────────────────────────────────────────────
function getStepStatus(index: number, activeIndex: number): WorkflowStepStatus {
  if (index < activeIndex) return "done"
  if (index === activeIndex) return "active"
  return "pending"
}

function formatDateShort(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return null
    return d.toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" }).replace("/", "/")
  } catch {
    return null
  }
}

// ─── Props ────────────────────────────────────────────────────────────
interface WorkflowTimelineProps {
  /** Current status key e.g. 'DRAFT' | 'SENT_1ST' | ... */
  status: string
  /** Date values keyed by dateField name, e.g. { sent1stDate: '2025-04-10', ... } */
  dates?: Record<string, string | null | undefined>
  /** Whether steps are clickable to change status */
  interactive?: boolean
  /** Called when user clicks a step to change status */
  onStatusChange?: (newStatus: string) => void
  /** Whether to show inline date inputs under each step */
  showDateInputs?: boolean
  /** Called when a date field changes */
  onDateChange?: (field: string, value: string) => void
  className?: string
}

// ─── Component ──────────────────────────────────────────────────────────
export function WorkflowTimeline({
  status,
  dates = {},
  interactive = false,
  onStatusChange,
  showDateInputs = false,
  onDateChange,
  className,
}: WorkflowTimelineProps) {
  const activeIndex = STATUS_INDEX[status] ?? 0

  return (
    <div className={cn("w-full", className)}>
      {/* ── Step row ────────────────────────────────────────── */}
      <div className="flex items-start">
        {NENKIN_WORKFLOW_STEPS.map((step, i) => {
          const stepStatus   = getStepStatus(i, activeIndex)
          const dateVal      = step.dateField ? dates[step.dateField] : null
          const shortDate    = formatDateShort(dateVal)
          const isClickable  = interactive && stepStatus !== "active"
          const colorCls     = step.color[stepStatus]

          return (
            <React.Fragment key={step.key}>
              {/* Step node */}
              <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 44 }}>

                {/* Circle button */}
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStatusChange?.(step.statusKey)}
                  title={isClickable ? `Chuyển sang: ${step.label}` : step.label}
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-200 select-none",
                    colorCls,
                    isClickable && "cursor-pointer hover:scale-110 hover:shadow-md",
                    !isClickable && "cursor-default",
                    stepStatus === "active" && "animate-none" // ring handled by colorCls
                  )}
                >
                  {stepStatus === "done" && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {stepStatus === "active" && (
                    <span className="w-2 h-2 rounded-full bg-white block" />
                  )}
                  {stepStatus === "pending" && (
                    <span className="text-[9px] font-semibold">{i + 1}</span>
                  )}
                </button>

                {/* Label */}
                <span className={cn(
                  "mt-1 text-[9px] font-semibold text-center leading-tight whitespace-nowrap",
                  stepStatus === "done"    && "text-slate-500",
                  stepStatus === "active"  && "text-indigo-700 font-bold",
                  stepStatus === "pending" && "text-slate-400"
                )}>
                  {step.shortLabel}
                </span>

                {/* Date badge — read-only */}
                {!showDateInputs && shortDate && (
                  <span className="mt-0.5 text-[8px] font-mono text-slate-400 bg-slate-100 rounded px-0.5">
                    {shortDate}
                  </span>
                )}

                {/* Date input — editable */}
                {showDateInputs && step.dateField && (
                  <input
                    type="date"
                    value={dateVal || ""}
                    onChange={e => onDateChange?.(step.dateField!, e.target.value)}
                    className="mt-1 w-[52px] text-[8px] border border-slate-200 rounded px-0.5 py-0 text-slate-600 bg-white focus:ring-1 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
                    style={{ fontSize: 8 }}
                  />
                )}
              </div>

              {/* Connector line */}
              {i < NENKIN_WORKFLOW_STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mt-3.5 rounded-full transition-all duration-500",
                    i < activeIndex
                      ? NENKIN_WORKFLOW_STEPS[i + 1].color.line
                      : "bg-slate-200"
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* ── Current status label ──────────────────────────────────── */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
        <span className="text-[9px] text-slate-400 font-medium">
          Bước {activeIndex + 1} / {NENKIN_WORKFLOW_STEPS.length}
        </span>
        <span className={cn(
          "text-[9px] font-bold px-1.5 py-0.5 rounded",
          NENKIN_WORKFLOW_STEPS[activeIndex]?.color.active
            .replace("ring-4", "")
            .replace(/ring-[a-z]+-[0-9]+/, "")
            .trim()
        )}>
          {NENKIN_WORKFLOW_STEPS[activeIndex]?.label ?? status}
        </span>
      </div>
    </div>
  )
}
