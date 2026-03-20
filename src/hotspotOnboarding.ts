export type HotspotStage =
  | 'idle'
  | 'joining_setup'
  | 'local_setup'
  | 'returning_home'
  | 'verifying'
  | 'completed'
  | 'failed';

export type OnboardingStep = 1 | 2 | 3 | 4;
export type SetupFlowKind = 'first_run' | 'reprovision';

export function buildSetupStepLabels(setupFlowKind: SetupFlowKind): [string, string, string, string] {
  return [
    setupFlowKind === 'reprovision' ? 'Ready' : 'Scan',
    'Connect',
    'Home Wi-Fi',
    'Activation',
  ];
}

export function shouldShowClaimStep(setupFlowKind: SetupFlowKind): boolean {
  return setupFlowKind === 'first_run';
}

export function shouldShowSetupConnectStep({
  setupFlowKind,
  pairingTokenPresent,
}: {
  setupFlowKind: SetupFlowKind;
  pairingTokenPresent: boolean;
}): boolean {
  return setupFlowKind === 'reprovision' || pairingTokenPresent;
}

export function deriveHotspotActiveStep({
  pairingTokenPresent,
  hotspotStage,
  hasChosenHomeWifi,
  completedDeviceIdPresent,
}: {
  pairingTokenPresent: boolean;
  hotspotStage: HotspotStage;
  hasChosenHomeWifi: boolean;
  completedDeviceIdPresent: boolean;
}): OnboardingStep {
  if (completedDeviceIdPresent || hotspotStage === 'returning_home' || hotspotStage === 'verifying') {
    return 4;
  }
  if (hotspotStage === 'failed') {
    if (hasChosenHomeWifi) {
      return 3;
    }
    if (pairingTokenPresent) {
      return 2;
    }
    return 1;
  }
  if (hotspotStage === 'local_setup' || hasChosenHomeWifi) {
    return 3;
  }
  if (pairingTokenPresent) {
    return 2;
  }
  return 1;
}

export function shouldAutoStartCloudVerification({
  hotspotStage,
  currentSsid,
  verificationStarted,
}: {
  hotspotStage: HotspotStage;
  currentSsid: string | null;
  verificationStarted: boolean;
}): boolean {
  if (verificationStarted) {
    return false;
  }
  if (hotspotStage !== 'returning_home') {
    return false;
  }
  if (!currentSsid) {
    return false;
  }
  return currentSsid !== 'Sparkbox-Setup';
}

export function shouldOpenPortalInBrowser({
  currentSsid,
  portalUrl,
  lastOpenedPortalUrl,
}: {
  currentSsid: string | null;
  portalUrl: string | null;
  lastOpenedPortalUrl: string | null;
}): boolean {
  if (!portalUrl || portalUrl === lastOpenedPortalUrl) {
    return false;
  }
  if (!currentSsid) {
    return false;
  }
  return currentSsid !== 'Sparkbox-Setup';
}
