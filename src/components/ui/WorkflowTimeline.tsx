"use client"

import React from "react"
import { cn } from "@/lib/utils"

export type WorkflowStep = {
  key: string
  label: string
  sublabel?: string
  date?: string | null
}

export type WorkflowStatus = "done" | "active" | "pending"

function getStepStatus(
  index: number,
  activeIndex: number
): WorkflowStatus {
  if (index < activeIndex) return "done"
  if (index === activeIndex) return "active"
  return "pending"
}

const stepIcon = (status: WorkflowStatus, index: number) => {
  if (status === "done") return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
  if (status === "active") return <span className="text-[10px] font-black">{index + 1}</span>
  return <span className="text-[10px] font-semibold text-slate-400">{index + 1}</span>
}

export const NENKIN_STEPS: WorkflowStep[] = [
  { key: "submitted_1", label: "Nộp L1", sublabel: "Lần 1" },
  { key: "received_1", label: "Nhận L1", sublabel: "Lần 1" },
  { key: "submitted_2", label: "Nộp L2", sublabel: "Lần 2" },
  { key: "received_2", label: "Nhận L2", sublabel: "Lần 2" },
  { key: "completed", label: "Hoàn thành", sublabel: "Xong" },
]

const STATUS_ACTIVE_INDEX: Record<string, number> = {
  DRAFT: 0,
  SENT_1ST: 1,
  RECEIVED_1ST: 2,
  SENT_2ND: 3,
  RECEIVED_2ND: 4,
  COMPLETED: 5,
}

interface WorkflowTimelineProps {
  /** Prisma status string, e.g. 'DRAFT' | 'SENT_1ST' | ... */
  status: string
  /** Optional dates to show under each step */
  dates?: Record<string, string | null>
  className?: string
}

export function WorkflowTimeline({
  status,
  dates = {},
  className,
}: WorkflowTimelineProps) {
  const activeIndex = STATUS_ACTIVE_INDEX[status] ?? 0

  return (
    <div className={cn("flex items-start px-4 py-3 border-b border-slate-100", className)}>
      {NENKIN_STEPS.map((step, i) => {
        const stepStatus = getStepStatus(i, activeIndex)
        const date = dates[step.key]

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center min-w-[44px]">
              {/* Circle */}
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all",
                  stepStatus === "done" && "bg-emerald-500 border-emerald-500 text-white shadow-sm",
                  stepStatus === "active" &&
                    "bg-indigo-600 border-indigo-600 text-white shadow-[0_0_0_4px_rgba(79,70,229,0.15)]",
                  stepStatus === "pending" && "bg-white border-slate-200 text-slate-300"
                )}
              >
                {stepIcon(stepStatus, i)}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "mt-1.5 text-[9px] font-semibold text-center leading-tight whitespace-nowrap",
                  stepStatus === "done" && "text-emerald-600",
                  stepStatus === "active" && "text-indigo-600 font-bold",
                  stepStatus === "pending" && "text-slate-400"
                )}
              >
                {step.label}
              </span>

              {/* Date */}
              {date && (
                <span className="mt-0.5 text-[8px] text-slate-400 font-mono">
                  {date}
                </span>
              )}
            </div>

            {/* Connector line */}
            {i < NENKIN_STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mt-3.5 transition-colors",
                  i < activeIndex ? "bg-emerald-400" : "bg-slate-200"
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
