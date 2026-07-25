'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, X, Send, Bot, User, Sparkles, Headset, ArrowRight,
  CheckCircle2, HelpCircle, FileText, Clock, Wallet, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user' | 'system' | 'staff';
  text: string;
  timestamp: string;
}

export function FloatingAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'ai' | 'handover'>('ai'); // 'ai' or 'handover'
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Xin chào quý khách! Em là Trợ lý AI của VietNenkin Duyên. Em có thể giúp quý khách giải đáp thắc mắc về thủ tục lấy 80% Nenkin & Hoàn 20.42% tiền thuế.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Handover form state
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [handoverDone, setHandoverDone] = useState(false);
  const [handoverLoading, setHandoverLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // 1-Click FAQ Chips
  const FAQ_CHIPS = [
    { label: '📌 Điều kiện làm Nenkin', query: 'Điều kiện để làm thủ tục Nenkin Nhật Bản là gì?' },
    { label: '💰 Lấy được bao nhiêu tiền?', query: 'Số tiền lấy lại được là bao nhiêu (Lần 1 80% & Thuế 20.42%)?' },
    { label: '📑 Giấy tờ thủ tục cần gì?', query: 'Hồ sơ lấy Nenkin gồm những giấy tờ gì?' },
    { label: '⏳ Thời gian mất bao lâu?', query: 'Thời gian làm thủ tục lấy Nenkin & hoàn thuế mất bao lâu?' },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMsg).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/public-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });
      const data = await res.json();

      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply || 'Dạ em chưa rõ câu hỏi, quý khách có thể chọn các mục gợi ý bên dưới ạ!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiReply]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Dạ hiện tại đường truyền chập chờn. Quý khách có thể bấm "Gặp trực tiếp Tư vấn viên" để được hỗ trợ ngay ạ!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerContact.trim()) {
      toast.warning('Vui lòng nhập Tên và SĐT/Zalo để nhân viên tiện liên hệ.');
      return;
    }

    setHandoverLoading(true);
    try {
      // Connect to messenger conversation API
      const res = await fetch('/api/messenger/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Yêu cầu hỗ trợ: ${customerName.trim()}`,
          type: 'CUSTOMER_SUPPORT',
          initialMessage: `Khách hàng [${customerName.trim()}] (SĐT/Zalo: ${customerContact.trim()}) yêu cầu gặp Tư vấn viên từ Website.`,
        }),
      });

      if (res.ok) {
        setHandoverDone(true);
        toast.success('Đã gửi yêu cầu kết nối! Chuyên viên sẽ nhắn tin hỗ trợ quý khách ngay.');
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'system',
            text: `✅ Đã kết nối yêu cầu của ${customerName} (SĐT: ${customerContact}) với Đội ngũ Tư vấn viên VietNenkin Duyên. Chuyên viên sẽ liên hệ lại quý khách trong ít phút!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        toast.error('Gửi yêu cầu thất bại, vui lòng thử lại sau.');
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    } finally {
      setHandoverLoading(false);
    }
  };

  return (
    <>
      {/* ── FLOATING BUTTON AT BOTTOM RIGHT ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-50 p-3.5 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 group border border-white/20"
        aria-label="Trợ lý AI & Hỗ trợ khách hàng"
      >
        <div className="relative">
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
        </div>
        <span className="text-xs font-bold hidden sm:inline-block pr-1">Trợ Lý AI VietNenkin</span>
      </button>

      {/* ── CHAT POPUP WINDOW ── */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] h-[520px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in slide-in-from-bottom-5">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Trợ Lý AI VietNenkin
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Online
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Tư vấn Hoàn thuế & BH Nenkin 24/7</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switch Bar */}
          <div className="bg-slate-950 p-1.5 flex gap-1 border-b border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMode('ai')}
              className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                mode === 'ai'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> Hỏi Đáp AI Tự Động
            </button>
            <button
              type="button"
              onClick={() => setMode('handover')}
              className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                mode === 'handover'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Headset className="w-3.5 h-3.5" /> Gặp Tư Vấn Viên
            </button>
          </div>

          {/* ── MODE A: AI CHAT & FAQ CHIPS ── */}
          {mode === 'ai' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${
                      msg.sender === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white'
                          : msg.sender === 'system'
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-800 text-indigo-400 border border-slate-700'
                      }`}
                    >
                      {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : msg.sender === 'system'
                          ? 'bg-slate-800 border border-teal-500/40 text-teal-200 rounded-tl-none'
                          : 'bg-slate-800 border border-slate-700/60 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                      <span className="text-[9px] text-slate-400 block text-right mt-1 opacity-70">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
                    <Bot className="w-4 h-4 text-indigo-400" /> Trợ lý AI đang soạn câu trả lời...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Option Chips (1-Click FAQ) */}
              <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
                {FAQ_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip.query)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600/30 text-[10px] font-medium text-slate-300 hover:text-indigo-300 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-colors inline-flex items-center gap-1 shrink-0"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Chat Input Box */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2"
              >
                <Input
                  type="text"
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  placeholder="Nhập câu hỏi thủ tục Nenkin..."
                  className="bg-slate-800 border-slate-700 text-white text-xs h-9 focus:border-indigo-500"
                />
                <Button
                  type="submit"
                  size="xs"
                  disabled={loading || !inputMsg.trim()}
                  className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          )}

          {/* ── MODE B: HUMAN HANDOVER FORM ── */}
          {mode === 'handover' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center mx-auto border border-teal-500/30">
                  <Headset className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Kết Nối Trực Tiếp Tư Vấn Viên</h4>
                <p className="text-xs text-slate-400">
                  Để lại thông tin, chuyên viên VietNenkin Duyên sẽ nhắn tin phản hồi quý khách trong ít phút.
                </p>
              </div>

              {handoverDone ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h5 className="text-xs font-bold text-emerald-300">Yêu cầu đã được ghi nhận!</h5>
                  <p className="text-[11px] text-slate-300">
                    Chuyên viên sẽ liên hệ lại qua Zalo / Số điện thoại <strong>{customerContact}</strong> của bạn ngay lập tức.
                  </p>
                  <Button
                    type="button"
                    size="xs"
                    onClick={() => setMode('ai')}
                    className="bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700 mt-2"
                  >
                    Quay lại Hỏi đáp AI
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleRequestHandover} className="space-y-3 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Họ và Tên Của Bạn
                    </label>
                    <Input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="VD: Nguyen Van A"
                      className="bg-slate-800 border-slate-700 text-xs h-10"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Số Điện Thoại / Zalo Liện Hệ
                    </label>
                    <Input
                      type="text"
                      value={customerContact}
                      onChange={e => setCustomerContact(e.target.value)}
                      placeholder="VD: 0912345678 hoặc +81 80-XXXX-XXXX"
                      className="bg-slate-800 border-slate-700 text-xs h-10"
                    />
                  </div>

                  <Button
                    type="submit"
                    loading={handoverLoading}
                    loadingText="Đang kết nối..."
                    className="w-full h-10 bg-teal-600 hover:bg-teal-700 font-bold text-white text-xs rounded-xl shadow-lg shadow-teal-600/20 mt-2"
                  >
                    Gửi Yêu Cầu Kết Nối <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </form>
              )}
            </div>
          )}

        </div>
      )}
    </>
  );
}
