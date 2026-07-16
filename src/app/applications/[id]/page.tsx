'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Clock, CheckCircle, Wallet, Calculator, FileText, Printer, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { UploadCloud, Loader2 } from 'lucide-react';
import { TaxRepresentative } from '@prisma/client';
import { useGenerateDoc } from '@/hooks/useGenerateDoc';

const STATUS_STEPS = [
  { id: 'DRAFT', label: 'Bản nháp' },
  { id: 'SENT_1ST', label: 'Đã nộp Lần 1' },
  { id: 'RECEIVED_1ST', label: 'Đã nhận Lần 1' },
  { id: 'SENT_2ND', label: 'Đã nộp Lần 2' },
  { id: 'COMPLETED', label: 'Hoàn thành' },
];

type ApplicationStatus = 'PENDING' | 'DRAFT' | 'SENT_1ST' | 'RECEIVED_1ST' | 'SENT_2ND' | 'RECEIVED_2ND' | 'COMPLETED' | 'CANCELLED';

const statusSteps: { id: ApplicationStatus; label: string }[] = [
  { id: 'PENDING', label: 'Cần duyệt' },
  { id: 'DRAFT', label: 'Bản nháp' },
  { id: 'SENT_1ST', label: 'Đã gửi (Lần 1)' },
  { id: 'RECEIVED_1ST', label: 'Đã nhận (Lần 1)' },
  { id: 'SENT_2ND', label: 'Đã gửi (Lần 2)' },
  { id: 'RECEIVED_2ND', label: 'Đã nhận (Lần 2)' },
  { id: 'COMPLETED', label: 'Hoàn thành' },
];

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // Use React.use() or type casting to unwrap params in Next 15 if needed, 
  // but for client components, useParams() usually returns the unwrapped object in React 19/Next 15.
  const id = params.id as string;
  const { generate: generateDoc, isLoading: generatingDocHook } = useGenerateDoc();

  type AppData = {
    customer: { 
      id: string;
      fullName: string; 
      code: string;
      cardNumber?: string;
      zairyuAddress?: string;
      zairyuFrontUrl?: string;
      passportUrl?: string;
    };
    [key: string]: unknown;
  };
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [taxReps, setTaxReps] = useState<TaxRepresentative[]>([]);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [formData, setFormData] = useState({
    status: 'DRAFT' as ApplicationStatus,
    applyDate: '',
    sent1stDate: '',
    received1stDate: '',
    sent2ndDate: '',
    received2ndDate: '',
    totalExpectedJpy: '',
    received1stJpy: '',
    received2ndJpy: '',
    tax2ndJpy: '',
    serviceFeeJpy: '',
    exchangeRate: '',
    serviceFeeVnd: '',
    noticeDate: '',
    noticeImageUrl: '',
    taxRepresentativeId: ''
  });

  useEffect(() => {
    async function fetchTaxReps() {
      try {
        const res = await fetch('/api/tax-representatives');
        if (res.ok) {
          const data = await res.json();
          setTaxReps(data);
        }
      } catch (error) {
        console.error('Failed to fetch tax reps:', error);
      }
    }
    fetchTaxReps();
  }, []);

  useEffect(() => {
    if (!id) return;
    
    async function fetchApp() {
      try {
        const res = await fetch(`/api/applications/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.customerId) {
            window.location.href = `/customers/${data.customerId}?tab=app_details`;
            return;
          }
          setAppData(data);
          
          // Helper to format date for input type="date"
          const formatDate = (dateStr: string) => {
            if (!dateStr) return '';
            return new Date(dateStr).toISOString().split('T')[0];
          };

          setFormData({
            status: data.status,
            applyDate: formatDate(data.applyDate),
            sent1stDate: formatDate(data.sent1stDate),
            received1stDate: formatDate(data.received1stDate),
            sent2ndDate: formatDate(data.sent2ndDate),
            received2ndDate: formatDate(data.received2ndDate),
            totalExpectedJpy: data.totalExpectedJpy || '',
            received1stJpy: data.received1stJpy || '',
            received2ndJpy: data.received2ndJpy || '',
            tax2ndJpy: data.tax2ndJpy || '',
            serviceFeeJpy: data.serviceFeeJpy || '',
            exchangeRate: data.exchangeRate || '',
            serviceFeeVnd: data.serviceFeeVnd || '',
            noticeDate: formatDate(data.noticeDate),
            noticeImageUrl: data.noticeImageUrl || '',
            taxRepresentativeId: data.taxRepresentativeId || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch application:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchApp();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const calculateFees = () => {
    // Basic logic for demonstration
    const received1 = parseFloat(formData.received1stJpy) || 0;
    const received2 = parseFloat(formData.received2ndJpy) || 0;
    const rate = parseFloat(formData.exchangeRate) || 165; // default rate
    
    // Giả sử phí dịch vụ là 20% tổng nhận
    const totalReceived = received1 + received2;
    const feeJpy = totalReceived * 0.2;
    const feeVnd = feeJpy * rate;
    
    setFormData(prev => ({
      ...prev,
      serviceFeeJpy: feeJpy.toString(),
      serviceFeeVnd: feeVnd.toString(),
      exchangeRate: rate.toString()
    }));
  };

  const fetchDcomRate = async () => {
    setFetchingRate(true);
    try {
      const res = await fetch('/api/exchange-rate');
      if (res.ok) {
        const data = await res.json();
        if (data.rate) {
          setFormData(prev => ({
            ...prev,
            exchangeRate: data.rate.toString()
          }));
        }
      } else {
        alert('Không thể lấy tỷ giá DCOM.');
      }
    } catch (error) {
      console.error('Error fetching DCOM rate', error);
      alert('Lỗi kết nối tới server tỷ giá.');
    } finally {
      setFetchingRate(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrStatus('processing');
    const objectUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, noticeImageUrl: objectUrl }));

    const form = new FormData();
    form.append('file', file);
    form.append('documentType', 'noticeOfPayment');
    form.append('action', 'upload');

    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, noticeImageUrl: data.publicUrl }));
        setOcrStatus('done');
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

  const handleExtractOcr = async () => {
    if (!formData.noticeImageUrl || formData.noticeImageUrl.startsWith('blob:')) {
      alert("Vui lòng chờ tải ảnh lên hoàn tất trước khi trích xuất.");
      return;
    }
    setOcrStatus('processing');
    const form = new FormData();
    form.append('action', 'extract');
    form.append('documentType', 'noticeOfPayment');
    form.append('imageUrl', formData.noticeImageUrl);

    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: form });
      const data = await res.json();
      
      if (data.success && data.extractedData) {
        if (data.extractedData.error) {
          alert('⚠️ ' + data.extractedData.error);
          setOcrStatus('error');
          return;
        }
        
        setFormData(prev => ({
          ...prev,
          totalExpectedJpy: data.extractedData.totalExpectedJpy || prev.totalExpectedJpy,
          received1stJpy: data.extractedData.received1stJpy || prev.received1stJpy,
          tax2ndJpy: data.extractedData.tax2ndJpy || prev.tax2ndJpy
        }));
        setOcrStatus('done');
        alert('Trích xuất thành công! Vui lòng kiểm tra lại các số tiền được điền tự động.');
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

  const handleGenerateDoc = async (templateName: string) => {
    setGeneratingDoc(true);
    try {
      const res = await fetch('/api/generate-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, templateName }),
      });

      if (res.ok) {
        // Download the file
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Generated_${templateName}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const err = await res.json();
        alert(`Lỗi tạo file: ${err.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating doc', error);
      alert('Lỗi kết nối khi tạo file.');
    } finally {
      setGeneratingDoc(false);
    }
  };

  const handleReview = async (action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !confirm('Bạn có chắc chắn muốn yêu cầu khách hàng chụp lại ảnh? (Hồ sơ sẽ bị hủy)')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/applications/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, status: data.status }));
        alert(action === 'APPROVE' ? 'Đã duyệt hồ sơ thành công!' : 'Đã yêu cầu chụp lại ảnh (Hủy hồ sơ).');
      } else {
        alert('Có lỗi xảy ra khi thực hiện hành động này.');
      }
    } catch (error) {
      console.error('Error reviewing application:', error);
      alert('Lỗi kết nối.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        applyDate: formData.applyDate ? new Date(formData.applyDate).toISOString() : null,
        sent1stDate: formData.sent1stDate ? new Date(formData.sent1stDate).toISOString() : null,
        received1stDate: formData.received1stDate ? new Date(formData.received1stDate).toISOString() : null,
        sent2ndDate: formData.sent2ndDate ? new Date(formData.sent2ndDate).toISOString() : null,
        received2ndDate: formData.received2ndDate ? new Date(formData.received2ndDate).toISOString() : null,
        
        totalExpectedJpy: formData.totalExpectedJpy ? parseFloat(formData.totalExpectedJpy) : null,
        received1stJpy: formData.received1stJpy ? parseFloat(formData.received1stJpy) : null,
        received2ndJpy: formData.received2ndJpy ? parseFloat(formData.received2ndJpy) : null,
        tax2ndJpy: formData.tax2ndJpy ? parseFloat(formData.tax2ndJpy) : null,
        serviceFeeJpy: formData.serviceFeeJpy ? parseFloat(formData.serviceFeeJpy) : null,
        exchangeRate: formData.exchangeRate ? parseFloat(formData.exchangeRate) : null,
        serviceFeeVnd: formData.serviceFeeVnd ? parseFloat(formData.serviceFeeVnd) : null,
        noticeDate: formData.noticeDate ? new Date(formData.noticeDate).toISOString() : null,
        noticeImageUrl: formData.noticeImageUrl || null,
        taxRepresentativeId: formData.taxRepresentativeId || null
      };

      const res = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        // Success
        router.push('/applications');
      } else {
        console.error('Failed to update');
      }
    } catch (error) {
      console.error('Error updating application', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!appData) return <div>Không tìm thấy hồ sơ.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-3 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/applications" className="p-1.5 md:p-2 text-slate-400 hover:text-slate-900 bg-white rounded-lg border border-slate-200 shadow-sm transition-colors">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Link>
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">Chi tiết Hồ sơ</h1>
            <div className="hidden md:block w-px h-4 bg-slate-300"></div>
            <p className="text-xs md:text-sm text-slate-600 flex items-center gap-2">
              Khách hàng: <span className="font-semibold text-slate-900">{appData.customer.fullName}</span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">Mã: {appData.customer.code}</span>
              {appData.customer.cardNumber && (
                <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">Thẻ: {appData.customer.cardNumber}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Cụm In ấn đã được dời xuống Panel bên dưới để rộng rãi hơn */}
          <button 
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/30 disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-4 h-4" />}
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* Review Panel for PENDING applications */}
      {formData.status === 'PENDING' && (
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Hồ sơ đang chờ duyệt
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-orange-800 border-b border-orange-200 pb-2">Thông tin trích xuất (OCR)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs text-orange-700/80 mb-1">Thẻ ngoại kiều (Số)</span>
                  <p className="font-medium text-orange-900">{appData.customer.cardNumber || '---'}</p>
                </div>
                <div>
                  <span className="block text-xs text-orange-700/80 mb-1">Địa chỉ</span>
                  <p className="font-medium text-orange-900">{appData.customer.zairyuAddress || '---'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-orange-800 border-b border-orange-200 pb-2">Hồ sơ đính kèm</h3>
              <div className="flex gap-4">
                {appData.customer.zairyuFrontUrl && (
                  <div className="relative group cursor-pointer" onClick={() => window.open(appData.customer.zairyuFrontUrl, '_blank')}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={appData.customer.zairyuFrontUrl} alt="Zairyu Front" className="w-24 h-16 object-cover rounded border border-orange-300" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                      <span className="text-white text-xs">Xem</span>
                    </div>
                  </div>
                )}
                {appData.customer.passportUrl && (
                  <div className="relative group cursor-pointer" onClick={() => window.open(appData.customer.passportUrl, '_blank')}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={appData.customer.passportUrl} alt="Passport" className="w-24 h-16 object-cover rounded border border-orange-300" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                      <span className="text-white text-xs">Xem</span>
                    </div>
                  </div>
                )}
                {!appData.customer.zairyuFrontUrl && !appData.customer.passportUrl && (
                  <p className="text-sm text-orange-700/80 italic">Không có ảnh đính kèm</p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button 
              onClick={() => handleReview('REJECT')}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm shadow-sm"
            >
              Yêu cầu chụp lại ảnh
            </button>
            <button 
              onClick={() => handleReview('APPROVE')}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm shadow-sm"
            >
              Duyệt hồ sơ
            </button>
          </div>
        </div>
      )}

      {/* Print Panel */}
      <div className="bg-white p-4 md:p-5 rounded-lg border border-slate-200 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Printer className="w-4 h-4 text-indigo-600" />
          In ấn & Xuất file PDF
        </h2>
        
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-32 shrink-0">Hồ sơ Lần 1</h3>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => generateDoc({ applicationId: id, templateType: 'don_xin_lan_1' })}
                disabled={generatingDocHook}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 md:h-8 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                {generatingDocHook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-indigo-500" />} Đơn Xin Lần 1
              </button>
              <button 
                onClick={() => generateDoc({ applicationId: id, templateType: 'ininjyo_yoshiki_lan_1' })}
                disabled={generatingDocHook}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 md:h-8 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                {generatingDocHook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-indigo-500" />} Giấy Ủy Quyền
              </button>
              <button 
                onClick={() => generateDoc({ applicationId: id, templateType: 'nouzeikanrinin' })}
                disabled={generatingDocHook}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 md:h-8 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                {generatingDocHook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-indigo-500" />} Đại Diện Thuế (Lần 1)
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-32 shrink-0">Hồ sơ Lần 2</h3>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => generateDoc({ applicationId: id, templateType: 'bang_1_2' })}
                disabled={generatingDocHook}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 md:h-8 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                {generatingDocHook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-indigo-500" />} Bảng 1 & 2
              </button>
              <button 
                onClick={() => generateDoc({ applicationId: id, templateType: 'bang_3' })}
                disabled={generatingDocHook}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 md:h-8 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                {generatingDocHook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-indigo-500" />} Bảng Số 3
              </button>
              <button 
                onClick={() => generateDoc({ applicationId: id, templateType: 'giay_uy_thac_lan_2' })}
                disabled={generatingDocHook}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 md:h-8 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                {generatingDocHook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-indigo-500" />} Giấy Ủy Thác Lần 2
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-32 shrink-0">Khác</h3>
            <div className="flex flex-wrap gap-2">
              <Link 
                href={`/applications/${id}/print`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 md:h-8 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-all shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" /> In Báo Cáo
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white p-4 md:p-5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((step, index) => {
            const isActive = formData.status === step.id;
            const currentIndex = STATUS_STEPS.findIndex(s => s.id === formData.status);
            const isCompleted = index < currentIndex || formData.status === 'COMPLETED';
            
            return (
              <React.Fragment key={step.id}>
                <div 
                  className={`flex flex-col items-center gap-1.5 relative z-10 cursor-pointer ${isActive || isCompleted ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
                  onClick={() => setFormData(prev => ({ ...prev, status: step.id as ApplicationStatus }))}
                >
                  <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/30' : isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 text-slate-400'}`}>
                    {isCompleted && !isActive ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> : <span className="text-xs md:text-sm font-bold">{index + 1}</span>}
                  </div>
                  <span className={`text-[10px] md:text-xs font-semibold ${isActive ? 'text-primary' : isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}>{step.label}</span>
                </div>
                
                {index < STATUS_STEPS.length - 1 && (
                  <div className="flex-1 h-1 bg-slate-200 mx-2 md:mx-4 relative overflow-hidden rounded-full">
                    <div className={`absolute inset-y-0 left-0 bg-emerald-500 transition-all duration-500 ${isCompleted ? 'w-full' : 'w-0'}`}></div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column: Flow & Dates */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-white p-4 md:p-5 rounded-lg border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Tiến trình Hồ sơ
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái hiện tại</label>
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                >
                  {statusSteps.map(step => (
                    <option key={step.id} value={step.id}>{step.label}</option>
                  ))}
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày nộp hồ sơ</label>
                  <input type="date" name="applyDate" value={formData.applyDate} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày gửi Lần 1</label>
                  <input type="date" name="sent1stDate" value={formData.sent1stDate} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày nhận Lần 1</label>
                  <input type="date" name="received1stDate" value={formData.received1stDate} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày gửi Lần 2</label>
                  <input type="date" name="sent2ndDate" value={formData.sent2ndDate} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày nhận Lần 2</label>
                  <input type="date" name="received2ndDate" value={formData.received2ndDate} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-600" />
              Nghiệp Vụ Lần 2 (20.42%)
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Người Đại Diện Nộp Thuế</label>
                <select 
                  name="taxRepresentativeId"
                  value={formData.taxRepresentativeId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="">-- Chọn Người Đại Diện --</option>
                  {taxReps.map(rep => (
                    <option key={rep.id} value={rep.id}>{rep.fullName} {rep.phone ? `(${rep.phone})` : ''}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Sử dụng để điền thông tin vào Giấy uỷ quyền và Đơn xin hoàn thuế.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày ra thông báo</label>
                  <input type="date" name="noticeDate" value={formData.noticeDate} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-sm text-slate-800">Phiếu thông báo quyết định cấp</h3>
                  <button 
                    onClick={handleExtractOcr}
                    disabled={ocrStatus === 'processing' || !formData.noticeImageUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50 transition-colors"
                  >
                    {ocrStatus === 'processing' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                    Trích xuất AI
                  </button>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <div 
                      className="aspect-[3/4] relative rounded-lg border-2 border-dashed border-slate-300 hover:border-purple-400 bg-white flex items-center justify-center cursor-pointer transition-colors overflow-hidden group"
                      onClick={() => document.getElementById('upload-notice')?.click()}
                    >
                      {!formData.noticeImageUrl && <input id="upload-notice" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />}
                      
                      {formData.noticeImageUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={formData.noticeImageUrl} className="w-full h-full object-cover" alt="Notice of Payment" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-medium">Thay đổi ảnh</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-400 flex flex-col items-center p-4 text-center">
                          <UploadCloud className="w-8 h-8 mb-2 opacity-50" />
                          <span className="text-xs font-medium">Tải ảnh lên</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-2/3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Tổng tiền (支給額)</label>
                      <input type="number" name="totalExpectedJpy" value={formData.totalExpectedJpy} onChange={handleChange} className="w-full px-3 py-1.5 font-mono text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Tiền thuế Lần 2 (所得税額)</label>
                      <input type="number" name="tax2ndJpy" value={formData.tax2ndJpy} onChange={handleChange} className="w-full px-3 py-1.5 font-mono text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Thực nhận Lần 1 (差引支給額)</label>
                      <input type="number" name="received1stJpy" value={formData.received1stJpy} onChange={handleChange} className="w-full px-3 py-1.5 font-mono text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" placeholder="0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financials */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white p-4 md:p-5 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
            
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              Tài chính & Thuế
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dự kiến nhận (JPY)</label>
                <input type="number" name="totalExpectedJpy" value={formData.totalExpectedJpy} onChange={handleChange} className="w-full px-4 py-2 font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="0" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Đã nhận Lần 1 (JPY) - 80%</label>
                <input type="number" name="received1stJpy" value={formData.received1stJpy} onChange={handleChange} className="w-full px-4 py-2 font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="0" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Đã nhận Lần 2 (JPY) - 20%</label>
                <input type="number" name="received2ndJpy" value={formData.received2ndJpy} onChange={handleChange} className="w-full px-4 py-2 font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="0" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-400" />
                Phí Dịch Vụ
              </h2>
              <button onClick={calculateFees} className="text-xs px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-md hover:bg-blue-500/40 transition-colors">Tính tự động</button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs text-slate-400">Tỷ giá JPY/VND (Manual Override)</label>
                  <button 
                    onClick={fetchDcomRate} 
                    disabled={fetchingRate}
                    className="text-[10px] text-blue-400 hover:text-blue-300 disabled:opacity-50 flex items-center gap-1"
                  >
                    {fetchingRate ? 'Đang lấy...' : 'DCOM Mới nhất'}
                  </button>
                </div>
                <input type="number" name="exchangeRate" value={formData.exchangeRate} onChange={handleChange} className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-sm" placeholder="165" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phí DV (JPY)</label>
                  <input type="number" name="serviceFeeJpy" value={formData.serviceFeeJpy} onChange={handleChange} className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phí DV (VND)</label>
                  <input type="number" name="serviceFeeVnd" value={formData.serviceFeeVnd} onChange={handleChange} className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-sm" placeholder="0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
