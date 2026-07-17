'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, FileText, FolderOpen, Printer, PieChart, UploadCloud, CheckCircle, Plus, X, ZoomIn, Wand2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import PrintTab from './PrintTab';
import AppDetailsTab from './AppDetailsTab';

export default function CustomerDetailDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [activeTab, setActiveTab] = useState('data_entry');
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<Record<string, 'processing'|'done'|'error'>>({});

  // Verification States
  const [aiFields, setAiFields] = useState<string[]>([]);
  const [verifiedFields, setVerifiedFields] = useState<string[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [cachedOcrData, setCachedOcrData] = useState<Record<string, any>>({});

  // States for Image Preview
  const [selectedDocKey, setSelectedDocKey] = useState<string | null>(null);

  const DOCUMENTS = [
    { key: 'zairyuFront', title: 'Thẻ Ngoại Kiều', urlField: 'zairyuFrontUrl' },
    { key: 'passport', title: 'Hộ chiếu', urlField: 'passportUrl' },
    { key: 'departureStamp', title: 'Dấu xuất cảnh', urlField: 'departureStampUrl' },
    { key: 'nenkinBook', title: 'Sổ Nenkin', urlField: 'nenkinBookUrl' },
    { key: 'bankPassbook', title: 'Sổ Ngân hàng', urlField: 'bankPassbookUrl' },
  ];

  useEffect(() => {
    if (id === 'new') {
      setCustomer({});
      setLoading(false);
    } else {
      fetchCustomer();
    }
  }, [id]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab) setActiveTab(tab);
    }
  }, []);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      const data = await res.json();
      if (data.success) {
        setCustomer(data.data);
      }
      
      const ocrRes = await fetch(`/api/customers/${id}/ocr`);
      const ocrData = await ocrRes.json();
      if (ocrData.success) {
        setCachedOcrData(ocrData.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setCustomer((prev: any) => ({ ...prev, [field]: value }));
  };

  const toggleVerify = (field: string) => {
    setVerifiedFields(prev => 
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
    setShowValidationErrors(false);
  };

  const isAllVerified = aiFields.every(f => verifiedFields.includes(f));

  const hasErr = (field: string) => {
    if (!showValidationErrors) return false;
    return aiFields.includes(field) && !verifiedFields.includes(field);
  };

  const handleSave = async () => {
    if (!isAllVerified) {
      setShowValidationErrors(true);
      setTimeout(() => setShowValidationErrors(false), 5000);
      alert('Vui lòng kiểm tra và xác nhận (tích xanh) các trường dữ liệu được trích xuất từ AI (đang báo đỏ) trước khi lưu!');
      return;
    }

    setSaving(true);
    try {
      const isNew = id === 'new';
      const endpoint = isNew ? '/api/customers' : `/api/customers/${id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      });
      const data = await res.json();
      if (data.success) {
        alert(isNew ? 'Đã tạo khách hàng mới thành công!' : 'Đã lưu thành công!');
        if (isNew) {
          window.location.href = `/customers/${data.data.id}`;
        } else {
          fetchCustomer();
        }
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (e) {
      alert('Đã xảy ra lỗi khi lưu.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docKey: string, urlField: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear old OCR cache for this doc when uploading a new one
    setCachedOcrData(prev => {
      const newData = { ...prev };
      delete newData[docKey];
      return newData;
    });

    setOcrStatus(prev => ({ ...prev, [docKey]: 'processing' }));
    const objectUrl = URL.createObjectURL(file);
    setCustomer((prev: any) => ({ ...prev, [urlField]: objectUrl }));

    const form = new FormData();
    form.append('file', file);
    form.append('documentType', docKey);
    form.append('action', 'upload');

    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        setCustomer((prev: any) => ({ ...prev, [urlField]: data.publicUrl }));
        setOcrStatus(prev => ({ ...prev, [docKey]: 'done' }));
      } else {
        alert('Lỗi upload: ' + data.error);
        setOcrStatus(prev => ({ ...prev, [docKey]: 'error' }));
      }
    } catch (err) {
      alert('Đã xảy ra lỗi khi upload.');
      setOcrStatus(prev => ({ ...prev, [docKey]: 'error' }));
    }
  };

  const handleExtractOcr = async (docKey: string, imageUrl: string) => {
    if (!imageUrl || imageUrl.startsWith('blob:')) {
      alert("Vui lòng chờ tải ảnh lên hoàn tất trước khi trích xuất.");
      return;
    }
    
    if (!window.confirm(`Bạn có chắc chắn muốn trích xuất AI bằng Gemini cho ${DOCUMENTS.find(d=>d.key===docKey)?.title}?\n\nHành động này sẽ gọi trực tiếp đến Google AI và làm giảm dung lượng API (Token).`)) {
      return;
    }

    setOcrStatus(prev => ({ ...prev, [docKey]: 'processing' }));
    const form = new FormData();
    form.append('action', 'extract');
    form.append('documentType', docKey);
    form.append('imageUrl', imageUrl);
    form.append('customerId', id);

    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: form });
      const data = await res.json();
      
      if (data.success && data.extractedData) {
        if (data.extractedData.error) {
          alert('⚠️ ' + data.extractedData.error);
          setOcrStatus(prev => ({ ...prev, [docKey]: 'error' }));
          return;
        }
        // Cập nhật bộ nhớ đệm
        setCachedOcrData(prev => ({ ...prev, [docKey]: data.extractedData }));
        
        // Track which fields were populated by AI
        const newAiFields: string[] = [];
        const ext = data.extractedData;
        
        if (docKey === 'zairyuFront') {
          if (ext.fullName) newAiFields.push('fullName');
          if (ext.dob) newAiFields.push('dob');
          if (ext.cardNumber) newAiFields.push('cardNumber');
          if (ext.postalCode) newAiFields.push('postalCode');
          if (ext.address) newAiFields.push('zairyuAddress');
          if (ext.taxOffice?.name) newAiFields.push('taxOfficeName');
          if (ext.taxOffice?.postalCode || ext.taxOffice?.zipCode) newAiFields.push('taxOfficeZipCode');
          if (ext.taxOffice?.address) newAiFields.push('taxOfficeAddress');
        }
        if (docKey === 'zairyuBack') {
          if (ext.address) newAiFields.push('zairyuAddress');
          if (ext.postalCode) newAiFields.push('postalCode');
          if (ext.taxOffice?.name) newAiFields.push('taxOfficeName');
          if (ext.taxOffice?.postalCode || ext.taxOffice?.zipCode) newAiFields.push('taxOfficeZipCode');
          if (ext.taxOffice?.address) newAiFields.push('taxOfficeAddress');
        }
        if (docKey === 'passport') {
          if (ext.lastName || ext.firstName) newAiFields.push('fullName');
          if (ext.dob) newAiFields.push('dob');
          if (ext.issueDate) newAiFields.push('passportIssueDate');
          if (ext.expiryDate) newAiFields.push('passportExpiryDate');
        }
        if (docKey === 'nenkinBook') {
          if (ext.nenkinNumber) newAiFields.push('nenkinNumber');
          if (ext.fullNameKanji) newAiFields.push('fullNameKanji');
          if (ext.fullNameFurigana) newAiFields.push('fullNameFurigana');
          if (ext.dob) newAiFields.push('dob');
        }
        if (docKey === 'bankPassbook') {
          if (ext.bankName) newAiFields.push('bankName');
          if (ext.branchName) newAiFields.push('branchName');
          if (ext.accountNumber) newAiFields.push('accountNumber');
          if (ext.accountName) newAiFields.push('accountName');
          if (ext.swiftCode) newAiFields.push('swiftCode');
          if (ext.bankBranchAddress) newAiFields.push('bankBranchAddress');
          if (ext.bankCountry) newAiFields.push('bankCountry');
        }

        setAiFields(prev => Array.from(new Set([...prev, ...newAiFields])));
        setVerifiedFields(prev => prev.filter(f => !newAiFields.includes(f))); // Require re-verification
        
        // Tự động điền dữ liệu OCR vào form Khách hàng
        setCustomer((prev: any) => ({
          ...prev,
          ...(docKey === 'zairyuFront' && {
            fullName: data.extractedData.fullName || prev.fullName,
            dob: data.extractedData.dob || prev.dob,
            cardNumber: data.extractedData.cardNumber || prev.cardNumber,
            postalCode: data.extractedData.postalCode || prev.postalCode,
            zairyuAddress: data.extractedData.address || prev.zairyuAddress,
            taxOffice: {
              ...(prev.taxOffice || {}),
              ...(data.extractedData.taxOffice || {})
            }
          }),
          ...(docKey === 'zairyuBack' && {
            zairyuAddress: data.extractedData.address || prev.zairyuAddress,
            postalCode: data.extractedData.postalCode || prev.postalCode,
            taxOffice: {
              ...(prev.taxOffice || {}),
              ...(data.extractedData.taxOffice || {})
            }
          }),
          ...(docKey === 'passport' && {
            fullName: (data.extractedData.lastName && data.extractedData.firstName) ? `${data.extractedData.lastName} ${data.extractedData.firstName}` : prev.fullName,
            dob: data.extractedData.dob || prev.dob,
            passportIssueDate: data.extractedData.issueDate || prev.passportIssueDate,
            passportExpiryDate: data.extractedData.expiryDate || prev.passportExpiryDate,
          }),
          ...(docKey === 'nenkinBook' && {
            nenkinNumber: data.extractedData.nenkinNumber || prev.nenkinNumber,
            fullNameKanji: data.extractedData.fullNameKanji || prev.fullNameKanji,
            fullNameFurigana: data.extractedData.fullNameFurigana || prev.fullNameFurigana,
            dob: data.extractedData.dob || prev.dob,
          }),
          ...(docKey === 'bankPassbook' && {
            bankName: data.extractedData.bankName || prev.bankName,
            branchName: data.extractedData.branchName || prev.branchName,
            accountNumber: data.extractedData.accountNumber || prev.accountNumber,
            accountName: data.extractedData.accountName || prev.accountName,
            swiftCode: data.extractedData.swiftCode || prev.swiftCode,
            bankBranchAddress: data.extractedData.bankBranchAddress || prev.bankBranchAddress,
            bankCountry: data.extractedData.bankCountry || prev.bankCountry,
          })
        }));
        setOcrStatus(prev => ({ ...prev, [docKey]: 'done' }));
        alert('Trích xuất thành công!');
      } else {
        alert('⚠️ ' + (data.error || 'Dữ liệu không hợp lệ'));
        setOcrStatus(prev => ({ ...prev, [docKey]: 'error' }));
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi gọi API OCR');
      setOcrStatus(prev => ({ ...prev, [docKey]: 'error' }));
    }
  };

  const handleSyncFieldFromAI = (docKey: string, ocrField: string, customerField: string, isTaxOffice = false) => {
    const docData = cachedOcrData[docKey];
    if (!docData) {
      alert("Chưa có dữ liệu trích xuất từ " + (DOCUMENTS.find(d=>d.key===docKey)?.title || docKey) + ". Vui lòng bấm 'Trích xuất AI' ở cột bên trái trước.");
      return;
    }
    
    if (isTaxOffice && docData.taxOffice) {
      const mappedField = customerField === 'taxOfficeName' ? 'name' : customerField === 'taxOfficeZipCode' ? 'zipCode' : 'address';
      if (docData.taxOffice[mappedField]) {
        setCustomer((prev: any) => ({
          ...prev,
          taxOffice: {
            ...(prev.taxOffice || {}),
            [mappedField]: docData.taxOffice[mappedField]
          }
        }));
        setAiFields(prev => Array.from(new Set([...prev, customerField])));
        setVerifiedFields(prev => prev.filter(f => f !== customerField));
      }
    } else if (docData[ocrField]) {
      setCustomer((prev: any) => ({ ...prev, [customerField]: docData[ocrField] }));
      setAiFields(prev => Array.from(new Set([...prev, customerField])));
      setVerifiedFields(prev => prev.filter(f => f !== customerField));
    } else {
      alert(`Trường này chưa được AI nhận diện thành công trong ${DOCUMENTS.find(d=>d.key===docKey)?.title}.`);
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!customer) return <div className="p-8 text-center text-red-500">Không tìm thấy khách hàng!</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden h-screen">
      {/* Header Area */}
      <header className="bg-white border-b border-slate-200 z-10 shrink-0">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/customers" className="text-slate-500 hover:text-indigo-600 transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                  {id === 'new' ? 'Tạo Hồ Sơ Mới' : (customer.fullName || 'Chưa cập nhật tên')}
                  {id !== 'new' && (
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-md border border-amber-200">
                      {customer.status || 'Chờ xử lý'}
                    </span>
                  )}
                </h1>
                <p className="text-sm text-slate-500 font-mono">
                  {id === 'new' ? 'Mã KH: Tạo tự động sau khi lưu' : `Mã KH: ${customer.code} • Đã tạo: ${new Date(customer.createdAt).toLocaleDateString('vi-VN')}`}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="text-slate-600 bg-white border-slate-300" onClick={() => fetchCustomer()}>Hủy</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu thông tin'}
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-6 mt-2 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('data_entry')}
              className={`border-b-2 font-medium py-3 px-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'data_entry' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <FileText className="w-4 h-4" /> 1. Nhập liệu & Giấy tờ
            </button>
            <button 
              onClick={() => setActiveTab('app_details')}
              className={`border-b-2 font-medium py-3 px-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'app_details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <FolderOpen className="w-4 h-4" /> 2. Danh sách Hồ sơ Thuế
            </button>
            <button 
              onClick={() => setActiveTab('report')}
              className={`border-b-2 font-medium py-3 px-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'report' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Printer className="w-4 h-4" /> 3. In ấn & Biểu mẫu
            </button>
          </nav>
          
          {activeTab === 'data_entry' && (
            <div className="flex items-center gap-4">
              {aiFields.length > 0 && !isAllVerified && (
                <span className="text-sm font-semibold text-amber-600 animate-pulse bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  Cần xác nhận {aiFields.length - verifiedFields.filter(f => aiFields.includes(f)).length} trường dữ liệu AI
                </span>
              )}
              {aiFields.length > 0 && isAllVerified && (
                <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle className="w-4 h-4 inline mr-1" /> Đã xác nhận toàn bộ
                </span>
              )}
              <Button 
                onClick={handleSave} 
                disabled={saving || !isAllVerified}
                className="gap-2 shadow-sm font-semibold h-9 disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu dữ liệu'}
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'data_entry' && (
          <div className="h-full flex flex-col lg:flex-row gap-4 p-3 md:p-4 max-w-screen-2xl mx-auto">
            
            {/* LEFT COLUMN: Documents & OCR (Sticky/Fixed View) */}
            <div className="lg:w-5/12 flex flex-col gap-3 bg-slate-50 h-full rounded-lg border border-slate-200 overflow-hidden">
              <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Tài liệu & OCR</h2>
                {selectedDocKey && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDocKey(null)} className="h-8 py-1 px-2 text-xs text-slate-500 hover:text-slate-800">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Quay lại
                  </Button>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden relative">
                {selectedDocKey ? (
                  // Image Viewer Mode with Side Panel
                  <div className="w-full h-full flex bg-slate-200">
                    {/* Side panel: Thumbnail tabs */}
                    <div className="w-20 shrink-0 bg-slate-100 border-r border-slate-300 flex flex-col gap-2 p-2 overflow-y-auto custom-scrollbar">
                      {DOCUMENTS.map(doc => {
                        const isSelected = doc.key === selectedDocKey;
                        const url = customer[doc.urlField];
                        return (
                          <div 
                            key={doc.key} 
                            onClick={() => setSelectedDocKey(doc.key)}
                            className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 transition-all flex items-center justify-center bg-white ${isSelected ? 'border-indigo-600 shadow-md ring-2 ring-indigo-200' : 'border-slate-300 hover:border-indigo-400'}`}
                            title={doc.title}
                          >
                            {url ? (
                              <img src={url} alt={doc.title} className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-6 h-6 text-slate-300" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Main Viewer Area */}
                    <div className="flex-1 p-4 relative overflow-y-auto custom-scrollbar flex items-center justify-center">
                      {customer[DOCUMENTS.find(d => d.key === selectedDocKey)?.urlField || ''] ? (
                        <img src={customer[DOCUMENTS.find(d => d.key === selectedDocKey)?.urlField || '']} alt="Preview" className="max-w-full object-contain drop-shadow-md rounded" />
                      ) : (
                        <div className="text-center">
                          <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm">Chưa có ảnh</p>
                          <Button 
                            variant="outline" size="sm" className="mt-4"
                            onClick={() => document.getElementById(`upload-preview-${selectedDocKey}`)?.click()}
                          >Tải lên ngay</Button>
                          <input 
                            id={`upload-preview-${selectedDocKey}`} type="file" className="hidden" accept="image/*"
                            onChange={(e) => handleFileUpload(e, selectedDocKey, DOCUMENTS.find(d => d.key === selectedDocKey)!.urlField)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Document List Mode with Thumbnails
                  <div className="p-4 space-y-4 overflow-y-auto h-full custom-scrollbar">
                    {DOCUMENTS.map(doc => {
                      const url = customer[doc.urlField];
                      return (
                        <div key={doc.key} className="bg-white border border-slate-200 rounded-xl overflow-hidden flex shadow-sm hover:shadow-md transition-all">
                          {/* Left: Thumbnail/Upload Box */}
                          <div 
                            className="w-1/3 min-h-[100px] bg-slate-100 flex items-center justify-center cursor-pointer relative group border-r border-slate-200"
                            onClick={() => url ? setSelectedDocKey(doc.key) : document.getElementById(`upload-${doc.key}`)?.click()}
                          >
                            {url ? (
                              <>
                                <img src={url} alt={doc.title} className="w-full h-full object-cover absolute inset-0" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                  <ZoomIn className="w-6 h-6 text-white" />
                                </div>
                              </>
                            ) : (
                              <div className="text-center p-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                                <UploadCloud className="w-6 h-6 mx-auto mb-1" />
                                <span className="text-[10px] uppercase font-bold">Tải lên</span>
                              </div>
                            )}
                            <input 
                              id={`upload-${doc.key}`} type="file" className="hidden" accept="image/*"
                              onChange={(e) => handleFileUpload(e, doc.key, doc.urlField)}
                            />
                          </div>
                          
                          {/* Right: Info & Actions */}
                          <div className="w-2/3 p-4 flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-slate-800 text-sm leading-tight">{doc.title}</h3>
                              {url ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 mt-1"><CheckCircle className="w-3 h-3"/> Đã tải lên</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-1">Chưa có ảnh</span>
                              )}
                            </div>
                            
                            <div className="mt-3 flex gap-2">
                              {url && (
                                cachedOcrData[doc.key] ? (
                                  <div className="h-7 px-2 flex items-center bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-200">
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Đã trích xuất
                                  </div>
                                ) : (
                                  <Button 
                                    size="sm" variant="outline" 
                                    className="h-7 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                                    onClick={() => handleExtractOcr(doc.key, url)}
                                    disabled={ocrStatus[doc.key] === 'processing'}
                                  >
                                    {ocrStatus[doc.key] === 'processing' ? 'Đang trích xuất...' : 'Trích xuất AI'}
                                  </Button>
                                )
                              )}
                              {url && (
                                <Button 
                                  size="sm" variant="ghost" 
                                  className="h-7 text-xs text-slate-500"
                                  onClick={() => document.getElementById(`upload-${doc.key}`)?.click()}
                                >Thay ảnh</Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Data Entry Form (Scrollable) */}
            <div className="lg:w-7/12 h-full overflow-y-auto custom-scrollbar pr-2 pb-10">
              <div className="space-y-6 bg-white p-4 md:p-5 rounded-lg border border-slate-200 shadow-sm">
                
                {/* Section 1: Thông tin cá nhân */}
                <section>
                  <h2 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">1. Thông tin cá nhân</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <VerifiedInput fieldKey="fullName" aiFields={aiFields} verifiedFields={verifiedFields} hasError={hasErr('fullName')} label="Họ và tên" value={customer.fullName} onChange={(e: any) => handleChange('fullName', e.target.value)} onToggleVerify={() => toggleVerify('fullName')} onSyncFromAI={() => handleSyncFieldFromAI('zairyuFront', 'fullName', 'fullName')} />
                    <VerifiedInput fieldKey="fullNameFurigana" aiFields={aiFields} verifiedFields={verifiedFields} hasError={hasErr('fullNameFurigana')} label="Furigana (Katakana)" value={customer.fullNameFurigana} onChange={(e: any) => handleChange('fullNameFurigana', e.target.value)} onToggleVerify={() => toggleVerify('fullNameFurigana')} onSyncFromAI={() => handleSyncFieldFromAI('nenkinBook', 'fullNameFurigana', 'fullNameFurigana')} />
                    <VerifiedInput fieldKey="dob" aiFields={aiFields} verifiedFields={verifiedFields} hasError={hasErr('dob')} label="Ngày sinh" type="date" value={customer.dob ? new Date(customer.dob).toISOString().split('T')[0] : ''} onChange={(e: any) => handleChange('dob', e.target.value)} onToggleVerify={() => toggleVerify('dob')} onSyncFromAI={() => handleSyncFieldFromAI('zairyuFront', 'dob', 'dob')} />
                    <VerifiedInput fieldKey="nenkinNumber" aiFields={aiFields} verifiedFields={verifiedFields} hasError={hasErr('nenkinNumber')} label="Mã số thẻ Nenkin" value={customer.nenkinNumber} onChange={(e: any) => handleChange('nenkinNumber', e.target.value)} onToggleVerify={() => toggleVerify('nenkinNumber')} onSyncFromAI={() => handleSyncFieldFromAI('nenkinBook', 'nenkinNumber', 'nenkinNumber')} />
                    <VerifiedInput fieldKey="cardNumber" aiFields={aiFields} verifiedFields={verifiedFields} hasError={hasErr('cardNumber')} label="Mã số thẻ ngoại kiều" value={customer.cardNumber} onChange={(e: any) => handleChange('cardNumber', e.target.value)} onToggleVerify={() => toggleVerify('cardNumber')} onSyncFromAI={() => handleSyncFieldFromAI('zairyuFront', 'cardNumber', 'cardNumber')} />
                    <InputField label="Mã số cá nhân (My Number)" value={customer.myNumber} onChange={(e: any) => handleChange('myNumber', e.target.value)} />
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Giới tính</label>
                      <select value={customer.sex || ''} onChange={(e: any) => handleChange('sex', e.target.value)} className="w-full h-8 px-2.5 py-1 border-slate-300 rounded-md text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm">
                        <option value="">-- Chọn --</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                    <InputField label="Quốc tịch" value={customer.nationality} onChange={(e: any) => handleChange('nationality', e.target.value)} />
                    <InputField label="Số điện thoại" type="tel" value={customer.phone} onChange={(e: any) => handleChange('phone', e.target.value)} />
                    <InputField label="Nghề nghiệp" value={customer.occupation} onChange={(e: any) => handleChange('occupation', e.target.value)} />
                    <InputField label="Nơi sinh" value={customer.placeOfBirth} onChange={(e: any) => handleChange('placeOfBirth', e.target.value)} />
                    <InputField label="Tên chủ hộ" value={customer.headOfHouseholdName} onChange={(e: any) => handleChange('headOfHouseholdName', e.target.value)} />
                    <InputField label="Quan hệ với chủ hộ" value={customer.relationshipToHead} onChange={(e: any) => handleChange('relationshipToHead', e.target.value)} />
                  </div>
                  {/* Sub-section: Cư trú & Xuất nhập cảnh */}
                  <div className="mt-3 p-3 bg-violet-50/30 rounded-lg border border-violet-100">
                    <h3 className="text-[13px] font-semibold text-violet-900 mb-2">Cư trú & Xuất nhập cảnh</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Có thường trú?</label>
                        <select value={customer.hasPermanentResidence === true ? 'true' : customer.hasPermanentResidence === false ? 'false' : ''} onChange={(e: any) => handleChange('hasPermanentResidence', e.target.value === '' ? null : e.target.value === 'true')} className="w-full h-8 px-2.5 py-1 border-slate-300 rounded-md text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm">
                          <option value="">-- Chọn --</option>
                          <option value="true">Có</option>
                          <option value="false">Không</option>
                        </select>
                      </div>
                      <InputField label="Ngày cấp thường trú" type="date" value={customer.permanentResidenceDate ? new Date(customer.permanentResidenceDate).toISOString().split('T')[0] : ''} onChange={(e: any) => handleChange('permanentResidenceDate', e.target.value)} />
                      <InputField label="Ngày rời Nhật (出国日)" type="date" value={customer.departureDate ? new Date(customer.departureDate).toISOString().split('T')[0] : ''} onChange={(e: any) => handleChange('departureDate', e.target.value)} />
                    </div>
                  </div>
                </section>

                {/* Section 2: Địa chỉ */}
                <section>
                  <h2 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">2. Thông tin Địa chỉ</h2>
                  <div className="space-y-3">
                    <div className="p-3 bg-indigo-50/30 rounded-lg border border-indigo-100">
                      <h3 className="text-[13px] font-semibold text-indigo-900 mb-2">Địa chỉ tại Nhật (Zairyu)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <VerifiedInput fieldKey="postalCode" aiFields={aiFields} verifiedFields={verifiedFields} hasError={hasErr('postalCode')} label="Mã bưu điện" value={customer.postalCode} onChange={(e: any) => handleChange('postalCode', e.target.value)} onToggleVerify={() => toggleVerify('postalCode')} onSyncFromAI={() => handleSyncFieldFromAI('zairyuFront', 'postalCode', 'postalCode')} />
                        <VerifiedInput fieldKey="zairyuAddress" aiFields={aiFields} verifiedFields={verifiedFields} hasError={hasErr('zairyuAddress')} label="Địa chỉ đầy đủ" value={customer.zairyuAddress} onChange={(e: any) => handleChange('zairyuAddress', e.target.value)} onToggleVerify={() => toggleVerify('zairyuAddress')} onSyncFromAI={() => handleSyncFieldFromAI('zairyuFront', 'address', 'zairyuAddress')} />
                      </div>
                    </div>
                    
                    {/* Cục Thuế ngay dưới Zairyu */}
                    <div className="p-3 bg-amber-50/30 rounded-lg border border-amber-100">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-amber-900">Thông tin Cục Thuế liên kết</h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs bg-white text-amber-700 hover:bg-amber-50 hover:text-amber-800 border-amber-200" onClick={() => window.open(`https://www.nta.go.jp/about/organization/access/map.htm#a-1`, '_blank')}>Tìm NTA thủ công</Button>
                          <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium border-0" onClick={() => {
                            let zipCode = customer.postalCode || customer.taxOffice?.postalCode || customer.taxOffice?.zipCode || '';
                            zipCode = zipCode.replace(/[-\s]/g, '');
                            if (zipCode.length === 7) {
                              // Tự động cào số điện thoại ngầm
                              fetch(`/api/nta-scrape?zip=${zipCode}`)
                                .then(res => res.json())
                                .then(data => {
                                  if (data.consultationPhone || data.generalPhone) {
                                    setCustomer((prev: any) => ({
                                      ...prev,
                                      taxOffice: {
                                        ...prev.taxOffice,
                                        consultationPhone: data.consultationPhone || prev.taxOffice?.consultationPhone,
                                        generalPhone: data.generalPhone || prev.taxOffice?.generalPhone
                                      }
                                    }));
                                  }
                                }).catch(err => console.error("Auto scrape error:", err));

                              const form = document.createElement('form');
                              form.method = 'POST';
                              form.action = 'https://www.nta.go.jp/cgi-bin/zeimusho/kensaku/kensakuprocess.php';
                              form.target = '_blank';
                              form.acceptCharset = 'EUC-JP';
                              
                              const kstype = document.createElement('input'); kstype.type = 'hidden'; kstype.name = 'KSTYPE'; kstype.value = 'ksz'; form.appendChild(kstype);
                              const kszc1 = document.createElement('input'); kszc1.type = 'hidden'; kszc1.name = 'kszc1'; kszc1.value = zipCode.substring(0, 3); form.appendChild(kszc1);
                              const kszc2 = document.createElement('input'); kszc2.type = 'hidden'; kszc2.name = 'kszc2'; kszc2.value = zipCode.substring(3, 7); form.appendChild(kszc2);
                              
                              document.body.appendChild(form);
                              form.submit();
                              document.body.removeChild(form);
                            } else if (customer.postalCode || customer.zairyuAddress) {
                              window.open(`https://www.google.com/search?q=${encodeURIComponent('site:nta.go.jp/about/organization/ 税務署 ' + (customer.postalCode || customer.zairyuAddress || ''))}`, '_blank');
                            } else {
                              alert('Vui lòng nhập Mã bưu điện (7 chữ số) để tra cứu tự động qua NTA!');
                            }
                          }}>Tra cứu Cục Thuế</Button>
                        </div>
                      </div>
                      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded mb-3 leading-relaxed">
                        <span className="font-bold">⚠️ Lưu ý:</span> AI sẽ tự điền toàn bộ thông tin Cục Thuế từ ảnh (Tên, Mã BĐ, Địa chỉ). Mã bưu điện được xác minh tự động qua API. Bấm &quot;Tra cứu Cục Thuế&quot; để đối chiếu với NTA rồi xác nhận (✓).
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <VerifiedInput fieldKey="taxOfficeName" aiFields={aiFields} verifiedFields={verifiedFields} hasError={hasErr('taxOfficeName')} label="Tên Cục Thuế" value={customer.taxOffice?.name} onChange={(e: any) => setCustomer((prev: any) => ({ ...prev, taxOffice: { ...prev.taxOffice, name: e.target.value } }))} onToggleVerify={() => toggleVerify('taxOfficeName')} onSyncFromAI={() => handleSyncFieldFromAI('zairyuFront', 'name', 'taxOfficeName', true)} />
                        <VerifiedInput fieldKey="taxOfficeZipCode" aiFields={aiFields} verifiedFields={verifiedFields} hasError={hasErr('taxOfficeZipCode')} label="Mã bưu điện Cục Thuế" value={customer.taxOffice?.postalCode || customer.taxOffice?.zipCode || ''} onChange={(e: any) => setCustomer((prev: any) => ({ ...prev, taxOffice: { ...prev.taxOffice, postalCode: e.target.value, zipCode: e.target.value } }))} onToggleVerify={() => toggleVerify('taxOfficeZipCode')} onSyncFromAI={() => handleSyncFieldFromAI('zairyuFront', 'postalCode', 'taxOfficeZipCode', true)} />
                        <div className="md:col-span-2">
                          <VerifiedInput fieldKey="taxOfficeAddress" aiFields={aiFields} verifiedFields={verifiedFields} hasError={hasErr('taxOfficeAddress')} label="Địa chỉ Cục Thuế" value={customer.taxOffice?.address} onChange={(e: any) => setCustomer((prev: any) => ({ ...prev, taxOffice: { ...prev.taxOffice, address: e.target.value } }))} onToggleVerify={() => toggleVerify('taxOfficeAddress')} onSyncFromAI={() => handleSyncFieldFromAI('zairyuFront', 'address', 'taxOfficeAddress', true)} />
                        </div>
                        
                        {/* Mailing fields - manual input only */}
                        <div className="md:col-span-2 border-t border-amber-200/50 mt-2 pt-4">
                          <h4 className="text-xs font-bold text-amber-800 mb-3">Thông tin bưu gửi & Liên hệ (Nhập tay từ NTA)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Tên nơi nhận (申告書等の郵送先)" value={customer.taxOffice?.mailingName} onChange={(e: any) => setCustomer((prev: any) => ({ ...prev, taxOffice: { ...prev.taxOffice, mailingName: e.target.value } }))} />
                            <InputField label="Mã bưu điện nhận thư (郵送先)" value={customer.taxOffice?.mailingPostalCode} onChange={(e: any) => setCustomer((prev: any) => ({ ...prev, taxOffice: { ...prev.taxOffice, mailingPostalCode: e.target.value } }))} />
                            <div className="md:col-span-2">
                              <InputField label="Địa chỉ nhận thư (郵送先)" value={customer.taxOffice?.mailingAddress} onChange={(e: any) => setCustomer((prev: any) => ({ ...prev, taxOffice: { ...prev.taxOffice, mailingAddress: e.target.value } }))} />
                            </div>
                            <div className="md:col-span-2">
                              <InputField label="Khu vực quản lý (管轄区域)" value={customer.taxOffice?.jurisdiction} onChange={(e: any) => setCustomer((prev: any) => ({ ...prev, taxOffice: { ...prev.taxOffice, jurisdiction: e.target.value } }))} />
                            </div>
                            <InputField label="SĐT tư vấn (電話相談の方)" value={customer.taxOffice?.consultationPhone} onChange={(e: any) => setCustomer((prev: any) => ({ ...prev, taxOffice: { ...prev.taxOffice, consultationPhone: e.target.value } }))} />
                            <InputField label="SĐT hành chính (ご用の方)" value={customer.taxOffice?.generalPhone} onChange={(e: any) => setCustomer((prev: any) => ({ ...prev, taxOffice: { ...prev.taxOffice, generalPhone: e.target.value } }))} />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-emerald-50/30 rounded-lg border border-emerald-100">
                      <h3 className="text-[13px] font-semibold text-emerald-900 mb-2">Địa chỉ tại Việt Nam</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <InputField label="Tỉnh / Thành phố" value={customer.overseasProvince} onChange={(e: any) => handleChange('overseasProvince', e.target.value)} />
                        <InputField label="Quận / Huyện" value={customer.overseasCity} onChange={(e: any) => handleChange('overseasCity', e.target.value)} />
                        <div className="md:col-span-2">
                          <InputField label="Tên đường / Thôn xóm" value={customer.overseasStreet} onChange={(e: any) => handleChange('overseasStreet', e.target.value)} />
                        </div>
                        <InputField label="Quốc gia" value={customer.overseasCountry || 'VIET NAM'} onChange={(e: any) => handleChange('overseasCountry', e.target.value)} />
                        <InputField label="Mã bưu điện nước ngoài" value={customer.overseasPostalCode} onChange={(e: any) => handleChange('overseasPostalCode', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 3: Ngân hàng */}
                <section>
                  <h2 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">3. Ngân hàng nhận tiền Lần 1</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <VerifiedInput fieldKey="bankName" aiFields={aiFields} verifiedFields={verifiedFields} hasError={hasErr('bankName')} label="Tên Ngân hàng" value={customer.bankName} onChange={(e: any) => handleChange('bankName', e.target.value)} onToggleVerify={() => toggleVerify('bankName')} onSyncFromAI={() => handleSyncFieldFromAI('bankPassbook', 'bankName', 'bankName')} />
                    <VerifiedInput fieldKey="branchName" aiFields={aiFields} verifiedFields={verifiedFields} hasError={hasErr('branchName')} label="Tên Chi nhánh" value={customer.branchName} onChange={(e: any) => handleChange('branchName', e.target.value)} onToggleVerify={() => toggleVerify('branchName')} onSyncFromAI={() => handleSyncFieldFromAI('bankPassbook', 'branchName', 'branchName')} />
                    <InputField label="Thành phố chi nhánh" value={customer.bankBranchCity} onChange={(e: any) => handleChange('bankBranchCity', e.target.value)} />
                    <VerifiedInput fieldKey="accountName" aiFields={aiFields} verifiedFields={verifiedFields} hasError={hasErr('accountName')} label="Tên chủ TK (Romaji/Katakana)" value={customer.accountName} onChange={(e: any) => handleChange('accountName', e.target.value)} onToggleVerify={() => toggleVerify('accountName')} onSyncFromAI={() => handleSyncFieldFromAI('bankPassbook', 'accountName', 'accountName')} />
                    <VerifiedInput fieldKey="swiftCode" aiFields={aiFields} verifiedFields={verifiedFields} hasError={hasErr('swiftCode')} label="Swift Code / BSB" value={customer.swiftCode} onChange={(e: any) => handleChange('swiftCode', e.target.value)} onToggleVerify={() => toggleVerify('swiftCode')} onSyncFromAI={() => handleSyncFieldFromAI('bankPassbook', 'swiftCode', 'swiftCode')} />
                    <VerifiedInput fieldKey="accountNumber" aiFields={aiFields} verifiedFields={verifiedFields} hasError={hasErr('accountNumber')} label="Số tài khoản" value={customer.accountNumber} onChange={(e: any) => handleChange('accountNumber', e.target.value)} onToggleVerify={() => toggleVerify('accountNumber')} onSyncFromAI={() => handleSyncFieldFromAI('bankPassbook', 'accountNumber', 'accountNumber')} />
                    <InputField label="Tên chủ TK (Katakana)" value={customer.accountNameKatakana} onChange={(e: any) => handleChange('accountNameKatakana', e.target.value)} />
                    <InputField label="Địa chỉ chi nhánh NH" value={customer.bankBranchAddress} onChange={(e: any) => handleChange('bankBranchAddress', e.target.value)} />
                    <InputField label="Quốc gia ngân hàng" value={customer.bankCountry} onChange={(e: any) => handleChange('bankCountry', e.target.value)} />
                  </div>
                </section>

                {/* Section 4: Lịch sử làm việc */}
                <section>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                    <h2 className="text-base font-bold text-slate-800">4. Lịch sử làm việc</h2>
                    <Button 
                      variant="outline" size="sm" className="h-8 gap-1"
                      onClick={() => handleChange('workHistories', [...(customer.workHistories || []), { companyName: '', companyAddress: '' }])}
                    >
                      <Plus className="w-4 h-4"/> Thêm công ty
                    </Button>
                  </div>
                  
                  {(!customer.workHistories || customer.workHistories.length === 0) && (
                    <p className="text-sm text-slate-500 italic">Chưa có dữ liệu công ty.</p>
                  )}
                  
                  {customer.workHistories?.map((wh: any, index: number) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-xl bg-slate-50 mb-4 relative">
                      <button 
                        onClick={() => {
                          const newWh = [...customer.workHistories];
                          newWh.splice(index, 1);
                          handleChange('workHistories', newWh);
                        }}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                      ><X className="w-4 h-4"/></button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <InputField label="Tên công ty" value={wh.companyName} onChange={(e: any) => {
                            const newWh = [...customer.workHistories];
                            newWh[index].companyName = e.target.value;
                            handleChange('workHistories', newWh);
                          }} />
                        </div>
                        <div className="md:col-span-2">
                          <InputField label="Địa chỉ công ty" value={wh.companyAddress} onChange={(e: any) => {
                            const newWh = [...customer.workHistories];
                            newWh[index].companyAddress = e.target.value;
                            handleChange('workHistories', newWh);
                          }} />
                        </div>
                        <InputField type="date" label="Từ ngày" value={wh.startDate ? new Date(wh.startDate).toISOString().split('T')[0] : ''} onChange={(e: any) => {
                            const newWh = [...customer.workHistories];
                            newWh[index].startDate = e.target.value;
                            handleChange('workHistories', newWh);
                          }} />
                        <InputField type="date" label="Đến ngày" value={wh.endDate ? new Date(wh.endDate).toISOString().split('T')[0] : ''} onChange={(e: any) => {
                            const newWh = [...customer.workHistories];
                            newWh[index].endDate = e.target.value;
                            handleChange('workHistories', newWh);
                          }} />
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'app_details' && customer && (
          <AppDetailsTab customer={customer} />
        )}

        {activeTab === 'report' && customer && <PrintTab customer={customer} />}
      </main>
    </div>
  );
}

// Helpers
const InputField = ({ label, type = 'text', value, onChange, placeholder }: any) => (
  <div className="space-y-1">
    <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">{label}</label>
    <input 
      type={type} 
      value={value || ''} 
      onChange={onChange} 
      placeholder={placeholder}
      className="w-full h-8 px-2.5 py-1 border-slate-300 rounded-md text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm" 
    />
  </div>
);

const VerifiedInput = ({ label, type = 'text', value, onChange, hasError, fieldKey, aiFields = [], verifiedFields = [], onToggleVerify, placeholder, onSyncFromAI }: any) => {
  const isAiExtracted = aiFields.includes(fieldKey);
  const isVerified = verifiedFields.includes(fieldKey);
  const needsAction = isAiExtracted && !isVerified;

  return (
    <div className="space-y-1 relative">
      <div className="flex justify-between items-center h-4">
        <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">{label}</label>
        <div className="flex space-x-1">
          {onSyncFromAI && (
            <button
              type="button"
              onClick={onSyncFromAI}
              disabled={isVerified}
              title={isVerified ? "Đã xác nhận, mở khóa (bấm ✓) để lấy lại AI" : "Điền dữ liệu đã trích xuất từ ảnh"}
              className={`flex items-center justify-center w-5 h-5 rounded transition-all ${isVerified ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
            >
              <Wand2 className="w-3 h-3" />
            </button>
          )}
          {isAiExtracted && (
            <button 
              type="button"
              onClick={onToggleVerify}
              title={isVerified ? "Đã đối chiếu" : "Bấm để xác nhận"}
              className={`flex items-center justify-center w-5 h-5 rounded transition-all ${
                isVerified 
                  ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                  : 'bg-amber-100 text-amber-600 hover:bg-amber-200 shadow-[0_0_0_2px_rgba(251,191,36,0.3)] animate-pulse'
              }`}
            >
              <CheckCircle className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <input 
        type={type} 
        value={value || ''} 
        onChange={onChange} 
        placeholder={placeholder}
        className={`w-full h-8 px-2.5 py-1 border-slate-300 rounded-md text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm ${hasError ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : ''} ${isVerified ? 'border-emerald-300 bg-emerald-50/20 text-emerald-900 font-medium' : ''}`} 
      />
    </div>
  );
};

const DocumentCard = ({ title, url, onView }: any) => (
  <Card className="p-4 border border-slate-200 flex flex-col bg-white">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${url ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
        <FileText className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {url ? (
          <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Đã tải lên</p>
        ) : (
          <p className="text-xs text-slate-400">Chưa tải lên</p>
        )}
      </div>
    </div>
    {url ? (
      <Button variant="outline" size="sm" onClick={onView} className="w-full flex gap-2">
        <ZoomIn className="w-4 h-4" /> Xem ảnh trực tiếp
      </Button>
    ) : (
      <Button variant="outline" size="sm" className="w-full border-dashed bg-slate-50 text-slate-500 flex gap-2">
        <UploadCloud className="w-4 h-4" /> Tải ảnh lên
      </Button>
    )}
  </Card>
);
