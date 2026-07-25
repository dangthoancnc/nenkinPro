"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, UploadCloud, FileText, CheckCircle2, ChevronRight, X, Camera, HelpCircle, Gift, Phone, MessageSquare, AlertTriangle, Trash2, RefreshCw, KeyRound, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import DocumentCaptureOverlay from '@/components/DocumentCaptureOverlay';

// Reusable Image Preview Item with Thumbnail (Fit 100% full photo without cropping) and Red Delete Button
function ImageThumbnailItem({
  file,
  url,
  label,
  onDelete
}: {
  file: File | null;
  url: string;
  label: string;
  onDelete: () => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string>('');

  useEffect(() => {
    if (file) {
      const u = URL.createObjectURL(file);
      setObjectUrl(u);
      return () => URL.revokeObjectURL(u);
    } else if (url) {
      setObjectUrl(url);
    } else {
      setObjectUrl('');
    }
  }, [file, url]);

  if (!objectUrl) return null;

  return (
    <div className="relative border-2 border-indigo-400 rounded-xl overflow-hidden bg-slate-950 shadow-lg group my-1">
      {/* Fit 100% full photo aspect ratio without cropping so user can inspect every corner */}
      <div className="w-full flex items-center justify-center p-1.5 bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={objectUrl} alt={label} className="w-full h-auto max-h-[420px] object-contain rounded-lg shadow-md" />
      </div>
      <div className="bg-slate-900 border-t border-slate-800 p-2 flex items-center justify-between text-xs text-white">
        <div className="flex items-center gap-1.5 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate font-semibold text-slate-200 text-xs">{file ? file.name : label}</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg transition-all flex items-center gap-1 text-xs font-bold shrink-0 shadow-sm"
          title="Xóa ảnh này"
        >
          <Trash2 className="w-3.5 h-3.5" /> Xóa ảnh
        </button>
      </div>
    </div>
  );
}

function WizardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get('ref') || '';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [createdData, setCreatedData] = useState<{ code: string; cardNumber: string | null; referralType: string | null } | null>(null);
  const [existingCustomerData, setExistingCustomerData] = useState<{ customerId?: string; customerCode: string; applicationId?: string; message: string } | null>(null);
  const [customerInputCode, setCustomerInputCode] = useState('');

  // Personal & Contact Info State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [zaloContact, setZaloContact] = useState('');
  const [facebookContact, setFacebookContact] = useState('');
  const [dob, setDob] = useState('');
  const [refCode, setRefCode] = useState(ref || '');
  const [vnAddress, setVnAddress] = useState('');

  // Zairyu Card (Front & Back) State
  const [zairyuFront, setZairyuFront] = useState<File | null>(null);
  const [zairyuFrontUrl, setZairyuFrontUrl] = useState('');
  const [zairyuBack, setZairyuBack] = useState<File | null>(null);
  const [zairyuBackUrl, setZairyuBackUrl] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [zairyuAddress, setZairyuAddress] = useState('');

  // Passport & Nenkin Book State
  const [passport, setPassport] = useState<File | null>(null);
  const [passportUrl, setPassportUrl] = useState('');
  const [nenkinBook, setNenkinBook] = useState<File | null>(null);
  const [nenkinBookUrl, setNenkinBookUrl] = useState('');
  const [nenkinNumber, setNenkinNumber] = useState('');

  // Bank Passbook State (Up to 2 pages)
  const [bankPassbook1, setBankPassbook1] = useState<File | null>(null);
  const [bankPassbook1Url, setBankPassbook1Url] = useState('');
  const [bankPassbook2, setBankPassbook2] = useState<File | null>(null);
  const [bankPassbook2Url, setBankPassbook2Url] = useState('');

  // Security Photo State
  const [securityPhoto, setSecurityPhoto] = useState<File | null>(null);
  const [securityPhotoUrl, setSecurityPhotoUrl] = useState('');

  // Capture Overlay State
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureType, setCaptureType] = useState('');

  const [draftId] = useState(() => {
    if (typeof window !== 'undefined') {
      let d = sessionStorage.getItem('onboarding_draft_id');
      if (!d) {
        d = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        sessionStorage.setItem('onboarding_draft_id', d);
      }
      return d;
    }
    return `draft_${Date.now()}`;
  });

  const handleTriggerCapture = (type: string, inputId: string) => {
    const isDesktop = window.innerWidth > 768;
    if (isDesktop) {
      document.getElementById(inputId)?.click();
    } else {
      setCaptureType(type);
      setCaptureOpen(true);
    }
  };

  const applyExtracted = (docType: string, rawExt: any) => {
    let ext = rawExt;
    if (typeof ext === 'string') {
      try { ext = JSON.parse(ext); } catch (e) {}
    }
    if (!ext || typeof ext !== 'object') return;

    if (docType === 'zairyuFront' || docType === 'zairyuBack') {
      const rawName = ext.fullName || ext.name || ext.fullNameKanji || '';
      const rawCard = ext.cardNumber || ext.card_number || ext.number || '';
      const rawAddr = ext.address || ext.residenceAddress || ext.zairyuAddress || '';
      const rawDob = ext.dob || ext.dateOfBirth || ext.birthDate || '';

      if (rawName) setFullName(String(rawName).toUpperCase().trim());
      if (rawCard) setCardNumber(String(rawCard).toUpperCase().trim());
      if (rawAddr) setZairyuAddress(String(rawAddr).trim());

      if (rawDob) {
        const dobStr = String(rawDob).trim();
        const match = dobStr.match(/(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})/);
        if (match) {
          setDob(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`);
        } else {
          const d = new Date(dobStr);
          if (!isNaN(d.getTime())) {
            setDob(d.toISOString().split('T')[0]);
          } else {
            setDob(dobStr);
          }
        }
      }
    } else if (docType === 'passport') {
      const name = ext.fullName || `${ext.lastName || ''} ${ext.firstName || ''}`.trim();
      if (name) setFullName(name.toUpperCase().trim());
      if (ext.passportNumber || ext.cardNumber) setCardNumber(String(ext.passportNumber || ext.cardNumber).toUpperCase().trim());
      if (ext.dob) {
        const dobStr = String(ext.dob).trim();
        const match = dobStr.match(/(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})/);
        if (match) setDob(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`);
        else setDob(dobStr);
      }
    } else if (docType === 'nenkin') {
      if (ext.nenkinNumber) setNenkinNumber(String(ext.nenkinNumber).trim());
    }
  };

  const runOcrExtract = async (documentType: string, fileOrUrl: File | string) => {
    setLoading(true);
    setOcrError(null);

    try {
      const fd = new FormData();
      fd.append('documentType', documentType);
      fd.append('action', typeof fileOrUrl === 'string' ? 'extract' : 'uploadAndExtract');
      fd.append('source', 'onboarding');
      fd.append('customerId', draftId);

      if (typeof fileOrUrl === 'string') {
        fd.append('imageUrl', fileOrUrl);
      } else {
        fd.append('file', fileOrUrl);
      }

      if (securityPhoto && documentType === 'zairyuFront') {
        fd.append('securityFile', securityPhoto);
      }

      const res = await fetch('/api/ocr', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) {
        setOcrError('Đang xử lý dữ liệu.');
        return;
      }

      if (data.isExistingCustomer) {
        setExistingCustomerData({
          customerId: data.existingCustomerId || undefined,
          customerCode: data.existingCustomerCode,
          message: data.existingCustomerMessage
        });
        setCustomerInputCode(data.existingCustomerCode || '');
      }

      if (data.publicUrl) {
        if (documentType === 'zairyuFront') setZairyuFrontUrl(data.publicUrl);
        else if (documentType === 'zairyuBack') setZairyuBackUrl(data.publicUrl);
        else if (documentType === 'passport') setPassportUrl(data.publicUrl);
        else if (documentType === 'nenkin') setNenkinBookUrl(data.publicUrl);
      }

      if (data.securityPhotoUrl) {
        setSecurityPhotoUrl(data.securityPhotoUrl);
      }

      if (data.extractedData) {
        applyExtracted(documentType, data.extractedData);
      }
    } catch (err: any) {
      console.error('OCR Extract Error:', err);
      setOcrError('Đang xử lý dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const processZairyuFrontOcr = (file: File) => {
    runOcrExtract('zairyuFront', file);
  };

  const handleCaptureSubmit = (docFile: File, secFile?: File) => {
    if (secFile && !securityPhoto) {
      setSecurityPhoto(secFile);
    }
    if (captureType === 'zairyuFront') {
      setZairyuFront(docFile);
      processZairyuFrontOcr(docFile);
    } else if (captureType === 'zairyuBack') {
      setZairyuBack(docFile);
    } else if (captureType === 'passport') {
      setPassport(docFile);
    } else if (captureType === 'nenkin') {
      setNenkinBook(docFile);
    } else if (captureType === 'bank1') {
      setBankPassbook1(docFile);
    } else if (captureType === 'bank2') {
      setBankPassbook2(docFile);
    }
    setCaptureOpen(false);
  };

  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleUploadSingleFile = async (file: File, documentType: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('action', 'upload');
    fd.append('documentType', documentType);
    fd.append('source', 'onboarding');
    fd.append('customerId', draftId);

    const res = await fetch('/api/ocr', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Tải lên ${documentType} thất bại`);
    return data.publicUrl;
  };

  // STEP 1 HANDLER: Zairyu Card + OCR + Duplicate Check
  const handleNextStep1 = async () => {
    setGeneralError(null);
    setOcrError(null);

    if (!zairyuFront && !zairyuFrontUrl && !cardNumber.trim()) {
      setGeneralError('Quý khách vui lòng tải/chụp mặt trước Thẻ Ngoại Kiều (Zairyu Card) hoặc nhập Số thẻ.');
      return;
    }
    if (!fullName.trim()) {
      setGeneralError('Quý khách vui lòng xác nhận Họ và Tên.');
      return;
    }
    if (!phone.trim() && !zaloContact.trim()) {
      setGeneralError('Quý khách vui lòng nhập Số điện thoại hoặc Zalo để nhân viên thuận tiện liên hệ.');
      return;
    }

    setLoading(true);
    try {
      // Duplicate check API call
      const res = await fetch('/api/onboarding/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardNumber, phone, fullName })
      });
      const data = await res.json();

      if (data.isExisting) {
        setExistingCustomerData({
          customerId: data.customerId || undefined,
          customerCode: data.customerCode,
          applicationId: data.applicationId || undefined,
          message: data.message
        });
        setCustomerInputCode(data.customerCode || '');
        setLoading(false);
        return;
      }

      // Upload back image if provided
      if (zairyuBack && !zairyuBackUrl) {
        const bUrl = await handleUploadSingleFile(zairyuBack, 'zairyuBack').catch(console.error);
        if (bUrl) setZairyuBackUrl(bUrl);
      }

      setStep(2);
    } catch (err) {
      console.error('Step 1 Next Error:', err);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 HANDLER: Passport & Nenkin Book
  const handleNextStep2 = async () => {
    setLoading(true);
    setGeneralError(null);
    try {
      if (passport && !passportUrl) {
        const pUrl = await handleUploadSingleFile(passport, 'passport');
        setPassportUrl(pUrl);
      }
      if (nenkinBook && !nenkinBookUrl) {
        const nUrl = await handleUploadSingleFile(nenkinBook, 'nenkin');
        setNenkinBookUrl(nUrl);
      }
      setStep(3);
    } catch (err: unknown) {
      console.error(err);
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 HANDLER: Bank Passbook & Extra Contacts
  const handleNextStep3 = async () => {
    setLoading(true);
    setGeneralError(null);
    try {
      if (bankPassbook1 && !bankPassbook1Url) {
        const b1 = await handleUploadSingleFile(bankPassbook1, 'bankPassbook_0');
        setBankPassbook1Url(b1);
      }
      if (bankPassbook2 && !bankPassbook2Url) {
        const b2 = await handleUploadSingleFile(bankPassbook2, 'bankPassbook_1');
        setBankPassbook2Url(b2);
      }
      setStep(4);
    } catch (err: unknown) {
      console.error(err);
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  // STEP 4 HANDLER: Final Submit
  const handleSubmit = async () => {
    setLoading(true);
    setGeneralError(null);
    setExistingCustomerData(null);
    try {
      const bankUrls: string[] = [];
      if (bankPassbook1Url) bankUrls.push(bankPassbook1Url);
      if (bankPassbook1 && !bankPassbook1Url) {
        const url1 = await handleUploadSingleFile(bankPassbook1, 'bankPassbook_0').catch(console.error);
        if (url1 && !bankUrls.includes(url1)) bankUrls.push(url1);
      }

      if (bankPassbook2Url) bankUrls.push(bankPassbook2Url);
      if (bankPassbook2 && !bankPassbook2Url) {
        const url2 = await handleUploadSingleFile(bankPassbook2, 'bankPassbook_1').catch(console.error);
        if (url2 && !bankUrls.includes(url2)) bankUrls.push(url2);
      }

      const payload = {
        fullName,
        phone,
        zaloContact,
        facebookContact,
        dob,
        ref: refCode,
        zairyuFrontUrl,
        zairyuBackUrl,
        passportUrl,
        nenkinBookUrl,
        nenkinNumber,
        bankPassbookUrl: bankUrls[0] || '',
        bankPassbookUrls: bankUrls,
        cardNumber,
        zairyuAddress,
        vnAddress,
        securityPhotoUrl,
        draftId,
      };

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.isExistingCustomer || res.status === 409) {
        setExistingCustomerData({
          customerId: data.customerId || undefined,
          customerCode: data.customerCode || 'KH-XXXXXX',
          message: data.error || `Hồ sơ của quý khách (${fullName}) đã tồn tại trong hệ thống. Vì lý do bảo mật, vui lòng Đăng Nhập để xem/bổ sung tài liệu.`
        });
        setCustomerInputCode(data.customerCode || '');
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi gửi hồ sơ');
      }

      setCreatedData({
        code: data.customer.code,
        cardNumber: data.customer.cardNumber,
        referralType: data.customer.referralType
      });
      sessionStorage.removeItem('onboarding_draft_id');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('tồn tại') || msg.includes('duplicate') || msg.includes('P2002') || msg.includes('KH-')) {
        const codeMatch = msg.match(/KH-[A-Z0-9]+/);
        const matchedCode = codeMatch ? codeMatch[0] : 'Đã tồn tại';
        setExistingCustomerData({
          customerCode: matchedCode,
          message: `Hồ sơ của quý khách (${fullName}) đã tồn tại trong hệ thống. Vì lý do bảo mật, quý khách vui lòng Đăng Nhập Cổng Khách Hàng để xem hoặc bổ sung tài liệu.`
        });
        setCustomerInputCode(matchedCode);
      } else {
        setGeneralError('Hệ thống đang xử lý hoặc kết nối chập chờn. Quý khách vui lòng thử lại sau ít phút hoặc liên hệ Nhân viên qua Zalo để được hỗ trợ trực tiếp!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 md:p-8">
      {/* Capture Overlay Modal */}
      <DocumentCaptureOverlay
        isOpen={captureOpen}
        documentType={captureType}
        onCapture={handleCaptureSubmit}
        onClose={() => setCaptureOpen(false)}
      />

      {/* Header */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-md">
            VN
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm md:text-base leading-tight">VietNenkin Portal</h1>
            <p className="text-[11px] text-slate-500">Nộp hồ sơ xin hoàn thuế Nenkin tự động</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/')}
          className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Form Container */}
      <div className="max-w-xl mx-auto w-full my-auto bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden">
        {/* Progress Bar Header */}
        {!createdData && !existingCustomerData && (
          <div className="bg-slate-900 text-white p-4 border-b border-slate-800">
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-indigo-400 uppercase tracking-wider">Tự đăng ký hồ sơ (4 Bước)</span>
              <span className="text-slate-400">Bước {step} / 4</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="p-4 md:p-6 space-y-5">
          {/* GENERAL ERROR BANNER */}
          {generalError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-700 flex items-start gap-2.5 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{generalError}</div>
              <button
                type="button"
                onClick={() => setGeneralError(null)}
                className="text-red-400 hover:text-red-600 font-bold p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* EXISTING CUSTOMER PROTECTION ALERT */}
          {existingCustomerData ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Hồ Sơ Đã Tồn Tại Trong Hệ Thống!</h2>
                <p className="text-xs text-slate-500">Mã hồ sơ: <span className="font-mono font-bold text-indigo-600 text-sm">{existingCustomerData.customerCode}</span></p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 text-left leading-relaxed">
                🛡️ {existingCustomerData.message}
              </div>

              {/* Duplicate Action Options */}
              <div className="space-y-3 pt-2 text-left">
                {/* Option 1: Customer Portal Lookup */}
                <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-3.5 space-y-2">
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-indigo-600" /> Dành cho Khách Hàng:
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Mã hồ sơ (VD: KH-123456)"
                      value={customerInputCode}
                      onChange={e => setCustomerInputCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg uppercase"
                    />
                    <button
                      onClick={() => router.push(`/portal/login?code=${encodeURIComponent(customerInputCode || existingCustomerData.customerCode)}`)}
                      className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 shrink-0 transition-all shadow-sm"
                    >
                      Xem Trạng Thái
                    </button>
                  </div>
                </div>

                {/* Option 2: Staff Login Direct Access */}
                <div className="border border-slate-200 bg-slate-50 rounded-xl p-3 space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-slate-600" /> Dành cho Nhân Viên Phụ Trách:
                  </div>
                  <button
                    onClick={() => {
                      const targetId = existingCustomerData.applicationId || existingCustomerData.customerId || existingCustomerData.customerCode;
                      const targetUrl = `/applications/${targetId}`;
                      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
                    }}
                    className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400" /> Đăng Nhập Nhân Viên & Mở Hồ Sơ Này
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setExistingCustomerData(null)}
                  className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-700 text-center"
                >
                  ← Thử lại với thông tin khác
                </button>
              </div>
            </div>
          ) : createdData ? (
            /* SUCCESS SCREEN */
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Gửi Hồ Sơ Thành Công!</h2>
                <p className="text-xs text-slate-500">Thông tin của quý khách đã được ghi nhận an toàn vào hệ thống.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-left text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Mã Hồ Sơ Tra Cứu:</span>
                  <span className="font-mono font-bold text-indigo-600 text-sm">{createdData.code}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Mã PIN Đăng Nhập Portal:</span>
                  <span className="font-mono font-bold text-slate-800">{dob ? dob.slice(0, 4) : 'Năm sinh'}</span>
                </div>
                {createdData.referralType === 'CUSTOMER' && (
                  <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                    <Gift className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Quý khách được áp dụng giảm 2.000 JPY phí dịch vụ nhờ mã giới thiệu!</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Nhân viên phụ trách sẽ kiểm tra thông tin và liên hệ với quý khách qua Zalo/SĐT trong thời gian sớm nhất.
              </p>

              <button
                onClick={() => router.push('/portal/login')}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 shadow-md transition-all active:scale-[0.99]"
              >
                Đăng Nhập Cổng Tra Cứu Tiến Độ
              </button>
            </div>
          ) : (
            <>
              {/* STEP 1: Zairyu Card Upload + OCR Extraction + Confirmation + VN Contact */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base md:text-lg font-bold text-slate-900">Bước 1: Thẻ Ngoại Kiều (Zairyu Card) & Thông tin</h2>
                    <p className="text-xs text-slate-500">Vui lòng tải ảnh thẻ ngoại kiều để hệ thống tự động bóc tách thông tin.</p>
                  </div>

                  {/* Japanese Style Guidance Box */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-amber-800">
                      <HelpCircle className="w-4 h-4 text-amber-600" /> Hướng dẫn chụp ảnh chuẩn:
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                      <li>Đặt thẻ nằm phẳng trên mặt bàn có màu tương phản.</li>
                      <li>Tránh ánh đèn chiếu trực tiếp làm chói bóng hoặc che mất địa chỉ.</li>
                    </ul>
                  </div>

                  {/* Processing Status Banner */}
                  {loading && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-700 flex items-center gap-2 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                      <div>Đang xử lý dữ liệu.</div>
                    </div>
                  )}

                  {/* OCR Error Notification Banner */}
                  {ocrError && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>{ocrError}</div>
                    </div>
                  )}

                  {/* Front & Back Dropzones */}
                  <div className="space-y-3">
                    {/* Front Dropzone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mặt Trước Thẻ Ngoại Kiều *</label>
                      <input
                        id="zairyuFrontInput"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setZairyuFront(file);
                            runOcrExtract('zairyuFront', file);
                          }
                        }}
                      />

                      {zairyuFront || zairyuFrontUrl ? (
                        <ImageThumbnailItem
                          file={zairyuFront}
                          url={zairyuFrontUrl}
                          label="Mặt Trước Thẻ Ngoại Kiều"
                          onDelete={() => {
                            setZairyuFront(null);
                            setZairyuFrontUrl('');
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => handleTriggerCapture('zairyuFront', 'zairyuFrontInput')}
                          className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 rounded-xl p-4 text-center cursor-pointer transition-all"
                        >
                          <Camera className="w-8 h-8 text-indigo-500 mx-auto mb-1" />
                          <div className="text-xs font-bold text-slate-800">Chụp / Chọn Ảnh Mặt Trước</div>
                        </div>
                      )}
                    </div>

                    {/* Back Dropzone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mặt Sau Thẻ Ngoại Kiều (Tùy chọn)</label>
                      <input
                        id="zairyuBackInput"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setZairyuBack(file);
                            runOcrExtract('zairyuBack', file);
                          }
                        }}
                      />

                      {zairyuBack || zairyuBackUrl ? (
                        <ImageThumbnailItem
                          file={zairyuBack}
                          url={zairyuBackUrl}
                          label="Mặt Sau Thẻ Ngoại Kiều"
                          onDelete={() => {
                            setZairyuBack(null);
                            setZairyuBackUrl('');
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => handleTriggerCapture('zairyuBack', 'zairyuBackInput')}
                          className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 rounded-xl p-3 text-center cursor-pointer transition-all"
                        >
                          <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                          <div className="text-xs font-semibold text-slate-600">Tải Ảnh Mặt Sau (Nếu có)</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Extracted & Confirmed Personal Information Panel */}
                  <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-3">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                      <FileText className="w-4 h-4 text-indigo-600" /> Xác nhận thông tin trích xuất & Liên hệ
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Họ và Tên *</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: NGUYEN VAN A"
                        value={fullName}
                        onChange={e => setFullName(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Số thẻ ngoại kiều</label>
                        <input
                          type="text"
                          placeholder="AB12345678CD"
                          value={cardNumber}
                          onChange={e => setCardNumber(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 uppercase font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh *</label>
                        <input
                          type="date"
                          value={dob}
                          onChange={e => setDob(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-2.5 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
                          <div className="relative">
                            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              placeholder="080... hoặc SĐT VN"
                              value={phone}
                              onChange={e => setPhone(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Zalo (SĐT / Link)</label>
                          <div className="relative">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-500 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              placeholder="Zalo SĐT..."
                              value={zaloContact}
                              onChange={e => setZaloContact(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ tại Việt Nam (Nếu có)</label>
                        <input
                          type="text"
                          placeholder="Địa chỉ ở Việt Nam nếu đã về nước..."
                          value={vnAddress}
                          onChange={e => setVnAddress(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleNextStep1}
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50 shadow-md"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Đang xử lý, hãy chờ...
                      </>
                    ) : (
                      <>
                        Tiếp Theo: Hộ Chiếu & Nenkin <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* STEP 2: Passport & Nenkin Book */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base md:text-lg font-bold text-slate-900">Bước 2: Hộ Chiếu & Sổ Nenkin</h2>
                    <p className="text-xs text-slate-500">Tải ảnh hộ chiếu và sổ Nenkin (hoặc điền mã số 10 số nếu nhớ).</p>
                  </div>

                  {/* Passport Upload */}
                  <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    <label className="block text-xs font-bold text-slate-800">📘 Trang Ảnh Hộ Chiếu (Passport)</label>
                    <input
                      id="passportInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPassport(file);
                          runOcrExtract('passport', file);
                        }
                      }}
                    />

                    {passport || passportUrl ? (
                      <ImageThumbnailItem
                        file={passport}
                        url={passportUrl}
                        label="Trang Hộ Chiếu"
                        onDelete={() => {
                          setPassport(null);
                          setPassportUrl('');
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTriggerCapture('passport', 'passportInput')}
                        className="w-full py-2.5 px-3 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5"
                      >
                        <UploadCloud className="w-4 h-4 text-indigo-500" /> Tải Lên Ảnh Hộ Chiếu
                      </button>
                    )}
                  </div>

                  {/* Nenkin Book Upload */}
                  <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    <label className="block text-xs font-bold text-slate-800">📙 Sổ Nenkin HOẶC Mã Số Nenkin</label>
                    <input
                      id="nenkinInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNenkinBook(file);
                          runOcrExtract('nenkin', file);
                        }
                      }}
                    />

                    {nenkinBook || nenkinBookUrl ? (
                      <ImageThumbnailItem
                        file={nenkinBook}
                        url={nenkinBookUrl}
                        label="Sổ Nenkin"
                        onDelete={() => {
                          setNenkinBook(null);
                          setNenkinBookUrl('');
                        }}
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleTriggerCapture('nenkin', 'nenkinInput')}
                          className="py-2.5 px-3 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 truncate"
                        >
                          <UploadCloud className="w-4 h-4 text-indigo-500 shrink-0" /> Tải Ảnh Sổ
                        </button>
                        <input
                          type="text"
                          placeholder="Mã Nenkin (10 số)..."
                          value={nenkinNumber}
                          onChange={e => setNenkinNumber(e.target.value)}
                          className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="w-1/3 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all"
                    >
                      Quay Lại
                    </button>
                    <button
                      onClick={handleNextStep2}
                      disabled={loading}
                      className="w-2/3 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Đang xử lý dữ liệu.
                        </>
                      ) : (
                        <>
                          Tiếp Theo: Ngân Hàng Nhận Tiền <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Bank Passbook & Contacts */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base md:text-lg font-bold text-slate-900">Bước 3: Sổ Ngân Hàng & Kênh Liên Hệ</h2>
                    <p className="text-xs text-slate-500">Tải ảnh sổ ngân hàng nhận tiền và điền thêm các kênh liên hệ bổ sung.</p>
                  </div>

                  {/* Koyama Referral Banner */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-3 flex items-start gap-2.5">
                    <Gift className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-900 leading-snug">
                      <span className="font-bold">Ưu đãi mã giới thiệu:</span> Nhập mã giới thiệu từ bạn bè hoặc CTV để nhận ngay <span className="font-bold text-emerald-600">giảm 2.000 JPY</span> phí dịch vụ!
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Bank Passbook Page 1 */}
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Trang 1 Sổ Ngân Hàng (Tên / STK)</label>
                      <input
                        id="bankInput1"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) setBankPassbook1(file);
                        }}
                      />

                      {bankPassbook1 || bankPassbook1Url ? (
                        <ImageThumbnailItem
                          file={bankPassbook1}
                          url={bankPassbook1Url}
                          label="Trang 1 Sổ Ngân Hàng"
                          onDelete={() => {
                            setBankPassbook1(null);
                            setBankPassbook1Url('');
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => handleTriggerCapture('bank1', 'bankInput1')}
                          className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-white rounded-xl p-4 text-center cursor-pointer transition-all"
                        >
                          <UploadCloud className="w-7 h-7 text-indigo-500 mx-auto mb-1" />
                          <div className="text-xs font-bold text-slate-800">Tải Ảnh Trang 1 Sổ Ngân Hàng</div>
                        </div>
                      )}
                    </div>

                    {/* Bank Passbook Page 2 */}
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Trang 2 Sổ Ngân Hàng (Tùy chọn)</label>
                      <input
                        id="bankInput2"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) setBankPassbook2(file);
                        }}
                      />

                      {bankPassbook2 || bankPassbook2Url ? (
                        <ImageThumbnailItem
                          file={bankPassbook2}
                          url={bankPassbook2Url}
                          label="Trang 2 Sổ Ngân Hàng"
                          onDelete={() => {
                            setBankPassbook2(null);
                            setBankPassbook2Url('');
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => handleTriggerCapture('bank2', 'bankInput2')}
                          className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white rounded-xl p-3 text-center cursor-pointer transition-all"
                        >
                          <UploadCloud className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                          <div className="text-xs font-semibold text-slate-600">Tải Ảnh Trang 2 (Nếu có)</div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Facebook Messenger</label>
                        <input
                          type="text"
                          placeholder="Link m.me/..."
                          value={facebookContact}
                          onChange={e => setFacebookContact(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Mã Giới Thiệu (Tùy chọn)</label>
                        <input
                          type="text"
                          placeholder="Mã CTV / Bạn bè"
                          value={refCode}
                          onChange={e => setRefCode(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="w-1/3 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all"
                    >
                      Quay Lại
                    </button>
                    <button
                      onClick={handleNextStep3}
                      disabled={loading}
                      className="w-2/3 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Đang xử lý, hãy chờ...
                        </>
                      ) : (
                        <>
                          Tiếp Theo: Xác Nhận Hồ Sơ <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Submit */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base md:text-lg font-bold text-slate-900">Bước 4: Xác Nhận & Gửi Hồ Sơ</h2>
                    <p className="text-xs text-slate-500">Vui lòng rà soát lại thông tin trước khi hoàn tất gửi đăng ký.</p>
                  </div>

                  {/* Summary Card */}
                  <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 space-y-2.5 text-xs">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium">Họ và Tên:</span>
                      <span className="font-bold text-slate-900">{fullName || '---'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium">Số điện thoại / Zalo:</span>
                      <span className="font-bold text-slate-900">{phone || zaloContact || '---'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium">Số thẻ ngoại kiều:</span>
                      <span className="font-mono font-bold text-indigo-600">{cardNumber || '---'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium">Ngày tháng năm sinh:</span>
                      <span className="font-bold text-slate-900">{dob || '---'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Giấy tờ đính kèm:</span>
                      <div className="flex flex-wrap gap-1 justify-end font-semibold">
                        {(zairyuFront || zairyuFrontUrl) && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px]">Thẻ Ngoại Kiều</span>}
                        {(passport || passportUrl) && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px]">Hộ chiếu</span>}
                        {(nenkinBook || nenkinBookUrl || nenkinNumber) && <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px]">Nenkin</span>}
                        {(bankPassbook1 || bankPassbook1Url) && <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px]">Ngân hàng</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setStep(3)}
                      className="w-1/3 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all"
                    >
                      Quay Lại
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-2/3 py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.99]"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Đang xử lý, hãy chờ...
                        </>
                      ) : (
                        <>
                          🚀 Hoàn Tất & Gửi Hồ Sơ
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-xl mx-auto w-full text-center py-4 text-[11px] text-slate-400">
        © 2026 VietNenkin. Bảo mật thông tin chuẩn ISO/IEC 27001.
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin w-8 h-8 border-b-2 border-indigo-600 rounded-full"></div></div>}>
      <WizardContent />
    </Suspense>
  );
}
