'use client';

import React, { useState, useEffect } from 'react';
import { Map, ExternalLink, Clock, Plus, Sparkles, Search, Loader2, Send, Phone, Building2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export default function TaxOfficesPage() {
  return (
    <React.Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><div className="animate-spin w-8 h-8 border-b-2 border-blue-500 rounded-full"></div></div>}>
      <TaxOfficesPageInner />
    </React.Suspense>
  );
}

type TaxOfficeData = {
  id: string;
  name: string;
  romajiName?: string | null;
  websiteUrl?: string | null;
  mapUrl?: string | null;
  postalCode: string;
  address: string;
  romajiAddress?: string | null;
  phone?: string | null;
  receptionInfo?: string | null;
  notes?: string | null;
  mailingName?: string | null;
  mailingPostalCode?: string | null;
  mailingAddress?: string | null;
  jurisdiction?: string | null;
  consultationPhone?: string | null;
  generalPhone?: string | null;
  _count?: { customers: number };
};

const emptyOfficeForm: Omit<TaxOfficeData, 'id' | '_count'> = {
  name: '',
  romajiName: '',
  postalCode: '',
  address: '',
  romajiAddress: '',
  phone: '',
  receptionInfo: '8:30 - 17:00 (Thứ 2 đến Thứ 6, trừ ngày lễ)',
  websiteUrl: '',
  mapUrl: '',
  notes: '',
  mailingName: '',
  mailingPostalCode: '',
  mailingAddress: '',
  jurisdiction: '',
  consultationPhone: '',
  generalPhone: '',
};

function TaxOfficesPageInner() {
  const [taxOffices, setTaxOffices] = useState<TaxOfficeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOffice, setEditingOffice] = useState<TaxOfficeData | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOffice, setNewOffice] = useState(emptyOfficeForm);
  const [autoFilling, setAutoFilling] = useState(false);
  const [enrichingAll, setEnrichingAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchTaxOffices = async () => {
    try {
      const res = await fetch('/api/tax-offices');
      const data = await res.json();
      if (data.success) {
        setTaxOffices(data.data);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Lỗi tải danh mục Cục thuế');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxOffices();
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
      office.postalCode.includes(q) ||
      (office.mailingAddress && office.mailingAddress.toLowerCase().includes(q))
    );
  });

  // Tra cứu tự động từ NTA khi nhập mã bưu điện
  const handleAutoFillFromZip = async (zipCode: string, isEdit = false) => {
    const cleanZip = zipCode.replace(/[-\s]/g, '');
    if (cleanZip.length !== 7) {
      toast.error('Vui lòng nhập đúng 7 chữ số mã bưu điện (VD: 593-8511)');
      return;
    }

    setAutoFilling(true);
    try {
      const res = await fetch(`/api/tax-offices/nta-lookup?zip=${cleanZip}`);
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        const formattedZip = `${cleanZip.slice(0, 3)}-${cleanZip.slice(3)}`;
        const autoMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.name + ' ' + d.address)}`;
        
        let autoRomaji = d.name.replace(/税務署$/, '') + ' Tax Office';
        if (d.name.includes('堺西')) autoRomaji = 'Sakainishi Tax Office';
        else if (d.name.includes('堺')) autoRomaji = 'Sakai Tax Office';

        if (isEdit && editingOffice) {
          setEditingOffice({
            ...editingOffice,
            name: d.name || editingOffice.name,
            romajiName: autoRomaji,
            postalCode: formattedZip,
            address: d.address || editingOffice.address,
            phone: d.generalPhone || d.phone || editingOffice.phone,
            websiteUrl: d.ntaPageUrl || editingOffice.websiteUrl,
            mapUrl: autoMapUrl,
            mailingName: d.mailingName || d.name,
            mailingPostalCode: d.mailingPostalCode || formattedZip,
            mailingAddress: d.mailingAddress || d.address,
            jurisdiction: d.jurisdiction || '',
            generalPhone: d.generalPhone || '',
            consultationPhone: d.consultationPhone || '',
          });
        } else {
          setNewOffice(prev => ({
            ...prev,
            name: d.name,
            romajiName: autoRomaji,
            postalCode: formattedZip,
            address: d.address,
            phone: d.generalPhone || d.phone,
            websiteUrl: d.ntaPageUrl,
            mapUrl: autoMapUrl,
            mailingName: d.mailingName || d.name,
            mailingPostalCode: d.mailingPostalCode || formattedZip,
            mailingAddress: d.mailingAddress || d.address,
            jurisdiction: d.jurisdiction || '',
            generalPhone: d.generalPhone || '',
            consultationPhone: d.consultationPhone || '',
          }));
        }
        toast.success(`Đã tự động điền thông tin từ NTA: ${d.name}`);
      } else {
        toast.error(data.error || 'Không tìm thấy thông tin trên NTA');
      }
    } catch (e: any) {
      toast.error('Lỗi kết nối NTA: ' + e.message);
    } finally {
      setAutoFilling(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/tax-offices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOffice),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã thêm Cục thuế ${newOffice.name} thành công!`);
        setShowAddForm(false);
        setNewOffice(emptyOfficeForm);
        fetchTaxOffices();
      } else {
        toast.error('Lỗi: ' + (data.error || 'Không thể tạo'));
      }
    } catch {
      toast.error('Đã xảy ra lỗi mạng.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffice) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tax-offices/${editingOffice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOffice),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Cập nhật Cục thuế thành công!');
        setEditingOffice(null);
        fetchTaxOffices();
      } else {
        toast.error('Lỗi: ' + data.error);
      }
    } catch {
      toast.error('Đã xảy ra lỗi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Cục thuế: ${name}? Hành động này không thể hoàn tác.`)) return;
    try {
      const res = await fetch(`/api/tax-offices/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã xóa thành công!');
        fetchTaxOffices();
      } else {
        toast.error('Lỗi: ' + data.error);
      }
    } catch {
      toast.error('Đã xảy ra lỗi.');
    }
  };

  const handleEnrichAll = async () => {
    if (!confirm('Hệ thống sẽ tự động quét toàn bộ danh sách Cục thuế để cập nhật Website NTA chính thức, link Google Maps và chuẩn hóa định dạng bưu điện. Bạn có muốn tiếp tục?')) return;
    setEnrichingAll(true);
    try {
      const res = await fetch('/api/tax-offices/enrich-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Chuẩn hóa thành công!');
        fetchTaxOffices();
      } else {
        toast.error('Lỗi: ' + data.error);
      }
    } catch (e: any) {
      toast.error('Lỗi kết nối: ' + e.message);
    } finally {
      setEnrichingAll(false);
    }
  };

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Quản lý Cục Thuế Nhật Bản (税務署)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Danh bạ cơ quan thuế và Trung tâm xử lý hồ sơ bưu điện (業務センター) phục vụ khai báo Nenkin & hoàn thuế Lần 2.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnrichAll}
            disabled={enrichingAll}
            className="gap-1.5 h-8 text-xs font-semibold shrink-0 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            title="Tự động đồng bộ link NTA, Maps và địa chỉ bưu điện cho tất cả Cục thuế"
          >
            {enrichingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            {enrichingAll ? 'Đang chuẩn hóa...' : '⚡ Làm giàu dữ liệu NTA'}
          </Button>

          <Button
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (!showAddForm) setNewOffice(emptyOfficeForm);
            }}
            className="gap-1.5 h-8 text-xs font-bold shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white"
            size="sm"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? 'Đóng form' : '+ Thêm Cục Thuế'}
          </Button>
        </div>
      </div>

      {/* Add New Modal / Expandable Form */}
      {showAddForm && (
        <Card className="p-4 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-indigo-200 shadow-lg rounded-2xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-100">
            <div>
              <h2 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" /> Thêm Cục Thuế Mới
              </h2>
              <p className="text-[11px] text-slate-500">
                Nhập 7 chữ số mã bưu điện để tự động trích xuất toàn bộ thông tin chuẩn từ Cục Thuế Quốc Gia (NTA).
              </p>
            </div>
            <Button variant="outline" size="xs" onClick={() => setShowAddForm(false)}>Đóng</Button>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-3">
            {/* Auto-fill bar */}
            <div className="p-2.5 bg-indigo-100/60 border border-indigo-200/80 rounded-xl flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Tra cứu nhanh từ NTA:
              </span>
              <div className="flex items-center gap-1.5 flex-1 min-w-[200px] max-w-sm">
                <Input
                  value={newOffice.postalCode}
                  onChange={e => setNewOffice({ ...newOffice, postalCode: e.target.value })}
                  placeholder="Mã bưu điện (VD: 593-8511)"
                  className="h-7 text-xs bg-white"
                />
                <Button
                  type="button"
                  size="xs"
                  onClick={() => handleAutoFillFromZip(newOffice.postalCode, false)}
                  disabled={autoFilling || !newOffice.postalCode}
                  className="h-7 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1 shrink-0"
                >
                  {autoFilling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                  {autoFilling ? 'Đang tra...' : '🔍 Tự điền'}
                </Button>
              </div>
              <span className="text-[11px] text-slate-500">
                (Tự động điền: Tên, Romaji, Địa chỉ, SĐT, Website, Bản đồ & TT Bưu điện)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tên Cục Thuế (Kanji) *</label>
                <Input
                  value={newOffice.name}
                  onChange={e => setNewOffice({ ...newOffice, name: e.target.value })}
                  placeholder="VD: 堺西税務署"
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tên Romaji / Tiếng Anh</label>
                <Input
                  value={newOffice.romajiName || ''}
                  onChange={e => setNewOffice({ ...newOffice, romajiName: e.target.value })}
                  placeholder="VD: Sakainishi Tax Office"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Số điện thoại</label>
                <Input
                  value={newOffice.phone || ''}
                  onChange={e => setNewOffice({ ...newOffice, phone: e.target.value })}
                  placeholder="VD: 072-271-3441"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Địa chỉ Cục Thuế *</label>
                <Input
                  value={newOffice.address}
                  onChange={e => setNewOffice({ ...newOffice, address: e.target.value })}
                  placeholder="VD: 〒593-8511 大阪府堺市西区鳳東町4丁390-1"
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Giờ tiếp nhận / Làm việc</label>
                <Input
                  value={newOffice.receptionInfo || ''}
                  onChange={e => setNewOffice({ ...newOffice, receptionInfo: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Link Website chính thức (NTA)</label>
                <Input
                  value={newOffice.websiteUrl || ''}
                  onChange={e => setNewOffice({ ...newOffice, websiteUrl: e.target.value })}
                  placeholder="https://www.nta.go.jp/..."
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Link Google Maps</label>
                <Input
                  value={newOffice.mapUrl || ''}
                  onChange={e => setNewOffice({ ...newOffice, mapUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Khu vực quản lý (管轄区域)</label>
                <Input
                  value={newOffice.jurisdiction || ''}
                  onChange={e => setNewOffice({ ...newOffice, jurisdiction: e.target.value })}
                  placeholder="VD: 堺市西区、中区、南区"
                  className="h-8 text-xs"
                />
              </div>

              {/* Mailing Address (Trung tâm nghiệp vụ bưu điện) */}
              <div className="space-y-1 md:col-span-2 lg:col-span-3 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1.5">
                  <Send className="w-3.5 h-3.5 text-amber-600" />
                  Địa chỉ gửi bưu điện hồ sơ hoàn thuế Lần 2 (申告書等の郵送先 / 業務センター):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Tên TT nhận thư:</span>
                    <Input
                      value={newOffice.mailingName || ''}
                      onChange={e => setNewOffice({ ...newOffice, mailingName: e.target.value })}
                      placeholder="VD: 大阪国税局業務センター"
                      className="h-7 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Mã bưu điện nhận thư:</span>
                    <Input
                      value={newOffice.mailingPostalCode || ''}
                      onChange={e => setNewOffice({ ...newOffice, mailingPostalCode: e.target.value })}
                      placeholder="VD: 540-8543"
                      className="h-7 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Địa chỉ nhận thư:</span>
                    <Input
                      value={newOffice.mailingAddress || ''}
                      onChange={e => setNewOffice({ ...newOffice, mailingAddress: e.target.value })}
                      placeholder="VD: 大阪市中央区大手前１丁目..."
                      className="h-7 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowAddForm(false)}>Hủy</Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                {submitting ? 'Đang lưu...' : 'Lưu Cục Thuế'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Table */}
      <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 backdrop-blur-sm dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="w-[200px]">Tên Cục Thuế (Kanji / Romaji)</TableHead>
                <TableHead className="w-[110px]">Mã Bưu Điện</TableHead>
                <TableHead>Địa chỉ & Trung tâm nhận bưu điện</TableHead>
                <TableHead className="w-[220px]">Liên hệ & Giờ làm việc</TableHead>
                <TableHead className="w-[90px] text-center">Số lượng KH</TableHead>
                <TableHead className="w-[110px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-indigo-500" />
                    Đang tải danh mục Cục thuế...
                  </TableCell>
                </TableRow>
              ) : filteredTaxOffices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-slate-500">
                    Không tìm thấy dữ liệu cơ quan thuế nào phù hợp
                  </TableCell>
                </TableRow>
              ) : (
                filteredTaxOffices.map((office, index) => (
                  <TableRow key={index} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell className="align-top">
                      <div className="font-bold text-sm text-indigo-700">{office.name}</div>
                      <div className="text-xs text-slate-500 font-medium">{office.romajiName || '---'}</div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {office.websiteUrl && (
                          <a
                            href={office.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                            title="Mở Website chính thức trên Cổng thông tin Tổng cục thuế (nta.go.jp)"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> Website
                          </a>
                        )}
                        {office.mapUrl && (
                          <a
                            href={office.mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                            title="Xem vị trí chỉ đường trên Google Maps"
                          >
                            <Map className="w-2.5 h-2.5" /> Bản đồ
                          </a>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="align-top font-mono font-bold text-xs text-slate-900">
                      〒{office.postalCode}
                    </TableCell>

                    <TableCell className="align-top space-y-1.5">
                      <div>
                        <div className="text-xs font-semibold text-slate-800 leading-snug">{office.address}</div>
                        {office.romajiAddress && <div className="text-[11px] text-slate-400">{office.romajiAddress}</div>}
                        {office.jurisdiction && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            <span className="font-medium text-slate-600">Khu vực:</span> {office.jurisdiction}
                          </div>
                        )}
                      </div>

                      {/* Thông tin Trung tâm gửi bưu điện */}
                      {(office.mailingAddress || office.mailingPostalCode) && (
                        <div className="p-1.5 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] text-amber-950 flex items-start gap-1">
                          <Send className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-900">Gửi bưu điện: </span>
                            {office.mailingName && <span>{office.mailingName} </span>}
                            {office.mailingPostalCode && <span className="font-mono font-semibold">(〒{office.mailingPostalCode}) </span>}
                            <span>{office.mailingAddress}</span>
                          </div>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="align-top space-y-1">
                      {office.phone && (
                        <div className="text-xs font-mono font-semibold text-slate-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-indigo-500" /> {office.phone}
                        </div>
                      )}
                      {office.receptionInfo && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate" title={office.receptionInfo}>{office.receptionInfo}</span>
                        </div>
                      )}
                      {office.notes && (
                        <div className="text-[11px] text-amber-700 italic line-clamp-2" title={office.notes}>
                          {office.notes}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="align-top text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {office._count?.customers || 0} Khách
                      </span>
                    </TableCell>

                    <TableCell className="align-top text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="outline" size="xs" className="h-6 text-[11px] px-2 rounded-lg" onClick={() => setEditingOffice(office)}>
                          Sửa
                        </Button>
                        <Button variant="danger" size="xs" className="h-6 text-[11px] px-2 rounded-lg" onClick={() => handleDeleteClick(office.id, office.name)}>
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col gap-2.5 p-2.5">
          {loading ? (
            <div className="text-center py-6 text-xs text-slate-500">Đang tải...</div>
          ) : filteredTaxOffices.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">Không tìm thấy dữ liệu</div>
          ) : (
            filteredTaxOffices.map((office, index) => (
              <div key={index} className="border border-slate-200/80 rounded-xl p-3 space-y-2 bg-white/90 shadow-xs">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="font-bold text-xs text-indigo-600">{office.name}</div>
                    <div className="text-[11px] text-slate-400">{office.romajiName}</div>
                  </div>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                    {office._count?.customers || 0} Khách
                  </span>
                </div>

                <div className="text-xs space-y-0.5 text-slate-700">
                  <div className="font-mono text-[11px] font-bold text-slate-900">〒{office.postalCode}</div>
                  <div className="text-xs leading-tight">{office.address}</div>
                </div>

                {(office.mailingAddress || office.mailingPostalCode) && (
                  <div className="p-2 rounded-lg bg-amber-50/90 border border-amber-200 text-[10px] text-amber-950 flex items-start gap-1">
                    <Send className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Gửi bưu điện: </span>
                      〒{office.mailingPostalCode} - {office.mailingAddress}
                    </div>
                  </div>
                )}

                {(office.phone || office.receptionInfo) && (
                  <div className="text-[11px] space-y-0.5 pt-1 border-t border-slate-100 text-slate-600">
                    {office.phone && <div className="font-mono font-semibold">📞 {office.phone}</div>}
                    {office.receptionInfo && <div className="text-[10px] text-slate-500"><Clock className="w-3 h-3 inline mr-1" />{office.receptionInfo}</div>}
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
                    <Button variant="outline" size="xs" className="h-6 text-[10px] px-2" onClick={() => setEditingOffice(office)}>Sửa</Button>
                    <Button variant="danger" size="xs" className="h-6 text-[10px] px-2" onClick={() => handleDeleteClick(office.id, office.name)}>Xóa</Button>
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-5 my-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">Cập nhật thông tin Cục Thuế: {editingOffice.name}</h2>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => handleAutoFillFromZip(editingOffice.postalCode, true)}
                disabled={autoFilling || !editingOffice.postalCode}
                className="gap-1 text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-semibold"
              >
                {autoFilling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-500" />}
                Lấy lại thông tin từ NTA
              </Button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tên Cục Thuế (Kanji) *</label>
                  <Input value={editingOffice.name} onChange={e => setEditingOffice({...editingOffice, name: e.target.value})} required className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tên Cục Thuế (Romaji)</label>
                  <Input value={editingOffice.romajiName || ''} onChange={e => setEditingOffice({...editingOffice, romajiName: e.target.value})} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Mã bưu điện *</label>
                  <Input value={editingOffice.postalCode} onChange={e => setEditingOffice({...editingOffice, postalCode: e.target.value})} required className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Địa chỉ (Kanji) *</label>
                  <Input value={editingOffice.address} onChange={e => setEditingOffice({...editingOffice, address: e.target.value})} required className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Số điện thoại</label>
                  <Input value={editingOffice.phone || ''} onChange={e => setEditingOffice({...editingOffice, phone: e.target.value})} className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Giờ tiếp nhận / Làm việc</label>
                  <Input value={editingOffice.receptionInfo || ''} onChange={e => setEditingOffice({...editingOffice, receptionInfo: e.target.value})} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Link Website (NTA)</label>
                  <Input value={editingOffice.websiteUrl || ''} onChange={e => setEditingOffice({...editingOffice, websiteUrl: e.target.value})} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Link Google Maps</label>
                  <Input value={editingOffice.mapUrl || ''} onChange={e => setEditingOffice({...editingOffice, mapUrl: e.target.value})} className="h-8 text-xs" />
                </div>

                {/* Mailing section */}
                <div className="space-y-1 md:col-span-2 lg:col-span-3 p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl">
                  <div className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                    <Send className="w-3.5 h-3.5 text-amber-600" />
                    Địa chỉ gửi bưu điện hồ sơ (業務センター):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Tên TT nhận:</span>
                      <Input value={editingOffice.mailingName || ''} onChange={e => setEditingOffice({...editingOffice, mailingName: e.target.value})} className="h-7 text-xs bg-white" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Mã bưu điện TT:</span>
                      <Input value={editingOffice.mailingPostalCode || ''} onChange={e => setEditingOffice({...editingOffice, mailingPostalCode: e.target.value})} className="h-7 text-xs bg-white" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Địa chỉ TT:</span>
                      <Input value={editingOffice.mailingAddress || ''} onChange={e => setEditingOffice({...editingOffice, mailingAddress: e.target.value})} className="h-7 text-xs bg-white" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2 lg:col-span-3">
                  <label className="text-xs font-semibold text-slate-700">Ghi chú (Note)</label>
                  <Input value={editingOffice.notes || ''} onChange={e => setEditingOffice({...editingOffice, notes: e.target.value})} className="h-8 text-xs" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 mt-4 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setEditingOffice(null)}>Hủy</Button>
                <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
