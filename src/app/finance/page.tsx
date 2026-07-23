'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Banknote, Calendar, RefreshCw, 
  ArrowUpRight, AlertCircle, FileText, CheckCircle, 
  Search, ArrowRight, Sparkles 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

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
  customer: {
    fullName: string;
    code: string;
  };
}

interface Rate {
  id: string;
  date: string;
  jpyToVnd: string;
}

export default function FinancePage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRate, setUpdatingRate] = useState(false);
  
  // Form values for new rate
  const [rateDate, setRateDate] = useState(new Date().toISOString().split('T')[0]);
  const [rateVal, setRateVal] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchData = async () => {
    try {
      const [ratesRes, appsRes] = await Promise.all([
        fetch('/api/exchange-rates?limit=14'),
        fetch('/api/applications')
      ]);

      if (ratesRes.ok) {
        const rJson = await ratesRes.json();
        if (rJson.success) {
          setRates(rJson.data);
          // Set today's rate if available
          const todayStr = new Date().toISOString().split('T')[0];
          const todayRate = rJson.data.find((r: any) => r.date.startsWith(todayStr));
          if (todayRate) {
            setRateVal(Number(todayRate.jpyToVnd).toString());
          }
        }
      }

      if (appsRes.ok) {
        const aJson = await appsRes.json();
        setApplications(aJson);
      }
    } catch (e) {
      console.error('Failed to fetch finance page data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // Calculations
  const totalExpectedServiceFeeJpy = applications.reduce((sum, app) => sum + (Number(app.serviceFeeJpy) || 0), 0);
  const totalExpectedServiceFeeVnd = applications.reduce((sum, app) => sum + (Number(app.serviceFeeVnd) || 0), 0);
  const totalCompletedServiceFeeVnd = applications
    .filter(app => app.status === 'COMPLETED')
    .reduce((sum, app) => sum + (Number(app.serviceFeeVnd) || 0), 0);
  const totalReferralBonusJpy = applications.reduce((sum, app) => sum + (Number(app.referralBonusJpy) || 0), 0);

  // Filter logic
  const filteredApps = applications.filter(app => {
    const matchSearch = 
      app.customer?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.customer?.code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Chart data formatting
  const chartData = [...rates].reverse().map(r => {
    const d = new Date(r.date);
    return {
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      'Tỷ giá': parseFloat(r.jpyToVnd)
    };
  });

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
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Phí Dự kiến (JPY)</span>
          <span className="text-sm sm:text-lg font-bold font-mono text-indigo-700 mt-0.5">¥{totalExpectedServiceFeeJpy.toLocaleString()}</span>
        </div>
        <div className="bg-white/85 backdrop-blur-md border border-slate-200/70 shadow-xs p-2.5 sm:p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Phí Dự kiến (VND)</span>
          <span className="text-sm sm:text-lg font-bold font-mono text-blue-700 mt-0.5">{totalExpectedServiceFeeVnd.toLocaleString()} đ</span>
        </div>
        <div className="bg-white/85 backdrop-blur-md border border-slate-200/70 shadow-xs p-2.5 sm:p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Thực thu (VND)</span>
          <span className="text-sm sm:text-lg font-bold font-mono text-emerald-700 mt-0.5">{totalCompletedServiceFeeVnd.toLocaleString()} đ</span>
        </div>
        <div className="bg-white/85 backdrop-blur-md border border-slate-200/70 shadow-xs p-2.5 sm:p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Hoa hồng CTV (JPY)</span>
          <span className="text-sm sm:text-lg font-bold font-mono text-rose-600 mt-0.5">¥{totalReferralBonusJpy.toLocaleString()}</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Exchange Rate & Charts */}
        <div className="lg:col-span-4 space-y-4">
          {/* Rate Update Form */}
          <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl overflow-hidden p-3">
            <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Cập nhật tỷ giá
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-500">Tỷ giá JPY → VND hôm nay</CardDescription>
              </div>
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
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Tỷ giá (VND)</label>
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="VD: 170.5"
                      value={rateVal}
                      onChange={(e) => setRateVal(e.target.value)}
                      className="h-8 py-0.5 text-xs rounded-lg"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={updatingRate} 
                  className="w-full h-8 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white mt-1 gap-1.5"
                >
                  {updatingRate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Cập nhật tỷ giá
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Rate Trend Chart */}
          <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl p-3">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-sm font-bold text-slate-800">Biểu đồ tỷ giá JPY</CardTitle>
              <CardDescription className="text-[10px] text-slate-500">Biến động tỷ giá 14 ngày qua</CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-40">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#64748b" />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9 }} stroke="#64748b" />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="Tỷ giá" stroke="#4f46e5" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400 text-xs">Không có dữ liệu tỷ giá</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Financial Ledger */}
        <div className="lg:col-span-8">
          <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl overflow-hidden p-3 h-full flex flex-col">
            <CardHeader className="p-0 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  Sổ cái tài chính Nenkin
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-500">Chi tiết doanh thu, tỷ giá và hoa hồng theo từng hồ sơ.</CardDescription>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm mã, khách hàng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 w-32 sm:w-40 pl-7 pr-2 rounded-md border border-slate-200 text-xs bg-white/50 focus:outline-none focus:border-primary"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-7 rounded-md border border-slate-200 text-xs px-1.5 bg-white/50 focus:outline-none"
                >
                  <option value="ALL">Mọi trạng thái</option>
                  <option value="DRAFT">Bản nháp</option>
                  <option value="PENDING">Cần duyệt</option>
                  <option value="SENT_1ST">Đã nộp Lần 1</option>
                  <option value="RECEIVED_1ST">Đã nhận Lần 1</option>
                  <option value="SENT_2ND">Đã nộp Lần 2</option>
                  <option value="RECEIVED_2ND">Đã nhận Lần 2</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-x-auto min-h-[300px]">
              {loading ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 py-6">Đang tải...</div>
              ) : filteredApps.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  <Table className="border-collapse min-w-[640px]">
                    <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-[10px] uppercase font-bold py-1.5 text-slate-600 h-8">Khách hàng</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold py-1.5 text-slate-600 h-8 text-center">Trạng thái</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold py-1.5 text-slate-600 h-8 text-right">Tổng nhận (JPY)</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold py-1.5 text-slate-600 h-8 text-right">Phí dịch vụ (JPY)</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold py-1.5 text-slate-600 h-8 text-center">Tỷ giá</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold py-1.5 text-slate-600 h-8 text-right">Phí dịch vụ (VND)</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold py-1.5 text-slate-600 h-8 text-right">Hoa hồng (JPY)</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold py-1.5 text-slate-600 h-8 text-center"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApps.map((app) => (
                        <TableRow key={app.id} className="hover:bg-slate-50/50">
                          <TableCell className="py-1.5 px-2">
                            <div className="font-semibold text-xs text-slate-800">{app.customer?.fullName || 'N/A'}</div>
                            <div className="text-[10px] text-slate-500 uppercase">{app.customer?.code || 'N/A'}</div>
                          </TableCell>
                          <TableCell className="py-1.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                              app.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-200' :
                              app.status === 'PENDING' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                              app.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' :
                              'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {app.status === 'COMPLETED' ? 'H.Thành' :
                               app.status === 'PENDING' ? 'C.Duyệt' :
                               app.status === 'DRAFT' ? 'Nháp' :
                               app.status === 'SENT_1ST' ? 'Nộp L1' :
                               app.status === 'RECEIVED_1ST' ? 'Nhận L1' :
                               app.status === 'SENT_2ND' ? 'Nộp L2' :
                               app.status === 'RECEIVED_2ND' ? 'Nhận L2' :
                               app.status === 'CANCELLED' ? 'Đã hủy' : app.status}
                            </span>
                          </TableCell>
                          <TableCell className="py-1.5 text-right font-medium text-xs font-mono">
                            ¥{((Number(app.received1stJpy) || 0) + (Number(app.received2ndJpy) || 0)).toLocaleString()}
                          </TableCell>
                          <TableCell className="py-1.5 text-right text-xs font-mono">
                            {app.serviceFeeJpy ? `¥${Number(app.serviceFeeJpy).toLocaleString()}` : '---'}
                          </TableCell>
                          <TableCell className="py-1.5 text-center text-xs text-slate-500 font-mono">
                            {app.exchangeRate ? Number(app.exchangeRate).toFixed(1) : '---'}
                          </TableCell>
                          <TableCell className="py-1.5 text-right font-semibold text-xs text-indigo-900 font-mono">
                            {app.serviceFeeVnd ? `${Number(app.serviceFeeVnd).toLocaleString()} đ` : '---'}
                          </TableCell>
                          <TableCell className="py-1.5 text-right text-xs text-rose-600 font-mono">
                            {app.referralBonusJpy ? `¥${Number(app.referralBonusJpy).toLocaleString()}` : '---'}
                          </TableCell>
                          <TableCell className="py-1.5 text-center">
                            <Link href={`/applications/${app.id}`} className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors">
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 flex-col gap-2 py-8">
                  <FileText className="w-8 h-8 text-slate-300" />
                  Không tìm thấy hồ sơ nào phù hợp
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
