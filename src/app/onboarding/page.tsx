"use client";

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, UploadCloud, FileText, CheckCircle2, ChevronRight, X, Camera } from 'lucide-react';
import DocumentCaptureOverlay from '@/components/DocumentCaptureOverlay';

function WizardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get('ref') || '';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdData, setCreatedData] = useState<{ code: string; cardNumber: string | null; referralType: string | null } | null>(null);

  // Step 1 State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [refCode, setRefCode] = useState(ref || '');

  // Step 2 State
  const [zairyuFront, setZairyuFront] = useState<File | null>(null);
  const [zairyuFrontUrl, setZairyuFrontUrl] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [zairyuAddress, setZairyuAddress] = useState('');

  // Step 3 State
  const [passport, setPassport] = useState<File | null>(null);
  const [nenkinBook, setNenkinBook] = useState<File | null>(null);
  const [bankPassbook, setBankPassbook] = useState<File | null>(null);

  const [passportUrl, setPassportUrl] = useState('');
  const [nenkinBookUrl, setNenkinBookUrl] = useState('');
  const [bankPassbookUrl, setBankPassbookUrl] = useState('');

  // Security Photo State
  const [securityPhoto, setSecurityPhoto] = useState<File | null>(null);
  const [securityPhotoUrl, setSecurityPhotoUrl] = useState('');

  // Capture Overlay State
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureType, setCaptureType] = useState('');

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

  const handleCancel = () => {
    router.push('/');
  };

  const handleNextStep1 = () => {
    if (!fullName || !phone || !dob || !refCode) {
      alert('Vui lòng điền đầy đủ thông tin cơ bản và mã nhân viên.');
      return;
    }
    setStep(2);
  };

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

  const handleNextStep2 = async () => {
    if (!zairyuFront) {
      alert('Vui lòng tải lên mặt trước Thẻ Ngoại Kiều (Zairyu Card).');
      return;
    }
    setLoading(true);
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
        throw new Error(data.error || 'Xử lý thẻ Zairyu thất bại');
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
      alert(err instanceof Error ? err.message : String(err));
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
    // For subsequent files, we don't need to re-upload securityPhoto since it was uploaded with zairyuFront
    
    const res = await fetch('/api/ocr', {
      method: 'POST',
      body: fd
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Tải lên ${documentType} thất bại`);
    }
    return data.publicUrl;
  };

  const handleNextStep3 = async () => {
    setLoading(true);
    try {
      let pUrl = '';
      let nUrl = '';
      let bUrl = '';
      
      if (passport) pUrl = await handleUploadFile(passport, 'passport');
      if (nenkinBook) nUrl = await handleUploadFile(nenkinBook, 'nenkin');
      if (bankPassbook) bUrl = await handleUploadFile(bankPassbook, 'bank');
      
      setPassportUrl(pUrl);
      setNenkinBookUrl(nUrl);
      setBankPassbookUrl(bUrl);
      
      setStep(4);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        fullName,
        phone,
        dob,
        ref: refCode,
        zairyuFrontUrl,
        zairyuBackUrl: '', 
        passportUrl,
        nenkinBookUrl,
        bankPassbookUrl,
        cardNumber,
        zairyuAddress,
        securityPhotoUrl
      };

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gửi hồ sơ thất bại');
      }

      setCreatedData({
        code: data.customer.code,
        cardNumber: data.customer.cardNumber || null,
        referralType: data.customer.referralType || null,
      });
      setStep(5); 
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (step === 5) {
    return (
      <div className="p-10 max-w-lg mx-auto bg-white rounded-2xl shadow-xl text-center border-t-4 border-amber-400">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Đăng ký thành công!</h2>
        {createdData && (
          <div className="mb-6 space-y-3">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-xs text-indigo-600 font-medium mb-1">Mã hồ sơ của bạn</p>
              <p className="text-2xl font-bold font-mono text-indigo-700">{createdData.code}</p>
            </div>
            {createdData.cardNumber && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs text-emerald-600 font-medium mb-1">Số thẻ ngoại kiều</p>
                <p className="text-lg font-bold font-mono text-emerald-700">{createdData.cardNumber}</p>
              </div>
            )}
          </div>
        )}
        <p className="text-slate-600 mb-8 leading-relaxed text-sm">
          Hồ sơ của bạn đã được gửi thành công và đang chờ xét duyệt. Bạn có thể tra cứu hồ sơ tại trang chủ bằng Số thẻ ngoại kiều hoặc Mã hồ sơ, kết hợp với Năm sinh (4 số) làm mật khẩu.
        </p>
        <button onClick={() => router.push('/')} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
          Trở về trang chủ
        </button>
      </div>
    );
  }

  const stepTitles = ["Thông tin cơ bản", "Tải lên Thẻ Ngoại Kiều", "Tài liệu khác", "Xác nhận & Gửi"];

  return (
    <div className="p-8 max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-slate-900">
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-extrabold tracking-tight">Tạo Hồ Sơ Mới</h1>
        </div>
        <button onClick={handleCancel} className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-medium bg-slate-50 hover:bg-red-50 px-3 py-1.5 rounded-full">
          <X className="w-4 h-4" /> Hủy
        </button>
      </div>
      
      {/* Progress */}
      <div className="mb-10">
        <div className="flex justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
          <div className="absolute top-1/2 left-0 h-1 bg-indigo-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm transition-colors duration-300 ${step >= s ? 'bg-slate-900 text-white ring-4 ring-slate-100' : 'bg-white text-slate-400 border-2 border-slate-200'}`}>
                {step > s ? <CheckCircle2 className="w-5 h-5 text-indigo-500" /> : s}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-4 font-medium text-slate-600 text-sm">
          Bước {step}: <span className="text-slate-900 font-bold">{stepTitles[step-1]}</span>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-4">
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-slate-700">Họ và tên</label>
              <input type="text" autoComplete="name" className="w-full border-slate-300 border p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="VD: NGUYEN VAN A" />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-slate-700">Số điện thoại</label>
              <input type="tel" autoComplete="tel" name="phone" className="w-full border-slate-300 border p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white" value={phone} onChange={e => setPhone(e.target.value)} placeholder="090-1234-5678" />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-slate-700">Ngày sinh (Được dùng làm mật khẩu tra cứu)</label>
              <input type="date" autoComplete="bday" className="w-full border-slate-300 border p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white" value={dob} onChange={e => setDob(e.target.value)} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-slate-700">Mã giới thiệu (*)</label>
              <input type="text" autoComplete="off" className="w-full border-slate-300 border p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white" value={refCode} onChange={e => setRefCode(e.target.value)} placeholder="Mã NV hoặc mã KH giới thiệu" />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button onClick={handleCancel} className="w-1/3 bg-slate-100 text-slate-700 p-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors">Hủy</button>
            <button onClick={handleNextStep1} className="w-2/3 bg-slate-900 text-white p-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-2">
              Tiếp tục <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 text-sm text-blue-800 mb-6 flex items-start gap-3">
            <UploadCloud className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
            <p>Vui lòng chụp rõ nét mặt trước Thẻ Ngoại Kiều (Zairyu Card). Hệ thống sẽ tự động nhận diện thông tin.</p>
          </div>
          <div>
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <button onClick={() => handleTriggerCapture('zairyuFront', 'zairyuUpload')} className="bg-white border border-slate-300 p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center shrink-0">
                <Camera className="w-6 h-6 text-slate-600" />
              </button>
              <div className="flex-1">
                <input id="zairyuUpload" type="file" accept="image/*" className="hidden" onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    setZairyuFront(e.target.files[0]);
                  }
                }} />
                {zairyuFront ? (
                  <p className="text-sm font-semibold text-emerald-600 line-clamp-1">{zairyuFront.name}</p>
                ) : (
                  <p className="text-sm text-slate-500">Chưa chọn file (Nhấn icon Camera hoặc mở trên Mobile)</p>
                )}
              </div>
            </div>
          </div>
          <div className="pt-6 flex gap-3">
            <button onClick={() => setStep(1)} disabled={loading} className="w-1/3 bg-white border border-slate-300 text-slate-700 p-3.5 rounded-xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50">Quay lại</button>
            <button onClick={handleNextStep2} disabled={loading} className="w-2/3 bg-slate-900 text-white p-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50 flex justify-center items-center gap-2">
              {loading ? (
                <><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang quét dữ liệu...</>
              ) : <><FileText className="w-5 h-5" /> Quét & Tiếp tục</>}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-slate-500 text-sm mb-4">Bạn có thể tải lên các giấy tờ dưới đây nếu có sẵn. Nếu chưa có, bạn có thể bổ sung sau.</p>
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4">
              <button onClick={() => handleTriggerCapture('passport', 'passportUpload')} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                <Camera className="w-5 h-5 text-slate-500" />
              </button>
              <div className="flex-1">
                <input id="passportUpload" type="file" accept="image/*" className="hidden" onChange={e => {
                  if (e.target.files && e.target.files.length > 0) setPassport(e.target.files[0]);
                }} />
                {passport ? <p className="text-sm font-semibold text-emerald-600">{passport.name}</p> : <p className="text-sm text-slate-500">Chưa tải lên Hộ chiếu</p>}
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4">
              <button onClick={() => handleTriggerCapture('nenkin', 'nenkinUpload')} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                <Camera className="w-5 h-5 text-slate-500" />
              </button>
              <div className="flex-1">
                <input id="nenkinUpload" type="file" accept="image/*" className="hidden" onChange={e => {
                  if (e.target.files && e.target.files.length > 0) setNenkinBook(e.target.files[0]);
                }} />
                {nenkinBook ? <p className="text-sm font-semibold text-emerald-600">{nenkinBook.name}</p> : <p className="text-sm text-slate-500">Chưa tải lên Sổ Nenkin</p>}
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4">
              <button onClick={() => handleTriggerCapture('bank', 'bankUpload')} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                <Camera className="w-5 h-5 text-slate-500" />
              </button>
              <div className="flex-1">
                <input id="bankUpload" type="file" accept="image/*" className="hidden" onChange={e => {
                  if (e.target.files && e.target.files.length > 0) setBankPassbook(e.target.files[0]);
                }} />
                {bankPassbook ? <p className="text-sm font-semibold text-emerald-600">{bankPassbook.name}</p> : <p className="text-sm text-slate-500">Chưa tải lên Sổ / Thẻ Ngân hàng</p>}
              </div>
            </div>
          </div>
          <div className="pt-6 flex gap-3">
            <button onClick={() => setStep(2)} disabled={loading} className="w-1/3 bg-white border border-slate-300 text-slate-700 p-3.5 rounded-xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50">Quay lại</button>
            <button onClick={handleNextStep3} disabled={loading} className="w-2/3 bg-slate-900 text-white p-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50 flex justify-center items-center gap-2">
              {loading ? (
                <><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang tải lên...</>
              ) : <><UploadCloud className="w-5 h-5" /> Tiếp tục</>}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-sm space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full -z-0"></div>
            
            <p className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500 font-medium">Họ và tên:</span> <span className="font-bold text-slate-900">{fullName}</span></p>
            <p className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500 font-medium">Điện thoại:</span> <span className="font-bold text-slate-900">{phone}</span></p>
            <p className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500 font-medium">Ngày sinh:</span> <span className="font-bold text-slate-900">{dob}</span></p>
            
            <p className="flex justify-between border-b border-slate-200 pb-2 pt-2"><span className="text-slate-500 font-medium">Số thẻ Zairyu:</span> <span className="font-bold text-slate-900">{cardNumber || 'Chưa cập nhật'}</span></p>
            <p className="flex flex-col border-b border-slate-200 pb-2"><span className="text-slate-500 font-medium mb-1">Địa chỉ:</span> <span className="font-bold text-slate-900">{zairyuAddress || 'Chưa cập nhật'}</span></p>
            
            {refCode && (
              <p className="flex justify-between pt-2"><span className="text-slate-500 font-medium">Mã giới thiệu:</span> <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{refCode}</span></p>
            )}
          </div>
          <div className="pt-4 flex gap-3">
            <button onClick={() => setStep(3)} disabled={loading} className="w-1/3 bg-white border border-slate-300 text-slate-700 p-3.5 rounded-xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50">Quay lại</button>
            <button onClick={handleSubmit} disabled={loading} className="w-2/3 bg-indigo-600 text-white p-3.5 rounded-xl font-extrabold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex justify-center items-center gap-2">
              {loading ? (
                <><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang nộp hồ sơ...</>
              ) : <><ShieldCheck className="w-5 h-5" /> Nộp Hồ Sơ Ngay</>}
            </button>
          </div>
        </div>
      )}

      <DocumentCaptureOverlay
        isOpen={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onCapture={handleCaptureSubmit}
        documentType={captureType}
      />
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Suspense fallback={<div className="text-center py-20 text-slate-500 font-medium">Đang tải trình duyệt hồ sơ...</div>}>
        <WizardContent />
      </Suspense>
    </div>
  );
}
