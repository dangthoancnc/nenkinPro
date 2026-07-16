/**
 * /applications/don-xin
 * Trang xuất biểu mẫu 脱退一時金申請 (don_xin)
 *
 * Author: PE (Perplexity) — Sprint 5
 *
 * URL params:
 *   ?id=<applicationId>  — load sẵn application cụ thể
 *
 * Nếu không có ?id, hiển thị ô nhập applicationId thủ công
 * (dùng khi demo hoặc khi chưa có màn hình danh sách liên kết)
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DonXinForm from '@/components/DonXinForm';
import type { TemplateType } from '@/hooks/useGenerateDoc';

function DonXinPageInner() {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get('id') ?? '';

  const [applicationId, setApplicationId] = useState(idFromUrl);
  const [confirmedId, setConfirmedId] = useState(idFromUrl);
  const [downloadLog, setDownloadLog] = useState<{ template: TemplateType; at: string }[]>([]);

  // Nếu URL thay đổi (navigate), sync lại
  useEffect(() => {
    if (idFromUrl) {
      setApplicationId(idFromUrl);
      setConfirmedId(idFromUrl);
    }
  }, [idFromUrl]);

  function handleIdSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = applicationId.trim();
    if (trimmed) setConfirmedId(trimmed);
  }

  function handleSuccess(templateType: TemplateType) {
    setDownloadLog(prev => [
      { template: templateType, at: new Date().toLocaleString('ja-JP') },
      ...prev,
    ]);
  }

  const TEMPLATE_LABELS: Record<TemplateType, string> = {
    form1: '脱退一時金請求書',
    form2: '委任状',
    form3: '納税管理人届出書',
    bang_1_2: '確定申告書_第一表_第二表',
    bang_3: '確定申告書_第三表',
    giay_uy_thac_lan_2: '納税管理人届出書_Lần_2',
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {/* Page header */}
      <div className="mb-8">
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-gray-400">
          <a href="/applications" className="hover:text-gray-600">申請一覧</a>
          <span>/</span>
          <span className="text-gray-600 dark:text-gray-300">書類出力</span>
        </nav>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          書類出力 — 脱退一時金申請書
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          申請データを選択してWordファイルをダウンロードしてください。
        </p>
      </div>

      {/* ID入力 (URLにIDがない場合のみ表示) */}
      {!idFromUrl && (
        <form
          onSubmit={handleIdSubmit}
          className="mb-6 flex gap-2"
        >
          <input
            type="text"
            value={applicationId}
            onChange={e => setApplicationId(e.target.value)}
            placeholder="Application ID を入力 (例: clxxx123)"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!applicationId.trim()}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50 dark:bg-neutral-700 dark:hover:bg-neutral-600"
          >
            確認
          </button>
        </form>
      )}

      {/* Form xuất PDF */}
      {confirmedId ? (
        <DonXinForm
          applicationId={confirmedId}
          onSuccess={handleSuccess}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-neutral-700">
          <svg className="h-10 w-10 text-gray-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            上のフィールドにApplication IDを入力してください
          </p>
        </div>
      )}

      {/* Download log */}
      {downloadLog.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">出力履歴</h3>
          <ul className="space-y-2">
            {downloadLog.map((log, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-800/50"
              >
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {TEMPLATE_LABELS[log.template]}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{log.at}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

export default function DonXinPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
      </main>
    }>
      <DonXinPageInner />
    </Suspense>
  );
}
