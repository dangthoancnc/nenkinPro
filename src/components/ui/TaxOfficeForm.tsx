'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2, MapPin, Phone, Globe, Mail,
  Save, X, Loader2, AlertCircle, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './Input'
import { FormField } from './FormField'
import type { TaxOfficeData } from './TaxOfficeCard'

// ─── Zod Schema ───────────────────────────────────────────────────────────
export const taxOfficeSchema = z.object({
  name:               z.string().min(1, 'Bắt buộc'),
  romajiName:         z.string().optional(),
  postalCode:         z.string().min(7, 'Dạng XXX-XXXX').max(8),
  address:            z.string().min(1, 'Bắt buộc'),
  romajiAddress:      z.string().optional(),
  phone:              z.string().optional(),
  websiteUrl:         z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  mapUrl:             z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  receptionInfo:      z.string().optional(),
  notes:              z.string().optional(),
  // --- Mailing (bắt buộc cho in tem phiếu) ---
  mailingName:        z.string().optional(),
  mailingPostalCode:  z.string().max(8).optional(),
  mailingAddress:     z.string().optional(),
  // --- Contacts ---
  jurisdiction:       z.string().optional(),
  consultationPhone:  z.string().optional(),
  generalPhone:       z.string().optional(),
})

export type TaxOfficeFormValues = z.infer<typeof taxOfficeSchema>

// ─── Props ──────────────────────────────────────────────────────────────
export interface TaxOfficeFormProps {
  /** Nếu truyền vào → mode Edit (pre-fill); nếu null → mode Create */
  initialData?:   TaxOfficeData | null
  /** Trạng thái đang gửi API */
  isSubmitting?:  boolean
  /** Gọi khi submit form hợp lệ */
  onSubmit:       (values: TaxOfficeFormValues, id?: string) => Promise<void> | void
  /** Gọi khi nhấn Hủy */
  onCancel:       () => void
  className?:     string
}

// ─── Section Divider ──────────────────────────────────────────────────
function SectionDivider({
  icon: Icon, label, accent,
}: { icon: React.ElementType; label: string; accent?: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-1.5 py-1.5',
      accent ? 'mt-1' : 'mt-0.5',
    )}>
      <Icon className={cn('w-3 h-3 flex-shrink-0', accent ? 'text-indigo-500' : 'text-slate-400')} />
      <span className={cn(
        'text-[9px] font-bold uppercase tracking-widest whitespace-nowrap',
        accent ? 'text-indigo-600' : 'text-slate-500',
      )}>
        {label}
      </span>
      <div className={cn('flex-1 h-px', accent ? 'bg-indigo-200' : 'bg-slate-200')} />
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────
export function TaxOfficeForm({
  initialData,
  isSubmitting = false,
  onSubmit,
  onCancel,
  className,
}: TaxOfficeFormProps) {
  const isEdit = !!initialData

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<TaxOfficeFormValues>({
    resolver: zodResolver(taxOfficeSchema),
    defaultValues: {
      name:               initialData?.name               ?? '',
      romajiName:         initialData?.romajiName         ?? '',
      postalCode:         initialData?.postalCode         ?? '',
      address:            initialData?.address            ?? '',
      romajiAddress:      initialData?.romajiAddress      ?? '',
      phone:              initialData?.phone              ?? '',
      websiteUrl:         initialData?.websiteUrl         ?? '',
      mapUrl:             initialData?.mapUrl             ?? '',
      receptionInfo:      initialData?.receptionInfo      ?? '',
      notes:              initialData?.notes              ?? '',
      mailingName:        initialData?.mailingName        ?? '',
      mailingPostalCode:  initialData?.mailingPostalCode  ?? '',
      mailingAddress:     initialData?.mailingAddress     ?? '',
      jurisdiction:       initialData?.jurisdiction       ?? '',
      consultationPhone:  initialData?.consultationPhone  ?? '',
      generalPhone:       initialData?.generalPhone       ?? '',
    },
  })

  // Re-sync khi initialData thay đổi (ví dụ sau khi AI pre-fill)
  useEffect(() => {
    if (initialData) reset({
      name:               initialData.name               ?? '',
      romajiName:         initialData.romajiName         ?? '',
      postalCode:         initialData.postalCode         ?? '',
      address:            initialData.address            ?? '',
      romajiAddress:      initialData.romajiAddress      ?? '',
      phone:              initialData.phone              ?? '',
      websiteUrl:         initialData.websiteUrl         ?? '',
      mapUrl:             initialData.mapUrl             ?? '',
      receptionInfo:      initialData.receptionInfo      ?? '',
      notes:              initialData.notes              ?? '',
      mailingName:        initialData.mailingName        ?? '',
      mailingPostalCode:  initialData.mailingPostalCode  ?? '',
      mailingAddress:     initialData.mailingAddress     ?? '',
      jurisdiction:       initialData.jurisdiction       ?? '',
      consultationPhone:  initialData.consultationPhone  ?? '',
      generalPhone:       initialData.generalPhone       ?? '',
    })
  }, [initialData, reset])

  const mailingName        = watch('mailingName')
  const mailingPostalCode  = watch('mailingPostalCode')
  const mailingAddress     = watch('mailingAddress')
  const mailingComplete    =
    !!mailingName?.trim() && !!mailingPostalCode?.trim() && !!mailingAddress?.trim()

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values, initialData?.id)
  })

  return (
    <div className={cn(
      'rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm',
      className,
    )}>

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2
                      bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            {isEdit ? '✉️ Cập nhật cục thuế' : '➕ Tạo cục thuế mới'}
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-white transition-colors p-0.5 rounded"
          title="Đóng"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Form ─────────────────────────────────────────── */}
      <form onSubmit={handleFormSubmit} noValidate>
        <div className="px-3 py-3 space-y-0">

          {/* ─── Block 1: Thông tin cơ bản ─── */}
          <SectionDivider icon={Building2} label="Thông tin cơ bản" />

          <div className="space-y-2">
            <FormField label="Tên cục thuế" required errorMessage={errors.name?.message}>
              <Input
                {...register('name')}
                placeholder="堂税務署"
                state={errors.name ? 'error' : 'default'}
              />
            </FormField>

            <FormField label="Tên Romaji" errorMessage={errors.romajiName?.message}>
              <Input
                {...register('romajiName')}
                placeholder="Sakai Zeimusho"
                state={errors.romajiName ? 'error' : 'default'}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-2">
              <FormField label="Mã bưu điện" required errorMessage={errors.postalCode?.message}>
                <Input
                  {...register('postalCode')}
                  placeholder="593-8511"
                  state={errors.postalCode ? 'error' : 'default'}
                  leftIcon={<MapPin className="w-3 h-3" />}
                />
              </FormField>

              <FormField label="SĐT" errorMessage={errors.phone?.message}>
                <Input
                  {...register('phone')}
                  placeholder="072-271-3441"
                  type="tel"
                  state={errors.phone ? 'error' : 'default'}
                  leftIcon={<Phone className="w-3 h-3" />}
                />
              </FormField>
            </div>

            <FormField label="Địa chỉ" required errorMessage={errors.address?.message}>
              <Input
                {...register('address')}
                placeholder="大阪府堤市西区浜寺石津町東4丁390-1"
                state={errors.address ? 'error' : 'default'}
              />
            </FormField>

            <FormField label="Địa chỉ Romaji" errorMessage={errors.romajiAddress?.message}>
              <Input
                {...register('romajiAddress')}
                placeholder="4-390-1 Hamadera Ishizu-cho Higashi, Nishi-ku, Sakai-shi"
                state={errors.romajiAddress ? 'error' : 'default'}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-2">
              <FormField label="Website NTA" errorMessage={errors.websiteUrl?.message}>
                <Input
                  {...register('websiteUrl')}
                  placeholder="https://..."
                  type="url"
                  state={errors.websiteUrl ? 'error' : 'default'}
                  leftIcon={<Globe className="w-3 h-3" />}
                />
              </FormField>

              <FormField label="Link bản đồ" errorMessage={errors.mapUrl?.message}>
                <Input
                  {...register('mapUrl')}
                  placeholder="https://maps.google.com/..."
                  type="url"
                  state={errors.mapUrl ? 'error' : 'default'}
                  leftIcon={<Globe className="w-3 h-3" />}
                />
              </FormField>
            </div>
          </div>

          {/* ─── Block 2: Địa chỉ nhận hồ sơ (quan trọng) ─── */}
          <SectionDivider icon={Mail} label="Địa chỉ nhận hồ sơ · In tem phiếu" accent />

          {/* Hint */}
          <div className="flex items-start gap-1.5 px-2.5 py-2 mb-2
                          rounded-lg bg-indigo-50 border border-indigo-200">
            <Info className="w-3 h-3 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-indigo-700 leading-snug">
              Thông tin này dùng để <strong>in tem phiếu dán lên hồ sơ</strong> khi gửi bưu điện.
              Khác với địa chỉ văn phòng phía trên.
            </p>
          </div>

          {/* Mailing complete badge */}
          {mailingComplete && (
            <div className="flex items-center gap-1 text-[10px] font-semibold
                            text-emerald-700 bg-emerald-50 border border-emerald-200
                            px-2 py-1 rounded-lg mb-2">
              <Mail className="w-3 h-3" />
              Địa chỉ nhận hồ sơ đầy đủ — có thể in tem phiếu
            </div>
          )}

          <div className="space-y-2">
            <FormField
              label="Tên nơi nhận (申告書等の郵送先)"
              errorMessage={errors.mailingName?.message}
            >
              <Input
                {...register('mailingName')}
                placeholder="堤税務署 汚税相課部門"
                state={errors.mailingName ? 'error' : mailingName ? 'verified' : 'default'}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-2">
              <FormField
                label="Mã bưu điện nhận"
                errorMessage={errors.mailingPostalCode?.message}
              >
                <Input
                  {...register('mailingPostalCode')}
                  placeholder="593-8511"
                  state={errors.mailingPostalCode ? 'error' : mailingPostalCode ? 'verified' : 'default'}
                  leftIcon={<Mail className="w-3 h-3" />}
                />
              </FormField>

              <FormField
                label="Địa chỉ nhận"
                errorMessage={errors.mailingAddress?.message}
              >
                <Input
                  {...register('mailingAddress')}
                  placeholder="大阪府堤市西区..."
                  state={errors.mailingAddress ? 'error' : mailingAddress ? 'verified' : 'default'}
                />
              </FormField>
            </div>
          </div>

          {/* Warning nếu thiếu mailing */}
          {!mailingComplete && (mailingName || mailingPostalCode || mailingAddress) && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 mt-1
                            rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
              <p className="text-[10px] text-amber-700">
                Điền đủ cả 3 trường để kích hoạt in tem phiếu.
              </p>
            </div>
          )}

          {/* ─── Block 3: Liên hệ bổ sung ─── */}
          <SectionDivider icon={Phone} label="Liên hệ bổ sung" />

          <div className="space-y-2">
            <FormField label="Khu vực quản lý (管轄区域)" errorMessage={errors.jurisdiction?.message}>
              <Input
                {...register('jurisdiction')}
                placeholder="堤市西区全域..."
                state={errors.jurisdiction ? 'error' : 'default'}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-2">
              <FormField
                label="SĐT tư vấn thuế"
                errorMessage={errors.consultationPhone?.message}
              >
                <Input
                  {...register('consultationPhone')}
                  placeholder="072-271-3441"
                  type="tel"
                  state={errors.consultationPhone ? 'error' : 'default'}
                  leftIcon={<Phone className="w-3 h-3" />}
                />
              </FormField>

              <FormField
                label="SĐT hành chính"
                errorMessage={errors.generalPhone?.message}
              >
                <Input
                  {...register('generalPhone')}
                  placeholder="072-271-3441"
                  type="tel"
                  state={errors.generalPhone ? 'error' : 'default'}
                  leftIcon={<Phone className="w-3 h-3" />}
                />
              </FormField>
            </div>

            <FormField label="Giờ tiếp nhận" errorMessage={errors.receptionInfo?.message}>
              <Input
                {...register('receptionInfo')}
                placeholder="平日 8:30～17:00"
                state={errors.receptionInfo ? 'error' : 'default'}
              />
            </FormField>

            <FormField label="Ghi chú nội bộ" errorMessage={errors.notes?.message}>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Ghi chú thêm về cục thuế này..."
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5
                           text-xs text-slate-700 placeholder:text-slate-300
                           focus:outline-none focus:ring-2 focus:ring-indigo-100
                           focus:border-indigo-400 resize-none transition-all"
              />
            </FormField>
          </div>
        </div>

        {/* ── Footer Actions ──────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2
                        px-3 py-2.5 bg-slate-50 border-t border-slate-200">
          {/* Dirty indicator */}
          <span className={cn(
            'text-[10px] transition-opacity',
            isDirty ? 'text-amber-600 opacity-100' : 'opacity-0',
          )}>
            ⚠️ Có thay đổi chưa lưu
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-600
                         hover:text-slate-800 border border-slate-200 hover:border-slate-300
                         bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg
                         transition-all disabled:opacity-50"
            >
              <X className="w-3 h-3" /> Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 text-[11px] font-bold text-white
                         bg-indigo-600 hover:bg-indigo-700
                         px-4 py-1.5 rounded-lg shadow-sm
                         transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Đang lưu...</>
              ) : (
                <><Save className="w-3 h-3" /> {isEdit ? 'Cập nhật' : 'Tạo cục thuế'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
