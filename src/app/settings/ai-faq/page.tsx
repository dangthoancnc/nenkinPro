'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Sparkles, HelpCircle, ArrowLeft, Save, Eye, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

interface FaqItem {
  id: string;
  key: string;
  label: string;
  keywords: string[];
  answer: string;
  isActive: boolean;
  order: number;
}

export default function AiFaqSettingsPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [formKey, setFormKey] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formOrder, setFormOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/faq');
      const data = await res.json();
      if (data.success) {
        setFaqs(data.data);
      } else {
        toast.error(data.error || 'Không thể nạp danh sách câu hỏi.');
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormKey(`faq-${Date.now().toString().slice(-4)}`);
    setFormLabel('');
    setFormKeywords('');
    setFormAnswer('');
    setFormOrder(faqs.length + 1);
    setFormIsActive(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: FaqItem) => {
    setEditingItem(item);
    setFormKey(item.key);
    setFormLabel(item.label);
    setFormKeywords(item.keywords ? item.keywords.join(', ') : '');
    setFormAnswer(item.answer);
    setFormOrder(item.order);
    setFormIsActive(item.isActive);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim() || !formAnswer.trim()) {
      toast.warning('Vui lòng nhập Tên hiển thị (Nút bấm) và Nội dung câu trả lời.');
      return;
    }

    setSaving(true);
    try {
      const isEdit = Boolean(editingItem);
      const url = '/api/admin/faq';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...(isEdit && { id: editingItem?.id }),
        key: formKey,
        label: formLabel,
        keywords: formKeywords,
        answer: formAnswer,
        order: formOrder,
        isActive: formIsActive,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? 'Cập nhật câu hỏi thành công!' : 'Thêm mới câu hỏi thành công!');
        setShowModal(false);
        fetchFaqs();
      } else {
        toast.error(data.error || 'Lưu thất bại.');
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: FaqItem) => {
    try {
      const res = await fetch('/api/admin/faq', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã ${!item.isActive ? 'kích hoạt' : 'tắt'} câu hỏi: ${item.label}`);
        setFaqs(prev => prev.map(f => f.id === item.id ? { ...f, isActive: !f.isActive } : f));
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa câu hỏi "${label}" khỏi Ngân hàng dữ liệu?`)) return;

    try {
      const res = await fetch(`/api/admin/faq?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã xóa câu hỏi!');
        setFaqs(prev => prev.filter(f => f.id !== id));
      } else {
        toast.error(data.error || 'Xóa thất bại.');
      }
    } catch (err: any) {
      toast.error('Lỗi xóa: ' + err.message);
    }
  };

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden pb-20 md:pb-0">
      
      {/* ── HEADER RIBBON ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2.5">
          <Link href="/settings" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Ngân Hàng Câu Hỏi & Trợ Lý AI
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Thiết lập danh sách lựa chọn gợi ý và câu trả lời kịch bản phản hồi tức thì 0ms cho Khung Chat Khách hàng.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" variant="outline" size="xs" onClick={fetchFaqs} className="gap-1 font-bold text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </Button>
          <Button type="button" size="xs" onClick={handleOpenAddModal} className="bg-amber-500 hover:bg-amber-600 font-bold text-xs text-slate-950 gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> Thêm Câu Hỏi Mới
          </Button>
        </div>
      </div>

      {/* ── STATS SUMMARY RIBBON ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm space-y-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tổng số câu hỏi kịch bản</span>
          <span className="text-lg font-extrabold text-slate-900">{faqs.length} câu</span>
        </div>
        <div className="p-3 bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm space-y-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Đang hoạt động (Online)</span>
          <span className="text-lg font-extrabold text-emerald-600">{faqs.filter(f => f.isActive).length} câu</span>
        </div>
        <div className="p-3 bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm space-y-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tốc độ phản hồi</span>
          <span className="text-lg font-extrabold text-indigo-600">Tức thì (0ms)</span>
        </div>
      </div>

      {/* ── TABLE LIST ── */}
      <Card className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-100/70 dark:bg-slate-900/60">
            <TableRow>
              <TableHead className="w-[60px] text-center">STT</TableHead>
              <TableHead className="w-[200px]">Nút Bấm / Nhãn Nhanh</TableHead>
              <TableHead className="w-[220px]">Từ Khóa Nhận Diện AI</TableHead>
              <TableHead>Nội Dung Đáp Án Kịch Bản Soạn Sẵn</TableHead>
              <TableHead className="w-[100px] text-center">Trạng Thái</TableHead>
              <TableHead className="w-[110px] text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-500">
                  Đang nạp Ngân hàng dữ liệu câu hỏi...
                </TableCell>
              </TableRow>
            ) : faqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-500">
                  Chưa có câu hỏi nào trong ngân hàng dữ liệu. Hãy bấm "Thêm Câu Hỏi Mới".
                </TableCell>
              </TableRow>
            ) : (
              faqs.map((item, idx) => (
                <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="text-center font-bold text-xs text-slate-500">
                    #{item.order || idx + 1}
                  </TableCell>
                  <TableCell className="font-bold text-xs text-slate-900">
                    <span className="inline-block px-2.5 py-1 bg-slate-800 text-amber-300 rounded-xl border border-slate-700 text-xs shadow-xs">
                      {item.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.keywords?.map((kw, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-medium rounded-md border border-indigo-200">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 max-w-md">
                    <p className="line-clamp-2 whitespace-pre-line font-mono text-[11px]">
                      {item.answer}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                        item.isActive
                          ? 'bg-emerald-500/20 text-emerald-700 border-emerald-400'
                          : 'bg-slate-200 text-slate-500 border-slate-300'
                      }`}
                    >
                      {item.isActive ? '✓ Bật' : '✕ Tắt'}
                    </button>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => handleOpenEditModal(item)}
                      className="text-slate-600 hover:text-indigo-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => handleDelete(item.id, item.label)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* ── MODAL ADD / EDIT FAQ ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {editingItem ? 'Chỉnh Sửa Câu Hỏi Kịch Bản' : 'Thêm Câu Hỏi Kịch Bản Mới'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Nhãn Nút Bấm Lựa Chọn (Tên Chip)
                  </label>
                  <Input
                    type="text"
                    value={formLabel}
                    onChange={e => setFormLabel(e.target.value)}
                    placeholder="VD: 📌 Điều kiện làm Nenkin"
                    className="text-xs h-9"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Mã Nhận Diện (Unique Key)
                  </label>
                  <Input
                    type="text"
                    value={formKey}
                    onChange={e => setFormKey(e.target.value)}
                    placeholder="VD: dieu-kien"
                    className="text-xs h-9 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Từ Khóa Nhận Diện AI (Phân cách bằng dấu phẩy)
                </label>
                <Input
                  type="text"
                  value={formKeywords}
                  onChange={e => setFormKeywords(e.target.value)}
                  placeholder="VD: điều kiện, dieu kien, được làm nenkin, ai được làm"
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Nội Dung Đáp Án Soạn Sẵn (Hỗ trợ Markdown)
                </label>
                <textarea
                  rows={6}
                  value={formAnswer}
                  onChange={e => setFormAnswer(e.target.value)}
                  placeholder="Nhập nội dung câu trả lời soạn sẵn chi tiết..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Thứ Tự Sắp Xếp (Order)
                  </label>
                  <Input
                    type="number"
                    value={formOrder}
                    onChange={e => setFormOrder(Number(e.target.value))}
                    className="text-xs h-9"
                  />
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={e => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    Bật Kích Hoạt (Hiển thị công khai)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" size="xs" onClick={() => setShowModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" size="xs" loading={saving} loadingText="Đang lưu..." className="bg-amber-500 hover:bg-amber-600 font-bold px-5 text-slate-950">
                  <Save className="w-3.5 h-3.5 mr-1" /> Lưu Cấu Hình
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
