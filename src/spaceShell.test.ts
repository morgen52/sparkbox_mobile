import { describe, expect, it } from 'vitest';

import {
  buildChatScopeResetState,
  buildSpaceScopedResetState,
  buildSpaceScopedFilePath,
  buildSharedChatParticipantLabels,
  buildSharedChatParticipantSummary,
  canCreateChatSession,
  canManageChatSession,
  canManageSpaceFamilyApps,
  canMutateSpaceFiles,
  canMutateSpaceLibrary,
  describeActiveChatEmptyStateCopy,
  describeActiveChatFallbackTitle,
  describeActiveChatSessionCopy,
  describeChatEditorPrimaryActionLabel,
  describeChatEditorTitle,
  describeChatEditorVerb,
  describeChatNamePlaceholder,
  describeCaptureSummaryActionLabel,
  describeChatSessionBadge,
  describeChatSessionCreatePermissionError,
  describeChatSessionEmptyStateCopy,
  describeChatSessionOpenError,
  describeChatSessionPurpose,
  describeChatSessionPreview,
  shouldAppendAssistantReply,
  describeChatAccess,
  describeChatSessionPrimaryActionLabel,
  describeChatComposerPlaceholder,
  describeChatSendPhase,
  describeFamilyAppRiskLevel,
  describeSummaryEmptyStateCopy,
  describeSummarySectionCopy,
  describeSpaceOverviewCopy,
  describeSpaceSummaryCaptureMissingChatCopy,
  describeSpaceThreadEmptyStateCopy,
  describeSpaceThreadRowBadge,
  describeSpaceThreadRowCopy,
  describeSpaceThreadSectionCopy,
  describeSpaceThreadSectionTitle,
  looksLikeSharedGroupChatSession,
  describeTopicCount,
  describeSpaceKind,
  describeSpaceCounts,
  formatFamilyAppConfigSummary,
  formatFamilyAppCapabilities,
  formatSpaceTemplateList,
  getRelayTargets,
  isSharedGroupChatSession,
  mapSpaceKindToLegacyScope,
  describeCurrentSpaceSummaryCopy,
  resolveTaskSpaceId,
  resolveActiveSpaceId,
  resolveRelayTargetUserId,
  resolveSpaceCopyContext,
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

  it('restores the stored active space when the shell is starting fresh', () => {
    expect(resolveActiveSpaceId(spaces, '', 'space-shared')).toBe('space-shared');
  });

  it('falls back when the stored active space no longer exists', () => {
    expect(resolveActiveSpaceId([spaces[1], spaces[0]], '', 'space-missing')).toBe('space-shared');
  });

  it('prefers the shared space when a new shell session has no saved selection', () => {
    expect(resolveActiveSpaceId(spaces, '')).toBe('space-shared');
    expect(resolveActiveSpaceId([spaces[1], spaces[0]], '')).toBe('space-shared');
  });
});

describe('space identity helpers', () => {
  it('describes private and shared spaces with explicit labels', () => {
    expect(describeSpaceKind('private')).toBe('Just you + Sparkbox');
    expect(describeSpaceKind('shared')).toBe('Shared space');
  });

  it('describes family chat access using space language', () => {
    expect(describeChatAccess('family')).toBe('Shared here');
    expect(describeChatAccess('private')).toBe('Just you');
  });

  it('treats empty assistant completions as intentionally silent', () => {
    expect(shouldAppendAssistantReply('Thanks for sharing.')).toBe(true);
    expect(shouldAppendAssistantReply('')).toBe(false);
    expect(shouldAppendAssistantReply('   ')).toBe(false);
  });

  it('marks shared family chats as group chats in shared spaces', () => {
    const sharedSpace = {
      id: 'space-shared',
      name: 'qwer\'s Household',
      kind: 'shared' as const,
      template: 'household' as const,
      memberCount: 2,
      threadCount: 1,
      updatedAt: '2026-03-20T10:01:00Z',
      members: [],
      threads: [],
      enabledFamilyApps: [],
      privateSideChannel: null,
    };

    expect(isSharedGroupChatSession('family', sharedSpace)).toBe(true);
    expect(isSharedGroupChatSession('private', sharedSpace)).toBe(false);
    expect(describeChatSessionBadge({ sessionName: 'Group chat', scope: 'family', spaceDetail: sharedSpace, active: false })).toBe(
      'group chat',
    );
    expect(
      describeChatSessionBadge({ sessionName: 'Weekend plans', scope: 'family', spaceDetail: sharedSpace, active: true }),
    ).toBe('Shared here');
    expect(
      describeChatSessionPurpose({
        sessionName: 'Group chat',
        scope: 'family',
        spaceDetail: sharedSpace,
      }),
    ).toBe('Sparkbox helping everyone stay in sync.');
    expect(
      describeChatSessionPurpose({
        sessionName: 'Weekend plans',
        scope: 'family',
        spaceDetail: sharedSpace,
      }),
    ).toBe('Shared chat with Sparkbox for this space.');
    expect(
      describeChatSessionPurpose({
        sessionName: 'Weekend plans',
        scope: 'private',
        spaceDetail: sharedSpace,
      }),
    ).toBe('Private side chat with Sparkbox before you bring anything back to the shared space.');
    expect(
      describeChatSessionPreview(
        {
          lastMessagePreview: 'Can you grab milk on the way home?',
          lastMessageRole: 'user',
          lastMessageSenderDisplayName: 'qwer',
        },
        'morgen',
      ),
    ).toBe('qwer: Can you grab milk on the way home?');
    expect(
      describeChatSessionPreview(
        {
          lastMessagePreview: 'I can summarize that for everyone.',
          lastMessageRole: 'assistant',
          lastMessageSenderDisplayName: null,
        },
        'morgen',
      ),
    ).toBe('Sparkbox: I can summarize that for everyone.');
    expect(
      describeChatSessionPreview(
        {
          lastMessagePreview:
            "Hello! 👋 I'm Sparkbox, ready to help out in *webgroup*.\n\n- Need a quick **brainstorm** or some help organizing your thoughts?",
          lastMessageRole: 'assistant',
          lastMessageSenderDisplayName: null,
        },
        'morgen',
      ),
    ).toBe("Sparkbox: Hello! 👋 I'm Sparkbox, ready to help out in webgroup. - Need a quick brainstorm or some help...");
  });

  it('returns group-chat fallback copy that reads like an inbox row', () => {
    expect(
      describeChatSessionPurpose({
        sessionName: "qwer's Household · Group chat",
        scope: 'family',
        spaceDetail: {
          kind: 'shared',
          name: "qwer's Household",
        },
      }),
    ).toBe('Sparkbox helping everyone stay in sync.');
  });

  it('returns a sender-prefixed preview for other family members', () => {
    expect(
      describeChatSessionPreview(
        {
          lastMessagePreview: 'Dinner is ready',
          lastMessageRole: 'user',
          lastMessageSenderDisplayName: 'qwer',
        },
        'morgen',
      ),
    ).toBe('qwer: Dinner is ready');
  });

  it('never builds a list preview from client-only pending or failure rows', () => {
    expect(
      describeChatSessionPreview(
        {
          lastMessagePreview: '',
          lastMessageRole: null,
          lastMessageSenderDisplayName: null,
        },
        'morgen',
      ),
    ).toBe('');
  });

  it('does not call private-space family chats shared topics', () => {
    const privateSpace = {
      id: 'space-private',
      name: 'You + Sparkbox',
      kind: 'private' as const,
      template: 'private' as const,
      memberCount: 1,
      threadCount: 3,
      updatedAt: '2026-03-20T10:01:00Z',
      members: [],
      threads: [],
      enabledFamilyApps: [],
      privateSideChannel: null,
    };

    expect(
      describeChatSessionPurpose({
        sessionName: 'Today and this week',
        scope: 'family',
        spaceDetail: privateSpace,
      }),
    ).toBe('Chat with Sparkbox for this space.');
  });

  it('keeps normalized group chat names looking like group chats before active space detail loads', () => {
    expect(looksLikeSharedGroupChatSession('Group chat', 'family', null)).toBe(true);
    expect(looksLikeSharedGroupChatSession("qwer's Household · Group chat", 'family', null)).toBe(true);
    expect(looksLikeSharedGroupChatSession('Weekend plans', 'family', null)).toBe(false);
    expect(looksLikeSharedGroupChatSession('Group chat', 'private', null)).toBe(false);
  });

  it('formats space templates into friendly labels', () => {
    expect(formatSpaceTemplateList(['partner', 'parents', 'household_ops'])).toBe(
      'Partner · Parents · Home routines',
    );
  });

  it('formats family app capabilities into user-facing copy', () => {
    expect(formatFamilyAppCapabilities(['create_tasks', 'send_proactive_messages'])).toBe(
      'plans and routines · proactive check-ins',
    );
    expect(formatFamilyAppCapabilities(['open_private_side_channel', 'request_confirmed_relay'])).toBe(
      'private check-ins · owner-approved relays',
    );
    expect(formatFamilyAppCapabilities(['use_photos_as_context'])).toBe('shared photos');
  });

  it('falls back to readable words for unknown family app capabilities', () => {
    expect(formatFamilyAppCapabilities(['use_magic_mode'])).toBe('use magic mode');
  });

  it('describes family app risk levels with delivery copy', () => {
    expect(describeFamilyAppRiskLevel('normal')).toBe('Routine');
    expect(describeFamilyAppRiskLevel('sensitive')).toBe('Sensitive');
  });

  it('keeps enabled family app config copy away from raw internal keys', () => {
    expect(
      formatFamilyAppConfigSummary({
        allowed_templates: ['parents'],
        use_magic_mode: true,
      }),
    ).toBe('Ready in this space');
  });

  it('pluralizes space topic and member counts for the UI', () => {
    expect(describeSpaceCounts('shared', 1, 2)).toBe('1 chat · 2 members');
    expect(describeSpaceCounts('shared', 3, 1)).toBe('3 chats · 1 member');
    expect(describeSpaceCounts('private', 3, 1)).toBe('3 topics · 1 member');
    expect(describeTopicCount(1)).toBe('1 topic');
    expect(describeTopicCount(4)).toBe('4 topics');
  });

  it('keeps the spaces overview in people-and-chat language', () => {
    expect(describeSpaceOverviewCopy()).toBe(
      'Start with the people first. Every space keeps its own chats, memories, and shared history.',
    );
  });

  it('keeps the current-space settings summary aligned with shared chat language', () => {
    expect(describeCurrentSpaceSummaryCopy("qwer's Household", 'Shared space', 'shared', 1)).toBe(
      "You're viewing qwer's Household (Shared space), and it already has 1 chat.",
    );
    expect(describeCurrentSpaceSummaryCopy('You + Sparkbox', 'Just you + Sparkbox', 'private', 3)).toBe(
      "You're viewing You + Sparkbox (Just you + Sparkbox), and it already has 3 topics.",
    );
  });

  it('keeps shared-space collection and fallback chat copy in group-chat language', () => {
    const sharedSpace = {
      id: 'space-shared',
      name: "qwer's Household",
      kind: 'shared' as const,
      template: 'household' as const,
      memberCount: 2,
      threadCount: 1,
      updatedAt: '2026-03-20T10:01:00Z',
      members: [],
      threads: [],
      enabledFamilyApps: [],
      privateSideChannel: null,
    };

    expect(describeSpaceThreadSectionTitle(sharedSpace)).toBe('Chats in this space');
    expect(describeSpaceThreadSectionCopy(sharedSpace)).toBe(
      "qwer's Household keeps the main group chat and any extra shared chats together here.",
    );
    expect(describeSpaceThreadEmptyStateCopy(sharedSpace)).toBe('No chats yet.');
    expect(describeActiveChatFallbackTitle(sharedSpace)).toBe('Active group chat');
    expect(describeActiveChatEmptyStateCopy(sharedSpace)).toBe(
      'Pick the main group chat or another shared chat to keep everyone in one running conversation.',
    );
    expect(describeActiveChatSessionCopy('Group chat', sharedSpace, true)).toBe(
      "qwer's Household uses this as one group chat for everyone in the space, and Sparkbox helps the shared conversation keep moving.",
    );
    expect(describeChatComposerPlaceholder(sharedSpace, false, false)).toBe('Pick a chat in this space first');
    expect(describeChatComposerPlaceholder(sharedSpace, true, false)).toBe('Ask Sparkbox in this chat');
    expect(describeSpaceSummaryCaptureMissingChatCopy(sharedSpace)).toBe(
      'Open a chat in Chats first so Sparkbox knows what to summarize.',
    );
    expect(describeChatSessionPrimaryActionLabel(sharedSpace, 'family')).toBe('New chat');
    expect(describeChatSessionEmptyStateCopy(sharedSpace, 'family')).toBe(
      'No chats yet. Start one when this space needs Sparkbox.',
    );
    expect(describeChatSessionOpenError(sharedSpace)).toBe('Could not open this chat yet.');
    expect(describeChatSessionCreatePermissionError(sharedSpace, 'family')).toBe(
      'Only owners can create shared chats in this space.',
    );
    expect(describeChatEditorVerb(sharedSpace, 'family')).toBe('chat');
    expect(describeChatEditorTitle(sharedSpace, 'family', false)).toBe('Start a chat for this shared space');
    expect(describeChatEditorTitle(sharedSpace, 'family', true)).toBe('Keep this chat clear for everyone');
    expect(describeChatEditorPrimaryActionLabel(sharedSpace, 'family', false)).toBe('Create chat');
    expect(describeChatEditorPrimaryActionLabel(sharedSpace, 'family', true)).toBe('Save chat');
    expect(describeChatNamePlaceholder(sharedSpace, 'family')).toBe('Chat name');
    expect(describeCaptureSummaryActionLabel(sharedSpace)).toBe('Save recap from open chat');
    expect(describeSummarySectionCopy(sharedSpace)).toBe(
      'Summaries are read-only snapshots Sparkbox can generate from a chat so other family members can catch up quickly.',
    );
    expect(describeSummaryEmptyStateCopy(sharedSpace, true, '')).toBe(
      'Pick a chat in Chats first if you want Sparkbox to snapshot that conversation.',
    );
    expect(describeSummaryEmptyStateCopy(sharedSpace, false, '')).toBe(
      'Owners can capture chat snapshots from Chats. You can still read every summary saved for this space.',
    );
    expect(describeSummaryEmptyStateCopy(sharedSpace, true, 'Group chat')).toBe('Open chat: Group chat');
  });

  it('keeps shared chat copy in chat language even before full space detail loads', () => {
    const sharedSummary = {
      id: 'space-shared',
      name: "qwer's Household",
      kind: 'shared' as const,
      template: 'household' as const,
      memberCount: 2,
      threadCount: 1,
      updatedAt: '2026-03-20T10:01:00Z',
    };

    const copyContext = resolveSpaceCopyContext(null, sharedSummary);

    expect(describeChatSessionPrimaryActionLabel(copyContext, 'family')).toBe('New chat');
    expect(describeSpaceThreadSectionTitle(copyContext)).toBe('Chats in this space');
    expect(describeSpaceThreadSectionCopy(copyContext)).toBe(
      "qwer's Household keeps the main group chat and any extra shared chats together here.",
    );
    expect(describeSpaceThreadEmptyStateCopy(copyContext)).toBe('No chats yet.');
    expect(describeActiveChatFallbackTitle(copyContext)).toBe('Active group chat');
    expect(describeActiveChatSessionCopy("qwer's Household · Group chat", copyContext, true)).toBe(
      "qwer's Household uses this as one group chat for everyone in the space, and Sparkbox helps the shared conversation keep moving.",
    );
    expect(describeActiveChatEmptyStateCopy(copyContext)).toBe(
      'Pick the main group chat or another shared chat to keep everyone in one running conversation.',
    );
    expect(describeChatComposerPlaceholder(copyContext, true, true)).toBe('Message the group');
    expect(describeChatComposerPlaceholder(copyContext, true, false)).toBe('Ask Sparkbox in this chat');
  });

  it('keeps only the main shared thread labeled as the group chat', () => {
    const sharedSpace = {
      id: 'space-shared',
      name: "qwer's Household",
      kind: 'shared' as const,
      template: 'household' as const,
      memberCount: 2,
      threadCount: 3,
      updatedAt: '2026-03-20T10:01:00Z',
      members: [],
      threads: [],
      enabledFamilyApps: [],
      privateSideChannel: null,
    };

    expect(describeSpaceThreadRowBadge(sharedSpace, 'Group chat', true, false)).toBe('group chat');
    expect(describeSpaceThreadRowBadge(sharedSpace, 'Today and this week', true, false)).toBe('shared chat');
    expect(describeSpaceThreadRowCopy(sharedSpace, 'Group chat', true, false)).toBe(
      'Continue this group chat with everyone in the space.',
    );
    expect(describeSpaceThreadRowCopy(sharedSpace, 'Today and this week', true, false)).toBe(
      'Continue this shared chat with everyone in the space.',
    );
    expect(describeSpaceThreadRowCopy(sharedSpace, 'Weekend plans', false, false)).toBe(
      'Start this shared chat with everyone in the space.',
    );
  });

  it('keeps private-space chat editor copy in topic language', () => {
    const privateSpace = {
      id: 'space-private',
      name: 'You + Sparkbox',
      kind: 'private' as const,
      template: 'private' as const,
      memberCount: 1,
      threadCount: 3,
      updatedAt: '2026-03-20T10:01:00Z',
      members: [],
      threads: [],
      enabledFamilyApps: [],
      privateSideChannel: null,
    };

    expect(describeChatSessionPrimaryActionLabel(privateSpace, 'private')).toBe('New topic');
    expect(describeChatSessionEmptyStateCopy(privateSpace, 'private')).toBe(
      'No topics yet. Start one when this space needs Sparkbox.',
    );
    expect(describeChatSessionOpenError(privateSpace)).toBe('Could not open this topic yet.');
    expect(describeChatSessionCreatePermissionError(privateSpace, 'private')).toBe(
      'Only owners can create shared topics in this space.',
    );
    expect(describeChatEditorVerb(privateSpace, 'private')).toBe('topic');
    expect(describeChatEditorTitle(privateSpace, 'private', false)).toBe('Start a private topic with Sparkbox');
    expect(describeChatEditorPrimaryActionLabel(privateSpace, 'private', false)).toBe('Create topic');
    expect(describeChatNamePlaceholder(privateSpace, 'private')).toBe('Topic name');
    expect(describeCaptureSummaryActionLabel(privateSpace)).toBe('Capture active topic');
    expect(describeSummarySectionCopy(privateSpace)).toBe(
      'Summaries are read-only snapshots Sparkbox can generate from a topic so other family members can catch up quickly.',
    );
    expect(describeSummaryEmptyStateCopy(privateSpace, true, '')).toBe(
      'Pick a topic in Chats first if you want Sparkbox to snapshot that conversation.',
    );
    expect(describeSpaceThreadEmptyStateCopy(privateSpace)).toBe('No topics yet.');
  });
});

describe('chat send state helpers', () => {
  it('describes pending chat send phases for the UI', () => {
    expect(describeChatSendPhase('sending')).toBe('Sparkbox is preparing the first reply');
    expect(describeChatSendPhase('streaming')).toBe('Sparkbox is still replying');
    expect(describeChatSendPhase('timed_out')).toBe('Sparkbox is taking longer than usual');
    expect(describeChatSendPhase('failed')).toBe('Sparkbox could not finish the reply');
  });
});

describe('chat management permissions', () => {
  it('keeps shared topic creation owner-only in shared spaces', () => {
    expect(
      canCreateChatSession({
        currentUserRole: 'owner',
        sessionScope: 'family',
        spaceKind: 'shared',
      }),
    ).toBe(true);
    expect(
      canCreateChatSession({
        currentUserRole: 'member',
        sessionScope: 'family',
        spaceKind: 'shared',
      }),
    ).toBe(false);
  });

  it('still allows members to start private side chats inside shared spaces', () => {
    expect(
      canCreateChatSession({
        currentUserRole: 'member',
        sessionScope: 'private',
        spaceKind: 'shared',
      }),
    ).toBe(true);
  });

  it('allows owners to manage any active chat', () => {
    expect(
      canManageChatSession({
        currentUserRole: 'owner',
        currentUserId: 'user-owner',
        sessionOwnerUserId: 'user-other',
        sessionScope: 'family',
        spaceKind: 'shared',
      }),
    ).toBe(true);
  });

  it('allows members to manage only chats they own', () => {
    expect(
      canManageChatSession({
        currentUserRole: 'member',
        currentUserId: 'user-member',
        sessionOwnerUserId: 'user-member',
        sessionScope: 'private',
        spaceKind: 'private',
      }),
    ).toBe(true);
    expect(
      canManageChatSession({
        currentUserRole: 'member',
        currentUserId: 'user-member',
        sessionOwnerUserId: 'user-owner',
        sessionScope: 'private',
        spaceKind: 'private',
      }),
    ).toBe(false);
  });

  it('keeps shared group chat management owner-only even when a member opened the session', () => {
    expect(
      canManageChatSession({
        currentUserRole: 'member',
        currentUserId: 'user-member',
        sessionOwnerUserId: 'user-member',
        sessionScope: 'family',
        spaceKind: 'shared',
      }),
    ).toBe(false);
  });
});

describe('space library permissions', () => {
  it('keeps shared space library mutations owner-only', () => {
    expect(
      canMutateSpaceLibrary({
        spaceKind: 'shared',
        currentUserRole: 'owner',
      }),
    ).toBe(true);
    expect(
      canMutateSpaceLibrary({
        spaceKind: 'shared',
        currentUserRole: 'member',
      }),
    ).toBe(false);
  });

  it('keeps private space library mutations available to the signed-in user', () => {
    expect(
      canMutateSpaceLibrary({
        spaceKind: 'private',
        currentUserRole: 'member',
      }),
    ).toBe(true);
    expect(
      canMutateSpaceLibrary({
        spaceKind: undefined,
        currentUserRole: 'member',
      }),
    ).toBe(true);
  });

  it('keeps shared photos and files owner-only in shared spaces', () => {
    expect(
      canMutateSpaceFiles({
        spaceKind: 'shared',
        currentUserRole: 'owner',
        fileSpace: 'family',
      }),
    ).toBe(true);
    expect(
      canMutateSpaceFiles({
        spaceKind: 'shared',
        currentUserRole: 'member',
        fileSpace: 'family',
      }),
    ).toBe(false);
    expect(
      canMutateSpaceFiles({
        spaceKind: 'private',
        currentUserRole: 'member',
        fileSpace: 'private',
      }),
    ).toBe(true);
  });
});

describe('space family app permissions', () => {
  it('keeps enabled shared-space family app controls owner-only', () => {
    expect(canManageSpaceFamilyApps('owner')).toBe(true);
    expect(canManageSpaceFamilyApps('member')).toBe(false);
    expect(canManageSpaceFamilyApps(undefined)).toBe(false);
  });
});

describe('shared chat participant labels', () => {
  const sharedSpace = {
    id: 'space-shared',
    name: 'qwer\'s Household',
    kind: 'shared' as const,
    template: 'parents' as const,
    memberCount: 2,
    threadCount: 1,
    updatedAt: '2026-03-20T10:01:00Z',
    members: [
      { id: 'user-owner', displayName: 'qwer', role: 'owner' as const },
      { id: 'user-member', displayName: 'morgen', role: 'member' as const },
    ],
    threads: [],
    enabledFamilyApps: [],
    privateSideChannel: null,
  };

  it('puts the current user first as You for shared chats', () => {
    expect(buildSharedChatParticipantLabels(sharedSpace, 'user-member')).toEqual(['You', 'qwer']);
    expect(buildSharedChatParticipantLabels(sharedSpace, 'user-owner')).toEqual(['You', 'morgen']);
    expect(buildSharedChatParticipantSummary(sharedSpace, 'user-member')).toBe('You · qwer · Sparkbox');
  });

  it('returns no shared participant labels for private or missing spaces', () => {
    expect(
      buildSharedChatParticipantLabels(
        {
          ...sharedSpace,
          id: 'space-private',
          kind: 'private',
          template: 'private',
        },
        'user-owner',
      ),
    ).toEqual([]);
    expect(buildSharedChatParticipantLabels(null, 'user-owner')).toEqual([]);
    expect(buildSharedChatParticipantSummary(null, 'user-owner')).toBe('');
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

describe('task space scoping', () => {
  it('keeps every shared space task list scoped by space id, including household spaces', () => {
    expect(
      resolveTaskSpaceId({
        id: 'space-household',
        name: 'qwer\'s Household',
        kind: 'shared',
        template: 'household',
        memberCount: 2,
        threadCount: 1,
        updatedAt: '2026-03-20T10:01:00Z',
      }),
    ).toBe('space-household');
    expect(
      resolveTaskSpaceId({
        id: 'space-partner',
        name: 'webgroup',
        kind: 'shared',
        template: 'partner',
        memberCount: 2,
        threadCount: 4,
        updatedAt: '2026-03-20T10:02:00Z',
      }),
    ).toBe('space-partner');
    expect(
      resolveTaskSpaceId({
        id: 'space-private',
        name: '你和 Sparkbox',
        kind: 'private',
        template: 'private',
        memberCount: 1,
        threadCount: 3,
        updatedAt: '2026-03-20T10:03:00Z',
      }),
    ).toBe('');
    expect(resolveTaskSpaceId(null)).toBe('');
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

describe('space-scoped reset state', () => {
  it('clears active chat context before a scope switch refresh completes', () => {
    expect(buildChatScopeResetState()).toEqual({
      chatSessions: [],
      activeChatSessionId: '',
      activeChatSession: null,
      chatDraft: '',
    });
  });

  it('clears chat, library, file, and task state before a new space loads', () => {
    expect(buildSpaceScopedResetState()).toEqual({
      chatSessions: [],
      activeChatSessionId: '',
      activeChatSession: null,
      chatDraft: '',
      spaceLibrary: { memories: [], summaries: [] },
      fileListing: null,
      tasks: [],
    });
  });
});
