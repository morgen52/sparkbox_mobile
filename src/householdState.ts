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
