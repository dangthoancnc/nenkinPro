'use client'

import React, { useState, useCallback } from 'react'
import {
  Building2, MapPin, Phone, Globe, Mail, Printer,
  Copy, Check, ChevronDown, ChevronUp, ExternalLink,
  AlertCircle, PackageOpen, Pencil, GitCompare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────
export interface TaxOfficeData {
  id:                 string
  name:               string
  romajiName?:        string | null
  address:            string
  romajiAddress?:     string | null
  postalCode:         string
  phone?:             string | null
  mapUrl?:            string | null
  websiteUrl?:        string | null
  receptionInfo?:     string | null
  notes?:             string | null
  // --- Mailing (in tem phiếu) ---
  mailingName?:       string | null
  mailingPostalCode?: string | null
  mailingAddress?:    string | null
  // --- Extra contacts ---
  jurisdiction?:      string | null
  consultationPhone?: string | null
  generalPhone?:      string | null
}

export interface TaxOfficeCardProps {
  /** Dữ liệu cục thuế từ DB — null = chưa xác định */
  taxOffice:  TaxOfficeData | null
  isEditing?: boolean
  onEdit?:    () => void
  onDiff?:    () => void
  className?: string
}

// ─── useCopy ───────────────────────────────────────────────────────────────
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

// ─── InfoRow ───────────────────────────────────────────────────────────────
function InfoRow({
  icon: Icon, label, value, mono, href,
}: {
  icon: React.ElementType
  label: string
  value: string
  mono?: boolean
  href?: string
}) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <Icon className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide leading-none mb-0.5">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5"
          >
            {value} <ExternalLink className="w-2.5 h-2.5" />
          </a>
        ) : (
          <p className={cn(
            'text-[11px] text-slate-700 break-words leading-snug whitespace-pre-line',
            mono && 'font-mono tracking-wider text-slate-800',
          )}>
            {value}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── MailingLabel ──────────────────────────────────────────────────────────
function MailingLabel({
  name, postalCode, address,
}: { name: string; postalCode: string; address: string }) {
  const labelText = `〒${postalCode}\n${address}\n${name} 御中`
  const { copied, copy } = useCopy(labelText)

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=400,height=260')
    if (!w) return
    w.document.write(`
      <html><head><title>Tem phiếu gửi hồ sơ</title>
      <style>
        body { font-family: 'MS Gothic','Meiryo',monospace; padding: 24px; }
        .postal  { font-size:22px; font-weight:bold; letter-spacing:4px; margin-bottom:8px; }
        .address { font-size:15px; line-height:1.8; }
        .recip   { font-size:18px; font-weight:bold; margin-top:12px; }
        @media print { body { margin:0; padding:16px; } }
      </style></head><body>
      <div class="postal">〒${postalCode}</div>
      <div class="address">${address}</div>
      <div class="recip">${name} 御中</div>
      </body></html>
    `)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); w.close() }, 300)
  }

  return (
    <div className="rounded-lg border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-600 shrink-0">
        <div className="flex items-center gap-1.5">
          <Mail className="w-3 h-3 text-white" />
          <span className="text-[9px] font-bold text-white uppercase tracking-wider">
            Địa chỉ nhận hồ sơ · Tem phiếu
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copy}
            title="Sao chép địa chỉ"
            className="flex items-center gap-1 text-[9px] font-semibold text-indigo-100
                       hover:text-white bg-indigo-500/60 hover:bg-indigo-500
                       px-1.5 py-0.5 rounded transition-all"
          >
            {copied
              ? <><Check className="w-2.5 h-2.5" /> Đã chép</>
              : <><Copy className="w-2.5 h-2.5" /> Copy</>
            }
          </button>
          <button
            type="button"
            onClick={handlePrint}
            title="In tem phiếu"
            className="flex items-center gap-1 text-[9px] font-semibold text-indigo-100
                       hover:text-white bg-indigo-500/60 hover:bg-indigo-500
                       px-1.5 py-0.5 rounded transition-all"
          >
            <Printer className="w-2.5 h-2.5" /> In
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="px-3 py-3 flex-1 flex flex-col justify-center space-y-1">
        <p className="text-[13px] font-bold text-indigo-800 tracking-widest font-mono">
          〒{postalCode}
        </p>
        <p className="text-[11px] text-slate-700 leading-relaxed">{address}</p>
        <p className="text-[13px] font-bold text-indigo-700 pt-1">{name} 御中</p>
      </div>
    </div>
  )
}

// ─── EmptyMailingSlot ──────────────────────────────────────────────────────
function EmptyMailingSlot({ isEditing, onEdit }: { isEditing?: boolean; onEdit?: () => void }) {
  return (
    <div className="flex h-full min-h-[132px] flex-col items-center justify-center gap-2
                    rounded-lg border-2 border-dashed border-amber-200 bg-amber-50 px-3 py-4 text-center">
      <AlertCircle className="w-5 h-5 text-amber-400" />
      <p className="text-[10px] font-semibold text-amber-700">Chưa có địa chỉ nhận hồ sơ</p>
      <p className="text-[9px] leading-snug text-amber-500">
        Cần cập nhật để in tem phiếu gửi hồ sơ.
      </p>
      {isEditing && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="mt-1 rounded-md bg-amber-500 px-2.5 py-1 text-[9px] font-bold
                     text-white transition-colors hover:bg-amber-600"
        >
          Cập nhật ngay
        </button>
      )}
    </div>
  )
}

// ─── EmptyState ────────────────────────────────────────────────────────────
function EmptyState({ isEditing, onEdit }: { isEditing?: boolean; onEdit?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <PackageOpen className="w-8 h-8 text-slate-300" />
      <p className="text-[11px] text-slate-400 font-medium">Chưa xác định cục thuế</p>
      <p className="text-[10px] text-slate-300 leading-snug max-w-[180px]">
        Tra cứu mã bưu điện hoặc tìm theo NTA để gán cục thuế quản lý.
      </p>
      {isEditing && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-white
                     bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg
                     transition-colors shadow-sm"
        >
          <Pencil className="w-3 h-3" /> Tạo / Gán cục thuế
        </button>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────
export function TaxOfficeCard({
  taxOffice,
  isEditing,
  onEdit,
  onDiff,
  className,
}: TaxOfficeCardProps) {
  const [expanded, setExpanded] = useState(false)

  const hasMailingAddress =
    !!taxOffice?.mailingName &&
    !!taxOffice?.mailingPostalCode &&
    !!taxOffice?.mailingAddress

  const hasExtraContacts =
    !!taxOffice?.consultationPhone ||
    !!taxOffice?.generalPhone ||
    !!taxOffice?.jurisdiction

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm', className)}>

      {/* ── Card Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Cục thuế quản lý
          </span>
          {taxOffice ? (
            <span className="flex items-center gap-0.5 text-[9px] font-semibold
                             text-emerald-700 bg-emerald-50 border border-emerald-200
                             px-1.5 py-0.5 rounded-full">
              <Check className="w-2.5 h-2.5" /> Đã xác nhận
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-[9px] font-semibold
                             text-amber-700 bg-amber-50 border border-amber-200
                             px-1.5 py-0.5 rounded-full">
              <AlertCircle className="w-2.5 h-2.5" /> Chưa xác định
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {taxOffice && onDiff && (
            <button
              type="button"
              onClick={onDiff}
              className="flex items-center gap-0.5 text-[9px] font-semibold text-indigo-600
                         hover:text-white border border-indigo-200 hover:bg-indigo-600
                         px-2 py-0.5 rounded-md transition-all"
            >
              <GitCompare className="w-2.5 h-2.5" /> Đối chiếu AI
            </button>
          )}
          {isEditing && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-0.5 text-[9px] font-semibold
                         text-slate-600 hover:text-white border border-slate-200
                         hover:bg-indigo-600 hover:border-indigo-600
                         px-2 py-0.5 rounded-md transition-all"
            >
              <Pencil className="w-2.5 h-2.5" />
              {taxOffice ? 'Cập nhật' : 'Tạo mới'}
            </button>
          )}
        </div>
      </div>

      {/* ���─ Body ────────────────────────────────────────────── */}
      {!taxOffice ? (
        <EmptyState isEditing={isEditing} onEdit={onEdit} />
      ) : (
        <div className="p-3">

          {/* ═══ 2-COLUMN GRID ═══════════════════════════════ */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 items-start">

            {/* ── LEFT: Thông tin cục thuế ── */}
            <section className="flex flex-col gap-2">

              {/* Tên cục thuế */}
              <div>
                <p className="text-[14px] font-bold text-slate-800 leading-tight">
                  {taxOffice.name}
                </p>
                {taxOffice.romajiName && (
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5 tracking-wide">
                    {taxOffice.romajiName}
                  </p>
                )}
              </div>

              {/* Core info block */}
              <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 divide-y divide-slate-100">
                <InfoRow
                  icon={MapPin}
                  label="Địa chỉ quản lý"
                  value={`〒${taxOffice.postalCode}\n${taxOffice.address}`}
                />
                {taxOffice.romajiAddress && (
                  <InfoRow
                    icon={MapPin}
                    label="Địa chỉ Romaji"
                    value={taxOffice.romajiAddress}
                  />
                )}
                {taxOffice.phone && (
                  <InfoRow
                    icon={Phone}
                    label="Điện thoại"
                    value={taxOffice.phone}
                    mono
                  />
                )}
                {taxOffice.websiteUrl && (
                  <InfoRow
                    icon={Globe}
                    label="Website NTA"
                    value="Mở trang NTA"
                    href={taxOffice.websiteUrl}
                  />
                )}
                {taxOffice.mapUrl && (
                  <InfoRow
                    icon={ExternalLink}
                    label="Bản đồ"
                    value="Mở Google Maps"
                    href={taxOffice.mapUrl}
                  />
                )}
              </div>

              {/* Expandable extra contacts */}
              {(hasExtraContacts || taxOffice.receptionInfo || taxOffice.notes) && (
                <div>
                  <button
                    type="button"
                    onClick={() => setExpanded(v => !v)}
                    className="flex items-center gap-1 text-[9px] font-semibold
                               text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {expanded
                      ? <><ChevronUp className="w-3 h-3" /> Thu gọn</>
                      : <><ChevronDown className="w-3 h-3" /> Thêm thông tin</>
                    }
                  </button>
                  {expanded && (
                    <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 px-2.5 divide-y divide-slate-100">
                      {taxOffice.jurisdiction && (
                        <InfoRow icon={MapPin} label="Khu vực quản lý" value={taxOffice.jurisdiction} />
                      )}
                      {taxOffice.consultationPhone && (
                        <InfoRow icon={Phone} label="SĐT tư vấn" value={taxOffice.consultationPhone} mono />
                      )}
                      {taxOffice.generalPhone && (
                        <InfoRow icon={Phone} label="SĐT hành chính" value={taxOffice.generalPhone} mono />
                      )}
                      {taxOffice.receptionInfo && (
                        <InfoRow icon={Building2} label="Giờ tiếp nhận" value={taxOffice.receptionInfo} />
                      )}
                      {taxOffice.notes && (
                        <InfoRow icon={AlertCircle} label="Ghi chú" value={taxOffice.notes} />
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ── RIGHT: Địa chỉ nhận hồ sơ (tem phiếu) ── */}
            <section className="flex flex-col min-h-[132px]">
              {hasMailingAddress ? (
                <MailingLabel
                  name={taxOffice.mailingName!}
                  postalCode={taxOffice.mailingPostalCode!}
                  address={taxOffice.mailingAddress!}
                />
              ) : (
                <EmptyMailingSlot isEditing={isEditing} onEdit={onEdit} />
              )}
            </section>

          </div>
        </div>
      )}
    </div>
  )
}
