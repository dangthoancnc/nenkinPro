'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Search, PhoneCall, ArrowRight, Star, Eye, EyeOff } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [refCode, setRefCode] = useState('');
  const [appCode, setAppCode] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (refCode.trim()) {
      router.push(`/onboarding?ref=${refCode.trim()}`);
    } else {
      router.push(`/onboarding`);
    }
  };

  const handleTrackApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError('');
    setTrackLoading(true);
    try {
      const res = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', cardNumber: appCode, passwordPin: pin })
      });
      const data = await res.json();
      if (data.success) {
        router.push('/portal/dashboard');
      } else {
        setTrackError(data.error || 'Thông tin không chính xác.');
      }
    } catch {
      setTrackError('Lỗi kết nối máy chủ.');
    } finally {
      setTrackLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Navbar */}
      <nav className="bg-white text-slate-800 py-3 px-6 md:px-8 flex items-center justify-between shadow-sm border-b border-slate-200">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold tracking-wide">VietNenkin<span className="text-red-500">Duyên</span></span>
        </div>
        <div className="hidden md:flex gap-6 font-medium items-center">
          <a href="#create" className="hover:text-indigo-600 transition-colors">Tự tạo hồ sơ</a>
          <a href="#track" className="hover:text-indigo-600 transition-colors">Theo dõi</a>
          <a href="#contact" className="hover:text-indigo-600 transition-colors">Liên hệ</a>
          <div className="w-px h-5 bg-slate-200 mx-2"></div>
          <a href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">Đăng nhập Nhân viên</a>
        </div>
      </nav>

      {/* Dark Blue Hero Section */}
      <section className="bg-slate-900 text-white py-8 px-4 text-center shadow-inner relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-0 opacity-80"></div>
        <div className="max-w-4xl mx-auto space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight drop-shadow-md">
            Dịch vụ lấy lại Nenkin <span className="text-amber-400">Uy tín & Nhanh chóng</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 font-medium max-w-2xl mx-auto drop-shadow-sm">
            Hỗ trợ hoàn thuế và lấy lại tiền Nenkin Nhật Bản với thủ tục đơn giản, chuyên nghiệp và tận tâm bởi đội ngũ VietNenkin Duyên.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 grid md:grid-cols-2 gap-6 md:gap-8">
        
        {/* Create Application */}
        <section id="create" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-full">
              <Star className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Tự tạo hồ sơ</h2>
          </div>
          <p className="text-sm text-slate-600 mb-5">
            Bắt đầu làm hồ sơ hoàn thuế Nenkin của bạn ngay hôm nay. Vui lòng nhập mã nhân viên hoặc mã khách hàng giới thiệu để tiếp tục.
          </p>
          <form onSubmit={handleCreateApp} className="space-y-3">
            <div>
              <label htmlFor="refCode" className="block text-sm font-medium text-slate-700 mb-1">Mã giới thiệu (Tùy chọn - Nhập để giảm 2.000 JPY)</label>
              <input 
                id="refCode"
                type="text" 
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                autoComplete="off"
                placeholder="Mã NV hoặc mã KH giới thiệu (Nếu có)" 
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              Bắt đầu tạo hồ sơ <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </section>

        {/* Track Application */}
        <section id="track" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-full">
              <Search className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Theo dõi hồ sơ</h2>
          </div>
          <p className="text-sm text-slate-600 mb-5">
            Vui lòng nhập mã hồ sơ và mật khẩu đã được cấp để kiểm tra trạng thái tiến trình xử lý hồ sơ.
          </p>
          <form onSubmit={handleTrackApp} className="space-y-3">
            <div>
              <label htmlFor="appCode" className="block text-sm font-medium text-slate-700 mb-1">Số thẻ ngoại kiều hoặc Mã hồ sơ</label>
              <input 
                id="appCode"
                name="zairyu_track_id"
                type="text" 
                value={appCode}
                onChange={(e) => setAppCode(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="VD: AB12345678CD hoặc KH-XXXXXX" 
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu (Năm sinh 4 số)</label>
              <div className="relative">
                <input 
                  id="pin"
                  name="zairyu_track_pin"
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="VD: 1995" 
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all pr-12"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPin(!showPin)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {trackError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{trackError}</p>
            )}
            <button 
              type="submit"
              disabled={trackLoading}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-300 disabled:opacity-50"
            >
              {trackLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang kiểm tra...</> : 'Kiểm tra ngay'}
            </button>
          </form>
        </section>
      </div>

      {/* Contact Section */}
      <section id="contact" className="bg-slate-100 py-6 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-block p-3 bg-white rounded-full shadow-sm">
            <PhoneCall className="w-6 h-6 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Liên hệ tư vấn</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm">
            Đội ngũ chuyên viên của chúng tôi luôn sẵn sàng hỗ trợ giải đáp mọi thắc mắc của bạn về thủ tục hoàn thuế Nenkin.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a href="tel:+81123456789" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-full shadow-md transition-transform hover:scale-105 text-sm">
              Gọi Hotline: 0123-456-789
            </a>
            <a href="mailto:support@nenkinantam.com" className="bg-white hover:bg-slate-50 text-slate-800 font-semibold py-2.5 px-6 rounded-full shadow-sm border border-slate-200 transition-transform hover:scale-105 text-sm">
              Trợ giúp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-4 text-center text-[11px] border-t border-slate-800">
        <p>© 2026 VietNenkin Duyên. All rights reserved.</p>
      </footer>
    </div>
  );
}
