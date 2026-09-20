'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Search, Copy, Check, ExternalLink, MapPin, Building2,
  CreditCard, Sparkles, UploadCloud, Loader2, ArrowRight,
  HelpCircle, Phone, Mail, FileText, Compass, Landmark,
  History, RotateCcw, Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

interface QuickToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ToolHistoryItem {
  id: string;
  type: 'POSTAL' | 'TAX_OFFICE' | 'OCR' | 'BANK';
  title: string;
  subtitle: string;
  timestamp: number;
  data: any;
}

const STORAGE_KEY = 'nenkin_quick_tools_state';
const HISTORY_KEY = 'nenkin_quick_tools_history';

// Popular Japanese banks dataset for instant lookup
const POPULAR_JAPAN_BANKS = [
  { code: '9900', name: 'Ngân hàng Bưu điện Nhật Bản (Japan Post Bank / ゆうちょ銀行)', romaji: 'Yucho Bank', swift: 'JPPSJPJ1', note: 'Chi nhánh quy ước theo 3 chữ số giữa số tài khoản (Kigo 記号)' },
  { code: '0005', name: 'Ngân hàng Mitsubishi UFJ (三菱UFJ銀行)', romaji: 'MUFG Bank', swift: 'BOTKJPJT', note: 'Một trong 3 tập đoàn ngân hàng lớn nhất Nhật Bản' },
  { code: '0009', name: 'Ngân hàng Sumitomo Mitsui (三井住友銀行)', romaji: 'SMBC Bank', swift: 'SMBCJPJT', note: 'Ngân hàng thương mại lớn, phổ biến cho tu nghiệp sinh' },
  { code: '0001', name: 'Ngân hàng Mizuho (みずほ銀行)', romaji: 'Mizuho Bank', swift: 'MHCBJPJT', note: 'Một trong 3 tập đoàn ngân hàng lớn nhất Nhật Bản' },
  { code: '0010', name: 'Ngân hàng Resona (りそな銀行)', romaji: 'Resona Bank', swift: 'DIWAJPJT', note: 'Ngân hàng bán lẻ lớn phủ sóng toàn quốc' },
  { code: '0033', name: 'Ngân hàng PayPay (PayPay銀行 - Cũ: Japan Net Bank)', romaji: 'PayPay Bank', swift: 'JNETJPJT', note: 'Ngân hàng số, thường dùng cho thanh toán trực tuyến' },
  { code: '0036', name: 'Ngân hàng Rakuten (楽天銀行)', romaji: 'Rakuten Bank', swift: 'EBATJPJT', note: 'Ngân hàng trực tuyến của tập đoàn Rakuten' },
  { code: '0038', name: 'Ngân hàng SBI Sumishin Net (住信SBIネット銀行)', romaji: 'SBI Shinsei Net Bank', swift: 'SSNBJPJT', note: 'Ngân hàng số phí chuyển tiền thấp' },
  { code: '0310', name: 'Ngân hàng Seven Bank (セブン銀行)', romaji: 'Seven Bank', swift: 'SEVNJPJT', note: 'Thuộc tập đoàn 7-Eleven, rút nộp tiền tại mọi cây ATM 7-Eleven' },
  { code: '0397', name: 'Ngân hàng SBI Shinsei (SBI新生銀行)', romaji: 'SBI Shinsei Bank', swift: 'SHINJPJT', note: 'Hỗ trợ khách hàng quốc tế tốt' },
  { code: '0138', name: 'Ngân hàng Yokohama (横浜銀行)', romaji: 'Bank of Yokohama', swift: 'BOYKJPJT', note: 'Ngân hàng địa phương lớn nhất Nhật Bản (vùng Kanagawa)' },
  { code: '0142', name: 'Ngân hàng Chiba (千葉銀行)', romaji: 'Chiba Bank', swift: 'CHBAJPJT', note: 'Ngân hàng vùng Chiba' },
  { code: '0149', name: 'Ngân hàng Shizuoka (静岡銀行)', romaji: 'Shizuoka Bank', swift: 'SHIZJPJT', note: 'Ngân hàng lớn vùng Shizuoka, Aichi' },
  { code: '0150', name: 'Ngân hàng Juroku (十六銀行)', romaji: 'Juroku Bank', swift: 'JUROJPJT', note: 'Ngân hàng vùng Gifu, Aichi' },
  { code: '0151', name: 'Ngân hàng Ogaki Kyoritsu (大垣共立銀行)', romaji: 'Ogaki Kyoritsu Bank', swift: 'OGAKJPJT', note: 'Ngân hàng vùng Tokai' },
  { code: '0157', name: 'Ngân hàng Shiga (滋賀銀行)', romaji: 'Shiga Bank', swift: 'SHIGJPJT', note: 'Ngân hàng vùng Kansai / Shiga' },
  { code: '0159', name: 'Ngân hàng Nanto (南都銀行)', romaji: 'Nanto Bank', swift: 'NANTJPJT', note: 'Ngân hàng vùng Nara, Osaka' },
  { code: '0161', name: 'Ngân hàng Kiyo (紀陽銀行)', romaji: 'Kiyo Bank', swift: 'KIYOJPJT', note: 'Ngân hàng vùng Wakayama, Osaka' },
  { code: '0162', name: 'Ngân hàng San-in Godo (山陰合同銀行)', romaji: 'San-in Godo Bank', swift: 'GODOJPJT', note: 'Ngân hàng vùng Chugoku' },
  { code: '0168', name: 'Ngân hàng Hiroshima (広島銀行)', romaji: 'Hiroshima Bank', swift: 'HIROJPJT', note: 'Ngân hàng lớn vùng Hiroshima' },
  { code: '0177', name: 'Ngân hàng Iyo (伊予銀行)', romaji: 'Iyo Bank', swift: 'IYOBJPJT', note: 'Ngân hàng lớn vùng Shikoku / Ehime' },
  { code: '0178', name: 'Ngân hàng Hyakujushi (百十四銀行)', romaji: '114th Bank', swift: 'HYAKJPJT', note: 'Ngân hàng vùng Kagawa' },
  { code: '0172', name: 'Ngân hàng Yamaguchi (山口銀行)', romaji: 'Yamaguchi Bank', swift: 'YMGCJPJT', note: 'Ngân hàng vùng Yamaguchi' },
  { code: '0190', name: 'Ngân hàng Fukuoka (福岡銀行)', romaji: 'Bank of Fukuoka', swift: 'FUKUJPJT', note: 'Ngân hàng lớn nhất vùng Kyushu' },
];

export default function QuickToolsDrawer({ isOpen, onClose }: QuickToolsDrawerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'POSTAL' | 'TAX_OFFICE' | 'OCR' | 'BANK'>('POSTAL');

  // ── Tab 1: Postal & Address state ──
  const [zipInput, setZipInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [zipResult, setZipResult] = useState<any | null>(null);
  const [addressResult, setAddressResult] = useState<any | null>(null);
  const [loadingZip, setLoadingZip] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // ── Tab 2: NTA Tax Office state ──
  const [taxZipInput, setTaxZipInput] = useState('');
  const [taxOfficeResult, setTaxOfficeResult] = useState<any | null>(null);
  const [loadingTaxOffice, setLoadingTaxOffice] = useState(false);
  const [savingTaxOffice, setSavingTaxOffice] = useState(false);

  // ── Tab 3: Quick OCR state ──
  const [ocrImageFile, setOcrImageFile] = useState<File | null>(null);
  const [ocrImagePreview, setOcrImagePreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Tab 4: Bank lookup state ──
  const [bankQuery, setBankQuery] = useState('');

  // ── History & Persistence state ──
  const [history, setHistory] = useState<ToolHistoryItem[]>([]);
  const isHydratedRef = useRef(false);

  // Load saved state and history on initial client mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        if (parsed.zipInput !== undefined) setZipInput(parsed.zipInput);
        if (parsed.addressInput !== undefined) setAddressInput(parsed.addressInput);
        if (parsed.zipResult) setZipResult(parsed.zipResult);
        if (parsed.addressResult) setAddressResult(parsed.addressResult);
        if (parsed.taxZipInput !== undefined) setTaxZipInput(parsed.taxZipInput);
        if (parsed.taxOfficeResult) setTaxOfficeResult(parsed.taxOfficeResult);
        if (parsed.ocrResult) setOcrResult(parsed.ocrResult);
        if (parsed.bankQuery !== undefined) setBankQuery(parsed.bankQuery);
      }
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        const parsedHist = JSON.parse(savedHistory);
        if (Array.isArray(parsedHist)) setHistory(parsedHist);
      }
    } catch (e) {
      console.error('Failed to load QuickTools state:', e);
    } finally {
      isHydratedRef.current = true;
    }
  }, []);

  // Save current active state to localStorage whenever inputs or results change
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      const stateToSave = {
        activeTab,
        zipInput,
        addressInput,
        zipResult,
        addressResult,
        taxZipInput,
        taxOfficeResult,
        ocrResult,
        bankQuery,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {}
  }, [activeTab, zipInput, addressInput, zipResult, addressResult, taxZipInput, taxOfficeResult, ocrResult, bankQuery]);

  // Helper to add item to history
  const addHistoryItem = (item: Omit<ToolHistoryItem, 'id' | 'timestamp'>) => {
    setHistory(prev => {
      const filtered = prev.filter(h => !(h.type === item.type && h.title === item.title));
      const newItem: ToolHistoryItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      const updated = [newItem, ...filtered].slice(0, 15);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Helper to clear history
  const clearHistory = (type?: 'POSTAL' | 'TAX_OFFICE' | 'OCR' | 'BANK') => {
    setHistory(prev => {
      const updated = type ? prev.filter(h => h.type !== type) : [];
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {}
      toast.success(type ? 'Đã xóa lịch sử mục này' : 'Đã xóa toàn bộ lịch sử tra cứu');
      return updated;
    });
  };

  // Apply history item
  const handleApplyHistory = (item: ToolHistoryItem) => {
    if (item.type === 'POSTAL') {
      if (item.data.zipInput !== undefined) setZipInput(item.data.zipInput);
      if (item.data.zipResult !== undefined) setZipResult(item.data.zipResult);
      if (item.data.addressInput !== undefined) setAddressInput(item.data.addressInput);
      if (item.data.addressResult !== undefined) setAddressResult(item.data.addressResult);
      toast.info(`Đã nạp lại: ${item.title}`);
    } else if (item.type === 'TAX_OFFICE') {
      if (item.data.taxZipInput !== undefined) setTaxZipInput(item.data.taxZipInput);
      if (item.data.taxOfficeResult !== undefined) setTaxOfficeResult(item.data.taxOfficeResult);
      toast.info(`Đã nạp lại: ${item.title}`);
    } else if (item.type === 'OCR') {
      if (item.data.ocrResult !== undefined) setOcrResult(item.data.ocrResult);
      toast.info(`Đã nạp lại: ${item.title}`);
    } else if (item.type === 'BANK') {
      if (item.data.bankQuery !== undefined) setBankQuery(item.data.bankQuery);
      toast.info(`Đã tìm theo: ${item.title}`);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, label: string = 'Nội dung') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`);
  };

  // ── Handler: Lookup address from zip ──
  const handleLookupZip = async (codeToLookup?: string) => {
    const raw = codeToLookup || zipInput;
    const clean = raw.replace(/[-\s]/g, '');
    if (!clean || clean.length !== 7) {
      toast.error('Mã bưu điện phải gồm đúng 7 chữ số (VD: 5928335 hoặc 592-8335)');
      return;
    }

    setLoadingZip(true);
    setZipResult(null);
    try {
      const res = await fetch(`/api/tools/postal-lookup?zip=${clean}`);
      const data = await res.json();
      if (data.success && data.data) {
        setZipResult(data.data);
        toast.success(`Tìm thấy địa chỉ: ${data.data.fullAddress}`);
        addHistoryItem({
          type: 'POSTAL',
          title: `〒 ${data.data.postalCode}`,
          subtitle: data.data.fullAddress,
          data: { zipInput: data.data.postalCode, zipResult: data.data },
        });
      } else {
        toast.error(data.error || 'Không tìm thấy địa chỉ cho mã bưu điện này');
      }
    } catch (e: any) {
      toast.error('Lỗi kết nối: ' + e.message);
    } finally {
      setLoadingZip(false);
    }
  };

  // ── Handler: Lookup zip from address ──
  const handleLookupAddress = async () => {
    if (!addressInput.trim()) {
      toast.error('Vui lòng nhập địa chỉ tiếng Nhật');
      return;
    }

    setLoadingAddress(true);
    setAddressResult(null);
    try {
      const res = await fetch(`/api/tools/postal-lookup?address=${encodeURIComponent(addressInput.trim())}`);
      const data = await res.json();
      if (data.success && data.data) {
        setAddressResult(data.data);
        toast.success(`Mã bưu điện: 〒${data.data.postalCode}`);
        addHistoryItem({
          type: 'POSTAL',
          title: `〒 ${data.data.postalCode}`,
          subtitle: data.data.fullAddress,
          data: { addressInput: addressInput.trim(), addressResult: data.data },
        });
      } else {
        toast.error(data.error || 'Không tìm thấy mã bưu điện cho địa chỉ này');
      }
    } catch (e: any) {
      toast.error('Lỗi kết nối: ' + e.message);
    } finally {
      setLoadingAddress(false);
    }
  };

  // ── Handler: Lookup NTA Tax Office ──
  const handleLookupTaxOffice = async (codeToLookup?: string) => {
    const raw = codeToLookup || taxZipInput;
    const clean = raw.replace(/[-\s]/g, '');
    if (!clean || clean.length !== 7) {
      toast.error('Vui lòng nhập đúng 7 số mã bưu điện');
      return;
    }

    setLoadingTaxOffice(true);
    setTaxOfficeResult(null);
    try {
      const res = await fetch(`/api/tax-offices/nta-lookup?zip=${clean}`);
      const data = await res.json();
      if (data.success && data.data) {
        setTaxOfficeResult(data.data);
        toast.success(`Đã tìm thấy: ${data.data.name}`);
        addHistoryItem({
          type: 'TAX_OFFICE',
          title: data.data.name,
          subtitle: data.data.address || `Mã bưu điện: ${clean}`,
          data: { taxZipInput: clean, taxOfficeResult: data.data },
        });
      } else {
        toast.error(data.error || 'Không tìm thấy cục thuế');
      }
    } catch (e: any) {
      toast.error('Lỗi tra cứu Cục thuế: ' + e.message);
    } finally {
      setLoadingTaxOffice(false);
    }
  };

  // ── Handler: Save NTA Tax Office to internal database ──
  const handleSaveTaxOfficeToDb = async () => {
    if (!taxOfficeResult) return;
    setSavingTaxOffice(true);
    try {
      const res = await fetch('/api/tax-offices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxOfficeResult),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã lưu ${taxOfficeResult.name} vào danh mục Cục thuế hệ thống!`);
      } else {
        toast.error('Không thể lưu: ' + (data.error || 'Thất bại'));
      }
    } catch (e: any) {
      toast.error('Lỗi lưu Cục thuế: ' + e.message);
    } finally {
      setSavingTaxOffice(false);
    }
  };

  // ── Handler: Clipboard Paste image in Tab OCR ──
  const handlePasteImage = (e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        setOcrImageFile(file);
        setOcrImagePreview(URL.createObjectURL(file));
        toast.info('Đã nhận ảnh thẻ ngoại kiều từ Clipboard!');
      }
    }
  };

  const handleSelectOcrFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOcrImageFile(file);
      setOcrImagePreview(URL.createObjectURL(file));
    }
  };

  // ── Handler: Execute Quick OCR ──
  const handleExecuteOcr = async () => {
    if (!ocrImageFile) {
      toast.error('Vui lòng chọn hoặc dán ảnh thẻ ngoại kiều');
      return;
    }

    setOcrLoading(true);
    setOcrResult(null);
    const loadId = toast.loading('AI đang phân tích và trích xuất thẻ ngoại kiều...');

    try {
      const fd = new FormData();
      fd.append('imageUrl', ''); // placeholder
      fd.append('documentType', 'zairyuCard');
      fd.append('action', 'extract');
      fd.append('file', ocrImageFile);

      // Upload file directly or via OCR API
      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.extractedData) {
        setOcrResult(data.extractedData);
        toast.success('Trích xuất thành công!', { id: loadId });
        addHistoryItem({
          type: 'OCR',
          title: data.extractedData.name || 'Thẻ ngoại kiều',
          subtitle: `Số thẻ: ${data.extractedData.cardCode || '---'} • Hạn: ${data.extractedData.periodDate || '---'}`,
          data: { ocrResult: data.extractedData },
        });
      } else {
        throw new Error(data.error || 'AI không nhận diện được thông tin trên ảnh');
      }
    } catch (e: any) {
      toast.error('Lỗi trích xuất: ' + e.message, { id: loadId });
    } finally {
      setOcrLoading(false);
    }
  };

  // Filtered banks
  const filteredBanks = POPULAR_JAPAN_BANKS.filter(b => {
    if (!bankQuery.trim()) return true;
    const q = bankQuery.toLowerCase();
    return (
      b.code.includes(q) ||
      b.name.toLowerCase().includes(q) ||
      b.romaji.toLowerCase().includes(q) ||
      b.swift.toLowerCase().includes(q)
    );
  });

  const tabHistory = history.filter(h => h.type === activeTab);

  return (
    <div
      className={`fixed inset-0 z-[125] flex justify-end font-sans transition-all duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Slide-over Drawer (Width max-w-xl / 576px, compact high-density) */}
      <div
        onPaste={activeTab === 'OCR' ? handlePasteImage : undefined}
        className={`relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 border-l border-slate-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        
        {/* Drawer Header */}
        <div className="p-3.5 bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                Tiện Ích Tra Cứu Nhanh
              </h2>
              <p className="text-[10px] text-teal-100">Tra cứu địa chỉ, cục thuế và kiểm tra dữ liệu độc lập</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-white/15 text-[10px] font-mono text-teal-100 border border-white/20">
              Alt + T
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-colors"
              title="Đóng tiện ích"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Buttons - 4 columns grid, fits 100% on all screens */}
        <div className="p-1.5 bg-slate-100/90 border-b border-slate-200 grid grid-cols-4 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('POSTAL')}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center truncate ${
              activeTab === 'POSTAL'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            title="Tra cứu Mã Bưu Điện & Địa chỉ Nhật Bản"
          >
            <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">Địa Chỉ (〒)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TAX_OFFICE')}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center truncate ${
              activeTab === 'TAX_OFFICE'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            title="Tra cứu Cục Thuế quản lý (NTA)"
          >
            <Building2 className="w-3.5 h-3.5 shrink-0 text-blue-600" />
            <span className="truncate">Cục Thuế</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('OCR')}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center truncate ${
              activeTab === 'OCR'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            title="Trích xuất tự động Thẻ Ngoại Kiều (Zairyu Card)"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span className="truncate">Ngoại Kiều</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BANK')}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center truncate ${
              activeTab === 'BANK'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            title="Tra cứu Mã Ngân Hàng Nhật Bản (Ginkō Code / SWIFT)"
          >
            <Landmark className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
            <span className="truncate">Ngân Hàng</span>
          </button>
        </div>

        {/* Tab Contents Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0 text-xs">
          
          {/* Recent History Bar if available for activeTab */}
          {tabHistory.length > 0 && (
            <div className="p-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-1.5 shadow-2xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-0.5">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <History className="w-3.5 h-3.5 text-teal-600" />
                  <span>Vừa tra cứu gần đây ({tabHistory.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => clearHistory(activeTab)}
                  className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors font-medium flex items-center gap-0.5"
                  title="Xóa lịch sử mục này"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {tabHistory.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleApplyHistory(item)}
                    className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/60 text-[11px] text-slate-700 font-medium transition-all shrink-0 text-left flex items-center gap-1.5 shadow-2xs group"
                    title={`${item.title} - ${item.subtitle}`}
                  >
                    <span className="font-bold text-teal-800 group-hover:text-teal-900">{item.title}</span>
                    <span className="text-[10px] text-slate-400 max-w-[130px] truncate group-hover:text-slate-600">{item.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* ════════ TAB 1: POSTAL CODE & ADDRESS ════════ */}
          {activeTab === 'POSTAL' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Card 1: Mã bưu điện -> Địa chỉ */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-800">Tra cứu Địa Chỉ từ Mã Bưu Điện (〒)</h3>
                    <p className="text-[10px] text-slate-400">Nhập 7 chữ số (ví dụ: 5928335 hoặc 592-8335)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={zipInput}
                    onChange={e => setZipInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLookupZip()}
                    placeholder="VD: 5928335"
                    className="h-9 text-xs bg-white border-slate-300 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleLookupZip()}
                    disabled={loadingZip}
                    className="h-9 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
                  >
                    {loadingZip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Tra Cứu</span>
                  </button>
                </div>

                {/* Zip Result Box */}
                {zipResult && (
                  <div className="bg-white p-3 rounded-xl border border-teal-200 text-slate-800 space-y-2 animate-in slide-in-from-top-1">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-mono font-bold text-teal-700 text-xs">〒{zipResult.postalCode}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => { setZipResult(null); setZipInput(''); }}
                          className="px-2 py-0.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-[10px] font-medium transition-colors"
                          title="Xóa kết quả này"
                        >
                          Xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(zipResult.fullAddress, 'Địa chỉ')}
                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Địa chỉ tiếng Nhật:</span>
                      <p className="font-bold text-xs text-slate-800 mt-0.5 select-all">{zipResult.fullAddress}</p>
                    </div>

                    {zipResult.kana && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Phiên âm Kana:</span>
                        <p className="text-[11px] text-slate-600 font-mono select-all">{zipResult.kana}</p>
                      </div>
                    )}

                    <div className="pt-1.5 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setTaxZipInput(zipResult.cleanPostalCode);
                          setActiveTab('TAX_OFFICE');
                          handleLookupTaxOffice(zipResult.cleanPostalCode);
                        }}
                        className="text-[11px] font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 transition-colors"
                      >
                        <span>Tra Cục Thuế quản lý địa chỉ này</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Địa chỉ tiếng Nhật -> Mã bưu điện */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-800">Tra cứu Mã Bưu Điện từ Địa Chỉ</h3>
                    <p className="text-[10px] text-slate-400">Nhập địa chỉ tiếng Nhật (Kanji)</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Input
                    type="text"
                    value={addressInput}
                    onChange={e => setAddressInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLookupAddress()}
                    placeholder="VD: 大阪府高石市西取石..."
                    className="h-9 text-xs bg-white border-slate-300"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleLookupAddress}
                      disabled={loadingAddress}
                      className="h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      {loadingAddress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Tìm Mã Bưu Điện</span>
                    </button>
                  </div>
                </div>

                {/* Address Result Box */}
                {addressResult && (
                  <div className="bg-white p-3 rounded-xl border border-indigo-200 text-slate-800 space-y-2 animate-in slide-in-from-top-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Mã bưu điện tìm thấy:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => { setAddressResult(null); setAddressInput(''); }}
                          className="px-2 py-0.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-[10px] font-medium transition-colors"
                          title="Xóa kết quả này"
                        >
                          Xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(addressResult.postalCode, 'Mã bưu điện')}
                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </button>
                      </div>
                    </div>

                    <p className="font-mono font-bold text-base text-indigo-700 select-all">
                      〒{addressResult.postalCode}
                    </p>

                    <div className="pt-1.5 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setTaxZipInput(addressResult.cleanPostalCode);
                          setActiveTab('TAX_OFFICE');
                          handleLookupTaxOffice(addressResult.cleanPostalCode);
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                      >
                        <span>Tra Cục Thuế quản lý mã này</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ════════ TAB 2: NTA TAX OFFICE LOOKUP ════════ */}
          {activeTab === 'TAX_OFFICE' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-slate-800">Tra cứu Cục Thuế Quản Lý (NTA Nhật Bản)</h3>
                    <p className="text-[10px] text-slate-400">Dựa theo mã bưu điện nơi cư trú của khách hàng</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                    Cào trực tiếp NTA
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={taxZipInput}
                    onChange={e => setTaxZipInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLookupTaxOffice()}
                    placeholder="VD: 5928335"
                    className="h-9 text-xs bg-white border-slate-300 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleLookupTaxOffice()}
                    disabled={loadingTaxOffice}
                    className="h-9 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
                  >
                    {loadingTaxOffice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Tra Cứu</span>
                  </button>
                </div>
              </div>

              {/* Tax Office Result Details */}
              {taxOfficeResult && (
                <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-sm space-y-3 animate-in slide-in-from-top-1 text-xs">
                  
                  {/* Title & Badge */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="font-bold text-sm text-teal-900 select-all">{taxOfficeResult.name}</h4>
                      {taxOfficeResult.romajiName && (
                        <p className="text-[11px] text-slate-400 font-mono">{taxOfficeResult.romajiName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setTaxOfficeResult(null); setTaxZipInput(''); }}
                        className="px-2 py-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 font-semibold text-[10px] transition-colors"
                        title="Xóa kết quả này"
                      >
                        Xóa
                      </button>
                      {taxOfficeResult.ntaPageUrl && (
                        <a
                          href={taxOfficeResult.ntaPageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-[10px] flex items-center gap-1 transition-colors"
                        >
                          <span>Trang NTA</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Mail Destination (Quan trọng nhất để gửi hồ sơ) */}
                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-amber-900 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-amber-600" />
                        Nơi gửi hồ sơ bưu điện (申告書等の郵送先)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const fullMail = `〒${taxOfficeResult.mailingPostalCode}\n${taxOfficeResult.mailingAddress}\n${taxOfficeResult.mailingName} 御中`;
                          copyToClipboard(fullMail, 'Địa chỉ gửi thư');
                        }}
                        className="px-2 py-0.5 rounded bg-amber-200/70 hover:bg-amber-300 text-amber-900 font-bold text-[10px] flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Sao chép bì thư</span>
                      </button>
                    </div>
                    <p className="font-mono text-xs text-amber-950 font-bold">〒{taxOfficeResult.mailingPostalCode}</p>
                    <p className="text-xs text-slate-800 font-medium select-all">{taxOfficeResult.mailingAddress}</p>
                    <p className="text-xs text-slate-900 font-bold select-all">{taxOfficeResult.mailingName} 御中</p>
                  </div>

                  {/* Office Headquarters Address */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trụ sở Cục thuế:</span>
                    <p className="text-xs text-slate-800 select-all">
                      〒{taxOfficeResult.postalCode} {taxOfficeResult.address}
                    </p>
                  </div>

                  {/* Phone numbers */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Điện thoại tổng đài:</span>
                      <p className="font-mono font-bold text-slate-800 mt-0.5 select-all">
                        {taxOfficeResult.phone || taxOfficeResult.generalPhone || 'Chưa có'}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Tư vấn thuế:</span>
                      <p className="font-mono font-bold text-slate-800 mt-0.5 select-all">
                        {taxOfficeResult.consultationPhone || 'Bấm nhánh theo hướng dẫn'}
                      </p>
                    </div>
                  </div>

                  {/* Jurisdiction */}
                  {taxOfficeResult.jurisdiction && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Khu vực quản lý (管轄区域):</span>
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 leading-relaxed select-all">
                        {taxOfficeResult.jurisdiction}
                      </p>
                    </div>
                  )}

                  {/* Actions: Save to internal DB */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Lưu vào hệ thống để dùng cho in ấn & hồ sơ</span>
                    <button
                      type="button"
                      onClick={handleSaveTaxOfficeToDb}
                      disabled={savingTaxOffice}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      {savingTaxOffice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Lưu vào Danh mục</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ════════ TAB 3: QUICK OCR TESTER & VALIDATOR ════════ */}
          {activeTab === 'OCR' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-slate-800">Thẩm Định & Trích Xuất Thẻ Ngoại Kiều</h3>
                    <p className="text-[10px] text-slate-400">Kéo thả ảnh hoặc dán trực tiếp từ Clipboard (Ctrl + V)</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[9px] font-bold">
                    Gemini AI Vision
                  </span>
                </div>

                {/* Dropzone & Preview Box */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleSelectOcrFile}
                  className="hidden"
                />

                {ocrImagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-black/5 aspect-16/9 flex items-center justify-center group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ocrImagePreview} alt="Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-xs font-bold transition-colors"
                      >
                        Đổi ảnh
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOcrImageFile(null);
                          setOcrImagePreview(null);
                          setOcrResult(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-500 bg-white hover:bg-teal-50/20 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2 group"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 group-hover:bg-teal-100 text-teal-600 flex items-center justify-center transition-colors">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-700 group-hover:text-teal-700">
                        Bấm để chọn ảnh thẻ hoặc dán phím tắt Ctrl + V
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Hỗ trợ JPG, PNG, WEBP (Mặt trước thẻ ngoại kiều)</p>
                    </div>
                  </div>
                )}

                {/* Submit OCR Button */}
                {ocrImageFile && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleExecuteOcr}
                      disabled={ocrLoading}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      {ocrLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Bắt Đầu Trích Xuất AI</span>
                    </button>
                  </div>
                )}
              </div>

              {/* OCR Result Box */}
              {ocrResult && (
                <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-sm space-y-3 animate-in slide-in-from-top-1 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Kết Quả Nhận Diện AI
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setOcrResult(null);
                          setOcrImageFile(null);
                          setOcrImagePreview(null);
                        }}
                        className="px-2 py-0.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 font-bold text-[10px] transition-colors"
                        title="Xóa kết quả này"
                      >
                        Xóa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const fullText = `Họ tên: ${ocrResult.fullName || ''}\nSố thẻ: ${ocrResult.zairyuNumber || ''}\nNgày sinh: ${ocrResult.dob || ''}\nQuốc tịch: ${ocrResult.nationality || ''}\nĐịa chỉ: ${ocrResult.address || ''}\nHạn thẻ: ${ocrResult.periodOfStay || ''}`;
                          copyToClipboard(fullText, 'Toàn bộ thông tin');
                        }}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Sao chép tất cả</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Họ và tên:</span>
                      <p className="font-bold text-slate-900 select-all">{ocrResult.fullName || '---'}</p>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Số thẻ ngoại kiều:</span>
                      <p className="font-mono font-bold text-purple-700 select-all">{ocrResult.zairyuNumber || '---'}</p>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Ngày sinh:</span>
                      <p className="font-semibold text-slate-800 select-all">{ocrResult.dob || '---'}</p>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Quốc tịch / Giới tính:</span>
                      <p className="font-semibold text-slate-800 select-all">
                        {ocrResult.nationality || 'VIETNAM'} {ocrResult.gender ? `(${ocrResult.gender})` : ''}
                      </p>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                      <span className="text-[10px] text-slate-400 block">Thời hạn lưu trú / Visa:</span>
                      <p className="font-semibold text-slate-800 select-all">
                        {ocrResult.periodOfStay || ocrResult.residenceStatus || '---'}
                      </p>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                      <span className="text-[10px] text-slate-400 block">Địa chỉ trên thẻ:</span>
                      <p className="font-semibold text-slate-800 leading-relaxed select-all">
                        {ocrResult.address || '---'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {ocrResult.address && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddressInput(ocrResult.address);
                          setActiveTab('POSTAL');
                          handleLookupAddress();
                        }}
                        className="text-[11px] font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1"
                      >
                        <span>Tra mã bưu điện địa chỉ này</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push('/applications/new');
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <span>Tạo hồ sơ mới</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ════════ TAB 4: BANK LOOKUP (ZENGIN CODE) ════════ */}
          {activeTab === 'BANK' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-slate-800">Danh Mục & Mã Ngân Hàng Nhật Bản (Zengin Code)</h3>
                  <span className="text-[10px] text-slate-400">{filteredBanks.length} ngân hàng</span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    value={bankQuery}
                    onChange={e => setBankQuery(e.target.value)}
                    placeholder="Tìm theo tên ngân hàng, mã 4 số hoặc Romaji..."
                    className="h-8.5 pl-8 text-xs bg-white border-slate-300"
                  />
                  {bankQuery && (
                    <button
                      type="button"
                      onClick={() => setBankQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bank List */}
              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-0.5">
                {filteredBanks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic">
                    Không tìm thấy ngân hàng khớp với từ khóa
                  </div>
                ) : (
                  filteredBanks.map(b => (
                    <div
                      key={b.code}
                      className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 transition-colors space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 font-mono font-bold text-xs border border-teal-200 shrink-0">
                            #{b.code}
                          </span>
                          <span className="font-bold text-xs text-slate-800 truncate">{b.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            copyToClipboard(b.code, `Mã ngân hàng ${b.romaji}`);
                            addHistoryItem({
                              type: 'BANK',
                              title: `${b.romaji} (${b.code})`,
                              subtitle: `SWIFT: ${b.swift} • ${b.name.split(' (')[0]}`,
                              data: { bankQuery: b.code },
                            });
                          }}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-1 shrink-0"
                          title="Sao chép mã 4 số"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Mã</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span>Tên quốc tế: <strong className="text-slate-700">{b.romaji}</strong></span>
                        <span className="font-mono text-[10px]">SWIFT: <strong>{b.swift}</strong></span>
                      </div>

                      {b.note && (
                        <p className="text-[10px] text-slate-400 bg-slate-50 p-1.5 rounded-lg border border-slate-100 leading-tight">
                          💡 {b.note}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between text-[11px] text-slate-500">
          <span>Công cụ tra cứu độc lập cho nhân viên</span>
          <span className="font-mono text-[10px] text-slate-400">VietNenkin Tools v1.0</span>
        </div>

      </div>
    </div>
  );
}
