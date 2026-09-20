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
});
