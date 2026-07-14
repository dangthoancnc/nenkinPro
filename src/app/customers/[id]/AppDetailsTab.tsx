import React, { useState, useEffect } from 'react';
import { Clock, Wallet, Calculator, FileText, CheckCircle, AlertCircle, UploadCloud, Loader2 } from 'lucide-react';
import { TaxRepresentative } from '@prisma/client';

const STATUS_STEPS = [
  { id: 'DRAFT', label: 'Bản nháp' },
  { id: 'SENT_1ST', label: 'Đã nộp Lần 1' },
  { id: 'RECEIVED_1ST', label: 'Đã nhận Lần 1' },
  { id: 'SENT_2ND', label: 'Đã nộp Lần 2' },
  { id: 'COMPLETED', label: 'Hoàn thành' },
];

export default function AppDetailsTab({ customer }: { customer: any }) {
  const application = customer.applications?.[0];
  const [loading, setLoading] = useState(false);
  const [taxReps, setTaxReps] = useState<TaxRepresentative[]>([]);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [fetchingRate, setFetchingRate] = useState(false);

  // We map the application data if it exists, otherwise initialize empty
  const [formData, setFormData] = useState<any>({
    status: application?.status || 'DRAFT',
    applyDate: application?.applyDate ? new Date(application.applyDate).toISOString().split('T')[0] : '',
    sent1stDate: application?.sent1stDate ? new Date(application.sent1stDate).toISOString().split('T')[0] : '',
    received1stDate: application?.received1stDate ? new Date(application.received1stDate).toISOString().split('T')[0] : '',
    sent2ndDate: application?.sent2ndDate ? new Date(application.sent2ndDate).toISOString().split('T')[0] : '',
    received2ndDate: application?.received2ndDate ? new Date(application.received2ndDate).toISOString().split('T')[0] : '',
    totalExpectedJpy: application?.totalExpectedJpy || '',
    received1stJpy: application?.received1stJpy || '',
    received2ndJpy: application?.received2ndJpy || '',
    tax2ndJpy: application?.tax2ndJpy || '',
    serviceFeeJpy: application?.serviceFeeJpy || '',
    exchangeRate: application?.exchangeRate || '',
    serviceFeeVnd: application?.serviceFeeVnd || '',
    noticeDate: application?.noticeDate ? new Date(application.noticeDate).toISOString().split('T')[0] : '',
    noticeImageUrl: application?.noticeImageUrl || '',
    taxRepresentativeId: application?.taxRepresentativeId || ''
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev: any) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const calculateFees = () => {
    const received1 = parseFloat(formData.received1stJpy) || 0;
    const received2 = parseFloat(formData.received2ndJpy) || 0;
    const rate = parseFloat(formData.exchangeRate) || 165; 
    
    const totalReceived = received1 + received2;
    const feeJpy = totalReceived * 0.2;
    const feeVnd = feeJpy * rate;
    
    setFormData((prev: any) => ({
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
          setFormData((prev: any) => ({
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

  const handleCreateApp = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id, status: 'DRAFT' })
      });
      if (res.ok) {
        alert('Tạo hồ sơ thành công! Vui lòng làm mới trang.');
        window.location.reload();
      } else {
        alert('Lỗi khi tạo hồ sơ.');
      }
    } catch (e) {
      alert('Lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApp = async () => {
    if (!application) return;
    setLoading(true);
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

      const res = await fetch(`/api/applications/${application.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert('Đã lưu thông tin hồ sơ thuế thành công!');
      } else {
        alert('Có lỗi khi lưu hồ sơ thuế.');
      }
    } catch (e) {
      alert('Lỗi lưu dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrStatus('processing');
    const objectUrl = URL.createObjectURL(file);
    setFormData((prev: any) => ({ ...prev, noticeImageUrl: objectUrl }));

    const form = new FormData();
    form.append('file', file);
    form.append('documentType', 'noticeOfPayment');
    form.append('action', 'upload');

    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        setFormData((prev: any) => ({ ...prev, noticeImageUrl: data.publicUrl }));
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
        setFormData((prev: any) => ({
          ...prev,
          totalExpectedJpy: data.extractedData.totalExpectedJpy || prev.totalExpectedJpy,
          received1stJpy: data.extractedData.received1stJpy || prev.received1stJpy,
          tax2ndJpy: data.extractedData.tax2ndJpy || prev.tax2ndJpy
        }));
        setOcrStatus('done');
        alert('Trích xuất thành công!');
      } else {
        alert('Dữ liệu không hợp lệ');
        setOcrStatus('error');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi kết nối AI.');
      setOcrStatus('error');
    }
  };

  if (!application) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-slate-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Khách hàng này chưa có Hồ sơ Thuế</h2>
          <p className="text-slate-500 mb-6">Bạn cần tạo hồ sơ thuế để bắt đầu xử lý Nenkin Lần 1 và Lần 2.</p>
          <button 
            onClick={handleCreateApp} 
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Đang tạo...' : 'Tạo Hồ sơ Thuế'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto custom-scrollbar">
      <div className="flex justify-end mb-6">
        <button 
          onClick={handleSaveApp}
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {loading ? 'Đang lưu...' : 'Lưu Chi tiết Hồ sơ'}
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((step, index) => {
            const isActive = formData.status === step.id;
            const currentIndex = STATUS_STEPS.findIndex(s => s.id === formData.status);
            const isCompleted = index < currentIndex || formData.status === 'COMPLETED';
            
            return (
              <React.Fragment key={step.id}>
                <div 
                  className={`flex flex-col items-center gap-2 relative z-10 cursor-pointer ${isActive || isCompleted ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
                  onClick={() => setFormData((prev: any) => ({ ...prev, status: step.id }))}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/30' : isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 text-slate-400'}`}>
                    {isCompleted && !isActive ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-bold">{index + 1}</span>}
                  </div>
                  <span className={`text-xs font-semibold ${isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}>{step.label}</span>
                </div>
                
                {index < STATUS_STEPS.length - 1 && (
                  <div className="flex-1 h-[2px] bg-slate-200 mx-4 relative overflow-hidden rounded-full">
                    <div className={`absolute inset-y-0 left-0 bg-emerald-500 transition-all duration-500 ${isCompleted ? 'w-full' : 'w-0'}`}></div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lịch trình */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4 border-b pb-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Tiến trình & Thời gian
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ngày nộp hồ sơ</label>
              <input type="date" name="applyDate" value={formData.applyDate} onChange={handleChange} className="w-full text-sm px-3 py-2 border rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ngày gửi Lần 1</label>
              <input type="date" name="sent1stDate" value={formData.sent1stDate} onChange={handleChange} className="w-full text-sm px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ngày nhận Lần 1</label>
              <input type="date" name="received1stDate" value={formData.received1stDate} onChange={handleChange} className="w-full text-sm px-3 py-2 border rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ngày gửi Lần 2</label>
              <input type="date" name="sent2ndDate" value={formData.sent2ndDate} onChange={handleChange} className="w-full text-sm px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ngày nhận Lần 2</label>
              <input type="date" name="received2ndDate" value={formData.received2ndDate} onChange={handleChange} className="w-full text-sm px-3 py-2 border rounded-md" />
            </div>
          </div>
        </div>

        {/* Tài chính */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4 border-b pb-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Tài chính & Thuế
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Dự kiến nhận (JPY)</label>
              <input type="number" name="totalExpectedJpy" value={formData.totalExpectedJpy} onChange={handleChange} className="w-full text-sm px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Thực nhận Lần 1 (JPY)</label>
              <input type="number" name="received1stJpy" value={formData.received1stJpy} onChange={handleChange} className="w-full text-sm px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tiền thuế Lần 2 (JPY)</label>
              <input type="number" name="tax2ndJpy" value={formData.tax2ndJpy} onChange={handleChange} className="w-full text-sm px-3 py-2 border rounded-md" />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Tính phí dịch vụ</h3>
              <button onClick={calculateFees} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">Tính tự động</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tỷ giá JPY/VND</label>
                <input type="number" name="exchangeRate" value={formData.exchangeRate} onChange={handleChange} className="w-full text-sm px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phí Dịch vụ (VND)</label>
                <input type="number" name="serviceFeeVnd" value={formData.serviceFeeVnd} onChange={handleChange} className="w-full text-sm px-3 py-2 border rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
