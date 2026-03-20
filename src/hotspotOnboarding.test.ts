import { describe, expect, it } from 'vitest';
import {
  buildSetupStepLabels,
  deriveHotspotActiveStep,
  shouldShowClaimStep,
  shouldShowSetupConnectStep,
  shouldAutoStartCloudVerification,
  shouldOpenPortalInBrowser,
} from './hotspotOnboarding';

describe('shouldAutoStartCloudVerification', () => {
  it('starts after the phone leaves the Sparkbox hotspot', () => {
    expect(
      shouldAutoStartCloudVerification({
        hotspotStage: 'returning_home',
        currentSsid: 'HomeWiFi',
        verificationStarted: false,
      }),
    ).toBe(true);
  });

  it('blocks duplicate verification starts and wrong stages', () => {
    expect(
      shouldAutoStartCloudVerification({
        hotspotStage: 'verifying',
        currentSsid: 'HomeWiFi',
        verificationStarted: false,
      }),
    ).toBe(false);

    expect(
      shouldAutoStartCloudVerification({
        hotspotStage: 'returning_home',
        currentSsid: 'Sparkbox-Setup',
        verificationStarted: false,
      }),
    ).toBe(false);

    expect(
      shouldAutoStartCloudVerification({
        hotspotStage: 'returning_home',
        currentSsid: 'HomeWiFi',
        verificationStarted: true,
      }),
    ).toBe(false);
  });
});

describe('shouldOpenPortalInBrowser', () => {
  it('opens the portal only once after the phone leaves the Sparkbox hotspot', () => {
    expect(
      shouldOpenPortalInBrowser({
        currentSsid: 'CampusWiFi',
        portalUrl: 'http://portal.example/login',
        lastOpenedPortalUrl: null,
      }),
    ).toBe(true);

    expect(
      shouldOpenPortalInBrowser({
        currentSsid: 'CampusWiFi',
        portalUrl: 'http://portal.example/login',
        lastOpenedPortalUrl: 'http://portal.example/login',
      }),
    ).toBe(false);

    expect(
      shouldOpenPortalInBrowser({
        currentSsid: 'Sparkbox-Setup',
        portalUrl: 'http://portal.example/login',
        lastOpenedPortalUrl: null,
      }),
    ).toBe(false);
  });
});

describe('deriveHotspotActiveStep', () => {
  it('walks through the happy path steps', () => {
    expect(
      deriveHotspotActiveStep({
        pairingTokenPresent: false,
        hotspotStage: 'idle',
        hasChosenHomeWifi: false,
        completedDeviceIdPresent: false,
      }),
    ).toBe(1);

    expect(
      deriveHotspotActiveStep({
        pairingTokenPresent: true,
        hotspotStage: 'joining_setup',
        hasChosenHomeWifi: false,
        completedDeviceIdPresent: false,
      }),
    ).toBe(2);

    expect(
      deriveHotspotActiveStep({
        pairingTokenPresent: true,
        hotspotStage: 'local_setup',
        hasChosenHomeWifi: false,
        completedDeviceIdPresent: false,
      }),
    ).toBe(3);

    expect(
      deriveHotspotActiveStep({
        pairingTokenPresent: true,
        hotspotStage: 'returning_home',
        hasChosenHomeWifi: true,
        completedDeviceIdPresent: false,
      }),
    ).toBe(4);
  });

  it('returns to the nearest recoverable step after failures', () => {
    expect(
      deriveHotspotActiveStep({
        pairingTokenPresent: true,
        hotspotStage: 'failed',
        hasChosenHomeWifi: true,
        completedDeviceIdPresent: false,
      }),
    ).toBe(3);

    expect(
      deriveHotspotActiveStep({
        pairingTokenPresent: true,
        hotspotStage: 'failed',
        hasChosenHomeWifi: false,
        completedDeviceIdPresent: false,
      }),
    ).toBe(2);
  });
});

describe('reprovisioning flow helpers', () => {
  it('keeps scan-only UI out of reprovisioning', () => {
    expect(buildSetupStepLabels('first_run')).toEqual(['Scan', 'Connect', 'Home Wi-Fi', 'Activation']);
    expect(buildSetupStepLabels('reprovision')).toEqual([
      'Ready',
      'Connect',
      'Home Wi-Fi',
      'Activation',
    ]);
    expect(shouldShowClaimStep('first_run')).toBe(true);
    expect(shouldShowClaimStep('reprovision')).toBe(false);
  });

  it('shows the hotspot connect step for reprovisioning even without a pairing token', () => {
    expect(
      shouldShowSetupConnectStep({
        setupFlowKind: 'first_run',
        pairingTokenPresent: false,
      }),
    ).toBe(false);

    expect(
      shouldShowSetupConnectStep({
        setupFlowKind: 'reprovision',
        pairingTokenPresent: false,
      }),
    ).toBe(true);
  });
});
