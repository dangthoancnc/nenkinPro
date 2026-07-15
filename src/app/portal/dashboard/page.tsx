/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, CheckCircle, FileText, User, CreditCard, LogOut, Loader2, AlertCircle, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import DocumentCaptureOverlay from '@/components/DocumentCaptureOverlay';

export default function PortalDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
  type CustomerData = {
    id: string;
    fullName: string;
    code: string;
    cardNumber: string;
    status: string;
    uploadedDocuments?: Record<string, boolean>;
    applications?: { status: string; revisionNote: string | null }[];
  };
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureType, setCaptureType] = useState('');
  
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/portal/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            // Map DTO to local state structure
            const dto = data.customer;
            setCustomer({
              ...dto,
              uploadedDocuments: dto.uploadedDocuments
            });
          } else {
            if (data.requireReset) {
              router.push('/portal/reset-pin');
            } else {
              router.push('/portal/login');
            }
          }
        } else {
          if (res.status === 403) {
            router.push('/portal/reset-pin');
          } else {
            router.push('/portal/login');
          }
        }
      } catch (err) {
        console.error(err);
        router.push('/portal/login');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    document.cookie = "portal_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/portal/login');
  };

  const handleUpload = async (file: File, type: string, secFile?: File) => {
    if (!customer) return;
    
    setUploadingState(prev => ({ ...prev, [type]: true }));
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Determine document type for OCR API mapping
      let docType = 'other';
      let dbField = '';
      if (type === 'zairyu') { docType = 'zairyuFront'; dbField = 'zairyuFrontUrl'; }
      else if (type === 'passport') { docType = 'passport'; dbField = 'passportUrl'; }
      else if (type === 'nenkin') { docType = 'nenkinBook'; dbField = 'nenkinBookUrl'; }
      else if (type === 'bank') { docType = 'bankPassbook'; dbField = 'bankPassbookUrl'; }
      
      formData.append('documentType', docType);
      formData.append('action', 'upload');
      
      // If secFile is passed in extra arguments
      if (arguments.length > 2 && arguments[2]) {
        formData.append('securityFile', arguments[2]);
      }

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.success && data.publicUrl) {
        const updatePayload: Record<string, string> = { [dbField]: data.publicUrl };
        if (data.securityPhotoUrl) {
          updatePayload.securityPhotoUrl = data.securityPhotoUrl;
        }

        // Save to DB
        await fetch('/api/portal/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });

        // Update local state by re-fetching
        const resProfile = await fetch('/api/portal/auth/me');
        if (resProfile.ok) {
          const profileData = await resProfile.json();
          if (profileData.success) {
            setCustomer({ ...profileData.customer, uploadedDocuments: profileData.customer.uploadedDocuments });
          }
        }

      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed due to network error');
    } finally {
      setUploadingState(prev => ({ ...prev, [type]: false }));
    }
  };

  if (loading || !customer) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const appData = customer.applications?.[0];
  const appStatus = appData?.status || 'DRAFT';
  const isEditable = ['PENDING', 'DRAFT', 'REVISION_REQUIRED'].includes(appStatus);

  const handleTriggerCapture = (type: string, fileInputRef: React.RefObject<HTMLInputElement | null>) => {
    const isDesktop = window.innerWidth > 768;
    if (isDesktop) {
      fileInputRef.current?.click();
    } else {
      setCaptureType(type);
      setCaptureOpen(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      
      {appStatus === 'REVISION_REQUIRED' && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-orange-800 font-bold">Hồ sơ cần bổ sung / chỉnh sửa</h3>
            <p className="text-orange-700 text-sm mt-1">
              Nhân viên yêu cầu bạn cập nhật lại hồ sơ với lý do: <strong className="bg-orange-100 px-1 rounded">{appData?.revisionNote || 'Vui lòng kiểm tra lại hình ảnh'}</strong>
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Xin chào, {customer.fullName}</h2>
          <div>
            <p className="text-slate-500">Mã hồ sơ: <span className="font-mono font-medium text-indigo-600">{customer.code}</span></p>
            {customer.cardNumber && (
              <p className="text-slate-500 text-sm">Số thẻ ngoại kiều: <span className="font-mono font-medium text-slate-700">{customer.cardNumber}</span></p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Hồ sơ Mới
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocumentUploadCard 
          title="Thẻ Ngoại Kiều (Zairyu Card)" 
          description="Bản chụp mặt trước rõ nét"
          icon={<CreditCard className="w-5 h-5 text-indigo-500" />}
          isUploaded={!!customer.uploadedDocuments?.zairyuFront}
          docType="zairyuFront"
          isUploading={uploadingState['zairyu']}
          isEditable={isEditable}
          onTrigger={(ref) => handleTriggerCapture('zairyu', ref)}
          onUpload={(file) => handleUpload(file, 'zairyu')}
        />
        <DocumentUploadCard 
          title="Hộ chiếu (Passport)" 
          description="Trang thông tin cá nhân và chữ ký"
          icon={<User className="w-5 h-5 text-indigo-500" />}
          isUploaded={!!customer.uploadedDocuments?.passport}
          docType="passport"
          isUploading={uploadingState['passport']}
          isEditable={isEditable}
          onTrigger={(ref) => handleTriggerCapture('passport', ref)}
          onUpload={(file) => handleUpload(file, 'passport')}
        />
        <DocumentUploadCard 
          title="Sổ tay Nenkin" 
          description="Trang có ghi Số Nenkin"
          icon={<FileText className="w-5 h-5 text-indigo-500" />}
          isUploaded={!!customer.uploadedDocuments?.nenkinBook}
          docType="nenkinBook"
          isUploading={uploadingState['nenkin']}
          isEditable={isEditable}
          onTrigger={(ref) => handleTriggerCapture('nenkin', ref)}
          onUpload={(file) => handleUpload(file, 'nenkin')}
        />
        <DocumentUploadCard 
          title="Sổ/Thẻ Ngân hàng" 
          description="Ngân hàng nhận tiền hoàn thuế"
          icon={<BanknoteIcon className="w-5 h-5 text-indigo-500" />}
          isUploaded={!!customer.uploadedDocuments?.bankPassbook}
          docType="bankPassbook"
          isUploading={uploadingState['bank']}
          isEditable={isEditable}
          onTrigger={(ref) => handleTriggerCapture('bank', ref)}
          onUpload={(file) => handleUpload(file, 'bank')}
        />
      </div>

      <DocumentCaptureOverlay 
        isOpen={captureOpen} 
        onClose={() => setCaptureOpen(false)} 
        onCapture={(docFile, secFile) => {
          setCaptureOpen(false);
          handleUpload(docFile, captureType, secFile);
        }} 
        documentType={captureType} 
      />

      <Card className="border-indigo-100 shadow-sm mt-8">
        <CardHeader className="bg-indigo-50/50 border-b pb-4">
          <CardTitle className="text-lg text-indigo-900">Tiến trình Hồ sơ</CardTitle>
          <CardDescription>Theo dõi tình trạng hoàn thuế của bạn</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 py-2">
            <TimelineItem title="Tạo hồ sơ" date="Hôm nay" active={true} />
            <TimelineItem title="Đang xét duyệt chứng từ" date="Chờ cập nhật" active={false} />
            <TimelineItem title="Nộp Cục Thuế lần 1" date="Chờ cập nhật" active={false} />
            <TimelineItem title="Hoàn thành" date="Chờ cập nhật" active={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BanknoteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
  );
}

function DocumentUploadCard({ title, description, icon, isUploaded, docType, onUpload, onTrigger, isUploading, isEditable = true }: { title: string; description: string; icon: React.ReactNode; isUploaded: boolean; docType: string; onUpload: (f: File) => void; onTrigger?: (ref: React.RefObject<HTMLInputElement | null>) => void; isUploading?: boolean; isEditable?: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  
  const handleClick = () => {
    if (!isEditable) return;
    if (onTrigger) {
      onTrigger(fileInputRef);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setViewUrl(null); // Reset preview
      onUpload(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleViewImage = async () => {
    if (viewUrl) return; // already loaded
    setLoadingUrl(true);
    try {
      const res = await fetch(`/api/portal/documents/${docType}/signed-url`);
      const data = await res.json();
      if (data.success && data.signedUrl) {
        setViewUrl(data.signedUrl);
      } else {
        alert('Không thể tải ảnh: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi mạng khi tải ảnh');
    } finally {
      setLoadingUrl(false);
    }
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-200">
      <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            {icon} {title}
          </CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </div>
        {isUploaded ? (
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" title="Chưa cập nhật"></div>
        )}
      </CardHeader>
      <CardContent>
        {isUploaded ? (
          <div className="relative group">
            {viewUrl ? (
              <div className="h-32 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center overflow-hidden">
                <img src={viewUrl} alt={title} className="max-h-full max-w-full p-2 object-contain" />
              </div>
            ) : (
              <div className="h-32 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center">
                <button 
                  onClick={handleViewImage} 
                  disabled={loadingUrl}
                  className="px-4 py-2 bg-white text-indigo-600 font-medium rounded-lg shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors border border-slate-200"
                >
                  {loadingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Xem ảnh đã tải lên
                </button>
              </div>
            )}
            
            {isEditable && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                <button 
                  onClick={handleClick} 
                  disabled={isUploading}
                  className="px-4 py-2 bg-white text-slate-800 font-bold rounded-lg shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                  Tải lại ảnh mới
                </button>
              </div>
            )}
            <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleFileChange} />
          </div>
        ) : (
          <div 
            onClick={handleClick}
            className={`h-32 border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl flex flex-col items-center justify-center transition-colors ${isEditable && !isUploading ? 'hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer group' : 'opacity-70 cursor-not-allowed'}`}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
            ) : (
              <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" />
            )}
            <span className={`text-sm font-medium ${isUploading ? 'text-indigo-600' : 'text-slate-600 group-hover:text-indigo-600'}`}>
              {isUploading ? 'Đang tải lên...' : 'Nhấn để tải lên'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineItem({ title, date, active }: { title: string; date: string; active: boolean }) {
  return (
    <div className="relative pl-6">
      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white ${active ? 'border-indigo-600 bg-indigo-100' : 'border-slate-300'}`}></div>
      <h3 className={`font-semibold text-sm ${active ? 'text-slate-800' : 'text-slate-500'}`}>{title}</h3>
      <p className="text-xs text-slate-400 mt-1">{date}</p>
    </div>
  );
}
