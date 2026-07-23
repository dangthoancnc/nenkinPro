'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, Plus, Filter, ArrowRight,
  Clock, CheckCircle, AlertCircle, Send, Wallet,
  ChevronUp, ChevronDown, LayoutGrid, List, LayoutTemplate,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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
    bankName?: string;
    dob?: string;
    taxOfficeId?: string;
    zairyuFrontUrl?: string;
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
  return (
    <React.Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><div className="animate-spin w-8 h-8 border-b-2 border-blue-500 rounded-full"></div></div>}>
      <ApplicationsPageInner />
    </React.Suspense>
  );
}

function ApplicationsPageInner() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterBank, setFilterBank] = useState('');
  const [filterDobFrom, setFilterDobFrom] = useState('');
  const [filterDobTo, setFilterDobTo] = useState('');
  const [sortCol, setSortCol] = useState<string>('applyDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [taxOffices, setTaxOffices] = useState<Array<any>>([]);

  useEffect(() => {
    async function fetchApplications() {
      try {
        const [appRes, taxRes] = await Promise.all([
          fetch('/api/applications'),
          fetch('/api/tax-offices')
        ]);
        
        if (appRes.ok) {
          const data = await appRes.json();
          setApplications(data);
        }
        if (taxRes.ok) {
          const data = await taxRes.json();
          if (data.success) {
            setTaxOffices(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, []);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <ChevronDown className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100" />;
    return sortDir === 'asc' ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />;
  };

  let filteredApplications = applications.filter(app => {
    if (q) {
      const searchLower = q.toLowerCase();
      const matchName = app.customer?.fullName?.toLowerCase().includes(searchLower);
      const matchCode = app.customer?.code?.toLowerCase().includes(searchLower);
      if (!matchName && !matchCode) return false;
    }
    if (filterStatuses.length > 0) {
      if (!filterStatuses.includes(app.status)) return false;
    }
    if (filterBank) {
      // @ts-ignore - customer has bankName but TS interface is missing it
      if (!app.customer?.bankName?.toLowerCase().includes(filterBank.toLowerCase())) return false;
    }
    if (filterDobFrom) {
      // @ts-ignore
      if (app.customer?.dob && new Date(app.customer.dob) < new Date(filterDobFrom)) return false;
    }
    if (filterDobTo) {
      // @ts-ignore
      if (app.customer?.dob && new Date(app.customer.dob) > new Date(filterDobTo)) return false;
    }
    return true;
  });

  filteredApplications = filteredApplications.sort((a, b) => {
    let cmp = 0;
    if (sortCol === 'name') {
      cmp = (a.customer?.fullName || '').localeCompare(b.customer?.fullName || '');
    } else if (sortCol === 'status') {
      cmp = a.status.localeCompare(b.status);
    } else if (sortCol === 'applyDate') {
      const da = a.applyDate ? new Date(a.applyDate).getTime() : 0;
      const db = b.applyDate ? new Date(b.applyDate).getTime() : 0;
      cmp = da - db;
    } else if (sortCol === 'jpy') {
      const va = a.totalExpectedJpy || 0;
      const vb = b.totalExpectedJpy || 0;
      cmp = va - vb;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApps = filteredApplications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Quản lý Hồ sơ Nenkin</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
              title="Xem dạng bảng"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
              title="Xem dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setShowFilter(!showFilter)} 
            className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors border rounded-lg shadow-sm ${showFilter ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Lọc</span>
          </button>
          <Link href="/applications/new" className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors bg-primary text-white rounded-lg hover:bg-primary/90 shadow-sm shadow-primary/30">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tạo mới</span>
          </Link>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-lg border border-slate-200 p-2 shadow-sm min-h-[40px]">
        <div className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-sm font-medium flex items-center gap-2">
          Tổng <span className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">{applications.length}</span>
        </div>
        <div className="px-3 py-1 bg-orange-50 text-orange-700 rounded-md text-sm font-medium flex items-center gap-2">
          Cần duyệt <span className="bg-orange-100 px-1.5 py-0.5 rounded text-xs">{applications.filter(a => a.status === 'PENDING').length}</span>
        </div>
        <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-md text-sm font-medium flex items-center gap-2">
          Đang xử lý <span className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">{applications.filter(a => !['COMPLETED', 'CANCELLED', 'PENDING'].includes(a.status)).length}</span>
        </div>
        <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md text-sm font-medium flex items-center gap-2">
          Hoàn thành <span className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs">{applications.filter(a => a.status === 'COMPLETED').length}</span>
        </div>
      </div>

      {/* Filter Slide-over/Popover */}
      {showFilter && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-slate-800">Lọc nâng cao</h3>
            <button onClick={() => setShowFilter(false)} className="text-sm text-slate-400 hover:text-slate-600">
              Đóng
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">Trạng thái hồ sơ</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <button 
                    key={status} 
                    onClick={() => {
                      if (filterStatuses.includes(status)) {
                        setFilterStatuses(filterStatuses.filter(s => s !== status));
                      } else {
                        setFilterStatuses([...filterStatuses, status]);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${filterStatuses.includes(status) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">Tên ngân hàng</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Yucho..."
                  value={filterBank}
                  onChange={(e) => setFilterBank(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">Ngày sinh (Từ)</label>
                <input 
                  type="date" 
                  value={filterDobFrom}
                  onChange={(e) => setFilterDobFrom(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">Ngày sinh (Đến)</label>
                <input 
                  type="date" 
                  value={filterDobTo}
                  onChange={(e) => setFilterDobTo(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[600px] md:min-w-0">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 font-semibold w-14">Thẻ NK</th>
                <th className="px-4 py-2.5 font-semibold cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">Khách hàng <SortIcon col="name" /></div>
                </th>
                <th className="px-4 py-2.5 font-semibold cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">Trạng thái <SortIcon col="status" /></div>
                </th>
                <th className="px-4 py-2.5 font-semibold">Cục thuế</th>
                <th className="px-4 py-2.5 font-semibold">Ngân hàng</th>
                <th className="px-4 py-2.5 font-semibold cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('applyDate')}>
                  <div className="flex items-center gap-1">Ngày nộp <SortIcon col="applyDate" /></div>
                </th>
                <th className="px-4 py-2.5 font-semibold cursor-pointer group hover:bg-slate-100 transition-colors text-right justify-end" onClick={() => handleSort('jpy')}>
                  <div className="flex items-center justify-end gap-1">Dự kiến (JPY) <SortIcon col="jpy" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                      <p>{q || filterStatuses.length ? 'Không tìm thấy hồ sơ phù hợp với bộ lọc.' : 'Chưa có hồ sơ nào. Bắt đầu bằng cách tạo hồ sơ mới.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedApps.map((app) => {
                  const status = statusConfig[app.status];
                  const StatusIcon = status.icon;
                  const taxOffice = taxOffices.find((t: any) => t.id === app.customer?.taxOfficeId);
                  
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-3 py-2.5">
                        <div className="w-10 h-7 rounded border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                          {app.customer?.zairyuFrontUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={app.customer.zairyuFrontUrl} alt="Zairyu" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[8px] text-slate-400">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <Link href={`/applications/${app.id}`} className="flex flex-col hover:opacity-80 transition-opacity">
                          <span className="font-semibold text-primary hover:underline">{app.customer?.fullName || 'N/A'}</span>
                          <span className="text-xs text-slate-500 font-mono">{app.customer?.code || '---'}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        <div className="max-w-[130px] truncate text-xs" title={taxOffice?.name}>
                          {taxOffice?.name || '---'}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        <div className="max-w-[110px] truncate text-xs" title={app.customer?.bankName}>
                          {app.customer?.bankName || '---'}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">
                        {app.applyDate ? new Date(app.applyDate).toLocaleDateString('vi-VN') : '--/--/----'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs">
                        <span className="font-medium text-slate-900">
                          {app.totalExpectedJpy ? new Intl.NumberFormat('ja-JP').format(app.totalExpectedJpy) : '---'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="py-8 text-center text-slate-500 col-span-full">
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p>Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3 col-span-full">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-400" />
              </div>
              <p>{q || filterStatuses.length ? 'Không tìm thấy kết quả.' : 'Chưa có hồ sơ nào.'}</p>
            </div>
          ) : (
            paginatedApps.map((app) => {
              const status = statusConfig[app.status];
              const StatusIcon = status.icon;
              const taxOffice = taxOffices.find((t: any) => t.id === app.customer?.taxOfficeId);
              
              return (
                <div key={app.id} className="relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col group">
                  <div className="h-32 bg-slate-100 border-b border-slate-200 relative overflow-hidden flex items-center justify-center">
                    {app.customer?.zairyuFrontUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={app.customer.zairyuFrontUrl} alt="Zairyu" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <LayoutTemplate className="w-8 h-8 opacity-20" />
                        <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shadow-sm ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col">
                    <Link href={`/applications/${app.id}`} className="mb-3 block hover:opacity-80">
                      <h3 className="font-bold text-slate-800 text-base leading-tight group-hover:text-primary transition-colors">{app.customer?.fullName || 'N/A'}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">#{app.customer?.code || '---'}</p>
                    </Link>
                    
                    <div className="space-y-2 mb-4 flex-1 text-sm">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                        <span className="text-slate-500">Cục thuế</span>
                        <span className="font-medium text-slate-700 text-right truncate max-w-[120px]" title={taxOffice?.name}>{taxOffice?.name || '---'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                        <span className="text-slate-500">Ngân hàng</span>
                        <span className="font-medium text-slate-700 text-right truncate max-w-[120px]" title={app.customer?.bankName}>{app.customer?.bankName || '---'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                        <span className="text-slate-500">Ngày nộp</span>
                        <span className="font-medium text-slate-700">{app.applyDate ? new Date(app.applyDate).toLocaleDateString('vi-VN') : '--/--/----'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Dự kiến</span>
                        <span className="font-bold text-emerald-600">{app.totalExpectedJpy ? new Intl.NumberFormat('ja-JP').format(app.totalExpectedJpy) + ' JPY' : '---'}</span>
                      </div>
                    </div>
                    
                    <Link 
                      href={`/applications/${app.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold transition-colors bg-slate-50 border border-slate-200 rounded-lg group-hover:bg-primary group-hover:text-white group-hover:border-primary text-slate-600"
                    >
                      Xem chi tiết hồ sơ
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50/50">
            <div className="text-sm text-slate-500">
              Hiển thị <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, filteredApplications.length)}</span> trong số <span className="font-medium text-slate-900">{filteredApplications.length}</span> kết quả
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                      currentPage === page 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
