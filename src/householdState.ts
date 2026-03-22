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
  bound_online: 'Connected and ready',
  bound_offline: 'Offline right now',
  claimed: 'Attached to your household',
  local_setup: 'Ready for setup',
  setup_ap_active: 'Ready for setup',
  provisioning: 'Finishing setup',
};

export function describeDeviceStatus(status: string): string {
  const normalized = String(status).trim();
  if (!normalized) {
    return 'Status unavailable';
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
    return 'Sparkbox device';
  }
  return `Sparkbox device ${index + 1}`;
}

export function describeSetupDeviceLabel(deviceId?: string | null): string {
  return describeDeviceLabel(String(deviceId ?? '').trim(), 0, 1);
}

export function describeOwnerConsoleModelStatus(service?: string | null, api?: string | null): string {
  const serviceState = String(service ?? '').trim().toLowerCase();
  const apiState = String(api ?? '').trim().toLowerCase();
  const modelLine = serviceState === 'active' ? 'Ready' : 'Needs attention';
  const apiLine = apiState === 'ok' ? 'Connection OK' : 'Connection needs attention';
  return `On-device AI: ${modelLine} · ${apiLine}`;
}

export function describeOwnerConsoleRuntimeStatus(daemon?: string | null, gateway?: string | null): string {
  const daemonState = String(daemon ?? '').trim().toLowerCase();
  const gatewayState = String(gateway ?? '').trim().toLowerCase();
  const runtimeLine = daemonState === 'ok' ? 'Running' : 'Needs attention';
  const bridgeLine = gatewayState === 'ok' ? 'Home connection ready' : 'Home connection needs attention';
  return `Sparkbox service: ${runtimeLine} · ${bridgeLine}`;
}

export function describeOwnerConsoleInference(
  queuedRequests?: number | null,
  queueLimit?: number | null,
  active?: boolean | null,
): string {
  const queued = Math.max(0, Number(queuedRequests ?? 0) || 0);
  const limit = Math.max(0, Number(queueLimit ?? 0) || 0);
  if (queued === 0) {
    return `Requests right now: None · Queue room: ${limit}`;
  }
  return `Requests right now: ${queued} in line · ${active ? 'Sparkbox is busy' : `Queue room: ${limit}`}`;
}

export function describeOwnerRuntimeQueueSummary(queuedRequests?: number | null, queueLimit?: number | null): string {
  const queued = Math.max(0, Number(queuedRequests ?? 0) || 0);
  const limit = Math.max(0, Number(queueLimit ?? 0) || 0);
  if (queued === 0) {
    return `Nothing is waiting right now. Sparkbox still has room for ${limit} requests.`;
  }
  return `${queued} requests are waiting. Sparkbox can hold up to ${limit} at once.`;
}

export function describeOwnerRuntimeActiveRequest(username?: string | null): string {
  const normalized = String(username ?? '').trim();
  if (!normalized) {
    return 'No one is waiting on Sparkbox right now.';
  }
  return 'Sparkbox is helping someone right now.';
}

export function describeOwnerRuntimeQueueEntry(username?: string | null, position?: number | null): string {
  const slot = Math.max(0, Number(position ?? 0) || 0);
  if (slot <= 1) {
    return 'Another request is next.';
  }
  return 'Another request is later in line.';
}

export function describeOwnerServiceActionLabel(service: string, action: string): string {
  const serviceLabel = service === 'ollama' ? 'on-device AI' : 'Sparkbox service';
  const actionLabel = action === 'restart' ? 'Restart' : action === 'stop' ? 'Stop' : 'Start';
  return `${actionLabel} ${serviceLabel}`;
}

export function describeHouseholdRole(role: string): string {
  const normalized = String(role).trim().toLowerCase();
  if (!normalized) {
    return 'Member';
  }
  if (normalized === 'owner') {
    return 'Owner';
  }
  if (normalized === 'member') {
    return 'Member';
  }
  return normalized.replace(/^./, (value) => value.toUpperCase());
}

const WIFI_INTERFACE_PATTERN = /\bwl[a-z0-9._-]+\b/gi;
const DIAGNOSTICS_PREFLIGHT_REASON_LABELS: Record<string, string> = {
  network_control_requires_auth: 'Sparkbox cannot control its Wi-Fi settings yet.',
  wifi_share_protected_denied: 'Sparkbox cannot share its protected setup hotspot yet.',
  ap_mode_unsupported: 'Sparkbox Wi-Fi hardware cannot host a setup hotspot.',
  configured_interface_missing: 'Sparkbox is configured to use a missing Wi-Fi interface.',
  nmcli_unavailable_or_disabled: 'Sparkbox does not have an active Wi-Fi control service.',
  wifi_radio_disabled: 'Sparkbox Wi-Fi radio is currently disabled.',
  no_wifi_device: 'Sparkbox does not detect a usable Wi-Fi adapter.',
};

const DIAGNOSTICS_ISSUE_LABELS: Record<string, string> = {
  'ollama:service_failed': 'On-device AI needs attention.',
  'ollama:api_unreachable': 'On-device AI is not responding.',
  'zeroclaw:service_inactive': 'Sparkbox service is not running.',
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
    return 'Wi-Fi: Connected';
  }
  return `Wi-Fi: Connected · ${normalizedRadio.replace(WIFI_INTERFACE_PATTERN, 'Wi-Fi')}`;
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
