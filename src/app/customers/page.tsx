/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, UploadCloud, CheckCircle, Map, Loader2, Eye, Save, X, User, MapPin, SearchCode, Building2, Search, ExternalLink, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Portal from '@/components/Portal';

export interface Customer {
  id?: string;
  code?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  addressVN?: string;
  romajiAddress?: string;
  dob?: string;
  cardNumber?: string;
  postalCode?: string;
  zairyuFrontUrl?: string;
  zairyuBackUrl?: string;
  passportUrl?: string;
  departureStampUrl?: string;
  nenkinBookUrl?: string;
  bankPassbookUrl?: string;
  taxOffice?: {
    name?: string;
    romajiName?: string;
    address?: string;
    romajiAddress?: string;
    postalCode?: string;
    phone?: string;
    websiteUrl?: string;
    mapUrl?: string;
  };
  status?: string;
  overseasAddress?: string;
  overseasCountry?: string;
  myNumber?: string;
  occupation?: string;
  headOfHouseholdName?: string;
  relationshipToHead?: string;
  departureDate?: string;
  nationality?: string;
  sex?: string;
  hasPermanentResidence?: boolean;
  permanentResidenceDate?: string;
  lastName?: string;
  firstName?: string;
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  placeOfBirth?: string;
  nenkinNumber?: string;
  fullNameFurigana?: string;
  bankName?: string;
  branchName?: string;
  swiftCode?: string;
  accountNumber?: string;
  accountName?: string;
  bankBranchAddress?: string;
  bankCountry?: string;
  bankInstitutionCode?: string;
  branchCode?: string;
  bankAccountType?: string;
  pensionSystemRegistrationNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  applicationId?: string;
  [key: string]: unknown;
}

interface VerifiedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  isVerificationMode: boolean;
  isVerified: boolean;
  onToggleVerify: () => void;
  rightElement?: React.ReactNode;
  hasError?: boolean;
}

// === Components ===

const VerifiedInput = ({ label, value, onChange, isVerificationMode, isVerified, onToggleVerify, disabled, rightElement, hasError, ...props }: VerifiedInputProps) => {
  return (
    <div className={`space-y-1 transition-all ${
      hasError ? 'p-2 -mx-2 bg-red-50 rounded-lg border border-red-200 ring-1 ring-red-500/50' : 
      isVerificationMode && !isVerified ? 'p-2 -mx-2 bg-amber-50/50 rounded-lg border border-amber-100' : ''
    }`}>
      <label className={`text-xs font-semibold flex justify-between items-center ${hasError ? 'text-red-600' : 'text-slate-600'}`}>
        <span>{label} {hasError && <span className="text-red-500 ml-1 text-[10px] uppercase font-bold">(Chưa xác nhận)</span>}</span>
      </label>
      <div className="flex gap-2 items-center">
        <Input 
          value={value} 
          onChange={onChange} 
          disabled={disabled}
          readOnly={isVerificationMode && isVerified}
          className={`h-9 text-sm flex-1 transition-colors disabled:opacity-100 ${
            hasError ? 'border-red-300 bg-white focus-visible:ring-red-500 text-slate-900' :
            isVerificationMode && isVerified ? 'bg-slate-50 border-slate-200 text-black font-semibold shadow-inner focus-visible:ring-0 cursor-default' : 
            'bg-white text-slate-900'
          }`}
          {...props} 
        />
        {rightElement}
        {isVerificationMode && (
          <Button 
            type="button"
            variant={isVerified ? "default" : "outline"}
            size="sm"
            className={`h-9 px-3 shrink-0 ${
              hasError && !isVerified ? 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200' :
              isVerified ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent' : 
              'border-amber-200 text-amber-600 hover:bg-amber-100'
            }`}
            onClick={onToggleVerify}
            title={isVerified ? "Bỏ khóa để sửa" : "Xác nhận đúng"}
          >
            {isVerified ? <CheckCircle className="w-4 h-4" /> : 'Xác nhận'}
          </Button>
        )}
      </div>
    </div>
  );
};

const ImageZoomModal = ({ url, onClose }: { url: string | null, onClose: () => void }) => {
  if (!url) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 sm:p-8 cursor-zoom-out transition-opacity duration-300" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black p-2 rounded-full z-50 transition-colors">
        <X className="w-6 h-6" />
      </button>
      <img src={url} alt="Zoomed" className="max-w-full max-h-full object-contain cursor-default shadow-2xl rounded" onClick={(e: React.MouseEvent) => e.stopPropagation()} />
    </div>
  );
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null); // null = List view
  const [activeTab, setActiveTab] = useState('zairyu'); // 'basic', 'zairyu', 'passport', 'nenkin', 'bank'
  
  // Workspace States
  const [isVerificationMode, setIsVerificationMode] = useState(true);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
  // Verification states
  const [verifiedFields, setVerifiedFields] = useState<Record<string, boolean>>({});

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
        
        // Auto open workspace if profileId in URL
        const params = new URLSearchParams(window.location.search);
        const profileId = params.get('profileId');
        if (profileId) {
          const matched = data.data.find((c: Customer) => c.id === profileId || c.code === profileId);
          if (matched) {
             // We need to defer state update to avoid conflicts with initial render
             setTimeout(() => {
               setActiveCustomer(matched);
               setVerifiedFields({
                 fullName: true, dob: true, cardNumber: true, address: true, postalCode: true, taxOfficeName: true, taxOfficeAddress: true,
                 romajiAddress: true, taxOfficeRomajiName: true, taxOfficeRomajiAddress: true
               });
               setActiveTab('zairyu');
               setShowValidationErrors(false);
             }, 100);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomers();
  }, []);

  const handleOpenWorkspace = (customer: Customer | null = null) => {
    if (customer) {
      window.location.href = `/customers/${customer.id}`;
    } else {
      // For creating a new customer, we could route to /customers/new or open a small modal
      window.location.href = `/customers/new`;
    }
  };

  const handleCloseWorkspace = () => {
    window.history.pushState({}, '', `/customers`);
    setActiveCustomer(null);
  };

  const toggleVerify = (field: string) => {
    setVerifiedFields(prev => ({ ...prev, [field]: !prev[field] }));
    setShowValidationErrors(false); // Reset errors on toggle
  };

  const handleFieldChange = (field: keyof Customer, value: string | boolean) => {
    setActiveCustomer((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const handleTaxOfficeChange = (field: string, value: string) => {
    setActiveCustomer((prev) => prev ? { ...prev, taxOffice: { ...prev.taxOffice, [field]: value } } : prev);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrStatus('processing');
    const objectUrl = URL.createObjectURL(file);
    const urlField = `${type}Url` as keyof Customer;
    setActiveCustomer((prev) => prev ? { ...prev, [urlField]: objectUrl } : prev);

    const form = new FormData();
    form.append('file', file);
    form.append('documentType', type);
    form.append('action', 'upload');

    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        setActiveCustomer((prev) => prev ? {
          ...prev,
          [urlField]: data.publicUrl
        } : prev);
        setOcrStatus('done');
        // Auto extract data after successful upload (Wizard style)
        handleExtractOcr(type, data.publicUrl);
      } else {
        alert('Lỗi upload: ' + data.error);
        setOcrStatus('error');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi upload.');
      setOcrStatus('error');
    }
  };

  const handleExtractOcr = async (type: string, imageUrl: string) => {
    if (!imageUrl || imageUrl.startsWith('blob:')) {
      alert("Vui lòng chờ tải ảnh lên hoàn tất trước khi trích xuất.");
      return;
    }
    setOcrStatus('processing');
    const form = new FormData();
    form.append('action', 'extract');
    form.append('documentType', type);
    form.append('imageUrl', imageUrl);

    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: form });
      const data = await res.json();
      
      if (data.success && data.extractedData) {
        // Check if AI detected wrong document type
        if (data.extractedData.error) {
          alert('⚠️ ' + data.extractedData.error);
          setOcrStatus('error');
          return;
        }
        
        setActiveCustomer((prev) => prev ? {
          ...prev,
          ...(type === 'zairyuFront' && {
            fullName: data.extractedData.fullName || prev.fullName,
            nationality: data.extractedData.nationality || prev.nationality,
            dob: data.extractedData.dob || prev.dob,
            sex: data.extractedData.sex || prev.sex,
            cardNumber: data.extractedData.cardNumber || prev.cardNumber,
            address: data.extractedData.address || prev.address,
            romajiAddress: data.extractedData.romajiAddress || prev.romajiAddress,
            postalCode: data.extractedData.postalCode || prev.postalCode,
            hasPermanentResidence: data.extractedData.hasPermanentResidence ?? prev.hasPermanentResidence,
            permanentResidenceDate: data.extractedData.permanentResidenceDate || prev.permanentResidenceDate,
            taxOffice: {
              ...(prev.taxOffice || {}),
              ...(data.extractedData.taxOffice || {})
            }
          }),
          ...(type === 'zairyuBack' && data.extractedData.address && {
            address: data.extractedData.address,
            romajiAddress: data.extractedData.romajiAddress || prev.romajiAddress,
            postalCode: data.extractedData.postalCode || prev.postalCode,
            taxOffice: {
              ...(prev.taxOffice || {}),
              ...(data.extractedData.taxOffice || {})
            }
          }),
          ...(type === 'passport' && {
            lastName: data.extractedData.lastName || prev.lastName,
            firstName: data.extractedData.firstName || prev.firstName,
            nationality: data.extractedData.nationality || prev.nationality,
            dob: data.extractedData.dob || prev.dob,
            sex: data.extractedData.sex || prev.sex,
            passportNumber: data.extractedData.passportNumber || prev.passportNumber,
            passportIssueDate: data.extractedData.passportIssueDate || prev.passportIssueDate,
            passportExpiryDate: data.extractedData.passportExpiryDate || prev.passportExpiryDate,
            placeOfBirth: data.extractedData.placeOfBirth || prev.placeOfBirth
          }),
          ...(type === 'nenkin' && {
            nenkinNumber: data.extractedData.nenkinNumber || prev.nenkinNumber,
            fullName: prev.fullName || data.extractedData.fullNameKanji,
            fullNameFurigana: data.extractedData.fullNameFurigana || prev.fullNameFurigana,
            dob: data.extractedData.dob || prev.dob
          }),
          ...(type === 'bank' && {
            bankName: data.extractedData.bankName || prev.bankName,
            branchName: data.extractedData.branchName || prev.branchName,
            accountNumber: data.extractedData.accountNumber || prev.accountNumber,
            accountName: data.extractedData.accountName || prev.accountName,
            swiftCode: data.extractedData.swiftCode || prev.swiftCode,
            bankBranchAddress: data.extractedData.bankBranchAddress || prev.bankBranchAddress,
            bankCountry: data.extractedData.bankCountry || prev.bankCountry
          }),
          ...(type === 'noticeOfPayment' && {
            totalExpectedJpy: data.extractedData.totalExpectedJpy || prev.totalExpectedJpy,
            received1stJpy: data.extractedData.received1stJpy || prev.received1stJpy,
            tax2ndJpy: data.extractedData.tax2ndJpy || prev.tax2ndJpy
          })
        } : prev);
        setOcrStatus('done');
        if (type === 'zairyuFront' || type === 'zairyuBack') {
          setVerifiedFields(prev => ({ 
            ...prev, fullName: false, dob: false, cardNumber: false, address: false, postalCode: false, taxOfficeName: false, taxOfficeAddress: false,
            romajiAddress: false, taxOfficeRomajiName: false, taxOfficeRomajiAddress: false
          }));
        } else if (type === 'passport') {
          setVerifiedFields(prev => ({ 
            ...prev, lastName: false, firstName: false, nationality: false, passportDob: false, passportSex: false, passportNumber: false, passportIssueDate: false, passportExpiryDate: false, placeOfBirth: false
          }));
        } else if (type === 'nenkin') {
          setVerifiedFields(prev => ({ 
            ...prev, nenkinNumber: false, fullName: false, fullNameFurigana: false, nenkinDob: false
          }));
        } else if (type === 'bank') {
          setVerifiedFields(prev => ({ 
            ...prev, bankName: false, branchName: false, accountNumber: false, accountName: false, swiftCode: false, bankBranchAddress: false, bankCountry: false
          }));
        } else if (type === 'noticeOfPayment') {
          setVerifiedFields(prev => ({
            ...prev, noticeDate: false, totalExpectedJpy: false, tax2ndJpy: false, received1stJpy: false
          }));
        }
      } else {
        alert('⚠️ ' + (data.error || 'Dữ liệu không hợp lệ'));
        setOcrStatus('error');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi kết nối AI.');
      setOcrStatus('error');
    }
  };

  const handleExtractAll = async () => {
    if (!activeCustomer) return;
    if (activeTab === 'zairyu') {
      if (activeCustomer.zairyuFrontUrl) {
        await handleExtractOcr('zairyuFront', activeCustomer.zairyuFrontUrl);
      }
      if (activeCustomer.zairyuBackUrl) {
        await handleExtractOcr('zairyuBack', activeCustomer.zairyuBackUrl);
      }
    } else if (['passport', 'nenkin', 'bank'].includes(activeTab)) {
      const typeMap: Record<string, string> = {
        'passport': 'passport',
        'nenkin': 'nenkin',
        'bank': 'bank'
      };
      const urlMap: Record<string, keyof Customer> = {
        'passport': 'passportUrl',
        'nenkin': 'nenkinBookUrl',
        'bank': 'bankPassbookUrl'
      };
      
      const type = typeMap[activeTab];
      const urlField = urlMap[activeTab];
      
      if (activeCustomer[urlField]) {
        await handleExtractOcr(type, activeCustomer[urlField] as string);
      }
    } else {
      alert("Không có tài liệu nào để trích xuất trong tab này.");
    }
  };

  const requiredFields = ['fullName', 'cardNumber', 'dob', 'address', 'postalCode', 'taxOfficeName', 'taxOfficeAddress'];
  
  const isAllVerified = !isVerificationMode || (activeCustomer && requiredFields.every(f => {
    if (f === 'taxOfficeName') return verifiedFields[f] && activeCustomer.taxOffice?.name;
    if (f === 'taxOfficeAddress') return verifiedFields[f] && activeCustomer.taxOffice?.address;
    return verifiedFields[f] && activeCustomer[f as keyof Customer];
  }));

  const handleSave = async () => {
    if (!activeCustomer) return;
    
    if (!isAllVerified) {
      setShowValidationErrors(true);
      setTimeout(() => setShowValidationErrors(false), 5000);
      alert('Vui lòng điền và Xác nhận tất cả các trường dữ liệu được yêu cầu (đang báo đỏ) trước khi lưu!');
      return;
    }

    try {
      const method = activeCustomer.id ? 'PUT' : 'POST';
      const url = activeCustomer.id ? `/api/customers/${activeCustomer.id}` : '/api/customers';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeCustomer)
      });
      const data = await res.json();
      if (data.success) {
        alert('Lưu thành công!');
        handleCloseWorkspace();
        fetchCustomers();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi.');
    }
  };

  const hasErr = (field: string) => {
    if (!showValidationErrors) return false;
    if (field === 'taxOfficeName') return !verifiedFields[field] || !activeCustomer?.taxOffice?.name;
    if (field === 'taxOfficeAddress') return !verifiedFields[field] || !activeCustomer?.taxOffice?.address;
    return !verifiedFields[field] || !activeCustomer?.[field as keyof Customer];
  };

  // --- Render Functions ---
  const renderWorkspace = () => {
    if (!activeCustomer) return null;
    return (
      <Portal>
        <div 
          className="fixed inset-y-0 right-0 z-[100] bg-slate-100 flex justify-end transition-opacity" 
          style={{ left: 'var(--sidebar-width, 0px)' }}
          onClick={handleCloseWorkspace}
        >
          <div className="w-full h-full bg-slate-100 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
          <ImageZoomModal url={zoomImageUrl} onClose={() => setZoomImageUrl(null)} />
          
          {/* Unified Header */}
          <div className="h-16 border-b border-slate-200 flex items-center justify-between px-5 bg-white z-30 shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Cập nhật Hồ sơ</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCloseWorkspace} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors" title="Đóng">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
            {/* Left Panel: Form */}
            <div className="flex-1 flex flex-col min-h-0 bg-white relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] lg:h-full lg:overflow-y-auto">

            {/* Sub Header: Verification Toggle & Extract */}
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
                  <Eye className="w-4 h-4 text-amber-600" /> Chế độ xác nhận bằng mắt thường
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isVerificationMode} onChange={() => setIsVerificationMode(!isVerificationMode)} />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
              <Button onClick={handleExtractAll} disabled={ocrStatus === 'processing'} size="sm" className="h-7 bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-sm text-xs px-3">
                <SearchCode className="w-3.5 h-3.5" /> Trích xuất AI
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b shrink-0 bg-white">
              <button onClick={() => setActiveTab('basic')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex-1 ${activeTab === 'basic' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>Cơ bản</button>
              <button onClick={() => setActiveTab('zairyu')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex-1 ${activeTab === 'zairyu' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>Cư trú (Zairyu)</button>
              <button onClick={() => setActiveTab('passport')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex-1 ${activeTab === 'passport' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>Hộ chiếu</button>
              <button onClick={() => setActiveTab('nenkin')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex-1 ${activeTab === 'nenkin' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>Nenkin</button>
              <button onClick={() => setActiveTab('bank')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex-1 ${activeTab === 'bank' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>Ngân hàng</button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {ocrStatus === 'processing' && (
                <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg text-sm flex items-center justify-center gap-2 mb-4 border border-indigo-100 shadow-sm">
                  <Loader2 className="w-5 h-5 animate-spin"/> Đang xử lý tự động bằng AI, vui lòng đợi...
                </div>
              )}

              {activeTab === 'basic' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="font-semibold text-slate-800 mb-2 border-l-4 border-indigo-500 pl-2">Thông tin liên hệ & Việt Nam</h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Số điện thoại</label>
                      <Input value={activeCustomer.phone || ''} onChange={e => handleFieldChange('phone', e.target.value)} placeholder="Nhập số điện thoại..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Địa chỉ tại Việt Nam (Overseas Address)</label>
                      <Input value={activeCustomer.overseasAddress || ''} onChange={e => handleFieldChange('overseasAddress', e.target.value)} placeholder="Thôn, Xã, Huyện, Tỉnh..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Quốc gia (Overseas Country)</label>
                      <Input value={activeCustomer.overseasCountry || ''} onChange={e => handleFieldChange('overseasCountry', e.target.value)} placeholder="Việt Nam..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Mã số cá nhân (My Number)</label>
                      <Input value={activeCustomer.myNumber || ''} onChange={e => handleFieldChange('myNumber', e.target.value)} placeholder="Nhập My Number..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Nghề nghiệp</label>
                      <Input value={activeCustomer.occupation || ''} onChange={e => handleFieldChange('occupation', e.target.value)} placeholder="Nhập nghề nghiệp..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Tên chủ hộ</label>
                      <Input value={activeCustomer.headOfHouseholdName || ''} onChange={e => handleFieldChange('headOfHouseholdName', e.target.value)} placeholder="Nhập tên chủ hộ..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Quan hệ với chủ hộ</label>
                      <Input value={activeCustomer.relationshipToHead || ''} onChange={e => handleFieldChange('relationshipToHead', e.target.value)} placeholder="Ví dụ: Bản thân, Vợ/Chồng, Con..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Ngày xuất cảnh</label>
                      <Input type="date" value={activeCustomer.departureDate || ''} onChange={e => handleFieldChange('departureDate', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'zairyu' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* MOBILE ONLY: Zairyu Images at the top */}
                  <div className="lg:hidden flex flex-row overflow-x-auto gap-3 pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
                    {/* Front Image */}
                    <div className="flex-none w-[200px] sm:w-[240px] bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[160px]">
                      <div className="p-2 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                        <span className="text-[11px] font-bold text-slate-700 truncate mr-2">MẶT TRƯỚC</span>
                        <div className="flex gap-2">
                          <label className="text-[11px] text-indigo-600 cursor-pointer hover:text-indigo-700 font-medium px-2 border border-indigo-200 rounded bg-indigo-50 py-0.5">
                            Tải ảnh <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'zairyuFront')} />
                          </label>
                        </div>
                      </div>
                      <div className="flex-1 bg-slate-100 relative group flex items-center justify-center p-2">
                        {activeCustomer.zairyuFrontUrl ? (
                          <>
                            <img src={activeCustomer.zairyuFrontUrl} alt="Zairyu Front" className="max-h-full max-w-full object-contain drop-shadow-md rounded" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button onClick={() => setZoomImageUrl(activeCustomer.zairyuFrontUrl || null)} className="p-1.5 bg-white rounded-full text-slate-700 hover:text-indigo-600 shadow-lg"><Eye className="w-4 h-4" /></button>
                              <label className="p-1.5 bg-white rounded-full text-slate-700 hover:text-indigo-600 shadow-lg cursor-pointer"><UploadCloud className="w-4 h-4" /><input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'zairyuFront')} /></label>
                            </div>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors text-slate-400 border-2 border-dashed border-slate-300 rounded m-2">
                            <UploadCloud className="w-6 h-6 mb-1 text-slate-400" />
                            <span className="text-xs font-medium text-slate-500 text-center px-2">Tải ảnh mặt trước</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'zairyuFront')} />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Back Image */}
                    <div className="flex-none w-[200px] sm:w-[240px] bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[160px]">
                      <div className="p-2 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                        <span className="text-[11px] font-bold text-slate-700 truncate mr-2">MẶT SAU</span>
                        <div className="flex gap-2">
                          <label className="text-[11px] text-indigo-600 cursor-pointer hover:text-indigo-700 font-medium px-2 border border-indigo-200 rounded bg-indigo-50 py-0.5">
                            Tải ảnh <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'zairyuBack')} />
                          </label>
                        </div>
                      </div>
                      <div className="flex-1 bg-slate-100 relative group flex items-center justify-center p-2">
                        {activeCustomer.zairyuBackUrl ? (
                          <>
                            <img src={activeCustomer.zairyuBackUrl} alt="Zairyu Back" className="max-h-full max-w-full object-contain drop-shadow-md rounded" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button onClick={() => setZoomImageUrl(activeCustomer.zairyuBackUrl || null)} className="p-1.5 bg-white rounded-full text-slate-700 hover:text-indigo-600 shadow-lg"><Eye className="w-4 h-4" /></button>
                              <label className="p-1.5 bg-white rounded-full text-slate-700 hover:text-indigo-600 shadow-lg cursor-pointer"><UploadCloud className="w-4 h-4" /><input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'zairyuBack')} /></label>
                            </div>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors text-slate-400 border-2 border-dashed border-slate-300 rounded m-2">
                            <UploadCloud className="w-6 h-6 mb-1 text-slate-400" />
                            <span className="text-xs font-medium text-slate-500 text-center px-2">Tải ảnh mặt sau</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'zairyuBack')} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-800 mb-2 border-l-4 border-indigo-500 pl-2">Dữ liệu Thẻ Ngoại Kiều</h3>
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <VerifiedInput hasError={hasErr('fullName')} label="Họ và tên" value={activeCustomer.fullName || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('fullName', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.fullName} onToggleVerify={() => toggleVerify('fullName')} />
                      <VerifiedInput hasError={hasErr('cardNumber')} label="Mã Thẻ (Zairyu)" value={activeCustomer.cardNumber || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('cardNumber', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.cardNumber} onToggleVerify={() => toggleVerify('cardNumber')} />
                      <VerifiedInput hasError={hasErr('dob')} label="Ngày sinh" type="date" value={activeCustomer.dob || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('dob', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.dob} onToggleVerify={() => toggleVerify('dob')} />
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Quốc tịch</label>
                        <Input value={activeCustomer.nationality || ''} onChange={e => handleFieldChange('nationality', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Giới tính</label>
                        <Input value={activeCustomer.sex || ''} onChange={e => handleFieldChange('sex', e.target.value)} />
                      </div>
                      <div className="space-y-1 flex items-center gap-2">
                        <input type="checkbox" id="hasPermanentResidence" checked={!!activeCustomer.hasPermanentResidence} onChange={e => handleFieldChange('hasPermanentResidence', e.target.checked)} />
                        <label htmlFor="hasPermanentResidence" className="text-xs font-semibold text-slate-600">Có tư cách lưu trú vĩnh viễn (Permanent Resident)</label>
                      </div>
                      {activeCustomer.hasPermanentResidence && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">Ngày bắt đầu lưu trú vĩnh viễn</label>
                          <Input type="date" value={activeCustomer.permanentResidenceDate || ''} onChange={e => handleFieldChange('permanentResidenceDate', e.target.value)} />
                        </div>
                      )}
                    </div>

                    {/* Customer Address */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-slate-800 text-sm">Cư trú Khách hàng</span>
                      </div>
                      
                      <VerifiedInput hasError={hasErr('postalCode')} label="Mã bưu điện" value={activeCustomer.postalCode || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('postalCode', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.postalCode} onToggleVerify={() => toggleVerify('postalCode')} />

                      <VerifiedInput 
                        hasError={hasErr('address')}
                        label="Địa chỉ hiện tại (Kanji)" 
                        value={activeCustomer.address || ''} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('address', e.target.value)} 
                        isVerificationMode={isVerificationMode} 
                        isVerified={verifiedFields.address} 
                        onToggleVerify={() => toggleVerify('address')}
                        rightElement={
                          activeCustomer.address ? (
                            <Button variant="ghost" size="sm" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeCustomer.address || '')}`, '_blank')} className="h-9 px-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 shrink-0" title="Mở bản đồ địa chỉ này">
                              <Map className="w-4 h-4" />
                            </Button>
                          ) : null
                        }
                      />

                      <VerifiedInput 
                        label="Địa chỉ hiện tại (Romaji)" 
                        value={activeCustomer.romajiAddress || ''} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('romajiAddress', e.target.value)} 
                        isVerificationMode={isVerificationMode} 
                        isVerified={verifiedFields.romajiAddress} 
                        onToggleVerify={() => toggleVerify('romajiAddress')}
                      />
                    </div>

                    {/* Tax Office */}
                    <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-4 shadow-sm">
                      <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                          <span className="font-semibold text-indigo-800 text-sm">Cục Thuế Quản Lý</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mb-4">
                        <p className="text-[11.5px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded font-medium shadow-sm leading-relaxed">
                          <span className="font-bold text-amber-900">⚠️ Lưu ý:</span> Hãy tra cứu trên trang web NTA theo mã bưu điện của khách hàng ({activeCustomer.postalCode ? <span className="font-bold text-red-600 bg-white px-1 py-0.5 rounded shadow-sm">{activeCustomer.postalCode}</span> : 'chưa có mã'}) và so sánh với nội dung tự động AI bên dưới để xác nhận lại tính chính xác.
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Button size="sm" variant="outline" className="h-9 text-xs bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex-1 justify-start font-medium shadow-sm transition-colors" onClick={() => window.open(`https://www.nta.go.jp/about/organization/access/map.htm`, '_blank')}>
                            <Search className="w-4 h-4 mr-2 text-indigo-500" /> Tra cứu NTA thủ công
                          </Button>
                          {activeCustomer.taxOffice?.websiteUrl && (
                            <Button size="sm" variant="outline" className="h-9 text-xs bg-white border-blue-200 text-blue-700 hover:bg-blue-50 flex-1 justify-start font-medium shadow-sm transition-colors" onClick={() => window.open(activeCustomer.taxOffice?.websiteUrl, '_blank')} title={activeCustomer.taxOffice?.websiteUrl}>
                              <ExternalLink className="w-4 h-4 mr-2 text-blue-500" /> Mở web Cục thuế (Kết quả AI)
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <VerifiedInput 
                        hasError={hasErr('taxOfficeName')}
                        label="Tên Cục Thuế (Kanji)" 
                        value={activeCustomer.taxOffice?.name || ''} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTaxOfficeChange('name', e.target.value)} 
                        isVerificationMode={isVerificationMode} 
                        isVerified={verifiedFields.taxOfficeName} 
                        onToggleVerify={() => toggleVerify('taxOfficeName')} 
                      />

                      <VerifiedInput 
                        label="Tên Cục Thuế (Romaji)" 
                        value={activeCustomer.taxOffice?.romajiName || ''} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTaxOfficeChange('romajiName', e.target.value)} 
                        isVerificationMode={isVerificationMode} 
                        isVerified={verifiedFields.taxOfficeRomajiName} 
                        onToggleVerify={() => toggleVerify('taxOfficeRomajiName')} 
                      />
                      
                      <VerifiedInput 
                        hasError={hasErr('taxOfficeAddress')}
                        label="Địa chỉ Cục Thuế (Kanji)" 
                        value={activeCustomer.taxOffice?.address || ''} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTaxOfficeChange('address', e.target.value)} 
                        isVerificationMode={isVerificationMode} 
                        isVerified={verifiedFields.taxOfficeAddress} 
                        onToggleVerify={() => toggleVerify('taxOfficeAddress')} 
                        rightElement={
                          activeCustomer.taxOffice?.address ? (
                            <Button variant="ghost" size="sm" onClick={() => window.open(activeCustomer.taxOffice?.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeCustomer.taxOffice?.name || activeCustomer.taxOffice?.address || '')}`, '_blank')} className="h-9 px-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 shrink-0" title="Mở bản đồ Cục thuế">
                              <Map className="w-4 h-4" />
                            </Button>
                          ) : null
                        }
                      />

                      <VerifiedInput 
                        label="Địa chỉ Cục Thuế (Romaji)" 
                        value={activeCustomer.taxOffice?.romajiAddress || ''} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTaxOfficeChange('romajiAddress', e.target.value)} 
                        isVerificationMode={isVerificationMode} 
                        isVerified={verifiedFields.taxOfficeRomajiAddress} 
                        onToggleVerify={() => toggleVerify('taxOfficeRomajiAddress')} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'passport' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* MOBILE ONLY: Passport Image */}
                  <div className="lg:hidden flex flex-row overflow-x-auto gap-3 pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
                    <div className="flex-none w-[200px] sm:w-[240px] bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[160px]">
                      <div className="p-2 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                        <span className="text-[11px] font-bold text-slate-700 uppercase">HỘ CHIẾU</span>
                        <div className="flex gap-2">
                          <label className="text-[11px] text-indigo-600 cursor-pointer hover:text-indigo-700 font-medium px-2 border border-indigo-200 rounded bg-indigo-50 py-0.5">
                            Tải ảnh <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'passport')} />
                          </label>
                        </div>
                      </div>
                      <div className="flex-1 bg-slate-100 relative group flex items-center justify-center p-2">
                        {activeCustomer.passportUrl ? (
                          <>
                            <img src={activeCustomer.passportUrl} alt="Passport" className="max-h-full max-w-full object-contain drop-shadow-md rounded" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button onClick={() => setZoomImageUrl(activeCustomer.passportUrl || null)} className="p-1.5 bg-white rounded-full text-slate-700 hover:text-indigo-600 shadow-lg"><Eye className="w-4 h-4" /></button>
                            </div>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors text-slate-400 border-2 border-dashed border-slate-300 rounded m-2">
                            <UploadCloud className="w-6 h-6 mb-1 text-slate-400" />
                            <span className="text-xs font-medium text-slate-500 text-center px-2">Tải ảnh hộ chiếu</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'passport')} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2 border-l-4 border-indigo-500 pl-2">Dữ liệu Hộ chiếu</h3>
                  <div className="space-y-4">
                    <VerifiedInput hasError={hasErr('lastName')} label="Họ (Last Name)" value={activeCustomer.lastName || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('lastName', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.lastName} onToggleVerify={() => toggleVerify('lastName')} />
                    <VerifiedInput hasError={hasErr('firstName')} label="Tên (First Name)" value={activeCustomer.firstName || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('firstName', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.firstName} onToggleVerify={() => toggleVerify('firstName')} />
                    <VerifiedInput hasError={hasErr('nationality')} label="Quốc tịch" value={activeCustomer.nationality || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('nationality', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.nationality} onToggleVerify={() => toggleVerify('nationality')} />
                    <VerifiedInput hasError={hasErr('passportDob')} label="Ngày sinh" type="date" value={activeCustomer.dob || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('dob', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.passportDob} onToggleVerify={() => toggleVerify('passportDob')} />
                    <VerifiedInput hasError={hasErr('passportSex')} label="Giới tính" value={activeCustomer.sex || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('sex', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.passportSex} onToggleVerify={() => toggleVerify('passportSex')} />
                    <VerifiedInput hasError={hasErr('passportNumber')} label="Số hộ chiếu" value={activeCustomer.passportNumber || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('passportNumber', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.passportNumber} onToggleVerify={() => toggleVerify('passportNumber')} />
                    <VerifiedInput hasError={hasErr('passportIssueDate')} label="Ngày cấp" type="date" value={activeCustomer.passportIssueDate || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('passportIssueDate', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.passportIssueDate} onToggleVerify={() => toggleVerify('passportIssueDate')} />
                    <VerifiedInput hasError={hasErr('passportExpiryDate')} label="Ngày hết hạn" type="date" value={activeCustomer.passportExpiryDate || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('passportExpiryDate', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.passportExpiryDate} onToggleVerify={() => toggleVerify('passportExpiryDate')} />
                    <VerifiedInput hasError={hasErr('placeOfBirth')} label="Nơi sinh" value={activeCustomer.placeOfBirth || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('placeOfBirth', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.placeOfBirth} onToggleVerify={() => toggleVerify('placeOfBirth')} />
                  </div>
                </div>
              )}

              {activeTab === 'nenkin' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* MOBILE ONLY: Nenkin Image */}
                  <div className="lg:hidden flex flex-row overflow-x-auto gap-3 pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
                    <div className="flex-none w-[200px] sm:w-[240px] bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[160px]">
                      <div className="p-2 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                        <span className="text-[11px] font-bold text-slate-700 uppercase">SỔ NENKIN</span>
                        <div className="flex gap-2">
                          <label className="text-[11px] text-indigo-600 cursor-pointer hover:text-indigo-700 font-medium px-2 border border-indigo-200 rounded bg-indigo-50 py-0.5">
                            Tải ảnh <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'nenkin')} />
                          </label>
                        </div>
                      </div>
                      <div className="flex-1 bg-slate-100 relative group flex items-center justify-center p-2">
                        {activeCustomer.nenkinBookUrl ? (
                          <>
                            <img src={activeCustomer.nenkinBookUrl} alt="Nenkin" className="max-h-full max-w-full object-contain drop-shadow-md rounded" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button onClick={() => setZoomImageUrl(activeCustomer.nenkinBookUrl || null)} className="p-1.5 bg-white rounded-full text-slate-700 hover:text-indigo-600 shadow-lg"><Eye className="w-4 h-4" /></button>
                            </div>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors text-slate-400 border-2 border-dashed border-slate-300 rounded m-2">
                            <UploadCloud className="w-6 h-6 mb-1 text-slate-400" />
                            <span className="text-xs font-medium text-slate-500 text-center px-2">Tải ảnh sổ Nenkin</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'nenkin')} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2 border-l-4 border-indigo-500 pl-2">Dữ liệu Sổ Nenkin</h3>
                  <div className="space-y-4">
                    <VerifiedInput hasError={hasErr('nenkinNumber')} label="Số Nenkin (Basic Pension Number)" value={activeCustomer.nenkinNumber || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('nenkinNumber', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.nenkinNumber} onToggleVerify={() => toggleVerify('nenkinNumber')} />
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Mã số đăng ký hưu trí (nếu có)</label>
                      <input type="text" className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm" value={activeCustomer.pensionSystemRegistrationNumber || ''} onChange={(e) => handleFieldChange('pensionSystemRegistrationNumber', e.target.value)} />
                    </div>
                    <VerifiedInput hasError={hasErr('fullName')} label="Họ tên (Kanji)" value={activeCustomer.fullName || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('fullName', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.fullName} onToggleVerify={() => toggleVerify('fullName')} />
                    <VerifiedInput hasError={hasErr('fullNameFurigana')} label="Họ tên (Furigana/Kana/Romaji)" value={activeCustomer.fullNameFurigana || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('fullNameFurigana', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.fullNameFurigana} onToggleVerify={() => toggleVerify('fullNameFurigana')} />
                    <VerifiedInput hasError={hasErr('nenkinDob')} label="Ngày sinh" type="date" value={activeCustomer.dob || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('dob', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.nenkinDob} onToggleVerify={() => toggleVerify('nenkinDob')} />
                  </div>
                </div>
              )}

              {activeTab === 'bank' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* MOBILE ONLY: Bank Image */}
                  <div className="lg:hidden flex flex-row overflow-x-auto gap-3 pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
                    <div className="flex-none w-[200px] sm:w-[240px] bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[160px]">
                      <div className="p-2 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                        <span className="text-[11px] font-bold text-slate-700 uppercase">SỔ NGÂN HÀNG</span>
                        <div className="flex gap-2">
                          <label className="text-[11px] text-indigo-600 cursor-pointer hover:text-indigo-700 font-medium px-2 border border-indigo-200 rounded bg-indigo-50 py-0.5">
                            Tải ảnh <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'bank')} />
                          </label>
                        </div>
                      </div>
                      <div className="flex-1 bg-slate-100 relative group flex items-center justify-center p-2">
                        {activeCustomer.bankPassbookUrl ? (
                          <>
                            <img src={activeCustomer.bankPassbookUrl} alt="Bank" className="max-h-full max-w-full object-contain drop-shadow-md rounded" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button onClick={() => setZoomImageUrl(activeCustomer.bankPassbookUrl || null)} className="p-1.5 bg-white rounded-full text-slate-700 hover:text-indigo-600 shadow-lg"><Eye className="w-4 h-4" /></button>
                            </div>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors text-slate-400 border-2 border-dashed border-slate-300 rounded m-2">
                            <UploadCloud className="w-6 h-6 mb-1 text-slate-400" />
                            <span className="text-xs font-medium text-slate-500 text-center px-2">Tải ảnh sổ ngân hàng</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'bank')} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2 border-l-4 border-indigo-500 pl-2">Dữ liệu Ngân hàng</h3>
                  <div className="space-y-4">
                    <VerifiedInput hasError={hasErr('bankName')} label="Tên Ngân hàng (銀行名)" value={activeCustomer.bankName || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('bankName', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.bankName} onToggleVerify={() => toggleVerify('bankName')} />
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Mã Ngân hàng (金融機関コード)</label>
                      <input type="text" className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm" value={activeCustomer.bankInstitutionCode || ''} onChange={(e) => handleFieldChange('bankInstitutionCode', e.target.value)} />
                    </div>
                    <VerifiedInput hasError={hasErr('branchName')} label="Tên Chi nhánh (支店名)" value={activeCustomer.branchName || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('branchName', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.branchName} onToggleVerify={() => toggleVerify('branchName')} />
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Mã Chi nhánh (支店コード)</label>
                      <input type="text" className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm" value={activeCustomer.branchCode || ''} onChange={(e) => handleFieldChange('branchCode', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Loại tài khoản</label>
                      <select value={activeCustomer.bankAccountType || ''} onChange={(e: any) => handleFieldChange('bankAccountType', e.target.value)} className="w-full h-9 px-2.5 py-1 border border-slate-300 rounded-md text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm">
                        <option value="">-- Chọn --</option>
                        <option value="ORDINARY">Thường (普通 - Ordinary)</option>
                        <option value="CURRENT">Tiết kiệm (当座 - Current)</option>
                      </select>
                    </div>
                    <VerifiedInput hasError={hasErr('accountNumber')} label="Số Tài khoản (口座番号)" value={activeCustomer.accountNumber || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('accountNumber', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.accountNumber} onToggleVerify={() => toggleVerify('accountNumber')} />
                    <VerifiedInput hasError={hasErr('accountName')} label="Chủ tài khoản (口座名義人)" value={activeCustomer.accountName || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('accountName', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.accountName} onToggleVerify={() => toggleVerify('accountName')} />
                    <VerifiedInput hasError={hasErr('swiftCode')} label="SWIFT Code" value={activeCustomer.swiftCode || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('swiftCode', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.swiftCode} onToggleVerify={() => toggleVerify('swiftCode')} />
                    <VerifiedInput hasError={hasErr('bankBranchAddress')} label="Địa chỉ chi nhánh ngân hàng" value={activeCustomer.bankBranchAddress || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('bankBranchAddress', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.bankBranchAddress} onToggleVerify={() => toggleVerify('bankBranchAddress')} />
                    <VerifiedInput hasError={hasErr('bankCountry')} label="Quốc gia của ngân hàng" value={activeCustomer.bankCountry || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('bankCountry', e.target.value)} isVerificationMode={isVerificationMode} isVerified={verifiedFields.bankCountry} onToggleVerify={() => toggleVerify('bankCountry')} />
                  </div>
                </div>
              )}

            </div>

            {/* Footer Save Button */}
            <div className="p-4 border-t bg-slate-50/80 shrink-0">
              <Button 
                onClick={handleSave} 
                className={`w-full shadow-md font-semibold gap-2 h-11 transition-all ${
                  isAllVerified 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                    : 'bg-slate-300 hover:bg-slate-300 text-slate-500 cursor-not-allowed opacity-80'
                }`}
              >
                <Save className="w-5 h-5" /> Lưu Hồ Sơ
              </Button>
            </div>
          </div>

          {/* Right Panel: Image Viewers (Sidebar on desktop ONLY) */}
          <div className="hidden lg:flex w-full lg:w-[40%] xl:w-[35%] flex-row lg:flex-col bg-slate-100 p-3 gap-3 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto relative shrink-0">
            {activeTab === 'basic' && (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Hồ sơ Khách hàng Cơ bản</p>
                </div>
              </div>
            )}

            {activeTab === 'zairyu' && (
              <>
                {/* Front Image */}
                <div className="flex-none w-[180px] lg:w-auto lg:flex-1 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[180px] lg:min-h-[250px]">
                  <div className="p-2 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                    <span className="text-[11px] font-bold text-slate-700 truncate mr-2">MẶT TRƯỚC</span>
                    <div className="flex gap-2">
                      <label className="text-[11px] text-indigo-600 cursor-pointer hover:text-indigo-700 font-medium px-2 border border-indigo-200 rounded bg-indigo-50 py-0.5">
                        Tải ảnh mới <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'zairyuFront')} />
                      </label>
                    </div>
                  </div>
                  <div 
                    className="flex-1 min-h-0 relative flex items-center justify-center p-2 bg-slate-50/50 group cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => activeCustomer.zairyuFrontUrl ? setZoomImageUrl(activeCustomer.zairyuFrontUrl) : document.getElementById('upload-zairyu-front')?.click()}
                  >
                    {!activeCustomer.zairyuFrontUrl && <input id="upload-zairyu-front" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'zairyuFront')} />}
                    
                    {activeCustomer.zairyuFrontUrl ? (
                      <img src={activeCustomer.zairyuFrontUrl} className="max-w-full max-h-full object-contain" alt="Zairyu Front" />
                    ) : (
                      <div className="text-slate-400 flex flex-col items-center pointer-events-none">
                        <UploadCloud className="w-10 h-10 mb-2 opacity-50" />
                        <span className="text-sm">Click hoặc Kéo thả ảnh mặt trước</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Back Image */}
                <div className="flex-none w-[180px] lg:w-auto lg:flex-1 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[180px] lg:min-h-[250px]">
                  <div className="p-2 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                    <span className="text-[11px] font-bold text-slate-700 truncate mr-2">MẶT SAU</span>
                    <div className="flex gap-2">
                      <label className="text-[11px] text-indigo-600 cursor-pointer hover:text-indigo-700 font-medium px-2 border border-indigo-200 rounded bg-indigo-50 py-0.5">
                        Tải ảnh mới <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'zairyuBack')} />
                      </label>
                    </div>
                  </div>
                  <div 
                    className="flex-1 min-h-0 relative flex items-center justify-center p-2 bg-slate-50/50 group cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => activeCustomer.zairyuBackUrl ? setZoomImageUrl(activeCustomer.zairyuBackUrl) : document.getElementById('upload-zairyu-back')?.click()}
                  >
                    {!activeCustomer.zairyuBackUrl && <input id="upload-zairyu-back" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'zairyuBack')} />}

                    {activeCustomer.zairyuBackUrl ? (
                      <img src={activeCustomer.zairyuBackUrl} className="max-w-full max-h-full object-contain" alt="Zairyu Back" />
                    ) : (
                      <div className="text-amber-600/70 flex flex-col items-center text-center p-4 pointer-events-none">
                        <UploadCloud className="w-10 h-10 mb-2 opacity-70" />
                        <span className="text-sm font-semibold">Click để tải ảnh mặt sau</span>
                        <span className="text-[10px] mt-1 text-slate-500">Cần thiết nếu khách hàng đã đổi chỗ ở.</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {/* Other Image Tabs */}
            {(activeTab === 'passport' || activeTab === 'nenkin' || activeTab === 'bank') && (
              <div className="flex-none w-[180px] lg:w-auto lg:flex-1 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[180px]">
                <div className="p-2 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">
                    TÀI LIỆU {activeTab}
                  </span>
                  <label className="text-[11px] text-indigo-600 cursor-pointer hover:text-indigo-700 font-medium px-2 border border-indigo-200 rounded bg-indigo-50 py-0.5">
                    Tải ảnh <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, activeTab)} />
                  </label>
                </div>
                <div 
                  className="flex-1 min-h-0 relative flex items-center justify-center p-2 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => activeCustomer[`${activeTab}Url`] ? setZoomImageUrl(activeCustomer[`${activeTab}Url`] as string) : document.getElementById(`upload-${activeTab}`)?.click()}
                >
                  {!activeCustomer[`${activeTab}Url`] && <input id={`upload-${activeTab}`} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, activeTab)} />}
                  
                  {activeCustomer[`${activeTab}Url`] ? (
                    <img src={activeCustomer[`${activeTab}Url`] as string} className="max-w-full max-h-full object-contain" alt={activeTab} />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center pointer-events-none">
                      <UploadCloud className="w-10 h-10 mb-2 opacity-50" />
                      <span className="text-sm">Click để tải ảnh tài liệu này</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      </Portal>
    );
  }

  // --- List View ---
  return (
    <>
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Quản lý Khách hàng & Hồ sơ</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" className="gap-2 h-10 flex-1 sm:flex-none" onClick={() => { navigator.clipboard.writeText(window.location.origin + '/onboarding'); alert('Đã copy link tự tạo hồ sơ gửi cho khách!'); }}>
            <Link2 className="w-4 h-4" /> Copy Link Gửi Khách
          </Button>
          <Button onClick={() => handleOpenWorkspace()} className="gap-2 h-10 bg-indigo-600 hover:bg-indigo-700 flex-1 sm:flex-none">
            <Plus className="w-4 h-4" /> Thêm Hồ sơ Mới
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Mã KH</TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Họ và tên</TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Trạng thái</TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Ngày tạo</TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Ngày cập nhật</TableHead>
                <TableHead className="py-3 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Đang tải...</TableCell></TableRow>
              ) : customers.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">Chưa có hồ sơ nào</TableCell></TableRow>
              ) : (
                customers.map((customer, index) => (
                  <TableRow key={index} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-indigo-600 text-sm">{customer.code || '---'}</TableCell>
                    <TableCell className="font-medium text-sm">{customer.fullName}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                        {customer.status || 'NEW'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : '---'}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString('vi-VN') : '---'}
                    </TableCell>
                    <TableCell className="text-right flex gap-2 justify-end">
                      {customer.applicationId ? (
                        <Link href={`/customers/${customer.id}?tab=app_details`}>
                          <Button variant="outline" size="sm" className="h-8 px-3 text-purple-600 border-purple-200 hover:bg-purple-50">Xem Hồ sơ</Button>
                        </Link>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-3 text-emerald-600 border-emerald-200 hover:bg-emerald-50" 
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/applications', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ customerId: customer.id })
                              });
                              if (res.ok) {
                                const newApp = await res.json();
                                window.location.href = `/customers/${customer.id}?tab=app_details`;
                              }
                            } catch (e) { console.error(e); }
                          }}
                        >
                          Tạo Hồ sơ
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-8 px-3 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => handleOpenWorkspace(customer)}>Cập nhật KH</Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-red-600">Xóa</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="md:hidden flex flex-col p-2 bg-white">
          {loadingList ? (
            <div className="text-center py-8 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Đang tải...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Chưa có hồ sơ nào</div>
          ) : (
            customers.map((customer, index) => (
              <div key={index} className="border-b border-slate-100 py-3 space-y-2 bg-white last:border-0 hover:bg-slate-50 transition-colors">
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-9 rounded shrink-0 bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                    {customer.zairyuFrontUrl ? (
                      <img src={customer.zairyuFrontUrl} alt="Zairyu" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] font-bold text-slate-400">NO IMG</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="text-xs text-indigo-600 font-medium leading-none mb-1">{customer.code || '---'}</div>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700">
                        {customer.status || 'NEW'}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 text-sm truncate">{customer.fullName}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1 pl-[68px]">
                  {customer.applicationId ? (
                    <Link href={`/customers/${customer.id}?tab=app_details`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full h-7 text-xs px-2 text-purple-600 border-purple-200 hover:bg-purple-50">Xem Hồ sơ</Button>
                    </Link>
                  ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 h-7 text-xs px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50" 
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/applications', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ customerId: customer.id })
                            });
                            if (res.ok) {
                              const newApp = await res.json();
                              window.location.href = `/customers/${customer.id}?tab=app_details`;
                            }
                          } catch (e) { console.error(e); }
                        }}
                      >
                        Tạo Hồ sơ
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-xs px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => handleOpenWorkspace(customer)}>Cập nhật</Button>
                  </div>
                </div>
            ))
          )}
        </div>
      </Card>
    </div>
    {renderWorkspace()}
    </>
  );
}
