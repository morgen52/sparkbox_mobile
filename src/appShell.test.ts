import { describe, expect, it } from 'vitest';

import { PHASE_ONE_TABS, resolvePhaseOneSurface } from './appShell';

describe('resolvePhaseOneSurface', () => {
  it('uses the space-first shell tabs', () => {
    expect(PHASE_ONE_TABS.map((tab) => tab.key)).toEqual(['chats', 'library', 'settings']);
  });

  it('keeps signed-out users in onboarding', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: false,
        setupFlowRequested: false,
        onboardingInProgress: false,
        activationComplete: false,
        householdLoaded: false,
        hasAnyDevice: false,
      }),
    ).toBe('onboarding');
  });

  it('moves into the shell after onboarding completes', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: true,
        setupFlowRequested: false,
        onboardingInProgress: false,
        activationComplete: true,
        householdLoaded: false,
        hasAnyDevice: false,
      }),
    ).toBe('shell');
  });

  it('returns to the shell after reprovisioning activation completes', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: true,
        setupFlowRequested: true,
        onboardingInProgress: false,
        activationComplete: true,
        householdLoaded: true,
        hasAnyDevice: true,
      }),
    ).toBe('shell');
  });

  it('resumes the shell for an existing signed-in household session', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: true,
        setupFlowRequested: false,
        onboardingInProgress: false,
        activationComplete: false,
        householdLoaded: true,
        hasAnyDevice: true,
      }),
    ).toBe('shell');
  });

  it('stays in onboarding while setup is still in progress', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: true,
        setupFlowRequested: false,
        onboardingInProgress: true,
        activationComplete: false,
        householdLoaded: true,
        hasAnyDevice: true,
      }),
    ).toBe('onboarding');
  });

  it('keeps a brand-new empty household in onboarding until a device is claimed', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: true,
        setupFlowRequested: false,
        onboardingInProgress: false,
        activationComplete: false,
        householdLoaded: true,
        hasAnyDevice: false,
      }),
    ).toBe('onboarding');
  });

  it('stays in onboarding when an existing device starts the reprovision flow', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: true,
        setupFlowRequested: true,
        onboardingInProgress: false,
        activationComplete: false,
        householdLoaded: true,
        hasAnyDevice: true,
      }),
    ).toBe('onboarding');
  });
});
