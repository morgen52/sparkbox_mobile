import type {
  ChatSessionScope,
  HouseholdFileSpace,
  HouseholdSpaceDetail,
  HouseholdSpaceMember,
  HouseholdSpaceSummary,
  HouseholdTaskScope,
  SpaceKind,
  SpaceTemplate,
} from './householdApi';

export function resolveActiveSpaceId(
  spaces: HouseholdSpaceSummary[],
  currentActiveSpaceId: string,
): string {
  if (currentActiveSpaceId && spaces.some((space) => space.id === currentActiveSpaceId)) {
    return currentActiveSpaceId;
  }
  return spaces[0]?.id ?? '';
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

export type ChatSendPhase = 'idle' | 'sending' | 'streaming';

export function describeSpaceKind(kind: SpaceKind): string {
  return kind === 'private' ? 'Private Box space' : 'Family space';
}

export function describeChatAccess(scope: ChatSessionScope): string {
  return scope === 'private' ? 'Private space' : 'Family space';
}

export function describeSpaceTemplate(template: SpaceTemplate | string): string {
  switch (template) {
    case 'private':
      return 'Private space';
    case 'household':
      return 'Household space';
    case 'partner':
      return 'Partner';
    case 'parents':
      return 'Parents';
    case 'child':
      return 'Child';
    case 'household_ops':
      return 'Household ops';
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

export function describeChatSendPhase(phase: ChatSendPhase): string {
  switch (phase) {
    case 'sending':
      return 'Sending topic message...';
    case 'streaming':
      return 'Streaming reply...';
    default:
      return '';
  }
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
