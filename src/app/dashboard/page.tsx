'use client';

import React, { useState, useEffect } from 'react';
import { Users, FileText, Banknote, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Removed hardcoded revenueData

// Utility to map icon names to Lucide icons
const iconMap: Record<string, React.ElementType> = {
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
};

export default function Home() {
  const [kpis, setKpis] = useState<{ title: string; value: string; trend: string; iconName: string; color: string; bg: string }[]>([]);
  const [recentApplications, setRecentApplications] = useState<{ id: string; name: string; status: string; date: string; amount: string }[]>([]);
  const [exchangeRateData, setExchangeRateData] = useState<{ date: string; rate: number }[]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const statusMap: Record<string, string> = {
    DRAFT: 'Bản nháp',
    PENDING: 'Chờ xử lý',
    SENT_1ST: 'Đã nộp (Lần 1)',
    RECEIVED_1ST: 'Đã nhận (Lần 1)',
    SENT_2ND: 'Đã nộp (Lần 2)',
    RECEIVED_2ND: 'Đã nhận (Lần 2)',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboardRes, ratesRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/exchange-rates?limit=14')
        ]);
        const dashboardJson = await dashboardRes.json();
        const ratesJson = await ratesRes.json();

        if (dashboardJson.success) {
          setKpis(dashboardJson.data.kpis || []);
          setRecentApplications(dashboardJson.data.recentApplications || []);
          setRevenueData(dashboardJson.data.revenueData || []);
        }
        
        if (ratesJson.success && ratesJson.data.length > 0) {
          const formattedRates = ratesJson.data.map((r: any) => {
            const d = new Date(r.date);
            return {
              date: `${d.getDate()}/${d.getMonth() + 1}`,
              rate: parseFloat(r.jpyToVnd)
            };
          });
          setExchangeRateData(formattedRates);
        } else {
          // Fallback data if DB is empty
          setExchangeRateData([
            { date: '01/05', rate: 165.2 },
            { date: '05/05', rate: 164.8 },
            { date: '10/05', rate: 166.5 },
            { date: '15/05', rate: 167.1 },
            { date: '20/05', rate: 168.0 },
            { date: '25/05', rate: 169.2 },
            { date: '30/05', rate: 170.5 },
          ]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden pb-20 md:pb-0">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Tổng quan (Dashboard)</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Theo dõi các chỉ số quan trọng và tiến độ hồ sơ Nenkin.</p>
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải...</div>
      ) : (
        <>
          {/* KPI Cards — Mini-Ribbons on Mobile */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {kpis.map((kpi, index) => {
              const Icon = iconMap[kpi.iconName] || Users;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow bg-white/85 backdrop-blur-md border border-slate-200/70">
                  <CardContent className="p-3 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{kpi.title}</p>
                        <h3 className="text-base sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">{kpi.value}</h3>
                      </div>
                      <div className={"w-8 h-8 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0 " + kpi.bg}>
                        <Icon className={"w-4 h-4 sm:w-5 sm:h-5 " + kpi.color} />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-[10px] sm:text-xs truncate">
                      <span className="text-emerald-600 font-bold">{kpi.trend}</span>
                      <span className="text-slate-400 dark:text-slate-500 ml-1 truncate">so với tháng trước</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Applications and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Applications */}
            <Card className="lg:col-span-2 overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <CardTitle>Hồ sơ cập nhật gần đây</CardTitle>
                </div>
                <Link href="/applications" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                  Xem tất cả
                </Link>
              </CardHeader>
              <div className="flex-1 overflow-x-auto p-0">
                <div className="hidden md:block">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900">
                      <TableRow>
                        <TableHead className="w-[100px]">Mã HS</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày nộp</TableHead>
                        <TableHead className="text-right">Dự kiến nhận</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentApplications.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">Không có dữ liệu</TableCell>
                        </TableRow>
                      ) : (
                        recentApplications.map((app, index) => (
                          <TableRow 
                            key={index} 
                            className="cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => window.location.href = `/applications/${app.id}`}
                          >
                            <TableCell className="font-medium">
                              <span className="truncate max-w-[100px] block" title={app.id}>
                                {app.id.split('-')[0]}...
                              </span>
                            </TableCell>
                            <TableCell>{app.name}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                                {statusMap[app.status] || app.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-slate-500">{app.date}</TableCell>
                            <TableCell className="text-right font-medium">{app.amount}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="md:hidden flex flex-col gap-2 p-2.5">
                  {recentApplications.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-500">Không có dữ liệu</div>
                  ) : (
                    recentApplications.map((app, index) => (
                      <div key={index} className="border border-slate-200/80 rounded-xl p-3 space-y-2 bg-white/90 shadow-xs cursor-pointer hover:border-indigo-300 transition-colors"
                        onClick={() => window.location.href = `/applications/${app.id}`}>
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="font-mono text-[10px] text-slate-400 truncate">{app.id}</div>
                            <div className="font-bold text-xs text-slate-800 truncate">{app.name}</div>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                            {statusMap[app.status] || app.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="text-slate-400 text-[11px]">Ngày nộp: {app.date}</span>
                          <span className="font-bold font-mono text-slate-800">{app.amount}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Thao tác nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/applications/new" className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all text-left group">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/60 transition-colors">
                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-400">Thêm khách hàng mới</p>
                    <p className="text-xs text-muted-foreground">Tạo profile khách hàng</p>
                  </div>
                </Link>
                <Link href="/applications" className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all text-left group">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/60 transition-colors">
                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Tạo hồ sơ Nenkin</p>
                    <p className="text-xs text-muted-foreground">Scan Zairyu card & tự điền form</p>
                  </div>
                </Link>
                <Link href="/finance" className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all text-left group">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-800/60 transition-colors">
                    <Banknote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-amber-700 dark:group-hover:text-amber-400">Tính toán chi phí</p>
                    <p className="text-xs text-muted-foreground">Báo giá Nenkin & tỷ giá</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
            <Card className="bg-white/85 backdrop-blur-md border border-slate-200/70">
              <CardHeader className="p-3 sm:p-4 pb-1">
                <CardTitle className="text-xs sm:text-sm font-bold">Biểu đồ Tỷ giá JPY/VND</CardTitle>
              </CardHeader>
              <CardContent className="h-44 sm:h-56 p-2 sm:p-4">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={exchangeRateData} margin={{ top: 5, right: 15, bottom: 5, left: -20 }}>
                      <Line type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickMargin={5} stroke="#94a3b8" />
                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <RechartsTooltip />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/85 backdrop-blur-md border border-slate-200/70">
              <CardHeader className="p-3 sm:p-4 pb-1">
                <CardTitle className="text-xs sm:text-sm font-bold">Doanh thu ước tính (Triệu VNĐ)</CardTitle>
              </CardHeader>
              <CardContent className="h-44 sm:h-56 p-2 sm:p-4">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} margin={{ top: 5, right: 15, bottom: 5, left: -20 }}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} tickMargin={5} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                      <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
