'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, MapPin, Phone, Building, CreditCard,
  Save, X, Loader2, Search, CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './Input'
import { FormField } from './FormField'
import type { TaxRepresentativeData } from './TaxRepresentativeCard'
import { taxRepresentativeSchema } from '@/lib/validations/taxRepresentativeSchema'

export type TaxRepresentativeFormValues = z.infer<typeof taxRepresentativeSchema>

export interface TaxRepresentativeFormProps {
  initialData?:  TaxRepresentativeData | null
  isSubmitting?: boolean
  onSubmit:      (values: TaxRepresentativeFormValues, id?: string) => Promise<void> | void
  onCancel:      () => void
  className?:    string
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
      isYucho:             false,
      bankAccountType:     'ORDINARY',
      yuchoKigo:           '',
      yuchoBango:          '',
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
      })
    }
  }, [initialData, reset])

  const isYucho = watch('isYucho')

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

  const handleFormSubmit = async (values: TaxRepresentativeFormValues) => {
    await onSubmit(values, initialData?.id)
  }

  return (
    <div
      className={cn('bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 space-y-3.5', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5">
          <User className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
            {isEdit ? 'Chỉnh sửa Người Đại Diện Thuế' : 'Thêm mới Người Đại Diện Thuế'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Section 1: Thông tin cá nhân tại Nhật */}
        <div className="space-y-2 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              1. Thông tin cá nhân tại Nhật
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FormField label="Họ và tên (Romaji / Kanji)" required errorMessage={errors.fullName?.message}>
              <Input
                {...register('fullName')}
                placeholder="VD: DAO THI DUYEN"
                className="text-xs h-7"
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

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <FormField label="Mã bưu điện" required errorMessage={errors.postalCode?.message}>
                <div className="relative">
                  <Input
                    {...register('postalCode')}
                    placeholder="212-0055"
                    className="text-xs h-7 pr-6 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleZipSearch}
                    disabled={zipSearching}
                    className="absolute right-1 top-1 p-0.5 text-slate-400 hover:text-indigo-600"
                    title="Tra cứu địa chỉ tự động"
                  >
                    {zipSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                  </button>
                </div>
              </FormField>
            </div>
            <div className="col-span-2">
              <FormField label="Số điện thoại Nhật" errorMessage={errors.phone?.message}>
                <Input
                  {...register('phone')}
                  placeholder="080-9876-5432"
                  className="text-xs h-7 font-mono"
                />
              </FormField>
            </div>
          </div>

          <FormField label="Địa chỉ tại Nhật" required errorMessage={errors.address?.message}>
            <Input
              {...register('address')}
              placeholder="神奈川県川崎市幸区南加瀬4丁目18-48-205号"
              className="text-xs h-7"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-2">
            <FormField label="Quan hệ với khách hàng" errorMessage={errors.relationship?.message}>
              <Input
                {...register('relationship')}
                placeholder="納税管理人"
                className="text-xs h-7"
              />
            </FormField>
            <FormField label="Nghề nghiệp" errorMessage={errors.occupation?.message}>
              <Input
                {...register('occupation')}
                placeholder="会社員"
                className="text-xs h-7"
              />
            </FormField>
          </div>
        </div>

        {/* Section 2: Tài khoản Ngân hàng tại Nhật (Nhận hoàn thuế Lần 2) */}
        <div className="space-y-2 bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-100/70">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
              2. Tài khoản Ngân hàng tại Nhật (JPY)
            </span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 cursor-pointer text-[10px] font-semibold text-slate-700">
                <input
                  type="radio"
                  name="bankTypeChoice"
                  checked={!isYucho}
                  onChange={() => setValue('isYucho', false, { shouldDirty: true })}
                  className="w-3 h-3 text-indigo-600"
                />
                Ngân hàng thường
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-[10px] font-semibold text-indigo-700">
                <input
                  type="radio"
                  name="bankTypeChoice"
                  checked={isYucho}
                  onChange={() => {
                    setValue('isYucho', true, { shouldDirty: true })
                    setValue('bankName', 'ゆうちょ銀行', { shouldDirty: true })
                  }}
                  className="w-3 h-3 text-indigo-600"
                />
                Yucho (ゆうちょ)
              </label>
            </div>
          </div>

          {!isYucho ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Tên Ngân hàng" errorMessage={errors.bankName?.message}>
                  <Input
                    {...register('bankName')}
                    placeholder="VD: 三菱UFJ銀行 / 三井住友銀行"
                    className="text-xs h-7"
                  />
                </FormField>
                <FormField label="Tên Chi nhánh" errorMessage={errors.branchName?.message}>
                  <Input
                    {...register('branchName')}
                    placeholder="VD: 新宿支店"
                    className="text-xs h-7"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Loại tài khoản">
                  <select
                    {...register('bankAccountType')}
                    className="w-full h-7 text-xs rounded-lg border border-slate-200 bg-white px-2 focus:outline-none focus:border-indigo-400 font-semibold"
                  >
                    <option value="ORDINARY">普通 (Thường)</option>
                    <option value="CURRENT">当座 (Vãng lai)</option>
                  </select>
                </FormField>
                <FormField label="Số tài khoản (7 chữ số)" errorMessage={errors.accountNumber?.message}>
                  <Input
                    {...register('accountNumber')}
                    placeholder="1234567"
                    maxLength={8}
                    className="text-xs h-7 font-mono font-bold tracking-wider"
                  />
                </FormField>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Tên Ngân hàng">
                  <Input
                    {...register('bankName')}
                    defaultValue="ゆうちょ銀行"
                    className="text-xs h-7 bg-slate-50"
                  />
                </FormField>
                <FormField label="Tên Chi nhánh / Phòng GD" errorMessage={errors.branchName?.message}>
                  <Input
                    {...register('branchName')}
                    placeholder="VD: 名古屋支店"
                    className="text-xs h-7"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Ký hiệu Kigo (5 số)" required errorMessage={errors.yuchoKigo?.message}>
                  <Input
                    {...register('yuchoKigo')}
                    placeholder="VD: 10120"
                    maxLength={5}
                    className="text-xs h-7 font-mono font-bold tracking-wider text-indigo-700"
                  />
                </FormField>
                <FormField label="Số hiệu Bango (7 số)" required errorMessage={errors.yuchoBango?.message}>
                  <Input
                    {...register('yuchoBango')}
                    placeholder="VD: 1234567"
                    maxLength={8}
                    className="text-xs h-7 font-mono font-bold tracking-wider text-indigo-700"
                  />
                </FormField>
              </div>
            </>
          )}

          <FormField label="Chủ tài khoản (Katakana in hoa)" required errorMessage={errors.accountNameKatakana?.message}>
            <Input
              {...register('accountNameKatakana')}
              placeholder="VD: ダオ ティ デュエン"
              className="text-xs h-7 font-semibold"
            />
          </FormField>
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
