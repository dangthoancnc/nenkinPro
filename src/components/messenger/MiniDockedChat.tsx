'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  X, Send, Minimize2, Maximize2, ChevronUp,
  Loader2, MessageSquare, Image as ImageIcon,
  FileText, ExternalLink, Paperclip, Check
} from 'lucide-react';
import { toast } from 'sonner';

export interface DockedChatState {
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
  url?: string;
  name?: string;
  size?: number;
  type?: string;
  id?: string;
  code?: string;
  status?: string;
}

interface ChatMessage {
  id: string;
  senderUserId?: string | null;
  senderCustomerId?: string | null;
  content: string;
  attachments?: MessageAttachment[] | null;
  createdAt: string;
}

interface DossierSuggestion {
  id: string;
  status: string;
  customer?: {
    fullName: string;
    code: string;
  };
}

const STORAGE_KEY = 'nenkin_docked_chats';
const LEGACY_KEY = 'nenkin_docked_chat';

export default function MiniDockedChat() {
  const pathname = usePathname();
  const router = useRouter();

  const [dockedChats, setDockedChats] = useState<DockedChatState[]>([]);

  const saveChats = (list: DockedChatState[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('nenkin:dock-chats-updated'));
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Sync state from localStorage & custom events
  useEffect(() => {
    const loadState = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: DockedChatState[] = JSON.parse(raw);
          setDockedChats(Array.isArray(parsed) ? parsed : []);
        } else {
          // Fallback legacy single chat if exists
          const legacy = localStorage.getItem(LEGACY_KEY);
          if (legacy) {
            const parsed: DockedChatState = JSON.parse(legacy);
            setDockedChats([parsed]);
          } else {
            setDockedChats([]);
          }
        }
      } catch (e) {
        console.error('Error reading docked chats:', e);
      }
    };

    loadState();
    window.addEventListener('storage', loadState);
    window.addEventListener('nenkin:dock-chat', loadState);
    window.addEventListener('nenkin:dock-chats-updated', loadState);

    const handleOpenChat = (e: any) => {
      const newChat: DockedChatState = e.detail;
      if (!newChat || !newChat.conversationId) return;

      setDockedChats(prev => {
        const idx = prev.findIndex(c => c.conversationId === newChat.conversationId);
        let next: DockedChatState[];
        if (idx !== -1) {
          next = [...prev];
          next[idx] = { ...next[idx], isOpen: true, isMinimized: false };
        } else {
          // Keep max 2 expanded windows open simultaneously to avoid clutter
          const expanded = prev.filter(c => !c.isMinimized && c.isOpen);
          let base = prev;
          if (expanded.length >= 2) {
            const firstExpandedId = expanded[0].conversationId;
            base = prev.map(c => c.conversationId === firstExpandedId ? { ...c, isMinimized: true } : c);
          }
          next = [...base, { ...newChat, isOpen: true, isMinimized: false }];
        }
        saveChats(next);
        return next;
      });
    };

    window.addEventListener('nenkin:open-dock-chat', handleOpenChat);

    return () => {
      window.removeEventListener('storage', loadState);
      window.removeEventListener('nenkin:dock-chat', loadState);
      window.removeEventListener('nenkin:dock-chats-updated', loadState);
      window.removeEventListener('nenkin:open-dock-chat', handleOpenChat);
    };
  }, []);

  // If on /messenger page, hide docked chats
  if (pathname === '/messenger') {
    return null;
  }

  const activeChats = dockedChats.filter(c => c.isOpen);
  if (activeChats.length === 0) return null;

  const expandedChats = activeChats.filter(c => !c.isMinimized);
  const minimizedChats = activeChats.filter(c => c.isMinimized);

  const handleToggleMinimize = (convId: string) => {
    setDockedChats(prev => {
      const next = prev.map(c => c.conversationId === convId ? { ...c, isMinimized: !c.isMinimized } : c);
      saveChats(next);
      return next;
    });
  };

  const handleClose = (convId: string) => {
    setDockedChats(prev => {
      const next = prev.filter(c => c.conversationId !== convId);
      saveChats(next);
      return next;
    });
  };

  const handleMaximize = (convId: string) => {
    handleClose(convId);
    router.push(`/messenger?conversationId=${convId}`);
  };

  return (
    <div className="fixed bottom-0 right-0 z-40 font-sans pointer-events-none p-3 flex flex-row-reverse items-end gap-3 max-w-full overflow-visible">
      {/* Minimized Pills Bar */}
      {minimizedChats.length > 0 && (
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-700/50">
          {minimizedChats.map(c => (
            <div
              key={c.conversationId}
              onClick={() => handleToggleMinimize(c.conversationId)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold"
              title={`Mở lại chat với ${c.name}`}
            >
              <div className="relative shrink-0">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {c.name?.[0] || 'U'}
                </div>
                <span className={`w-1.5 h-1.5 rounded-full absolute bottom-0 right-0 ${c.isOnline ? 'bg-emerald-400 ring-1 ring-white' : 'bg-slate-400'}`} />
              </div>
              <span className="truncate max-w-[90px]">{c.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose(c.conversationId);
                }}
                className="p-0.5 hover:bg-white/20 rounded-md text-white/70 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Windows (Rendered side-by-side up to 2-3 windows) */}
      {expandedChats.slice(0, 3).map((chat) => (
        <div key={chat.conversationId} className="pointer-events-auto">
          <MiniChatWindow
            chat={chat}
            currentPathname={pathname}
            onToggleMinimize={() => handleToggleMinimize(chat.conversationId)}
            onMaximize={() => handleMaximize(chat.conversationId)}
            onClose={() => handleClose(chat.conversationId)}
          />
        </div>
      ))}
    </div>
  );
}

// ── SUBCOMPONENT: INDIVIDUAL DOCKED CHAT WINDOW ──
interface MiniChatWindowProps {
  chat: DockedChatState;
  currentPathname: string;
  onToggleMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

function MiniChatWindow({
  chat,
  currentPathname,
  onToggleMinimize,
  onMaximize,
  onClose,
}: MiniChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Mention Autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<DossierSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Current page dossier detection
  const currentAppIdMatch = currentPathname.match(/^\/applications\/([a-zA-Z0-9_-]+)$/);
  const currentDossierId = currentAppIdMatch ? currentAppIdMatch[1] : null;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch messages on interval
  useEffect(() => {
    let isMounted = true;

    const fetchMessages = async (silent: boolean = false) => {
      if (!silent) setLoadingMessages(true);
      try {
        const res = await fetch(`/api/messenger/messages?conversationId=${chat.conversationId}`);
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
  }, [chat.conversationId]);

  // 2. Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // 3. Listen to external pin event for this chat
  useEffect(() => {
    const handlePinDossier = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (!detail.conversationId || detail.conversationId === chat.conversationId) {
        // Send dossier card
        handleSendDossierCard(detail.dossier);
      }
    };
    window.addEventListener('nenkin:pin-dossier-to-chat', handlePinDossier);
    return () => window.removeEventListener('nenkin:pin-dossier-to-chat', handlePinDossier);
  }, [chat.conversationId]);

  // 4. Handle Mention Search (@ or /)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    const match = val.match(/[@/]([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]*)$/);
    if (match) {
      const query = match[1] || '';
      setMentionQuery(query);
      fetchSuggestions(query);
    } else {
      setMentionQuery(null);
      setMentionSuggestions([]);
    }
  };

  const fetchSuggestions = async (q: string) => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`/api/applications?q=${encodeURIComponent(q)}&minimal=true&limit=5`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMentionSuggestions(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectMention = (app: DossierSuggestion) => {
    const appName = app.customer?.fullName || 'Khách hàng';
    const appCode = app.customer?.code || '';

    handleSendDossierCard({
      id: app.id,
      name: appName,
      code: appCode,
      status: app.status,
    });

    setInputText('');
    setMentionQuery(null);
    setMentionSuggestions([]);
  };

  // Send interactive Dossier Card
  const handleSendDossierCard = async (dossier: { id: string; name: string; code?: string; status?: string }) => {
    setIsSending(true);
    try {
      const res = await fetch('/api/messenger/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: chat.conversationId,
          content: `📋 [Đã đề cập hồ sơ: ${dossier.name} #${dossier.code || ''}]`,
          attachments: [
            {
              type: 'dossier',
              id: dossier.id,
              name: dossier.name,
              code: dossier.code,
              status: dossier.status,
              url: `/applications/${dossier.id}`,
            }
          ],
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [...prev, data.data]);
        toast.success(`Đã gửi hồ sơ ${dossier.name} vào chat!`);
      }
    } catch (err: any) {
      toast.error('Lỗi gửi hồ sơ: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Pin currently viewed dossier if on /applications/[id]
  const handlePinCurrentPageDossier = async () => {
    if (!currentDossierId) return;
    try {
      const res = await fetch(`/api/applications/${currentDossierId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const app = data.data;
        handleSendDossierCard({
          id: app.id,
          name: app.customer?.fullName || 'Hồ sơ hiện tại',
          code: app.customer?.code || '',
          status: app.status,
        });
      }
    } catch (e: any) {
      toast.error('Lỗi lấy thông tin hồ sơ: ' + e.message);
    }
  };

  // Send normal text message
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
          conversationId: chat.conversationId,
          content,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [...prev, data.data]);
        setInputText('');
        setMentionQuery(null);
      } else {
        toast.error('Không thể gửi tin nhắn: ' + (data.error || 'Thất bại'));
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Upload and send image
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
          conversationId: chat.conversationId,
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
    <div className="w-[340px] sm:w-[360px] max-w-[calc(100vw-2rem)] h-[460px] max-h-[75vh] bg-white border border-slate-200 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 relative">
      
      {/* ── WINDOW HEADER ── */}
      <div className="p-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center border border-white/30">
              {chat.name?.[0] || 'U'}
            </div>
            <span className={`w-2.5 h-2.5 rounded-full border-2 border-indigo-700 absolute bottom-0 right-0 ${
              chat.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
            }`} />
          </div>

          <div className="min-w-0">
            <h4 className="font-bold text-xs truncate leading-tight flex items-center gap-1">
              {chat.name}
              {chat.code && <span className="text-[9px] font-mono opacity-80">#{chat.code}</span>}
            </h4>
            <p className="text-[10px] text-blue-100/90 truncate leading-tight mt-0.5">
              {chat.role || (chat.isStaff ? 'Nhân sự' : 'Khách hàng')}
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleMinimize}
            className="p-1 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors"
            title="Thu nhỏ xuống thanh bar"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onMaximize}
            className="p-1 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors"
            title="Phóng to toàn màn hình (về trang Messenger)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-rose-500/80 text-white/90 hover:text-white transition-colors"
            title="Đóng cửa sổ chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── MESSAGE LIST ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/60 min-h-0 text-xs">
        {loadingMessages && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-1.5 text-blue-600" />
            <span className="text-[11px]">Đang nạp tin nhắn...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
            <MessageSquare className="w-7 h-7 text-slate-300 mb-1.5" />
            <p className="font-semibold text-xs text-slate-600">Bắt đầu cuộc trò chuyện</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Gõ tin nhắn hoặc gõ @ để nhắc đến hồ sơ.</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = !msg.senderCustomerId; // Staff logged in
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-2xs ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="space-y-1.5 mb-1.5">
                      {msg.attachments.map((att, aIdx) => {
                        // Dossier Mention Card
                        if (att.type === 'dossier') {
                          return (
                            <div
                              key={aIdx}
                              className={`p-2 rounded-xl text-left border ${
                                isMe ? 'bg-white/10 border-white/25 text-white' : 'bg-blue-50/80 border-blue-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="truncate">{att.name}</span>
                              </div>
                              <div className="flex items-center justify-between gap-1 text-[10px] mt-1 opacity-90">
                                <span>#{att.code || 'HS'}</span>
                                <span className="px-1.5 py-0.2 rounded bg-black/15 font-semibold text-[9px]">
                                  {att.status || 'Bản nháp'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => window.open(`/applications/${att.id}`, '_blank')}
                                className={`mt-1.5 w-full py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors ${
                                  isMe ? 'bg-white text-blue-700 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                <span>Xem chi tiết hồ sơ</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        }

                        // Image Attachment
                        return (
                          <div key={aIdx} className="rounded-lg overflow-hidden border border-black/10 bg-black/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={att.url}
                              alt={att.name || 'Ảnh đính kèm'}
                              className="max-h-36 w-full object-cover cursor-pointer hover:opacity-95"
                              onClick={() => window.open(att.url, '_blank')}
                            />
                          </div>
                        );
                      })}
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

      {/* ── AUTOCOMPLETE POPUP FOR @ OR / DOSSIER MENTIONS ── */}
      {mentionQuery !== null && (
        <div className="absolute bottom-14 left-2 right-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-20 animate-in slide-in-from-bottom-2">
          <div className="px-2.5 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-600">
            <span>Gợi ý hồ sơ {mentionQuery ? `("${mentionQuery}")` : ''}:</span>
            {loadingSuggestions && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
          </div>
          <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
            {mentionSuggestions.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-slate-400 italic">
                {loadingSuggestions ? 'Đang tìm hồ sơ...' : 'Không tìm thấy hồ sơ khớp'}
              </div>
            ) : (
              mentionSuggestions.map(app => (
                <div
                  key={app.id}
                  onClick={() => handleSelectMention(app)}
                  className="p-2 hover:bg-blue-50/80 cursor-pointer flex items-center justify-between gap-2 transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-800 group-hover:text-blue-600 truncate flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{app.customer?.fullName || 'Khách hàng'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">#{app.customer?.code || ''}</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-medium shrink-0">
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── CURRENT PAGE DOSSIER PIN BAR (If viewing /applications/[id]) ── */}
      {currentDossierId && (
        <div className="px-2.5 py-1 bg-amber-50/90 border-t border-amber-200/70 flex items-center justify-between text-[10px] text-amber-900 shrink-0">
          <span className="truncate flex items-center gap-1 font-semibold">
            <Paperclip className="w-3 h-3 text-amber-600" />
            Đang xem hồ sơ trang này
          </span>
          <button
            type="button"
            onClick={handlePinCurrentPageDossier}
            className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold transition-colors shadow-2xs"
          >
            Gắn vào chat
          </button>
        </div>
      )}

      {/* ── QUICK INPUT BAR ── */}
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
          onChange={handleInputChange}
          placeholder="Nhập tin nhắn... (Gõ @ để gắn hồ sơ)"
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
  );
}
