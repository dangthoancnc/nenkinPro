import React, { useState } from 'react';
import { CustomerFormValues } from '@/lib/validations/customerSchema';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { UploadCloud, CheckCircle, AlertCircle, ZoomIn } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Props {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  customerData: any;
  ocrStatus: Record<string, string>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, docKey: string, urlField: string) => void;
  onImageClick: (url: string) => void;
  isEditing: boolean;
}

const DOCUMENTS = [
  { key: 'zairyuFront', title: 'Thẻ Ngoại Kiều (Mặt trước)', urlField: 'zairyuFrontUrl' },
  { key: 'zairyuBack', title: 'Thẻ Ngoại Kiều (Mặt sau)', urlField: 'zairyuBackUrl' },
  { key: 'passport', title: 'Hộ chiếu', urlField: 'passportUrl' },
  { key: 'nenkinBook', title: 'Sổ Nenkin', urlField: 'nenkinBookUrl' },
  { key: 'bankPassbook', title: 'Sổ Ngân hàng', urlField: 'bankPassbookUrl' },
];

export function CustomerProfileSection({ register, errors, setValue, customerData, ocrStatus, handleFileUpload, onImageClick, isEditing }: Props) {
  const [activeTab, setActiveTab] = useState('info');

  return (
    <div className="h-full flex flex-col bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_4px_24px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-white/40 shrink-0">
        <h2 className="text-xl font-semibold tracking-tight text-slate-800">Thông tin Khách hàng</h2>
      </div>

      <div className="flex px-6 border-b border-white/40 shrink-0 overflow-x-auto">
        <button type="button" onClick={() => setActiveTab('info')} className={`pb-3 pt-2 px-4 text-sm font-medium transition-colors ${activeTab === 'info' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Thông tin chung</button>
        <button type="button" onClick={() => setActiveTab('docs')} className={`pb-3 pt-2 px-4 text-sm font-medium transition-colors ${activeTab === 'docs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Tài liệu / Hình ảnh</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Họ và tên *</label>
              <Input {...register('fullName')} disabled={!isEditing} className={errors.fullName ? 'border-rose-400' : ''} />
              {errors.fullName && <span className="text-xs text-rose-500">{errors.fullName.message as string}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Ngày sinh *</label>
              <Input type="date" {...register('dob')} disabled={!isEditing} className={errors.dob ? 'border-rose-400' : ''} />
              {errors.dob && <span className="text-xs text-rose-500">{errors.dob.message as string}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Quốc tịch</label>
              <Input {...register('nationality')} disabled={!isEditing} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Mã số cá nhân (My Number)</label>
              <Input {...register('myNumber')} disabled={!isEditing} />
            </div>
            <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Địa chỉ trên thẻ ngoại kiều</label>
              <Input {...register('zairyuAddress')} disabled={!isEditing} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Số thẻ ngoại kiều</label>
              <Input {...register('cardNumber')} disabled={!isEditing} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Mã số Nenkin</label>
              <Input {...register('nenkinNumber')} disabled={!isEditing} />
            </div>
            <h3 className="col-span-1 md:col-span-2 text-md font-semibold text-slate-800 mt-4 border-t pt-4">Thông tin Ngân hàng</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Tên ngân hàng</label>
              <Input {...register('bankName')} disabled={!isEditing} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Tên chi nhánh</label>
              <Input {...register('branchName')} disabled={!isEditing} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Số tài khoản</label>
              <Input {...register('accountNumber')} disabled={!isEditing} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Tên chủ tài khoản</label>
              <Input {...register('accountName')} disabled={!isEditing} />
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-6">
            {DOCUMENTS.map(doc => {
              const url = customerData?.[doc.urlField];
              const status = ocrStatus[doc.key];
              
              return (
                <div key={doc.key} className="bg-white/50 border border-slate-200/60 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-800">{doc.title}</h3>
                    <div className="flex items-center gap-2">
                      {isEditing && (
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                          <UploadCloud className="w-4 h-4" />
                          Tải lên
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, doc.key, doc.urlField)} disabled={!isEditing} />
                        </label>
                      )}
                    </div>
                  </div>
                  
                  {url ? (
                    <div className="relative aspect-[3/2] bg-slate-100 rounded-xl overflow-hidden group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={doc.title} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button type="button" onClick={() => onImageClick(url)} className="p-3 bg-white text-slate-800 rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition-all hover:bg-slate-50">
                          <ZoomIn className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/2] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 flex-col gap-2">
                      <UploadCloud className="w-8 h-8 opacity-50" />
                      <span className="text-sm font-medium">Chưa có ảnh</span>
                    </div>
                  )}
                  {status === 'processing' && <span className="text-xs text-blue-600 flex items-center gap-1"><span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/> Đang tải lên...</span>}
                  {status === 'done' && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Đã tải lên</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
