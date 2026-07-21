'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────
export type WorkflowStepStatus = 'done' | 'active' | 'pending'

export interface WorkflowStep {
  key:        string
  statusKey:  string
  label:      string
  shortLabel: string
  /** Key name inside the `dates` Record that holds this step's milestone date */
  dateKey?:   string
  dot: {
    done:    string
    active:  string
    pending: string
  }
  line:        string
  labelActive: string
  badgeDone:   string
}

// ─── Step definitions ────────────────────────────────────────────────────────
export const NENKIN_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    key: 'draft', statusKey: 'DRAFT', label: 'Bản nháp', shortLabel: 'Nháp',
    dot:        { done: 'bg-slate-400 border-slate-400 text-white', active: 'bg-amber-500 border-amber-500 text-white ring-4 ring-amber-100', pending: 'bg-white border-slate-200 text-slate-300' },
    line:        'bg-slate-300',
    labelActive: 'text-amber-700 font-bold',
    badgeDone:   'bg-amber-50 text-amber-600',
  },
  {
    key: 'sent_1st', statusKey: 'SENT_1ST', label: 'Nộp Lần 1', shortLabel: 'Nộp L1', dateKey: 'sent1st',
    dot:        { done: 'bg-blue-500 border-blue-500 text-white', active: 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100', pending: 'bg-white border-slate-200 text-slate-300' },
    line:        'bg-blue-300',
    labelActive: 'text-blue-700 font-bold',
    badgeDone:   'bg-blue-50 text-blue-600',
  },
  {
    key: 'received_1st', statusKey: 'RECEIVED_1ST', label: 'Nhận Lần 1', shortLabel: 'Nhận L1', dateKey: 'received1st',
    dot:        { done: 'bg-indigo-500 border-indigo-500 text-white', active: 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100', pending: 'bg-white border-slate-200 text-slate-300' },
    line:        'bg-indigo-300',
    labelActive: 'text-indigo-700 font-bold',
    badgeDone:   'bg-indigo-50 text-indigo-600',
  },
  {
    key: 'sent_2nd', statusKey: 'SENT_2ND', label: 'Nộp Lần 2', shortLabel: 'Nộp L2', dateKey: 'sent2nd',
    dot:        { done: 'bg-purple-500 border-purple-500 text-white', active: 'bg-purple-600 border-purple-600 text-white ring-4 ring-purple-100', pending: 'bg-white border-slate-200 text-slate-300' },
    line:        'bg-purple-300',
    labelActive: 'text-purple-700 font-bold',
    badgeDone:   'bg-purple-50 text-purple-600',
  },
  {
    key: 'received_2nd', statusKey: 'RECEIVED_2ND', label: 'Nhận Lần 2', shortLabel: 'Nhận L2', dateKey: 'received2nd',
    dot:        { done: 'bg-emerald-500 border-emerald-500 text-white', active: 'bg-emerald-600 border-emerald-600 text-white ring-4 ring-emerald-100', pending: 'bg-white border-slate-200 text-slate-300' },
    line:        'bg-emerald-300',
    labelActive: 'text-emerald-700 font-bold',
    badgeDone:   'bg-emerald-50 text-emerald-600',
  },
  {
    key: 'completed', statusKey: 'COMPLETED', label: 'Hoàn thành', shortLabel: 'Xong',
    dot:        { done: 'bg-green-500 border-green-500 text-white', active: 'bg-green-600 border-green-600 text-white ring-4 ring-green-100', pending: 'bg-white border-slate-200 text-slate-300' },
    line:        'bg-green-300',
    labelActive: 'text-green-700 font-bold',
    badgeDone:   'bg-green-50 text-green-600',
  },
]

const STATUS_INDEX: Record<string, number> = {
  PENDING: 0, DRAFT: 0, SENT_1ST: 1, RECEIVED_1ST: 2,
  SENT_2ND: 3, RECEIVED_2ND: 4, COMPLETED: 5,
}

// ─── Helper ──────────────────────────────────────────────────────────────────
function getStepStatus(index: number, activeIndex: number): WorkflowStepStatus {
  if (index < activeIndex)  return 'done'
  if (index === activeIndex) return 'active'
  return 'pending'
}

/** Format ISO or yyyy-mm-dd → 'MM/dd' (ja-JP locale), returns null if invalid */
function fmtShort(val: string | null | undefined): string | null {
  if (!val) return null
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return null
    return d.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })
  } catch { return null }
}

// ─── Props ──────────────────────────────────────────────────────────────────
export interface WorkflowTimelineProps {
  /** Current status key: 'DRAFT' | 'SENT_1ST' | 'RECEIVED_1ST' | 'SENT_2ND' | 'RECEIVED_2ND' | 'COMPLETED' */
  currentStatus: string
  /**
   * Milestone dates keyed by step.dateKey:
   * { sent1st, received1st, sent2nd, received2nd }
   * Values can be ISO string, yyyy-mm-dd, or undefined.
   */
  dates?: {
    sent1st?:     string | null
    received1st?: string | null
    sent2nd?:     string | null
    received2nd?: string | null
  }
  /** Deprecated compat shim — prefer dates above */
  sent1stDate?:     string
  received1stDate?: string
  sent2ndDate?:     string
  received2ndDate?: string
  /** Whether clicking a step changes status */
  interactive?: boolean
  onStatusChange?: (newStatus: string) => void
  className?: string
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function WorkflowTimeline({
  currentStatus,
  dates,
  sent1stDate, received1stDate, sent2ndDate, received2ndDate,
  interactive = false,
  onStatusChange,
  className,
}: WorkflowTimelineProps) {
  // Merge both styles of date props — `dates` object wins over individual props
  const resolvedDates = {
    sent1st:     dates?.sent1st     ?? sent1stDate,
    received1st: dates?.received1st ?? received1stDate,
    sent2nd:     dates?.sent2nd     ?? sent2ndDate,
    received2nd: dates?.received2nd ?? received2ndDate,
  }

  const activeIndex = STATUS_INDEX[currentStatus] ?? 0
  const activeStep  = NENKIN_WORKFLOW_STEPS[activeIndex]

  return (
    <div className={cn('w-full', className)}>

      {/* ── Step row ─────────────────────────────────────────────── */}
      <div className="flex items-start">
        {NENKIN_WORKFLOW_STEPS.map((step, i) => {
          const ss          = getStepStatus(i, activeIndex)
          const dateVal     = step.dateKey ? resolvedDates[step.dateKey as keyof typeof resolvedDates] : null
          const shortDate   = fmtShort(dateVal)
          const isClickable = interactive && ss !== 'active'

          return (
            <React.Fragment key={step.key}>
              {/* ── Node ── */}
              <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 44 }}>

                {/* Dot */}
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStatusChange?.(step.statusKey)}
                  title={isClickable ? `Chuyển sang: ${step.label}` : step.label}
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-200 select-none',
                    step.dot[ss],
                    isClickable && 'cursor-pointer hover:scale-110 hover:shadow-md',
                    !isClickable && 'cursor-default',
                  )}
                >
                  {ss === 'done' && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {ss === 'active'  && <span className="w-2 h-2 rounded-full bg-white block" />}
                  {ss === 'pending' && <span className="text-[9px] font-semibold">{i + 1}</span>}
                </button>

                {/* Short label */}
                <span className={cn(
                  'mt-1 text-[9px] font-semibold text-center leading-tight whitespace-nowrap',
                  ss === 'done'    && 'text-slate-500',
                  ss === 'active'  && step.labelActive,
                  ss === 'pending' && 'text-slate-400',
                )}>
                  {step.shortLabel}
                </span>

                {/* ── B.17: milestone date badge ── */}
                {shortDate ? (
                  <span className={cn(
                    'mt-0.5 text-[8px] font-mono rounded px-0.5 py-px leading-tight',
                    ss === 'done'   && step.badgeDone,
                    ss === 'active' && 'bg-white border border-current text-inherit',
                    ss === 'pending'&& 'text-slate-300',
                  )}>
                    {shortDate}
                  </span>
                ) : (
                  // Placeholder to keep column heights equal
                  <span className="mt-0.5 h-3.5 block" />
                )}
              </div>

              {/* ── Connector line ── */}
              {i < NENKIN_WORKFLOW_STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mt-3.5 rounded-full transition-all duration-500',
                  i < activeIndex ? NENKIN_WORKFLOW_STEPS[i + 1].line : 'bg-slate-200',
                )} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* ── Footer: progress + current label ───────────────────────── */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
        <span className="text-[9px] text-slate-400 font-medium">
          Bước {activeIndex + 1} / {NENKIN_WORKFLOW_STEPS.length}
        </span>
        {activeStep && (
          <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', activeStep.badgeDone)}>
            {activeStep.label}
          </span>
        )}
      </div>
    </div>
  )
}
