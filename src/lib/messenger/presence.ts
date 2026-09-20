/**
 * Realtime Presence Engine for Nenkin Messenger
 * Unified source of truth for online/offline presence status.
 */

export interface PresenceResult {
  isOnline: boolean;
  lastActiveText: string;
}

/**
 * Calculates presence for a specific user or customer.
 *
 * @param isSelf Whether this is the currently authenticated user viewing themselves.
 * @param latestDate The most recent timestamp of session activity (lastSeenAt) or sent message (createdAt).
 * @param now Current timestamp in ms (defaults to Date.now()).
 */
export function calculatePresence(
  isSelf: boolean,
  latestDate: Date | string | null | undefined,
  now: number = Date.now()
): PresenceResult {
  if (isSelf) {
    return { isOnline: true, lastActiveText: 'Đang hoạt động' };
  }

  if (!latestDate) {
    return { isOnline: false, lastActiveText: 'Ngoại tuyến' };
  }

  const dateObj = typeof latestDate === 'string' ? new Date(latestDate) : latestDate;
  const time = dateObj.getTime();
  if (isNaN(time)) {
    return { isOnline: false, lastActiveText: 'Ngoại tuyến' };
  }

  const diffSec = Math.max(0, Math.floor((now - time) / 1000));

  // Within 3 minutes = Online (Active)
  if (diffSec < 180) {
    return { isOnline: true, lastActiveText: 'Đang hoạt động' };
  } else if (diffSec < 3600) {
    const minutes = Math.floor(diffSec / 60);
    return { isOnline: false, lastActiveText: `Hoạt động ${minutes} phút trước` };
  } else if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return { isOnline: false, lastActiveText: `Hoạt động ${hours} giờ trước` };
  } else if (diffSec < 86400 * 7) {
    const days = Math.floor(diffSec / 86400);
    return { isOnline: false, lastActiveText: `Hoạt động ${days} ngày trước` };
  }

  return { isOnline: false, lastActiveText: 'Ngoại tuyến' };
}

/**
 * Extracts the latest activity date from an entity's sessions and sent messages.
 */
export function extractLatestActivity(entity: {
  sessions?: Array<{ lastSeenAt?: Date | string | null }>;
  sentMessages?: Array<{ createdAt?: Date | string | null }>;
} | null | undefined): Date | null {
  if (!entity) return null;

  const timestamps: number[] = [];

  if (Array.isArray(entity.sessions)) {
    for (const s of entity.sessions) {
      if (s?.lastSeenAt) {
        const t = new Date(s.lastSeenAt).getTime();
        if (!isNaN(t)) timestamps.push(t);
      }
    }
  }

  if (Array.isArray(entity.sentMessages)) {
    for (const m of entity.sentMessages) {
      if (m?.createdAt) {
        const t = new Date(m.createdAt).getTime();
        if (!isNaN(t)) timestamps.push(t);
      }
    }
  }

  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps));
}
