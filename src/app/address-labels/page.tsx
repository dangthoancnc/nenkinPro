'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Printer,
  Building2,
  Users,
  Stamp,
  CheckSquare,
  Square,
  Search,
  Sliders,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  FileText,
  Mail,
  Scissors,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AddressLabelSheet,
  LabelLayoutType,
  LAYOUT_CONFIGS,
} from '@/components/address-labels/AddressLabelSheet';
import { AddressLabelData } from '@/components/address-labels/AddressLabelCard';

type TabType = 'tax_rep' | 'tax_office' | 'nenkin_org';

export default function AddressLabelsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('tax_rep');
  const [layout, setLayout] = useState<LabelLayoutType>('3x6');
  const [zoom, setZoom] = useState<number>(85);
  const [showCutLines, setShowCutLines] = useState<boolean>(true);

  // Data sources
  const [taxRepresentatives, setTaxRepresentatives] = useState<any[]>([]);
  const [taxOffices, setTaxOffices] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab 1: Tax Representative state
  const [selectedRepId, setSelectedRepId] = useState<string>('');
  const [repCount, setRepCount] = useState<number>(18);
  const [repTag, setRepTag] = useState<string>('【送付先】');
  const [repHonorific, setRepHonorific] = useState<'御中' | '様' | '行' | 'none'>('様');

  // Tab 2: Tax Office Applications state
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());
  const [appSearch, setAppSearch] = useState<string>('');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');
  const [officeAddressMode, setOfficeAddressMode] = useState<'mailing' | 'headquarters'>('mailing');
  const [officeTag, setOfficeTag] = useState<string>('【申告書等提出先】');
  const [officeHonorific, setOfficeHonorific] = useState<'御中' | '様' | '行' | 'none'>('御中');

  // Tab 3: Nenkin Org state
  const [nenkinCount, setNenkinCount] = useState<number>(18);
  const [nenkinTag, setNenkinTag] = useState<string>('【請求書提出先】');

  // Fetch data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [repsRes, officesRes, appsRes] = await Promise.all([
          fetch('/api/tax-representatives'),
          fetch('/api/tax-offices'),
          fetch('/api/applications'),
        ]);

        if (repsRes.ok) {
          const rData = await repsRes.json();
          const list = rData.data || (Array.isArray(rData) ? rData : []);
          setTaxRepresentatives(list);
          if (list.length > 0) setSelectedRepId(list[0].id);
        }

        if (officesRes.ok) {
          const oData = await officesRes.json();
          setTaxOffices(oData.data || (Array.isArray(oData) ? oData : []));
        }

        if (appsRes.ok) {
          const aData = await appsRes.json();
          const list = Array.isArray(aData) ? aData : aData.data || [];
          setApplications(list);
          const initialSet = new Set<string>();
          list.slice(0, 18).forEach((a: any) => initialSet.add(a.id));
          setSelectedAppIds(initialSet);
        }
      } catch (err) {
        console.error('Error fetching label print data:', err);
        toast.error('Lỗi khi tải dữ liệu in tem');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute label items for Tab 1: Tax Representative
  const repLabels: AddressLabelData[] = useMemo(() => {
    const rep = taxRepresentatives.find((r) => r.id === selectedRepId);
    if (!rep) return [];

    const singleLabel: AddressLabelData = {
      id: rep.id,
      postalCode: rep.postalCode || '',
      address: rep.address || '',
      recipientName: rep.fullName || '',
      department: rep.fullNameKana ? `（${rep.fullNameKana}）` : '',
      phone: rep.phone || '',
      honorific: repHonorific,
      typeTag: repTag,
    };

    return Array.from({ length: repCount }).map((_, idx) => ({
      ...singleLabel,
      id: `${rep.id}-${idx}`,
    }));
  }, [selectedRepId, taxRepresentatives, repCount, repHonorific, repTag]);

  // Compute label items for Tab 2: Tax Office per Application
  const officeLabels: AddressLabelData[] = useMemo(() => {
    const list: AddressLabelData[] = [];

    applications.forEach((app) => {
      if (!selectedAppIds.has(app.id)) return;

      const customer = app.customer || {};
      const taxOffice =
        customer.taxOffice ||
        taxOffices.find((o) => o.id === customer.taxOfficeId) ||
        {};

      let postal = taxOffice.postalCode || '';
      let address = taxOffice.address || '';
      let name = taxOffice.name || '';
      let department = '';

      if (officeAddressMode === 'mailing') {
        postal = taxOffice.mailingPostalCode || taxOffice.postalCode || '';
        address = taxOffice.mailingAddress || taxOffice.address || '';
        name = taxOffice.mailingName || taxOffice.name || '';
        if (taxOffice.mailingName && taxOffice.mailingName !== taxOffice.name) {
          department = `（${taxOffice.name} 宛）`;
        }
      }

      list.push({
        id: app.id,
        postalCode: postal,
        address: address,
        recipientName: name,
        department: department,
        phone: taxOffice.phone || taxOffice.generalPhone || taxOffice.consultationPhone || '',
        honorific: officeHonorific,
        typeTag: officeTag,
        appCode: customer.code || '',
        customerName: customer.fullName || '',
      });
    });

    return list;
  }, [
    applications,
    selectedAppIds,
    taxOffices,
    officeAddressMode,
    officeHonorific,
    officeTag,
  ]);

  // Compute label items for Tab 3: Nenkin Org
  const nenkinLabels: AddressLabelData[] = useMemo(() => {
    const singleLabel: AddressLabelData = {
      id: 'nenkin-org',
      postalCode: '168-8505',
      address: '東京都杉並区高井戸西3丁目5番24号',
      recipientName: '日本年金機構',
      department: '業務センター（外国業務グループ）',
      phone: '03-6700-1165',
      honorific: '御中',
      typeTag: nenkinTag,
    };

    return Array.from({ length: nenkinCount }).map((_, idx) => ({
      ...singleLabel,
      id: `nenkin-${idx}`,
    }));
  }, [nenkinCount, nenkinTag]);

  // Active labels based on current tab
  const activeLabels =
    activeTab === 'tax_rep'
      ? repLabels
      : activeTab === 'tax_office'
      ? officeLabels
      : nenkinLabels;

  const currentConfig = LAYOUT_CONFIGS[layout] || LAYOUT_CONFIGS['3x6'];
  const totalPages = Math.ceil(activeLabels.length / currentConfig.perPage) || 1;

  // Filtered applications list for Tab 2
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const q = appSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        (app.customer?.fullName || '').toLowerCase().includes(q) ||
        (app.customer?.code || '').toLowerCase().includes(q) ||
        (app.customer?.taxOffice?.name || '').toLowerCase().includes(q);

      const matchStatus =
        appStatusFilter === 'all' || app.status === appStatusFilter;

      return matchQuery && matchStatus;
    });
  }, [applications, appSearch, appStatusFilter]);

  const handleSelectAllApps = () => {
    const newSet = new Set<string>();
    filteredApps.forEach((a) => newSet.add(a.id));
    setSelectedAppIds(newSet);
  };

  const handleDeselectAllApps = () => {
    setSelectedAppIds(new Set());
  };

  const toggleAppSelection = (id: string) => {
    const next = new Set(selectedAppIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAppIds(next);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 p-3 sm:p-5 max-w-full overflow-x-hidden pb-20 md:pb-6">
      {/* ── HEADER RIBBON ── */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200/80 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Stamp className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                In Tem Phiếu Địa Chỉ (LetterPack & Phong Bì)
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Tem nhỏ gọn chuẩn LetterPack · Khung viền riêng biệt · Căn lề đều chuẩn xác (Lề trái + phải = Khoảng cách giữa 2 tem)
              </p>
            </div>
          </div>
        </div>

        {/* Global Print Action Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handlePrint}
            disabled={activeLabels.length === 0}
            className="w-full sm:w-auto px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            In {activeLabels.length} Tem ({totalPages} Trang A4)
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE: 2-COLUMN HIGH-DENSITY LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start print:block">
        {/* ── LEFT COLUMN: CONTROL & CONFIGURATION PANEL ── */}
        <div className="lg:col-span-5 flex flex-col gap-3 print:hidden">
          {/* Main Navigation Tabs */}
          <div className="bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('tax_rep')}
              className={`px-2 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'tax_rep'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>1. Người đại diện</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tax_office')}
              className={`px-2 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'tax_office'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>2. Cục thuế (HS)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('nenkin_org')}
              className={`px-2 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'nenkin_org'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>3. Cơ quan Nenkin</span>
            </button>
          </div>

          {/* ── TAB 1 CONFIG: TAX REPRESENTATIVE ── */}
          {activeTab === 'tax_rep' && (
            <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm space-y-3.5">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
                  Cấu hình Tem Người đại diện thuế (送付先 / 差出人)
                </span>
                <span className="text-[11px] text-slate-500">
                  In hàng loạt nhiều tem giống nhau trên 1 tờ A4 để dán vào phong bì nhận kết quả
                </span>
              </div>

              {/* Rep selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn Người đại diện thuế:
                </label>
                <select
                  value={selectedRepId}
                  onChange={(e) => setSelectedRepId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-xs bg-white font-medium focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                >
                  {taxRepresentatives.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.fullName} ({rep.postalCode} · {rep.address?.slice(0, 25)}...)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity setting */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Số lượng tem muốn in:
                  </label>
                  <span className="text-xs font-mono font-bold text-teal-700">
                    {repCount} tem ({Math.ceil(repCount / currentConfig.perPage)} tờ A4)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[6, 12, 18, 21, 24, 36, 48].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRepCount(n)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all ${
                        repCount === n
                          ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {n} tem
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={repCount}
                      onChange={(e) => setRepCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 h-7 rounded-md border border-slate-200 text-xs px-1.5 text-center font-bold font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Tag & Honorific */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nhãn tem phân loại:
                  </label>
                  <select
                    value={repTag}
                    onChange={(e) => setRepTag(e.target.value)}
                    className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs bg-white font-medium"
                  >
                    <option value="【送付先】">【送付先】 (Nơi nhận KQ)</option>
                    <option value="【ご依頼主】">【ご依頼主】 (Người gửi)</option>
                    <option value="【差出人】">【差出人】 (Người gửi)</option>
                    <option value="【納税管理人】">【納税管理人】 (Đại diện thuế)</option>
                    <option value="">Không in nhãn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kính ngữ:
                  </label>
                  <select
                    value={repHonorific}
                    onChange={(e) => setRepHonorific(e.target.value as any)}
                    className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs bg-white font-medium"
                  >
                    <option value="様">様 (Kính ngữ Cá nhân)</option>
                    <option value="御中">御中 (Kính ngữ Đơn vị/CTy)</option>
                    <option value="行">行 (Bì thư phản hồi)</option>
                    <option value="none">Không kèm kính ngữ</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2 CONFIG: TAX OFFICE (BULK APPLICATIONS) ── */}
          {activeTab === 'tax_office' && (
            <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
                    Chọn Hồ Sơ Để In Tem Cục Thuế Nhận (お届け先)
                  </span>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    Đã chọn: {selectedAppIds.size} / {applications.length}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Tự động trích xuất nơi tiếp nhận Cục thuế của từng hồ sơ và dồn trang A4
                </span>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nơi tiếp nhận Cục thuế:
                  </label>
                  <select
                    value={officeAddressMode}
                    onChange={(e) => setOfficeAddressMode(e.target.value as any)}
                    className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs bg-white font-medium"
                  >
                    <option value="mailing">Trung tâm nhận HS (郵送先 - Khuyên dùng)</option>
                    <option value="headquarters">Trụ sở Cục thuế (税務署所在地)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nhãn tem:
                  </label>
                  <select
                    value={officeTag}
                    onChange={(e) => setOfficeTag(e.target.value)}
                    className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs bg-white font-medium"
                  >
                    <option value="【申告書等提出先】">【申告書等提出先】</option>
                    <option value="【お届け先】">【お届け先】 (Nơi nhận)</option>
                    <option value="【宛名】">【宛名】</option>
                    <option value="【重要書類在中】">【重要書類在中】</option>
                    <option value="">Không in nhãn</option>
                  </select>
                </div>
              </div>

              {/* Filter and Selection Tools */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Tìm tên khách hàng, mã HS, cục thuế..."
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                      className="w-full h-8 pl-8 pr-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <select
                    value={appStatusFilter}
                    onChange={(e) => setAppStatusFilter(e.target.value)}
                    className="h-8 rounded-lg border border-slate-200 px-2 text-xs bg-white"
                  >
                    <option value="all">Mọi trạng thái</option>
                    <option value="DRAFT">Bản nháp</option>
                    <option value="PENDING">Cần duyệt</option>
                    <option value="SENT_1ST">Đã gửi L1</option>
                    <option value="RECEIVED_1ST">Đã nhận L1</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllApps}
                      className="text-teal-600 hover:text-teal-800 flex items-center gap-1"
                    >
                      <CheckSquare className="w-3 h-3" /> Chọn tất cả ({filteredApps.length})
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllApps}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                  <span>{filteredApps.length} hồ sơ hiển thị</span>
                </div>
              </div>

              {/* Application List (Scrollable High-Density Table) */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[260px] overflow-y-auto divide-y divide-slate-100 bg-slate-50/40">
                {filteredApps.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Không tìm thấy hồ sơ phù hợp
                  </div>
                ) : (
                  filteredApps.map((app) => {
                    const isSelected = selectedAppIds.has(app.id);
                    const cust = app.customer || {};
                    const taxName = cust.taxOffice?.name || 'Chưa gán Cục thuế';
                    return (
                      <div
                        key={app.id}
                        onClick={() => toggleAppSelection(app.id)}
                        className={`p-2 flex items-center gap-2 text-xs cursor-pointer transition-colors ${
                          isSelected ? 'bg-teal-50/80 font-semibold text-slate-900' : 'hover:bg-white text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold">{cust.fullName || 'Khách hàng'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({cust.code || app.id.slice(0, 6)})</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{taxName}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── TAB 3 CONFIG: NENKIN ORGANIZATION ── */}
          {activeTab === 'nenkin_org' && (
            <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm space-y-3.5">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
                  Cấu hình Tem Cơ quan Nenkin Nhật Bản (日本年金機構)
                </span>
                <span className="text-[11px] text-slate-500">
                  Địa chỉ trung tâm tiếp nhận hồ sơ xin nhận Nenkin 1 lần (Lần 1)
                </span>
              </div>

              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/80 text-xs space-y-1 text-slate-800">
                <p className="font-bold text-teal-900">〒168-8505 東京都杉並区高井戸西3丁目5番24号</p>
                <p className="font-black text-sm">日本年金機構（外国業務グループ）御中</p>
                <p className="text-[11px] text-slate-600 font-mono">TEL: 03-6700-1165 (専用ダイヤル)</p>
              </div>

              {/* Quantity setting */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Số lượng tem muốn in:
                  </label>
                  <span className="text-xs font-mono font-bold text-teal-700">
                    {nenkinCount} tem ({Math.ceil(nenkinCount / currentConfig.perPage)} tờ A4)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[6, 12, 18, 21, 24, 36, 48].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNenkinCount(n)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all ${
                        nenkinCount === n
                          ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {n} tem
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={nenkinCount}
                      onChange={(e) => setNenkinCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 h-7 rounded-md border border-slate-200 text-xs px-1.5 text-center font-bold font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhãn tem:
                </label>
                <select
                  value={nenkinTag}
                  onChange={(e) => setNenkinTag(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs bg-white font-medium"
                >
                  <option value="【請求書提出先】">【請求書提出先】 (Nơi nộp đơn L1)</option>
                  <option value="【脱退一時金】">【脱退一時金】</option>
                  <option value="【お届け先】">【お届け先】</option>
                  <option value="">Không in nhãn</option>
                </select>
              </div>
            </div>
          )}

          {/* ── GRID LAYOUT SELECTOR (LETTERPACK & ENVELOPE DENSITY) ── */}
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                Định dạng Lưới & Kích thước Tem
              </span>
              <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Lề ngoài = 1/2 Khoảng cách tem
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(LAYOUT_CONFIGS) as LabelLayoutType[]).map((key) => {
                const item = LAYOUT_CONFIGS[key];
                const isSelected = layout === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLayout(key)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/50 shadow-sm ring-1 ring-teal-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-800">{item.name}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isSelected
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{item.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCutLines}
                  onChange={(e) => setShowCutLines(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                />
                <Scissors className="w-3.5 h-3.5 text-slate-400" />
                <span>Hiển thị đường nét đứt hướng dẫn cắt</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: LIVE A4 PRINT PREVIEW ── */}
        <div className="lg:col-span-7 flex flex-col gap-2 min-w-0 max-w-full overflow-hidden print:w-full print:block">
          {/* Zoom and Preview Toolbar (Hidden in print) */}
          <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-sm flex items-center justify-between gap-2 print:hidden shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Xem trước A4:</span>
              <span className="text-xs text-slate-500 font-mono">
                {activeLabels.length} tem · {totalPages} trang ({currentConfig.name})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-600 w-10 text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(130, z + 10))}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(85)}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 ml-1"
                title="Về mặc định (85%)"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Scaled Preview Canvas Wrapper */}
          <div className="bg-slate-200/60 rounded-2xl p-4 sm:p-6 overflow-x-auto min-h-[500px] flex justify-center border border-slate-300/60 print:bg-transparent print:p-0 print:border-none print:min-h-0 print:overflow-visible">
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className="print:transform-none"
            >
              <AddressLabelSheet
                labels={activeLabels}
                layout={layout}
                showCutLines={showCutLines}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
