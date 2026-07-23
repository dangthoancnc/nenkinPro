'use client';

import React, { useState, useEffect } from 'react';
import { Map, ExternalLink, Clock, Plus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function TaxOfficesPage() {
  return (
    <React.Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><div className="animate-spin w-8 h-8 border-b-2 border-blue-500 rounded-full"></div></div>}>
      <TaxOfficesPageInner />
    </React.Suspense>
  );
}

function TaxOfficesPageInner() {
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

  const searchParams = useSearchParams();
  const q = searchParams.get('q')?.toLowerCase() || '';

  const filteredTaxOffices = taxOffices.filter(office => {
    if (!q) return true;
    return (
      office.name.toLowerCase().includes(q) ||
      (office.romajiName && office.romajiName.toLowerCase().includes(q)) ||
      (office.address && office.address.toLowerCase().includes(q)) ||
      (office.romajiAddress && office.romajiAddress.toLowerCase().includes(q)) ||
      office.postalCode.includes(q)
    );
  });

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
    <div className="space-y-4 max-w-full overflow-x-hidden pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Quản lý Cục Thuế Nhật Bản</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Danh sách cơ quan thuế phục vụ khai báo & nộp hồ sơ Nenkin.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-1.5 h-8 text-xs font-bold shrink-0" size="sm">
          <Plus className="w-3.5 h-3.5" />
          {showAddForm ? 'Hủy thêm mới' : 'Thêm Cục Thuế'}
        </Button>
      </div>

      <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 backdrop-blur-sm dark:bg-slate-900/50">
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
              ) : filteredTaxOffices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">Không tìm thấy dữ liệu cục thuế</TableCell>
                </TableRow>
              ) : (
                filteredTaxOffices.map((office, index) => (
                  <TableRow key={index} className="hover:bg-slate-50/50 transition-colors">
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
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50/80 text-indigo-700 border border-indigo-200">
                        {office._count?.customers || 0} Khách
                      </span>
                    </TableCell>
                    <TableCell className="text-right flex gap-2 justify-end">
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleEditClick(office)}>Sửa</Button>
                      <Button variant="danger" size="sm" className="rounded-xl" onClick={() => handleDeleteClick(office.id)}>Xóa</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="md:hidden flex flex-col gap-2.5 p-2.5">
          {loading ? (
            <div className="text-center py-4 text-xs text-slate-500">Đang tải...</div>
          ) : filteredTaxOffices.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-500">Không tìm thấy dữ liệu cục thuế</div>
          ) : (
            filteredTaxOffices.map((office, index) => (
              <div key={index} className="border border-slate-200/80 rounded-xl p-3 space-y-2 bg-white/90 shadow-xs">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-indigo-600 truncate">{office.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{office.romajiName}</div>
                  </div>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                    {office._count?.customers || 0} Khách
                  </span>
                </div>

                <div className="text-xs space-y-0.5 text-slate-700">
                  <div className="font-mono text-[11px] font-bold text-slate-900">〒{office.postalCode}</div>
                  <div className="text-xs leading-tight">{office.address}</div>
                  {office.romajiAddress && <div className="text-[10px] text-slate-400 truncate">{office.romajiAddress}</div>}
                </div>

                {(office.phone || office.receptionInfo || office.notes) && (
                  <div className="text-[11px] space-y-0.5 pt-1 border-t border-slate-100 text-slate-600">
                    {office.phone && <div className="font-mono text-slate-700">📞 {office.phone}</div>}
                    {office.receptionInfo && <div className="flex items-center gap-1 text-[10px] text-slate-500"><Clock className="w-3 h-3" /> {office.receptionInfo}</div>}
                    {office.notes && <div className="text-[10px] text-amber-600 font-semibold">{office.notes}</div>}
                  </div>
                )}

                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100">
                  <div className="flex gap-1">
                    {office.websiteUrl && (
                      <a href={office.websiteUrl} target="_blank" rel="noreferrer" className="px-2 py-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" /> Web
                      </a>
                    )}
                    {office.mapUrl && (
                      <a href={office.mapUrl} target="_blank" rel="noreferrer" className="px-2 py-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-1">
                        <Map className="w-2.5 h-2.5" /> Bản đồ
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="xs" className="h-6 text-[10px] px-2" onClick={() => handleEditClick(office)}>Sửa</Button>
                    <Button variant="danger" size="xs" className="h-6 text-[10px] px-2" onClick={() => handleDeleteClick(office.id)}>Xóa</Button>
                  </div>
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
