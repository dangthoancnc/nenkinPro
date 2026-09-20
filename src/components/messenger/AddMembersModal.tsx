'use client';

import React, { useState } from 'react';
import { X, UserPlus, Search, Users, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

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

interface AddMembersModalProps {
  conversationId: string;
  conversationTitle?: string;
  availableStaffs: MemberItem[];
  availableCustomers: MemberItem[];
  currentMemberNames?: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMembersModal({
  conversationId,
  conversationTitle,
  availableStaffs,
  availableCustomers,
  currentMemberNames = [],
  onClose,
  onSuccess,
}: AddMembersModalProps) {
  const [tab, setTab] = useState<'STAFF' | 'CUSTOMER'>('STAFF');
  const [search, setSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const staffList = availableStaffs.filter(s =>
    !currentMemberNames.includes(s.name) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || (s.code && s.code.toLowerCase().includes(search.toLowerCase())))
  );

  const customerList = availableCustomers.filter(c =>
    !currentMemberNames.includes(c.name) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || (c.code && c.code.toLowerCase().includes(search.toLowerCase())) || (c.phone && c.phone.includes(search)))
  );

  const totalSelected = selectedUserIds.length + selectedCustomerIds.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalSelected === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 thành viên');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/messenger/conversations/add-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          userIds: selectedUserIds,
          customerIds: selectedCustomerIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Đã thêm thành viên thành công!');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Thêm thành viên thất bại');
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-800">Thêm Thành Viên Vào Cuộc Chat</h3>
              <p className="text-[10px] text-slate-400">
                {conversationTitle ? `Đang chat: ${conversationTitle}` : 'Nâng cấp cuộc trò chuyện'}
              </p>
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

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('STAFF')}
            className={`py-1 text-xs font-bold rounded-lg transition-all ${
              tab === 'STAFF' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
            }`}
          >
            🤝 Đồng nghiệp & CTV ({staffList.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('CUSTOMER')}
            className={`py-1 text-xs font-bold rounded-lg transition-all ${
              tab === 'CUSTOMER' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
            }`}
          >
            👤 Khách hàng ({customerList.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã hoặc số điện thoại..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 shadow-2xs"
          />
        </div>

        {/* Members List */}
        <div className="max-h-52 overflow-y-auto space-y-1.5 p-0.5">
          {tab === 'STAFF' ? (
            staffList.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 italic">Không tìm thấy đồng nghiệp phù hợp</p>
            ) : (
              staffList.map(s => {
                const isSelected = selectedUserIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50/60 shadow-2xs' : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${getAvatarColor(s.name)}`}>
                          {s.name[0]}
                        </div>
                        <span className={`w-2 h-2 rounded-full border-2 border-white absolute bottom-0 right-0 ${
                          s.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 block text-xs">{s.name}</span>
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
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        if (e.target.checked) setSelectedUserIds(prev => [...prev, s.id]);
                        else setSelectedUserIds(prev => prev.filter(id => id !== s.id));
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                );
              })
            )
          ) : (
            customerList.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 italic">Không tìm thấy khách hàng phù hợp</p>
            ) : (
              customerList.map(c => {
                const isSelected = selectedCustomerIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50/60 shadow-2xs' : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${getAvatarColor(c.name)}`}>
                          {c.name[0]}
                        </div>
                        <span className={`w-2 h-2 rounded-full border-2 border-white absolute bottom-0 right-0 ${
                          c.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                        }`} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">{c.name}</span>
                        <p className={`text-[10px] mt-0.5 ${c.isOnline ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                          {c.isOnline ? '🟢 Đang hoạt động' : (c.lastActiveText || 'Ngoại tuyến')} {c.code ? `• #${c.code}` : ''}
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        if (e.target.checked) setSelectedCustomerIds(prev => [...prev, c.id]);
                        else setSelectedCustomerIds(prev => prev.filter(id => id !== c.id));
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                );
              })
            )
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Đã chọn: <strong className="text-indigo-600">{totalSelected}</strong> người
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <Button
              type="button"
              size="xs"
              disabled={totalSelected === 0 || loading}
              onClick={handleSubmit}
              loading={loading}
              className="bg-indigo-600 hover:bg-indigo-700 font-bold px-4 rounded-xl"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Thêm Vào Chat
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
