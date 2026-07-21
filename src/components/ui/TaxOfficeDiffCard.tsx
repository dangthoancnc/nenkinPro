"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, AlertTriangle, MinusCircle } from "lucide-react"

export type DiffField = {
  key: string
  label: string
  ntaValue?: string | null
  dbValue?: string | null
}

type MatchStatus = "match" | "mismatch" | "missing"

function getMatchStatus(a?: string | null, b?: string | null): MatchStatus {
  const av = a?.trim()
  const bv = b?.trim()
  if (!av && !bv) return "missing"
  if (!av || !bv) return "mismatch"
  return av === bv ? "match" : "mismatch"
}

const StatusIcon = ({ status }: { status: MatchStatus }) => {
  if (status === "match")
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
  if (status === "mismatch")
    return <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
  return <MinusCircle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
}

interface TaxOfficeDiffCardProps {
  fields: DiffField[]
  className?: string
}

export function TaxOfficeDiffCard({ fields, className }: TaxOfficeDiffCardProps) {
  const totalMismatch = fields.filter(
    (f) => getMatchStatus(f.ntaValue, f.dbValue) === "mismatch"
  ).length

  return (
    <div className={cn("rounded-xl border border-slate-200 overflow-hidden", className)}>
      {/* Header */}
      <div className="grid grid-cols-2">
        <div className="px-3 py-2 bg-amber-50 border-b border-slate-200 flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-800">
            ⚡ Thực tế NTA
          </span>
        </div>
        <div className="px-3 py-2 bg-emerald-50 border-b border-l border-slate-200 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
            🗄 Hệ thống DB
          </span>
          {totalMismatch > 0 && (
            <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200">
              {totalMismatch} sai lệch
            </span>
          )}
        </div>
      </div>

      {/* Rows */}
      {fields.map((field, i) => {
        const status = getMatchStatus(field.ntaValue, field.dbValue)
        const isLast = i === fields.length - 1

        return (
          <div
            key={field.key}
            className={cn("grid grid-cols-2", !isLast && "border-b border-slate-100")}
          >
            {/* NTA cell */}
            <div
              className={cn(
                "px-3 py-2 flex items-start justify-between gap-1",
                status === "mismatch" && "bg-amber-50",
                status === "match" && "bg-white",
                status === "missing" && "bg-slate-50"
              )}
            >
              <div className="min-w-0">
                <div className="text-[9px] text-slate-400 font-medium mb-0.5">{field.label}</div>
                <div
                  className={cn(
                    "text-[11px] font-semibold truncate",
                    status === "mismatch" && "text-amber-800",
                    status === "match" && "text-slate-700",
                    status === "missing" && "text-slate-300 italic"
                  )}
                >
                  {field.ntaValue || "—"}
                </div>
              </div>
              <StatusIcon status={status} />
            </div>

            {/* DB cell */}
            <div
              className={cn(
                "px-3 py-2 border-l border-slate-100",
                status === "mismatch" && "bg-amber-50",
                status === "match" && "bg-white",
                status === "missing" && "bg-slate-50"
              )}
            >
              <div className="text-[9px] text-slate-400 font-medium mb-0.5">{field.label}</div>
              <div
                className={cn(
                  "text-[11px] font-semibold truncate",
                  status === "mismatch" && "text-amber-800",
                  status === "match" && "text-emerald-700",
                  status === "missing" && "text-slate-300 italic"
                )}
              >
                {field.dbValue || "—"}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
