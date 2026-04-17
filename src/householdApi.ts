import { getCloudApiBase } from './cloudApiBase';

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
  space_id?: string | null;
  space_name?: string | null;
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

const FAMILY_APP_COPY_OVERRIDES: Record<
  string,
  {
    title: string;
    description: string;
    entryTitle?: string;
    entryCopy?: string;
    starterPrompts?: string[];
    threadHints?: string[];
  }
> = {
  'good-night-close': {
    title: 'Nightly wrap-up',
    description: 'Gently close out the day and keep one small moment worth remembering.',
    entryTitle: 'What should this space hold onto tonight?',
    entryCopy: 'Let Sparkbox gently close out the day and keep one moment worth remembering.',
    starterPrompts: ['Help this space end the day with one moment worth keeping.'],
    threadHints: ['Nightly wrap-up'],
  },
  'weekend-plans': {
    title: 'Weekend plans',
    description: 'Help this space line up plans, shopping, and travel before the weekend starts.',
    entryTitle: 'Plan the weekend together',
    entryCopy: 'Let Sparkbox help this space line up weekend plans, shopping, and travel.',
    starterPrompts: ['Use this space’s recent plans to help me put together the weekend.'],
    threadHints: ['Weekend plans'],
  },
  'remember-this-moment': {
    title: 'Remember this moment',
    description: 'Suggest a shared memory from chats, photos, and the small things happening around this space.',
    entryTitle: 'Save this moment',
    entryCopy: 'Pick one recent moment from chats or photos that this space should remember.',
    starterPrompts: ['Help me save one recent moment this space should remember.'],
    threadHints: ['Shared memories'],
  },
  'talk-to-parents': {
    title: 'Talk to parents',
    description: 'Privately help shape the wording first, then relay it clearly after you confirm.',
    entryTitle: 'Think it through privately first',
    entryCopy: 'Let Sparkbox help with the wording here first, then decide whether to relay it to your parents.',
    starterPrompts: ['Help me work out how to say this before we relay it to my parents.'],
    threadHints: ['Talk to parents'],
  },
  'bedtime-time': {
    title: 'Bedtime moments',
    description: 'Bring a bedtime story, a gentle question, or a soft end-of-day check-in to this space.',
    entryTitle: 'Share a bedtime moment',
    entryCopy: 'Use a story, a small question, or a gentle wrap-up to end the day together.',
    starterPrompts: ['Help this space wind down with a short bedtime moment.'],
    threadHints: ['Bedtime moments'],
  },
  'family-diary': {
    title: 'Family diary',
    description: 'Keep one sentence a day and one page a week so this space slowly builds its own record.',
    entryTitle: 'Write one line for today',
    entryCopy: 'Let Sparkbox keep one line from today so it can slowly grow into a family diary.',
    starterPrompts: ['Help me keep one line from today that this space should remember.'],
    threadHints: ['Today and this week'],
  },
  'household-scheduler': {
    title: 'Home routines',
    description: 'Let Sparkbox keep the recurring tasks, reminders, and coordination this space needs on track.',
    entryTitle: 'Keep routines on track',
    entryCopy: 'Use this space to keep recurring plans, reminders, and coordination on track.',
    starterPrompts: ['Help me set up the recurring tasks this space needs.'],
    threadHints: ['Home routines'],
  },
};

const SEEDED_UI_COPY_REPLACEMENTS: Array<[string, string]> = [
  ['你和 Sparkbox', 'You + Sparkbox'],
  ['我和爸妈 + Sparkbox', 'Parents + Sparkbox'],
  ['先私下问问 Sparkbox', 'Talk privately with Sparkbox'],
  ['一起聊聊', 'Group chat'],
  ['想和对方说的话', 'What I want to tell my partner'],
  ['近况与问候', 'Check-ins'],
  ['健康与提醒', 'Health and reminders'],
  ['想和爸妈说的话', 'Talk to parents'],
];

export type SpaceFamilyAppEnableInput = {
  cadence?: string;
  entryCard?: boolean;
  confirmed?: boolean;
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
  lastMessagePreview?: string | null;
  lastMessageRole?: 'user' | 'assistant' | null;
  lastMessageSenderDisplayName?: string | null;
  lastMessageCreatedAt?: string | null;
};

export type HouseholdChatSessionMessage = HouseholdChatMessage & {
  senderDisplayName?: string | null;
  createdAt?: string | null;
};

export type HouseholdChatSessionDetail = HouseholdChatSessionSummary & {
  messages: HouseholdChatSessionMessage[];
};

export type HouseholdChatSessionCreateInput = {
  name: string;
  scope: ChatSessionScope;
  spaceId?: string | null;
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
  stage: 'preparing' | 'streaming';
};

export type HouseholdChatStreamTokenEvent = {
  type: 'token';
  content: string;
};

export type HouseholdChatStreamInfoEvent = {
  type: 'info';
  content: string;
  round?: number;
};

export type HouseholdChatStreamDoneEvent = {
  type: 'done';
  deviceId: string;
  message: string;
  error?: string | null;
  reason?: string | null;
  retryable?: boolean;
};

export type HouseholdChatSessionStreamHandlers = {
  onPending?: (event: HouseholdChatStreamPendingEvent) => void;
  onToken?: (event: HouseholdChatStreamTokenEvent) => void;
  onInfo?: (event: HouseholdChatStreamInfoEvent) => void;
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

export type WikiTempListing = {
  path: string;
  entries: HouseholdFileEntry[];
};

export type WikiTempFileReadResult = {
  path: string;
  content: string;
  updatedAt: string;
};

export type WikiTempPromoteResult = {
  ok: boolean;
  tempPath: string;
  rawPath: string;
  directoryMode?: string;
  directoryFallbackReason?: string | null;
  directoryModelBudgetSeconds?: number;
  directoryProvider?: string;
  directoryModel?: string;
  directoryProviderTimeoutSeconds?: number;
};

export type WikiPageSummary = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  tags: string[];
  updatedAt: string;
};

export type WikiIngestInput = {
  title: string;
  content: string;
  sourceType?: string;
  spaceId?: string | null;
};

export type WikiIngestResult = {
  operationId: string;
  rawSourceId: string;
  pageId: string;
  title: string;
  summary: string;
  directoryMode?: string;
  directoryFallbackReason?: string | null;
  directoryModelBudgetSeconds?: number;
  directoryProvider?: string;
  directoryModel?: string;
  directoryProviderTimeoutSeconds?: number;
};

export type WikiLintIssue = {
  code: string;
  severity: string;
  message: string;
  pageId?: string | null;
  pageTitle?: string | null;
};

export type WikiLintResult = {
  operationId: string;
  summary: string;
  issues: WikiLintIssue[];
  directoryMode?: string;
  directoryFallbackReason?: string | null;
  directoryModelBudgetSeconds?: number;
  directoryProvider?: string;
  directoryModel?: string;
  directoryProviderTimeoutSeconds?: number;
};

export type WikiUploadIngestResult = {
  operationId: string;
  saved: Array<{ name: string; rawPath: string; size: number }>;
  directoryMode?: string;
  directoryFallbackReason?: string | null;
  directoryModelBudgetSeconds?: number;
  directoryProvider?: string;
  directoryModel?: string;
  directoryProviderTimeoutSeconds?: number;
};

export type WikiDirectoryPayload = {
  directory: Record<string, unknown>;
  rawFiles: string[];
  manualEdits: Array<Record<string, unknown>>;
};

export type WikiOrganizeStartResult = {
  jobId: string;
  mode?: string;
  status: string;
  maxRounds: number;
  startedAt: string;
};

export type WikiOrganizeStatusResult = {
  jobId: string;
  mode?: string;
  status: string;
  iterations: number;
  durationMs: number;
  processedRecords: number;
  startedAt: string;
  finishedAt: string | null;
  message: string;
};

export type WikiDirectoryConsistencyResult = {
  operationId: string;
  initialExtra: string[];
  initialLack: string[];
  directory: Record<string, unknown>;
  directoryMode?: string;
  directoryFallbackReason?: string | null;
  directoryModelBudgetSeconds?: number;
  directoryProvider?: string;
  directoryModel?: string;
  directoryProviderTimeoutSeconds?: number;
};

export type WikiPreviewResult = {
  root: string;
  wikiFiles: Array<{
    path: string;
    preview: string;
    content: string;
    updatedAt: string;
  }>;
};

// ---------------------------------------------------------------------------
// v2 Raw Manager types
// ---------------------------------------------------------------------------

export type RawDirectoryFile = {
  filename: string;
  fileId: string;
  owners: string[];
  organizedBy: Record<string, boolean>;
  size: number;
  sha256: string;
  addedAt: string;
};

export type RawDirectoryPayload = {
  version: number;
  files: RawDirectoryFile[];
};

export type RawIngestResult = {
  ok: boolean;
  filename: string;
  fileId: string;
  owners: string[];
};

export type RawWorkspaceInfo = {
  userId: string;
  workspacePath: string;
  pointers: Array<Record<string, unknown>>;
  workFiles: Array<{ name: string; size: number; modifiedAt: string }>;
  agentsMdPreview: string;
  wikiMdPreview: string;
};

export type RawWorkFile = {
  path: string;
  name: string;
  isDir: boolean;
  size: number;
  modifiedAt: string;
};

export type RawPromoteResult = {
  ok: boolean;
  filename: string;
  fileId: string;
  rawPath: string;
};

export type ExternalStorageMount = {
  id: string;
  label: string;
  path: string;
};

export type ExternalStorageEntry = {
  name: string;
  path: string;
  sourcePath: string;
  isDir: boolean;
  size: number;
  modifiedAt: string;
};

export type WikiChatTranscriptEntryInput = {
  role: string;
  sender: string;
  content: string;
  createdAt?: string | null;
};

export type WikiChatTranscriptResult = {
  operationId: string;
  rawSourceId: string;
  rawPath: string;
  title: string;
  directoryMode?: string;
  directoryFallbackReason?: string | null;
};

export type HouseholdUploadInput = {
  name: string;
  mimeType: string;
  data?: Uint8Array;
  uri?: string;
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

export type DeviceReconnectResponse = {
  ok: boolean;
  deviceId: string;
  online: boolean;
  status: string;
  detail: string;
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
  spaceId?: string | null;
  spaceName?: string | null;
};

export type HouseholdInvitationPreview = {
  householdId: string;
  householdName: string;
  role: 'owner' | 'member';
  spaceId?: string | null;
  spaceName?: string | null;
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
  options: { confirmed?: boolean } = {},
): Promise<FamilyAppInstallation> {
  const response = await cloudJson<Record<string, unknown>>('/api/family-apps/install', {
    method: 'POST',
    token,
    body: { slug, confirmed: options.confirmed === true },
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
        confirmed: input.confirmed === true,
      },
    },
  );
}

export async function disableSpaceFamilyApp(
  token: string,
  spaceId: string,
  slug: string,
): Promise<{ ok: boolean }> {
  return cloudJson<{ ok: boolean }>(
    `/api/spaces/${encodeURIComponent(spaceId)}/family-apps/${encodeURIComponent(slug)}`,
    {
      method: 'DELETE',
      token,
    },
  );
}

export async function uninstallFamilyApp(
  token: string,
  slug: string,
): Promise<{ ok: boolean }> {
  return cloudJson<{ ok: boolean }>(`/api/family-apps/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    token,
  });
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
  options: { spaceId?: string | null } = {},
): Promise<HouseholdChatSessionSummary[]> {
  const params = new URLSearchParams({ scope });
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
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
      space_id: input.spaceId,
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
): Promise<HouseholdChatStreamDoneEvent> {
  const XhrCtor = getXmlHttpRequestConstructor();
  if (!XhrCtor) {
    throw new Error('Streaming chat is unavailable on this device.');
  }

  return new Promise<HouseholdChatStreamDoneEvent>((resolve, reject) => {
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

    const settleResolve = (response: HouseholdChatStreamDoneEvent) => {
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
        if (event.type === 'info') {
          handlers.onInfo?.(event);
          continue;
        }
        doneEvent = event;
        handlers.onDone?.(event);
      }
    };

    xhr.open('POST', `${getCloudApiBase()}/api/chat/sessions/${encodeURIComponent(sessionId)}/messages/stream`);
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
      settleResolve(doneEvent);
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
    const contentType = file.mimeType || 'application/octet-stream';
    if (file.uri) {
      // React Native/Expo uploads are most stable when FormData references URI directly.
      formData.append('files', {
        uri: file.uri,
        type: contentType,
        name: file.name,
      } as unknown as Blob);
      continue;
    }
    if (file.data) {
      const arrayBuffer = file.data.buffer.slice(
        file.data.byteOffset,
        file.data.byteOffset + file.data.byteLength,
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: contentType });
      formData.append('files', blob, file.name);
      continue;
    }
    throw new Error(`Upload payload missing data for ${file.name}`);
  }
  const params = new URLSearchParams({ space, path });
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
  const response = await fetch(`${getCloudApiBase()}/api/files/upload?${params.toString()}`, {
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
  return `${getCloudApiBase()}/api/files/download?${params.toString()}`;
}

export async function readHouseholdFileText(
  token: string,
  space: HouseholdFileSpace,
  path: string,
  options: { spaceId?: string | null } = {},
): Promise<string> {
  const params = new URLSearchParams({ space, path });
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
  const response = await fetch(`${getCloudApiBase()}/api/files/download?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`读取文件失败: ${response.status}`);
  }
  return response.text();
}

export async function getDeviceDiagnostics(
  token: string,
  deviceId: string,
): Promise<DeviceDiagnostics> {
  return cloudJson<DeviceDiagnostics>(`/api/devices/${encodeURIComponent(deviceId)}/diagnostics`, {
    token,
  });
}

export async function listWikiPages(
  token: string,
  options: { spaceId?: string | null } = {},
): Promise<WikiPageSummary[]> {
  const params = new URLSearchParams();
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
  const query = params.toString();
  const response = await cloudJson<{ pages: Array<Record<string, unknown>> }>(
    `/api/wiki/pages${query ? `?${query}` : ''}`,
    { token },
  );
  return response.pages.map((item) => ({
    id: String(item.id ?? ''),
    title: String(item.title ?? ''),
    slug: String(item.slug ?? ''),
    summary: String(item.summary ?? ''),
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag)) : [],
    updatedAt: String(item.updated_at ?? ''),
  }));
}

export async function ingestWikiRaw(
  token: string,
  input: WikiIngestInput,
): Promise<WikiIngestResult> {
  const response = await cloudJson<Record<string, unknown>>('/api/wiki/ingest', {
    method: 'POST',
    token,
    body: {
      title: input.title,
      content: input.content,
      source_type: input.sourceType || 'note',
      space_id: input.spaceId || undefined,
    },
  });
  return {
    operationId: String(response.operation_id ?? ''),
    rawSourceId: String(response.raw_source_id ?? ''),
    pageId: String(response.page_id ?? ''),
    title: String(response.title ?? ''),
    summary: String(response.summary ?? ''),
    directoryMode: String(response.directory_mode ?? ''),
    directoryFallbackReason: response.directory_fallback_reason == null ? null : String(response.directory_fallback_reason),
    directoryModelBudgetSeconds: Number(response.directory_model_budget_seconds ?? 0),
    directoryProvider: String(response.directory_provider ?? ''),
    directoryModel: String(response.directory_model ?? ''),
    directoryProviderTimeoutSeconds: Number(response.directory_provider_timeout_seconds ?? 0),
  };
}

export async function fileBackChatTranscript(
  token: string,
  input: {
    title: string;
    entries: WikiChatTranscriptEntryInput[];
    spaceId?: string | null;
  },
): Promise<WikiChatTranscriptResult> {
  const response = await cloudJson<Record<string, unknown>>('/api/wiki/chat-transcript', {
    method: 'POST',
    token,
    body: {
      title: input.title,
      entries: input.entries.map((entry) => ({
        role: entry.role,
        sender: entry.sender,
        content: entry.content,
        created_at: entry.createdAt || undefined,
      })),
      space_id: input.spaceId || undefined,
    },
  });
  return {
    operationId: String(response.operation_id ?? ''),
    rawSourceId: String(response.raw_source_id ?? ''),
    rawPath: String(response.raw_path ?? ''),
    title: String(response.title ?? ''),
    directoryMode: String(response.directory_mode ?? ''),
    directoryFallbackReason: response.directory_fallback_reason == null ? null : String(response.directory_fallback_reason),
  };
}

export async function lintWiki(
  token: string,
  options: { spaceId?: string | null } = {},
): Promise<WikiLintResult> {
  const response = await cloudJson<Record<string, unknown>>('/api/wiki/lint', {
    method: 'POST',
    token,
    body: {
      space_id: options.spaceId || undefined,
    },
  });
  return {
    operationId: String(response.operation_id ?? ''),
    summary: String(response.summary ?? ''),
    issues: Array.isArray(response.issues)
      ? response.issues.map((issue) => {
          const item = issue as Record<string, unknown>;
          return {
            code: String(item.code ?? ''),
            severity: String(item.severity ?? ''),
            message: String(item.message ?? ''),
            pageId: item.page_id == null ? null : String(item.page_id),
            pageTitle: item.page_title == null ? null : String(item.page_title),
          };
        })
      : [],
    directoryMode: String(response.directory_mode ?? ''),
    directoryFallbackReason: response.directory_fallback_reason == null ? null : String(response.directory_fallback_reason),
    directoryModelBudgetSeconds: Number(response.directory_model_budget_seconds ?? 0),
    directoryProvider: String(response.directory_provider ?? ''),
    directoryModel: String(response.directory_model ?? ''),
    directoryProviderTimeoutSeconds: Number(response.directory_provider_timeout_seconds ?? 0),
  };
}

export async function ingestWikiUploads(
  token: string,
  files: HouseholdUploadInput[],
  options: {
    spaceId?: string | null;
    sourceType?: 'note' | 'document' | 'image' | string;
  } = {},
): Promise<WikiUploadIngestResult> {
  const params = new URLSearchParams();
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
  params.set('source_type', options.sourceType || 'note');

  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append('files', {
      uri: file.uri,
      name: file.name || `upload-${index + 1}`,
      type: file.mimeType || 'application/octet-stream',
    } as any);
  });

  const response = await fetch(`${getCloudApiBase()}/api/wiki/ingest-upload?${params.toString()}`, {
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
  const payload = (await response.json()) as Record<string, unknown>;
  return {
    operationId: String(payload.operation_id ?? ''),
    saved: Array.isArray(payload.saved)
      ? payload.saved.map((item) => {
          const row = item as Record<string, unknown>;
          return {
            name: String(row.name ?? ''),
            rawPath: String(row.raw_path ?? ''),
            size: Number(row.size ?? 0),
          };
        })
      : [],
    directoryMode: String(payload.directory_mode ?? ''),
    directoryFallbackReason: payload.directory_fallback_reason == null ? null : String(payload.directory_fallback_reason),
    directoryModelBudgetSeconds: Number(payload.directory_model_budget_seconds ?? 0),
    directoryProvider: String(payload.directory_provider ?? ''),
    directoryModel: String(payload.directory_model ?? ''),
    directoryProviderTimeoutSeconds: Number(payload.directory_provider_timeout_seconds ?? 0),
  };
}

export async function getWikiDirectory(
  token: string,
  options: { spaceId?: string | null } = {},
): Promise<WikiDirectoryPayload> {
  const query = options.spaceId ? `?space_id=${encodeURIComponent(options.spaceId)}` : '';
  const response = await cloudJson<Record<string, unknown>>(`/api/wiki/directory${query}`, { token });
  return {
    directory:
      response.directory && typeof response.directory === 'object'
        ? (response.directory as Record<string, unknown>)
        : {},
    rawFiles: Array.isArray(response.raw_files) ? response.raw_files.map((item) => String(item)) : [],
    manualEdits: Array.isArray(response.manual_edits)
      ? response.manual_edits.map((item) => (item && typeof item === 'object' ? (item as Record<string, unknown>) : {}))
      : [],
  };
}

export async function startWikiOrganize(
  token: string,
  options: { spaceId?: string | null; maxRounds?: number } = {},
): Promise<WikiOrganizeStartResult> {
  const response = await cloudJson<Record<string, unknown>>('/api/wiki/organize', {
    method: 'POST',
    token,
    body: {
      space_id: options.spaceId || undefined,
      max_rounds: options.maxRounds ?? 10,
    },
  });
  return {
    jobId: String(response.job_id ?? ''),
    mode: String(response.mode ?? ''),
    status: String(response.status ?? ''),
    maxRounds: Number(response.max_rounds ?? 10),
    startedAt: String(response.started_at ?? ''),
  };
}

export async function startWikiQualityOptimize(
  token: string,
  options: { spaceId?: string | null; maxRounds?: number } = {},
): Promise<WikiOrganizeStartResult> {
  const response = await cloudJson<Record<string, unknown>>('/api/wiki/quality-optimize', {
    method: 'POST',
    token,
    body: {
      space_id: options.spaceId || undefined,
      max_rounds: options.maxRounds ?? 10,
    },
  });
  return {
    jobId: String(response.job_id ?? ''),
    mode: String(response.mode ?? ''),
    status: String(response.status ?? ''),
    maxRounds: Number(response.max_rounds ?? 10),
    startedAt: String(response.started_at ?? ''),
  };
}

export async function getWikiOrganizeStatus(token: string, jobId: string): Promise<WikiOrganizeStatusResult> {
  const response = await cloudJson<Record<string, unknown>>(`/api/wiki/organize/status?job_id=${encodeURIComponent(jobId)}`, {
    token,
  });
  return {
    jobId: String(response.job_id ?? ''),
    mode: String(response.mode ?? ''),
    status: String(response.status ?? ''),
    iterations: Number(response.iterations ?? 0),
    durationMs: Number(response.duration_ms ?? 0),
    processedRecords: Number(response.processed_records ?? 0),
    startedAt: String(response.started_at ?? ''),
    finishedAt: response.finished_at == null ? null : String(response.finished_at),
    message: String(response.message ?? ''),
  };
}

// ---------------------------------------------------------------------------
// User Skill
// ---------------------------------------------------------------------------

export type UserSkillResult = {
  exists: boolean;
  content: string;
  length: number;
  updatedAt: string;
};

export type UserSkillDistillResult = {
  ok: boolean;
  length: number;
  error: string;
};

export async function distillUserSkill(token: string): Promise<UserSkillDistillResult> {
  const response = await cloudJson<Record<string, unknown>>('/api/wiki/skill-distill', {
    method: 'POST',
    token,
  });
  return {
    ok: Boolean(response.ok ?? false),
    length: Number(response.length ?? 0),
    error: String(response.error ?? ''),
  };
}

export async function getUserSkill(token: string): Promise<UserSkillResult> {
  const response = await cloudJson<Record<string, unknown>>('/api/wiki/skill', {
    token,
  });
  return {
    exists: Boolean(response.exists ?? false),
    content: String(response.content ?? ''),
    length: Number(response.length ?? 0),
    updatedAt: String(response.updated_at ?? ''),
  };
}

export async function runWikiDirectoryConsistencyCheck(
  token: string,
  options: { spaceId?: string | null } = {},
): Promise<WikiDirectoryConsistencyResult> {
  const response = await cloudJson<Record<string, unknown>>('/api/wiki/directory/consistency-check', {
    method: 'POST',
    token,
    body: {
      space_id: options.spaceId || undefined,
    },
  });

  return {
    operationId: String(response.operation_id ?? ''),
    initialExtra: Array.isArray(response.initial_extra) ? response.initial_extra.map((item) => String(item)) : [],
    initialLack: Array.isArray(response.initial_lack) ? response.initial_lack.map((item) => String(item)) : [],
    directory:
      response.directory && typeof response.directory === 'object'
        ? (response.directory as Record<string, unknown>)
        : {},
    directoryMode: String(response.directory_mode ?? ''),
    directoryFallbackReason: response.directory_fallback_reason == null ? null : String(response.directory_fallback_reason),
    directoryModelBudgetSeconds: Number(response.directory_model_budget_seconds ?? 0),
    directoryProvider: String(response.directory_provider ?? ''),
    directoryModel: String(response.directory_model ?? ''),
    directoryProviderTimeoutSeconds: Number(response.directory_provider_timeout_seconds ?? 0),
  };
}

export async function getWikiPreview(
  token: string,
  options: { spaceId?: string | null } = {},
): Promise<WikiPreviewResult> {
  const query = options.spaceId ? `?space_id=${encodeURIComponent(options.spaceId)}` : '';
  const response = await cloudJson<Record<string, unknown>>(`/api/wiki/preview${query}`, { token });
  return {
    root: String(response.root ?? ''),
    wikiFiles: Array.isArray(response.wiki_files)
      ? response.wiki_files.map((item) => {
          const row = item as Record<string, unknown>;
          return {
            path: String(row.path ?? ''),
            preview: String(row.preview ?? ''),
            content: String(row.content ?? row.preview ?? ''),
            updatedAt: String(row.updated_at ?? ''),
          };
        })
      : [],
  };
}

export async function getWikiTempFiles(
  token: string,
  options: { spaceId?: string | null; path?: string } = {},
): Promise<WikiTempListing> {
  const params = new URLSearchParams();
  if (options.path) {
    params.set('path', options.path);
  }
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
  const query = params.toString();
  const response = await cloudJson<Record<string, unknown>>(`/api/wiki/temp${query ? `?${query}` : ''}`, {
    token,
  });
  return {
    path: String(response.path ?? ''),
    entries: Array.isArray(response.entries)
      ? response.entries.map((item) => normalizeFileEntry(item as Record<string, unknown>))
      : [],
  };
}

export async function readWikiTempFile(
  token: string,
  options: { spaceId?: string | null; path: string },
): Promise<WikiTempFileReadResult> {
  const params = new URLSearchParams({ path: options.path });
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
  const response = await cloudJson<Record<string, unknown>>(`/api/wiki/temp/read?${params.toString()}`, {
    token,
  });
  return {
    path: String(response.path ?? ''),
    content: String(response.content ?? ''),
    updatedAt: String(response.updated_at ?? ''),
  };
}

export async function deleteWikiTempPath(
  token: string,
  options: { spaceId?: string | null; path: string },
): Promise<{ ok: boolean }> {
  const params = new URLSearchParams({ path: options.path });
  if (options.spaceId) {
    params.set('space_id', options.spaceId);
  }
  return cloudJson<{ ok: boolean }>(`/api/wiki/temp?${params.toString()}`, {
    method: 'DELETE',
    token,
  });
}

export async function promoteWikiTempFile(
  token: string,
  input: { path: string; title?: string; spaceId?: string | null },
): Promise<WikiTempPromoteResult> {
  const response = await cloudJson<Record<string, unknown>>('/api/wiki/temp/promote', {
    method: 'POST',
    token,
    body: {
      path: input.path,
      title: input.title || undefined,
      space_id: input.spaceId || undefined,
    },
  });
  return {
    ok: Boolean(response.ok),
    tempPath: String(response.temp_path ?? ''),
    rawPath: String(response.raw_path ?? ''),
    directoryMode: response.directory_mode == null ? undefined : String(response.directory_mode),
    directoryFallbackReason:
      response.directory_fallback_reason == null ? null : String(response.directory_fallback_reason),
    directoryModelBudgetSeconds: Number(response.directory_model_budget_seconds ?? 0),
    directoryProvider: response.directory_provider == null ? undefined : String(response.directory_provider),
    directoryModel: response.directory_model == null ? undefined : String(response.directory_model),
    directoryProviderTimeoutSeconds: Number(response.directory_provider_timeout_seconds ?? 0),
  };
}

export async function getDeviceConfigStatus(
  token: string,
  deviceId: string,
): Promise<DeviceConfigStatus> {
  return cloudJson<DeviceConfigStatus>(`/api/devices/${encodeURIComponent(deviceId)}/config/status`, {
    token,
  });
}

// ---------------------------------------------------------------------------
// v2 Raw Manager API functions
// ---------------------------------------------------------------------------

export async function getRawDirectory(
  token: string,
  options: { spaceId?: string | null } = {},
): Promise<{ directory: RawDirectoryPayload }> {
  const query = options.spaceId ? `?space_id=${encodeURIComponent(options.spaceId)}` : '';
  const response = await cloudJson<Record<string, unknown>>(`/api/raw/directory${query}`, { token });
  const dir = response.directory as Record<string, unknown> | undefined;
  return {
    directory: {
      version: Number(dir?.version ?? 2),
      files: Array.isArray(dir?.files)
        ? (dir.files as Array<Record<string, unknown>>).map((f) => ({
            filename: String(f.filename ?? ''),
            fileId: String(f.file_id ?? ''),
            owners: Array.isArray(f.owners) ? f.owners.map(String) : [],
            organizedBy:
              f.organized_by && typeof f.organized_by === 'object'
                ? (f.organized_by as Record<string, boolean>)
                : {},
            size: Number(f.size ?? 0),
            sha256: String(f.sha256 ?? ''),
            addedAt: String(f.added_at ?? ''),
          }))
        : [],
    },
  };
}

export async function rawIngestText(
  token: string,
  input: { title: string; content: string; sourceType?: string; spaceId?: string | null; owners?: string[] },
): Promise<RawIngestResult> {
  const response = await cloudJson<Record<string, unknown>>('/api/raw/ingest', {
    method: 'POST',
    token,
    body: {
      title: input.title,
      content: input.content,
      source_type: input.sourceType || 'note',
      space_id: input.spaceId || undefined,
      owners: input.owners || undefined,
    },
  });
  return {
    ok: Boolean(response.ok),
    filename: String(response.filename ?? ''),
    fileId: String(response.file_id ?? ''),
    owners: Array.isArray(response.owners) ? response.owners.map(String) : [],
  };
}

export async function rawIngestUpload(
  token: string,
  files: HouseholdUploadInput[],
  options: { spaceId?: string | null; owners?: string } = {},
): Promise<{ ok: boolean; saved: Array<{ filename: string; fileId: string; originalName: string; size: number; owners: string[] }> }> {
  const params = new URLSearchParams();
  if (options.spaceId) params.set('space_id', options.spaceId);
  if (options.owners) params.set('owners', options.owners);

  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append('files', {
      uri: file.uri,
      name: file.name || `upload-${index + 1}`,
      type: file.mimeType || 'application/octet-stream',
    } as any);
  });

  const response = await fetch(`${getCloudApiBase()}/api/raw/ingest-upload?${params.toString()}`, {
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
      if (typeof body.detail === 'string' && body.detail.trim()) detail = body.detail.trim();
    } catch {}
    throw new Error(detail);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  return {
    ok: Boolean(payload.ok),
    saved: Array.isArray(payload.saved)
      ? (payload.saved as Array<Record<string, unknown>>).map((item) => ({
          filename: String(item.filename ?? ''),
          fileId: String(item.file_id ?? ''),
          originalName: String(item.original_name ?? ''),
          size: Number(item.size ?? 0),
          owners: Array.isArray(item.owners) ? item.owners.map(String) : [],
        }))
      : [],
  };
}

export async function rawSaveChatTranscript(
  token: string,
  input: {
    title: string;
    entries: WikiChatTranscriptEntryInput[];
    spaceId?: string | null;
    owners?: string[];
  },
): Promise<Record<string, unknown>> {
  return cloudJson<Record<string, unknown>>('/api/raw/chat-transcript', {
    method: 'POST',
    token,
    body: {
      title: input.title,
      entries: input.entries.map((entry) => ({
        role: entry.role,
        sender: entry.sender,
        content: entry.content,
        created_at: entry.createdAt || undefined,
      })),
      space_id: input.spaceId || undefined,
      owners: input.owners || undefined,
    },
  });
}

export async function deleteRawFile(
  token: string,
  filename: string,
  options: { spaceId?: string | null } = {},
): Promise<{ ok: boolean }> {
  const params = new URLSearchParams({ filename });
  if (options.spaceId) params.set('space_id', options.spaceId);
  return cloudJson<{ ok: boolean }>(`/api/raw/file?${params.toString()}`, {
    method: 'DELETE',
    token,
  });
}

export async function listExternalStorageDevices(
  token: string,
): Promise<{ mounts: ExternalStorageMount[] }> {
  const response = await cloudJson<Record<string, unknown>>('/api/raw/external-devices', { token });
  return {
    mounts: Array.isArray(response.mounts)
      ? (response.mounts as Array<Record<string, unknown>>).map((item) => ({
          id: String(item.id ?? ''),
          label: String(item.label ?? ''),
          path: String(item.path ?? ''),
        }))
      : [],
  };
}

export async function browseExternalStorage(
  token: string,
  rootPath: string,
  subpath?: string,
): Promise<{ rootPath: string; currentPath: string; entries: ExternalStorageEntry[] }> {
  const params = new URLSearchParams({ root_path: rootPath });
  if (subpath) params.set('subpath', subpath);
  const response = await cloudJson<Record<string, unknown>>(`/api/raw/external-browse?${params.toString()}`, { token });
  return {
    rootPath: String(response.root_path ?? rootPath),
    currentPath: String(response.current_path ?? ''),
    entries: Array.isArray(response.entries)
      ? (response.entries as Array<Record<string, unknown>>).map((item) => ({
          name: String(item.name ?? ''),
          path: String(item.path ?? ''),
          sourcePath: String(item.source_path ?? ''),
          isDir: Boolean(item.is_dir),
          size: Number(item.size ?? 0),
          modifiedAt: String(item.modified_at ?? ''),
        }))
      : [],
  };
}

export async function importExternalStorageItems(
  token: string,
  input: { sourcePaths: string[]; spaceId?: string | null; owners?: string[] },
): Promise<{
  ok: boolean;
  count: number;
  imported: Array<{ sourcePath: string; filename: string; fileId: string; size: number; owners: string[] }>;
}> {
  const response = await cloudJson<Record<string, unknown>>('/api/raw/external-import', {
    method: 'POST',
    token,
    body: {
      source_paths: input.sourcePaths,
      space_id: input.spaceId || undefined,
      owners: input.owners || undefined,
    },
  });

  return {
    ok: Boolean(response.ok),
    count: Number(response.count ?? 0),
    imported: Array.isArray(response.imported)
      ? (response.imported as Array<Record<string, unknown>>).map((item) => ({
          sourcePath: String(item.source_path ?? ''),
          filename: String(item.filename ?? ''),
          fileId: String(item.file_id ?? ''),
          size: Number(item.size ?? 0),
          owners: Array.isArray(item.owners) ? item.owners.map(String) : [],
        }))
      : [],
  };
}

export async function getRawWorkspace(token: string): Promise<RawWorkspaceInfo> {
  const response = await cloudJson<Record<string, unknown>>('/api/raw/workspace', { token });
  return {
    userId: String(response.user_id ?? ''),
    workspacePath: String(response.workspace_path ?? ''),
    pointers: Array.isArray(response.pointers) ? response.pointers as Array<Record<string, unknown>> : [],
    workFiles: Array.isArray(response.work_files)
      ? (response.work_files as Array<Record<string, unknown>>).map((f) => ({
          name: String(f.name ?? ''),
          size: Number(f.size ?? 0),
          modifiedAt: String(f.modified_at ?? ''),
        }))
      : [],
    agentsMdPreview: String(response.agents_md_preview ?? ''),
    wikiMdPreview: String(response.wiki_md_preview ?? ''),
  };
}

export async function listRawWorkFiles(token: string, subpath?: string): Promise<RawWorkFile[]> {
  const url = subpath
    ? `/api/raw/work?path=${encodeURIComponent(subpath)}`
    : '/api/raw/work';
  const response = await cloudJson<Record<string, unknown>>(url, { token });
  if (!Array.isArray(response.files)) return [];
  // Backend returns flat list with relative paths; group into virtual directory entries
  const prefix = subpath ? (subpath.endsWith('/') ? subpath : subpath + '/') : '';
  const seen = new Set<string>();
  const result: RawWorkFile[] = [];
  for (const f of response.files as Array<Record<string, unknown>>) {
    const fullPath = String(f.path ?? '');
    if (!fullPath) continue;
    // If we have a prefix filter, skip files not under it
    if (prefix && !fullPath.startsWith(prefix)) continue;
    const remainder = prefix ? fullPath.slice(prefix.length) : fullPath;
    const slashIdx = remainder.indexOf('/');
    if (slashIdx >= 0) {
      // This is inside a subdirectory — show the directory entry
      const dirName = remainder.slice(0, slashIdx);
      if (!seen.has(dirName)) {
        seen.add(dirName);
        result.push({
          path: prefix + dirName,
          name: dirName,
          isDir: true,
          size: 0,
          modifiedAt: '',
        });
      }
    } else {
      // Direct file at this level
      result.push({
        path: fullPath,
        name: remainder,
        isDir: false,
        size: Number(f.size ?? 0),
        modifiedAt: String(f.modified_at ?? ''),
      });
    }
  }
  // Sort: directories first, then files
  result.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return result;
}

export async function readRawWorkFile(
  token: string,
  path: string,
): Promise<{ path: string; content: string }> {
  return cloudJson<{ path: string; content: string }>(
    `/api/raw/work/read?path=${encodeURIComponent(path)}`,
    { token },
  );
}

export async function deleteRawWorkFile(token: string, path: string): Promise<{ ok: boolean }> {
  return cloudJson<{ ok: boolean }>(`/api/raw/work?path=${encodeURIComponent(path)}`, {
    method: 'DELETE',
    token,
  });
}

export async function promoteRawWorkFile(
  token: string,
  input: { path: string; spaceId?: string | null; owners?: string[] },
): Promise<RawPromoteResult> {
  const response = await cloudJson<Record<string, unknown>>('/api/raw/work/promote', {
    method: 'POST',
    token,
    body: {
      path: input.path,
      space_id: input.spaceId || undefined,
      owners: input.owners || undefined,
    },
  });
  return {
    ok: Boolean(response.ok ?? response.promoted),
    filename: String(response.filename ?? ''),
    fileId: String(response.file_id ?? ''),
    rawPath: String(response.raw_path ?? ''),
  };
}

export async function syncRawPointers(
  token: string,
  userId: string,
  options: { spaceId?: string | null } = {},
): Promise<{ ok: boolean }> {
  return cloudJson<{ ok: boolean }>('/api/raw/sync-pointers', {
    method: 'POST',
    token,
    body: {
      user_id: userId,
      space_id: options.spaceId || undefined,
    },
  });
}

export async function triggerWikiRebuild(
  token: string,
  userId: string,
  options: { incremental?: boolean } = {},
): Promise<Record<string, unknown>> {
  return cloudJson<Record<string, unknown>>('/api/raw/workspace/wiki-rebuild', {
    method: 'POST',
    token,
    body: {
      user_id: userId,
      incremental: options.incremental ?? true,
    },
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

export async function reconnectDevice(
  token: string,
  deviceId: string,
): Promise<DeviceReconnectResponse> {
  const response = await cloudJson<{
    ok: boolean;
    device_id: string;
    online: boolean;
    status: string;
    detail: string;
  }>(`/api/devices/${encodeURIComponent(deviceId)}/reconnect`, {
    method: 'POST',
    token,
  });

  return {
    ok: response.ok,
    deviceId: response.device_id,
    online: response.online,
    status: response.status,
    detail: response.detail,
  };
}

export async function createHouseholdInvitation(
  token: string,
  role: 'owner' | 'member',
  options: { spaceId?: string | null } = {},
): Promise<HouseholdInvitationResponse> {
  const response = await cloudJson<{
    invite_id: string;
    invite_code: string;
    role?: 'owner' | 'member';
    expires_in_seconds: number;
    expires_at: string;
    space_id?: string | null;
    space_name?: string | null;
  }>('/api/auth/invitations', {
    method: 'POST',
    token,
    body: {
      role,
      ...(options.spaceId ? { space_id: options.spaceId } : {}),
    },
  });

  return {
    inviteId: response.invite_id,
    inviteCode: response.invite_code,
    role: response.role ?? role,
    expiresInSeconds: response.expires_in_seconds,
    expiresAt: response.expires_at,
    spaceId: typeof response.space_id === 'string' ? response.space_id : null,
    spaceName: typeof response.space_name === 'string' ? normalizeSeededUiCopy(response.space_name) : null,
  };
}

export async function getHouseholdInvitationPreview(
  inviteCode: string,
): Promise<HouseholdInvitationPreview> {
  const response = await cloudJson<{
    household_id: string;
    household_name: string;
    role: 'owner' | 'member';
    space_id?: string | null;
    space_name?: string | null;
  }>(`/api/auth/invitations/preview/${encodeURIComponent(inviteCode.trim())}`, {});

  return {
    householdId: response.household_id,
    householdName: response.household_name,
    role: response.role === 'owner' ? 'owner' : 'member',
    spaceId: typeof response.space_id === 'string' ? response.space_id : null,
    spaceName: typeof response.space_name === 'string' ? normalizeSeededUiCopy(response.space_name) : null,
  };
}

export async function updateHouseholdSpaceMembers(
  token: string,
  spaceId: string,
  memberIds: string[],
): Promise<HouseholdSpaceDetail> {
  const response = await cloudJson<Record<string, unknown>>(
    `/api/spaces/${encodeURIComponent(spaceId)}/members`,
    {
      method: 'PATCH',
      token,
      body: {
        member_ids: memberIds,
      },
    },
  );
  return normalizeSpaceDetail(response);
}

export async function deleteHouseholdSpace(
  token: string,
  spaceId: string,
): Promise<{ ok: boolean; spaceId: string }> {
  const response = await cloudJson<{ ok: boolean; space_id: string }>(
    `/api/spaces/${encodeURIComponent(spaceId)}`,
    {
      method: 'DELETE',
      token,
    },
  );
  return {
    ok: response.ok,
    spaceId: response.space_id,
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
    token?: string;
    body?: unknown;
  },
): Promise<T> {
  const response = await fetch(`${getCloudApiBase()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
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
  events: Array<HouseholdChatStreamPendingEvent | HouseholdChatStreamTokenEvent | HouseholdChatStreamInfoEvent | HouseholdChatStreamDoneEvent>;
  rest: string;
} {
  const normalized = rawBuffer.replace(/\r\n/g, '\n');
  const segments = normalized.split('\n\n');
  const rest = force ? '' : segments.pop() ?? '';
  const events: Array<HouseholdChatStreamPendingEvent | HouseholdChatStreamTokenEvent | HouseholdChatStreamInfoEvent | HouseholdChatStreamDoneEvent> = [];

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
): HouseholdChatStreamPendingEvent | HouseholdChatStreamTokenEvent | HouseholdChatStreamInfoEvent | HouseholdChatStreamDoneEvent | null {
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
          stage: payload.stage === 'streaming' ? 'streaming' : 'preparing',
        };
      }
  if (type === 'token') {
    return {
      type: 'token',
      content: String(payload.content ?? ''),
    };
  }
  if (type === 'info') {
    return {
      type: 'info',
      content: String(payload.content ?? ''),
      round: Number(payload.round ?? 0),
    };
  }
  if (type === 'done') {
      return {
        type: 'done',
        deviceId: String(payload.device_id ?? ''),
        message: String(payload.message ?? ''),
        error: typeof payload.error === 'string' ? payload.error : null,
        reason: typeof payload.reason === 'string' ? payload.reason : null,
        retryable: payload.retryable === true,
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
    sourceLabel:
      typeof summary.source_label === 'string'
        ? normalizeSeededUiCopy(summary.source_label)
        : null,
    createdAt: String(summary.created_at ?? ''),
  };
}

function normalizeChatSessionSummary(session: Record<string, unknown>): HouseholdChatSessionSummary {
  return {
    id: String(session.id ?? ''),
    name: normalizeSeededUiCopy(String(session.name ?? 'New Chat')),
    scope: session.scope === 'private' ? 'private' : 'family',
    ownerUserId: String(session.owner_user_id ?? ''),
    systemPrompt:
      typeof session.system_prompt === 'string' ? normalizeSeededUiCopy(session.system_prompt) : '',
    temperature: typeof session.temperature === 'number' ? session.temperature : 0.7,
    maxTokens: typeof session.max_tokens === 'number' ? session.max_tokens : 2048,
    createdAt: String(session.created_at ?? ''),
    updatedAt: String(session.updated_at ?? ''),
    lastMessagePreview:
      typeof session.last_message_preview === 'string'
        ? normalizeSeededUiCopy(session.last_message_preview)
        : null,
    lastMessageRole:
      session.last_message_role === 'assistant'
        ? 'assistant'
        : session.last_message_role === 'user'
        ? 'user'
        : null,
    lastMessageSenderDisplayName:
      typeof session.last_message_sender_display_name === 'string'
        ? String(session.last_message_sender_display_name)
        : null,
    lastMessageCreatedAt:
      typeof session.last_message_created_at === 'string' ? String(session.last_message_created_at) : null,
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
          createdAt:
            typeof (message as Record<string, unknown>).created_at === 'string'
              ? String((message as Record<string, unknown>).created_at)
              : null,
        }))
      : [],
  };
}

function normalizeSpaceSummary(space: Record<string, unknown>): HouseholdSpaceSummary {
  return {
    id: String(space.id ?? ''),
    name: normalizeSeededUiCopy(String(space.name ?? '')),
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
          title: normalizeSeededUiCopy(String((thread as Record<string, unknown>).title ?? '')),
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
      ? space.enabled_family_apps.map((item) => {
          const slug = String((item as Record<string, unknown>).slug ?? '');
          const override = FAMILY_APP_COPY_OVERRIDES[slug];
          return {
            slug,
            title: override?.title ?? normalizeSeededUiCopy(String((item as Record<string, unknown>).title ?? '')),
            enabled: (item as Record<string, unknown>).enabled !== false,
            config:
              typeof (item as Record<string, unknown>).config === 'object' &&
              (item as Record<string, unknown>).config !== null
                ? ((item as Record<string, unknown>).config as Record<string, unknown>)
                : {},
          };
        })
      : [],
    privateSideChannel:
      space.private_side_channel && typeof space.private_side_channel === 'object'
        ? normalizeSpaceSideChannel(space.private_side_channel as Record<string, unknown>)
        : null,
  };
}

function normalizeFamilyAppInstallation(app: Record<string, unknown>): FamilyAppInstallation {
  const slug = String(app.slug ?? '');
  const override = FAMILY_APP_COPY_OVERRIDES[slug];
  return {
    slug,
    title: override?.title ?? String(app.title ?? ''),
    installed: app.installed !== false,
    description: override?.description ?? String(app.description ?? ''),
    entryTitle: override?.entryTitle ?? (typeof app.entry_title === 'string' ? app.entry_title : null),
    entryCopy: override?.entryCopy ?? (typeof app.entry_copy === 'string' ? app.entry_copy : null),
    starterPrompts: override?.starterPrompts ?? (Array.isArray(app.starter_prompts) ? app.starter_prompts.map((item) => String(item)) : []),
    threadHints: override?.threadHints ?? (Array.isArray(app.thread_hints) ? app.thread_hints.map((item) => String(item)) : []),
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
    label: normalizeSeededUiCopy(String(sideChannel.label ?? 'Talk privately with Sparkbox')),
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

function normalizeSeededUiCopy(value: string): string {
  return SEEDED_UI_COPY_REPLACEMENTS.reduce(
    (result, [source, replacement]) => result.split(source).join(replacement),
    String(value ?? ''),
  );
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
