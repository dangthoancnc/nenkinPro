'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, X, UploadCloud, CheckCircle, AlertCircle, ZoomIn, Clock, Send, Wallet, Trash2, Sparkles, Printer, MapPin, Search, Crop } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workspaceSchema, WorkspaceFormValues } from '@/lib/validations/workspaceSchema';
import { BankAutocomplete } from '../components/BankAutocomplete';
import ImageCropModal from '@/components/ImageCropModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { toast } from 'sonner';

const BASE_DOCUMENTS = [
  { key: 'zairyuFront', title: 'Thẻ Ngoại Kiều (Trước)', urlField: 'zairyuFrontUrl' },
  { key: 'zairyuBack',  title: 'Thẻ Ngoại Kiều (Sau)',  urlField: 'zairyuBackUrl'  },
  { key: 'passport',    title: 'Hộ chiếu',               urlField: 'passportUrl'    },
  { key: 'nenkinBook',  title: 'Sổ Nenkin',              urlField: 'nenkinBookUrl'  },
  { key: 'departureStamp', title: 'Dấu xuất cảnh',      urlField: 'departureStampUrl' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING:      { label: 'Cần duyệt',    color: 'bg-orange-50 text-orange-700 border-orange-200',  icon: AlertCircle },
  DRAFT:        { label: 'Bản nháp',     color: 'bg-amber-50  text-amber-700  border-amber-200',   icon: Clock       },
  SENT_1ST:     { label: 'Đã gửi Lần 1', color: 'bg-blue-50   text-blue-700   border-blue-200',    icon: Send        },
  RECEIVED_1ST: { label: 'Đã nhận Lần 1',color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Wallet      },
  SENT_2ND:     { label: 'Đã gửi Lần 2', color: 'bg-purple-50 text-purple-700 border-purple-200',  icon: Send        },
  RECEIVED_2ND: { label: 'Đã nhận Lần 2',color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Wallet   },
  COMPLETED:    { label: 'Hoàn thành',   color: 'bg-green-100 text-green-700  border-green-200',   icon: CheckCircle },
  CANCELLED:    { label: 'Đã hủy',       color: 'bg-red-50    text-red-700    border-red-200',     icon: AlertCircle },
};

export default function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const isNew = id === 'new';

  const [loading,           setLoading]           = useState(!isNew);
  const [saving,            setSaving]            = useState(false);
  const [deleting,          setDeleting]          = useState(false);
  const [isEditing,         setIsEditing]         = useState(isNew);
  const [ocrStatus,         setOcrStatus]         = useState<Record<string, string>>({});
  const [lightboxUrl,       setLightboxUrl]       = useState<string | null>(null);
  const [activeDoc,         setActiveDoc]         = useState<string>('zairyuFront');
  const [customerId,        setCustomerId]        = useState<string | null>(null);
  const [customer,          setCustomer]          = useState<any | null>(null);
  const [manualConfirmed,   setManualConfirmed]   = useState<boolean>(false);
  const [taxOffices,        setTaxOffices]        = useState<Array<any>>([]);
  const [isAddingTaxOffice, setIsAddingTaxOffice] = useState<boolean>(false);
  const [creatingTaxOffice, setCreatingTaxOffice] = useState<boolean>(false);
  const [syncingTaxOffice,  setSyncingTaxOffice]  = useState<boolean>(false);
  const [showPrintModal,    setShowPrintModal]    = useState<boolean>(false);
  const [verifiedFields,    setVerifiedFields]    = useState<Record<string, boolean>>({});
  const [cropFile,          setCropFile]          = useState<File | null>(null);
  const [cropDocKey,        setCropDocKey]        = useState<string>('');
  const [cropUrlField,      setCropUrlField]      = useState<string>('');
  const [cropImageSrc,      setCropImageSrc]      = useState<string | null>(null);

  const toggleVerify = (field: string) => {
    setVerifiedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const [ntaSearchInfo, setNtaSearchInfo] = useState({
    name: '', address: '', romajiAddress: '', postalCode: '', phone: '', websiteUrl: ''
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, getValues, watch, control } =
    useForm<WorkspaceFormValues>({
      mode: 'onBlur',
      defaultValues: { status: 'DRAFT' },
    });

  const { fields: bankFields, append: appendBank, remove: removeBank } = useFieldArray({ control, name: 'bankAccounts' });

  const dynamicDocuments = React.useMemo(() => {
    const banks = watch('bankAccounts') || [];
    const bankDocs = banks.flatMap((bank, index) => {
      const urls = bank.bankPassbookUrls || [];
      const purposeLabel = bank.purpose === 'FIRST_REFUND' ? 'Lần 1' : bank.purpose === 'SECOND_REFUND' ? 'Lần 2' : 'Chung';
      const items = urls.map((url: string, urlIndex: number) => ({
        key: `bankPassbook_${index}_${urlIndex}`,
        title: `Sổ NH (${purposeLabel}) - Ảnh ${urlIndex + 1}`,
        urlField: `bankAccounts.${index}.bankPassbookUrls.${urlIndex}`,
      }));
      items.push({
        key: `bankPassbook_${index}_${urls.length}`,
        title: `Sổ NH (${purposeLabel}) - Thêm`,
        urlField: `bankAccounts.${index}.bankPassbookUrls.${urls.length}`,
      });
      return items;
    });
    return [BASE_DOCUMENTS[0], BASE_DOCUMENTS[1], BASE_DOCUMENTS[2], BASE_DOCUMENTS[3], ...bankDocs, BASE_DOCUMENTS[4]];
  }, [watch('bankAccounts')]);

  // ─── Fetch data ────────────────────────────────────────────────────────────
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
          const fmt = (d: string | null | undefined) => d ? new Date(d).toISOString().split('T')[0] : '';
          const formValues: any = {
            ...customer,
            dob: fmt(customer.dob),
            departureDate: fmt(customer.departureDate),
            passportIssueDate: fmt(customer.passportIssueDate),
            passportExpiryDate: fmt(customer.passportExpiryDate),
            status:          data.status,
            applyDate:       fmt(data.applyDate),
            sent1stDate:     fmt(data.sent1stDate),
            received1stDate: fmt(data.received1stDate),
            sent2ndDate:     fmt(data.sent2ndDate),
            received2ndDate: fmt(data.received2ndDate),
            totalExpectedJpy: data.totalExpectedJpy || '',
            received1stJpy:   data.received1stJpy   || '',
            received2ndJpy:   data.received2ndJpy   || '',
            serviceFeeJpy:    data.serviceFeeJpy    || '',
            exchangeRate:     data.exchangeRate     || '',
            serviceFeeVnd:    data.serviceFeeVnd    || '',
          };
          Object.keys(formValues).forEach(key => {
            if (formValues[key] === null) formValues[key] = key === 'hasPermanentResidence' ? false : '';
          });
          if (customer.status === 'VERIFIED') {
            setVerifiedFields({
              fullName: true, dob: true, cardNumber: true, zairyuAddress: true, postalCode: true,
              taxOffice_name: true, taxOffice_postalCode: true, taxOffice_address: true,
              taxOffice_phone: true, taxOffice_websiteUrl: true,
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
    fetch('/api/tax-offices').then(r => r.json()).then(d => { if (d.success) setTaxOffices(d.data); }).catch(console.error);
  }, [id, isNew, reset]);

  const selectedTaxOfficeId = watch('taxOfficeId');
  useEffect(() => {
    const office = taxOffices.find(t => t.id === selectedTaxOfficeId);
    if (office) {
      setNtaSearchInfo({ name: office.name || '', postalCode: office.postalCode || '', address: office.address || '', romajiAddress: office.romajiAddress || '', phone: office.phone || '', websiteUrl: office.websiteUrl || '' });
    } else {
      setNtaSearchInfo({ name: '', address: '', romajiAddress: '', postalCode: '', phone: '', websiteUrl: '' });
    }
  }, [selectedTaxOfficeId, taxOffices]);

  // ─── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: WorkspaceFormValues) => {
    setSaving(true);
    const toastId = toast.loading(isNew ? 'Đang tạo hồ sơ mới...' : 'Đang lưu hồ sơ...');
    try {
      const customerPayload = {
        fullName: data.fullName, dob: data.dob ? new Date(data.dob).toISOString() : undefined,
        nationality: data.nationality, myNumber: data.myNumber, zairyuAddress: data.zairyuAddress,
        cardNumber: data.cardNumber, nenkinNumber: data.nenkinNumber, nenkinKatakanaName: data.nenkinKatakanaName,
        postalCode: data.postalCode, taxOfficeId: data.taxOfficeId, bankAccounts: data.bankAccounts,
        zairyuFrontUrl: data.zairyuFrontUrl, zairyuBackUrl: data.zairyuBackUrl, passportUrl: data.passportUrl,
        nenkinBookUrl: data.nenkinBookUrl, departureStampUrl: data.departureStampUrl,
        status: manualConfirmed ? 'VERIFIED' : 'PENDING',
        sex: data.sex, phone: data.phone,
        passportIssueDate:  data.passportIssueDate  ? new Date(data.passportIssueDate).toISOString()  : null,
        passportExpiryDate: data.passportExpiryDate ? new Date(data.passportExpiryDate).toISOString() : null,
        departureDate:      data.departureDate      ? new Date(data.departureDate).toISOString()      : null,
      };
      const applicationPayload = {
        status: data.status,
        applyDate:       data.applyDate       ? new Date(data.applyDate).toISOString()       : null,
        sent1stDate:     data.sent1stDate     ? new Date(data.sent1stDate).toISOString()     : null,
        received1stDate: data.received1stDate ? new Date(data.received1stDate).toISOString() : null,
        sent2ndDate:     data.sent2ndDate     ? new Date(data.sent2ndDate).toISOString()     : null,
        received2ndDate: data.received2ndDate ? new Date(data.received2ndDate).toISOString() : null,
        totalExpectedJpy: data.totalExpectedJpy ? parseFloat(String(data.totalExpectedJpy)) : null,
        received1stJpy:   data.received1stJpy   ? parseFloat(String(data.received1stJpy))   : null,
        received2ndJpy:   data.received2ndJpy   ? parseFloat(String(data.received2ndJpy))   : null,
        serviceFeeJpy:    data.serviceFeeJpy    ? parseFloat(String(data.serviceFeeJpy))    : null,
        exchangeRate:     data.exchangeRate     ? parseFloat(String(data.exchangeRate))     : null,
        serviceFeeVnd:    data.serviceFeeVnd    ? parseFloat(String(data.serviceFeeVnd))    : null,
      };

      if (isNew) {
        const cRes = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customerPayload) });
        const cData = await cRes.json();
        if (!cRes.ok || !cData.success) throw new Error(cData.error || 'Cannot create customer');
        const aRes = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...applicationPayload, customerId: cData.data.id }) });
        const aData = await aRes.json();
        if (!aRes.ok || aData.error) throw new Error(aData.error || 'Cannot create application');
        toast.success('Tạo hồ sơ thành công!', { id: toastId, description: `ID: ${aData.id?.slice(0, 8)}...` });
        router.push(`/applications/${aData.id}`);
      } else {
        const appRes = await fetch(`/api/applications/${id}`);
        if (!appRes.ok) throw new Error((await appRes.json()).error || 'Lỗi lấy thông tin hồ sơ.');
        const appData = await appRes.json();
        if (appData.customerId) {
          const cRes = await fetch(`/api/customers/${appData.customerId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customerPayload) });
          if (!cRes.ok) throw new Error((await cRes.json()).error || 'Lỗi cập nhật KH.');
        }
        const aRes = await fetch(`/api/applications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(applicationPayload) });
        if (!aRes.ok) throw new Error((await aRes.json()).error || 'Lỗi cập nhật hồ sơ.');
        toast.success('Lưu hồ sơ thành công!', { id: toastId, description: 'Tất cả thay đổi đã được lưu.' });
        setIsEditing(false);
      }
    } catch (e: any) {
      toast.error('Đã có lỗi xảy ra', { id: toastId, description: e.message });
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    toast('Bạn có chắc muốn xóa hồ sơ này?', {
      description: 'Hành động này không thể hoàn tác.',
      action: {
        label: 'Xóa',
        onClick: async () => {
          setDeleting(true);
          const tid = toast.loading('Đang xóa hồ sơ...');
          try {
            const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Không thể xóa hồ sơ');
            toast.success('Đã xóa hồ sơ thành công!', { id: tid });
            router.push('/applications');
          } catch (e: any) {
            toast.error('Đã xảy ra lỗi', { id: tid, description: e.message });
            setDeleting(false);
          }
        },
      },
      cancel: { label: 'Hủy', onClick: () => {} },
      duration: 8000,
    });
  };

  // ─── File / Crop ───────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docKey: string, urlField: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropDocKey(docKey);
    setCropUrlField(urlField);
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const file = new File([croppedBlob], cropFile?.name || 'cropped.jpg', { type: croppedBlob.type });
    const docKey = cropDocKey;
    const urlField = cropUrlField;
    if (cropImageSrc) { URL.revokeObjectURL(cropImageSrc); setCropImageSrc(null); }
    setCropFile(null); setCropDocKey(''); setCropUrlField('');
    setOcrStatus(prev => ({ ...prev, [docKey]: 'processing' }));
    setValue(urlField as any, URL.createObjectURL(file));
    const form = new FormData();
    form.append('file', file); form.append('documentType', docKey); form.append('action', 'uploadAndExtract');
    if (customerId) form.append('customerId', customerId);
    try {
      const res  = await fetch('/api/ocr', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        const prevUrl = getValues(urlField as any);
        if (prevUrl && prevUrl !== data.publicUrl) {
          fetch('/api/storage/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: prevUrl }) }).catch(console.error);
        }
        setValue(urlField as any, data.publicUrl);
        setOcrStatus(prev => ({ ...prev, [docKey]: 'done' }));
        if (data.extractedData && !data.extractedData.error) applyOcrData(docKey, data.extractedData);
        if (!isNew && customerId) {
          await fetch(`/api/customers/${customerId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [urlField]: data.publicUrl }) });
        }
      } else {
        toast.error('Lỗi upload ảnh', { description: data.error || 'Không thể tải ảnh lên.' });
        setOcrStatus(prev => ({ ...prev, [docKey]: 'error' }));
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi upload', { description: 'Vui lòng thử lại.' });
      setOcrStatus(prev => ({ ...prev, [docKey]: 'error' }));
    }
  };

  // ─── OCR apply ─────────────────────────────────────────────────────────────
  function applyOcrData(docKey: string, ext: any) {
    const set = (k: any, v: any) => setValue(k, v, { shouldDirty: true });
    if (docKey === 'zairyuFront' || docKey === 'zairyuBack') {
      if (ext.fullName)  set('fullName',      ext.fullName);
      if (ext.dob)       set('dob',           ext.dob);
      if (ext.nationality) set('nationality', ext.nationality);
      if (ext.cardNumber)  set('cardNumber',  ext.cardNumber);
      if (ext.address)     set('zairyuAddress', ext.address);
      if (ext.postalCode)  set('postalCode',    ext.postalCode);
      if (ext.taxOffice?.name) {
        fetch('/api/tax-offices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ext.taxOffice) })
          .then(r => r.json()).then(tData => {
            if (tData.success && tData.data?.id) {
              setTaxOffices(prev => prev.find(t => t.id === tData.data.id) ? prev : [...prev, tData.data]);
              set('taxOfficeId', tData.data.id);
            }
          }).catch(console.error);
      }
    } else if (docKey === 'passport') {
      if (ext.lastName || ext.firstName) set('fullName', `${ext.lastName || ''} ${ext.firstName || ''}`.trim());
      if (ext.dob)          set('dob',        ext.dob);
      if (ext.nationality)  set('nationality', ext.nationality);
      if (ext.sex)          set('sex',         ext.sex === 'M' ? 'Nam' : 'Nữ');
      if (ext.passportNumber) set('cardNumber', ext.passportNumber);
    } else if (docKey === 'nenkinBook') {
      if (ext.nenkinNumber)       set('nenkinNumber',       ext.nenkinNumber);
      if (ext.nenkinKatakanaName) set('nenkinKatakanaName', ext.nenkinKatakanaName);
    } else if (docKey.startsWith('bankPassbook_')) {
      const idx = parseInt(docKey.split('_')[1], 10);
      if (!isNaN(idx)) {
        if (ext.bankName)      set(`bankAccounts.${idx}.bankName`      as any, ext.bankName);
        if (ext.branchName)    set(`bankAccounts.${idx}.branchName`    as any, ext.branchName);
        if (ext.accountNumber) set(`bankAccounts.${idx}.accountNumber` as any, ext.accountNumber);
        if (ext.accountName)   set(`bankAccounts.${idx}.accountName`   as any, ext.accountName);
        if (ext.swiftCode)     set(`bankAccounts.${idx}.swiftCode`     as any, ext.swiftCode);
      }
    } else if (docKey === 'departureStamp') {
      if (ext.departureDate) set('departureDate', ext.departureDate);
    }
  }

  async function runOcrExtract(imageUrl: string) {
    setOcrStatus(prev => ({ ...prev, [activeDoc]: 'processing' }));
    const tid = toast.loading('Đang trích xuất AI...');
    try {
      const form = new FormData();
      form.append('imageUrl', imageUrl); form.append('documentType', activeDoc); form.append('action', 'extract');
      if (customerId) form.append('customerId', customerId);
      const res  = await fetch('/api/ocr', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success && data.extractedData && !data.extractedData.error) {
        applyOcrData(activeDoc, data.extractedData);
        toast.success('Trích xuất AI thành công!', { id: tid, description: 'Thông tin đã được điền vào form.' });
      } else {
        toast.error('AI không tìm thấy thông tin hợp lệ', { id: tid, description: data.error || 'Vui lòng thử lại hoặc nhập thủ công.' });
      }
    } catch {
      toast.error('Lỗi kết nối OCR', { id: tid, description: 'Đã xảy ra lỗi khi gọi API trích xuất.' });
    } finally {
      setOcrStatus(prev => ({ ...prev, [activeDoc]: 'done' }));
    }
  }

  // ─── NTA search ────────────────────────────────────────────────────────────
  const handleNtaSearch = (zip: string | null | undefined) => {
    if (!zip) { toast.warning('Chưa có mã bưu điện', { description: 'Vui lòng nhập mã bưu điện trước.' }); return; }
    const clean = zip.replace(/[-\s]/g, '');
    if (clean.length !== 7) { toast.warning('Mã bưu điện không hợp lệ', { description: 'Phải đủ 7 chữ số.' }); return; }
    const form = document.createElement('form');
    form.method = 'POST'; form.action = 'https://www.nta.go.jp/cgi-bin/zeimusho/kensaku/kensakuprocess.php';
    form.target = '_blank'; form.acceptCharset = 'EUC-JP';
    for (const [k, v] of Object.entries({ KSTYPE: 'ksz', TODOFUKEN_TO_ASCII: '', ADDR_TO_ASCII: '', kszc1: clean.substring(0, 3), kszc2: clean.substring(3, 7) })) {
      const inp = document.createElement('input'); inp.type = 'hidden'; inp.name = k; inp.value = v; form.appendChild(inp);
    }
    document.body.appendChild(form); form.submit(); document.body.removeChild(form);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const onError = (formErrors: any) => {
    toast.error('Không thể lưu hồ sơ', {
      description: 'Lỗi: ' + Object.keys(formErrors).map(k => `${k}: ${formErrors[k].message || 'Không hợp lệ'}`).join(', '),
      duration: 6000,
    });
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  /** Nút xác nhận khớp dữ liệu dùng chung */
  const VerifyBtn = ({ field }: { field: string }) => (
    <button
      type="button"
      onClick={() => toggleVerify(field)}
      className={`p-1.5 border rounded-md transition-colors shrink-0 h-8 w-8 flex items-center justify-center ${
        verifiedFields[field]
          ? 'bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100'
          : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
      }`}
      title={verifiedFields[field] ? 'Đã xác nhận khớp' : 'Xác nhận khớp dữ liệu'}
    >
      <CheckCircle className="w-4 h-4" />
    </button>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="h-[calc(100vh-65px)] flex flex-col space-y-2">

      {/* ── Header ── */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/applications')}
            className="p-1.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
              {isNew ? 'Tạo Hồ sơ mới' : 'Chi tiết Hồ sơ'}
              {!isNew && <span className="text-[10px] font-normal text-slate-400">ID: {id}</span>}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              {!isNew && (
                <Button type="button" variant="danger" size="sm" onClick={handleDelete} loading={deleting} loadingText="Đang xóa...">
                  Xóa Hồ sơ
                </Button>
              )}
              {!isNew && (
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPrintModal(true)} iconLeft={<Printer className="w-3.5 h-3.5" />}>
                  In biểu mẫu
                </Button>
              )}
              <Button type="button" size="sm" onClick={() => setIsEditing(true)} className="shadow-lg shadow-indigo-600/20">
                Sửa Hồ sơ
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button" variant="outline" size="sm"
                onClick={() => { if (isNew) { router.push('/applications'); } else { setIsEditing(false); reset(); } }}
                disabled={saving}
              >
                Hủy thao tác
              </Button>
              <Button
                type="submit" size="sm"
                loading={saving} loadingText="Đang lưu..."
                disabled={saving || deleting}
                iconLeft={<Save className="w-3.5 h-3.5" />}
                className="shadow-lg shadow-indigo-600/20"
              >
                Lưu Hồ sơ
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Status banner ── */}
      {!isNew && (
        <div className={`p-1.5 px-3 rounded-lg border flex items-center justify-between shadow-xs text-[11px] shrink-0 ${
          statusConfig[customer?.applicationStatus || 'PENDING']?.color || 'bg-slate-100 text-slate-700 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            {(() => { const Icon = statusConfig[customer?.applicationStatus || 'PENDING']?.icon || Clock; return <Icon className="w-4 h-4 shrink-0" />; })()}
            <span><strong>Trạng thái hồ sơ: </strong>{statusConfig[customer?.applicationStatus || 'PENDING']?.label || 'Không xác định'}</span>
          </div>
        </div>
      )}

      {/* ── 3-panel layout ── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0 overflow-hidden">

        {/* Panel 1 — Documents */}
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
                      {hasUrl && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />}
                      {doc.title}
                    </span>
                  </button>
                );
              })}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => { const idx = bankFields.length; appendBank({ purpose: 'BOTH', bankCountry: 'VIETNAM', bankPassbookUrls: [] }); setActiveDoc(`bankPassbook_${idx}`); }}
                  className="px-2 py-1 text-[11px] font-medium border border-dashed border-indigo-300 rounded transition-all text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100"
                >
                  <span className="flex items-center justify-center gap-1">+ Ngân hàng</span>
                </button>
              )}
            </div>
          </div>

          {/* Image viewer */}
          {(() => {
            const currentDoc      = dynamicDocuments.find(d => d.key === activeDoc);
            const currentDocField = currentDoc?.urlField || 'zairyuFrontUrl';
            const currentDocUrl   = watch(currentDocField as any) as string | undefined;
            const currentDocTitle = currentDoc?.title || '';
            return (
              <div className="flex-1 p-3 flex flex-col min-h-0 bg-slate-100/30 overflow-hidden relative">
                <div className="flex justify-between items-center mb-2 shrink-0">
                  <span className="text-xs font-semibold text-slate-700">{currentDocTitle}</span>
                </div>
                <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden bg-slate-900/5 flex items-center justify-center relative group min-h-0">
                  {currentDocUrl ? (
                    <div className="relative w-full h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentDocUrl} alt={currentDocTitle} className="w-full h-full object-contain" />
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                        {isEditing && (
                          <>
                            <button type="button"
                              onClick={() => {
                                if (!currentDocUrl) return;
                                if (ocrStatus[activeDoc] === 'done') {
                                  toast('Tài liệu đã được trích xuất trước đó', { description: 'Bạn có muốn chạy lại?',
                                    action: { label: 'Chạy lại', onClick: () => runOcrExtract(currentDocUrl) },
                                    cancel:  { label: 'Hủy', onClick: () => {} }, duration: 8000 }); return;
                                }
                                runOcrExtract(currentDocUrl);
                              }}
                              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md border border-indigo-700 shadow-md transition-all flex items-center justify-center"
                              title="Trích xuất AI"
                            ><Sparkles className="w-4 h-4" /></button>
                            <button type="button"
                              onClick={() => { if (currentDocUrl) { setCropDocKey(activeDoc); setCropUrlField(currentDocField); setCropImageSrc(currentDocUrl); } }}
                              className="p-1.5 bg-white/95 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 rounded-md border border-slate-200/80 shadow-md transition-all flex items-center justify-center"
                              title="Cắt / Sửa ảnh"
                            ><Crop className="w-4 h-4" /></button>
                            <label className="cursor-pointer p-1.5 bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-md border border-slate-200/80 shadow-md transition-all flex items-center justify-center" title="Thay thế ảnh">
                              <UploadCloud className="w-4 h-4" />
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, activeDoc, currentDocField)} />
                            </label>
                            <button type="button"
                              onClick={async () => {
                                toast(`Xóa ảnh ${currentDocTitle}?`, { description: 'Thao tác này sẽ xóa ảnh khỏi tài liệu.',
                                  action: { label: 'Xóa', onClick: async () => {
                                    const prevUrl = getValues(currentDocField as any);
                                    if (prevUrl) fetch('/api/storage/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: prevUrl }) }).catch(console.error);
                                    setValue(currentDocField as any, '');
                                    if (!isNew && customerId) await fetch(`/api/customers/${customerId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [currentDocField]: '' }) });
                                    toast.success('Đã xóa ảnh tài liệu');
                                  }},
                                  cancel: { label: 'Hủy', onClick: () => {} }, duration: 8000,
                                });
                              }}
                              className="p-1.5 bg-white/95 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-md border border-slate-200/80 shadow-md transition-all flex items-center justify-center"
                              title="Xóa ảnh"
                            ><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                        <button type="button" onClick={() => setLightboxUrl(currentDocUrl || null)}
                          className="p-1.5 bg-white/95 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 rounded-md border border-slate-200/80 shadow-md transition-all flex items-center justify-center" title="Phóng to"
                        ><ZoomIn className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : isEditing ? (
                    <label
                      className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full hover:bg-slate-900/5 transition-all text-slate-400 hover:text-indigo-600 bg-white border border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-6"
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files?.length) handleFileSelect({ target: { files: e.dataTransfer.files } } as any, activeDoc, currentDocField); }}
                    >
                      <div className="w-12 h-12 rounded-full bg-indigo-50/50 flex items-center justify-center">
                        <UploadCloud className="w-6 h-6 text-indigo-500" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">Nhấp hoặc Kéo thả để tải ảnh lên</span>
                      <span className="text-[10px] text-slate-400">PNG, JPG, JPEG</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, activeDoc, currentDocField)} />
                    </label>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 w-full h-full text-slate-400 bg-white border border-dashed border-slate-200 rounded-lg p-6">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                        <UploadCloud className="w-6 h-6 text-slate-300" />
                      </div>
                      <span className="text-xs font-semibold text-slate-400">Chưa có ảnh tài liệu</span>
                      <span className="text-[10px] text-slate-400">Bật "Sửa hồ sơ" để tải ảnh lên</span>
                    </div>
                  )}
                </div>
                {ocrStatus[activeDoc] === 'processing' && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
                    <span className="text-xs text-indigo-600 flex items-center gap-1.5 bg-white border border-indigo-100 px-3 py-1.5 rounded-full shadow-sm">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />Đang quét OCR...
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Panel 2 — Form */}
        <div className="col-span-1 md:col-span-3 flex flex-col h-full bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden min-h-0">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thông tin chi tiết nhập liệu</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {(() => {
              switch (activeDoc) {
                case 'zairyuFront':
                case 'zairyuBack': {
                  const zairyuFields = ['fullName', 'dob', 'cardNumber', 'zairyuAddress', 'postalCode'];
                  const isZairyuVerified = zairyuFields.every(f => verifiedFields[f]);
                  return (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN THẺ NGOẠI KIỀU</div>
                      <div className={`p-1 px-2 rounded border flex items-center justify-between text-[10px] font-bold ${
                        isZairyuVerified ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                      }`}>
                        <span className="flex items-center gap-1">
                          <CheckCircle className={`w-3.5 h-3.5 ${isZairyuVerified ? 'text-emerald-600' : 'text-slate-400 animate-pulse'}`} />
                          Trạng thái duyệt:
                        </span>
                        <span>{isZairyuVerified ? 'ĐÃ DUYỆT KHỚP' : 'CHƯA DUYỆT KHỚP'}</span>
                      </div>

                      <FormField label="Họ và tên" required error={errors.fullName?.message as string}>
                        <div className="flex gap-1.5">
                          <Input {...register('fullName')} disabled={!isEditing} size="md"
                            verified={verifiedFields['fullName']} showVerify onVerify={() => toggleVerify('fullName')}
                            state={errors.fullName ? 'error' : verifiedFields['fullName'] ? 'verified' : 'default'} />
                        </div>
                      </FormField>

                      <FormField label="Ngày sinh" required error={errors.dob?.message as string}>
                        <div className="flex gap-1.5">
                          <Input type="date" {...register('dob')} disabled={!isEditing} size="md"
                            verified={verifiedFields['dob']} showVerify onVerify={() => toggleVerify('dob')}
                            state={errors.dob ? 'error' : verifiedFields['dob'] ? 'verified' : 'default'} />
                        </div>
                      </FormField>

                      <FormField label="Quốc tịch">
                        <Input {...register('nationality')} disabled={!isEditing} size="md" />
                      </FormField>

                      <FormField label="Số thẻ ngoại kiều">
                        <Input {...register('cardNumber')} disabled={!isEditing} size="md"
                          verified={verifiedFields['cardNumber']} showVerify onVerify={() => toggleVerify('cardNumber')}
                          state={verifiedFields['cardNumber'] ? 'verified' : 'default'} />
                      </FormField>

                      <FormField label="Mã số cá nhân (My Number)">
                        <Input {...register('myNumber')} disabled={!isEditing} size="md" />
                      </FormField>

                      <FormField label="Địa chỉ trên thẻ (Kanji)">
                        <div className="flex gap-1.5">
                          <Input {...register('zairyuAddress')} disabled={!isEditing} size="md"
                            verified={verifiedFields['zairyuAddress']} showVerify onVerify={() => toggleVerify('zairyuAddress')}
                            state={verifiedFields['zairyuAddress'] ? 'verified' : 'default'}
                            rightIcon={
                              watch('zairyuAddress') ? (
                                <button type="button"
                                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(watch('zairyuAddress') || '')}`, '_blank')}
                                  className="text-indigo-500 hover:text-indigo-700 transition-colors" title="Mở Google Maps"
                                ><MapPin className="w-3.5 h-3.5" /></button>
                              ) : undefined
                            } />
                        </div>
                      </FormField>

                      <FormField label="Mã Bưu Điện">
                        <Input {...register('postalCode')} disabled={!isEditing} size="md"
                          placeholder="VD: 4530015"
                          verified={verifiedFields['postalCode']} showVerify onVerify={() => toggleVerify('postalCode')}
                          state={verifiedFields['postalCode'] ? 'verified' : 'default'}
                          rightIcon={
                            <button type="button"
                              onClick={() => handleNtaSearch(watch('postalCode'))}
                              className="text-indigo-500 hover:text-indigo-700 transition-colors" title="Tra cứu Cục thuế"
                            ><Search className="w-3.5 h-3.5" /></button>
                          } />
                      </FormField>
                    </div>
                  );
                }

                case 'passport':
                  return (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN HỘ CHIẾU</div>
                      <FormField label="Họ và tên" required error={errors.fullName?.message as string}>
                        <Input {...register('fullName')} disabled={!isEditing} size="md"
                          verified={verifiedFields['fullName']} showVerify onVerify={() => toggleVerify('fullName')}
                          state={errors.fullName ? 'error' : verifiedFields['fullName'] ? 'verified' : 'default'} />
                      </FormField>
                      <FormField label="Ngày sinh" required error={errors.dob?.message as string}>
                        <Input type="date" {...register('dob')} disabled={!isEditing} size="md"
                          verified={verifiedFields['dob']} showVerify onVerify={() => toggleVerify('dob')}
                          state={errors.dob ? 'error' : verifiedFields['dob'] ? 'verified' : 'default'} />
                      </FormField>
                      <FormField label="Quốc tịch">
                        <Input {...register('nationality')} disabled={!isEditing} size="md" />
                      </FormField>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField label="Giới tính">
                          <select {...register('sex')} disabled={!isEditing} className="h-8 rounded-md border border-slate-200 px-2 text-xs bg-white w-full">
                            <option value="">Chọn...</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option>
                          </select>
                        </FormField>
                        <FormField label="Số điện thoại">
                          <Input {...register('phone')} disabled={!isEditing} size="md" />
                        </FormField>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField label="Ngày cấp">
                          <Input type="date" {...register('passportIssueDate')} disabled={!isEditing} size="md" />
                        </FormField>
                        <FormField label="Ngày hết hạn">
                          <Input type="date" {...register('passportExpiryDate')} disabled={!isEditing} size="md" />
                        </FormField>
                      </div>
                    </div>
                  );

                case 'nenkinBook':
                  return (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN SỔ NENKIN</div>
                      <FormField label="Mã số Nenkin">
                        <Input {...register('nenkinNumber')} disabled={!isEditing} size="md" />
                      </FormField>
                      <FormField label="Tên Katakana (Sổ Nenkin)">
                        <Input {...register('nenkinKatakanaName')} disabled={!isEditing} size="md" />
                      </FormField>
                    </div>
                  );

                case 'departureStamp':
                  return (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN DẤU XUẤT CẢNH</div>
                      <FormField label="Ngày xuất cảnh Nhật Bản">
                        <Input type="date" {...register('departureDate')} disabled={!isEditing} size="md" />
                      </FormField>
                    </div>
                  );

                default: {
                  if (activeDoc.startsWith('bankPassbook_')) {
                    const idx = parseInt(activeDoc.split('_')[1], 10);
                    if (isNaN(idx) || !bankFields[idx]) return null;
                    return (
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-indigo-600 border-b pb-1">
                          NGÂN HÀNG ({watch(`bankAccounts.${idx}.purpose`) === 'FIRST_REFUND' ? 'Lần 1' : watch(`bankAccounts.${idx}.purpose`) === 'SECOND_REFUND' ? 'Lần 2' : 'Chung'})
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField label="Quốc gia">
                            <select {...register(`bankAccounts.${idx}.bankCountry` as const)} disabled={!isEditing} className="h-8 rounded-md border border-slate-200 px-2 text-xs bg-white w-full">
                              <option value="JAPAN">Nhật Bản</option><option value="VIETNAM">Việt Nam</option>
                            </select>
                          </FormField>
                          <FormField label="Mục đích">
                            <select {...register(`bankAccounts.${idx}.purpose` as const)} disabled={!isEditing} className="h-8 rounded-md border border-slate-200 px-2 text-xs bg-white w-full">
                              <option value="BOTH">Chung 2 lần</option>
                              <option value="FIRST_REFUND">Lần 1 (JPY)</option>
                              <option value="SECOND_REFUND">Lần 2 (VND)</option>
                            </select>
                          </FormField>
                        </div>
                        <FormField label="Tên ngân hàng">
                          <BankAutocomplete index={idx} disabled={!isEditing} register={register} setValue={setValue} watch={watch} />
                        </FormField>
                        <FormField label="Chi nhánh">
                          <Input {...register(`bankAccounts.${idx}.branchName` as const)} disabled={!isEditing} size="md" />
                        </FormField>
                        <FormField label="Địa chỉ chi nhánh (Eng)">
                          <Input {...register(`bankAccounts.${idx}.bankBranchAddress` as const)} disabled={!isEditing} size="md" />
                        </FormField>
                        <FormField label="Số tài khoản">
                          <Input {...register(`bankAccounts.${idx}.accountNumber` as const)} disabled={!isEditing} size="md" />
                        </FormField>
                        <FormField label="Tên chủ TK (Romaji)">
                          <Input {...register(`bankAccounts.${idx}.accountName` as const)} disabled={!isEditing} size="md" className="uppercase" />
                        </FormField>
                        {watch(`bankAccounts.${idx}.bankCountry`) === 'JAPAN' && (
                          <FormField label="Tên chủ TK (Katakana)">
                            <Input {...register(`bankAccounts.${idx}.accountNameKatakana` as const)} disabled={!isEditing} size="md" />
                          </FormField>
                        )}
                        <FormField label="Swift Code">
                          <Input {...register(`bankAccounts.${idx}.swiftCode` as const)} disabled={!isEditing} size="md" className="uppercase" />
                        </FormField>
                        {isEditing && bankFields.length > 1 && (
                          <div className="pt-2 border-t">
                            <button type="button"
                              onClick={() => toast('Xóa tài khoản này?', {
                                action: { label: 'Xóa', onClick: () => { removeBank(idx); setActiveDoc('zairyuFront'); toast.success('Đã xóa tài khoản ngân hàng'); } },
                                cancel: { label: 'Hủy', onClick: () => {} }, duration: 6000,
                              })}
                              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium bg-rose-50 px-2 py-1.5 rounded w-fit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />Xóa tài khoản này
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }
              }
            })()}

            {/* Confirm checkbox */}
            {!isNew && (() => {
              const reqFields = ['fullName', 'dob', 'cardNumber', 'zairyuAddress', 'postalCode', 'taxOffice_name', 'taxOffice_postalCode', 'taxOffice_address', 'taxOffice_romajiAddress', 'taxOffice_phone', 'taxOffice_websiteUrl'];
              const allVerified = reqFields.every(f => verifiedFields[f]);
              return (
                <div className="mt-4 space-y-2">
                  <div className={`p-3 border rounded-lg flex items-center gap-2 transition-all ${
                    allVerified ? 'bg-indigo-50/40 border-indigo-100' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}>
                    <input type="checkbox" id="manual-confirm" disabled={!isEditing || !allVerified}
                      checked={manualConfirmed && allVerified} onChange={e => setManualConfirmed(e.target.checked)}
                      className={`rounded w-4 h-4 ${allVerified ? 'text-indigo-600 cursor-pointer' : 'text-slate-400 cursor-not-allowed'}`} />
                    <label htmlFor="manual-confirm" className={`text-xs font-semibold select-none ${
                      allVerified ? 'text-indigo-900 cursor-pointer' : 'text-slate-400 cursor-not-allowed'
                    }`}>Tôi đã đối chiếu thủ công và xác nhận khớp với ảnh tài liệu</label>
                  </div>
                  {!allVerified && isEditing && (
                    <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 p-2 rounded-md flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>⚠️ Yêu cầu đối chiếu:</strong> Tích xanh ✓ tất cả 5 trường KH và 5 trường Cục thuế trước khi phê duyệt.</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Panel 3 — Client + Tax */}
        <div className="col-span-1 md:col-span-5 flex flex-col gap-4 h-full min-h-0">

          {/* Panel 3A — Client summary */}
          <div className="flex-[5] flex flex-col bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden min-h-0">
            <div className="p-2 border-b border-slate-100 bg-slate-50/30 flex gap-2.5 shrink-0 items-center justify-between">
              <div className="flex gap-2 min-w-0 flex-1">
                <div className="w-16 h-10 border border-slate-200 rounded overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 relative group">
                  {watch('zairyuFrontUrl') ? (
                    <><img src={watch('zairyuFrontUrl') || undefined} alt="Zairyu" className="w-full h-full object-contain" />
                    <button type="button" onClick={() => setLightboxUrl(watch('zairyuFrontUrl') || null)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white"><ZoomIn className="w-3 h-3" /></button></>
                  ) : <span className="text-[8px] text-slate-400 text-center px-0.5 font-medium leading-tight">No Image</span>}
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate">{watch('fullName') || 'N/A'}</span>
                    <span className="font-mono text-[9px] text-slate-400 bg-slate-100 px-1 rounded shrink-0">#{watch('code') || '---'}</span>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5 flex gap-2">
                    <span>NS: {watch('dob') ? new Date(watch('dob') as string).toLocaleDateString('vi-VN') : '---'}</span>
                    <span>|</span>
                    <span className="truncate">QT: {watch('nationality') || '---'}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 items-end shrink-0">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</span>
                <select
                  value={watch('status') || 'DRAFT'}
                  disabled={!isEditing}
                  onChange={e => setValue('status', e.target.value as any, { shouldDirty: true })}
                  className={`h-6 rounded border px-1 text-[10px] font-bold outline-none cursor-pointer ${
                    statusConfig[(watch('status') || 'DRAFT') as any]?.color || 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {Object.keys(statusConfig).filter(k => k !== 'PENDING' && k !== 'CANCELLED').map(key => (
                    <option key={key} value={key} className="bg-white text-slate-800 font-medium">{statusConfig[key]?.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              {/* Milestones */}
              <div className="border-t border-slate-100 pt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Các mốc ngày xử lý</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Ngày nộp Lần 1',  field: 'sent1stDate'     },
                    { label: 'Ngày nhận Lần 1', field: 'received1stDate' },
                    { label: 'Ngày nộp Lần 2',  field: 'sent2ndDate'     },
                    { label: 'Ngày nhận Lần 2', field: 'received2ndDate' },
                  ].map(({ label, field }) => (
                    <FormField key={field} label={label}>
                      <Input type="date" {...register(field as any)} disabled={!isEditing} size="sm" />
                    </FormField>
                  ))}
                </div>
              </div>

              {/* Finance */}
              <div className="border-t border-slate-100 pt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thông tin Tài chính</label>
                  {isEditing && (
                    <button type="button"
                      onClick={() => {
                        const r1 = parseFloat(String(watch('received1stJpy') || 0));
                        const r2 = parseFloat(String(watch('received2ndJpy') || 0));
                        const rate = parseFloat(String(watch('exchangeRate') || 165));
                        const feeJpy = (r1 + r2) * 0.2;
                        setValue('serviceFeeJpy', feeJpy);
                        setValue('serviceFeeVnd', feeJpy * rate);
                        if (!watch('exchangeRate')) setValue('exchangeRate', 165);
                        toast.success('Đã tính phí dịch vụ (20%)');
                      }}
                      className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded hover:bg-indigo-100 font-semibold border border-indigo-200"
                    >Tính phí (20%)</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <FormField label="Dự kiến tổng">
                    <Input type="number" {...register('totalExpectedJpy')} disabled={!isEditing} size="sm" suffix="JPY" />
                  </FormField>
                  <FormField label="Tỷ giá">
                    <Input type="number" step="0.01" {...register('exchangeRate')} disabled={!isEditing} size="sm" suffix="VND/JPY" />
                  </FormField>
                  <FormField label="Đã nhận Lần 1">
                    <Input type="number" {...register('received1stJpy')} disabled={!isEditing} size="sm" prefix="¥" />
                  </FormField>
                  <FormField label="Đã nhận Lần 2">
                    <Input type="number" {...register('received2ndJpy')} disabled={!isEditing} size="sm" prefix="¥" />
                  </FormField>
                  <FormField label="Phí DV (JPY)">
                    <Input type="number" {...register('serviceFeeJpy')} disabled={!isEditing} size="sm" prefix="¥"
                      className="bg-blue-50/50" />
                  </FormField>
                  <FormField label="Phí DV (VND)">
                    <Input type="number" {...register('serviceFeeVnd')} disabled={!isEditing} size="sm" suffix="đ"
                      className="bg-emerald-50/50" />
                  </FormField>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3B — Tax office */}
          <div className="flex-[4] flex flex-col bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden min-h-0">
            <div className="p-2 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cục Thuế quản lý</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              <div className="flex gap-1.5">
                <button type="button" onClick={() => handleNtaSearch(watch('postalCode'))}
                  className="text-[9px] text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold px-2 py-1 rounded border border-blue-200 flex-1 text-center"
                >Tra cứu từ mã bưu điện KH</button>
                <button type="button" onClick={() => window.open('https://www.nta.go.jp/about/organization/access/map.htm', '_blank')}
                  className="text-[9px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-semibold px-2 py-1 rounded border border-indigo-200 flex-1 text-center"
                >Tra cứu NTA thủ công</button>
              </div>
              <div className="flex items-center gap-1.5">
                <select {...register('taxOfficeId')} disabled={!isEditing}
                  className="h-7 rounded-md border border-slate-200 px-2 text-xs bg-white flex-1 focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 font-medium min-w-0"
                >
                  <option value="">-- Chưa chọn hoặc AI tự điền --</option>
                  {taxOffices.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {isEditing && (
                  <button type="button" onClick={() => setIsAddingTaxOffice(!isAddingTaxOffice)}
                    className={`h-7 px-2 text-xs font-semibold rounded border transition-colors shrink-0 ${
                      isAddingTaxOffice ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >{isAddingTaxOffice ? 'Đóng' : '+ Mới'}</button>
                )}
              </div>

              {isAddingTaxOffice && isEditing && (
                <div className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-lg space-y-2">
                  <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Đăng ký Cục thuế mới</div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: 'Tên Cục thuế *', key: 'name',          placeholder: 'VD: 小田原税務署' },
                      { label: 'Mã bưu điện',    key: 'postalCode',    placeholder: 'VD: 250-8511'    },
                      { label: 'Địa chỉ (Kanji)', key: 'address',      placeholder: 'VD: 小田原市荻窪440番地' },
                      { label: 'Địa chỉ (Romaji)',key: 'romajiAddress', placeholder: 'VD: 440 Ogikubo' },
                      { label: 'Điện thoại',      key: 'phone',        placeholder: 'VD: 0465-35-4511' },
                      { label: 'Website',         key: 'websiteUrl',   placeholder: 'VD: https://...'  },
                    ].map(f => (
                      <FormField key={f.key} label={f.label}>
                        <input type="text" placeholder={f.placeholder}
                          value={(ntaSearchInfo as any)[f.key]}
                          onChange={e => setNtaSearchInfo(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="h-6 px-1.5 text-xs rounded border border-slate-200 bg-white font-medium w-full" />
                      </FormField>
                    ))}
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <Button type="button" variant="outline" size="xs"
                      onClick={() => { setIsAddingTaxOffice(false); setNtaSearchInfo({ name: '', address: '', romajiAddress: '', postalCode: '', phone: '', websiteUrl: '' }); }}
                    >Hủy</Button>
                    <Button type="button" size="xs" loading={creatingTaxOffice} loadingText="Đang lưu..."
                      onClick={async () => {
                        if (!ntaSearchInfo.name.trim()) { toast.warning('Vui lòng nhập tên Cục thuế.'); return; }
                        setCreatingTaxOffice(true);
                        const tid = toast.loading('Đang đăng ký Cục thuế...');
                        try {
                          const res = await fetch('/api/tax-offices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ntaSearchInfo) });
                          const d = await res.json();
                          if (res.ok && d.success) {
                            setTaxOffices(prev => prev.some(t => t.id === d.data.id) ? prev : [...prev, d.data].sort((a, b) => a.name.localeCompare(b.name)));
                            setValue('taxOfficeId', d.data.id);
                            setIsAddingTaxOffice(false);
                            toast.success(`Đã đăng ký: ${d.data.name}`, { id: tid });
                          } else {
                            toast.error('Lỗi đăng ký', { id: tid, description: d.error || 'Vui lòng thử lại.' });
                          }
                        } catch { toast.error('Lỗi kết nối', { id: tid }); }
                        finally { setCreatingTaxOffice(false); }
                      }}
                    >Lưu &amp; Áp dụng</Button>
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
          <button className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full p-2" onClick={() => setLightboxUrl(null)}><X className="w-5 h-5" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Crop modal */}
      {cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          onComplete={handleCropComplete}
          onCancel={() => { if (cropImageSrc) URL.revokeObjectURL(cropImageSrc); setCropImageSrc(null); setCropFile(null); setCropDocKey(''); setCropUrlField(''); }}
        />
      )}
    </form>
  );
}
