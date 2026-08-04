'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, AlertCircle, ArrowRightLeft, X, Loader2 } from 'lucide-react';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  staffCode: string | null;
}

interface TransferApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  currentAssignedUser?: {
    id: string;
    name: string;
  } | null;
  customerName?: string;
  onSuccess: () => void;
}

export function TransferApplicationModal({
  isOpen,
  onClose,
  applicationId,
  currentAssignedUser,
  customerName,
  onSuccess,
}: TransferApplicationModalProps) {
  const [staffs, setStaffs] = useState<StaffUser[]>([]);
  const [loadingStaffs, setLoadingStaffs] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedStaffId(currentAssignedUser?.id || '');
      setNote('');
      setErrorMsg('');
      fetchStaffs();
    }
  }, [isOpen, currentAssignedUser]);

  async function fetchStaffs() {
    setLoadingStaffs(true);
    try {
      const res = await fetch('/api/staffs/list');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setStaffs(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
    } finally {
      setLoadingStaffs(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/applications/${applicationId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedUserId: selectedStaffId || null,
          note: note.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Có lỗi xảy ra khi bàn giao hồ sơ');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi hệ thống');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-base">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
            <span>Bàn giao / Chuyển hồ sơ</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {customerName && (
            <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100/80 text-xs text-indigo-900 flex items-center justify-between">
              <span className="font-medium text-slate-600">Khách hàng:</span>
              <span className="font-semibold text-indigo-700">{customerName}</span>
            </div>
          )}

          {/* Current Assignee info */}
          <div className="text-xs text-slate-500 flex items-center justify-between px-1">
            <span>Người phụ trách hiện tại:</span>
            <span className="font-semibold text-slate-700">
              {currentAssignedUser ? (
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <UserCheck className="w-3.5 h-3.5" />
                  {currentAssignedUser.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <UserX className="w-3.5 h-3.5" />
                  Chưa gán
                </span>
              )}
            </span>
          </div>

          {/* Select Staff */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chọn nhân viên tiếp nhận <span className="text-red-500">*</span>
            </label>
            {loadingStaffs ? (
              <div className="flex items-center gap-2 p-2.5 text-xs text-slate-500 border rounded-lg bg-slate-50">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Đang tải danh sách nhân viên...</span>
              </div>
            ) : (
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full h-10 px-3 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">-- Chưa gán (Bỏ phân công) --</option>
                {staffs.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.staffCode || 'Staff'}) - {staff.role === 'ADMIN' ? 'Quản trị' : 'Quản lý'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Transfer Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ghi chú / Lý do bàn giao
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Bận nghỉ phép, chuyển hồ sơ Lần 2 cho bộ phận chuyên trách..."
              rows={3}
              className="w-full p-3 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none placeholder:text-slate-400"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Xác nhận chuyển</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
