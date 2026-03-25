export function shouldLoadInvitePreview(authMode: 'login' | 'register' | 'join', inviteCode: string): boolean {
  return authMode === 'join' && inviteCode.trim().length >= 4;
}

export function buildInvitePreviewSummary(
  householdName: string,
  spaceName?: string | null,
): string {
  return spaceName
    ? `该邀请码将加入 ${householdName}，并把你加入空间「${spaceName}」。`
    : `该邀请码将加入 ${householdName}。`;
}
