'use client';

import React from 'react';
import {
  UseFormRegister,
  FieldErrors,
  UseFormSetValue,
  UseFormWatch,
  UseFieldArrayRemove,
  FieldArrayWithId,
} from 'react-hook-form';
import {
  CheckCircle,
  AlertCircle,
  MapPin,
  Search,
  Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { BankAutocomplete } from './BankAutocomplete';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
export interface DocumentFormPanelProps {
  activeDoc: string;
  isEditing: boolean;
  isNew: boolean;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  bankFields: FieldArrayWithId<any, 'bankAccounts', 'id'>[];
  removeBank: UseFieldArrayRemove;
  verifiedFields: Record<string, boolean>;
  onToggleVerify: (field: string) => void;
  manualConfirmed: boolean;
  onManualConfirmedChange: (v: boolean) => void;
  onNtaSearch: (zip: string | null | undefined) => void;
}

// ─────────────────────────────────────────────────────────────────
// Primitive: VerifyBtn
// ─────────────────────────────────────────────────────────────────
const VerifyBtn: React.FC<{
  fieldKey: string;
  verified: boolean;
  onToggle: () => void;
}> = ({ verified, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    title={verified ? 'Đã xác nhận khớp' : 'Xác nhận khớp dữ liệu'}
    className={[
      'shrink-0 h-8 w-8 flex items-center justify-center rounded-md border transition-colors',
      verified
        ? 'bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100'
        : 'bg-slate-50 border-slate-200 text-slate-300 hover:bg-slate-100 hover:text-slate-500',
    ].join(' ')}
  >
    <CheckCircle className="w-4 h-4" />
  </button>
);

// ─────────────────────────────────────────────────────────────────
// Primitive: FieldRow
// ─────────────────────────────────────────────────────────────────
const FieldRow: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ label, error, children, actions }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-slate-500">{label}</label>
    <div className="flex gap-1.5 items-center">
      <div className="flex-1 min-w-0">{children}</div>
      {actions}
    </div>
    {error && <span className="text-[10px] text-rose-500">{error}</span>}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Primitive: SectionHeader
// ─────────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ title: string; verified?: boolean }> = ({ title, verified }) => (
  <div
    className={[
      'flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-1 border',
      verified === true
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : verified === false
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : 'bg-slate-50 text-slate-500 border-slate-100',
    ].join(' ')}
  >
    <span className="flex items-center gap-1.5">
      <CheckCircle
        className={[
          'w-3.5 h-3.5',
          verified === true ? 'text-emerald-600' : 'text-slate-300 animate-pulse',
        ].join(' ')}
      />
      {title}
    </span>
    {verified !== undefined && (
      <span>{verified ? 'ĐÃ DUYỆT KHỚP' : 'CHƯA DUYỆT KHỚP'}</span>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// ZairyuForm — Thẻ Ngoại Kiều
// ─────────────────────────────────────────────────────────────────
const ZairyuForm: React.FC<
  Pick<DocumentFormPanelProps,
    'register' | 'errors' | 'watch' | 'isEditing' | 'verifiedFields' | 'onToggleVerify' | 'onNtaSearch'
  >
> = ({ register, errors, watch, isEditing, verifiedFields, onToggleVerify, onNtaSearch }) => {
  const verifyKeys = ['fullName', 'dob', 'cardNumber', 'zairyuAddress', 'postalCode'];
  const isVerified = verifyKeys.every((k) => verifiedFields[k]);

  return (
    <div className="space-y-3">
      <SectionHeader title="Thẻ Ngoại Kiều" verified={isVerified} />

      <FieldRow
        label="Họ và tên *"
        error={errors.fullName?.message as string}
        actions={
          <VerifyBtn fieldKey="fullName" verified={!!verifiedFields['fullName']} onToggle={() => onToggleVerify('fullName')} />
        }
      >
        <Input {...register('fullName')} disabled={!isEditing} className={`h-8 text-xs ${errors.fullName ? 'border-rose-400' : ''}`} />
      </FieldRow>

      <FieldRow
        label="Ngày sinh *"
        error={errors.dob?.message as string}
        actions={
          <VerifyBtn fieldKey="dob" verified={!!verifiedFields['dob']} onToggle={() => onToggleVerify('dob')} />
        }
      >
        <Input type="date" {...register('dob')} disabled={!isEditing} className={`h-8 text-xs ${errors.dob ? 'border-rose-400' : ''}`} />
      </FieldRow>

      <FieldRow label="Quốc tịch">
        <Input {...register('nationality')} disabled={!isEditing} className="h-8 text-xs" />
      </FieldRow>

      <FieldRow
        label="Số thẻ ngoại kiều"
        actions={
          <VerifyBtn fieldKey="cardNumber" verified={!!verifiedFields['cardNumber']} onToggle={() => onToggleVerify('cardNumber')} />
        }
      >
        <Input {...register('cardNumber')} disabled={!isEditing} className="h-8 text-xs" />
      </FieldRow>

      <FieldRow label="Mã số cá nhân (My Number)">
        <Input {...register('myNumber')} disabled={!isEditing} className="h-8 text-xs" />
      </FieldRow>

      <FieldRow
        label="Địa chỉ trên thẻ (Kanji)"
        actions={
          <>
            {watch('zairyuAddress') && (
              <button
                type="button"
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(watch('zairyuAddress') || '')}`, '_blank')}
                title="Mở Google Maps"
                className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                <MapPin className="w-4 h-4" />
              </button>
            )}
            <VerifyBtn fieldKey="zairyuAddress" verified={!!verifiedFields['zairyuAddress']} onToggle={() => onToggleVerify('zairyuAddress')} />
          </>
        }
      >
        <Input {...register('zairyuAddress')} disabled={!isEditing} className="h-8 text-xs" />
      </FieldRow>

      <FieldRow
        label="Mã Bưu Điện"
        actions={
          <>
            <button
              type="button"
              onClick={() => onNtaSearch(watch('postalCode'))}
              title="Tra cứu Cục thuế theo mã bưu điện"
              className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
            <VerifyBtn fieldKey="postalCode" verified={!!verifiedFields['postalCode']} onToggle={() => onToggleVerify('postalCode')} />
          </>
        }
      >
        <Input {...register('postalCode')} disabled={!isEditing} placeholder="VD: 4530015" className="h-8 text-xs font-mono" />
      </FieldRow>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// PassportForm — Hộ chiếu
// ─────────────────────────────────────────────────────────────────
const PassportForm: React.FC<
  Pick<DocumentFormPanelProps, 'register' | 'errors' | 'isEditing' | 'verifiedFields' | 'onToggleVerify'>
> = ({ register, errors, isEditing, verifiedFields, onToggleVerify }) => (
  <div className="space-y-3">
    <SectionHeader title="Hộ Chiếu" />

    <FieldRow
      label="Họ và tên *"
      error={errors.fullName?.message as string}
      actions={
        <VerifyBtn fieldKey="fullName" verified={!!verifiedFields['fullName']} onToggle={() => onToggleVerify('fullName')} />
      }
    >
      <Input {...register('fullName')} disabled={!isEditing} className={`h-8 text-xs ${errors.fullName ? 'border-rose-400' : ''}`} />
    </FieldRow>

    <FieldRow
      label="Ngày sinh *"
      error={errors.dob?.message as string}
      actions={
        <VerifyBtn fieldKey="dob" verified={!!verifiedFields['dob']} onToggle={() => onToggleVerify('dob')} />
      }
    >
      <Input type="date" {...register('dob')} disabled={!isEditing} className={`h-8 text-xs ${errors.dob ? 'border-rose-400' : ''}`} />
    </FieldRow>

    <FieldRow label="Quốc tịch">
      <Input {...register('nationality')} disabled={!isEditing} className="h-8 text-xs" />
    </FieldRow>

    <div className="grid grid-cols-2 gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Giới tính</label>
        <select {...register('sex')} disabled={!isEditing} className="h-8 rounded-md border border-input px-2 text-xs bg-transparent">
          <option value="">Chọn...</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Số điện thoại</label>
        <Input {...register('phone')} disabled={!isEditing} className="h-8 text-xs" />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Ngày cấp hộ chiếu</label>
        <Input type="date" {...register('passportIssueDate')} disabled={!isEditing} className="h-8 text-xs" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Ngày hết hạn</label>
        <Input type="date" {...register('passportExpiryDate')} disabled={!isEditing} className="h-8 text-xs" />
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// NenkinForm — Sổ Nenkin
// ─────────────────────────────────────────────────────────────────
const NenkinForm: React.FC<Pick<DocumentFormPanelProps, 'register' | 'isEditing'>> = ({ register, isEditing }) => (
  <div className="space-y-3">
    <SectionHeader title="Sổ Nenkin" />
    <FieldRow label="Mã số Nenkin">
      <Input {...register('nenkinNumber')} disabled={!isEditing} className="h-8 text-xs font-mono" />
    </FieldRow>
    <FieldRow label="Tên Katakana (Sổ Nenkin)">
      <Input {...register('nenkinKatakanaName')} disabled={!isEditing} className="h-8 text-xs" />
    </FieldRow>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// DepartureForm — Dấu xuất cảnh
// ─────────────────────────────────────────────────────────────────
const DepartureForm: React.FC<Pick<DocumentFormPanelProps, 'register' | 'isEditing'>> = ({ register, isEditing }) => (
  <div className="space-y-3">
    <SectionHeader title="Dấu Xuất Cảnh" />
    <FieldRow label="Ngày xuất cảnh Nhật Bản">
      <Input type="date" {...register('departureDate')} disabled={!isEditing} className="h-8 text-xs" />
    </FieldRow>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// BankForm — Ngân hàng (per index)
// ─────────────────────────────────────────────────────────────────
const BankForm: React.FC<
  Pick<DocumentFormPanelProps, 'register' | 'watch' | 'setValue' | 'isEditing' | 'bankFields' | 'removeBank'>
  & { bankIndex: number }
> = ({ register, watch, setValue, isEditing, bankFields, removeBank, bankIndex: idx }) => {
  if (!bankFields[idx]) return null;
  const purpose = watch(`bankAccounts.${idx}.purpose`);
  const purposeLabel = purpose === 'FIRST_REFUND' ? 'Lần 1' : purpose === 'SECOND_REFUND' ? 'Lần 2' : 'Chung';

  return (
    <div className="space-y-3">
      <SectionHeader title={`Ngân Hàng (${purposeLabel})`} />

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Quốc gia</label>
          <select {...register(`bankAccounts.${idx}.bankCountry`)} disabled={!isEditing} className="h-8 rounded-md border border-slate-200 px-2 text-xs bg-white">
            <option value="JAPAN">Nhật Bản</option>
            <option value="VIETNAM">Việt Nam</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Mục đích</label>
          <select {...register(`bankAccounts.${idx}.purpose`)} disabled={!isEditing} className="h-8 rounded-md border border-slate-200 px-2 text-xs bg-white">
            <option value="BOTH">Chung cả 2 lần</option>
            <option value="FIRST_REFUND">Lần 1 (Tiền Nhật)</option>
            <option value="SECOND_REFUND">Lần 2 (Tiền Việt)</option>
          </select>
        </div>
      </div>

      <FieldRow label="Tên ngân hàng">
        <BankAutocomplete index={idx} disabled={!isEditing} register={register} setValue={setValue} watch={watch} />
      </FieldRow>
      <FieldRow label="Chi nhánh">
        <Input {...register(`bankAccounts.${idx}.branchName`)} disabled={!isEditing} className="h-8 text-xs" />
      </FieldRow>
      <FieldRow label="Địa chỉ chi nhánh (Eng)">
        <Input {...register(`bankAccounts.${idx}.bankBranchAddress`)} disabled={!isEditing} className="h-8 text-xs" />
      </FieldRow>
      <FieldRow label="Số tài khoản">
        <Input {...register(`bankAccounts.${idx}.accountNumber`)} disabled={!isEditing} className="h-8 text-xs font-mono" />
      </FieldRow>
      <FieldRow label="Tên chủ tài khoản (Romaji)">
        <Input {...register(`bankAccounts.${idx}.accountName`)} disabled={!isEditing} className="h-8 text-xs uppercase" />
      </FieldRow>
      {watch(`bankAccounts.${idx}.bankCountry`) === 'JAPAN' && (
        <FieldRow label="Tên chủ tài khoản (Katakana)">
          <Input {...register(`bankAccounts.${idx}.accountNameKatakana`)} disabled={!isEditing} className="h-8 text-xs" />
        </FieldRow>
      )}
      <FieldRow label="Swift Code">
        <Input {...register(`bankAccounts.${idx}.swiftCode`)} disabled={!isEditing} className="h-8 text-xs uppercase font-mono" />
      </FieldRow>

      {isEditing && bankFields.length > 1 && (
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => { if (confirm('Bạn muốn xóa tài khoản ngân hàng này?')) removeBank(idx); }}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-100 font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa tài khoản này
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// ManualConfirmBlock
// ─────────────────────────────────────────────────────────────────
const REQUIRED_VERIFY_KEYS = [
  'fullName', 'dob', 'cardNumber', 'zairyuAddress', 'postalCode',
  'taxOffice_name', 'taxOffice_postalCode', 'taxOffice_address',
  'taxOffice_romajiAddress', 'taxOffice_phone', 'taxOffice_websiteUrl',
];

const ManualConfirmBlock: React.FC<{
  isEditing: boolean;
  verifiedFields: Record<string, boolean>;
  manualConfirmed: boolean;
  onChange: (v: boolean) => void;
}> = ({ isEditing, verifiedFields, manualConfirmed, onChange }) => {
  const allVerified = REQUIRED_VERIFY_KEYS.every((k) => verifiedFields[k]);
  return (
    <div className="mt-4 space-y-2">
      <div className={[
        'p-3 border rounded-xl flex items-start gap-2.5 transition-all',
        allVerified ? 'bg-indigo-50/40 border-indigo-100' : 'bg-slate-50 border-slate-200 opacity-60',
      ].join(' ')}>
        <input
          type="checkbox"
          id="manual-confirm"
          disabled={!isEditing || !allVerified}
          checked={manualConfirmed && allVerified}
          onChange={(e) => onChange(e.target.checked)}
          className={['mt-0.5 rounded w-4 h-4 focus:ring-indigo-500', allVerified ? 'text-indigo-600 cursor-pointer' : 'text-slate-400 cursor-not-allowed'].join(' ')}
        />
        <label
          htmlFor="manual-confirm"
          className={['text-xs font-semibold select-none leading-snug', allVerified ? 'text-indigo-900 cursor-pointer' : 'text-slate-400 cursor-not-allowed'].join(' ')}
        >
          Tôi đã đối chiếu thủ công từng trường và xác nhận khớp với ảnh tài liệu
        </label>
      </div>
      {!allVerified && isEditing && (
        <div className="flex items-start gap-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 p-2.5 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span>
            <strong>⚠️ Yêu cầu đối chiếu:</strong> Tích xác nhận{' '}
            <CheckCircle className="w-3 h-3 inline text-emerald-600 mx-0.5" />{' '}
            bên cạnh đủ 5 trường khách hàng và 6 trường Cục thuế trước khi phê duyệt.
          </span>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Main export: DocumentFormPanel
// ─────────────────────────────────────────────────────────────────
export const DocumentFormPanel: React.FC<DocumentFormPanelProps> = (props) => {
  const { activeDoc, isEditing, isNew, register, errors, setValue, watch, bankFields, removeBank, verifiedFields, onToggleVerify, manualConfirmed, onManualConfirmedChange, onNtaSearch } = props;

  const renderForm = () => {
    if (activeDoc === 'zairyuFront' || activeDoc === 'zairyuBack')
      return <ZairyuForm register={register} errors={errors} watch={watch} isEditing={isEditing} verifiedFields={verifiedFields} onToggleVerify={onToggleVerify} onNtaSearch={onNtaSearch} />;
    if (activeDoc === 'passport')
      return <PassportForm register={register} errors={errors} isEditing={isEditing} verifiedFields={verifiedFields} onToggleVerify={onToggleVerify} />;
    if (activeDoc === 'nenkinBook')
      return <NenkinForm register={register} isEditing={isEditing} />;
    if (activeDoc === 'departureStamp')
      return <DepartureForm register={register} isEditing={isEditing} />;
    if (activeDoc.startsWith('bankPassbook_')) {
      const idx = parseInt(activeDoc.split('_')[1], 10);
      return <BankForm register={register} watch={watch} setValue={setValue} isEditing={isEditing} bankFields={bankFields} removeBank={removeBank} bankIndex={idx} />;
    }
    return null;
  };

  return (
    <div className="col-span-1 md:col-span-3 flex flex-col h-full bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden min-h-0">
      {/* Panel header */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Thông tin chi tiết nhập liệu
        </span>
      </div>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {renderForm()}
        {!isNew && (
          <ManualConfirmBlock
            isEditing={isEditing}
            verifiedFields={verifiedFields}
            manualConfirmed={manualConfirmed}
            onChange={onManualConfirmedChange}
          />
        )}
      </div>
    </div>
  );
};

export default DocumentFormPanel;
