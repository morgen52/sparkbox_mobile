import { useCallback, useRef } from 'react';
import {
  getHouseholdChatSessions,
  type ChatSessionScope,
  type HouseholdChatSessionSummary,
} from '../householdApi';
import { buildChatSessionCacheKey } from '../utils/appRuntime';

const CHAT_SESSION_CACHE_TTL_MS = 3 * 60 * 1000;

type ChatSessionCacheEntry = {
  sessions: HouseholdChatSessionSummary[];
  fetchedAt: number;
};

export function useChatSessionCache(token?: string): {
  readFreshChatSessionCache: (scope: ChatSessionScope, spaceId: string) => ChatSessionCacheEntry | null;
  fetchChatSessions: (
    scope: ChatSessionScope,
    spaceId: string,
    options?: { force?: boolean },
  ) => Promise<HouseholdChatSessionSummary[]>;
  clearChatSessionCache: (scope?: ChatSessionScope, spaceId?: string) => void;
} {
  const chatSessionCacheRef = useRef<Record<string, ChatSessionCacheEntry>>({});

  const readFreshChatSessionCache = useCallback((
    scope: ChatSessionScope,
    spaceId: string,
  ): ChatSessionCacheEntry | null => {
    const key = buildChatSessionCacheKey(scope, spaceId);
    const cached = chatSessionCacheRef.current[key];
    if (!cached) {
      return null;
    }
    if (Date.now() - cached.fetchedAt > CHAT_SESSION_CACHE_TTL_MS) {
      delete chatSessionCacheRef.current[key];
      return null;
    }
    return cached;
  }, []);

  const writeChatSessionCache = useCallback((
    scope: ChatSessionScope,
    spaceId: string,
    sessions: HouseholdChatSessionSummary[],
  ): void => {
    const key = buildChatSessionCacheKey(scope, spaceId);
    chatSessionCacheRef.current[key] = {
      sessions,
      fetchedAt: Date.now(),
    };
  }, []);

  const clearChatSessionCache = useCallback((scope?: ChatSessionScope, spaceId?: string): void => {
    if (scope && typeof spaceId === 'string') {
      delete chatSessionCacheRef.current[buildChatSessionCacheKey(scope, spaceId)];
      return;
    }
    chatSessionCacheRef.current = {};
  }, []);

  const fetchChatSessions = useCallback(async (
    scope: ChatSessionScope,
    spaceId: string,
    options?: { force?: boolean },
  ): Promise<HouseholdChatSessionSummary[]> => {
    if (!token) {
      return [];
    }
    if (!options?.force) {
      const cached = readFreshChatSessionCache(scope, spaceId);
      if (cached) {
        return cached.sessions;
      }
    }
    const sessions = await getHouseholdChatSessions(token, scope, { spaceId });
    writeChatSessionCache(scope, spaceId, sessions);
    return sessions;
  }, [readFreshChatSessionCache, token, writeChatSessionCache]);

  return {
    readFreshChatSessionCache,
    fetchChatSessions,
    clearChatSessionCache,
  };
}