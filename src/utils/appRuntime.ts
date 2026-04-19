import type { Session } from '../authFlow';
import type { ChatSessionScope } from '../householdApi';

const ACTIVE_SPACE_STORAGE_KEY_PREFIX = 'sparkbox.mobile.activeSpace';

export type ClaimPayload = {
  deviceId: string;
  claimCode: string;
  raw: string;
};

export function buildActiveSpaceStorageKey(session: Session | null): string {
  if (!session) {
    return '';
  }
  return `${ACTIVE_SPACE_STORAGE_KEY_PREFIX}.${session.user.household_id}.${session.user.id}`;
}

export function buildChatSessionCacheKey(scope: ChatSessionScope, spaceId: string): string {
  return `${scope}::${spaceId || 'none'}`;
}

export function formatChatSyncDateTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(parsed);
}

export function describeSpaceSessionCountCopy(
  sessionCount: number | undefined,
  memberCount: number,
  t?: (key: string, params?: Record<string, string | number>) => string,
): string {
  const normalizedCount = typeof sessionCount === 'number' ? Math.max(0, sessionCount) : null;
  if (t) {
    const sessionsLabel =
      normalizedCount === null
        ? t('appRuntime.sessionsLoading')
        : `${normalizedCount}${t('appRuntime.sessionsSuffix')}`;
    return `${sessionsLabel} · ${memberCount}${t('spaceShell.spaceCounts.member')}`;
  }
  const sessionsLabel = normalizedCount === null ? '会话数加载中' : `${normalizedCount}个会话`;
  return `${sessionsLabel} · ${memberCount}人`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseClaimPayload(rawValue: string): ClaimPayload | null {
  const raw = rawValue.trim();
  if (!raw) {
    return null;
  }

  const tryPairs = (pairs: Array<[string, string]>): ClaimPayload | null => {
    const table = new Map<string, string>();
    for (const [key, value] of pairs) {
      table.set(key.trim().toLowerCase(), value.trim());
    }
    const deviceId =
      table.get('device_id') ??
      table.get('deviceid') ??
      table.get('sparkbox_device_id') ??
      table.get('id');
    const claimCode =
      table.get('claim_code') ??
      table.get('short_claim_code') ??
      table.get('claimcode') ??
      table.get('code');
    if (!deviceId || !claimCode) {
      return null;
    }
    return {
      deviceId,
      claimCode,
      raw,
    };
  };

  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      return tryPairs(Object.entries(parsed));
    } catch {
      return null;
    }
  }

  const queryIndex = raw.indexOf('?');
  if (queryIndex >= 0) {
    const query = raw.slice(queryIndex + 1);
    const pairs = query
      .split(/[&#]/)
      .filter(Boolean)
      .map((part) => {
        const [key, value = ''] = part.split('=');
        return [decodeURIComponent(key), decodeURIComponent(value)] as [string, string];
      });
    const parsed = tryPairs(pairs);
    if (parsed) {
      return parsed;
    }
  }

  if (raw.includes('device_id=') || raw.includes('claim_code=')) {
    const pairs = raw
      .split(/[;,]/)
      .filter(Boolean)
      .map((part) => {
        const [key, value = ''] = part.split('=');
        return [key, value] as [string, string];
      });
    const parsed = tryPairs(pairs);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}