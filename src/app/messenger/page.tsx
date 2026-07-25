'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Image as ImageIcon, Paperclip, CheckCircle2,
  UserCircle, Search, FileText, Users, Plus, Shield, UserCheck, X,
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
}

interface ChatConversation {
  id: string;
  name: string;
  type: 'CUSTOMER' | 'CTV' | 'GROUP';
  code?: string;
  phone?: string;
  email?: string;
  role?: string;
  lastMessage: string;
  membersCount?: number;
  members?: string[];
}

export default function MessengerPage() {
  const [chatCategory, setChatCategory] = useState<'CUSTOMER' | 'CTV' | 'GROUP'>('CUSTOMER');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChat, setActiveChat] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sample CTVs & Customers for Group Creation
  const availableMembers = [
    { id: 'ctv1', name: 'Nguyễn Văn Long (CTV Tokyo)', role: 'Cộng tác viên' },
    { id: 'ctv2', name: 'Đào Thị Duyên (CTV Osaka)', role: 'Cộng tác viên' },
    { id: 'ctv3', name: 'Trần Văn Minh (CTV Nagoya)', role: 'Cộng tác viên' },
    { id: 'nv1', name: 'Super Admin (Quản trị)', role: 'Quản trị viên' },
  ];

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.data || [];
        
        // 1. Customer chats
        const customerChats: ChatConversation[] = list.map((c: any) => ({
          id: c.id,
          name: c.fullName,
          type: 'CUSTOMER',
          code: c.code,
          phone: c.phone || 'Chưa có SĐT',
          email: c.email || '',
          lastMessage: 'Đã tạo hồ sơ Nenkin mới',
        }));

        // 2. CTV chats
        const ctvChats: ChatConversation[] = [
          { id: 'ctv_1', name: 'Nguyễn Văn Long', type: 'CTV', code: 'CTV001', role: 'Cộng tác viên (Tokyo)', phone: '080-1234-5678', lastMessage: 'Hôm nay em nộp 2 hồ sơ mới ạ.' },
          { id: 'ctv_2', name: 'Đào Thị Duyên', type: 'CTV', code: 'CTV002', role: 'Cộng tác viên (Osaka)', phone: '090-8765-4321', lastMessage: 'Tiền hoa hồng Lần 1 đã nhận chưa ạ?' },
          { id: 'ctv_3', name: 'Trần Văn Minh', type: 'CTV', code: 'CTV003', role: 'Cộng tác viên (Nagoya)', phone: '070-1122-3344', lastMessage: 'Gửi anh bảng tra cứu ZIP Cục thuế.' },
        ];

        // 3. Group chats
        const groupChats: ChatConversation[] = [
          { id: 'grp_1', name: '👥 Nhóm Quyết Toán Nenkin Tokyo', type: 'GROUP', lastMessage: 'Admin: Đã cập nhật xong bảng 1, 2, 3 cho khách', membersCount: 5, members: ['Super Admin', 'Nguyễn Văn Long', 'LÔ THỊ HIÊN'] },
          { id: 'grp_2', name: '📢 Thông Báo Chung CTV VietNenkin', type: 'GROUP', lastMessage: 'Tỷ giá Yên hôm nay: 165.5 VND/JPY', membersCount: 12, members: ['Toàn bộ CTV & Admin'] },
        ];

        const allChats = [...customerChats, ...ctvChats, ...groupChats];
        setConversations(allChats);

        // Set default active chat based on selected category
        const initialActive = customerChats[0] || ctvChats[0] || groupChats[0];
        if (initialActive) {
          setActiveChat(initialActive);
          loadMessages(initialActive);
        }
      })
      .catch(console.error);
  }, []);

  const loadMessages = (chat: ChatConversation) => {
    if (chat.type === 'GROUP') {
      setMessages([
        { id: 'g1', senderName: 'Super Admin', isMe: false, content: `Chào mừng mọi người đến với ${chat.name}!`, time: '09:00' },
        { id: 'g2', senderName: 'Nguyễn Văn Long', isMe: false, content: 'Dạ em đã cập nhật danh sách khách hàng mới lên hệ thống rồi ạ.', time: '09:05' },
        { id: 'g3', senderName: 'Tôi', isMe: true, content: 'Ok em, anh đang kiểm tra và trích xuất AI cho bộ hồ sơ này.', time: '09:10' },
      ]);
    } else if (chat.type === 'CTV') {
      setMessages([
        { id: 'c1', senderName: chat.name, isMe: false, content: `Chào anh! Em là CTV ${chat.name} (${chat.code}).`, time: '08:30' },
        { id: 'c2', senderName: 'Tôi', isMe: true, content: 'Chào em, hồ sơ em gửi hôm qua anh đã cho chạy trích xuất AI xong rồi nhé.', time: '08:32' },
        { id: 'c3', senderName: chat.name, isMe: false, content: 'Dạ tuyệt quá ạ! Cảm ơn anh.', time: '08:35' },
      ]);
    } else {
      setMessages([
        { id: '1', senderName: chat.name, isMe: false, content: `Xin chào! Tôi là ${chat.name}, tôi đã gửi thông tin hồ sơ.`, time: '10:15' },
        { id: '2', senderName: 'Nhân viên hỗ trợ', isMe: true, content: 'Chào bạn! Hệ thống AI đã trích xuất xong thông tin. Chúng tôi đang kiểm tra hồ sơ.', time: '10:16' },
      ]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderName: 'Tôi',
      isMe: true,
      content: inputText.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderName: activeChat.type === 'GROUP' ? 'Cộng tác viên' : activeChat.name,
        isMe: false,
        content: activeChat.type === 'GROUP'
          ? 'Đã nhận thông tin trao đổi trong nhóm!'
          : 'Dạ em cảm ơn anh/chị, em đã nắm thông tin rồi ạ.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 1200);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.warning('Vui lòng nhập tên nhóm chat');
      return;
    }

    const newGroup: ChatConversation = {
      id: `grp_${Date.now()}`,
      name: `👥 ${groupName.trim()}`,
      type: 'GROUP',
      lastMessage: 'Vừa tạo nhóm chat mới',
      membersCount: selectedMembers.length + 1,
      members: ['Tôi', ...selectedMembers.map(id => availableMembers.find(m => m.id === id)?.name || id)],
    };

    setConversations([newGroup, ...conversations]);
    setActiveChat(newGroup);
    loadMessages(newGroup);
    setShowCreateGroupModal(false);
    setGroupName('');
    setSelectedMembers([]);
    toast.success(`Đã tạo thành công nhóm chat: ${newGroup.name}`);
  };

  const filteredChats = conversations
    .filter(c => c.type === chatCategory)
    .filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchQuery.toLowerCase())
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

        {/* Segmented Category Tabs */}
        <div className="p-1.5 bg-slate-100 border-b border-slate-200 grid grid-cols-3 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setChatCategory('CUSTOMER');
              const first = conversations.find(c => c.type === 'CUSTOMER');
              if (first) { setActiveChat(first); loadMessages(first); }
            }}
            className={`py-1.5 text-[10px] font-bold rounded-md transition-all text-center truncate ${
              chatCategory === 'CUSTOMER' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
            }`}
          >
            👤 Khách ({conversations.filter(c => c.type === 'CUSTOMER').length})
          </button>
          <button
            type="button"
            onClick={() => {
              setChatCategory('CTV');
              const first = conversations.find(c => c.type === 'CTV');
              if (first) { setActiveChat(first); loadMessages(first); }
            }}
            className={`py-1.5 text-[10px] font-bold rounded-md transition-all text-center truncate ${
              chatCategory === 'CTV' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
            }`}
          >
            🤝 CTV ({conversations.filter(c => c.type === 'CTV').length})
          </button>
          <button
            type="button"
            onClick={() => {
              setChatCategory('GROUP');
              const first = conversations.find(c => c.type === 'GROUP');
              if (first) { setActiveChat(first); loadMessages(first); }
            }}
            className={`py-1.5 text-[10px] font-bold rounded-md transition-all text-center truncate ${
              chatCategory === 'GROUP' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
            }`}
          >
            👥 Nhóm ({conversations.filter(c => c.type === 'GROUP').length})
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
          {filteredChats.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">Chưa có cuộc trò chuyện nào</div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChat(chat);
                  loadMessages(chat);
                }}
                className={`p-3 flex items-center gap-2.5 cursor-pointer transition-all ${
                  activeChat?.id === chat.id ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-white'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 relative ${
                  chat.type === 'GROUP' ? 'bg-purple-100 text-purple-700' : chat.type === 'CTV' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {chat.type === 'GROUP' ? <Users className="w-4 h-4" /> : (chat.name?.[0] || 'K')}
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-800 truncate">{chat.name}</h4>
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
                    {activeChat.type === 'CTV' && <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[9px] border border-amber-200">CTV</span>}
                    {activeChat.type === 'GROUP' && <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 text-[9px] border border-purple-200">Nhóm Chat ({activeChat.membersCount || 3} TV)</span>}
                  </h3>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Trực tuyến {activeChat.role ? `• ${activeChat.role}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs space-y-1 ${
                      msg.isMe
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                    }`}
                  >
                    {!msg.isMe && (
                      <span className="text-[9px] font-bold text-indigo-600 block">{msg.senderName}</span>
                    )}
                    <p className="leading-relaxed">{msg.content}</p>
                    <span
                      className={`text-[8px] font-mono block text-right ${
                        msg.isMe ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Thành viên nhóm ({activeChat.members?.length || 3})</span>
              <div className="space-y-1.5">
                {(activeChat.members || ['Super Admin', 'Nguyễn Văn Long', 'LÔ THỊ HIÊN']).map((m, idx) => (
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

      {/* ── CREATE GROUP MODAL ── */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" /> Tạo Nhóm Chat Mới
              </h3>
              <button type="button" onClick={() => setShowCreateGroupModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Tên Nhóm Chat</label>
                <Input
                  type="text"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Ví dụ: Nhóm Quyết Toán CTV Tokyo..."
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Thêm Thành Viên (CTV / Staff)</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {availableMembers.map(m => (
                    <label key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 text-xs cursor-pointer hover:bg-indigo-50/50">
                      <span className="font-semibold text-slate-800">{m.name}</span>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(m.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedMembers([...selectedMembers, m.id]);
                          else setSelectedMembers(selectedMembers.filter(id => id !== m.id));
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="xs" onClick={() => setShowCreateGroupModal(false)}>Hủy</Button>
                <Button type="submit" size="xs" className="bg-purple-600 hover:bg-purple-700 font-bold px-4">Tạo Nhóm Chat</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
