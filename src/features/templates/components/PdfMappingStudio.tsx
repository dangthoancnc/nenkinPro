'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { FieldMapping, TemplateVersion } from '../template-schema';
import type { PdfPageMetrics } from '../mapper-types';
import {
  canvasPointerToPdfPoint,
  pdfPointToCanvasPercent,
  patchField,
} from '../mapper-utils';

type PdfMappingStudioProps = {
  templateId: string;
  initialVersion: TemplateVersion;
  pdfUrl: string;
};

type PdfDocumentLike = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<{
    getViewport: (params: { scale: number }) => {
      width: number;
      height: number;
    };
    render: (params: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }) => { promise: Promise<void> };
  }>;
  destroy?: () => void;
};

const FONT_FAMILIES = ['NotoSansJP', 'NotoSans', 'NotoSerifJP'] as const;

export default function PdfMappingStudio({
  templateId,
  initialVersion,
  pdfUrl,
}: PdfMappingStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const documentRef = useRef<PdfDocumentLike | null>(null);
  const pageMetricsRef = useRef<Record<number, PdfPageMetrics>>({});

  const [activePage, setActivePage] = useState(1);
  const [zoom, setZoom] = useState(1.4);
  const [fields, setFields] = useState<FieldMapping[]>(
    initialVersion.fieldMappings,
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    initialVersion.fieldMappings[0]?.id ?? null,
  );
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [changeNote, setChangeNote] = useState(
    `Draft based on ${initialVersion.id}`,
  );

  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId) ?? null,
    [fields, selectedFieldId],
  );

  const fieldsForActivePage = useMemo(
    () =>
      fields.filter(
        (field) => field.enabled && field.coordinate.page === activePage,
      ),
    [activePage, fields],
  );

  const renderPage = useCallback(async () => {
    const pdf = documentRef.current;
    const canvas = canvasRef.current;

    if (!pdf || !canvas) {
      return;
    }

    setIsPdfLoading(true);
    setPdfError(null);

    try {
      const page = await pdf.getPage(activePage);
      const viewport = page.getViewport({ scale: zoom });
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Cannot initialize PDF canvas context.');
      }

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      pageMetricsRef.current[activePage] = {
        width: viewport.width / zoom,
        height: viewport.height / zoom,
      };

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;
    } catch (error) {
      setPdfError(
        error instanceof Error
          ? error.message
          : 'Không thể render trang PDF.',
      );
    } finally {
      setIsPdfLoading(false);
    }
  }, [activePage, zoom]);

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        setIsPdfLoading(true);
        setPdfError(null);

        // Load modern build instead of legacy folder since we installed the latest version
        // @ts-expect-error type missing for mjs
        const pdfjs = await import('pdfjs-dist/build/pdf.mjs');

        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = (await loadingTask.promise) as PdfDocumentLike;

        if (cancelled) {
          pdf.destroy?.();
          return;
        }

        documentRef.current = pdf;
        await renderPage();
      } catch (error) {
        if (!cancelled) {
          setPdfError(
            error instanceof Error
              ? error.message
              : 'Không thể mở PDF template.',
          );
          setIsPdfLoading(false);
        }
      }
    }

    void loadPdf();

    return () => {
      cancelled = true;
      documentRef.current?.destroy?.();
      documentRef.current = null;
    };
  }, [pdfUrl, renderPage]);

  useEffect(() => {
    if (documentRef.current) {
      void renderPage();
    }
  }, [renderPage]);

  function selectField(fieldId: string) {
    setSelectedFieldId(fieldId);
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    fieldId: string,
  ) {
    event.preventDefault();
    event.stopPropagation();

    selectField(fieldId);
    setDraggingFieldId(fieldId);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingFieldId) {
      return;
    }

    const stage = stageRef.current;
    const metrics = pageMetricsRef.current[activePage];

    if (!stage || !metrics) {
      return;
    }

    const bounds = stage.getBoundingClientRect();

    const coordinate = canvasPointerToPdfPoint(
      event.clientX - bounds.left,
      event.clientY - bounds.top,
      bounds.width,
      bounds.height,
      metrics,
    );

    setFields((current) =>
      patchField(current, draggingFieldId, {
        coordinate: {
          page: activePage,
          ...coordinate,
        },
      }),
    );
  }

  function handlePointerUp() {
    setDraggingFieldId(null);
  }

  function patchSelectedField(
    patch: Partial<FieldMapping>,
  ) {
    if (!selectedFieldId) {
      return;
    }
    setFields((current) => patchField(current, selectedFieldId, patch));
  }

  async function saveDraft() {
    setSaveError(null);
    setSaveSuccess(null);

    if (!changeNote.trim()) {
      setSaveError('Vui lòng nhập ghi chú thay đổi trước khi lưu draft.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/admin/templates/${templateId}/drafts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseVersionId: initialVersion.id,
            changeNote: changeNote.trim(),
            fieldMappings: fields,
          }),
        },
      );

      const payload = (await response.json()) as {
        id?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Không thể lưu bản nháp.');
      }

      setSaveSuccess(
        `Đã lưu TemplateVersion draft mới: ${payload.id ?? 'thành công'}.`,
      );
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Không thể lưu bản nháp.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  const metrics = pageMetricsRef.current[activePage];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
              PDF Mapping Studio
            </p>
            <h1 className="text-xl font-semibold text-gray-950 dark:text-white">
              {templateId} · Draft editor
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Trang
              <select
                value={activePage}
                onChange={(event) =>
                  setActivePage(Number(event.target.value))
                }
                className="ml-2 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                {Array.from(
                  { length: initialVersion.pageCount },
                  (_, index) => index + 1,
                ).map((page) => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-gray-600 dark:text-gray-300">
              Zoom
              <select
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="ml-2 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value={0.8}>80%</option>
                <option value={1}>100%</option>
                <option value={1.4}>140%</option>
                <option value={1.8}>180%</option>
                <option value={2}>200%</option>
              </select>
            </label>
          </div>
        </header>

        <div className="overflow-auto rounded-xl border border-gray-200 bg-neutral-100 p-4 dark:border-neutral-700 dark:bg-neutral-950">
          {pdfError ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {pdfError}
            </div>
          ) : (
            <div
              ref={stageRef}
              className="relative mx-auto w-fit touch-none bg-white shadow-lg"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <canvas ref={canvasRef} className="block max-w-none" />

              {!isPdfLoading &&
                metrics &&
                fieldsForActivePage.map((field) => {
                  const position = pdfPointToCanvasPercent(
                    field.coordinate.x,
                    field.coordinate.y,
                    metrics,
                  );

                  const isSelected = field.id === selectedFieldId;

                  return (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => selectField(field.id)}
                      onPointerDown={(event) =>
                        handlePointerDown(event, field.id)
                      }
                      style={{
                        left: `${position.leftPct}%`,
                        top: `${position.topPct}%`,
                        width: `${Math.max(
                          (field.maxWidth ?? 72) /
                            metrics.width *
                            100,
                          4,
                        )}%`,
                        fontSize: `${Math.max(field.font.size * zoom, 10)}px`,
                      }}
                      className={[
                        'absolute -translate-y-1/2 cursor-grab select-none rounded border px-1.5 py-0.5 text-left shadow-sm active:cursor-grabbing',
                        isSelected
                          ? 'z-20 border-teal-600 bg-teal-100/90 text-teal-950 ring-2 ring-teal-500/50'
                          : 'z-10 border-amber-500 bg-amber-100/80 text-amber-950 hover:bg-amber-200/90',
                      ].join(' ')}
                      aria-label={`Chỉnh vị trí ${field.label}`}
                    >
                      <span className="block truncate">
                        {field.label}
                      </span>
                    </button>
                  );
                })}

              {isPdfLoading && (
                <div className="absolute inset-0 grid place-items-center bg-white/70 text-sm font-medium text-gray-700">
                  Đang render PDF...
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Quy ước: PDF point, gốc tọa độ ở góc trái dưới. Kéo field để thay đổi
          tọa độ; thay đổi hiện chỉ ở bộ nhớ cho đến khi lưu draft.
        </p>
      </section>

      <aside className="space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Fields — trang {activePage}
          </h2>

          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {fields
              .filter((field) => field.coordinate.page === activePage)
              .map((field) => (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => selectField(field.id)}
                  className={[
                    'w-full rounded-lg border p-3 text-left text-sm transition-colors',
                    field.id === selectedFieldId
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/30'
                      : 'border-gray-200 hover:border-gray-300 dark:border-neutral-700',
                  ].join(' ')}
                >
                  <span className="block font-medium text-gray-900 dark:text-gray-100">
                    {field.label}
                  </span>
                  <span className="mt-1 block font-mono text-xs text-gray-500">
                    x: {field.coordinate.x} · y: {field.coordinate.y}
                  </span>
                </button>
              ))}
          </div>
        </section>

        {selectedField ? (
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Chỉnh field
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {selectedField.id}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                X
                <input
                  type="number"
                  step="0.1"
                  value={selectedField.coordinate.x}
                  onChange={(event) =>
                    patchSelectedField({
                      coordinate: {
                        ...selectedField.coordinate,
                        x: Number(event.target.value),
                      },
                    })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Y
                <input
                  type="number"
                  step="0.1"
                  value={selectedField.coordinate.y}
                  onChange={(event) =>
                    patchSelectedField({
                      coordinate: {
                        ...selectedField.coordinate,
                        y: Number(event.target.value),
                      },
                    })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Font size
                <input
                  type="number"
                  min="5"
                  max="32"
                  step="0.5"
                  value={selectedField.font.size}
                  onChange={(event) =>
                    patchSelectedField({
                      font: {
                        ...selectedField.font,
                        size: Number(event.target.value),
                      },
                    })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Max width
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={selectedField.maxWidth ?? ''}
                  onChange={(event) =>
                    patchSelectedField({
                      maxWidth: Number(event.target.value) || undefined,
                    })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Font
                <select
                  value={selectedField.font.family}
                  onChange={(event) =>
                    patchSelectedField({
                      font: {
                        ...selectedField.font,
                        family: event.target.value as (typeof FONT_FAMILIES)[number],
                      },
                    })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-950"
                >
                  {FONT_FAMILIES.map((family) => (
                    <option key={family} value={family}>
                      {family}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Căn lề
                <select
                  value={selectedField.align}
                  onChange={(event) =>
                    patchSelectedField({
                      align: event.target.value as FieldMapping['align'],
                    })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-gray-500">
            Chọn một field trên PDF hoặc trong danh sách để chỉnh.
          </section>
        )}

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Lưu bản nháp
          </h2>

          <label className="mt-3 block text-sm text-gray-700 dark:text-gray-300">
            Ghi chú thay đổi
            <textarea
              value={changeNote}
              onChange={(event) => setChangeNote(event.target.value)}
              maxLength={1000}
              rows={3}
              className="mt-1 w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          {saveError && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {saveError}
            </p>
          )}

          {saveSuccess && (
            <p role="status" className="mt-3 text-sm text-green-700">
              {saveSuccess}
            </p>
          )}

          <button
            type="button"
            disabled={isSaving}
            onClick={() => void saveDraft()}
            className="mt-4 w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Đang lưu draft...' : 'Lưu TemplateVersion draft mới'}
          </button>

          <p className="mt-3 text-xs text-gray-500">
            Thao tác này không publish template và không ảnh hưởng bản PDF đang
            dùng trong production.
          </p>
        </section>
      </aside>
    </div>
  );
}
