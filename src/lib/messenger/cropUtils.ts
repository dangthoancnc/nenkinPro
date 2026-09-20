/**
 * Image Cropping & Rotation Math Utilities
 * High precision, GPU-accelerated canvas transforms
 */

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Convert degrees to radians
 */
export function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function calculateRotatedSize(width: number, height: number, rotation: number): Size {
  const rotRad = getRadianAngle(rotation);

  return {
    width: Math.round(
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height)
    ),
    height: Math.round(
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height)
    ),
  };
}

/**
 * Aspect Ratio Presets for Nenkin Document Processing
 */
export interface AspectRatioPreset {
  id: string;
  label: string;
  shortLabel: string;
  ratio: number | undefined; // undefined = free crop
  description?: string;
}

export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  { id: 'free', label: 'Tự do', shortLabel: 'Free', ratio: undefined, description: 'Cắt tự do tùy chỉnh' },
  { id: 'card', label: 'Thẻ ngoại kiều / ID (1.59)', shortLabel: 'Thẻ ID', ratio: 85.6 / 53.98, description: 'Chuẩn kích thước thẻ Ngoại kiều / My Number' },
  { id: 'a4', label: 'Tài liệu A4 (1:1.41)', shortLabel: 'Giấy A4', ratio: 210 / 297, description: 'Chuẩn giấy thông báo Nenkin dọc' },
  { id: 'a4_landscape', label: 'Tài liệu A4 ngang (1.41:1)', shortLabel: 'A4 ngang', ratio: 297 / 210, description: 'Chuẩn sổ Nenkin mở ngang' },
  { id: '4_3', label: 'Tỉ lệ 4:3', shortLabel: '4:3', ratio: 4 / 3, description: 'Ảnh chụp tài liệu tiêu chuẩn' },
  { id: '1_1', label: 'Hình vuông (1:1)', shortLabel: '1:1', ratio: 1, description: 'Ảnh thẻ chân dung / Avatar' },
  { id: '16_9', label: 'Màn hình 16:9', shortLabel: '16:9', ratio: 16 / 9, description: 'Khổ rộng hiển thị' },
];

/**
 * Safely load an image from URL or ObjectURL
 */
export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * Safely fetch remote URL to a local Blob URL to prevent Canvas Taint (CORS)
 */
export async function getSafeImageUrl(url: string): Promise<{ safeUrl: string; isBlobUrl: boolean }> {
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return { safeUrl: url, isBlobUrl: false };
  }

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
    const blob = await response.blob();
    const safeUrl = URL.createObjectURL(blob);
    return { safeUrl, isBlobUrl: true };
  } catch {
    // Fallback directly to original URL
    return { safeUrl: url, isBlobUrl: false };
  }
}

/**
 * High precision cropped and rotated image generator using HTML5 Canvas.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.95
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number } | null> {
  const image = await createImage(imageSrc);

  // 1. Create rotCanvas sized to contain the rotated image completely
  const rotCanvas = document.createElement('canvas');
  const rotCtx = rotCanvas.getContext('2d');
  if (!rotCtx) return null;

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = calculateRotatedSize(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    rotation
  );

  rotCanvas.width = bBoxWidth;
  rotCanvas.height = bBoxHeight;

  // Set high quality smoothing
  rotCtx.imageSmoothingEnabled = true;
  rotCtx.imageSmoothingQuality = 'high';

  // Translate canvas-context to center point to rotate & flip around center
  rotCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
  rotCtx.rotate(rotRad);
  rotCtx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  rotCtx.translate(-(image.naturalWidth || image.width) / 2, -(image.naturalHeight || image.height) / 2);

  // Draw full rotated image
  rotCtx.drawImage(image, 0, 0);

  // 2. Create target canvas sized exactly to the cropped region
  const cropCanvas = document.createElement('canvas');
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) return null;

  const cropW = Math.max(1, Math.round(pixelCrop.width));
  const cropH = Math.max(1, Math.round(pixelCrop.height));

  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  cropCtx.imageSmoothingEnabled = true;
  cropCtx.imageSmoothingQuality = 'high';

  // Extract the cropped portion from rotCanvas
  cropCtx.drawImage(
    rotCanvas,
    Math.round(pixelCrop.x),
    Math.round(pixelCrop.y),
    cropW,
    cropH,
    0,
    0,
    cropW,
    cropH
  );

  const dataUrl = cropCanvas.toDataURL(mimeType, quality);

  const blob = await new Promise<Blob | null>((resolve) => {
    cropCanvas.toBlob(
      (b) => resolve(b),
      mimeType,
      quality
    );
  });

  if (!blob) return null;

  return {
    blob,
    dataUrl,
    width: cropW,
    height: cropH,
  };
}
