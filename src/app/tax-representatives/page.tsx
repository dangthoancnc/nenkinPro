'use client'

import React, { useState, useEffect } from 'react'
import { UserCheck, Plus, Search, Building, Phone, MapPin, CreditCard, Trash2, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { TaxRepresentativeForm } from '@/components/ui/TaxRepresentativeForm'
import type { TaxRepresentativeData } from '@/components/ui/TaxRepresentativeCard'

export default function TaxRepresentativesPage() {
  return (
    <React.Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><div className="animate-spin w-8 h-8 border-b-2 border-indigo-500 rounded-full"></div></div>}>
      <TaxRepresentativesPageInner />
    </React.Suspense>
  )
}

function TaxRepresentativesPageInner() {
  const [representatives, setRepresentatives] = useState<(TaxRepresentativeData & { _count?: { applications: number } })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingRep, setEditingRep] = useState<TaxRepresentativeData | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchRepresentatives = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/tax-representatives')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setRepresentatives(data.data)
      }
    } catch (e) {
      console.error('Error fetching tax representatives', e)
      toast.error('Lỗi tải danh sách người đại diện')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRepresentatives()
  }, [])

  const filtered = representatives.filter(rep => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      rep.fullName.toLowerCase().includes(q) ||
      (rep.fullNameKana && rep.fullNameKana.toLowerCase().includes(q)) ||
      (rep.bankName && rep.bankName.toLowerCase().includes(q)) ||
      rep.postalCode.includes(q) ||
      (rep.phone && rep.phone.includes(q))
    )
  })

  const handleFormSubmit = async (values: any, id?: string) => {
    setIsSubmitting(true)
    const isUpdate = !!id
    const url = isUpdate ? `/api/tax-representatives/${id}` : '/api/tax-representatives'
    const method = isUpdate ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi lưu dữ liệu')

      toast.success(isUpdate ? 'Cập nhật Người đại diện thành công!' : 'Thêm mới Người đại diện thành công!')
      setEditingRep(null)
      setShowAddForm(false)
      fetchRepresentatives()
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Người đại diện: ${name}?`)) return

    try {
      const res = await fetch(`/api/tax-representatives/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi xóa')

      toast.success('Đã xóa Người đại diện')
      fetchRepresentatives()
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xóa')
    }
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            Danh Mục Người Đại Diện Thuế (納税管理人)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý danh sách Người đại diện quản lý thuế tại Nhật và Tài khoản ngân hàng (JPY) nhận tiền hoàn thuế Lần 2.
          </p>
        </div>
        {!showAddForm && !editingRep && (
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
            iconLeft={<Plus className="w-4 h-4" />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            + Thêm Người Đại Diện
          </Button>
        )}
      </div>

      {/* Form Modal / Inline Box */}
      {(showAddForm || editingRep) && (
        <div className="mb-4">
          <TaxRepresentativeForm
            initialData={editingRep}
            isSubmitting={isSubmitting}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowAddForm(false)
              setEditingRep(null)
            }}
          />
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, Katakana, SĐT, ngân hàng..."
            className="pl-8 text-xs h-8"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border border-slate-200 shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 text-[11px]">
              <TableHead className="w-[180px]">Họ và Tên</TableHead>
              <TableHead>Địa chỉ tại Nhật</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Tài khoản Ngân hàng nhận JPY</TableHead>
              <TableHead className="text-center w-[90px]">Số hồ sơ</TableHead>
              <TableHead className="text-right w-[100px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-400">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-400">
                  Không tìm thấy người đại diện nào.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(rep => {
                const isYucho = rep.isYucho || rep.bankName?.includes('ゆうちょ')
                return (
                  <TableRow key={rep.id} className="text-xs hover:bg-slate-50/80">
                    <TableCell className="font-semibold text-slate-800">
                      <div>{rep.fullName}</div>
                      {rep.fullNameKana && (
                        <div className="text-[10px] text-slate-400 font-normal">{rep.fullNameKana}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-[10px] text-indigo-600 font-semibold">〒{rep.postalCode}</div>
                      <div className="text-slate-600 truncate max-w-xs" title={rep.address}>{rep.address}</div>
                    </TableCell>
                    <TableCell className="font-mono text-slate-600">
                      {rep.phone || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-700">
                        {rep.bankName || '—'} {rep.branchName ? `(${rep.branchName})` : ''}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        {isYucho
                          ? `Kigo: ${rep.yuchoKigo || ''} - Bango: ${rep.yuchoBango || ''}`
                          : `STK: ${rep.accountNumber || ''} (${rep.bankAccountType === 'CURRENT' ? '当座' : '普通'})`}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {rep._count?.applications || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRep(rep)
                          setShowAddForm(false)
                        }}
                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rep.id, rep.fullName)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
