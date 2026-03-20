import { describe, expect, it } from 'vitest';

import {
  describeChatAccess,
  describeChatSendPhase,
  describeSpaceKind,
  formatSpaceTemplateList,
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

  it('falls back to the first listed space for a new shell session', () => {
    expect(resolveActiveSpaceId([spaces[1], spaces[0]], '')).toBe('space-shared');
  });
});

describe('space identity helpers', () => {
  it('describes private and shared spaces with explicit labels', () => {
    expect(describeSpaceKind('private')).toBe('Private Box space');
    expect(describeSpaceKind('shared')).toBe('Family space');
  });

  it('describes family chat access using space language', () => {
    expect(describeChatAccess('family')).toBe('Family space');
    expect(describeChatAccess('private')).toBe('Private space');
  });

  it('formats space templates into friendly labels', () => {
    expect(formatSpaceTemplateList(['partner', 'parents', 'household_ops'])).toBe(
      'Partner · Parents · Household ops',
    );
  });
});

describe('chat send state helpers', () => {
  it('describes pending chat send phases for the UI', () => {
    expect(describeChatSendPhase('sending')).toBe('Sending topic message...');
    expect(describeChatSendPhase('streaming')).toBe('Streaming reply...');
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
