'use client';

import React, { useState } from 'react';
import { X, Edit3, Search, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface MemberItem {
  id: string;
  name: string;
  role?: string;
  code?: string;
  phone?: string;
  type: 'STAFF' | 'CUSTOMER';
  isOnline?: boolean;
  lastActiveText?: string;
}

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-violet-100 text-violet-700 border-violet-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-sky-100 text-sky-700 border-sky-200',
    'bg-teal-100 text-teal-700 border-teal-200',
    'bg-amber-100 text-amber-800 border-amber-200',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

interface QuickNewChatModalProps {
  availableStaffs: MemberItem[];
  availableCustomers: MemberItem[];
  onClose: () => void;
  onOpenConversation: (conversationId: string) => void;
}

export default function QuickNewChatModal({
  availableStaffs,
  availableCustomers,
  onClose,
  onOpenConversation,
}: QuickNewChatModalProps) {
  const [tab, setTab] = useState<'ALL' | 'STAFF' | 'CUSTOMER'>('ALL');
  const [search, setSearch] = useState('');
  const [loadingTargetId, setLoadingTargetId] = useState<string | null>(null);

  const query = search.trim().toLowerCase();

  const filteredStaffs = availableStaffs.filter(s =>
    !query || s.name.toLowerCase().includes(query) || (s.code && s.code.toLowerCase().includes(query))
  );

  const filteredCustomers = availableCustomers.filter(c =>
    !query || c.name.toLowerCase().includes(query) || (c.code && c.code.toLowerCase().includes(query)) || (c.phone && c.phone.includes(query))
  );

  const handleStartDirectChat = async (target: MemberItem) => {
    setLoadingTargetId(target.id);
    try {
      const res = await fetch('/api/messenger/conversations/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          target.type === 'STAFF'
            ? { targetUserId: target.id }
            : { targetCustomerId: target.id }
        ),
      });

      const data = await res.json();
      if (data.success && data.data) {
        onOpenConversation(data.data.id);
        toast.success(`Đã mở cuộc trò chuyện 1-1 với ${target.name}`);
        onClose();
      } else {
        toast.error(data.error || 'Không thể mở cuộc trò chuyện');
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    } finally {
      setLoadingTargetId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 my-auto max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-800">Tin Nhắn Mới (Chat 1-1 Nhanh)</h3>
              <p className="text-[10px] text-slate-400">Chọn đồng nghiệp hoặc khách hàng để trò chuyện trực tiếp</p>
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

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setTab('ALL')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              tab === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setTab('STAFF')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              tab === 'STAFF' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🤝 Đồng nghiệp ({filteredStaffs.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('CUSTOMER')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              tab === 'CUSTOMER' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            👤 Khách hàng ({filteredCustomers.length})
          </button>
        </div>

        {/* Spotlight Search Bar */}
        <div className="relative shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Gõ tên, mã nhân viên, mã khách (#KH...) hoặc SĐT..."
            autoFocus
            className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 shadow-2xs"
          />
        </div>

        {/* List of Members */}
        <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[50vh] space-y-1.5 pr-0.5">
          {/* Staffs */}
          {(tab === 'ALL' || tab === 'STAFF') && filteredStaffs.length > 0 && (
            <div className="space-y-1 mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                🤝 Đồng nghiệp & CTV ({filteredStaffs.length})
              </span>
              {filteredStaffs.map(s => {
                const isLoading = loadingTargetId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleStartDirectChat(s)}
                    className="w-full p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-between group text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${getAvatarColor(s.name)}`}>
                          {s.name[0]}
                        </div>
                        <span className={`w-2.5 h-2.5 rounded-full border-2 border-white absolute bottom-0 right-0 ${
                          s.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-800 group-hover:text-blue-600 block truncate">
                            {s.name}
                          </span>
                          {s.role && (
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[9px] font-medium rounded">
                              {s.role}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] mt-0.5 ${s.isOnline ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                          {s.isOnline ? '🟢 Đang hoạt động' : (s.lastActiveText || 'Ngoại tuyến')} {s.code ? `• #${s.code}` : ''}
                        </p>
                      </div>
                    </div>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white px-2 py-0.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Chat
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Customers */}
          {(tab === 'ALL' || tab === 'CUSTOMER') && filteredCustomers.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                👤 Khách hàng ({filteredCustomers.length})
              </span>
              {filteredCustomers.map(c => {
                const isLoading = loadingTargetId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleStartDirectChat(c)}
                    className="w-full p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-between group text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${getAvatarColor(c.name)}`}>
                          {c.name[0]}
                        </div>
                        <span className={`w-2.5 h-2.5 rounded-full border-2 border-white absolute bottom-0 right-0 ${
                          c.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-800 group-hover:text-blue-600 block truncate">
                          {c.name}
                        </span>
                        <p className={`text-[10px] mt-0.5 ${c.isOnline ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                          {c.isOnline ? '🟢 Đang hoạt động' : (c.lastActiveText || 'Ngoại tuyến')} {c.code ? `• #${c.code}` : ''}
                        </p>
                      </div>
                    </div>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white px-2 py-0.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Tư vấn
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {filteredStaffs.length === 0 && filteredCustomers.length === 0 && (
            <p className="text-center py-10 text-xs text-slate-400 italic">Không tìm thấy ai với từ khóa &quot;{search}&quot;</p>
          )}
        </div>

      </div>
    </div>
  );
}
