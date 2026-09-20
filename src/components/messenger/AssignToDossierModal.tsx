'use client';

import React, { useState, useEffect } from 'react';
import {
  X, Check, FolderPlus, FileText, Search, UserCheck, Loader2,
  ExternalLink, Sparkles, AlertCircle, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export interface AssignAttachmentTarget {
  url: string;
  name: string;
  size?: number;
  type?: string;
}

interface CustomerOption {
  id: string;
  code: string;
  fullName: string;
  phone?: string;
}

interface AssignToDossierModalProps {
  attachment: AssignAttachmentTarget | null;
  defaultCustomer?: { id: string; code?: string; name: string } | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const TARGET_OPTIONS = [
  {
    key: 'unclassified',
    title: 'Kho tài liệu chưa phân loại',
    desc: 'Lưu vào kho tài liệu chờ duyệt của khách hàng (Khuyên dùng)',
    badge: 'Khuyên dùng',
    isPrimary: true,
  },
  {
    key: 'zairyuFront',
    title: 'Thẻ ngoại kiều (Mặt trước)',
    desc: 'Gán trực tiếp làm ảnh mặt trước thẻ ngoại kiều',
  },
  {
    key: 'zairyuBack',
    title: 'Thẻ ngoại kiều (Mặt sau)',
    desc: 'Gán trực tiếp làm ảnh mặt sau thẻ ngoại kiều',
  },
  {
    key: 'passport',
    title: 'Hộ chiếu (Passport)',
    desc: 'Gán vào trang thông tin hộ chiếu của khách',
  },
  {
    key: 'nenkinBook',
    title: 'Sổ Nenkin (Trang mã số)',
    desc: 'Gán làm ảnh sổ Nenkin / Giấy chứng nhận Nenkin',
  },
  {
    key: 'bankPassbook',
    title: 'Sổ ngân hàng / Thẻ ngân hàng',
    desc: 'Thêm vào danh sách ảnh sổ tài khoản ngân hàng',
  },
  {
    key: 'noticeOfEntitlement',
    title: 'Phiếu thông báo Lần 1 (Notice)',
    desc: 'Gán vào hồ sơ thanh toán tiền Nenkin Lần 1',
  },
  {
    key: 'departureStamp',
    title: 'Dấu xuất cảnh Nhật Bản',
    desc: 'Gán vào trang đóng dấu xuất cảnh trong hộ chiếu',
  },
];

export default function AssignToDossierModal({
  attachment,
  defaultCustomer,
  onClose,
  onSuccess,
}: AssignToDossierModalProps) {
  const router = useRouter();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(defaultCustomer?.id || '');
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>(defaultCustomer?.name || '');
  const [selectedCustomerCode, setSelectedCustomerCode] = useState<string>(defaultCustomer?.code || '');
  
  const [targetType, setTargetType] = useState<string>('unclassified');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<CustomerOption[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Search customers if needed
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/customers?q=${encodeURIComponent(searchQuery.trim())}&limit=8`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSearchResults(
            json.data.map((c: any) => ({
              id: c.id,
              code: c.code,
              fullName: c.fullName,
              phone: c.phone,
            }))
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!attachment) return null;

  const isImage = attachment.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(attachment.url);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.warning('Vui lòng chọn khách hàng cần lưu tài liệu');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/messenger/attachments/assign-to-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: attachment.url,
          customerId: selectedCustomerId,
          targetType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Đã lưu tài liệu vào hồ sơ thành công!');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Không thể lưu vào hồ sơ');
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewDossier = () => {
    const query = new URLSearchParams({
      initialImageUrl: attachment.url,
      docType: targetType === 'unclassified' ? 'zairyuFront' : targetType,
    });
    router.push(`/applications/don-xin?${query.toString()}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-800">Lưu Tài Liệu Vào Hồ Sơ Khách Hàng</h3>
              <p className="text-[10px] text-slate-400">Liên kết tệp gốc không suy hao vào hồ sơ nghiệp vụ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Attachment Preview Card */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          {isImage ? (
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={attachment.url} alt={attachment.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs text-slate-800 truncate" title={attachment.name}>
              {attachment.name}
            </h4>
            <p className="text-[10px] text-slate-500">
              {attachment.size ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB` : 'Bản gốc Cloud Storage'} • Tệp gốc không nén
            </p>
            <a
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-indigo-600 hover:underline inline-flex items-center gap-1 mt-0.5"
            >
              Mở xem ảnh lớn <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Target Customer Selection */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Khách hàng thụ hưởng
            </label>

            {selectedCustomerId ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800">{selectedCustomerName}</span>
                    {selectedCustomerCode && (
                      <span className="ml-2 text-[10px] font-mono text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                        #{selectedCustomerCode}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId('');
                    setSelectedCustomerName('');
                    setSelectedCustomerCode('');
                  }}
                  className="text-[10px] text-slate-500 hover:text-rose-600 hover:underline"
                >
                  Đổi khách hàng
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo Tên, Mã khách (#KH...) hoặc Số điện thoại..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 shadow-2xs"
                  />
                  {searching && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 shadow-sm">
                    {searchResults.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setSelectedCustomerName(c.fullName);
                          setSelectedCustomerCode(c.code);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="w-full text-left p-2 hover:bg-indigo-50 flex items-center justify-between text-xs transition-colors"
                      >
                        <span className="font-semibold text-slate-800">{c.fullName}</span>
                        <span className="font-mono text-[10px] text-slate-500">#{c.code} {c.phone ? `• ${c.phone}` : ''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location / Document Classification */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Vị trí gán trong hồ sơ
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-0.5">
              {TARGET_OPTIONS.map(opt => {
                const isSelected = targetType === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTargetType(opt.key)}
                    className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                        {opt.title}
                      </span>
                      {opt.badge && (
                        <span className="text-[8px] font-bold bg-amber-500 text-white px-1.5 py-0.2 rounded-full shrink-0">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 line-clamp-1">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCreateNewDossier}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 w-full sm:w-auto justify-center"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Tạo hồ sơ mới từ ảnh này
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!selectedCustomerId || isSubmitting}
                className="flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Lưu Vào Hồ Sơ
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
