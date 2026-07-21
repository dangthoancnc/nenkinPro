import React, { useEffect, useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { ApplicationStatus } from '@prisma/client';
import { Save, AlertCircle, Clock, Send, Wallet, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface Props {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  isEditing: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Cần duyệt', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertCircle },
  DRAFT: { label: 'Bản nháp', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock },
  SENT_1ST: { label: 'Đã gửi Lần 1', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send },
  RECEIVED_1ST: { label: 'Đã nhận Lần 1', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Wallet },
  SENT_2ND: { label: 'Đã gửi Lần 2', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Send },
  RECEIVED_2ND: { label: 'Đã nhận Lần 2', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Wallet },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
};

export function RightApplicationSection({ register, errors, watch, setValue, isEditing }: Props) {
  const currentStatus = watch('status') || 'DRAFT';
  const received1 = watch('received1stJpy') || 0;
  const received2 = watch('received2ndJpy') || 0;
  const exchangeRate = watch('exchangeRate') || 0;
  const serviceFeeJpy = watch('serviceFeeJpy') || 0;

  const calculateFees = () => {
    const totalReceived = parseFloat(received1.toString()) + parseFloat(received2.toString());
    const rate = parseFloat(exchangeRate.toString()) || 165;
    const feeJpy = totalReceived * 0.2; // 20%
    const feeVnd = feeJpy * rate;
    
    setValue('serviceFeeJpy', feeJpy);
    setValue('serviceFeeVnd', feeVnd);
    if (!exchangeRate) setValue('exchangeRate', rate);
  };

  return (
    <div className="h-full flex flex-col bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-white/40 shrink-0 bg-gradient-to-r from-blue-50/50 to-transparent">
        <h2 className="text-xl font-semibold tracking-tight text-slate-800">Trạng thái Hồ sơ & Thuế</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Status Section */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 block">Tiến độ hồ sơ</label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(statusConfig).filter(k => k !== 'PENDING' && k !== 'CANCELLED').map(key => {
              const conf = statusConfig[key];
              const Icon = conf.icon;
              const isActive = currentStatus === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!isEditing}
                  onClick={() => setValue('status', key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isActive ? `${conf.color} ring-2 ring-blue-500/20 shadow-sm` : 'bg-white/50 text-slate-500 border-slate-200 hover:bg-slate-50'
                  } ${!isEditing && !isActive ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {conf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dates Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Ngày nộp Lần 1</label>
            <Input type="date" {...register('sent1stDate')} disabled={!isEditing} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Ngày nhận Lần 1</label>
            <Input type="date" {...register('received1stDate')} disabled={!isEditing} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Ngày nộp Lần 2</label>
            <Input type="date" {...register('sent2ndDate')} disabled={!isEditing} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Ngày nhận Lần 2</label>
            <Input type="date" {...register('received2ndDate')} disabled={!isEditing} />
          </div>
        </div>

        {/* Financial Section */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-md font-semibold text-slate-800 flex items-center justify-between">
            Thông tin Tài chính
            {isEditing && (
              <button type="button" onClick={calculateFees} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 font-medium transition-colors">
                Tính phí tự động (20%)
              </button>
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Dự kiến tổng (JPY)</label>
              <Input type="number" {...register('totalExpectedJpy')} disabled={!isEditing} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Tỷ giá (VND/JPY)</label>
              <Input type="number" step="0.01" {...register('exchangeRate')} disabled={!isEditing} />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Đã nhận Lần 1 (JPY)</label>
              <Input type="number" {...register('received1stJpy')} disabled={!isEditing} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Đã nhận Lần 2 (JPY)</label>
              <Input type="number" {...register('received2ndJpy')} disabled={!isEditing} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 text-blue-700">Phí dịch vụ (JPY)</label>
              <Input type="number" className="bg-blue-50/50" {...register('serviceFeeJpy')} disabled={!isEditing} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 text-emerald-700">Phí dịch vụ (VND)</label>
              <Input type="number" className="bg-emerald-50/50" {...register('serviceFeeVnd')} disabled={!isEditing} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
