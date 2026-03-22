export type ManagedSpaceMember = {
  id: string;
  displayName: string;
};

export function buildManagedSpaceMemberIds(
  members: ManagedSpaceMember[],
  currentUserId: string | null | undefined,
): string[] {
  return members.filter((member) => member.id !== currentUserId).map((member) => member.id);
}

export function toggleManagedSpaceMember(currentIds: string[], memberId: string): string[] {
  return currentIds.includes(memberId)
    ? currentIds.filter((id) => id !== memberId)
    : [...currentIds, memberId];
}

export function buildManagedSpaceSubmitIds(
  currentUserId: string,
  selectedIds: string[],
): string[] {
  return [currentUserId, ...selectedIds];
}

export function buildSpaceInviteNotice(
  inviteRoleLabel: string,
  inviteCode: string,
  targetSpaceName?: string | null,
): string {
  return targetSpaceName
    ? `${inviteRoleLabel} invite for ${targetSpaceName}: ${inviteCode}`
    : `${inviteRoleLabel} invite ready: ${inviteCode}`;
}

export function buildSpaceInviteAlertMessage(
  inviteCode: string,
  targetSpaceName?: string | null,
): string {
  return targetSpaceName
    ? `${inviteCode}\n\nAsk them to open Sparkbox, choose Join household, and enter this code. They will join this household and be added to ${targetSpaceName}.`
    : `${inviteCode}\n\nAsk them to open Sparkbox, choose Join household, and enter this code.`;
}
