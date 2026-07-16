/**
 * useGenerateDoc
 * Hook gọi POST /api/generate-doc và trigger download file .docx
 *
 * Author: PE (Perplexity) — Sprint 5
 *
 * Cách dùng:
 *   const { generate, isLoading, error } = useGenerateDoc();
 *   await generate({ applicationId: 'abc123', templateType: 'form1' });
 */

'use client';

import { useState, useCallback } from 'react';

export type TemplateType = 'don_xin_lan_1' | 'ininjyo_yoshiki_lan_1' | 'nouzeikanrinin' | 'bang_1_2' | 'bang_3' | 'giay_uy_thac_lan_2';

export interface GenerateDocParams {
  applicationId: string;
  templateType: TemplateType;
}

const TEMPLATE_LABELS: Record<TemplateType, string> = {
  don_xin_lan_1: '脱退一時金請求書',
  ininjyo_yoshiki_lan_1: '委任状',
  nouzeikanrinin: '納税管理人届出書',
  bang_1_2: '確定申告書_第一表_第二表',
  bang_3: '確定申告書_第三表',
  giay_uy_thac_lan_2: '納税管理人届出書_Lần_2',
};

export function useGenerateDoc() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (params: GenerateDocParams): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        // Cố parse JSON error từ API
        let errMsg = `HTTP ${res.status}`;
        try {
          const errBody = await res.json() as { error?: string };
          if (errBody.error) errMsg = errBody.error;
        } catch {
          // ignore parse error
        }
        throw new Error(errMsg);
      }

      // API trả về binary .pdf — tạo blob và trigger download
      const blob = await res.blob();

      // Lấy tên file từ header Content-Disposition nếu có
      const disposition = res.headers.get('Content-Disposition') ?? '';
      let filename = `${TEMPLATE_LABELS[params.templateType]}.pdf`;
      const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;\r\n]+)/i);
      if (match?.[1]) {
        filename = decodeURIComponent(match[1].replace(/"/g, ''));
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { generate, isLoading, error, clearError };
}
