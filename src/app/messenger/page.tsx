'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Image as ImageIcon, Paperclip, CheckCircle2, UserCircle, Search, FileText } from 'lucide-react';
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

export default function MessengerPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load customers as chat conversations
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.data || [];
        const chats = list.map((c: any) => ({
          id: c.id,
          name: c.fullName,
          code: c.code,
          phone: c.phone || 'Chưa có SĐT',
          lastMessage: 'Đã tạo hồ sơ Nenkin mới',
          updatedAt: c.updatedAt || c.createdAt,
          zairyuFrontUrl: c.zairyuFrontUrl,
        }));
        setConversations(chats);
        if (chats.length > 0) {
          setActiveChat(chats[0]);
          loadMessages(chats[0]);
        }
      })
      .catch(console.error);
  }, []);

  const loadMessages = (chat: any) => {
    // Mock initial conversation messages for demo
    const initialMsgs: ChatMessage[] = [
      { id: '1', senderName: chat.name, isMe: false, content: `Xin chào! Tôi là ${chat.name}, tôi đã tải ảnh thẻ ngoại kiều lên hệ thống.`, time: '10:15' },
      { id: '2', senderName: 'Nhân viên hỗ trợ', isMe: true, content: 'Chào bạn! Hệ thống AI đã trích xuất xong thông tin của bạn. Chúng tôi đang kiểm tra hồ sơ.', time: '10:16' },
    ];
    setMessages(initialMsgs);
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

    // Simulate response after 1.5s
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderName: activeChat.name,
        isMe: false,
        content: 'Cảm ơn bạn! Nếu có yêu cầu bổ sung giấy tờ, bạn nhắn lại giúp tôi nhé.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 1500);
  };

  const filteredChats = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-100px)] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex min-h-0">
      
      {/* ── LEFT COL: CONVERSATION LIST (MESSENGER CHATS) ── */}
      <div className="w-80 border-r border-slate-200 flex flex-col min-h-0 bg-slate-50/60">
        
        {/* Header */}
        <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-sm text-slate-800">Nenkin Messenger</h2>
          </div>
        </div>

        {/* Search */}
        <div className="p-2.5 bg-white border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm cuộc trò chuyện..."
              className="pl-8 text-xs bg-slate-50 border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
          {filteredChats.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">Không tìm thấy cuộc trò chuyện</div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChat(chat);
                  loadMessages(chat);
                }}
                className={`p-3 flex items-center gap-3 cursor-pointer transition-all ${
                  activeChat?.id === chat.id ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-white'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0 relative">
                  {chat.name?.[0] || 'K'}
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-800 truncate">{chat.name}</h4>
                    <span className="text-[9px] font-mono text-slate-400">#{chat.code || '---'}</span>
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
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {activeChat.name?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-800">{activeChat.name}</h3>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Trực tuyến • Mã hồ sơ: #{activeChat.code || '---'}
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
                placeholder={`Nhập tin nhắn trao đổi với ${activeChat.name}...`}
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

      {/* ── RIGHT COL: MINI APPLICATION CARD ── */}
      {activeChat && (
        <div className="w-72 border-l border-slate-200 bg-white p-4 hidden lg:flex flex-col gap-4 shrink-0 overflow-y-auto">
          <div className="text-center space-y-2 pb-3 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-700 font-bold text-lg flex items-center justify-center mx-auto border-2 border-indigo-200">
              {activeChat.name?.[0]}
            </div>
            <h3 className="font-bold text-xs text-slate-800">{activeChat.name}</h3>
            <span className="inline-block text-[9px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              Mã: #{activeChat.code || '---'}
            </span>
          </div>

          {/* Quick Info */}
          <div className="space-y-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Thông tin tóm tắt</span>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">SĐT:</span>
                <span className="font-semibold text-slate-800">{activeChat.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold text-emerald-600">Hoạt động</span>
              </div>
            </div>
          </div>

          {/* Action */}
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="w-full mt-auto text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            onClick={() => toast.info(`Đã mở hồ sơ của ${activeChat.name}`)}
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" /> Xem Chi Tiết Hồ Sơ
          </Button>
        </div>
      )}

    </div>
  );
}
