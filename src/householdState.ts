import type {
  DeviceSummary,
  HouseholdActivitySummary,
  HouseholdInviteSummary,
  HouseholdMemberSummary,
} from './householdApi';

export type ShellTab = 'chats' | 'library' | 'settings';

export type HouseholdState = {
  householdId: string;
  householdName: string;
  members: HouseholdMemberSummary[];
  pendingInvites: HouseholdInviteSummary[];
  devices: DeviceSummary[];
  recentActivity: HouseholdActivitySummary[];
};

export function hasOnlineDevice(devices: DeviceSummary[]): boolean {
  return devices.some((device) => device.online);
}

export function canManageHousehold(role: string): boolean {
  return role === 'owner';
}

export function canReprovisionDeviceFromSettings(role: string): boolean {
  return canManageHousehold(role);
}

const DEVICE_STATUS_LABELS: Record<string, string> = {
  bound_online: '在线可用',
  bound_offline: '当前离线',
  claimed: '已绑定到家庭',
  local_setup: '等待配置',
  setup_ap_active: '等待配置',
  provisioning: '正在完成配置',
};

export function describeDeviceStatus(status: string): string {
  const normalized = String(status).trim();
  if (!normalized) {
    return '状态未知';
  }
  return (
    DEVICE_STATUS_LABELS[normalized] ??
    normalized
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (value) => value.toUpperCase())
  );
}

export function describeDeviceLabel(deviceId: string, index: number, total: number): string {
  if (total <= 1) {
    return 'Sparkbox 设备';
  }
  return `Sparkbox 设备 ${index + 1}`;
}

export function describeSetupDeviceLabel(deviceId?: string | null): string {
  return describeDeviceLabel(String(deviceId ?? '').trim(), 0, 1);
}

export function describeOwnerConsoleModelStatus(service?: string | null, api?: string | null): string {
  const serviceState = String(service ?? '').trim().toLowerCase();
  const apiState = String(api ?? '').trim().toLowerCase();
  const modelLine = serviceState === 'active' ? '正常' : '需处理';
  const apiLine = apiState === 'ok' ? '连接正常' : '连接异常';
  return `本地 AI：${modelLine} · ${apiLine}`;
}

export function describeOwnerConsoleRuntimeStatus(daemon?: string | null, gateway?: string | null): string {
  const daemonState = String(daemon ?? '').trim().toLowerCase();
  const gatewayState = String(gateway ?? '').trim().toLowerCase();
  const runtimeLine = daemonState === 'ok' ? '运行中' : '需处理';
  const bridgeLine = gatewayState === 'ok' ? '家庭连接正常' : '家庭连接异常';
  return `设备服务：${runtimeLine} · ${bridgeLine}`;
}

export function describeOwnerConsoleInference(
  queuedRequests?: number | null,
  queueLimit?: number | null,
  active?: boolean | null,
): string {
  const queued = Math.max(0, Number(queuedRequests ?? 0) || 0);
  const limit = Math.max(0, Number(queueLimit ?? 0) || 0);
  if (queued === 0) {
    return `当前请求：无 · 队列容量：${limit}`;
  }
  return `当前请求：排队 ${queued} 个 · ${active ? '设备忙碌中' : `剩余容量：${limit}`}`;
}

export function describeOwnerRuntimeQueueSummary(queuedRequests?: number | null, queueLimit?: number | null): string {
  const queued = Math.max(0, Number(queuedRequests ?? 0) || 0);
  const limit = Math.max(0, Number(queueLimit ?? 0) || 0);
  if (queued === 0) {
    return `当前无人排队，设备还可处理 ${limit} 个请求。`;
  }
  return `当前有 ${queued} 个请求排队，队列上限 ${limit}。`;
}

export function describeOwnerRuntimeActiveRequest(username?: string | null): string {
  const normalized = String(username ?? '').trim();
  if (!normalized) {
    return '当前没有人等待设备处理。';
  }
  return '设备正在处理请求。';
}

export function describeOwnerRuntimeQueueEntry(username?: string | null, position?: number | null): string {
  const slot = Math.max(0, Number(position ?? 0) || 0);
  if (slot <= 1) {
    return '下一条请求即将执行。';
  }
  return '该请求仍在排队中。';
}

export function describeOwnerServiceActionLabel(service: string, action: string): string {
  const serviceLabel = service === 'ollama' ? '本地 AI 服务' : 'Sparkbox 服务';
  const actionLabel = action === 'restart' ? '重启' : action === 'stop' ? '停止' : '启动';
  return `${actionLabel} ${serviceLabel}`;
}

export function describeHouseholdRole(role: string): string {
  const normalized = String(role).trim().toLowerCase();
  if (!normalized) {
    return '成员';
  }
  if (normalized === 'owner') {
    return '管理员';
  }
  if (normalized === 'member') {
    return '成员';
  }
  return normalized.replace(/^./, (value) => value.toUpperCase());
}

const WIFI_INTERFACE_PATTERN = /\bwl[a-z0-9._-]+\b/gi;
const DIAGNOSTICS_PREFLIGHT_REASON_LABELS: Record<string, string> = {
  network_control_requires_auth: '设备暂时无法管理 Wi-Fi 设置。',
  wifi_share_protected_denied: '设备暂时无法开启受保护热点。',
  ap_mode_unsupported: '当前 Wi-Fi 硬件不支持热点模式。',
  configured_interface_missing: '配置中的 Wi-Fi 网卡不存在。',
  nmcli_unavailable_or_disabled: 'Wi-Fi 控制服务不可用。',
  wifi_radio_disabled: 'Wi-Fi 无线已关闭。',
  no_wifi_device: '未检测到可用 Wi-Fi 网卡。',
};

const DIAGNOSTICS_ISSUE_LABELS: Record<string, string> = {
  'ollama:service_failed': '本地 AI 服务异常。',
  'ollama:api_unreachable': '本地 AI 接口无响应。',
  'zeroclaw:service_inactive': 'Sparkbox 服务未运行。',
};

export function describeDiagnosticsNetworkSummary(summary: string): string {
  const normalized = String(summary).trim();
  if (!normalized) {
    return '';
  }
  return normalized.replace(/\s+on\s+\bwl[a-z0-9._-]+\b/gi, ' on Wi-Fi');
}

export function describeDiagnosticsWifiConnection(wifiInterface?: string | null, wifiRadio?: string | null): string {
  const normalizedInterface = String(wifiInterface ?? '').trim();
  if (!normalizedInterface) {
    return '';
  }
  const normalizedRadio = String(wifiRadio ?? '').trim();
  if (!normalizedRadio || normalizedRadio.toLowerCase() === 'unknown') {
    return 'Wi-Fi：已连接';
  }
  return `Wi-Fi：已连接 · ${normalizedRadio.replace(WIFI_INTERFACE_PATTERN, 'Wi-Fi')}`;
}

export function describeDiagnosticsPreflightReasons(reasons: string[] = []): string {
  const labels = reasons
    .map((reason) => DIAGNOSTICS_PREFLIGHT_REASON_LABELS[String(reason).trim()] ?? String(reason).trim())
    .map((label) => String(label).trim().replace(/[.!?]+$/g, ''))
    .filter(Boolean);

  if (!labels.length) {
    return '';
  }
  return `${labels.join(', ')}.`;
}

export function describeDiagnosticsIssueReasons(
  issues: Array<{ service: string; reason: string }> = [],
): string {
  const labels = issues
    .map((issue) => {
      const key = `${String(issue.service).trim()}:${String(issue.reason).trim()}`;
      return DIAGNOSTICS_ISSUE_LABELS[key] ?? String(issue.reason).trim();
    })
    .map((label) => String(label).trim().replace(/[.!?]+$/g, ''))
    .filter(Boolean);

  if (!labels.length) {
    return '';
  }
  return `${labels.join(', ')}.`;
}

function countOwners(members: HouseholdMemberSummary[]): number {
  return members.filter((member) => member.role === 'owner').length;
}

export function canChangeMemberRole(
  members: HouseholdMemberSummary[],
  member: HouseholdMemberSummary,
  nextRole: HouseholdMemberSummary['role'],
): boolean {
  if (member.role === nextRole) {
    return false;
  }
  if (member.role === 'owner' && nextRole !== 'owner') {
    return countOwners(members) > 1;
  }
  return true;
}

export function canRemoveHouseholdMember(
  members: HouseholdMemberSummary[],
  member: HouseholdMemberSummary,
): boolean {
  if (member.role !== 'owner') {
    return true;
  }
  return countOwners(members) > 1;
}
