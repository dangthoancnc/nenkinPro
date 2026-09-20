'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, MapPin, Phone, Building, CreditCard,
  Save, X, Loader2, Search, CheckCircle, Plus, Trash2, Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './Input'
import { FormField } from './FormField'
import type { TaxRepresentativeData } from './TaxRepresentativeCard'
import { taxRepresentativeSchema } from '@/lib/validations/taxRepresentativeSchema'
import { toast } from 'sonner'

export type TaxRepresentativeFormValues = z.infer<typeof taxRepresentativeSchema>

export interface TaxRepresentativeFormProps {
  initialData?:  TaxRepresentativeData | null
  isSubmitting?: boolean
  onSubmit:      (values: TaxRepresentativeFormValues, id?: string) => Promise<void> | void
  onCancel:      () => void
  className?:    string
}

interface BankAccountItemState {
  id?: string
  isDefault: boolean
  bankName: string
  branchName: string
  accountNumber: string
  accountName: string
  accountNameKatakana: string
  isYucho: boolean
  bankAccountType: string
  yuchoKigo: string
  yuchoBango: string
}

export function TaxRepresentativeForm({
  initialData,
  isSubmitting = false,
  onSubmit,
  onCancel,
  className,
}: TaxRepresentativeFormProps) {
  const isEdit = !!initialData
  const [zipSearching, setZipSearching] = useState(false)
  const [staffs, setStaffs] = useState<any[]>([])

  const [bankAccounts, setBankAccounts] = useState<BankAccountItemState[]>([
    {
      isDefault: true,
      bankName: 'ゆうちょ銀行',
      branchName: '',
      accountNumber: '',
      accountName: '',
      accountNameKatakana: '',
      isYucho: true,
      bankAccountType: 'ORDINARY',
      yuchoKigo: '',
      yuchoBango: '',
    }
  ])

  useEffect(() => {
    fetch('/api/hr/staffs').then(res => res.json()).then(data => {
      if (data.success) setStaffs(data.data)
    }).catch(console.error)
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaxRepresentativeFormValues>({
    resolver: zodResolver(taxRepresentativeSchema) as any,
    defaultValues: {
      fullName:            '',
      fullNameKana:        '',
      address:             '',
      postalCode:          '',
      phone:               '',
      relationship:        '納税管理人',
      occupation:          '会社員',
      dob:                 '',
      bankName:            '',
      branchName:          '',
      accountNumber:       '',
      accountName:         '',
      accountNameKatakana: '',
      isYucho:             true,
      bankAccountType:     'ORDINARY',
      yuchoKigo:           '',
      yuchoBango:          '',
      linkedUserId:        '',
    },
  })

  useEffect(() => {
    if (initialData) {
      reset({
        fullName:            initialData.fullName || '',
        fullNameKana:        initialData.fullNameKana || '',
        address:             initialData.address || '',
        postalCode:          initialData.postalCode || '',
        phone:               initialData.phone || '',
        relationship:        initialData.relationship || '納税管理人',
        occupation:          initialData.occupation || '会社員',
        dob:                 initialData.dob ? (typeof initialData.dob === 'string' ? initialData.dob.slice(0, 10) : new Date(initialData.dob).toISOString().slice(0, 10)) : '',
        bankName:            initialData.bankName || '',
        branchName:          initialData.branchName || '',
        accountNumber:       initialData.accountNumber || '',
        accountName:         initialData.accountName || '',
        accountNameKatakana: initialData.accountNameKatakana || '',
        isYucho:             Boolean(initialData.isYucho),
        bankAccountType:     initialData.bankAccountType || 'ORDINARY',
        yuchoKigo:           initialData.yuchoKigo || '',
        yuchoBango:          initialData.yuchoBango || '',
        linkedUserId:        (initialData as any).linkedUserId || '',
      })

      if (initialData.bankAccounts && initialData.bankAccounts.length > 0) {
        setBankAccounts(initialData.bankAccounts.map((a, idx) => ({
          id: a.id,
          isDefault: a.isDefault ?? idx === 0,
          bankName: a.bankName || '',
          branchName: a.branchName || '',
          accountNumber: a.accountNumber || '',
          accountName: a.accountName || initialData.fullName || '',
          accountNameKatakana: a.accountNameKatakana || initialData.fullNameKana || '',
          isYucho: a.isYucho ?? Boolean(a.bankName?.includes('ゆうちょ') || a.bankName?.includes('Yucho')),
          bankAccountType: a.bankAccountType || 'ORDINARY',
          yuchoKigo: a.yuchoKigo || '',
          yuchoBango: a.yuchoBango || '',
        })))
      } else if (initialData.bankName || initialData.yuchoKigo || initialData.accountNumber) {
        setBankAccounts([{
          isDefault: true,
          bankName: initialData.bankName || 'ゆうちょ銀行',
          branchName: initialData.branchName || '',
          accountNumber: initialData.accountNumber || '',
          accountName: initialData.accountName || initialData.fullName || '',
          accountNameKatakana: initialData.accountNameKatakana || initialData.fullNameKana || '',
          isYucho: Boolean(initialData.isYucho),
          bankAccountType: initialData.bankAccountType || 'ORDINARY',
          yuchoKigo: initialData.yuchoKigo || '',
          yuchoBango: initialData.yuchoBango || '',
        }])
      }
    }
  }, [initialData, reset])

  const handleZipSearch = async () => {
    const rawZip = watch('postalCode')?.replace(/\D/g, '') || ''
    if (rawZip.length < 7) return

    setZipSearching(true)
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${rawZip}`)
      const data = await res.json()
      if (data.results && data.results[0]) {
        const item = data.results[0]
        const fullAddr = `${item.address1}${item.address2}${item.address3}`
        setValue('address', fullAddr, { shouldDirty: true })
      }
    } catch (e) {
      console.error('ZIP search error', e)
    } finally {
      setZipSearching(false)
    }
  }

  const handleAddAccount = () => {
    setBankAccounts(prev => [
      ...prev,
      {
        isDefault: false,
        bankName: '',
        branchName: '',
        accountNumber: '',
        accountName: watch('fullName') || '',
        accountNameKatakana: watch('fullNameKana') || '',
        isYucho: false,
        bankAccountType: 'ORDINARY',
        yuchoKigo: '',
        yuchoBango: '',
      }
    ])
    toast.info('Đã thêm 1 tài khoản ngân hàng mới')
  }

  const handleSetDefaultAccount = (index: number) => {
    setBankAccounts(prev => prev.map((acc, i) => ({
      ...acc,
      isDefault: i === index,
    })))
    toast.success(`Đã đặt tài khoản #${index + 1} làm mặc định!`)
  }

  const handleRemoveAccount = (index: number) => {
    if (bankAccounts.length <= 1) {
      toast.error('Người đại diện cần ít nhất 1 tài khoản ngân hàng')
      return
    }
    setBankAccounts(prev => {
      const filtered = prev.filter((_, i) => i !== index)
      if (!filtered.some(a => a.isDefault) && filtered.length > 0) {
        filtered[0].isDefault = true
      }
      return filtered
    })
    toast.info('Đã xóa tài khoản')
  }

  const updateAccountField = (index: number, field: keyof BankAccountItemState, value: any) => {
    setBankAccounts(prev => prev.map((acc, i) => {
      if (i !== index) return acc
      const updated = { ...acc, [field]: value }
      if (field === 'isYucho' && value === true && !updated.bankName) {
        updated.bankName = 'ゆうちょ銀行'
      }
      return updated
    }))
  }

  const handleFormSubmit = async (values: TaxRepresentativeFormValues) => {
    const defaultAcc = bankAccounts.find(a => a.isDefault) || bankAccounts[0]
    const payload: TaxRepresentativeFormValues = {
      ...values,
      bankAccounts: bankAccounts as any,
      bankName: defaultAcc?.bankName || values.bankName,
      branchName: defaultAcc?.branchName || values.branchName,
      accountNumber: defaultAcc?.accountNumber || values.accountNumber,
      accountName: defaultAcc?.accountName || values.accountName,
      accountNameKatakana: defaultAcc?.accountNameKatakana || values.accountNameKatakana,
      isYucho: defaultAcc ? Boolean(defaultAcc.isYucho) : values.isYucho,
      bankAccountType: defaultAcc?.bankAccountType || values.bankAccountType,
      yuchoKigo: defaultAcc?.yuchoKigo || values.yuchoKigo,
      yuchoBango: defaultAcc?.yuchoBango || values.yuchoBango,
    }
    await onSubmit(payload, initialData?.id)
  }

  return (
    <div
      className={cn('bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 space-y-3.5', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <User className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            {isEdit ? 'Chỉnh sửa Người Đại Diện Thuế' : 'Thêm Người Đại Diện Thuế Mới'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2-Column Responsive Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Column 1: Personal info */}
        <div className="space-y-2.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            1. Thông tin cá nhân tại Nhật
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FormField label="Họ và tên (Romaji / Kanji)" required errorMessage={errors.fullName?.message}>
              <Input
                {...register('fullName')}
                placeholder="VD: DAO THI DUYEN"
                className="text-xs h-7 font-bold"
              />
            </FormField>
            <FormField label="Furigana (Katakana)" errorMessage={errors.fullNameKana?.message}>
              <Input
                {...register('fullNameKana')}
                placeholder="VD: ダオ ティ デュエン"
                className="text-xs h-7"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FormField label="Mã bưu điện" required errorMessage={errors.postalCode?.message}>
              <div className="relative">
                <Input
                  {...register('postalCode')}
                  placeholder="212-0055"
                  maxLength={8}
                  className="text-xs h-7 pr-6 font-mono"
                  onBlur={handleZipSearch}
                />
                <button
                  type="button"
                  onClick={handleZipSearch}
                  disabled={zipSearching}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-0.5"
                  title="Tra cứu địa chỉ tự động"
                >
                  {zipSearching ? <Loader2 className="w-3 h-3 animate-spin text-indigo-600" /> : <Search className="w-3 h-3" />}
                </button>
              </div>
            </FormField>
            <FormField label="Số điện thoại Nhật" errorMessage={errors.phone?.message}>
              <Input
                {...register('phone')}
                placeholder="090-1234-5678"
                className="text-xs h-7 font-mono"
              />
            </FormField>
          </div>

          <FormField label="Địa chỉ tại Nhật" required errorMessage={errors.address?.message}>
            <Input
              {...register('address')}
              placeholder="VD: 神奈川県川崎市幸区南加瀬..."
              className="text-xs h-7"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-2">
            <FormField label="Quan hệ với khách hàng">
              <Input
                {...register('relationship')}
                defaultValue="納税管理人"
                className="text-xs h-7"
              />
            </FormField>
            <FormField label="Nghề nghiệp">
              <Input
                {...register('occupation')}
                defaultValue="会社員"
                className="text-xs h-7"
              />
            </FormField>
          </div>
        </div>

        {/* Column 2: Multi-Bank Accounts list */}
        <div className="space-y-2.5 p-3 rounded-xl bg-indigo-50/40 border border-indigo-100/80">
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
              2. Tài khoản Ngân hàng JPY ({bankAccounts.length} TK)
            </div>
            <button
              type="button"
              onClick={handleAddAccount}
              className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3 h-3" /> Thêm TK
            </button>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
            {bankAccounts.map((acc, index) => {
              const isYucho = acc.isYucho;
              return (
                <div
                  key={index}
                  className={cn(
                    'p-2.5 rounded-xl border transition-all text-xs space-y-2 bg-white',
                    acc.isDefault ? 'border-amber-400/90 shadow-2xs bg-amber-50/20' : 'border-slate-200'
                  )}
                >
                  <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[11px] text-slate-800">
                        TK #{index + 1}: {acc.bankName || (isYucho ? 'ゆうちょ銀行' : 'Chưa đặt tên')}
                      </span>
                      {acc.isDefault ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" /> Mặc định
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAccount(index)}
                          className="text-[10px] text-slate-500 hover:text-amber-700 hover:underline font-semibold"
                        >
                          Đặt làm mặc định
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Toggle Yucho / Bank */}
                      <div className="flex items-center gap-1.5 bg-slate-100/90 p-0.5 rounded-md text-[10px]">
                        <button
                          type="button"
                          onClick={() => updateAccountField(index, 'isYucho', false)}
                          className={cn(
                            'px-1.5 py-0.5 rounded font-semibold transition-colors',
                            !isYucho ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-500'
                          )}
                        >
                          Ngân hàng
                        </button>
                        <button
                          type="button"
                          onClick={() => updateAccountField(index, 'isYucho', true)}
                          className={cn(
                            'px-1.5 py-0.5 rounded font-semibold transition-colors',
                            isYucho ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-500'
                          )}
                        >
                          Yucho
                        </button>
                      </div>

                      {bankAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAccount(index)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Xóa tài khoản này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {!isYucho ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Tên Ngân hàng</label>
                          <Input
                            value={acc.bankName}
                            onChange={e => updateAccountField(index, 'bankName', e.target.value)}
                            placeholder="VD: 三菱UFJ銀行"
                            className="text-xs h-7"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Tên Chi nhánh</label>
                          <Input
                            value={acc.branchName}
                            onChange={e => updateAccountField(index, 'branchName', e.target.value)}
                            placeholder="VD: 川崎支店"
                            className="text-xs h-7"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Loại tài khoản</label>
                          <select
                            value={acc.bankAccountType}
                            onChange={e => updateAccountField(index, 'bankAccountType', e.target.value)}
                            className="w-full h-7 text-xs rounded-lg border border-slate-200 bg-white px-1.5 focus:outline-none focus:border-indigo-400 font-semibold"
                          >
                            <option value="ORDINARY">普通 (Thường)</option>
                            <option value="CURRENT">当座 (Vãng lai)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Số tài khoản (7 số)</label>
                          <Input
                            value={acc.accountNumber}
                            onChange={e => updateAccountField(index, 'accountNumber', e.target.value)}
                            placeholder="1234567"
                            maxLength={8}
                            className="text-xs h-7 font-mono font-bold tracking-wider"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Tên Ngân hàng</label>
                          <Input
                            value={acc.bankName || 'ゆうちょ銀行'}
                            onChange={e => updateAccountField(index, 'bankName', e.target.value)}
                            className="text-xs h-7 bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Tên Chi nhánh / Phòng GD</label>
                          <Input
                            value={acc.branchName}
                            onChange={e => updateAccountField(index, 'branchName', e.target.value)}
                            placeholder="VD: 南加瀬支店"
                            className="text-xs h-7"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Ký hiệu Kigo (5 số)</label>
                          <Input
                            value={acc.yuchoKigo}
                            onChange={e => updateAccountField(index, 'yuchoKigo', e.target.value)}
                            placeholder="10120"
                            maxLength={5}
                            className="text-xs h-7 font-mono font-bold tracking-wider text-indigo-700"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Số hiệu Bango (7 số)</label>
                          <Input
                            value={acc.yuchoBango}
                            onChange={e => updateAccountField(index, 'yuchoBango', e.target.value)}
                            placeholder="1234567"
                            maxLength={8}
                            className="text-xs h-7 font-mono font-bold tracking-wider text-indigo-700"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Chủ tài khoản (Katakana in hoa)</label>
                    <Input
                      value={acc.accountNameKatakana}
                      onChange={e => updateAccountField(index, 'accountNameKatakana', e.target.value)}
                      placeholder="VD: ダオ ティ デュエン"
                      className="text-xs h-7 font-semibold"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSubmit(handleFormSubmit)}
          disabled={isSubmitting}
          className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-xs disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              {isEdit ? 'Cập nhật Người Đại Diện' : 'Tạo mới Người Đại Diện'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
