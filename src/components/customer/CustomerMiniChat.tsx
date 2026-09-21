'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, X, Minus, Maximize2, Minimize2, ChevronUp,
  Image as ImageIcon, Paperclip, Loader2, ExternalLink, ShieldCheck,
  CheckCircle2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface MessageAttachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
}

interface ChatMessage {
  id: string;
  senderName: string;
  isMe: boolean;
  content: string;
  attachments?: MessageAttachment[];
  time: string;
  createdAt?: string;
}

interface CustomerMiniChatProps {
  customer: {
    id: string;
    fullName: string;
    code: string;
    phone?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  isStaffPreview?: boolean;
}

export default function CustomerMiniChat({
  customer,
  isOpen,
  onClose,
  isStaffPreview = false,
}: CustomerMiniChatProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState<string>('Chuyên viên VietNenkin');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch conversation and messages
  const fetchMessages = async (silent = false) => {
    if (!customer?.id) return;
    if (!silent) setLoading(true);

    try {
      const res = await fetch(`/api/customer/chat?customerId=${customer.id}`);
      const data = await res.json();

      if (data.success) {
        if (data.conversation?.id) {
          setConversationId(data.conversation.id);
        }
        if (data.conversation?.staffName) {
          setStaffName(data.conversation.staffName);
        }
        if (Array.isArray(data.messages)) {
          setMessages(prev => {
            if (
              prev.length === data.messages.length &&
              prev.every((m, i) => m.id === data.messages[i]?.id && m.content === data.messages[i]?.content)
            ) {
              return prev;
            }
            return data.messages;
          });
        }
      }
    } catch (err) {
      console.error('Fetch customer chat error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customer?.id) {
      fetchMessages(false);
      const interval = setInterval(() => fetchMessages(true), 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, customer?.id]);

  // 2. Auto scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOpen, isMinimized, pendingAttachments.length]);

  // 3. Handle Send Message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && pendingAttachments.length === 0) || isSending || !conversationId) return;

    const content = inputText.trim();
    const attachmentsToSend = [...pendingAttachments];

    setInputText('');
    setPendingAttachments([]);
    setIsSending(true);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderName: customer?.fullName || 'Bạn',
      isMe: true,
      content,
      attachments: attachmentsToSend,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/customer/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          customerId: customer?.id,
          content,
          attachments: attachmentsToSend,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
      } else {
        toast.error(data.error || 'Không thể gửi tin nhắn');
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // 4. Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch('/api/customer/chat/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPendingAttachments(prev => [...prev, ...data.data]);
        toast.success(`Đã tải lên ${data.data.length} tệp`);
      } else {
        toast.error(data.error || 'Tải tệp thất bại');
      }
    } catch (err: any) {
      toast.error('Lỗi tải tệp: ' + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, idx) => idx !== index));
  };

  if (!isOpen) return null;

  // ── MINIMIZED VIEW: DOCKED PILL BAR ──
  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-4 z-[75] font-sans">
        <div
          onClick={() => setIsMinimized(false)}
          className="flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 border border-indigo-500/40 text-white px-3.5 py-2.5 rounded-t-2xl shadow-2xl hover:brightness-110 cursor-pointer transition-all duration-150 w-[280px]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative shrink-0">
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-[10px] text-white">
                VN
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 border border-indigo-900 absolute bottom-0 right-0 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs truncate">Hỗ Trợ VietNenkin</p>
              <p className="text-[10px] text-indigo-200 truncate">Bấm để mở tin nhắn</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="p-1 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors"
              title="Mở rộng cửa sổ"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-rose-500/80 text-white/90 hover:text-white transition-colors"
              title="Đóng chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FULL DOCKED CHAT WINDOW (STANDARD OR MAXIMIZED) ──
  const windowClass = isMaximized
    ? 'fixed bottom-4 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[580px] md:w-[680px] h-[calc(100vh-5rem)] max-h-[740px] z-[80]'
    : 'fixed bottom-0 right-4 w-[calc(100vw-2rem)] sm:w-[370px] md:w-[400px] h-[520px] max-h-[82vh] z-[75]';

  return (
    <div className={`${windowClass} font-sans flex flex-col bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-all`}>
      
      {/* ── 1. CHAT HEADER ── */}
      <div className="p-3.5 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-indigo-600/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 border border-indigo-400/40 flex items-center justify-center font-bold text-xs text-white shadow-md">
              VN
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5 animate-pulse" />
          </div>

          <div className="min-w-0">
            <h4 className="font-bold text-xs truncate flex items-center gap-1.5">
              <span>Hỗ Trợ VietNenkin</span>
              {isStaffPreview && (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/40">
                  Staff Preview
                </span>
              )}
            </h4>
            <p className="text-[10px] text-emerald-300 flex items-center gap-1 truncate mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>{staffName} • Trực tuyến</span>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => fetchMessages(false)}
            className="p-1.5 rounded-xl hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
            title="Làm mới tin nhắn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-300' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-xl hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
            title="Thu nhỏ cửa sổ chat"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsMaximized(prev => !prev)}
            className="p-1.5 rounded-xl hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
            title={isMaximized ? 'Thu về kích thước nhỏ' : 'Mở rộng cửa sổ chat'}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-rose-500/80 text-slate-300 hover:text-white transition-colors"
            title="Đóng chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── 2. DOSSIER MINI INFO BANNER ── */}
      <div className="px-3.5 py-1.5 bg-slate-950/60 border-b border-slate-800 text-[11px] text-slate-300 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">
            Hồ sơ: <strong className="text-white">{customer?.fullName}</strong> (#{customer?.code})
          </span>
        </div>
        <span className="text-[10px] text-indigo-400 font-mono shrink-0 font-medium">Bảo mật 100%</span>
      </div>

      {/* ── 3. MESSAGE LIST CONTAINER ── */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-950/40 text-xs min-h-0">
        {loading && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-500" />
            <span className="text-[11px]">Đang kết nối trung tâm hỗ trợ...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
            <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
            <p className="font-semibold text-xs text-slate-300">Chào mừng Quý khách!</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[240px]">
              Hãy gửi tin nhắn để được chuyên viên hỗ trợ giải đáp thắc mắc hoặc cập nhật hồ sơ.
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.isMe;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Sender Name */}
                <span className="text-[10px] text-slate-400 mb-1 px-1">
                  {isMe ? 'Bạn' : msg.senderName}
                </span>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-md ${
                    isMe
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-tr-xs'
                      : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-xs'
                  }`}
                >
                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {msg.attachments.map((att, aIdx) => {
                        const isImg = att.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.url);

                        if (isImg) {
                          return (
                            <div
                              key={aIdx}
                              className="rounded-xl overflow-hidden border border-white/10 bg-black/30 cursor-pointer group relative"
                              onClick={() => setLightboxImage(att.url)}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={att.url}
                                alt={att.name || 'Ảnh đính kèm'}
                                className="max-h-48 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                Bấm để xem ảnh phóng to
                              </div>
                            </div>
                          );
                        }

                        return (
                          <a
                            key={aIdx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-xl bg-black/20 hover:bg-black/40 border border-white/10 text-white transition-colors"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                            <span className="truncate flex-1 text-[11px] underline">{att.name}</span>
                            <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                </div>

                {/* Timestamp */}
                <span className="text-[9px] text-slate-400 mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── 4. PENDING ATTACHMENTS PREVIEW ── */}
      {pendingAttachments.length > 0 && (
        <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          {pendingAttachments.map((att, idx) => (
            <div
              key={idx}
              className="relative rounded-lg overflow-hidden border border-indigo-500/40 bg-slate-800 p-1 flex items-center gap-1.5 shrink-0 text-xs text-slate-200"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="max-w-[100px] truncate text-[10px]">{att.name}</span>
              <button
                type="button"
                onClick={() => removePendingAttachment(idx)}
                className="p-0.5 rounded-full hover:bg-rose-500/80 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── 5. INPUT & ACTIONS BAR ── */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          accept="image/*,.pdf"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isSending}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shrink-0 disabled:opacity-50"
          title="Tải ảnh hoặc tài liệu đính kèm"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Nhập câu hỏi hoặc yêu cầu hỗ trợ..."
          disabled={isSending}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />

        <button
          type="submit"
          disabled={(!inputText.trim() && pendingAttachments.length === 0) || isSending}
          className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md hover:shadow-indigo-500/20 disabled:opacity-40 shrink-0"
          title="Gửi tin nhắn (Enter)"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* ── 6. LIGHTBOX MODAL ── */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 animate-in fade-in"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-white hover:bg-rose-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImage}
            alt="Enlarged preview"
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(lightboxImage, '_blank');
            }}
            className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Mở ảnh gốc trong tab mới</span>
          </button>
        </div>
      )}
    </div>
  );
}
