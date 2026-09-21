"use client";

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const PdfMapperClient = dynamic(() => import('./PdfMapperClient'), {
  ssr: false,
  loading: () => <div className="p-10 flex justify-center items-center h-screen bg-slate-100 text-slate-500">Đang tải giao diện Kéo thả...</div>
});

function PdfMapperGuard() {
  const { isLoading, isAdmin } = useCurrentUser();

  if (isLoading) {
    return <div className="p-10 flex justify-center items-center h-screen bg-slate-100 text-slate-500">Đang kiểm tra quyền truy cập...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/40">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Truy cập bị từ chối</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Chức năng <strong className="text-white">Thiết lập Tọa độ PDF</strong> là khu vực kỹ thuật cấu hình phôi in pháp lý, chỉ dành riêng cho tài khoản Quản trị viên (<span className="text-amber-400 font-semibold">ADMIN</span>).
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Bảng điều khiển
        </Link>
      </div>
    );
  }

  return <PdfMapperClient />;
}

export default function PdfMapperPage() {
  return (
    <Suspense fallback={<div className="p-10 flex justify-center items-center h-screen bg-slate-100 text-slate-500">Đang khởi tạo ứng dụng...</div>}>
      <PdfMapperGuard />
    </Suspense>
  );
}
