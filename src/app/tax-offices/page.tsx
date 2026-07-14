'use client';

import React, { useState, useEffect } from 'react';
import { Search, Map, ExternalLink, Clock, Plus } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function TaxOfficesPage() {
  type TaxOfficeData = {
    id: string;
    name: string;
    romajiName?: string;
    websiteUrl?: string;
    mapUrl?: string;
    postalCode: string;
    address: string;
    romajiAddress?: string;
    phone?: string;
    receptionInfo?: string;
    notes?: string;
    _count?: { customers: number };
  };

  const [taxOffices, setTaxOffices] = useState<TaxOfficeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOffice, setEditingOffice] = useState<TaxOfficeData | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchTaxOffices = async () => {
    try {
      const res = await fetch('/api/tax-offices');
      const data = await res.json();
      if (data.success) {
        setTaxOffices(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch('/api/tax-offices');
        const data = await res.json();
        if (!ignore && data.success) {
          setTaxOffices(data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  const handleEditClick = (office: TaxOfficeData) => {
    setEditingOffice(office);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffice) return;
    try {
      const res = await fetch(`/api/tax-offices/${editingOffice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOffice)
      });
      const data = await res.json();
      if (data.success) {
        alert('Cập nhật thành công!');
        setEditingOffice(null);
        fetchTaxOffices();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch {
      alert('Đã xảy ra lỗi.');
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cục thuế này? Hành động này không thể hoàn tác.')) return;
    try {
      const res = await fetch(`/api/tax-offices/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('Đã xóa thành công!');
        fetchTaxOffices();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch {
      alert('Đã xảy ra lỗi.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2 h-9" size="sm">
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Hủy thêm mới' : 'Thêm Cục Thuế'}
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm kiếm cục thuế..." className="pl-9" />
          </div>
        </CardHeader>
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900">
              <TableRow>
                <TableHead>Tên Cục Thuế (Kanji / Romaji)</TableHead>
                <TableHead>Mã Bưu Điện</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Thông tin / Ghi chú</TableHead>
                <TableHead className="text-center">Số lượng KH</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">Đang tải...</TableCell>
                </TableRow>
              ) : taxOffices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">Chưa có dữ liệu cục thuế</TableCell>
                </TableRow>
              ) : (
                taxOffices.map((office, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="font-semibold text-indigo-600">{office.name}</div>
                      <div className="text-xs text-slate-500">{office.romajiName}</div>
                      <div className="flex gap-2 mt-1">
                        {office.websiteUrl && (
                          <a href={office.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Website
                          </a>
                        )}
                        {office.mapUrl && (
                          <a href={office.mapUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-500 hover:underline flex items-center gap-1">
                            <Map className="w-3 h-3" /> Bản đồ                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">〒{office.postalCode}</TableCell>
                    <TableCell>
                      <div className="text-sm">{office.address}</div>
                      <div className="text-xs text-slate-500">{office.romajiAddress}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-xs truncate" title={office.receptionInfo}>
                        {office.phone && (
                          <span className="flex items-center gap-1 font-medium text-slate-700">📞 {office.phone}</span>
                        )}
                        {office.receptionInfo ? (
                           <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {office.receptionInfo}</span>
                        ) : '---'}
                      </div>
                      <div className="text-xs text-amber-600 max-w-xs truncate" title={office.notes}>
                        {office.notes}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {office._count?.customers || 0} Khách
                      </span>
                    </TableCell>
                    <TableCell className="text-right flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(office)}>Sửa</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteClick(office.id)}>Xóa</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="md:hidden flex flex-col gap-4 p-4">
          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : taxOffices.length === 0 ? (
            <div className="text-center py-4 text-slate-500">Chưa có dữ liệu cục thuế</div>
          ) : (
            taxOffices.map((office, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-indigo-600">{office.name}</div>
                    <div className="text-xs text-slate-500">{office.romajiName}</div>
                  </div>
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {office._count?.customers || 0} Khách
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">〒{office.postalCode}</span>
                  <div>{office.address}</div>
                  <div className="text-xs text-slate-500">{office.romajiAddress}</div>
                </div>
                <div className="text-sm space-y-1">
                  {office.phone && (
                    <div className="flex items-center gap-1 font-medium text-slate-700">📞 {office.phone}</div>
                  )}
                  {office.receptionInfo && (
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {office.receptionInfo}</div>
                  )}
                  {office.notes && (
                    <div className="text-xs text-amber-600 mt-1">{office.notes}</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {office.websiteUrl && (
                    <a href={office.websiteUrl} target="_blank" rel="noreferrer" className="flex-1 text-center py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 flex items-center justify-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Web
                    </a>
                  )}
                  {office.mapUrl && (
                    <a href={office.mapUrl} target="_blank" rel="noreferrer" className="flex-1 text-center py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-md hover:bg-emerald-100 flex items-center justify-center gap-1">
                      <Map className="w-3 h-3" /> Map
                    </a>
                  )}
                  <Button variant="outline" size="sm" className="flex-1 h-7" onClick={() => handleEditClick(office)}>Sửa</Button>
                  <Button variant="danger" size="sm" className="flex-1 h-7" onClick={() => handleDeleteClick(office.id)}>Xóa</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Edit Modal */}
      {editingOffice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-3xl w-full p-6 my-8">
            <h2 className="text-xl font-bold mb-4">Cập nhật thông tin Cục Thuế</h2>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tên Cục Thuế (Kanji)</label>
                  <Input value={editingOffice.name} onChange={e => setEditingOffice({...editingOffice, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tên Cục Thuế (Romaji)</label>
                  <Input value={editingOffice.romajiName || ''} onChange={e => setEditingOffice({...editingOffice, romajiName: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Địa chỉ (Kanji)</label>
                  <Input value={editingOffice.address || ''} onChange={e => setEditingOffice({...editingOffice, address: e.target.value})} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Địa chỉ (Romaji)</label>
                  <Input value={editingOffice.romajiAddress || ''} onChange={e => setEditingOffice({...editingOffice, romajiAddress: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mã bưu điện</label>
                  <Input value={editingOffice.postalCode || ''} onChange={e => setEditingOffice({...editingOffice, postalCode: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Số điện thoại</label>
                  <Input value={editingOffice.phone || ''} onChange={e => setEditingOffice({...editingOffice, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Thông tin tiếp nhận (Giờ làm việc...)</label>
                  <Input value={editingOffice.receptionInfo || ''} onChange={e => setEditingOffice({...editingOffice, receptionInfo: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Link Website (NTA)</label>
                  <Input value={editingOffice.websiteUrl || ''} onChange={e => setEditingOffice({...editingOffice, websiteUrl: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Link Google Maps</label>
                  <Input value={editingOffice.mapUrl || ''} onChange={e => setEditingOffice({...editingOffice, mapUrl: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Ghi chú (Note)</label>
                  <Input value={editingOffice.notes || ''} onChange={e => setEditingOffice({...editingOffice, notes: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-6 border-t">
                <Button variant="outline" type="button" onClick={() => setEditingOffice(null)}>Hủy</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Lưu thay đổi</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
