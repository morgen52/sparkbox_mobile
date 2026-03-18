import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { Buffer } from 'buffer';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { authenticateWithCloud, type AuthMode, type Session } from './src/authFlow';
import { buildScanCandidate, matchesSparkboxAdvertisement, type ScanCandidate } from './src/bleDiscovery';


const globalWithBuffer = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
if (!globalWithBuffer.Buffer) {
  globalWithBuffer.Buffer = Buffer;
}

const CLOUD_API_BASE =
  (Constants.expoConfig?.extra?.cloudApiBase as string | undefined)?.replace(/\/$/, '') ??
  'https://morgen52.site/familyserver';

const STORAGE_KEY = 'sparkbox.mobile.session';
const SERVICE_UUID = '7f92f5d8-5d55-4f0d-93fa-1ac4b7811c10';
const INFO_CHAR_UUID = '7f92f5d8-5d55-4f0d-93fa-1ac4b7811c11';
const STATUS_CHAR_UUID = '7f92f5d8-5d55-4f0d-93fa-1ac4b7811c12';
const NETWORKS_CHAR_UUID = '7f92f5d8-5d55-4f0d-93fa-1ac4b7811c13';
const COMMAND_CHAR_UUID = '7f92f5d8-5d55-4f0d-93fa-1ac4b7811c14';

type ClaimPayload = {
  deviceId: string;
  claimCode: string;
  raw: string;
};

type BleNetwork = {
  ssid: string;
  signal_percent?: number;
  requires_password?: boolean;
  known?: boolean;
  security?: string;
  support_level?: string;
  support_reason?: string;
};

type ProvisionStatus = {
  device_id?: string;
  status?: string;
  wifi?: {
    ssid?: string;
    connection_name?: string;
    network_apply_mode?: string;
  };
  pairing?: {
    device_id?: string;
    pending_pairing_token?: boolean;
    device_proof_status?: string;
    last_error?: string;
  };
  last_command?: {
    ok?: boolean;
    type?: string;
    message?: string;
  };
};

type HouseholdDevice = {
  device_id: string;
  status: string;
  online: boolean;
  claimed: boolean;
};

type NearbyDevice = {
  id: string;
  name: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function encodeBase64Json(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function decodeBase64Json<T>(value?: string | null): T | null {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(value, 'base64').toString('utf-8')) as T;
  } catch {
    return null;
  }
}

function parseClaimPayload(rawValue: string): ClaimPayload | null {
  const raw = rawValue.trim();
  if (!raw) {
    return null;
  }

  const tryPairs = (pairs: Array<[string, string]>): ClaimPayload | null => {
    const table = new Map<string, string>();
    for (const [key, value] of pairs) {
      table.set(key.trim().toLowerCase(), value.trim());
    }
    const deviceId =
      table.get('device_id') ??
      table.get('deviceid') ??
      table.get('sparkbox_device_id') ??
      table.get('id');
    const claimCode =
      table.get('claim_code') ??
      table.get('short_claim_code') ??
      table.get('claimcode') ??
      table.get('code');
    if (!deviceId || !claimCode) {
      return null;
    }
    return {
      deviceId,
      claimCode,
      raw,
    };
  };

  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      return tryPairs(Object.entries(parsed));
    } catch {
      return null;
    }
  }

  const queryIndex = raw.indexOf('?');
  if (queryIndex >= 0) {
    const query = raw.slice(queryIndex + 1);
    const pairs = query
      .split(/[&#]/)
      .filter(Boolean)
      .map((part) => {
        const [key, value = ''] = part.split('=');
        return [decodeURIComponent(key), decodeURIComponent(value)] as [string, string];
      });
    const parsed = tryPairs(pairs);
    if (parsed) {
      return parsed;
    }
  }

  if (raw.includes('device_id=') || raw.includes('claim_code=')) {
    const pairs = raw
      .split(/[;,]/)
      .filter(Boolean)
      .map((part) => {
        const [key, value = ''] = part.split('=');
        return [key, value] as [string, string];
      });
    const parsed = tryPairs(pairs);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

async function apiJson<T>(
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  const response = await fetch(`${CLOUD_API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    let message = text || response.statusText;
    try {
      const parsed = JSON.parse(text) as { detail?: string };
      if (parsed.detail) {
        message = parsed.detail;
      }
    } catch {
      // ignore plain text payloads
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const permissions =
    Platform.Version >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  const statuses = await PermissionsAndroid.requestMultiple(permissions);
  return permissions.every((permission) => statuses[permission] === PermissionsAndroid.RESULTS.GRANTED);
}

async function waitForBluetoothReady(manager: BleManager): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      subscription.remove();
      reject(new Error('Bluetooth did not become ready in time.'));
    }, 10000);
    const subscription = manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        clearTimeout(timeout);
        subscription.remove();
        resolve();
      }
      if (state === 'Unauthorized' || state === 'Unsupported') {
        clearTimeout(timeout);
        subscription.remove();
        reject(new Error(`Bluetooth state: ${state}`));
      }
    }, true);
  });
}

async function readJsonCharacteristic<T>(
  device: Device,
  characteristicUuid: string,
): Promise<T | null> {
  const characteristic = await device.readCharacteristicForService(SERVICE_UUID, characteristicUuid);
  return decodeBase64Json<T>(characteristic.value);
}

async function writeJsonCharacteristic(device: Device, payload: unknown): Promise<void> {
  await device.writeCharacteristicWithResponseForService(
    SERVICE_UUID,
    COMMAND_CHAR_UUID,
    encodeBase64Json(payload),
  );
}

function App() {
  const bleManager = useMemo(() => new BleManager(), []);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  const [claimInput, setClaimInput] = useState('');
  const [claimPayload, setClaimPayload] = useState<ClaimPayload | null>(null);
  const [pairingToken, setPairingToken] = useState('');
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimError, setClaimError] = useState('');

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [nearbyDevices, setNearbyDevices] = useState<NearbyDevice[]>([]);
  const [scanCandidates, setScanCandidates] = useState<ScanCandidate[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [bleStatus, setBleStatus] = useState<ProvisionStatus | null>(null);
  const [bleError, setBleError] = useState('');

  const [networks, setNetworks] = useState<BleNetwork[]>([]);
  const [selectedSsid, setSelectedSsid] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<BleNetwork | null>(null);
  const [wifiPassword, setWifiPassword] = useState('');
  const [manualEntry, setManualEntry] = useState(false);
  const [networksBusy, setNetworksBusy] = useState(false);

  const [provisionBusy, setProvisionBusy] = useState(false);
  const [provisionMessage, setProvisionMessage] = useState('Scan the QR code to attach Sparkbox, then bring your phone nearby.');
  const [completedDeviceId, setCompletedDeviceId] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSession(JSON.parse(stored) as Session);
        }
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      bleManager.destroy();
    };
  }, [bleManager]);

  const householdName = session?.household.name ?? 'your household';

  async function persistSession(nextSession: Session | null): Promise<void> {
    if (nextSession) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }

  async function submitAuth(): Promise<void> {
    setAuthBusy(true);
    setAuthError('');
    try {
      const nextSession = await authenticateWithCloud(
        {
          login: (payload) =>
            apiJson<Session>('/api/auth/login', {
              method: 'POST',
              body: payload,
            }),
          register: (payload) =>
            apiJson('/api/auth/register', {
              method: 'POST',
              body: payload,
            }),
        },
        authMode,
        { email, password, displayName },
      );
      setSession(nextSession);
      await persistSession(nextSession);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not sign in.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function logout(): Promise<void> {
    if (session?.token) {
      try {
        await apiJson('/api/auth/session', {
          method: 'DELETE',
          token: session.token,
        });
      } catch {
        // ignore logout failures
      }
    }
    setSession(null);
    await persistSession(null);
    resetFlow();
  }

  function resetFlow(): void {
    setClaimInput('');
    setClaimPayload(null);
    setPairingToken('');
    setClaimError('');
    setNearbyDevices([]);
    setScanCandidates([]);
    setConnectedDevice(null);
    setBleStatus(null);
    setBleError('');
    setNetworks([]);
    setSelectedSsid('');
    setSelectedNetwork(null);
    setWifiPassword('');
    setManualEntry(false);
    setProvisionBusy(false);
    setProvisionMessage('Scan the QR code to attach Sparkbox, then bring your phone nearby.');
    setCompletedDeviceId('');
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
      setClaimError('Scan the Sparkbox label or paste a claim link first.');
      return;
    }
    setClaimBusy(true);
    setClaimError('');
    setProvisionMessage('Sparkbox is now reserved for your household. Looking for the nearby device...');
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
      await scanNearbySparkboxes();
    } catch (error) {
      setClaimError(error instanceof Error ? error.message : 'Could not attach this Sparkbox.');
    } finally {
      setClaimBusy(false);
    }
  }

  async function scanNearbySparkboxes(): Promise<void> {
    setScanBusy(true);
    setBleError('');
    setNearbyDevices([]);
    setScanCandidates([]);
    setConnectedDevice(null);
    const allowed = await requestBlePermissions();
    if (!allowed) {
      setBleError('Bluetooth permission is required to find Sparkbox nearby.');
      setScanBusy(false);
      return;
    }

    try {
      await waitForBluetoothReady(bleManager);
      const found = new Map<string, NearbyDevice>();
      const seenCandidates = new Map<string, ScanCandidate>();
      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          setBleError(error.message);
          bleManager.stopDeviceScan();
          setScanBusy(false);
          return;
        }
        if (!device) {
          return;
        }
        const candidate = buildScanCandidate(device);
        seenCandidates.set(candidate.id, candidate);
        setScanCandidates(Array.from(seenCandidates.values()).slice(0, 12));
        if (!matchesSparkboxAdvertisement(device)) {
          return;
        }
        const name = device.localName || device.name || '';
        found.set(device.id, {
          id: device.id,
          name: name || 'Nearby Sparkbox',
        });
        setNearbyDevices(Array.from(found.values()));
      });
      await sleep(8000);
      if (found.size === 0) {
        setBleError('No nearby Sparkbox was found. Keep your phone close, turn on location services, and check the scan details below before trying again.');
      }
    } catch (error) {
      setBleError(error instanceof Error ? error.message : 'Bluetooth is unavailable.');
    } finally {
      bleManager.stopDeviceScan();
      setScanBusy(false);
    }
  }

  async function connectToSparkbox(deviceId: string): Promise<void> {
    setBleError('');
    setNetworksBusy(true);
    try {
      const nextDevice = await bleManager.connectToDevice(deviceId, { timeout: 15000 });
      await nextDevice.discoverAllServicesAndCharacteristics();
      setConnectedDevice(nextDevice);
      const info = await readJsonCharacteristic<{ device_id?: string }>(nextDevice, INFO_CHAR_UUID);
      const status = await readJsonCharacteristic<ProvisionStatus>(nextDevice, STATUS_CHAR_UUID);
      const networkPayload = await readJsonCharacteristic<{ networks?: BleNetwork[] }>(nextDevice, NETWORKS_CHAR_UUID);
      if (info?.device_id && claimPayload && info.device_id !== claimPayload.deviceId) {
        throw new Error('This Sparkbox does not match the QR code you scanned.');
      }
      setBleStatus(status);
      setNetworks(networkPayload?.networks ?? []);
      setProvisionMessage('Choose the home Wi-Fi that Sparkbox should join.');
    } catch (error) {
      setBleError(error instanceof Error ? error.message : 'Could not connect to Sparkbox over Bluetooth.');
    } finally {
      setNetworksBusy(false);
    }
  }

  async function refreshNetworks(): Promise<void> {
    if (!connectedDevice) {
      return;
    }
    setNetworksBusy(true);
    setBleError('');
    try {
      await writeJsonCharacteristic(connectedDevice, { type: 'scan_networks' });
      const networkPayload = await readJsonCharacteristic<{ networks?: BleNetwork[] }>(connectedDevice, NETWORKS_CHAR_UUID);
      const status = await readJsonCharacteristic<ProvisionStatus>(connectedDevice, STATUS_CHAR_UUID);
      setNetworks(networkPayload?.networks ?? []);
      setBleStatus(status);
    } catch (error) {
      setBleError(error instanceof Error ? error.message : 'Could not refresh nearby Wi-Fi.');
    } finally {
      setNetworksBusy(false);
    }
  }

  async function submitWifi(): Promise<void> {
    if (!connectedDevice || !claimPayload || !pairingToken) {
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
      await writeJsonCharacteristic(connectedDevice, {
        type: 'connect_wifi',
        ssid: selectedSsid.trim(),
        password: wifiPassword,
        pairing_token: pairingToken,
      });
      const success = await waitForActivation(claimPayload.deviceId, connectedDevice);
      if (!success) {
        throw new Error('Sparkbox did not come online in time.');
      }
      setCompletedDeviceId(claimPayload.deviceId);
      setProvisionMessage('Sparkbox is online and ready inside your household.');
    } catch (error) {
      setBleError(error instanceof Error ? error.message : 'Sparkbox could not finish setup.');
    } finally {
      setProvisionBusy(false);
    }
  }

  async function waitForActivation(deviceId: string, device: Device): Promise<boolean> {
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline) {
      try {
        const status = await readJsonCharacteristic<ProvisionStatus>(device, STATUS_CHAR_UUID);
        if (status) {
          setBleStatus(status);
          if (status.status === 'bound_online') {
            return true;
          }
          if (status.status === 'wifi_failed_retryable' || status.status === 'binding_failed_retryable') {
            throw new Error(
              status.pairing?.last_error ||
                status.last_command?.message ||
                'Sparkbox could not finish setup.',
            );
          }
        }
      } catch {
        // Sparkbox may briefly drop BLE while switching Wi-Fi. Fall through to cloud verification.
      }

      if (session?.token) {
        const devices = await apiJson<HouseholdDevice[]>('/api/devices', { token: session.token });
        const matched = devices.find((item) => item.device_id === deviceId);
        if (matched?.online) {
          return true;
        }
      }
      await sleep(2500);
    }
    return false;
  }

  function chooseNetwork(network: BleNetwork): void {
    setSelectedNetwork(network);
    setSelectedSsid(network.ssid);
    setManualEntry(false);
    if (!network.known) {
      setWifiPassword('');
    }
  }

  function openManualEntry(): void {
    setManualEntry(true);
    setSelectedNetwork(null);
    setSelectedSsid('');
    setWifiPassword('');
  }

  async function openScanner(): Promise<void> {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        setClaimError('Camera permission is required to scan the Sparkbox QR code.');
        return;
      }
    }
    setScannerOpen(true);
  }

  const canSubmitWifi = Boolean(selectedSsid.trim()) && !provisionBusy;

  if (booting) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.centered}>
          <ActivityIndicator color="#0b6e4f" />
          <Text style={styles.loadingText}>Preparing Sparkbox setup…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Sparkbox setup</Text>
          <Text style={styles.title}>Attach first. Bring it online second.</Text>
          <Text style={styles.subtitle}>
            Scan the device label, reserve Sparkbox for {householdName}, then send home Wi-Fi over Bluetooth.
          </Text>
        </View>

        {!session ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{authMode === 'login' ? 'Sign in' : 'Create your household'}</Text>
            <Text style={styles.cardCopy}>
              Use the same cloud account that will own Sparkbox after it comes online.
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor="#7e8a83"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
            {authMode === 'register' ? (
              <TextInput
                placeholder="Display name"
                placeholderTextColor="#7e8a83"
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
              />
            ) : null}
            <TextInput
              secureTextEntry
              placeholder="Password"
              placeholderTextColor="#7e8a83"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
            <Pressable style={styles.primaryButton} onPress={() => void submitAuth()} disabled={authBusy}>
              {authBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{authMode === 'login' ? 'Sign in' : 'Create account'}</Text>}
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              <Text style={styles.secondaryButtonText}>
                {authMode === 'login' ? 'Need a new household?' : 'Already have an account?'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Signed in as {session.user.display_name}</Text>
            <Text style={styles.cardCopy}>
              Household: {session.household.name}
            </Text>
            <View style={styles.inlineActions}>
              <Pressable style={styles.primaryButtonSmall} onPress={() => void logout()}>
                <Text style={styles.primaryButtonText}>Log out</Text>
              </Pressable>
              <Pressable style={styles.secondaryButtonSmall} onPress={resetFlow}>
                <Text style={styles.secondaryButtonText}>Start over</Text>
              </Pressable>
            </View>
          </View>
        )}

        {session ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1. Scan the Sparkbox label</Text>
            <Text style={styles.cardCopy}>
              This reserves the device for your household immediately. Wi-Fi comes next.
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              numberOfLines={4}
              placeholder="Paste a claim link or a QR payload that includes device_id and claim_code."
              placeholderTextColor="#7e8a83"
              style={[styles.input, styles.textArea]}
              value={claimInput}
              onChangeText={applyClaimInput}
            />
            {claimPayload ? (
              <View style={styles.claimPreview}>
                <Text style={styles.claimPreviewLabel}>Device</Text>
                <Text style={styles.claimPreviewValue}>{claimPayload.deviceId}</Text>
                <Text style={styles.claimPreviewLabel}>Claim code</Text>
                <Text style={styles.claimPreviewValue}>{claimPayload.claimCode}</Text>
              </View>
            ) : null}
            {claimError ? <Text style={styles.errorText}>{claimError}</Text> : null}
            <View style={styles.inlineActions}>
              <Pressable style={styles.primaryButtonSmall} onPress={() => void openScanner()}>
                <Text style={styles.primaryButtonText}>Scan QR</Text>
              </Pressable>
              <Pressable style={styles.secondaryButtonSmall} onPress={() => void startClaim()} disabled={claimBusy}>
                {claimBusy ? <ActivityIndicator color="#0f5132" /> : <Text style={styles.secondaryButtonText}>Attach Sparkbox</Text>}
              </Pressable>
            </View>
          </View>
        ) : null}

        {pairingToken ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>2. Find nearby Sparkbox</Text>
            <Text style={styles.cardCopy}>
              Sparkbox advertises over Bluetooth, so your phone does not need to switch Wi-Fi during setup.
            </Text>
            {scanBusy ? (
              <View style={styles.row}>
                <ActivityIndicator color="#0b6e4f" />
                <Text style={styles.loadingInline}>Scanning nearby Sparkbox devices…</Text>
              </View>
            ) : null}
            {bleError ? <Text style={styles.errorText}>{bleError}</Text> : null}
            {nearbyDevices.map((device) => (
              <Pressable
                key={device.id}
                style={styles.networkRow}
                onPress={() => void connectToSparkbox(device.id)}
              >
                <View>
                  <Text style={styles.networkName}>{device.name}</Text>
                  <Text style={styles.networkMeta}>{device.id}</Text>
                </View>
                <Text style={styles.linkText}>Connect</Text>
              </Pressable>
            ))}
            {scanCandidates.length ? (
              <View style={styles.debugCard}>
                <Text style={styles.debugTitle}>Bluetooth scan details</Text>
                <Text style={styles.debugCopy}>
                  This shows what your phone actually sees nearby. If Sparkbox does not appear here, the issue is below the app layer.
                </Text>
                {scanCandidates.map((candidate) => (
                  <View key={candidate.id} style={styles.debugRow}>
                    <View style={styles.networkLeft}>
                      <Text style={styles.networkName}>{candidate.label}</Text>
                      <Text style={styles.networkMeta}>{candidate.id}</Text>
                    </View>
                    <Text style={candidate.matched ? styles.tag : styles.tagMuted}>
                      {candidate.matched ? 'Sparkbox match' : 'Other device'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            <Pressable style={styles.secondaryButton} onPress={() => void scanNearbySparkboxes()} disabled={scanBusy}>
              <Text style={styles.secondaryButtonText}>Scan again</Text>
            </Pressable>
          </View>
        ) : null}

        {connectedDevice ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. Choose home Wi-Fi</Text>
            <Text style={styles.cardCopy}>
              Sparkbox will use this network to reach the cloud. Saved networks can reuse the existing password.
            </Text>
            {bleStatus?.last_command?.message ? <Text style={styles.statusText}>{bleStatus.last_command.message}</Text> : null}
            <View style={styles.inlineActions}>
              <Pressable style={styles.secondaryButtonSmall} onPress={() => void refreshNetworks()}>
                <Text style={styles.secondaryButtonText}>Refresh nearby Wi-Fi</Text>
              </Pressable>
              <Pressable style={styles.secondaryButtonSmall} onPress={openManualEntry}>
                <Text style={styles.secondaryButtonText}>Enter manually</Text>
              </Pressable>
            </View>
            {networksBusy ? (
              <View style={styles.row}>
                <ActivityIndicator color="#0b6e4f" />
                <Text style={styles.loadingInline}>Reading Sparkbox network list…</Text>
              </View>
            ) : null}

            {selectedSsid ? (
              <View style={styles.selectionCard}>
                <Text style={styles.selectionLabel}>Selected Wi-Fi</Text>
                <Text style={styles.selectionTitle}>{selectedSsid}</Text>
                <Text style={styles.selectionCopy}>
                  {selectedNetwork?.known
                    ? 'Sparkbox already knows this Wi-Fi. Leave the password blank to reuse the saved credential.'
                    : 'Enter the Wi-Fi password that Sparkbox should store.'}
                </Text>
                <TextInput
                  secureTextEntry
                  placeholder={selectedNetwork?.known ? 'Leave blank to reuse saved password' : 'Wi-Fi password'}
                  placeholderTextColor="#7e8a83"
                  style={styles.input}
                  value={wifiPassword}
                  onChangeText={setWifiPassword}
                />
                <Pressable style={styles.primaryButton} onPress={() => void submitWifi()} disabled={!canSubmitWifi}>
                  {provisionBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Send Wi-Fi to Sparkbox</Text>}
                </Pressable>
              </View>
            ) : null}

            {manualEntry ? (
              <View style={styles.selectionCard}>
                <Text style={styles.selectionLabel}>Manual network entry</Text>
                <TextInput
                  placeholder="Wi-Fi name (SSID)"
                  placeholderTextColor="#7e8a83"
                  style={styles.input}
                  value={selectedSsid}
                  onChangeText={setSelectedSsid}
                />
              </View>
            ) : null}

            {networks.map((network) => (
              <Pressable
                key={network.ssid}
                style={styles.networkRow}
                onPress={() => chooseNetwork(network)}
              >
                <View style={styles.networkLeft}>
                  <Text style={styles.networkName}>{network.ssid}</Text>
                  <Text style={styles.networkMeta}>
                    {network.signal_percent ?? 0}% signal · {network.security || 'open'}
                  </Text>
                  {network.support_reason ? (
                    <Text style={styles.networkWarning}>{network.support_reason}</Text>
                  ) : null}
                </View>
                <View style={styles.networkTags}>
                  {network.known ? <Text style={styles.tag}>Saved</Text> : null}
                  {network.support_level === 'warning' ? <Text style={styles.tagWarning}>Caution</Text> : null}
                  {network.support_level === 'unsupported' ? <Text style={styles.tagMuted}>Advanced</Text> : null}
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {(provisionBusy || completedDeviceId) ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>4. Activation</Text>
            <Text style={styles.cardCopy}>{provisionMessage}</Text>
            {provisionBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
            {completedDeviceId ? (
              <View style={styles.successBox}>
                <Text style={styles.successTitle}>Sparkbox is ready</Text>
                <Text style={styles.successCopy}>
                  {completedDeviceId} is online in {householdName}. You can now go back to the household app and chat normally.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {scannerOpen ? (
        <View style={styles.scannerOverlay}>
          <CameraView
            style={styles.scanner}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={(event) => {
              applyClaimInput(event.data);
              setScannerOpen(false);
            }}
          />
          <View style={styles.scannerChrome}>
            <Text style={styles.scannerTitle}>Scan the Sparkbox QR label</Text>
            <Text style={styles.scannerCopy}>
              Point your phone at the printed code on the device or the shipping card.
            </Text>
            <Pressable style={styles.primaryButtonSmall} onPress={() => setScannerOpen(false)}>
              <Text style={styles.primaryButtonText}>Close scanner</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export default App;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f1e8',
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  hero: {
    paddingTop: 8,
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: '#4f6b5e',
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    color: '#17352a',
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#50635a',
  },
  card: {
    backgroundColor: '#fffdf8',
    borderRadius: 24,
    padding: 18,
    gap: 12,
    shadowColor: '#2b312d',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#17352a',
  },
  cardCopy: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5a6b62',
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d6dfd9',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#17352a',
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  primaryButton: {
    borderRadius: 18,
    backgroundColor: '#0b6e4f',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonSmall: {
    borderRadius: 16,
    backgroundColor: '#0b6e4f',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#c9d5ce',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    backgroundColor: '#f8f4ea',
  },
  secondaryButtonSmall: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c9d5ce',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    backgroundColor: '#f8f4ea',
  },
  secondaryButtonText: {
    color: '#17352a',
    fontWeight: '700',
    fontSize: 15,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  errorText: {
    color: '#9f2a26',
    lineHeight: 20,
    fontSize: 14,
  },
  loadingText: {
    color: '#476257',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingInline: {
    color: '#476257',
    fontSize: 14,
  },
  claimPreview: {
    backgroundColor: '#eef5ef',
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  claimPreviewLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    color: '#638070',
    fontWeight: '700',
  },
  claimPreviewValue: {
    fontSize: 16,
    color: '#17352a',
    fontWeight: '700',
  },
  networkRow: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d6dfd9',
    backgroundColor: '#fff',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  networkLeft: {
    flex: 1,
    gap: 4,
  },
  networkName: {
    color: '#17352a',
    fontSize: 16,
    fontWeight: '700',
  },
  networkMeta: {
    color: '#61746a',
    fontSize: 13,
  },
  networkWarning: {
    color: '#8a5a00',
    fontSize: 12,
    lineHeight: 18,
  },
  networkTags: {
    alignItems: 'flex-end',
    gap: 6,
  },
  tag: {
    color: '#0b6e4f',
    backgroundColor: '#e8f5ee',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
  },
  tagWarning: {
    color: '#8a5a00',
    backgroundColor: '#fff1cf',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
  },
  tagMuted: {
    color: '#58655e',
    backgroundColor: '#eef1ef',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
  },
  selectionCard: {
    backgroundColor: '#eef5ef',
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  selectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: '#4f6b5e',
    fontWeight: '700',
  },
  selectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#17352a',
  },
  selectionCopy: {
    color: '#556860',
    fontSize: 14,
    lineHeight: 21,
  },
  statusText: {
    color: '#375346',
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    color: '#0b6e4f',
    fontWeight: '800',
  },
  debugCard: {
    backgroundColor: '#f3f7f4',
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  debugTitle: {
    color: '#17352a',
    fontSize: 16,
    fontWeight: '800',
  },
  debugCopy: {
    color: '#5a6b62',
    fontSize: 13,
    lineHeight: 19,
  },
  debugRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d6dfd9',
    backgroundColor: '#fff',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  successBox: {
    backgroundColor: '#e7f5ee',
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  successTitle: {
    color: '#0b6e4f',
    fontSize: 20,
    fontWeight: '800',
  },
  successCopy: {
    color: '#355244',
    lineHeight: 21,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#081610',
  },
  scanner: {
    flex: 1,
  },
  scannerChrome: {
    padding: 20,
    gap: 10,
    backgroundColor: 'rgba(8,22,16,0.92)',
  },
  scannerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f7f4ec',
  },
  scannerCopy: {
    color: '#d2ddd5',
    lineHeight: 21,
  },
});
