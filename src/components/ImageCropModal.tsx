'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Check, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Point { x: number; y: number }

interface ImageCropModalProps {
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

const HANDLES = [
  { name: 'tl', cursor: 'nwse-resize', style: '-top-1.5 -left-1.5' },
  { name: 'tr', cursor: 'nesw-resize', style: '-top-1.5 -right-1.5' },
  { name: 'bl', cursor: 'nesw-resize', style: '-bottom-1.5 -left-1.5' },
  { name: 'br', cursor: 'nwse-resize', style: '-bottom-1.5 -right-1.5' },
  { name: 't', cursor: 'ns-resize', style: '-top-1.5 left-1/2 -translate-x-1/2' },
  { name: 'b', cursor: 'ns-resize', style: '-bottom-1.5 left-1/2 -translate-x-1/2' },
  { name: 'l', cursor: 'ew-resize', style: 'top-1/2 -left-1.5 -translate-y-1/2' },
  { name: 'r', cursor: 'ew-resize', style: 'top-1/2 -right-1.5 -translate-y-1/2' },
];

export default function ImageCropModal({ imageSrc, onClose, onCropComplete }: ImageCropModalProps) {
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [box, setBox] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ mx: number; my: number; x: number; y: number; w: number; h: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(640);

  const containerRef = useRef<HTMLDivElement>(null);

  // Set window width client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Load natural image size as soon as imageSrc is available
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = (err) => {
      console.error('Failed to load image size', err);
    };
  }, [imageSrc]);

  // Compute displayed sizes dynamically
  const displayedSize = useMemo(() => {
    if (naturalSize.w === 0) return { w: 0, h: 0 };

    const isMobile = windowWidth < 640;
    const maxWidth = isMobile ? windowWidth - 48 : 560;
    const maxHeight = isMobile ? 260 : 380;

    // Dimensions after rotation
    const isRotated = rotation % 180 !== 0;
    const nw = isRotated ? naturalSize.h : naturalSize.w;
    const nh = isRotated ? naturalSize.w : naturalSize.h;

    const containerRatio = maxWidth / maxHeight;
    const imageRatio = nw / nh;

    let w = 0;
    let h = 0;
    if (imageRatio > containerRatio) {
      w = maxWidth;
      h = maxWidth / imageRatio;
    } else {
      h = maxHeight;
      w = maxHeight * imageRatio;
    }

    return { w, h };
  }, [naturalSize, rotation, windowWidth]);

  // Handle Rotation change
  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
    setBox({ x: 10, y: 10, w: 80, h: 80 }); // Reset box to prevent overflow
  };

  // Mouse / Touch Drag Start
  const handleStart = (e: React.MouseEvent | React.TouchEvent, handle: string) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragStart({
      mx: clientX,
      my: clientY,
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h
    });
    setActiveHandle(handle);
  };

  // Drag listeners
  useEffect(() => {
    if (!activeHandle || !dragStart || !containerRef.current) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const containerRect = containerRef.current!.getBoundingClientRect();
      const dxWindow = clientX - dragStart.mx;
      const dyWindow = clientY - dragStart.my;

      // Convert to container percentage delta
      const dxPct = (dxWindow / containerRect.width) * 100;
      const dyPct = (dyWindow / containerRect.height) * 100;

      // Map window delta to image coordinate space based on rotation
      let dx = dxPct;
      let dy = dyPct;
      if (rotation === 90) {
        dx = dyPct;
        dy = -dxPct;
      } else if (rotation === 180) {
        dx = -dxPct;
        dy = -dyPct;
      } else if (rotation === 270) {
        dx = -dyPct;
        dy = dxPct;
      }

      let nextBox = { ...dragStart };

      if (activeHandle === 'move') {
        nextBox.x = Math.max(0, Math.min(100 - dragStart.w, dragStart.x + dx));
        nextBox.y = Math.max(0, Math.min(100 - dragStart.h, dragStart.y + dy));
      } else {
        const minSize = 5; // minimum width/height is 5%

        if (activeHandle.includes('l')) {
          const maxW = dragStart.x + dragStart.w - minSize;
          nextBox.x = Math.max(0, Math.min(maxW, dragStart.x + dx));
          nextBox.w = dragStart.x + dragStart.w - nextBox.x;
        }
        if (activeHandle.includes('r')) {
          nextBox.w = Math.max(minSize, Math.min(100 - dragStart.x, dragStart.w + dx));
        }
        if (activeHandle.includes('t')) {
          const maxH = dragStart.y + dragStart.h - minSize;
          nextBox.y = Math.max(0, Math.min(maxH, dragStart.y + dy));
          nextBox.h = dragStart.y + dragStart.h - nextBox.y;
        }
        if (activeHandle.includes('b')) {
          nextBox.h = Math.max(minSize, Math.min(100 - dragStart.y, dragStart.h + dy));
        }
      }

      setBox(nextBox);
    };

    const handleEnd = () => {
      setActiveHandle(null);
      setDragStart(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [activeHandle, dragStart, rotation]);

  const handleSave = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const nw = img.naturalWidth;
      const nh = img.naturalHeight;

      // Determine dimensions after rotation
      const rotatedW = (rotation % 180 === 0) ? nw : nh;
      const rotatedH = (rotation % 180 === 0) ? nh : nw;

      // Calculate absolute pixel coordinates for the crop area
      const cropX = (box.x / 100) * rotatedW;
      const cropY = (box.y / 100) * rotatedH;
      const cropW = (box.w / 100) * rotatedW;
      const cropH = (box.h / 100) * rotatedH;

      canvas.width = cropW;
      canvas.height = cropH;

      // Draw rotated image onto canvas
      ctx.translate(-cropX, -cropY);

      if (rotation === 90) {
        ctx.translate(nh, 0);
        ctx.rotate((90 * Math.PI) / 180);
      } else if (rotation === 180) {
        ctx.translate(nw, nh);
        ctx.rotate((180 * Math.PI) / 180);
      } else if (rotation === 270) {
        ctx.translate(0, nw);
        ctx.rotate((270 * Math.PI) / 180);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
        } else {
          alert('Không thể tạo file ảnh.');
        }
        setIsProcessing(false);
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error('Error cropping image:', err);
      alert('Đã xảy ra lỗi khi cắt ảnh.');
      setIsProcessing(false);
    }
  };

  if (!imageSrc) return null;

  // Swapped sizes for rendering target rotated image
  const isRotated = rotation % 180 !== 0;
  const imgWidth = isRotated ? displayedSize.h : displayedSize.w;
  const imgHeight = isRotated ? displayedSize.w : displayedSize.h;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 md:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-3.5 border-b flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm md:text-base">Chỉnh sửa & Cắt ảnh tự do</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200/60 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Editor workspace */}
        <div className="relative h-[55vh] md:h-[60vh] bg-slate-950 w-full flex items-center justify-center p-4 overflow-hidden select-none">
          {displayedSize.w > 0 && (
            <div
              ref={containerRef}
              className="relative shadow-2xl"
              style={{
                width: displayedSize.w,
                height: displayedSize.h,
              }}
            >
              {/* Image element centered and scaled */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt="To be cropped"
                className="pointer-events-none object-fill"
                style={{
                  width: imgWidth,
                  height: imgHeight,
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transformOrigin: 'center',
                  marginLeft: -imgWidth / 2,
                  marginTop: -imgHeight / 2,
                }}
              />

              {/* Mask Overlays */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                <div
                  className="absolute bg-black/60 left-0 top-0 w-full"
                  style={{ height: `${box.y}%` }}
                />
                <div
                  className="absolute bg-black/60 left-0 w-full"
                  style={{ top: `${box.y + box.h}%`, height: `${100 - box.y - box.h}%` }}
                />
                <div
                  className="absolute bg-black/60 left-0"
                  style={{ top: `${box.y}%`, height: `${box.h}%`, width: `${box.x}%` }}
                />
                <div
                  className="absolute bg-black/60"
                  style={{
                    top: `${box.y}%`,
                    height: `${box.h}%`,
                    left: `${box.x + box.w}%`,
                    width: `${100 - box.x - box.w}%`,
                  }}
                />
              </div>

              {/* Draggable Crop Box Container */}
              <div
                className="absolute border-2 border-indigo-500 shadow-[0_0_0_1px_rgba(255,255,255,0.7)] z-20 cursor-move"
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.w}%`,
                  height: `${box.h}%`,
                }}
                onMouseDown={(e) => handleStart(e, 'move')}
                onTouchStart={(e) => handleStart(e, 'move')}
              >
                {/* 3x3 Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>

                {/* Corner & Edge Handles */}
                {HANDLES.map((h) => (
                  <div
                    key={h.name}
                    className="absolute w-3 h-3 bg-indigo-600 rounded-full border-2 border-white shadow-md active:bg-indigo-700 active:scale-125 transition-transform"
                    style={{
                      cursor: h.cursor,
                      left: h.style.includes('left-1/2') ? '50%' : h.style.includes('right') ? 'auto' : '-0.375rem',
                      right: h.style.includes('right') ? '-0.375rem' : 'auto',
                      top: h.style.includes('top-1/2') ? '50%' : h.style.includes('bottom') ? 'auto' : '-0.375rem',
                      bottom: h.style.includes('bottom') ? '-0.375rem' : 'auto',
                      transform: h.style.includes('translate-x-1/2')
                        ? 'translateX(-50%)'
                        : h.style.includes('translate-y-1/2')
                        ? 'translateY(-50%)'
                        : 'none',
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleStart(e, h.name);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleStart(e, h.name);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-slate-50 border-t flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleRotate}
            className="flex items-center gap-2 hover:bg-slate-200/50 text-xs py-1 h-8 shadow-xs border-slate-200"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Xoay ảnh 90°
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-xs h-8 text-slate-500 hover:text-slate-700"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 h-8 shadow-sm flex items-center gap-1.5"
            >
              {isProcessing ? (
                'Đang xử lý...'
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Xong & Cắt ảnh
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
