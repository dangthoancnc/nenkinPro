import React from 'react';
import Link from 'next/link';
import { Settings, FileText, Building2, Banknote } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-indigo-600" />
            Cài đặt Hệ thống
          </h1>
          <p className="text-slate-500 mt-2">Quản lý các cấu hình cốt lõi của hệ thống VietNenkin</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PDF Mapper Card */}
          <Link href="/admin/pdf-mapper" className="block group">
            <Card className="p-6 h-full border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer bg-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Cấu hình Tọa độ PDF</h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-3">
                    Giao diện Kéo - Thả trực quan để thiết lập tọa độ in ấn cho các biểu mẫu PDF (Đơn xin Lần 1, Bảng 1-2, Bảng 3...).
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Tax Offices Card */}
          <Link href="/tax-offices" className="block group">
            <Card className="p-6 h-full border border-slate-200 hover:teal-400 hover:shadow-md transition-all cursor-pointer bg-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors">
                  <Building2 className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-teal-600 transition-colors">Cục Thuế & Người đại diện</h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-3">
                    Quản lý danh sách các Cục Thuế địa phương và thiết lập Người đại diện Thuế mặc định cho từng khu vực.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Finance Placeholder Card */}
          <Card className="p-6 h-full border border-slate-200 bg-slate-50 opacity-60">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                <Banknote className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-700">Tỷ giá & Hoa hồng</h3>
                <p className="text-sm text-slate-500 mt-2">
                  (Tính năng đang phát triển) Thiết lập tỷ giá DCOM tự động và công thức tính phí hoa hồng.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
