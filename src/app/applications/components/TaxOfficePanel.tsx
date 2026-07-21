'use client';

import React, { useState } from 'react';
import {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
} from 'react-hook-form';
import {
  RefreshCw,
  Plus,
  MapPin,
  Phone,
  Globe,
  Search,
  CheckCircle,
  AlertTriangle,
  Building2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { TaxOfficeDiffCard, DiffField } from '@/components/ui/TaxOfficeDiffCard';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
export interface TaxOfficePanelProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  isEditing: boolean;
  /** Diff rows from parent (NTA vs DB) */
  taxOfficeDiff?: DiffField[];
  /** Callback: lookup NTA from customer postal code */
  onSearchByPostal?: () => Promise<void>;
  /** Callback: open manual NTA search modal */
  onSearchManual?: () => void;
  /** Callback: sync / save tax office to DB */
  onSyncTaxOffice?: () => Promise<void>;
  isSyncing?: boolean;
  isSearching?: boolean;
  /** Verify fields for tax office section */
  verifiedFields?: Record<string, boolean>;
  onToggleVerify?: (key: string) => void;
}

// Tax office verify keys
const TAX_VERIFY_KEYS = [
  'taxOffice_name',
  'taxOffice_postalCode',
  'taxOffice_address',
  'taxOffice_romajiAddress',
  'taxOffice_phone',
  'taxOffice_websiteUrl',
];

// ─────────────────────────────────────────────────────────────────
// Primitive: VerifyBtn (inline, small)
// ─────────────────────────────────────────────────────────────────
const VerifyBtn: React.FC<{ verified: boolean; onToggle: () => void }> = ({ verified, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    title={verified ? 'Đã xác nhận khớp' : 'Xác nhận khớp'}
    className={cn(
      'shrink-0 h-7 w-7 flex items-center justify-center rounded-md border transition-colors',
      verified
        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
        : 'bg-slate-50 border-slate-200 text-slate-300 hover:text-slate-400',
    )}
  >
    <CheckCircle className="w-3.5 h-3.5" />
  </button>
);

// ─────────────────────────────────────────────────────────────────
// Sub: TaxOfficeSearchBar
// ─────────────────────────────────────────────────────────────────
const TaxOfficeSearchBar: React.FC<{
  onSearchByPostal?: () => Promise<void>;
  onSearchManual?: () => void;
  isSearching?: boolean;
}> = ({ onSearchByPostal, onSearchManual, isSearching }) => (
  <div className="px-4 py-2.5 border-b border-slate-100 flex gap-2">
    <button
      type="button"
      disabled={isSearching}
      onClick={onSearchByPostal}
      className={cn(
        'flex-1 flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border text-[11px] font-semibold transition-colors',
        isSearching
          ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
          : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
      )}
    >
      {isSearching ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <MapPin className="w-3.5 h-3.5" />
      )}
      Tra cứu từ mã bưu điện KH
    </button>
    <button
      type="button"
      onClick={onSearchManual}
      className="flex-1 flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border text-[11px] font-semibold bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 transition-colors"
    >
      <Search className="w-3.5 h-3.5" />
      Tra cứu NTA thủ công
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Sub: TaxOfficeSelectorRow
// ─────────────────────────────────────────────────────────────────
const TaxOfficeSelectorRow: React.FC<{
  register: UseFormRegister<any>;
  isEditing: boolean;
  onAddNew?: () => void;
}> = ({ register, isEditing, onAddNew }) => (
  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
    <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
    <select
      {...register('taxOfficeId')}
      disabled={!isEditing}
      className={cn(
        'flex-1 h-8 px-2.5 text-[12px] font-semibold text-slate-700 border border-slate-200 rounded-lg bg-white',
        'focus:outline-none focus:ring-2 focus:ring-indigo-400',
        'disabled:bg-slate-50 disabled:cursor-default transition-colors',
      )}
    >
      <option value="">— Chọn cục thuế —</option>
    </select>
    {isEditing && (
      <button
        type="button"
        onClick={onAddNew}
        className="shrink-0 h-8 px-2.5 flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Mới
      </button>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Sub: TaxOfficeVerifyFields
// ─────────────────────────────────────────────────────────────────
const VERIFY_FIELD_DEFS: Array<{ key: string; label: string; fieldName: string; icon?: React.ReactNode }> = [
  { key: 'taxOffice_name',         label: 'Tên Cục Thuế',        fieldName: 'taxOfficeName' },
  { key: 'taxOffice_postalCode',   label: 'Mã bưu điện',         fieldName: 'taxOfficePostalCode' },
  { key: 'taxOffice_address',      label: 'Địa chỉ (Kanji)',       fieldName: 'taxOfficeAddress' },
  { key: 'taxOffice_romajiAddress',label: 'Địa chỉ (Romaji)',      fieldName: 'taxOfficeRomajiAddress' },
  { key: 'taxOffice_phone',        label: 'Điện thoại',            fieldName: 'taxOfficePhone',  icon: <Phone className="w-3 h-3" /> },
  { key: 'taxOffice_websiteUrl',   label: 'Website NTA',          fieldName: 'taxOfficeWebsiteUrl', icon: <Globe className="w-3 h-3" /> },
];

const TaxOfficeVerifyFields: React.FC<{
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  isEditing: boolean;
  verifiedFields: Record<string, boolean>;
  onToggleVerify: (key: string) => void;
}> = ({ register, watch, isEditing, verifiedFields, onToggleVerify }) => {
  const verifiedCount = TAX_VERIFY_KEYS.filter((k) => verifiedFields[k]).length;
  const allVerified = verifiedCount === TAX_VERIFY_KEYS.length;

  return (
    <div className="px-4 py-3 border-b border-slate-100">
      {/* Section header with progress */}
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
          Thông tin cục thuế
        </p>
        <span className={cn(
          'text-[9px] font-bold px-1.5 py-0.5 rounded-full border',
          allVerified
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200',
        )}>
          {verifiedCount}/{TAX_VERIFY_KEYS.length} đã khớp
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100 rounded-full mb-3 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            allVerified ? 'bg-emerald-400' : 'bg-indigo-400',
          )}
          style={{ width: `${(verifiedCount / TAX_VERIFY_KEYS.length) * 100}%` }}
        />
      </div>

      {/* Field rows */}
      <div className="space-y-2">
        {VERIFY_FIELD_DEFS.map((def) => {
          const val = watch(def.fieldName);
          const isVerified = !!verifiedFields[def.key];

          return (
            <div key={def.key} className="flex items-center gap-1.5">
              <div className="flex-1 min-w-0">
                <label className="text-[9px] font-medium text-slate-400 flex items-center gap-1 mb-0.5">
                  {def.icon}
                  {def.label}
                </label>
                {def.fieldName === 'taxOfficeWebsiteUrl' && val ? (
                  <a
                    href={val}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium truncate"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{val}</span>
                  </a>
                ) : (
                  <input
                    {...register(def.fieldName)}
                    disabled={!isEditing}
                    className={cn(
                      'w-full h-7 px-2 text-[11px] font-medium text-slate-700 border border-slate-200 rounded-md bg-white',
                      'focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-transparent',
                      'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-default',
                      isVerified && 'border-emerald-200 bg-emerald-50/40',
                    )}
                  />
                )}
              </div>
              {/* Only show verify btn when not website (website is read-only) */}
              {def.fieldName !== 'taxOfficeWebsiteUrl' && (
                <VerifyBtn verified={isVerified} onToggle={() => onToggleVerify(def.key)} />
              )}
              {def.fieldName === 'taxOfficeWebsiteUrl' && (
                <VerifyBtn verified={isVerified} onToggle={() => onToggleVerify(def.key)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Sub: DiffSection (collapsible)
// ─────────────────────────────────────────────────────────────────
const DiffSection: React.FC<{ fields: DiffField[] }> = ({ fields }) => {
  const [expanded, setExpanded] = useState(false);
  const mismatchCount = fields.filter(
    (f) => {
      const a = f.ntaValue?.trim();
      const b = f.dbValue?.trim();
      if (!a && !b) return false;
      return a !== b;
    },
  ).length;

  if (fields.length === 0) {
    return (
      <div className="px-4 py-4 flex flex-col items-center gap-2 text-center">
        <Search className="w-8 h-8 text-slate-200" />
        <p className="text-[11px] text-slate-400 font-medium">Chưa có dữ liệu đối chiếu</p>
        <p className="text-[10px] text-slate-300">Nhấn “Tra cứu” để tải dữ liệu NTA</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between mb-2 group"
      >
        <div className="flex items-center gap-2">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
            ⇔ Đối chiếu Cục Thuế
          </p>
          {mismatchCount > 0 ? (
            <span className="flex items-center gap-1 text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200">
              <AlertTriangle className="w-2.5 h-2.5" />
              {mismatchCount} sai lệch
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-100">
              <CheckCircle className="w-2.5 h-2.5" />
              Khớp hoàn toàn
            </span>
          )}
        </div>
        <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {expanded && <TaxOfficeDiffCard fields={fields} />}
      {!expanded && mismatchCount > 0 && (
        <div className="p-2 bg-amber-50 border border-amber-100 rounded-lg text-[10px] text-amber-700 font-medium">
          Có {mismatchCount} trường không khớp giữa NTA và hệ thống. Nhấn để xem chi tiết.
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Sub: TaxOfficeContactBar
// ─────────────────────────────────────────────────────────────────
const TaxOfficeContactBar: React.FC<{ watch: UseFormWatch<any> }> = ({ watch }) => {
  const phone   = watch('taxOfficePhone');
  const address = watch('taxOfficeAddress');
  const website = watch('taxOfficeWebsiteUrl');

  if (!phone && !address && !website) return null;

  return (
    <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-x-4 gap-y-1.5">
      {phone && (
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-indigo-600 transition-colors font-medium"
        >
          <Phone className="w-3 h-3" />
          <span className="font-mono">{phone}</span>
        </a>
      )}
      {address && (
        <button
          type="button"
          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank')}
          className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-indigo-600 transition-colors font-medium max-w-full"
        >
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{address}</span>
        </button>
      )}
      {website && (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[10px] text-indigo-500 hover:text-indigo-700 transition-colors font-medium"
        >
          <Globe className="w-3 h-3" />
          NTA
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Main export: TaxOfficePanel
// ─────────────────────────────────────────────────────────────────
export const TaxOfficePanel: React.FC<TaxOfficePanelProps> = ({
  register,
  watch,
  setValue,
  isEditing,
  taxOfficeDiff = [],
  onSearchByPostal,
  onSearchManual,
  onSyncTaxOffice,
  isSyncing = false,
  isSearching = false,
  verifiedFields = {},
  onToggleVerify = () => {},
}) => {
  const taxOfficeName = watch('taxOfficeName');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-shrink-0">

      {/* ─ Header ──────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">
              Cục Thuế Quản Lý
            </p>
            {taxOfficeName && (
              <p className="text-[12px] font-bold text-slate-700 mt-0.5 leading-tight">
                {taxOfficeName}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="primary"
          size="xs"
          iconLeft={<RefreshCw className={cn('w-3 h-3', isSyncing && 'animate-spin')} />}
          loading={isSyncing}
          onClick={onSyncTaxOffice}
          type="button"
        >
          Lưu đồng bộ
        </Button>
      </div>

      {/* ─ Search bar ───────────────────────────────────── */}
      <TaxOfficeSearchBar
        onSearchByPostal={onSearchByPostal}
        onSearchManual={onSearchManual}
        isSearching={isSearching}
      />

      {/* ─ Tax office selector ──────────────────────────── */}
      <TaxOfficeSelectorRow
        register={register}
        isEditing={isEditing}
      />

      {/* ─ Verify fields ───────────────────────────────── */}
      <TaxOfficeVerifyFields
        register={register}
        watch={watch}
        isEditing={isEditing}
        verifiedFields={verifiedFields}
        onToggleVerify={onToggleVerify}
      />

      {/* ─ Diff section (collapsible) ───────────────────── */}
      <DiffSection fields={taxOfficeDiff} />

      {/* ─ Contact bar (dynamic) ───────────────────────── */}
      <TaxOfficeContactBar watch={watch} />

    </div>
  );
};

export default TaxOfficePanel;
