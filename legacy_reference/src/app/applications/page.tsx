'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, Search, Plus, Filter, ArrowRight,
  Clock, CheckCircle, AlertCircle, Send, Wallet
} from 'lucide-react';
import Link from 'next/link';

type ApplicationStatus = 'PENDING' | 'DRAFT' | 'SENT_1ST' | 'RECEIVED_1ST' | 'SENT_2ND' | 'RECEIVED_2ND' | 'COMPLETED' | 'CANCELLED';

interface Application {
  id: string;
  status: ApplicationStatus;
  applyDate: string | null;
  totalExpectedJpy: number | null;
  received1stJpy: number | null;
  customer: {
    fullName: string;
    code: string;
  };
  createdAt: string;
}

const statusConfig: Record<ApplicationStatus, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Cần duyệt', color: 'bg-orange-50 text-orange-700', icon: AlertCircle },
  DRAFT: { label: 'Bản nháp', color: 'bg-slate-100 text-slate-700', icon: Clock },
  SENT_1ST: { label: 'Đã gửi (Lần 1)', color: 'bg-blue-50 text-blue-700', icon: Send },
  RECEIVED_1ST: { label: 'Đã nhận (Lần 1)', color: 'bg-indigo-50 text-indigo-700', icon: Wallet },
  SENT_2ND: { label: 'Đã gửi (Lần 2)', color: 'bg-purple-50 text-purple-700', icon: Send },
  RECEIVED_2ND: { label: 'Đã nhận (Lần 2)', color: 'bg-emerald-50 text-emerald-700', icon: Wallet },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-50 text-red-700', icon: AlertCircle },
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApplications() {
      try {
        const res = await fetch('/api/applications');
        if (res.ok) {
          const data = await res.json();
          setApplications(data);
        }
      } catch (error) {
        console.error('Failed to fetch applications', error);
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Hồ sơ Nenkin</h1>
          <p className="text-sm text-slate-500 mt-1">Theo dõi tiến độ và trạng thái các hồ sơ xin hoàn thuế Nenkin.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 shadow-sm">
            <Filter className="w-4 h-4" />
            Lọc
          </button>
          <Link href="/customers" className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors bg-primary text-white rounded-lg hover:bg-primary/90 shadow-sm shadow-primary/30">
            <Plus className="w-4 h-4" />
            Tạo hồ sơ mới
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Tổng số hồ sơ', value: applications.length, trend: '+12% tháng này', color: 'bg-blue-500' },
          { label: 'Cần duyệt', value: applications.filter(a => a.status === 'PENDING').length, trend: 'Cần kiểm tra', color: 'bg-orange-500' },
          { label: 'Đang xử lý', value: applications.filter(a => !['COMPLETED', 'CANCELLED', 'PENDING'].includes(a.status)).length, trend: 'Cần theo dõi', color: 'bg-amber-500' },
          { label: 'Đã hoàn thành', value: applications.filter(a => a.status === 'COMPLETED').length, trend: 'Tháng này: 4', color: 'bg-emerald-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-150 duration-500 ${stat.color}`} />
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
            <p className="text-xs font-medium text-slate-400 mt-2">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo mã KH, tên..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
        
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Khách hàng</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold">Ngày nộp</th>
                <th className="px-6 py-4 font-semibold text-right">Dự kiến (JPY)</th>
                <th className="px-6 py-4 font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                      <p>Chưa có hồ sơ nào. Bắt đầu bằng cách tạo hồ sơ mới.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const status = statusConfig[app.status];
                  const StatusIcon = status.icon;
                  
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{app.customer?.fullName || 'N/A'}</span>
                          <span className="text-xs text-slate-500 mt-0.5">{app.customer?.code || '---'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {app.applyDate ? new Date(app.applyDate).toLocaleDateString('vi-VN') : '--/--/----'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-slate-900">
                          {app.totalExpectedJpy ? new Intl.NumberFormat('ja-JP').format(app.totalExpectedJpy) : '---'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/applications/${app.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden flex flex-col gap-4 p-4">
          {loading ? (
            <div className="py-8 text-center text-slate-500">
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p>Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : applications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-400" />
              </div>
              <p>Chưa có hồ sơ nào. Bắt đầu bằng cách tạo hồ sơ mới.</p>
            </div>
          ) : (
            applications.map((app) => {
              const status = statusConfig[app.status];
              const StatusIcon = status.icon;
              
              return (
                <div key={app.id} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">{app.customer?.code || '---'}</div>
                      <div className="font-semibold text-slate-900">{app.customer?.fullName || 'N/A'}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Ngày nộp:</span>
                    <span className="text-slate-900">{app.applyDate ? new Date(app.applyDate).toLocaleDateString('vi-VN') : '--/--/----'}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Dự kiến (JPY):</span>
                    <span className="font-medium text-slate-900">{app.totalExpectedJpy ? new Intl.NumberFormat('ja-JP').format(app.totalExpectedJpy) : '---'}</span>
                  </div>
                  
                  <Link 
                    href={`/applications/${app.id}`}
                    className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
                  >
                    Xem chi tiết
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
