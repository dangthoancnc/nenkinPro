'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Loader2, X, UploadCloud, CheckCircle,
  AlertCircle, ZoomIn, Clock, Send, Wallet, Trash2, Sparkles,
  Printer, MapPin, Search, Crop, Download, Eye, ArrowRightLeft,
} from 'lucide-react';
import { TransferApplicationModal } from '@/components/applications/TransferApplicationModal';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workspaceSchema, WorkspaceFormValues } from '@/lib/validations/workspaceSchema';
import { calculateNenkinTax } from '@/lib/taxCalculator';
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
import { TaxRepresentativeCard } from '@/components/ui/TaxRepresentativeCard';
import type { TaxRepresentativeData } from '@/components/ui/TaxRepresentativeCard';
import { TaxRepresentativeForm } from '@/components/ui/TaxRepresentativeForm';
import type { TaxRepresentativeFormValues } from '@/components/ui/TaxRepresentativeForm';
import { toast } from 'sonner';
import { SettlementModal } from '@/components/SettlementModal';
import PrintModal from './print-modal';

const BASE_DOCUMENTS = [
  { key: 'zairyuFront',         title: 'Thẻ Ngoại Kiều (Trước)', urlField: 'zairyuFrontUrl'    },
  { key: 'zairyuBack',          title: 'Thẻ Ngoại Kiều (Sau)',   urlField: 'zairyuBackUrl'     },
  { key: 'passport',            title: 'Hộ chiếu',               urlField: 'passportUrl'       },
  { key: 'nenkinBook',          title: 'Sổ Nenkin',              urlField: 'nenkinBookUrl'     },
  { key: 'noticeOfEntitlement', title: 'Thông báo Lần 1',        urlField: 'noticeImageUrl'    },
  { key: 'departureStamp',      title: 'Dấu xuất cảnh',          urlField: 'departureStampUrl' },
  { key: 'vietnamContact',      title: 'Liên lạc VN & Ghi chú',  urlField: 'contactImageUrls'  },
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
  const [refundStage,       setRefundStage]       = useState<'lan1' | 'lan2'>('lan1');
  const [taxOffices,        setTaxOffices]        = useState<TaxOfficeData[]>([]);
  const [taxPanel,          setTaxPanel]          = useState<'card' | 'form' | 'diff'>('card');
  const [taxFormSaving,     setTaxFormSaving]     = useState(false);
  const [taxRepresentatives, setTaxRepresentatives] = useState<TaxRepresentativeData[]>([]);
  const [taxRepPanel,       setTaxRepPanel]       = useState<'card' | 'form'>('card');
  const [taxRepFormSaving,  setTaxRepFormSaving]  = useState(false);
  const [bottomLegalTab,    setBottomLegalTab]    = useState<'office' | 'rep'>('office');
  const [mobileTab,         setMobileTab]         = useState<'doc' | 'form' | 'progress' | 'tax'>('form');
  const [historyList,       setHistoryList]       = useState<any[]>([]);
  const [showSettlementModal, setShowSettlementModal] = useState<boolean>(false);
  const [assignedUser, setAssignedUser] = useState<{ id: string; name: string } | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);

  const toggleVerify = (field: string) =>
    setVerifiedFields(prev => ({ ...prev, [field]: !prev[field] }));

  const { register, handleSubmit, formState: { errors }, reset, setValue, getValues, watch, control } =
    useForm<WorkspaceFormValues>({
      mode: 'onBlur',
      resolver: zodResolver(workspaceSchema) as any,
      defaultValues: { status: 'DRAFT' },
    });

  // Tự động hủy tích xanh (unverify) ngay khi người dùng chỉnh sửa bất kỳ trường nào đã đối chiếu
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (!name) return;
      let verifyKey: string = String(name);
      if (verifyKey === 'taxOfficeId') {
        verifyKey = 'taxOffice';
      } else if (verifyKey === 'taxRepresentativeId') {
        verifyKey = 'taxRepresentative';
      } else if (verifyKey.startsWith('bankAccounts.')) {
        const parts = verifyKey.split('.');
        verifyKey = parts[parts.length - 1];
      }

      setVerifiedFields(prev => {
        if (prev[verifyKey]) {
          return { ...prev, [verifyKey]: false };
        }
        return prev;
      });
    });
    return () => subscription.unsubscribe();
  }, [watch]);

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
    return [BASE_DOCUMENTS[0], BASE_DOCUMENTS[1], BASE_DOCUMENTS[2], BASE_DOCUMENTS[3], ...bankDocs, BASE_DOCUMENTS[4], BASE_DOCUMENTS[5], BASE_DOCUMENTS[6]];
  }, [watch('bankAccounts')]);

  useEffect(() => {
    if (isNew) return;
    async function fetchData() {
      try {
        const res = await fetch(`/api/applications/${id}`);
        if (res.ok) {
          const data = await res.json();
          setCustomerId(data.customerId || null);
          setAssignedUser(data.assignedUser || null);
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
            serviceFeeJpy:               data.serviceFeeJpy               || '',
            exchangeRate:                data.exchangeRate                || '',
            serviceFeeVnd:               data.serviceFeeVnd               || '',
            noticeDate:                  formatDate(data.noticeDate),
            noticeImageUrl:              data.noticeImageUrl              || '',
            withheldTax:                 data.withheldTax                 || '',
            coverageMonths:              data.coverageMonths              || '',
            lastCoverageMonth:           data.lastCoverageMonth           || '',
            paymentsMultiplier:          data.paymentsMultiplier          || '',
            averageStandardRemuneration: data.averageStandardRemuneration || '',
            lumpSumWithdrawalNumber:     data.lumpSumWithdrawalNumber     || '',
            revisionNote:                data.revisionNote                || '',
          };
          
          const totalExpectedJpy = data.totalExpectedJpy ? Number(data.totalExpectedJpy) : 0;
          const coverageMonths = data.coverageMonths ? Number(data.coverageMonths) : undefined;
          const withheldTaxVal = data.withheldTax ? Number(data.withheldTax) : undefined;
          
          const taxResult = calculateNenkinTax({
            totalExpectedJpy,
            coverageMonths,
            withheldTax: withheldTaxVal,
          });

          formValues.tokureiTekio              = data.tokureiTekio || '1 7 1';
          formValues.tokureiShohoMark          = data.tokureiShohoMark ?? true;
          formValues.calculatedTax             = data.calculatedTax             ?? (taxResult.calculatedTax ?? '');
          formValues.calculatedTax93           = data.calculatedTax93           ?? (taxResult.calculatedTax ?? '');
          formValues.totalGeneralTax           = data.totalGeneralTax           ?? '0';
          formValues.taxableRetirementIncome   = data.taxableRetirementIncome   ?? (taxResult.taxableRetirementIncome ?? '');
          formValues.retirementDeductionAmount = data.retirementDeductionAmount ?? (taxResult.retirementDeductionAmount ?? '');

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
    if (!isNew && id) {
      fetch(`/api/applications/${id}/history`)
        .then(r => r.json())
        .then(d => { if (d.success && Array.isArray(d.data)) setHistoryList(d.data); })
        .catch(console.error);
    }
    fetch('/api/tax-offices')
      .then(r => r.json())
      .then(d => { if (d.success) setTaxOffices(d.data as TaxOfficeData[]); })
      .catch(console.error);
    fetch('/api/tax-representatives')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          setTaxRepresentatives(d.data as TaxRepresentativeData[]);
        }
      })
      .catch(console.error);
  }, [id, isNew, reset]);

  const selectedTaxOfficeId = watch('taxOfficeId');
  const selectedTaxOffice   = taxOffices.find(t => t.id === selectedTaxOfficeId) ?? null;

  const selectedTaxRepresentativeId = watch('taxRepresentativeId');
  const selectedTaxRepresentative   = taxRepresentatives.find(t => t.id === selectedTaxRepresentativeId) ?? taxRepresentatives[0] ?? null;

  const handleTaxRepFormSubmit = useCallback(async (values: TaxRepresentativeFormValues, repId?: string) => {
    setTaxRepFormSaving(true);
    const isUpdate = !!repId;
    const url      = isUpdate ? `/api/tax-representatives/${repId}` : '/api/tax-representatives';
    const method   = isUpdate ? 'PUT' : 'POST';
    const tid      = toast.loading(isUpdate ? 'Cập nhật Người đại diện...' : 'Tạo mới Người đại diện...');
    try {
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi lưu');
      setTaxRepresentatives(prev => {
        const exists = prev.findIndex(t => t.id === data.data.id);
        if (exists >= 0) { const next = [...prev]; next[exists] = data.data; return next; }
        return [data.data, ...prev];
      });
      setValue('taxRepresentativeId', data.data.id, { shouldDirty: true });
      setVerifiedFields(prev => ({ ...prev, taxRepresentative: false }));
      toast.success(isUpdate ? `Đã cập nhật: ${data.data.fullName}` : `Đã tạo mới: ${data.data.fullName}`, { id: tid });
      setTaxRepPanel('card');
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message, { id: tid });
    } finally {
      setTaxRepFormSaving(false);
    }
  }, [setValue]);

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
      setVerifiedFields(prev => ({ ...prev, taxOffice: false }));
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
    setVerifiedFields(prev => ({ ...prev, taxOffice: false }));
  }, [selectedTaxOffice]);

  const onSubmit = async (data: WorkspaceFormValues) => {
    setSaving(true);
    const toastId = toast.loading(isNew ? 'Đang tạo hồ sơ mới...' : 'Đang lưu hồ sơ...');
    try {
      const customerPayload = {
        fullName: data.fullName, dob: data.dob ? new Date(data.dob).toISOString() : undefined,
        nationality: data.nationality, myNumber: data.myNumber,
        passportNumber: data.passportNumber,
        occupation: data.occupation,
        headOfHouseholdName: data.headOfHouseholdName,
        relationshipToHead: data.relationshipToHead,
        zairyuAddress: data.zairyuAddress, cardNumber: data.cardNumber,
        nenkinNumber: data.nenkinNumber, nenkinKatakanaName: data.nenkinKatakanaName,
        postalCode: data.postalCode, taxOfficeId: data.taxOfficeId,
        bankAccounts: data.bankAccounts,
        zairyuFrontUrl: data.zairyuFrontUrl, zairyuBackUrl: data.zairyuBackUrl,
        passportUrl: data.passportUrl, nenkinBookUrl: data.nenkinBookUrl,
        departureStampUrl: data.departureStampUrl,
        status: manualConfirmed ? 'VERIFIED' : 'PENDING',
        sex: data.sex, phone: data.phone,
        overseasAddress: data.overseasAddress,
        zaloContact: data.zaloContact, facebookContact: data.facebookContact,
        contactImageUrls: data.contactImageUrls || [],
        passportIssueDate:  data.passportIssueDate  ? new Date(data.passportIssueDate).toISOString()  : null,
        passportExpiryDate: data.passportExpiryDate ? new Date(data.passportExpiryDate).toISOString() : null,
        departureDate:      data.departureDate      ? new Date(data.departureDate).toISOString()      : null,
      };
      const applicationPayload = {
        status: data.status,
        taxRepresentativeId: data.taxRepresentativeId || null,
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
        noticeDate:       data.noticeDate       ? new Date(data.noticeDate).toISOString()     : null,
        noticeImageUrl:   data.noticeImageUrl   || null,
        withheldTax:      data.withheldTax      ? parseFloat(String(data.withheldTax))      : null,
        coverageMonths:   data.coverageMonths   ? parseInt(String(data.coverageMonths), 10)  : null,
        lastCoverageMonth: data.lastCoverageMonth || null,
        paymentsMultiplier: data.paymentsMultiplier ? parseFloat(String(data.paymentsMultiplier)) : null,
        averageStandardRemuneration: data.averageStandardRemuneration ? parseFloat(String(data.averageStandardRemuneration)) : null,
        lumpSumWithdrawalNumber: data.lumpSumWithdrawalNumber || null,
        revisionNote: data.revisionNote || null,
        tokureiTekio: data.tokureiTekio || null,
        tokureiShohoMark: data.tokureiShohoMark || false,
        calculatedTax: data.calculatedTax ? parseFloat(String(data.calculatedTax)) : null,
        calculatedTax93: data.calculatedTax93 ? parseFloat(String(data.calculatedTax93)) : null,
        totalGeneralTax: data.totalGeneralTax ? parseFloat(String(data.totalGeneralTax)) : null,
        taxableRetirementIncome: data.taxableRetirementIncome ? parseFloat(String(data.taxableRetirementIncome)) : null,
        retirementDeductionAmount: data.retirementDeductionAmount ? parseFloat(String(data.retirementDeductionAmount)) : null,
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
        if (!isNew) {
          if (urlField === 'noticeImageUrl') {
            await fetch(`/api/applications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noticeImageUrl: data.publicUrl }) });
          } else if (customerId) {
            await fetch(`/api/customers/${customerId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [urlField]: data.publicUrl }) });
          }
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

  const applyExtracted = (docKey: string, ext: any) => {
    if (docKey === 'zairyuFront' || docKey === 'zairyuBack') {
      if (ext.fullName)    setValue('fullName',       ext.fullName,    { shouldValidate: true, shouldDirty: true });
      if (ext.dob)         setValue('dob',             ext.dob,         { shouldValidate: true, shouldDirty: true });
      if (ext.nationality) setValue('nationality',     ext.nationality, { shouldDirty: true });
      if (ext.cardNumber)  setValue('cardNumber',      ext.cardNumber,  { shouldDirty: true });
      if (ext.address)     setValue('zairyuAddress',   ext.address,     { shouldDirty: true });
      if (ext.postalCode)  setValue('postalCode',      ext.postalCode,  { shouldDirty: true });

      // Requirement 1 & 2: Inform user about Zairyu Back address checking
      if (docKey === 'zairyuFront' && !watch('zairyuBackUrl')) {
        toast.info('Đã tra cứu Cục thuế theo địa chỉ Mặt trước', {
          description: 'Nếu khách hàng có đổi địa chỉ cư trú, vui lòng tải Mặt sau thẻ ngoại kiều để tự động cập nhật địa chỉ mới nhất.'
        });
      } else if (docKey === 'zairyuBack') {
        if (ext.address) {
          toast.success('Đã cập nhật địa chỉ cư trú mới nhất từ mặt sau thẻ!', {
            description: `${ext.address} (${ext.postalCode || ''})`
          });
        }
      }

      // Requirement 4: Auto-sync Tax Office & Mailing Center Address without extra clicks
      if (ext.taxOffice?.name) {
        fetch('/api/tax-offices', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(ext.taxOffice) 
        })
          .then(r => r.json())
          .then(tData => {
            if (tData.success && tData.data?.id) {
              setTaxOffices(prev => {
                const idx = prev.findIndex(t => t.id === tData.data.id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = tData.data;
                  return updated;
                }
                return [...prev, tData.data];
              });
              setValue('taxOfficeId', tData.data.id, { shouldDirty: true });
              setTaxPanel('card');
              toast.success('Đã tự động điền Cục thuế & Nơi nhận hồ sơ', {
                description: `${tData.data.name} · ${tData.data.mailingName || 'Đã khớp dữ liệu NTA'}`
              });
            }
          })
          .catch(console.error);
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
    } else if (docKey === 'noticeOfEntitlement' || docKey === 'noticeOfPayment') {
      if (ext.noticeDate)                  setValue('noticeDate',                  ext.noticeDate,                  { shouldDirty: true });
      if (ext.totalExpectedJpy)            setValue('totalExpectedJpy',            ext.totalExpectedJpy,            { shouldDirty: true });
      if (ext.withheldTax)                 setValue('withheldTax',                 ext.withheldTax,                 { shouldDirty: true });
      if (ext.received1stJpy)               setValue('received1stJpy',              ext.received1stJpy,              { shouldDirty: true });
      if (ext.coverageMonths)              setValue('coverageMonths',              parseInt(String(ext.coverageMonths), 10), { shouldDirty: true });
      if (ext.lumpSumWithdrawalNumber)     setValue('lumpSumWithdrawalNumber',     ext.lumpSumWithdrawalNumber,     { shouldDirty: true });
      if (ext.lastCoverageMonth)           setValue('lastCoverageMonth',           ext.lastCoverageMonth,           { shouldDirty: true });
      if (ext.paymentsMultiplier)          setValue('paymentsMultiplier',          ext.paymentsMultiplier,          { shouldDirty: true });
      if (ext.averageStandardRemuneration) setValue('averageStandardRemuneration', ext.averageStandardRemuneration, { shouldDirty: true });
      if (ext.tokureiTekio)                setValue('tokureiTekio',                ext.tokureiTekio,                { shouldDirty: true });
      if (ext.tokureiShohoMark !== undefined) setValue('tokureiShohoMark',         ext.tokureiShohoMark,            { shouldDirty: true });
      if (ext.calculatedTax)               setValue('calculatedTax',               ext.calculatedTax,               { shouldDirty: true });
      if (ext.calculatedTax93)             setValue('calculatedTax93',             ext.calculatedTax93,             { shouldDirty: true });
      if (ext.totalGeneralTax !== undefined) setValue('totalGeneralTax',           ext.totalGeneralTax,             { shouldDirty: true });
      if (ext.taxableRetirementIncome)     setValue('taxableRetirementIncome',     ext.taxableRetirementIncome,     { shouldDirty: true });
      if (ext.retirementDeductionAmount)   setValue('retirementDeductionAmount',   ext.retirementDeductionAmount,   { shouldDirty: true });
      setRefundStage('lan2');
      toast.success('Đã trích xuất Giấy thông báo Lần 1 thành công!', {
        description: `Tổng tiền: ¥${ext.totalExpectedJpy || 0} | Thuế bị giữ: ¥${ext.withheldTax || 0} | BH: ${ext.coverageMonths || 0} tháng`
      });
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
  const currentDocValue = watch(currentDocField as any);
  const isMultiUrl = activeDoc === 'vietnamContact';
  const currentDocUrl   = isMultiUrl ? undefined : (currentDocValue as string | undefined);
  const currentMultiUrls = isMultiUrl ? (currentDocValue as string[] || []) : [];
  const currentDocTitle = currentDoc?.title || '';
  const appStatus  = watch('status') as string || 'DRAFT';
  const statusCfg  = statusConfig[appStatus] ?? statusConfig['DRAFT'];
  const StatusIcon = statusCfg.icon;

  // ── SHARED PANEL STYLES (glassmorphism) ──
  const glassPanel = 'flex flex-col bg-white/85 backdrop-blur-md border border-slate-200/70 shadow-lg shadow-black/5 rounded-xl overflow-hidden max-w-full';
  const glassPanelHeader = 'px-3 pt-2.5 pb-2 border-b border-slate-100/80 shrink-0 bg-white/60 max-w-full overflow-hidden';

  // ─────────────────────────────────────────────
  // PANEL 1 — Tài liệu & Ảnh
  // ─────────────────────────────────────────────
  const panel1Node = (
    <div className={`${glassPanel} min-h-0 h-full min-w-0`}>
      {/* Tabs danh mục */}
      <div className={`${glassPanelHeader} min-w-0`}>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Danh mục tài liệu</div>
        <div className="relative min-w-0">
          <div className="flex overflow-x-auto sm:grid sm:grid-cols-3 gap-1.5 pb-1 sm:pb-0 scrollbar-none min-w-0">
            {dynamicDocuments.map(doc => {
              const isActive = activeDoc === doc.key;
              const val = watch(doc.urlField as any);
              const hasUrl = Array.isArray(val) ? val.length > 0 : !!val;
              return (
                <button key={doc.key} type="button" onClick={() => setActiveDoc(doc.key)}
                  className={`px-2 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap sm:whitespace-normal truncate shrink-0 sm:shrink ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white/70 border border-slate-200/80 text-slate-700 hover:bg-slate-50'
                  }`}>
                  {hasUrl && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-300' : 'bg-emerald-500'}`} />}
                  <span className="truncate">{doc.title}</span>
                </button>
              );
            })}
            {isEditing && (
              <button type="button"
                onClick={() => { const i = bankFields.length; appendBank({ purpose: 'BOTH', bankCountry: 'VIETNAM', bankPassbookUrls: [] }); setActiveDoc(`bankPassbook_${i}`); }}
                className="sm:col-span-3 px-2 py-1.5 text-xs font-bold border border-dashed border-indigo-300 rounded-lg text-indigo-600 bg-indigo-50/60 hover:bg-indigo-100 transition-all text-center whitespace-nowrap sm:whitespace-normal shrink-0 sm:shrink">
                ＋ Thêm Ngân hàng
              </button>
            )}
          </div>
          {/* Scroll fade indicator — mobile only */}
          <div className="sm:hidden absolute right-0 top-0 bottom-1 w-6 bg-gradient-to-l from-white/90 to-transparent pointer-events-none rounded-r-lg" />
        </div>
      </div>

      {/* Image viewer */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 p-2.5 bg-slate-100/40 max-w-full overflow-hidden">
        <div className="flex items-center justify-between mb-1 shrink-0">
          <span className="text-xs font-bold text-slate-800 truncate">{currentDocTitle}</span>
          {isMultiUrl ? (
            currentMultiUrls.length > 0 ? (
               <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0">✓ Đã tải {currentMultiUrls.length} ảnh</span>
            ) : (
               <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full shrink-0">○ Chưa có ảnh</span>
            )
          ) : currentDocUrl ? (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0">✓ Đã tải</span>
          ) : (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full shrink-0">○ Chưa có</span>
          )}
        </div>
        <div className="flex-1 rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200/60 flex items-center justify-center relative min-h-0 min-w-0 max-w-full">
          {isMultiUrl ? (
            <div className="w-full h-full p-2 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {currentMultiUrls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-sm aspect-video bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Screenshot ${idx+1}`} className="w-full h-full object-cover cursor-pointer" onClick={() => setLightboxUrl(url)} />
                    {isEditing && (
                      <button type="button" className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm hover:bg-red-600"
                        onClick={async () => {
                           const newUrls = [...currentMultiUrls];
                           newUrls.splice(idx, 1);
                           setValue(currentDocField as any, newUrls);
                           try {
                             await fetch('/api/storage/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
                             if (!isNew && customerId) {
                               await fetch(`/api/customers/${customerId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contactImageUrls: newUrls }) });
                             }
                             toast.success('Đã xóa ảnh');
                           } catch (err) { console.error(err); }
                        }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <label className="cursor-pointer border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors aspect-video min-h-[100px] bg-white/50">
                    <UploadCloud className="w-6 h-6 mb-1 text-indigo-400" />
                    <span className="text-[10px] font-bold">Thêm ảnh</span>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={async (e) => {
                       if (!e.target.files?.length) return;
                       const loadingId = toast.loading(`Đang tải lên ${e.target.files.length} ảnh...`);
                       try {
                         const newUrls = [...currentMultiUrls];
                         for(let i=0; i<e.target.files.length; i++) {
                           const file = e.target.files[i];
                           const fd = new FormData(); fd.append('file', file); fd.append('customerId', customerId || 'temp');
                           const res = await fetch('/api/storage/upload', { method: 'POST', body: fd });
                           if (res.ok) {
                             const { url } = await res.json();
                             newUrls.push(url);
                           }
                         }
                         setValue(currentDocField as any, newUrls);
                         if (!isNew && customerId) {
                           await fetch(`/api/customers/${customerId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contactImageUrls: newUrls }) });
                         }
                         toast.success('Tải ảnh thành công!', { id: loadingId });
                       } catch (err) {
                         console.error(err);
                         toast.error('Có lỗi xảy ra khi tải ảnh', { id: loadingId });
                       }
                    }} />
                  </label>
                )}
              </div>
            </div>
          ) : currentDocUrl ? (
            <div className="relative w-full h-full min-w-0 overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentDocUrl} alt={currentDocTitle} className="block w-full h-auto object-contain" />
              {/* ── Floating Toolbar — BOTTOM RIGHT ── */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl p-1 shadow-lg z-20">
                {isEditing && (
                  <>
                    <button type="button" title="Trích xuất AI"
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
                      }}
                      className="w-7 h-7 flex items-center justify-center text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button type="button" title="Cắt ảnh"
                      onClick={() => { if (currentDocUrl) { setCropDocKey(activeDoc); setCropUrlField(currentDocField); setCropImageSrc(currentDocUrl); } }}
                      className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                      <Crop className="w-4 h-4" />
                    </button>
                    <label className="cursor-pointer" title="Thay thế ảnh">
                      <span className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <UploadCloud className="w-4 h-4" />
                      </span>
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileSelect(e, activeDoc, currentDocField)} />
                    </label>
                    <button type="button" title="Xóa ảnh"
                      className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition-all"
                      onClick={() => toast(`Xóa ảnh ${currentDocTitle}?`, {
                        action: { label: 'Xóa', onClick: async () => {
                          const prev = getValues(currentDocField as any);
                          if (prev) fetch('/api/storage/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: prev }) }).catch(console.error);
                          setValue(currentDocField as any, '');
                          if (!isNew) {
                            if (currentDocField === 'noticeImageUrl') {
                              await fetch(`/api/applications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noticeImageUrl: '' }) });
                            } else if (customerId) {
                              await fetch(`/api/customers/${customerId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [currentDocField]: '' }) });
                            }
                          }
                          toast.success('Đã xóa ảnh tài liệu');
                        }},
                        cancel: { label: 'Hủy', onClick: () => {} }, duration: 8000,
                      })}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button type="button" title="Phóng to"
                  onClick={() => setLightboxUrl(currentDocUrl || null)}
                  className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : isEditing ? (
            <label
              className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full hover:bg-indigo-50/40 transition-all text-slate-400 hover:text-indigo-600 bg-white/50 border-2 border-dashed border-slate-200/80 hover:border-indigo-400 rounded-xl p-6"
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={e => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files?.length) handleFileSelect({ target: { files: e.dataTransfer.files } } as any, activeDoc, currentDocField); }}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <UploadCloud className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-slate-600 block">Nhấp hoặc kéo thả ảnh</span>
                <span className="text-[10px] text-slate-400">PNG, JPG, JPEG</span>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={e => handleFileSelect(e, activeDoc, currentDocField)} />
            </label>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 w-full h-full text-slate-300 bg-white/50 rounded-xl p-6">
              <UploadCloud className="w-6 h-6" />
              <span className="text-xs font-semibold text-slate-400 text-center">Chưa có ảnh<br/><span className="text-[10px] font-normal">Bật &quot;Sửa hồ sơ&quot; để tải lên</span></span>
            </div>
          )}
          {/* OCR Overlay */}
          {ocrStatus[activeDoc] === 'processing' && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-30 rounded-xl">
              <span className="text-xs text-indigo-600 font-bold flex items-center gap-1.5 bg-white border border-indigo-100 px-3 py-1.5 rounded-full shadow-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang quét OCR...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // PANEL 2 — Form nhập liệu
  // ─────────────────────────────────────────────
  const panel2Node = (
    <div className={`${glassPanel} min-h-0 h-full`}>
      <div className={glassPanelHeader}>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thông tin chi tiết nhập liệu</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {(() => {
          switch (activeDoc) {
            case 'zairyuFront':
            case 'zairyuBack': {
              const zFields = ['fullName','dob','cardNumber','zairyuAddress','postalCode'];
              const allVerified = zFields.every(f => verifiedFields[f]);
              return (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-indigo-600 border-b border-indigo-100 pb-1">THÔNG TIN THẺ NGOẠI KIỀU</div>
                  <div className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-[11px] font-bold ${
                    allVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <span className="flex items-center gap-1.5">
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
                    <FormField label="Quốc tịch">
                      <Input {...register('nationality')} disabled={!isEditing} size="md"
                        verified={verifiedFields['nationality']} showVerify onVerify={() => toggleVerify('nationality')} />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label="Số thẻ ngoại kiều">
                      <Input {...register('cardNumber')} disabled={!isEditing} size="md"
                        verified={verifiedFields['cardNumber']} showVerify onVerify={() => toggleVerify('cardNumber')}
                        state={verifiedFields['cardNumber'] ? 'verified' : 'default'} />
                    </FormField>
                    <FormField label="My Number">
                      <Input {...register('myNumber')} disabled={!isEditing} size="md"
                        verified={verifiedFields['myNumber']} showVerify onVerify={() => toggleVerify('myNumber')} />
                    </FormField>
                  </div>
                  <FormField label="Địa chỉ trên thẻ (Kanji)">
                    <Input {...register('zairyuAddress')} disabled={!isEditing} size="md"
                      verified={verifiedFields['zairyuAddress']} showVerify onVerify={() => toggleVerify('zairyuAddress')}
                      state={verifiedFields['zairyuAddress'] ? 'verified' : 'default'}
                      rightIcon={watch('zairyuAddress') ? (
                        <button type="button" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(watch('zairyuAddress')||'')}`, '_blank')} className="text-indigo-600 hover:text-indigo-800">
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                      ) : undefined} />
                  </FormField>
                    <FormField label="Mã Bưu Điện">
                      <Input {...register('postalCode')} disabled={!isEditing} size="md" placeholder="VD: 4530015"
                        verified={verifiedFields['postalCode']} showVerify onVerify={() => toggleVerify('postalCode')}
                        state={verifiedFields['postalCode'] ? 'verified' : 'default'}
                        rightIcon={
                          <button type="button" onClick={() => handleNtaSearch(watch('postalCode'))} className="text-indigo-600 hover:text-indigo-800">
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
                  <div className="text-xs font-bold text-indigo-600 border-b border-indigo-100 pb-1">THÔNG TIN HỘ CHIẾU</div>
                  <FormField label="Số hộ chiếu">
                    <Input {...register('passportNumber')} disabled={!isEditing} size="md" placeholder="VD: C1234567"
                      verified={verifiedFields['passportNumber']} showVerify onVerify={() => toggleVerify('passportNumber')} />
                  </FormField>
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
                    <FormField label="Quốc tịch">
                      <Input {...register('nationality')} disabled={!isEditing} size="md"
                        verified={verifiedFields['nationality']} showVerify onVerify={() => toggleVerify('nationality')} />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label="Giới tính">
                      <select {...register('sex')} disabled={!isEditing} className="h-8 rounded-lg border border-slate-200/80 px-2 text-xs bg-white/80 w-full">
                        <option value="">Chọn...</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </FormField>
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
                  <div className="text-xs font-bold text-indigo-600 border-b border-indigo-100 pb-1">THÔNG TIN SỔ NENKIN</div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label="Mã số Nenkin">
                      <Input {...register('nenkinNumber')} disabled={!isEditing} size="md"
                        verified={verifiedFields['nenkinNumber']} showVerify onVerify={() => toggleVerify('nenkinNumber')} />
                    </FormField>
                    <FormField label="Tên Katakana">
                      <Input {...register('nenkinKatakanaName')} disabled={!isEditing} size="md"
                        verified={verifiedFields['nenkinKatakanaName']} showVerify onVerify={() => toggleVerify('nenkinKatakanaName')} />
                    </FormField>
                  </div>
                </div>
              );

            case 'departureStamp':
              return (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-indigo-600 border-b border-indigo-100 pb-1">THÔNG TIN DẤU XUẤT CẢNH</div>
                  <FormField label="Ngày xuất cảnh Nhật Bản">
                    <Input type="date" {...register('departureDate')} disabled={!isEditing} size="md"
                      verified={verifiedFields['departureDate']} showVerify onVerify={() => toggleVerify('departureDate')} />
                  </FormField>
                </div>
              );

            case 'noticeOfEntitlement':
              return (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-purple-700 border-b border-purple-100 pb-1 flex items-center justify-between">
                    <span>📄 THÔNG BÁO KẾT QUẢ LẦN 1 (脱退一時金支給決定通知書)</span>
                    <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 font-semibold">Cơ sở làm Hoàn thuế Lần 2</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label="Ngày ra quyết định">
                      <Input type="date" {...register('noticeDate')} disabled={!isEditing} size="md"
                        verified={verifiedFields['noticeDate']} showVerify onVerify={() => toggleVerify('noticeDate')} />
                    </FormField>
                    <FormField label="Mã số thụ hưởng (整理番号)">
                      <Input {...register('lumpSumWithdrawalNumber')} disabled={!isEditing} size="md" placeholder="VD: 42650954055050"
                        verified={verifiedFields['lumpSumWithdrawalNumber']} showVerify onVerify={() => toggleVerify('lumpSumWithdrawalNumber')} />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <FormField label="Tổng tiền (支給額)">
                      <Input type="number" {...register('totalExpectedJpy')} disabled={!isEditing} size="md" prefix="¥" className="font-bold text-slate-800"
                        verified={verifiedFields['totalExpectedJpy']} showVerify onVerify={() => toggleVerify('totalExpectedJpy')} />
                    </FormField>
                    <FormField label="Thuế 20.42% (所得税)">
                      <Input type="number" {...register('withheldTax')} disabled={!isEditing} size="md" prefix="¥" className="font-bold text-amber-700 bg-amber-50/60"
                        verified={verifiedFields['withheldTax']} showVerify onVerify={() => toggleVerify('withheldTax')} />
                    </FormField>
                    <FormField label="Thực nhận L1 (支払額)">
                      <Input type="number" {...register('received1stJpy')} disabled={!isEditing} size="md" prefix="¥" className="font-bold text-indigo-700"
                        verified={verifiedFields['received1stJpy']} showVerify onVerify={() => toggleVerify('received1stJpy')} />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <FormField label="Số tháng BH (被保険者期間)">
                      <Input type="number" {...register('coverageMonths')} disabled={!isEditing} size="md" suffix="tháng" placeholder="VD: 33" />
                    </FormField>
                    <FormField label="Tháng đóng cuối (最終月)">
                      <Input {...register('lastCoverageMonth')} disabled={!isEditing} size="md" placeholder="VD: 2025-11" />
                    </FormField>
                    <FormField label="Hệ số thanh toán (支給率)">
                      <Input step="0.1" {...register('paymentsMultiplier')} disabled={!isEditing} size="md" placeholder="VD: 2.7" />
                    </FormField>
                  </div>
                  <FormField label="Lương bình quân tháng (平均標準報酬額)">
                    <Input type="number" {...register('averageStandardRemuneration')} disabled={!isEditing} size="md" prefix="¥" placeholder="VD: 226970" />
                  </FormField>

                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-teal-700 border-b border-teal-100 pb-1 mb-2 flex items-center justify-between">
                      <span>📑 TÙY CHỈNH THUẾ BẢNG 3 LẦN 2 (確定申告書 第三表)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <FormField label="Điều khoản áp dụng (特例適用)">
                        <Input {...register('tokureiTekio')} disabled={!isEditing} size="md" placeholder="VD: 1 7 1" />
                      </FormField>
                      <FormField label="Khoanh chọn 所法">
                        <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                          <input type="checkbox" {...register('tokureiShohoMark')} disabled={!isEditing} className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500" />
                          <span className="text-xs font-medium text-slate-700">Áp dụng 所法</span>
                        </label>
                      </FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <FormField label="Thu nhập chịu thuế (Ô 76)">
                        <Input type="number" {...register('taxableRetirementIncome')} disabled={!isEditing} size="md" prefix="¥" placeholder="Tự động tính nếu trống" />
                      </FormField>
                      <FormField label="Miễn giảm thu nhập (退職所得控除額)">
                        <Input type="number" {...register('retirementDeductionAmount')} disabled={!isEditing} size="md" prefix="¥" placeholder="Tự động tính nếu trống" />
                      </FormField>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <FormField label="Thuế tính (Ô 92 / 49)">
                        <Input type="number" {...register('calculatedTax')} disabled={!isEditing} size="md" prefix="¥" placeholder="Tự động" />
                      </FormField>
                      <FormField label="Thuế tính (Ô 93)">
                        <Input type="number" {...register('calculatedTax93')} disabled={!isEditing} size="md" prefix="¥" placeholder="Mặc định = Ô 92" />
                      </FormField>
                      <FormField label="Tổng thuế (Ô 12)">
                        <Input type="number" {...register('totalGeneralTax')} disabled={!isEditing} size="md" prefix="¥" placeholder="VD: 0" />
                      </FormField>
                    </div>
                  </div>
                </div>
              );

            case 'vietnamContact':
              return (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-teal-700 border-b border-teal-100 pb-1 flex items-center justify-between">
                    <span>🇻🇳 LIÊN LẠC VIỆT NAM & GHI CHÚ</span>
                  </div>
                  <FormField label="Địa chỉ tại Việt Nam">
                    <Input {...register('overseasAddress')} disabled={!isEditing} size="md" placeholder="VD: 123 Nguyễn Trãi, Thanh Xuân, Hà Nội" />
                  </FormField>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label="Điện thoại (VN/Nhật)">
                      <Input {...register('phone')} disabled={!isEditing} size="md" />
                    </FormField>
                    <FormField label="Zalo Contact">
                      <Input {...register('zaloContact')} disabled={!isEditing} size="md" />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label="Facebook Contact">
                      <Input {...register('facebookContact')} disabled={!isEditing} size="md" />
                    </FormField>
                    <FormField label="Ghi chú trao đổi">
                      <textarea {...register('revisionNote')} disabled={!isEditing} className="w-full text-xs rounded-lg border border-slate-200/80 px-2.5 py-1.5 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 min-h-[100px] bg-white/80" placeholder="Lịch sử dặn dò, trao đổi..." />
                    </FormField>
                  </div>
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
                  <div className="text-xs font-bold text-indigo-600 border-b border-indigo-100 pb-1">THÔNG TIN NGÂN HÀNG ({purposeLabel})</div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label="Quốc gia">
                      <select {...register(`bankAccounts.${idx}.bankCountry` as const)} disabled={!isEditing} className="h-8 rounded-lg border border-slate-200/80 px-2 text-xs bg-white/80 w-full">
                        <option value="JAPAN">Nhật Bản</option>
                        <option value="VIETNAM">Việt Nam</option>
                      </select>
                    </FormField>
                    <FormField label="Mục đích">
                      <select {...register(`bankAccounts.${idx}.purpose` as const)} disabled={!isEditing} className="h-8 rounded-lg border border-slate-200/80 px-2 text-xs bg-white/80 w-full">
                        <option value="BOTH">Chung cả 2 lần</option>
                        <option value="FIRST_REFUND">Lần 1 (Tiền Nhật)</option>
                        <option value="SECOND_REFUND">Lần 2 (Tiền Việt)</option>
                      </select>
                    </FormField>
                  </div>
                  {watch(`bankAccounts.${idx}.bankCountry`) === 'JAPAN' && (
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                      <FormField label="Hình thức tổ chức">
                        <select
                          {...register(`bankAccounts.${idx}.isYucho` as const, {
                            setValueAs: v => v === true || v === 'true'
                          })}
                          disabled={!isEditing}
                          className="h-8 rounded-lg border border-slate-200/80 px-2 text-xs bg-white w-full font-medium"
                        >
                          <option value="false">🏦 Ngân hàng thường (銀行)</option>
                          <option value="true">📮 Bưu điện (ゆうちょ銀行 / 郵便局)</option>
                        </select>
                      </FormField>
                      {String(watch(`bankAccounts.${idx}.isYucho`)) !== 'true' ? (
                        <FormField label="Loại tài khoản (預金種目)">
                          <select
                            {...register(`bankAccounts.${idx}.bankAccountType` as const)}
                            disabled={!isEditing}
                            className="h-8 rounded-lg border border-slate-200/80 px-2 text-xs bg-white w-full"
                          >
                            <option value="ORDINARY">普通 (Thường - 1)</option>
                            <option value="CURRENT">当座 (Tiết kiệm/Vãng lai - 2)</option>
                          </select>
                        </FormField>
                      ) : (
                        <div className="text-[11px] text-amber-700 flex items-center font-medium">
                          Tờ khai nhận: 郵便局名など
                        </div>
                      )}
                    </div>
                  )}

                  <FormField label={String(watch(`bankAccounts.${idx}.isYucho`)) === 'true' ? "Tên tổ chức (VD: ゆうちょ銀行)" : "Tên ngân hàng"}>
                    <BankAutocomplete index={idx} disabled={!isEditing} register={register} setValue={setValue} watch={watch} />
                  </FormField>

                  {String(watch(`bankAccounts.${idx}.isYucho`)) === 'true' ? (
                    <div className="grid grid-cols-3 gap-2">
                      <FormField label="郵便局名など (Chi nhánh/Tiệm)">
                        <Input {...register(`bankAccounts.${idx}.branchName` as const)} disabled={!isEditing} size="md" placeholder="VD: 〇一八店"
                          verified={verifiedFields['branchName']} showVerify onVerify={() => toggleVerify('branchName')} />
                      </FormField>
                      <FormField label="記号 (Ký hiệu 5 số)">
                        <Input {...register(`bankAccounts.${idx}.yuchoKigo` as const)} disabled={!isEditing} size="md" placeholder="VD: 10120"
                          verified={verifiedFields['yuchoKigo']} showVerify onVerify={() => toggleVerify('yuchoKigo')} />
                      </FormField>
                      <FormField label="番号 (Số hiệu 7-8 số)">
                        <Input {...register(`bankAccounts.${idx}.yuchoBango` as const)} disabled={!isEditing} size="md" placeholder="VD: 1234567"
                          verified={verifiedFields['yuchoBango']} showVerify onVerify={() => toggleVerify('yuchoBango')} />
                      </FormField>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <FormField label="Chi nhánh">
                        <Input {...register(`bankAccounts.${idx}.branchName` as const)} disabled={!isEditing} size="md"
                          verified={verifiedFields['branchName']} showVerify onVerify={() => toggleVerify('branchName')} />
                      </FormField>
                      <FormField label="Số tài khoản (7 số)">
                        <Input {...register(`bankAccounts.${idx}.accountNumber` as const)} disabled={!isEditing} size="md"
                          verified={verifiedFields['accountNumber']} showVerify onVerify={() => toggleVerify('accountNumber')} />
                      </FormField>
                    </div>
                  )}

                  <FormField label="Địa chỉ chi nhánh (Eng)">
                    <Input {...register(`bankAccounts.${idx}.bankBranchAddress` as const)} disabled={!isEditing} size="md"
                      verified={verifiedFields['bankBranchAddress']} showVerify onVerify={() => toggleVerify('bankBranchAddress')} />
                  </FormField>
                  <FormField label="Chủ tài khoản (Romaji)">
                    <Input {...register(`bankAccounts.${idx}.accountName` as const)} disabled={!isEditing} size="md" className="uppercase"
                      verified={verifiedFields['accountName']} showVerify onVerify={() => toggleVerify('accountName')} />
                  </FormField>
                  {watch(`bankAccounts.${idx}.bankCountry`) === 'JAPAN' && (
                    <FormField label="Chủ TK (Katakana)">
                      <Input {...register(`bankAccounts.${idx}.accountNameKatakana` as const)} disabled={!isEditing} size="md"
                        verified={verifiedFields['accountNameKatakana']} showVerify onVerify={() => toggleVerify('accountNameKatakana')} />
                    </FormField>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label="Swift Code">
                      <Input {...register(`bankAccounts.${idx}.swiftCode` as const)} disabled={!isEditing} size="md" className="uppercase font-mono font-bold"
                        verified={verifiedFields['swiftCode']} showVerify onVerify={() => toggleVerify('swiftCode')} placeholder="VD: BFTVVNVX" />
                    </FormField>
                  </div>
                  {isEditing && bankFields.length > 1 && (
                    <div className="pt-2 border-t border-slate-100">
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

        {/* Verify confirm */}
        {!isNew && (() => {
          const REQUIRED_VERIFY_ITEMS = [
            { key: 'fullName', label: 'Họ và tên' },
            { key: 'dob', label: 'Ngày sinh' },
            { key: 'nationality', label: 'Quốc tịch' },
            { key: 'cardNumber', label: 'Số thẻ ngoại kiều' },
            { key: 'zairyuAddress', label: 'Địa chỉ trên thẻ' },
            { key: 'postalCode', label: 'Mã Bưu Điện' },
            { key: 'taxOffice', label: 'Cục thuế quản lý' },
          ];
          const missingFields = REQUIRED_VERIFY_ITEMS.filter(item => !verifiedFields[item.key]);
          const isFullyVerified = missingFields.length === 0;

          // Auto-sync manualConfirmed state with verification result
          if (isFullyVerified !== manualConfirmed) {
            setManualConfirmed(isFullyVerified);
          }

          const handleBlockClick = () => {
            if (!isFullyVerified) {
              toast.warning(`Chưa thể xác nhận! Còn thiếu ${missingFields.length} mục chưa tích chọn: ${missingFields.map(f => f.label).join(', ')}`, {
                duration: 6000,
                description: 'Vui lòng kiểm tra và tích xanh (✓) từng trường dữ liệu hoặc Cục thuế quản lý trước khi tiếp tục.',
              });
            } else {
              toast.success('Đã đối chiếu thủ công đầy đủ 7/7 mục đạt chuẩn khớp tài liệu!');
            }
          };

          const scrollToField = (fieldKey: string) => {
            if (fieldKey === 'taxOffice') {
              const el = document.getElementById('tax-office-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-2', 'ring-indigo-400', 'bg-indigo-50/30');
                setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-400', 'bg-indigo-50/30'), 2500);
              }
              toast.info('Đã định vị đến Cục thuế quản lý. Hãy kiểm tra thông tin và tự bấm nút [✓ Tích chọn đối chiếu] để xác nhận.');
              return;
            }

            // Customer fields
            setActiveDoc('zairyuFront');
            setTimeout(() => {
              const inputEl = document.querySelector(`[name="${fieldKey}"]`) as HTMLElement | null;
              if (inputEl) {
                inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                inputEl.focus();
                const parent = inputEl.closest('.space-y-1') || inputEl.parentElement;
                if (parent) {
                  parent.classList.add('ring-2', 'ring-amber-400', 'bg-amber-50/60', 'rounded-lg');
                  setTimeout(() => parent.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-50/60', 'rounded-lg'), 2500);
                }
              }
              const item = REQUIRED_VERIFY_ITEMS.find(i => i.key === fieldKey);
              toast.info(`Đã định vị đến ô [${item?.label || fieldKey}]. Hãy kiểm tra ảnh và tự bấm nút [✓] bên cạnh.`);
            }, 120);
          };

          return (
            <div className="mt-4 space-y-2">
              <div
                onClick={handleBlockClick}
                className={`p-2.5 border rounded-lg flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
                  isFullyVerified
                    ? 'bg-emerald-50 border-emerald-300 shadow-2xs'
                    : 'bg-amber-50/80 border-amber-200 hover:bg-amber-100/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="manual-confirm"
                    readOnly
                    checked={isFullyVerified}
                    className={`rounded w-4 h-4 cursor-pointer ${
                      isFullyVerified ? 'text-emerald-600 focus:ring-emerald-500' : 'text-slate-300'
                    }`}
                  />
                  <label
                    htmlFor="manual-confirm"
                    className={`text-xs font-semibold leading-snug cursor-pointer ${
                      isFullyVerified ? 'text-emerald-950 font-bold' : 'text-slate-700'
                    }`}
                  >
                    {isFullyVerified
                      ? '✓ Đã hoàn tất đối chiếu thủ công từng trường và xác nhận khớp với ảnh tài liệu'
                      : 'Tôi đã đối chiếu thủ công từng trường và xác nhận khớp với ảnh tài liệu (Tự động kích hoạt khi tích đủ)'}
                  </label>
                </div>
                <div className="shrink-0 text-[11px] font-bold">
                  {isFullyVerified ? (
                    <span className="text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                      ✓ Đạt chuẩn 7/7
                    </span>
                  ) : (
                    <span className="text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                      Thiếu {missingFields.length}/7 mục
                    </span>
                  )}
                </div>
              </div>

              {!isFullyVerified && (
                <div className="text-[11px] text-amber-900 bg-amber-50/90 border border-amber-200 p-2.5 rounded-lg space-y-1.5 leading-snug">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Các trường bắt buộc đối chiếu ({missingFields.length} mục chưa tích - Nhấp để nhảy đến ô):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {REQUIRED_VERIFY_ITEMS.map(item => {
                      const isDone = !!verifiedFields[item.key];
                      return (
                        <span
                          key={item.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToField(item.key);
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 cursor-pointer transition-all ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50 shadow-2xs hover:scale-105'
                          }`}
                          title={`Nhấp để chuyển đến vị trí trường ${item.label}`}
                        >
                          {isDone ? '✓' : '✗'} {item.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // PANEL 3 — Mini Profile + Workflow + Tabs
  // ─────────────────────────────────────────────
  const panel3Node = (
    <div className={`${glassPanel} min-h-0 h-full`}>
      {/* Mini profile strip */}
      <div className="p-2.5 border-b border-slate-100/80 bg-white/50 flex items-center gap-2.5 shrink-0">
        <div className="w-12 h-9 border border-slate-200/80 rounded-lg overflow-hidden bg-slate-100/80 flex items-center justify-center shrink-0 relative group">
          {watch('zairyuFrontUrl') ? (
            <><img src={watch('zairyuFrontUrl') || undefined} alt="Zairyu" className="w-full h-full object-contain" />
              <button type="button" onClick={() => setLightboxUrl(watch('zairyuFrontUrl') || null)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white">
                <ZoomIn className="w-3 h-3" />
              </button></>
          ) : <span className="text-[8px] text-slate-400 text-center px-0.5 font-medium leading-tight">No Img</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-xs text-slate-900 truncate">{watch('fullName') || 'N/A'}</span>
              <span className="font-mono text-[9px] text-slate-500 bg-slate-100/80 px-1 rounded shrink-0">#{watch('code') || '---'}</span>
            </div>
            {!isNew && (
              <a
                href={`/customer/portal?id=${customerId || id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs"
                title="Mở giao diện Tra cứu Tiến độ mà Khách hàng nhìn thấy"
              >
                <Eye className="w-3 h-3 text-indigo-600" /> Xem góc nhìn Khách ↗
              </a>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            NS: {watch('dob') ? new Date(watch('dob') as string).toLocaleDateString('vi-VN') : '---'} &nbsp;|&nbsp; QT: {watch('nationality') || '---'}
          </div>
        </div>
      </div>

      {/* Workflow progress bar */}
      <div className="p-2.5 border-b border-slate-100/80 bg-white/40 shrink-0">
        <WorkflowPanel
          status={(watch('status') || 'DRAFT') as WorkflowStatus}
          isEditing={isEditing}
          onChange={val => {
            setValue('status', val as any, { shouldDirty: true });
          }}
          onAutoFillDate={(field, val) => {
            setValue(field as any, val, { shouldDirty: true });
            if (field === 'sent1stDate') setValue('status', 'SENT_1ST', { shouldDirty: true });
            else if (field === 'received1stDate') setValue('status', 'RECEIVED_1ST', { shouldDirty: true });
            else if (field === 'sent2ndDate') setValue('status', 'SENT_2ND', { shouldDirty: true });
            else if (field === 'received2ndDate') setValue('status', 'RECEIVED_2ND', { shouldDirty: true });
          }}
          dates={{
            sent1st:     watch('sent1stDate')     as string | undefined,
            received1st: watch('received1stDate') as string | undefined,
            sent2nd:     watch('sent2ndDate')     as string | undefined,
            received2nd: watch('received2ndDate') as string | undefined,
          }}
        />
      </div>

      {/* ── 2-Stage Chronological Switcher Bar ── */}
      <div className="p-2 border-b border-slate-100 bg-slate-50/80 shrink-0">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setRefundStage('lan1')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              refundStage === 'lan1'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${refundStage === 'lan1' ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
            🔵 LẦN 1: NỘP NENKIN (80%)
          </button>
          <button
            type="button"
            onClick={() => setRefundStage('lan2')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              refundStage === 'lan2'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${refundStage === 'lan2' ? 'bg-amber-300 animate-pulse' : 'bg-purple-400'}`} />
            🟣 LẦN 2: HOÀN THUẾ (20.42%)
          </button>
        </div>
      </div>

      {/* Tabs: Mốc ngày / Tài chính / Lịch sử */}
      <div className="px-3 pt-1.5 border-b border-slate-100/80 bg-white/40 flex gap-1 shrink-0">
        {(['dates', 'finance', 'history'] as const).map(tab => (
          <button key={tab} type="button" onClick={() => setPanel3aTab(tab as any)}
            className={`px-2 py-1 text-[11px] font-bold border-b-2 -mb-px transition-all ${
              panel3aTab === (tab as any)
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {tab === 'dates' ? '📅 Mốc ngày & Tiến độ' : tab === 'finance' ? '💰 Tài chính' : '📜 Lịch sử'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 min-h-0">
        {panel3aTab === 'dates' && (
          <div className="space-y-2.5">
            {refundStage === 'lan1' ? (
              // ── STAGE 1 DATES & PROGRESS ──
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 border border-blue-200 px-2 py-1 rounded-md flex items-center justify-between">
                  <span>🔵 Tiến độ Lần 1 (Xin 80% Thoát BH)</span>
                  <span className="font-semibold">{watch('received1stDate') ? '✓ Đã nhận' : watch('sent1stDate') ? '⏳ Đã gửi' : '○ Chuẩn bị'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <FormField label="Ngày viết đơn (In giấy)">
                    <Input type="date" value={watch('applyDate') || ''} onChange={e => setValue('applyDate', e.target.value, { shouldDirty: true })} disabled={!isEditing} size="sm" />
                  </FormField>
                  <FormField label="Ngày gửi L1 (Đi Nhật)">
                    <Input type="date" value={watch('sent1stDate') || ''} onChange={e => {
                      const val = e.target.value;
                      setValue('sent1stDate', val, { shouldDirty: true });
                      if (val && ['DRAFT', 'PENDING'].includes(watch('status') || '')) {
                        setValue('status', 'SENT_1ST', { shouldDirty: true });
                        toast.info('Đã tự động chuyển trạng thái: Đã gửi Lần 1');
                      }
                    }} disabled={!isEditing} size="sm" />
                  </FormField>
                  <FormField label="Ngày nhận L1 (Về TK)">
                    <Input type="date" value={watch('received1stDate') || ''} onChange={e => {
                      const val = e.target.value;
                      setValue('received1stDate', val, { shouldDirty: true });
                      const s1 = watch('sent1stDate');
                      if (val && s1 && new Date(val) < new Date(s1)) {
                        toast.warning('Ngày Nhận Lần 1 không thể nhỏ hơn Ngày Gửi Lần 1');
                      }
                      if (val && ['DRAFT', 'PENDING', 'SENT_1ST'].includes(watch('status') || '')) {
                        setValue('status', 'RECEIVED_1ST', { shouldDirty: true });
                        toast.info('Đã tự động chuyển trạng thái: Đã nhận Lần 1');
                      }
                    }} disabled={!isEditing} size="sm" />
                  </FormField>
                </div>
                {isEditing && (
                  <div className="pt-1 flex flex-wrap gap-1">
                    <button type="button" onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setValue('sent1stDate', today, { shouldDirty: true });
                      setValue('status', 'SENT_1ST', { shouldDirty: true });
                      toast.success('Đã ghi nhận gửi Lần 1 hôm nay!');
                    }} className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition-colors">
                      + Hôm nay gửi L1
                    </button>
                    <button type="button" onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setValue('received1stDate', today, { shouldDirty: true });
                      setValue('status', 'RECEIVED_1ST', { shouldDirty: true });
                      toast.success('Đã ghi nhận nhận tiền Lần 1 hôm nay!');
                    }} className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors">
                      + Hôm nay nhận L1
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // ── STAGE 2 DATES & PROGRESS ──
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 border border-purple-200 px-2 py-1 rounded-md flex items-center justify-between">
                  <span>🟣 Tiến độ Lần 2 (Xin 20.42% Thuế)</span>
                  <span className="font-semibold">{watch('received2ndDate') ? '✓ Đã hoàn thuế' : watch('sent2ndDate') ? '⏳ Đã nộp thuế' : '○ Chuẩn bị'}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <FormField label="Ngày gửi L2 (Tới Cục thuế)">
                    <Input type="date" value={watch('sent2ndDate') || ''} onChange={e => {
                      const val = e.target.value;
                      setValue('sent2ndDate', val, { shouldDirty: true });
                      const r1 = watch('received1stDate');
                      if (val && r1 && new Date(val) < new Date(r1)) {
                        toast.warning('Ngày Gửi Lần 2 không thể nhỏ hơn Ngày Nhận Lần 1');
                      }
                      if (val && ['DRAFT', 'PENDING', 'SENT_1ST', 'RECEIVED_1ST'].includes(watch('status') || '')) {
                        setValue('status', 'SENT_2ND', { shouldDirty: true });
                        toast.info('Đã tự động chuyển trạng thái: Đã gửi Lần 2');
                      }
                    }} disabled={!isEditing} size="sm" />
                  </FormField>
                  <FormField label="Ngày nhận L2 (Hoàn thuế)">
                    <Input type="date" value={watch('received2ndDate') || ''} onChange={e => {
                      const val = e.target.value;
                      setValue('received2ndDate', val, { shouldDirty: true });
                      const s2 = watch('sent2ndDate');
                      if (val && s2 && new Date(val) < new Date(s2)) {
                        toast.warning('Ngày Nhận Lần 2 không thể nhỏ hơn Ngày Gửi Lần 2');
                      }
                      if (val && ['DRAFT', 'PENDING', 'SENT_1ST', 'RECEIVED_1ST', 'SENT_2ND'].includes(watch('status') || '')) {
                        setValue('status', 'RECEIVED_2ND', { shouldDirty: true });
                        toast.info('Đã tự động chuyển trạng thái: Đã nhận Lần 2');
                      }
                    }} disabled={!isEditing} size="sm" />
                  </FormField>
                </div>
                {isEditing && (
                  <div className="pt-1 flex flex-wrap gap-1">
                    <button type="button" onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setValue('sent2ndDate', today, { shouldDirty: true });
                      setValue('status', 'SENT_2ND', { shouldDirty: true });
                      toast.success('Đã ghi nhận gửi Lần 2 hôm nay!');
                    }} className="px-2 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded border border-purple-200 transition-colors">
                      + Hôm nay gửi L2
                    </button>
                    <button type="button" onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setValue('received2ndDate', today, { shouldDirty: true });
                      setValue('status', 'RECEIVED_2ND', { shouldDirty: true });
                      toast.success('Đã ghi nhận nhận tiền Lần 2 hôm nay!');
                    }} className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors">
                      + Hôm nay Nhận L2
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {panel3aTab === 'finance' && (
          <div className="space-y-2">
            {refundStage === 'lan1' ? (
              // ── STAGE 1 FINANCE ──
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 border border-blue-200 px-2 py-1 rounded-md">
                  🔵 Tài chính Lần 1 (Tiền Thoát BH)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <FormField label="Dự kiến tổng"><Input type="number" {...register('totalExpectedJpy')} disabled={!isEditing} size="sm" suffix="JPY" /></FormField>
                  <FormField label="Thực nhận L1"><Input type="number" {...register('received1stJpy')} disabled={!isEditing} size="sm" prefix="¥" className="font-bold text-indigo-700" /></FormField>
                </div>
              </div>
            ) : (
              // ── STAGE 2 FINANCE ──
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 border border-purple-200 px-2 py-1 rounded-md">
                  🟣 Tài chính Lần 2 (Tiền Hoàn thuế 20.42%)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <FormField label="Thuế bị giữ (20.42%)">
                    <Input
                      type="number"
                      value={
                        watch('withheldTax')
                          ? String(watch('withheldTax'))
                          : watch('tax2ndJpy')
                          ? String(watch('tax2ndJpy'))
                          : watch('totalExpectedJpy')
                          ? String(Math.floor(parseFloat(String(watch('totalExpectedJpy'))) * 0.2042))
                          : watch('received1stJpy')
                          ? String(Math.floor(parseFloat(String(watch('received1stJpy'))) * 0.255))
                          : ''
                      }
                      disabled
                      size="sm"
                      prefix="¥"
                      className="bg-amber-50/70 font-semibold"
                    />
                  </FormField>
                  <FormField label="Thực nhận L2"><Input type="number" {...register('received2ndJpy')} disabled={!isEditing} size="sm" prefix="¥" className="font-bold text-purple-700" /></FormField>
                </div>
              </div>
            )}

            {isEditing && (
              <Button type="button" variant="secondary" size="xs" className="w-full mt-1"
                onClick={() => {
                  const r1 = parseFloat(String(watch('received1stJpy') || 0));
                  const r2 = parseFloat(String(watch('received2ndJpy') || 0));
                  const rate = parseFloat(String(watch('exchangeRate') || 165));
                  const feeJpy = (r1 + r2) * 0.2;
                  setValue('serviceFeeJpy', feeJpy);
                  setValue('serviceFeeVnd', feeJpy * rate);
                  if (!watch('exchangeRate')) setValue('exchangeRate', rate);
                  toast.success('Đã tính phí dịch vụ (20%)');
                }}>Tính phí dịch vụ tổng (20%)</Button>
            )}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
              <FormField label="Tỷ giá JPY/VND"><Input type="number" step="0.01" {...register('exchangeRate')} disabled={!isEditing} size="sm" suffix="VND" /></FormField>
              <FormField label="Phí (JPY)"><Input type="number" {...register('serviceFeeJpy')} disabled={!isEditing} size="sm" prefix="¥" className="bg-blue-50/60" /></FormField>
              <FormField label="Phí (VNĐ)"><Input type="number" {...register('serviceFeeVnd')} disabled={!isEditing} size="sm" suffix="₫" className="bg-emerald-50/60 font-semibold" /></FormField>
            </div>

            <Button
              type="button"
              variant="outline"
              size="xs"
              className="w-full mt-1.5 bg-indigo-50/70 border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-1.5"
              onClick={() => setShowSettlementModal(true)}
            >
              💬 Mẫu thông báo Quyết toán (Dành cho NV)
            </Button>
          </div>
        )}
        {(panel3aTab as any) === 'history' && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>📜 Nhật ký xử lý hồ sơ ({historyList.length})</span>
              <span className="text-[9px] text-slate-400 font-normal">Real-time</span>
            </div>
            <div className="border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 max-h-[160px] overflow-y-auto">
              {historyList.length === 0 ? (
                <div className="p-3 text-[11px] text-slate-400 text-center">Chưa có nhật ký ghi nhận</div>
              ) : (
                historyList.map((item: any) => (
                  <div key={item.id} className="p-2 text-[11px] text-slate-700 flex items-start justify-between gap-2 hover:bg-slate-50">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 text-[11px] truncate flex items-center gap-1">
                        <span className="px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[9px] font-mono border border-indigo-200 shrink-0">
                          {item.action || 'HÀNH ĐỘNG'}
                        </span>
                        <span>{item.description}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        Thực hiện bởi: <strong className="text-slate-600">{item.actorName || 'Hệ thống'}</strong>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 shrink-0 whitespace-nowrap">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // TAX OFFICE & TAX REPRESENTATIVE LEGAL PANEL
  // ─────────────────────────────────────────────
  const taxPanelNode = (
    <div id="tax-office-section" className={`${glassPanel} transition-all duration-300 overflow-hidden`}>
      {/* Top Legal Tab Switcher */}
      <div className="flex items-center gap-1 px-3 pt-1.5 bg-slate-100/70 border-b border-slate-200/80 shrink-0">
        <button
          type="button"
          onClick={() => setBottomLegalTab('office')}
          className={`px-3 py-1 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 border-t border-x ${
            bottomLegalTab === 'office'
              ? 'bg-white text-indigo-700 border-slate-200/90 shadow-2xs'
              : 'bg-transparent text-slate-500 hover:text-slate-700 border-transparent'
          }`}
        >
          <span>🏛 Cục Thuế quản lý</span>
          {verifiedFields['taxOffice'] && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setBottomLegalTab('rep')}
          className={`px-3 py-1 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 border-t border-x ${
            bottomLegalTab === 'rep'
              ? 'bg-white text-indigo-700 border-slate-200/90 shadow-2xs'
              : 'bg-transparent text-slate-500 hover:text-slate-700 border-transparent'
          }`}
        >
          <span>👤 Người Đại Diện Thuế & TK Nhật (Lần 2)</span>
          {verifiedFields['taxRepresentative'] && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {bottomLegalTab === 'office' ? (
        <>
          <div className="px-3.5 py-1.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 bg-white/50 border-b border-slate-100/80 shrink-0">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-0">
              <button
                type="button"
                onClick={() => {
                  toggleVerify('taxOffice');
                  if (!verifiedFields['taxOffice']) {
                    toast.success('Đã tích chọn đối chiếu Cục thuế quản lý ✓');
                  } else {
                    toast.info('Đã bỏ tích đối chiếu Cục thuế quản lý');
                  }
                }}
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 transition-all border cursor-pointer select-none shadow-2xs ${
                  verifiedFields['taxOffice']
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                    : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 animate-pulse'
                }`}
                title={verifiedFields['taxOffice'] ? 'Đã đối chiếu khớp Cục thuế ✓ (Bấm để hủy)' : 'Bấm để tích chọn đối chiếu Cục thuế'}
              >
                <CheckCircle className={`w-3.5 h-3.5 ${verifiedFields['taxOffice'] ? 'text-emerald-600' : 'text-amber-600'}`} />
                {verifiedFields['taxOffice'] ? '✓ Đã đối chiếu' : 'Tích chọn đối chiếu'}
              </button>
              {selectedTaxOffice && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50/80 border border-indigo-200 px-2 py-0.5 rounded-full truncate">
                    {selectedTaxOffice.name}
                  </span>
                </div>
              )}
              {isEditing && (
                <select
                  value={selectedTaxOfficeId || ''}
                  onChange={e => setValue('taxOfficeId', e.target.value, { shouldDirty: true })}
                  className="h-6 rounded-lg border border-slate-200/80 px-1.5 text-[11px] bg-white/80 max-w-[140px] focus:outline-none focus:border-indigo-400 font-semibold ml-1"
                >
                  <option value="">-- Đổi Cục thuế --</option>
                  {taxOffices.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
            </div>
            <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap shrink-0">
              <button type="button" onClick={() => handleNtaSearch(watch('postalCode'))}
                className="px-2 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200/80 bg-white/70 hover:bg-slate-50 rounded-lg transition-all">
                🔍 Tra cứu ZIP
              </button>
              {selectedTaxOffice?.websiteUrl && (
                <a href={selectedTaxOffice.websiteUrl} target="_blank" rel="noopener noreferrer"
                  className="px-2 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200/80 bg-white/70 hover:bg-slate-50 rounded-lg transition-all">
                  🔍 NTA
                </a>
              )}
              {(['card', 'form', 'diff'] as const).map(panel => (
                <button key={panel} type="button" onClick={() => setTaxPanel(panel)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    taxPanel === panel ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100/80'
                  }`}>
                  {panel === 'card' ? '📋 Chi tiết' : panel === 'form' ? '✏️ Sửa' : '⚡ Đối chiếu'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-1.5">
            {taxPanel === 'card' && (
              <TaxOfficeCard
                taxOffice={selectedTaxOffice}
                isEditing={isEditing}
                verified={!!verifiedFields['taxOffice']}
                onToggleVerify={() => toggleVerify('taxOffice')}
                onEdit={() => setTaxPanel('form')}
                onDiff={() => setTaxPanel('diff')}
                className="border-0 rounded-none shadow-none p-0"
              />
            )}
            {taxPanel === 'form' && (
              <div className="p-3">
                <TaxOfficeForm
                  initialData={selectedTaxOffice ?? undefined}
                  verified={!!verifiedFields['taxOffice']}
                  onToggleVerify={() => toggleVerify('taxOffice')}
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
                className="border-0 rounded-none shadow-none p-0"
              />
            )}
          </div>
        </>
      ) : (
        <>
          <div className="px-3.5 py-1.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 bg-white/50 border-b border-slate-100/80 shrink-0">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-0">
              <button
                type="button"
                onClick={() => {
                  toggleVerify('taxRepresentative');
                  if (!verifiedFields['taxRepresentative']) {
                    toast.success('Đã tích chọn đối chiếu Người đại diện thuế ✓');
                  } else {
                    toast.info('Đã bỏ tích đối chiếu Người đại diện thuế');
                  }
                }}
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 transition-all border cursor-pointer select-none shadow-2xs ${
                  verifiedFields['taxRepresentative']
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                    : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 animate-pulse'
                }`}
                title={verifiedFields['taxRepresentative'] ? 'Đã đối chiếu khớp Người đại diện ✓ (Bấm để hủy)' : 'Bấm để tích chọn đối chiếu Người đại diện'}
              >
                <CheckCircle className={`w-3.5 h-3.5 ${verifiedFields['taxRepresentative'] ? 'text-emerald-600' : 'text-amber-600'}`} />
                {verifiedFields['taxRepresentative'] ? '✓ Đã đối chiếu' : 'Tích chọn đối chiếu'}
              </button>
              {selectedTaxRepresentative && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50/80 border border-indigo-200 px-2 py-0.5 rounded-full truncate">
                    {selectedTaxRepresentative.fullName}
                  </span>
                </div>
              )}
              {isEditing && (
                <select
                  value={selectedTaxRepresentativeId || selectedTaxRepresentative?.id || ''}
                  onChange={e => setValue('taxRepresentativeId', e.target.value, { shouldDirty: true })}
                  className="h-6 rounded-lg border border-slate-200/80 px-1.5 text-[11px] bg-white/80 max-w-[170px] focus:outline-none focus:border-indigo-400 font-semibold ml-1"
                >
                  <option value="">-- Đổi Người đại diện --</option>
                  {taxRepresentatives.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.fullName} ({r.bankName || 'Chưa có NH'})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap shrink-0">
              <a
                href="/tax-representatives"
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200/80 bg-white/70 hover:bg-slate-50 rounded-lg transition-all"
                title="Mở trang Quản lý Danh mục Người đại diện thuế"
              >
                ⚙️ Danh mục ↗
              </a>
              {(['card', 'form'] as const).map(panel => (
                <button
                  key={panel}
                  type="button"
                  onClick={() => setTaxRepPanel(panel)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    taxRepPanel === panel ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100/80'
                  }`}
                >
                  {panel === 'card' ? '📋 Chi tiết' : '✏️ Sửa / Thêm'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-1.5">
            {taxRepPanel === 'card' && (
              <TaxRepresentativeCard
                representative={selectedTaxRepresentative}
                isEditing={isEditing}
                verified={!!verifiedFields['taxRepresentative']}
                onToggleVerify={() => toggleVerify('taxRepresentative')}
                onEdit={() => setTaxRepPanel('form')}
                className="border-0 rounded-none shadow-none p-0"
              />
            )}
            {taxRepPanel === 'form' && (
              <div className="p-3">
                <TaxRepresentativeForm
                  initialData={selectedTaxRepresentative ?? undefined}
                  onSubmit={handleTaxRepFormSubmit}
                  onCancel={() => setTaxRepPanel('card')}
                  isSubmitting={taxRepFormSaving}
                  className="border-0 shadow-none p-0"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onError)} className="h-full flex flex-col gap-1 p-1 overflow-x-hidden relative max-w-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2 shrink-0 py-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <button type="button" onClick={() => router.push('/applications')}
            className="p-1 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-full hover:bg-white transition-colors shadow-xs">
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-slate-800 truncate">
              {isNew ? 'Tạo Hồ sơ mới' : (watch('fullName') || 'Chi tiết Hồ sơ')}
            </h1>
            {!isNew && (
              <>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${statusCfg.badgeColor}`}>
                  <StatusIcon className="w-2.5 h-2.5" />{statusCfg.label}
                </span>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer shrink-0"
                  title="Nhấn để bàn giao / chuyển hồ sơ cho nhân viên khác"
                >
                  <ArrowRightLeft className="w-2.5 h-2.5 text-indigo-600" />
                  <span>{assignedUser ? `Phụ trách: ${assignedUser.name}` : 'Chưa gán (Bàn giao)'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Desktop Header Actions */}
        <div className="hidden lg:flex items-center gap-1 shrink-0">
          {!isEditing ? (
            <>
              {!isNew && (
                <a
                  href={`/customer/portal?id=${customerId || id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs mr-1"
                  title="Mở tab mới xem toàn bộ Trang Tra Cứu của Khách hàng"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  Xem giao diện Khách ↗
                </a>
              )}
              {!isNew && <Button type="button" variant="danger" size="xs" onClick={handleDelete} loading={deleting} loadingText="Đang xóa...">Xóa</Button>}
              {!isNew && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => window.open(`/api/applications/${id}/export-bundle?stage=all`, '_blank')}
                  iconLeft={<Download className="w-3 h-3 text-emerald-600" />}
                  className="font-semibold"
                >
                  Tải PDF
                </Button>
              )}
              {!isNew && <Button type="button" variant="secondary" size="xs" onClick={() => setShowPrintModal(true)} iconLeft={<Printer className="w-3 h-3" />}>In</Button>}
              <Button type="button" size="xs" className="px-3 font-semibold" onClick={() => setIsEditing(true)}>Sửa Hồ sơ</Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" size="xs" disabled={saving}
                onClick={() => { if (isNew) router.push('/applications'); else { setIsEditing(false); reset(); } }}>
                Hủy
              </Button>
              <Button type="submit" size="xs" className="px-3 font-bold bg-indigo-600 hover:bg-indigo-700" loading={saving} loadingText="Đang lưu..." iconLeft={<Save className="w-3 h-3" />}>
                Lưu Hồ sơ
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── MOBILE SEGMENTED CONTROL TAB BAR (< lg) ── */}
      <div className="grid grid-cols-3 gap-1 w-full lg:hidden bg-white/90 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 shrink-0 sticky top-0 z-30 shadow-xs">
        {(
          [
            { id: 'form',     label: '📝 Nhập liệu' },
            { id: 'progress', label: '👤 Tiến độ' },
            { id: 'tax',      label: '🏛️ Cục Thuế' },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id)}
            className={`w-full py-1.5 px-0.5 text-[11px] font-bold rounded-lg transition-all text-center truncate ${
              mobileTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MOBILE ACTIVE TAB PANEL (< lg) ── */}
      <div className="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-x-hidden lg:hidden pb-24">
        {mobileTab === 'form' && (
          <div className="flex-1 flex flex-col w-full max-w-full min-w-0 overflow-x-hidden gap-2">
            {/* ── Compact Document Thumbnail Strip ── */}
            <div className="bg-white/85 backdrop-blur-md border border-slate-200/70 rounded-xl p-2 shrink-0 min-w-0 max-w-full overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tài liệu đính kèm</span>
                <button type="button" onClick={() => setMobileTab('doc')}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                  Xem chi tiết →
                </button>
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none min-w-0">
                {dynamicDocuments.map(doc => {
                  const docUrl = watch(doc.urlField as any) as string | undefined;
                  const isActive = activeDoc === doc.key;
                  return (
                    <button
                      key={doc.key}
                      type="button"
                      onClick={() => {
                        setActiveDoc(doc.key);
                        if (docUrl) setLightboxUrl(docUrl);
                      }}
                      className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        isActive
                          ? 'border-indigo-500 shadow-sm shadow-indigo-200'
                          : 'border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      {docUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={docUrl} alt={doc.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <UploadCloud className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                      )}
                      {docUrl && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-tl-md flex items-center justify-center">
                          <CheckCircle className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* ── Form Panel ── */}
            <div className="flex-1 min-w-0">{panel2Node}</div>
          </div>
        )}
        {mobileTab === 'doc'      && <div className="flex-1 w-full max-w-full min-w-0 overflow-hidden">{panel1Node}</div>}
        {mobileTab === 'progress' && <div className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden">{panel3Node}</div>}
        {mobileTab === 'tax'      && <div className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden">{taxPanelNode}</div>}
      </div>

      {/* ── DESKTOP WORKSPACE GRID (lg:) ── */}
      {/*
        Enterprise layout strategy:
        - Outer grid: 2 columns (doc viewer | right workspace)
        - Right workspace: CSS grid-rows [1fr_auto] so:
            * Row 1 (flex-1): Panel 2 + Panel 3 side-by-side, each scrollable internally
            * Row 2 (auto): Tax Panel — sized to its natural content, never clipped
        - No rigid fixed heights anywhere
      */}
      <div className="hidden lg:grid flex-1 grid-cols-[35%_1fr] gap-2 min-h-0">
        {/* LEFT COLUMN: Document Image Viewer (Panel 1) */}
        <div className="min-h-0 overflow-hidden">{panel1Node}</div>

        {/* RIGHT COLUMN: grid-rows[1fr_auto] */}
        <div className="grid min-h-0" style={{ gridTemplateRows: '1fr auto', gap: '6px' }}>
          {/* Row 1: Form Details + Progress/Finance — fills available space, scrolls internally */}
          <div className="grid grid-cols-8 gap-2 min-h-0 overflow-hidden">
            <div className="col-span-5 min-h-0 overflow-hidden">{panel2Node}</div>
            <div className="col-span-3 min-h-0 overflow-hidden">{panel3Node}</div>
          </div>

          {/* Row 2: Tax Office Panel — auto-height, always fully visible */}
          <div className="min-h-0">{taxPanelNode}</div>
        </div>
      </div>

      {/* ── MOBILE STICKY BOTTOM ACTION BAR (< lg) ── */}
      <div className="flex lg:hidden fixed bottom-14 left-0 right-0 px-3 py-2 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-md justify-between items-center z-40">
        {!isEditing ? (
          <>
            <div className="flex items-center gap-1.5">
              {!isNew && (
                <a
                  href={`/customer/portal?id=${customerId || id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md font-bold text-[11px] flex items-center gap-1"
                >
                  <Eye className="w-3 h-3 text-indigo-600" /> Xem Khách ↗
                </a>
              )}
              {!isNew && <Button type="button" variant="danger" size="xs" onClick={handleDelete} loading={deleting}>Xóa</Button>}
              {!isNew && <Button type="button" variant="secondary" size="xs" onClick={() => setShowPrintModal(true)} iconLeft={<Printer className="w-3 h-3" />}>In</Button>}
            </div>
            <Button type="button" size="sm" className="px-4 font-bold text-xs" onClick={() => setIsEditing(true)}>✏️ Sửa Hồ sơ</Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => { if (isNew) router.push('/applications'); else { setIsEditing(false); reset(); } }}>
              Hủy
            </Button>
            <Button type="submit" size="sm" className="px-6 font-bold bg-indigo-600 hover:bg-indigo-700" loading={saving} loadingText="Đang lưu..." iconLeft={<Save className="w-3.5 h-3.5" />}>
              💾 Lưu Hồ sơ
            </Button>
          </>
        )}
      </div>
      </form>

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <button type="button" className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-all" onClick={() => setLightboxUrl(null)}>
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
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

      {/* Print modal */}
      <PrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        id={id}
      />

      {/* Settlement Notification Draft Modal (Dành cho Nhân viên) */}
      <SettlementModal
        isOpen={showSettlementModal}
        onClose={() => setShowSettlementModal(false)}
        customerEmail={customer?.email || undefined}
        inputData={{
          customerName: watch('fullName') || 'Khách hàng',
          customerCode: watch('code') || id.slice(0, 8),
          totalExpectedJpy: watch('totalExpectedJpy'),
          received1stJpy: watch('received1stJpy'),
          withheldTax: watch('withheldTax') || watch('tax2ndJpy'),
          received2ndJpy: watch('received2ndJpy'),
          exchangeRate: watch('exchangeRate') || 165,
          serviceFeeJpy: watch('serviceFeeJpy'),
          serviceFeeVnd: watch('serviceFeeVnd'),
          referralBonusJpy: (watch as any)('referralBonusJpy') || 2000,
        }}
      />
      <TransferApplicationModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        applicationId={id}
        currentAssignedUser={assignedUser}
        customerName={watch('fullName') || customer?.fullName}
        onSuccess={() => {
          toast.success('Đã bàn giao hồ sơ thành công!');
          fetch(`/api/applications/${id}`)
            .then(r => r.json())
            .then(d => { if (d.assignedUser !== undefined) setAssignedUser(d.assignedUser); })
            .catch(console.error);
          fetch(`/api/applications/${id}/history`)
            .then(r => r.json())
            .then(d => { if (d.success && Array.isArray(d.data)) setHistoryList(d.data); })
            .catch(console.error);
        }}
      />
    </>
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
