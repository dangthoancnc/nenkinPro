'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, CreditCard, ShieldCheck, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function CustomerLoginPage() {
  const [loginId, setLoginId] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    fetch('/api/auth/customer/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.customer) {
          router.push('/customer/portal');
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !pinCode.trim()) {
      toast.warning('Vui lòng nhập Mã thẻ ngoại kiều / Mã hồ sơ và Mã PIN.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: loginId.trim(),
          pinCode: pinCode.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Xin chào ${data.customer?.fullName || 'Khách hàng'}!`);
        router.push('/customer/portal');
        router.refresh();
      } else {
        toast.error(data.error || 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Dynamic Background Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-teal-400 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Tra Cứu Tiến Độ Hồ Sơ Nenkin</h1>
          <p className="text-xs text-slate-400">Dành riêng cho Khách hàng làm thủ tục Hoàn thuế & BH Nenkin</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Mã Thẻ Ngoại Kiều / Mã Hồ Sơ / SĐT
            </label>
            <Input
              type="text"
              value={loginId}
              onChange={e => setLoginId(e.target.value)}
              placeholder="VD: SA85156393LA hoặc KH004"
              className="bg-slate-800 border-slate-700 text-white text-xs h-11 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> Mã PIN Bảo Mật (Mặc định: 123456)
              </span>
            </label>
            <div className="relative">
              <Input
                type={showPin ? 'text' : 'password'}
                value={pinCode}
                onChange={e => setPinCode(e.target.value)}
                placeholder="Nhập 6 số PIN (Mặc định: 123456)"
                className="bg-slate-800 border-slate-700 text-white text-xs h-11 pr-10 focus:border-indigo-500 font-mono tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            loadingText="Đang xác thực..."
            className="w-full h-11 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600 font-bold text-white text-xs rounded-xl shadow-lg shadow-indigo-500/20"
          >
            Đăng Nhập Tra Cứu <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        {/* Quick Demo Autofill */}
        <div className="pt-3 border-t border-slate-800 text-center space-y-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Thử nghiệm nhanh (Demo):</p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => { setLoginId('SA85156393LA'); setPinCode('123456'); }}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-indigo-300 rounded-lg border border-slate-700 transition-colors"
            >
              LO THI HIEN (#KH004)
            </button>
            <button
              type="button"
              onClick={() => { setLoginId('KH001'); setPinCode('123456'); }}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-teal-300 rounded-lg border border-slate-700 transition-colors"
            >
              THAN VAN TUAN (#KH001)
            </button>
          </div>
        </div>

        {/* Support Help */}
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          Quên mã PIN? Vui lòng liên hệ <strong className="text-indigo-400 font-medium">Cộng tác viên giới thiệu</strong> hoặc <strong className="text-teal-400 font-medium">Admin VietNenkin</strong> để được đặt lại mã PIN 1-click.
        </p>

      </div>
    </div>
  );
}
