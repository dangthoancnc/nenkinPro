'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Banknote, Calendar, RefreshCw, 
  ArrowUpRight, AlertCircle, FileText, CheckCircle, 
  Search, ArrowRight, Sparkles, Users, UserCheck, 
  ShieldCheck, DollarSign, Wallet, Maximize2, Minimize2,
  CheckCircle2, Clock, AlertTriangle, Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface UserInfo {
  id: string;
  name: string;
  email?: string;
  role?: string;
  staffCode?: string | null;
}

interface CustomerInfo {
  id?: string;
  fullName: string;
  code: string;
  phone?: string | null;
  referralCode?: string | null;
  referredByCode?: string | null;
  referralType?: string | null;
  createdBy?: UserInfo | null;
  referredByCustomer?: {
    id: string;
    fullName: string;
    code: string;
  } | null;
}

interface Application {
  id: string;
  status: string;
  totalExpectedJpy: number | null;
  received1stJpy: number | null;
  received2ndJpy: number | null;
  serviceFeeJpy: number | null;
  exchangeRate: number | null;
  serviceFeeVnd: number | null;
  referralBonusJpy: number | null;
  referralDiscountJpy: number | null;
  assignedUser?: UserInfo | null;
  assignedUserId?: string | null;
  customer: CustomerInfo;
  createdAt?: string;
}

interface Rate {
  id: string;
  date: string;
  jpyToVnd: string;
}

export default function FinancePage() {
  const { isAdmin, isLoading: userLoading } = useCurrentUser();
  const [isMounted, setIsMounted] = useState(false);
  const [rates, setRates] = useState<Rate[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRate, setUpdatingRate] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Form values for new rate
  const [rateDate, setRateDate] = useState(new Date().toISOString().split('T')[0]);
  const [rateVal, setRateVal] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'ledger' | 'collaborators'>('ledger');
  const [isExpandedTable, setIsExpandedTable] = useState(false);

  const [dcomLiveRate, setDcomLiveRate] = useState<number | null>(null);
  const [dcomTime, setDcomTime] = useState<string | null>(null);

  const fetchData = async (forceRefresh = false) => {
    try {
      const [ratesRes, appsRes] = await Promise.all([
        fetch(`/api/exchange-rates?limit=14${forceRefresh ? '&refresh=true' : ''}`),
        fetch('/api/applications?limit=1000')
      ]);

      if (ratesRes.ok) {
        const rJson = await ratesRes.json();
        if (rJson.success) {
          setRates(rJson.data);
          if (rJson.currentDcomRate) {
            setDcomLiveRate(rJson.currentDcomRate);
            setRateVal(rJson.currentDcomRate.toString());
          }
          if (rJson.lastUpdatedTime) setDcomTime(rJson.lastUpdatedTime);
        }
      }

      if (appsRes.ok) {
        const aJson = await appsRes.json();
        const appList = Array.isArray(aJson) ? aJson : (Array.isArray(aJson?.data) ? aJson.data : []);
        setApplications(appList);
      }
    } catch (e) {
      console.error('Failed to fetch finance page data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDcom = async () => {
    setUpdatingRate(true);
    await fetchData(true);
    setUpdatingRate(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateVal || isNaN(Number(rateVal))) {
      alert('Vui lòng nhập tỷ giá hợp lệ');
      return;
    }
    setUpdatingRate(true);
    try {
      const res = await fetch('/api/exchange-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(rateDate + 'T00:00:00.000Z').toISOString(),
          jpyToVnd: parseFloat(rateVal)
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Đã cập nhật tỷ giá thành công!');
        fetchData();
      } else {
        alert('Lỗi cập nhật: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối server');
    } finally {
      setUpdatingRate(false);
    }
  };

  // Base list
  const appList: Application[] = Array.isArray(applications)
    ? applications
    : (Array.isArray((applications as any)?.data) ? (applications as any).data : []);

  const currentRate = dcomLiveRate || (rates[0] ? parseFloat(rates[0].jpyToVnd) : 165.6);

  // Extract staff / collaborator options for filter dropdown
  const staffFilterOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string; staffCode?: string }>();
    appList.forEach(app => {
      if (app.assignedUser) {
        map.set(app.assignedUser.id, {
          id: app.assignedUser.id,
          name: app.assignedUser.name,
          role: app.assignedUser.role || 'STAFF',
          staffCode: app.assignedUser.staffCode || undefined
        });
      }
      if (app.customer?.createdBy) {
        map.set(app.customer.createdBy.id, {
          id: app.customer.createdBy.id,
          name: app.customer.createdBy.name,
          role: app.customer.createdBy.role || 'CTV',
          staffCode: app.customer.createdBy.staffCode || undefined
        });
      }
    });
    return Array.from(map.values());
  }, [appList]);

  // Aggregation per Collaborator / Beneficiary (Quyết toán theo từng người)
  const collaboratorSummaries = useMemo(() => {
    const summaryMap = new Map<string, {
      key: string;
      name: string;
      role: string;
      staffCode: string;
      totalApps: number;
      completedApps: number;
      processingApps: number;
      draftApps: number;
      grossRevenueJpy: number;
      grossRevenueVnd: number;
      totalBonusJpy: number;
      totalBonusVnd: number;
      payableBonusJpy: number;
      payableBonusVnd: number;
      pendingBonusJpy: number;
      pendingBonusVnd: number;
    }>();

    appList.forEach(app => {
      const creator = app.customer?.createdBy;
      const referrerCust = app.customer?.referredByCustomer;
      const refCode = app.customer?.referredByCode;

      let key = 'DIRECT';
      let name = 'Trực tiếp / Không qua CTV';
      let role = 'HỆ THỐNG';
      let staffCode = 'DIRECT';

      if (creator && creator.role !== 'ADMIN') {
        key = creator.id;
        name = creator.name;
        role = creator.role || 'COLLABORATOR';
        staffCode = creator.staffCode || 'CTV';
      } else if (creator && creator.role === 'ADMIN' && (refCode || referrerCust)) {
        if (referrerCust) {
          key = referrerCust.id;
          name = referrerCust.fullName;
          role = 'KHÁCH GIỚI THIỆU';
          staffCode = referrerCust.code;
        } else if (refCode) {
          key = `REF_${refCode}`;
          name = `Mã GT: ${refCode}`;
          role = 'NGƯỜI GIỚI THIỆU';
          staffCode = refCode;
        }
      } else if (creator) {
        key = creator.id;
        name = creator.name;
        role = creator.role || 'ADMIN';
        staffCode = creator.staffCode || 'AD';
      }

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          key,
          name,
          role,
          staffCode,
          totalApps: 0,
          completedApps: 0,
          processingApps: 0,
          draftApps: 0,
          grossRevenueJpy: 0,
          grossRevenueVnd: 0,
          totalBonusJpy: 0,
          totalBonusVnd: 0,
          payableBonusJpy: 0,
          payableBonusVnd: 0,
          pendingBonusJpy: 0,
          pendingBonusVnd: 0,
        });
      }

      const item = summaryMap.get(key)!;
      item.totalApps += 1;

      const feeJpy = Number(app.serviceFeeJpy) || 0;
      const feeVnd = Number(app.serviceFeeVnd) || (feeJpy ? feeJpy * (Number(app.exchangeRate) || currentRate) : 0);
      const bonusJpy = Number(app.referralBonusJpy) || 0;
      const rate = Number(app.exchangeRate) || currentRate;
      const bonusVnd = bonusJpy * rate;

      item.grossRevenueJpy += feeJpy;
      item.grossRevenueVnd += feeVnd;
      item.totalBonusJpy += bonusJpy;
      item.totalBonusVnd += bonusVnd;

      if (app.status === 'COMPLETED') {
        item.completedApps += 1;
        item.payableBonusJpy += bonusJpy;
        item.payableBonusVnd += bonusVnd;
      } else if (['SENT_1ST', 'RECEIVED_1ST', 'SENT_2ND', 'RECEIVED_2ND'].includes(app.status)) {
        item.processingApps += 1;
        item.pendingBonusJpy += bonusJpy;
        item.pendingBonusVnd += bonusVnd;
      } else {
        item.draftApps += 1;
      }
    });

    return Array.from(summaryMap.values());
  }, [appList, currentRate]);

  // Overall Financial Calculations
  const totalExpectedServiceFeeJpy = appList.reduce((sum, app) => sum + (Number(app.serviceFeeJpy) || 0), 0);
  const totalExpectedServiceFeeVnd = appList.reduce((sum, app) => {
    const jpy = Number(app.serviceFeeJpy) || 0;
    const vnd = Number(app.serviceFeeVnd);
    return sum + (vnd || (jpy ? jpy * (Number(app.exchangeRate) || currentRate) : 0));
  }, 0);

  const totalCompletedServiceFeeVnd = appList
    .filter(app => app.status === 'COMPLETED')
    .reduce((sum, app) => {
      const jpy = Number(app.serviceFeeJpy) || 0;
      const vnd = Number(app.serviceFeeVnd);
      return sum + (vnd || (jpy ? jpy * (Number(app.exchangeRate) || currentRate) : 0));
    }, 0);

  const totalReferralBonusJpy = appList.reduce((sum, app) => sum + (Number(app.referralBonusJpy) || 0), 0);
  const totalPayableBonusJpy = appList
    .filter(app => app.status === 'COMPLETED')
    .reduce((sum, app) => sum + (Number(app.referralBonusJpy) || 0), 0);
  const totalPendingBonusJpy = appList
    .filter(app => ['SENT_1ST', 'RECEIVED_1ST', 'SENT_2ND', 'RECEIVED_2ND'].includes(app.status))
    .reduce((sum, app) => sum + (Number(app.referralBonusJpy) || 0), 0);

  const totalNetProfitJpy = totalExpectedServiceFeeJpy - totalReferralBonusJpy;
  const totalNetProfitVnd = totalExpectedServiceFeeVnd - (totalReferralBonusJpy * currentRate);

  // Filter logic
  const filteredApps = appList.filter(app => {
    const qLower = searchQuery.toLowerCase();
    const matchSearch = !searchQuery ||
      app.customer?.fullName?.toLowerCase().includes(qLower) ||
      app.customer?.code?.toLowerCase().includes(qLower) ||
      app.assignedUser?.name?.toLowerCase().includes(qLower) ||
      app.customer?.createdBy?.name?.toLowerCase().includes(qLower) ||
      app.customer?.referredByCode?.toLowerCase().includes(qLower);

    const matchStatus = statusFilter === 'ALL' || app.status === statusFilter;

    let matchStaff = true;
    if (selectedStaffFilter !== 'ALL') {
      matchStaff = 
        app.assignedUser?.id === selectedStaffFilter ||
        app.customer?.createdBy?.id === selectedStaffFilter;
    }

    return matchSearch && matchStatus && matchStaff;
  });

  // Chart data formatting
  const chartData = [...rates].reverse().map(r => {
    const d = new Date(r.date);
    return {
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      'Tỷ giá': parseFloat(r.jpyToVnd)
    };
  });

  if (userLoading) {
    return (
      <div className="space-y-4 max-w-full overflow-x-hidden pb-20 md:pb-0 animate-pulse">
        <div className="space-y-1.5">
          <div className="h-6 w-48 bg-slate-200/80 rounded-md"></div>
          <div className="h-3 w-80 bg-slate-200/50 rounded-md"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-white/70 border border-slate-200/60 rounded-xl p-3"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-4">
            <div className="h-44 bg-white/70 border border-slate-200/60 rounded-xl"></div>
            <div className="h-48 bg-white/70 border border-slate-200/60 rounded-xl"></div>
          </div>
          <div className="lg:col-span-8">
            <div className="h-96 bg-white/70 border border-slate-200/60 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Quyền truy cập bị giới hạn</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Khu vực Quản lý Tài chính & Tỷ giá chỉ dành cho tài khoản Quản trị viên (ADMIN). Nếu bạn là Cộng tác viên, vui lòng theo dõi doanh thu và hoa hồng cá nhân tại Cổng thông tin (Portal).
        </p>
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          Đến Cổng Cộng tác viên (Portal) <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">Tài chính & Hoa hồng</h1>
        <p className="text-xs text-slate-500 mt-0.5">Quản lý tỷ giá tiền tệ và kiểm soát tài chính các hồ sơ Nenkin.</p>
      </div>

      {/* KPI Ribbons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white/85 backdrop-blur-md border border-slate-200/70 shadow-xs p-2.5 sm:p-3 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Phí Dịch Vụ Dự Kiến</span>
            <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <span className="text-sm sm:text-lg font-bold font-mono text-indigo-700 mt-0.5">¥{totalExpectedServiceFeeJpy.toLocaleString()}</span>
          <span className="text-[10px] font-mono text-slate-500 mt-0.5">~{totalExpectedServiceFeeVnd.toLocaleString()} đ</span>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-slate-200/70 shadow-xs p-2.5 sm:p-3 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Thực Thu Đã Hoàn Thành</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <span className="text-sm sm:text-lg font-bold font-mono text-emerald-700 mt-0.5">{totalCompletedServiceFeeVnd.toLocaleString()} đ</span>
          <span className="text-[10px] text-slate-500 mt-0.5">Từ {appList.filter(a => a.status === 'COMPLETED').length} hồ sơ hoàn thành</span>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-slate-200/70 shadow-xs p-2.5 sm:p-3 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Hoa Hồng CTV Phải Trả</span>
            <Wallet className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <span className="text-sm sm:text-lg font-bold font-mono text-rose-600 mt-0.5">¥{totalReferralBonusJpy.toLocaleString()}</span>
          <div className="flex items-center gap-1.5 text-[9px] mt-0.5">
            <span className="text-emerald-700 font-semibold">Đủ ĐK: ¥{totalPayableBonusJpy.toLocaleString()}</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-700 font-semibold">Chờ: ¥{totalPendingBonusJpy.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-slate-200/70 shadow-xs p-2.5 sm:p-3 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Lợi Nhuận Thuần Công Ty</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="text-sm sm:text-lg font-bold font-mono text-blue-700 mt-0.5">¥{totalNetProfitJpy.toLocaleString()}</span>
          <span className="text-[10px] font-mono text-slate-500 mt-0.5">~{Math.round(totalNetProfitVnd).toLocaleString()} đ (Sau trừ hoa hồng)</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className={`grid grid-cols-1 ${isExpandedTable ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-4`}>
        {/* Left: Exchange Rate & Charts (Collapsible if expanded) */}
        {!isExpandedTable && (
          <div className="lg:col-span-4 space-y-4">
            {/* Rate Update Form */}
            <Card className="bg-white/85 backdrop-blur-md border border-slate-200/70 shadow-xs rounded-xl overflow-hidden p-3">
              <CardHeader className="p-0 pb-2.5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                    Cập nhật tỷ giá DCOM
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-500">Nguồn: DCOM Money Express {dcomTime ? `• ${dcomTime}` : ''}</CardDescription>
                </div>
                <button type="button" onClick={handleSyncDcom} disabled={updatingRate}
                  className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-emerald-100 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {updatingRate ? 'Đang tải...' : 'Lấy DCOM realtime'}
                </button>
              </CardHeader>
              <CardContent className="p-0">
                <form onSubmit={handleUpdateRate} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Ngày áp dụng</label>
                      <Input 
                        type="date"
                        value={rateDate}
                        onChange={(e) => setRateDate(e.target.value)}
                        className="h-8 py-0.5 text-xs rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Tỷ giá (VND/JPY)</label>
                      <Input 
                        type="number"
                        step="0.1"
                        placeholder="VD: 161.0"
                        value={rateVal}
                        onChange={(e) => setRateVal(e.target.value)}
                        className="h-8 py-0.5 text-xs rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button 
                      type="button" 
                      variant="outline"
                      disabled={updatingRate} 
                      onClick={handleSyncDcom}
                      className="flex-1 h-8 text-xs font-semibold rounded-lg gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${updatingRate ? 'animate-spin' : ''}`} />
                      DCOM Realtime
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updatingRate} 
                      className="flex-1 h-8 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Lưu Tỷ giá
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Rate Trend Chart */}
            <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl p-3">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold text-slate-800">Biểu đồ tỷ giá JPY</CardTitle>
                <CardDescription className="text-[10px] text-slate-500">Biến động tỷ giá 14 ngày qua</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-40 w-full min-w-0">
                {isMounted && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#64748b" />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9 }} stroke="#64748b" />
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="Tỷ giá" stroke="#4f46e5" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400 text-xs">
                    {isMounted ? 'Không có dữ liệu tỷ giá' : 'Đang tải biểu đồ...'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Right: Financial Ledger & Collaborator Payout Summary */}
        <div className={isExpandedTable ? 'col-span-1' : 'lg:col-span-8'}>
          <Card className="bg-white/85 backdrop-blur-md border border-slate-200/70 shadow-xs rounded-xl overflow-hidden p-3 h-full flex flex-col">
            <CardHeader className="p-0 pb-3 flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    Sổ cái tài chính & Quyết toán hoa hồng
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-500">
                    Theo dõi toàn cảnh doanh thu, người phụ trách, CTV giới thiệu và hoa hồng thụ hưởng theo từng hồ sơ.
                  </CardDescription>
                </div>

                {/* View Mode Tabs & Expand Button */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setActiveTab('ledger')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                        activeTab === 'ledger'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span>Sổ cái ({filteredApps.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('collaborators')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                        activeTab === 'collaborators'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      <span>Quyết toán CTV ({collaboratorSummaries.length})</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsExpandedTable(prev => !prev)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors hidden lg:flex items-center justify-center"
                    title={isExpandedTable ? 'Thu nhỏ bảng' : 'Mở rộng toàn màn hình'}
                  >
                    {isExpandedTable ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                  <div className="relative flex-1 sm:max-w-[220px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm khách, CTV, phụ trách..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-7 w-full pl-8 pr-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-500 shadow-2xs"
                    />
                  </div>

                  {activeTab === 'ledger' && (
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-7 rounded-lg border border-slate-200 text-xs px-2 bg-white focus:outline-none shadow-2xs text-slate-700"
                    >
                      <option value="ALL">Mọi trạng thái hồ sơ</option>
                      <option value="DRAFT">Bản nháp</option>
                      <option value="PENDING">Cần duyệt</option>
                      <option value="SENT_1ST">Đã nộp Lần 1</option>
                      <option value="RECEIVED_1ST">Đã nhận Lần 1</option>
                      <option value="SENT_2ND">Đã nộp Lần 2</option>
                      <option value="RECEIVED_2ND">Đã nhận Lần 2</option>
                      <option value="COMPLETED">Hoàn thành</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  )}

                  <select
                    value={selectedStaffFilter}
                    onChange={(e) => setSelectedStaffFilter(e.target.value)}
                    className="h-7 rounded-lg border border-slate-200 text-xs px-2 bg-white focus:outline-none shadow-2xs text-slate-700"
                  >
                    <option value="ALL">Tất cả Nhân sự / CTV</option>
                    {staffFilterOptions.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role === 'COLLABORATOR' ? 'CTV' : s.role}) {s.staffCode ? `• #${s.staffCode}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStaffFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedStaffFilter('ALL')}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Bỏ lọc nhân sự
                  </button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-x-auto min-h-[320px]">
              {loading ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 py-12">
                  <RefreshCw className="w-5 h-5 animate-spin text-slate-300 mr-2" />
                  Đang tải sổ cái tài chính...
                </div>
              ) : activeTab === 'ledger' ? (
                /* TAB 1: SỔ CÁI CHI TIẾT TỪNG HỒ SƠ */
                filteredApps.length > 0 ? (
                  <div className="w-full overflow-x-auto">
                    <Table className="border-collapse min-w-[880px]">
                      <TableHeader className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-200">
                        <TableRow>
                          <TableHead className="text-[10px] uppercase font-bold py-2 text-slate-600 h-8">Khách hàng</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold py-2 text-slate-600 h-8">Phụ trách</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold py-2 text-slate-600 h-8">CTV / Người GT</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold py-2 text-slate-600 h-8 text-center">Trạng thái</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold py-2 text-slate-600 h-8 text-right">Phí thu khách</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold py-2 text-slate-600 h-8 text-right">Hoa hồng CTV</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold py-2 text-slate-600 h-8 text-right">Doanh thu thuần</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold py-2 text-slate-600 h-8 text-center w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApps.map((app) => {
                          const feeJpy = Number(app.serviceFeeJpy) || 0;
                          const rate = Number(app.exchangeRate) || currentRate;
                          const feeVnd = Number(app.serviceFeeVnd) || (feeJpy ? Math.round(feeJpy * rate) : 0);
                          const bonusJpy = Number(app.referralBonusJpy) || 0;
                          const bonusVnd = Math.round(bonusJpy * rate);
                          const netJpy = feeJpy - bonusJpy;
                          const netVnd = feeVnd - bonusVnd;

                          const creator = app.customer?.createdBy;
                          const referrer = app.customer?.referredByCustomer;
                          const refCode = app.customer?.referredByCode;

                          let ctvName = 'Trực tiếp';
                          let ctvRoleBadge = 'Direct';
                          if (creator && creator.role !== 'ADMIN') {
                            ctvName = creator.name;
                            ctvRoleBadge = creator.role === 'COLLABORATOR' ? 'CTV' : (creator.role || 'CTV');
                          } else if (referrer) {
                            ctvName = referrer.fullName;
                            ctvRoleBadge = 'Khách GT';
                          } else if (refCode) {
                            ctvName = `Mã GT: ${refCode}`;
                            ctvRoleBadge = 'Mã GT';
                          }

                          return (
                            <TableRow key={app.id} className="hover:bg-blue-50/40 transition-colors border-b border-slate-100">
                              {/* 1. Khách hàng */}
                              <TableCell className="py-2 px-2.5">
                                <div className="font-bold text-xs text-slate-800 flex items-center gap-1">
                                  <span>{app.customer?.fullName || 'N/A'}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  #{app.customer?.code || '---'} {app.customer?.phone ? `• ${app.customer.phone}` : ''}
                                </div>
                              </TableCell>

                              {/* 2. Người phụ trách */}
                              <TableCell className="py-2 px-2.5">
                                {app.assignedUser ? (
                                  <div>
                                    <div className="font-semibold text-xs text-slate-800 flex items-center gap-1">
                                      <UserCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                                      <span>{app.assignedUser.name}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                      #{app.assignedUser.staffCode || 'NV'} • {app.assignedUser.role || 'STAFF'}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic bg-slate-50 px-2 py-0.5 rounded border border-slate-200 inline-block">
                                    Chưa phân công
                                  </span>
                                )}
                              </TableCell>

                              {/* 3. CTV / Người giới thiệu */}
                              <TableCell className="py-2 px-2.5">
                                <div>
                                  <div className="font-semibold text-xs text-slate-800 flex items-center gap-1">
                                    <Users className="w-3 h-3 text-purple-600 shrink-0" />
                                    <span className="truncate max-w-[130px]">{ctvName}</span>
                                  </div>
                                  <span className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                    ctvRoleBadge === 'CTV' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                    ctvRoleBadge === 'Khách GT' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    'bg-slate-100 text-slate-500'
                                  }`}>
                                    {ctvRoleBadge}
                                  </span>
                                </div>
                              </TableCell>

                              {/* 4. Trạng thái */}
                              <TableCell className="py-2 px-2 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-block ${
                                  app.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  app.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  app.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' :
                                  'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                  {app.status === 'COMPLETED' ? 'Hoàn thành' :
                                   app.status === 'PENDING' ? 'Cần duyệt' :
                                   app.status === 'DRAFT' ? 'Nháp' :
                                   app.status === 'SENT_1ST' ? 'Nộp L1' :
                                   app.status === 'RECEIVED_1ST' ? 'Nhận L1' :
                                   app.status === 'SENT_2ND' ? 'Nộp L2' :
                                   app.status === 'RECEIVED_2ND' ? 'Nhận L2' :
                                   app.status === 'CANCELLED' ? 'Đã hủy' : app.status}
                                </span>
                              </TableCell>

                              {/* 5. Phí thu khách */}
                              <TableCell className="py-2 px-2.5 text-right font-mono">
                                <div className="font-bold text-xs text-indigo-700">
                                  {feeJpy ? `¥${feeJpy.toLocaleString()}` : '---'}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {feeVnd ? `${feeVnd.toLocaleString()} đ` : '---'}
                                </div>
                              </TableCell>

                              {/* 6. Hoa hồng CTV & Người nhận */}
                              <TableCell className="py-2 px-2.5 text-right font-mono">
                                <div className="font-bold text-xs text-rose-600">
                                  {bonusJpy ? `¥${bonusJpy.toLocaleString()}` : '---'}
                                </div>
                                {bonusJpy > 0 ? (
                                  <div className="mt-0.5 flex items-center justify-end gap-1">
                                    <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                                      app.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                      ['SENT_1ST', 'RECEIVED_1ST', 'SENT_2ND', 'RECEIVED_2ND'].includes(app.status) ? 'bg-amber-100 text-amber-800' :
                                      'bg-slate-100 text-slate-600'
                                    }`}>
                                      {app.status === 'COMPLETED' ? 'Đủ ĐK chi' :
                                       ['SENT_1ST', 'RECEIVED_1ST', 'SENT_2ND', 'RECEIVED_2ND'].includes(app.status) ? 'Chờ quyết toán' : 'Dự kiến'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-slate-400 italic">Không có</span>
                                )}
                              </TableCell>

                              {/* 7. Doanh thu thuần */}
                              <TableCell className="py-2 px-2.5 text-right font-mono">
                                <div className="font-bold text-xs text-emerald-700">
                                  {feeJpy ? `¥${netJpy.toLocaleString()}` : '---'}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {feeVnd ? `${netVnd.toLocaleString()} đ` : '---'}
                                </div>
                              </TableCell>

                              {/* 8. Thao tác */}
                              <TableCell className="py-2 px-2 text-center">
                                <Link 
                                  href={`/applications/${app.id}`} 
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                                  title="Xem chi tiết hồ sơ & tài chính"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400 flex-col gap-2 py-12">
                    <FileText className="w-8 h-8 text-slate-300" />
                    Không tìm thấy hồ sơ nào phù hợp với bộ lọc
                  </div>
                )
              ) : (
                /* TAB 2: BẢNG QUYẾT TOÁN THEO CTV / NHÂN SỰ */
                <div className="w-full overflow-x-auto">
                  <Table className="border-collapse min-w-[780px]">
                    <TableHeader className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-200">
                      <TableRow>
                        <TableHead className="text-[10px] uppercase font-bold py-2 text-slate-600 h-8">Người thụ hưởng (CTV / Staff)</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold py-2 text-slate-600 h-8 text-center">Hồ sơ mang về</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold py-2 text-slate-600 h-8 text-right">Doanh thu mang lại</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold py-2 text-slate-600 h-8 text-right">Tổng hoa hồng</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold py-2 text-emerald-800 bg-emerald-50/70 h-8 text-right">Đủ ĐK chi trả ngay</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold py-2 text-amber-800 bg-amber-50/70 h-8 text-right">Chờ quyết toán</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold py-2 text-slate-600 h-8 text-center w-20">Chi tiết</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collaboratorSummaries.map((c) => (
                        <TableRow key={c.key} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100">
                          {/* 1. Tên CTV */}
                          <TableCell className="py-2.5 px-3">
                            <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>{c.name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono mt-0.5">
                              <span>#{c.staffCode}</span>
                              <span>•</span>
                              <span className="font-semibold text-purple-700">{c.role}</span>
                            </div>
                          </TableCell>

                          {/* 2. Số hồ sơ */}
                          <TableCell className="py-2.5 px-2 text-center">
                            <div className="font-bold text-xs text-slate-800">{c.totalApps} hồ sơ</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              <span className="text-emerald-700 font-semibold">{c.completedApps} xong</span> • 
                              <span className="text-amber-700 font-semibold"> {c.processingApps} đang xử lý</span>
                            </div>
                          </TableCell>

                          {/* 3. Doanh thu mang lại */}
                          <TableCell className="py-2.5 px-3 text-right font-mono">
                            <div className="font-bold text-xs text-indigo-700">¥{c.grossRevenueJpy.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{Math.round(c.grossRevenueVnd).toLocaleString()} đ</div>
                          </TableCell>

                          {/* 4. Tổng hoa hồng */}
                          <TableCell className="py-2.5 px-3 text-right font-mono">
                            <div className="font-bold text-xs text-slate-800">¥{c.totalBonusJpy.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{Math.round(c.totalBonusVnd).toLocaleString()} đ</div>
                          </TableCell>

                          {/* 5. ĐỦ ĐK CHI TRẢ NGAY (HỒ SƠ HOÀN THÀNH) */}
                          <TableCell className="py-2.5 px-3 text-right font-mono bg-emerald-50/40">
                            <div className="font-bold text-xs text-emerald-700">
                              ¥{c.payableBonusJpy.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                              {Math.round(c.payableBonusVnd).toLocaleString()} đ
                            </div>
                            {c.payableBonusJpy > 0 && (
                              <span className="inline-block mt-0.5 text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                Cần thanh toán
                              </span>
                            )}
                          </TableCell>

                          {/* 6. Đang chờ quyết toán */}
                          <TableCell className="py-2.5 px-3 text-right font-mono bg-amber-50/40">
                            <div className="font-bold text-xs text-amber-700">
                              ¥{c.pendingBonusJpy.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                              {Math.round(c.pendingBonusVnd).toLocaleString()} đ
                            </div>
                          </TableCell>

                          {/* 7. Xem hồ sơ */}
                          <TableCell className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStaffFilter(c.key);
                                setActiveTab('ledger');
                              }}
                              className="px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                              title="Xem danh sách hồ sơ của CTV này"
                            >
                              Lọc hồ sơ
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
