'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Search, MessageSquare, Users, ExternalLink,
  ChevronRight, Inbox, BookUser
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

interface ChatConversation {
  id: string;
  customerId?: string | null;
  applicationId?: string | null;
  name: string;
  type: 'CUSTOMER' | 'CUSTOMER_SUPPORT' | 'CTV' | 'GROUP' | 'DIRECT';
  code?: string;
  phone?: string;
  role?: string;
  lastMessage?: string;
  updatedAt: string;
  isArchived?: boolean;
  isOnline?: boolean;
  lastActiveText?: string;
}

interface MemberItem {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  type: 'STAFF' | 'CUSTOMER';
  role?: string;
  isOnline?: boolean;
  lastActiveText?: string;
}

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

interface MessengerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MessengerDrawer({ isOpen, onClose }: MessengerDrawerProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'INBOX' | 'CONTACTS'>('INBOX');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'CUSTOMER' | 'CTV' | 'GROUP'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [staffs, setStaffs] = useState<MemberItem[]>([]);
  const [customers, setCustomers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data when opened
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    Promise.all([
      fetch('/api/messenger/conversations').then(r => r.json()).catch(() => ({ success: false })),
      fetch('/api/messenger/members').then(r => r.json()).catch(() => ({ success: false })),
    ]).then(([convRes, memRes]) => {
      if (convRes.success && Array.isArray(convRes.data)) {
        setConversations(convRes.data);
      }
      if (memRes.success && memRes.data) {
        setStaffs(memRes.data.staffs || []);
        setCustomers(memRes.data.customers || []);
      }
    }).finally(() => setLoading(false));
  }, [isOpen]);

  // Open docked chat window without redirecting
  const handleSelectConversation = (conv: ChatConversation) => {
    const matchedStaff = staffs.find(s => s.name === conv.name || (conv.code && s.code === conv.code));
    const isStaff = !!matchedStaff || conv.type === 'DIRECT' || conv.role === 'ADMIN' || conv.role === 'MANAGER' || (conv.code && conv.code.startsWith('NV'));
    const roleTitle = matchedStaff?.role || conv.role || (isStaff ? 'Nhân viên nội bộ' : 'Khách hàng');

    const eventData = {
      conversationId: conv.id,
      name: conv.name,
      code: conv.code || matchedStaff?.code || '',
      role: roleTitle,
      isStaff,
      isOnline: conv.isOnline ?? false,
      isOpen: true,
      isMinimized: false,
    };

    window.dispatchEvent(new CustomEvent('nenkin:open-dock-chat', { detail: eventData }));
    toast.success(`Đã mở cuộc trò chuyện với ${conv.name}`);
    onClose();
  };

  // Open direct 1-1 chat from member item
  const handleSelectMember = async (m: MemberItem) => {
    try {
      const payload = m.type === 'STAFF' ? { targetUserId: m.id } : { targetCustomerId: m.id };
      const res = await fetch('/api/messenger/conversations/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const conv = data.data;
        const isStaff = m.type === 'STAFF';
        const roleTitle = m.role || (isStaff ? 'Nhân viên nội bộ' : 'Khách hàng');

        const eventData = {
          conversationId: conv.id,
          name: conv.name || m.name,
          code: conv.code || m.code || '',
          role: roleTitle,
          isStaff,
          isOnline: m.isOnline ?? false,
          isOpen: true,
          isMinimized: false,
        };

        window.dispatchEvent(new CustomEvent('nenkin:open-dock-chat', { detail: eventData }));
        toast.success(`Đã mở cuộc trò chuyện với ${m.name}`);
        onClose();
      } else {
        toast.error('Không thể mở cuộc trò chuyện: ' + (data.error || 'Thất bại'));
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    }
  };

  // Navigate to full Messenger page
  const handleOpenFullMessenger = () => {
    onClose();
    router.push('/messenger');
  };

  if (!isOpen) return null;

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (c.isArchived) return false;
    if (categoryFilter === 'CUSTOMER' && c.type !== 'CUSTOMER' && c.type !== 'CUSTOMER_SUPPORT') return false;
    if (categoryFilter === 'CTV' && c.type !== 'CTV') return false;
    if (categoryFilter === 'GROUP' && c.type !== 'GROUP') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchCode = c.code?.toLowerCase().includes(q);
      const matchPhone = c.phone?.toLowerCase().includes(q);
      return matchName || matchCode || matchPhone;
    }
    return true;
  });

  // Filter contacts
  const allContacts = [...staffs, ...customers];
  const filteredContacts = allContacts.filter(m => {
    if (categoryFilter === 'CUSTOMER' && m.type !== 'CUSTOMER') return false;
    if (categoryFilter === 'CTV' && m.role !== 'Cộng tác viên (CTV)' && m.role !== 'COLLABORATOR') return false;
    if (categoryFilter === 'GROUP') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name?.toLowerCase().includes(q);
      const matchCode = m.code?.toLowerCase().includes(q);
      const matchPhone = m.phone?.toLowerCase().includes(q);
      return matchName || matchCode || matchPhone;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-[120] flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250 border-r border-slate-200">
        
        {/* Drawer Header */}
        <div className="p-3.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                Tin Nhắn & Danh Bạ
              </h2>
              <p className="text-[10px] text-blue-100">Chọn để mở khung chat nhỏ không làm gián đoạn việc</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleOpenFullMessenger}
              className="h-7 px-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors border border-white/20"
              title="Mở toàn màn hình Messenger"
            >
              <span>Toàn màn hình</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-colors"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-2.5 bg-slate-50 border-b border-slate-200/80 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, mã khách, SĐT..."
              className="pl-8 text-xs bg-white border-slate-200 rounded-xl h-8.5 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Main Tabs: Inbox vs Contacts */}
          <div className="flex items-center gap-1 mt-2 p-0.5 bg-slate-200/70 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTab('INBOX')}
              className={`flex-1 py-1 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                tab === 'INBOX' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Hộp Thư ({filteredConversations.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('CONTACTS')}
              className={`flex-1 py-1 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                tab === 'CONTACTS' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookUser className="w-3.5 h-3.5" />
              <span>Danh Bạ ({filteredContacts.length})</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap transition-colors ${
                categoryFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('CUSTOMER')}
              className={`px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap transition-colors ${
                categoryFilter === 'CUSTOMER' ? 'bg-blue-600 text-white' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Khách hàng
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('CTV')}
              className={`px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap transition-colors ${
                categoryFilter === 'CTV' ? 'bg-purple-600 text-white' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
              }`}
            >
              CTV
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('GROUP')}
              className={`px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap transition-colors ${
                categoryFilter === 'GROUP' ? 'bg-indigo-600 text-white' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Nhóm chat
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Đang nạp danh sách tin nhắn...</div>
          ) : tab === 'INBOX' ? (
            filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">Không có cuộc trò chuyện nào</div>
            ) : (
              filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className="p-3 flex items-center justify-between gap-2.5 hover:bg-blue-50/70 active:bg-blue-100/70 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border ${
                        conv.type === 'GROUP' ? 'bg-violet-100 text-violet-700 border-violet-200' : getAvatarColor(conv.name)
                      }`}>
                        {conv.type === 'GROUP' ? <Users className="w-4 h-4" /> : conv.name?.[0]}
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full border-2 border-white absolute bottom-0 right-0 ${
                        conv.isOnline ? 'bg-emerald-500 animate-pulse ring-1 ring-emerald-200' : 'bg-slate-300'
                      }`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-xs text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                          {conv.name}
                        </h4>
                        {conv.code && (
                          <span className="text-[9px] font-mono text-slate-400 shrink-0">#{conv.code}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{conv.lastMessage || 'Chưa có tin nhắn'}</p>
                    </div>
                  </div>

                  <div className="shrink-0 text-slate-300 group-hover:text-blue-600 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))
            )
          ) : (
            filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">Không tìm thấy danh bạ phù hợp</div>
            ) : (
              filteredContacts.map(m => (
                <div
                  key={m.id}
                  onClick={() => handleSelectMember(m)}
                  className="p-3 flex items-center justify-between gap-2.5 hover:bg-blue-50/70 active:bg-blue-100/70 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border ${getAvatarColor(m.name)}`}>
                        {m.name?.[0] || 'U'}
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full border-2 border-white absolute bottom-0 right-0 ${
                        m.isOnline ? 'bg-emerald-500 animate-pulse ring-1 ring-emerald-200' : 'bg-slate-300'
                      }`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                          {m.name}
                        </span>
                        {m.type === 'STAFF' && m.role && (
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-medium rounded shrink-0">
                            {m.role}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-[10px] text-slate-400 truncate">
                          {m.isOnline ? 'Đang trực tuyến' : (m.lastActiveText || 'Ngoại tuyến')}
                        </span>
                        {m.code && (
                          <span className="text-[9px] font-mono text-slate-400 shrink-0">#{m.code}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-slate-300 group-hover:text-blue-600 transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Footer info & shortcut to Full Messenger */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200/90 shrink-0 flex items-center justify-between text-[11px] text-slate-500">
          <span>Khung chat nổi mở ở góc dưới phải</span>
          <button
            type="button"
            onClick={handleOpenFullMessenger}
            className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <span>Mở trang Messenger đầy đủ</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

      </div>
    </div>
  );
}
