const CLOUD_API_BASE = 'https://morgen52.site/familyserver';

export type DeviceSummary = {
  device_id: string;
  status: string;
  claimed: boolean;
  online: boolean;
  last_seen_at?: string | null;
  network_ready?: boolean | null;
  self_heal_healthy?: boolean | null;
  remote_reset_armed?: boolean | null;
  attention_reason?: string | null;
  last_health_check_at?: string | null;
  last_health_check_summary?: string | null;
};

export type HouseholdMemberSummary = {
  id: string;
  display_name: string;
  role: 'owner' | 'member';
};

export type HouseholdInviteSummary = {
  id: string;
  invited_by_name: string;
  invite_code?: string | null;
  role: 'owner' | 'member';
  expires_at: string;
};

export type HouseholdActivitySummary = {
  id: string;
  event_type: string;
  actor_name: string;
  subject_name?: string | null;
  details?: string | null;
  created_at: string;
};

export type SpaceKind = 'private' | 'shared';
export type SpaceTemplate = 'private' | 'household' | 'partner' | 'parents' | 'child' | 'household_ops';

export type HouseholdSpaceSummary = {
  id: string;
  name: string;
  kind: SpaceKind;
  template: SpaceTemplate;
  memberCount: number;
  threadCount: number;
  updatedAt: string;
};

export type HouseholdSpaceMember = {
  id: string;
  displayName: string;
  role: 'owner' | 'member';
};

export type HouseholdSpaceThread = {
  id: string;
  title: string;
  position: number;
  chatSessionId?: string | null;
};

export type EnabledFamilyApp = {
  slug: string;
  title: string;
  enabled: boolean;
  config: Record<string, unknown>;
};

export type HouseholdSpaceSideChannel = {
  available: boolean;
  label: string;
  sessionId?: string | null;
};

export type HouseholdSpaceRelayInput = {
  targetUserId: string;
  content: string;
};

export type HouseholdSpaceRelayResponse = {
  ok: boolean;
  targetUserId: string;
  chatSessionId: string;
};

export type HouseholdSpaceDetail = HouseholdSpaceSummary & {
  members: HouseholdSpaceMember[];
  threads: HouseholdSpaceThread[];
  enabledFamilyApps: EnabledFamilyApp[];
  privateSideChannel?: HouseholdSpaceSideChannel | null;
};

export type SpaceMemory = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SpaceSummary = {
  id: string;
  title: string;
  content: string;
  sourceLabel?: string | null;
  createdAt: string;
};

export type SpaceLibrary = {
  memories: SpaceMemory[];
  summaries: SpaceSummary[];
};

export type HouseholdSpaceCreateInput = {
  name: string;
  template: Exclude<SpaceTemplate, 'private' | 'household'>;
  memberIds: string[];
};

export type FamilyAppInstallation = {
  slug: string;
  title: string;
  installed: boolean;
  description: string;
  entryTitle?: string | null;
  entryCopy?: string | null;
  starterPrompts: string[];
  threadHints: string[];
  riskLevel: string;
  spaceTemplates: string[];
  capabilities: string[];
  supportsProactiveMessages: boolean;
  supportsPrivateRelay: boolean;
  requiresOwnerConfirmation: boolean;
};

export type SpaceFamilyAppEnableInput = {
  cadence?: string;
  entryCard?: boolean;
};

export type SpaceMemoryCreateInput = {
  title: string;
  content: string;
  pinned?: boolean;
};

export type SpaceMemoryUpdateInput = {
  title?: string;
  content?: string;
  pinned?: boolean;
};

export type SpaceSummaryCaptureInput = {
  chatSessionId: string;
  title?: string;
};

export type HouseholdSummary = {
  id: string;
  name: string;
  members: HouseholdMemberSummary[];
  pendingInvites: HouseholdInviteSummary[];
  devices: DeviceSummary[];
  recentActivity: HouseholdActivitySummary[];
};

export type HouseholdChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatSessionScope = 'family' | 'private';

export type HouseholdChatSessionSummary = {
  id: string;
  name: string;
  scope: ChatSessionScope;
  ownerUserId: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  createdAt: string;
  updatedAt: string;
};

export type HouseholdChatSessionMessage = HouseholdChatMessage & {
  senderDisplayName?: string | null;
};

export type HouseholdChatSessionDetail = HouseholdChatSessionSummary & {
  messages: HouseholdChatSessionMessage[];
};

export type HouseholdChatSessionCreateInput = {
  name: string;
  scope: ChatSessionScope;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
};

export type HouseholdChatSessionUpdateInput = {
  name?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  lastKnownUpdatedAt?: string | null;
};

export type HouseholdChatHistory = {
  messages: HouseholdChatMessage[];
};

export type HouseholdChatResponse = {
  deviceId: string;
  message: string;
};

export type HouseholdChatStreamPendingEvent = {
  type: 'pending';
  deviceId: string;
  message: string;
};

export type HouseholdChatStreamTokenEvent = {
  type: 'token';
  content: string;
};

export type HouseholdChatStreamDoneEvent = {
  type: 'done';
  deviceId: string;
  message: string;
  error?: string | null;
};

export type HouseholdChatSessionStreamHandlers = {
  onPending?: (event: HouseholdChatStreamPendingEvent) => void;
  onToken?: (event: HouseholdChatStreamTokenEvent) => void;
  onDone?: (event: HouseholdChatStreamDoneEvent) => void;
};

export type HouseholdTaskScope = 'family' | 'private';

export type HouseholdTaskSummary = {
  id: string;
  name: string;
  cronExpr: string;
  command: string;
  commandType: 'shell' | 'zeroclaw';
  enabled: boolean;
  scope: HouseholdTaskScope;
  spaceId?: string | null;
  ownerUserId?: string | null;
  updatedAt?: string | null;
  lastRunAt?: string | null;
  lastStatus?: string | null;
  lastOutput?: string | null;
};

export type HouseholdTaskCreateInput = {
  name: string;
  cronExpr: string;
  command: string;
  commandType: 'shell' | 'zeroclaw';
  enabled: boolean;
};

export type HouseholdTaskUpdateInput = Partial<HouseholdTaskCreateInput> & {
  lastKnownUpdatedAt?: string | null;
};

export type HouseholdTaskRunSummary = {
  id: string;
  status: string;
  output?: string | null;
  startedAt: string;
  finishedAt?: string | null;
};

export type HouseholdTaskQueryOptions = {
  spaceId?: string | null;
};

export type HouseholdFileSpace = 'family' | 'private';

export type HouseholdFileEntry = {
  name: string;
  path: string;
  isDir: boolean;
  size?: number | null;
  modified?: string | null;
  readable?: boolean;
  writable?: boolean;
  uploadedByUserId?: string | null;
};

export type HouseholdFileListing = {
  space: HouseholdFileSpace;
  path: string;
  root: string;
  parent?: string | null;
  entries: HouseholdFileEntry[];
};

export type HouseholdUploadInput = {
  name: string;
  mimeType: string;
  data: Uint8Array;
};

export type DeviceDiagnostics = {
  cache?: {
    source: 'live' | 'cached';
    fetched_at?: string | null;
    summary?: string | null;
  };
  setup?: {
    status?: string;
    remote_reset?: {
      armed: boolean;
      armed_until?: string | null;
    };
  };
  network?: {
    control_mode?: string;
    wifi_interface?: string;
    wifi_radio?: string;
    devices?: Array<{ device: string; type: string; state: string }>;
    preflight?: {
      ready?: boolean;
      reasons?: string[];
      selected_wifi_interface?: string;
    };
  };
  self_heal?: {
    plan?: {
      healthy?: boolean;
      issues?: Array<{ service: string; reason: string }>;
      actions?: Array<{ service: string; reason: string }>;
    };
  } | null;
  system?: {
    cpu_percent?: number;
    load_avg_1m?: number | null;
    memory?: { total_gb: number; used_percent: number };
    disk?: { total_gb: number; used_percent: number };
  } | null;
};

export type DeviceConfigStatus = {
  ollama?: {
    service?: string;
    api?: string;
  };
  inference?: {
    active?: boolean;
    queued_requests?: number;
    queue_limit?: number;
  };
  zeroclaw?: {
    components?: {
      daemon?: { status?: string };
      gateway?: { status?: string };
    };
  };
  system?: {
    cpu_percent?: number;
    memory?: { total_gb?: number; used_percent?: number };
    disk?: { total_gb?: number; used_percent?: number };
  };
};

export type DeviceInferenceDetail = {
  active_request?: {
    user_id?: string;
    username?: string;
    request_id?: string;
  } | null;
  queue: Array<{
    user_id?: string;
    username?: string;
    request_id?: string;
    position?: number;
  }>;
  queued_requests: number;
  queue_limit: number;
};

export type DeviceProviderConfig = {
  defaultProvider: string;
  defaultModel: string;
  providerTimeoutSecs: number;
};

export type DeviceOnboardInput = {
  provider: string;
  model: string;
  apiKey: string;
  apiUrl?: string;
};

export type DeviceServiceControlResponse = {
  ok: boolean;
  output: string;
};

export type DeviceResetResponse = {
  ok: boolean;
  deviceId: string;
  status: string;
};

export type DeviceReprovisionResponse = {
  ok: boolean;
  deviceId: string;
  status: string;
};

export type HouseholdInvitationResponse = {
  inviteId: string;
  inviteCode: string;
  role: 'owner' | 'member';
  expiresInSeconds: number;
  expiresAt: string;
};

export type HouseholdMemberRoleResponse = {
  ok: boolean;
  memberId: string;
  role: 'owner' | 'member';
};

export type HouseholdMemberRemovalResponse = {
  ok: boolean;
  memberId: string;
};

export type HouseholdInvitationRevokeResponse = {
  ok: boolean;
  inviteId: string;
};

export async function getHouseholdSpaces(token: string): Promise<HouseholdSpaceSummary[]> {
  const response = await cloudJson<{ spaces: Array<Record<string, unknown>> }>('/api/spaces', { token });
  return response.spaces.map(normalizeSpaceSummary);
}

export async function createHouseholdSpace(
  token: string,
  input: HouseholdSpaceCreateInput,
): Promise<HouseholdSpaceDetail> {
  const response = await cloudJson<Record<string, unknown>>('/api/spaces', {
    method: 'POST',
    token,
    body: {
      name: input.name,
      template: input.template,
      member_ids: input.memberIds,
    },
  });
  return normalizeSpaceDetail(response);
}

export async function getHouseholdSpaceDetail(
  token: string,
  spaceId: string,
): Promise<HouseholdSpaceDetail> {
  const response = await cloudJson<Record<string, unknown>>(`/api/spaces/${encodeURIComponent(spaceId)}`, {
    token,
  });
  return normalizeSpaceDetail(response);
}

export async function getSpaceLibrary(
  token: string,
  spaceId: string,
): Promise<SpaceLibrary> {
  const response = await cloudJson<Record<string, unknown>>(
    `/api/spaces/${encodeURIComponent(spaceId)}/library`,
    { token },
  );
  return {
    memories: Array.isArray(response.memories)
      ? response.memories.map((memory) => normalizeSpaceMemory(memory as Record<string, unknown>))
      : [],
    summaries: Array.isArray(response.summaries)
      ? response.summaries.map((summary) => normalizeSpaceLibrarySummary(summary as Record<string, unknown>))
      : [],
  };
}

export async function createSpaceMemory(
  token: string,
  spaceId: string,
  input: SpaceMemoryCreateInput,
): Promise<SpaceMemory> {
  const response = await cloudJson<Record<string, unknown>>(
    `/api/spaces/${encodeURIComponent(spaceId)}/memories`,
    {
      method: 'POST',
      token,
      body: {
        title: input.title,
        content: input.content,
        pinned: input.pinned ?? false,
      },
    },
  );
  return normalizeSpaceMemory(response);
}

export async function updateSpaceMemory(
  token: string,
  spaceId: string,
  memoryId: string,
  input: SpaceMemoryUpdateInput,
): Promise<SpaceMemory> {
  const response = await cloudJson<Record<string, unknown>>(
    `/api/spaces/${encodeURIComponent(spaceId)}/memories/${encodeURIComponent(memoryId)}`,
    {
      method: 'PATCH',
      token,
      body: {
        title: input.title,
        content: input.content,
        pinned: input.pinned,
      },
    },
  );
  return normalizeSpaceMemory(response);
}

export async function deleteSpaceMemory(
  token: string,
  spaceId: string,
  memoryId: string,
): Promise<{ ok: boolean }> {
  return cloudJson<{ ok: boolean }>(
    `/api/spaces/${encodeURIComponent(spaceId)}/memories/${encodeURIComponent(memoryId)}`,
    {
      method: 'DELETE',
      token,
    },
  );
}

export async function captureSpaceSummaryFromSession(
  token: string,
  spaceId: string,
  input: SpaceSummaryCaptureInput,
): Promise<SpaceSummary> {
  const response = await cloudJson<Record<string, unknown>>(
    `/api/spaces/${encodeURIComponent(spaceId)}/summaries/from-session`,
    {
      method: 'POST',
      token,
      body: {
        source_id: input.chatSessionId,
        title: input.title,
      },
    },
  );
  return normalizeSpaceLibrarySummary(response);
}

export async function deleteSpaceSummary(
  token: string,
  spaceId: string,
  summaryId: string,
): Promise<{ ok: boolean }> {
  return cloudJson<{ ok: boolean }>(
    `/api/spaces/${encodeURIComponent(spaceId)}/summaries/${encodeURIComponent(summaryId)}`,
    {
      method: 'DELETE',
      token,
    },
  );
}

export async function openSpaceSideChannel(
  token: string,
  spaceId: string,
): Promise<HouseholdSpaceSideChannel> {
  const response = await cloudJson<Record<string, unknown>>(
    `/api/spaces/${encodeURIComponent(spaceId)}/side-channel`,
    {
      method: 'POST',
      token,
    },
  );
  return normalizeSpaceSideChannel(response);
}

export async function openSpaceThreadSession(
  token: string,
  spaceId: string,
  threadId: string,
): Promise<HouseholdChatSessionSummary> {
  const response = await cloudJson<Record<string, unknown>>(
    `/api/spaces/${encodeURIComponent(spaceId)}/threads/${encodeURIComponent(threadId)}/open`,
    {
      method: 'POST',
      token,
    },
  );
  return normalizeChatSessionSummary(response);
}

export async function relayHouseholdSpaceMessage(
  token: string,
  spaceId: string,
  input: HouseholdSpaceRelayInput,
): Promise<HouseholdSpaceRelayResponse> {
  const response = await cloudJson<Record<string, unknown>>(`/api/spaces/${encodeURIComponent(spaceId)}/relay`, {
    method: 'POST',
    token,
    body: {
      target_user_id: input.targetUserId,
      content: input.content,
    },
  });
  return normalizeSpaceRelayResponse(response);
}

export async function installFamilyApp(
  token: string,
  slug: string,
): Promise<FamilyAppInstallation> {
  const response = await cloudJson<Record<string, unknown>>('/api/family-apps/install', {
    method: 'POST',
    token,
    body: { slug },
  });
  return normalizeFamilyAppInstallation(response);
}

export async function getFamilyAppCatalog(
  token: string,
): Promise<FamilyAppInstallation[]> {
  const response = await cloudJson<{ apps: Array<Record<string, unknown>> }>('/api/family-apps/catalog', {
    token,
  });
  return response.apps.map(normalizeFamilyAppInstallation);
}

export async function getInstalledFamilyApps(
  token: string,
): Promise<FamilyAppInstallation[]> {
  const response = await cloudJson<{ apps: Array<Record<string, unknown>> }>('/api/family-apps/installed', {
    token,
  });
  return response.apps.map(normalizeFamilyAppInstallation);
}

export async function enableSpaceFamilyApp(
  token: string,
  spaceId: string,
  slug: string,
  input: SpaceFamilyAppEnableInput,
): Promise<{ ok: boolean }> {
  return cloudJson<{ ok: boolean }>(
    `/api/spaces/${encodeURIComponent(spaceId)}/family-apps/${encodeURIComponent(slug)}/enable`,
    {
      method: 'POST',
      token,
      body: {
        cadence: input.cadence,
        entry_card: input.entryCard,
      },
    },
  );
}

export async function getHouseholdSummary(token: string): Promise<HouseholdSummary> {
  const response = await cloudJson<{
    id: string;
    name: string;
    members: HouseholdMemberSummary[];
    pending_invites: HouseholdInviteSummary[];
    devices: DeviceSummary[];
    recent_activity: HouseholdActivitySummary[];
  }>('/api/household', { token });

  return {
    id: response.id,
    name: response.name,
    members: response.members,
    pendingInvites: response.pending_invites,
    devices: response.devices,
    recentActivity: response.recent_activity,
  };
}

export async function getHouseholdChat(token: string): Promise<HouseholdChatHistory> {
  return cloudJson<HouseholdChatHistory>('/api/chat/household', { token });
}

export async function getHouseholdChatSessions(
  token: string,
  scope: ChatSessionScope,
): Promise<HouseholdChatSessionSummary[]> {
  const params = new URLSearchParams({ scope });
  const response = await cloudJson<Array<Record<string, unknown>>>(`/api/chat/sessions?${params.toString()}`, {
    token,
  });
  return response.map(normalizeChatSessionSummary);
}

export async function createHouseholdChatSession(
  token: string,
  input: HouseholdChatSessionCreateInput,
): Promise<HouseholdChatSessionSummary> {
  const response = await cloudJson<Record<string, unknown>>('/api/chat/sessions', {
    method: 'POST',
    token,
    body: {
      name: input.name,
      scope: input.scope,
      system_prompt: input.systemPrompt,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
    },
  });
  return normalizeChatSessionSummary(response);
}

export async function getHouseholdChatSession(
  token: string,
  sessionId: string,
): Promise<HouseholdChatSessionDetail> {
  const response = await cloudJson<Record<string, unknown>>(`/api/chat/sessions/${encodeURIComponent(sessionId)}`, {
    token,
  });
  return normalizeChatSessionDetail(response);
}

export async function updateHouseholdChatSession(
  token: string,
  sessionId: string,
  input: HouseholdChatSessionUpdateInput,
): Promise<HouseholdChatSessionSummary> {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.systemPrompt !== undefined) body.system_prompt = input.systemPrompt;
  if (input.temperature !== undefined) body.temperature = input.temperature;
  if (input.maxTokens !== undefined) body.max_tokens = input.maxTokens;
  if (input.lastKnownUpdatedAt !== undefined) body.last_known_updated_at = input.lastKnownUpdatedAt;
  const response = await cloudJson<Record<string, unknown>>(`/api/chat/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    token,
    body,
  });
  return normalizeChatSessionSummary(response);
}

export async function sendHouseholdChat(
  token: string,
  messages: HouseholdChatMessage[],
): Promise<HouseholdChatResponse> {
  const response = await cloudJson<{ device_id: string; message: string }>('/api/chat/household', {
    method: 'POST',
    token,
    body: { messages },
  });

  return {
    deviceId: response.device_id,
    message: response.message,
  };
}

export async function sendHouseholdChatSessionMessage(
  token: string,
  sessionId: string,
  content: string,
): Promise<HouseholdChatResponse> {
  const response = await cloudJson<{ device_id: string; message: string }>(
    `/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`,
    {
      method: 'POST',
      token,
      body: { content },
    },
  );
  return {
    deviceId: response.device_id,
    message: response.message,
  };
}

export async function streamHouseholdChatSessionMessage(
  token: string,
  sessionId: string,
  content: string,
  handlers: HouseholdChatSessionStreamHandlers = {},
): Promise<HouseholdChatResponse> {
  const XhrCtor = getXmlHttpRequestConstructor();
  if (!XhrCtor) {
    throw new Error('Streaming chat is unavailable on this device.');
  }

  return new Promise<HouseholdChatResponse>((resolve, reject) => {
    const xhr = new XhrCtor();
    let processedLength = 0;
    let buffer = '';
    let doneEvent: HouseholdChatStreamDoneEvent | null = null;
    let settled = false;

    const settleReject = (message: string) => {
      if (settled) {
        return;
      }
      settled = true;
      reject(new Error(message));
    };

    const settleResolve = (response: HouseholdChatResponse) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(response);
    };

    const flushEvents = (force: boolean) => {
      const nextChunk = xhr.responseText.slice(processedLength);
      if (!nextChunk && !force) {
        return;
      }
      processedLength = xhr.responseText.length;
      buffer += nextChunk;
      const parsed = extractSseEvents(buffer, force);
      buffer = parsed.rest;
      for (const event of parsed.events) {
        if (event.type === 'pending') {
          handlers.onPending?.(event);
          continue;
        }
        if (event.type === 'token') {
          handlers.onToken?.(event);
          continue;
        }
        doneEvent = event;
        handlers.onDone?.(event);
      }
    };

    xhr.open('POST', `${CLOUD_API_BASE}/api/chat/sessions/${encodeURIComponent(sessionId)}/messages/stream`);
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onprogress = () => {
      flushEvents(false);
    };

    xhr.onload = () => {
      flushEvents(true);
      if (xhr.status >= 400) {
        settleReject(parseStreamingError(xhr.status, xhr.responseText));
        return;
      }
      if (!doneEvent) {
        settleReject('Streaming chat ended before Sparkbox finished replying.');
        return;
      }
      if (doneEvent.error) {
        settleReject(doneEvent.error);
        return;
      }
      settleResolve({
        deviceId: doneEvent.deviceId,
        message: doneEvent.message,
      });
    };

    xhr.onerror = () => {
      settleReject('Chat is unavailable right now.');
    };

    xhr.send(JSON.stringify({ content }));
  });
}

export async function clearHouseholdChat(token: string): Promise<{ ok: boolean }> {
  return cloudJson<{ ok: boolean }>('/api/chat/household', {
    method: 'DELETE',
    token,
  });
}

export async function clearChatSessionMessages(
  token: string,
  sessionId: string,
): Promise<{ ok: boolean }> {
  return cloudJson<{ ok: boolean }>(`/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`, {
    method: 'DELETE',
    token,
  });
}

export async function deleteHouseholdChatSession(
  token: string,
  sessionId: string,
): Promise<{ ok: boolean }> {
  return cloudJson<{ ok: boolean }>(`/api/chat/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    token,
  });
}

export async function getHouseholdTasks(
  token: string,
  scope: HouseholdTaskScope,
  options: HouseholdTaskQueryOptions = {},
): Promise<HouseholdTaskSummary[]> {
  const params = new URLSearchParams({ scope });
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
  const response = await cloudJson<Array<Record<string, unknown>>>(`/api/tasks?${params.toString()}`, {
    token,
  });
  return response.map(normalizeTask);
}

export async function createHouseholdTask(
  token: string,
  scope: HouseholdTaskScope,
  input: HouseholdTaskCreateInput,
  options: HouseholdTaskQueryOptions = {},
): Promise<HouseholdTaskSummary> {
  const params = new URLSearchParams({ scope });
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
  const response = await cloudJson<Record<string, unknown>>(`/api/tasks?${params.toString()}`, {
    method: 'POST',
    token,
    body: {
      name: input.name,
      cron_expr: input.cronExpr,
      command: input.command,
      command_type: input.commandType,
      enabled: input.enabled,
    },
  });
  return normalizeTask(response);
}

export async function updateHouseholdTask(
  token: string,
  taskId: string,
  input: HouseholdTaskUpdateInput,
): Promise<HouseholdTaskSummary> {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.cronExpr !== undefined) body.cron_expr = input.cronExpr;
  if (input.command !== undefined) body.command = input.command;
  if (input.commandType !== undefined) body.command_type = input.commandType;
  if (input.enabled !== undefined) body.enabled = input.enabled;
  if (input.lastKnownUpdatedAt !== undefined) body.last_known_updated_at = input.lastKnownUpdatedAt;
  const response = await cloudJson<Record<string, unknown>>(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    token,
    body,
  });
  return normalizeTask(response);
}

export async function triggerHouseholdTask(
  token: string,
  taskId: string,
): Promise<{ ok: boolean; message: string }> {
  return cloudJson<{ ok: boolean; message: string }>(`/api/tasks/${encodeURIComponent(taskId)}/trigger`, {
    method: 'POST',
    token,
  });
}

export async function getHouseholdTaskHistory(
  token: string,
  taskId: string,
  limit = 20,
): Promise<HouseholdTaskRunSummary[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await cloudJson<Array<Record<string, unknown>>>(
    `/api/tasks/${encodeURIComponent(taskId)}/history?${params.toString()}`,
    {
      token,
    },
  );
  return response.map((item) => ({
    id: String(item.id ?? ''),
    status: String(item.status ?? ''),
    output: typeof item.output === 'string' ? item.output : null,
    startedAt: String(item.started_at ?? ''),
    finishedAt: typeof item.finished_at === 'string' ? item.finished_at : null,
  }));
}

export async function deleteHouseholdTask(
  token: string,
  taskId: string,
): Promise<{ ok: boolean }> {
  return cloudJson<{ ok: boolean }>(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
    token,
  });
}

export async function getHouseholdFiles(
  token: string,
  space: HouseholdFileSpace,
  path: string,
  options: { spaceId?: string | null } = {},
): Promise<HouseholdFileListing> {
  const params = new URLSearchParams({ space, path });
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
  const response = await cloudJson<{
    space: HouseholdFileSpace;
    space_id?: string | null;
    path: string;
    root: string;
    parent?: string | null;
    entries: Array<Record<string, unknown>>;
  }>(`/api/files?${params.toString()}`, { token });
  return {
    space: response.space,
    path: response.path,
    root: response.root,
    parent: response.parent ?? null,
    entries: response.entries.map(normalizeFileEntry),
  };
}

export async function createHouseholdDirectory(
  token: string,
  space: HouseholdFileSpace,
  path: string,
  options: { spaceId?: string | null } = {},
): Promise<{ ok: boolean; path: string }> {
  const params = new URLSearchParams({ space, path });
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
  return cloudJson<{ ok: boolean; path: string }>(`/api/files/mkdir?${params.toString()}`, {
    method: 'POST',
    token,
  });
}

export async function renameHouseholdPath(
  token: string,
  space: HouseholdFileSpace,
  src: string,
  dst: string,
  options: { spaceId?: string | null } = {},
): Promise<{ ok: boolean }> {
  const params = new URLSearchParams({ space, src, dst });
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
  return cloudJson<{ ok: boolean }>(`/api/files/rename?${params.toString()}`, {
    method: 'POST',
    token,
  });
}

export async function deleteHouseholdPath(
  token: string,
  space: HouseholdFileSpace,
  path: string,
  options: { spaceId?: string | null } = {},
): Promise<{ ok: boolean }> {
  const params = new URLSearchParams({ space, path });
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
  return cloudJson<{ ok: boolean }>(`/api/files?${params.toString()}`, {
    method: 'DELETE',
    token,
  });
}

export async function uploadHouseholdFiles(
  token: string,
  space: HouseholdFileSpace,
  path: string,
  files: HouseholdUploadInput[],
  options: { spaceId?: string | null } = {},
): Promise<{ ok: boolean; saved: Array<{ name: string; size: number }> }> {
  const formData = new FormData();
  for (const file of files) {
    const arrayBuffer = file.data.buffer.slice(
      file.data.byteOffset,
      file.data.byteOffset + file.data.byteLength,
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: file.mimeType || 'application/octet-stream' });
    formData.append('files', blob, file.name);
  }
  const params = new URLSearchParams({ space, path });
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
  const response = await fetch(`${CLOUD_API_BASE}/api/files/upload?${params.toString()}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  if (!response.ok) {
    let detail = `Request failed: ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (typeof body.detail === 'string' && body.detail.trim()) {
        detail = body.detail.trim();
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }
  return (await response.json()) as { ok: boolean; saved: Array<{ name: string; size: number }> };
}

export function buildHouseholdFileDownloadUrl(
  space: HouseholdFileSpace,
  path: string,
  options: { spaceId?: string | null } = {},
): string {
  const params = new URLSearchParams({ space, path });
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
  return `${CLOUD_API_BASE}/api/files/download?${params.toString()}`;
}

export async function getDeviceDiagnostics(
  token: string,
  deviceId: string,
): Promise<DeviceDiagnostics> {
  return cloudJson<DeviceDiagnostics>(`/api/devices/${encodeURIComponent(deviceId)}/diagnostics`, {
    token,
  });
}

export async function getDeviceConfigStatus(
  token: string,
  deviceId: string,
): Promise<DeviceConfigStatus> {
  return cloudJson<DeviceConfigStatus>(`/api/devices/${encodeURIComponent(deviceId)}/config/status`, {
    token,
  });
}

export async function getDeviceProviders(
  token: string,
  deviceId: string,
): Promise<string[]> {
  return cloudJson<string[]>(`/api/devices/${encodeURIComponent(deviceId)}/config/providers`, {
    token,
  });
}

export async function getDeviceOllamaModels(
  token: string,
  deviceId: string,
): Promise<Array<{ name: string; size?: number | null }>> {
  return cloudJson<Array<{ name: string; size?: number | null }>>(
    `/api/devices/${encodeURIComponent(deviceId)}/config/models/ollama`,
    { token },
  );
}

export async function getDeviceProviderConfig(
  token: string,
  deviceId: string,
): Promise<DeviceProviderConfig> {
  const response = await cloudJson<Record<string, unknown>>(
    `/api/devices/${encodeURIComponent(deviceId)}/config/zeroclaw`,
    { token },
  );
  return {
    defaultProvider: typeof response.default_provider === 'string' ? response.default_provider : 'ollama',
    defaultModel: typeof response.default_model === 'string' ? response.default_model : '',
    providerTimeoutSecs:
      typeof response.provider_timeout_secs === 'number' ? response.provider_timeout_secs : 120,
  };
}

export async function updateDeviceProviderConfig(
  token: string,
  deviceId: string,
  input: DeviceProviderConfig,
): Promise<{ ok: boolean }> {
  return cloudJson<{ ok: boolean }>(`/api/devices/${encodeURIComponent(deviceId)}/config/zeroclaw`, {
    method: 'PATCH',
    token,
    body: {
      updates: {
        default_provider: input.defaultProvider,
        default_model: input.defaultModel,
        provider_timeout_secs: input.providerTimeoutSecs,
      },
    },
  });
}

export async function onboardDeviceProvider(
  token: string,
  deviceId: string,
  input: DeviceOnboardInput,
): Promise<{ ok: boolean; output: string }> {
  return cloudJson<{ ok: boolean; output: string }>(
    `/api/devices/${encodeURIComponent(deviceId)}/config/zeroclaw/onboard`,
    {
      method: 'POST',
      token,
      body: {
        provider: input.provider,
        model: input.model,
        api_key: input.apiKey,
        api_url: input.apiUrl ?? '',
      },
    },
  );
}

export async function getDeviceInferenceDetail(
  token: string,
  deviceId: string,
): Promise<DeviceInferenceDetail> {
  return cloudJson<DeviceInferenceDetail>(`/api/devices/${encodeURIComponent(deviceId)}/config/inference`, {
    token,
  });
}

export async function controlDeviceService(
  token: string,
  deviceId: string,
  serviceName: 'ollama' | 'zeroclaw',
  action: 'start' | 'stop' | 'restart',
): Promise<DeviceServiceControlResponse> {
  return cloudJson<DeviceServiceControlResponse>(
    `/api/devices/${encodeURIComponent(deviceId)}/config/services/${encodeURIComponent(serviceName)}`,
    {
      method: 'POST',
      token,
      body: { action },
    },
  );
}

export async function resetDeviceToSetupMode(
  token: string,
  deviceId: string,
): Promise<DeviceResetResponse> {
  const response = await cloudJson<{ ok: boolean; device_id: string; status: string }>(
    `/api/devices/${encodeURIComponent(deviceId)}/reset`,
    {
      method: 'POST',
      token,
    },
  );
  return {
    ok: response.ok,
    deviceId: response.device_id,
    status: response.status,
  };
}

export async function createHouseholdInvitation(
  token: string,
  role: 'owner' | 'member',
): Promise<HouseholdInvitationResponse> {
  const response = await cloudJson<{
    invite_id: string;
    invite_code: string;
    role?: 'owner' | 'member';
    expires_in_seconds: number;
    expires_at: string;
  }>('/api/auth/invitations', {
    method: 'POST',
    token,
    body: { role },
  });

  return {
    inviteId: response.invite_id,
    inviteCode: response.invite_code,
    role: response.role ?? role,
    expiresInSeconds: response.expires_in_seconds,
    expiresAt: response.expires_at,
  };
}

export async function updateHouseholdMemberRole(
  token: string,
  memberId: string,
  role: 'owner' | 'member',
): Promise<HouseholdMemberRoleResponse> {
  const response = await cloudJson<{ ok: boolean; member_id: string; role: 'owner' | 'member' }>(
    `/api/household/members/${encodeURIComponent(memberId)}/role`,
    {
      method: 'PATCH',
      token,
      body: { role },
    },
  );

  return {
    ok: response.ok,
    memberId: response.member_id,
    role: response.role,
  };
}

export async function removeHouseholdMember(
  token: string,
  memberId: string,
): Promise<HouseholdMemberRemovalResponse> {
  const response = await cloudJson<{ ok: boolean; member_id: string }>(
    `/api/household/members/${encodeURIComponent(memberId)}`,
    {
      method: 'DELETE',
      token,
    },
  );

  return {
    ok: response.ok,
    memberId: response.member_id,
  };
}

export async function revokeHouseholdInvitation(
  token: string,
  inviteId: string,
): Promise<HouseholdInvitationRevokeResponse> {
  const response = await cloudJson<{ ok: boolean; invite_id: string }>(
    `/api/auth/invitations/${encodeURIComponent(inviteId)}`,
    {
      method: 'DELETE',
      token,
    },
  );

  return {
    ok: response.ok,
    inviteId: response.invite_id,
  };
}

export async function startDeviceReprovision(
  token: string,
  deviceId: string,
): Promise<DeviceReprovisionResponse> {
  const response = await cloudJson<{ ok: boolean; device_id: string; status: string }>(
    `/api/devices/${encodeURIComponent(deviceId)}/reprovision`,
    {
      method: 'POST',
      token,
    },
  );

  return {
    ok: response.ok,
    deviceId: response.device_id,
    status: response.status,
  };
}

async function cloudJson<T>(
  path: string,
  options: {
    method?: string;
    token: string;
    body?: unknown;
  },
): Promise<T> {
  const response = await fetch(`${CLOUD_API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${options.token}`,
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let detail = `Request failed: ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (typeof body.detail === 'string' && body.detail.trim()) {
        detail = body.detail.trim();
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  return (await response.json()) as T;
}

function getXmlHttpRequestConstructor(): typeof XMLHttpRequest | null {
  return typeof XMLHttpRequest === 'function' ? XMLHttpRequest : null;
}

function parseStreamingError(status: number, responseText: string): string {
  if (responseText.trim()) {
    try {
      const payload = JSON.parse(responseText) as { detail?: string };
      if (typeof payload.detail === 'string' && payload.detail.trim()) {
        return payload.detail.trim();
      }
    } catch {
      // ignore parse errors
    }
  }
  return `Request failed: ${status}`;
}

function extractSseEvents(
  rawBuffer: string,
  force: boolean,
): {
  events: Array<HouseholdChatStreamPendingEvent | HouseholdChatStreamTokenEvent | HouseholdChatStreamDoneEvent>;
  rest: string;
} {
  const normalized = rawBuffer.replace(/\r\n/g, '\n');
  const segments = normalized.split('\n\n');
  const rest = force ? '' : segments.pop() ?? '';
  const events: Array<HouseholdChatStreamPendingEvent | HouseholdChatStreamTokenEvent | HouseholdChatStreamDoneEvent> = [];

  for (const segment of segments) {
    const parsed = parseSseSegment(segment);
    if (parsed) {
      events.push(parsed);
    }
  }

  return { events, rest };
}

function parseSseSegment(
  segment: string,
): HouseholdChatStreamPendingEvent | HouseholdChatStreamTokenEvent | HouseholdChatStreamDoneEvent | null {
  if (!segment.trim()) {
    return null;
  }
  let eventName = 'message';
  const dataLines: string[] = [];
  for (const rawLine of segment.split('\n')) {
    const line = rawLine.trimEnd();
    if (!line) {
      continue;
    }
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (dataLines.length === 0) {
    return null;
  }
  const payload = JSON.parse(dataLines.join('\n')) as Record<string, unknown>;
  const type = typeof payload.type === 'string' ? payload.type : eventName;
  if (type === 'pending') {
    return {
      type: 'pending',
      deviceId: String(payload.device_id ?? ''),
      message: String(payload.message ?? ''),
    };
  }
  if (type === 'token') {
    return {
      type: 'token',
      content: String(payload.content ?? ''),
    };
  }
  if (type === 'done') {
    return {
      type: 'done',
      deviceId: String(payload.device_id ?? ''),
      message: String(payload.message ?? ''),
      error: typeof payload.error === 'string' ? payload.error : null,
    };
  }
  return null;
}

function normalizeTask(task: Record<string, unknown>): HouseholdTaskSummary {
  return {
    id: String(task.id ?? ''),
    name: String(task.name ?? ''),
    cronExpr: String(task.cron_expr ?? ''),
    command: String(task.command ?? ''),
    commandType: (task.command_type === 'zeroclaw' ? 'zeroclaw' : 'shell'),
    enabled: Boolean(task.enabled),
    scope: task.scope === 'private' ? 'private' : 'family',
    spaceId: typeof task.space_id === 'string' ? task.space_id : null,
    ownerUserId: typeof task.owner_user_id === 'string' ? task.owner_user_id : null,
    updatedAt: typeof task.updated_at === 'string' ? task.updated_at : null,
    lastRunAt: typeof task.last_run_at === 'string' ? task.last_run_at : null,
    lastStatus: typeof task.last_status === 'string' ? task.last_status : null,
    lastOutput: typeof task.last_output === 'string' ? task.last_output : null,
  };
}

function normalizeSpaceMemory(memory: Record<string, unknown>): SpaceMemory {
  return {
    id: String(memory.id ?? ''),
    title: String(memory.title ?? ''),
    content: String(memory.content ?? ''),
    pinned: Boolean(memory.pinned),
    createdAt: String(memory.created_at ?? ''),
    updatedAt: String(memory.updated_at ?? ''),
  };
}

function normalizeSpaceLibrarySummary(summary: Record<string, unknown>): SpaceSummary {
  return {
    id: String(summary.id ?? ''),
    title: String(summary.title ?? ''),
    content: String(summary.content ?? ''),
    sourceLabel: typeof summary.source_label === 'string' ? summary.source_label : null,
    createdAt: String(summary.created_at ?? ''),
  };
}

function normalizeChatSessionSummary(session: Record<string, unknown>): HouseholdChatSessionSummary {
  return {
    id: String(session.id ?? ''),
    name: String(session.name ?? 'New Chat'),
    scope: session.scope === 'private' ? 'private' : 'family',
    ownerUserId: String(session.owner_user_id ?? ''),
    systemPrompt: typeof session.system_prompt === 'string' ? session.system_prompt : '',
    temperature: typeof session.temperature === 'number' ? session.temperature : 0.7,
    maxTokens: typeof session.max_tokens === 'number' ? session.max_tokens : 2048,
    createdAt: String(session.created_at ?? ''),
    updatedAt: String(session.updated_at ?? ''),
  };
}

function normalizeChatSessionDetail(session: Record<string, unknown>): HouseholdChatSessionDetail {
  return {
    ...normalizeChatSessionSummary(session),
    messages: Array.isArray(session.messages)
      ? session.messages.map((message) => ({
          role: message && (message as Record<string, unknown>).role === 'assistant' ? 'assistant' : 'user',
          content: String((message as Record<string, unknown>).content ?? ''),
          senderDisplayName:
            typeof (message as Record<string, unknown>).sender_display_name === 'string'
              ? String((message as Record<string, unknown>).sender_display_name)
              : null,
        }))
      : [],
  };
}

function normalizeSpaceSummary(space: Record<string, unknown>): HouseholdSpaceSummary {
  return {
    id: String(space.id ?? ''),
    name: String(space.name ?? ''),
    kind: space.kind === 'private' ? 'private' : 'shared',
    template: normalizeSpaceTemplate(space.template),
    memberCount: typeof space.member_count === 'number' ? space.member_count : 0,
    threadCount: typeof space.thread_count === 'number' ? space.thread_count : 0,
    updatedAt: String(space.updated_at ?? ''),
  };
}

function normalizeSpaceDetail(space: Record<string, unknown>): HouseholdSpaceDetail {
  return {
    ...normalizeSpaceSummary(space),
    members: Array.isArray(space.members)
      ? space.members.map((member) => ({
          id: String((member as Record<string, unknown>).id ?? ''),
          displayName: String((member as Record<string, unknown>).display_name ?? ''),
          role: (member as Record<string, unknown>).role === 'owner' ? 'owner' : 'member',
        }))
      : [],
    threads: Array.isArray(space.threads)
      ? space.threads.map((thread) => ({
          id: String((thread as Record<string, unknown>).id ?? ''),
          title: String((thread as Record<string, unknown>).title ?? ''),
          position: typeof (thread as Record<string, unknown>).position === 'number'
            ? Number((thread as Record<string, unknown>).position)
            : 0,
          chatSessionId:
            typeof (thread as Record<string, unknown>).chat_session_id === 'string'
              ? String((thread as Record<string, unknown>).chat_session_id)
              : null,
        }))
      : [],
    enabledFamilyApps: Array.isArray(space.enabled_family_apps)
      ? space.enabled_family_apps.map((item) => ({
          slug: String((item as Record<string, unknown>).slug ?? ''),
          title: String((item as Record<string, unknown>).title ?? ''),
          enabled: (item as Record<string, unknown>).enabled !== false,
          config:
            typeof (item as Record<string, unknown>).config === 'object' &&
            (item as Record<string, unknown>).config !== null
              ? ((item as Record<string, unknown>).config as Record<string, unknown>)
              : {},
        }))
      : [],
    privateSideChannel:
      space.private_side_channel && typeof space.private_side_channel === 'object'
        ? normalizeSpaceSideChannel(space.private_side_channel as Record<string, unknown>)
        : null,
  };
}

function normalizeFamilyAppInstallation(app: Record<string, unknown>): FamilyAppInstallation {
  return {
    slug: String(app.slug ?? ''),
    title: String(app.title ?? ''),
    installed: app.installed !== false,
    description: String(app.description ?? ''),
    entryTitle: typeof app.entry_title === 'string' ? app.entry_title : null,
    entryCopy: typeof app.entry_copy === 'string' ? app.entry_copy : null,
    starterPrompts: Array.isArray(app.starter_prompts) ? app.starter_prompts.map((item) => String(item)) : [],
    threadHints: Array.isArray(app.thread_hints) ? app.thread_hints.map((item) => String(item)) : [],
    riskLevel: String(app.risk_level ?? 'normal'),
    spaceTemplates: Array.isArray(app.space_templates)
      ? app.space_templates.map((item) => String(item))
      : [],
    capabilities: Array.isArray(app.capabilities) ? app.capabilities.map((item) => String(item)) : [],
    supportsProactiveMessages: app.supports_proactive_messages === true,
    supportsPrivateRelay: app.supports_private_relay === true,
    requiresOwnerConfirmation: app.requires_owner_confirmation === true,
  };
}

function normalizeSpaceSideChannel(sideChannel: Record<string, unknown>): HouseholdSpaceSideChannel {
  return {
    available: sideChannel.available !== false,
    label: String(sideChannel.label ?? '先私下问问 Sparkbox'),
    sessionId: typeof sideChannel.session_id === 'string' ? sideChannel.session_id : null,
  };
}

function normalizeSpaceRelayResponse(response: Record<string, unknown>): HouseholdSpaceRelayResponse {
  return {
    ok: response.ok !== false,
    targetUserId: String(response.target_user_id ?? ''),
    chatSessionId: String(response.chat_session_id ?? ''),
  };
}

function normalizeSpaceTemplate(value: unknown): SpaceTemplate {
  switch (value) {
    case 'private':
    case 'household':
    case 'partner':
    case 'parents':
    case 'child':
    case 'household_ops':
      return value;
    default:
      return 'household';
  }
}

function normalizeFileEntry(entry: Record<string, unknown>): HouseholdFileEntry {
  return {
    name: String(entry.name ?? ''),
    path: String(entry.path ?? ''),
    isDir: Boolean(entry.is_dir),
    size: typeof entry.size === 'number' ? entry.size : null,
    modified: typeof entry.modified === 'string' ? entry.modified : null,
    readable: entry.readable === undefined ? true : Boolean(entry.readable),
    writable: entry.writable === undefined ? true : Boolean(entry.writable),
    uploadedByUserId: typeof entry.uploaded_by_user_id === 'string' ? entry.uploaded_by_user_id : null,
  };
}
