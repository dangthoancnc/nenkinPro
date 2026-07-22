"use client"

import React from "react"
import { WorkflowTimeline } from "@/components/ui/WorkflowTimeline"
import { cn } from "@/lib/utils"

interface WorkflowPanelProps {
  status: string
  isEditing: boolean
  dates: {
    sent1stDate?: string | null
    received1stDate?: string | null
    sent2ndDate?: string | null
    received2ndDate?: string | null
  }
  onStatusChange: (newStatus: string) => void
  onDateChange: (field: string, value: string) => void
  className?: string
}

/**
 * WorkflowPanel
 * Self-contained panel used inside Panel 3A of the detail page.
 * Shows the WorkflowTimeline with optional interactivity.
 */
export function WorkflowPanel({
  status,
  isEditing,
  dates,
  onStatusChange,
  onDateChange,
  className,
}: WorkflowPanelProps) {
  return (
    <div className={cn(
      "border border-slate-100 rounded-xl bg-slate-50/40 p-3",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Tiến độ xử lý
        </span>
        {isEditing && (
          <span className="text-[9px] text-indigo-500 font-medium">
            Nhấp vào bước để chuyển trạng thái
          </span>
        )}
      </div>
      <WorkflowTimeline
        currentStatus={status}
        dates={dates ? {
          sent1st: dates.sent1stDate,
          received1st: dates.received1stDate,
          sent2nd: dates.sent2ndDate,
          received2nd: dates.received2ndDate,
        } : undefined}
        interactive={isEditing}
        onStatusChange={onStatusChange}
      />
    </div>
  )
}
