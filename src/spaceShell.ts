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
  return kind === 'private' ? '仅自己可见' : '家庭共享';
}

export function describeSpaceCounts(kind: SpaceKind, threadCount: number, memberCount: number): string {
  const memberLabel = '人';
  const conversationLabel =
    kind === 'shared'
      ? `${threadCount} 个聊天`
      : describeTopicCount(threadCount);
  return `${conversationLabel} · ${memberCount}${memberLabel}`;
}

export function describeTopicCount(threadCount: number): string {
  return `${threadCount} 个话题`;
}

export function describeSpaceOverviewCopy(): string {
  return '先确定参与成员，每个空间都会独立保存聊天、记忆和历史。';
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
  return `当前查看：${spaceName}（${spaceKindLabel}），已包含 ${conversationLabel}。`;
}

export function describeChatAccess(scope: ChatSessionScope): string {
  return scope === 'private' ? '仅自己' : '空间共享';
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
    return '群聊';
  }
  return describeChatAccess(options.scope);
}

export function describeChatSessionPurpose(options: {
  sessionName?: string;
  scope: ChatSessionScope;
  spaceDetail: SpaceCopyContext;
}): string {
  if (options.sessionName && looksLikeSharedGroupChatSession(options.sessionName, options.scope, options.spaceDetail)) {
    return 'Sparkbox 正在帮助大家保持同步。';
  }
  if (options.scope === 'private' && options.spaceDetail?.kind === 'shared') {
    return '先在私密对话中整理想法，再决定是否同步到共享空间。';
  }
  if (options.scope === 'private') {
    return '与你专属的私密话题。';
  }
  if (options.spaceDetail?.kind === 'shared' && options.scope === 'family') {
    return '该空间内的共享聊天。';
  }
  return '在该空间中与 Sparkbox 对话。';
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
    return `Sparkbox：${preview}`;
  }
  const normalizedCurrentUser = String(currentUserDisplayName ?? '').trim().toLowerCase();
  const normalizedSender = String(sessionItem.lastMessageSenderDisplayName ?? '').trim();
  const speaker =
    normalizedSender && normalizedSender.toLowerCase() !== normalizedCurrentUser
      ? normalizedSender
        : '你';
      return `${speaker}：${preview}`;
}

function usesChatLanguage(spaceDetail: SpaceCopyContext, scope: ChatSessionScope): boolean {
  return spaceDetail?.kind === 'shared' && scope === 'family';
}

export function describeChatSessionPrimaryActionLabel(
  spaceDetail: SpaceCopyContext,
  scope: ChatSessionScope,
): string {
  return usesChatLanguage(spaceDetail, scope) ? '新建聊天' : '新建话题';
}

export function describeChatSessionEmptyStateCopy(
  spaceDetail: SpaceCopyContext,
  scope: ChatSessionScope,
): string {
  return usesChatLanguage(spaceDetail, scope)
    ? '还没有聊天，点击创建即可开始。'
    : '还没有话题，点击创建即可开始。';
}

export function describeChatSessionOpenError(spaceDetail: SpaceCopyContext): string {
  return spaceDetail?.kind === 'shared' ? '暂时无法打开该聊天。' : '暂时无法打开该话题。';
}

export function describeChatSessionCreatePermissionError(
  spaceDetail: SpaceCopyContext,
  scope: ChatSessionScope,
): string {
  return usesChatLanguage(spaceDetail, scope)
    ? '仅管理员可以创建共享聊天。'
    : '仅管理员可以创建共享话题。';
}

export function describeChatEditorVerb(spaceDetail: SpaceCopyContext, scope: ChatSessionScope): string {
  return usesChatLanguage(spaceDetail, scope) ? '聊天' : '话题';
}

export function describeChatEditorTitle(
  spaceDetail: SpaceCopyContext,
  scope: ChatSessionScope,
  editing: boolean,
): string {
  if (editing) {
    return usesChatLanguage(spaceDetail, scope) ? '编辑聊天信息' : '编辑话题信息';
  }
  if (scope === 'private') {
    return '新建私密话题';
  }
  return usesChatLanguage(spaceDetail, scope) ? '为该共享空间新建聊天' : '为该共享空间新建话题';
}

export function describeChatEditorPrimaryActionLabel(
  spaceDetail: SpaceCopyContext,
  scope: ChatSessionScope,
  editing: boolean,
): string {
  const verb = describeChatEditorVerb(spaceDetail, scope);
  return `${editing ? '保存' : '创建'}${verb}`;
}

export function describeChatNamePlaceholder(spaceDetail: SpaceCopyContext, scope: ChatSessionScope): string {
  return usesChatLanguage(spaceDetail, scope) ? '聊天名称' : '话题名称';
}

export function describeSpaceThreadSectionTitle(spaceDetail: SpaceCopyContext): string {
  return spaceDetail?.kind === 'shared' ? '本空间聊天' : '话题列表';
}

export function describeSpaceThreadSectionCopy(spaceDetail: SpaceCopyContext): string {
  if (!spaceDetail) {
    return '请先选择空间，再查看该空间聊天。';
  }
  if (spaceDetail.kind === 'shared') {
    return `${spaceDetail.name} 的群聊与扩展聊天都会集中展示在这里。`;
  }
  return `${spaceDetail.name} 采用按话题分组，阅读更清晰。`;
}

export function describeSpaceThreadEmptyStateCopy(spaceDetail: SpaceCopyContext): string {
  return spaceDetail?.kind === 'shared' ? '还没有聊天。' : '还没有话题。';
}

export function describeSpaceThreadRowBadge(
  spaceDetail: SpaceCopyContext,
  threadTitle: string,
  hasChatSession: boolean,
  active: boolean,
): string {
  if (spaceDetail?.kind === 'shared') {
    return looksLikeSharedGroupChatSession(threadTitle, 'family', null) ? '群聊' : '共享聊天';
  }
  if (hasChatSession && active) {
    return '已打开';
  }
  return '话题';
}

export function describeSpaceThreadRowCopy(
  spaceDetail: SpaceCopyContext,
  threadTitle: string,
  hasChatSession: boolean,
  active: boolean,
): string {
  if (spaceDetail?.kind === 'shared') {
    const noun = looksLikeSharedGroupChatSession(threadTitle, 'family', null) ? '群聊' : '共享聊天';
    return `${hasChatSession ? '继续' : '开始'}该${noun}。`;
  }
  if (hasChatSession && active) {
    return '继续这个话题。';
  }
  return hasChatSession ? '继续这个话题。' : '开始这个话题。';
}

export function describeActiveChatFallbackTitle(spaceDetail: SpaceCopyContext): string {
  return spaceDetail?.kind === 'shared' ? '当前群聊' : '当前话题';
}

export function describeActiveChatSessionCopy(
  activeChatSessionName: string,
  spaceDetail: SpaceCopyContext,
  sharedChatIsVisible: boolean,
): string {
  if (sharedChatIsVisible && spaceDetail) {
    return `${spaceDetail.name} 当前采用群聊协作，Sparkbox 会帮助对话持续推进。`;
  }
  return `当前聊天聚焦：${activeChatSessionName}。`;
}

export function describeActiveChatEmptyStateCopy(spaceDetail: SpaceCopyContext): string {
  if (spaceDetail?.kind === 'shared') {
    return '请选择群聊或共享聊天，方便大家在同一线程沟通。';
  }
  return '请选择或创建话题，让对话更聚焦。';
}

export function describeChatComposerPlaceholder(
  spaceDetail: SpaceCopyContext,
  hasActiveChatSession: boolean,
  sharedChatIsVisible: boolean,
): string {
  if (hasActiveChatSession) {
    if (sharedChatIsVisible) {
      return '发送到群聊';
    }
    return spaceDetail?.kind === 'shared' ? '在此聊天中提问' : '围绕此话题提问';
  }
  return spaceDetail?.kind === 'shared' ? '请先选择聊天' : '请先选择话题';
}

export function describeSpaceSummaryCaptureMissingChatCopy(spaceDetail: HouseholdSpaceDetail | null): string {
  if (spaceDetail?.kind === 'shared') {
    return '请先在聊天页打开一个聊天，才能生成摘要。';
  }
  return '请先打开一个话题，才能生成摘要。';
}

export function describeCaptureSummaryActionLabel(spaceDetail: HouseholdSpaceDetail | null): string {
  return spaceDetail?.kind === 'shared' ? '从当前聊天生成摘要' : '从当前话题生成摘要';
}

export function describeSummarySectionCopy(spaceDetail: HouseholdSpaceDetail | null): string {
  return spaceDetail?.kind === 'shared'
    ? '摘要是只读快照，可帮助家人快速了解聊天进展。'
    : '摘要是只读快照，可帮助家人快速了解话题进展。';
}

export function describeSummaryEmptyStateCopy(
  spaceDetail: HouseholdSpaceDetail | null,
  canMutate: boolean,
  activeChatSessionName: string,
): string {
  if (activeChatSessionName) {
    return `${spaceDetail?.kind === 'shared' ? '当前聊天' : '当前话题'}：${activeChatSessionName}`;
  }
  if (spaceDetail?.kind === 'shared') {
    return canMutate
      ? '先在聊天页选择一个聊天，再生成摘要。'
      : '仅管理员可从聊天生成摘要，你仍可阅读已保存内容。';
  }
  return canMutate
    ? '先选择一个话题，再生成摘要。'
    : '仅管理员可生成话题摘要，你仍可阅读已保存内容。';
}

export function describeSpaceTemplate(template: SpaceTemplate | string): string {
  switch (template) {
    case 'private':
      return '仅自己可见';
    case 'household':
      return '家庭共享';
    case 'partner':
      return '伴侣';
    case 'parents':
      return '父母';
    case 'child':
      return '孩子';
    case 'household_ops':
      return '家庭事务';
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
  create_tasks: '计划与任务',
  send_proactive_messages: '主动提醒',
  suggest_memories: '记忆建议',
  generate_summaries: '摘要生成',
  use_photos_as_context: '照片上下文',
  open_private_side_channel: '私密沟通',
  request_confirmed_relay: '管理员确认转达',
  create_recommended_threads: '推荐话题',
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
  return entries.length ? '已在该空间启用' : '已在该空间启用';
}

const FAMILY_APP_RISK_LEVEL_LABELS: Record<string, string> = {
  normal: '常规',
  sensitive: '敏感',
  restricted: '受限',
};

export function describeFamilyAppRiskLevel(riskLevel: string): string {
  const normalized = String(riskLevel).trim();
  if (!normalized) {
    return '未标注';
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
      return 'Sparkbox 正在准备首条回复';
    case 'streaming':
      return 'Sparkbox 正在持续回复';
    case 'timed_out':
      return 'Sparkbox 响应时间较长';
    case 'failed':
      return 'Sparkbox 未能完成回复';
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
  return [...(currentUser ? ['你'] : []), ...otherMembers.map((member) => member.displayName)];
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
