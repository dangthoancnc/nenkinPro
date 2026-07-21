'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, Search, Save, RefreshCw } from 'lucide-react';
import { TaxDiffPanel, DiffFieldConfig } from '@/components/ui/TaxDiffPanel';
import { toast } from 'sonner';

interface TaxOfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxOfficeId: string | null;
  taxOffices: Array<any>;
  onSaved: () => void;
  setValue: (name: string, value: any, options?: any) => void;
  customerPostalCode: string | null;
}

// ─ Field definitions shared by diff panel ────────────────────────────
const FIELDS: DiffFieldConfig[] = [
  { key: 'name',                label: 'Tên Cục Thuế (Kanji)',        required: true },
  { key: 'postalCode',          label: 'Mã bưu điện' },
  { key: 'address',             label: 'Địa chỉ (Kanji)' },
  { key: 'phone',               label: 'Số điện thoại' },
  { key: 'mailingName',         label: 'Đơn vị nhận hồ sơ' },
  { key: 'mailingPostalCode',   label: 'Mã bưu điện nhận hồ sơ' },
  { key: 'mailingAddress',      label: 'Địa chỉ nhận hồ sơ' },
  { key: 'consultationPhone',   label: 'SDD tư vấn' },
  { key: 'generalPhone',        label: 'SDD tổng đài' },
  { key: 'ntaPageUrl',          label: 'URL trang NTA' },
];

const EMPTY_TAX = {
  id: '', name: '', romajiName: '', address: '', postalCode: '', phone: '',
  mailingName: '', mailingRecipientName: '御中', mailingPostalCode: '', mailingAddress: '',
  jurisdiction: '', consultationPhone: '', generalPhone: '', ntaPageUrl: '', notes: '',
};

export default function TaxOfficeModal({
  isOpen, onClose, taxOfficeId, taxOffices, onSaved, setValue, customerPostalCode,
}: TaxOfficeModalProps) {
  const [saving,       setSaving]       = useState(false);
  const [searching,    setSearching]    = useState(false);
  const [zipInput,     setZipInput]     = useState('');
  const [selectedDbId, setSelectedDbId] = useState<string>('');
  const [aiData,       setAiData]       = useState<Record<string, string>>({});
  const [dbData,       setDbData]       = useState<Record<string, string>>(EMPTY_TAX);

  // ─ Reset on open
  useEffect(() => {
    if (isOpen) {
      setSelectedDbId(taxOfficeId || '');
      setZipInput(customerPostalCode || '');
      setAiData({});
    }
  }, [isOpen, taxOfficeId, customerPostalCode]);

  // ─ Load DB record when selection changes
  useEffect(() => {
    if (!isOpen) return;
    const rec = taxOffices.find((t) => t.id === selectedDbId);
    setDbData(rec ? { ...EMPTY_TAX, ...rec } : { ...EMPTY_TAX });
  }, [selectedDbId, taxOffices, isOpen]);

  // ─ AI lookup
  const handleNtaSearch = async () => {
    const cleaned = zipInput.replace(/[-\s]/g, '');
    if (cleaned.length !== 7) {
      toast.error('Mã bưu điện phải đúng 7 số');
      return;
    }
    setSearching(true);
    const tid = toast.loading('Trích xuất AI từ NTA...');
    try {
      const res  = await fetch(`/api/tax-offices/nta-lookup?zip=${cleaned}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi tra cứu');
      setAiData(data.data || {});
      if (!dbData.name) setDbData(prev => ({ ...prev, ...data.data }));
      toast.success('Trích xuất thành công!', { id: tid });
    } catch (e: any) {
      toast.error(e.message, { id: tid });
    } finally {
      setSearching(false);
    }
  };

  // ─ Single field sync
  const handleSync = (key: string, value: string) => {
    setDbData(prev => ({ ...prev, [key]: value }));
    toast.success(`Đã áp dụng “${FIELDS.find(f => f.key === key)?.label}”`);
  };

  // ─ Bulk sync all mismatched fields
  const handleSyncAll = () => {
    const updated = { ...dbData };
    let count = 0;
    FIELDS.forEach(f => {
      const src = (aiData[f.key] || '').trim();
      const tgt = (dbData[f.key] || '').trim();
      if (src && src !== tgt) { updated[f.key] = src; count++; }
    });
    setDbData(updated);
    toast.success(`Đã áp dụng ${count} trường lệch`);
  };

  // ─ Save
  const handleSave = async () => {
    if (!dbData.name) { toast.error('Tên Cục thuế là bắt buộc'); return; }
    setSaving(true);
    const isNew  = !dbData.id;
    const url    = isNew ? '/api/tax-offices' : `/api/tax-offices/${dbData.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const tid    = toast.loading(isNew ? 'Lưu mới Cục thuế...' : 'Cập nhật Cục thuế...');
    try {
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dbData) });
      const data = await res.json();
      if (data.success && data.data?.id) {
        toast.success(isNew ? 'Lưu mới thành công!' : 'Cập nhật thành công!', { id: tid });
        onSaved();
        setValue('taxOfficeId', data.data.id, { shouldDirty: true });
        onClose();
      } else {
        throw new Error(data.error || 'Không thể lưu');
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message, { id: tid });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const hasAiData = Object.keys(aiData).some(k => aiData[k]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">

        {/* ── Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              Đồng bộ Cục Thuế
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Tra cứu NTA tự động và so sánh với dữ liệu hệ thống.
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Control bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-4 shrink-0">
          {/* ZIP search */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Mã bưu điện:</span>
            <input
              type="text" value={zipInput} onChange={e => setZipInput(e.target.value)}
              placeholder="1234567"
              className="h-7 w-24 text-xs border border-slate-200 rounded-lg px-2 font-mono bg-white focus:outline-none focus:border-indigo-500"
            />
            <button type="button" disabled={searching} onClick={handleNtaSearch}
              className="h-7 px-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 shadow-sm transition-colors cursor-pointer disabled:opacity-60">
              {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              Trích xuất AI
            </button>
          </div>

          {/* DB selection */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Cơ quan trong DB:</span>
            <select
              value={selectedDbId} onChange={e => setSelectedDbId(e.target.value)}
              className="h-7 text-xs border border-slate-200 rounded-lg px-2 bg-white max-w-[200px] focus:outline-none focus:border-indigo-500">
              <option value="">-- Tạo mới --</option>
              {taxOffices.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Diff Panel or empty state */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
          {!hasAiData ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3 text-slate-400">
              <Search className="w-8 h-8 opacity-30" />
              <p className="text-xs font-medium">Nhập mã bưu điện và nhấn “Trích xuất AI” để bắt đầu so sánh</p>
            </div>
          ) : (
            <TaxDiffPanel
              fields={FIELDS}
              sourceData={aiData}
              targetData={dbData}
              sourceLabel="NTA (AI)"
              targetLabel="Hệ thống (DB)"
              onSync={handleSync}
              onSyncAll={handleSyncAll}
              editable
            />
          )}
        </div>

        {/* ── Footer */}
        <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="h-8 px-4 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            Đóng
          </button>
          <button type="button" disabled={saving} onClick={handleSave}
            className="h-8 px-5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-60">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {dbData.id ? 'Cập nhật Cục Thuế' : 'Lưu Mới Cục Thuế'}
          </button>
        </div>
      </div>
    </div>
  );
}
