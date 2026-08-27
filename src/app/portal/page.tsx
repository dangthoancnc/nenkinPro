'use client';

import React, { useState, useEffect } from 'react';
import { UserCircle, Wallet, Users, CheckCircle2, Clock, ArrowUpRight, MessageSquare, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function PortalPage() {
  const [user, setUser] = useState<any | null>(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalApplications: 0,
    totalCommissionJpy: 0,
    pendingCommissionJpy: 0,
  });
  const [feedList, setFeedList] = useState<any[]>([]);
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/employee/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setUser(data.user);
          // Fetch portal stats & feeds
          fetchPortalData(data.user.id);
        }
      })
      .catch(console.error);
  }, []);

  const fetchPortalData = (userId: string) => {
    fetch('/api/portal/stats')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setStats(d.data.stats);
          setFeedList(d.data.feeds || []);
        }
      })
      .catch(console.error);
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setPosting(true);
    const newFeed = {
      id: Date.now().toString(),
      actorName: user?.name || 'Tôi',
      action: 'BÀI ĐĂNG',
      content: postContent.trim(),
      createdAt: new Date().toISOString(),
    };
    setFeedList([newFeed, ...feedList]);
    setPostContent('');
    setPosting(false);
    toast.success('Đã đăng bài viết mới lên Bảng tin!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-12">
      
      {/* ── 1. FACEBOOK STYLE COVER & PROFILE HEADER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-indigo-600 border-4 border-white/20 flex items-center justify-center text-white shadow-xl shrink-0">
              <UserCircle className="w-16 h-16" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">{user?.name || 'Trang cá nhân'}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 border border-indigo-400/40 text-indigo-200">
                  {user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'STAFF' ? 'Nhân viên' : 'Cộng tác viên (CTV)'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Mã định danh: <strong className="font-mono text-amber-300">#{user?.staffCode || user?.id?.slice(0, 8) || 'CTV001'}</strong> • Mã giới thiệu: <strong className="font-mono text-emerald-300">{user?.staffCode || 'CTV001'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs px-4"
              onClick={() => router.push('/messenger')}
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Mở Messenger Chat
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. STAT MINI-RIBBON (TÀI CHÍNH & HOA HỒNG CTV) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Khách giới thiệu</span>
            <span className="text-lg font-bold text-slate-900">{stats.totalCustomers} <span className="text-xs text-slate-500 font-normal">người</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hồ sơ xử lý</span>
            <span className="text-lg font-bold text-slate-900">{stats.totalApplications} <span className="text-xs text-slate-500 font-normal">bộ</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hoa hồng tích lũy</span>
            <span className="text-lg font-bold text-amber-600">{stats.totalCommissionJpy.toLocaleString('ja-JP')} ¥</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chờ quyết toán</span>
            <span className="text-lg font-bold text-emerald-600">{stats.pendingCommissionJpy.toLocaleString('ja-JP')} ¥</span>
          </div>
        </div>
      </div>

      {/* ── BÀN LÀM VIỆC CỦA NHÂN VIÊN/ADMIN ── */}
      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 shadow-xs">
          <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <UserCircle className="w-4 h-4" /> Bàn làm việc của Quản lý / Nhân viên xử lý
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => router.push('/applications')}>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Hồ sơ đang phụ trách</h4>
                <p className="text-[10px] text-slate-500">Xem danh sách các hồ sơ được phân công cho bạn xử lý.</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => router.push('/tax-representatives')}>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Thông tin Đại diện thuế của tôi</h4>
                <p className="text-[10px] text-slate-500">Cập nhật tài khoản ngân hàng và thông tin cá nhân nộp lên Cục thuế.</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      )}

      {/* ── 3. MAIN WORKSPACE GRID (BẢNG TIN FEED + DASHBOARD) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* LEFT 2 COLS: ACTIVITY FEED (PHONG CÁCH FACEBOOK) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Post Composer */}
          <form onSubmit={handlePostSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 text-xs">
                {user?.name?.[0] || 'U'}
              </div>
              <input
                type="text"
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder="Viết cập nhật tiến độ công việc hoặc ghi chú..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button type="submit" size="xs" disabled={posting || !postContent.trim()} className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs px-4">
                <Send className="w-3 h-3 mr-1" /> Đăng bài
              </Button>
            </div>
          </form>

          {/* Activity Feed List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Bảng tin hoạt động công việc</h3>
            
            {feedList.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400">
                Chưa có bài đăng hoặc hoạt động nào
              </div>
            ) : (
              feedList.map((item) => (
                <div key={item.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                        {item.actorName?.[0] || 'N'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">{item.actorName}</h4>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(item.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {item.action}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed pl-10">
                    {item.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COL: QUICK TOOLS & COMMISSIONS */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Công cụ nhanh CTV
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/onboarding?ref=${user?.staffCode || 'CTV001'}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Đã chép link đăng ký giới thiệu!');
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-700">📋 Chép Link giới thiệu</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Gửi cho Khách hàng tự điền thông tin và nhận thưởng +2.000 JPY.</p>
              </button>

              <button
                type="button"
                onClick={() => router.push('/applications')}
                className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-700">📁 Quản lý Danh sách Hồ sơ</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Xem trạng thái chi tiết của tất cả các bộ hồ sơ.</p>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
