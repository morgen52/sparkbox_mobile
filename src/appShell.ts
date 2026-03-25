import { describeOwnerServiceActionLabel, type ShellTab } from './householdState';

export const PHASE_ONE_TABS: Array<{ key: ShellTab; label: string }> = [
  { key: 'chats', label: '聊天' },
  { key: 'library', label: '资料库' },
  { key: 'settings', label: '设置' },
];

export type PhaseOneSurface = 'onboarding' | 'shell';

export type SetupFlowResetState = {
  setupFlowKind: 'first_run';
  reprovisionDeviceId: string;
  claimInput: string;
  pairingToken: string;
  claimError: string;
  bleError: string;
  selectedSsid: string;
  wifiPassword: string;
  manualEntry: boolean;
  networkSheetOpen: boolean;
  provisionBusy: boolean;
  provisionMessage: string;
  portalUrl: string | null;
  completedDeviceId: string;
  hotspotStage: 'idle';
  inviteCode: string;
  previousInternetSsid: string | null;
  setupPageState: null;
  setupNetworksLoaded: boolean;
};

export function buildSetupFlowResetState(): SetupFlowResetState {
  return {
    setupFlowKind: 'first_run',
    reprovisionDeviceId: '',
    claimInput: '',
    pairingToken: '',
    claimError: '',
    bleError: '',
    selectedSsid: '',
    wifiPassword: '',
    manualEntry: false,
    networkSheetOpen: false,
    provisionBusy: false,
    provisionMessage: '请先扫描二维码，让 Sparkbox 进入配网准备状态。',
    portalUrl: null,
    completedDeviceId: '',
    hotspotStage: 'idle',
    inviteCode: '',
    previousInternetSsid: null,
    setupPageState: null,
    setupNetworksLoaded: false,
  };
}

export function describeShellSubtitle(options: {
  shellTab: ShellTab;
  activeSpaceName: string;
  activeSpaceKindLabel: string;
  spacesReady?: boolean;
}): string {
  if (options.shellTab === 'chats') {
    if (!options.activeSpaceName) {
      if (options.spacesReady === false) {
        return '正在加载你的空间...';
      }
      return '请先选择一个空间，再进入该空间的聊天。';
    }
    return `当前空间：${options.activeSpaceName}（${options.activeSpaceKindLabel}），下方可直接进入聊天。`;
  }
  if (options.shellTab === 'library') {
    return '查看空间沉淀的内容，并在这里管理文件与任务。';
  }
  return '管理设备、当前空间、家庭应用与账号信息。';
}

export function formatByteSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '';
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

const AI_PROVIDER_LABELS: Record<string, string> = {
  ollama: 'On-device AI',
  openai: 'OpenAI',
  'azure-openai': 'Azure OpenAI',
  fireworks: 'Fireworks AI',
  together: 'Together AI',
  xai: 'xAI',
  mistral: 'Mistral',
  qwen: 'Qwen',
  'baidu-qianfan': 'Baidu Qianfan',
};

export function describeAiProvider(provider: string): string {
  const normalized = String(provider).trim().toLowerCase();
  if (!normalized) {
    return 'AI service';
  }
  return (
    AI_PROVIDER_LABELS[normalized] ??
    normalized
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (value) => value.toUpperCase())
  );
}

export function describeInviteExpiry(expiresAt: string): string {
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) {
    return 'Expires soon';
  }
  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
  return `到期时间：${formatted}`;
}

export function describeInviteRole(role: string): string {
  return String(role).trim().toLowerCase() === 'owner' ? '共同管理员' : '成员';
}

const ACTIVATION_STATUS_LABELS: Record<string, string> = {
  setup_ap_active: '等待配网',
  pairing_in_progress: '正在绑定家庭',
  activation_in_progress: '正在完成激活',
  bound_online: '已连接，可正常使用',
};

export function describeActivationStatus(status: string): string {
  const normalized = String(status).trim().toLowerCase();
  if (!normalized) {
    return '';
  }
  return (
    ACTIVATION_STATUS_LABELS[normalized] ??
    normalized
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (value) => value.toUpperCase())
  );
}

export function describeUiDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

function isSameUtcDay(left: Date, right: Date): boolean {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
}

function formatUiTime(value: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(value);
}

function formatUiShortDate(value: Date, includeYear: boolean): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' as const } : {}),
    timeZone: 'UTC',
  }).format(value);
}

export function describeChatListTimestamp(value: string, now = new Date()): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  if (isSameUtcDay(parsed, now)) {
    return formatUiTime(parsed);
  }
  const yesterday = new Date(now.getTime());
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (isSameUtcDay(parsed, yesterday)) {
    return 'Yesterday';
  }
  if (parsed.getUTCFullYear() === now.getUTCFullYear()) {
    return formatUiShortDate(parsed, false);
  }
  return formatUiShortDate(parsed, true);
}

export function describeChatMessageTimestamp(value: string, now = new Date()): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  if (isSameUtcDay(parsed, now)) {
    return formatUiTime(parsed);
  }
  const includeYear = parsed.getUTCFullYear() !== now.getUTCFullYear();
  return `${formatUiShortDate(parsed, includeYear)} · ${formatUiTime(parsed)}`;
}

function formatScheduleTime(hour: number, minute: number): string {
  const parsed = new Date(Date.UTC(2000, 0, 1, hour, minute));
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(parsed);
}

export function describeTaskSchedule(cronExpr: string): string {
  const parts = String(cronExpr).trim().split(/\s+/);
  if (parts.length !== 5) {
    return 'Repeats on a custom schedule';
  }
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const minuteNumber = Number.parseInt(minute, 10);
  const hourNumber = Number.parseInt(hour, 10);

  if (minute === '0' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return '每小时重复';
  }

  if (
    Number.isInteger(minuteNumber) &&
    Number.isInteger(hourNumber) &&
    dayOfMonth === '*' &&
    month === '*' &&
    dayOfWeek === '*'
  ) {
    return `每天 ${formatScheduleTime(hourNumber, minuteNumber)} 执行`;
  }

  if (
    Number.isInteger(minuteNumber) &&
    Number.isInteger(hourNumber) &&
    dayOfMonth === '*' &&
    month === '*' &&
    dayOfWeek === '1-5'
  ) {
    return `工作日 ${formatScheduleTime(hourNumber, minuteNumber)} 执行`;
  }

  return '自定义重复规则';
}

export function describeTaskExecution(commandType: string, scope: string): string {
  const executionLabel = commandType === 'zeroclaw' ? '由 Sparkbox 执行' : '在设备上执行';
  const visibilityLabel = scope === 'family' ? '共享空间' : '仅自己可见';
  return `${executionLabel} · ${visibilityLabel}`;
}

export function describeTaskEnabledState(enabled: boolean): string {
  return enabled ? '启用中' : '已暂停';
}

export function describeLibraryPhotoEmptyState(scope: 'family' | 'private'): string {
  return scope === 'family' ? '该空间还没有照片。' : '这里还没有照片。';
}

export function describeLibraryFileListTitle(scope: 'family' | 'private'): string {
  return scope === 'family' ? '空间文件' : '我的文件';
}

export function describeLibraryFileListEmptyState(scope: 'family' | 'private'): string {
  return scope === 'family' ? '该空间还没有文件。' : '这里还没有文件。';
}

export function describeLibraryTaskListTitle(scope: 'family' | 'private'): string {
  return scope === 'family' ? '空间任务' : '我的任务';
}

export function describeLibraryTaskListEmptyState(scope: 'family' | 'private'): string {
  return scope === 'family' ? '该空间还没有任务。' : '这里还没有任务。';
}

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export function decodeChatMessageContent(content: string): string {
  const normalized = String(content);
  if (!normalized.includes('&')) {
    return normalized;
  }
  return normalized.replace(/&(?:#(\d+)|#x([0-9a-fA-F]+)|([a-zA-Z]+));/g, (match, decimal, hex, named) => {
    if (decimal) {
      const codePoint = Number.parseInt(decimal, 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    if (hex) {
      const codePoint = Number.parseInt(hex, 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    const mapped = HTML_ENTITY_MAP[String(named).toLowerCase()];
    return mapped ?? match;
  });
}

export function describeFileTimestamp(modified: string): string {
  const formatted = describeUiDateTime(modified);
  return formatted ? `更新于 ${formatted}` : '已保存到 Sparkbox';
}

export function describeFileUploader(
  uploadedByUserId: string,
  currentUserId: string,
  members: Array<{ id: string; display_name: string }>,
): string {
  if (uploadedByUserId === currentUserId) {
    return '你上传的';
  }
  const matchedMember = members.find((member) => member.id === uploadedByUserId);
  if (matchedMember?.display_name) {
    return `${matchedMember.display_name} 上传`; 
  }
  return '其他家庭成员上传';
}

const SERVICE_AVAILABILITY_ERROR_LABELS: Record<string, string> = {
  'No online Sparkbox is ready for household files': '设备当前离线，请先让 Sparkbox 联网后再管理文件。',
  'No online Sparkbox is ready for household tasks': '设备当前离线，请先让 Sparkbox 联网后再管理任务。',
  'No online Sparkbox is ready for household chat': '设备当前离线，请先让 Sparkbox 联网后再聊天。',
  'No online Sparkbox is ready for chat': '设备当前离线，请先让 Sparkbox 联网后再聊天。',
  'Invalid or missing token': '登录状态失效，请重新登录。',
};

const GENERIC_SERVICE_AVAILABILITY_ERROR = 'Sparkbox 暂时不可用，请稍后重试。';

export function describeServiceAvailabilityError(message: string): string {
  const normalized = String(message).trim();
  if (!normalized) {
    return '';
  }
  const mapped = SERVICE_AVAILABILITY_ERROR_LABELS[normalized];
  if (mapped) {
    return mapped;
  }
  if (/^Could not\b/i.test(normalized)) {
    return normalized;
  }
  return GENERIC_SERVICE_AVAILABILITY_ERROR;
}

export function describeDiagnosticsSource(source: string): string {
  const normalized = String(source).trim().toLowerCase();
  if (!normalized || normalized === 'live') {
    return '实时诊断';
  }
  if (normalized === 'cached') {
    return '最近缓存诊断';
  }
  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (value) => value.toUpperCase());
}

export function describeDeviceActionNotice(
  kind: 'provider_saved' | 're_onboard_finished' | 'service_requested' | 'reset_ready',
  service?: 'ollama' | 'zeroclaw',
  action?: 'start' | 'stop' | 'restart',
): string {
  if (kind === 'provider_saved') {
    return '已保存当前设备的 AI 服务设置。';
  }
  if (kind === 're_onboard_finished') {
    return '已完成 AI 服务重配置。';
  }
  if (kind === 'service_requested' && service && action) {
    return `${describeOwnerServiceActionLabel(service, action)} requested.`;
  }
  return '设备已回到可重新配置状态。';
}

export function describeTaskRunStatus(status: string): string {
  const normalized = String(status).trim().toLowerCase();
  if (!normalized) {
    return '运行状态更新';
  }
  if (normalized === 'success' || normalized === 'succeeded') {
    return '已完成';
  }
  if (normalized === 'failed' || normalized === 'error') {
    return '需关注';
  }
  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (value) => value.toUpperCase());
}

export function describeTaskRunStartedAt(value: string): string {
  const formatted = describeUiDateTime(value);
  return formatted ? `开始于 ${formatted}` : '刚刚开始';
}

export function describeTaskRunFinishedAt(value: string): string {
  const formatted = describeUiDateTime(value);
  return formatted ? `结束于 ${formatted}` : '刚刚结束';
}

function summarizeOutputLine(output: string): string {
  const normalized = String(output)
    .replace(/\\n/g, '\n')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!normalized) {
    return '';
  }
  const friendly = normalized
    .replace(/\bzeroclaw\b/gi, 'Sparkbox service')
    .replace(/\bollama\b/gi, 'on-device AI');
  return friendly.length > 140 ? `${friendly.slice(0, 137).trimEnd()}...` : friendly;
}

export function summarizeOwnerServiceOutput(output: string): string {
  const summary = summarizeOutputLine(output);
  return summary ? `服务反馈：${summary}` : '';
}

export function describeTaskRunOutput(output: string): string {
  const summary = summarizeOutputLine(output);
  return summary ? `最近输出：${summary}` : '';
}

function sanitizeActivityDetails(details: string): string {
  const normalized = String(details).trim();
  if (!normalized) {
    return '';
  }
  const withoutSpaceIds = normalized.replace(/\bspace_[a-z0-9_-]+\b/gi, 'this space');
  const roleTransitionMatch = withoutSpaceIds.match(/^(owner|member)\s*(?:→|->)\s*(owner|member)$/i);
  if (roleTransitionMatch) {
    const nextRole = roleTransitionMatch[2].toLowerCase() === 'owner' ? '管理员' : '成员';
    return `已将家庭角色改为${nextRole}`;
  }
  if (/^Owner invite code generated$/i.test(withoutSpaceIds)) {
    return '已生成共同管理员邀请码';
  }
  if (/^Created family task(?: for this space)?$/i.test(withoutSpaceIds)) {
    return '已创建共享任务';
  }
  if (/^Sent into setup mode to change Wi-Fi$/i.test(withoutSpaceIds)) {
    return '已重新进入配网模式';
  }
  return withoutSpaceIds;
}

export function describeActivityEvent(details: string, eventType: string): string {
  const normalizedDetails = sanitizeActivityDetails(details);
  if (normalizedDetails) {
    return normalizedDetails;
  }
  const normalizedEventType = String(eventType).trim().replace(/_/g, ' ');
  if (!normalizedEventType) {
    return '家庭动态';
  }
  return normalizedEventType.replace(/^./, (value) => value.toUpperCase());
}

export function resolvePhaseOneSurface({
  sessionPresent,
  setupFlowRequested,
  onboardingInProgress,
  activationComplete,
  householdLoaded,
  hasAnyDevice,
}: {
  sessionPresent: boolean;
  setupFlowRequested: boolean;
  onboardingInProgress: boolean;
  activationComplete: boolean;
  householdLoaded: boolean;
  hasAnyDevice: boolean;
}): PhaseOneSurface {
  if (!sessionPresent) {
    return 'onboarding';
  }
  if (activationComplete) {
    return 'shell';
  }
  if (setupFlowRequested) {
    return 'onboarding';
  }
  if (onboardingInProgress) {
    return 'onboarding';
  }
  if (householdLoaded) {
    return 'shell';
  }
  return 'shell';
}
