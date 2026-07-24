"use client";

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, UploadCloud, FileText, CheckCircle2, ChevronRight, X, Camera, HelpCircle, Gift, Phone, MessageSquare, AlertTriangle } from 'lucide-react';
import DocumentCaptureOverlay from '@/components/DocumentCaptureOverlay';

function WizardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get('ref') || '';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [createdData, setCreatedData] = useState<{ code: string; cardNumber: string | null; referralType: string | null } | null>(null);

  // Step 1 State: Personal & Contact Info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [zaloContact, setZaloContact] = useState('');
  const [facebookContact, setFacebookContact] = useState('');
  const [dob, setDob] = useState('');
  const [refCode, setRefCode] = useState(ref || '');

  // Step 2 State: Zairyu Card (Card Number & Address auto-extracted or manual)
  const [zairyuFront, setZairyuFront] = useState<File | null>(null);
  const [zairyuFrontUrl, setZairyuFrontUrl] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [zairyuAddress, setZairyuAddress] = useState('');

  // Step 3 State: Passport, Nenkin & Departure (Optional / Flexible)
  const [passport, setPassport] = useState<File | null>(null);
  const [nenkinBook, setNenkinBook] = useState<File | null>(null);
  const [nenkinNumber, setNenkinNumber] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [passportUrl, setPassportUrl] = useState('');
  const [nenkinBookUrl, setNenkinBookUrl] = useState('');

  // Step 4 State: Bank Passbook
  const [bankPassbook, setBankPassbook] = useState<File | null>(null);
  const [bankPassbookUrl, setBankPassbookUrl] = useState('');

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
    if (captureType === 'passport') setPassport(docFile);
    if (captureType === 'nenkin') setNenkinBook(docFile);
    if (captureType === 'bank') setBankPassbook(docFile);
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

  const handleNextStep2 = async () => {
    if (!zairyuFront) {
      // Allow manual entry if user doesn't have card photo right now
      if (cardNumber.trim()) {
        setStep(3);
        return;
      }
      alert('Vui lòng tải lên ảnh mặt trước Thẻ Ngoại Kiều (Zairyu Card) hoặc nhập Số thẻ ngoại kiều.');
      return;
    }

    setLoading(true);
    setOcrError(null);
    try {
      const fd = new FormData();
      fd.append('file', zairyuFront);
      fd.append('action', 'uploadAndExtract');
      fd.append('documentType', 'zairyuFront');
      fd.append('source', 'onboarding');
      fd.append('customerId', draftId);
      if (securityPhoto) {
        fd.append('securityFile', securityPhoto);
      }

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      
      if (!res.ok) {
        setOcrError('Hình ảnh tải lên chưa rõ nét hoặc không đúng loại giấy tờ. Quý khách vui lòng kiểm tra lại góc chụp, đảm bảo không bị lóa sáng và tải lại ảnh nhé!');
        setLoading(false);
        return;
      }

      setZairyuFrontUrl(data.publicUrl);
      if (data.securityPhotoUrl) {
        setSecurityPhotoUrl(data.securityPhotoUrl);
      }
      if (data.extractedData) {
        if (data.extractedData.cardNumber) setCardNumber(data.extractedData.cardNumber);
        if (data.extractedData.address) setZairyuAddress(data.extractedData.address);
      }
      setStep(3);
    } catch (err: unknown) {
      setOcrError('Hình ảnh tải lên chưa rõ nét hoặc không đúng loại giấy tờ. Quý khách vui lòng kiểm tra lại góc chụp, đảm bảo không bị lóa sáng và tải lại ảnh nhé!');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async (file: File, documentType: string) => {
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

  const handleNextStep3 = async () => {
    setLoading(true);
    try {
      let pUrl = '';
      let nUrl = '';
      if (passport) pUrl = await handleUploadFile(passport, 'passport');
      if (nenkinBook) nUrl = await handleUploadFile(nenkinBook, 'nenkin');
      setPassportUrl(pUrl);
      setNenkinBookUrl(nUrl);
      setStep(4);
    } catch (err: unknown) {
      console.error(err);
      setStep(4); // Non-blocking: continue even if file upload warning
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let bUrl = '';
      if (bankPassbook) {
        try {
          bUrl = await handleUploadFile(bankPassbook, 'bankPassbook_0');
          setBankPassbookUrl(bUrl);
        } catch (e) {
          console.error(e);
        }
      }

      const payload = {
        fullName,
        phone,
        zaloContact,
        facebookContact,
        dob,
        ref: refCode,
        zairyuFrontUrl,
        zairyuBackUrl: '',
        passportUrl,
        nenkinBookUrl,
        bankPassbookUrl: bUrl || bankPassbookUrl,
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
        {!createdData && (
          <div className="bg-slate-900 text-white p-4 border-b border-slate-800">
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-indigo-400">HƯỚNG DẪN TỰ ĐĂNG KÝ (4 BƯỚC)</span>
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
          {/* SUCCESS SCREEN */}
          {createdData ? (
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Gửi Hồ Sơ Thành Công!</h2>
                <p className="text-xs text-slate-500">Chất lượng thông tin đã được ghi nhận vào hệ thống.</p>
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
                    <span>Quý khách đã được áp dụng giảm ngay 2.000 JPY phí dịch vụ nhờ mã giới thiệu!</span>
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
                    <p className="text-xs text-slate-500">Vui lòng điền thông tin để nhân viên dễ dàng hỗ trợ bạn.</p>
                  </div>

                  {/* Koyama Referral Discount Banner */}
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
                    Tiếp Theo: Tải Thẻ Ngoại Kiều <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: Zairyu Card Upload & Smart Guidance */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base md:text-lg font-bold text-slate-900">Bước 2: Thẻ Ngoại Kiều (Zairyu Card)</h2>
                    <p className="text-xs text-slate-500">AI sẽ tự động đọc địa chỉ Kanji để ghép đúng Cục Thuế quản lý cho bạn.</p>
                  </div>

                  {/* Japanese Style Guidance Box */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-amber-800">
                      <HelpCircle className="w-4 h-4 text-amber-600" /> Hướng dẫn chụp ảnh chuẩn Nhật:
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                      <li>Đặt thẻ nằm phẳng trên mặt bàn có màu tương phản.</li>
                      <li>Tránh ánh đèn chiếu trực tiếp làm chói bóng hoặc che mất dòng địa chỉ Kanji.</li>
                    </ul>
                  </div>

                  {/* OCR Error Notification Banner */}
                  {ocrError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-start gap-2 animate-shake">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>{ocrError}</div>
                    </div>
                  )}

                  {/* File Capture Input */}
                  <div className="space-y-2">
                    <input
                      id="zairyuInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setZairyuFront(file);
                      }}
                    />

                    <div
                      onClick={() => handleTriggerCapture('zairyuFront', 'zairyuInput')}
                      className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-indigo-50/80"
                    >
                      {zairyuFront ? (
                        <div className="space-y-2">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                          <div className="text-xs font-bold text-slate-800 truncate">{zairyuFront.name}</div>
                          <span className="text-[11px] text-indigo-600 font-semibold underline">Nhấp để chọn ảnh khác</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Camera className="w-10 h-10 text-indigo-500 mx-auto" />
                          <div className="text-xs font-bold text-slate-800">Chụp / Chọn Ảnh Mặt Trước Thẻ Ngoại Kiều</div>
                          <p className="text-[11px] text-slate-400">Hệ thống sẽ tự động trích xuất thông tin</p>
                        </div>
                      )}
                    </div>

                    <div className="text-center text-xs text-slate-400 font-medium">-- Hoặc nhập tay nếu chưa có ảnh --</div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Số thẻ Zairyu (VD: AB12345678CD)"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value.toUpperCase())}
                        className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Địa chỉ Kanji Nhật Bản..."
                        value={zairyuAddress}
                        onChange={e => setZairyuAddress(e.target.value)}
                        className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
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
                      {loading ? 'AI Đang Bóc Tách...' : 'Tiếp Theo: Hộ Chiếu & Nenkin'} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Passport & Nenkin Book (Optional / Flexible) */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base md:text-lg font-bold text-slate-900">Bước 3: Hộ Chiếu & Sổ Nenkin (Không bắt buộc)</h2>
                    <p className="text-xs text-slate-500">Bạn có thể tải ảnh hoặc điền thông tin nếu nhớ. Nhân viên sẽ bổ sung giúp bạn sau.</p>
                  </div>

                  {/* Passport Upload */}
                  <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>📘 Trang Ảnh Hộ Chiếu (Passport)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Tùy chọn</span>
                    </div>
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
                    <button
                      type="button"
                      onClick={() => handleTriggerCapture('passport', 'passportInput')}
                      className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5"
                    >
                      <UploadCloud className="w-4 h-4 text-indigo-500" />
                      {passport ? passport.name : 'Tải Lên Ảnh Hộ Chiếu'}
                    </button>
                  </div>

                  {/* Nenkin Book Upload / Number */}
                  <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>📙 Sổ Nenkin HOẶC Mã Số Nenkin (10 chữ số)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Tùy chọn</span>
                    </div>
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
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleTriggerCapture('nenkin', 'nenkinInput')}
                        className="py-2 px-3 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 truncate"
                      >
                        <UploadCloud className="w-4 h-4 text-indigo-500 shrink-0" />
                        {nenkinBook ? nenkinBook.name : 'Tải Ảnh Sổ'}
                      </button>
                      <input
                        type="text"
                        placeholder="Mã Nenkin (10 số)..."
                        value={nenkinNumber}
                        onChange={e => setNenkinNumber(e.target.value)}
                        className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
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
                      {loading ? 'Đang Lưu...' : 'Tiếp Theo: Ngân Hàng Hoàn Thuế'} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Bank Passbook & Complete */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base md:text-lg font-bold text-slate-900">Bước 4: Sổ Ngân Hàng Nhận Tiền</h2>
                    <p className="text-xs text-slate-500">Tải trang đầu sổ ngân hàng Việt Nam hoặc Yucho để nhận tiền hoàn thuế.</p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <input
                      id="bankInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setBankPassbook(file);
                      }}
                    />

                    <div
                      onClick={() => handleTriggerCapture('bank', 'bankInput')}
                      className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-white rounded-xl p-5 text-center cursor-pointer transition-all"
                    >
                      {bankPassbook ? (
                        <div className="space-y-1">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                          <div className="text-xs font-bold text-slate-800 truncate">{bankPassbook.name}</div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto" />
                          <div className="text-xs font-bold text-slate-800">Tải Ảnh Trang Đầu Sổ Ngân Hàng</div>
                          <p className="text-[10px] text-slate-400">Vietcombank, MB Bank, Yucho Bank...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
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
                      {loading ? 'Đang Gửi Hồ Sơ...' : '🚀 Hoàn Tất & Gửi Hồ Sơ'}
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
