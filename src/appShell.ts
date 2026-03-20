import type { ShellTab } from './householdState';

export const PHASE_ONE_TABS: Array<{ key: ShellTab; label: string }> = [
  { key: 'chats', label: 'Chats' },
  { key: 'library', label: 'Library' },
  { key: 'settings', label: 'Settings' },
];

export type PhaseOneSurface = 'onboarding' | 'shell';

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
    if (householdLoaded && !hasAnyDevice && !activationComplete) {
      return 'onboarding';
    }
    return 'shell';
  }
  return 'onboarding';
}
