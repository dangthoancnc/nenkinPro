'use client';

import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Mail, Calculator } from 'lucide-react';
import { generateSettlementTemplates, SettlementInput, formatJpy, formatVnd } from '@/lib/settlementCalculator';
import { toast } from 'sonner';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputData: SettlementInput;
  customerEmail?: string;
}

export function SettlementModal({ isOpen, onClose, inputData, customerEmail }: SettlementModalProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'lan1' | 'lan2' | 'ctv'>('lan1');

  if (!isOpen) return null;

  const templates = generateSettlementTemplates(inputData);

  const getActiveText = () => {
    if (activeTab === 'lan1') return templates.template1st;
    if (activeTab === 'lan2') return templates.template2nd;
    return templates.templateCtv;
  };

  const handleCopy = (tabKey: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabKey);
    toast.success('Đã sao chép mẫu thông báo!');
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleOpenEmail = (subject: string, body: string) => {
    const email = customerEmail || '';
    const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Mẫu thông báo Quyết toán (Dành cho Nhân viên)</h3>
              <p className="text-[10px] text-slate-400">Tự động tính toán số liệu — Nhân viên xem xét & gửi thủ công</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 grid grid-cols-3 gap-2 text-xs shrink-0">
          <div className="bg-white p-2 rounded-lg border border-slate-200/80">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Thực nhận Lần 1 (80%)</span>
            <span className="font-bold text-indigo-700">{formatJpy(templates.summary.r1st)}</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200/80">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Thuế Lần 2 (20.42%)</span>
            <span className="font-bold text-purple-700">{formatJpy(templates.summary.r2nd)}</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200/80">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Khách thực nhận còn lại</span>
            <span className="font-bold text-emerald-700">{formatJpy(templates.summary.net2ndJpy)}</span>
          </div>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="px-5 pt-3 border-b border-slate-200 flex gap-2 shrink-0 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('lan1')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'lan1' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            🔵 Thông báo Lần 1 (80%)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lan2')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'lan2' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            🟣 Thông báo Quyết toán Lần 2
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ctv')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'ctv' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            🤝 Thưởng CTV (+2.000 JPY)
          </button>
        </div>

        {/* Content Box */}
        <div className="p-5 flex-1 min-h-0 overflow-y-auto bg-slate-100/50">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative">
            <pre className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed select-all">
              {getActiveText()}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-400">
            * Nhấp Copy để gửi qua Zalo/Facebook, hoặc Nhấp Gửi Email để mở ứng dụng mail.
          </p>
          <div className="flex items-center gap-2">
            {customerEmail && (
              <button
                type="button"
                onClick={() => handleOpenEmail(
                  activeTab === 'lan1' ? 'Thông báo kết quả Nenkin Lần 1' : activeTab === 'lan2' ? 'Thông báo quyết toán hoàn thuế Lần 2' : 'Thông báo hoa hồng CTV',
                  getActiveText()
                )}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Mở Mẫu Email
              </button>
            )}
            <button
              type="button"
              onClick={() => handleCopy(activeTab, getActiveText())}
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              {copiedTab === activeTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedTab === activeTab ? 'Đã Sao Chép!' : 'Copy Mẫu Thông Báo'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
