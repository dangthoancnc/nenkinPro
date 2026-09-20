import { describe, it, expect } from 'vitest';
import {
  getRadianAngle,
  calculateRotatedSize,
  ASPECT_RATIO_PRESETS,
} from '@/lib/messenger/cropUtils';

describe('Image Crop & Rotate Math Utilities', () => {
  it('converts degrees to radians accurately', () => {
    expect(getRadianAngle(0)).toBe(0);
    expect(getRadianAngle(90)).toBeCloseTo(Math.PI / 2, 5);
    expect(getRadianAngle(180)).toBeCloseTo(Math.PI, 5);
    expect(getRadianAngle(270)).toBeCloseTo((3 * Math.PI) / 2, 5);
    expect(getRadianAngle(360)).toBeCloseTo(2 * Math.PI, 5);
  });

  it('calculates bounding box for 0 degree rotation', () => {
    const size = calculateRotatedSize(800, 600, 0);
    expect(size.width).toBe(800);
    expect(size.height).toBe(600);
  });

  it('calculates bounding box for 90 degree rotation (swaps width and height)', () => {
    const size = calculateRotatedSize(800, 600, 90);
    expect(size.width).toBe(600);
    expect(size.height).toBe(800);
  });

  it('calculates bounding box for 180 degree rotation', () => {
    const size = calculateRotatedSize(800, 600, 180);
    expect(size.width).toBe(800);
    expect(size.height).toBe(600);
  });

  it('calculates bounding box for 270 degree rotation (swaps width and height)', () => {
    const size = calculateRotatedSize(800, 600, 270);
    expect(size.width).toBe(600);
    expect(size.height).toBe(800);
  });

  it('calculates bounding box for 45 degree rotation expansion', () => {
    // For square 100x100 at 45 deg: width = 100 * sqrt(2) ≈ 141.42 -> 141
    const size = calculateRotatedSize(100, 100, 45);
    expect(size.width).toBe(141);
    expect(size.height).toBe(141);
  });

  it('provides all standard document aspect ratio presets', () => {
    const ids = ASPECT_RATIO_PRESETS.map(p => p.id);
    expect(ids).toContain('free');
    expect(ids).toContain('card');
    expect(ids).toContain('a4');
    expect(ids).toContain('a4_landscape');
    expect(ids).toContain('4_3');
    expect(ids).toContain('1_1');

    const cardPreset = ASPECT_RATIO_PRESETS.find(p => p.id === 'card');
    expect(cardPreset?.ratio).toBeCloseTo(1.5857, 3);

    const a4Preset = ASPECT_RATIO_PRESETS.find(p => p.id === 'a4');
    expect(a4Preset?.ratio).toBeCloseTo(0.707, 3);
  });

  it('defaults to 100% full image selection (no crop by default)', () => {
    const { DEFAULT_CROP, normalizedToPixelCrop } = require('@/lib/messenger/cropUtils');
    expect(DEFAULT_CROP).toEqual({ x: 0, y: 0, width: 1, height: 1 });

    const pixelCrop = normalizedToPixelCrop(DEFAULT_CROP, 1920, 1080);
    expect(pixelCrop).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
  });

  it('clamps crop coordinates correctly within [0, 1] bounds', () => {
    const { clampCrop } = require('@/lib/messenger/cropUtils');
    // Test negative coordinates
    const clamped1 = clampCrop({ x: -0.2, y: -0.1, width: 0.8, height: 0.8 });
    expect(clamped1.x).toBe(0);
    expect(clamped1.y).toBe(0);

    // Test overflow coordinates
    const clamped2 = clampCrop({ x: 0.5, y: 0.5, width: 0.8, height: 0.8 });
    expect(clamped2.width).toBe(0.8);
    expect(clamped2.x).toBeCloseTo(0.2, 5); // 1 - 0.8 = 0.2
  });

  it('computes centered aspect ratio crop correctly', () => {
    const { computeAspectRatioCrop } = require('@/lib/messenger/cropUtils');
    // Square image (1000x1000) with 2:1 aspect ratio -> width=1, height=0.5, y=0.25
    const crop = computeAspectRatioCrop(1000, 1000, 2);
    expect(crop.width).toBe(1);
    expect(crop.height).toBe(0.5);
    expect(crop.x).toBe(0);
    expect(crop.y).toBe(0.25);
  });
});

