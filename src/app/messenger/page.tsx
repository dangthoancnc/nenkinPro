'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Image as ImageIcon, Paperclip, CheckCircle2,
  UserCircle, Search, FileText, Users, Plus, Shield, UserCheck, X, Loader2,
  Archive, ArchiveRestore, Trash2, Inbox, AlertTriangle, MoreVertical,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  senderName: string;
  isMe: boolean;
  content: string;
  time: string;
  createdAt?: string;
}

interface ChatConversation {
  id: string;
  name: string;
  type: 'CUSTOMER' | 'CUSTOMER_SUPPORT' | 'CTV' | 'GROUP';
  code?: string;
  phone?: string;
  email?: string;
  role?: string;
  lastMessage: string;
  updatedAt?: string;
  isArchived?: boolean;
  isOnline?: boolean;
  lastActiveText?: string;
  membersCount?: number;
  members?: string[];
}

interface MemberItem {
  id: string;
  name: string;
  role?: string;
  code?: string;
  phone?: string;
  type: 'STAFF' | 'CUSTOMER';
}

export default function MessengerPage() {
  const [chatCategory, setChatCategory] = useState<'CUSTOMER' | 'CTV' | 'GROUP' | 'ARCHIVED'>('CUSTOMER');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Derived activeChat from conversations list using activeChatId
  const activeChat = conversations.find(c => c.id === activeChatId) || null;

  // Group creation modal state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberCategoryTab, setMemberCategoryTab] = useState<'STAFF' | 'CUSTOMER'>('STAFF');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [availableStaffs, setAvailableStaffs] = useState<MemberItem[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<MemberItem[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const prevMsgCountRef = useRef(0);

  // 1. Load real conversations from DB (silent = true prevents screen flicker)
  const loadConversations = (keepActive: boolean = true, silent: boolean = true) => {
    if (!silent) setLoadingChats(true);
    fetch('/api/messenger/conversations')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const list: ChatConversation[] = data.data;
          setConversations(prev => {
            if (JSON.stringify(prev) === JSON.stringify(list)) return prev;
            return list;
          });

          // Check if specific conversationId requested in URL
          const urlParams = new URLSearchParams(window.location.search);
          const urlConvId = urlParams.get('conversationId');

          if (urlConvId) {
            const matched = list.find(c => c.id === urlConvId);
            if (matched && matched.id !== activeChatId) {
              setActiveChatId(matched.id);
              loadRealMessages(matched.id, false);
              if (matched.isArchived) setChatCategory('ARCHIVED');
              else if (matched.type === 'CUSTOMER_SUPPORT' || matched.type === 'CUSTOMER') setChatCategory('CUSTOMER');
              else if (matched.type === 'CTV') setChatCategory('CTV');
              else if (matched.type === 'GROUP') setChatCategory('GROUP');
              return;
            }
          }

          if (!keepActive || !activeChatId) {
            if (list.length > 0) {
              const activeList = list.filter(c => !c.isArchived);
              const first = activeList.find(c => c.type === 'CUSTOMER' || c.type === 'CUSTOMER_SUPPORT') || activeList[0] || list[0];
              if (first) {
                setActiveChatId(first.id);
                loadRealMessages(first.id, false);
              }
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!silent) setLoadingChats(false);
      });
  };

  useEffect(() => {
    loadConversations(false, false);
    loadMembersForModal();

    // Auto refresh conversation list every 5 seconds silently without screen flicker
    const interval = setInterval(() => {
      loadConversations(true, true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch real members for Group modal
  const loadMembersForModal = () => {
    fetch('/api/messenger/members')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setAvailableStaffs(d.data.staffs || []);
          setAvailableCustomers(d.data.customers || []);
        }
      })
      .catch(console.error);
  };

  // 3. Load real messages from DB (silent = true avoids spinner flicker)
  const loadRealMessages = (conversationId: string, silent: boolean = false) => {
    if (!silent) setLoadingMessages(true);
    fetch(`/api/messenger/messages?conversationId=${conversationId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setMessages(prev => {
            // Compare message IDs and content strictly to avoid re-rendering React DOM when data is identical
            if (
              prev.length === data.data.length &&
              prev.every((m, idx) => m.id === data.data[idx]?.id && m.content === data.data[idx]?.content)
            ) {
              return prev;
            }
            return data.data;
          });
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!silent) setLoadingMessages(false);
      });
  };

  // Auto poll for new messages in active chat every 3 seconds silently
  useEffect(() => {
    if (!activeChatId) return;

    const msgInterval = setInterval(() => {
      loadRealMessages(activeChatId, true);
    }, 3000);

    return () => clearInterval(msgInterval);
  }, [activeChatId]);

  // Only scroll when message count increases (zero scroll jumping / flicker)
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length]);

  // Handler: Toggle Archive Conversation
  const handleToggleArchive = async (conversationId: string, currentArchived: boolean) => {
    try {
      const res = await fetch('/api/messenger/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, isArchived: !currentArchived }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(currentArchived ? 'Đã chuyển cuộc trò chuyện về hộp thư chính' : 'Đã chuyển cuộc trò chuyện vào Mục Lưu Trữ');
        loadConversations(true, true);
      } else {
        toast.error('Lỗi: ' + data.error);
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    }
  };

  // Handler: Delete Entire Conversation
  const handleDeleteConversation = async (conversationId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn cuộc trò chuyện này cùng toàn bộ tin nhắn?')) return;
    try {
      const res = await fetch(`/api/messenger/conversations?conversationId=${conversationId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã xóa cuộc trò chuyện');
        setActiveChatId(null);
        setMessages([]);
        loadConversations(false, false);
      } else {
        toast.error('Lỗi xóa: ' + data.error);
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    }
  };

  // Handler: Delete Single Message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const res = await fetch(`/api/messenger/messages?messageId=${messageId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        toast.success('Đã xóa tin nhắn');
      } else {
        toast.error('Lỗi xóa tin nhắn: ' + data.error);
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  // 4. Send real message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const res = await fetch('/api/messenger/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeChat.id,
          content: textToSend,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [...prev, data.data]);
        // Update last message on left panel
        setConversations(prev =>
          prev.map(c => (c.id === activeChat.id ? { ...c, lastMessage: textToSend } : c))
        );
      } else {
        toast.error('Không thể gửi tin nhắn: ' + (data.error || 'Lỗi hệ thống'));
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    }
  };

  // 5. Create real Group Chat
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.warning('Vui lòng nhập tên nhóm chat');
      return;
    }

    if (selectedUserIds.length === 0 && selectedCustomerIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 thành viên tham gia nhóm');
      return;
    }

    setCreatingGroup(true);
    try {
      const res = await fetch('/api/messenger/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `👥 ${groupName.trim()}`,
          type: 'GROUP',
          userIds: selectedUserIds,
          customerIds: selectedCustomerIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Đã tạo thành công nhóm chat: ${groupName.trim()}`);
        setShowCreateGroupModal(false);
        setGroupName('');
        setSelectedUserIds([]);
        setSelectedCustomerIds([]);
        loadConversations();
      } else {
        toast.error('Tạo nhóm thất bại: ' + (data.error || 'Lỗi hệ thống'));
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setCreatingGroup(false);
    }
  };

  const filteredChats = conversations
    .filter(c => {
      if (chatCategory === 'ARCHIVED') return c.isArchived === true;
      if (c.isArchived === true) return false;
      if (chatCategory === 'CUSTOMER') return c.type === 'CUSTOMER' || c.type === 'CUSTOMER_SUPPORT';
      return c.type === chatCategory;
    })
    .filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Filter members in modal
  const filteredModalMembers = (memberCategoryTab === 'STAFF' ? availableStaffs : availableCustomers).filter(m =>
    m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    m.code?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    (m.phone && m.phone.includes(memberSearchQuery))
  );

  return (
    <div className="h-[calc(100vh-100px)] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex min-h-0">
      
      {/* ── LEFT COL: CHAT CATEGORIES & LIST ── */}
      <div className="w-80 border-r border-slate-200 flex flex-col min-h-0 bg-slate-50/60">
        
        {/* Header */}
        <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Nenkin Messenger</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateGroupModal(true)}
            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
            title="Tạo nhóm chat mới"
          >
            <Plus className="w-3.5 h-3.5" /> Tạo Nhóm
          </button>
        </div>

        {/* 4 Segmented Category Tabs */}
        <div className="p-1.5 bg-slate-100 border-b border-slate-200 grid grid-cols-4 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setChatCategory('CUSTOMER');
              const first = conversations.find(c => !c.isArchived && (c.type === 'CUSTOMER' || c.type === 'CUSTOMER_SUPPORT'));
              if (first) { setActiveChatId(first.id); loadRealMessages(first.id); }
            }}
            className={`py-1.5 text-[9px] font-bold rounded-md transition-all text-center truncate ${
              chatCategory === 'CUSTOMER' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
            }`}
          >
            👤 Khách ({conversations.filter(c => !c.isArchived && (c.type === 'CUSTOMER' || c.type === 'CUSTOMER_SUPPORT')).length})
          </button>
          <button
            type="button"
            onClick={() => {
              setChatCategory('CTV');
              const first = conversations.find(c => !c.isArchived && c.type === 'CTV');
              if (first) { setActiveChatId(first.id); loadRealMessages(first.id); }
            }}
            className={`py-1.5 text-[9px] font-bold rounded-md transition-all text-center truncate ${
              chatCategory === 'CTV' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
            }`}
          >
            🤝 CTV ({conversations.filter(c => !c.isArchived && c.type === 'CTV').length})
          </button>
          <button
            type="button"
            onClick={() => {
              setChatCategory('GROUP');
              const first = conversations.find(c => !c.isArchived && c.type === 'GROUP');
              if (first) { setActiveChatId(first.id); loadRealMessages(first.id); }
            }}
            className={`py-1.5 text-[9px] font-bold rounded-md transition-all text-center truncate ${
              chatCategory === 'GROUP' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
            }`}
          >
            👥 Nhóm ({conversations.filter(c => !c.isArchived && c.type === 'GROUP').length})
          </button>
          <button
            type="button"
            onClick={() => {
              setChatCategory('ARCHIVED');
              const first = conversations.find(c => c.isArchived === true);
              if (first) { setActiveChatId(first.id); loadRealMessages(first.id); }
            }}
            className={`py-1.5 text-[9px] font-bold rounded-md transition-all text-center truncate ${
              chatCategory === 'ARCHIVED' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
            }`}
          >
            📁 Kho ({conversations.filter(c => c.isArchived === true).length})
          </button>
        </div>

        {/* Search */}
        <div className="p-2 bg-white border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm tin nhắn, tên CTV, khách..."
              className="pl-7 text-xs bg-slate-50 border-slate-200 rounded-lg h-7"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
          {loadingChats ? (
            <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
              <span className="text-xs">Đang nạp cuộc trò chuyện...</span>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">Chưa có cuộc trò chuyện nào</div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id);
                  loadRealMessages(chat.id);
                }}
                className={`p-3 flex items-center gap-2.5 cursor-pointer transition-all ${
                  activeChatId === chat.id ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-white'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 relative ${
                  chat.type === 'GROUP' ? 'bg-purple-100 text-purple-700' : chat.type === 'CTV' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {chat.type === 'GROUP' ? <Users className="w-4 h-4" /> : (chat.name?.[0] || 'K')}
                  <span className={`w-2.5 h-2.5 rounded-full border-2 border-white absolute bottom-0 right-0 ${
                    chat.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-800 truncate flex items-center gap-1">
                      {chat.name}
                      {chat.type === 'CUSTOMER_SUPPORT' && <span className="px-1 py-0.2 bg-teal-100 text-teal-800 text-[8px] font-bold rounded">Tư vấn</span>}
                      {chat.isArchived && <span className="px-1 py-0.2 bg-slate-200 text-slate-700 text-[8px] font-bold rounded">Đã lưu trữ</span>}
                    </h4>
                    {chat.code && <span className="text-[9px] font-mono text-slate-400">#{chat.code}</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{chat.lastMessage}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── MIDDLE COL: ACTIVE CHAT CONVERSATION WINDOW ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-100/40">
        
        {activeChat ? (
          <>
            {/* Topbar of Active Chat */}
            <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 ${
                  activeChat.type === 'GROUP' ? 'bg-purple-600' : activeChat.type === 'CTV' ? 'bg-amber-600' : 'bg-indigo-600'
                }`}>
                  {activeChat.type === 'GROUP' ? <Users className="w-4 h-4" /> : activeChat.name?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    {activeChat.name}
                    {activeChat.type === 'CUSTOMER_SUPPORT' && <span className="px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 text-[9px] border border-teal-200">Hỗ trợ Trực tiếp</span>}
                    {activeChat.type === 'CTV' && <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[9px] border border-amber-200">CTV</span>}
                    {activeChat.type === 'GROUP' && <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 text-[9px] border border-purple-200">Nhóm Chat ({activeChat.membersCount || 2} TV)</span>}
                  </h3>
                  <p className="text-[10px] flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${activeChat.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span className={activeChat.isOnline ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                      {activeChat.lastActiveText || (activeChat.isOnline ? 'Trực tuyến' : 'Không hoạt động')}
                    </span>
                    {activeChat.role ? ` • ${activeChat.role}` : ''}
                  </p>
                </div>
              </div>

              {/* Header Action Buttons (Archive & Delete) */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleArchive(activeChat.id, activeChat.isArchived || false)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-slate-200"
                  title={activeChat.isArchived ? "Chuyển về hộp thư chính" : "Lưu trữ cuộc trò chuyện"}
                >
                  {activeChat.isArchived ? (
                    <>
                      <ArchiveRestore className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Bỏ Lưu Trữ</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5 text-slate-600" />
                      <span>Lưu Trữ</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteConversation(activeChat.id)}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-rose-200"
                  title="Xóa cuộc trò chuyện này"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Xóa Chat</span>
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {loadingMessages ? (
                <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mb-1" />
                  <span className="text-[11px]">Đang tải tin nhắn...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">Chưa có tin nhắn nào trong cuộc trò chuyện này. Hãy gửi tin nhắn đầu tiên!</div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex group items-center gap-1.5 ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Delete Message Button on Hover */}
                    {msg.isMe && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Xóa tin nhắn này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs space-y-1 relative ${
                        msg.isMe
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                      }`}
                    >
                      {!msg.isMe && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-bold text-indigo-600 block">{msg.senderName}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-600"
                            title="Xóa tin nhắn"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <span
                        className={`text-[8px] font-mono block text-right ${
                          msg.isMe ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        {msg.time}
                      </span>
                    </div>

                    {!msg.isMe && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Xóa tin nhắn này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={`Nhập tin nhắn gửi đến ${activeChat.name}...`}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
              />
              <Button type="submit" size="xs" disabled={!inputText.trim()} className="bg-indigo-600 hover:bg-indigo-700 font-bold px-4 h-9 rounded-xl">
                <Send className="w-3.5 h-3.5 mr-1" /> Gửi
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-300" />
            <p className="text-xs">Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
          </div>
        )}
      </div>

      {/* ── RIGHT COL: DETAILS & MEMBERS PANEL ── */}
      {activeChat && (
        <div className="w-64 border-l border-slate-200 bg-white p-3.5 hidden lg:flex flex-col gap-3 shrink-0 overflow-y-auto">
          <div className="text-center space-y-1.5 pb-3 border-b border-slate-100">
            <div className={`w-14 h-14 rounded-full font-bold text-lg flex items-center justify-center mx-auto border-2 ${
              activeChat.type === 'GROUP' ? 'bg-purple-100 text-purple-700 border-purple-300' : activeChat.type === 'CTV' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-700 border-indigo-200'
            }`}>
              {activeChat.type === 'GROUP' ? <Users className="w-6 h-6" /> : activeChat.name?.[0]}
            </div>
            <h3 className="font-bold text-xs text-slate-800">{activeChat.name}</h3>
            {activeChat.code && (
              <span className="inline-block text-[9px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Mã: #{activeChat.code}
              </span>
            )}
          </div>

          {activeChat.type === 'GROUP' ? (
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Thành viên nhóm ({activeChat.members?.length || 1})</span>
              <div className="space-y-1.5">
                {(activeChat.members || ['Tôi']).map((m, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">{m}</span>
                    <span className="text-[9px] text-slate-400">Thành viên</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Thông tin liên hệ</span>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">SĐT:</span>
                  <span className="font-semibold text-slate-800">{activeChat.phone || 'Chưa có'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Loại tài khoản:</span>
                  <span className="font-bold text-indigo-600">{activeChat.type === 'CTV' ? 'Cộng tác viên' : 'Khách hàng'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ADVANCED CREATE GROUP MODAL WITH MEMBER SEARCH & CATEGORIZATION ── */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" /> Tạo Nhóm Chat Mới
              </h3>
              <button type="button" onClick={() => setShowCreateGroupModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3">
              {/* Group Title Input */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Tên Nhóm Chat</label>
                <Input
                  type="text"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Ví dụ: Nhóm Quyết Toán CTV Tokyo..."
                  className="text-xs font-semibold"
                />
              </div>

              {/* Categorized Member Picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Thêm Thành Viên Vào Nhóm</label>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    Đã chọn: {selectedUserIds.length + selectedCustomerIds.length} người
                  </span>
                </div>

                {/* Member Category Switcher Tabs */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-2">
                  <button
                    type="button"
                    onClick={() => setMemberCategoryTab('STAFF')}
                    className={`py-1 text-xs font-bold rounded-lg transition-all ${
                      memberCategoryTab === 'STAFF' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    🤝 CTV & Nhân viên ({availableStaffs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberCategoryTab('CUSTOMER')}
                    className={`py-1 text-xs font-bold rounded-lg transition-all ${
                      memberCategoryTab === 'CUSTOMER' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    👤 Khách hàng ({availableCustomers.length})
                  </button>
                </div>

                {/* Member Search Bar */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    value={memberSearchQuery}
                    onChange={e => setMemberSearchQuery(e.target.value)}
                    placeholder={`Tìm tên ${memberCategoryTab === 'STAFF' ? 'CTV / Nhân viên' : 'Khách hàng'}...`}
                    className="pl-7 text-xs bg-slate-50 border-slate-200 rounded-lg h-8"
                  />
                </div>

                {/* Checkable List */}
                <div className="space-y-1 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {filteredModalMembers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">Không tìm thấy thành viên phù hợp</div>
                  ) : (
                    filteredModalMembers.map(m => {
                      const isSelected = m.type === 'STAFF'
                        ? selectedUserIds.includes(m.id)
                        : selectedCustomerIds.includes(m.id);

                      return (
                        <label
                          key={m.id}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-100 hover:bg-slate-100/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              m.type === 'STAFF' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {m.name?.[0] || 'U'}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 block text-xs">{m.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {m.role || `Mã #${m.code || '---'}`} {m.phone ? `• SĐT: ${m.phone}` : ''}
                              </span>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => {
                              if (m.type === 'STAFF') {
                                if (e.target.checked) setSelectedUserIds(prev => [...prev, m.id]);
                                else setSelectedUserIds(prev => prev.filter(id => id !== m.id));
                              } else {
                                if (e.target.checked) setSelectedCustomerIds(prev => [...prev, m.id]);
                                else setSelectedCustomerIds(prev => prev.filter(id => id !== m.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="xs" onClick={() => setShowCreateGroupModal(false)}>Hủy</Button>
                <Button type="submit" size="xs" loading={creatingGroup} loadingText="Đang tạo nhóm..." className="bg-purple-600 hover:bg-purple-700 font-bold px-4">
                  Tạo Nhóm Chat
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
