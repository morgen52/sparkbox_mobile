import { useEffect, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import {
  buildSetupStepLabels,
  deriveHotspotActiveStep,
  shouldShowClaimStep,
  shouldShowSetupConnectStep,
  shouldAutoStartCloudVerification,
  shouldOpenPortalInBrowser,
  type HotspotStage,
  type SetupFlowKind,
} from '../hotspotOnboarding';
import { buildSetupFlowResetState } from '../appShell';
import { apiJson } from '../utils/cloudJson';
import { parseClaimPayload, sleep, type ClaimPayload } from '../utils/appRuntime';
import { isDevOnboardingBypassEnabled } from '../devSetupConfig';
import {
  CAMERA_PERMISSION_RECOVERY_MESSAGE,
  HOTSPOT_SSID,
  type HouseholdDevice,
  type ProvisionStatus,
} from '../constants/appRuntimeConstants';
import { isLikelyLocalSetupHandoffError, listLocalSetupNetworks, submitLocalSetupNetwork, type LocalSetupNetwork } from '../localSetupApi';
import {
  clearSessionWifiState,
  connectToHomeWifi,
  connectToSetupHotspot,
  getCurrentSsid,
  openInternetPanel,
} from '../wifiOnboarding';
import { startDeviceReprovision, type DeviceSummary } from '../householdApi';
import type { Session } from '../authFlow';
import type { PhaseOneSurface } from '../appShell';

type CameraPermissionLike = { granted?: boolean } | null;

type SetupControllerOptions = {
  session: Session | null;
  cameraPermission: CameraPermissionLike;
  requestCameraPermission: () => Promise<{ granted: boolean }>;
  onResetInviteCode: () => void;
  setSkipOnboardingWhenNoDevice: (value: boolean) => void;
  setHomeError: (value: string) => void;
  setShellSurface: (value: PhaseOneSurface) => void;
};

export function useSetupController(options: SetupControllerOptions) {
  const {
    session,
    cameraPermission,
    requestCameraPermission,
    onResetInviteCode,
    setSkipOnboardingWhenNoDevice,
    setHomeError,
    setShellSurface,
  } = options;

  const [claimInput, setClaimInput] = useState('');
  const [claimPayload, setClaimPayload] = useState<ClaimPayload | null>(null);
  const [pairingToken, setPairingToken] = useState('');
  const [setupFlowKind, setSetupFlowKind] = useState<SetupFlowKind>('first_run');
  const [reprovisionDeviceId, setReprovisionDeviceId] = useState('');
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimError, setClaimError] = useState('');

  const [scannerOpen, setScannerOpen] = useState(false);
  const [bleError, setBleError] = useState('');

  const [networks, setNetworks] = useState<LocalSetupNetwork[]>([]);
  const [selectedSsid, setSelectedSsid] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<LocalSetupNetwork | null>(null);
  const [wifiPassword, setWifiPassword] = useState('');
  const [manualEntry, setManualEntry] = useState(false);
  const [networksBusy, setNetworksBusy] = useState(false);
  const [networkSheetOpen, setNetworkSheetOpen] = useState(false);

  const [provisionBusy, setProvisionBusy] = useState(false);
  const [provisionMessage, setProvisionMessage] = useState('请先扫描二维码，让设备进入配网准备状态。');
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [completedDeviceId, setCompletedDeviceId] = useState('');
  const [hotspotStage, setHotspotStage] = useState<HotspotStage>('idle');
  const [homeWifiTarget, setHomeWifiTarget] = useState<{ ssid: string; password: string } | null>(null);
  const [previousInternetSsid, setPreviousInternetSsid] = useState<string | null>(null);
  const [setupPageState, setSetupPageState] = useState<ProvisionStatus | null>(null);
  const [setupNetworksLoaded, setSetupNetworksLoaded] = useState(false);

  const verificationStartedRef = useRef(false);
  const lastOpenedPortalUrlRef = useRef<string | null>(null);

  const setupDeviceId = claimPayload?.deviceId || reprovisionDeviceId;
  const setupStepLabels = buildSetupStepLabels(setupFlowKind);
  const claimStepVisible = shouldShowClaimStep(setupFlowKind);
  const hasChosenHomeWifi = Boolean(selectedSsid.trim() || homeWifiTarget?.ssid);
  const activeStep = deriveHotspotActiveStep({
    pairingTokenPresent: Boolean(pairingToken),
    hotspotStage,
    hasChosenHomeWifi,
    completedDeviceIdPresent: Boolean(completedDeviceId),
  });
  const step2Visible = shouldShowSetupConnectStep({
    setupFlowKind,
    pairingTokenPresent: Boolean(pairingToken),
  });
  const step3Visible =
    hotspotStage === 'local_setup' ||
    hotspotStage === 'returning_home' ||
    hotspotStage === 'verifying' ||
    hotspotStage === 'completed' ||
    hotspotStage === 'failed' ||
    hasChosenHomeWifi;
  const step4Visible = activeStep === 4 || Boolean(portalUrl) || Boolean(completedDeviceId);
  const onboardingInProgress = Boolean(claimPayload) || Boolean(pairingToken) || hotspotStage !== 'idle' || Boolean(completedDeviceId);
  const setupFlowRequested = Boolean(reprovisionDeviceId);
  const devOnboardingBypassEnabled = isDevOnboardingBypassEnabled();

  async function beginHotspotOnboarding(deviceId: string): Promise<void> {
    if (!deviceId) {
      setBleError('Pick a Sparkbox before starting Wi-Fi setup.');
      return;
    }
    setBleError('');
    setProvisionBusy(true);
    setHotspotStage('joining_setup');
    setPortalUrl(null);
    setSetupNetworksLoaded(false);
    verificationStartedRef.current = false;
    lastOpenedPortalUrlRef.current = null;
    try {
      await connectToSetupHotspot(HOTSPOT_SSID);
      setHotspotStage('local_setup');
      setProvisionMessage('Choose the home Wi-Fi that Sparkbox should join.');
    } catch (error) {
      if (devOnboardingBypassEnabled) {
        setBleError('');
        setHotspotStage('local_setup');
        setProvisionMessage('Development bypass enabled. Continue setup without switching phone Wi-Fi.');
        return;
      }
      setBleError(error instanceof Error ? error.message : 'Could not switch to Sparkbox-Setup automatically.');
      setProvisionMessage('Open Wi-Fi settings, join Sparkbox-Setup, and the app will continue automatically.');
      await openInternetPanel().catch(() => undefined);
    } finally {
      setProvisionBusy(false);
    }
  }

  async function returnPhoneToHomeWifi(): Promise<void> {
    if (devOnboardingBypassEnabled) {
      await startCloudVerification();
      return;
    }
    const targetSsid = homeWifiTarget?.ssid || previousInternetSsid;
    const targetPassword = homeWifiTarget?.password || '';
    verificationStartedRef.current = false;
    setHotspotStage('returning_home');
    setProvisionBusy(true);
    setProvisionMessage('Returning your phone to a Wi-Fi network with internet so Sparkbox can finish setup...');
    try {
      await clearSessionWifiState().catch(() => undefined);
      if (!targetSsid || !targetPassword) {
        throw new Error('Need system help to reconnect this phone to Wi-Fi.');
      }
      await connectToHomeWifi(targetSsid, targetPassword);
    } catch {
      await openInternetPanel().catch(() => undefined);
    } finally {
      setProvisionBusy(false);
    }
  }

  async function waitForCloudActivation(deviceId: string): Promise<boolean> {
    if (!session?.token) {
      return false;
    }
    const deadline = Date.now() + 300000;
    while (Date.now() < deadline) {
      try {
        const devices = await apiJson<HouseholdDevice[]>('/api/devices', { token: session.token });
        const matched = devices.find((item) => item.device_id === deviceId);
        if (matched?.online) {
          return true;
        }
      } catch {
        // The phone may still be switching networks. Keep waiting.
      }
      await sleep(2500);
    }
    return false;
  }

  async function startCloudVerification(): Promise<void> {
    if (!setupDeviceId) {
      return;
    }
    setHotspotStage('verifying');
    setProvisionBusy(true);
    setProvisionMessage(
      portalUrl
        ? 'Finish the network sign-in in your browser. Sparkbox will complete setup automatically after internet access is restored.'
        : 'Waiting for Sparkbox to come online in your household...',
    );
    try {
      const success = await waitForCloudActivation(setupDeviceId);
      if (!success) {
        throw new Error('Sparkbox did not come online in time.');
      }
      setCompletedDeviceId(setupDeviceId);
      setHotspotStage('completed');
      setPortalUrl(null);
      setProvisionMessage('Sparkbox is online and ready inside your household.');
    } catch (error) {
      setHotspotStage('failed');
      verificationStartedRef.current = false;
      setBleError(error instanceof Error ? error.message : 'Sparkbox could not finish setup.');
    } finally {
      setProvisionBusy(false);
    }
  }

  async function refreshNetworks(): Promise<void> {
    setNetworksBusy(true);
    setBleError('');
    try {
      const response = await listLocalSetupNetworks();
      const nextNetworks = response.networks ?? [];
      setNetworks(nextNetworks);
      setSetupNetworksLoaded(true);
      if (response.scan_error) {
        setBleError(response.scan_error);
      }
      if (nextNetworks.length === 0) {
        setManualEntry(true);
        setNetworkSheetOpen(true);
        if (!selectedSsid.trim() && previousInternetSsid) {
          setSelectedSsid(previousInternetSsid);
        }
        setProvisionMessage(
          response.scan_mode === 'manual_only'
            ? 'Sparkbox is keeping its hotspot online, so type your home Wi-Fi manually.'
            : 'Nearby Wi-Fi did not come through. Type your home Wi-Fi manually.',
        );
      } else {
        setProvisionMessage('Choose the home Wi-Fi that Sparkbox should join.');
      }
    } catch (error) {
      setBleError(error instanceof Error ? error.message : 'Could not refresh nearby Wi-Fi.');
    } finally {
      setNetworksBusy(false);
    }
  }

  async function submitWifi(): Promise<void> {
    if (!setupDeviceId) {
      return;
    }
    if (!selectedSsid.trim()) {
      Alert.alert('Choose Wi-Fi', 'Select a Wi-Fi network or enter one manually.');
      return;
    }
    setProvisionBusy(true);
    setBleError('');
    setProvisionMessage(`Connecting Sparkbox to ${selectedSsid.trim()}...`);
    try {
      const result = await submitLocalSetupNetwork({
        ssid: selectedSsid.trim(),
        password: wifiPassword,
        pairingToken: pairingToken || undefined,
      });
      setSetupPageState(result);
      setHomeWifiTarget({
        ssid: selectedSsid.trim(),
        password: wifiPassword,
      });
      if (result.status === 'wifi_failed_retryable' || result.status === 'binding_failed_retryable') {
        throw new Error(
          result.pairing?.last_error ||
            result.last_command?.message ||
            result.wifi?.network_apply_mode ||
            'Sparkbox could not finish setup.',
        );
      }
      if (result.status === 'wifi_portal_required') {
        setPortalUrl(result.wifi?.portal_url ?? null);
      }
      setProvisionBusy(false);
      void returnPhoneToHomeWifi();
      return;
    } catch (error) {
      if (isLikelyLocalSetupHandoffError(error)) {
        setSetupPageState({
          status: pairingToken ? 'pairing_pending' : 'wifi_connecting',
          wifi: { ssid: selectedSsid.trim() },
        });
        setHomeWifiTarget({
          ssid: selectedSsid.trim(),
          password: wifiPassword,
        });
        setProvisionBusy(false);
        void returnPhoneToHomeWifi();
        return;
      }
      setBleError(error instanceof Error ? error.message : 'Sparkbox could not finish setup.');
    } finally {
      setProvisionBusy(false);
    }
  }

  function chooseNetwork(network: LocalSetupNetwork): void {
    setSelectedNetwork(network);
    setSelectedSsid(network.ssid);
    setManualEntry(false);
    setNetworkSheetOpen(true);
    if (!network.known) {
      setWifiPassword('');
    }
  }

  function openManualEntry(): void {
    setManualEntry(true);
    setSelectedNetwork(null);
    setSelectedSsid(previousInternetSsid ?? '');
    setWifiPassword('');
    setNetworkSheetOpen(true);
  }

  async function openScanner(): Promise<void> {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        setClaimError(CAMERA_PERMISSION_RECOVERY_MESSAGE);
        return;
      }
    }
    setScannerOpen(true);
  }

  function applyClaimInput(rawValue: string): void {
    setClaimInput(rawValue);
    const parsed = parseClaimPayload(rawValue);
    setClaimPayload(parsed);
    if (parsed) {
      setClaimError('');
    }
  }

  async function startClaim(): Promise<void> {
    if (!session) {
      return;
    }
    if (!claimPayload) {
      setClaimError('Scan the Sparkbox label or paste the setup code first.');
      return;
    }
    setClaimBusy(true);
    setClaimError('');
    setProvisionMessage('Sparkbox is now reserved for your household. Connecting your phone to Sparkbox-Setup...');
    try {
      const response = await apiJson<{ pairing_token: string }>('/api/pairing/start', {
        method: 'POST',
        token: session.token,
        body: {
          device_id: claimPayload.deviceId,
          short_claim_code: claimPayload.claimCode,
        },
      });
      setPairingToken(response.pairing_token);
      setPreviousInternetSsid(await getCurrentSsid().catch(() => null));
      await beginHotspotOnboarding(claimPayload.deviceId);
    } catch (error) {
      setClaimError(error instanceof Error ? error.message : 'Could not attach this Sparkbox.');
      setHotspotStage('failed');
    } finally {
      setClaimBusy(false);
    }
  }

  function resetSetupFlowState(): void {
    const resetState = buildSetupFlowResetState();
    setSetupFlowKind(resetState.setupFlowKind);
    setReprovisionDeviceId(resetState.reprovisionDeviceId);
    setClaimInput('');
    setClaimPayload(null);
    setPairingToken(resetState.pairingToken);
    setClaimError(resetState.claimError);
    setBleError(resetState.bleError);
    setScannerOpen(false);
    setNetworks([]);
    setSelectedSsid(resetState.selectedSsid);
    setSelectedNetwork(null);
    setWifiPassword(resetState.wifiPassword);
    setManualEntry(resetState.manualEntry);
    setNetworkSheetOpen(resetState.networkSheetOpen);
    setProvisionBusy(resetState.provisionBusy);
    setProvisionMessage(resetState.provisionMessage);
    setPortalUrl(resetState.portalUrl);
    setCompletedDeviceId(resetState.completedDeviceId);
    setHotspotStage(resetState.hotspotStage);
    onResetInviteCode();
    setHomeWifiTarget(null);
    setPreviousInternetSsid(resetState.previousInternetSsid);
    setSetupPageState(resetState.setupPageState);
    setSetupNetworksLoaded(resetState.setupNetworksLoaded);
  }

  function beginNewDeviceOnboarding(): void {
    setSkipOnboardingWhenNoDevice(false);
    resetSetupFlowState();
    setSetupFlowKind('first_run');
    setHomeError('');
    setShellSurface('onboarding');
  }

  async function beginDeviceReprovision(device: DeviceSummary): Promise<void> {
    setSkipOnboardingWhenNoDevice(false);
    resetSetupFlowState();
    setSetupFlowKind('reprovision');
    setReprovisionDeviceId(device.device_id);
    setHomeError('');
    setBleError('');
    if (session?.token && device.online) {
      setProvisionBusy(true);
      setProvisionMessage('Asking Sparkbox to get ready again for Wi-Fi changes...');
      try {
        await startDeviceReprovision(session.token, device.device_id);
        setProvisionMessage('Sparkbox is getting ready again. Wait for Sparkbox-Setup, then continue.');
      } catch (error) {
        setBleError(error instanceof Error ? error.message : 'Could not get Sparkbox ready again.');
        setProvisionMessage(
          'If Sparkbox is already in a new place, power it on and wait for Sparkbox-Setup to appear.',
        );
      } finally {
        setProvisionBusy(false);
      }
    } else {
      setProvisionMessage(
        'Get Sparkbox ready again. If it is in a new place, power it on and wait for Sparkbox-Setup to appear.',
      );
    }
    setPreviousInternetSsid(await getCurrentSsid().catch(() => null));
    setShellSurface('onboarding');
  }

  useEffect(() => {
    if (!setupDeviceId || hotspotStage !== 'joining_setup') {
      return;
    }
    const interval = setInterval(() => {
      void (async () => {
        const ssid = await getCurrentSsid().catch(() => null);
        if (ssid !== HOTSPOT_SSID) {
          return;
        }
        setNetworks([]);
        setSelectedNetwork(null);
        setSelectedSsid(previousInternetSsid ?? '');
        setWifiPassword('');
        setManualEntry(false);
        setSetupNetworksLoaded(false);
        setHotspotStage('local_setup');
        setBleError('');
        setProvisionMessage('Choose the home Wi-Fi that Sparkbox should join.');
      })();
    }, 1500);
    return () => clearInterval(interval);
  }, [hotspotStage, previousInternetSsid, setupDeviceId]);

  useEffect(() => {
    if (hotspotStage !== 'local_setup' || setupNetworksLoaded) {
      return;
    }
    void refreshNetworks();
  }, [hotspotStage, setupNetworksLoaded]);

  useEffect(() => {
    if (hotspotStage !== 'returning_home' && hotspotStage !== 'verifying') {
      return;
    }
    const interval = setInterval(() => {
      void (async () => {
        const ssid = await getCurrentSsid().catch(() => null);
        if (!ssid || ssid === HOTSPOT_SSID) {
          return;
        }
        if (
          shouldOpenPortalInBrowser({
            currentSsid: ssid,
            portalUrl,
            lastOpenedPortalUrl: lastOpenedPortalUrlRef.current,
          })
        ) {
          const nextPortalUrl = portalUrl;
          if (!nextPortalUrl) {
            return;
          }
          lastOpenedPortalUrlRef.current = nextPortalUrl;
          await Linking.openURL(nextPortalUrl).catch(() => undefined);
        }
        if (
          shouldAutoStartCloudVerification({
            hotspotStage,
            currentSsid: ssid,
            verificationStarted: verificationStartedRef.current,
          })
        ) {
          verificationStartedRef.current = true;
          await startCloudVerification();
        }
      })();
    }, 1500);
    return () => clearInterval(interval);
  }, [hotspotStage, portalUrl]);

  return {
    claimInput,
    claimPayload,
    pairingToken,
    setupFlowKind,
    reprovisionDeviceId,
    claimBusy,
    claimError,
    scannerOpen,
    bleError,
    networks,
    selectedSsid,
    selectedNetwork,
    wifiPassword,
    manualEntry,
    networksBusy,
    networkSheetOpen,
    provisionBusy,
    provisionMessage,
    portalUrl,
    completedDeviceId,
    hotspotStage,
    homeWifiTarget,
    previousInternetSsid,
    setupPageState,
    setupDeviceId,
    setupStepLabels,
    claimStepVisible,
    activeStep,
    step2Visible,
    step3Visible,
    step4Visible,
    onboardingInProgress,
    setupFlowRequested,
    setSetupFlowKind,
    setScannerOpen,
    setNetworkSheetOpen,
    setSelectedSsid,
    setWifiPassword,
    setClaimError,
    applyClaimInput,
    startClaim,
    beginHotspotOnboarding,
    refreshNetworks,
    openManualEntry,
    chooseNetwork,
    startCloudVerification,
    submitWifi,
    openScanner,
    beginNewDeviceOnboarding,
    beginDeviceReprovision,
    resetSetupFlowState,
  };
}
