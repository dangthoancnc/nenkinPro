'use client';

import React from 'react';
import { WorkflowTimeline } from './WorkflowTimeline';
import { StatusBadge } from './StatusBadge';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────
export type WorkflowStatus =
  | 'PENDING'
  | 'DRAFT'
  | 'SENT_1ST'
  | 'RECEIVED_1ST'
  | 'SENT_2ND'
  | 'RECEIVED_2ND'
  | 'COMPLETED'
  | 'CANCELLED';

const DROPDOWN_STATUSES: WorkflowStatus[] = [
  'DRAFT', 'SENT_1ST', 'RECEIVED_1ST', 'SENT_2ND', 'RECEIVED_2ND', 'COMPLETED',
];

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

// ─── Status order ────────────────────────────────────────────────────────────
const STATUS_ORDER: WorkflowStatus[] = [
  'DRAFT', 'SENT_1ST', 'RECEIVED_1ST', 'SENT_2ND', 'RECEIVED_2ND', 'COMPLETED',
];

function statusIndex(s: WorkflowStatus): number {
  return STATUS_ORDER.indexOf(s);
}

// ─── B.19: mapping status → form field key for auto-fill date ────────────────
const STATUS_DATE_FIELD: Partial<Record<WorkflowStatus, string>> = {
  SENT_1ST:     'sent1stDate',
  RECEIVED_1ST: 'received1stDate',
  SENT_2ND:     'sent2ndDate',
  RECEIVED_2ND: 'received2ndDate',
};

// ─── Props ────────────────────────────────────────────────────────────────────
export interface WorkflowPanelProps {
  status:          WorkflowStatus;
  isEditing:       boolean;
  onChange:        (status: WorkflowStatus) => void;
  /** B.19 — called with (fieldName, value) when advancing to auto-fill today's date */
  onAutoFillDate?: (field: string, value: string) => void;
  dates?: {
    sent1st?:     string | null;
    received1st?: string | null;
    sent2nd?:     string | null;
    received2nd?: string | null;
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function WorkflowPanel({
  status,
  isEditing,
  onChange,
  onAutoFillDate,
  dates,
}: WorkflowPanelProps) {
  const [open, setOpen] = React.useState(false);
  const ref             = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const options = status === 'CANCELLED'
    ? [...DROPDOWN_STATUSES, 'CANCELLED' as WorkflowStatus]
    : DROPDOWN_STATUSES;

  // ── B.19: today as YYYY-MM-DD ─────────────────────────────────────────────
  const todayIso = () => new Date().toISOString().split('T')[0];

  // ── B.18 + B.19: click on timeline dot ───────────────────────────────────
  const handleTimelineClick = (newStatus: string) => {
    const next    = newStatus as WorkflowStatus;
    const curIdx  = statusIndex(status);
    const nextIdx = statusIndex(next);
    if (nextIdx === curIdx) return;

    const label     = STATUS_LABELS[next];
    const isAdvance = nextIdx > curIdx;
    const dateField = STATUS_DATE_FIELD[next];

    // ── B.19: check if the date field is empty → offer auto-fill ─────────
    const hasExistingDate = (() => {
      if (!dateField || !dates) return false;
      const map: Record<string, string | null | undefined> = {
        sent1stDate:     dates.sent1st,
        received1stDate: dates.received1st,
        sent2ndDate:     dates.sent2nd,
        received2ndDate: dates.received2nd,
      };
      return !!map[dateField];
    })();

    const autoFillDesc =
      isAdvance && dateField && !hasExistingDate && onAutoFillDate
        ? ` Ngày hôm nay (${todayIso()}) sẽ tự động điền vào mốc ngày tương ứng.`
        : '';

    if (isAdvance) {
      toast(`Chuyển sang "${label}"?`, {
        description: `Tiến độ sẽ được cập nhật trên form. Nhớ lưu hồ sơ để ghi vào CSDL.${autoFillDesc}`,
        action: {
          label: 'Xác nhận',
          onClick: () => {
            onChange(next);
            // ── B.19: auto-fill date if empty ─────────────────────────────
            if (isAdvance && dateField && !hasExistingDate && onAutoFillDate) {
              onAutoFillDate(dateField, todayIso());
              toast.success(`Tiến độ: ${label}`, {
                description: `Đã tự điền ngày ${todayIso()} vào mốc ngày.`,
              });
            } else {
              toast.success(`Tiến độ: ${label}`);
            }
          },
        },
        cancel: { label: 'Hủy', onClick: () => {} },
        duration: 7000,
      });
    } else {
      toast.warning(`Quay lại "${label}"?`, {
        description: 'Điều này sẽ lùi tiến độ. Hãy chắc chắn trước khi xác nhận.',
        action: {
          label: 'Xác nhận',
          onClick: () => {
            onChange(next);
            toast(`Tiến độ đã quay lại: ${label}`);
          },
        },
        cancel: { label: 'Hủy', onClick: () => {} },
        duration: 8000,
      });
    }
  };

  // ── Dropdown onChange (manual select) — B.19 does NOT auto-fill here ─────
  const handleDropdownSelect = (s: WorkflowStatus) => {
    onChange(s);
    setOpen(false);
  };

  return (
    <div className="space-y-2">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Tiến độ hồ sơ
        </span>

        {isEditing ? (
          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-1.5 h-6 pl-2.5 pr-1.5 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 text-[10px] font-bold hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              {STATUS_LABELS[status]}
              <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[152px]">
                {options.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleDropdownSelect(s)}
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

      {/* ── Timeline with milestone dates + interactive dots ── */}
      <WorkflowTimeline
        currentStatus={status}
        dates={dates}
        interactive={isEditing}
        onStatusChange={handleTimelineClick}
      />

      {/* ── Hint when editing ── */}
      {isEditing && (
        <p className="text-[9px] text-slate-400 text-center leading-none