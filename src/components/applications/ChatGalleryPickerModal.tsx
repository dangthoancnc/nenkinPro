'use client';

import React, { useState, useEffect } from 'react';
import {
  X, Image as ImageIcon, MessageSquare, Inbox, Check, Loader2,
  ExternalLink, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatGalleryPickerModalProps {
  customerId: string;
  customerName?: string;
  targetDocTitle?: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

interface ChatAttachmentItem {
  url: string;
  name: string;
  size?: number;
  type?: string;
  messageId: string;
  createdAt: string;
}

export default function ChatGalleryPickerModal({
  customerId,
  customerName,
  targetDocTitle,
  onSelect,
  onClose,
}: ChatGalleryPickerModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [unclassifiedUrls, setUnclassifiedUrls] = useState<string[]>([]);
  const [chatAttachments, setChatAttachments] = useState<ChatAttachmentItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CHAT' | 'UNCLASSIFIED'>('ALL');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const fetchData = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/messenger/attachments?customerId=${customerId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setUnclassifiedUrls(json.data.unclassifiedUrls || []);
        setChatAttachments(json.data.chatAttachments || []);
      } else {
        toast.error(json.error || 'Không thể tải kho ảnh');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi kết nối tải ảnh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [customerId]);

  // Merge items into unified list
  const allItems: Array<{ url: string; source: 'CHAT' | 'UNCLASSIFIED'; name: string; time?: string }> = [
    ...unclassifiedUrls.map((url, idx) => ({
      url,
      source: 'UNCLASSIFIED' as const,
      name: `Tài liệu chưa phân loại #${idx + 1}`,
    })),
    ...chatAttachments.map(att => ({
      url: att.url,
      source: 'CHAT' as const,
      name: att.name || 'Ảnh gửi từ Chat',
      time: new Date(att.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    })),
  ];

  const filteredItems = allItems.filter(item => {
    if (activeFilter === 'CHAT') return item.source === 'CHAT';
    if (activeFilter === 'UNCLASSIFIED') return item.source === 'UNCLASSIFIED';
    return true;
  });

  const handleConfirmSelect = () => {
    if (!selectedUrl) {
      toast.warning('Vui lòng nhấp chọn 1 ảnh để gán vào hồ sơ');
      return;
    }
    onSelect(selectedUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-800">
                Chọn Ảnh Từ Kho Chat & Chưa Phân Loại
              </h3>
              <p className="text-[10px] text-slate-400">
                Gán vào mục: <strong className="text-indigo-600">{targetDocTitle || 'Hồ sơ'}</strong> {customerName ? `của ${customerName}` : ''}
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

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                activeFilter === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả ({allItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('CHAT')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                activeFilter === 'CHAT' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              💬 Từ Chat ({chatAttachments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('UNCLASSIFIED')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                activeFilter === 'UNCLASSIFIED' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📂 Chưa phân loại ({unclassifiedUrls.length})
            </button>
          </div>

          <button
            type="button"
            onClick={fetchData}
            title="Làm mới danh sách"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[50vh] p-1 border border-slate-100 rounded-xl bg-slate-50/50">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Đang tải tài liệu từ kho lưu trữ...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2 text-center p-4">
              <Inbox className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Chưa có tài liệu hoặc ảnh nào trong kho</p>
              <p className="text-[10px] text-slate-400 max-w-xs">
                Khi khách hàng gửi ảnh trong Messenger hoặc bạn lưu ảnh vào Kho chưa phân loại, ảnh sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredItems.map((item, idx) => {
                const isSelected = selectedUrl === item.url;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedUrl(item.url)}
                    className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all bg-white aspect-4/3 flex flex-col ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-300 shadow-md'
                        : 'border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />

                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    {/* Source Tag */}
                    <div className="absolute top-1.5 left-1.5">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs backdrop-blur-xs text-white ${
                        item.source === 'CHAT' ? 'bg-indigo-600/90' : 'bg-amber-600/90'
                      }`}>
                        {item.source === 'CHAT' ? '💬 Chat' : '📂 Kho đệm'}
                      </span>
                    </div>

                    {/* Info Overlay at Bottom */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-1.5 text-white opacity-90 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] font-semibold truncate leading-tight">{item.name}</p>
                      {item.time && <p className="text-[8px] opacity-75 font-mono">{item.time}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            {selectedUrl ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Đã chọn 1 ảnh để gán
              </span>
            ) : (
              <span>Chọn ảnh bạn muốn gán vào mục này</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleConfirmSelect}
              disabled={!selectedUrl}
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Gán & Chạy OCR
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
