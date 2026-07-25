'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, CheckCircle2, Clock, Wallet, FileText, KeyRound, LogOut,
  Building2, ArrowUpRight, MessageSquare, AlertCircle, Eye, EyeOff, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export default function CustomerPortalPage() {
  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [updatingPin, setUpdatingPin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/customer/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.customer) {
          setCustomer(data.customer);
        } else {
          router.push('/customer/login');
        }
      })
      .catch(() => router.push('/customer/login'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/customer/logout', { method: 'POST' });
    toast.success('Đã đăng xuất');
    router.push('/customer/login');
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPin.trim() || !newPin.trim()) {
      toast.warning('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('Mã PIN mới không khớp.');
      return;
    }
    if (newPin.trim().length < 4) {
      toast.error('Mã PIN phải từ 4-6 chữ số.');
      return;
    }

    setUpdatingPin(true);
    try {
      const res = await fetch('/api/auth/customer/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPin: currentPin.trim(),
          newPin: newPin.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Đổi mã PIN thành công!');
        setShowChangePinModal(false);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      } else {
        toast.error(data.error || 'Đổi mã PIN thất bại');
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setUpdatingPin(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        Đang nạp thông tin hồ sơ...
      </div>
    );
  }

  const app = customer?.applications?.[0];
  const status = app?.status || 'DRAFT';

  // 6-step progress status map
  const STAGES = [
    { key: 'DRAFT', label: '1. Khởi Tạo Hồ Sơ' },
    { key: 'SENT_1ST', label: '2. Nộp Cục BH (80%)' },
    { key: 'RECEIVED_1ST', label: '3. Nhận Tiền Lần 1' },
    { key: 'SENT_2ND', label: '4. Nộp Cục Thuế (20.42%)' },
    { key: 'RECEIVED_2ND', label: '5. Nhận Thuế Lần 2' },
    { key: 'COMPLETED', label: '6. Hoàn Tất Quyết Toán' },
  ];

  const getStageIndex = (st: string) => {
    switch (st) {
      case 'DRAFT': case 'PENDING': return 0;
      case 'SENT_1ST': return 1;
      case 'RECEIVED_1ST': return 2;
      case 'SENT_2ND': return 3;
      case 'RECEIVED_2ND': return 4;
      case 'COMPLETED': return 5;
      default: return 0;
    }
  };

  const currentStageIndex = getStageIndex(status);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      
      {/* ── 1. HEADER BAR ── */}
      <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
            {customer?.fullName?.[0] || 'K'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">{customer?.fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Mã Hồ Sơ: #{customer?.code}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Thẻ ngoại kiều: <span className="font-mono text-amber-300">{customer?.cardNumber || 'Chưa cập nhật'}</span> • SĐT: <span className="font-semibold text-slate-300">{customer?.phone || 'Chưa có'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setShowChangePinModal(true)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-xs"
          >
            <KeyRound className="w-3.5 h-3.5 mr-1 text-amber-400" /> Đổi Mã PIN
          </Button>
          <Button
            type="button"
            variant="danger"
            size="xs"
            onClick={handleLogout}
            className="font-bold text-xs"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" /> Đăng Xuất
          </Button>
        </div>
      </div>

      {/* ── 2. PROGRESS TRACKER ── */}
      <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-indigo-400" /> Tiến Độ Xử Lý Hồ Sơ Nenkin Thời Gian Thực
        </h2>

        {/* Stepper bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {STAGES.map((st, idx) => {
            const isPassed = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div
                key={st.key}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : isPassed
                    ? 'bg-slate-800/80 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900/50 border-slate-800 text-slate-600'
                }`}
              >
                <div className="w-6 h-6 rounded-full mx-auto mb-1.5 flex items-center justify-center font-bold text-[10px] bg-slate-800 text-slate-300">
                  {isPassed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : idx + 1}
                </div>
                <span className="text-[11px] font-bold block leading-tight">{st.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. FINANCE SUMMARY RIBBON & TAX OFFICE ── */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Lần 1: 80% */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Giai đoạn 1: Nộp Cục Bảo Hiểm</span>
          <h3 className="text-xl font-bold text-emerald-400">
            {app?.received1stJpy ? `${Number(app.received1stJpy).toLocaleString('ja-JP')} ¥` : 'Đang xử lý'}
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Số tiền bảo hiểm Lần 1 (80%) được Cục BH Nhật Bản chuyển trực tiếp về tài khoản cá nhân.
          </p>
        </div>

        {/* Lần 2: Thuế 20.42% */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Giai đoạn 2: Nộp Cục Thuế Hoàn (20.42%)</span>
          <h3 className="text-xl font-bold text-amber-400">
            {app?.tax2ndJpy ? `${Number(app.tax2ndJpy).toLocaleString('ja-JP')} ¥` : 'Đang tính toán'}
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Số tiền thuế được Người đại diện nộp đơn nhận lại từ Cục thuế quản lý.
          </p>
        </div>

        {/* Cục Thuế Quản Lý */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Cục Thuế Quản Lý
          </span>
          <h3 className="text-sm font-bold text-white">
            {customer?.taxOffice?.name || 'Đang tra cứu tự động'}
          </h3>
          <p className="text-[10px] text-slate-400 truncate">
            {customer?.taxOffice?.address || customer?.zairyuAddress || 'Địa chỉ thẻ ngoại kiều'}
          </p>
        </div>
      </div>

      {/* ── 4. DOCUMENT STATUS & SUPPORT CHAT BUTTON ── */}
      <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-400" /> Trạng Thái Giấy Tờ Đã Tải Lên
          </h2>
          <Button
            type="button"
            size="xs"
            onClick={() => router.push('/messenger')}
            className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs px-4"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1" /> Chat Nhắn Tin Với Hỗ Trợ
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-xs space-y-1">
            <span className="text-[10px] text-slate-400 block">Thẻ Ngoại Kiều (Mặt trước)</span>
            <span className={`font-bold block ${customer?.zairyuFrontUrl ? 'text-emerald-400' : 'text-amber-400'}`}>
              {customer?.zairyuFrontUrl ? '✓ Đã tải lên' : '⚠️ Chưa có'}
            </span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-xs space-y-1">
            <span className="text-[10px] text-slate-400 block">Thẻ Ngoại Kiều (Mặt sau)</span>
            <span className={`font-bold block ${customer?.zairyuBackUrl ? 'text-emerald-400' : 'text-amber-400'}`}>
              {customer?.zairyuBackUrl ? '✓ Đã tải lên' : '⚠️ Chưa có'}
            </span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-xs space-y-1">
            <span className="text-[10px] text-slate-400 block">Hộ Chiếu (Passport)</span>
            <span className={`font-bold block ${customer?.passportUrl ? 'text-emerald-400' : 'text-amber-400'}`}>
              {customer?.passportUrl ? '✓ Đã tải lên' : '⚠️ Chưa có'}
            </span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-xs space-y-1">
            <span className="text-[10px] text-slate-400 block">Sổ Nenkin / Thông báo Lần 1</span>
            <span className={`font-bold block ${app?.noticeImageUrl || customer?.nenkinBookUrl ? 'text-emerald-400' : 'text-amber-400'}`}>
              {app?.noticeImageUrl || customer?.nenkinBookUrl ? '✓ Đã tải lên' : '⚠️ Chưa có'}
            </span>
          </div>
        </div>
      </div>

      {/* ── CHANGE PIN MODAL ── */}
      {showChangePinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" /> Đổi Mã PIN Bảo Mật
              </h3>
              <button type="button" onClick={() => setShowChangePinModal(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePin} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mã PIN Hiện Tại</label>
                <Input
                  type="password"
                  value={currentPin}
                  onChange={e => setCurrentPin(e.target.value)}
                  placeholder="Mặc định: 123456"
                  className="bg-slate-800 border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mã PIN Mới (4-6 chữ số)</label>
                <Input
                  type="password"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="Nhập mã PIN mới"
                  className="bg-slate-800 border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Xác Nhận Mã PIN Mới</label>
                <Input
                  type="password"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  placeholder="Nhập lại mã PIN mới"
                  className="bg-slate-800 border-slate-700 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button type="button" variant="outline" size="xs" onClick={() => setShowChangePinModal(false)}>Hủy</Button>
                <Button type="submit" size="xs" loading={updatingPin} loadingText="Đang đổi..." className="bg-amber-500 hover:bg-amber-600 font-bold px-4 text-slate-950">
                  Cập Nhật Mã PIN
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
