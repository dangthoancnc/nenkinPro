'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Settings, FileText, Building2, UserCheck, Lock, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function SettingsPage() {
  const { isAdmin, isLoading } = useCurrentUser();
  const [showChangePassword, setShowChangePassword] = useState(false);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 text-sm">Đang tải cấu hình...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Quyền truy cập bị giới hạn</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Khu vực Cài đặt Hệ thống chỉ dành riêng cho tài khoản Quản trị viên (ADMIN).
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Bảng điều khiển
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-600" />
          Cài đặt Hệ thống
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Quản lý các cấu hình cốt lõi của hệ thống VietNenkin</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Mapper Card */}
        <Link href="/admin/pdf-mapper" className="block group">
          <Card className="p-6 h-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl hover:border-indigo-400 hover:shadow-2xl transition-all cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">Cấu hình Tọa độ PDF</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">
                  Giao diện Kéo - Thả trực quan để thiết lập tọa độ in ấn cho các biểu mẫu PDF (Đơn xin Lần 1, Bảng 1-2, Bảng 3...).
                </p>
              </div>
            </div>
          </Card>
        </Link>

        {/* Tax Representatives Card */}
        <Link href="/tax-representatives" className="block group">
          <Card className="p-6 h-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl hover:border-indigo-400 hover:shadow-2xl transition-all cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                <UserCheck className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">Người Đại Diện Thuế</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">
                  Quản lý danh sách Người đại diện thuế tại Nhật và cấu hình sẵn Tài khoản Ngân hàng (JPY) nhận tiền hoàn thuế Lần 2.
                </p>
              </div>
            </div>
          </Card>
        </Link>

        {/* Tax Offices Card */}
        <Link href="/tax-offices" className="block group">
          <Card className="p-6 h-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl hover:border-teal-400 hover:shadow-2xl transition-all cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50/80 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors">
                <Building2 className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 transition-colors">Cục Thuế Quản Lý</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">
                  Quản lý danh sách các Cục Thuế địa phương và thông tin gửi thư / tiếp nhận hồ sơ.
                </p>
              </div>
            </div>
          </Card>
        </Link>

        {/* AI FAQ Knowledge Base Card */}
        <Link href="/settings/ai-faq" className="block group">
          <Card className="p-6 h-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl hover:border-amber-400 hover:shadow-2xl transition-all cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50/80 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                <Settings className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 transition-colors">Ngân hàng Câu hỏi Trợ lý AI</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">
                  Thiết lập và chỉnh sửa danh sách câu hỏi gợi ý, nội dung câu trả lời kịch bản soạn sẵn cho Trợ lý AI & Khung Chat khách hàng.
                </p>
              </div>
            </div>
          </Card>
        </Link>

        {/* Security / Change Password Card */}
        <div onClick={() => setShowChangePassword(true)} className="block group cursor-pointer">
          <Card className="p-6 h-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl hover:border-violet-400 hover:shadow-2xl transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-50/80 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
                <Lock className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 transition-colors">Bảo Mật & Đổi Mật Khẩu</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">
                  Tự cập nhật mật khẩu đăng nhập cá nhân định kỳ để đảm bảo an toàn cho tài khoản và dữ liệu hệ thống.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
}
