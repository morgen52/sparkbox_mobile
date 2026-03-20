import { describe, expect, it } from 'vitest';

import {
  mapSpaceKindToLegacyScope,
  resolveActiveSpaceId,
} from './spaceShell';


describe('resolveActiveSpaceId', () => {
  const spaces = [
    {
      id: 'space-private',
      name: '你和 Sparkbox',
      kind: 'private' as const,
      template: 'private' as const,
      memberCount: 1,
      threadCount: 3,
      updatedAt: '2026-03-20T10:00:00Z',
    },
    {
      id: 'space-shared',
      name: '我和爸妈 + Sparkbox',
      kind: 'shared' as const,
      template: 'parents' as const,
      memberCount: 2,
      threadCount: 4,
      updatedAt: '2026-03-20T10:01:00Z',
    },
  ];

  it('keeps the current active space when still present', () => {
    expect(resolveActiveSpaceId(spaces, 'space-shared')).toBe('space-shared');
  });

  it('falls back to the private space first for a new shell session', () => {
    expect(resolveActiveSpaceId(spaces, '')).toBe('space-private');
  });
});


describe('mapSpaceKindToLegacyScope', () => {
  it('maps private spaces to private legacy scopes', () => {
    expect(mapSpaceKindToLegacyScope('private')).toEqual({
      chatScope: 'private',
      fileSpace: 'private',
      taskScope: 'private',
    });
  });

  it('maps shared spaces to family legacy scopes', () => {
    expect(mapSpaceKindToLegacyScope('shared')).toEqual({
      chatScope: 'family',
      fileSpace: 'family',
      taskScope: 'family',
    });
  });
});
