import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  captureSpaceSummaryFromSession,
  clearChatSessionMessages,
  clearHouseholdChat,
  controlDeviceService,
  createHouseholdSpace,
  createSpaceMemory,
  createHouseholdInvitation,
  createHouseholdChatSession,
  deleteSpaceMemory,
  deleteSpaceSummary,
  deleteHouseholdChatSession,
  enableSpaceFamilyApp,
  getFamilyAppCatalog,
  getInstalledFamilyApps,
  getDeviceConfigStatus,
  getDeviceDiagnostics,
  getDeviceInferenceDetail,
  getDeviceOllamaModels,
  getDeviceProviderConfig,
  getDeviceProviders,
  getHouseholdChat,
  getSpaceLibrary,
  getHouseholdChatSession,
  getHouseholdChatSessions,
  getHouseholdSpaceDetail,
  getHouseholdSpaces,
  getHouseholdSummary,
  installFamilyApp,
  onboardDeviceProvider,
  openSpaceSideChannel,
  openSpaceThreadSession,
  removeHouseholdMember,
  resetDeviceToSetupMode,
  revokeHouseholdInvitation,
  relayHouseholdSpaceMessage,
  sendHouseholdChatSessionMessage,
  streamHouseholdChatSessionMessage,
  startDeviceReprovision,
  sendHouseholdChat,
  updateSpaceMemory,
  updateHouseholdChatSession,
  updateDeviceProviderConfig,
  updateHouseholdMemberRole,
} from './householdApi';

const originalFetch = global.fetch;
const originalXmlHttpRequest = global.XMLHttpRequest;

afterEach(() => {
  global.fetch = originalFetch;
  global.XMLHttpRequest = originalXmlHttpRequest;
  vi.restoreAllMocks();
});

describe('getHouseholdSummary', () => {
  it('loads members, invites, devices, and recent activity', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'house-1',
        name: 'Home',
        members: [{ id: 'member-1', display_name: 'Morgan', role: 'owner' }],
        pending_invites: [{ id: 'invite-1', invited_by_name: 'Morgan', invite_code: 'ABCD', role: 'owner', expires_at: '2026-03-20T10:00:00Z' }],
        devices: [{ device_id: 'sbx-1', status: 'bound_online', online: true, claimed: true }],
        recent_activity: [{ id: 'activity-1', event_type: 'device_added', actor_name: 'Morgan', created_at: '2026-03-19T10:00:00Z' }],
      }),
    } as Response);

    const result = await getHouseholdSummary('token-1');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://morgen52.site/familyserver/api/household',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
        }),
      }),
    );
    expect(result.name).toBe('Home');
    expect(result.members).toHaveLength(1);
    expect(result.pendingInvites).toHaveLength(1);
    expect(result.pendingInvites[0]?.role).toBe('owner');
    expect(result.devices).toHaveLength(1);
    expect(result.recentActivity).toHaveLength(1);
  });
});

describe('space and family app API', () => {
  it('loads spaces, creates a space, installs an app, and enables it for a space', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          spaces: [
            {
              id: 'space-private',
              name: '你和 Sparkbox',
              kind: 'private',
              template: 'private',
              member_count: 1,
              thread_count: 3,
              updated_at: '2026-03-20T10:00:00Z',
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'space-parents',
          name: '我和爸妈 + Sparkbox',
          kind: 'shared',
          template: 'parents',
          member_count: 2,
          thread_count: 4,
          updated_at: '2026-03-20T10:02:00Z',
          members: [
            { id: 'user-1', display_name: 'Morgan', role: 'owner' },
            { id: 'user-2', display_name: 'Dad', role: 'member' },
          ],
          threads: [
            { id: 'thread-1', title: '近况与问候', position: 0, chat_session_id: 'chat-thread-1' },
          ],
          enabled_family_apps: [],
          private_side_channel: {
            available: true,
            label: '先私下问问 Sparkbox',
            session_id: null,
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          slug: 'weekend-plans',
          title: '周末安排',
          installed: true,
          risk_level: 'normal',
          space_templates: ['partner', 'parents', 'household_ops'],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          target_user_id: 'user-2',
          chat_session_id: 'chat-side-2',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          available: true,
          label: '先私下问问 Sparkbox',
          session_id: 'chat-side-1',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chat-thread-1',
          name: '我和爸妈 + Sparkbox · 近况与问候',
          scope: 'family',
          owner_user_id: 'user-1',
          system_prompt: '',
          temperature: 0.7,
          max_tokens: 2048,
          created_at: '2026-03-20T10:03:00Z',
          updated_at: '2026-03-20T10:03:00Z',
        }),
      } as Response);

    global.fetch = fetchMock;

    const spaces = await getHouseholdSpaces('token-1');
    const created = await createHouseholdSpace('token-1', {
      name: '我和爸妈 + Sparkbox',
      template: 'parents',
      memberIds: ['user-2'],
    });
    const installed = await installFamilyApp('token-1', 'weekend-plans');
    const enabled = await enableSpaceFamilyApp('token-1', 'space-parents', 'weekend-plans', {
      cadence: 'weekly',
      entryCard: true,
    });
    const relay = await relayHouseholdSpaceMessage('token-1', 'space-parents', {
      targetUserId: 'user-2',
      content: '请 Sparkbox 帮我转述：今晚 8 点开个短会。',
    });
    const sideChannel = await openSpaceSideChannel('token-1', 'space-parents');
    const openedThread = await openSpaceThreadSession('token-1', 'space-parents', 'thread-1');

    expect(spaces).toHaveLength(1);
    expect(spaces[0]?.kind).toBe('private');
    expect(created.members).toHaveLength(2);
    expect(created.threads[0]?.title).toBe('近况与问候');
    expect(created.privateSideChannel).toEqual({
      available: true,
      label: '先私下问问 Sparkbox',
      sessionId: null,
    });
    expect(installed.slug).toBe('weekend-plans');
    expect(enabled).toEqual({ ok: true });
    expect(relay).toEqual({
      ok: true,
      targetUserId: 'user-2',
      chatSessionId: 'chat-side-2',
    });
    expect(sideChannel).toEqual({
      available: true,
      label: '先私下问问 Sparkbox',
      sessionId: 'chat-side-1',
    });
    expect(openedThread.id).toBe('chat-thread-1');
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://morgen52.site/familyserver/api/spaces',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://morgen52.site/familyserver/api/spaces',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: '我和爸妈 + Sparkbox',
          template: 'parents',
          member_ids: ['user-2'],
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://morgen52.site/familyserver/api/family-apps/install',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ slug: 'weekend-plans' }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'https://morgen52.site/familyserver/api/spaces/space-parents/family-apps/weekend-plans/enable',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ cadence: 'weekly', entry_card: true }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      'https://morgen52.site/familyserver/api/spaces/space-parents/relay',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          target_user_id: 'user-2',
          content: '请 Sparkbox 帮我转述：今晚 8 点开个短会。',
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      'https://morgen52.site/familyserver/api/spaces/space-parents/side-channel',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      7,
      'https://morgen52.site/familyserver/api/spaces/space-parents/threads/thread-1/open',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('loads the family app catalog and installed apps', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          apps: [
            {
              slug: 'weekend-plans',
              title: '周末安排',
              installed: false,
              description: '在周末前帮一个空间收口安排',
              risk_level: 'normal',
              space_templates: ['partner', 'parents'],
              capabilities: ['create_tasks', 'send_proactive_messages'],
              supports_proactive_messages: true,
              supports_private_relay: false,
              requires_owner_confirmation: false,
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          apps: [
            {
              slug: 'family-diary',
              title: '家庭小日记',
              installed: true,
              description: '每天一句、每周一页',
              risk_level: 'normal',
              space_templates: ['partner', 'child'],
              capabilities: ['suggest_memories', 'generate_summaries'],
              supports_proactive_messages: true,
              supports_private_relay: false,
              requires_owner_confirmation: false,
            },
          ],
        }),
      } as Response);

    global.fetch = fetchMock;

    const catalog = await getFamilyAppCatalog('token-1');
    const installed = await getInstalledFamilyApps('token-1');

    expect(catalog[0]?.installed).toBe(false);
    expect(catalog[0]?.description).toContain('周末');
    expect(catalog[0]?.capabilities).toContain('create_tasks');
    expect(catalog[0]?.supportsProactiveMessages).toBe(true);
    expect(installed[0]?.installed).toBe(true);
    expect(installed[0]?.description).toContain('每天一句');
    expect(installed[0]?.requiresOwnerConfirmation).toBe(false);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://morgen52.site/familyserver/api/family-apps/catalog',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://morgen52.site/familyserver/api/family-apps/installed',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('loads a space detail with threads and enabled family apps', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'space-parents',
        name: '我和爸妈 + Sparkbox',
        kind: 'shared',
        template: 'parents',
        member_count: 2,
        thread_count: 4,
        updated_at: '2026-03-20T10:02:00Z',
        members: [{ id: 'user-1', display_name: 'Morgan', role: 'owner' }],
        threads: [
          { id: 'thread-1', title: '近况与问候', position: 0, chat_session_id: 'chat-thread-1' },
          { id: 'thread-2', title: '健康与提醒', position: 1 },
        ],
        enabled_family_apps: [
          { slug: 'weekend-plans', title: '周末安排', enabled: true, config: { cadence: 'weekly' } },
        ],
      }),
    } as Response);

    const detail = await getHouseholdSpaceDetail('token-1', 'space-parents');

    expect(detail.threads.map((thread) => thread.title)).toEqual(['近况与问候', '健康与提醒']);
    expect(detail.threads[0]?.chatSessionId).toBe('chat-thread-1');
    expect(detail.enabledFamilyApps[0]?.slug).toBe('weekend-plans');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://morgen52.site/familyserver/api/spaces/space-parents',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('loads library memories and summaries, then mutates them', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          memories: [
            {
              id: 'memory-1',
              title: 'Dad prefers early dinners',
              content: 'Try to arrange dinner before 6:30 pm.',
              pinned: true,
              created_at: '2026-03-20T10:00:00Z',
              updated_at: '2026-03-20T10:00:00Z',
            },
          ],
          summaries: [
            {
              id: 'summary-1',
              title: 'Weekend plan',
              content: 'You agreed to visit parents on Sunday afternoon.',
              source_label: '近况与问候',
              created_at: '2026-03-20T10:10:00Z',
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'memory-2',
          title: 'Medicine drawer',
          content: 'Cold medicine is in the second drawer.',
          pinned: false,
          created_at: '2026-03-20T10:20:00Z',
          updated_at: '2026-03-20T10:20:00Z',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'memory-2',
          title: 'Medicine drawer',
          content: 'Cold medicine is in the second drawer, left side.',
          pinned: true,
          created_at: '2026-03-20T10:20:00Z',
          updated_at: '2026-03-20T10:25:00Z',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'summary-2',
          title: 'Parents check-in',
          content: 'You asked about scheduling dinner next week.',
          source_label: '想和爸妈说的话',
          created_at: '2026-03-20T10:30:00Z',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response);

    global.fetch = fetchMock;

    const library = await getSpaceLibrary('token-1', 'space-parents');
    const createdMemory = await createSpaceMemory('token-1', 'space-parents', {
      title: 'Medicine drawer',
      content: 'Cold medicine is in the second drawer.',
    });
    const updatedMemory = await updateSpaceMemory('token-1', 'space-parents', 'memory-2', {
      content: 'Cold medicine is in the second drawer, left side.',
      pinned: true,
    });
    const removedMemory = await deleteSpaceMemory('token-1', 'space-parents', 'memory-2');
    const capturedSummary = await captureSpaceSummaryFromSession('token-1', 'space-parents', {
      chatSessionId: 'chat-thread-1',
      title: 'Parents check-in',
    });
    const removedSummary = await deleteSpaceSummary('token-1', 'space-parents', 'summary-2');

    expect(library.memories[0]?.pinned).toBe(true);
    expect(library.summaries[0]?.sourceLabel).toBe('近况与问候');
    expect(createdMemory.id).toBe('memory-2');
    expect(updatedMemory.pinned).toBe(true);
    expect(removedMemory).toEqual({ ok: true });
    expect(capturedSummary.id).toBe('summary-2');
    expect(removedSummary).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://morgen52.site/familyserver/api/spaces/space-parents/library',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://morgen52.site/familyserver/api/spaces/space-parents/memories',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: 'Medicine drawer',
          content: 'Cold medicine is in the second drawer.',
          pinned: false,
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://morgen52.site/familyserver/api/spaces/space-parents/memories/memory-2',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          title: undefined,
          content: 'Cold medicine is in the second drawer, left side.',
          pinned: true,
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'https://morgen52.site/familyserver/api/spaces/space-parents/memories/memory-2',
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      'https://morgen52.site/familyserver/api/spaces/space-parents/summaries/from-session',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          source_id: 'chat-thread-1',
          title: 'Parents check-in',
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      'https://morgen52.site/familyserver/api/spaces/space-parents/summaries/summary-2',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

describe('household member management API', () => {
  it('creates invites, changes member roles, and removes members', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          invite_id: 'invite-1',
          invite_code: 'ABCD',
          role: 'owner',
          expires_in_seconds: 604800,
          expires_at: '2026-03-20T10:00:00Z',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          member_id: 'member-1',
          role: 'owner',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          invite_id: 'invite-1',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          member_id: 'member-1',
        }),
      } as Response);

    global.fetch = fetchMock;

    const invite = await createHouseholdInvitation('token-1', 'owner');
    const updated = await updateHouseholdMemberRole('token-1', 'member-1', 'owner');
    const revoked = await revokeHouseholdInvitation('token-1', 'invite-1');
    const removed = await removeHouseholdMember('token-1', 'member-1');

    expect(invite.role).toBe('owner');
    expect(updated).toEqual({ ok: true, memberId: 'member-1', role: 'owner' });
    expect(revoked).toEqual({ ok: true, inviteId: 'invite-1' });
    expect(removed).toEqual({ ok: true, memberId: 'member-1' });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://morgen52.site/familyserver/api/auth/invitations',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ role: 'owner' }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://morgen52.site/familyserver/api/household/members/member-1/role',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ role: 'owner' }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://morgen52.site/familyserver/api/auth/invitations/invite-1',
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'https://morgen52.site/familyserver/api/household/members/member-1',
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });
});

describe('household chat API', () => {
  it('loads history, sends a message, and clears chat', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messages: [{ role: 'assistant', content: 'hi' }],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          device_id: 'sbx-1',
          message: 'hello back',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response);

    global.fetch = fetchMock;

    const history = await getHouseholdChat('token-1');
    const response = await sendHouseholdChat('token-1', [
      { role: 'user', content: 'hello' },
    ]);
    const cleared = await clearHouseholdChat('token-1');

    expect(history.messages).toEqual([{ role: 'assistant', content: 'hi' }]);
    expect(response.message).toBe('hello back');
    expect(cleared).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://morgen52.site/familyserver/api/chat/household',
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://morgen52.site/familyserver/api/chat/household',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'hello' }],
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://morgen52.site/familyserver/api/chat/household',
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });
});

describe('scoped chat session API', () => {
  it('lists, creates, updates, sends, clears, and deletes chat sessions', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 'chat-1',
            name: 'Family planning',
            scope: 'family',
            owner_user_id: 'user-1',
            system_prompt: '',
            temperature: 0.7,
            max_tokens: 2048,
            created_at: '2026-03-20T10:00:00Z',
            updated_at: '2026-03-20T10:00:00Z',
          },
        ]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chat-2',
          name: 'Private notes',
          scope: 'private',
          owner_user_id: 'user-1',
          system_prompt: 'Be concise',
          temperature: 0.4,
          max_tokens: 1024,
          created_at: '2026-03-20T10:01:00Z',
          updated_at: '2026-03-20T10:01:00Z',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chat-2',
          name: 'Private notes',
          scope: 'private',
          owner_user_id: 'user-1',
          system_prompt: 'Be concise',
          temperature: 0.4,
          max_tokens: 1024,
          created_at: '2026-03-20T10:01:00Z',
          updated_at: '2026-03-20T10:01:00Z',
          messages: [
            { role: 'user', content: 'hello', sender_display_name: 'Owner' },
            { role: 'assistant', content: 'hi', sender_display_name: null },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chat-2',
          name: 'Private notes renamed',
          scope: 'private',
          owner_user_id: 'user-1',
          system_prompt: 'Be concise',
          temperature: 0.6,
          max_tokens: 2048,
          created_at: '2026-03-20T10:01:00Z',
          updated_at: '2026-03-20T10:02:00Z',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          device_id: 'sbx-1',
          message: 'reply',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response);

    global.fetch = fetchMock;

    const listed = await getHouseholdChatSessions('token-1', 'family');
    const created = await createHouseholdChatSession('token-1', {
      name: 'Private notes',
      scope: 'private',
      systemPrompt: 'Be concise',
      temperature: 0.4,
      maxTokens: 1024,
    });
    const detail = await getHouseholdChatSession('token-1', 'chat-2');
    const updated = await updateHouseholdChatSession('token-1', 'chat-2', {
      name: 'Private notes renamed',
      temperature: 0.6,
      maxTokens: 2048,
      lastKnownUpdatedAt: '2026-03-20T10:01:00Z',
    });
    const sent = await sendHouseholdChatSessionMessage('token-1', 'chat-2', 'hello again');
    const cleared = await clearChatSessionMessages('token-1', 'chat-2');
    const removed = await deleteHouseholdChatSession('token-1', 'chat-2');

    expect(listed).toHaveLength(1);
    expect(created.scope).toBe('private');
    expect(detail.messages[0]).toEqual({ role: 'user', content: 'hello', senderDisplayName: 'Owner' });
    expect(updated.name).toBe('Private notes renamed');
    expect(sent).toEqual({ deviceId: 'sbx-1', message: 'reply' });
    expect(cleared).toEqual({ ok: true });
    expect(removed).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://morgen52.site/familyserver/api/chat/sessions?scope=family',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://morgen52.site/familyserver/api/chat/sessions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Private notes',
          scope: 'private',
          system_prompt: 'Be concise',
          temperature: 0.4,
          max_tokens: 1024,
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      'https://morgen52.site/familyserver/api/chat/sessions/chat-2/messages',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content: 'hello again' }),
      }),
    );
  });

  it('streams pending, token, and done events through XMLHttpRequest', async () => {
    class FakeXmlHttpRequest {
      static sentBodies: string[] = [];
      readyState = 0;
      status = 200;
      responseText = '';
      onprogress: (() => void) | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      headers: Record<string, string> = {};

      open(_method: string, _url: string) {
        this.readyState = 1;
      }

      setRequestHeader(name: string, value: string) {
        this.headers[name] = value;
      }

      send(body?: Document | XMLHttpRequestBodyInit | null) {
        FakeXmlHttpRequest.sentBodies.push(String(body ?? ''));
        this.responseText += 'event: pending\ndata: {"type":"pending","device_id":"sbx-1","message":"Preparing"}\n\n';
        this.onprogress?.();
        this.responseText += 'event: token\ndata: {"type":"token","content":"Hello "}\n\n';
        this.onprogress?.();
        this.responseText += 'event: token\ndata: {"type":"token","content":"family"}\n\n';
        this.onprogress?.();
        this.responseText += 'event: done\ndata: {"type":"done","device_id":"sbx-1","message":"Hello family"}\n\n';
        this.onload?.();
      }
    }

    global.XMLHttpRequest = FakeXmlHttpRequest as unknown as typeof XMLHttpRequest;

    const events: string[] = [];
    const response = await streamHouseholdChatSessionMessage('token-1', 'chat-2', 'hello again', {
      onPending: (event) => events.push(`pending:${event.message}`),
      onToken: (event) => events.push(`token:${event.content}`),
      onDone: (event) => events.push(`done:${event.message}`),
    });

    expect(response).toEqual({ deviceId: 'sbx-1', message: 'Hello family' });
    expect(events).toEqual([
      'pending:Preparing',
      'token:Hello ',
      'token:family',
      'done:Hello family',
    ]);
    expect(FakeXmlHttpRequest.sentBodies).toEqual([JSON.stringify({ content: 'hello again' })]);
  });
});

describe('device reprovision API', () => {
  it('starts reprovisioning without unclaiming the device', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        device_id: 'sbx-1',
        status: 'setup_ap_active',
      }),
    } as Response);

    const response = await startDeviceReprovision('token-1', 'sbx-1');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://morgen52.site/familyserver/api/devices/sbx-1/reprovision',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
        }),
      }),
    );
    expect(response).toEqual({
      ok: true,
      deviceId: 'sbx-1',
      status: 'setup_ap_active',
    });
  });
});

describe('device diagnostics API', () => {
  it('loads diagnostics and resets a device to setup mode', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cache: { source: 'live', summary: 'Ready on wlan0' },
          setup: { status: 'bound_online' },
          network: { control_mode: 'nmcli', wifi_interface: 'wlan0' },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          device_id: 'sbx-1',
          status: 'setup_ap_active',
        }),
      } as Response);

    global.fetch = fetchMock;

    const diagnostics = await getDeviceDiagnostics('token-1', 'sbx-1');
    const reset = await resetDeviceToSetupMode('token-1', 'sbx-1');

    expect(diagnostics.setup?.status).toBe('bound_online');
    expect(reset).toEqual({
      ok: true,
      deviceId: 'sbx-1',
      status: 'setup_ap_active',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://morgen52.site/familyserver/api/devices/sbx-1/diagnostics',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://morgen52.site/familyserver/api/devices/sbx-1/reset',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('device config API', () => {
  it('loads and mutates advanced owner device settings', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ollama: { service: 'active', api: 'ok' },
          inference: { active: false, queued_requests: 0, queue_limit: 2 },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ['ollama', 'openai'],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ name: 'qwen3.5:9b', size: 123 }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          default_provider: 'ollama',
          default_model: 'qwen3.5:9b',
          provider_timeout_secs: 120,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, output: 'done' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          active_request: null,
          queue: [],
          queued_requests: 0,
          queue_limit: 2,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, output: 'restart ok' }),
      } as Response);

    global.fetch = fetchMock;

    const status = await getDeviceConfigStatus('token-1', 'sbx-1');
    const providers = await getDeviceProviders('token-1', 'sbx-1');
    const models = await getDeviceOllamaModels('token-1', 'sbx-1');
    const config = await getDeviceProviderConfig('token-1', 'sbx-1');
    const updated = await updateDeviceProviderConfig('token-1', 'sbx-1', {
      defaultProvider: 'ollama',
      defaultModel: 'qwen3.5:9b',
      providerTimeoutSecs: 120,
    });
    const onboarded = await onboardDeviceProvider('token-1', 'sbx-1', {
      provider: 'ollama',
      model: 'qwen3.5:9b',
      apiKey: 'secret',
      apiUrl: 'http://127.0.0.1:11434',
    });
    const inference = await getDeviceInferenceDetail('token-1', 'sbx-1');
    const controlled = await controlDeviceService('token-1', 'sbx-1', 'ollama', 'restart');

    expect(status.ollama?.service).toBe('active');
    expect(providers).toEqual(['ollama', 'openai']);
    expect(models[0]?.name).toBe('qwen3.5:9b');
    expect(config.defaultProvider).toBe('ollama');
    expect(updated.ok).toBe(true);
    expect(onboarded.output).toBe('done');
    expect(inference.queue_limit).toBe(2);
    expect(controlled.output).toBe('restart ok');
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://morgen52.site/familyserver/api/devices/sbx-1/config/status',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      8,
      'https://morgen52.site/familyserver/api/devices/sbx-1/config/services/ollama',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ action: 'restart' }),
      }),
    );
  });
});
