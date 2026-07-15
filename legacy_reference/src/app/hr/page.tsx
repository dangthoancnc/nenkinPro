'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, User, Mail, Briefcase, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function HRPage() {
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
        <Card className="border-indigo-100 dark:border-indigo-900 shadow-md">
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
                    <Input placeholder="Nhập họ và tên..." className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vị trí / Chức vụ</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="VD: Chuyên viên, Cộng tác viên..." className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phòng ban</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="VD: Kinh doanh, Kế toán..." className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email công việc</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="Nhập email..." className="pl-9" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Hủy</Button>
                <Button>Lưu Nhân sự</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm kiếm nhân sự..." className="pl-9" />
          </div>
        </CardHeader>
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900">
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
              ) : staffs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                staffs.map((staff, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-slate-500">{staff.id}</TableCell>
                    <TableCell className="font-semibold">{staff.name}</TableCell>
                    <TableCell>{staff.role}</TableCell>
                    <TableCell className="text-slate-500">{staff.department}</TableCell>
                    <TableCell className="text-slate-500">{staff.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        staff.status === 'Hoạt động' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                        staff.status === 'Nghỉ phép' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {staff.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
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
          ) : staffs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Không có dữ liệu</div>
          ) : (
            staffs.map((staff, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm relative">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">{staff.id}</div>
                    <div className="font-semibold text-slate-900">{staff.name}</div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    staff.status === 'Hoạt động' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                    staff.status === 'Nghỉ phép' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 mt-8">
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
