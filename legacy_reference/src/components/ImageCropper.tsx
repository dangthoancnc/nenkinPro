import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from './ui/Button';
import { Save, RotateCw, ZoomIn, ZoomOut, X } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onSave: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onSave, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0
  ): Promise<Blob | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve) => {
      canvas.toBlob((file) => {
        resolve(file);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSave = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (croppedBlob) {
        onSave(croppedBlob);
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi cắt ảnh');
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative bg-slate-900 rounded-lg overflow-hidden">
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={NaN} // free crop
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          classes={{ containerClassName: "bg-slate-900" }}
        />
      </div>

      <div className="bg-white border-t border-slate-200 p-4 shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <label className="text-xs font-semibold text-slate-500 w-12">Zoom</label>
          <ZoomOut className="w-4 h-4 text-slate-400" />
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-indigo-600"
          />
          <ZoomIn className="w-4 h-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-4">
          <label className="text-xs font-semibold text-slate-500 w-12">Xoay</label>
          <RotateCw className="w-4 h-4 text-slate-400" />
          <input
            type="range"
            value={rotation}
            min={0}
            max={360}
            step={1}
            aria-labelledby="Rotation"
            onChange={(e) => setRotation(Number(e.target.value))}
            className="flex-1 accent-indigo-600"
          />
        </div>

        <div className="flex justify-between mt-2">
          <Button variant="outline" onClick={onCancel} className="gap-2">
            <X className="w-4 h-4" /> Hủy
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Save className="w-4 h-4" /> Lưu ảnh & Trích xuất
          </Button>
        </div>
      </div>
    </div>
  );
}
