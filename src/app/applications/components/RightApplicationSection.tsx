"use client"

import React from "react"
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from "react-hook-form"
import { RefreshCw, Plus, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { ClientSummaryCard } from "./ClientSummaryCard"
import { TaxOfficeDiffCard, DiffField } from "@/components/ui/TaxOfficeDiffCard"

interface Props {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  watch: UseFormWatch<any>
  setValue: UseFormSetValue<any>
  isEditing: boolean
  /** Customer display data passed from parent page */
  customerCode?: string
  customerName?: string
  dob?: string
  nationality?: string
  /** Tax office diff data */
  taxOfficeDiff?: DiffField[]
  onSyncTaxOffice?: () => Promise<void>
  isSyncing?: boolean
}

export function RightApplicationSection({
  register,
  errors,
  watch,
  setValue,
  isEditing,
  customerCode,
  customerName,
  dob,
  nationality,
  taxOfficeDiff = [],
  onSyncTaxOffice,
  isSyncing = false,
}: Props) {
  return (
    <div className="h-full flex flex-col gap-3 overflow-y-auto">

      {/* ── Card 1: Client Summary + Timeline + Finance ── */}
      <ClientSummaryCard
        register={register}
        watch={watch}
        setValue={setValue}
        customerCode={customerCode}
        customerName={customerName}
        dob={dob}
        nationality={nationality}
        isEditing={isEditing}
      />

      {/* ── Card 2: Tax Office Management ─────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-shrink-0">

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Cục Thuế Quản Lý
          </span>
          <Button
            variant="primary"
            size="xs"
            iconLeft={<RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />}
            loading={isSyncing}
            onClick={onSyncTaxOffice}
            type="button"
          >
            Lưu đồng bộ
          </Button>
        </div>

        {/* Action buttons */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex gap-2">
          <Button variant="outline" size="xs" iconLeft={<MapPin className="w-3 h-3" />} className="flex-1" type="button">
            Tra cứu từ mã bưu điện KH
          </Button>
          <Button variant="secondary" size="xs" iconLeft={<MapPin className="w-3 h-3" />} className="flex-1" type="button">
            Tra cứu NTA thủ công
          </Button>
        </div>

        {/* Tax office selector */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
          <select
            {...register("taxOfficeId")}
            disabled={!isEditing}
            className="flex-1 h-8 px-2.5 text-[12px] font-semibold text-slate-700 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:cursor-default"
          >
            <option value="">— Chọn cục thuế —</option>
          </select>
          {isEditing && (
            <Button variant="secondary" size="xs" iconLeft={<Plus className="w-3 h-3" />} type="button">
              Mới
            </Button>
          )}
        </div>

        {/* Diff card */}
        <div className="px-4 py-3">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            ↔ Đối chiếu Cục Thuế
          </p>
          {taxOfficeDiff.length > 0 ? (
            <TaxOfficeDiffCard fields={taxOfficeDiff} />
          ) : (
            <div className="text-[11px] text-slate-300 text-center py-6 border border-dashed border-slate-200 rounded-xl">
              Chưa có dữ liệu đối chiếu<br/>
              <span className="text-[10px]">Nhấn "Tra cứu" để tải dữ liệu NTA</span>
            </div>
          )}
        </div>

        {/* Contact info row */}
        <div className="px-4 pb-3 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <Phone className="w-3 h-3" />
            <span className="font-mono">072-271-3441</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <MapPin className="w-3 h-3" />
            <span>大阪府堺市西区晴美台4丁390-1</span>
          </div>
        </div>

      </div>
    </div>
  )
}
