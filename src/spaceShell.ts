import type {
  HouseholdFileSpace,
  HouseholdSpaceSummary,
  HouseholdTaskScope,
  SpaceKind,
  ChatSessionScope,
} from './householdApi';


export function resolveActiveSpaceId(
  spaces: HouseholdSpaceSummary[],
  currentActiveSpaceId: string,
): string {
  if (currentActiveSpaceId && spaces.some((space) => space.id === currentActiveSpaceId)) {
    return currentActiveSpaceId;
  }
  return spaces.find((space) => space.kind === 'private')?.id ?? spaces[0]?.id ?? '';
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
