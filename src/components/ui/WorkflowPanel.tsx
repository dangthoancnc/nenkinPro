'use client';

import React from 'react';
import { WorkflowTimeline } from './WorkflowTimeline';
import { StatusBadge } from './StatusBadge';
import { ChevronDown } from 'lucide-react';

// ─── Status ordering used in dropdown ────────────────────────────────────────────
export type WorkflowStatus =
  | 'PENDING'
  | 'DRAFT'
  | 'SENT_1ST'
  | 'RECEIVED_1ST'
  | 'SENT_2ND'
  | 'RECEIVED_2ND'
  | 'COMPLETED'
  | 'CANCELLED'

const DROPDOWN_STATUSES: WorkflowStatus[] = [
  'DRAFT', 'SENT_1ST', 'RECEIVED_1ST', 'SENT_2ND', 'RECEIVED_2ND', 'COMPLETED',
]

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  PENDING:      'Cần duyệt',
  DRAFT:        'Bản nháp',
  SENT_1ST:     'Đã gửi Lần 1',
  RECEIVED_1ST: 'Đã nhận Lần 1',
  SENT_2ND:     'Đã gửi Lần 2',
  RECEIVED_2ND: 'Đã nhận Lần 2',
  COMPLETED:    'Hoàn thành',
  CANCELLED:    'Đã hủy',
}

// ─── Props ─────────────────────────────────────────────────────────────────────
export interface WorkflowPanelProps {
  status:    WorkflowStatus
  isEditing: boolean
  onChange:  (status: WorkflowStatus) => void
  /**
   * Milestone dates forwarded to WorkflowTimeline.
   * Keys match WorkflowTimeline `dates` prop.
   */
  dates?: {
    sent1st?:     string | null
    received1st?: string | null
    sent2nd?:     string | null
    received2nd?: string | null
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function WorkflowPanel({ status, isEditing, onChange, dates }: WorkflowPanelProps) {
  const [open, setOpen] = React.useState(false)
  const ref             = React.useRef<HTMLDivElement>(null)

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const options = status === 'CANCELLED'
    ? [...DROPDOWN_STATUSES, 'CANCELLED' as WorkflowStatus]
    : DROPDOWN_STATUSES

  return (
    <div className="space-y-2">

      {/* ── Header row: label + status control ── */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Tiến độ hồ sơ
        </span>

        {isEditing ? (
          // ── Editable dropdown ──
          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-1.5 h-6 pl-2.5 pr-1.5 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 text-[10px] font-bold hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              {STATUS_LABELS[status]}
              <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[150px]">
                {options.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { onChange(s); setOpen(false) }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${
                      s === status ? 'font-bold text-indigo-700 bg-indigo-50/60' : 'text-slate-700'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // ── Read-only badge ──
          <StatusBadge status={status} />
        )}
      </div>

      {/* ── B.17: Visual timeline with milestone dates ── */}
      <WorkflowTimeline
        currentStatus={status}
        dates={dates}
      />
    </div>
  )
}
