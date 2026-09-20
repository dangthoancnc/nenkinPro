import { describe, it, expect } from 'vitest';
import { calculatePresence, extractLatestActivity } from '../lib/messenger/presence';

describe('Realtime Presence Engine', () => {
  const now = new Date('2026-09-20T08:30:00.000Z').getTime();

  it('identifies current user (isSelf) as actively online', () => {
    const res = calculatePresence(true, null, now);
    expect(res.isOnline).toBe(true);
    expect(res.lastActiveText).toBe('Đang hoạt động');
  });

  it('marks users with no activity as offline', () => {
    const res = calculatePresence(false, null, now);
    expect(res.isOnline).toBe(false);
    expect(res.lastActiveText).toBe('Ngoại tuyến');
  });

  it('marks users active within 3 minutes as online', () => {
    // 2 minutes ago
    const activeDate = new Date(now - 2 * 60 * 1000);
    const res = calculatePresence(false, activeDate, now);
    expect(res.isOnline).toBe(true);
    expect(res.lastActiveText).toBe('Đang hoạt động');
  });

  it('formats recent offline intervals properly', () => {
    // 15 minutes ago
    const m15 = new Date(now - 15 * 60 * 1000);
    const res15 = calculatePresence(false, m15, now);
    expect(res15.isOnline).toBe(false);
    expect(res15.lastActiveText).toBe('Hoạt động 15 phút trước');

    // 4 hours ago
    const h4 = new Date(now - 4 * 3600 * 1000);
    const res4h = calculatePresence(false, h4, now);
    expect(res4h.isOnline).toBe(false);
    expect(res4h.lastActiveText).toBe('Hoạt động 4 giờ trước');

    // 3 days ago
    const d3 = new Date(now - 3 * 86400 * 1000);
    const res3d = calculatePresence(false, d3, now);
    expect(res3d.isOnline).toBe(false);
    expect(res3d.lastActiveText).toBe('Hoạt động 3 ngày trước');

    // 10 days ago (past 7 days cutoff -> Ngoại tuyến)
    const d10 = new Date(now - 10 * 86400 * 1000);
    const res10d = calculatePresence(false, d10, now);
    expect(res10d.isOnline).toBe(false);
    expect(res10d.lastActiveText).toBe('Ngoại tuyến');
  });

  it('extracts latest activity timestamp accurately across sessions and sentMessages', () => {
    expect(extractLatestActivity(null)).toBeNull();
    expect(extractLatestActivity({})).toBeNull();

    const entity = {
      sessions: [
        { lastSeenAt: new Date(now - 10 * 60 * 1000) },
        { lastSeenAt: new Date(now - 20 * 60 * 1000) },
      ],
      sentMessages: [
        { createdAt: new Date(now - 5 * 60 * 1000) }, // This is the latest!
      ],
    };

    const latest = extractLatestActivity(entity);
    expect(latest?.getTime()).toBe(now - 5 * 60 * 1000);
  });
});
