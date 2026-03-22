export function shouldLoadInvitePreview(authMode: 'login' | 'register' | 'join', inviteCode: string): boolean {
  return authMode === 'join' && inviteCode.trim().length >= 4;
}

export function buildInvitePreviewSummary(
  householdName: string,
  spaceName?: string | null,
): string {
  return spaceName
    ? `This code joins ${householdName} and adds you to ${spaceName}.`
    : `This code joins ${householdName}.`;
}
