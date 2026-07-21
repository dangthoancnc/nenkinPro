'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, X, UploadCloud, CheckCircle, AlertCircle, ZoomIn, Clock, Send, Wallet, Trash2, Sparkles, Printer, Map, MapPin, Search, Crop } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workspaceSchema, WorkspaceFormValues } from '@/lib/validations/workspaceSchema';
import { BankAutocomplete } from '../components/BankAutocomplete';
import ImageCropModal from '@/components/ImageCropModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

const BASE_DOCUMENTS = [
  { key: 'zairyuFront', title: 'Thẻ Ngoại Kiều (Trước)', urlField: 'zairyuFrontUrl' },
  { key: 'zairyuBack', title: 'Thẻ Ngoại Kiều (Sau)', urlField: 'zairyuBackUrl' },
  { key: 'passport', title: 'Hộ chiếu', urlField: 'passportUrl' },
  { key: 'nenkinBook', title: 'Sổ Nenkin', urlField: 'nenkinBookUrl' },
  { key: 'departureStamp', title: 'Dấu xuất cảnh', urlField: 'departureStampUrl' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Cần duyệt', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertCircle },
  DRAFT: { label: 'Bản nháp', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  SENT_1ST: { label: 'Đã gửi Lần 1', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send },
  RECEIVED_1ST: { label: 'Đã nhận Lần 1', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Wallet },
  SENT_2ND: { label: 'Đã gửi Lần 2', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Send },
  RECEIVED_2ND: { label: 'Đã nhận Lần 2', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Wallet },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
};

export default function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [ocrStatus, setOcrStatus] = useState<Record<string, string>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<string>('zairyuFront');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [manualConfirmed, setManualConfirmed] = useState<boolean>(false);
  const [taxOffices, setTaxOffices] = useState<Array<any>>([]);
  const [isAddingTaxOffice, setIsAddingTaxOffice] = useState<boolean>(false);
  const [creatingTaxOffice, setCreatingTaxOffice] = useState<boolean>(false);
  const [syncingTaxOffice, setSyncingTaxOffice] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [verifiedFields, setVerifiedFields] = useState<Record<string, boolean>>({});
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropDocKey, setCropDocKey] = useState<string>('');
  const [cropUrlField, setCropUrlField] = useState<string>('');
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const toggleVerify = (field: string) => {
    setVerifiedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  const [ntaSearchInfo, setNtaSearchInfo] = useState({
    name: '',
    address: '',
    romajiAddress: '',
    postalCode: '',
    phone: '',
    websiteUrl: ''
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, getValues, watch, control } = useForm<WorkspaceFormValues>({
    mode: 'onBlur',
    defaultValues: { status: 'DRAFT' }
  });

  const { fields: bankFields, append: appendBank, remove: removeBank } = useFieldArray({
    control,
    name: "bankAccounts",
  });

  const dynamicDocuments = React.useMemo(() => {
    const banks = watch('bankAccounts') || [];
    const bankDocs = banks.flatMap((bank, index) => {
      const urls = bank.bankPassbookUrls || [];
      const purposeLabel = bank.purpose === 'FIRST_REFUND' ? 'Lần 1' : bank.purpose === 'SECOND_REFUND' ? 'Lần 2' : 'Chung';
      const items = urls.map((url: string, urlIndex: number) => ({
        key: `bankPassbook_${index}_${urlIndex}`,
        title: `Sổ Ngân hàng (${purposeLabel}) - Ảnh ${urlIndex + 1}`,
        urlField: `bankAccounts.${index}.bankPassbookUrls.${urlIndex}`
      }));
      items.push({
        key: `bankPassbook_${index}_${urls.length}`,
        title: `Sổ Ngân hàng (${purposeLabel}) - Thêm ảnh`,
        urlField: `bankAccounts.${index}.bankPassbookUrls.${urls.length}`
      });
      return items;
    });

    return [
      BASE_DOCUMENTS[0],
      BASE_DOCUMENTS[1],
      BASE_DOCUMENTS[2],
      BASE_DOCUMENTS[3],
      ...bankDocs,
      BASE_DOCUMENTS[4]
    ];
  }, [watch('bankAccounts')]);

  // Fetch Data if not new
  useEffect(() => {
    if (isNew) return;
    async function fetchData() {
      try {
        const res = await fetch(`/api/applications/${id}`);
        if (res.ok) {
          const data = await res.json();
          setCustomerId(data.customerId || null);
          const customer = data.customer || {};
          setCustomer(customer);
          setManualConfirmed(customer.status === 'VERIFIED');
          
          const formatDate = (dateStr: string | null | undefined) => {
            if (!dateStr) return '';
            return new Date(dateStr).toISOString().split('T')[0];
          };

          const formValues: any = {
            ...customer,
            dob: formatDate(customer.dob),
            departureDate: formatDate(customer.departureDate),
            passportIssueDate: formatDate(customer.passportIssueDate),
            passportExpiryDate: formatDate(customer.passportExpiryDate),
            
            status: data.status,
            applyDate: formatDate(data.applyDate),
            sent1stDate: formatDate(data.sent1stDate),
            received1stDate: formatDate(data.received1stDate),
            sent2ndDate: formatDate(data.sent2ndDate),
            received2ndDate: formatDate(data.received2ndDate),
            totalExpectedJpy: data.totalExpectedJpy || '',
            received1stJpy: data.received1stJpy || '',
            received2ndJpy: data.received2ndJpy || '',
            serviceFeeJpy: data.serviceFeeJpy || '',
            exchangeRate: data.exchangeRate || '',
            serviceFeeVnd: data.serviceFeeVnd || '',
          };
          Object.keys(formValues).forEach(key => {
            if (formValues[key] === null) {
              if (key === 'hasPermanentResidence') {
                formValues[key] = false;
              } else {
                formValues[key] = '';
              }
            }
          });
          if (customer.status === 'VERIFIED') {
            setVerifiedFields({
              fullName: true,
              dob: true,
              cardNumber: true,
              zairyuAddress: true,
              postalCode: true,
              taxOffice_name: true,
              taxOffice_postalCode: true,
              taxOffice_address: true,
              taxOffice_phone: true,
              taxOffice_websiteUrl: true
            });
            setManualConfirmed(true);
          } else {
            setVerifiedFields({});
            setManualConfirmed(false);
          }
          reset(formValues);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
        toast.error('Không thể tải dữ liệu hồ sơ', { description: 'Vui lòng thử lại hoặc kiểm tra kết nối.' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    fetch('/api/tax-offices')
      .then(res => res.json())
      .then(data => {
        if (data.success) setTaxOffices(data.data);
      })
      .catch(console.error);
  }, [id, isNew, reset]);

  const selectedTaxOfficeId = watch('taxOfficeId');
  useEffect(() => {
    const office = taxOffices.find(t => t.id === selectedTaxOfficeId);
    if (office) {
      setNtaSearchInfo({
        name: office.name || '',
        postalCode: office.postalCode || '',
        address: office.address || '',
        romajiAddress: office.romajiAddress || '',
        phone: office.phone || '',
        websiteUrl: office.websiteUrl || ''
      });
    } else {
      setNtaSearchInfo({ name: '', address: '', romajiAddress: '', postalCode: '', phone: '', websiteUrl: '' });
    }
  }, [selectedTaxOfficeId, taxOffices]);

  const onSubmit = async (data: WorkspaceFormValues) => {
    setSaving(true);
    const toastId = toast.loading(isNew ? 'Đang tạo hồ sơ mới...' : 'Đang lưu hồ sơ...');
    try {
      const customerPayload = {
        fullName: data.fullName,
        dob: data.dob ? new Date(data.dob).toISOString() : undefined,
        nationality: data.nationality,
        myNumber: data.myNumber,
        zairyuAddress: data.zairyuAddress,
        cardNumber: data.cardNumber,
        nenkinNumber: data.nenkinNumber,
        nenkinKatakanaName: data.nenkinKatakanaName,
        postalCode: data.postalCode,
        taxOfficeId: data.taxOfficeId,
        bankAccounts: data.bankAccounts,
        zairyuFrontUrl: data.zairyuFrontUrl,
        zairyuBackUrl: data.zairyuBackUrl,
        passportUrl: data.passportUrl,
        nenkinBookUrl: data.nenkinBookUrl,
        departureStampUrl: data.departureStampUrl,
        status: manualConfirmed ? 'VERIFIED' : 'PENDING',
        sex: data.sex,
        phone: data.phone,
        passportIssueDate: data.passportIssueDate ? new Date(data.passportIssueDate).toISOString() : null,
        passportExpiryDate: data.passportExpiryDate ? new Date(data.passportExpiryDate).toISOString() : null,
        departureDate: data.departureDate ? new Date(data.departureDate).toISOString() : null,
      };

      const applicationPayload = {
        status: data.status,
        applyDate: data.applyDate ? new Date(data.applyDate).toISOString() : null,
        sent1stDate: data.sent1stDate ? new Date(data.sent1stDate).toISOString() : null,
        received1stDate: data.received1stDate ? new Date(data.received1stDate).toISOString() : null,
        sent2ndDate: data.sent2ndDate ? new Date(data.sent2ndDate).toISOString() : null,
        received2ndDate: data.received2ndDate ? new Date(data.received2ndDate).toISOString() : null,
        totalExpectedJpy: data.totalExpectedJpy ? parseFloat(String(data.totalExpectedJpy)) : null,
        received1stJpy: data.received1stJpy ? parseFloat(String(data.received1stJpy)) : null,
        received2ndJpy: data.received2ndJpy ? parseFloat(String(data.received2ndJpy)) : null,
        serviceFeeJpy: data.serviceFeeJpy ? parseFloat(String(data.serviceFeeJpy)) : null,
        exchangeRate: data.exchangeRate ? parseFloat(String(data.exchangeRate)) : null,
        serviceFeeVnd: data.serviceFeeVnd ? parseFloat(String(data.serviceFeeVnd)) : null,
      };

      if (isNew) {
        const cRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customerPayload)
        });
        const cData = await cRes.json();
        if (!cRes.ok || !cData.success) throw new Error(cData.error || 'Cannot create customer');

        const aRes = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...applicationPayload, customerId: cData.data.id })
        });
        const aData = await aRes.json();
        if (!aRes.ok || aData.error) throw new Error(aData.error || 'Cannot create application');

        toast.success('Tạo hồ sơ thành công!', { id: toastId, description: `Hồ sơ đã được lưu với ID: ${aData.id?.slice(0, 8)}...` });
        router.push(`/applications/${aData.id}`);
      } else {
        const appRes = await fetch(`/api/applications/${id}`);
        if (!appRes.ok) {
          const errData = await appRes.json();
          throw new Error(errData.error || 'Lỗi lấy thông tin hồ sơ.');
        }
        const appData = await appRes.json();

        if (appData.customerId) {
          const cRes = await fetch(`/api/customers/${appData.customerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerPayload)
          });
          if (!cRes.ok) {
            const errData = await cRes.json();
            throw new Error(errData.error || 'Lỗi cập nhật thông tin khách hàng.');
          }
        }
        
        const aRes = await fetch(`/api/applications/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(applicationPayload)
        });
        if (!aRes.ok) {
          const errData = await aRes.json();
          throw new Error(errData.error || 'Lỗi cập nhật tiến trình hồ sơ.');
        }

        toast.success('Lưu hồ sơ thành công!', { id: toastId, description: 'Tất cả thay đổi đã được lưu.' });
        setIsEditing(false);
      }
    } catch (e: any) {
      toast.error('Đã có lỗi xảy ra', { id: toastId, description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    toast('Bạn có chắc muốn xóa hồ sơ này?', {
      description: 'Hành động này không thể hoàn tác.',
      action: {
        label: 'Xóa',
        onClick: async () => {
          setDeleting(true);
          const toastId = toast.loading('Đang xóa hồ sơ...');
          try {
            const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Không thể xóa hồ sơ');
            toast.success('Đã xóa hồ sơ thành công!', { id: toastId });
            router.push('/applications');
          } catch (e: any) {
            toast.error('Đã xảy ra lỗi', { id: toastId, description: e.message });
            setDeleting(false);
          }
        },
      },
      cancel: {
        label: 'Hủy',
        onClick: () => {},
      },
      duration: 8000,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docKey: string, urlField: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropDocKey(docKey);
    setCropUrlField(urlField);
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropImageSrc(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const file = new File([croppedBlob], cropFile?.name || 'cropped.jpg', { type: croppedBlob.type });
    const docKey = cropDocKey;
    const urlField = cropUrlField;
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
    setCropFile(null);
    setCropDocKey('');
    setCropUrlField('');

    setOcrStatus(prev => ({ ...prev, [docKey]: 'processing' }));
    
    const objectUrl = URL.createObjectURL(file);
    setValue(urlField as any, objectUrl);

    const form = new FormData();
    form.append('file', file);
    form.append('documentType', docKey);
    form.append('action', 'uploadAndExtract');
    if (customerId) {
      form.append('customerId', customerId);
    }

    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        const prevUrl = getValues(urlField as any);
        if (prevUrl && prevUrl !== data.publicUrl) {
          fetch('/api/storage/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: prevUrl })
          }).catch(err => console.error('Failed to delete previous storage file:', err));
        }

        setValue(urlField as any, data.publicUrl);
        setOcrStatus(prev => ({ ...prev, [docKey]: 'done' }));

        if (data.extractedData && !data.extractedData.error) {
          const ext = data.extractedData;
          if (docKey === 'zairyuFront' || docKey === 'zairyuBack') {
            if (ext.fullName) setValue('fullName', ext.fullName, { shouldValidate: true, shouldDirty: true });
            if (ext.dob) setValue('dob', ext.dob, { shouldValidate: true, shouldDirty: true });
            if (ext.nationality) setValue('nationality', ext.nationality, { shouldDirty: true });
            if (ext.cardNumber) setValue('cardNumber', ext.cardNumber, { shouldDirty: true });
            if (ext.address) setValue('zairyuAddress', ext.address, { shouldDirty: true });
            if (ext.postalCode) setValue('postalCode', ext.postalCode, { shouldDirty: true });
            
            if (ext.taxOffice && ext.taxOffice.name) {
              fetch('/api/tax-offices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ext.taxOffice)
              }).then(res => res.json()).then(tData => {
                if (tData.success && tData.data?.id) {
                  setTaxOffices(prev => {
                    if (!prev.find(t => t.id === tData.data.id)) {
                      return [...prev, tData.data];
                    }
                    return prev;
                  });
                  setValue('taxOfficeId', tData.data.id, { shouldDirty: true });
                }
              }).catch(err => console.error('Failed to create/fetch tax office', err));
            }
          } else if (docKey === 'passport') {
            if (ext.lastName || ext.firstName) setValue('fullName', `${ext.lastName || ''} ${ext.firstName || ''}`.trim(), { shouldDirty: true });
            if (ext.dob) setValue('dob', ext.dob, { shouldDirty: true });
            if (ext.nationality) setValue('nationality', ext.nationality, { shouldDirty: true });
            if (ext.sex) setValue('sex', ext.sex === 'M' ? 'Nam' : 'Nữ', { shouldDirty: true });
            if (ext.passportNumber) setValue('cardNumber', ext.passportNumber, { shouldDirty: true });
          } else if (docKey === 'nenkinBook') {
            if (ext.nenkinNumber) setValue('nenkinNumber', ext.nenkinNumber, { shouldDirty: true });
            if (ext.nenkinKatakanaName) setValue('nenkinKatakanaName', ext.nenkinKatakanaName, { shouldDirty: true });
          } else if (docKey.startsWith('bankPassbook_')) {
            const idxStr = docKey.split('_')[1];
            const idx = parseInt(idxStr, 10);
            if (!isNaN(idx)) {
              if (ext.bankName) setValue(`bankAccounts.${idx}.bankName` as any, ext.bankName, { shouldDirty: true });
              if (ext.branchName) setValue(`bankAccounts.${idx}.branchName` as any, ext.branchName, { shouldDirty: true });
              if (ext.accountNumber) setValue(`bankAccounts.${idx}.accountNumber` as any, ext.accountNumber, { shouldDirty: true });
              if (ext.accountName) setValue(`bankAccounts.${idx}.accountName` as any, ext.accountName, { shouldDirty: true });
              if (ext.swiftCode) setValue(`bankAccounts.${idx}.swiftCode` as any, ext.swiftCode, { shouldDirty: true });
            }
          } else if (docKey === 'departureStamp') {
            if (ext.departureDate) setValue('departureDate', ext.departureDate, { shouldDirty: true });
          }
        }

        if (!isNew && customerId) {
          await fetch(`/api/customers/${customerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [urlField]: data.publicUrl })
          });
        }
      } else {
        toast.error('Lỗi upload ảnh', { description: data.error || 'Không thể tải ảnh lên.' });
        setOcrStatus(prev => ({ ...prev, [docKey]: 'error' }));
      }
    } catch (err) {
      toast.error('Đã xảy ra lỗi khi upload', { description: 'Vui lòng thử lại.' });
      setOcrStatus(prev => ({ ...prev, [docKey]: 'error' }));
    }
  };

  const handleNtaSearch = (zip: string | null | undefined) => {
    if (!zip) {
      toast.warning('Chưa có mã bưu điện', { description: 'Vui lòng nhập mã bưu điện của khách hàng trước.' });
      return;
    }
    const cleanedZip = zip.replace(/[-\s]/g, '');
    if (cleanedZip.length !== 7) {
      toast.warning('Mã bưu điện không hợp lệ', { description: 'Mã bưu điện phải bao gồm đúng 7 chữ số.' });
      return;
    }
    const zip3 = cleanedZip.substring(0, 3);
    const zip4 = cleanedZip.substring(3, 7);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://www.nta.go.jp/cgi-bin/zeimusho/kensaku/kensakuprocess.php';
    form.target = '_blank';
    form.acceptCharset = 'EUC-JP';

    const inputs = {
      KSTYPE: 'ksz',
      TODOFUKEN_TO_ASCII: '',
      ADDR_TO_ASCII: '',
      kszc1: zip3,
      kszc2: zip4
    };

    for (const [key, value] of Object.entries(inputs)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  const onError = (formErrors: any) => {
    console.error('Validation errors:', formErrors);
    toast.error('Không thể lưu hồ sơ', {
      description: 'Lỗi nhập liệu: ' + Object.keys(formErrors).map(k => `${k}: ${formErrors[k].message || 'Không hợp lệ'}`).join(', '),
      duration: 6000,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="h-[calc(100vh-65px)] flex flex-col space-y-2">
      {/* Header Actions */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push('/applications')} className="p-1.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
              {isNew ? 'Tạo Hồ sơ mới' : 'Chi tiết Hồ sơ'}
              {!isNew && <span className="text-[10px] font-normal text-slate-400">ID: {id}</span>}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <>
              {!isNew && (
                <Button type="button" variant="outline" onClick={handleDelete} disabled={deleting} className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50">
                  {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin inline" /> : null}
                  {deleting ? 'Đang xóa...' : 'Xóa Hồ sơ'}
                </Button>
              )}
              {!isNew && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowPrintModal(true)}
                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  <Printer className="w-4 h-4 mr-2 inline" />
                  In biểu mẫu
                </Button>
              )}
              <Button type="button" onClick={() => setIsEditing(true)} className="min-w-[120px] shadow-lg shadow-blue-600/20">
                Sửa Hồ sơ
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => {
                if (isNew) {
                  router.push('/applications');
                } else {
                  setIsEditing(false);
                  reset();
                }
              }} disabled={saving}>
                Hủy thao tác
              </Button>
              <Button type="submit" disabled={saving || deleting} className="min-w-[120px] shadow-lg shadow-blue-600/20">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? 'Đang lưu...' : 'Lưu Hồ sơ'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Application Status Banner */}
      {!isNew && (
        <div className={`p-1.5 px-3 rounded-lg border flex items-center justify-between shadow-3xs text-[11px] shrink-0 ${
          statusConfig[customer?.applicationStatus || 'PENDING']?.color || 'bg-slate-100 text-slate-700 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = statusConfig[customer?.applicationStatus || 'PENDING']?.icon || Clock;
              return <Icon className="w-4 h-4 shrink-0" />;
            })()}
            <div>
              <span className="font-bold">Trạng thái hồ sơ: </span>
              <span>{statusConfig[customer?.applicationStatus || 'PENDING']?.label || 'Không xác định'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Split Layout - 3 Panels */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        
        {/* Panel 1: Documents & Image (Left) */}
        <div className="col-span-1 md:col-span-4 flex flex-col h-full bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden min-h-0">
          <div className="p-3 border-b border-slate-100 flex flex-col gap-1.5 shrink-0 bg-slate-50/50">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Danh mục tài liệu</div>
            <div className="grid grid-cols-3 gap-1">
              {dynamicDocuments.map(doc => {
                const isActive = activeDoc === doc.key;
                const hasUrl = !!watch(doc.urlField as any);
                return (
                  <button
                    key={doc.key}
                    type="button"
                    onClick={() => setActiveDoc(doc.key)}
                    className={`px-2 py-1 text-[11px] font-medium border rounded transition-all truncate text-center ${
                      isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1">
                      {hasUrl && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>}
                      {doc.title}
                    </span>
                  </button>
                );
              })}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    const newIndex = bankFields.length;
                    appendBank({ purpose: 'BOTH', bankCountry: 'VIETNAM', bankPassbookUrls: [] });
                    setActiveDoc(`bankPassbook_${newIndex}`);
                  }}
                  className="px-2 py-1 text-[11px] font-medium border border-dashed border-indigo-300 rounded transition-all truncate text-center text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100"
                  title="Thêm tài khoản ngân hàng"
                >
                  <span className="flex items-center justify-center gap-1">+ Thêm Ngân hàng</span>
                </button>
              )}
            </div>
          </div>

          {/* Document Viewer */}
          {(() => {
            const currentDocField = dynamicDocuments.find(d => d.key === activeDoc)?.urlField || 'zairyuFrontUrl';
            const currentDocUrl = watch(currentDocField as any) as string | undefined;
            const currentDocTitle = dynamicDocuments.find(d => d.key === activeDoc)?.title || '';
            return (
              <div className="flex-1 p-3 flex flex-col min-h-0 bg-slate-100/30 overflow-hidden relative">
                <div className="flex justify-between items-center mb-2 shrink-0">
                  <span className="text-xs font-semibold text-slate-700">
                    {currentDocTitle}
                  </span>
                </div>
                
                <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden bg-slate-900/5 flex items-center justify-center relative group min-h-0">
                  {currentDocUrl ? (
                    <div className="relative w-full h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={currentDocUrl} 
                        alt={currentDocTitle} 
                        className="w-full h-full object-contain" 
                      />
                      
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                        {isEditing && (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!currentDocUrl) return;
                                if (ocrStatus[activeDoc] === 'done') {
                                  toast('Tài liệu đã được trích xuất trước đó', {
                                    description: 'Bạn có muốn chạy lại trích xuất AI không?',
                                    action: { label: 'Chạy lại', onClick: () => runOcrExtract(currentDocUrl) },
                                    cancel: { label: 'Hủy', onClick: () => {} },
                                    duration: 8000,
                                  });
                                  return;
                                }
                                runOcrExtract(currentDocUrl);
                              }}
                              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md border border-indigo-700 shadow-md transition-all flex items-center justify-center"
                              title="Trích xuất AI"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (currentDocUrl) {
                                  setCropDocKey(activeDoc);
                                  setCropUrlField(currentDocField);
                                  setCropImageSrc(currentDocUrl);
                                }
                              }}
                              className="p-1.5 bg-white/95 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 rounded-md border border-slate-200/80 shadow-md transition-all flex items-center justify-center"
                              title="Cắt / Sửa ảnh hiện tại"
                            >
                              <Crop className="w-4 h-4" />
                            </button>
                            <label className="cursor-pointer p-1.5 bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-md border border-slate-200/80 shadow-md transition-all flex items-center justify-center" title="Thay thế ảnh">
                              <UploadCloud className="w-4 h-4" />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={(e) => handleFileSelect(e, activeDoc, currentDocField)} 
                              />
                            </label>
                            <button 
                              type="button" 
                              onClick={async () => {
                                toast(`Xóa ảnh ${currentDocTitle}?`, {
                                  description: 'Thao tác này sẽ xóa ảnh khỏi tài liệu.',
                                  action: {
                                    label: 'Xóa',
                                    onClick: async () => {
                                      const prevUrl = getValues(currentDocField as any);
                                      if (prevUrl) {
                                        fetch('/api/storage/delete', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ url: prevUrl })
                                        }).catch(err => console.error('Failed to delete storage file:', err));
                                      }
                                      setValue(currentDocField as any, '');
                                      if (!isNew && customerId) {
                                        await fetch(`/api/customers/${customerId}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ [currentDocField]: '' })
                                        });
                                      }
                                      toast.success('Đã xóa ảnh tài liệu');
                                    },
                                  },
                                  cancel: { label: 'Hủy', onClick: () => {} },
                                  duration: 8000,
                                });
                              }}
                              className="p-1.5 bg-white/95 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-md border border-slate-200/80 shadow-md transition-all flex items-center justify-center"
                              title="Xóa ảnh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button 
                          type="button" 
                          onClick={() => setLightboxUrl(currentDocUrl || null)} 
                          className="p-1.5 bg-white/95 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 rounded-md border border-slate-200/80 shadow-md transition-all flex items-center justify-center"
                          title="Phóng to"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : isEditing ? (
                    <label 
                      className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full hover:bg-slate-900/5 transition-all text-slate-400 hover:text-indigo-600 bg-white border border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-6"
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const fakeEvent = { target: { files: e.dataTransfer.files } } as any;
                          handleFileSelect(fakeEvent as any, activeDoc, currentDocField);
                        }
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-indigo-50/50 flex items-center justify-center transition-transform">
                        <UploadCloud className="w-6 h-6 text-indigo-500" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">Nhấp hoặc Kéo thả vào đây để tải ảnh lên</span>
                      <span className="text-[10px] text-slate-400">Định dạng chấp nhận: PNG, JPG, JPEG</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleFileSelect(e, activeDoc, currentDocField)} 
                      />
                    </label>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 w-full h-full text-slate-400 bg-white border border-dashed border-slate-200 rounded-lg p-6">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                        <UploadCloud className="w-6 h-6 text-slate-300" />
                      </div>
                      <span className="text-xs font-semibold text-slate-400">Chưa có ảnh tài liệu</span>
                      <span className="text-[10px] text-slate-400">Bật chế độ "Sửa hồ sơ" để tải ảnh lên</span>
                    </div>
                  )}
                </div>
                
                {ocrStatus[activeDoc] === 'processing' && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
                    <span className="text-xs text-blue-600 flex items-center gap-1.5 bg-white border border-blue-100 px-3 py-1.5 rounded-full shadow-sm">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang quét OCR...
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Panel 2: Form Inputs (Middle) */}
        <div className="col-span-1 md:col-span-3 flex flex-col h-full bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden min-h-0">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thông tin chi tiết nhập liệu</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {(() => {
              switch (activeDoc) {
                case 'zairyuFront':
                case 'zairyuBack':
                  return (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN THẺ NGOẠI KIỀU</div>
                      {(() => {
                        const zairyuFields = ['fullName', 'dob', 'cardNumber', 'zairyuAddress', 'postalCode'];
                        const isZairyuVerified = zairyuFields.every(field => verifiedFields[field]);
                        return (
                          <div className={`p-1 px-2 rounded border flex items-center justify-between text-[10px] font-bold ${
                            isZairyuVerified
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : 'bg-amber-50 border-amber-100 text-amber-700'
                          }`}>
                            <span className="flex items-center gap-1">
                              <CheckCircle className={`w-3.5 h-3.5 ${isZairyuVerified ? 'text-emerald-600' : 'text-slate-400 animate-pulse'}`} />
                              Trạng thái duyệt thông tin:
                            </span>
                            <span>{isZairyuVerified ? 'ĐÃ DUYỆT KHỚP' : 'CHƯA DUYỆT KHỚP'}</span>
                          </div>
                        );
                      })()}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-500">Họ và tên *</label>
                        <div className="flex gap-1.5 items-center">
                          <Input {...register('fullName')} disabled={!isEditing} className={`h-8 py-0.5 text-xs flex-1 ${errors.fullName ? 'border-rose-400' : ''}`} />
                          <button type="button" onClick={() => toggleVerify('fullName')} className={`p-1.5 border rounded-md transition-colors shrink-0 h-8 w-8 flex items-center justify-center ${verifiedFields['fullName'] ? 'bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`} title={verifiedFields['fullName'] ? 'Đã xác nhận khớp' : 'Xác nhận khớp dữ liệu'}><CheckCircle className="w-4 h-4" /></button>
                        </div>
                        {errors.fullName && <span className="text-[10px] text-rose-500">{errors.fullName.message as string}</span>}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-500">Ngày sinh *</label>
                        <div className="flex gap-1.5 items-center">
                          <Input type="date" {...register('dob')} disabled={!isEditing} className={`h-8 py-0.5 text-xs flex-1 ${errors.dob ? 'border-rose-400' : ''}`} />
                          <button type="button" onClick={() => toggleVerify('dob')} className={`p-1.5 border rounded-md transition-colors shrink-0 h-8 w-8 flex items-center justify-center ${verifiedFields['dob'] ? 'bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`} title={verifiedFields['dob'] ? 'Đã xác nhận khớp' : 'Xác nhận khớp dữ liệu'}><CheckCircle className="w-4 h-4" /></button>
                        </div>
                        {errors.dob && <span className="text-[10px] text-rose-500">{errors.dob.message as string}</span>}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-500">Quốc tịch</label>
                        <Input {...register('nationality')} disabled={!isEditing} className="h-8 py-0.5 text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-500">Số thẻ ngoại kiều</label>
                        <div className="flex gap-1.5 items-center">
                          <Input {...register('cardNumber')} disabled={!isEditing} className="h-8 py-0.5 text-xs flex-1" />
                          <button type="button" onClick={() => toggleVerify('cardNumber')} className={`p-1.5 border rounded-md transition-colors shrink-0 h-8 w-8 flex items-center justify-center ${verifiedFields['cardNumber'] ? 'bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`} title={verifiedFields['cardNumber'] ? 'Đã xác nhận khớp' : 'Xác nhận khớp dữ liệu'}><CheckCircle className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-500">Mã số cá nhân (My Number)</label>
                        <Input {...register('myNumber')} disabled={!isEditing} className="h-8 py-0.5 text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-500">Địa chỉ trên thẻ (Kanji)</label>
                        <div className="flex gap-1.5 items-center">
                          <Input {...register('zairyuAddress')} disabled={!isEditing} className="h-8 py-0.5 text-xs flex-1" />
                          {watch('zairyuAddress') && (<button type="button" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(watch('zairyuAddress') || '')}`, '_blank')} className="p-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-100 flex items-center justify-center shrink-0 h-8 w-8 transition-colors" title="Mở Google Maps"><MapPin className="w-4 h-4" /></button>)}
                          <button type="button" onClick={() => toggleVerify('zairyuAddress')} className={`p-1.5 border rounded-md transition-colors shrink-0 h-8 w-8 flex items-center justify-center ${verifiedFields['zairyuAddress'] ? 'bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`} title={verifiedFields['zairyuAddress'] ? 'Đã xác nhận khớp' : 'Xác nhận khớp dữ liệu'}><CheckCircle className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-500">Mã Bưu Điện</label>
                        <div className="flex gap-1.5 items-center">
                          <Input {...register('postalCode')} disabled={!isEditing} className="h-8 py-0.5 text-xs flex-1" placeholder="VD: 4530015" />
                          <button type="button" onClick={() => handleNtaSearch(watch('postalCode'))} className="p-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-100 flex items-center justify-center shrink-0 h-8 w-8 transition-colors" title="Tra cứu Cục thuế theo mã bưu điện"><Search className="w-4 h-4" /></button>
                          <button type="button" onClick={() => toggleVerify('postalCode')} className={`p-1.5 border rounded-md transition-colors shrink-0 h-8 w-8 flex items-center justify-center ${verifiedFields['postalCode'] ? 'bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`} title={verifiedFields['postalCode'] ? 'Đã xác nhận khớp' : 'Xác nhận khớp dữ liệu'}><CheckCircle className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  );
                case 'passport':
                  return (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN HỘ CHIẾU</div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-500">Họ và tên *</label>
                        <div className="flex gap-1.5 items-center">
                          <Input {...register('fullName')} disabled={!isEditing} className={`h-8 py-0.5 text-xs flex-1 ${errors.fullName ? 'border-rose-400' : ''}`} />
                          <button type="button" onClick={() => toggleVerify('fullName')} className={`p-1.5 border rounded-md transition-colors shrink-0 h-8 w-8 flex items-center justify-center ${verifiedFields['fullName'] ? 'bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}><CheckCircle className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-500">Ngày sinh *</label>
                        <div className="flex gap-1.5 items-center">
                          <Input type="date" {...register('dob')} disabled={!isEditing} className={`h-8 py-0.5 text-xs flex-1 ${errors.dob ? 'border-rose-400' : ''}`} />
                          <button type="button" onClick={() => toggleVerify('dob')} className={`p-1.5 border rounded-md transition-colors shrink-0 h-8 w-8 flex items-center justify-center ${verifiedFields['dob'] ? 'bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}><CheckCircle className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Quốc tịch</label><Input {...register('nationality')} disabled={!isEditing} className="h-8 py-0.5 text-xs" /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Giới tính</label><select {...register('sex')} disabled={!isEditing} className="h-8 rounded-md border border-input px-2 text-xs bg-transparent"><option value="">Chọn...</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></div>
                        <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Số điện thoại</label><Input {...register('phone')} disabled={!isEditing} className="h-8 py-0.5 text-xs" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Ngày cấp hộ chiếu</label><Input type="date" {...register('passportIssueDate')} disabled={!isEditing} className="h-8 py-0.5 text-xs" /></div>
                        <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Ngày hết hạn</label><Input type="date" {...register('passportExpiryDate')} disabled={!isEditing} className="h-8 py-0.5 text-xs" /></div>
                      </div>
                    </div>
                  );
                case 'nenkinBook':
                  return (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN SỔ NENKIN</div>
                      <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Mã số Nenkin</label><Input {...register('nenkinNumber')} disabled={!isEditing} className="h-8 py-0.5 text-xs" /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Tên Katakana (Sổ Nenkin)</label><Input {...register('nenkinKatakanaName')} disabled={!isEditing} className="h-8 py-0.5 text-xs" /></div>
                    </div>
                  );
                default:
                  if (activeDoc.startsWith('bankPassbook_')) {
                    const idxStr = activeDoc.split('_')[1];
                    const idx = parseInt(idxStr, 10);
                    if (isNaN(idx) || !bankFields[idx]) return null;
                    return (
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN NGÂN HÀNG ({watch(`bankAccounts.${idx}.purpose`) === 'FIRST_REFUND' ? 'Lần 1' : watch(`bankAccounts.${idx}.purpose`) === 'SECOND_REFUND' ? 'Lần 2' : 'Chung'})</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Quốc gia</label><select {...register(`bankAccounts.${idx}.bankCountry` as const)} disabled={!isEditing} className="h-8 rounded-md border border-input px-2 text-xs bg-white"><option value="JAPAN">Nhật Bản</option><option value="VIETNAM">Việt Nam</option></select></div>
                          <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Mục đích</label><select {...register(`bankAccounts.${idx}.purpose` as const)} disabled={!isEditing} className="h-8 rounded-md border border-input px-2 text-xs bg-white"><option value="BOTH">Chung cả 2 lần</option><option value="FIRST_REFUND">Lần 1 (Tiền Nhật)</option><option value="SECOND_REFUND">Lần 2 (Tiền Việt)</option></select></div>
                        </div>
                        <div className="flex flex-col gap-1 relative group"><label className="text-xs font-medium text-slate-500">Tên ngân hàng</label><BankAutocomplete index={idx} disabled={!isEditing} register={register} setValue={setValue} watch={watch} /></div>
                        <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Chi nhánh</label><Input {...register(`bankAccounts.${idx}.branchName` as const)} disabled={!isEditing} className="h-8 py-0.5 text-xs" /></div>
                        <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Địa chỉ chi nhánh (Eng)</label><Input {...register(`bankAccounts.${idx}.bankBranchAddress` as const)} disabled={!isEditing} className="h-8 py-0.5 text-xs" /></div>
                        <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Số tài khoản</label><Input {...register(`bankAccounts.${idx}.accountNumber` as const)} disabled={!isEditing} className="h-8 py-0.5 text-xs" /></div>
                        <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Tên chủ tài khoản (Romaji)</label><Input {...register(`bankAccounts.${idx}.accountName` as const)} disabled={!isEditing} className="h-8 py-0.5 text-xs uppercase" /></div>
                        {watch(`bankAccounts.${idx}.bankCountry`) === 'JAPAN' && (<div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Tên chủ tài khoản (Katakana)</label><Input {...register(`bankAccounts.${idx}.accountNameKatakana` as const)} disabled={!isEditing} className="h-8 py-0.5 text-xs" /></div>)}
                        <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Swift Code</label><Input {...register(`bankAccounts.${idx}.swiftCode` as const)} disabled={!isEditing} className="h-8 py-0.5 text-xs uppercase" /></div>
                        {isEditing && bankFields.length > 1 && (
                          <div className="pt-2 border-t mt-2">
                            <button type="button" onClick={() => {
                              toast('Xóa tài khoản ngân hàng này?', {
                                action: { label: 'Xóa', onClick: () => { removeBank(idx); setActiveDoc('zairyuFront'); toast.success('Đã xóa tài khoản ngân hàng'); } },
                                cancel: { label: 'Hủy', onClick: () => {} },
                                duration: 6000,
                              });
                            }} className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium bg-rose-50 px-2 py-1.5 rounded w-fit">
                              <Trash2 className="w-3.5 h-3.5" />
                              Xóa tài khoản này
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                case 'departureStamp':
                  return (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN DẤU XUẤT CẢNH</div>
                      <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-500">Ngày xuất cảnh Nhật Bản</label><Input type="date" {...register('departureDate')} disabled={!isEditing} className="h-8 py-0.5 text-xs" /></div>
                    </div>
                  );
              }
            })()}

            {!isNew && (() => {
              const requiredVerificationFields = ['fullName', 'dob', 'cardNumber', 'zairyuAddress', 'postalCode', 'taxOffice_name', 'taxOffice_postalCode', 'taxOffice_address', 'taxOffice_romajiAddress', 'taxOffice_phone', 'taxOffice_websiteUrl'];
              const allVerified = requiredVerificationFields.every(field => verifiedFields[field]);
              return (
                <div className="mt-4 space-y-2">
                  <div className={`p-3 border rounded-lg flex items-center gap-2 transition-all ${allVerified ? 'bg-indigo-50/40 border-indigo-100' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                    <input type="checkbox" id="manual-confirm" disabled={!isEditing || !allVerified} checked={manualConfirmed && allVerified} onChange={(e) => setManualConfirmed(e.target.checked)} className={`rounded focus:ring-indigo-500 w-4 h-4 ${allVerified ? 'text-indigo-600 cursor-pointer' : 'text-slate-400 cursor-not-allowed'}`} />
                    <label htmlFor="manual-confirm" className={`text-xs font-semibold select-none ${allVerified ? 'text-indigo-900 cursor-pointer' : 'text-slate-400 cursor-not-allowed'}`}>Tôi đã đối chiếu thủ công từng trường và xác nhận khớp với ảnh tài liệu</label>
                  </div>
                  {!allVerified && isEditing && (
                    <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 p-2 rounded-md flex items-start gap-1.5 shadow-2xs">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>⚠️ Yêu cầu đối chiếu:</strong> Bạn cần tích chọn biểu tượng tích xanh <CheckCircle className="w-3 h-3 inline text-emerald-600 mx-0.5" /> bên cạnh tất cả 5 trường thông tin khách hàng và 5 trường thông tin Cục thuế để xác nhận khớp trước khi có thể phê duyệt hồ sơ này.</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Panel 3: Client Summary & Workflow (Right) */}
        <div className="col-span-1 md:col-span-5 flex flex-col gap-4 h-full min-h-0">
          <div className="flex-[5] flex flex-col bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden min-h-0">
            <div className="p-2 border-b border-slate-100 bg-slate-50/30 flex gap-2.5 shrink-0 items-center justify-between">
              <div className="flex gap-2 min-w-0 flex-1">
                <div className="w-16 h-10 border border-slate-200 rounded overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 relative group">
                  {watch('zairyuFrontUrl') ? (
                    <><img src={watch('zairyuFrontUrl') || undefined} alt="Zairyu Front" className="w-full h-full object-contain" /><button type="button" onClick={() => setLightboxUrl(watch('zairyuFrontUrl') || null)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white"><ZoomIn className="w-3 h-3" /></button></>
                  ) : (<span className="text-[8px] text-slate-400 text-center px-0.5 font-medium leading-tight">No Image</span>)}
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate">{watch('fullName') || 'N/A'}</span>
                    <span className="font-mono text-[9px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded shrink-0">#{watch('code') || '---'}</span>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5 flex gap-2">
                    <span>NS: {watch('dob') ? new Date(watch('dob') as string).toLocaleDateString('vi-VN') : '---'}</span>
                    <span>|</span>
                    <span className="truncate">QT: {watch('nationality') || '---'}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 items-end shrink-0">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái hồ sơ</span>
                <select value={watch('status') || 'DRAFT'} disabled={!isEditing} onChange={(e) => setValue('status', e.target.value as any, { shouldDirty: true })} className={`h-6 rounded border px-1 text-[10px] font-bold outline-none cursor-pointer ${statusConfig[(watch('status') || 'DRAFT') as any]?.color || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                  {Object.keys(statusConfig).filter(k => k !== 'PENDING' && k !== 'CANCELLED').map(key => (<option key={key} value={key} className="bg-white text-slate-800 font-medium">{statusConfig[key]?.label}</option>))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              <div className="border-t border-slate-100 pt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Các mốc ngày xử lý</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex flex-col gap-0.5"><label className="text-[9px] text-slate-400">Ngày nộp Lần 1</label><Input type="date" {...register('sent1stDate')} disabled={!isEditing} className="h-7 text-xs py-0.5 px-2" /></div>
                  <div className="flex flex-col gap-0.5"><label className="text-[9px] text-slate-400">Ngày nhận Lần 1</label><Input type="date" {...register('received1stDate')} disabled={!isEditing} className="h-7 text-xs py-0.5 px-2" /></div>
                  <div className="flex flex-col gap-0.5"><label className="text-[9px] text-slate-400">Ngày nộp Lần 2</label><Input type="date" {...register('sent2ndDate')} disabled={!isEditing} className="h-7 text-xs py-0.5 px-2" /></div>
                  <div className="flex flex-col gap-0.5"><label className="text-[9px] text-slate-400">Ngày nhận Lần 2</label><Input type="date" {...register('received2ndDate')} disabled={!isEditing} className="h-7 text-xs py-0.5 px-2" /></div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thông tin Tài chính</label>
                  {isEditing && (<button type="button" onClick={() => { const r1 = watch('received1stJpy') || 0; const r2 = watch('received2ndJpy') || 0; const rate = watch('exchangeRate') || 165; const feeJpy = (parseFloat(r1.toString()) + parseFloat(r2.toString())) * 0.2; setValue('serviceFeeJpy', feeJpy); setValue('serviceFeeVnd', feeJpy * parseFloat(rate.toString())); if (!watch('exchangeRate')) setValue('exchangeRate', rate); toast.success('Đã tính phí dịch vụ (20%)'); }} className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded hover:bg-blue-100 font-medium transition-colors border border-blue-200 shadow-2xs">Tính phí (20%)</button>)}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex flex-col gap-0.5"><label className="text-[9px] text-slate-400">Dự kiến tổng (JPY)</label><Input type="number" {...register('totalExpectedJpy')} disabled={!isEditing} className="h-7 text-xs py-0.5 px-2" /></div>
                  <div className="flex flex-col gap-0.5"><label className="text-[9px] text-slate-400">Tỷ giá (VND/JPY)</label><Input type="number" step="0.01" {...register('exchangeRate')} disabled={!isEditing} className="h-7 text-xs py-0.5 px-2" /></div>
                  <div className="flex flex-col gap-0.5"><label className="text-[9px] text-slate-400">Đã nhận Lần 1 (JPY)</label><Input type="number" {...register('received1stJpy')} disabled={!isEditing} className="h-7 text-xs py-0.5 px-2" /></div>
                  <div className="flex flex-col gap-0.5"><label className="text-[9px] text-slate-400">Đã nhận Lần 2 (JPY)</label><Input type="number" {...register('received2ndJpy')} disabled={!isEditing} className="h-7 text-xs py-0.5 px-2" /></div>
                  <div className="flex flex-col gap-0.5 col-span-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="flex flex-col gap-0.5"><label className="text-[9px] font-medium text-blue-700">Phí DV (JPY)</label><Input type="number" className="h-7 text-xs py-0.5 px-2 bg-blue-50/50" {...register('serviceFeeJpy')} disabled={!isEditing} /></div>
                      <div className="flex flex-col gap-0.5"><label className="text-[9px] font-medium text-emerald-700">Phí DV (VND)</label><Input type="number" className="h-7 text-xs py-0.5 px-2 bg-emerald-50/50" {...register('serviceFeeVnd')} disabled={!isEditing} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3B: Cục Thuế */}
          <div className="flex-[4] flex flex-col bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden min-h-0">
            <div className="p-2 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cục Thuế quản lý</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              <div className="flex gap-1.5">
                <button type="button" onClick={() => handleNtaSearch(watch('postalCode'))} className="text-[9px] text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold px-2 py-1 rounded transition-colors border border-blue-200 shadow-2xs flex-1 text-center">Tra cứu từ mã bưu điện KH</button>
                <button type="button" onClick={() => window.open('https://www.nta.go.jp/about/organization/access/map.htm', '_blank')} className="text-[9px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-semibold px-2 py-1 rounded transition-colors border border-indigo-200 shadow-2xs flex-1 text-center">Tra cứu NTA thủ công</button>
              </div>
              <div className="flex items-center gap-1.5">
                <select {...register('taxOfficeId')} disabled={!isEditing} className="h-7 rounded-md border border-slate-200 px-2 text-xs bg-white flex-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium min-w-0">
                  <option value="">-- Cục thuế chưa chọn hoặc AI tự điền --</option>
                  {taxOffices.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
                {isEditing && (<button type="button" onClick={() => setIsAddingTaxOffice(!isAddingTaxOffice)} className={`h-7 px-2 text-xs font-semibold rounded border transition-colors shrink-0 ${isAddingTaxOffice ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'}`}>{isAddingTaxOffice ? 'Đóng' : '+ Mới'}</button>)}
              </div>

              {isAddingTaxOffice && isEditing && (
                <div className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-lg space-y-2">
                  <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Đăng ký Cục thuế mới</div>
                  <div className="grid grid-cols-1 gap-2">
                    {[{ label: 'Tên Cục thuế *', key: 'name', placeholder: 'VD: 小田原税務署' }, { label: 'Mã bưu điện', key: 'postalCode', placeholder: 'VD: 250-8511' }, { label: 'Địa chỉ (Kanji)', key: 'address', placeholder: 'VD: 小田原市荻窪440番地' }, { label: 'Địa chỉ (Romaji)', key: 'romajiAddress', placeholder: 'VD: 440 Ogikubo Odawara-shi' }, { label: 'Điện thoại', key: 'phone', placeholder: 'VD: 0465-35-4511' }, { label: 'Website', key: 'websiteUrl', placeholder: 'VD: https://www.nta.go.jp/...' }].map(f => (
                      <div key={f.key} className="flex flex-col gap-0.5">
                        <label className="text-[9px] text-slate-500 font-semibold">{f.label}</label>
                        <input type="text" placeholder={f.placeholder} value={(ntaSearchInfo as any)[f.key]} onChange={e => setNtaSearchInfo(prev => ({ ...prev, [f.key]: e.target.value }))} className="h-6 px-1.5 text-xs rounded border border-slate-200 bg-white font-medium" />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button type="button" onClick={() => { setIsAddingTaxOffice(false); setNtaSearchInfo({ name: '', address: '', romajiAddress: '', postalCode: '', phone: '', websiteUrl: '' }); }} className="px-2 py-1 text-[10px] text-slate-500 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 font-semibold">Hủy</button>
                    <button type="button" disabled={creatingTaxOffice} onClick={async () => {
                      if (!ntaSearchInfo.name.trim()) { toast.warning('Vui lòng nhập tên Cục thuế.'); return; }
                      setCreatingTaxOffice(true);
                      const toastId = toast.loading('Đang đăng ký Cục thuế...');
                      try {
                        const res = await fetch('/api/tax-offices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ntaSearchInfo) });
                        const resData = await res.json();
                        if (res.ok && resData.success) {
                          const created = resData.data;
                          setTaxOffices(prev => prev.some(t => t.id === created.id) ? prev : [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
                          setValue('taxOfficeId', created.id);
                          setIsAddingTaxOffice(false);
                          toast.success(`Đã đăng ký: ${created.name}`, { id: toastId });
                        } else {
                          toast.error('Lỗi đăng ký Cục thuế', { id: toastId, description: resData.error || 'Vui lòng thử lại.' });
                        }
                      } catch (err) {
                        toast.error('Lỗi kết nối', { id: toastId, description: 'Không thể kết nối đến máy chủ.' });
                      } finally {
                        setCreatingTaxOffice(false);
                      }
                    }} className="px-2 py-1 text-[10px] text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded font-semibold flex items-center gap-1 shadow-xs">
                      {creatingTaxOffice && <Loader2 className="w-3 h-3 animate-spin" />}
                      Lưu &amp; Áp dụng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors" onClick={() => setLightboxUrl(null)}><X className="w-5 h-5" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Crop Modal */}
      {cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          onComplete={handleCropComplete}
          onCancel={() => {
            if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
            setCropImageSrc(null);
            setCropFile(null);
            setCropDocKey('');
            setCropUrlField('');
          }}
        />
      )}
    </form>
  );

  // Helper: run OCR extract on existing image URL
  async function runOcrExtract(imageUrl: string) {
    setOcrStatus(prev => ({ ...prev, [activeDoc]: 'processing' }));
    const toastId = toast.loading('Đang trích xuất AI...');
    try {
      const form = new FormData();
      form.append('imageUrl', imageUrl);
      form.append('documentType', activeDoc);
      form.append('action', 'extract');
      if (customerId) form.append('customerId', customerId);
      
      const res = await fetch('/api/ocr', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success && data.extractedData && !data.extractedData.error) {
        const ext = data.extractedData;
        if (activeDoc === 'zairyuFront' || activeDoc === 'zairyuBack') {
          if (ext.fullName) setValue('fullName', ext.fullName, { shouldValidate: true, shouldDirty: true });
          if (ext.dob) setValue('dob', ext.dob, { shouldValidate: true, shouldDirty: true });
          if (ext.nationality) setValue('nationality', ext.nationality, { shouldDirty: true });
          if (ext.cardNumber) setValue('cardNumber', ext.cardNumber, { shouldDirty: true });
          if (ext.address) setValue('zairyuAddress', ext.address, { shouldDirty: true });
          if (ext.postalCode) setValue('postalCode', ext.postalCode, { shouldDirty: true });
          if (ext.taxOffice?.name) {
            fetch('/api/tax-offices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ext.taxOffice) })
              .then(r => r.json()).then(tData => {
                if (tData.success && tData.data?.id) {
                  setTaxOffices(prev => prev.find(t => t.id === tData.data.id) ? prev : [...prev, tData.data]);
                  setValue('taxOfficeId', tData.data.id, { shouldDirty: true });
                }
              }).catch(console.error);
          }
        } else if (activeDoc === 'passport') {
          if (ext.lastName || ext.firstName) setValue('fullName', `${ext.lastName || ''} ${ext.firstName || ''}`.trim(), { shouldDirty: true });
          if (ext.dob) setValue('dob', ext.dob, { shouldDirty: true });
          if (ext.nationality) setValue('nationality', ext.nationality, { shouldDirty: true });
          if (ext.sex) setValue('sex', ext.sex === 'M' ? 'Nam' : 'Nữ', { shouldDirty: true });
          if (ext.passportNumber) setValue('cardNumber', ext.passportNumber, { shouldDirty: true });
        } else if (activeDoc === 'nenkinBook') {
          if (ext.nenkinNumber) setValue('nenkinNumber', ext.nenkinNumber, { shouldDirty: true });
          if (ext.nenkinKatakanaName) setValue('nenkinKatakanaName', ext.nenkinKatakanaName, { shouldDirty: true });
        } else if (activeDoc.startsWith('bankPassbook_')) {
          const idx = parseInt(activeDoc.split('_')[1], 10);
          if (!isNaN(idx)) {
            if (ext.bankName) setValue(`bankAccounts.${idx}.bankName` as any, ext.bankName, { shouldDirty: true });
            if (ext.branchName) setValue(`bankAccounts.${idx}.branchName` as any, ext.branchName, { shouldDirty: true });
            if (ext.accountNumber) setValue(`bankAccounts.${idx}.accountNumber` as any, ext.accountNumber, { shouldDirty: true });
            if (ext.accountName) setValue(`bankAccounts.${idx}.accountName` as any, ext.accountName, { shouldDirty: true });
            if (ext.swiftCode) setValue(`bankAccounts.${idx}.swiftCode` as any, ext.swiftCode, { shouldDirty: true });
          }
        } else if (activeDoc === 'departureStamp') {
          if (ext.departureDate) setValue('departureDate', ext.departureDate, { shouldDirty: true });
        }
        toast.success('Trích xuất AI thành công!', { id: toastId, description: 'Thông tin đã được điền vào form.' });
      } else {
        toast.error('AI không tìm thấy thông tin hợp lệ', { id: toastId, description: data.error || 'Vui lòng thử lại hoặc nhập thủ công.' });
      }
    } catch (err) {
      toast.error('Lỗi kết nối OCR', { id: toastId, description: 'Đã xảy ra lỗi khi gọi API trích xuất.' });
    } finally {
      setOcrStatus(prev => ({ ...prev, [activeDoc]: 'done' }));
    }
  }
}
