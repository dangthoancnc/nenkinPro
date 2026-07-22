'use client'

import React, { useState, useCallback } from 'react'
import {
  CheckCircle2, AlertTriangle, MinusCircle,
  RefreshCw, Download, Loader2, ExternalLink,
  ChevronDown, ChevronUp, Zap, DatabaseZap,
  ShieldCheck, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaxOfficeData } from './TaxOfficeCard'

// ─── Types ──────────────────────────────────────────────────────────────
export interface NtaLookupData {
  name:                 string
  romajiName?:          string | null
  postalCode:           string
  address:              string
  phone?:               string | null
  mailingName?:         string | null
  mailingPostalCode?:   string | null
  mailingAddress?:      string | null
  jurisdiction?:        string | null
  consultationPhone?:   string | null
  generalPhone?:        string | null
  ntaPageUrl?:          string | null
}

export interface TaxOfficeDiffPanelProps {
  /** Dữ liệu hiện tại trong DB */
  dbData:         TaxOfficeData
  /** Mã bưu điện KH — dùng pre-fill query */
  postalCode?:    string
  /** Callback gọi khi user chọn Sync toàn bộ hoặc field đơn lẻ */
  onSyncFields:   (patch: Partial<TaxOfficeData>) => Promise<void>
  /** Đóng panel */
  onClose:        () => void
  className?:     string
}

type MatchStatus = 'match' | 'mismatch' | 'missing'
type SyncState  = 'idle' | 'syncing' | 'done' | 'error'

// ─── Field definitions ───────────────────────────────────────────────────
const DIFF_FIELDS: {
  key:       keyof NtaLookupData & keyof TaxOfficeData
  label:     string
  group:     'office' | 'mailing' | 'contact'
  important?: boolean
}[] = [
  // Office
  { key: 'name',               label: 'Tên cục thuế',        group: 'office',  important: true },
  { key: 'postalCode',         label: 'Mã bưu điện VP',      group: 'office',  important: true },
  { key: 'address',            label: 'Địa chỉ VP',            group: 'office',  important: true },
  { key: 'phone',              label: 'SĐT chính',            group: 'office'  },
  { key: 'jurisdiction',       label: 'Khu vực quản lý',     group: 'contact' },
  // Mailing
  { key: 'mailingName',        label: 'Nơi nhận hồ sơ',       group: 'mailing', important: true },
  { key: 'mailingPostalCode',  label: 'Mã bưu điện nhận',   group: 'mailing', important: true },
  { key: 'mailingAddress',     label: 'Địa chỉ nhận',          group: 'mailing', important: true },
  // Contacts
  { key: 'consultationPhone',  label: 'SĐT tư vấn thuế',    group: 'contact' },
  { key: 'generalPhone',       label: 'SĐT hành chính',      group: 'contact' },
]

const GROUP_LABELS: Record<string, string> = {
  office:  '✉️ Thông tin văn phòng',
  mailing: '📦 Địa chỉ nhận hồ sơ',
  contact: '📞 Liên hệ bổ sung',
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function matchStatus(nta?: string | null, db?: string | null): MatchStatus {
  const a = nta?.trim()
  const b = db?.trim()
  if (!a && !b) return 'missing'
  if (!a || !b) return 'mismatch'
  return a === b ? 'match' : 'mismatch'
}

const STATUS_CONFIG: Record<MatchStatus, {
  icon: React.ElementType
  iconClass: string
  cellClass: string
  textClass: string
}> = {
  match:    { icon: CheckCircle2, iconClass: 'text-emerald-500', cellClass: 'bg-white',           textClass: 'text-slate-700'  },
  mismatch: { icon: AlertTriangle, iconClass: 'text-amber-500',  cellClass: 'bg-amber-50/60',     textClass: 'text-amber-900 font-semibold' },
  missing:  { icon: MinusCircle,   iconClass: 'text-slate-300',  cellClass: 'bg-slate-50/50',     textClass: 'text-slate-300 italic' },
}

// ─── Sub: GroupDivider ───────────────────────────────────────────────────
function GroupDivider({ label }: { label: string }) {
  return (
    <div className="col-span-2 px-3 py-1 bg-slate-100/80 border-b border-slate-200">
      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </span>
    </div>
  )
}

// ─── Sub: DiffRow ──────────────────────────────────────────────────────────
function DiffRow({
  label, ntaValue, dbValue, important,
  syncState, onSyncField,
}: {
  label:        string
  ntaValue?:    string | null
  dbValue?:     string | null
  important?:   boolean
  syncState:    SyncState
  onSyncField:  () => void
}) {
  const status = matchStatus(ntaValue, dbValue)
  const cfg    = STATUS_CONFIG[status]
  const Icon   = cfg.icon

  return (
    <>
      {/* NTA cell */}
      <div className={cn(
        'px-3 py-2 flex items-start justify-between gap-1.5 border-b border-slate-100',
        cfg.cellClass,
      )}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[9px] text-slate-400 font-medium">{label}</span>
            {important && (
              <span className="text-[8px] font-bold text-indigo-400 bg-indigo-50
                               px-1 py-0 rounded-sm">KEY</span>
            )}
          </div>
          <p className={cn('text-[11px] leading-snug break-words', cfg.textClass)}>
            {ntaValue || '—'}
          </p>
        </div>
        <Icon className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', cfg.iconClass)} />
      </div>

      {/* DB cell + sync button */}
      <div className={cn(
        'px-3 py-2 border-b border-l border-slate-100 flex items-start gap-1.5',
        cfg.cellClass,
      )}>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] text-slate-400 font-medium mb-0.5">{label}</p>
          <p className={cn('text-[11px] leading-snug break-words', cfg.textClass)}>
            {dbValue || '—'}
          </p>
        </div>

        {/* Per-field sync button — only show on mismatch */}
        {status === 'mismatch' && ntaValue && (
          <button
            type="button"
            onClick={onSyncField}
            disabled={syncState === 'syncing'}
            title={`Cập nhật “${label}” từ NTA`}
            className={cn(
              'flex-shrink-0 flex items-center gap-0.5 text-[9px] font-bold
               px-1.5 py-0.5 rounded-md mt-0.5 transition-all',
              syncState === 'done'
                ? 'text-emerald-700 bg-emerald-100'
                : syncState === 'error'
                ? 'text-rose-600 bg-rose-50'
                : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white',
            )}
          >
            {syncState === 'syncing' ? (
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
            ) : syncState === 'done' ? (
              <CheckCircle2 className="w-2.5 h-2.5" />
            ) : (
              <Download className="w-2.5 h-2.5" />
            )}
          </button>
        )}
      </div>
    </>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────
export function TaxOfficeDiffPanel({
  dbData,
  postalCode,
  onSyncFields,
  onClose,
  className,
}: TaxOfficeDiffPanelProps) {
  const [ntaData,       setNtaData]       = useState<NtaLookupData | null>(null)
  const [fetchState,    setFetchState]    = useState<'idle' | 'loading' | 'error'>('idle')
  const [fetchError,    setFetchError]    = useState<string | null>(null)
  const [zipInput,      setZipInput]      = useState(postalCode ?? dbData.postalCode ?? '')
  const [syncAllState,  setSyncAllState]  = useState<SyncState>('idle')
  const [fieldSyncs,    setFieldSyncs]    = useState<Record<string, SyncState>>({})
  const [showContact,   setShowContact]   = useState(false)

  // ── Lookup NTA ───────────────────────────────────────────────
  const lookup = useCallback(async () => {
    const zip = zipInput.replace(/[-\s]/g, '')
    if (zip.length !== 7) return
    setFetchState('loading')
    setFetchError(null)
    setNtaData(null)
    setFieldSyncs({})
    setSyncAllState('idle')
    try {
      const res  = await fetch(`/api/tax-offices/nta-lookup?zip=${zip}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setNtaData(json.data as NtaLookupData)
      setFetchState('idle')
    } catch (err: unknown) {
      setFetchError((err as Error).message)
      setFetchState('error')
    }
  }, [zipInput])

  // ── Sync single field ──────────────────────────────────────────
  const syncField = useCallback(async (
    key:      keyof NtaLookupData & keyof TaxOfficeData,
    ntaValue: string,
  ) => {
    setFieldSyncs(prev => ({ ...prev, [key]: 'syncing' }))
    try {
      await onSyncFields({ [key]: ntaValue })
      setFieldSyncs(prev => ({ ...prev, [key]: 'done' }))
    } catch {
      setFieldSyncs(prev => ({ ...prev, [key]: 'error' }))
    }
  }, [onSyncFields])

  // ── Sync ALL mismatched fields ───────────────────────────────
  const syncAll = useCallback(async () => {
    if (!ntaData) return
    setSyncAllState('syncing')
    const patch: Partial<TaxOfficeData> = {}
    for (const { key } of DIFF_FIELDS) {
      const ntaVal = ntaData[key]
      if (ntaVal && matchStatus(ntaVal as string, dbData[key] as string) === 'mismatch') {
        (patch as Record<string, unknown>)[key] = ntaVal
      }
    }
    if (Object.keys(patch).length === 0) {
      setSyncAllState('done')
      return
    }
    try {
      await onSyncFields(patch)
      setSyncAllState('done')
      // Mark all synced fields as done
      const synced: Record<string, SyncState> = {}
      for (const k of Object.keys(patch)) synced[k] = 'done'
      setFieldSyncs(prev => ({ ...prev, ...synced }))
    } catch {
      setSyncAllState('error')
    }
  }, [ntaData, dbData, onSyncFields])

  // ── Stats ──────────────────────────────────────────────────────
  const stats = ntaData ? (() => {
    let match = 0, mismatch = 0, missing = 0
    for (const { key } of DIFF_FIELDS) {
      const s = matchStatus(ntaData[key] as string, dbData[key] as string)
      if (s === 'match')    match++
      else if (s === 'mismatch') mismatch++
      else missing++
    }
    return { match, mismatch, missing }
  })() : null

  const allSynced = stats ? stats.mismatch === 0 : false

  // Groups to render
  const visibleGroups: Array<'office' | 'mailing' | 'contact'> =
    showContact ? ['office', 'mailing', 'contact'] : ['office', 'mailing']

  return (
    <div className={cn(
      'rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm',
      className,
    )}>

      {/* ── Header ───────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2
                      bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            Đối chiếu NTA vs DB
          </span>
          {stats && (
            <div className="flex items-center gap-1 ml-1">
              {stats.match > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                                 bg-emerald-500/20 text-emerald-300">
                  ✓ {stats.match}
                </span>
              )}
              {stats.mismatch > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                                 bg-amber-500/20 text-amber-300">
                  ⚠ {stats.mismatch}
                </span>
              )}
              {stats.missing > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                                 bg-slate-500/20 text-slate-400">
                  — {stats.missing}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          type="button" onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-0.5 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Lookup bar ──────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center flex-1 gap-1.5
                        bg-white border border-slate-200 rounded-lg
                        focus-within:border-indigo-400 focus-within:ring-2
                        focus-within:ring-indigo-100 px-2.5 h-8">
          <DatabaseZap className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <input
            value={zipInput}
            onChange={e => setZipInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="Mã bưu điện (VD: 593-8511)"
            className="flex-1 text-xs outline-none bg-transparent text-slate-700
                       placeholder:text-slate-300"
          />
        </div>
        <button
          type="button"
          onClick={lookup}
          disabled={fetchState === 'loading'}
          className="flex items-center gap-1 text-[11px] font-bold text-white
                     bg-indigo-600 hover:bg-indigo-700
                     px-3 h-8 rounded-lg transition-all
                     disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
        >
          {fetchState === 'loading'
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Đang tra...</>
            : <><RefreshCw className="w-3 h-3" /> Tra cứu NTA</>
          }
        </button>
      </div>

      {/* ── Error ───────────────────────────────────────── */}
      {fetchState === 'error' && fetchError && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-50 border-b border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-rose-700 leading-snug">{fetchError}</p>
        </div>
      )}

      {/* ── Idle state ──────────────────────────────────────── */}
      {fetchState === 'idle' && !ntaData && (
        <div className="flex flex-col items-center gap-2 py-6 text-center px-4">
          <DatabaseZap className="w-7 h-7 text-slate-200" />
          <p className="text-[11px] text-slate-400 font-medium">
            Nhập mã bưu điện và nhấn <strong>Tra cứu NTA</strong> để so sánh dữ liệu.
          </p>
          <p className="text-[10px] text-slate-300">
            Dữ liệu lấy trực tiếp từ trang chính thức NTA Nhật Bản.
          </p>
        </div>
      )}

      {/* ── Diff table ───────────────────────────────────────── */}
      {ntaData && (
        <>
          {/* Column headers */}
          <div className="grid grid-cols-2 border-b border-slate-200">
            <div className="px-3 py-1.5 bg-amber-50 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-500" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700">
                NTA (thực tế)
              </span>
              {ntaData.ntaPageUrl && (
                <a
                  href={ntaData.ntaPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-amber-400 hover:text-amber-600"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 border-l border-slate-200
                            flex items-center gap-1.5">
              <DatabaseZap className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                Hệ thống DB
              </span>
            </div>
          </div>

          {/* Rows grouped */}
          <div className="grid grid-cols-2">
            {visibleGroups.map(group => {
              const rows = DIFF_FIELDS.filter(f => f.group === group)
              return (
                <React.Fragment key={group}>
                  <GroupDivider label={GROUP_LABELS[group]} />
                  {rows.map(({ key, label, important }) => (
                    <DiffRow
                      key={key}
                      label={label}
                      ntaValue={ntaData[key] as string | null | undefined}
                      dbValue={dbData[key] as string | null | undefined}
                      important={important}
                      syncState={fieldSyncs[key] ?? 'idle'}
                      onSyncField={() =>
                        syncField(
                          key as keyof NtaLookupData & keyof TaxOfficeData,
                          ntaData[key] as string,
                        )
                      }
                    />
                  ))}
                </React.Fragment>
              )
            })}
          </div>

          {/* Toggle contact group */}
          <button
            type="button"
            onClick={() => setShowContact(v => !v)}
            className="flex items-center gap-1 w-full px-3 py-1.5
                       text-[9px] font-semibold text-slate-500 hover:text-indigo-600
                       bg-slate-50 border-t border-slate-200 transition-colors"
          >
            {showContact
              ? <><ChevronUp className="w-3 h-3" /> Ẩn liên hệ bổ sung</>
              : <><ChevronDown className="w-3 h-3" /> Xem liên hệ bổ sung</>
            }
          </button>

          {/* ── Action bar */}
          <div className="flex items-center justify-between gap-2
                          px-3 py-2 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center gap-1.5">
              {allSynced ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Dữ liệu khớp hoàn toàn
                </span>
              ) : stats?.mismatch ? (
                <span className="text-[10px] text-amber-700">
                  {stats.mismatch} trường khác biệt
                </span>
              ) : null}
            </div>

            {!allSynced && stats && stats.mismatch > 0 && (
              <button
                type="button"
                onClick={syncAll}
                disabled={syncAllState === 'syncing'}
                className={cn(
                  'flex items-center gap-1.5 text-[11px] font-bold
                   px-3 py-1.5 rounded-lg transition-all shadow-sm',
                  syncAllState === 'syncing'
                    ? 'bg-indigo-400 text-white cursor-not-allowed'
                    : syncAllState === 'done'
                    ? 'bg-emerald-600 text-white'
                    : syncAllState === 'error'
                    ? 'bg-rose-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white',
                )}
              >
                {syncAllState === 'syncing' ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Đang đồng bộ...</>
                ) : syncAllState === 'done' ? (
                  <><CheckCircle2 className="w-3 h-3" /> Đã đồng bộ</>
                ) : (
                  <><Download className="w-3 h-3" /> Sync tất cả NTA → DB</>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
