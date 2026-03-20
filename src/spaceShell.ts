import type {
  ChatSessionScope,
  HouseholdFileSpace,
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
  return kind === 'private' ? 'Private Box space' : 'Shared Sparkbox space';
}

export function describeChatAccess(scope: ChatSessionScope): string {
  return scope === 'private' ? 'Private space' : 'Shared space';
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
