import type {
  ChatSessionScope,
  HouseholdChatSessionDetail,
  HouseholdChatSessionSummary,
  HouseholdFileSpace,
  HouseholdFileListing,
  HouseholdSpaceDetail,
  HouseholdSpaceMember,
  HouseholdSpaceSummary,
  HouseholdTaskSummary,
  HouseholdTaskScope,
  SpaceLibrary,
  SpaceKind,
  SpaceTemplate,
} from './householdApi';

export function resolveActiveSpaceId(
  spaces: HouseholdSpaceSummary[],
  currentActiveSpaceId: string,
  preferredActiveSpaceId = '',
): string {
  if (currentActiveSpaceId && spaces.some((space) => space.id === currentActiveSpaceId)) {
    return currentActiveSpaceId;
  }
  if (preferredActiveSpaceId && spaces.some((space) => space.id === preferredActiveSpaceId)) {
    return preferredActiveSpaceId;
  }
  return spaces.find((space) => space.kind === 'shared')?.id ?? spaces[0]?.id ?? '';
}

export function mapSpaceKindToLegacyScope(kind: SpaceKind): {
  chatScope: ChatSessionScope;
  fileSpace: HouseholdFileSpace;
  taskScope: HouseholdTaskScope;
} {
  if (kind === 'private') {
    return {
      chatScope: 'private',
      fileSpace: 'private',
      taskScope: 'private',
    };
  }
  return {
    chatScope: 'family',
    fileSpace: 'family',
    taskScope: 'family',
  };
}

export function resolveTaskSpaceId(space: HouseholdSpaceSummary | null): string {
  if (!space || space.kind !== 'shared') {
    return '';
  }
  return space.id;
}

export type ChatSendPhase = 'idle' | 'sending' | 'streaming' | 'timed_out' | 'failed';

export function describeSpaceKind(kind: SpaceKind): string {
  return kind === 'private' ? 'Just you + Sparkbox' : 'Shared space';
}

export function describeSpaceCounts(kind: SpaceKind, threadCount: number, memberCount: number): string {
  const memberLabel = memberCount === 1 ? 'member' : 'members';
  const conversationLabel =
    kind === 'shared'
      ? `${threadCount} ${threadCount === 1 ? 'chat' : 'chats'}`
      : describeTopicCount(threadCount);
  return `${conversationLabel} · ${memberCount} ${memberLabel}`;
}

export function describeTopicCount(threadCount: number): string {
  const topicLabel = threadCount === 1 ? 'topic' : 'topics';
  return `${threadCount} ${topicLabel}`;
}

export function describeSpaceOverviewCopy(): string {
  return 'Start with the people first. Every space keeps its own chats, memories, and shared history.';
}

export type SpaceCopyContext = Pick<HouseholdSpaceSummary, 'kind' | 'name'> | Pick<HouseholdSpaceDetail, 'kind' | 'name'> | null;

export function resolveSpaceCopyContext(
  spaceDetail: HouseholdSpaceDetail | null,
  spaceSummary: HouseholdSpaceSummary | null,
): SpaceCopyContext {
  if (spaceDetail) {
    return spaceDetail;
  }
  if (!spaceSummary) {
    return null;
  }
  return {
    kind: spaceSummary.kind,
    name: spaceSummary.name,
  };
}

export function describeCurrentSpaceSummaryCopy(
  spaceName: string,
  spaceKindLabel: string,
  spaceKind: SpaceKind,
  threadCount: number,
): string {
  const conversationLabel =
    spaceKind === 'shared'
      ? `${threadCount} ${threadCount === 1 ? 'chat' : 'chats'}`
      : describeTopicCount(threadCount);
  return `You're viewing ${spaceName} (${spaceKindLabel}), and it already has ${conversationLabel}.`;
}

export function describeChatAccess(scope: ChatSessionScope): string {
  return scope === 'private' ? 'Just you' : 'Shared here';
}

export function shouldAppendAssistantReply(message: string): boolean {
  return Boolean(String(message).trim());
}

export function isSharedGroupChatSession(
  scope: ChatSessionScope,
  spaceDetail: SpaceCopyContext,
): boolean {
  return scope === 'family' && spaceDetail?.kind === 'shared';
}

export function looksLikeSharedGroupChatSession(
  sessionName: string,
  scope: ChatSessionScope,
  spaceDetail: SpaceCopyContext,
): boolean {
  const normalized = String(sessionName).trim().toLowerCase();
  return scope === 'family' && (normalized === 'group chat' || normalized.endsWith('· group chat') || normalized.endsWith(': group chat'));
}

export function describeChatSessionBadge(options: {
  sessionName?: string;
  scope: ChatSessionScope;
  spaceDetail: SpaceCopyContext;
  active: boolean;
}): string {
  if (options.sessionName && looksLikeSharedGroupChatSession(options.sessionName, options.scope, options.spaceDetail)) {
    return 'group chat';
  }
  return describeChatAccess(options.scope);
}

export function describeChatSessionPurpose(options: {
  sessionName?: string;
  scope: ChatSessionScope;
  spaceDetail: SpaceCopyContext;
}): string {
  if (options.sessionName && looksLikeSharedGroupChatSession(options.sessionName, options.scope, options.spaceDetail)) {
    return 'Sparkbox helping everyone stay in sync.';
  }
  if (options.scope === 'private' && options.spaceDetail?.kind === 'shared') {
    return 'Private side chat with Sparkbox before you bring anything back to the shared space.';
  }
  if (options.scope === 'private') {
    return 'Private topic with Sparkbox just for you.';
  }
  if (options.spaceDetail?.kind === 'shared' && options.scope === 'family') {
    return 'Shared chat with Sparkbox for this space.';
  }
  return 'Chat with Sparkbox for this space.';
}

function summarizeChatPreviewText(content: string): string {
  const normalized = String(content)
    .replace(/[*_`~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) {
    return '';
  }
  return normalized.length > 96 ? `${normalized.slice(0, 93).trimEnd()}...` : normalized;
}

export function describeChatSessionPreview(
  sessionItem: Pick<
    HouseholdChatSessionSummary,
    'lastMessagePreview' | 'lastMessageRole' | 'lastMessageSenderDisplayName'
  >,
  currentUserDisplayName?: string | null,
): string {
  const preview = summarizeChatPreviewText(sessionItem.lastMessagePreview ?? '');
  if (!preview) {
    return '';
  }
  if (sessionItem.lastMessageRole === 'assistant') {
    return `Sparkbox: ${preview}`;
  }
  const normalizedCurrentUser = String(currentUserDisplayName ?? '').trim().toLowerCase();
  const normalizedSender = String(sessionItem.lastMessageSenderDisplayName ?? '').trim();
  const speaker =
    normalizedSender && normalizedSender.toLowerCase() !== normalizedCurrentUser
      ? normalizedSender
      : 'You';
  return `${speaker}: ${preview}`;
}

function usesChatLanguage(spaceDetail: SpaceCopyContext, scope: ChatSessionScope): boolean {
  return spaceDetail?.kind === 'shared' && scope === 'family';
}

export function describeChatSessionPrimaryActionLabel(
  spaceDetail: SpaceCopyContext,
  scope: ChatSessionScope,
): string {
  return usesChatLanguage(spaceDetail, scope) ? 'New chat' : 'New topic';
}

export function describeChatSessionEmptyStateCopy(
  spaceDetail: SpaceCopyContext,
  scope: ChatSessionScope,
): string {
  return usesChatLanguage(spaceDetail, scope)
    ? 'No chats yet. Start one when this space needs Sparkbox.'
    : 'No topics yet. Start one when this space needs Sparkbox.';
}

export function describeChatSessionOpenError(spaceDetail: SpaceCopyContext): string {
  return spaceDetail?.kind === 'shared' ? 'Could not open this chat yet.' : 'Could not open this topic yet.';
}

export function describeChatSessionCreatePermissionError(
  spaceDetail: SpaceCopyContext,
  scope: ChatSessionScope,
): string {
  return usesChatLanguage(spaceDetail, scope)
    ? 'Only owners can create shared chats in this space.'
    : 'Only owners can create shared topics in this space.';
}

export function describeChatEditorVerb(spaceDetail: SpaceCopyContext, scope: ChatSessionScope): string {
  return usesChatLanguage(spaceDetail, scope) ? 'chat' : 'topic';
}

export function describeChatEditorTitle(
  spaceDetail: SpaceCopyContext,
  scope: ChatSessionScope,
  editing: boolean,
): string {
  if (editing) {
    return usesChatLanguage(spaceDetail, scope) ? 'Keep this chat clear for everyone' : 'Keep this topic clear for everyone';
  }
  if (scope === 'private') {
    return 'Start a private topic with Sparkbox';
  }
  return usesChatLanguage(spaceDetail, scope) ? 'Start a chat for this shared space' : 'Start a topic for this shared space';
}

export function describeChatEditorPrimaryActionLabel(
  spaceDetail: SpaceCopyContext,
  scope: ChatSessionScope,
  editing: boolean,
): string {
  const verb = describeChatEditorVerb(spaceDetail, scope);
  return `${editing ? 'Save' : 'Create'} ${verb}`;
}

export function describeChatNamePlaceholder(spaceDetail: SpaceCopyContext, scope: ChatSessionScope): string {
  return usesChatLanguage(spaceDetail, scope) ? 'Chat name' : 'Topic name';
}

export function describeSpaceThreadSectionTitle(spaceDetail: SpaceCopyContext): string {
  return spaceDetail?.kind === 'shared' ? 'Chats in this space' : 'Topics';
}

export function describeSpaceThreadSectionCopy(spaceDetail: SpaceCopyContext): string {
  if (!spaceDetail) {
    return 'Pick a space to see the chats Sparkbox keeps ready for it.';
  }
  if (spaceDetail.kind === 'shared') {
    return `${spaceDetail.name} keeps the main group chat and any extra shared chats together here.`;
  }
  return `${spaceDetail.name} stays easier to follow when each conversation has its own topic.`;
}

export function describeSpaceThreadEmptyStateCopy(spaceDetail: SpaceCopyContext): string {
  return spaceDetail?.kind === 'shared' ? 'No chats yet.' : 'No topics yet.';
}

export function describeSpaceThreadRowBadge(
  spaceDetail: SpaceCopyContext,
  threadTitle: string,
  hasChatSession: boolean,
  active: boolean,
): string {
  if (spaceDetail?.kind === 'shared') {
    return looksLikeSharedGroupChatSession(threadTitle, 'family', null) ? 'group chat' : 'shared chat';
  }
  if (hasChatSession && active) {
    return 'open';
  }
  return 'topic';
}

export function describeSpaceThreadRowCopy(
  spaceDetail: SpaceCopyContext,
  threadTitle: string,
  hasChatSession: boolean,
  active: boolean,
): string {
  if (spaceDetail?.kind === 'shared') {
    const noun = looksLikeSharedGroupChatSession(threadTitle, 'family', null) ? 'group chat' : 'shared chat';
    return `${hasChatSession ? 'Continue' : 'Start'} this ${noun} with everyone in the space.`;
  }
  if (hasChatSession && active) {
    return 'Continue this topic.';
  }
  return hasChatSession ? 'Continue this topic.' : 'Start this topic with Sparkbox.';
}

export function describeActiveChatFallbackTitle(spaceDetail: SpaceCopyContext): string {
  return spaceDetail?.kind === 'shared' ? 'Active group chat' : 'Active topic chat';
}

export function describeActiveChatSessionCopy(
  activeChatSessionName: string,
  spaceDetail: SpaceCopyContext,
  sharedChatIsVisible: boolean,
): string {
  if (sharedChatIsVisible && spaceDetail) {
    return `${spaceDetail.name} uses this as one group chat for everyone in the space, and Sparkbox helps the shared conversation keep moving.`;
  }
  return `This chat keeps Sparkbox focused on ${activeChatSessionName}.`;
}

export function describeActiveChatEmptyStateCopy(spaceDetail: SpaceCopyContext): string {
  if (spaceDetail?.kind === 'shared') {
    return 'Pick the main group chat or another shared chat to keep everyone in one running conversation.';
  }
  return 'Pick or create a topic chat to keep this conversation grounded in one clear subject.';
}

export function describeChatComposerPlaceholder(
  spaceDetail: SpaceCopyContext,
  hasActiveChatSession: boolean,
  sharedChatIsVisible: boolean,
): string {
  if (hasActiveChatSession) {
    if (sharedChatIsVisible) {
      return 'Send to everyone in this space';
    }
    return spaceDetail?.kind === 'shared' ? 'Ask Sparkbox in this chat' : 'Ask Sparkbox about this topic';
  }
  return spaceDetail?.kind === 'shared' ? 'Pick a chat in this space first' : 'Pick a topic chat first';
}

export function describeSpaceSummaryCaptureMissingChatCopy(spaceDetail: HouseholdSpaceDetail | null): string {
  if (spaceDetail?.kind === 'shared') {
    return 'Open a chat in Chats first so Sparkbox knows what to summarize.';
  }
  return 'Open a topic chat first so Sparkbox knows what to summarize.';
}

export function describeCaptureSummaryActionLabel(spaceDetail: HouseholdSpaceDetail | null): string {
  return spaceDetail?.kind === 'shared' ? 'Save recap from open chat' : 'Capture active topic';
}

export function describeSummarySectionCopy(spaceDetail: HouseholdSpaceDetail | null): string {
  return spaceDetail?.kind === 'shared'
    ? 'Summaries are read-only snapshots Sparkbox can generate from a chat so other family members can catch up quickly.'
    : 'Summaries are read-only snapshots Sparkbox can generate from a topic so other family members can catch up quickly.';
}

export function describeSummaryEmptyStateCopy(
  spaceDetail: HouseholdSpaceDetail | null,
  canMutate: boolean,
  activeChatSessionName: string,
): string {
  if (activeChatSessionName) {
    return `${spaceDetail?.kind === 'shared' ? 'Open chat' : 'Current topic'}: ${activeChatSessionName}`;
  }
  if (spaceDetail?.kind === 'shared') {
    return canMutate
      ? 'Pick a chat in Chats first if you want Sparkbox to snapshot that conversation.'
      : 'Owners can capture chat snapshots from Chats. You can still read every summary saved for this space.';
  }
  return canMutate
    ? 'Pick a topic in Chats first if you want Sparkbox to snapshot that conversation.'
    : 'Owners can capture topic snapshots from Chats. You can still read every summary saved for this space.';
}

export function describeSpaceTemplate(template: SpaceTemplate | string): string {
  switch (template) {
    case 'private':
      return 'Just you + Sparkbox';
    case 'household':
      return 'Shared home';
    case 'partner':
      return 'Partner';
    case 'parents':
      return 'Parents';
    case 'child':
      return 'Child';
    case 'household_ops':
      return 'Home routines';
    default:
      return String(template)
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
  }
}

export function formatSpaceTemplateList(spaceTemplates: string[]): string {
  return spaceTemplates.map((template) => describeSpaceTemplate(template)).join(' · ');
}

const FAMILY_APP_CAPABILITY_LABELS: Record<string, string> = {
  create_tasks: 'plans and routines',
  send_proactive_messages: 'proactive check-ins',
  suggest_memories: 'shared memories',
  generate_summaries: 'recap summaries',
  use_photos_as_context: 'shared photos',
  open_private_side_channel: 'private check-ins',
  request_confirmed_relay: 'owner-approved relays',
  create_recommended_threads: 'suggested group topics',
};

export function formatFamilyAppCapabilities(capabilities: string[]): string {
  return capabilities
    .map((capability) => {
      const normalized = String(capability).trim();
      if (!normalized) {
        return '';
      }
      return (
        FAMILY_APP_CAPABILITY_LABELS[normalized] ??
        normalized
          .replace(/_/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      );
    })
    .filter(Boolean)
    .join(' · ');
}

export function formatFamilyAppConfigSummary(config: Record<string, unknown>): string {
  const entries = Object.entries(config).filter(([, value]) => value !== undefined && value !== null && value !== '');
  return entries.length ? 'Ready in this space' : 'Ready in this space';
}

const FAMILY_APP_RISK_LEVEL_LABELS: Record<string, string> = {
  normal: 'Routine',
  sensitive: 'Sensitive',
  restricted: 'Restricted',
};

export function describeFamilyAppRiskLevel(riskLevel: string): string {
  const normalized = String(riskLevel).trim();
  if (!normalized) {
    return 'Unspecified';
  }
  return (
    FAMILY_APP_RISK_LEVEL_LABELS[normalized] ??
    normalized
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (value) => value.toUpperCase())
  );
}

export function describeChatSendPhase(phase: ChatSendPhase): string {
  switch (phase) {
    case 'sending':
      return 'Sparkbox is preparing the first reply';
    case 'streaming':
      return 'Sparkbox is still replying';
    case 'timed_out':
      return 'Sparkbox is taking longer than usual';
    case 'failed':
      return 'Sparkbox could not finish the reply';
    default:
      return '';
  }
}

export function canManageChatSession(options: {
  currentUserRole: string | undefined;
  currentUserId: string | undefined;
  sessionOwnerUserId: string | null | undefined;
  sessionScope: ChatSessionScope;
  spaceKind: SpaceKind | undefined;
}): boolean {
  if (options.sessionScope === 'family' && options.spaceKind === 'shared') {
    return options.currentUserRole === 'owner';
  }
  if (options.currentUserRole === 'owner') {
    return true;
  }
  if (!options.currentUserId || !options.sessionOwnerUserId) {
    return false;
  }
  return options.currentUserId === options.sessionOwnerUserId;
}

export function canCreateChatSession(options: {
  currentUserRole: string | undefined;
  sessionScope: ChatSessionScope;
  spaceKind: SpaceKind | undefined;
}): boolean {
  if (options.sessionScope === 'family' && options.spaceKind === 'shared') {
    return options.currentUserRole === 'owner';
  }
  return true;
}

export function canMutateSpaceLibrary(options: {
  spaceKind: SpaceKind | undefined;
  currentUserRole: string | undefined;
}): boolean {
  if (options.spaceKind === 'shared') {
    return options.currentUserRole === 'owner';
  }
  return true;
}

export function canMutateSpaceFiles(options: {
  spaceKind: SpaceKind | undefined;
  currentUserRole: string | undefined;
  fileSpace: HouseholdFileSpace;
}): boolean {
  if (options.fileSpace === 'private') {
    return true;
  }
  return canMutateSpaceLibrary({
    spaceKind: options.spaceKind,
    currentUserRole: options.currentUserRole,
  });
}

export function canManageSpaceFamilyApps(currentUserRole: string | undefined): boolean {
  return currentUserRole === 'owner';
}

export function buildSharedChatParticipantLabels(
  spaceDetail: HouseholdSpaceDetail | null,
  currentUserId: string | undefined,
): string[] {
  if (!spaceDetail || spaceDetail.kind !== 'shared') {
    return [];
  }
  const currentUser = currentUserId
    ? spaceDetail.members.find((member) => member.id === currentUserId)
    : null;
  const otherMembers = spaceDetail.members.filter((member) => member.id !== currentUserId);
  return [...(currentUser ? ['You'] : []), ...otherMembers.map((member) => member.displayName)];
}

export function buildSharedChatParticipantSummary(
  spaceDetail: HouseholdSpaceDetail | null,
  currentUserId: string | undefined,
): string {
  const labels = buildSharedChatParticipantLabels(spaceDetail, currentUserId);
  if (labels.length === 0) {
    return '';
  }
  return [...labels, 'Sparkbox'].join(' · ');
}

export type SpaceScopedResetState = {
  chatSessions: HouseholdChatSessionSummary[];
  activeChatSessionId: string;
  activeChatSession: HouseholdChatSessionDetail | null;
  chatDraft: string;
  spaceLibrary: SpaceLibrary;
  fileListing: HouseholdFileListing | null;
  tasks: HouseholdTaskSummary[];
};

export function buildChatScopeResetState(): Pick<
  SpaceScopedResetState,
  'chatSessions' | 'activeChatSessionId' | 'activeChatSession' | 'chatDraft'
> {
  return {
    chatSessions: [],
    activeChatSessionId: '',
    activeChatSession: null,
    chatDraft: '',
  };
}

export function buildSpaceScopedResetState(): SpaceScopedResetState {
  return {
    ...buildChatScopeResetState(),
    spaceLibrary: { memories: [], summaries: [] },
    fileListing: null,
    tasks: [],
  };
}

export function getRelayTargets(
  spaceDetail: HouseholdSpaceDetail | null,
  currentUserId: string | undefined,
): HouseholdSpaceMember[] {
  if (!spaceDetail) {
    return [];
  }
  return spaceDetail.members.filter((member) => member.id !== currentUserId);
}

export function resolveRelayTargetUserId(
  relayTargets: HouseholdSpaceMember[],
  currentRelayTargetUserId: string,
): string {
  if (currentRelayTargetUserId && relayTargets.some((member) => member.id === currentRelayTargetUserId)) {
    return currentRelayTargetUserId;
  }
  return relayTargets[0]?.id ?? '';
}

export function buildSpaceScopedFilePath(spacePrefix: string, displayPath: string): string {
  const normalizedPrefix = spacePrefix.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  const normalizedDisplayPath = displayPath.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  if (!normalizedPrefix) {
    return normalizedDisplayPath;
  }
  if (!normalizedDisplayPath) {
    return normalizedPrefix;
  }
  return `${normalizedPrefix}/${normalizedDisplayPath}`;
}

export function stripSpaceScopedFilePath(spacePrefix: string, devicePath: string | null | undefined): string {
  const normalizedPrefix = spacePrefix.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  const normalizedDevicePath = String(devicePath ?? '').trim().replace(/^\/+/, '').replace(/\/+$/, '');
  if (!normalizedPrefix) {
    return normalizedDevicePath;
  }
  if (normalizedDevicePath === normalizedPrefix) {
    return '';
  }
  if (normalizedDevicePath.startsWith(`${normalizedPrefix}/`)) {
    return normalizedDevicePath.slice(normalizedPrefix.length + 1);
  }
  return normalizedDevicePath;
}
