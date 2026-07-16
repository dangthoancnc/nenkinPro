/**
 * DonXinForm
 * Form nhập liệu để xuất biểu mẫu 脱退一時金 (don_xin)
 *
 * Author: PE (Perplexity) — Sprint 5
 *
 * Props:
 *   applicationId  — ID của application trong DB (bắt buộc)
 *   applicantName  — Tên hiển thị (tuỳ chọn, dùng để xác nhận)
 *   onSuccess      — Callback khi download thành công
 */

'use client';

import React, { useState } from 'react';
import { useGenerateDoc, type TemplateType } from '@/hooks/useGenerateDoc';

interface DonXinFormProps {
  applicationId: string;
  applicantName?: string;
  onSuccess?: (templateType: TemplateType) => void;
}

const TEMPLATE_OPTIONS: { value: TemplateType; label: string; desc: string }[] = [
  { value: 'don_xin_lan_1', label: '脱退一時金請求書', desc: 'Đơn xin lĩnh một lần' },
  { value: 'ininjyo_yoshiki_lan_1', label: '委任状', desc: 'Giấy uỷ thác' },
  { value: 'nouzeikanrinin', label: '納税管理人届出書', desc: 'Đơn đăng ký người quản lý nộp thuế' },
];

export default function DonXinForm({ applicationId, applicantName, onSuccess }: DonXinFormProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('don_xin_lan_1');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { generate, isLoading, error, clearError } = useGenerateDoc();

  const selectedLabel = TEMPLATE_OPTIONS.find(t => t.value === selectedTemplate)?.label ?? '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg(null);
    clearError();

    const ok = await generate({ applicationId, templateType: selectedTemplate });
    if (ok) {
      setSuccessMsg(`「${selectedLabel}」のダウンロードが完了しました。`);
      onSuccess?.(selectedTemplate);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          書類出力 — 脱退一時金申請
        </h2>
        {applicantName && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            申請者: <span className="font-medium text-gray-700 dark:text-gray-200">{applicantName}</span>
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Application ID: <code className="rounded bg-gray-100 px-1 py-0.5 font-mono dark:bg-neutral-800">{applicationId}</code>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Template selector */}
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            出力する書類を選択してください
          </legend>
          <div className="space-y-2">
            {TEMPLATE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={[
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors',
                  selectedTemplate === opt.value
                    ? 'border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-neutral-700 dark:hover:border-neutral-600',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="templateType"
                  value={opt.value}
                  checked={selectedTemplate === opt.value}
                  onChange={() => { setSelectedTemplate(opt.value); setSuccessMsg(null); clearError(); }}
                  className="mt-0.5 h-4 w-4 accent-teal-600"
                />
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {opt.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Error banner */}
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success banner */}
        {successMsg && (
          <div role="status" className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          {isLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>処理中...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v9.19l2.47-2.47a.75.75 0 011.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L5.72 11.53a.75.75 0 111.06-1.06l2.47 2.47V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M3 14.25a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              </svg>
              <span>「{selectedLabel}」をダウンロード</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
