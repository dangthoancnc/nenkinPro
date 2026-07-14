import React from 'react';
import { ArrowLeft, UploadCloud, FileText, CheckCircle, Save, FolderOpen, Printer, PieChart, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function CustomerPreviewLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Area */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/customers" className="text-slate-500 hover:text-indigo-600 transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  ĐÀM THỊ THƠM
                  <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-md border border-amber-200">Chờ xử lý</span>
                </h1>
                <p className="text-sm text-slate-500 font-mono">Mã KH: NENKIN-98765 • Đã tạo: 14/06/2026</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="text-slate-600 bg-white border-slate-300">Hủy thay đổi</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
                <Save className="w-4 h-4" /> Lưu thông tin
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-6 mt-2 overflow-x-auto">
            <button className="border-b-2 border-indigo-600 text-indigo-600 font-medium py-3 px-2 flex items-center gap-2 whitespace-nowrap">
              <FileText className="w-4 h-4" /> 1. Nhập liệu & Giấy tờ
            </button>
            <button className="border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium py-3 px-2 flex items-center gap-2 whitespace-nowrap">
              <FolderOpen className="w-4 h-4" /> 2. Chi tiết Hồ sơ Thuế
            </button>
            <button className="border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium py-3 px-2 flex items-center gap-2 whitespace-nowrap">
              <Printer className="w-4 h-4" /> 3. In Biểu mẫu
            </button>
            <button className="border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium py-3 px-2 flex items-center gap-2 whitespace-nowrap">
              <PieChart className="w-4 h-4" /> 4. Báo cáo tổng quan
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area (Tab 1: Nhập liệu) */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Documents & OCR (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Tài liệu đính kèm</h2>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-semibold">Tự động trích xuất OCR</span>
            </div>

            <Card className="p-4 border border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Thẻ Ngoại Kiều (Zairyu)</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Đã quét OCR</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Xem ảnh</Button>
            </Card>

            <Card className="p-4 border border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Hộ chiếu</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Đã quét OCR</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Xem ảnh</Button>
            </Card>

            <Card className="p-4 border-dashed border-2 border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 transition-colors">
              <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700">Tải lên Sổ Nenkin</p>
            </Card>
            
            <Card className="p-4 border-dashed border-2 border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 transition-colors">
              <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700">Tải lên Sổ Ngân hàng VN</p>
            </Card>
          </div>

          {/* Right Column: Data Entry Form (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Section 1: Thông tin cơ bản */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">1. Thông tin cá nhân</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Họ và tên</label>
                  <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" defaultValue="DAM THI THOM" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Furigana (Katakana)</label>
                  <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" defaultValue="ダム ティ トム" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Ngày sinh</label>
                  <input type="date" className="w-full border-slate-300 rounded-lg text-sm bg-white" defaultValue="1995-05-12" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Mã số thẻ Nenkin</label>
                  <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="1234-567890" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Mã số cá nhân (My Number)</label>
                  <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="123456789012" />
                </div>
              </div>
            </section>

            {/* Section 2: Địa chỉ */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">2. Thông tin Địa chỉ</h2>
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <h3 className="text-sm font-semibold text-indigo-900 mb-3">Địa chỉ tại Nhật (Zairyu)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Mã bưu điện</label>
                      <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="123-4567" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Địa chỉ đầy đủ</label>
                      <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="Tokyo-to..." />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <h3 className="text-sm font-semibold text-emerald-900 mb-3">Địa chỉ tại Việt Nam (Tự động lưu vào Form 1)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Tỉnh / Thành phố</label>
                      <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="VD: HA NOI" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Quận / Huyện / Phường</label>
                      <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="VD: CAU GIAY" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-600">Tên đường / Thôn xóm</label>
                      <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="VD: 123 XUAN THUY" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Ngân hàng */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">3. Ngân hàng nhận tiền Lần 1</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Tên Ngân hàng</label>
                  <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="Vietcombank" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Tên Chi nhánh</label>
                  <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="Ba Dinh Branch" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Thành phố chi nhánh</label>
                  <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="Hanoi" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Tên chủ tài khoản (Romaji)</label>
                  <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="DAM THI THOM" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Tên chủ tài khoản (Katakana)</label>
                  <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="ダム ティ トム" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Swift Code</label>
                  <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="BFTVVNVX" />
                </div>
              </div>
            </section>

            {/* Section 4: Lịch sử làm việc */}
            <section>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
                <h2 className="text-lg font-bold text-slate-800">4. Lịch sử công ty làm việc (Form Lần 1)</h2>
                <Button variant="outline" size="sm" className="h-8 gap-1"><Plus className="w-4 h-4"/> Thêm công ty</Button>
              </div>
              
              <div className="p-4 border border-slate-200 rounded-xl bg-white mb-4 shadow-sm relative">
                <button className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-600">Tên công ty (Tự động xuất ra Form 1 Trang 2)</label>
                    <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="CÔNG TY ABC" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-600">Địa chỉ công ty</label>
                    <input type="text" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="Tokyo-to..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Từ ngày</label>
                    <input type="date" className="w-full border-slate-300 rounded-lg text-sm bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Đến ngày</label>
                    <input type="date" className="w-full border-slate-300 rounded-lg text-sm bg-white" />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Thuế Lần 2 */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">5. Thuế Nenkin Lần 2</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Năm khai thuế (Tax Year)</label>
                  <input type="number" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="2025" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Số năm làm việc (Work Years)</label>
                  <input type="number" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="3" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Thuế đã bị khấu trừ (Withheld Tax 20.42%)</label>
                  <input type="number" className="w-full border-slate-300 rounded-lg text-sm bg-white" placeholder="¥" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
