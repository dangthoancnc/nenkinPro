'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, CheckCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Vui lòng nhập đầy đủ các trường thông tin');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    setLoading(true);
    const tid = toast.loading('Đang đổi mật khẩu...');

    try {
      const res = await fetch('/api/auth/employee/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Đổi mật khẩu thất bại');
      }

      toast.success(data.message || 'Đổi mật khẩu thành công!', { id: tid });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi hệ thống', { id: tid });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Đổi Mật Khẩu Cá Nhân</h3>
              <p className="text-[11px] text-slate-500">Cập nhật mật khẩu đăng nhập vào hệ thống</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Mật khẩu hiện tại */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Mật khẩu hiện tại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu đang dùng"
                className="pr-9 h-9 text-xs"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="pr-9 h-9 text-xs"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="pr-9 h-9 text-xs"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật Mật khẩu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
