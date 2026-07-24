"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, UploadCloud, FileText, CheckCircle2, ChevronRight, X, Camera, HelpCircle, Gift, Phone, MessageSquare, AlertTriangle, Trash2, RefreshCw, KeyRound, UserCheck, ShieldAlert } from 'lucide-react';
import DocumentCaptureOverlay from '@/components/DocumentCaptureOverlay';

// Reusable Image Preview Item with Thumbnail and Red Delete Button
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
    <div className="relative border-2 border-indigo-300 rounded-xl overflow-hidden bg-slate-900 shadow-md group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={objectUrl} alt={label} className="w-full h-36 object-contain bg-slate-950" />
      <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 backdrop-blur-xs p-1.5 flex items-center justify-between text-[11px] text-white">
        <span className="truncate font-semibold max-w-[160px]">{file ? file.name : label}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold shrink-0"
          title="Xóa ảnh này"
        >
          <Trash2 className="w-3.5 h-3.5" /> Xóa
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
  const [existingCustomerData, setExistingCustomerData] = useState<{ customerCode: string; message: string } | null>(null);

  // Step 1 State: Personal & Contact Info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [zaloContact, setZaloContact] = useState('');
  const [facebookContact, setFacebookContact] = useState('');
  const [dob, setDob] = useState('');
  const [refCode, setRefCode] = useState(ref || '');

  // Step 2 State: Zairyu Card (Front & Back)
  const [zairyuFront, setZairyuFront] = useState<File | null>(null);
  const [zairyuFrontUrl, setZairyuFrontUrl] = useState('');
  const [zairyuBack, setZairyuBack] = useState<File | null>(null);
  const [zairyuBackUrl, setZairyuBackUrl] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [zairyuAddress, setZairyuAddress] = useState('');

  // Step 3 State: Passport & Nenkin Book
  const [passport, setPassport] = useState<File | null>(null);
  const [passportUrl, setPassportUrl] = useState('');
  const [nenkinBook, setNenkinBook] = useState<File | null>(null);
  const [nenkinBookUrl, setNenkinBookUrl] = useState('');
  const [nenkinNumber, setNenkinNumber] = useState('');

  // Step 4 State: Bank Passbook (Up to 2 pages)
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

  const handleCaptureSubmit = (docFile: File, secFile?: File) => {
    if (secFile && !securityPhoto) {
      setSecurityPhoto(secFile);
    }
    if (captureType === 'zairyuFront') setZairyuFront(docFile);
    if (captureType === 'zairyuBack') setZairyuBack(docFile);
    if (captureType === 'passport') setPassport(docFile);
    if (captureType === 'nenkin') setNenkinBook(docFile);
    if (captureType === 'bank1') setBankPassbook1(docFile);
    if (captureType === 'bank2') setBankPassbook2(docFile);
    setCaptureOpen(false);
  };

  const handleNextStep1 = () => {
    if (!fullName.trim()) {
      alert('Vui lòng nhập Họ và Tên của bạn.');
      return;
    }
    if (!phone.trim() && !zaloContact.trim()) {
      alert('Vui lòng nhập Số điện thoại hoặc Zalo để nhân viên có thể liên hệ hỗ trợ.');
      return;
    }
    if (!dob) {
      alert('Vui lòng chọn Ngày tháng năm sinh.');
      return;
    }
    setStep(2);
  };

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

  const handleNextStep2 = async () => {
    if (!zairyuFront && !zairyuFrontUrl) {
      if (cardNumber.trim()) {
        setStep(3);
        return;
      }
      alert('Vui lòng tải lên mặt trước Thẻ Ngoại Kiều (Zairyu Card) hoặc nhập Số thẻ.');
      return;
    }

    setLoading(true);
    setOcrError(null);
    try {
      if (zairyuFront) {
        const fd = new FormData();
        fd.append('file', zairyuFront);
        fd.append('action', 'uploadAndExtract');
        fd.append('documentType', 'zairyuFront');
        fd.append('source', 'onboarding');
        fd.append('customerId', draftId);
        if (securityPhoto) {
          fd.append('securityFile', securityPhoto);
        }

        const res = await fetch('/api/ocr', { method: 'POST', body: fd });
        const data = await res.json();

        if (!res.ok) {
          setOcrError('Hình ảnh tải lên chưa rõ nét hoặc không đúng loại giấy tờ. Quý khách vui lòng kiểm tra lại góc chụp, đảm bảo không bị lóa sáng và tải lại ảnh nhé!');
          setLoading(false);
          return;
        }

        if (data.isExistingCustomer) {
          setExistingCustomerData({
            customerCode: data.existingCustomerCode,
            message: data.existingCustomerMessage
          });
          setLoading(false);
          return;
        }

        setZairyuFrontUrl(data.publicUrl);
        if (data.securityPhotoUrl) setSecurityPhotoUrl(data.securityPhotoUrl);
        if (data.extractedData) {
          if (data.extractedData.cardNumber) setCardNumber(data.extractedData.cardNumber);
          if (data.extractedData.address) setZairyuAddress(data.extractedData.address);
        }
      }

      if (zairyuBack) {
        const bUrl = await handleUploadSingleFile(zairyuBack, 'zairyuBack');
        setZairyuBackUrl(bUrl);
      }

      setStep(3);
    } catch (err: unknown) {
      setOcrError('Hình ảnh tải lên chưa rõ nét hoặc không đúng loại giấy tờ. Quý khách vui lòng kiểm tra lại góc chụp, đảm bảo không bị lóa sáng và tải lại ảnh nhé!');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep3 = async () => {
    setLoading(true);
    try {
      if (passport) {
        const pUrl = await handleUploadSingleFile(passport, 'passport');
        setPassportUrl(pUrl);
      }
      if (nenkinBook) {
        const nUrl = await handleUploadSingleFile(nenkinBook, 'nenkin');
        setNenkinBookUrl(nUrl);
      }
      setStep(4);
    } catch (err: unknown) {
      console.error(err);
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setExistingCustomerData(null);
    try {
      const bankUrls: string[] = [];
      if (bankPassbook1Url) bankUrls.push(bankPassbook1Url);
      if (bankPassbook1) {
        const url1 = await handleUploadSingleFile(bankPassbook1, 'bankPassbook_0').catch(console.error);
        if (url1 && !bankUrls.includes(url1)) bankUrls.push(url1);
      }

      if (bankPassbook2Url) bankUrls.push(bankPassbook2Url);
      if (bankPassbook2) {
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
        bankPassbookUrl: bankUrls[0] || '',
        bankPassbookUrls: bankUrls,
        cardNumber,
        zairyuAddress,
        securityPhotoUrl,
        draftId,
      };

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.isExistingCustomer) {
        setExistingCustomerData({
          customerCode: data.customerCode,
          message: data.error
        });
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
      alert(err instanceof Error ? err.message : String(err));
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

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => router.push(`/portal/login?code=${existingCustomerData.customerCode}`)}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" /> Đăng Nhập Cổng Khách Hàng (Portal)
                </button>

                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4 text-slate-500" /> Đăng Nhập Nhân Viên Phụ Trách
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
              {/* STEP 1: Personal & Contact Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base md:text-lg font-bold text-slate-900">Bước 1: Thông tin cá nhân & Liên hệ</h2>
                    <p className="text-xs text-slate-500">Vui lòng điền thông tin cơ bản để nhân viên thuận tiện liên hệ hỗ trợ.</p>
                  </div>

                  {/* Koyama Referral Banner */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-3 flex items-start gap-2.5">
                    <Gift className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-900 leading-snug">
                      <span className="font-bold">Ưu đãi mã giới thiệu:</span> Nhập mã giới thiệu từ bạn bè hoặc CTV để nhận ngay <span className="font-bold text-emerald-600">giảm 2.000 JPY</span> phí dịch vụ!
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Họ và Tên *</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: NGUYEN VAN A"
                        value={fullName}
                        onChange={e => setFullName(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại *</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="080... hoặc 09..."
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Zalo (Số / Link)</label>
                        <div className="relative">
                          <MessageSquare className="w-4 h-4 text-blue-500 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Zalo SĐT..."
                            value={zaloContact}
                            onChange={e => setZaloContact(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh *</label>
                        <input
                          type="date"
                          value={dob}
                          onChange={e => setDob(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Facebook Messenger</label>
                        <input
                          type="text"
                          placeholder="Link m.me/..."
                          value={facebookContact}
                          onChange={e => setFacebookContact(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mã Giới Thiệu (Tùy chọn)</label>
                      <input
                        type="text"
                        placeholder="Mã CTV hoặc Mã khách hàng (VD: KH-123456)"
                        value={refCode}
                        onChange={e => setRefCode(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleNextStep1}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
                  >
                    Tiếp Theo: Thẻ Ngoại Kiều <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: Zairyu Card (Front & Back with Real Thumbnail & Red Delete) */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base md:text-lg font-bold text-slate-900">Bước 2: Thẻ Ngoại Kiều (Zairyu Card)</h2>
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

                  {/* OCR Error Notification Banner */}
                  {ocrError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
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
                          if (file) setZairyuFront(file);
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
                          if (file) setZairyuBack(file);
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

                    <div className="text-center text-xs text-slate-400 font-medium pt-1">-- Hoặc nhập tay nếu chưa có ảnh --</div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Số thẻ (VD: AB12345678CD)"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value.toUpperCase())}
                        className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Địa chỉ Kanji..."
                        value={zairyuAddress}
                        onChange={e => setZairyuAddress(e.target.value)}
                        className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
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
                          <RefreshCw className="w-4 h-4 animate-spin" /> Đang xử lý, hãy chờ...
                        </>
                      ) : (
                        <>
                          Tiếp Theo: Hộ Chiếu & Nenkin <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Passport & Nenkin Book */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base md:text-lg font-bold text-slate-900">Bước 3: Hộ Chiếu & Sổ Nenkin</h2>
                    <p className="text-xs text-slate-500">Tùy chọn tải ảnh hoặc điền thông tin nếu nhớ.</p>
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
                        if (file) setPassport(file);
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
                        if (file) setNenkinBook(file);
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
                          Tiếp Theo: Ngân Hàng Nhận Tiền <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Bank Passbook */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base md:text-lg font-bold text-slate-900">Bước 4: Sổ Ngân Hàng Nhận Tiền</h2>
                    <p className="text-xs text-slate-500">Có thể tải up to 2 trang đại diện sổ Yucho hoặc Ngân hàng Việt Nam.</p>
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
