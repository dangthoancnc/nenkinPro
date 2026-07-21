'use client';

import React from 'react';
import {
  UploadCloud,
  ZoomIn,
  Sparkles,
  Crop,
  Trash2,
  Loader2,
  FileImage,
  Plus,
  CheckCircle2,
} from 'lucide-react';

export interface DocItem {
  key: string;
  title: string;
  urlField: string;
}

interface DocumentTabsProps {
  documents: DocItem[];
  activeDoc: string;
  onSelectDoc: (key: string) => void;
  getUrl: (urlField: string) => string | undefined;
  isEditing: boolean;
  ocrStatus: Record<string, string>;
  /** called when user picks a new file (after crop modal) */
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>, docKey: string, urlField: string) => void;
  /** called when user wants to re-crop the current image */
  onCropExisting: (docKey: string, urlField: string, imageUrl: string) => void;
  /** called when user wants AI re-extract */
  onAiExtract: (docKey: string, imageUrl: string) => void;
  /** called when user deletes the image */
  onDelete: (docKey: string, urlField: string) => void;
  /** called when user zooms in */
  onZoom: (url: string) => void;
  /** called when user wants to add a bank account */
  onAddBank?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Sub-component: single tab button
// ─────────────────────────────────────────────────────────────
const DocTabButton: React.FC<{
  doc: DocItem;
  isActive: boolean;
  hasImage: boolean;
  onClick: () => void;
}> = ({ doc, isActive, hasImage, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={doc.title}
    className={[
      'relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 truncate border',
      isActive
        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
        : hasImage
          ? 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
          : 'bg-white text-slate-400 border-dashed border-slate-200 hover:border-slate-300',
    ].join(' ')}
  >
    {hasImage && (
      <span
        className={[
          'w-1.5 h-1.5 rounded-full shrink-0',
          isActive ? 'bg-emerald-300' : 'bg-emerald-500',
        ].join(' ')}
      />
    )}
    <span className="truncate">{doc.title}</span>
  </button>
);

// ─────────────────────────────────────────────────────────────
// Sub-component: floating image toolbar
// ─────────────────────────────────────────────────────────────
const ImageToolbar: React.FC<{
  docKey: string;
  urlField: string;
  imageUrl: string;
  ocrDone: boolean;
  isEditing: boolean;
  onAiExtract: () => void;
  onCrop: () => void;
  onReplace: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  onZoom: () => void;
}> = ({ docKey, ocrDone, isEditing, onAiExtract, onCrop, onReplace, onDelete, onZoom }) => (
  <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
    {isEditing && (
      <>
        {/* AI Extract */}
        <button
          type="button"
          onClick={onAiExtract}
          title={ocrDone ? 'Trích xuất AI lại' : 'Trích xuất AI'}
          className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-md transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>

        {/* Crop */}
        <button
          type="button"
          onClick={onCrop}
          title="Cắt / chỉnh ảnh"
          className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 rounded-md border border-slate-200 shadow-md transition-all"
        >
          <Crop className="w-3.5 h-3.5" />
        </button>

        {/* Replace */}
        <label
          title="Thay ảnh mới"
          className="cursor-pointer p-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 rounded-md border border-slate-200 shadow-md transition-all"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onReplace}
          />
        </label>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          title="Xóa ảnh"
          className="p-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-md border border-slate-200 shadow-md transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </>
    )}

    {/* Zoom — always visible */}
    <button
      type="button"
      onClick={onZoom}
      title="Phóng to"
      className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 rounded-md border border-slate-200 shadow-md transition-all"
    >
      <ZoomIn className="w-3.5 h-3.5" />
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export const DocumentTabs: React.FC<DocumentTabsProps> = ({
  documents,
  activeDoc,
  onSelectDoc,
  getUrl,
  isEditing,
  ocrStatus,
  onFileSelect,
  onCropExisting,
  onAiExtract,
  onDelete,
  onZoom,
  onAddBank,
}) => {
  const currentDoc = documents.find((d) => d.key === activeDoc) ?? documents[0];
  const currentUrl = currentDoc ? getUrl(currentDoc.urlField) : undefined;
  const isProcessing = ocrStatus[activeDoc] === 'processing';

  return (
    <div className="col-span-1 md:col-span-4 flex flex-col h-full bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden min-h-0">

      {/* ── Tab header ── */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/60 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Danh mục tài liệu
          </span>
          <span className="text-[10px] text-slate-400">
            {documents.filter((d) => !!getUrl(d.urlField)).length} / {documents.filter(d => !d.title.includes('Thêm ảnh')).length} đã tải
          </span>
        </div>

        {/* Tab grid */}
        <div className="flex flex-wrap gap-1.5">
          {documents.map((doc) => (
            <DocTabButton
              key={doc.key}
              doc={doc}
              isActive={activeDoc === doc.key}
              hasImage={!!getUrl(doc.urlField)}
              onClick={() => onSelectDoc(doc.key)}
            />
          ))}

          {/* Add bank button */}
          {isEditing && onAddBank && (
            <button
              type="button"
              onClick={onAddBank}
              title="Thêm tài khoản ngân hàng"
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-dashed border-indigo-300 text-indigo-500 bg-indigo-50/50 hover:bg-indigo-100 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm NH
            </button>
          )}
        </div>
      </div>

      {/* ── Viewer area ── */}
      <div className="flex-1 flex flex-col min-h-0 p-3 bg-slate-50/30 relative overflow-hidden">
        {/* Title row */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <FileImage className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">
              {currentDoc?.title}
            </span>
          </div>
          {currentUrl && ocrStatus[activeDoc] === 'done' && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <CheckCircle2 className="w-3 h-3" />
              Đã trích xuất AI
            </span>
          )}
        </div>

        {/* Image / upload area */}
        <div className="flex-1 rounded-xl border border-slate-200 overflow-hidden bg-white flex items-center justify-center relative group min-h-0">
          {currentUrl ? (
            <div className="relative w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUrl}
                alt={currentDoc?.title}
                className="w-full h-full object-contain"
              />

              <ImageToolbar
                docKey={activeDoc}
                urlField={currentDoc?.urlField ?? ''}
                imageUrl={currentUrl}
                ocrDone={ocrStatus[activeDoc] === 'done'}
                isEditing={isEditing}
                onAiExtract={() => onAiExtract(activeDoc, currentUrl)}
                onCrop={() =>
                  currentDoc &&
                  onCropExisting(activeDoc, currentDoc.urlField, currentUrl)
                }
                onReplace={(e) =>
                  currentDoc && onFileSelect(e, activeDoc, currentDoc.urlField)
                }
                onDelete={() =>
                  currentDoc && onDelete(activeDoc, currentDoc.urlField)
                }
                onZoom={() => onZoom(currentUrl)}
              />
            </div>
          ) : isEditing ? (
            /* Drop zone */
            <label
              className="flex flex-col items-center justify-center gap-3 cursor-pointer w-full h-full p-6 hover:bg-indigo-50/30 transition-all group/dz"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files?.length && currentDoc) {
                  const fakeEvent = { target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>;
                  onFileSelect(fakeEvent, activeDoc, currentDoc.urlField);
                }
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 group-hover/dz:bg-indigo-100 flex items-center justify-center transition-all">
                <UploadCloud className="w-7 h-7 text-indigo-400 group-hover/dz:text-indigo-600 transition-colors" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-semibold text-slate-600">Kéo thả hoặc nhấp để tải ảnh</p>
                <p className="text-[10px] text-slate-400">PNG, JPG, JPEG được chấp nhận</p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  currentDoc && onFileSelect(e, activeDoc, currentDoc.urlField)
                }
              />
            </label>
          ) : (
            /* View mode — no image */
            <div className="flex flex-col items-center justify-center gap-3 w-full h-full p-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <FileImage className="w-7 h-7 text-slate-300" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-semibold text-slate-400">Chưa có ảnh tài liệu</p>
                <p className="text-[10px] text-slate-300">Bật &quot;Sửa hồ sơ&quot; để tải ảnh lên</p>
              </div>
            </div>
          )}
        </div>

        {/* OCR processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30 rounded-xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
            <span className="text-xs font-semibold text-indigo-700 bg-white border border-indigo-100 px-4 py-1.5 rounded-full shadow-sm">
              Đang quét OCR & trích xuất AI...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentTabs;
