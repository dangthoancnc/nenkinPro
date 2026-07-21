'use client';

import React from 'react';
import { WorkflowTimeline } from './WorkflowTimeline';
import { StatusBadge } from './StatusBadge';
import { Button } from './Button';
import { ChevronDown } from 'lucide-react';

// ─── Status order ────────────────────────────────────────────────────────────
const STATUS_ORDER = [
  'DRAFT',
  'SENT_1ST',
  'RECEIVED_1ST',
  'SENT_2ND',
  'RECEIVED_2ND',
  'COMPLETED',
] as const;

export type WorkflowStatus = typeof STATUS_ORDER[number] | 'PENDING' | 'CANCELLED';

interface WorkflowPanelProps {
  status: WorkflowStatus;
  isEditing: boolean;
  onChange: (status: WorkflowStatus) => void;
  /** milestone dates to render below timeline */
  dates?: {
    sent1st?: string;
    received1st?: string;
    sent2nd?: string;
    received2nd?: string;
  };
}

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  PENDING:      'Cần duyệt',
  DRAFT:        'Bản nháp',
  SENT_1ST:     'Đã gửi Lần 1',
  RECEIVED_1ST: 'Đã nhận Lần 1',
  SENT_2ND:     'Đã gửi Lần 2',
  RECEIVED_2ND: 'Đã nhận Lần 2',
  COMPLETED:    'Hoàn thành',
  CANCELLED:    'Đã hủy',
};

// Helper: format ISO date → dd/MM/yyyy, return undefined if empty
function fmt(d?: string): string | undefined {
  if (!d) return undefined;
  try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return undefined; }
}

export function WorkflowPanel({ status, isEditing, onChange, dates }: WorkflowPanelProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const allowedStatuses = STATUS_ORDER.filter(s => s !== 'PENDING' && s !== 'CANCELLED') as WorkflowStatus[];
  if (status === 'CANCELLED') allowedStatuses.push('CANCELLED');

  return (
    <div className="space-y-2.5">
      {/* ── Status row ── */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiến độ hồ sơ</span>

        {/* Status badge / editable dropdown */}
        {isEditing ? (
          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-1.5 h-6 pl-2 pr-1.5 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 text-[10px] font-bold hover:bg-indigo-100 transition-colors"
            >
              {STATUS_LABELS[status]}
              <ChevronDown className="w-3 h-3" />
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                {allowedStatuses.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { onChange(s); setOpen(false); }}
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
          <StatusBadge status={status} />
        )}
      </div>

      {/* ── Visual timeline ── */}
      <WorkflowTimeline
        currentStatus={status}
        sent1stDate={fmt(dates?.sent1st)}
        received1stDate={fmt(dates?.received1st)}
        sent2ndDate={fmt(dates?.sent2nd)}
        received2ndDate={fmt(dates?.received2nd)}
      />
    </div>
  );
}
