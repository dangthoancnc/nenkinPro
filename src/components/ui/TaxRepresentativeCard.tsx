'use client'

import React, { useState, useCallback } from 'react'
import {
  UserCheck, MapPin, Phone, Building, CreditCard,
  Copy, Check, ExternalLink, AlertCircle, Pencil, Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TaxRepresentativeData {
  id:                  string
  fullName:            string
  fullNameKana?:       string | null
  address:             string
  postalCode:          string
  phone?:              string | null
  myNumber?:           string | null
  relationship?:       string | null
  occupation?:         string | null
  dob?:                string | Date | null
  
  bankName?:           string | null
  branchName?:         string | null
  accountNumber?:      string | null
  accountName?:        string | null
  accountNameKatakana?: string | null
  isYucho?:            boolean
  bankAccountType?:    string | null
  yuchoKigo?:          string | null
  yuchoBango?:         string | null
}

export interface TaxRepresentativeCardProps {
  representative:  TaxRepresentativeData | null
  isEditing?:      boolean
  verified?:       boolean
  onToggleVerify?: () => void
  onEdit?:         () => void
  className?:      string
}

function useCopy(text: string) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {/* ignore */}
  }, [text])
  return { copied, copy }
}

function InfoRow({
  icon: Icon, label, value, mono,
}: {
  icon: React.ElementType
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-1.5 py-0.5 border-b border-slate-100/80 last:border-0">
      <Icon className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider block leading-none mb-0.5">
          {label}
        </span>
        <p className={cn(
          'text-[11px] text-slate-700 break-words leading-snug',
          mono && 'font-mono tracking-wider font-semibold text-slate-800',
        )}>
          {value}
        </p>
      </div>
    </div>
  )
}

export function TaxRepresentativeCard({
  representative,
  isEditing = false,
  verified = false,
  onToggleVerify,
  onEdit,
  className,
}: TaxRepresentativeCardProps) {
  if (!representative) {
    return (
      <div className={cn(
        'rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 text-center text-xs text-amber-700',
        className,
      )}>
        <AlertCircle className="w-5 h-5 mx-auto mb-1 text-amber-500" />
        <p className="font-semibold">Chưa chọn Người đại diện thuế</p>
        <p className="text-[11px] text-amber-600 mt-0.5">
          Vui lòng chọn hoặc thêm người đại diện thuế để in đơn Hoàn thuế Lần 2.
        </p>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="mt-2.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-colors"
          >
            + Thêm Người Đại Diện
          </button>
        )}
      </div>
    )
  }

  const {
    fullName, fullNameKana, address, postalCode, phone,
    relationship, occupation,
    bankName, branchName, accountNumber, accountName, accountNameKatakana,
    isYucho, bankAccountType, yuchoKigo, yuchoBango,
  } = representative

  const isYuchoBank = isYucho || bankName?.includes('ゆうちょ') || bankName?.includes('Yucho')

  const copyFullInfo = `[NGƯỜI ĐẠI DIỆN THUẾ]
Họ tên: ${fullName} (${fullNameKana || ''})
〒${postalCode} ${address}
SĐT: ${phone || 'N/A'}
Quan hệ: ${relationship || '納税管理人'} | Nghề nghiệp: ${occupation || '会社員'}
[TÀI KHOẢN NHẬN HOÀN THUẾ JPY]
Ngân hàng: ${bankName || 'N/A'} - ${branchName || ''}
${isYuchoBank ? `Yucho Kigo: ${yuchoKigo || ''} | Bango: ${yuchoBango || ''}` : `Số TK: ${accountNumber || ''} (${bankAccountType === 'CURRENT' ? '当座' : '普通'})`}
Chủ TK (Katakana): ${accountNameKatakana || accountName || ''}`

  const { copied, copy } = useCopy(copyFullInfo)

  return (
    <div className={cn(
      'rounded-xl border bg-white shadow-2xs overflow-hidden transition-all',
      verified ? 'border-emerald-300' : 'border-slate-200/90',
      className,
    )}>
      {/* Header Compact Ribbon */}
      <div className="px-3 py-1.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <UserCheck className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
          <span className="font-bold text-xs text-slate-800 truncate">
            {fullName}
          </span>
          {fullNameKana && (
            <span className="text-[10px] text-slate-500 font-medium truncate">
              ({fullNameKana})
            </span>
          )}
          <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-full">
            {relationship || '納税管理人'}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={copy}
            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
            title="Sao chép toàn bộ thông tin"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
              title="Chỉnh sửa thông tin"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Body: 2 Columns */}
      <div className="p-2.5 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
        {/* Column 1: Thông tin cá nhân tại Nhật */}
        <div className="bg-slate-50/60 rounded-lg p-2 border border-slate-100">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              📌 Thông tin tại Nhật
            </span>
          </div>
          <div className="space-y-0.5">
            <InfoRow icon={MapPin} label="Mã bưu điện" value={`〒${postalCode}`} mono />
            <InfoRow icon={MapPin} label="Địa chỉ" value={address} />
            <InfoRow icon={Phone} label="Số điện thoại" value={phone || 'Chưa cập nhật'} mono />
            <InfoRow icon={Briefcase} label="Nghề nghiệp" value={occupation || '会社員'} />
          </div>
        </div>

        {/* Column 2: Tài khoản Ngân hàng tại Nhật (Hoàn thuế JPY) */}
        <div className="bg-indigo-50/40 rounded-lg p-2 border border-indigo-100/70">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">
              🏦 Tài khoản nhận Hoàn thuế (JPY)
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700">
              {isYuchoBank ? 'ゆうちょ銀行 (Yucho)' : 'Ngân hàng thường (銀行)'}
            </span>
          </div>
          <div className="space-y-0.5">
            <InfoRow
              icon={Building}
              label="Tên Ngân hàng & Chi nhánh"
              value={`${bankName || 'Chưa cập nhật'} ${branchName ? `(${branchName})` : ''}`}
            />
            {isYuchoBank ? (
              <>
                <InfoRow icon={CreditCard} label="Ký hiệu Kigo (5 số)" value={yuchoKigo || 'Chưa nhập'} mono />
                <InfoRow icon={CreditCard} label="Số hiệu Bango (7 số)" value={yuchoBango || 'Chưa nhập'} mono />
              </>
            ) : (
              <>
                <InfoRow
                  icon={CreditCard}
                  label="Loại TK & Số tài khoản (7 số)"
                  value={`${bankAccountType === 'CURRENT' ? '当座 (Vãng lai)' : '普通 (Thường)'} - ${accountNumber || 'Chưa nhập'}`}
                  mono
                />
              </>
            )}
            <InfoRow
              icon={UserCheck}
              label="Chủ tài khoản (Katakana)"
              value={accountNameKatakana || accountName || 'Chưa cập nhật'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
