'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, User, Mail, Briefcase, Building2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function HRPage() {
  return (
    <React.Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><div className="animate-spin w-8 h-8 border-b-2 border-blue-500 rounded-full"></div></div>}>
      <HRPageInner />
    </React.Suspense>
  );
}

function HRPageInner() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [staffs, setStaffs] = useState<{ id: string; name: string; role: string; department: string; email: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStaffs() {
      try {
        const res = await fetch('/api/hr/staffs');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStaffs(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching staffs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStaffs();
  }, []);

  const searchParams = useSearchParams();
  const q = searchParams.get('q')?.toLowerCase() || '';

  const filteredStaffs = staffs.filter(staff => {
    if (!q) return true;
    return (
      staff.name.toLowerCase().includes(q) ||
      staff.id.toLowerCase().includes(q) ||
      staff.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quản lý Nhân sự</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý danh sách nhân viên và cộng tác viên.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Hủy thêm mới' : 'Thêm Nhân sự'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl overflow-hidden mb-6">
          <CardHeader>
            <CardTitle>Thêm Nhân sự mới</CardTitle>
            <CardDescription>Điền thông tin để cấp tài khoản cho nhân sự hoặc CTV mới.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Nhập họ và tên..." className="pl-9 bg-white/50 border-white/40 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vị trí / Chức vụ</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="VD: Chuyên viên, Cộng tác viên..." className="pl-9 bg-white/50 border-white/40 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phòng ban</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="VD: Kinh doanh, Kế toán..." className="pl-9 bg-white/50 border-white/40 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email công việc</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="Nhập email..." className="pl-9 bg-white/50 border-white/40 rounded-xl" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/30 mt-6">
                <Button variant="outline" className="rounded-xl" onClick={() => setShowAddForm(false)}>Hủy</Button>
                <Button className="rounded-xl">Lưu Nhân sự</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 backdrop-blur-sm dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="w-[100px]">Mã NV</TableHead>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : filteredStaffs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Không tìm thấy dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaffs.map((staff, index) => (
                  <TableRow key={index} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-slate-500">{staff.id}</TableCell>
                    <TableCell className="font-semibold">{staff.name}</TableCell>
                    <TableCell>{staff.role}</TableCell>
                    <TableCell className="text-slate-500">{staff.department}</TableCell>
                    <TableCell className="text-slate-500">{staff.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        staff.status === 'Hoạt động' ? 'bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' :
                        staff.status === 'Nghỉ phép' ? 'bg-amber-50/80 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300' :
                        'bg-slate-100/80 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300'
                      }`}>
                        {staff.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="rounded-xl">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="md:hidden flex flex-col gap-4 p-4">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Đang tải dữ liệu...</div>
          ) : filteredStaffs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Không tìm thấy dữ liệu</div>
          ) : (
            filteredStaffs.map((staff, index) => (
              <div key={index} className="border border-white/50 rounded-2xl p-4 space-y-3 bg-white/40 backdrop-blur-md shadow-sm relative">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">{staff.id}</div>
                    <div className="font-semibold text-slate-900">{staff.name}</div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    staff.status === 'Hoạt động' ? 'bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' :
                    staff.status === 'Nghỉ phép' ? 'bg-amber-50/80 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300' :
                    'bg-slate-100/80 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300'
                  }`}>
                    {staff.status}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Vai trò:</span>
                  <span className="font-medium text-slate-900">{staff.role}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Phòng ban:</span>
                  <span className="text-slate-900">{staff.department}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-900">{staff.email}</span>
                </div>
                
                <div className="absolute top-2 right-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 mt-8 rounded-xl">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
