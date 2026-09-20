'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  X, Send, Minimize2, Maximize2, ChevronUp,
  Loader2, MessageSquare, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface DockedChatState {
  conversationId: string;
  name: string;
  code?: string;
  role?: string;
  isStaff?: boolean;
  isOnline?: boolean;
  isOpen: boolean;
  isMinimized: boolean;
  targetUrl?: string;
}

interface MessageAttachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
}

interface ChatMessage {
  id: string;
  senderUserId?: string | null;
  senderCustomerId?: string | null;
  content: string;
  attachments?: MessageAttachment[] | null;
  createdAt: string;
}

const STORAGE_KEY = 'nenkin_docked_chat';

export default function MiniDockedChat() {
  const pathname = usePathname();
  const router = useRouter();

  const [dockData, setDockData] = useState<DockedChatState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Sync docked chat state from localStorage and events
  useEffect(() => {
    const loadState = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: DockedChatState = JSON.parse(raw);
          setDockData(parsed);
        } else {
          setDockData(null);
        }
      } catch (e) {
        console.error('Error reading docked chat state:', e);
      }
    };

    loadState();
    window.addEventListener('storage', loadState);
    window.addEventListener('nenkin:dock-chat', loadState);

    return () => {
      window.removeEventListener('storage', loadState);
      window.removeEventListener('nenkin:dock-chat', loadState);
    };
  }, []);

  // 2. Poll messages when open and active
  useEffect(() => {
    if (!dockData?.conversationId || pathname === '/messenger') return;

    let isMounted = true;

    const fetchMessages = async (silent: boolean = false) => {
      if (!silent) setLoadingMessages(true);
      try {
        const res = await fetch(`/api/messenger/messages?conversationId=${dockData.conversationId}`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.data)) {
          setMessages(prev => {
            if (
              prev.length === data.data.length &&
              prev.every((m, i) => m.id === data.data[i]?.id && m.content === data.data[i]?.content)
            ) {
              return prev;
            }
            return data.data;
          });
        }
      } catch (err) {
        console.error('Mini chat fetch messages error:', err);
      } finally {
        if (isMounted && !silent) setLoadingMessages(false);
      }
    };

    fetchMessages(false);
    const interval = setInterval(() => fetchMessages(true), 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [dockData?.conversationId, pathname]);

  // 3. Scroll to bottom on new messages
  useEffect(() => {
    if (!dockData?.isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, dockData?.isMinimized]);

  // If on /messenger page or no docked chat active, do not render
  if (pathname === '/messenger' || !dockData || !dockData.isOpen) {
    return null;
  }

  // Toggle Minimize / Expand
  const handleToggleMinimize = () => {
    const updated: DockedChatState = { ...dockData, isMinimized: !dockData.isMinimized };
    setDockData(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Close Mini Chat
  const handleClose = () => {
    setDockData(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event('nenkin:dock-chat'));
    } catch (e) {
      console.error(e);
    }
  };

  // Maximize back to Full Messenger page
  const handleMaximize = () => {
    const convId = dockData.conversationId;
    handleClose();
    router.push(`/messenger?conversationId=${convId}`);
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/messenger/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: dockData.conversationId,
          content,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [...prev, data.data]);
        setInputText('');
      } else {
        toast.error('Không thể gửi tin nhắn: ' + (data.error || 'Thất bại'));
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Attach and upload image directly from mini chat
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadId = toast.loading(`Đang tải ảnh ${file.name}...`);
    try {
      const fd = new FormData();
      fd.append('files', file);

      const upRes = await fetch('/api/messenger/upload', {
        method: 'POST',
        body: fd,
      });
      const upData = await upRes.json();
      if (!upData.success || !Array.isArray(upData.data) || upData.data.length === 0) {
        throw new Error(upData.error || 'Tải ảnh lên thất bại');
      }

      const uploadedAtt = upData.data[0];

      const res = await fetch('/api/messenger/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: dockData.conversationId,
          content: `[Đã gửi tệp ảnh: ${file.name}]`,
          attachments: [uploadedAtt],
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [...prev, data.data]);
        toast.success('Đã gửi ảnh thành công!', { id: loadId });
      } else {
        throw new Error(data.error || 'Không thể gửi tin nhắn');
      }
    } catch (err: any) {
      toast.error('Lỗi gửi ảnh: ' + err.message, { id: loadId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 font-sans animate-in slide-in-from-bottom-5 duration-200">
      {/* ── MINIMIZED BAR STATE (Facebook Messenger Style Bar) ── */}
      {dockData.isMinimized ? (
        <div
          onClick={handleToggleMinimize}
          className="flex items-center gap-2.5 px-3 py-2 bg-white border border-slate-200 shadow-xl rounded-2xl hover:bg-slate-50 cursor-pointer transition-all max-w-[280px] group"
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {dockData.name?.[0] || 'U'}
            </div>
            <span className={`w-2.5 h-2.5 rounded-full border-2 border-white absolute bottom-0 right-0 ${
              dockData.isOnline ? 'bg-emerald-500 animate-pulse ring-1 ring-emerald-200' : 'bg-slate-300'
            }`} />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs text-slate-800 truncate group-hover:text-blue-600 transition-colors">
              {dockData.name}
            </h4>
            <p className="text-[10px] text-slate-400 truncate">
              {dockData.role || (dockData.isStaff ? 'Nhân sự' : 'Khách hàng')}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={handleToggleMinimize}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Mở rộng khung chat"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Đóng chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* ── EXPANDED CHAT WINDOW (Facebook Messenger Style Popover) ── */
        <div className="w-[360px] max-w-[calc(100vw-2rem)] h-[470px] max-h-[75vh] bg-white border border-slate-200 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="p-2.5 sm:p-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center border border-white/30">
                  {dockData.name?.[0] || 'U'}
                </div>
                <span className={`w-2.5 h-2.5 rounded-full border-2 border-indigo-700 absolute bottom-0 right-0 ${
                  dockData.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                }`} />
              </div>

              <div className="min-w-0">
                <h4 className="font-bold text-xs truncate leading-tight flex items-center gap-1">
                  {dockData.name}
                  {dockData.code && <span className="text-[9px] font-mono opacity-80">#{dockData.code}</span>}
                </h4>
                <p className="text-[10px] text-blue-100/90 truncate leading-tight mt-0.5">
                  {dockData.role || (dockData.isStaff ? 'Nhân sự' : 'Khách hàng')}
                </p>
              </div>
            </div>

            {/* Header Control Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleToggleMinimize}
                className="p-1 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors"
                title="Thu nhỏ xuống thanh bar"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleMaximize}
                className="p-1 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors"
                title="Phóng to toàn màn hình (về trang Messenger)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-rose-500/80 text-white/90 hover:text-white transition-colors"
                title="Đóng cửa sổ chat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/60 min-h-0 text-xs">
            {loadingMessages && messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-1.5 text-blue-600" />
                <span className="text-[11px]">Đang tải tin nhắn...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                <p className="font-semibold text-xs text-slate-600">Bắt đầu cuộc trò chuyện trực tiếp</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Nhập tin nhắn bên dưới để trao đổi thuận tiện khi đang duyệt hồ sơ.</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = !msg.senderCustomerId; // Current logged-in staff
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-2xs ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                      }`}
                    >
                      {/* Attachments if any */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="space-y-1.5 mb-1.5">
                          {msg.attachments.map((att, aIdx) => (
                            <div key={aIdx} className="rounded-lg overflow-hidden border border-black/10 bg-black/5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={att.url}
                                alt={att.name}
                                className="max-h-40 w-full object-cover cursor-pointer hover:opacity-95"
                                onClick={() => window.open(att.url, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>

                    <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Input Bar */}
          <form onSubmit={handleSendMessage} className="p-2 bg-white border-t border-slate-100 flex items-center gap-1.5 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0"
              title="Gửi ảnh tài liệu"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0 shadow-xs"
              title="Gửi tin nhắn"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
