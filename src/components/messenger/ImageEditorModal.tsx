'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  X, RotateCw, RotateCcw, FlipHorizontal, ZoomIn, ZoomOut,
  Download, FolderPlus, Send, RefreshCw, Check, Loader2,
  Crop as CropIcon, Maximize, Sliders, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import {
  createImage,
  getCroppedImg,
  getSafeImageUrl,
  getRadianAngle,
  calculateRotatedSize,
  ASPECT_RATIO_PRESETS,
  NormalizedCrop,
  DEFAULT_CROP,
  clampCrop,
  computeAspectRatioCrop,
  normalizedToPixelCrop,
} from '@/lib/messenger/cropUtils';

export interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName?: string;
  isPendingMode?: boolean;
  onApplyPending?: (croppedBlob: Blob, fileName: string) => void;
  onSaveToDossier?: (croppedBlob: Blob, fileName: string) => void;
  onSendToChat?: (croppedBlob: Blob, fileName: string) => Promise<void> | void;
}

type HandleType = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'move';

export default function ImageEditorModal({
  isOpen,
  onClose,
  imageUrl,
  imageName = 'document_image.jpg',
  isPendingMode = false,
  onApplyPending,
  onSaveToDossier,
  onSendToChat,
}: ImageEditorModalProps) {
  // Safe Image URL for CORS protection
  const [safeUrl, setSafeUrl] = useState<string>('');
  const [isBlobUrlCreated, setIsBlobUrlCreated] = useState<boolean>(false);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(true);
  const [loadedImgElement, setLoadedImgElement] = useState<HTMLImageElement | null>(null);

  // Transform States
  const [baseRotation, setBaseRotation] = useState<number>(0); // 0, 90, 180, 270
  const [fineAngle, setFineAngle] = useState<number>(0); // -45 to +45
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(false);
  const [selectedRatioId, setSelectedRatioId] = useState<string>('free');

  // Interactive Crop Box in Normalized Coordinates [0, 1] (Default: 100% full image)
  const [crop, setCrop] = useState<NormalizedCrop>({ ...DEFAULT_CROP });

  // Viewport Container & Display Dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionType, setActionType] = useState<'download' | 'chat' | 'dossier' | 'apply' | null>(null);

  // Drag interaction state
  const dragStateRef = useRef<{
    handle: HandleType;
    startX: number;
    startY: number;
    initialCrop: NormalizedCrop;
    boxWidth: number;
    boxHeight: number;
  } | null>(null);

  // Total rotation in degrees [0, 360)
  const totalRotation = useMemo(() => {
    const raw = (baseRotation + fineAngle) % 360;
    return raw < 0 ? raw + 360 : raw;
  }, [baseRotation, fineAngle]);

  // Rotated bounding box dimensions
  const rotatedNaturalSize = useMemo(() => {
    if (!loadedImgElement) return { width: 1, height: 1 };
    return calculateRotatedSize(
      loadedImgElement.naturalWidth || loadedImgElement.width,
      loadedImgElement.naturalHeight || loadedImgElement.height,
      totalRotation
    );
  }, [loadedImgElement, totalRotation]);

  // 1. Initialize and load safe image URL when opened
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    let active = true;
    setIsLoadingImage(true);
    setLoadedImgElement(null);

    getSafeImageUrl(imageUrl)
      .then(async ({ safeUrl: cleanUrl, isBlobUrl }) => {
        if (!active) return;
        setSafeUrl(cleanUrl);
        setIsBlobUrlCreated(isBlobUrl);

        try {
          const imgEl = await createImage(cleanUrl);
          if (!active) return;
          setLoadedImgElement(imgEl);
          setIsLoadingImage(false);
        } catch {
          if (!active) return;
          setIsLoadingImage(false);
        }
      })
      .catch(() => {
        if (!active) return;
        setSafeUrl(imageUrl);
        setIsBlobUrlCreated(false);
        setIsLoadingImage(false);
      });

    // Reset transform settings: Default is 100% full image
    setCrop({ ...DEFAULT_CROP });
    setBaseRotation(0);
    setFineAngle(0);
    setFlipHorizontal(false);
    setSelectedRatioId('free');
    setIsProcessing(false);
    setActionType(null);

    return () => {
      active = false;
    };
  }, [isOpen, imageUrl]);

  // Clean up object URL on unmount or close
  useEffect(() => {
    return () => {
      if (isBlobUrlCreated && safeUrl.startsWith('blob:')) {
        URL.revokeObjectURL(safeUrl);
      }
    };
  }, [isBlobUrlCreated, safeUrl]);

  // 2. Measure container and compute fitted canvas dimensions (contain)
  const updateDisplaySize = useCallback(() => {
    if (!containerRef.current || !rotatedNaturalSize.width || !rotatedNaturalSize.height) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pad = 32; // 16px padding on each side
    const maxW = Math.max(100, rect.width - pad);
    const maxH = Math.max(100, rect.height - pad);

    const scale = Math.min(maxW / rotatedNaturalSize.width, maxH / rotatedNaturalSize.height, 1);
    const w = Math.round(rotatedNaturalSize.width * scale);
    const h = Math.round(rotatedNaturalSize.height * scale);

    setDisplaySize({ width: w, height: h });
  }, [rotatedNaturalSize]);

  useEffect(() => {
    updateDisplaySize();
    window.addEventListener('resize', updateDisplaySize);
    return () => window.removeEventListener('resize', updateDisplaySize);
  }, [updateDisplaySize]);

  // 3. Render rotated image onto preview Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImgElement || !rotatedNaturalSize.width || !rotatedNaturalSize.height) return;

    canvas.width = rotatedNaturalSize.width;
    canvas.height = rotatedNaturalSize.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // High quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Translate to center, rotate, flip, and draw
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(getRadianAngle(totalRotation));
    ctx.scale(flipHorizontal ? -1 : 1, 1);

    const natW = loadedImgElement.naturalWidth || loadedImgElement.width;
    const natH = loadedImgElement.naturalHeight || loadedImgElement.height;
    ctx.drawImage(loadedImgElement, -natW / 2, -natH / 2);

    ctx.restore();
  }, [loadedImgElement, totalRotation, flipHorizontal, rotatedNaturalSize]);

  // Handlers for rotations
  const handleRotateLeft = () => {
    setBaseRotation(prev => (prev - 90 + 360) % 360);
    // Reset crop to 100% of newly rotated view
    setCrop({ ...DEFAULT_CROP });
    setSelectedRatioId('free');
  };

  const handleRotateRight = () => {
    setBaseRotation(prev => (prev + 90) % 360);
    // Reset crop to 100% of newly rotated view
    setCrop({ ...DEFAULT_CROP });
    setSelectedRatioId('free');
  };

  const handleToggleFlip = () => {
    setFlipHorizontal(prev => !prev);
  };

  // Reset to 100% full image (take whole photo without cropping)
  const handleSelectFullImage = () => {
    setCrop({ ...DEFAULT_CROP });
    setSelectedRatioId('free');
    toast.info('Đã chọn 100% toàn bộ ảnh (không cắt viền)');
  };

  const handleResetAll = () => {
    setCrop({ ...DEFAULT_CROP });
    setBaseRotation(0);
    setFineAngle(0);
    setFlipHorizontal(false);
    setSelectedRatioId('free');
    toast.info('Đã khôi phục cài đặt cắt xoay ban đầu');
  };

  // Aspect ratio selection
  const handleSelectRatio = (presetId: string) => {
    setSelectedRatioId(presetId);
    const preset = ASPECT_RATIO_PRESETS.find(p => p.id === presetId);

    if (!preset || preset.ratio === undefined) {
      // Free mode: do not force ratio, or take full image if already 100%
      return;
    }

    // Centered crop with the selected aspect ratio
    const newCrop = computeAspectRatioCrop(
      rotatedNaturalSize.width,
      rotatedNaturalSize.height,
      preset.ratio
    );
    setCrop(newCrop);
    toast.info(`Đã áp dụng khung tỉ lệ: ${preset.label}`);
  };

  // ── 4. Interactive Drag Logic (4 Edges, 4 Corners, Move) ──
  const handlePointerDown = (e: React.PointerEvent, handle: HandleType) => {
    e.preventDefault();
    e.stopPropagation();

    if (displaySize.width <= 0 || displaySize.height <= 0) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    dragStateRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop },
      boxWidth: displaySize.width,
      boxHeight: displaySize.height,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStateRef.current) return;
    const { handle, startX, startY, initialCrop, boxWidth, boxHeight } = dragStateRef.current;

    const dx = (e.clientX - startX) / boxWidth;
    const dy = (e.clientY - startY) / boxHeight;

    let next = { ...initialCrop };

    switch (handle) {
      case 'move':
        next.x = Math.max(0, Math.min(1 - initialCrop.width, initialCrop.x + dx));
        next.y = Math.max(0, Math.min(1 - initialCrop.height, initialCrop.y + dy));
        break;

      case 'top':
        {
          const maxDeltaY = initialCrop.height - 0.05;
          const clampedDy = Math.max(-initialCrop.y, Math.min(maxDeltaY, dy));
          next.y = initialCrop.y + clampedDy;
          next.height = initialCrop.height - clampedDy;
        }
        break;

      case 'bottom':
        {
          const maxH = 1 - initialCrop.y;
          next.height = Math.max(0.05, Math.min(maxH, initialCrop.height + dy));
        }
        break;

      case 'left':
        {
          const maxDeltaX = initialCrop.width - 0.05;
          const clampedDx = Math.max(-initialCrop.x, Math.min(maxDeltaX, dx));
          next.x = initialCrop.x + clampedDx;
          next.width = initialCrop.width - clampedDx;
        }
        break;

      case 'right':
        {
          const maxW = 1 - initialCrop.x;
          next.width = Math.max(0.05, Math.min(maxW, initialCrop.width + dx));
        }
        break;

      case 'top-left':
        {
          const maxDeltaX = initialCrop.width - 0.05;
          const clampedDx = Math.max(-initialCrop.x, Math.min(maxDeltaX, dx));
          const maxDeltaY = initialCrop.height - 0.05;
          const clampedDy = Math.max(-initialCrop.y, Math.min(maxDeltaY, dy));
          next.x = initialCrop.x + clampedDx;
          next.width = initialCrop.width - clampedDx;
          next.y = initialCrop.y + clampedDy;
          next.height = initialCrop.height - clampedDy;
        }
        break;

      case 'top-right':
        {
          const maxW = 1 - initialCrop.x;
          next.width = Math.max(0.05, Math.min(maxW, initialCrop.width + dx));
          const maxDeltaY = initialCrop.height - 0.05;
          const clampedDy = Math.max(-initialCrop.y, Math.min(maxDeltaY, dy));
          next.y = initialCrop.y + clampedDy;
          next.height = initialCrop.height - clampedDy;
        }
        break;

      case 'bottom-left':
        {
          const maxDeltaX = initialCrop.width - 0.05;
          const clampedDx = Math.max(-initialCrop.x, Math.min(maxDeltaX, dx));
          next.x = initialCrop.x + clampedDx;
          next.width = initialCrop.width - clampedDx;
          const maxH = 1 - initialCrop.y;
          next.height = Math.max(0.05, Math.min(maxH, initialCrop.height + dy));
        }
        break;

      case 'bottom-right':
        {
          const maxW = 1 - initialCrop.x;
          next.width = Math.max(0.05, Math.min(maxW, initialCrop.width + dx));
          const maxH = 1 - initialCrop.y;
          next.height = Math.max(0.05, Math.min(maxH, initialCrop.height + dy));
        }
        break;
    }

    setCrop(clampCrop(next));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStateRef.current) {
      dragStateRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Safe file name generator
  const getProcessedFileName = (suffix: string) => {
    const base = imageName.replace(/\.[^/.]+$/, '');
    const cleanBase = (base || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${cleanBase}_${suffix}.jpg`;
  };

  // ── 5. Export processed image using high-precision HTML5 Canvas ──
  const generateCroppedImage = async (): Promise<{ blob: Blob; dataUrl: string } | null> => {
    if (!safeUrl || !loadedImgElement) {
      toast.error('Chưa tải xong hình ảnh để xử lý');
      return null;
    }

    try {
      const pixelCrop = normalizedToPixelCrop(
        crop,
        rotatedNaturalSize.width,
        rotatedNaturalSize.height
      );

      const result = await getCroppedImg(
        safeUrl,
        pixelCrop,
        totalRotation,
        { horizontal: flipHorizontal, vertical: false },
        'image/jpeg',
        0.95
      );

      if (!result) throw new Error('Không thể render canvas ảnh');
      return { blob: result.blob, dataUrl: result.dataUrl };
    } catch (err: any) {
      console.error('Crop export error:', err);
      toast.error('Lỗi khi xuất ảnh: ' + (err.message || 'Thất bại'));
      return null;
    }
  };

  // 1. Download
  const handleDownload = async () => {
    setIsProcessing(true);
    setActionType('download');
    const loadId = toast.loading('Đang xử lý xuất ảnh chất lượng cao...');

    try {
      const res = await generateCroppedImage();
      if (!res) return;

      const link = document.createElement('a');
      link.href = res.dataUrl;
      link.download = getProcessedFileName('edited');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Đã tải ảnh đã xử lý về máy!', { id: loadId });
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  // 2. Apply Pending (when editing before sending)
  const handleApplyPending = async () => {
    if (!onApplyPending) return;
    setIsProcessing(true);
    setActionType('apply');
    const loadId = toast.loading('Đang áp dụng thay đổi...');

    try {
      const res = await generateCroppedImage();
      if (!res) return;

      onApplyPending(res.blob, getProcessedFileName('edited'));
      toast.success('Đã cập nhật ảnh đính kèm sẵn sàng gửi!', { id: loadId });
      onClose();
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  // 3. Send to Chat
  const handleSendToChat = async () => {
    if (!onSendToChat) return;
    setIsProcessing(true);
    setActionType('chat');
    const loadId = toast.loading('Đang xuất ảnh và gửi vào cuộc trò chuyện...');

    try {
      const res = await generateCroppedImage();
      if (!res) return;

      await onSendToChat(res.blob, getProcessedFileName('edited'));
      toast.success('Đã gửi ảnh đã chỉnh sửa vào cuộc trò chuyện!', { id: loadId });
      onClose();
    } catch (err: any) {
      toast.error('Lỗi khi gửi ảnh vào chat: ' + err.message, { id: loadId });
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  // 4. Save to Dossier
  const handleSaveToDossier = async () => {
    if (!onSaveToDossier) return;
    setIsProcessing(true);
    setActionType('dossier');
    const loadId = toast.loading('Đang chuẩn bị ảnh để lưu hồ sơ...');

    try {
      const res = await generateCroppedImage();
      if (!res) return;

      toast.dismiss(loadId);
      onSaveToDossier(res.blob, getProcessedFileName('dossier'));
      onClose();
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  if (!isOpen) return null;

  // Check if current crop is 100% full image
  const isFullImage = crop.x === 0 && crop.y === 0 && crop.width === 1 && crop.height === 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-3.5 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <CropIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white tracking-tight">Biên tập ảnh: Xoay & Cắt Crop</h3>
                <span className="hidden sm:inline-block px-1.5 py-0.2 bg-indigo-950 text-indigo-300 border border-indigo-800/60 rounded text-[9px] font-mono">
                  {totalRotation}°
                </span>
                {isFullImage && (
                  <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded text-[9px] font-semibold">
                    Toàn ảnh (100%)
                  </span>
                )}
                {flipHorizontal && (
                  <span className="px-1 py-0.2 bg-amber-950 text-amber-300 border border-amber-800/60 rounded text-[9px]">
                    Lật ngang
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[280px] sm:max-w-[420px]" title={imageName}>
                {imageName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleSelectFullImage}
              disabled={isProcessing || isFullImage}
              className={`h-7 px-2 text-[10px] gap-1 rounded-lg border transition-all ${
                isFullImage
                  ? 'border-emerald-600/40 bg-emerald-950/40 text-emerald-300 opacity-60 cursor-default'
                  : 'border-indigo-600/60 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/60 hover:text-white'
              }`}
              title="Khôi phục lấy 100% toàn bộ khung ảnh"
            >
              <Maximize className="w-3 h-3" />
              <span>Toàn ảnh (100%)</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleResetAll}
              disabled={isProcessing}
              className="border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-[10px] h-7 px-2 gap-1 rounded-lg"
              title="Khôi phục góc xoay và crop ban đầu"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Khôi phục</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Cropper Canvas Viewport (100% Full Image visible, 4-edge interactive crop frame) */}
        <div
          ref={containerRef}
          className="relative flex-1 min-h-[280px] sm:min-h-[400px] max-h-[52vh] sm:max-h-[60vh] bg-slate-950 flex items-center justify-center p-4 overflow-hidden select-none"
        >
          {isLoadingImage ? (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs">Đang nạp dữ liệu ảnh nguyên bản...</span>
            </div>
          ) : (
            <div
              className="relative flex items-center justify-center"
              style={{
                width: displaySize.width > 0 ? displaySize.width : 'auto',
                height: displaySize.height > 0 ? displaySize.height : 'auto',
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* Rotated & Smoothed Canvas Preview */}
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full rounded-md shadow-2xl block"
                style={{
                  width: displaySize.width,
                  height: displaySize.height,
                }}
              />

              {/* ── INTERACTIVE 4-EDGE CROP OVERLAY ── */}
              {displaySize.width > 0 && displaySize.height > 0 && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: displaySize.width, height: displaySize.height }}
                >
                  {/* Dimmed Outside Mask (Shows only if cropped away from 100%) */}
                  {!isFullImage && (
                    <>
                      {/* Top Mask */}
                      <div
                        className="absolute left-0 right-0 top-0 bg-black/60 transition-colors pointer-events-none"
                        style={{ height: `${crop.y * 100}%` }}
                      />
                      {/* Bottom Mask */}
                      <div
                        className="absolute left-0 right-0 bottom-0 bg-black/60 transition-colors pointer-events-none"
                        style={{ height: `${(1 - (crop.y + crop.height)) * 100}%` }}
                      />
                      {/* Left Mask */}
                      <div
                        className="absolute left-0 bg-black/60 transition-colors pointer-events-none"
                        style={{
                          top: `${crop.y * 100}%`,
                          height: `${crop.height * 100}%`,
                          width: `${crop.x * 100}%`,
                        }}
                      />
                      {/* Right Mask */}
                      <div
                        className="absolute right-0 bg-black/60 transition-colors pointer-events-none"
                        style={{
                          top: `${crop.y * 100}%`,
                          height: `${crop.height * 100}%`,
                          width: `${(1 - (crop.x + crop.width)) * 100}%`,
                        }}
                      />
                    </>
                  )}

                  {/* ── Active Crop Frame ── */}
                  <div
                    className="absolute border-2 border-indigo-400 shadow-sm pointer-events-auto group/crop"
                    style={{
                      left: `${crop.x * 100}%`,
                      top: `${crop.y * 100}%`,
                      width: `${crop.width * 100}%`,
                      height: `${crop.height * 100}%`,
                    }}
                    onPointerDown={e => handlePointerDown(e, 'move')}
                  >
                    {/* Interior 3x3 Grid Lines (Rule of thirds) */}
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-40">
                      <div className="border-r border-b border-white/60 border-dashed" />
                      <div className="border-r border-b border-white/60 border-dashed" />
                      <div className="border-b border-white/60 border-dashed" />
                      <div className="border-r border-b border-white/60 border-dashed" />
                      <div className="border-r border-b border-white/60 border-dashed" />
                      <div className="border-b border-white/60 border-dashed" />
                      <div className="border-r border-white/60 border-dashed" />
                      <div className="border-r border-white/60 border-dashed" />
                      <div />
                    </div>

                    {/* ── 4 CORNERS (L-shaped Brackets) ── */}
                    {/* Top-Left */}
                    <div
                      className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-3 border-l-3 border-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] cursor-nwse-resize z-20"
                      onPointerDown={e => handlePointerDown(e, 'top-left')}
                    />
                    {/* Top-Right */}
                    <div
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-3 border-r-3 border-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] cursor-nesw-resize z-20"
                      onPointerDown={e => handlePointerDown(e, 'top-right')}
                    />
                    {/* Bottom-Left */}
                    <div
                      className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-3 border-l-3 border-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] cursor-nesw-resize z-20"
                      onPointerDown={e => handlePointerDown(e, 'bottom-left')}
                    />
                    {/* Bottom-Right */}
                    <div
                      className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-3 border-r-3 border-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] cursor-nwse-resize z-20"
                      onPointerDown={e => handlePointerDown(e, 'bottom-right')}
                    />

                    {/* ── 4 EDGES (Direct Drag Handles) ── */}
                    {/* Top Edge Handle */}
                    <div
                      className="absolute -top-3 inset-x-0 h-6 cursor-ns-resize flex items-center justify-center z-10"
                      onPointerDown={e => handlePointerDown(e, 'top')}
                    >
                      <div className="w-10 h-1.5 rounded-full bg-white shadow-md border border-slate-400 group-hover/crop:bg-indigo-300" />
                    </div>

                    {/* Bottom Edge Handle */}
                    <div
                      className="absolute -bottom-3 inset-x-0 h-6 cursor-ns-resize flex items-center justify-center z-10"
                      onPointerDown={e => handlePointerDown(e, 'bottom')}
                    >
                      <div className="w-10 h-1.5 rounded-full bg-white shadow-md border border-slate-400 group-hover/crop:bg-indigo-300" />
                    </div>

                    {/* Left Edge Handle */}
                    <div
                      className="absolute -left-3 inset-y-0 w-6 cursor-ew-resize flex items-center justify-center z-10"
                      onPointerDown={e => handlePointerDown(e, 'left')}
                    >
                      <div className="h-10 w-1.5 rounded-full bg-white shadow-md border border-slate-400 group-hover/crop:bg-indigo-300" />
                    </div>

                    {/* Right Edge Handle */}
                    <div
                      className="absolute -right-3 inset-y-0 w-6 cursor-ew-resize flex items-center justify-center z-10"
                      onPointerDown={e => handlePointerDown(e, 'right')}
                    >
                      <div className="h-10 w-1.5 rounded-full bg-white shadow-md border border-slate-400 group-hover/crop:bg-indigo-300" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Floating Guide on Canvas */}
          <div className="absolute bottom-2 left-2 z-10 pointer-events-none bg-slate-950/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] text-slate-300 border border-slate-800 shadow-md">
            Kéo 4 cạnh hoặc 4 góc của khung để cắt • Kéo giữa để di chuyển
          </div>
        </div>

        {/* High-Density Controls Panel */}
        <div className="p-2.5 sm:p-3 bg-slate-900 border-t border-slate-800 flex flex-col gap-2 shrink-0">
          {/* Row 1: Aspect Ratio Presets Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <CropIcon className="w-2.5 h-2.5 text-indigo-400" /> Tỉ lệ:
            </span>
            {ASPECT_RATIO_PRESETS.map((preset) => {
              const active = selectedRatioId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectRatio(preset.id)}
                  title={preset.description || preset.label}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all shrink-0 border ${
                    active
                      ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-xs'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {preset.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Row 2: Rotation Buttons & Fine Tilt Slider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
            {/* Left: 90 Deg Rotations & Flip */}
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleRotateLeft}
                className="h-7 px-2.5 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-[10px] gap-1 rounded-md"
                title="Xoay 90° ngược chiều kim đồng hồ"
              >
                <RotateCcw className="w-3 h-3 text-indigo-400" /> -90°
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleRotateRight}
                className="h-7 px-2.5 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-[10px] gap-1 rounded-md"
                title="Xoay 90° cùng chiều kim đồng hồ"
              >
                <RotateCw className="w-3 h-3 text-indigo-400" /> +90°
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleToggleFlip}
                className={`h-7 px-2.5 border-slate-700 text-[10px] gap-1 rounded-md transition-colors ${
                  flipHorizontal
                    ? 'bg-amber-600/30 border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
                }`}
                title="Lật ảnh gương ngang"
              >
                <FlipHorizontal className="w-3 h-3" /> Lật
              </Button>
            </div>

            {/* Right: Fine Angle Tilt Slider */}
            <div className="flex flex-col justify-center gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-indigo-400" /> Nắn thẳng góc nghiêng:
                </span>
                <button
                  type="button"
                  onClick={() => setFineAngle(0)}
                  className="text-[10px] font-mono text-indigo-300 hover:underline px-1 py-0.2 rounded hover:bg-slate-800"
                  title="Bấm để đưa về 0°"
                >
                  {fineAngle > 0 ? `+${fineAngle}°` : `${fineAngle}°`}
                </button>
              </div>
              <div className="flex items-center gap-2 px-1">
                <span className="text-[8px] text-slate-500">-45°</span>
                <input
                  type="range"
                  min={-45}
                  max={45}
                  step={0.5}
                  value={fineAngle}
                  onChange={e => setFineAngle(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[8px] text-slate-500">+45°</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="px-3.5 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={onClose}
            disabled={isProcessing}
            className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 h-8 px-3 rounded-lg text-xs"
          >
            Hủy bỏ
          </Button>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* If Opened for Pending File before Send */}
            {isPendingMode ? (
              <Button
                type="button"
                size="xs"
                onClick={handleApplyPending}
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 px-4 rounded-lg shadow-sm text-xs gap-1.5"
              >
                {isProcessing && actionType === 'apply' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Áp dụng & Gắn vào chat
                  </>
                )}
              </Button>
            ) : (
              /* If Opened from existing message image */
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleDownload}
                  disabled={isProcessing}
                  className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 h-8 px-2.5 rounded-lg text-xs gap-1"
                  title="Tải ảnh đã cắt xoay về máy"
                >
                  {isProcessing && actionType === 'download' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-slate-300" />
                  )}
                  <span>Tải về</span>
                </Button>

                {onSaveToDossier && (
                  <Button
                    type="button"
                    size="xs"
                    onClick={handleSaveToDossier}
                    disabled={isProcessing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-3 rounded-lg shadow-xs text-xs gap-1"
                    title="Lưu bản ảnh cắt xoay này vào Hồ sơ khách hàng"
                  >
                    {isProcessing && actionType === 'dossier' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FolderPlus className="w-3.5 h-3.5" />
                    )}
                    <span>Lưu vào HS</span>
                  </Button>
                )}

                {onSendToChat && (
                  <Button
                    type="button"
                    size="xs"
                    onClick={handleSendToChat}
                    disabled={isProcessing}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 px-3.5 rounded-lg shadow-xs text-xs gap-1.5"
                    title="Gửi ngay ảnh đã xử lý vào cuộc trò chuyện"
                  >
                    {isProcessing && actionType === 'chat' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Gửi vào Chat</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
