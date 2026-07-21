'use client';

import React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import {
  User,
  Calendar,
  Calculator,
  TrendingUp,
  CheckCircle2,
  Clock,
  Circle,
  PlaneTakeoff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// ─────────────────────────────────────────────────────────────────
// Status Config
// ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; badge: string; selectCls: string }> = {
  DRAFT:        { label: 'Bản nháp',       badge: 'bg-slate-100 text-slate-600 ring-slate-200',     selectCls: 'bg-slate-100 text-slate-700 border-slate-300' },
  PENDING:      { label: 'Cần duyệt',      badge: 'bg-amber-50 text-amber-700 ring-amber-200',       selectCls: 'bg-amber-50 text-amber-800 border-amber-300' },
  SENT_1ST:     { label: 'Đã gửi L1',       badge: 'bg-blue-50 text-blue-700 ring-blue-200',         selectCls: 'bg-blue-50 text-blue-800 border-blue-300' },
  RECEIVED_1ST: { label: 'Đã nhận L1',      badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200',   selectCls: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
  SENT_2ND:     { label: 'Đã gửi L2',       badge: 'bg-purple-50 text-purple-700 ring-purple-200',   selectCls: 'bg-purple-50 text-purple-800 border-purple-300' },
  RECEIVED_2ND: { label: 'Đã nhận L2',      badge: 'bg-teal-50 text-teal-700 ring-teal-200',         selectCls: 'bg-teal-50 text-teal-800 border-teal-300' },
  COMPLETED:    { label: 'Hoàn thành',      badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', selectCls: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  CANCELLED:    { label: 'Đã hủy',         badge: 'bg-rose-50 text-rose-600 ring-rose-200',         selectCls: 'bg-rose-50 text-rose-700 border-rose-300' },
};

// Ordered workflow steps for timeline rendering
const WORKFLOW_STEPS: Array<{
  key: string;
  label: string;
  submittedKey?: string;
  receivedKey?: string;
}> = [
  { key: 'DRAFT',        label: 'Tạo hồ sơ' },
  { key: 'SENT_1ST',     label: 'Nộp Lần 1',   submittedKey: 'sent1stDate',    receivedKey: 'received1stDate' },
  { key: 'RECEIVED_1ST', label: 'Nhận Lần 1',  submittedKey: 'sent1stDate',    receivedKey: 'received1stDate' },
  { key: 'SENT_2ND',     label: 'Nộp Lần 2',   submittedKey: 'sent2ndDate',    receivedKey: 'received2ndDate' },
  { key: 'RECEIVED_2ND', label: 'Nhận Lần 2',  submittedKey: 'sent2ndDate',    receivedKey: 'received2ndDate' },
  { key: 'COMPLETED',    label: 'Hoàn thành' },
];

const STATUS_ORDER = Object.keys(STATUS_CONFIG);
const statusIndex = (s: string) => STATUS_ORDER.indexOf(s);

// ─────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────
export interface ClientWorkspacePanelProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  isEditing: boolean;
  // Client display data (read-only, from DB)
  customerCode?: string;
  customerName?: string;
  dob?: string;
  nationality?: string;
  avatarUrl?: string;
}

// ─────────────────────────────────────────────────────────────────
// Primitive: DateField
// ─────────────────────────────────────────────────────────────────
const DateField: React.FC<{
  label: string;
  name: string;
  register: UseFormRegister<any>;
  disabled: boolean;
}> = ({ label, name, register, disabled }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
      <Calendar className="w-3 h-3" />
      {label}
    </label>
    <input
      type="date"
      {...register(name)}
      disabled={disabled}
      className={cn(
        'h-8 px-2.5 text-[12px] font-medium text-slate-700 border border-slate-200 rounded-lg bg-white w-full',
        'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent',
        'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-default transition-colors',
      )}
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Primitive: FinanceField
// ─────────────────────────────────────────────────────────────────
const TONE_CLASSES = {
  neutral: { bg: 'bg-white border-slate-200',           label: 'text-slate-400' },
  blue:    { bg: 'bg-blue-50 border-blue-100',           label: 'text-blue-600' },
  green:   { bg: 'bg-emerald-50 border-emerald-100',     label: 'text-emerald-600' },
  amber:   { bg: 'bg-amber-50 border-amber-100',         label: 'text-amber-600' },
};

const FinanceField: React.FC<{
  label: string;
  name: string;
  register: UseFormRegister<any>;
  disabled: boolean;
  tone?: keyof typeof TONE_CLASSES;
  step?: string;
  prefix?: string;
}> = ({ label, name, register, disabled, tone = 'neutral', step, prefix }) => {
  const t = TONE_CLASSES[tone];
  return (
    <div className="flex flex-col gap-1">
      <label className={cn('text-[10px] font-semibold uppercase tracking-wide', t.label)}>
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type="number"
          step={step}
          {...register(name)}
          disabled={disabled}
          className={cn(
            'h-8 w-full text-[12px] font-medium text-slate-700 border rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent',
            'disabled:opacity-60 disabled:cursor-default transition-colors',
            prefix ? 'pl-6 pr-2' : 'px-2.5',
            t.bg,
          )}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Sub: ClientHeader
// ─────────────────────────────────────────────────────────────────
const ClientHeader: React.FC<{
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  isEditing: boolean;
  customerCode?: string;
  customerName?: string;
  dob?: string;
  nationality?: string;
  avatarUrl?: string;
  departureDate?: string;
}> = ({ register, watch, isEditing, customerCode, customerName, dob, nationality, avatarUrl, departureDate }) => {
  const currentStatus = watch('status') || 'DRAFT';
  const cfg = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG.DRAFT;

  return (
    <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={customerName || 'Avatar'}
              className="w-12 h-14 rounded-xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-200"
            />
          ) : (
            <div className="w-12 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-50 border border-indigo-100 flex items-center justify-center">
              <User className="w-6 h-6 text-indigo-300" />
            </div>
          )}
          {/* Status dot */}
          <span
            className={cn(
              'absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white',
              currentStatus === 'COMPLETED' ? 'bg-emerald-500'
              : currentStatus === 'CANCELLED' ? 'bg-rose-400'
              : currentStatus === 'PENDING' ? 'bg-amber-400'
              : 'bg-blue-400',
            )}
          />
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[15px] font-bold text-slate-900 leading-tight truncate">
              {customerName || '—'}
            </span>
            {customerCode && (
              <span className="text-[9px] font-mono bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 tracking-wider">
                #{customerCode}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {dob && (
              <span className="text-[10px] text-slate-400">
                NS: <span className="font-medium text-slate-600">{dob}</span>
              </span>
            )}
            {nationality && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                {nationality}
              </span>
            )}
            {departureDate && (
              <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100 font-medium flex items-center gap-1">
                <PlaneTakeoff className="w-2.5 h-2.5" />
                XC: {departureDate}
              </span>
            )}
          </div>
        </div>

        {/* Status select */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Trạng thái</span>
          <select
            {...register('status')}
            disabled={!isEditing}
            className={cn(
              'h-7 pl-2.5 pr-6 text-[11px] font-bold rounded-lg border appearance-none',
              'focus:outline-none focus:ring-2 focus:ring-indigo-400',
              'disabled:cursor-default transition-colors',
              cfg.selectCls,
            )}
          >
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Sub: ProgressTimeline
// ─────────────────────────────────────────────────────────────────
const ProgressTimeline: React.FC<{ currentStatus: string; watch: UseFormWatch<any> }> = ({
  currentStatus,
  watch,
}) => {
  const curIdx = statusIndex(currentStatus);
  const displaySteps = WORKFLOW_STEPS.filter(
    (s) => s.key !== 'RECEIVED_1ST' && s.key !== 'RECEIVED_2ND',
  );

  return (
    <div className="px-4 py-3 border-b border-slate-100">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-3">Tiến độ xử lý</p>
      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-slate-100" />

        <div className="space-y-2">
          {displaySteps.map((step, i) => {
            const stepIdx = statusIndex(step.key);
            const isDone    = stepIdx < curIdx;
            const isCurrent = step.key === currentStatus;
            const isPending = stepIdx > curIdx;

            const dateVal = step.submittedKey ? watch(step.submittedKey) : null;
            const recvVal = step.receivedKey  ? watch(step.receivedKey)  : null;

            return (
              <div key={step.key} className="flex items-start gap-2.5 relative z-10">
                {/* Node */}
                <div
                  className={cn(
                    'w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                    isDone    && 'bg-emerald-500 border-emerald-500 text-white',
                    isCurrent && 'bg-indigo-500 border-indigo-500 text-white ring-4 ring-indigo-100',
                    isPending && 'bg-white border-slate-200 text-slate-300',
                  )}
                >
                  {isDone    ? <CheckCircle2 className="w-3 h-3" /> :
                   isCurrent ? <Clock className="w-3 h-3" /> :
                               <Circle className="w-2.5 h-2.5" />}
                </div>

                {/* Label + date */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <span
                      className={cn(
                        'text-[11px] font-semibold leading-tight',
                        isDone    && 'text-emerald-700',
                        isCurrent && 'text-indigo-700',
                        isPending && 'text-slate-300',
                      )}
                    >
                      {step.label}
                    </span>
                    {(dateVal || recvVal) && (
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {recvVal || dateVal}
                      </span>
                    )}
                  </div>
                  {isCurrent && (
                    <span className="text-[9px] text-indigo-400 font-medium">• Đang xử lý</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Sub: DateMilestones
// ─────────────────────────────────────────────────────────────────
const DateMilestones: React.FC<{
  register: UseFormRegister<any>;
  isEditing: boolean;
}> = ({ register, isEditing }) => (
  <div className="px-4 py-3 border-b border-slate-100">
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-2.5">
      Các mốc ngày xử lý
    </p>
    <div className="grid grid-cols-2 gap-2">
      <DateField label="Nộp Lần 1"  name="sent1stDate"     register={register} disabled={!isEditing} />
      <DateField label="Nhận Lần 1" name="received1stDate" register={register} disabled={!isEditing} />
      <DateField label="Nộp Lần 2"  name="sent2ndDate"     register={register} disabled={!isEditing} />
      <DateField label="Nhận Lần 2" name="received2ndDate" register={register} disabled={!isEditing} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Sub: FinanceSection
// ─────────────────────────────────────────────────────────────────
const FinanceSection: React.FC<{
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  isEditing: boolean;
}> = ({ register, watch, setValue, isEditing }) => {
  const calculateFees = () => {
    const r1   = parseFloat(watch('received1stJpy')?.toString() || '0');
    const r2   = parseFloat(watch('received2ndJpy')?.toString() || '0');
    const rate = parseFloat(watch('exchangeRate')?.toString()   || '165');
    const feeJpy = (r1 + r2) * 0.2;
    setValue('serviceFeeJpy', feeJpy);
    setValue('serviceFeeVnd', feeJpy * rate);
    if (!watch('exchangeRate')) setValue('exchangeRate', 165);
  };

  const r1  = parseFloat(watch('received1stJpy')?.toString() || '0');
  const r2  = parseFloat(watch('received2ndJpy')?.toString() || '0');
  const hasReceipt = r1 > 0 || r2 > 0;

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
            Thông tin Tài chính
          </p>
        </div>
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

      <div className="grid grid-cols-2 gap-2">
        <FinanceField label="Dự kiến tổng (JPY)" name="totalExpectedJpy" register={register} disabled={!isEditing} />
        <FinanceField label="Tỷ giá (VND/JPY)"    name="exchangeRate"    register={register} disabled={!isEditing} step="0.01" />
        <FinanceField label="Đã nhận L1 (JPY)"    name="received1stJpy"  register={register} disabled={!isEditing} />
        <FinanceField label="Đã nhận L2 (JPY)"    name="received2ndJpy"  register={register} disabled={!isEditing} />
        <FinanceField
          label="Phí DV (JPY)"
          name="serviceFeeJpy"
          register={register}
          disabled={!isEditing}
          tone={hasReceipt ? 'blue' : 'neutral'}
        />
        <FinanceField
          label="Phí DV (VND)"
          name="serviceFeeVnd"
          register={register}
          disabled={!isEditing}
          tone={hasReceipt ? 'green' : 'neutral'}
        />
      </div>

      {/* Summary chip */}
      {hasReceipt && (
        <div className="mt-2.5 p-2 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
          <span className="text-[10px] text-indigo-600 font-semibold">
            Tổng đã nhận: {(r1 + r2).toLocaleString()} JPY
          </span>
          <span className="text-[10px] text-indigo-400">
            = {((r1 + r2) * 0.2).toLocaleString()} JPY phí (20%)
          </span>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Main export: ClientWorkspacePanel
// ─────────────────────────────────────────────────────────────────
export const ClientWorkspacePanel: React.FC<ClientWorkspacePanelProps> = ({
  register,
  watch,
  setValue,
  isEditing,
  customerCode,
  customerName,
  dob,
  nationality,
  avatarUrl,
}) => {
  const currentStatus = watch('status') || 'DRAFT';
  const departureDate = watch('departureDate');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

      {/* 1 — Client header (avatar + name + status select) */}
      <ClientHeader
        register={register}
        watch={watch}
        isEditing={isEditing}
        customerCode={customerCode}
        customerName={customerName}
        dob={dob}
        nationality={nationality}
        avatarUrl={avatarUrl}
        departureDate={departureDate}
      />

      {/* 2 — Visual progress timeline */}
      <ProgressTimeline currentStatus={currentStatus} watch={watch} />

      {/* 3 — Date milestones (editable) */}
      <DateMilestones register={register} isEditing={isEditing} />

      {/* 4 — Finance section */}
      <FinanceSection
        register={register}
        watch={watch}
        setValue={setValue}
        isEditing={isEditing}
      />

    </div>
  );
};

export default ClientWorkspacePanel;
