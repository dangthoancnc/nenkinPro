'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Search, Plus, Save, RefreshCw } from 'lucide-react';

interface TaxOfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxOfficeId: string | null;
  taxOffices: Array<any>;
  onSaved: () => void;
  setValue: (name: string, value: any, options?: any) => void;
  customerPostalCode: string | null;
}

export default function TaxOfficeModal({
  isOpen,
  onClose,
  taxOfficeId,
  taxOffices,
  onSaved,
  setValue,
  customerPostalCode,
}: TaxOfficeModalProps) {
  const [saving, setSaving] = useState(false);
  const [searchingNta, setSearchingNta] = useState(false);
  const [zipInput, setZipInput] = useState('');
  const [selectedDbId, setSelectedDbId] = useState<string>('');

  // AI suggestions
  const [aiTaxData, setAiTaxData] = useState<any>({
    name: '',
    romajiName: '',
    address: '',
    postalCode: '',
    phone: '',
    mailingName: '',
    mailingRecipientName: '御中',
    mailingPostalCode: '',
    mailingAddress: '',
    jurisdiction: '',
    consultationPhone: '',
    generalPhone: '',
    ntaPageUrl: '',
    notes: '',
  });

  // Database fields (being edited)
  const [dbTaxData, setDbTaxData] = useState<any>({
    id: '',
    name: '',
    romajiName: '',
    address: '',
    postalCode: '',
    phone: '',
    mailingName: '',
    mailingRecipientName: '御中',
    mailingPostalCode: '',
    mailingAddress: '',
    jurisdiction: '',
    consultationPhone: '',
    generalPhone: '',
    ntaPageUrl: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedDbId(taxOfficeId || '');
      setZipInput(customerPostalCode || '');
      // Clear AI data on open to start fresh
      setAiTaxData({
        name: '',
        romajiName: '',
        address: '',
        postalCode: '',
        phone: '',
        mailingName: '',
        mailingRecipientName: '御中',
        mailingPostalCode: '',
        mailingAddress: '',
        jurisdiction: '',
        consultationPhone: '',
        generalPhone: '',
        ntaPageUrl: '',
        notes: '',
      });
    }
  }, [isOpen, taxOfficeId, customerPostalCode]);

  useEffect(() => {
    if (!isOpen) return;
    const currentTaxOffice = taxOffices.find((t) => t.id === selectedDbId);
    if (currentTaxOffice) {
      setDbTaxData({
        id: currentTaxOffice.id || '',
        name: currentTaxOffice.name || '',
        romajiName: currentTaxOffice.romajiName || '',
        address: currentTaxOffice.address || '',
        postalCode: currentTaxOffice.postalCode || '',
        phone: currentTaxOffice.phone || '',
        mailingName: currentTaxOffice.mailingName || '',
        mailingRecipientName: currentTaxOffice.mailingRecipientName || '御中',
        mailingPostalCode: currentTaxOffice.mailingPostalCode || '',
        mailingAddress: currentTaxOffice.mailingAddress || '',
        jurisdiction: currentTaxOffice.jurisdiction || '',
        consultationPhone: currentTaxOffice.consultationPhone || '',
        generalPhone: currentTaxOffice.generalPhone || '',
        ntaPageUrl: currentTaxOffice.ntaPageUrl || '',
        notes: currentTaxOffice.notes || '',
      });
    } else {
      setDbTaxData({
        id: '',
        name: '',
        romajiName: '',
        address: '',
        postalCode: '',
        phone: '',
        mailingName: '',
        mailingRecipientName: '御中',
        mailingPostalCode: '',
        mailingAddress: '',
        jurisdiction: '',
        consultationPhone: '',
        generalPhone: '',
        ntaPageUrl: '',
        notes: '',
      });
    }
  }, [selectedDbId, taxOffices, isOpen]);

  // AI Extraction call
  const handleNtaSearch = async () => {
    if (!zipInput) {
      alert('Vui lòng nhập mã bưu điện để tra cứu!');
      return;
    }
    const cleanedZip = zipInput.replace(/[-\s]/g, '');
    if (cleanedZip.length !== 7) {
      alert('Mã bưu điện phải bao gồm đúng 7 chữ số.');
      return;
    }
    setSearchingNta(true);
    try {
      const res = await fetch(`/api/tax-offices/nta-lookup?zip=${cleanedZip}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi tra cứu Cục thuế');
      }
      const data = await res.json();
      if (data.success && data.data) {
        setAiTaxData({
          name: data.data.name || '',
          romajiName: data.data.romajiName || '',
          address: data.data.address || '',
          postalCode: data.data.postalCode || '',
          phone: data.data.phone || '',
          mailingName: data.data.mailingName || '',
          mailingRecipientName: data.data.mailingRecipientName || '御中',
          mailingPostalCode: data.data.mailingPostalCode || '',
          mailingAddress: data.data.mailingAddress || '',
          jurisdiction: data.data.jurisdiction || '',
          consultationPhone: data.data.consultationPhone || '',
          generalPhone: data.data.generalPhone || '',
          ntaPageUrl: data.data.ntaPageUrl || '',
          notes: data.data.notes || '',
        });
        
        // Auto fill if form is empty/new
        if (!dbTaxData.name) {
          setDbTaxData((prev: any) => ({
            ...prev,
            name: data.data.name || '',
            romajiName: data.data.romajiName || '',
            address: data.data.address || '',
            postalCode: data.data.postalCode || '',
            phone: data.data.phone || '',
            mailingName: data.data.mailingName || '',
            mailingRecipientName: data.data.mailingRecipientName || '御中',
            mailingPostalCode: data.data.mailingPostalCode || '',
            mailingAddress: data.data.mailingAddress || '',
            jurisdiction: data.data.jurisdiction || '',
            consultationPhone: data.data.consultationPhone || '',
            generalPhone: data.data.generalPhone || '',
            ntaPageUrl: data.data.ntaPageUrl || '',
            notes: data.data.notes || '',
          }));
        }
        alert('Trích xuất AI thành công! Hãy xem gợi ý dưới từng ô nhập liệu.');
      } else {
        throw new Error('Không thể tra cứu thông tin Cục thuế.');
      }
    } catch (e: any) {
      alert('Đã xảy ra lỗi khi tra cứu: ' + e.message);
    } finally {
      setSearchingNta(false);
    }
  };

  // Save / Update CSDL handler
  const handleSaveDb = async () => {
    if (!dbTaxData.name) {
      alert('Tên Cục thuế là bắt buộc.');
      return;
    }
    setSaving(true);
    const isNew = !dbTaxData.id;
    const url = isNew ? '/api/tax-offices' : `/api/tax-offices/${dbTaxData.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbTaxData),
      });
      const data = await res.json();
      if (data.success && data.data?.id) {
        alert(isNew ? 'Lưu mới Cục thuế thành công!' : 'Cập nhật Cục thuế thành công!');
        onSaved();
        setValue('taxOfficeId', data.data.id, { shouldDirty: true });
        onClose();
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể lưu Cục thuế.'));
      }
    } catch (err: any) {
      alert('Lỗi lưu Cục thuế: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const FIELDS_CONFIG = [
    { key: 'name', label: 'Tên Cục Thuế (Kanji) *' },
    { key: 'postalCode', label: 'Mã bưu điện (Cục thuế)' },
    { key: 'address', label: 'Địa chỉ Cục thuế (Kanji)' },
    { key: 'phone', label: 'Số điện thoại' },
    { key: 'mailingName', label: 'Tên Đơn vị Nhận hồ sơ' },
    { key: 'mailingPostalCode', label: 'Mã bưu điện Nhận hồ sơ' },
    { key: 'mailingAddress', label: 'Địa chỉ Nhận hồ sơ' },
    { key: 'ntaPageUrl', label: 'URL kết quả NTA' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-50 rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="px-3 py-2 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              Thiết lập & Đồng bộ Cục thuế
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Tra cứu thông tin tự động từ AI NTA và cập nhật vào Hệ thống CSDL.
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Top Control Bar: Zip input & dropdown selection */}
        <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex justify-between items-center gap-4 shrink-0 flex-wrap">
          {/* AI Search */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Mã bưu điện tra cứu:</span>
            <input
              type="text"
              placeholder="1234567"
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              className="h-7 w-24 text-xs border border-slate-200 rounded px-2 font-mono bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              disabled={searchingNta}
              onClick={handleNtaSearch}
              className="h-7 px-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
            >
              {searchingNta ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              Trích xuất AI (Tự động)
            </button>
          </div>

          {/* DB Selection */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Cơ quan đang xem:</span>
            <select
              value={selectedDbId}
              onChange={(e) => setSelectedDbId(e.target.value)}
              className="h-7 text-xs border border-slate-200 rounded px-2 bg-white max-w-[180px]"
            >
              <option value="">-- Tạo Cục thuế mới --</option>
              {taxOffices.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Area: Two Column Layout (Left: AI, Right: DB) */}
        <div className="flex-1 overflow-hidden bg-white flex">
          
          {/* Left Column: AI Extraction */}
          <div className="w-1/2 border-r border-slate-200 overflow-y-auto p-3 flex flex-col gap-2">
            <h4 className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 sticky top-0 z-10 flex items-center justify-between">
              <span>Dữ liệu Trích xuất tự động (NTA)</span>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...dbTaxData };
                  FIELDS_CONFIG.forEach(f => {
                    if (aiTaxData[f.key]) updated[f.key] = aiTaxData[f.key];
                  });
                  setDbTaxData(updated);
                }}
                className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded transition-colors cursor-pointer"
              >
                Copy Tất Cả ➡️
              </button>
            </h4>
            
            <div className="grid grid-cols-1 gap-1.5 mt-1">
              {FIELDS_CONFIG.map((field) => (
                <div key={`ai-${field.key}`} className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {field.label.replace(' *', '')}
                  </label>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-7 text-[11px] bg-slate-50 border border-slate-200 rounded px-2 flex items-center truncate text-slate-700 font-medium">
                      {aiTaxData[field.key] || <span className="text-slate-300 italic">Trống</span>}
                    </div>
                    {aiTaxData[field.key] && aiTaxData[field.key] !== dbTaxData[field.key] && (
                      <button
                        type="button"
                        onClick={() => setDbTaxData((prev: any) => ({ ...prev, [field.key]: aiTaxData[field.key] }))}
                        className="h-7 px-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded border border-emerald-200 flex items-center justify-center transition-colors cursor-pointer"
                        title="Copy sang CSDL"
                      >
                        ➡️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Database / Editable Form */}
          <div className="w-1/2 overflow-y-auto p-3 flex flex-col gap-2 bg-slate-50/50">
            <h4 className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 sticky top-0 z-10">
              Dữ liệu Hệ thống (Sẽ lưu)
            </h4>
            
            <div className="grid grid-cols-1 gap-1.5 mt-1">
              {FIELDS_CONFIG.map((field) => (
                <div key={`db-${field.key}`} className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    {field.label.replace(' *', '')}
                    {field.label.includes('*') && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  
                  <input
                    type="text"
                    value={dbTaxData[field.key] || ''}
                    onChange={(e) => setDbTaxData((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full h-7 text-[11px] border rounded px-2 bg-white focus:outline-none focus:border-indigo-500 font-medium border-slate-300"
                    placeholder="Chưa nhập..."
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-7.5 px-3 text-xs font-semibold border border-slate-300 rounded hover:bg-slate-100 transition-colors bg-white"
          >
            Đóng
          </button>
          
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveDb}
            className="h-7.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {dbTaxData.id ? 'Cập Nhật Cục Thuế' : 'Lưu Mới Cục Thuế'}
          </button>
        </div>

      </div>
    </div>
  );
}
