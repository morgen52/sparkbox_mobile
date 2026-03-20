import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { Buffer } from 'buffer';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { authenticateWithCloud, type AuthMode, type Session } from './src/authFlow';
import {
  PHASE_ONE_TABS,
  resolvePhaseOneSurface,
  type PhaseOneSurface,
} from './src/appShell';
import {
  buildSetupStepLabels,
  deriveHotspotActiveStep,
  shouldShowClaimStep,
  shouldShowSetupConnectStep,
  shouldAutoStartCloudVerification,
  shouldOpenPortalInBrowser,
  type HotspotStage,
  type SetupFlowKind,
} from './src/hotspotOnboarding';
import {
  clearChatSessionMessages,
  controlDeviceService,
  buildHouseholdFileDownloadUrl,
  createHouseholdDirectory,
  createHouseholdChatSession,
  createHouseholdTask,
  createHouseholdInvitation,
  deleteHouseholdChatSession,
  deleteHouseholdPath,
  deleteHouseholdTask,
  getDeviceConfigStatus,
  getDeviceDiagnostics,
  getDeviceInferenceDetail,
  getFamilyAppCatalog,
  getDeviceOllamaModels,
  getDeviceProviderConfig,
  getDeviceProviders,
  getHouseholdFiles,
  getHouseholdSpaceDetail,
  getInstalledFamilyApps,
  getHouseholdSpaces,
  getHouseholdChatSession,
  getHouseholdChatSessions,
  getHouseholdSummary,
  getHouseholdTaskHistory,
  getHouseholdTasks,
  installFamilyApp,
  onboardDeviceProvider,
  openSpaceSideChannel,
  relayHouseholdSpaceMessage,
  renameHouseholdPath,
  resetDeviceToSetupMode,
  type HouseholdTaskScope,
  type HouseholdTaskSummary,
  type HouseholdTaskRunSummary,
  removeHouseholdMember,
  revokeHouseholdInvitation,
  startDeviceReprovision,
  type ChatSessionScope,
  type HouseholdChatSessionDetail,
  type HouseholdChatSessionSummary,
  streamHouseholdChatSessionMessage,
  triggerHouseholdTask,
  updateDeviceProviderConfig,
  updateHouseholdChatSession,
  updateHouseholdMemberRole,
  updateHouseholdTask,
  uploadHouseholdFiles,
  type DeviceConfigStatus,
  type DeviceDiagnostics,
  type DeviceInferenceDetail,
  type DeviceProviderConfig,
  type DeviceSummary,
  type HouseholdFileEntry,
  type HouseholdFileSpace,
  type HouseholdFileListing,
  type HouseholdActivitySummary,
  type HouseholdChatSessionMessage,
  type HouseholdInviteSummary,
  type HouseholdMemberSummary,
  type FamilyAppInstallation,
  type HouseholdSpaceDetail,
  type HouseholdSpaceSummary,
} from './src/householdApi';
import {
  canManageHousehold,
  hasOnlineDevice,
  type ShellTab,
} from './src/householdState';
import {
  describeChatAccess,
  describeChatSendPhase,
  describeSpaceKind,
  describeSpaceTemplate,
  formatSpaceTemplateList,
  getRelayTargets,
  mapSpaceKindToLegacyScope,
  resolveActiveSpaceId,
  resolveRelayTargetUserId,
  type ChatSendPhase,
} from './src/spaceShell';
import {
  isLikelyLocalSetupHandoffError,
  listLocalSetupNetworks,
  submitLocalSetupNetwork,
  type LocalSetupNetwork,
} from './src/localSetupApi';
import {
  clearSessionWifiState,
  connectToHomeWifi,
  connectToSetupHotspot,
  getCurrentSsid,
  openInternetPanel,
} from './src/wifiOnboarding';


const globalWithBuffer = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
if (!globalWithBuffer.Buffer) {
  globalWithBuffer.Buffer = Buffer;
}

const CLOUD_API_BASE =
  (Constants.expoConfig?.extra?.cloudApiBase as string | undefined)?.replace(/\/$/, '') ??
  'https://morgen52.site/familyserver';

const STORAGE_KEY = 'sparkbox.mobile.session';
const HOTSPOT_SSID = 'Sparkbox-Setup';

type ClaimPayload = {
  deviceId: string;
  claimCode: string;
  raw: string;
};

type ProvisionStatus = {
  device_id?: string;
  status?: string;
  wifi?: {
    ssid?: string;
    connection_name?: string;
    network_apply_mode?: string;
    portal_url?: string | null;
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

type ChatTimelineMessage = HouseholdChatSessionMessage & {
  pending?: boolean;
};

const CHAT_PENDING_NOTES = [
  'Sparkbox 正在认真准备，不会丢下这条消息。',
  '正在结合这个空间的上下文慢慢想一想。',
  '第一次回复可能会慢一点，但它还在继续生成。',
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function App() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');

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
  const [provisionMessage, setProvisionMessage] = useState('Scan the QR code to attach Sparkbox, then let the app switch to setup mode.');
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [completedDeviceId, setCompletedDeviceId] = useState('');
  const [hotspotStage, setHotspotStage] = useState<HotspotStage>('idle');
  const [homeWifiTarget, setHomeWifiTarget] = useState<{ ssid: string; password: string } | null>(null);
  const [previousInternetSsid, setPreviousInternetSsid] = useState<string | null>(null);
  const [setupPageState, setSetupPageState] = useState<ProvisionStatus | null>(null);
  const [setupNetworksLoaded, setSetupNetworksLoaded] = useState(false);
  const [shellTab, setShellTab] = useState<ShellTab>('chats');
  const [shellSurface, setShellSurface] = useState<PhaseOneSurface>('onboarding');
  const [homeBusy, setHomeBusy] = useState(false);
  const [homeLoaded, setHomeLoaded] = useState(false);
  const [homeError, setHomeError] = useState('');
  const [homeDevices, setHomeDevices] = useState<DeviceSummary[]>([]);
  const [homeMembers, setHomeMembers] = useState<HouseholdMemberSummary[]>([]);
  const [homePendingInvites, setHomePendingInvites] = useState<HouseholdInviteSummary[]>([]);
  const [homeRecentActivity, setHomeRecentActivity] = useState<HouseholdActivitySummary[]>([]);
  const [spacesBusy, setSpacesBusy] = useState(false);
  const [spacesError, setSpacesError] = useState('');
  const [spaces, setSpaces] = useState<HouseholdSpaceSummary[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState('');
  const [activeSpaceDetail, setActiveSpaceDetail] = useState<HouseholdSpaceDetail | null>(null);
  const [chatScope, setChatScope] = useState<ChatSessionScope>('family');
  const [chatSessions, setChatSessions] = useState<HouseholdChatSessionSummary[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState('');
  const [activeChatSession, setActiveChatSession] = useState<HouseholdChatSessionDetail | null>(null);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatSendPhase, setChatSendPhase] = useState<ChatSendPhase>('idle');
  const [chatPendingMessage, setChatPendingMessage] = useState<ChatTimelineMessage | null>(null);
  const [, setChatPendingNoteIndex] = useState(0);
  const [chatError, setChatError] = useState('');
  const [chatDraft, setChatDraft] = useState('');
  const [chatSessionEditorOpen, setChatSessionEditorOpen] = useState(false);
  const [editingChatSession, setEditingChatSession] = useState<HouseholdChatSessionSummary | null>(null);
  const [chatSessionName, setChatSessionName] = useState('');
  const [chatSessionSystemPrompt, setChatSessionSystemPrompt] = useState('');
  const [chatSessionTemperature, setChatSessionTemperature] = useState('0.7');
  const [chatSessionMaxTokens, setChatSessionMaxTokens] = useState('2048');
  const [fileSpace, setFileSpace] = useState<HouseholdFileSpace>('family');
  const [fileListing, setFileListing] = useState<HouseholdFileListing | null>(null);
  const [filesBusy, setFilesBusy] = useState(false);
  const [filesError, setFilesError] = useState('');
  const [filesNotice, setFilesNotice] = useState('');
  const [fileEditorOpen, setFileEditorOpen] = useState(false);
  const [fileEditorMode, setFileEditorMode] = useState<'mkdir' | 'rename' | null>(null);
  const [fileEditorValue, setFileEditorValue] = useState('');
  const [fileTargetEntry, setFileTargetEntry] = useState<HouseholdFileEntry | null>(null);
  const [taskScope, setTaskScope] = useState<HouseholdTaskScope>('family');
  const [tasks, setTasks] = useState<HouseholdTaskSummary[]>([]);
  const [tasksBusy, setTasksBusy] = useState(false);
  const [tasksError, setTasksError] = useState('');
  const [tasksNotice, setTasksNotice] = useState('');
  const [taskEditorOpen, setTaskEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<HouseholdTaskSummary | null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskCronExpr, setTaskCronExpr] = useState('');
  const [taskCommand, setTaskCommand] = useState('');
  const [taskCommandType, setTaskCommandType] = useState<'shell' | 'zeroclaw'>('zeroclaw');
  const [taskEnabled, setTaskEnabled] = useState(true);
  const [taskHistoryOpen, setTaskHistoryOpen] = useState(false);
  const [taskHistoryTask, setTaskHistoryTask] = useState<HouseholdTaskSummary | null>(null);
  const [taskHistoryRuns, setTaskHistoryRuns] = useState<HouseholdTaskRunSummary[]>([]);
  const [relayComposerOpen, setRelayComposerOpen] = useState(false);
  const [relayTargetUserId, setRelayTargetUserId] = useState('');
  const [relayMessage, setRelayMessage] = useState('');
  const [relayBusy, setRelayBusy] = useState(false);
  const [relayError, setRelayError] = useState('');
  const [relayNotice, setRelayNotice] = useState('');
  const [diagnosticsBusy, setDiagnosticsBusy] = useState(false);
  const [diagnosticsError, setDiagnosticsError] = useState('');
  const [diagnosticsDeviceId, setDiagnosticsDeviceId] = useState('');
  const [diagnosticsPayload, setDiagnosticsPayload] = useState<DeviceDiagnostics | null>(null);
  const [ownerConsoleBusy, setOwnerConsoleBusy] = useState(false);
  const [ownerConsoleError, setOwnerConsoleError] = useState('');
  const [ownerConsoleNotice, setOwnerConsoleNotice] = useState('');
  const [ownerDeviceId, setOwnerDeviceId] = useState('');
  const [ownerStatus, setOwnerStatus] = useState<DeviceConfigStatus | null>(null);
  const [ownerProviders, setOwnerProviders] = useState<string[]>([]);
  const [ownerModels, setOwnerModels] = useState<Array<{ name: string; size?: number | null }>>([]);
  const [ownerProviderConfig, setOwnerProviderConfig] = useState<DeviceProviderConfig>({
    defaultProvider: 'ollama',
    defaultModel: '',
    providerTimeoutSecs: 120,
  });
  const [ownerInference, setOwnerInference] = useState<DeviceInferenceDetail | null>(null);
  const [ownerOnboardProvider, setOwnerOnboardProvider] = useState('ollama');
  const [ownerOnboardModel, setOwnerOnboardModel] = useState('');
  const [ownerOnboardApiKey, setOwnerOnboardApiKey] = useState('');
  const [ownerOnboardApiUrl, setOwnerOnboardApiUrl] = useState('');
  const [ownerServiceOutput, setOwnerServiceOutput] = useState('');
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsNotice, setSettingsNotice] = useState('');
  const [familyAppsBusy, setFamilyAppsBusy] = useState(false);
  const [familyAppsCatalog, setFamilyAppsCatalog] = useState<FamilyAppInstallation[]>([]);
  const [installedFamilyApps, setInstalledFamilyApps] = useState<FamilyAppInstallation[]>([]);
  const verificationStartedRef = useRef(false);
  const lastOpenedPortalUrlRef = useRef<string | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const stepOffsetsRef = useRef<Record<number, number>>({});
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
  const step1Collapsed = Boolean(session) && activeStep > 1;
  const step2Visible = shouldShowSetupConnectStep({
    setupFlowKind,
    pairingTokenPresent: Boolean(pairingToken),
  });
  const step2Collapsed = step2Visible && activeStep > 2;
  const step3Visible =
    hotspotStage === 'local_setup' ||
    hotspotStage === 'returning_home' ||
    hotspotStage === 'verifying' ||
    hotspotStage === 'completed' ||
    hotspotStage === 'failed' ||
    hasChosenHomeWifi;
  const step3Collapsed = step3Visible && activeStep > 3;
  const step4Visible = activeStep === 4 || Boolean(portalUrl) || Boolean(completedDeviceId);
  const onboardingInProgress =
    Boolean(claimPayload) ||
    Boolean(pairingToken) ||
    hotspotStage !== 'idle' ||
    Boolean(completedDeviceId);
  const setupFlowRequested = Boolean(reprovisionDeviceId);

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

  useEffect(() => {
    const targetY = stepOffsetsRef.current[activeStep];
    if (typeof targetY !== 'number') {
      return;
    }
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(targetY - 16, 0),
        animated: true,
      });
    }, 120);
    return () => clearTimeout(timer);
  }, [activeStep]);

  const householdName = session?.household.name ?? 'your household';
  const canManage = canManageHousehold(session?.user.role ?? '');
  const onlineDeviceAvailable = hasOnlineDevice(homeDevices);
  const activeSpace = spaces.find((space) => space.id === activeSpaceId) ?? null;
  const relayTargets = getRelayTargets(activeSpaceDetail, session?.user.id);
  const currentFilePath = fileListing?.path ?? '';
  const canCreateTasks = canManage || taskScope === 'private';
  const activeChatMessages: HouseholdChatSessionMessage[] = activeChatSession?.messages ?? [];
  const activeChatTimelineMessages: ChatTimelineMessage[] = chatPendingMessage
    ? [...activeChatMessages, chatPendingMessage]
    : activeChatMessages;
  const canManageActiveChat =
    !!activeChatSession && (canManage || activeChatSession.ownerUserId === session?.user.id);
  const activeSpaceKindLabel = activeSpace ? describeSpaceKind(activeSpace.kind) : '';
  const activeSpaceTemplateLabel = activeSpace?.template ? describeSpaceTemplate(activeSpace.template) : '';
  const libraryOverviewSections = [
    {
      title: 'Memories',
      copy: activeSpace ? `Things Sparkbox remembers for ${activeSpace.name}.` : 'Things Sparkbox remembers for the active space.',
    },
    {
      title: 'Summaries',
      copy: 'Quick recaps that help you catch up without opening every thread.',
    },
    {
      title: 'Photos',
      copy: 'Shared moments and visual context saved with this space.',
    },
    {
      title: 'Files',
      copy: 'Documents, uploads, and practical materials for this space.',
    },
    {
      title: 'Tasks',
      copy: 'Routines, reminders, and scheduled work attached to this space.',
    },
  ];
  const availableFamilyApps = familyAppsCatalog.filter(
    (app) => !installedFamilyApps.some((installed) => installed.slug === app.slug),
  );
  const recommendedFamilyApps = activeSpace
    ? availableFamilyApps.filter((app) => app.spaceTemplates.includes(activeSpace.template))
    : [];
  const authCardTitle =
    authMode === 'login'
      ? 'Sign in'
      : authMode === 'register'
        ? 'Create your household'
        : 'Join a household';
  const authCardCopy =
    authMode === 'login'
      ? 'Use the same cloud account that owns Sparkbox.'
      : authMode === 'register'
        ? 'Create the owner account that will claim and set up Sparkbox first.'
        : 'Enter the invite code from an owner to join an existing Sparkbox household.';
  const authSubmitLabel =
    authMode === 'login' ? 'Sign in' : authMode === 'register' ? 'Create account' : 'Join household';

  function canEditTask(task: HouseholdTaskSummary): boolean {
    if (canManage) {
      return true;
    }
    return task.scope === 'private';
  }

  function canTriggerTask(task: HouseholdTaskSummary): boolean {
    if (canManage) {
      return true;
    }
    if (task.scope === 'private') {
      return true;
    }
    return task.scope === 'family' && task.commandType === 'zeroclaw';
  }

  function canManageFileEntry(entry: HouseholdFileEntry): boolean {
    if (fileSpace === 'private') {
      return true;
    }
    if (canManage) {
      return true;
    }
    return entry.uploadedByUserId === session?.user.id;
  }

  async function refreshHouseholdSummary(options: { silent?: boolean } = {}): Promise<void> {
    if (!session?.token) {
      return;
    }
    if (!options.silent) {
      setHomeBusy(true);
      setHomeError('');
    }
    try {
      const summary = await getHouseholdSummary(session.token);
      setHomeDevices(summary.devices);
      setHomeMembers(summary.members);
      setHomePendingInvites(summary.pendingInvites);
      setHomeRecentActivity(summary.recentActivity);
      setHomeLoaded(true);
    } catch (error) {
      setHomeLoaded(false);
      setHomeError(error instanceof Error ? error.message : 'Could not load your household.');
      throw error;
    } finally {
      if (!options.silent) {
        setHomeBusy(false);
      }
    }
  }

  async function refreshSpaces(options: { silent?: boolean } = {}): Promise<void> {
    if (!session?.token) {
      return;
    }
    if (!options.silent) {
      setSpacesBusy(true);
      setSpacesError('');
    }
    try {
      const nextSpaces = await getHouseholdSpaces(session.token);
      setSpaces(nextSpaces);
      setActiveSpaceId((current) => resolveActiveSpaceId(nextSpaces, current));
    } catch (error) {
      setSpacesError(error instanceof Error ? error.message : 'Could not load Sparkbox spaces.');
    } finally {
      if (!options.silent) {
        setSpacesBusy(false);
      }
    }
  }

  async function updateStoredSessionRole(nextRole: 'owner' | 'member'): Promise<void> {
    if (!session || session.user.role === nextRole) {
      return;
    }
    const nextSession: Session = {
      ...session,
      user: {
        ...session.user,
        role: nextRole,
      },
    };
    setSession(nextSession);
    await persistSession(nextSession);
  }

  useEffect(() => {
    setShellSurface(
      resolvePhaseOneSurface({
        sessionPresent: Boolean(session),
        setupFlowRequested,
        onboardingInProgress,
        activationComplete: Boolean(completedDeviceId),
        householdLoaded: homeLoaded,
        hasAnyDevice: homeDevices.length > 0,
      }),
    );
  }, [
    completedDeviceId,
    homeDevices.length,
    homeLoaded,
    onboardingInProgress,
    session,
    setupFlowRequested,
  ]);

  useEffect(() => {
    if (!session?.token) {
      setHomeDevices([]);
      setHomeMembers([]);
      setHomePendingInvites([]);
      setHomeRecentActivity([]);
      setSpaces([]);
      setActiveSpaceId('');
      setActiveSpaceDetail(null);
      setChatSessions([]);
      setActiveChatSessionId('');
      setActiveChatSession(null);
      setFileListing(null);
      setFilesError('');
      setFilesNotice('');
      setDiagnosticsPayload(null);
      setDiagnosticsDeviceId('');
      setDiagnosticsError('');
      setOwnerConsoleError('');
      setOwnerConsoleNotice('');
      setOwnerDeviceId('');
      setOwnerStatus(null);
      setOwnerProviders([]);
      setOwnerModels([]);
      setOwnerInference(null);
      setOwnerServiceOutput('');
      setHomeLoaded(false);
      setHomeError('');
      return;
    }
    if ((onboardingInProgress || setupFlowRequested) && !completedDeviceId) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        await refreshHouseholdSummary();
        await refreshSpaces({ silent: true });
      } catch (error) {
        if (cancelled) {
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [completedDeviceId, onboardingInProgress, session?.token, setupFlowRequested]);

  useEffect(() => {
    if (!activeSpace) {
      setActiveSpaceDetail(null);
      return;
    }
    const mapped = mapSpaceKindToLegacyScope(activeSpace.kind);
    setChatScope(mapped.chatScope);
    setFileSpace(mapped.fileSpace);
    setTaskScope(mapped.taskScope);
  }, [activeSpace]);

  useEffect(() => {
    if (!session?.token || !activeSpaceId) {
      setActiveSpaceDetail(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const detail = await getHouseholdSpaceDetail(session.token, activeSpaceId);
        if (!cancelled) {
          setActiveSpaceDetail(detail);
        }
      } catch {
        if (!cancelled) {
          setActiveSpaceDetail(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.token, activeSpaceId]);

  useEffect(() => {
    setRelayTargetUserId((current) => resolveRelayTargetUserId(relayTargets, current));
    if (!relayTargets.some((member) => member.id === relayTargetUserId)) {
      setRelayError('');
    }
  }, [relayTargetUserId, relayTargets]);

  useEffect(() => {
    setRelayComposerOpen(false);
    setRelayTargetUserId('');
    setRelayMessage('');
    setRelayError('');
    setRelayNotice('');
  }, [activeSpaceId]);

  useEffect(() => {
    if (shellSurface !== 'shell' || shellTab !== 'chats' || !session?.token) {
      return;
    }
    let cancelled = false;
    setChatBusy(true);
    setChatError('');
    void (async () => {
      try {
        const sessions = await getHouseholdChatSessions(session.token, chatScope);
        if (cancelled) {
          return;
        }
        setChatSessions(sessions);
        setActiveChatSessionId((current) => {
          if (current && sessions.some((sessionItem) => sessionItem.id === current)) {
            return current;
          }
          return sessions[0]?.id ?? '';
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setChatError(error instanceof Error ? error.message : 'Could not load chat sessions.');
      } finally {
        if (!cancelled) {
          setChatBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chatScope, session?.token, shellSurface, shellTab]);

  useEffect(() => {
    if (shellSurface !== 'shell' || shellTab !== 'chats' || !session?.token || !activeChatSessionId) {
      setActiveChatSession(null);
      return;
    }
    let cancelled = false;
    setChatBusy(true);
    setChatError('');
    void (async () => {
      try {
        const detail = await getHouseholdChatSession(session.token, activeChatSessionId);
        if (cancelled) {
          return;
        }
        setActiveChatSession(detail);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setActiveChatSession(null);
        setChatError(error instanceof Error ? error.message : 'Could not load this chat.');
      } finally {
        if (!cancelled) {
          setChatBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeChatSessionId, session?.token, shellSurface, shellTab]);

  useEffect(() => {
    setChatPendingMessage(null);
    setChatSendPhase('idle');
    setChatPendingNoteIndex(0);
  }, [activeChatSessionId]);

  useEffect(() => {
    if (chatSendPhase !== 'sending' || !chatPendingMessage?.pending) {
      return;
    }
    const interval = setInterval(() => {
      setChatPendingNoteIndex((current) => {
        const next = (current + 1) % CHAT_PENDING_NOTES.length;
        setChatPendingMessage((existing) =>
          existing?.pending
            ? {
                ...existing,
                content: CHAT_PENDING_NOTES[next],
              }
            : existing,
        );
        return next;
      });
    }, 2400);
    return () => clearInterval(interval);
  }, [chatPendingMessage?.pending, chatSendPhase]);

  useEffect(() => {
    if (shellSurface !== 'shell' || shellTab !== 'library' || !session?.token) {
      return;
    }
    let cancelled = false;
    setTasksBusy(true);
    setTasksError('');
    void (async () => {
      try {
        const nextTasks = await getHouseholdTasks(session.token, taskScope);
        if (cancelled) {
          return;
        }
        setTasks(nextTasks);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setTasksError(error instanceof Error ? error.message : 'Could not load household tasks.');
      } finally {
        if (!cancelled) {
          setTasksBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.token, shellSurface, shellTab, taskScope]);

  useEffect(() => {
    if (shellSurface !== 'shell' || shellTab !== 'library' || !session?.token) {
      return;
    }
    void refreshFiles();
  }, [session?.token, shellSurface, shellTab, fileSpace]);

  useEffect(() => {
    if (!canManage || homeDevices.length === 0) {
      return;
    }
    setOwnerDeviceId((current) => {
      if (current && homeDevices.some((device) => device.device_id === current)) {
        return current;
      }
      return homeDevices[0]?.device_id ?? '';
    });
  }, [canManage, homeDevices]);

  useEffect(() => {
    if (shellSurface !== 'shell' || shellTab !== 'settings' || !session?.token || !canManage || !ownerDeviceId) {
      return;
    }
    void refreshOwnerConsole(ownerDeviceId);
  }, [session?.token, shellSurface, shellTab, canManage, ownerDeviceId]);

  useEffect(() => {
    if (shellSurface !== 'shell' || shellTab !== 'settings' || !session?.token || !canManage) {
      return;
    }
    let cancelled = false;
    setFamilyAppsBusy(true);
    void (async () => {
      try {
        const [catalog, installed] = await Promise.all([
          getFamilyAppCatalog(session.token),
          getInstalledFamilyApps(session.token),
        ]);
        if (cancelled) {
          return;
        }
        setFamilyAppsCatalog(catalog);
        setInstalledFamilyApps(installed);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setSettingsError(error instanceof Error ? error.message : 'Could not load family apps.');
      } finally {
        if (!cancelled) {
          setFamilyAppsBusy(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.token, shellSurface, shellTab, canManage]);

  function captureStepOffset(step: number, event: LayoutChangeEvent): void {
    stepOffsetsRef.current[step] = event.nativeEvent.layout.y;
  }

  async function persistSession(nextSession: Session | null): Promise<void> {
    if (nextSession) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }

  async function submitAuth(): Promise<void> {
    if ((authMode === 'register' || authMode === 'join') && !displayName.trim()) {
      setAuthError('Enter your display name first.');
      return;
    }
    if (authMode === 'join' && !inviteCode.trim()) {
      setAuthError('Enter the invite code from your household owner.');
      return;
    }
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
          join: (payload) =>
            apiJson<Session>('/api/auth/join', {
              method: 'POST',
              body: payload,
            }),
        },
        authMode,
        { email, password, displayName, inviteCode },
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

  async function generateInvite(role: 'owner' | 'member'): Promise<void> {
    if (!session?.token || !canManage) {
      return;
    }
    setSettingsBusy(true);
    setSettingsError('');
    try {
      const invite = await createHouseholdInvitation(session.token, role);
      setSettingsNotice(`${role === 'owner' ? 'Owner' : 'Member'} invite ready: ${invite.inviteCode}`);
      Alert.alert(
        role === 'owner' ? 'Owner invite ready' : 'Member invite ready',
        `${invite.inviteCode}\n\nAsk them to open Sparkbox, choose Join, and enter this code.`,
      );
      await refreshHouseholdSummary({ silent: true });
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Could not create invite.');
    } finally {
      setSettingsBusy(false);
    }
  }

  async function installSelectedFamilyApp(slug: string): Promise<void> {
    if (!session?.token || !canManage) {
      return;
    }
    setSettingsBusy(true);
    setSettingsError('');
    try {
      const installed = await installFamilyApp(session.token, slug);
      setInstalledFamilyApps((current) => {
        if (current.some((item) => item.slug === installed.slug)) {
          return current;
        }
        return [...current, installed];
      });
      setSettingsNotice(`${installed.title} installed on this Box.`);
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Could not install this family app.');
    } finally {
      setSettingsBusy(false);
    }
  }

  async function revokeInvite(invite: HouseholdInviteSummary): Promise<void> {
    if (!session?.token || !canManage) {
      return;
    }
    setSettingsBusy(true);
    setSettingsError('');
    try {
      await revokeHouseholdInvitation(session.token, invite.id);
      setSettingsNotice(`Revoked ${invite.role} invite.`);
      await refreshHouseholdSummary({ silent: true });
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Could not revoke invite.');
    } finally {
      setSettingsBusy(false);
    }
  }

  async function changeMemberRole(
    member: HouseholdMemberSummary,
    nextRole: 'owner' | 'member',
  ): Promise<void> {
    if (!session?.token || !canManage || member.role === nextRole) {
      return;
    }
    setSettingsBusy(true);
    setSettingsError('');
    try {
      await updateHouseholdMemberRole(session.token, member.id, nextRole);
      if (member.id === session.user.id) {
        await updateStoredSessionRole(nextRole);
      }
      setSettingsNotice(`${member.display_name} is now ${nextRole}.`);
      await refreshHouseholdSummary({ silent: true });
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Could not update role.');
    } finally {
      setSettingsBusy(false);
    }
  }

  async function removeMember(member: HouseholdMemberSummary): Promise<void> {
    if (!session?.token || !canManage) {
      return;
    }
    setSettingsBusy(true);
    setSettingsError('');
    try {
      await removeHouseholdMember(session.token, member.id);
      setSettingsNotice(`Removed ${member.display_name} from the household.`);
      await refreshHouseholdSummary({ silent: true });
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Could not remove member.');
    } finally {
      setSettingsBusy(false);
    }
  }

  function resetFlow(): void {
    setSetupFlowKind('first_run');
    setReprovisionDeviceId('');
    setClaimInput('');
    setClaimPayload(null);
    setPairingToken('');
    setClaimError('');
    setBleError('');
    setNetworks([]);
    setSelectedSsid('');
    setSelectedNetwork(null);
    setWifiPassword('');
    setManualEntry(false);
    setNetworkSheetOpen(false);
    setProvisionBusy(false);
    setProvisionMessage('Scan the QR code to attach Sparkbox, then let the app switch to setup mode.');
    setPortalUrl(null);
    setCompletedDeviceId('');
    setHotspotStage('idle');
    setInviteCode('');
    setHomeWifiTarget(null);
    setPreviousInternetSsid(null);
    setSetupPageState(null);
    setSetupNetworksLoaded(false);
    setSettingsBusy(false);
    setSettingsError('');
    setSettingsNotice('');
    setChatScope('family');
    setChatSessions([]);
    setActiveChatSessionId('');
    setActiveChatSession(null);
    setChatBusy(false);
    setChatError('');
    setChatDraft('');
    setChatSessionEditorOpen(false);
    setEditingChatSession(null);
    setChatSessionName('');
    setChatSessionSystemPrompt('');
    setChatSessionTemperature('0.7');
    setChatSessionMaxTokens('2048');
    setTasks([]);
    setTasksBusy(false);
    setTasksError('');
    setTasksNotice('');
    setTaskEditorOpen(false);
    setEditingTask(null);
    setTaskName('');
    setTaskCronExpr('');
    setTaskCommand('');
    setTaskCommandType('zeroclaw');
    setTaskEnabled(true);
    setTaskHistoryOpen(false);
    setTaskHistoryTask(null);
    setTaskHistoryRuns([]);
    setRelayComposerOpen(false);
    setRelayTargetUserId('');
    setRelayMessage('');
    setRelayBusy(false);
    setRelayError('');
    setRelayNotice('');
    setFileListing(null);
    setFilesBusy(false);
    setFilesError('');
    setFilesNotice('');
    setFileEditorOpen(false);
    setFileEditorMode(null);
    setFileEditorValue('');
    setFileTargetEntry(null);
    setDiagnosticsBusy(false);
    setDiagnosticsError('');
    setDiagnosticsDeviceId('');
    setDiagnosticsPayload(null);
    verificationStartedRef.current = false;
    lastOpenedPortalUrlRef.current = null;
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
      await beginHotspotOnboarding(claimPayload.deviceId, response.pairing_token);
    } catch (error) {
      setClaimError(error instanceof Error ? error.message : 'Could not attach this Sparkbox.');
      setHotspotStage('failed');
    } finally {
      setClaimBusy(false);
    }
  }

  async function beginHotspotOnboarding(deviceId: string, nextPairingToken: string): Promise<void> {
    if (!deviceId) {
      setBleError('Pick a Sparkbox before entering setup mode.');
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
      setBleError(error instanceof Error ? error.message : 'Could not switch to Sparkbox-Setup automatically.');
      setProvisionMessage('Open Wi-Fi settings, join Sparkbox-Setup, and the app will continue automatically.');
      await openInternetPanel().catch(() => undefined);
    } finally {
      setProvisionBusy(false);
    }
  }

  async function returnPhoneToHomeWifi(): Promise<void> {
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
        setClaimError('Camera permission is required to scan the Sparkbox QR code.');
        return;
      }
    }
    setScannerOpen(true);
  }

  function beginNewDeviceOnboarding(): void {
    resetFlow();
    setSetupFlowKind('first_run');
    setHomeLoaded(false);
    setHomeError('');
    setShellSurface('onboarding');
  }

  async function beginDeviceReprovision(device: DeviceSummary): Promise<void> {
    resetFlow();
    setSetupFlowKind('reprovision');
    setReprovisionDeviceId(device.device_id);
    setHomeError('');
    setBleError('');
    if (session?.token && device.online) {
      setProvisionBusy(true);
      setProvisionMessage('Asking Sparkbox to reopen setup mode for Wi-Fi changes...');
      try {
        await startDeviceReprovision(session.token, device.device_id);
        setProvisionMessage('Sparkbox is reopening setup mode. Wait for Sparkbox-Setup, then continue.');
      } catch (error) {
        setBleError(error instanceof Error ? error.message : 'Could not ask Sparkbox to re-enter setup mode.');
        setProvisionMessage(
          'If Sparkbox is already in a new place, power it on and wait for Sparkbox-Setup to appear.',
        );
      } finally {
        setProvisionBusy(false);
      }
    } else {
      setProvisionMessage(
        'Bring Sparkbox back into setup mode. If it is in a new place, power it on and wait for Sparkbox-Setup to appear.',
      );
    }
    setPreviousInternetSsid(await getCurrentSsid().catch(() => null));
    setShellSurface('onboarding');
  }

  async function refreshChatSessions(): Promise<void> {
    if (!session?.token) {
      return;
    }
    setChatBusy(true);
    setChatError('');
    try {
      const sessions = await getHouseholdChatSessions(session.token, chatScope);
      setChatSessions(sessions);
      setActiveChatSessionId((current) => {
        if (current && sessions.some((item) => item.id === current)) {
          return current;
        }
        return sessions[0]?.id ?? '';
      });
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Could not load chat sessions.');
    } finally {
      setChatBusy(false);
    }
  }

  async function openCurrentSpaceSideChannel(): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      return;
    }
    setChatBusy(true);
    setChatError('');
    try {
      const sideChannel = await openSpaceSideChannel(session.token, activeSpaceId);
      if (!sideChannel.sessionId) {
        throw new Error('Sparkbox has not prepared a private side channel for this space yet.');
      }
      setActiveSpaceDetail((current) =>
        current
          ? {
              ...current,
              privateSideChannel: sideChannel,
            }
          : current,
      );
      setChatScope('private');
      setActiveChatSessionId(sideChannel.sessionId);
      const sessions = await getHouseholdChatSessions(session.token, 'private');
      setChatSessions(sessions);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Could not open the private side channel.');
    } finally {
      setChatBusy(false);
    }
  }

  function openRelayComposer(): void {
    if (!activeSpace || activeSpace.kind !== 'shared' || relayTargets.length === 0) {
      return;
    }
    setRelayTargetUserId((current) => resolveRelayTargetUserId(relayTargets, current));
    setRelayError('');
    setRelayNotice('');
    setRelayComposerOpen(true);
  }

  async function submitRelayMessage(): Promise<void> {
    if (!session?.token || !activeSpaceId || !activeSpaceDetail || activeSpaceDetail.kind !== 'shared') {
      return;
    }
    const target = relayTargets.find((member) => member.id === relayTargetUserId) ?? relayTargets[0];
    const content = relayMessage.trim();
    if (!target) {
      setRelayError('Choose a member in this shared space first.');
      return;
    }
    if (!content) {
      setRelayError('Write the note Sparkbox should pass along.');
      return;
    }
    setRelayBusy(true);
    setRelayError('');
    try {
      await relayHouseholdSpaceMessage(session.token, activeSpaceId, {
        targetUserId: target.id,
        content,
      });
      setRelayNotice(`Sparkbox passed it to ${target.displayName}.`);
      setRelayComposerOpen(false);
      setRelayMessage('');
      setRelayTargetUserId(resolveRelayTargetUserId(relayTargets, target.id));
    } catch (error) {
      setRelayError(error instanceof Error ? error.message : 'Could not relay this note.');
    } finally {
      setRelayBusy(false);
    }
  }

  function openChatSessionEditor(sessionItem?: HouseholdChatSessionSummary): void {
    if (sessionItem) {
      setEditingChatSession(sessionItem);
      setChatSessionName(sessionItem.name);
      setChatSessionSystemPrompt(sessionItem.systemPrompt);
      setChatSessionTemperature(String(sessionItem.temperature));
      setChatSessionMaxTokens(String(sessionItem.maxTokens));
    } else {
      setEditingChatSession(null);
      setChatSessionName('');
      setChatSessionSystemPrompt('');
      setChatSessionTemperature('0.7');
      setChatSessionMaxTokens('2048');
    }
    setChatError('');
    setChatSessionEditorOpen(true);
  }

  async function submitChatSessionEditor(): Promise<void> {
    if (!session?.token) {
      return;
    }
    const trimmedName = chatSessionName.trim();
    if (!trimmedName) {
      setChatError('Give this chat a name first.');
      return;
    }
    setChatBusy(true);
    setChatError('');
    try {
      const temperature = Number(chatSessionTemperature || '0.7');
      const maxTokens = Number(chatSessionMaxTokens || '2048');
      if (editingChatSession) {
        const updated = await updateHouseholdChatSession(session.token, editingChatSession.id, {
          name: trimmedName,
          systemPrompt: chatSessionSystemPrompt,
          temperature,
          maxTokens,
          lastKnownUpdatedAt: editingChatSession.updatedAt,
        });
        setActiveChatSessionId(updated.id);
      } else {
        const created = await createHouseholdChatSession(session.token, {
          name: trimmedName,
          scope: chatScope,
          systemPrompt: chatSessionSystemPrompt,
          temperature,
          maxTokens,
        });
        setActiveChatSessionId(created.id);
      }
      setChatSessionEditorOpen(false);
      await refreshChatSessions();
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Could not save this chat.');
    } finally {
      setChatBusy(false);
    }
  }

  async function submitChatMessage(): Promise<void> {
    if (!session?.token || !activeChatSessionId) {
      return;
    }
    const content = chatDraft.trim();
    if (!content) {
      return;
    }
    setChatDraft('');
    setChatBusy(true);
    setChatError('');
    setChatPendingNoteIndex(0);
    setChatSendPhase('sending');
    setChatPendingMessage({
      role: 'assistant',
      content: CHAT_PENDING_NOTES[0],
      senderDisplayName: null,
      pending: true,
    });
    if (activeChatSession) {
      setActiveChatSession({
        ...activeChatSession,
        messages: [...activeChatSession.messages, { role: 'user', content, senderDisplayName: session.user.display_name }],
      });
    }
    try {
      let streamedMessage = '';
      const response = await streamHouseholdChatSessionMessage(session.token, activeChatSessionId, content, {
        onPending: (event) => {
          setChatSendPhase('sending');
          if (event.message?.trim()) {
            setChatPendingMessage((current) =>
              current?.pending
                ? {
                    ...current,
                    content: current.content || event.message,
                  }
                : current,
            );
          }
        },
        onToken: (event) => {
          streamedMessage += event.content;
          setChatSendPhase('streaming');
          setChatPendingMessage({
            role: 'assistant',
            content: streamedMessage,
            senderDisplayName: null,
            pending: true,
          });
        },
      });
      const detail = await getHouseholdChatSession(session.token, activeChatSessionId);
      setActiveChatSession(detail);
      setChatSessions((current) =>
        current.map((item) =>
          item.id === detail.id
            ? { ...item, name: detail.name, updatedAt: detail.updatedAt, systemPrompt: detail.systemPrompt, temperature: detail.temperature, maxTokens: detail.maxTokens }
            : item,
        ),
      );
      if (response.message && !detail.messages.some((message) => message.role === 'assistant' && message.content === response.message)) {
        setActiveChatSession((current) =>
          current
            ? {
                ...current,
                messages: [...current.messages, { role: 'assistant', content: response.message, senderDisplayName: null }],
              }
            : current,
        );
      }
      await refreshHouseholdSummary({ silent: true });
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Chat is unavailable right now.');
    } finally {
      setChatPendingMessage(null);
      setChatSendPhase('idle');
      setChatPendingNoteIndex(0);
      setChatBusy(false);
    }
  }

  async function clearCurrentChatSession(): Promise<void> {
    if (!session?.token || !activeChatSessionId) {
      return;
    }
    setChatBusy(true);
    setChatError('');
    try {
      await clearChatSessionMessages(session.token, activeChatSessionId);
      const detail = await getHouseholdChatSession(session.token, activeChatSessionId);
      setActiveChatSession(detail);
      await refreshHouseholdSummary({ silent: true });
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Could not clear this chat.');
    } finally {
      setChatBusy(false);
    }
  }

  async function deleteCurrentChatSession(): Promise<void> {
    if (!session?.token || !activeChatSessionId) {
      return;
    }
    const deletedId = activeChatSessionId;
    setChatBusy(true);
    setChatError('');
    try {
      await deleteHouseholdChatSession(session.token, deletedId);
      setActiveChatSession(null);
      setActiveChatSessionId('');
      await refreshChatSessions();
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Could not delete this chat.');
    } finally {
      setChatBusy(false);
    }
  }

  function openTaskEditor(task?: HouseholdTaskSummary): void {
    if (task) {
      setEditingTask(task);
      setTaskName(task.name);
      setTaskCronExpr(task.cronExpr);
      setTaskCommand(task.command);
      setTaskCommandType(task.commandType);
      setTaskEnabled(task.enabled);
    } else {
      setEditingTask(null);
      setTaskName('');
      setTaskCronExpr('0 19 * * *');
      setTaskCommand('');
      setTaskCommandType(canManage ? 'shell' : 'zeroclaw');
      setTaskEnabled(true);
    }
    setTasksError('');
    setTasksNotice('');
    setTaskEditorOpen(true);
  }

  async function refreshTasks(): Promise<void> {
    if (!session?.token) {
      return;
    }
    setTasksBusy(true);
    setTasksError('');
    try {
      const nextTasks = await getHouseholdTasks(session.token, taskScope);
      setTasks(nextTasks);
    } catch (error) {
      setTasksError(error instanceof Error ? error.message : 'Could not load household tasks.');
    } finally {
      setTasksBusy(false);
    }
  }

  async function openTaskHistory(task: HouseholdTaskSummary): Promise<void> {
    if (!session?.token) {
      return;
    }
    setTasksBusy(true);
    setTasksError('');
    try {
      const runs = await getHouseholdTaskHistory(session.token, task.id);
      setTaskHistoryTask(task);
      setTaskHistoryRuns(runs);
      setTaskHistoryOpen(true);
    } catch (error) {
      setTasksError(error instanceof Error ? error.message : 'Could not load task history.');
    } finally {
      setTasksBusy(false);
    }
  }

  async function submitTaskEditor(): Promise<void> {
    if (!session?.token) {
      return;
    }
    if (!taskName.trim() || !taskCronExpr.trim() || !taskCommand.trim()) {
      setTasksError('Name, schedule, and command are required.');
      return;
    }
    if (!canCreateTasks && !editingTask) {
      setTasksError('Members can only create private tasks.');
      return;
    }

    setTasksBusy(true);
    setTasksError('');
    try {
      const effectiveCommandType = canManage ? taskCommandType : 'zeroclaw';
      if (editingTask) {
        await updateHouseholdTask(session.token, editingTask.id, {
          name: taskName.trim(),
          cronExpr: taskCronExpr.trim(),
          command: taskCommand.trim(),
          commandType: effectiveCommandType,
          enabled: taskEnabled,
          lastKnownUpdatedAt: editingTask.updatedAt ?? undefined,
        });
        setTasksNotice(`Updated ${taskName.trim()}.`);
      } else {
        await createHouseholdTask(session.token, taskScope, {
          name: taskName.trim(),
          cronExpr: taskCronExpr.trim(),
          command: taskCommand.trim(),
          commandType: effectiveCommandType,
          enabled: taskEnabled,
        });
        setTasksNotice(`Created ${taskName.trim()}.`);
      }
      setTaskEditorOpen(false);
      await refreshTasks();
      await refreshHouseholdSummary({ silent: true });
    } catch (error) {
      setTasksError(error instanceof Error ? error.message : 'Could not save the task.');
    } finally {
      setTasksBusy(false);
    }
  }

  async function runTaskNow(task: HouseholdTaskSummary): Promise<void> {
    if (!session?.token) {
      return;
    }
    setTasksBusy(true);
    setTasksError('');
    try {
      const response = await triggerHouseholdTask(session.token, task.id);
      setTasksNotice(response.message || `Queued ${task.name}.`);
      await refreshTasks();
      await refreshHouseholdSummary({ silent: true });
    } catch (error) {
      setTasksError(error instanceof Error ? error.message : 'Could not run the task.');
    } finally {
      setTasksBusy(false);
    }
  }

  async function removeTask(task: HouseholdTaskSummary): Promise<void> {
    if (!session?.token) {
      return;
    }
    setTasksBusy(true);
    setTasksError('');
    try {
      await deleteHouseholdTask(session.token, task.id);
      setTasksNotice(`Removed ${task.name}.`);
      await refreshTasks();
      await refreshHouseholdSummary({ silent: true });
    } catch (error) {
      setTasksError(error instanceof Error ? error.message : 'Could not remove the task.');
    } finally {
      setTasksBusy(false);
    }
  }

  async function refreshFiles(nextPath?: string): Promise<void> {
    if (!session?.token) {
      return;
    }
    setFilesBusy(true);
    setFilesError('');
    try {
      const listing = await getHouseholdFiles(session.token, fileSpace, nextPath ?? currentFilePath);
      setFileListing(listing);
    } catch (error) {
      setFilesError(error instanceof Error ? error.message : 'Could not load files right now.');
    } finally {
      setFilesBusy(false);
    }
  }

  function openFileEditor(mode: 'mkdir' | 'rename', entry?: HouseholdFileEntry): void {
    setFileEditorMode(mode);
    setFileTargetEntry(entry ?? null);
    setFileEditorValue(mode === 'rename' && entry ? entry.name : '');
    setFileEditorOpen(true);
    setFilesError('');
  }

  async function submitFileEditor(): Promise<void> {
    if (!session?.token || !fileEditorMode) {
      return;
    }
    const trimmed = fileEditorValue.trim();
    if (!trimmed) {
      setFilesError('Enter a name first.');
      return;
    }
    setFilesBusy(true);
    setFilesError('');
    try {
      if (fileEditorMode === 'mkdir') {
        const nextPath = currentFilePath ? `${currentFilePath}/${trimmed}` : trimmed;
        await createHouseholdDirectory(session.token, fileSpace, nextPath);
        setFilesNotice(`Created ${trimmed}.`);
      } else if (fileTargetEntry) {
        const src = fileTargetEntry.path;
        const parent = src.includes('/') ? src.slice(0, src.lastIndexOf('/')) : '';
        const dst = parent ? `${parent}/${trimmed}` : trimmed;
        await renameHouseholdPath(session.token, fileSpace, src, dst);
        setFilesNotice(`Renamed to ${trimmed}.`);
      }
      setFileEditorOpen(false);
      await refreshFiles();
    } catch (error) {
      setFilesError(error instanceof Error ? error.message : 'Could not save this change.');
    } finally {
      setFilesBusy(false);
    }
  }

  async function deleteFileEntry(entry: HouseholdFileEntry): Promise<void> {
    if (!session?.token) {
      return;
    }
    setFilesBusy(true);
    setFilesError('');
    try {
      await deleteHouseholdPath(session.token, fileSpace, entry.path);
      setFilesNotice(`Removed ${entry.name}.`);
      await refreshFiles();
    } catch (error) {
      setFilesError(error instanceof Error ? error.message : 'Could not remove this file.');
    } finally {
      setFilesBusy(false);
    }
  }

  async function pickAndUploadFiles(): Promise<void> {
    if (!session?.token) {
      return;
    }
    setFilesBusy(true);
    setFilesError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) {
        return;
      }
      const uploads = await Promise.all(
        result.assets.map(async (asset) => {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return {
            name: asset.name,
            mimeType: asset.mimeType || 'application/octet-stream',
            data: Uint8Array.from(Buffer.from(base64, 'base64')),
          };
        }),
      );
      const response = await uploadHouseholdFiles(session.token, fileSpace, currentFilePath, uploads);
      setFilesNotice(`Uploaded ${response.saved.map((item) => item.name).join(', ')}.`);
      await refreshFiles();
    } catch (error) {
      setFilesError(error instanceof Error ? error.message : 'Could not upload files.');
    } finally {
      setFilesBusy(false);
    }
  }

  async function downloadFileEntry(entry: HouseholdFileEntry): Promise<void> {
    if (!session?.token) {
      return;
    }
    setFilesBusy(true);
    setFilesError('');
    try {
      const destinationRoot = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!destinationRoot) {
        throw new Error('No writable file cache is available on this phone.');
      }
      const result = await FileSystem.downloadAsync(
        buildHouseholdFileDownloadUrl(fileSpace, entry.path),
        `${destinationRoot}${entry.name}`,
        {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        },
      );
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri);
      } else {
        setFilesNotice(`Downloaded ${entry.name}.`);
      }
    } catch (error) {
      setFilesError(error instanceof Error ? error.message : 'Could not download this file.');
    } finally {
      setFilesBusy(false);
    }
  }

  async function loadDiagnostics(deviceId: string): Promise<void> {
    if (!session?.token) {
      return;
    }
    setDiagnosticsBusy(true);
    setDiagnosticsError('');
    setDiagnosticsDeviceId(deviceId);
    try {
      const payload = await getDeviceDiagnostics(session.token, deviceId);
      setDiagnosticsPayload(payload);
    } catch (error) {
      setDiagnosticsPayload(null);
      setDiagnosticsError(error instanceof Error ? error.message : 'Could not load diagnostics.');
    } finally {
      setDiagnosticsBusy(false);
    }
  }

  async function factoryResetDevice(device: DeviceSummary): Promise<void> {
    if (!session?.token) {
      return;
    }
    setDiagnosticsBusy(true);
    setDiagnosticsError('');
    try {
      await resetDeviceToSetupMode(session.token, device.device_id);
      setSettingsNotice(`${device.device_id} was reset to setup mode.`);
      setDiagnosticsPayload(null);
      setDiagnosticsDeviceId('');
      await refreshHouseholdSummary({ silent: true });
    } catch (error) {
      setDiagnosticsError(error instanceof Error ? error.message : 'Could not reset this device.');
    } finally {
      setDiagnosticsBusy(false);
    }
  }

  async function refreshOwnerConsole(deviceId = ownerDeviceId): Promise<void> {
    if (!session?.token || !deviceId) {
      return;
    }
    setOwnerConsoleBusy(true);
    setOwnerConsoleError('');
    setOwnerConsoleNotice('');
    try {
      const [status, providers, models, providerConfig, inference] = await Promise.all([
        getDeviceConfigStatus(session.token, deviceId),
        getDeviceProviders(session.token, deviceId),
        getDeviceOllamaModels(session.token, deviceId),
        getDeviceProviderConfig(session.token, deviceId),
        getDeviceInferenceDetail(session.token, deviceId),
      ]);
      setOwnerStatus(status);
      setOwnerProviders(providers);
      setOwnerModels(models);
      setOwnerProviderConfig(providerConfig);
      setOwnerOnboardProvider(providerConfig.defaultProvider || providers[0] || 'ollama');
      setOwnerOnboardModel(providerConfig.defaultModel || '');
      setOwnerInference(inference);
    } catch (error) {
      setOwnerConsoleError(error instanceof Error ? error.message : 'Could not load advanced device settings.');
    } finally {
      setOwnerConsoleBusy(false);
    }
  }

  async function saveOwnerProviderSettings(): Promise<void> {
    if (!session?.token || !ownerDeviceId) {
      return;
    }
    setOwnerConsoleBusy(true);
    setOwnerConsoleError('');
    setOwnerConsoleNotice('');
    try {
      await updateDeviceProviderConfig(session.token, ownerDeviceId, ownerProviderConfig);
      setOwnerConsoleNotice(`Saved provider settings for ${ownerDeviceId}.`);
      await refreshOwnerConsole(ownerDeviceId);
    } catch (error) {
      setOwnerConsoleError(error instanceof Error ? error.message : 'Could not save provider settings.');
      setOwnerConsoleBusy(false);
    }
  }

  async function runOwnerOnboard(): Promise<void> {
    if (!session?.token || !ownerDeviceId) {
      return;
    }
    setOwnerConsoleBusy(true);
    setOwnerConsoleError('');
    setOwnerConsoleNotice('');
    try {
      const result = await onboardDeviceProvider(session.token, ownerDeviceId, {
        provider: ownerOnboardProvider,
        model: ownerOnboardModel,
        apiKey: ownerOnboardApiKey,
        apiUrl: ownerOnboardApiUrl,
      });
      setOwnerServiceOutput(result.output);
      setOwnerConsoleNotice(`Re-onboard finished for ${ownerDeviceId}.`);
      await refreshOwnerConsole(ownerDeviceId);
    } catch (error) {
      setOwnerConsoleError(error instanceof Error ? error.message : 'Could not re-onboard provider settings.');
      setOwnerConsoleBusy(false);
    }
  }

  async function runOwnerServiceAction(
    serviceName: 'ollama' | 'zeroclaw',
    action: 'start' | 'stop' | 'restart',
  ): Promise<void> {
    if (!session?.token || !ownerDeviceId) {
      return;
    }
    setOwnerConsoleBusy(true);
    setOwnerConsoleError('');
    setOwnerConsoleNotice('');
    try {
      const result = await controlDeviceService(session.token, ownerDeviceId, serviceName, action);
      setOwnerServiceOutput(result.output);
      setOwnerConsoleNotice(`${serviceName} ${action} requested for ${ownerDeviceId}.`);
      await refreshOwnerConsole(ownerDeviceId);
    } catch (error) {
      setOwnerConsoleError(error instanceof Error ? error.message : 'Could not control this service.');
      setOwnerConsoleBusy(false);
    }
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

  if (shellSurface === 'shell' && session) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.shellScreen}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Sparkbox</Text>
            <Text style={styles.title}>{householdName}</Text>
            <Text style={styles.subtitle}>
              {shellTab === 'chats'
                ? "Choose a space first, then move into that space's topics and chats."
                : shellTab === 'library'
                  ? "See each space's context, then manage files and routines inside it."
                  : 'Manage the Box, the active space, family apps, and your signed-in Sparkbox session.'}
            </Text>
          </View>

          <View style={styles.shellTabBar}>
            {PHASE_ONE_TABS.map((tab) => {
              const active = tab.key === shellTab;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.shellTab, active ? styles.shellTabActive : null]}
                  onPress={() => setShellTab(tab.key)}
                >
                  <Text style={[styles.shellTabLabel, active ? styles.shellTabLabelActive : null]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {shellTab === 'settings' ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Household overview</Text>
                  <Text style={styles.cardCopy}>
                    {homeBusy
                      ? 'Refreshing your household status...'
                      : onlineDeviceAvailable
                        ? 'Sparkbox is ready for household chat.'
                        : 'Household history stays available even when Sparkbox is offline.'}
                  </Text>
                  {homeError ? <Text style={styles.errorText}>{homeError}</Text> : null}
                  {homeBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
                  <View style={styles.inlineActions}>
                    <Pressable style={styles.primaryButtonSmall} onPress={() => setShellTab('chats')}>
                      <Text style={styles.primaryButtonText}>Open chat</Text>
                    </Pressable>
                    {canManage ? (
                      <Pressable style={styles.secondaryButtonSmall} onPress={beginNewDeviceOnboarding}>
                        <Text style={styles.secondaryButtonText}>Set up another device</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Active space identity</Text>
                  <Text style={styles.cardCopy}>
                    {activeSpace
                      ? `${activeSpace.name} is the current ${activeSpaceKindLabel.toLowerCase()} and it already has ${activeSpace.threadCount} topics.`
                      : 'Pick a space in Chats so Library and Settings can follow that space identity.'}
                  </Text>
                  {activeSpace ? (
                    <View style={styles.deviceRowCard}>
                      <View style={styles.deviceRowHeadline}>
                        <Text style={styles.networkName}>{activeSpace.name}</Text>
                        <Text style={styles.tagMuted}>{activeSpaceKindLabel}</Text>
                      </View>
                      <Text style={styles.cardCopy}>
                        Template: {activeSpaceTemplateLabel || 'Household space'}
                      </Text>
                      <Text style={styles.cardCopy}>
                        {activeSpace.threadCount} topics · {activeSpace.memberCount} members
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Devices</Text>
                  {homeDevices.length === 0 ? (
                    <Text style={styles.cardCopy}>No devices connected yet.</Text>
                  ) : (
                    homeDevices.map((device) => (
                      <View key={device.device_id} style={styles.deviceRowCard}>
                        <View style={styles.deviceRowHeadline}>
                          <Text style={styles.networkName}>{device.device_id}</Text>
                          <Text style={device.online ? styles.statusTagOnline : styles.statusTagOffline}>
                            {device.online ? 'online' : 'offline'}
                          </Text>
                        </View>
                        <Text style={styles.cardCopy}>Status: {device.status}</Text>
                        {device.attention_reason ? <Text style={styles.cardCopy}>Attention: {device.attention_reason}</Text> : null}
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Recent Activity</Text>
                  {homeRecentActivity.length === 0 ? (
                    <Text style={styles.cardCopy}>No household activity yet.</Text>
                  ) : (
                    homeRecentActivity.slice(0, 5).map((event) => (
                      <View key={event.id} style={styles.deviceRowCard}>
                        <Text style={styles.networkName}>{event.actor_name}</Text>
                        <Text style={styles.cardCopy}>
                          {event.details || event.event_type}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </>
            ) : null}

            {shellTab === 'chats' ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Spaces</Text>
                  <Text style={styles.cardCopy}>
                    Pick a space first. Each space keeps its own topics and chat history.
                  </Text>
                  {spacesError ? <Text style={styles.errorText}>{spacesError}</Text> : null}
                  {spacesBusy && spaces.length === 0 ? <ActivityIndicator color="#0b6e4f" /> : null}
                  {spaces.map((space) => {
                    const active = space.id === activeSpaceId;
                    return (
                      <Pressable
                        key={space.id}
                        style={[styles.deviceRowCard, active ? styles.selectionCard : null]}
                        onPress={() => setActiveSpaceId(space.id)}
                      >
                        <View style={styles.deviceRowHeadline}>
                          <Text style={styles.networkName}>{space.name}</Text>
                          <Text style={active ? styles.statusTagOnline : styles.tagMuted}>{describeSpaceKind(space.kind)}</Text>
                        </View>
                        <Text style={styles.cardCopy}>
                          {space.threadCount} topics · {space.memberCount} members
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Topic chat</Text>
                  <Text style={styles.cardCopy}>
                    {onlineDeviceAvailable
                      ? activeSpace
                        ? `Current space: ${activeSpace.name} (${activeSpaceKindLabel})`
                        : 'Select a space to open its topics.'
                      : 'Sparkbox is offline right now. You can still browse chat history and settings.'}
                  </Text>
                  {chatSendPhase !== 'idle' ? (
                    <Text style={styles.selectionLabel}>{describeChatSendPhase(chatSendPhase)}</Text>
                  ) : null}
                  {chatError ? <Text style={styles.errorText}>{chatError}</Text> : null}
                  <View style={styles.scopeRow}>
                    {(['family', 'private'] as ChatSessionScope[]).map((scope) => {
                      const active = chatScope === scope;
                      return (
                        <Pressable
                          key={scope}
                          style={[styles.scopePill, active ? styles.scopePillActive : null]}
                          onPress={() => setChatScope(scope)}
                        >
                          <Text style={[styles.scopePillLabel, active ? styles.scopePillLabelActive : null]}>
                            {describeChatAccess(scope)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.inlineActions}>
                    <Pressable style={styles.secondaryButtonSmall} onPress={() => void refreshChatSessions()} disabled={chatBusy}>
                      <Text style={styles.secondaryButtonText}>Refresh</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.primaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
                      onPress={() => openChatSessionEditor()}
                      disabled={!onlineDeviceAvailable || chatBusy}
                    >
                      <Text style={styles.primaryButtonText}>New chat</Text>
                    </Pressable>
                  </View>
                  {chatBusy && chatSessions.length === 0 ? <ActivityIndicator color="#0b6e4f" /> : null}
                  {chatSessions.length === 0 ? (
                    <Text style={styles.cardCopy}>
                      No chats in this space yet.
                    </Text>
                  ) : (
                    chatSessions.map((sessionItem) => {
                      const active = sessionItem.id === activeChatSessionId;
                      return (
                        <Pressable
                          key={sessionItem.id}
                          style={[styles.deviceRowCard, active ? styles.selectionCard : null]}
                          onPress={() => setActiveChatSessionId(sessionItem.id)}
                        >
                          <View style={styles.deviceRowHeadline}>
                            <Text style={styles.networkName}>{sessionItem.name}</Text>
                            <Text style={active ? styles.statusTagOnline : styles.tagMuted}>
                              {describeChatAccess(sessionItem.scope)}
                            </Text>
                          </View>
                          <Text style={styles.cardCopy}>
                            {sessionItem.updatedAt ? `Updated ${sessionItem.updatedAt}` : 'New chat'}
                          </Text>
                          {sessionItem.systemPrompt ? (
                            <Text numberOfLines={2} style={styles.cardCopy}>
                              Prompt: {sessionItem.systemPrompt}
                            </Text>
                          ) : null}
                        </Pressable>
                      );
                    })
                  )}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Topics</Text>
                  <Text style={styles.cardCopy}>
                    {activeSpaceDetail
                      ? `${activeSpaceDetail.name} is organized around topics, not one endless chat.`
                      : 'Pick a space to see its default topics.'}
                  </Text>
                  {relayNotice ? <Text style={styles.noticeText}>{relayNotice}</Text> : null}
                  {activeSpaceDetail?.threads.length ? (
                    activeSpaceDetail.threads.map((thread) => (
                      <View key={thread.id} style={styles.deviceRowCard}>
                        <View style={styles.deviceRowHeadline}>
                          <Text style={styles.networkName}>{thread.title}</Text>
                          <Text style={styles.tagMuted}>topic</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.cardCopy}>No topics yet.</Text>
                  )}
                  {activeSpaceDetail?.kind === 'shared' ? (
                    <>
                      <Text style={styles.cardCopy}>
                        Pick one other member and ask Sparkbox to relay a note privately.
                      </Text>
                      <View style={styles.inlineActions}>
                        <Pressable
                          style={[
                            styles.primaryButtonSmall,
                            relayTargets.length === 0 ? styles.networkRowDisabled : null,
                          ]}
                          onPress={openRelayComposer}
                          disabled={relayTargets.length === 0}
                        >
                          <Text style={styles.primaryButtonText}>请 Sparkbox 帮我转述</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : null}
                  {activeSpaceDetail?.privateSideChannel?.available ? (
                    <View style={styles.deviceRowCard}>
                      <View style={styles.deviceRowHeadline}>
                        <Text style={styles.networkName}>{activeSpaceDetail.privateSideChannel.label}</Text>
                        <Text style={styles.tagMuted}>private</Text>
                      </View>
                      <Text style={styles.cardCopy}>
                        Ask Sparkbox privately about this shared space before you bring anything back into the group.
                      </Text>
                      <View style={styles.inlineActions}>
                        <Pressable
                          style={styles.primaryButtonSmall}
                          onPress={() => {
                            void openCurrentSpaceSideChannel();
                          }}
                        >
                          <Text style={styles.primaryButtonText}>Open private side chat</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                  {activeSpaceDetail?.enabledFamilyApps.length ? (
                    <>
                      <Text style={styles.selectionLabel}>Enabled in this space</Text>
                      {activeSpaceDetail.enabledFamilyApps.map((app) => (
                        <View key={app.slug} style={styles.deviceRowCard}>
                          <Text style={styles.networkName}>{app.title}</Text>
                          <Text style={styles.cardCopy}>
                            {Object.entries(app.config)
                              .map(([key, value]) => `${key}: ${String(value)}`)
                              .join(' · ') || 'Enabled'}
                          </Text>
                        </View>
                      ))}
                    </>
                  ) : null}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{activeChatSession?.name || 'Active topic chat'}</Text>
                  <Text style={styles.cardCopy}>
                    {activeChatSession
                      ? `Scope: ${describeChatAccess(activeChatSession.scope)}. Temperature ${activeChatSession.temperature}, max ${activeChatSession.maxTokens} tokens.`
                      : 'Pick or create a topic chat to continue.'}
                  </Text>
                  {activeChatSession ? (
                    <View style={styles.inlineActions}>
                      <Pressable style={styles.secondaryButtonSmall} onPress={() => openChatSessionEditor(activeChatSession)}>
                        <Text style={styles.secondaryButtonText}>Edit settings</Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void clearCurrentChatSession()}
                        disabled={chatBusy || !canManageActiveChat}
                      >
                        <Text style={styles.secondaryButtonText}>Clear messages</Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() =>
                          Alert.alert('Delete this chat?', 'Its message history will be removed.', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => void deleteCurrentChatSession() },
                          ])
                        }
                        disabled={chatBusy || !canManageActiveChat}
                      >
                        <Text style={styles.secondaryButtonText}>Delete chat</Text>
                      </Pressable>
                    </View>
                  ) : null}
                  {activeChatTimelineMessages.length === 0 ? (
                    <Text style={styles.cardCopy}>No messages yet in this chat.</Text>
                  ) : (
                    activeChatTimelineMessages.map((message, index) => (
                      <View
                        key={`${message.role}-${index}-${message.content}`}
                        style={[
                          styles.chatBubble,
                          message.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant,
                          message.pending ? styles.chatBubblePending : null,
                        ]}
                      >
                        <Text style={styles.selectionLabel}>
                          {message.pending
                            ? describeChatSendPhase(chatSendPhase) || 'Sparkbox'
                            : message.role === 'user'
                            ? message.senderDisplayName || 'You'
                            : 'Sparkbox'}
                        </Text>
                        <Text
                          style={[
                            styles.chatBubbleCopy,
                            message.role === 'user' ? styles.chatBubbleCopyUser : null,
                            message.pending ? styles.chatBubbleCopyPending : null,
                          ]}
                        >
                          {message.content}
                        </Text>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Send a message</Text>
                  <TextInput
                    placeholder={activeChatSession ? 'Ask this topic what happens next' : 'Pick a topic chat first'}
                    placeholderTextColor="#7e8a83"
                    style={[styles.input, styles.textArea]}
                    value={chatDraft}
                    onChangeText={setChatDraft}
                    multiline
                    numberOfLines={4}
                    editable={onlineDeviceAvailable && !chatBusy && Boolean(activeChatSessionId)}
                  />
                  <View style={styles.inlineActions}>
                    <Pressable
                      style={[
                        styles.primaryButtonSmall,
                        !onlineDeviceAvailable || !activeChatSessionId ? styles.networkRowDisabled : null,
                      ]}
                      onPress={() => void submitChatMessage()}
                      disabled={!onlineDeviceAvailable || chatBusy || !chatDraft.trim() || !activeChatSessionId}
                    >
                      {chatBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Send</Text>}
                    </Pressable>
                  </View>
                </View>
              </>
            ) : null}

            {shellTab === 'library' ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Space library</Text>
                  <Text style={styles.cardCopy}>
                    {activeSpace
                      ? `${activeSpace.name} (${activeSpaceKindLabel}) keeps its memories, summaries, photos, files, and tasks together.`
                      : 'Pick a space to browse its accumulated Sparkbox context.'}
                  </Text>
                  <View style={styles.libraryGrid}>
                    {libraryOverviewSections.map((section) => (
                      <View key={section.title} style={styles.librarySectionCard}>
                        <Text style={styles.librarySectionTitle}>{section.title}</Text>
                        <Text style={styles.librarySectionCopy}>{section.copy}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.cardCopy}>
                    Some sections still map to legacy storage and scheduler data, but they now live in one space library.
                  </Text>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Files in this space</Text>
                  <Text style={styles.cardCopy}>
                    {onlineDeviceAvailable
                      ? `Files are currently mapped from ${activeSpace ? activeSpaceKindLabel : 'the active space'} while the Jetson storage layer migrates.`
                      : 'Sparkbox needs to be online before files can be browsed or changed.'}
                  </Text>
                  {filesNotice ? <Text style={styles.noticeText}>{filesNotice}</Text> : null}
                  {filesError ? <Text style={styles.errorText}>{filesError}</Text> : null}
                  <View style={styles.scopeRow}>
                    {(['family', 'private'] as HouseholdFileSpace[]).map((space) => {
                      const active = fileSpace === space;
                      return (
                        <Pressable
                          key={space}
                          style={[styles.scopePill, active ? styles.scopePillActive : null]}
                          onPress={() => setFileSpace(space)}
                        >
                          <Text style={[styles.scopePillLabel, active ? styles.scopePillLabelActive : null]}>
                            {describeChatAccess(space)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={styles.cardCopy}>
                    Location: /{currentFilePath || (fileSpace === 'family' ? 'family' : 'private')}
                  </Text>
                  <View style={styles.inlineActions}>
                    <Pressable
                      style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
                      onPress={() => void refreshFiles()}
                      disabled={!onlineDeviceAvailable || filesBusy}
                    >
                      <Text style={styles.secondaryButtonText}>Refresh</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
                      onPress={() => openFileEditor('mkdir')}
                      disabled={!onlineDeviceAvailable || filesBusy}
                    >
                      <Text style={styles.secondaryButtonText}>New folder</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.primaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
                      onPress={() => void pickAndUploadFiles()}
                      disabled={!onlineDeviceAvailable || filesBusy}
                    >
                      <Text style={styles.primaryButtonText}>Upload</Text>
                    </Pressable>
                  </View>
                  {fileListing?.parent ? (
                    <Pressable style={styles.secondaryButtonSmall} onPress={() => void refreshFiles(fileListing.parent || '')}>
                      <Text style={styles.secondaryButtonText}>Go up</Text>
                    </Pressable>
                  ) : null}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{fileSpace === 'family' ? 'Shared space files' : 'Private space files'}</Text>
                  {filesBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
                  {!filesBusy && (fileListing?.entries.length ?? 0) === 0 ? (
                    <Text style={styles.cardCopy}>Nothing is stored here yet.</Text>
                  ) : null}
                  {fileListing?.entries.map((entry) => (
                    <View key={entry.path} style={styles.deviceRowCard}>
                      <View style={styles.deviceRowHeadline}>
                        <Text style={styles.networkName}>{entry.name}</Text>
                        <Text style={entry.isDir ? styles.statusTagOnline : styles.statusTagOffline}>
                          {entry.isDir ? 'folder' : 'file'}
                        </Text>
                      </View>
                      <Text style={styles.cardCopy}>
                        {entry.modified ? `Updated ${entry.modified}` : 'Stored on Sparkbox'}
                        {typeof entry.size === 'number' ? ` · ${entry.size} bytes` : ''}
                      </Text>
                      {fileSpace === 'family' && entry.uploadedByUserId ? (
                        <Text style={styles.cardCopy}>
                          {entry.uploadedByUserId === session.user.id ? 'Uploaded by you' : `Uploaded by ${entry.uploadedByUserId}`}
                        </Text>
                      ) : null}
                      <View style={styles.inlineActions}>
                        {entry.isDir ? (
                          <Pressable
                            style={styles.secondaryButtonSmall}
                            onPress={() => void refreshFiles(entry.path)}
                          >
                            <Text style={styles.secondaryButtonText}>Open</Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            style={styles.secondaryButtonSmall}
                            onPress={() => void downloadFileEntry(entry)}
                            disabled={filesBusy}
                          >
                            <Text style={styles.secondaryButtonText}>Download</Text>
                          </Pressable>
                        )}
                        {canManageFileEntry(entry) ? (
                          <>
                            <Pressable
                              style={styles.secondaryButtonSmall}
                              onPress={() => openFileEditor('rename', entry)}
                              disabled={filesBusy}
                            >
                              <Text style={styles.secondaryButtonText}>Rename</Text>
                            </Pressable>
                            <Pressable
                              style={styles.secondaryButtonSmall}
                              onPress={() => void deleteFileEntry(entry)}
                              disabled={filesBusy}
                            >
                              <Text style={styles.secondaryButtonText}>Delete</Text>
                            </Pressable>
                          </>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {shellTab === 'library' ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Household Tasks</Text>
                  <Text style={styles.cardCopy}>
                    {onlineDeviceAvailable
                      ? `Tasks are currently mapped from ${activeSpace ? activeSpaceKindLabel : 'the active space'} while the Jetson scheduler stays on the legacy scope model.`
                      : 'Sparkbox needs to be online before tasks can be loaded or changed.'}
                  </Text>
                  {tasksNotice ? <Text style={styles.noticeText}>{tasksNotice}</Text> : null}
                  {tasksError ? <Text style={styles.errorText}>{tasksError}</Text> : null}
                  <View style={styles.inlineActions}>
                    <Pressable
                      style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
                      onPress={() => void refreshTasks()}
                      disabled={!onlineDeviceAvailable || tasksBusy}
                    >
                      <Text style={styles.secondaryButtonText}>Refresh</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.primaryButtonSmall, (!onlineDeviceAvailable || !canCreateTasks) ? styles.networkRowDisabled : null]}
                      onPress={() => openTaskEditor()}
                      disabled={!onlineDeviceAvailable || !canCreateTasks}
                    >
                      <Text style={styles.primaryButtonText}>New task</Text>
                    </Pressable>
                  </View>
                  <View style={styles.scopeRow}>
                    {(['family', 'private'] as HouseholdTaskScope[]).map((scope) => {
                      const active = taskScope === scope;
                      return (
                        <Pressable
                          key={scope}
                          style={[styles.scopePill, active ? styles.scopePillActive : null]}
                          onPress={() => setTaskScope(scope)}
                        >
                          <Text style={[styles.scopePillLabel, active ? styles.scopePillLabelActive : null]}>
                            {describeChatAccess(scope)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {!canManage && taskScope === 'family' ? (
                    <Text style={styles.cardCopy}>
                      Members can run shared ZeroClaw family tasks, but only owners can create or edit them.
                    </Text>
                  ) : null}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{taskScope === 'family' ? 'Shared space routines' : 'Private space routines'}</Text>
                  {tasksBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
                  {!tasksBusy && tasks.length === 0 ? (
                    <Text style={styles.cardCopy}>
                      {taskScope === 'family'
                        ? 'No shared Sparkbox tasks yet.'
                        : 'No private Sparkbox tasks yet.'}
                    </Text>
                  ) : null}
                  {tasks.map((task) => (
                    <View key={task.id} style={styles.deviceRowCard}>
                      <View style={styles.deviceRowHeadline}>
                        <Text style={styles.networkName}>{task.name}</Text>
                        <Text style={task.enabled ? styles.statusTagOnline : styles.statusTagOffline}>
                          {task.enabled ? 'enabled' : 'paused'}
                        </Text>
                      </View>
                      <Text style={styles.cardCopy}>Schedule: {task.cronExpr}</Text>
                      <Text style={styles.cardCopy}>
                        Type: {task.commandType} · Scope: {task.scope}
                      </Text>
                      {task.lastStatus ? (
                        <Text style={styles.cardCopy}>
                          Last run: {task.lastStatus}
                          {task.lastRunAt ? ` · ${task.lastRunAt}` : ''}
                        </Text>
                      ) : null}
                      {task.lastOutput ? (
                        <Text numberOfLines={3} style={styles.cardCopy}>
                          Output: {task.lastOutput}
                        </Text>
                      ) : null}
                      <View style={styles.inlineActions}>
                        <Pressable
                          style={[styles.secondaryButtonSmall, !canTriggerTask(task) ? styles.networkRowDisabled : null]}
                          onPress={() => void runTaskNow(task)}
                          disabled={!canTriggerTask(task) || tasksBusy}
                        >
                          <Text style={styles.secondaryButtonText}>Run now</Text>
                        </Pressable>
                        <Pressable
                          style={styles.secondaryButtonSmall}
                          onPress={() => void openTaskHistory(task)}
                          disabled={tasksBusy}
                        >
                          <Text style={styles.secondaryButtonText}>History</Text>
                        </Pressable>
                        {canEditTask(task) ? (
                          <>
                            <Pressable
                              style={styles.secondaryButtonSmall}
                              onPress={() => openTaskEditor(task)}
                              disabled={tasksBusy}
                            >
                              <Text style={styles.secondaryButtonText}>Edit</Text>
                            </Pressable>
                            <Pressable
                              style={styles.secondaryButtonSmall}
                              onPress={() => void removeTask(task)}
                              disabled={tasksBusy}
                            >
                              <Text style={styles.secondaryButtonText}>Delete</Text>
                            </Pressable>
                          </>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {shellTab === 'settings' ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Settings</Text>
                  <Text style={styles.cardCopy}>
                    Signed in as {session.user.display_name}. Role: {session.user.role}.
                  </Text>
                  {settingsNotice ? <Text style={styles.noticeText}>{settingsNotice}</Text> : null}
                  {settingsError ? <Text style={styles.errorText}>{settingsError}</Text> : null}
                  <View style={styles.inlineActions}>
                    <Pressable style={styles.secondaryButtonSmall} onPress={() => void logout()}>
                      <Text style={styles.secondaryButtonText}>Sign out</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Devices and Network</Text>
                  <Text style={styles.cardCopy}>
                    Change Wi-Fi from here without scanning the device again. Sparkbox stays in your household while the app walks through setup mode.
                  </Text>
                  {homeDevices.map((device) => (
                    <View key={device.device_id} style={styles.deviceRowCard}>
                      <Text style={styles.networkName}>{device.device_id}</Text>
                      <Text style={styles.cardCopy}>{device.status}</Text>
                      <View style={styles.inlineActions}>
                        <Pressable
                          style={styles.secondaryButtonSmall}
                          onPress={() => void beginDeviceReprovision(device)}
                          disabled={!canManage}
                        >
                          <Text style={styles.secondaryButtonText}>Change Wi-Fi</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>

                {canManage ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Inspiration Square</Text>
                    <Text style={styles.cardCopy}>
                      Install a family app once on this Box, then enable it in the spaces where it belongs. This is where Box learns new family-friendly behaviors.
                    </Text>
                    {familyAppsBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
                    {activeSpace && recommendedFamilyApps.length > 0 ? (
                      <>
                        <Text style={styles.selectionLabel}>Recommended for {activeSpace.name}</Text>
                        {recommendedFamilyApps.map((app) => (
                          <View key={`recommended-${app.slug}`} style={styles.deviceRowCard}>
                            <View style={styles.deviceRowHeadline}>
                              <Text style={styles.networkName}>{app.title}</Text>
                              <Text style={styles.tagMuted}>{activeSpaceTemplateLabel || 'space'}</Text>
                            </View>
                            {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
                            <Text style={styles.cardCopy}>
                              Works in: {formatSpaceTemplateList(app.spaceTemplates) || 'Any space'}
                            </Text>
                            {app.capabilities.length > 0 ? (
                              <Text style={styles.cardCopy}>Capabilities: {app.capabilities.join(' · ')}</Text>
                            ) : null}
                            <View style={styles.inlineActions}>
                              <Pressable
                                style={styles.primaryButtonSmall}
                                onPress={() => void installSelectedFamilyApp(app.slug)}
                                disabled={settingsBusy}
                              >
                                <Text style={styles.primaryButtonText}>Install for this Box</Text>
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </>
                    ) : null}
                    {installedFamilyApps.length > 0 ? (
                      <>
                        <Text style={styles.selectionLabel}>Installed on this Box</Text>
                        {installedFamilyApps.map((app) => (
                          <View key={`installed-${app.slug}`} style={styles.deviceRowCard}>
                            <View style={styles.deviceRowHeadline}>
                              <Text style={styles.networkName}>{app.title}</Text>
                              <Text style={styles.statusTagOnline}>installed</Text>
                            </View>
                            {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
                            <Text style={styles.cardCopy}>
                              Works in: {formatSpaceTemplateList(app.spaceTemplates) || 'Any space'}
                            </Text>
                            <Text style={styles.cardCopy}>
                              {app.supportsProactiveMessages ? 'Proactive' : 'On demand only'}
                              {app.supportsPrivateRelay ? ' · Private relay' : ''}
                              {app.requiresOwnerConfirmation ? ' · Owner confirmation' : ''}
                            </Text>
                          </View>
                        ))}
                      </>
                    ) : null}
                    <Text style={styles.selectionLabel}>Available for this Box</Text>
                    {availableFamilyApps.map((app) => (
                      <View key={`catalog-${app.slug}`} style={styles.deviceRowCard}>
                          <View style={styles.deviceRowHeadline}>
                            <Text style={styles.networkName}>{app.title}</Text>
                            <Text style={styles.tagMuted}>{app.riskLevel}</Text>
                          </View>
                          {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
                          <Text style={styles.cardCopy}>
                            Works in: {formatSpaceTemplateList(app.spaceTemplates) || 'Any space'}
                          </Text>
                          {app.capabilities.length > 0 ? (
                            <Text style={styles.cardCopy}>Capabilities: {app.capabilities.join(' · ')}</Text>
                          ) : null}
                          <View style={styles.inlineActions}>
                            <Pressable
                              style={styles.primaryButtonSmall}
                              onPress={() => void installSelectedFamilyApp(app.slug)}
                              disabled={settingsBusy}
                            >
                              <Text style={styles.primaryButtonText}>Install</Text>
                            </Pressable>
                          </View>
                        </View>
                      ))}
                  </View>
                ) : null}

                {canManage ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Advanced device settings</Text>
                    <Text style={styles.cardCopy}>
                      Owner-only controls for provider defaults, local models, inference load, and service management.
                    </Text>
                    <View style={styles.scopeRow}>
                      {homeDevices.map((device) => {
                        const active = ownerDeviceId === device.device_id;
                        return (
                          <Pressable
                            key={`owner-device-${device.device_id}`}
                            style={[styles.scopePill, active ? styles.scopePillActive : null]}
                            onPress={() => setOwnerDeviceId(device.device_id)}
                            disabled={ownerConsoleBusy}
                          >
                            <Text style={[styles.scopePillLabel, active ? styles.scopePillLabelActive : null]}>
                              {device.device_id}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={styles.inlineActions}>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void refreshOwnerConsole()}
                        disabled={!ownerDeviceId || ownerConsoleBusy}
                      >
                        <Text style={styles.secondaryButtonText}>Refresh advanced status</Text>
                      </Pressable>
                    </View>
                    {ownerConsoleError ? <Text style={styles.errorText}>{ownerConsoleError}</Text> : null}
                    {ownerConsoleNotice ? <Text style={styles.noticeText}>{ownerConsoleNotice}</Text> : null}
                    {ownerConsoleBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
                    {ownerStatus ? (
                      <View style={styles.deviceRowCard}>
                        <Text style={styles.networkName}>{ownerDeviceId || 'Sparkbox'} overview</Text>
                        <Text style={styles.cardCopy}>
                          Ollama: {ownerStatus.ollama?.service || 'unknown'} · API {ownerStatus.ollama?.api || 'unknown'}
                        </Text>
                        <Text style={styles.cardCopy}>
                          ZeroClaw daemon: {ownerStatus.zeroclaw?.components?.daemon?.status || 'unknown'} · gateway {ownerStatus.zeroclaw?.components?.gateway?.status || 'unknown'}
                        </Text>
                        <Text style={styles.cardCopy}>
                          Inference queue: {ownerStatus.inference?.queued_requests ?? 0}/{ownerStatus.inference?.queue_limit ?? 0}
                          {ownerStatus.inference?.active ? ' · busy' : ' · idle'}
                        </Text>
                        {ownerStatus.system ? (
                          <Text style={styles.cardCopy}>
                            CPU {ownerStatus.system.cpu_percent ?? 0}% · Memory {ownerStatus.system.memory?.used_percent ?? 0}%/{ownerStatus.system.memory?.total_gb ?? 0} GB · Disk {ownerStatus.system.disk?.used_percent ?? 0}%/{ownerStatus.system.disk?.total_gb ?? 0} GB
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {canManage ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Provider defaults</Text>
                    <Text style={styles.cardCopy}>
                      Keep one shared default model for household chat, then re-run onboarding if provider credentials changed.
                    </Text>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="Default provider"
                      placeholderTextColor="#7e8a83"
                      style={styles.input}
                      value={ownerProviderConfig.defaultProvider}
                      onChangeText={(value) =>
                        setOwnerProviderConfig((current) => ({
                          ...current,
                          defaultProvider: value,
                        }))
                      }
                    />
                    {ownerProviders.length ? (
                      <View style={styles.scopeRow}>
                        {ownerProviders.map((provider) => {
                          const active = ownerProviderConfig.defaultProvider === provider;
                          return (
                            <Pressable
                              key={`provider-${provider}`}
                              style={[styles.scopePill, active ? styles.scopePillActive : null]}
                              onPress={() =>
                                setOwnerProviderConfig((current) => ({
                                  ...current,
                                  defaultProvider: provider,
                                }))
                              }
                            >
                              <Text style={[styles.scopePillLabel, active ? styles.scopePillLabelActive : null]}>
                                {provider}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="Default model"
                      placeholderTextColor="#7e8a83"
                      style={styles.input}
                      value={ownerProviderConfig.defaultModel}
                      onChangeText={(value) =>
                        setOwnerProviderConfig((current) => ({
                          ...current,
                          defaultModel: value,
                        }))
                      }
                    />
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="number-pad"
                      placeholder="Provider timeout (seconds)"
                      placeholderTextColor="#7e8a83"
                      style={styles.input}
                      value={String(ownerProviderConfig.providerTimeoutSecs)}
                      onChangeText={(value) =>
                        setOwnerProviderConfig((current) => ({
                          ...current,
                          providerTimeoutSecs: Number.parseInt(value || '0', 10) || 0,
                        }))
                      }
                    />
                    <Pressable
                      style={styles.primaryButtonSmall}
                      onPress={() => void saveOwnerProviderSettings()}
                      disabled={!ownerDeviceId || ownerConsoleBusy}
                    >
                      <Text style={styles.primaryButtonText}>Save provider defaults</Text>
                    </Pressable>
                    {ownerModels.length ? (
                      <View style={styles.deviceRowCard}>
                        <Text style={styles.networkName}>Local models</Text>
                        {ownerModels.map((model) => (
                          <Text key={model.name} style={styles.cardCopy}>
                            {model.name}
                            {typeof model.size === 'number' ? ` · ${model.size} bytes` : ''}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {canManage ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Re-onboard provider</Text>
                    <Text style={styles.cardCopy}>
                      Use this only when credentials or provider endpoints changed and Sparkbox needs a fresh ZeroClaw onboarding pass.
                    </Text>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="Provider"
                      placeholderTextColor="#7e8a83"
                      style={styles.input}
                      value={ownerOnboardProvider}
                      onChangeText={setOwnerOnboardProvider}
                    />
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="Model"
                      placeholderTextColor="#7e8a83"
                      style={styles.input}
                      value={ownerOnboardModel}
                      onChangeText={setOwnerOnboardModel}
                    />
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry
                      placeholder="API key"
                      placeholderTextColor="#7e8a83"
                      style={styles.input}
                      value={ownerOnboardApiKey}
                      onChangeText={setOwnerOnboardApiKey}
                    />
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="API URL (optional)"
                      placeholderTextColor="#7e8a83"
                      style={styles.input}
                      value={ownerOnboardApiUrl}
                      onChangeText={setOwnerOnboardApiUrl}
                    />
                    <Pressable
                      style={styles.primaryButtonSmall}
                      onPress={() => void runOwnerOnboard()}
                      disabled={!ownerDeviceId || ownerConsoleBusy}
                    >
                      <Text style={styles.primaryButtonText}>Run onboard</Text>
                    </Pressable>
                    {ownerServiceOutput ? <Text style={styles.cardCopy}>{ownerServiceOutput}</Text> : null}
                  </View>
                ) : null}

                {canManage ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Inference and services</Text>
                    <Text style={styles.cardCopy}>
                      See queue pressure for shared chat, then start, stop, or restart core services without leaving the app.
                    </Text>
                    {ownerInference ? (
                      <View style={styles.deviceRowCard}>
                        <Text style={styles.networkName}>Inference queue</Text>
                        <Text style={styles.cardCopy}>
                          {ownerInference.queued_requests} queued of {ownerInference.queue_limit}
                        </Text>
                        <Text style={styles.cardCopy}>
                          Active request: {ownerInference.active_request?.username || 'Idle'}
                        </Text>
                        {ownerInference.queue.map((item) => (
                          <Text key={item.request_id || `${item.username}-${item.position}`} style={styles.cardCopy}>
                            #{item.position ?? '?'} · {item.username || 'Unknown'}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                    <View style={styles.inlineActions}>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void runOwnerServiceAction('ollama', 'restart')}
                        disabled={!ownerDeviceId || ownerConsoleBusy}
                      >
                        <Text style={styles.secondaryButtonText}>Restart Ollama</Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void runOwnerServiceAction('zeroclaw', 'restart')}
                        disabled={!ownerDeviceId || ownerConsoleBusy}
                      >
                        <Text style={styles.secondaryButtonText}>Restart ZeroClaw</Text>
                      </Pressable>
                    </View>
                    <View style={styles.inlineActions}>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void runOwnerServiceAction('ollama', 'stop')}
                        disabled={!ownerDeviceId || ownerConsoleBusy}
                      >
                        <Text style={styles.secondaryButtonText}>Stop Ollama</Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void runOwnerServiceAction('ollama', 'start')}
                        disabled={!ownerDeviceId || ownerConsoleBusy}
                      >
                        <Text style={styles.secondaryButtonText}>Start Ollama</Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void runOwnerServiceAction('zeroclaw', 'stop')}
                        disabled={!ownerDeviceId || ownerConsoleBusy}
                      >
                        <Text style={styles.secondaryButtonText}>Stop ZeroClaw</Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void runOwnerServiceAction('zeroclaw', 'start')}
                        disabled={!ownerDeviceId || ownerConsoleBusy}
                      >
                        <Text style={styles.secondaryButtonText}>Start ZeroClaw</Text>
                      </Pressable>
                    </View>
                    {ownerServiceOutput ? <Text style={styles.cardCopy}>{ownerServiceOutput}</Text> : null}
                  </View>
                ) : null}

                {canManage ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Diagnostics and reset</Text>
                    <Text style={styles.cardCopy}>
                      Owners can inspect Sparkbox health and send a full reset back to setup mode from here.
                    </Text>
                    {diagnosticsError ? <Text style={styles.errorText}>{diagnosticsError}</Text> : null}
                    {homeDevices.map((device) => (
                      <View key={`diag-${device.device_id}`} style={styles.deviceRowCard}>
                        <Text style={styles.networkName}>{device.device_id}</Text>
                        <Text style={styles.cardCopy}>
                          {device.last_health_check_summary || device.status}
                        </Text>
                        <View style={styles.inlineActions}>
                          <Pressable
                            style={styles.secondaryButtonSmall}
                            onPress={() => void loadDiagnostics(device.device_id)}
                            disabled={diagnosticsBusy}
                          >
                            <Text style={styles.secondaryButtonText}>Run diagnostics</Text>
                          </Pressable>
                          <Pressable
                            style={styles.secondaryButtonSmall}
                            onPress={() =>
                              Alert.alert(
                                'Reset Sparkbox?',
                                'This sends the device back to setup mode and removes it from the household until it is set up again.',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  { text: 'Reset', style: 'destructive', onPress: () => void factoryResetDevice(device) },
                                ],
                              )
                            }
                            disabled={diagnosticsBusy}
                          >
                            <Text style={styles.secondaryButtonText}>Factory reset</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                    {diagnosticsBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
                    {diagnosticsPayload ? (
                      <View style={styles.deviceRowCard}>
                        <Text style={styles.networkName}>
                          {diagnosticsDeviceId} diagnostics
                        </Text>
                        <Text style={styles.cardCopy}>
                          Source: {diagnosticsPayload.cache?.source || 'live'}
                          {diagnosticsPayload.cache?.summary ? ` · ${diagnosticsPayload.cache.summary}` : ''}
                        </Text>
                        {diagnosticsPayload.network?.wifi_interface ? (
                          <Text style={styles.cardCopy}>
                            Wi-Fi: {diagnosticsPayload.network.wifi_interface} · {diagnosticsPayload.network.wifi_radio || 'unknown'}
                          </Text>
                        ) : null}
                        {diagnosticsPayload.network?.preflight?.reasons?.length ? (
                          <Text style={styles.cardCopy}>
                            Preflight: {diagnosticsPayload.network.preflight.reasons.join(', ')}
                          </Text>
                        ) : null}
                        {diagnosticsPayload.self_heal?.plan?.issues?.length ? (
                          <Text style={styles.cardCopy}>
                            Issues: {diagnosticsPayload.self_heal.plan.issues.map((issue) => issue.reason).join(', ')}
                          </Text>
                        ) : null}
                        {diagnosticsPayload.system?.memory ? (
                          <Text style={styles.cardCopy}>
                            Memory: {diagnosticsPayload.system.memory.used_percent}% of {diagnosticsPayload.system.memory.total_gb} GB
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Household members</Text>
                  <Text style={styles.cardCopy}>
                    Owners can invite, promote, demote, and remove household members. Sparkbox always keeps at least one owner.
                  </Text>
                  {homeMembers.map((member) => {
                    const isSelf = member.id === session.user.id;
                    return (
                      <View key={member.id} style={styles.deviceRowCard}>
                        <Text style={styles.networkName}>{member.display_name}</Text>
                        <Text style={styles.cardCopy}>{member.role}</Text>
                        {canManage && !isSelf ? (
                          <View style={styles.inlineActions}>
                            <Pressable
                              style={styles.secondaryButtonSmall}
                              onPress={() => void changeMemberRole(member, member.role === 'owner' ? 'member' : 'owner')}
                              disabled={settingsBusy}
                            >
                              <Text style={styles.secondaryButtonText}>
                                {member.role === 'owner' ? 'Make member' : 'Make owner'}
                              </Text>
                            </Pressable>
                            <Pressable
                              style={styles.secondaryButtonSmall}
                              onPress={() => void removeMember(member)}
                              disabled={settingsBusy}
                            >
                              <Text style={styles.secondaryButtonText}>Remove</Text>
                            </Pressable>
                          </View>
                        ) : isSelf ? (
                          <Text style={styles.cardCopy}>This is you.</Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>

                {canManage ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Invites</Text>
                    <Text style={styles.cardCopy}>
                      Create member or owner invites from here. People joining by invite go straight into this household.
                    </Text>
                    <View style={styles.inlineActions}>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void generateInvite('member')}
                        disabled={settingsBusy}
                      >
                        <Text style={styles.secondaryButtonText}>Invite member</Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void generateInvite('owner')}
                        disabled={settingsBusy}
                      >
                        <Text style={styles.secondaryButtonText}>Invite owner</Text>
                      </Pressable>
                    </View>
                    {homePendingInvites.length === 0 ? (
                      <Text style={styles.cardCopy}>No active invites right now.</Text>
                    ) : (
                      homePendingInvites.map((invite) => (
                        <View key={invite.id} style={styles.deviceRowCard}>
                          <Text style={styles.networkName}>{invite.role} invite</Text>
                          <Text style={styles.cardCopy}>Code: {invite.invite_code || 'hidden'}</Text>
                          <Text style={styles.cardCopy}>Expires: {invite.expires_at}</Text>
                          <View style={styles.inlineActions}>
                            <Pressable
                              style={styles.secondaryButtonSmall}
                              onPress={() => void revokeInvite(invite)}
                              disabled={settingsBusy}
                            >
                              <Text style={styles.secondaryButtonText}>Revoke</Text>
                            </Pressable>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                ) : null}
              </>
            ) : null}
          </ScrollView>

          <Modal
            animationType="slide"
            transparent
            visible={chatSessionEditorOpen}
            onRequestClose={() => setChatSessionEditorOpen(false)}
          >
            <View style={styles.scannerOverlay}>
              <View style={[styles.card, { width: '100%', maxWidth: 560 }]}>
                <Text style={styles.selectionLabel}>{editingChatSession ? 'Edit chat' : 'New chat'}</Text>
                <Text style={styles.selectionTitle}>
                  {editingChatSession ? 'Update chat settings' : `Create a ${chatScope} chat`}
                </Text>
                <Text style={styles.selectionCopy}>
                  Give the chat a clear name, then adjust its system prompt and response style if needed.
                </Text>
                <TextInput
                  placeholder="Chat name"
                  placeholderTextColor="#7e8a83"
                  style={styles.input}
                  value={chatSessionName}
                  onChangeText={setChatSessionName}
                />
                <TextInput
                  placeholder="System prompt (optional)"
                  placeholderTextColor="#7e8a83"
                  style={[styles.input, styles.textArea]}
                  value={chatSessionSystemPrompt}
                  onChangeText={setChatSessionSystemPrompt}
                  multiline
                />
                <TextInput
                  placeholder="Temperature"
                  placeholderTextColor="#7e8a83"
                  style={styles.input}
                  value={chatSessionTemperature}
                  onChangeText={setChatSessionTemperature}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  placeholder="Max tokens"
                  placeholderTextColor="#7e8a83"
                  style={styles.input}
                  value={chatSessionMaxTokens}
                  onChangeText={setChatSessionMaxTokens}
                  keyboardType="number-pad"
                />
                {chatError ? <Text style={styles.errorText}>{chatError}</Text> : null}
                <View style={styles.inlineActions}>
                  <Pressable
                    style={styles.secondaryButtonSmall}
                    onPress={() => setChatSessionEditorOpen(false)}
                    disabled={chatBusy}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.primaryButtonSmall}
                    onPress={() => void submitChatSessionEditor()}
                    disabled={chatBusy}
                  >
                    {chatBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{editingChatSession ? 'Save chat' : 'Create chat'}</Text>}
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent
            visible={taskHistoryOpen}
            onRequestClose={() => setTaskHistoryOpen(false)}
          >
            <View style={styles.scannerOverlay}>
              <View style={[styles.card, { width: '100%', maxWidth: 560, maxHeight: '80%' }]}>
                <Text style={styles.selectionLabel}>Run history</Text>
                <Text style={styles.selectionTitle}>{taskHistoryTask?.name || 'Task history'}</Text>
                <Text style={styles.selectionCopy}>
                  Review recent runs, their status, and any captured output without leaving the task tab.
                </Text>
                <ScrollView style={{ maxHeight: 360 }}>
                  {taskHistoryRuns.length === 0 ? (
                    <Text style={styles.cardCopy}>No runs yet.</Text>
                  ) : (
                    taskHistoryRuns.map((run) => (
                      <View key={run.id} style={styles.deviceRowCard}>
                        <View style={styles.deviceRowHeadline}>
                          <Text style={styles.networkName}>{run.status}</Text>
                          <Text style={run.status === 'success' ? styles.statusTagOnline : styles.statusTagOffline}>
                            {run.startedAt}
                          </Text>
                        </View>
                        {run.finishedAt ? <Text style={styles.cardCopy}>Finished: {run.finishedAt}</Text> : null}
                        {run.output ? <Text style={styles.cardCopy}>{run.output}</Text> : null}
                      </View>
                    ))
                  )}
                </ScrollView>
                <View style={styles.inlineActions}>
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => setTaskHistoryOpen(false)}>
                    <Text style={styles.secondaryButtonText}>Close</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            presentationStyle="overFullScreen"
            transparent
            visible={relayComposerOpen}
            onRequestClose={() => setRelayComposerOpen(false)}
          >
            <View style={styles.networkSheetBackdrop}>
              <View style={styles.networkSheetCard}>
                <Text style={styles.selectionLabel}>Relay message</Text>
                <Text style={styles.selectionTitle}>请 Sparkbox 帮我转述</Text>
                <Text style={styles.selectionCopy}>
                  Choose one other member in this shared space, then write the note Sparkbox should pass along privately.
                </Text>
                <Text style={styles.selectionLabel}>Send to</Text>
                <View style={styles.scopeRow}>
                  {relayTargets.map((member) => {
                    const active = relayTargetUserId === member.id;
                    return (
                      <Pressable
                        key={member.id}
                        style={[styles.scopePill, active ? styles.scopePillActive : null]}
                        onPress={() => setRelayTargetUserId(member.id)}
                      >
                        <Text style={[styles.scopePillLabel, active ? styles.scopePillLabelActive : null]}>
                          {member.displayName}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  multiline
                  numberOfLines={4}
                  placeholder="Write the message Sparkbox should relay"
                  placeholderTextColor="#7e8a83"
                  style={[styles.input, styles.textArea]}
                  value={relayMessage}
                  onChangeText={setRelayMessage}
                />
                {relayError ? <Text style={styles.errorText}>{relayError}</Text> : null}
                <View style={styles.inlineActions}>
                  <Pressable
                    style={styles.secondaryButtonSmall}
                    onPress={() => setRelayComposerOpen(false)}
                    disabled={relayBusy}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryButtonSmall, relayTargets.length === 0 ? styles.networkRowDisabled : null]}
                    onPress={() => void submitRelayMessage()}
                    disabled={relayBusy || relayTargets.length === 0}
                  >
                    {relayBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Relay</Text>}
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Sparkbox setup</Text>
          <Text style={styles.title}>Attach first. Bring it online second.</Text>
          <Text style={styles.subtitle}>
            Scan the device label, reserve Sparkbox for {householdName}, then let the app move through Sparkbox setup mode.
          </Text>
        </View>

        <View style={styles.stepRail}>
          {[1, 2, 3, 4].map((step) => {
            const done = step < activeStep;
            const current = step === activeStep;
            return (
              <View
                key={step}
                style={[
                  styles.stepRailItem,
                  done ? styles.stepRailItemDone : null,
                  current ? styles.stepRailItemCurrent : null,
                ]}
              >
                <Text style={[
                  styles.stepRailNumber,
                  done || current ? styles.stepRailNumberActive : null,
                ]}>
                  {step}
                </Text>
                <Text style={[
                  styles.stepRailLabel,
                  done || current ? styles.stepRailLabelActive : null,
                ]}>
                  {setupStepLabels[step - 1]}
                </Text>
              </View>
            );
          })}
        </View>

        {!session ? (
          <View style={styles.card} onLayout={(event) => captureStepOffset(1, event)}>
            <Text style={styles.cardTitle}>{authCardTitle}</Text>
            <Text style={styles.cardCopy}>{authCardCopy}</Text>
            <View style={styles.authModeRow}>
              {([
                { id: 'login', label: 'Sign in' },
                { id: 'register', label: 'Create' },
                { id: 'join', label: 'Join' },
              ] as Array<{ id: AuthMode; label: string }>).map((modeOption) => {
                const active = authMode === modeOption.id;
                return (
                  <Pressable
                    key={modeOption.id}
                    style={[styles.scopePill, active ? styles.scopePillActive : null]}
                    onPress={() => {
                      setAuthMode(modeOption.id);
                      setAuthError('');
                    }}
                  >
                    <Text style={[styles.scopePillLabel, active ? styles.scopePillLabelActive : null]}>
                      {modeOption.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
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
            {authMode === 'register' || authMode === 'join' ? (
              <TextInput
                placeholder="Display name"
                placeholderTextColor="#7e8a83"
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
              />
            ) : null}
            {authMode === 'join' ? (
              <TextInput
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="Invite code"
                placeholderTextColor="#7e8a83"
                style={styles.input}
                value={inviteCode}
                onChangeText={setInviteCode}
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
              {authBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{authSubmitLabel}</Text>}
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

        {session && claimStepVisible ? (
          <View style={styles.card} onLayout={(event) => captureStepOffset(1, event)}>
            <Text style={styles.cardTitle}>1. Scan the Sparkbox label</Text>
            {step1Collapsed ? (
              <View style={styles.stepSummary}>
                <Text style={styles.stepSummaryTitle}>{claimPayload?.deviceId || 'Sparkbox attached'}</Text>
                <Text style={styles.stepSummaryCopy}>
                  Reserved for {householdName}. The app can now move into Sparkbox setup mode.
                </Text>
              </View>
            ) : (
              <>
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
              </>
            )}
          </View>
        ) : null}

        {session && !claimStepVisible ? (
          <View style={styles.card} onLayout={(event) => captureStepOffset(1, event)}>
            <Text style={styles.cardTitle}>1. Get Sparkbox ready</Text>
            {step1Collapsed ? (
              <View style={styles.stepSummary}>
                <Text style={styles.stepSummaryTitle}>{setupDeviceId || 'Sparkbox selected'}</Text>
                <Text style={styles.stepSummaryCopy}>
                  This device is already in your household. You only need to bring it back into setup mode.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.cardCopy}>
                  No QR scan or re-claim is needed. If Sparkbox is in a new place, power it on and wait for{' '}
                  {HOTSPOT_SSID}. If it is still on the old network, use this screen when the hotspot appears.
                </Text>
                <View style={styles.claimPreview}>
                  <Text style={styles.claimPreviewLabel}>Device</Text>
                  <Text style={styles.claimPreviewValue}>{setupDeviceId || 'Sparkbox'}</Text>
                </View>
                {bleError ? <Text style={styles.errorText}>{bleError}</Text> : null}
              </>
            )}
          </View>
        ) : null}

        {step2Visible ? (
          <View style={styles.card} onLayout={(event) => captureStepOffset(2, event)}>
            <Text style={styles.cardTitle}>2. Connect to Sparkbox</Text>
            {step2Collapsed ? (
              <View style={styles.stepSummary}>
                <Text style={styles.stepSummaryTitle}>{HOTSPOT_SSID}</Text>
                <Text style={styles.stepSummaryCopy}>
                  Your phone reached Sparkbox setup mode. Home Wi-Fi setup is next.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.cardCopy}>
                  Sparkbox setup now happens over its temporary hotspot. The app will try to switch your phone automatically.
                </Text>
                {hotspotStage === 'joining_setup' || provisionBusy ? (
                  <View style={styles.row}>
                    <ActivityIndicator color="#0b6e4f" />
                    <Text style={styles.loadingInline}>{provisionMessage}</Text>
                  </View>
                ) : null}
                {bleError ? <Text style={styles.errorText}>{bleError}</Text> : null}
                {setupFlowKind === 'reprovision' && hotspotStage === 'idle' ? (
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => void beginHotspotOnboarding(setupDeviceId || '', '')}
                    disabled={!setupDeviceId}
                  >
                    <Text style={styles.primaryButtonText}>Connect to {HOTSPOT_SSID}</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={setupFlowKind === 'reprovision' && hotspotStage === 'idle' ? styles.secondaryButton : styles.primaryButton}
                  onPress={() => void openInternetPanel()}
                  disabled={setupFlowKind === 'first_run' && !pairingToken}
                >
                  <Text
                    style={
                      setupFlowKind === 'reprovision' && hotspotStage === 'idle'
                        ? styles.secondaryButtonText
                        : styles.primaryButtonText
                    }
                  >
                    Open Wi-Fi settings
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        ) : null}

        {step3Visible ? (
          <View style={styles.card} onLayout={(event) => captureStepOffset(3, event)}>
            <Text style={styles.cardTitle}>3. Choose home Wi-Fi</Text>
            {step3Collapsed ? (
              <View style={styles.stepSummary}>
                <Text style={styles.stepSummaryTitle}>{homeWifiTarget?.ssid || selectedSsid || previousInternetSsid || 'Home Wi-Fi selected'}</Text>
                <Text style={styles.stepSummaryCopy}>
                  Sparkbox is already using this choice to leave setup mode and finish activation.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.cardCopy}>
                  {hotspotStage === 'local_setup'
                    ? `Your phone is on ${HOTSPOT_SSID}. Choose the Wi-Fi Sparkbox should join next.`
                    : 'Sparkbox has your Wi-Fi choice and is now using it to finish setup.'}
                </Text>
                {hotspotStage === 'failed' && bleError ? <Text style={styles.errorText}>{bleError}</Text> : null}
                {hotspotStage === 'local_setup' ? (
                  <>
                    <View style={styles.inlineActions}>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void refreshNetworks()}
                        disabled={networksBusy || provisionBusy}
                      >
                        {networksBusy ? <ActivityIndicator color="#17352a" /> : <Text style={styles.secondaryButtonText}>Refresh nearby Wi-Fi</Text>}
                      </Pressable>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={openManualEntry}
                        disabled={provisionBusy}
                      >
                        <Text style={styles.secondaryButtonText}>Enter manually</Text>
                      </Pressable>
                    </View>
                    {networks.map((network) => {
                      const unsupported = network.support_level === 'unsupported';
                      const selected = selectedNetwork?.ssid === network.ssid && networkSheetOpen && !manualEntry;
                      return (
                        <Pressable
                          key={network.ssid}
                          style={[
                            styles.networkRow,
                            unsupported ? styles.networkRowDisabled : null,
                            selected ? styles.selectionCard : null,
                          ]}
                          onPress={() => chooseNetwork(network)}
                          disabled={unsupported || provisionBusy}
                        >
                          <View style={styles.networkLeft}>
                            <Text style={styles.networkName}>{network.ssid}</Text>
                            <Text style={styles.networkMeta}>
                              {network.requires_password ? String(network.security || 'secured').toUpperCase() : 'Open'} · {Math.round(Number(network.signal_percent || 0))}%
                            </Text>
                            {network.support_reason ? <Text style={styles.networkWarning}>{network.support_reason}</Text> : null}
                          </View>
                          <View style={styles.networkTags}>
                            {network.known ? <Text style={styles.tag}>Saved</Text> : null}
                            {network.support_level === 'warning' ? <Text style={styles.tagWarning}>Portal possible</Text> : null}
                            {unsupported ? <Text style={styles.tagMuted}>Unsupported</Text> : null}
                            {!unsupported ? (
                              <View style={[styles.rowAction, selected ? null : styles.rowActionDisabled]}>
                                <Text style={[styles.linkText, !selected ? styles.linkTextDisabled : null]}>{selected ? 'Selected' : 'Choose'}</Text>
                              </View>
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </>
                ) : null}
              </>
            )}
          </View>
        ) : null}

        {step4Visible ? (
          <View style={styles.card} onLayout={(event) => captureStepOffset(4, event)}>
            <Text style={styles.cardTitle}>4. Activation</Text>
            <Text style={styles.cardCopy}>{provisionMessage}</Text>
            {setupPageState?.status ? <Text style={styles.statusText}>Sparkbox status: {setupPageState.status}</Text> : null}
            {provisionBusy && !portalUrl ? <ActivityIndicator color="#0b6e4f" /> : null}
            {portalUrl ? (
              <View style={styles.portalBox}>
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => void Linking.openURL(portalUrl)}
                >
                  <Text style={styles.primaryButtonText}>Open sign-in page</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => void startCloudVerification()}
                >
                  <Text style={styles.secondaryButtonText}>Check again after sign-in</Text>
                </Pressable>
              </View>
            ) : null}
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

      <Modal
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent
        visible={fileEditorOpen}
        onRequestClose={() => setFileEditorOpen(false)}
      >
        <View style={styles.networkSheetBackdrop}>
          <View style={styles.networkSheetCard}>
            <Text style={styles.selectionLabel}>{fileEditorMode === 'rename' ? 'Rename item' : 'New folder'}</Text>
            <Text style={styles.selectionTitle}>
              {fileEditorMode === 'rename' ? fileTargetEntry?.name || 'Rename' : 'Create folder'}
            </Text>
            <Text style={styles.selectionCopy}>
              {fileEditorMode === 'rename'
                ? 'Use a short, clear name. Sparkbox keeps the item in the same folder.'
                : 'Create a new folder in the current file space.'}
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={fileEditorMode === 'rename' ? 'New name' : 'Folder name'}
              placeholderTextColor="#7e8a83"
              style={styles.input}
              value={fileEditorValue}
              onChangeText={setFileEditorValue}
            />
            {filesError ? <Text style={styles.errorText}>{filesError}</Text> : null}
            <View style={styles.inlineActions}>
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={() => setFileEditorOpen(false)}
                disabled={filesBusy}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.primaryButtonSmall}
                onPress={() => void submitFileEditor()}
                disabled={filesBusy}
              >
                {filesBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{fileEditorMode === 'rename' ? 'Rename' : 'Create folder'}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent
        visible={networkSheetOpen}
        onRequestClose={() => setNetworkSheetOpen(false)}
      >
        <View style={styles.networkSheetBackdrop}>
          <View style={styles.networkSheetCard}>
            <Text style={styles.selectionLabel}>{manualEntry || !selectedNetwork ? 'Manual entry' : 'Connect Sparkbox'}</Text>
            <Text style={styles.selectionTitle}>
              {selectedSsid || previousInternetSsid || 'Enter your home Wi-Fi'}
            </Text>
            <Text style={styles.selectionCopy}>
              {selectedNetwork?.known
                ? 'Sparkbox has used this Wi-Fi before. Leave the password blank unless it changed.'
                : 'Enter the Wi-Fi password, then Sparkbox will leave setup mode and join this network.'}
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Wi-Fi name"
              placeholderTextColor="#7e8a83"
              style={styles.input}
              value={selectedSsid}
              onChangeText={setSelectedSsid}
              editable={manualEntry || !selectedNetwork}
            />
            {(selectedNetwork?.requires_password ?? true) || manualEntry || !selectedNetwork ? (
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                placeholder={selectedNetwork?.known ? 'Password (optional if unchanged)' : 'Wi-Fi password'}
                placeholderTextColor="#7e8a83"
                style={styles.input}
                value={wifiPassword}
                onChangeText={setWifiPassword}
              />
            ) : null}
            <View style={styles.inlineActions}>
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={() => setNetworkSheetOpen(false)}
                disabled={provisionBusy}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButtonSmall, !canSubmitWifi ? styles.networkRowDisabled : null]}
                onPress={() => {
                  setNetworkSheetOpen(false);
                  void submitWifi();
                }}
                disabled={!canSubmitWifi}
              >
                {provisionBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Connect</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent
        visible={taskEditorOpen}
        onRequestClose={() => setTaskEditorOpen(false)}
      >
        <View style={styles.networkSheetBackdrop}>
          <View style={styles.networkSheetCard}>
            <Text style={styles.selectionLabel}>{editingTask ? 'Edit task' : 'New task'}</Text>
            <Text style={styles.selectionTitle}>
              {editingTask ? editingTask.name : taskScope === 'family' ? 'Shared Sparkbox routine' : 'Private Sparkbox routine'}
            </Text>
            <Text style={styles.selectionCopy}>
              Use cron syntax like `0 19 * * *`. Members can only create private ZeroClaw tasks.
            </Text>
            <TextInput
              autoCapitalize="sentences"
              autoCorrect={false}
              placeholder="Task name"
              placeholderTextColor="#7e8a83"
              style={styles.input}
              value={taskName}
              onChangeText={setTaskName}
            />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Cron schedule"
              placeholderTextColor="#7e8a83"
              style={styles.input}
              value={taskCronExpr}
              onChangeText={setTaskCronExpr}
            />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={canManage ? 'Command or ZeroClaw prompt' : 'ZeroClaw task command'}
              placeholderTextColor="#7e8a83"
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              value={taskCommand}
              onChangeText={setTaskCommand}
            />
            {canManage ? (
              <View style={styles.scopeRow}>
                {(['zeroclaw', 'shell'] as const).map((kind) => {
                  const active = taskCommandType === kind;
                  return (
                    <Pressable
                      key={kind}
                      style={[styles.scopePill, active ? styles.scopePillActive : null]}
                      onPress={() => setTaskCommandType(kind)}
                    >
                      <Text style={[styles.scopePillLabel, active ? styles.scopePillLabelActive : null]}>
                        {kind}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.cardCopy}>Command type: zeroclaw</Text>
            )}
            <Pressable
              style={[styles.scopePill, taskEnabled ? styles.scopePillActive : null]}
              onPress={() => setTaskEnabled((current) => !current)}
            >
              <Text style={[styles.scopePillLabel, taskEnabled ? styles.scopePillLabelActive : null]}>
                {taskEnabled ? 'Enabled immediately' : 'Start paused'}
              </Text>
            </Pressable>
            {tasksError ? <Text style={styles.errorText}>{tasksError}</Text> : null}
            <View style={styles.inlineActions}>
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={() => setTaskEditorOpen(false)}
                disabled={tasksBusy}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.primaryButtonSmall}
                onPress={() => void submitTaskEditor()}
                disabled={tasksBusy}
              >
                {tasksBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{editingTask ? 'Save' : 'Create task'}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  shellScreen: {
    flex: 1,
    padding: 20,
    gap: 16,
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
  stepRail: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  stepRailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#edf1ef',
  },
  stepRailItemDone: {
    backgroundColor: '#e3f2ea',
  },
  stepRailItemCurrent: {
    backgroundColor: '#17352a',
  },
  stepRailNumber: {
    color: '#61746a',
    fontSize: 12,
    fontWeight: '800',
  },
  stepRailNumberActive: {
    color: '#ffffff',
  },
  stepRailLabel: {
    color: '#61746a',
    fontSize: 12,
    fontWeight: '700',
  },
  stepRailLabelActive: {
    color: '#ffffff',
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
  shellTabBar: {
    flexDirection: 'row',
    gap: 10,
  },
  shellTab: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf1ef',
  },
  shellTabActive: {
    backgroundColor: '#17352a',
  },
  shellTabLabel: {
    color: '#61746a',
    fontSize: 14,
    fontWeight: '700',
  },
  shellTabLabelActive: {
    color: '#ffffff',
  },
  scopeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  authModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scopePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#edf1ef',
    borderWidth: 1,
    borderColor: '#d7dfda',
  },
  scopePillActive: {
    backgroundColor: '#17352a',
    borderColor: '#17352a',
  },
  scopePillLabel: {
    color: '#51665b',
    fontSize: 13,
    fontWeight: '700',
  },
  scopePillLabelActive: {
    color: '#ffffff',
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
  libraryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  librarySectionCard: {
    width: '48%',
    minWidth: 140,
    flexGrow: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#edf5ef',
    borderWidth: 1,
    borderColor: '#d7e2db',
    gap: 8,
  },
  librarySectionTitle: {
    color: '#17352a',
    fontSize: 16,
    fontWeight: '800',
  },
  librarySectionCopy: {
    color: '#5a6b62',
    fontSize: 13,
    lineHeight: 19,
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
  noticeText: {
    color: '#0b6e4f',
    lineHeight: 20,
    fontSize: 14,
    fontWeight: '700',
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
  stepSummary: {
    backgroundColor: '#eef5ef',
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  stepSummaryTitle: {
    color: '#17352a',
    fontSize: 17,
    fontWeight: '800',
  },
  stepSummaryCopy: {
    color: '#556860',
    fontSize: 14,
    lineHeight: 20,
  },
  deviceRowCard: {
    borderRadius: 18,
    backgroundColor: '#f8f4ea',
    borderWidth: 1,
    borderColor: '#d6dfd9',
    padding: 14,
    gap: 8,
  },
  deviceRowHeadline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusTagOnline: {
    color: '#0b6e4f',
    backgroundColor: '#e8f5ee',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
  },
  statusTagOffline: {
    color: '#7b4630',
    backgroundColor: '#f8e7df',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
  },
  chatBubble: {
    borderRadius: 20,
    padding: 14,
    gap: 8,
  },
  chatBubbleUser: {
    backgroundColor: '#17352a',
  },
  chatBubbleAssistant: {
    backgroundColor: '#eef5ef',
  },
  chatBubblePending: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#b9c8c0',
    opacity: 0.92,
  },
  chatBubbleCopy: {
    color: '#17352a',
    fontSize: 15,
    lineHeight: 22,
  },
  chatBubbleCopyUser: {
    color: '#ffffff',
  },
  chatBubbleCopyPending: {
    color: '#4f6b5e',
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
  networkRowDisabled: {
    opacity: 0.55,
  },
  networkLeft: {
    flex: 1,
    gap: 4,
    minWidth: 0,
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
    fontSize: 13,
  },
  linkTextDisabled: {
    color: '#6d7d74',
  },
  rowAction: {
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e8f5ee',
    borderWidth: 1,
    borderColor: '#c4ded1',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
  },
  rowActionDisabled: {
    backgroundColor: '#edf1ef',
    borderColor: '#d6dfd9',
  },
  networkSheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(8,22,16,0.32)',
    padding: 12,
  },
  networkSheetCard: {
    backgroundColor: '#fffdf8',
    borderRadius: 24,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#d6dfd9',
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
  webviewFrame: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d6dfd9',
    backgroundColor: '#fff',
  },
  webview: {
    backgroundColor: '#fff',
  },
  successBox: {
    backgroundColor: '#e7f5ee',
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  portalBox: {
    backgroundColor: '#fff8e6',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f0d98a',
    padding: 16,
    gap: 10,
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
