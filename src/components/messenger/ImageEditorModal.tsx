'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import {
  X, RotateCw, RotateCcw, FlipHorizontal, ZoomIn, ZoomOut,
  Download, FolderPlus, Send, RefreshCw, Check, Loader2,
  Crop as CropIcon, Sliders, Sparkles, Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import {
  getCroppedImg,
  getSafeImageUrl,
  ASPECT_RATIO_PRESETS,
  PixelCrop,
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

  // Transform States
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [baseRotation, setBaseRotation] = useState<number>(0); // 0, 90, 180, 270
  const [fineAngle, setFineAngle] = useState<number>(0); // -45 to +45
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(false);
  const [selectedRatioId, setSelectedRatioId] = useState<string>('free');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionType, setActionType] = useState<'download' | 'chat' | 'dossier' | 'apply' | null>(null);

  // Total rotation in degrees [0, 360)
  const totalRotation = useMemo(() => {
    const raw = (baseRotation + fineAngle) % 360;
    return raw < 0 ? raw + 360 : raw;
  }, [baseRotation, fineAngle]);

  // Selected aspect ratio value
  const currentRatio = useMemo(() => {
    const preset = ASPECT_RATIO_PRESETS.find(p => p.id === selectedRatioId);
    return preset ? preset.ratio : undefined;
  }, [selectedRatioId]);

  // Initialize and load safe image URL when opened
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    let active = true;
    setIsLoadingImage(true);

    getSafeImageUrl(imageUrl)
      .then(({ safeUrl: cleanUrl, isBlobUrl }) => {
        if (!active) return;
        setSafeUrl(cleanUrl);
        setIsBlobUrlCreated(isBlobUrl);
        setIsLoadingImage(false);
      })
      .catch(() => {
        if (!active) return;
        setSafeUrl(imageUrl);
        setIsBlobUrlCreated(false);
        setIsLoadingImage(false);
      });

    // Reset settings
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setBaseRotation(0);
    setFineAngle(0);
    setFlipHorizontal(false);
    setSelectedRatioId('free');
    setCroppedAreaPixels(null);
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

  const onCropComplete = useCallback((_croppedArea: Area, currentCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(currentCroppedAreaPixels);
  }, []);

  // Handlers for rotations
  const handleRotateLeft = () => {
    setBaseRotation(prev => (prev - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    setBaseRotation(prev => (prev + 90) % 360);
  };

  const handleToggleFlip = () => {
    setFlipHorizontal(prev => !prev);
  };

  const handleResetAll = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setBaseRotation(0);
    setFineAngle(0);
    setFlipHorizontal(false);
    setSelectedRatioId('free');
    toast.info('Đã khôi phục cài đặt cắt xoay ban đầu');
  };

  // Safe file name generator
  const getProcessedFileName = (suffix: string) => {
    const base = imageName.replace(/\.[^/.]+$/, '');
    const cleanBase = (base || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${cleanBase}_${suffix}.jpg`;
  };

  // Export processed image
  const generateCroppedImage = async (): Promise<{ blob: Blob; dataUrl: string } | null> => {
    if (!safeUrl || !croppedAreaPixels) {
      toast.error('Chưa thể xác định vùng ảnh cần xử lý');
      return null;
    }

    try {
      const result = await getCroppedImg(
        safeUrl,
        croppedAreaPixels,
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
    const loadId = toast.loading('Đang chuẩn bị ảnh đã cắt xoay để lưu hồ sơ...');

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

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
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
              onClick={handleResetAll}
              disabled={isProcessing}
              className="border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-[10px] h-7 px-2 gap-1 rounded-lg"
              title="Khôi phục nguyên bản"
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

        {/* Center Cropper Canvas Viewport */}
        <div className="relative flex-1 min-h-[260px] sm:min-h-[380px] max-h-[50vh] sm:max-h-[58vh] bg-slate-950 flex items-center justify-center overflow-hidden">
          {isLoadingImage ? (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs">Đang tải khung ảnh an toàn...</span>
            </div>
          ) : safeUrl ? (
            <Cropper
              image={safeUrl}
              crop={crop}
              zoom={zoom}
              rotation={totalRotation}
              aspect={currentRatio}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              classes={{
                containerClassName: 'bg-slate-950',
                cropAreaClassName: 'border-2 border-indigo-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]',
              }}
              showGrid={true}
              transform={[
                `translate(${crop.x}px, ${crop.y}px)`,
                `rotate(${totalRotation}deg)`,
                `scale(${flipHorizontal ? -zoom : zoom}, ${zoom})`,
              ].join(' ')}
            />
          ) : (
            <div className="text-xs text-rose-400">Không tìm thấy hình ảnh</div>
          )}

          {/* Quick Floating Zoom Guide on Canvas */}
          <div className="absolute bottom-2 left-2 z-10 pointer-events-none bg-slate-950/70 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] text-slate-300 border border-slate-800">
            Kéo để di chuyển • Lăn chuột để phóng to
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
                  onClick={() => setSelectedRatioId(preset.id)}
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

          {/* Row 2: Sliders & Quick Transform Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
            {/* Left: 90 Deg Rotations & Flip & Angle Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleRotateLeft}
                    className="h-7 px-2 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-[10px] gap-1 rounded-md"
                    title="Xoay 90° ngược chiều kim đồng hồ"
                  >
                    <RotateCcw className="w-3 h-3 text-indigo-400" /> -90°
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleRotateRight}
                    className="h-7 px-2 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-[10px] gap-1 rounded-md"
                    title="Xoay 90° cùng chiều kim đồng hồ"
                  >
                    <RotateCw className="w-3 h-3 text-indigo-400" /> +90°
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleToggleFlip}
                    className={`h-7 px-2 border-slate-700 text-[10px] gap-1 rounded-md transition-colors ${
                      flipHorizontal
                        ? 'bg-amber-600/30 border-amber-500/50 text-amber-300 font-bold'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
                    }`}
                    title="Lật ảnh gương ngang"
                  >
                    <FlipHorizontal className="w-3 h-3" /> Lật
                  </Button>
                </div>

                {/* Fine Angle Indicator */}
                <button
                  type="button"
                  onClick={() => setFineAngle(0)}
                  className="text-[10px] font-mono text-indigo-300 hover:underline px-1 py-0.5 rounded hover:bg-slate-800"
                  title="Bấm để reset góc nghiêng về 0°"
                >
                  Nghiêng: {fineAngle > 0 ? `+${fineAngle}°` : `${fineAngle}°`}
                </button>
              </div>

              {/* Fine Tilt Slider */}
              <div className="flex items-center gap-2 px-1">
                <span className="text-[9px] text-slate-400 shrink-0 w-10">Nắn thẳng:</span>
                <input
                  type="range"
                  min={-45}
                  max={45}
                  step={0.5}
                  value={fineAngle}
                  onChange={e => setFineAngle(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Right: Zoom Control */}
            <div className="flex flex-col justify-between gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                  <ZoomIn className="w-3 h-3 text-indigo-400" /> Thu phóng
                </span>
                <span className="text-[10px] font-mono text-slate-400">{zoom.toFixed(2)}x</span>
              </div>
              <div className="flex items-center gap-2 px-1">
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.max(1, +(prev - 0.1).toFixed(2)))}
                  className="text-slate-400 hover:text-white p-0.5"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min={1}
                  max={3.5}
                  step={0.05}
                  value={zoom}
                  onChange={e => setZoom(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.min(3.5, +(prev + 0.1).toFixed(2)))}
                  className="text-slate-400 hover:text-white p-0.5"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
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
