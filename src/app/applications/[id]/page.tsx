'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Loader2, X, UploadCloud, CheckCircle,
  AlertCircle, ZoomIn, Clock, Send, Wallet, Trash2, Sparkles,
  Printer, MapPin, Search, Crop,
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workspaceSchema, WorkspaceFormValues } from '@/lib/validations/workspaceSchema';
import { BankAutocomplete } from '../components/BankAutocomplete';
import ImageCropModal from '@/components/ImageCropModal';
import { Button }         from '@/components/ui/Button';
import { Input }          from '@/components/ui/Input';
import { FormField }      from '@/components/ui/FormField';
import { WorkflowPanel }  from '@/components/ui/WorkflowPanel';
import type { WorkflowStatus } from '@/components/ui/WorkflowPanel';
import { TaxOfficeCard }       from '@/components/ui/TaxOfficeCard';
import type { TaxOfficeData }  from '@/components/ui/TaxOfficeCard';
import { TaxOfficeForm }       from '@/components/ui/TaxOfficeForm';
import type { TaxOfficeFormValues } from '@/components/ui/TaxOfficeForm';
import { TaxOfficeDiffPanel }  from '@/components/ui/TaxOfficeDiffPanel';
import { toast } from 'sonner';

const BASE_DOCUMENTS = [
  { key: 'zairyuFront',    title: 'Thẻ Ngoại Kiều (Trước)', urlField: 'zairyuFrontUrl' },
  { key: 'zairyuBack',     title: 'Thẻ Ngoại Kiều (Sau)',   urlField: 'zairyuBackUrl'  },
  { key: 'passport',       title: 'Hộ chiếu',                urlField: 'passportUrl'    },
  { key: 'nenkinBook',     title: 'Sổ Nenkin',               urlField: 'nenkinBookUrl'  },
  { key: 'departureStamp', title: 'Dấu xuất cảnh',           urlField: 'departureStampUrl' },
];

const statusConfig: Record<string, { label: string; color: string; badgeColor: string; icon: React.ElementType }> = {
  PENDING:      { label: 'Cần duyệt',      color: 'bg-orange-50 text-orange-700 border-orange-200',   badgeColor: 'bg-orange-100 text-orange-700 border-orange-300',   icon: AlertCircle },
  DRAFT:        { label: 'Bản nháp',       color: 'bg-amber-50 text-amber-700 border-amber-200',       badgeColor: 'bg-amber-100 text-amber-700 border-amber-300',       icon: Clock       },
  SENT_1ST:     { label: 'Đã gửi Lần 1',  color: 'bg-blue-50 text-blue-700 border-blue-200',           badgeColor: 'bg-blue-100 text-blue-700 border-blue-300',           icon: Send        },
  RECEIVED_1ST: { label: 'Đã nhận Lần 1', color: 'bg-indigo-50 text-indigo-700 border-indigo-200',    badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-300',    icon: Wallet      },
  SENT_2ND:     { label: 'Đã gửi Lần 2',  color: 'bg-purple-50 text-purple-700 border-purple-200',    badgeColor: 'bg-purple-100 text-purple-700 border-purple-300',    icon: Send        },
  RECEIVED_2ND: { label: 'Đã nhận Lần 2', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: Wallet      },
  COMPLETED:    { label: 'Hoàn thành',     color: 'bg-green-100 text-green-700 border-green-200',      badgeColor: 'bg-green-100 text-green-700 border-green-300',      icon: CheckCircle },
  CANCELLED:    { label: 'Đã hủy',         color: 'bg-red-50 text-red-700 border-red-200',             badgeColor: 'bg-red-100 text-red-700 border-red-300',             icon: AlertCircle },
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
  const [showPrintModal,    setShowPrintModal]    = useState<boolean>(false);
  const [verifiedFields,    setVerifiedFields]    = useState<Record<string, boolean>>({});
  const [cropFile,          setCropFile]          = useState<File | null>(null);
  const [cropDocKey,        setCropDocKey]        = useState<string>('');
  const [cropUrlField,      setCropUrlField]      = useState<string>('');
  const [cropImageSrc,      setCropImageSrc]      = useState<string | null>(null);
  const [panel3aTab,        setPanel3aTab]        = useState<'dates' | 'finance'>('dates');
  const [taxOffices,        setTaxOffices]        = useState<TaxOfficeData[]>([]);
  const [taxPanel,          setTaxPanel]          = useState<'card' | 'form' | 'diff'>('card');
  const [taxFormSaving,     setTaxFormSaving]     = useState(false);

  const toggleVerify = (field: string) =>
    setVerifiedFields(prev => ({ ...prev, [field]: !prev[field] }));

  const { register, handleSubmit, formState: { errors }, reset, setValue, getValues, watch, control } =
    useForm<WorkspaceFormValues>({
      mode: 'onBlur',
      resolver: zodResolver(workspaceSchema),
      defaultValues: { status: 'DRAFT' },
    });

  const { fields: bankFields, append: appendBank, remove: removeBank } = useFieldArray({
    control,
    name: 'bankAccounts',
  });

  const dynamicDocuments = React.useMemo(() => {
    const banks = watch('bankAccounts') || [];
    const bankDocs = banks.flatMap((bank, index) => {
      const urls = bank.bankPassbookUrls || [];
      const purposeLabel = bank.purpose === 'FIRST_REFUND' ? 'Lần 1'
        : bank.purpose === 'SECOND_REFUND' ? 'Lần 2' : 'Chung';
      const items = urls.map((url: string, urlIndex: number) => ({
        key: `bankPassbook_${index}_${urlIndex}`,
        title: `Sổ Ngân hàng (${purposeLabel}) - Ảnh ${urlIndex + 1}`,
        urlField: `bankAccounts.${index}.bankPassbookUrls.${urlIndex}`,
      }));
      items.push({
        key: `bankPassbook_${index}_${urls.length}`,
        title: `Sổ Ngân hàng (${purposeLabel}) - Thêm ảnh`,
        urlField: `bankAccounts.${index}.bankPassbookUrls.${urls.length}`,
      });
      return items;
    });
    return [BASE_DOCUMENTS[0], BASE_DOCUMENTS[1], BASE_DOCUMENTS[2], BASE_DOCUMENTS[3], ...bankDocs, BASE_DOCUMENTS[4]];
  }, [watch('bankAccounts')]);

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
          const formatDate = (d: string | null | undefined) =>
            d ? new Date(d).toISOString().split('T')[0] : '';
          const formValues: any = {
            ...customer,
            dob:                formatDate(customer.dob),
            departureDate:      formatDate(customer.departureDate),
            passportIssueDate:  formatDate(customer.passportIssueDate),
            passportExpiryDate: formatDate(customer.passportExpiryDate),
            status:             data.status,
            applyDate:          formatDate(data.applyDate),
            sent1stDate:        formatDate(data.sent1stDate),
            received1stDate:    formatDate(data.received1stDate),
            sent2ndDate:        formatDate(data.sent2ndDate),
            received2ndDate:    formatDate(data.received2ndDate),
            totalExpectedJpy:   data.totalExpectedJpy  || '',
            received1stJpy:     data.received1stJpy    || '',
            received2ndJpy:     data.received2ndJpy    || '',
            serviceFeeJpy:      data.serviceFeeJpy     || '',
            exchangeRate:       data.exchangeRate      || '',
            serviceFeeVnd:      data.serviceFeeVnd     || '',
          };
          Object.keys(formValues).forEach(key => {
            if (formValues[key] === null)
              formValues[key] = key === 'hasPermanentResidence' ? false : '';
          });
          if (customer.status === 'VERIFIED') {
            setVerifiedFields({
              fullName: true, dob: true, cardNumber: true,
              zairyuAddress: true, postalCode: true,
              taxOffice_name: true, taxOffice_postalCode: true,
              taxOffice_address: true, taxOffice_phone: true, taxOffice_websiteUrl: true,
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
      .then(r => r.json())
      .then(d => { if (d.success) setTaxOffices(d.data as TaxOfficeData[]); })
      .catch(console.error);
  }, [id, isNew, reset]);

  const selectedTaxOfficeId = watch('taxOfficeId');
  const selectedTaxOffice   = taxOffices.find(t => t.id === selectedTaxOfficeId) ?? null;

  const handleTaxFormSubmit = useCallback(async (values: TaxOfficeFormValues) => {
    setTaxFormSaving(true);
    const isUpdate = !!(selectedTaxOffice?.id);
    const url      = isUpdate ? `/api/tax-offices/${selectedTaxOffice!.id}` : '/api/tax-offices';
    const method   = isUpdate ? 'PUT' : 'POST';
    const tid      = toast.loading(isUpdate ? 'Cập nhật Cục thuế...' : 'Tạo mới Cục thuế...');
    try {
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi lưu');
      setTaxOffices(prev => {
        const exists = prev.findIndex(t => t.id === data.data.id);
        if (exists >= 0) { const next = [...prev]; next[exists] = data.data; return next; }
        return [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name));
      });
      setValue('taxOfficeId', data.data.id, { shouldDirty: true });
      toast.success(isUpdate ? `Đã cập nhật: ${data.data.name}` : `Đã tạo mới: ${data.data.name}`, { id: tid });
      setTaxPanel('card');
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message, { id: tid });
    } finally {
      setTaxFormSaving(false);
    }
  }, [selectedTaxOffice, setValue]);

  const handleTaxSyncFields = useCallback(async (patch: Partial<TaxOfficeData>) => {
    if (!selectedTaxOffice?.id) {
      toast.warning('Chưa chọn Cục thuế', { description: 'Chọn Cục thuế trước khi đồng bộ.' });
      return;
    }
    const res  = await fetch(`/api/tax-offices/${selectedTaxOffice.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi đồng bộ');
    setTaxOffices(prev => prev.map(t => t.id === data.data.id ? data.data : t));
  }, [selectedTaxOffice]);

  const onSubmit = async (data: WorkspaceFormValues) => {
    setSaving(true);
    const toastId = toast.loading(isNew ? 'Đang tạo hồ sơ mới...' : 'Đang lưu hồ sơ...');
    try {
      const customerPayload = {
        fullName: data.fullName, dob: data.dob ? new Date(data.dob).toISOString() : undefined,
        nationality: data.nationality, myNumber: data.myNumber,
        zairyuAddress: data.zairyuAddress, cardNumber: data.cardNumber,
        nenkinNumber: data.nenkinNumber, nenkinKatakanaName: data.nenkinKatakanaName,
        postalCode: data.postalCode, taxOfficeId: data.taxOfficeId,
        bankAccounts: data.bankAccounts,
        zairyuFrontUrl: data.zairyuFrontUrl, zairyuBackUrl: data.zairyuBackUrl,
        passportUrl: data.passportUrl, nenkinBookUrl: data.nenkinBookUrl,
        departureStampUrl: data.departureStampUrl,
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
        if (!appRes.ok) { const e = await appRes.json(); throw new Error(e.error || 'Lỗi lấy thông tin hồ sơ.'); }
        const appData = await appRes.json();
        if (appData.customerId) {
          const cRes = await fetch(`/api/customers/${appData.customerId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customerPayload) });
          if (!cRes.ok) { const e = await cRes.json(); throw new Error(e.error || 'Lỗi cập nhật khách hàng.'); }
        }
        const aRes = await fetch(`/api/applications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(applicationPayload) });
        if (!aRes.ok) { const e = await aRes.json(); throw new Error(e.error || 'Lỗi cập nhật hồ sơ.'); }
        toast.success('Lưu hồ sơ thành công!', { id: toastId, description: 'Tất cả thay đổi đã được lưu.' });
        setIsEditing(false);
      }
    } catch (e: any) {
      toast.error('Đã có lỗi xảy ra', { id: toastId, description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const onError = (formErrors: any) => {
    toast.error('Không thể lưu hồ sơ', {
      description: 'Lỗi: ' + Object.keys(formErrors).map(k => `${k}: ${formErrors[k].message || 'Không hợp lệ'}`).join(', '),
      duration: 6000,
    });
  };

  const handleDelete = async () => {
    toast('Bạn có chắc muốn xóa hồ sơ này?', {
      description: 'Hành động này không thể hoàn tác.',
      action: { label: 'Xóa', onClick: async () => {
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
      }},
      cancel: { label: 'Hủy', onClick: () => {} },
      duration: 8000,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docKey: string, urlField: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file); setCropDocKey(docKey); setCropUrlField(urlField);
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const file = new File([croppedBlob], cropFile?.name || 'cropped.jpg', { type: croppedBlob.type });
    const docKey = cropDocKey; const urlField = cropUrlField;
    if (cropImageSrc) { URL.revokeObjectURL(cropImageSrc); setCropImageSrc(null); }
    setCropFile(null); setCropDocKey(''); setCropUrlField('');
    setOcrStatus(prev => ({ ...prev, [docKey]: 'processing' }));
    setValue(urlField as any, URL.createObjectURL(file));
    const form = new FormData();
    form.append('file', file); form.append('documentType', docKey); form.append('action', 'uploadAndExtract');
    if (customerId) form.append('customerId', customerId);
    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        const prevUrl = getValues(urlField as any);
        if (prevUrl && prevUrl !== data.publicUrl)
          fetch('/api/storage/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: prevUrl }) }).catch(console.error);
        setValue(urlField as any, data.publicUrl);
        setOcrStatus(prev => ({ ...prev, [docKey]: 'done' }));
        if (data.extractedData && !data.extractedData.error) applyExtracted(docKey, data.extractedData);
        if (!isNew && customerId)
          await fetch(`/api/customers/${customerId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [urlField]: data.publicUrl }) });
      } else {
        toast.error('Lỗi upload ảnh', { description: data.error || 'Không thể tải ảnh lên.' });
        setOcrStatus(prev => ({ ...prev, [docKey]: 'error' }));
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi upload', { description: 'Vui lòng thử lại.' });
      setOcrStatus(prev => ({ ...prev, [docKey]: 'error' }));
    }
  };

  const applyExtracted = (docKey: string, ext: any) => {
    if (docKey === 'zairyuFront' || docKey === 'zairyuBack') {
      if (ext.fullName)    setValue('fullName',       ext.fullName,    { shouldValidate: true, shouldDirty: true });
      if (ext.dob)         setValue('dob',             ext.dob,         { shouldValidate: true, shouldDirty: true });
      if (ext.nationality) setValue('nationality',     ext.nationality, { shouldDirty: true });
      if (ext.cardNumber)  setValue('cardNumber',      ext.cardNumber,  { shouldDirty: true });
      if (ext.address)     setValue('zairyuAddress',   ext.address,     { shouldDirty: true });
      if (ext.postalCode)  setValue('postalCode',      ext.postalCode,  { shouldDirty: true });
      if (ext.taxOffice?.name) {
        fetch('/api/tax-offices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ext.taxOffice) })
          .then(r => r.json()).then(tData => {
            if (tData.success && tData.data?.id) {
              setTaxOffices(prev => prev.find(t => t.id === tData.data.id) ? prev : [...prev, tData.data]);
              setValue('taxOfficeId', tData.data.id, { shouldDirty: true });
            }
          }).catch(console.error);
      }
    } else if (docKey === 'passport') {
      if (ext.lastName || ext.firstName) setValue('fullName', `${ext.lastName || ''} ${ext.firstName || ''}`.trim(), { shouldDirty: true });
      if (ext.dob)           setValue('dob',         ext.dob,          { shouldDirty: true });
      if (ext.nationality)   setValue('nationality',  ext.nationality,  { shouldDirty: true });
      if (ext.sex)           setValue('sex',          ext.sex === 'M' ? 'Nam' : 'Nữ', { shouldDirty: true });
      if (ext.passportNumber) setValue('cardNumber',  ext.passportNumber, { shouldDirty: true });
    } else if (docKey === 'nenkinBook') {
      if (ext.nenkinNumber)       setValue('nenkinNumber',       ext.nenkinNumber,       { shouldDirty: true });
      if (ext.nenkinKatakanaName) setValue('nenkinKatakanaName', ext.nenkinKatakanaName, { shouldDirty: true });
    } else if (docKey.startsWith('bankPassbook_')) {
      const idx = parseInt(docKey.split('_')[1], 10);
      if (!isNaN(idx)) {
        if (ext.bankName)      setValue(`bankAccounts.${idx}.bankName`      as any, ext.bankName,      { shouldDirty: true });
        if (ext.branchName)    setValue(`bankAccounts.${idx}.branchName`    as any, ext.branchName,    { shouldDirty: true });
        if (ext.accountNumber) setValue(`bankAccounts.${idx}.accountNumber` as any, ext.accountNumber, { shouldDirty: true });
        if (ext.accountName)   setValue(`bankAccounts.${idx}.accountName`   as any, ext.accountName,   { shouldDirty: true });
        if (ext.swiftCode)     setValue(`bankAccounts.${idx}.swiftCode`     as any, ext.swiftCode,     { shouldDirty: true });
      }
    } else if (docKey === 'departureStamp') {
      if (ext.departureDate) setValue('departureDate', ext.departureDate, { shouldDirty: true });
    }
  };

  const handleNtaSearch = (zip: string | null | undefined) => {
    if (!zip) { toast.warning('Chưa có mã bưu điện', { description: 'Vui lòng nhập mã bưu điện trước.' }); return; }
    const cleaned = zip.replace(/[-\s]/g, '');
    if (cleaned.length !== 7) { toast.warning('Mã bưu điện không hợp lệ', { description: 'Phải đúng 7 chữ số.' }); return; }
    const form = document.createElement('form');
    form.method = 'POST'; form.action = 'https://www.nta.go.jp/cgi-bin/zeimusho/kensaku/kensakuprocess.php';
    form.target = '_blank'; form.acceptCharset = 'EUC-JP';
    [['KSTYPE','ksz'],['TODOFUKEN_TO_ASCII',''],['ADDR_TO_ASCII',''],['kszc1',cleaned.substring(0,3)],['kszc2',cleaned.substring(3,7)]].forEach(([k,v]) => {
      const i = document.createElement('input'); i.type='hidden'; i.name=k; i.value=v; form.appendChild(i);
    });
    document.body.appendChild(form); form.submit(); document.body.removeChild(form);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const currentDoc      = dynamicDocuments.find(d => d.key === activeDoc);
  const currentDocField = currentDoc?.urlField || 'zairyuFrontUrl';
  const currentDocUrl   = watch(currentDocField as any) as string | undefined;
  const currentDocTitle = currentDoc?.title || '';
  const appStatus  = watch('status') as string || 'DRAFT';
  const statusCfg  = statusConfig[appStatus] ?? statusConfig['DRAFT'];
  const StatusIcon = statusCfg.icon;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // NEW grid: col-span 4 | 5 | 3
  //   Panel 1 (4): Ảnh tài liệu
  //   Panel 2 (5): Form fields  +  Cục Thuế (gộp, cuộn chung)
  //   Panel 3 (3): Client strip + WorkflowPanel + Dates/Finance tabs
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="h-[calc(100vh-65px)] flex flex-col gap-2">

      {/* ── Header ── */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push('/applications')}
            className="p-1.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-800">
              {isNew ? 'Tạo Hồ sơ mới' : 'Chi tiết Hồ sơ'}
            </h1>
            {!isNew && <span className="text-[9px] font-normal text-slate-400 font-mono">ID: {id}</span>}
            {!isNew && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.badgeColor}`}>
                <StatusIcon className="w-3 h-3" />{statusCfg.label}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              {!isNew && <Button type="button" variant="danger" size="sm" onClick={handleDelete} loading={deleting} loadingText="Đang xóa...">Xóa Hồ sơ</Button>}
              {!isNew && <Button type="button" variant="secondary" size="sm" onClick={() => setShowPrintModal(true)} iconLeft={<Printer className="w-3.5 h-3.5" />}>In biểu mẫu</Button>}
              <Button type="button" size="sm" onClick={() => setIsEditing(true)}>Sửa Hồ sơ</Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" size="sm" disabled={saving}
                onClick={() => { if (isNew) router.push('/applications'); else { setIsEditing(false); reset(); } }}>
                Hủy thao tác
              </Button>
              <Button type="submit" size="sm" loading={saving} loadingText="Đang lưu..." iconLeft={<Save className="w-3.5 h-3.5" />}>
                Lưu Hồ sơ
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── 3-column layout: 4 | 5 | 3 ── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0 overflow-hidden">

        {/* ═══════════════════════════════════════════════════════════════════
            PANEL 1 – col-span-4 – Ảnh tài liệu
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="col-span-1 md:col-span-4 flex flex-col h-full bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden min-h-0">
          <div className="p-3 border-b border-slate-100 flex flex-col gap-1.5 shrink-0 bg-slate-50/50">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Danh mục tài liệu</div>
            <div className="grid grid-cols-3 gap-1">
              {dynamicDocuments.map(doc => {
                const isActive = activeDoc === doc.key;
                const hasUrl   = !!watch(doc.urlField as any);
                return (
                  <button key={doc.key} type="button" onClick={() => setActiveDoc(doc.key)}
                    className={`px-2 py-1 text-[11px] font-medium border rounded transition-all truncate text-center ${
                      isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    <span className="flex items-center justify-center gap-1">
                      {hasUrl && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />}
                      {doc.title}
                    </span>
                  </button>
                );
              })}
              {isEditing && (
                <button type="button"
                  onClick={() => { const i = bankFields.length; appendBank({ purpose: 'BOTH', bankCountry: 'VIETNAM', bankPassbookUrls: [] }); setActiveDoc(`bankPassbook_${i}`); }}
                  className="px-2 py-1 text-[11px] font-medium border border-dashed border-indigo-300 rounded text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100">
                  + Thêm Ngân hàng
                </button>
              )}
            </div>
          </div>

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
                        <Button type="button" variant="primary" size="icon-sm" title="Trích xuất AI"
                          onClick={async () => {
                            if (!currentDocUrl) return;
                            if (ocrStatus[activeDoc] === 'done') {
                              toast('Đã trích xuất trước đó', {
                                description: 'Chạy lại?',
                                action: { label: 'Chạy lại', onClick: () => runOcrExtract(currentDocUrl) },
                                cancel: { label: 'Hủy', onClick: () => {} }, duration: 8000,
                              }); return;
                            }
                            runOcrExtract(currentDocUrl);
                          }}>
                          <Sparkles className="w-3.5 h-3.5" />
                        </Button>
                        <Button type="button" variant="outline" size="icon-sm" title="Cắt ảnh"
                          onClick={() => { if (currentDocUrl) { setCropDocKey(activeDoc); setCropUrlField(currentDocField); setCropImageSrc(currentDocUrl); } }}>
                          <Crop className="w-3.5 h-3.5" />
                        </Button>
                        <label className="cursor-pointer" title="Thay thế ảnh">
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm">
                            <UploadCloud className="w-3.5 h-3.5" />
                          </span>
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleFileSelect(e, activeDoc, currentDocField)} />
                        </label>
                        <Button type="button" variant="outline" size="icon-sm" title="Xóa ảnh"
                          className="hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                          onClick={() => toast(`Xóa ảnh ${currentDocTitle}?`, {
                            action: { label: 'Xóa', onClick: async () => {
                              const prev = getValues(currentDocField as any);
                              if (prev) fetch('/api/storage/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: prev }) }).catch(console.error);
                              setValue(currentDocField as any, '');
                              if (!isNew && customerId) await fetch(`/api/customers/${customerId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [currentDocField]: '' }) });
                              toast.success('Đã xóa ảnh tài liệu');
                            }},
                            cancel: { label: 'Hủy', onClick: () => {} }, duration: 8000,
                          })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                    <Button type="button" variant="outline" size="icon-sm" title="Phóng to" onClick={() => setLightboxUrl(currentDocUrl || null)}>
                      <ZoomIn className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : isEditing ? (
                <label
                  className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full hover:bg-slate-900/5 transition-all text-slate-400 hover:text-indigo-600 bg-white border border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-6"
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={e => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files?.length) handleFileSelect({ target: { files: e.dataTransfer.files } } as any, activeDoc, currentDocField); }}
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-50/50 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6 text-indigo-500" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">Nhấp hoặc Kéo thả để tải ảnh</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG, JPEG</span>
                  <input type="file" className="hidden" accept="image/*" onChange={e => handleFileSelect(e, activeDoc, currentDocField)} />
                </label>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 w-full h-full text-slate-400 bg-white border border-dashed border-slate-200 rounded-lg p-6">
                  <UploadCloud className="w-6 h-6 text-slate-300" />
                  <span className="text-xs font-semibold text-slate-400">Chưa có ảnh tài liệu</span>
                  <span className="text-[10px] text-slate-400">Bật "Sửa hồ sơ" để tải lên</span>
                </div>
              )}
            </div>
            {ocrStatus[activeDoc] === 'processing' && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
                <span className="text-xs text-indigo-600 flex items-center gap-1.5 bg-white border border-indigo-100 px-3 py-1.5 rounded-full shadow-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang quét OCR...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            PANEL 2 – col-span-5 – Form nhập liệu  +  Cục Thuế (cuộn chung)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="col-span-1 md:col-span-5 flex flex-col h-full bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden min-h-0">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thông tin chi tiết nhập liệu</span>
            {/* Tax selector always visible in header for quick switching */}
            {isEditing && (
              <select
                value={selectedTaxOfficeId || ''}
                onChange={e => setValue('taxOfficeId', e.target.value, { shouldDirty: true })}
                className="h-6 rounded border border-slate-200 px-1.5 text-[10px] bg-white max-w-[130px] focus:outline-none focus:border-indigo-400 font-medium"
              >
                <option value="">-- Cục thuế --</option>
                {taxOffices.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>

          {/* scrollable body: form + divider + tax section */}
          <div className="flex-1 overflow-y-auto min-h-0">

            {/* ── Section A: Form fields (switches by activeDoc) ── */}
            <div className="p-4">
              {(() => {
                switch (activeDoc) {
                  case 'zairyuFront':
                  case 'zairyuBack': {
                    const zFields = ['fullName','dob','cardNumber','zairyuAddress','postalCode'];
                    const allVerified = zFields.every(f => verifiedFields[f]);
                    return (
                      <div className="space-y-2.5">
                        <div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN THẺ NGOẠI KIỀU</div>
                        <div className={`p-1 px-2 rounded border flex items-center justify-between text-[10px] font-bold ${
                          allVerified ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                          <span className="flex items-center gap-1">
                            <CheckCircle className={`w-3.5 h-3.5 ${allVerified ? 'text-emerald-600' : 'text-slate-400 animate-pulse'}`} />
                            Trạng thái duyệt:
                          </span>
                          <span>{allVerified ? 'ĐÃ DUYỆT KHỚP' : 'CHƯA DUYỆT KHỚP'}</span>
                        </div>
                        <FormField label="Họ và tên" required errorMessage={errors.fullName?.message as string}>
                          <Input {...register('fullName')} disabled={!isEditing} size="md"
                            verified={verifiedFields['fullName']} showVerify onVerify={() => toggleVerify('fullName')}
                            state={errors.fullName ? 'error' : verifiedFields['fullName'] ? 'verified' : 'default'} />
                        </FormField>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField label="Ngày sinh" required errorMessage={errors.dob?.message as string}>
                            <Input type="date" {...register('dob')} disabled={!isEditing} size="md"
                              verified={verifiedFields['dob']} showVerify onVerify={() => toggleVerify('dob')}
                              state={errors.dob ? 'error' : verifiedFields['dob'] ? 'verified' : 'default'} />
                          </FormField>
                          <FormField label="Quốc tịch"><Input {...register('nationality')} disabled={!isEditing} size="md" /></FormField>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField label="Số thẻ ngoại kiều">
                            <Input {...register('cardNumber')} disabled={!isEditing} size="md"
                              verified={verifiedFields['cardNumber']} showVerify onVerify={() => toggleVerify('cardNumber')}
                              state={verifiedFields['cardNumber'] ? 'verified' : 'default'} />
                          </FormField>
                          <FormField label="My Number"><Input {...register('myNumber')} disabled={!isEditing} size="md" /></FormField>
                        </div>
                        <FormField label="Địa chỉ trên thẻ (Kanji)">
                          <Input {...register('zairyuAddress')} disabled={!isEditing} size="md"
                            verified={verifiedFields['zairyuAddress']} showVerify onVerify={() => toggleVerify('zairyuAddress')}
                            state={verifiedFields['zairyuAddress'] ? 'verified' : 'default'}
                            rightIcon={watch('zairyuAddress') ? (
                              <button type="button" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(watch('zairyuAddress')||'')}`, '_blank')} className="text-indigo-500 hover:text-indigo-700">
                                <MapPin className="w-3.5 h-3.5" />
                              </button>
                            ) : undefined} />
                        </FormField>
                        <FormField label="Mã Bưu Điện">
                          <Input {...register('postalCode')} disabled={!isEditing} size="md" placeholder="VD: 4530015"
                            verified={verifiedFields['postalCode']} showVerify onVerify={() => toggleVerify('postalCode')}
                            state={verifiedFields['postalCode'] ? 'verified' : 'default'}
                            rightIcon={
                              <button type="button" onClick={() => handleNtaSearch(watch('postalCode'))} className="text-indigo-500 hover:text-indigo-700">
                                <Search className="w-3.5 h-3.5" />
                              </button>
                            } />
                        </FormField>
                      </div>
                    );
                  }

                  case 'passport':
                    return (
                      <div className="space-y-2.5">
                        <div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN HỘ CHIẾU</div>
                        <FormField label="Họ và tên" required errorMessage={errors.fullName?.message as string}>
                          <Input {...register('fullName')} disabled={!isEditing} size="md"
                            verified={verifiedFields['fullName']} showVerify onVerify={() => toggleVerify('fullName')}
                            state={errors.fullName ? 'error' : verifiedFields['fullName'] ? 'verified' : 'default'} />
                        </FormField>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField label="Ngày sinh" required errorMessage={errors.dob?.message as string}>
                            <Input type="date" {...register('dob')} disabled={!isEditing} size="md"
                              verified={verifiedFields['dob']} showVerify onVerify={() => toggleVerify('dob')}
                              state={errors.dob ? 'error' : verifiedFields['dob'] ? 'verified' : 'default'} />
                          </FormField>
                          <FormField label="Quốc tịch"><Input {...register('nationality')} disabled={!isEditing} size="md" /></FormField>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField label="Giới tính">
                            <select {...register('sex')} disabled={!isEditing} className="h-8 rounded-md border border-slate-200 px-2 text-xs bg-white w-full">
                              <option value="">Chọn...</option>
                              <option value="Nam">Nam</option>
                              <option value="Nữ">Nữ</option>
                            </select>
                          </FormField>
                          <FormField label="Điện thoại"><Input {...register('phone')} disabled={!isEditing} size="md" /></FormField>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField label="Ngày cấp"><Input type="date" {...register('passportIssueDate')} disabled={!isEditing} size="md" /></FormField>
                          <FormField label="Hết hạn"><Input type="date" {...register('passportExpiryDate')} disabled={!isEditing} size="md" /></FormField>
                        </div>
                      </div>
                    );

                  case 'nenkinBook':
                    return (
                      <div className="space-y-2.5">
                        <div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN SỔ NENKIN</div>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField label="Mã số Nenkin"><Input {...register('nenkinNumber')} disabled={!isEditing} size="md" /></FormField>
                          <FormField label="Tên Katakana"><Input {...register('nenkinKatakanaName')} disabled={!isEditing} size="md" /></FormField>
                        </div>
                      </div>
                    );

                  case 'departureStamp':
                    return (
                      <div className="space-y-2.5">
                        <div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN DẤU XUẤT CẢNH</div>
                        <FormField label="Ngày xuất cảnh Nhật Bản">
                          <Input type="date" {...register('departureDate')} disabled={!isEditing} size="md" />
                        </FormField>
                      </div>
                    );

                  default: {
                    if (!activeDoc.startsWith('bankPassbook_')) return null;
                    const idx = parseInt(activeDoc.split('_')[1], 10);
                    if (isNaN(idx) || !bankFields[idx]) return null;
                    const purposeLabel = watch(`bankAccounts.${idx}.purpose`) === 'FIRST_REFUND' ? 'Lần 1'
                      : watch(`bankAccounts.${idx}.purpose`) === 'SECOND_REFUND' ? 'Lần 2' : 'Chung';
                    return (
                      <div className="space-y-2.5">
                        <div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN NGÂN HÀNG ({purposeLabel})</div>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField label="Quốc gia">
                            <select {...register(`bankAccounts.${idx}.bankCountry` as const)} disabled={!isEditing} className="h-8 rounded-md border border-slate-200 px-2 text-xs bg-white w-full">
                              <option value="JAPAN">Nhật Bản</option>
                              <option value="VIETNAM">Việt Nam</option>
                            </select>
                          </FormField>
                          <FormField label="Mục đích">
                            <select {...register(`bankAccounts.${idx}.purpose` as const)} disabled={!isEditing} className="h-8 rounded-md border border-slate-200 px-2 text-xs bg-white w-full">
                              <option value="BOTH">Chung cả 2 lần</option>
                              <option value="FIRST_REFUND">Lần 1 (Tiền Nhật)</option>
                              <option value="SECOND_REFUND">Lần 2 (Tiền Việt)</option>
                            </select>
                          </FormField>
                        </div>
                        <FormField label="Tên ngân hàng">
                          <BankAutocomplete index={idx} disabled={!isEditing} register={register} setValue={setValue} watch={watch} />
                        </FormField>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField label="Chi nhánh"><Input {...register(`bankAccounts.${idx}.branchName` as const)} disabled={!isEditing} size="md" /></FormField>
                          <FormField label="Số tài khoản"><Input {...register(`bankAccounts.${idx}.accountNumber` as const)} disabled={!isEditing} size="md" /></FormField>
                        </div>
                        <FormField label="Địa chỉ chi nhánh (Eng)"><Input {...register(`bankAccounts.${idx}.bankBranchAddress` as const)} disabled={!isEditing} size="md" /></FormField>
                        <FormField label="Chủ tài khoản (Romaji)"><Input {...register(`bankAccounts.${idx}.accountName` as const)} disabled={!isEditing} size="md" className="uppercase" /></FormField>
                        {watch(`bankAccounts.${idx}.bankCountry`) === 'JAPAN' && (
                          <FormField label="Chủ TK (Katakana)"><Input {...register(`bankAccounts.${idx}.accountNameKatakana` as const)} disabled={!isEditing} size="md" /></FormField>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <FormField label="Swift Code"><Input {...register(`bankAccounts.${idx}.swiftCode` as const)} disabled={!isEditing} size="md" className="uppercase" /></FormField>
                        </div>
                        {isEditing && bankFields.length > 1 && (
                          <div className="pt-2 border-t">
                            <Button type="button" variant="danger" size="xs" iconLeft={<Trash2 className="w-3 h-3" />}
                              onClick={() => toast('Xóa tài khoản ngân hàng này?', {
                                action: { label: 'Xóa', onClick: () => { removeBank(idx); setActiveDoc('zairyuFront'); toast.success('Đã xóa tài khoản'); } },
                                cancel: { label: 'Hủy', onClick: () => {} }, duration: 6000,
                              })}>Xóa tài khoản này</Button>
                          </div>
                        )}
                      </div>
                    );
                  }
                }
              })()}

              {/* Verify confirm – cuối form */}
              {!isNew && (() => {
                const required = ['fullName','dob','cardNumber','zairyuAddress','postalCode','taxOffice_name','taxOffice_postalCode','taxOffice_address','taxOffice_romajiAddress','taxOffice_phone','taxOffice_websiteUrl'];
                const allVerified = required.every(f => verifiedFields[f]);
                return (
                  <div className="mt-4 space-y-2">
                    <div className={`p-3 border rounded-lg flex items-center gap-2 transition-all ${
                      allVerified ? 'bg-indigo-50/40 border-indigo-100' : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}>
                      <input type="checkbox" id="manual-confirm"
                        disabled={!isEditing || !allVerified}
                        checked={manualConfirmed && allVerified}
                        onChange={e => setManualConfirmed(e.target.checked)}
                        className={`rounded w-4 h-4 ${allVerified ? 'text-indigo-600 cursor-pointer' : 'text-slate-400 cursor-not-allowed'}`} />
                      <label htmlFor="manual-confirm"
                        className={`text-xs font-semibold select-none ${
                          allVerified ? 'text-indigo-900 cursor-pointer' : 'text-slate-400 cursor-not-allowed'
                        }`}>
                        Tôi đã đối chiếu thủ công từng trường và xác nhận khớp với ảnh tài liệu
                      </label>
                    </div>
                    {!allVerified && isEditing && (
                      <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 p-2 rounded-md flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span><strong>⚠️ Yêu cầu đối chiếu:</strong> Tích xanh ✓ vào tất cả 5 trường KH và 5 trường Cục thuế trước khi phê duyệt.</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* ── Divider + Section B: Cục Thuế ── */}
            <div className="border-t border-slate-100 mx-3" />
            <div className="pb-4">
              {/* Sub-header */}
              <div className="px-4 py-2 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">🏛 Cục Thuế quản lý</span>
                  {selectedTaxOffice && (
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                      {selectedTaxOffice.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Always-visible quick-search */}
                  {selectedTaxOffice?.websiteUrl && (
                    <a href={selectedTaxOffice.websiteUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[9px] font-semibold text-slate-600 border border-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-700 px-2 py-0.5 rounded-md transition-all">
                      <Search className="w-2.5 h-2.5" /> NTA
                    </a>
                  )}
                  {selectedTaxOffice?.mapUrl && (
                    <a href={(selectedTaxOffice as any).mapUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[9px] font-semibold text-slate-600 border border-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-700 px-2 py-0.5 rounded-md transition-all">
                      <MapPin className="w-2.5 h-2.5" /> Bản đồ
                    </a>
                  )}
                  <button type="button" onClick={() => handleNtaSearch(watch('postalCode'))}
                    className="flex items-center gap-1 text-[9px] font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 px-2 py-0.5 rounded-md transition-all">
                    <Search className="w-2.5 h-2.5" /> Tra cứu ZIP
                  </button>
                  {/* View toggle */}
                  {(['card', 'form', 'diff'] as const).map(panel => (
                    <button key={panel} type="button" onClick={() => setTaxPanel(panel)}
                      className={`px-2 py-1 text-[9px] font-bold rounded transition-all ${
                        taxPanel === panel ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                      }`}>
                      {panel === 'card' ? '📋 Chi tiết' : panel === 'form' ? '✏️ Sửa' : '⚡ Đối chiếu'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tax content */}
              <div className="px-1">
                {taxPanel === 'card' && (
                  <TaxOfficeCard
                    taxOffice={selectedTaxOffice}
                    isEditing={isEditing}
                    onEdit={() => setTaxPanel('form')}
                    onDiff={() => setTaxPanel('diff')}
                    className="border-0 rounded-none shadow-none"
                  />
                )}
                {taxPanel === 'form' && (
                  <div className="p-3">
                    <TaxOfficeForm
                      initialData={selectedTaxOffice ?? undefined}
                      onSubmit={handleTaxFormSubmit}
                      onCancel={() => setTaxPanel('card')}
                      isSubmitting={taxFormSaving}
                      className="border-0 shadow-none p-0"
                    />
                  </div>
                )}
                {taxPanel === 'diff' && (
                  <TaxOfficeDiffPanel
                    dbData={selectedTaxOffice ?? { id: '', name: '', postalCode: '', address: '' }}
                    postalCode={watch('postalCode') as string | undefined}
                    onSyncFields={handleTaxSyncFields}
                    onClose={() => setTaxPanel('card')}
                    className="border-0 rounded-none shadow-none"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            PANEL 3 – col-span-3 – Client info + WorkflowPanel + Dates/Finance
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="col-span-1 md:col-span-3 flex flex-col h-full bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden min-h-0">

          {/* Client identity strip */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/30 flex gap-2.5 shrink-0 items-center">
            <div className="w-14 h-9 border border-slate-200 rounded overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 relative group">
              {watch('zairyuFrontUrl') ? (
                <><img src={watch('zairyuFrontUrl') || undefined} alt="Zairyu" className="w-full h-full object-contain" />
                  <button type="button" onClick={() => setLightboxUrl(watch('zairyuFrontUrl') || null)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white">
                    <ZoomIn className="w-3 h-3" />
                  </button></>
              ) : <span className="text-[8px] text-slate-400 text-center px-0.5 font-medium leading-tight">No Img</span>}
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-900 truncate">{watch('fullName') || 'N/A'}</span>
                <span className="font-mono text-[9px] text-slate-400 bg-slate-100 px-1 rounded shrink-0">#{watch('code') || '---'}</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5 flex gap-2 flex-wrap">
                <span>NS: {watch('dob') ? new Date(watch('dob') as string).toLocaleDateString('vi-VN') : '---'}</span>
                <span>QT: {watch('nationality') || '---'}</span>
              </div>
            </div>
          </div>

          {/* WorkflowPanel */}
          <div className="px-3 pt-2 shrink-0">
            <WorkflowPanel
              status={(watch('status') || 'DRAFT') as WorkflowStatus}
              isEditing={isEditing}
              onChange={val => setValue('status', val as any, { shouldDirty: true })}
              dates={{
                sent1st:     watch('sent1stDate')     as string | undefined,
                received1st: watch('received1stDate') as string | undefined,
                sent2nd:     watch('sent2ndDate')     as string | undefined,
                received2nd: watch('received2ndDate') as string | undefined,
              }}
            />
          </div>

          {/* Tabs: Dates | Finance */}
          <div className="px-3 pt-2 shrink-0">
            <div className="flex gap-1 border-b border-slate-100">
              {(['dates', 'finance'] as const).map(tab => (
                <button key={tab} type="button" onClick={() => setPanel3aTab(tab)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-t-md transition-all border-b-2 -mb-px ${
                    panel3aTab === tab
                      ? 'border-indigo-500 text-indigo-700 bg-indigo-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}>
                  {tab === 'dates' ? '📅 Mốc ngày' : '💰 Tài chính'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 pt-2 min-h-0">
            {panel3aTab === 'dates' && (
              <div className="grid grid-cols-2 gap-1.5">
                <FormField label="Nộp Lần 1"><Input type="date" {...register('sent1stDate')} disabled={!isEditing} size="sm" /></FormField>
                <FormField label="Nhận Lần 1"><Input type="date" {...register('received1stDate')} disabled={!isEditing} size="sm" /></FormField>
                <FormField label="Nộp Lần 2"><Input type="date" {...register('sent2ndDate')} disabled={!isEditing} size="sm" /></FormField>
                <FormField label="Nhận Lần 2"><Input type="date" {...register('received2ndDate')} disabled={!isEditing} size="sm" /></FormField>
              </div>
            )}
            {panel3aTab === 'finance' && (
              <div className="space-y-2">
                <div className="flex justify-end">
                  {isEditing && (
                    <Button type="button" variant="secondary" size="xs"
                      onClick={() => {
                        const r1 = parseFloat(String(watch('received1stJpy') || 0));
                        const r2 = parseFloat(String(watch('received2ndJpy') || 0));
                        const rate = parseFloat(String(watch('exchangeRate') || 165));
                        const feeJpy = (r1 + r2) * 0.2;
                        setValue('serviceFeeJpy', feeJpy);
                        setValue('serviceFeeVnd', feeJpy * rate);
                        if (!watch('exchangeRate')) setValue('exchangeRate', rate);
                        toast.success('Đã tính phí dịch vụ (20%)');
                      }}>Tính phí (20%)</Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <FormField label="Dự kiến"><Input type="number" {...register('totalExpectedJpy')} disabled={!isEditing} size="sm" suffix="JPY" /></FormField>
                  <FormField label="Tỷ giá"><Input type="number" step="0.01" {...register('exchangeRate')} disabled={!isEditing} size="sm" suffix="VND" /></FormField>
                  <FormField label="Nhận L1"><Input type="number" {...register('received1stJpy')} disabled={!isEditing} size="sm" prefix="¥" /></FormField>
                  <FormField label="Nhận L2"><Input type="number" {...register('received2ndJpy')} disabled={!isEditing} size="sm" prefix="¥" /></FormField>
                  <FormField label="Phí DV"><Input type="number" {...register('serviceFeeJpy')} disabled={!isEditing} size="sm" prefix="¥" className="bg-blue-50/30" /></FormField>
                  <FormField label="Phí (VND)"><Input type="number" {...register('serviceFeeVnd')} disabled={!isEditing} size="sm" suffix="₫" className="bg-emerald-50/30" /></FormField>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full p-2" onClick={() => setLightboxUrl(null)}>
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Crop modal */}
      {cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onClose={() => {
            if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
            setCropImageSrc(null); setCropFile(null); setCropDocKey(''); setCropUrlField('');
          }}
        />
      )}
    </form>
  );

  async function runOcrExtract(imageUrl: string) {
    setOcrStatus(prev => ({ ...prev, [activeDoc]: 'processing' }));
    const toastId = toast.loading('Đang trích xuất AI...');
    try {
      const form = new FormData();
      form.append('imageUrl', imageUrl); form.append('documentType', activeDoc); form.append('action', 'extract');
      if (customerId) form.append('customerId', customerId);
      const res = await fetch('/api/ocr', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success && data.extractedData && !data.extractedData.error) {
        applyExtracted(activeDoc, data.extractedData);
        toast.success('Trích xuất AI thành công!', { id: toastId, description: 'Thông tin đã được điền vào form.' });
      } else {
        toast.error('AI không tìm thấy thông tin', { id: toastId, description: data.error || 'Vui lòng nhập thủ công.' });
      }
    } catch {
      toast.error('Lỗi kết nối OCR', { id: toastId, description: 'Đã xảy ra lỗi khi gọi API.' });
    } finally {
      setOcrStatus(prev => ({ ...prev, [activeDoc]: 'done' }));
    }
  }
}
