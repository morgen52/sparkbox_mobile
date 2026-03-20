import { describe, expect, it } from 'vitest';

import {
  buildSpaceScopedFilePath,
  describeChatAccess,
  describeChatSendPhase,
  describeSpaceKind,
  formatSpaceTemplateList,
  getRelayTargets,
  mapSpaceKindToLegacyScope,
  resolveActiveSpaceId,
  resolveRelayTargetUserId,
  stripSpaceScopedFilePath,
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
    expect(describeChatSendPhase('sending')).toBe('Sparkbox 正在准备第一段回复');
    expect(describeChatSendPhase('streaming')).toBe('Sparkbox 正在继续回答');
    expect(describeChatSendPhase('timed_out')).toBe('Sparkbox 这次准备得太久了');
    expect(describeChatSendPhase('failed')).toBe('Sparkbox 这次没有顺利回完');
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

describe('relay target helpers', () => {
  const detail = {
    id: 'space-shared',
    name: '我和爸妈 + Sparkbox',
    kind: 'shared' as const,
    template: 'parents' as const,
    memberCount: 3,
    threadCount: 4,
    updatedAt: '2026-03-20T10:01:00Z',
    members: [
      { id: 'user-1', displayName: 'Morgan', role: 'owner' as const },
      { id: 'user-2', displayName: 'Dad', role: 'member' as const },
      { id: 'user-3', displayName: 'Mom', role: 'member' as const },
    ],
    threads: [],
    enabledFamilyApps: [],
    privateSideChannel: null,
  };

  it('filters the active user out of relay targets', () => {
    expect(getRelayTargets(detail, 'user-1').map((member) => member.id)).toEqual(['user-2', 'user-3']);
  });

  it('falls back to the first available relay target', () => {
    const targets = getRelayTargets(detail, 'user-1');
    expect(resolveRelayTargetUserId(targets, '')).toBe('user-2');
    expect(resolveRelayTargetUserId(targets, 'missing')).toBe('user-2');
    expect(resolveRelayTargetUserId(targets, 'user-3')).toBe('user-3');
  });
});

describe('space-scoped file path helpers', () => {
  it('builds compatibility-layer paths for shared spaces', () => {
    expect(buildSpaceScopedFilePath('spaces/space-1', '')).toBe('spaces/space-1');
    expect(buildSpaceScopedFilePath('spaces/space-1', 'photos')).toBe('spaces/space-1/photos');
    expect(buildSpaceScopedFilePath('/spaces/space-1/', '/photos/family/')).toBe('spaces/space-1/photos/family');
  });

  it('strips compatibility-layer prefixes for shared spaces', () => {
    expect(stripSpaceScopedFilePath('spaces/space-1', 'spaces/space-1')).toBe('');
    expect(stripSpaceScopedFilePath('spaces/space-1', 'spaces/space-1/photos/family')).toBe('photos/family');
    expect(stripSpaceScopedFilePath('/spaces/space-1/', '/spaces/space-1/photos/')).toBe('photos');
  });

  it('keeps non-prefixed paths unchanged', () => {
    expect(stripSpaceScopedFilePath('spaces/space-1', 'legacy/family')).toBe('legacy/family');
    expect(stripSpaceScopedFilePath('', 'family/docs')).toBe('family/docs');
  });
});
