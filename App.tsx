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
  BackHandler,
  LayoutChangeEvent,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SpaceMembersEditorModal } from './src/components/SpaceMembersEditorModal';
import { SpaceCreatorModal } from './src/components/SpaceCreatorModal';
import { ChatInboxPane } from './src/components/ChatInboxPane';
import { ChatDetailPane } from './src/components/ChatDetailPane';
import { LibraryPane } from './src/components/LibraryPane';
import { AuthSetupCard, SignedInSetupCard } from './src/components/SetupAccountCard';
import { ViewedSpaceCard } from './src/components/ViewedSpaceCard';
import { authenticateWithCloud, type AuthMode, type Session } from './src/authFlow';
import {
  buildSetupFlowResetState,
  describeActivationStatus,
  describeActivityEvent,
  describeAiProvider,
  describeChatListTimestamp,
  describeChatMessageTimestamp,
  decodeChatMessageContent,
  describeDiagnosticsSource,
  describeDeviceActionNotice,
  describeLibraryFileListEmptyState,
  describeLibraryFileListTitle,
  describeLibraryPhotoEmptyState,
  describeLibraryTaskListEmptyState,
  describeLibraryTaskListTitle,
  describeFileTimestamp,
  describeFileUploader,
  describeInviteExpiry,
  describeInviteRole,
  describeServiceAvailabilityError,
  describeTaskEnabledState,
  describeTaskExecution,
  describeTaskRunFinishedAt,
  describeTaskRunOutput,
  describeTaskRunStartedAt,
  describeTaskRunStatus,
  describeTaskSchedule,
  describeUiDateTime,
  describeShellSubtitle,
  formatByteSize,
  PHASE_ONE_TABS,
  resolvePhaseOneSurface,
  summarizeOwnerServiceOutput,
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
  captureSpaceSummaryFromSession,
  createHouseholdSpace,
  createHouseholdDirectory,
  createHouseholdChatSession,
  createHouseholdTask,
  createHouseholdInvitation,
  createSpaceMemory,
  deleteHouseholdChatSession,
  deleteSpaceMemory,
  deleteSpaceSummary,
  deleteHouseholdPath,
  deleteHouseholdTask,
  disableSpaceFamilyApp,
  enableSpaceFamilyApp,
  getDeviceConfigStatus,
  getDeviceDiagnostics,
  getDeviceInferenceDetail,
  getFamilyAppCatalog,
  getDeviceOllamaModels,
  getDeviceProviderConfig,
  getDeviceProviders,
  getHouseholdFiles,
  getHouseholdInvitationPreview,
  getSpaceLibrary,
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
  openSpaceThreadSession,
  relayHouseholdSpaceMessage,
  reconnectDevice,
  renameHouseholdPath,
  resetDeviceToSetupMode,
  type HouseholdTaskScope,
  type HouseholdTaskSummary,
  type HouseholdTaskRunSummary,
  removeHouseholdMember,
  revokeHouseholdInvitation,
  startDeviceReprovision,
  type SpaceLibrary,
  type SpaceMemory,
  type SpaceSummary,
  type ChatSessionScope,
  type HouseholdChatSessionDetail,
  type HouseholdChatSessionSummary,
  streamHouseholdChatSessionMessage,
  triggerHouseholdTask,
  uninstallFamilyApp,
  updateHouseholdSpaceMembers,
  updateSpaceMemory,
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
  type SpaceTemplate,
} from './src/householdApi';
import {
  canChangeMemberRole,
  canReprovisionDeviceFromSettings,
  canRemoveHouseholdMember,
  canManageHousehold,
  describeDeviceLabel,
  describeDiagnosticsNetworkSummary,
  describeDiagnosticsIssueReasons,
  describeDiagnosticsPreflightReasons,
  describeDiagnosticsWifiConnection,
  describeDeviceStatus,
  describeSetupDeviceLabel,
  describeHouseholdRole,
  describeOwnerConsoleInference,
  describeOwnerConsoleModelStatus,
  describeOwnerRuntimeActiveRequest,
  describeOwnerRuntimeQueueEntry,
  describeOwnerRuntimeQueueSummary,
  describeOwnerServiceActionLabel,
  describeOwnerConsoleRuntimeStatus,
  hasOnlineDevice,
  type ShellTab,
} from './src/householdState';
import {
  buildManagedSpaceMemberIds,
  buildManagedSpaceSubmitIds,
  buildSpaceInviteAlertMessage,
  buildSpaceInviteNotice,
  toggleManagedSpaceMember,
} from './src/spaceMembers';
import {
  buildChatScopeResetState,
  buildSpaceScopedResetState,
  buildSpaceScopedFilePath,
  buildSharedChatParticipantLabels,
  buildSharedChatParticipantSummary,
  canCreateChatSession,
  canManageChatSession,
  canManageSpaceFamilyApps,
  canMutateSpaceFiles,
  canMutateSpaceLibrary,
  describeActiveChatEmptyStateCopy,
  describeActiveChatFallbackTitle,
  describeActiveChatSessionCopy,
  describeChatEditorPrimaryActionLabel,
  describeChatEditorTitle,
  describeChatEditorVerb,
  describeChatNamePlaceholder,
  describeChatSessionBadge,
  describeChatSessionCreatePermissionError,
  describeChatSessionEmptyStateCopy,
  describeChatSessionOpenError,
  describeChatSessionPrimaryActionLabel,
  describeChatSessionPreview,
  describeChatSessionPurpose,
  describeChatAccess,
  describeChatComposerPlaceholder,
  describeChatSendPhase,
  shouldAppendAssistantReply,
  describeCaptureSummaryActionLabel,
  describeCurrentSpaceSummaryCopy,
  describeFamilyAppRiskLevel,
  describeSummaryEmptyStateCopy,
  describeSummarySectionCopy,
  describeSpaceCounts,
  describeSpaceKind,
  describeSpaceSummaryCaptureMissingChatCopy,
  describeSpaceThreadEmptyStateCopy,
  describeSpaceThreadRowBadge,
  describeSpaceThreadRowCopy,
  describeSpaceTemplate,
  describeSpaceThreadSectionCopy,
  describeSpaceThreadSectionTitle,
  formatFamilyAppCapabilities,
  formatFamilyAppConfigSummary,
  formatSpaceTemplateList,
  getRelayTargets,
  isSharedGroupChatSession,
  looksLikeSharedGroupChatSession,
  mapSpaceKindToLegacyScope,
  resolveActiveSpaceId,
  resolveRelayTargetUserId,
  resolveSpaceCopyContext,
  resolveTaskSpaceId,
  stripSpaceScopedFilePath,
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
import { buildInvitePreviewSummary, shouldLoadInvitePreview } from './src/invitePreview';


const globalWithBuffer = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
if (!globalWithBuffer.Buffer) {
  globalWithBuffer.Buffer = Buffer;
}

const CLOUD_API_BASE =
  (Constants.expoConfig?.extra?.cloudApiBase as string | undefined)?.replace(/\/$/, '') ??
  'https://morgen52.site/familyserver';

const STORAGE_KEY = 'sparkbox.mobile.session';
const ACTIVE_SPACE_STORAGE_KEY_PREFIX = 'sparkbox.mobile.activeSpace';
const CAMERA_PERMISSION_RECOVERY_MESSAGE =
  'Allow camera access in Settings, or paste the Sparkbox setup code manually.';

function buildActiveSpaceStorageKey(session: Session | null): string {
  if (!session) {
    return '';
  }
  return `${ACTIVE_SPACE_STORAGE_KEY_PREFIX}.${session.user.household_id}.${session.user.id}`;
}
const HOTSPOT_SSID = 'Sparkbox-Setup';

type ClaimPayload = {
  deviceId: string;
  claimCode: string;
  raw: string;
};

type OwnerConsoleContext = 'tools' | 'provider' | 'onboard' | 'service';

const SPACE_TEMPLATE_OPTIONS: Array<Exclude<SpaceTemplate, 'private' | 'household'>> = [
  'partner',
  'parents',
  'child',
  'household_ops',
];

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
  failed?: boolean;
  retryable?: boolean;
  retryContent?: string | null;
  errorMessage?: string | null;
};

type ChatTimelineGroup =
  | {
      kind: 'messages';
      id: string;
      role: 'user' | 'assistant';
      senderLabel: string;
      messages: ChatTimelineMessage[];
    }
  | {
      kind: 'status';
      id: string;
      senderLabel: string;
      statusCopy: string;
      message: ChatTimelineMessage;
    };

const CHAT_PENDING_FALLBACK = 'Sparkbox is still preparing a reply for this message.';

function describeTimelineSenderLabel(message: ChatTimelineMessage, chatSendPhase: ChatSendPhase): string {
  if (message.pending) {
    return describeChatSendPhase(chatSendPhase) || 'Sparkbox';
  }
  if (message.role === 'user') {
    return message.senderDisplayName || 'You';
  }
  return 'Sparkbox';
}

function buildChatTimelineGroups(
  messages: ChatTimelineMessage[],
  chatSendPhase: ChatSendPhase,
  chatPendingIndicator: string,
): ChatTimelineGroup[] {
  const groups: ChatTimelineGroup[] = [];
  let currentGroup: Extract<ChatTimelineGroup, { kind: 'messages' }> | null = null;

  const pushCurrentGroup = () => {
    if (currentGroup) {
      groups.push(currentGroup);
      currentGroup = null;
    }
  };

  messages.forEach((message, index) => {
    const senderLabel = describeTimelineSenderLabel(message, chatSendPhase);
    if (message.pending || message.failed) {
      pushCurrentGroup();
      groups.push({
        kind: 'status',
        id: `status-${index}-${message.role}`,
        senderLabel,
        statusCopy: message.pending
          ? chatSendPhase === 'streaming'
            ? `Sparkbox is still replying${chatPendingIndicator}`
            : `The first reply can take 1 to 5 minutes${chatPendingIndicator}`
          : message.errorMessage || 'Could not send that message.',
        message,
      });
      return;
    }

    if (
      currentGroup &&
      currentGroup.role === message.role &&
      currentGroup.senderLabel === senderLabel
    ) {
      currentGroup.messages.push(message);
      return;
    }

    pushCurrentGroup();
    currentGroup = {
      kind: 'messages',
      id: `group-${index}-${message.role}`,
      role: message.role,
      senderLabel,
      messages: [message],
    };
  });

  pushCurrentGroup();
  return groups;
}

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
  const [invitePreviewBusy, setInvitePreviewBusy] = useState(false);
  const [invitePreviewError, setInvitePreviewError] = useState('');
  const [invitePreview, setInvitePreview] = useState<{
    householdName: string;
    role: 'owner' | 'member';
    spaceName?: string | null;
  } | null>(null);
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
  const [provisionMessage, setProvisionMessage] = useState('Scan the QR code to get Sparkbox ready for Wi-Fi.');
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
  const [preferredActiveSpaceId, setPreferredActiveSpaceId] = useState('');
  const [loadedActiveSpaceStorageKey, setLoadedActiveSpaceStorageKey] = useState('');
  const [activeSpaceDetail, setActiveSpaceDetail] = useState<HouseholdSpaceDetail | null>(null);
  const [spaceCreatorOpen, setSpaceCreatorOpen] = useState(false);
  const [spaceCreatorBusy, setSpaceCreatorBusy] = useState(false);
  const [spaceCreatorError, setSpaceCreatorError] = useState('');
  const [spaceName, setSpaceName] = useState('');
  const [spaceTemplate, setSpaceTemplate] = useState<Exclude<SpaceTemplate, 'private' | 'household'>>('partner');
  const [spaceMemberIds, setSpaceMemberIds] = useState<string[]>([]);
  const [spaceMembersEditorOpen, setSpaceMembersEditorOpen] = useState(false);
  const [spaceMembersEditorBusy, setSpaceMembersEditorBusy] = useState(false);
  const [spaceMembersEditorError, setSpaceMembersEditorError] = useState('');
  const [spaceMembersEditorIds, setSpaceMembersEditorIds] = useState<string[]>([]);
  const [chatScope, setChatScope] = useState<ChatSessionScope>('family');
  const [chatSessions, setChatSessions] = useState<HouseholdChatSessionSummary[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState('');
  const [activeChatSession, setActiveChatSession] = useState<HouseholdChatSessionDetail | null>(null);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatSendPhase, setChatSendPhase] = useState<ChatSendPhase>('idle');
  const [chatPendingMessage, setChatPendingMessage] = useState<ChatTimelineMessage | null>(null);
  const [chatPendingNoteIndex, setChatPendingNoteIndex] = useState(0);
  const [chatError, setChatError] = useState('');
  const [chatDraft, setChatDraft] = useState('');
  const [chatSessionEditorOpen, setChatSessionEditorOpen] = useState(false);
  const [editingChatSession, setEditingChatSession] = useState<HouseholdChatSessionSummary | null>(null);
  const [chatSessionName, setChatSessionName] = useState('');
  const [chatSessionSystemPrompt, setChatSessionSystemPrompt] = useState('');
  const [chatSessionTemperature, setChatSessionTemperature] = useState('0.7');
  const [chatSessionMaxTokens, setChatSessionMaxTokens] = useState('2048');
  const [fileSpace, setFileSpace] = useState<HouseholdFileSpace>('family');
  const [spaceLibrary, setSpaceLibrary] = useState<SpaceLibrary>({ memories: [], summaries: [] });
  const [libraryBusy, setLibraryBusy] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const [libraryNotice, setLibraryNotice] = useState('');
  const [memoryEditorOpen, setMemoryEditorOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<SpaceMemory | null>(null);
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryContent, setMemoryContent] = useState('');
  const [memoryPinned, setMemoryPinned] = useState(false);
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
  const [ownerConsoleContext, setOwnerConsoleContext] = useState<OwnerConsoleContext>('tools');
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
  const [ownerOnboardProvider, setOwnerOnboardProvider] = useState('');
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
  const activeSpaceStorageKey = buildActiveSpaceStorageKey(session);
  const renderOwnerConsoleFeedback = (context: OwnerConsoleContext) =>
    ownerConsoleContext === context ? (
      <>
        {ownerConsoleError ? <Text style={styles.errorText}>{ownerConsoleError}</Text> : null}
        {ownerConsoleNotice ? <Text style={styles.noticeText}>{ownerConsoleNotice}</Text> : null}
        {ownerConsoleBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
      </>
    ) : null;

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
    if (!activeSpaceStorageKey) {
      setPreferredActiveSpaceId('');
      setLoadedActiveSpaceStorageKey('');
      return;
    }

    let cancelled = false;
    setLoadedActiveSpaceStorageKey('');
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(activeSpaceStorageKey);
        if (cancelled) {
          return;
        }
        setPreferredActiveSpaceId(stored ?? '');
      } finally {
        if (!cancelled) {
          setLoadedActiveSpaceStorageKey(activeSpaceStorageKey);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeSpaceStorageKey]);

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

  useEffect(() => {
    if (authMode !== 'join') {
      setInvitePreview(null);
      setInvitePreviewError('');
      setInvitePreviewBusy(false);
      return;
    }

    const trimmedCode = inviteCode.trim();
    if (!shouldLoadInvitePreview(authMode, trimmedCode)) {
      setInvitePreview(null);
      setInvitePreviewError('');
      setInvitePreviewBusy(false);
      return;
    }

    let cancelled = false;
    setInvitePreviewBusy(true);
    setInvitePreviewError('');
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const preview = await getHouseholdInvitationPreview(trimmedCode);
          if (cancelled) {
            return;
          }
          setInvitePreview({
            householdName: preview.householdName,
            role: preview.role,
            spaceName: preview.spaceName,
          });
        } catch (error) {
          if (cancelled) {
            return;
          }
          setInvitePreview(null);
          setInvitePreviewError(error instanceof Error ? error.message : 'Could not check this invite code.');
        } finally {
          if (!cancelled) {
            setInvitePreviewBusy(false);
          }
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [authMode, inviteCode]);

  const householdName = session?.household.name ?? 'your household';
  const canManage = canManageHousehold(session?.user.role ?? '');
  const canReprovisionDevice = canReprovisionDeviceFromSettings(session?.user.role ?? '');
  const onlineDeviceAvailable = hasOnlineDevice(homeDevices);
  const activeSpace = spaces.find((space) => space.id === activeSpaceId) ?? null;
  const relayTargets = getRelayTargets(activeSpaceDetail, session?.user.id);
  const currentFilePath = fileListing?.path ?? '';
  const photoEntries = (fileListing?.entries ?? []).filter((entry) => !entry.isDir && /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(entry.name));
  const canCreateTasks = canManage || taskScope === 'private';
  const activeChatMessages: HouseholdChatSessionMessage[] = activeChatSession?.messages ?? [];
  const activeChatTimelineMessages: ChatTimelineMessage[] = chatPendingMessage
    ? [...activeChatMessages, chatPendingMessage]
    : activeChatMessages;
  const chatPendingIndicator = '.'.repeat((chatPendingNoteIndex % 3) + 1);
  const chatTimelineGroups = buildChatTimelineGroups(activeChatTimelineMessages, chatSendPhase, chatPendingIndicator);
  const canManageActiveChat =
    !!activeChatSession &&
    canManageChatSession({
      currentUserRole: session?.user.role,
      currentUserId: session?.user.id,
      sessionOwnerUserId: activeChatSession.ownerUserId,
      sessionScope: activeChatSession.scope,
      spaceKind: activeSpaceDetail?.kind ?? activeSpace?.kind,
    });
  const canCreateActiveChat = canCreateChatSession({
    currentUserRole: session?.user.role,
    sessionScope: chatScope,
    spaceKind: activeSpaceDetail?.kind ?? activeSpace?.kind,
  });
  const activeSpaceCopyContext = resolveSpaceCopyContext(activeSpaceDetail, activeSpace);
  const activeSharedChatParticipantLabels = buildSharedChatParticipantLabels(activeSpaceDetail, session?.user.id);
  const activeSharedChatParticipantSummary = buildSharedChatParticipantSummary(activeSpaceDetail, session?.user.id);
  const sharedChatIsVisible = activeChatSession
    ? looksLikeSharedGroupChatSession(activeChatSession.name, activeChatSession.scope, activeSpaceCopyContext)
    : false;
  const activeSpaceKindLabel = activeSpace ? describeSpaceKind(activeSpace.kind) : '';
  const activeSpaceTemplateLabel = activeSpace?.template ? describeSpaceTemplate(activeSpace.template) : '';
  const waitingForSpaces =
    Boolean(session?.token) &&
    shellSurface === 'shell' &&
    shellTab === 'chats' &&
    !activeSpace &&
    spaces.length === 0 &&
    !spacesError &&
    (!activeSpaceStorageKey || loadedActiveSpaceStorageKey === activeSpaceStorageKey);
  const householdMembersCopy = canManage
    ? 'Owners can invite people, adjust who can manage Sparkbox, and remove members here. Sparkbox always keeps at least one owner.'
    : 'See who is in this household here. Ask an owner if someone needs to join, needs owner access, or should be removed.';
  const canMutateActiveSpaceLibrary = canMutateSpaceLibrary({
    spaceKind: activeSpace?.kind,
    currentUserRole: session?.user.role,
  });
  const canManageActiveSpaceFamilyApps = canManageSpaceFamilyApps(session?.user.role);
  const canMutateActiveSpaceFiles = canMutateSpaceFiles({
    spaceKind: activeSpace?.kind,
    currentUserRole: session?.user.role,
    fileSpace,
  });
  const taskEditorCopy = canManage
    ? 'Choose what Sparkbox should do and when it should happen. Owners can switch to advanced controls when needed.'
    : 'Choose what Sparkbox should do and when it should happen. Private routines stay simple here, and owners can fine-tune shared ones when needed.';
  const activeChatSpaceId = activeSpaceId || undefined;
  const activeFileSpaceId = activeSpace?.kind === 'shared' ? activeSpace.id : '';
  const activeFileLegacyPrefix = activeSpace?.kind === 'shared' ? `spaces/${activeSpace.id}` : '';
  const activeTaskSpaceId = resolveTaskSpaceId(activeSpace);
  const libraryOverviewSections = [
    {
      title: 'Memories',
      copy: activeSpace ? `Things Sparkbox remembers for ${activeSpace.name}.` : 'Things Sparkbox remembers for this space.',
    },
    {
      title: 'Summaries',
      copy: 'Quick recaps that help you catch up without opening every chat.',
    },
    {
      title: 'Photos',
      copy: 'Shared moments and photos saved with this space.',
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
  const installedFamilyAppsBySlug = new Map(installedFamilyApps.map((app) => [app.slug, app] as const));
  const enabledFamilyAppCards = activeSpaceDetail?.enabledFamilyApps.map((enabled) => ({
    ...enabled,
    meta: installedFamilyAppsBySlug.get(enabled.slug) ?? familyAppsCatalog.find((item) => item.slug === enabled.slug) ?? null,
  })) ?? [];
  const installedFamilyAppsAvailableForActiveSpace = activeSpace
    ? installedFamilyApps.filter(
        (app) =>
          app.spaceTemplates.includes(activeSpace.template) &&
          !activeSpaceDetail?.enabledFamilyApps.some((enabled) => enabled.slug === app.slug),
      )
    : [];
  const recommendedFamilyApps = activeSpace
    ? availableFamilyApps.filter((app) => app.spaceTemplates.includes(activeSpace.template))
    : [];
  const chatSpotlightEnabledApps = enabledFamilyAppCards.slice(0, 2);
  const chatSpotlightRecommendedInstalledApps = installedFamilyAppsAvailableForActiveSpace.slice(0, 2);
  const chatSpotlightRecommendedCatalogApps = recommendedFamilyApps.slice(0, 2);
  const summaryEmptyStateCopy = describeSummaryEmptyStateCopy(
    activeSpaceDetail,
    canMutateActiveSpaceLibrary,
    activeChatSession?.name || '',
  );
  const authCardTitle =
    authMode === 'login'
      ? 'Sign in'
      : authMode === 'register'
        ? 'Create your household'
        : 'Join household';
  const authCardCopy =
    authMode === 'login'
      ? 'Use the same account that owns Sparkbox.'
      : authMode === 'register'
        ? 'Create the first owner account for this Sparkbox household.'
        : 'Enter the invite code from an owner to join an existing Sparkbox household.';
  const authSubmitLabel =
    authMode === 'login' ? 'Sign in' : authMode === 'register' ? 'Create account' : 'Join household';
  const spaceMemberOptions = homeMembers.filter((member) => member.id !== session?.user.id);
  const activeSharedSpaceMemberOptions =
    activeSpace?.kind === 'shared' ? homeMembers.filter((member) => member.id !== session?.user.id) : [];
  const canReturnToShell = Boolean(session) && homeLoaded && homeDevices.length > 0;
  const householdShellLoading =
    Boolean(session) &&
    shellSurface !== 'shell' &&
    !homeLoaded &&
    !homeError &&
    !setupFlowRequested &&
    !onboardingInProgress;

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
    if (!canMutateActiveSpaceFiles) {
      return false;
    }
    if (fileSpace === 'private') {
      return true;
    }
    if (canManage) {
      return true;
    }
    return entry.uploadedByUserId === session?.user.id;
  }

  function toDeviceFilePath(displayPath: string): string {
    return buildSpaceScopedFilePath('', displayPath);
  }

  function fromDeviceFilePath(devicePath: string | null | undefined): string {
    return stripSpaceScopedFilePath(activeFileLegacyPrefix, devicePath);
  }

  function mapListingToActiveSpace(listing: HouseholdFileListing): HouseholdFileListing {
    if (!activeFileLegacyPrefix) {
      return listing;
    }
    return {
      ...listing,
      path: fromDeviceFilePath(listing.path),
      parent: listing.parent ? fromDeviceFilePath(listing.parent) : '',
      entries: listing.entries.map((entry) => ({
        ...entry,
        path: fromDeviceFilePath(entry.path),
      })),
    };
  }

  function returnToShell(): void {
    resetSetupFlowState();
    setShellSurface('shell');
  }

  function openMemoryEditor(memory?: SpaceMemory): void {
    setEditingMemory(memory ?? null);
    setMemoryTitle(memory?.title ?? '');
    setMemoryContent(memory?.content ?? '');
    setMemoryPinned(memory?.pinned ?? false);
    setLibraryError('');
    setMemoryEditorOpen(true);
  }

  function closeMemoryEditor(): void {
    setMemoryEditorOpen(false);
    setEditingMemory(null);
    setMemoryTitle('');
    setMemoryContent('');
    setMemoryPinned(false);
  }

  async function refreshLibrary(): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      return;
    }
    setLibraryBusy(true);
    setLibraryError('');
    try {
      const nextLibrary = await getSpaceLibrary(session.token, activeSpaceId);
      setSpaceLibrary(nextLibrary);
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : 'Could not load this space library.');
    } finally {
      setLibraryBusy(false);
    }
  }

  async function submitMemoryEditor(): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      return;
    }
    if (!canMutateActiveSpaceLibrary) {
      setLibraryError('Only owners can change shared memories and summaries.');
      return;
    }
    const title = memoryTitle.trim();
    const content = memoryContent.trim();
    if (!title || !content) {
      setLibraryError('Memory title and content are required.');
      return;
    }
    setLibraryBusy(true);
    setLibraryError('');
    try {
      if (editingMemory) {
        await updateSpaceMemory(session.token, activeSpaceId, editingMemory.id, {
          title,
          content,
          pinned: memoryPinned,
        });
        setLibraryNotice(`Updated ${title}.`);
      } else {
        await createSpaceMemory(session.token, activeSpaceId, {
          title,
          content,
          pinned: memoryPinned,
        });
        setLibraryNotice(`Saved ${title} to Memories.`);
      }
      closeMemoryEditor();
      await refreshLibrary();
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : 'Could not save this memory.');
    } finally {
      setLibraryBusy(false);
    }
  }

  async function removeMemory(memory: SpaceMemory): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      return;
    }
    if (!canMutateActiveSpaceLibrary) {
      setLibraryError('Only owners can change shared memories and summaries.');
      return;
    }
    setLibraryBusy(true);
    setLibraryError('');
    try {
      await deleteSpaceMemory(session.token, activeSpaceId, memory.id);
      setLibraryNotice(`Deleted ${memory.title}.`);
      await refreshLibrary();
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : 'Could not delete this memory.');
    } finally {
      setLibraryBusy(false);
    }
  }

  function confirmRemoveMemory(memory: SpaceMemory): void {
    Alert.alert('Delete this memory?', 'Sparkbox will stop using it as a saved memory for this space.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeMemory(memory) },
    ]);
  }

  async function captureActiveSpaceSummary(): Promise<void> {
    if (!session?.token || !activeSpaceId || !activeChatSessionId || !activeChatSession) {
      setLibraryError(describeSpaceSummaryCaptureMissingChatCopy(activeSpaceDetail));
      return;
    }
    if (!canMutateActiveSpaceLibrary) {
      setLibraryError('Only owners can change shared memories and summaries.');
      return;
    }
    setLibraryBusy(true);
    setLibraryError('');
    try {
      await captureSpaceSummaryFromSession(session.token, activeSpaceId, {
        chatSessionId: activeChatSessionId,
        title: `${activeChatSession.name} snapshot`,
      });
      setLibraryNotice(`Captured a summary from ${activeChatSession.name}.`);
      await refreshLibrary();
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : 'Could not capture a summary right now.');
    } finally {
      setLibraryBusy(false);
    }
  }

  async function saveSummaryAsMemory(summary: SpaceSummary): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      return;
    }
    if (!canMutateActiveSpaceLibrary) {
      setLibraryError('Only owners can change shared memories and summaries.');
      return;
    }
    setLibraryBusy(true);
    setLibraryError('');
    try {
      await createSpaceMemory(session.token, activeSpaceId, {
        title: summary.title,
        content: summary.content,
      });
      setLibraryNotice(`Saved ${summary.title} to Memories.`);
      await refreshLibrary();
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : 'Could not save this summary as a memory.');
    } finally {
      setLibraryBusy(false);
    }
  }

  async function removeSpaceSummary(summaryId: string, title: string): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      return;
    }
    if (!canMutateActiveSpaceLibrary) {
      setLibraryError('Only owners can change shared memories and summaries.');
      return;
    }
    setLibraryBusy(true);
    setLibraryError('');
    try {
      await deleteSpaceSummary(session.token, activeSpaceId, summaryId);
      setLibraryNotice(`Removed ${title}.`);
      await refreshLibrary();
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : 'Could not remove this summary.');
    } finally {
      setLibraryBusy(false);
    }
  }

  function confirmRemoveSummary(summary: SpaceSummary): void {
    Alert.alert(
      'Delete this summary?',
      `${summary.title} will be removed from this space library.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void removeSpaceSummary(summary.id, summary.title) },
      ],
    );
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
      setHomeError(
        error instanceof Error ? describeServiceAvailabilityError(error.message) : 'Could not load your household.',
      );
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
      setActiveSpaceId((current) => resolveActiveSpaceId(nextSpaces, current, preferredActiveSpaceId));
    } catch (error) {
      setSpacesError(error instanceof Error ? error.message : 'Could not load Sparkbox spaces.');
    } finally {
      if (!options.silent) {
        setSpacesBusy(false);
      }
    }
  }

  function openSpaceCreator(): void {
    if (!canManage) {
      return;
    }
    setSpaceCreatorError('');
    setSpaceName('');
    setSpaceTemplate('partner');
    setSpaceMemberIds(spaceMemberOptions.length === 1 ? [spaceMemberOptions[0].id] : []);
    setSpaceCreatorOpen(true);
  }

  function toggleSpaceMember(memberId: string): void {
    setSpaceMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  }

  function openSpaceMembersEditor(): void {
    if (!canManage || activeSpace?.kind !== 'shared' || !activeSpaceDetail) {
      return;
    }
    setSpaceMembersEditorError('');
    setSpaceMembersEditorIds(buildManagedSpaceMemberIds(activeSpaceDetail.members, session?.user.id));
    setSpaceMembersEditorOpen(true);
  }

  function toggleSpaceMembersEditorMember(memberId: string): void {
    setSpaceMembersEditorIds((current) => toggleManagedSpaceMember(current, memberId));
  }

  async function submitSpaceCreator(): Promise<void> {
    if (!session?.token || !canManage) {
      return;
    }
    const trimmedName = spaceName.trim();
    if (!trimmedName) {
      setSpaceCreatorError('Give this shared space a clear name first.');
      return;
    }
    setSpaceCreatorBusy(true);
    setSpaceCreatorError('');
    try {
      const created = await createHouseholdSpace(session.token, {
        name: trimmedName,
        template: spaceTemplate,
        memberIds: spaceMemberIds,
      });
      setSpaceCreatorOpen(false);
      setSpaceName('');
      setSpaceMemberIds([]);
      setActiveSpaceId(created.id);
      setActiveSpaceDetail(created);
      setShellTab('chats');
      await Promise.all([
        refreshHouseholdSummary({ silent: true }),
        refreshSpaces({ silent: true }),
      ]);
    } catch (error) {
      setSpaceCreatorError(error instanceof Error ? error.message : 'Could not create this shared space.');
    } finally {
      setSpaceCreatorBusy(false);
    }
  }

  async function submitSpaceMembersEditor(): Promise<void> {
    if (!session?.token || !canManage || activeSpace?.kind !== 'shared' || !activeSpaceDetail) {
      return;
    }
    setSpaceMembersEditorBusy(true);
    setSpaceMembersEditorError('');
    try {
      const updated = await updateHouseholdSpaceMembers(
        session.token,
        activeSpaceDetail.id,
        buildManagedSpaceSubmitIds(session.user.id, spaceMembersEditorIds),
      );
      setActiveSpaceDetail(updated);
      setSpaces((current) =>
        current.map((space) =>
          space.id === updated.id
            ? {
                ...space,
                memberCount: updated.memberCount,
                updatedAt: updated.updatedAt,
              }
            : space,
        ),
      );
      setSpaceMembersEditorOpen(false);
      setSettingsNotice(`Updated members for ${updated.name}.`);
      await Promise.all([
        refreshHouseholdSummary({ silent: true }),
        refreshSpaces({ silent: true }),
      ]);
    } catch (error) {
      setSpaceMembersEditorError(error instanceof Error ? error.message : 'Could not update this space.');
    } finally {
      setSpaceMembersEditorBusy(false);
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
      setPreferredActiveSpaceId('');
      setLoadedActiveSpaceStorageKey('');
      setActiveSpaceDetail(null);
      setChatSessions([]);
      setActiveChatSessionId('');
      setActiveChatSession(null);
      setSpaceLibrary({ memories: [], summaries: [] });
      setLibraryError('');
      setLibraryNotice('');
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
    if (activeSpaceStorageKey && loadedActiveSpaceStorageKey !== activeSpaceStorageKey) {
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
  }, [activeSpaceStorageKey, completedDeviceId, loadedActiveSpaceStorageKey, onboardingInProgress, session?.token, setupFlowRequested]);

  useEffect(() => {
    if (!activeSpaceStorageKey || loadedActiveSpaceStorageKey !== activeSpaceStorageKey || !activeSpaceId) {
      return;
    }
    setPreferredActiveSpaceId((current) => (current === activeSpaceId ? current : activeSpaceId));
    void AsyncStorage.setItem(activeSpaceStorageKey, activeSpaceId).catch(() => undefined);
  }, [activeSpaceId, activeSpaceStorageKey, loadedActiveSpaceStorageKey]);

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
    const resetState = buildSpaceScopedResetState();
    setChatSessions(resetState.chatSessions);
    setActiveChatSessionId(resetState.activeChatSessionId);
    setActiveChatSession(resetState.activeChatSession);
    setChatDraft(resetState.chatDraft);
    setSpaceLibrary(resetState.spaceLibrary);
    setFileListing(resetState.fileListing);
    setTasks(resetState.tasks);
    setChatError('');
    setLibraryError('');
    setFilesError('');
    setTasksError('');
    setRelayComposerOpen(false);
    setRelayTargetUserId('');
    setRelayMessage('');
    setRelayError('');
    setRelayNotice('');
    setMemoryEditorOpen(false);
    setEditingMemory(null);
    setMemoryTitle('');
    setMemoryContent('');
    setMemoryPinned(false);
    setLibraryNotice('');
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
        const sessions = await getHouseholdChatSessions(session.token, chatScope, {
          spaceId: activeChatSpaceId,
        });
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
  }, [activeChatSpaceId, chatScope, session?.token, shellSurface, shellTab]);

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
      setChatPendingNoteIndex((current) => (current + 1) % 3);
    }, 2400);
    return () => clearInterval(interval);
  }, [chatPendingMessage?.pending, chatSendPhase]);

  useEffect(() => {
    if (shellSurface !== 'shell' || shellTab !== 'library' || !session?.token || !activeSpaceId) {
      setSpaceLibrary({ memories: [], summaries: [] });
      setLibraryBusy(false);
      return;
    }
    let cancelled = false;
    setLibraryBusy(true);
    setLibraryError('');
    void (async () => {
      try {
        const nextLibrary = await getSpaceLibrary(session.token, activeSpaceId);
        if (cancelled) {
          return;
        }
        setSpaceLibrary(nextLibrary);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setLibraryError(error instanceof Error ? error.message : 'Could not load this space library.');
      } finally {
        if (!cancelled) {
          setLibraryBusy(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSpaceId, session?.token, shellSurface, shellTab]);

  useEffect(() => {
    if (shellSurface !== 'shell' || shellTab !== 'library' || !session?.token) {
      return;
    }
    let cancelled = false;
    setTasksBusy(true);
    setTasksError('');
    void (async () => {
      try {
        const nextTasks = await getHouseholdTasks(session.token, taskScope, {
          spaceId: activeTaskSpaceId,
        });
        if (cancelled) {
          return;
        }
        setTasks(nextTasks);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setTasksError(error instanceof Error ? describeServiceAvailabilityError(error.message) : 'Could not load household tasks.');
      } finally {
        if (!cancelled) {
          setTasksBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.token, shellSurface, shellTab, taskScope, activeTaskSpaceId]);

  useEffect(() => {
    if (shellSurface !== 'shell' || shellTab !== 'library' || !session?.token) {
      return;
    }
    void refreshFiles();
  }, [session?.token, shellSurface, shellTab, fileSpace, activeFileSpaceId, activeFileLegacyPrefix]);

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

  async function generateInvite(
    role: 'owner' | 'member',
    options: { targetSpaceId?: string; targetSpaceName?: string } = {},
  ): Promise<void> {
    if (!session?.token || !canManage) {
      return;
    }
    setSettingsBusy(true);
    setSettingsError('');
    try {
      const invite = await createHouseholdInvitation(session.token, role, {
        spaceId: options.targetSpaceId,
      });
      const inviteRoleLabel = describeInviteRole(role);
      const inviteTargetName = invite.spaceName || options.targetSpaceName || '';
      const inviteNotice = buildSpaceInviteNotice(inviteRoleLabel, invite.inviteCode, inviteTargetName);
      setSettingsNotice(inviteNotice);
      Alert.alert(
        inviteTargetName ? `${inviteRoleLabel} invite for ${inviteTargetName}` : `${inviteRoleLabel} invite ready`,
        buildSpaceInviteAlertMessage(invite.inviteCode, inviteTargetName),
      );
      await refreshHouseholdSummary({ silent: true });
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Could not create invite.');
    } finally {
      setSettingsBusy(false);
    }
  }

  async function installSelectedFamilyApp(slug: string, confirmed = false): Promise<void> {
    if (!session?.token || !canManage) {
      return;
    }
    const app =
      familyAppsCatalog.find((item) => item.slug === slug) ??
      installedFamilyApps.find((item) => item.slug === slug) ??
      null;
    if (app?.requiresOwnerConfirmation && !confirmed) {
      Alert.alert(
        `Install ${app.title}?`,
        'This family app touches sensitive family interactions. Install it only if you want Sparkbox to enable that behavior on this device.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Install', onPress: () => void installSelectedFamilyApp(slug, true) },
        ],
      );
      return;
    }
    setSettingsBusy(true);
    setSettingsError('');
    try {
      const installed = await installFamilyApp(session.token, slug, { confirmed });
      setInstalledFamilyApps((current) => {
        if (current.some((item) => item.slug === installed.slug)) {
          return current;
        }
        return [...current, installed];
      });
      setSettingsNotice(`${installed.title} installed on this device.`);
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Could not install this family app.');
    } finally {
      setSettingsBusy(false);
    }
  }

  async function enableInstalledFamilyAppForActiveSpace(slug: string, confirmed = false): Promise<void> {
    if (!session?.token || !canManage || !activeSpaceId || !activeSpace) {
      return;
    }
    const app = installedFamilyApps.find((item) => item.slug === slug) ?? null;
    if (app?.requiresOwnerConfirmation && !confirmed) {
      Alert.alert(
        `Enable ${app.title} in ${activeSpace.name}?`,
        'This family app can shape sensitive family interactions in this space. Sparkbox will only enable it here after you confirm.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: () => void enableInstalledFamilyAppForActiveSpace(slug, true) },
        ],
      );
      return;
    }
    setSettingsBusy(true);
    setSettingsError('');
    try {
      await enableSpaceFamilyApp(session.token, activeSpaceId, slug, {
        cadence: 'gentle',
        entryCard: true,
        confirmed,
      });
      const detail = await getHouseholdSpaceDetail(session.token, activeSpaceId);
      setActiveSpaceDetail(detail);
      setSettingsNotice(`${app?.title || slug} is now enabled in ${activeSpace.name}.`);
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Could not turn on this family app in this space.');
    } finally {
      setSettingsBusy(false);
    }
  }

  async function disableFamilyAppForActiveSpace(slug: string): Promise<void> {
    if (!session?.token || !canManage || !activeSpaceId || !activeSpace) {
      return;
    }
    const app = installedFamilyAppsBySlug.get(slug) ?? familyAppsCatalog.find((item) => item.slug === slug) ?? null;
    Alert.alert(
      `Disable ${app?.title || slug}?`,
      `Sparkbox will stop using this family app in ${activeSpace.name}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSettingsBusy(true);
              setSettingsError('');
              try {
                await disableSpaceFamilyApp(session.token!, activeSpaceId, slug);
                const detail = await getHouseholdSpaceDetail(session.token!, activeSpaceId);
                setActiveSpaceDetail(detail);
                setSettingsNotice(`${app?.title || slug} is no longer active in ${activeSpace.name}.`);
              } catch (error) {
                setSettingsError(error instanceof Error ? error.message : 'Could not turn off this family app in this space.');
              } finally {
                setSettingsBusy(false);
              }
            })();
          },
        },
      ],
    );
  }

  async function uninstallInstalledFamilyApp(slug: string): Promise<void> {
    if (!session?.token || !canManage) {
      return;
    }
    const app = installedFamilyApps.find((item) => item.slug === slug) ?? familyAppsCatalog.find((item) => item.slug === slug) ?? null;
    Alert.alert(
      `Remove ${app?.title || slug}?`,
      'This removes the family app from this device and turns it off in every space.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSettingsBusy(true);
              setSettingsError('');
              try {
                await uninstallFamilyApp(session.token!, slug);
                setInstalledFamilyApps((current) => current.filter((item) => item.slug !== slug));
                if (activeSpaceId) {
                  const detail = await getHouseholdSpaceDetail(session.token!, activeSpaceId);
                  setActiveSpaceDetail(detail);
                }
                setSettingsNotice(`${app?.title || slug} was removed from this device.`);
              } catch (error) {
                setSettingsError(error instanceof Error ? error.message : 'Could not remove this family app.');
              } finally {
                setSettingsBusy(false);
              }
            })();
          },
        },
      ],
    );
  }

  async function openFamilyAppStarter(slug: string, prompt: string): Promise<void> {
    if (!session?.token || !activeSpaceId || !activeSpaceDetail) {
      return;
    }
    setShellTab('chats');
    setChatError('');
    try {
      const appMeta =
        installedFamilyAppsBySlug.get(slug) ?? familyAppsCatalog.find((item) => item.slug === slug) ?? null;
      if (appMeta?.supportsPrivateRelay && activeSpaceDetail.kind === 'shared' && activeSpaceDetail.privateSideChannel?.available) {
        const sideChannel = await openSpaceSideChannel(session.token, activeSpaceId);
        if (sideChannel.sessionId) {
          setActiveChatSessionId(sideChannel.sessionId);
          setChatDraft(prompt);
          return;
        }
      }
      const hintedThread = appMeta?.threadHints
        ?.map((hint) => activeSpaceDetail.threads.find((thread) => thread.title === hint))
        .find(Boolean);
      const threadToOpen = hintedThread ?? activeSpaceDetail.threads[0];
      if (threadToOpen) {
        const opened = await openSpaceThreadSession(session.token, activeSpaceId, threadToOpen.id);
        setActiveChatSessionId(opened.id);
      }
      setChatDraft(prompt);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Could not open this family app right now.');
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
      setSettingsNotice(`Revoked ${describeInviteRole(invite.role).toLowerCase()} invite.`);
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
    if (!canChangeMemberRole(homeMembers, member, nextRole)) {
      setSettingsError('Sparkbox must keep at least one owner in the household.');
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
    if (!canRemoveHouseholdMember(homeMembers, member)) {
      setSettingsError('Sparkbox must keep at least one owner in the household.');
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
    setInviteCode(resetState.inviteCode);
    setHomeWifiTarget(null);
    setPreviousInternetSsid(resetState.previousInternetSsid);
    setSetupPageState(resetState.setupPageState);
    setSetupNetworksLoaded(resetState.setupNetworksLoaded);
  }

  function resetShellState(): void {
    const resetState = buildSpaceScopedResetState();
    setSettingsBusy(false);
    setSettingsError('');
    setSettingsNotice('');
    setChatScope('family');
    setChatSessions(resetState.chatSessions);
    setActiveChatSessionId(resetState.activeChatSessionId);
    setActiveChatSession(resetState.activeChatSession);
    setChatBusy(false);
    setChatSendPhase('idle');
    setChatPendingMessage(null);
    setChatPendingNoteIndex(0);
    setChatError('');
    setChatDraft(resetState.chatDraft);
    setChatSessionEditorOpen(false);
    setEditingChatSession(null);
    setChatSessionName('');
    setChatSessionSystemPrompt('');
    setChatSessionTemperature('0.7');
    setChatSessionMaxTokens('2048');
    setSpaceLibrary(resetState.spaceLibrary);
    setLibraryBusy(false);
    setLibraryError('');
    setLibraryNotice('');
    setMemoryEditorOpen(false);
    setEditingMemory(null);
    setMemoryTitle('');
    setMemoryContent('');
    setMemoryPinned(false);
    setTasks(resetState.tasks);
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
    setSpaceCreatorOpen(false);
    setSpaceCreatorBusy(false);
    setSpaceCreatorError('');
    setSpaceName('');
    setSpaceTemplate('partner');
    setSpaceMemberIds([]);
    setFileListing(resetState.fileListing);
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

  function resetFlow(): void {
    resetSetupFlowState();
    resetShellState();
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
        setClaimError(CAMERA_PERMISSION_RECOVERY_MESSAGE);
        return;
      }
    }
    setScannerOpen(true);
  }

  function beginNewDeviceOnboarding(): void {
    resetSetupFlowState();
    setSetupFlowKind('first_run');
    setHomeError('');
    setShellSurface('onboarding');
  }

  async function beginDeviceReprovision(device: DeviceSummary): Promise<void> {
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

  async function refreshChatSessions(): Promise<void> {
    if (!session?.token) {
      return;
    }
    setChatBusy(true);
    setChatError('');
    try {
      const sessions = await getHouseholdChatSessions(session.token, chatScope, {
        spaceId: activeChatSpaceId,
      });
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

  function handleChatScopeChange(nextScope: ChatSessionScope): void {
    if (nextScope === chatScope) {
      return;
    }
    const resetState = buildChatScopeResetState();
    setChatScope(nextScope);
    setChatSessions(resetState.chatSessions);
    setActiveChatSessionId(resetState.activeChatSessionId);
    setActiveChatSession(resetState.activeChatSession);
    setChatDraft(resetState.chatDraft);
    setChatError('');
    setChatSendPhase('idle');
    setChatPendingMessage(null);
    setChatPendingNoteIndex(0);
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
        throw new Error('Sparkbox has not opened the private chat for this space yet.');
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
      const sessions = await getHouseholdChatSessions(session.token, 'private', {
        spaceId: activeSpaceId,
      });
      setChatSessions(sessions);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Could not open the private chat right now.');
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

  async function openSpaceThread(threadId: string): Promise<void> {
    if (!session?.token || !activeSpaceId || !activeSpaceDetail) {
      return;
    }
    setChatBusy(true);
    setChatError('');
    try {
      const opened = await openSpaceThreadSession(session.token, activeSpaceId, threadId);
      setChatScope(opened.scope);
      setActiveChatSessionId(opened.id);
      const [sessions, detail, refreshedSpace] = await Promise.all([
        getHouseholdChatSessions(session.token, opened.scope, {
          spaceId: activeSpaceId,
        }),
        getHouseholdChatSession(session.token, opened.id),
        getHouseholdSpaceDetail(session.token, activeSpaceId),
      ]);
      setChatSessions(sessions);
      setActiveChatSession(detail);
      setActiveSpaceDetail(refreshedSpace);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : describeChatSessionOpenError(activeSpaceDetail));
    } finally {
      setChatBusy(false);
    }
  }

  function openChatSessionEditor(sessionItem?: HouseholdChatSessionSummary): void {
    if (!sessionItem && !canCreateActiveChat) {
      setChatError(describeChatSessionCreatePermissionError(activeSpaceDetail, chatScope));
      return;
    }
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
          spaceId: activeChatSpaceId,
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

  async function submitChatMessage(overrideContent?: string): Promise<void> {
    if (!session?.token || !activeChatSessionId) {
      return;
    }
    const content = (overrideContent ?? chatDraft).trim();
    if (!content) {
      return;
    }
    if (!overrideContent) {
      setChatDraft('');
    }
    setChatBusy(true);
    setChatError('');
    setChatPendingNoteIndex(0);
    setChatSendPhase('sending');
    setChatPendingMessage({
      role: 'assistant',
      content: CHAT_PENDING_FALLBACK,
      senderDisplayName: null,
      pending: true,
      retryContent: content,
    });
    if (activeChatSession) {
      setActiveChatSession({
        ...activeChatSession,
        messages: [...activeChatSession.messages, { role: 'user', content, senderDisplayName: session.user.display_name }],
      });
    }
    let keepPendingBubble = false;
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
                    content: event.message,
                    retryContent: content,
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
            retryContent: content,
          });
        },
      });
      if (response.error) {
        keepPendingBubble = true;
        const timedOut = response.reason === 'ttft_timeout';
        setChatSendPhase(timedOut ? 'timed_out' : 'failed');
        setChatError(response.error);
        setChatPendingMessage({
          role: 'assistant',
          content:
            streamedMessage ||
            (timedOut
              ? 'Sparkbox is taking longer than usual to send the first reply.'
              : 'Sparkbox could not send the reply this time.'),
          senderDisplayName: null,
          pending: false,
          failed: true,
          retryable: response.retryable === true,
          retryContent: content,
          errorMessage: response.error,
        });
        return;
      }
      if (shouldAppendAssistantReply(response.message)) {
        setActiveChatSession((current) =>
          current
            ? {
                ...current,
                messages: [...current.messages, { role: 'assistant', content: response.message, senderDisplayName: null }],
              }
            : current,
        );
      }
      try {
        const detail = await getHouseholdChatSession(session.token, activeChatSessionId);
        setActiveChatSession(detail);
        setChatSessions((current) =>
          current.map((item) =>
            item.id === detail.id
              ? {
                  ...item,
                  name: detail.name,
                  updatedAt: detail.updatedAt,
                  systemPrompt: detail.systemPrompt,
                  temperature: detail.temperature,
                  maxTokens: detail.maxTokens,
                }
              : item,
          ),
        );
      } catch {
        setChatSessions((current) =>
          current.map((item) =>
            item.id === activeChatSessionId
              ? {
                  ...item,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        );
      }
      await refreshHouseholdSummary({ silent: true });
    } catch (error) {
      keepPendingBubble = true;
      setChatSendPhase('failed');
      setChatError(error instanceof Error ? error.message : 'Chat is unavailable right now.');
      setChatPendingMessage({
        role: 'assistant',
        content: 'Sparkbox could not send the reply this time.',
        senderDisplayName: null,
        pending: false,
        failed: true,
        retryable: true,
        retryContent: content,
        errorMessage: error instanceof Error ? error.message : 'Chat is unavailable right now.',
      });
    } finally {
      if (!keepPendingBubble) {
        setChatPendingMessage(null);
        setChatSendPhase('idle');
        setChatPendingNoteIndex(0);
      }
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

  function closeActiveChatDetail(): void {
    setActiveChatSessionId('');
    setChatError('');
  }

  useEffect(() => {
    if (shellSurface !== 'shell' || shellTab !== 'chats' || !activeChatSessionId) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeActiveChatDetail();
      return true;
    });
    return () => subscription.remove();
  }, [activeChatSessionId, shellSurface, shellTab]);

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
      const nextTasks = await getHouseholdTasks(session.token, taskScope, {
        spaceId: activeTaskSpaceId,
      });
      setTasks(nextTasks);
    } catch (error) {
      setTasksError(error instanceof Error ? describeServiceAvailabilityError(error.message) : 'Could not load household tasks.');
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
      setTasksError(error instanceof Error ? describeServiceAvailabilityError(error.message) : 'Could not load task history.');
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
        await createHouseholdTask(
          session.token,
          taskScope,
          {
            name: taskName.trim(),
            cronExpr: taskCronExpr.trim(),
            command: taskCommand.trim(),
            commandType: effectiveCommandType,
            enabled: taskEnabled,
          },
          {
            spaceId: activeTaskSpaceId,
          },
        );
        setTasksNotice(`Created ${taskName.trim()}.`);
      }
      setTaskEditorOpen(false);
      await refreshTasks();
      await refreshHouseholdSummary({ silent: true });
    } catch (error) {
      setTasksError(error instanceof Error ? describeServiceAvailabilityError(error.message) : 'Could not save the task.');
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
      setTasksError(error instanceof Error ? describeServiceAvailabilityError(error.message) : 'Could not run the task.');
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
      setTasksError(error instanceof Error ? describeServiceAvailabilityError(error.message) : 'Could not remove the task.');
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
      const listing = await getHouseholdFiles(
        session.token,
        fileSpace,
        toDeviceFilePath(nextPath ?? currentFilePath),
        { spaceId: activeFileSpaceId || undefined },
      );
      setFileListing(mapListingToActiveSpace(listing));
    } catch (error) {
      setFilesError(error instanceof Error ? describeServiceAvailabilityError(error.message) : 'Could not load files right now.');
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
        await createHouseholdDirectory(session.token, fileSpace, toDeviceFilePath(nextPath), {
          spaceId: activeFileSpaceId || undefined,
        });
        setFilesNotice(`Created ${trimmed}.`);
      } else if (fileTargetEntry) {
        const src = fileTargetEntry.path;
        const parent = src.includes('/') ? src.slice(0, src.lastIndexOf('/')) : '';
        const dst = parent ? `${parent}/${trimmed}` : trimmed;
        await renameHouseholdPath(session.token, fileSpace, toDeviceFilePath(src), toDeviceFilePath(dst), {
          spaceId: activeFileSpaceId || undefined,
        });
        setFilesNotice(`Renamed to ${trimmed}.`);
      }
      setFileEditorOpen(false);
      await refreshFiles();
    } catch (error) {
      setFilesError(error instanceof Error ? describeServiceAvailabilityError(error.message) : 'Could not save this change.');
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
      await deleteHouseholdPath(session.token, fileSpace, toDeviceFilePath(entry.path), {
        spaceId: activeFileSpaceId || undefined,
      });
      setFilesNotice(`Removed ${entry.name}.`);
      await refreshFiles();
    } catch (error) {
      setFilesError(error instanceof Error ? describeServiceAvailabilityError(error.message) : 'Could not remove this file.');
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
      const response = await uploadHouseholdFiles(
        session.token,
        fileSpace,
        toDeviceFilePath(currentFilePath),
        uploads,
        { spaceId: activeFileSpaceId || undefined },
      );
      setFilesNotice(`Uploaded ${response.saved.map((item) => item.name).join(', ')}.`);
      await refreshFiles();
    } catch (error) {
      setFilesError(error instanceof Error ? describeServiceAvailabilityError(error.message) : 'Could not upload files.');
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
        buildHouseholdFileDownloadUrl(fileSpace, toDeviceFilePath(entry.path), {
          spaceId: activeFileSpaceId || undefined,
        }),
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
      setFilesError(error instanceof Error ? describeServiceAvailabilityError(error.message) : 'Could not download this file.');
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
      setSettingsNotice(describeDeviceActionNotice('reset_ready'));
      setDiagnosticsPayload(null);
      setDiagnosticsDeviceId('');
      await refreshHouseholdSummary({ silent: true });
    } catch (error) {
      setDiagnosticsError(error instanceof Error ? error.message : 'Could not reset this device.');
    } finally {
      setDiagnosticsBusy(false);
    }
  }

  async function refreshOwnerConsole(
    deviceId = ownerDeviceId,
    options?: { preserveFeedback?: boolean; context?: OwnerConsoleContext },
  ): Promise<void> {
    if (!session?.token || !deviceId) {
      return;
    }
    setOwnerConsoleContext(options?.context ?? 'tools');
    setOwnerConsoleBusy(true);
    setOwnerConsoleError('');
    if (!options?.preserveFeedback) {
      setOwnerConsoleNotice('');
    }
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
      setOwnerOnboardProvider('');
      setOwnerOnboardModel(providerConfig.defaultModel || '');
      setOwnerInference(inference);
    } catch (error) {
      setOwnerConsoleError(error instanceof Error ? error.message : 'Could not load advanced device settings.');
    } finally {
      setOwnerConsoleBusy(false);
    }
  }

  async function reconnectOwnerDevice(): Promise<void> {
    if (!session?.token || !ownerDeviceId) {
      return;
    }
    setOwnerConsoleContext('tools');
    setOwnerConsoleBusy(true);
    setOwnerConsoleError('');
    setOwnerConsoleNotice('');
    try {
      const reconnect = await reconnectDevice(session.token, ownerDeviceId);
      setOwnerConsoleNotice(reconnect.detail);
      await refreshHouseholdSummary({ silent: true });
      await refreshOwnerConsole(ownerDeviceId, { preserveFeedback: true, context: 'tools' });
    } catch (error) {
      setOwnerConsoleError(error instanceof Error ? error.message : 'Could not reconnect Sparkbox.');
      setOwnerConsoleBusy(false);
    }
  }

  async function saveOwnerProviderSettings(): Promise<void> {
    if (!session?.token || !ownerDeviceId) {
      return;
    }
    setOwnerConsoleContext('provider');
    setOwnerConsoleBusy(true);
    setOwnerConsoleError('');
    setOwnerConsoleNotice('');
    try {
      await updateDeviceProviderConfig(session.token, ownerDeviceId, ownerProviderConfig);
      setOwnerConsoleNotice(describeDeviceActionNotice('provider_saved'));
      await refreshOwnerConsole(ownerDeviceId, { preserveFeedback: true, context: 'provider' });
    } catch (error) {
      setOwnerConsoleError(error instanceof Error ? error.message : 'Could not save provider settings.');
      setOwnerConsoleBusy(false);
    }
  }

  async function runOwnerOnboard(): Promise<void> {
    if (!session?.token || !ownerDeviceId) {
      return;
    }
    setOwnerConsoleContext('onboard');
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
      setOwnerConsoleNotice(describeDeviceActionNotice('re_onboard_finished'));
      await refreshOwnerConsole(ownerDeviceId, { preserveFeedback: true, context: 'onboard' });
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
    setOwnerConsoleContext('service');
    setOwnerConsoleBusy(true);
    setOwnerConsoleError('');
    setOwnerConsoleNotice('');
    try {
      const result = await controlDeviceService(session.token, ownerDeviceId, serviceName, action);
      setOwnerServiceOutput(result.output);
      setOwnerConsoleNotice(describeDeviceActionNotice('service_requested', serviceName, action));
      await refreshOwnerConsole(ownerDeviceId, { preserveFeedback: true, context: 'service' });
    } catch (error) {
      setOwnerConsoleError(error instanceof Error ? error.message : 'Could not control this service.');
      setOwnerConsoleBusy(false);
    }
  }

  const canSubmitWifi = Boolean(selectedSsid.trim()) && !provisionBusy;
  const libraryTabActive = shellTab === 'library';

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

  if (householdShellLoading && session) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.centered}>
          <ActivityIndicator color="#0b6e4f" />
          <Text style={styles.loadingText}>Opening {session.household.name}…</Text>
          <Text style={styles.cardCopy}>Loading your spaces, chats, and device status.</Text>
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
              {describeShellSubtitle({
                shellTab,
                activeSpaceName: activeSpace?.name || '',
                activeSpaceKindLabel: activeSpaceKindLabel || 'Space',
                spacesReady: !waitingForSpaces,
              })}
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

          {libraryTabActive ? (
            <View style={styles.card}>
              <Text style={styles.selectionLabel}>Quick actions</Text>
              <Text style={styles.cardCopy}>
                The creation shortcuts live here so they are always easy to reach.
              </Text>
              <View style={styles.inlineActions}>
                {canMutateActiveSpaceFiles ? (
                  <Pressable
                    android_ripple={{ color: 'rgba(23,53,42,0.14)' }}
                    accessibilityRole="button"
                    style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
                    onPress={() => openFileEditor('mkdir')}
                    disabled={!onlineDeviceAvailable || filesBusy}
                  >
                    <Text style={styles.secondaryButtonText}>New folder</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
                  accessibilityRole="button"
                  style={[styles.primaryButtonSmall, (!onlineDeviceAvailable || !canCreateTasks) ? styles.networkRowDisabled : null]}
                  onPress={() => openTaskEditor()}
                  disabled={!onlineDeviceAvailable || !canCreateTasks}
                >
                  <Text style={styles.primaryButtonText}>New task</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <ScrollView keyboardShouldPersistTaps="handled" removeClippedSubviews={false} contentContainerStyle={styles.content}>
            {shellTab === 'chats' ? (
              <>
                {!activeChatSessionId ? (
                  <>
                <ChatInboxPane
                  styles={styles}
                  headerCopy={describeShellSubtitle({
                    shellTab: 'chats',
                    activeSpaceName: activeSpace?.name || '',
                    activeSpaceKindLabel: activeSpaceKindLabel || 'Space',
                    spacesReady: !waitingForSpaces,
                  })}
                  spacesError={spacesError}
                  spacesBusy={spacesBusy}
                  hasSpaces={spaces.length > 0}
                  canManage={canManage}
                  waitingForSpaces={waitingForSpaces}
                  onlineDeviceAvailable={onlineDeviceAvailable}
                  activeSpaceBodyCopy={
                    waitingForSpaces
                      ? 'Loading your spaces...'
                      : onlineDeviceAvailable
                        ? activeSpace
                          ? `Viewing ${activeSpace.name} (${activeSpaceKindLabel})`
                          : 'Select a space to open its chats.'
                        : 'Sparkbox is offline right now. You can still browse chat history and settings.'
                  }
                  chatSendPhaseCopy={chatSendPhase !== 'idle' ? describeChatSendPhase(chatSendPhase) : ''}
                  chatError={chatError}
                  scopeOptions={
                    (['family', 'private'] as ChatSessionScope[]).map((scope) => ({
                      id: scope,
                      label: describeChatAccess(scope),
                      active: chatScope === scope,
                    }))
                  }
                  chatBusy={chatBusy}
                  canCreateChat={canCreateActiveChat}
                  createChatLabel={describeChatSessionPrimaryActionLabel(activeSpaceCopyContext, chatScope)}
                  sessions={chatSessions.map((sessionItem) => {
                    const active = sessionItem.id === activeChatSessionId;
                    const sharedGroupSession = looksLikeSharedGroupChatSession(
                      sessionItem.name,
                      sessionItem.scope,
                      activeSpaceCopyContext,
                    );
                    const sharedGroupFallback = looksLikeSharedGroupChatSession(
                      sessionItem.name,
                      sessionItem.scope,
                      activeSpaceCopyContext,
                    );
                    const previewText = describeChatSessionPreview(
                      {
                        lastMessagePreview: decodeChatMessageContent(sessionItem.lastMessagePreview ?? ''),
                        lastMessageRole: sessionItem.lastMessageRole,
                        lastMessageSenderDisplayName: sessionItem.lastMessageSenderDisplayName,
                      },
                      session?.user.display_name,
                    );
                    const previewFallback =
                      sharedGroupSession && activeSharedChatParticipantSummary
                        ? activeSharedChatParticipantSummary
                        : sharedGroupFallback
                          ? 'Everyone in this space keeps talking together here with Sparkbox helping everyone stay in sync.'
                          : describeChatSessionPurpose({
                              sessionName: sessionItem.name,
                              scope: sessionItem.scope,
                              spaceDetail: activeSpaceCopyContext,
                            });
                    return {
                      id: sessionItem.id,
                      name: sessionItem.name,
                      preview: previewText || previewFallback,
                      timestamp: describeChatListTimestamp(
                        sessionItem.lastMessageCreatedAt || sessionItem.updatedAt,
                      ),
                      badge: describeChatSessionBadge({
                        sessionName: sessionItem.name,
                        scope: sessionItem.scope,
                        spaceDetail: activeSpaceCopyContext,
                        active,
                      }),
                      active,
                      avatarLabel: sharedGroupSession ? 'G' : sessionItem.scope === 'private' ? 'S' : '#',
                      avatarTone: sharedGroupSession ? 'group' : sessionItem.scope === 'private' ? 'private' : 'shared',
                    };
                  })}
                  emptyStateCopy={describeChatSessionEmptyStateCopy(activeSpaceCopyContext, chatScope)}
                  spaceChips={spaces.map((space) => ({
                    id: space.id,
                    name: space.name,
                    countsCopy: describeSpaceCounts(space.kind, space.threadCount, space.memberCount),
                    active: space.id === activeSpaceId,
                  }))}
                  onOpenSpaceCreator={openSpaceCreator}
                  onSelectSpace={setActiveSpaceId}
                  onSelectScope={(scopeId) => handleChatScopeChange(scopeId as ChatSessionScope)}
                  onRefresh={() => void refreshChatSessions()}
                  onCreateChat={() => openChatSessionEditor()}
                  onOpenSession={setActiveChatSessionId}
                />

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {waitingForSpaces ? 'Chats in this space' : describeSpaceThreadSectionTitle(activeSpaceCopyContext)}
                  </Text>
                  <Text style={styles.cardCopy}>
                    {waitingForSpaces ? 'Loading your spaces...' : describeSpaceThreadSectionCopy(activeSpaceCopyContext)}
                  </Text>
                  {relayNotice ? <Text style={styles.noticeText}>{relayNotice}</Text> : null}
                  {waitingForSpaces ? (
                    <ActivityIndicator color="#0b6e4f" />
                  ) : activeSpaceDetail?.threads.length ? (
                    activeSpaceDetail.threads.map((thread) => (
                      <Pressable
                        key={thread.id}
                        style={styles.deviceRowCard}
                        onPress={() => void openSpaceThread(thread.id)}
                      >
                        <View style={styles.deviceRowHeadline}>
                          <Text style={styles.networkName}>{thread.title}</Text>
                          <Text style={styles.tagMuted}>
                            {describeSpaceThreadRowBadge(
                              activeSpaceCopyContext,
                              thread.title,
                              Boolean(thread.chatSessionId),
                              thread.chatSessionId === activeChatSessionId,
                            )}
                          </Text>
                        </View>
                        <Text style={styles.cardCopy}>
                          {describeSpaceThreadRowCopy(
                            activeSpaceCopyContext,
                            thread.title,
                            Boolean(thread.chatSessionId),
                            thread.chatSessionId === activeChatSessionId,
                          )}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text style={styles.cardCopy}>{describeSpaceThreadEmptyStateCopy(activeSpaceCopyContext)}</Text>
                  )}
                  {activeSpaceDetail?.kind === 'shared' ? (
                    <>
                      <Text style={styles.cardCopy}>
                        If something is hard to phrase, Sparkbox can help you relay it privately to one other person in this space.
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
                          <Text style={styles.primaryButtonText}>Have Sparkbox relay it privately</Text>
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
                        Use this private chat when you want Sparkbox to help you think first, before you bring anything back to the shared space.
                      </Text>
                      <View style={styles.inlineActions}>
                        <Pressable
                          style={styles.primaryButtonSmall}
                          onPress={() => {
                            void openCurrentSpaceSideChannel();
                          }}
                        >
                          <Text style={styles.primaryButtonText}>Talk privately with Sparkbox</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                  {enabledFamilyAppCards.length ? (
                    <>
                      <Text style={styles.selectionLabel}>On in this space</Text>
                      {enabledFamilyAppCards.map((app) => (
                        <View key={app.slug} style={styles.deviceRowCard}>
                          <View style={styles.deviceRowHeadline}>
                            <Text style={styles.networkName}>{app.meta?.entryTitle || app.title}</Text>
                            <Text style={styles.statusTagOnline}>Ready here</Text>
                          </View>
                          <Text style={styles.cardCopy}>
                            {app.meta?.entryCopy || app.meta?.description || 'This family app is ready in this space.'}
                          </Text>
                          {app.meta?.starterPrompts?.length ? (
                            <View style={styles.scopeRow}>
                              {app.meta.starterPrompts.map((prompt) => (
                                <Pressable
                                  key={`${app.slug}-${prompt}`}
                                  style={styles.scopePill}
                                  onPress={() => void openFamilyAppStarter(app.slug, prompt)}
                                >
                                  <Text style={styles.scopePillLabel}>{prompt}</Text>
                                </Pressable>
                              ))}
                            </View>
                          ) : null}
                          <Text style={styles.cardCopy}>
                            {formatFamilyAppConfigSummary(app.config)}
                          </Text>
                          {canManageActiveSpaceFamilyApps ? (
                            <View style={styles.inlineActions}>
                              <Pressable
                                style={styles.secondaryButtonSmall}
                                onPress={() => void disableFamilyAppForActiveSpace(app.slug)}
                                disabled={settingsBusy}
                              >
                                <Text style={styles.secondaryButtonText}>Disable here</Text>
                              </Pressable>
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </>
                  ) : null}
                  {canManage && installedFamilyAppsAvailableForActiveSpace.length ? (
                    <>
                      <Text style={styles.selectionLabel}>Ready to enable here</Text>
                      {installedFamilyAppsAvailableForActiveSpace.map((app) => (
                        <View key={`ready-${app.slug}`} style={styles.deviceRowCard}>
                          <View style={styles.deviceRowHeadline}>
                            <Text style={styles.networkName}>{app.entryTitle || app.title}</Text>
                            <Text style={styles.tagMuted}>{describeFamilyAppRiskLevel(app.riskLevel)}</Text>
                          </View>
                          <Text style={styles.cardCopy}>{app.entryCopy || app.description}</Text>
                          <View style={styles.inlineActions}>
                            <Pressable
                              style={styles.primaryButtonSmall}
                              onPress={() => void enableInstalledFamilyAppForActiveSpace(app.slug)}
                              disabled={settingsBusy}
                            >
                              <Text style={styles.primaryButtonText}>Enable in this space</Text>
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </>
                  ) : null}
                </View>

                {activeSpace ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Inspiration for {activeSpace.name}</Text>
                    <Text style={styles.cardCopy}>
                      Family apps help Sparkbox feel more useful in everyday life. Install them once on this device, then turn them on only in the spaces where they fit.
                    </Text>
                    {chatSpotlightEnabledApps.length > 0 ? (
                      <>
                        <Text style={styles.selectionLabel}>Already helping here</Text>
                        {chatSpotlightEnabledApps.map((app) => (
                          <View key={`chat-enabled-${app.slug}`} style={styles.deviceRowCard}>
                            <View style={styles.deviceRowHeadline}>
                              <Text style={styles.networkName}>{app.meta?.entryTitle || app.title}</Text>
                              <Text style={styles.statusTagOnline}>Ready here</Text>
                            </View>
                            <Text style={styles.cardCopy}>
                              {app.meta?.entryCopy || app.meta?.description || 'Sparkbox is already using this family app in this space.'}
                            </Text>
                            {app.meta?.starterPrompts?.length ? (
                              <View style={styles.scopeRow}>
                                {app.meta.starterPrompts.map((prompt) => (
                                  <Pressable
                                    key={`chat-spotlight-${app.slug}-${prompt}`}
                                    style={styles.scopePill}
                                    onPress={() => void openFamilyAppStarter(app.slug, prompt)}
                                  >
                                    <Text style={styles.scopePillLabel}>{prompt}</Text>
                                  </Pressable>
                                ))}
                              </View>
                            ) : null}
                          </View>
                        ))}
                      </>
                    ) : null}
                    {canManage && chatSpotlightRecommendedInstalledApps.length > 0 ? (
                      <>
                        <Text style={styles.selectionLabel}>Ready to turn on here</Text>
                        {chatSpotlightRecommendedInstalledApps.map((app) => (
                          <View key={`chat-ready-${app.slug}`} style={styles.deviceRowCard}>
                            <View style={styles.deviceRowHeadline}>
                              <Text style={styles.networkName}>{app.entryTitle || app.title}</Text>
                              <Text style={styles.tagMuted}>On this device</Text>
                            </View>
                            <Text style={styles.cardCopy}>{app.entryCopy || app.description}</Text>
                            <View style={styles.inlineActions}>
                              <Pressable
                                style={styles.primaryButtonSmall}
                                onPress={() => void enableInstalledFamilyAppForActiveSpace(app.slug)}
                                disabled={settingsBusy}
                              >
                                <Text style={styles.primaryButtonText}>Turn on in this space</Text>
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </>
                    ) : null}
                    {canManage && chatSpotlightRecommendedCatalogApps.length > 0 ? (
                      <>
                        <Text style={styles.selectionLabel}>Worth adding next</Text>
                        {chatSpotlightRecommendedCatalogApps.map((app) => (
                          <View key={`chat-catalog-${app.slug}`} style={styles.deviceRowCard}>
                            <View style={styles.deviceRowHeadline}>
                              <Text style={styles.networkName}>{app.title}</Text>
                              <Text style={styles.tagMuted}>{activeSpaceTemplateLabel || 'space'}</Text>
                            </View>
                            {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
                            <View style={styles.inlineActions}>
                              <Pressable
                                style={styles.primaryButtonSmall}
                                onPress={() => void installSelectedFamilyApp(app.slug)}
                                disabled={settingsBusy}
                              >
                                <Text style={styles.primaryButtonText}>Install on this device</Text>
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </>
                    ) : null}
                    <View style={styles.inlineActions}>
                      <Pressable style={styles.secondaryButtonSmall} onPress={() => setShellTab('settings')}>
                        <Text style={styles.secondaryButtonText}>Open all family apps</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
                  </>
                ) : null}

                {activeChatSessionId ? (
                  <>
                <ChatDetailPane
                  styles={styles}
                  waitingForSpaces={waitingForSpaces}
                  activeChatTitle={
                    waitingForSpaces
                      ? 'Loading chat...'
                      : activeChatSession?.name || describeActiveChatFallbackTitle(activeSpaceCopyContext)
                  }
                  activeChatSubtitle={
                    waitingForSpaces
                      ? 'Loading your spaces...'
                      : activeChatSession
                        ? describeActiveChatSessionCopy(activeChatSession.name, activeSpaceCopyContext, sharedChatIsVisible)
                        : describeActiveChatEmptyStateCopy(activeSpaceCopyContext)
                  }
                  participantSummary={
                    sharedChatIsVisible && activeSharedChatParticipantSummary && !waitingForSpaces
                      ? activeSharedChatParticipantSummary
                      : ''
                  }
                  participantLabels={activeSharedChatParticipantLabels}
                  onlineDeviceAvailable={onlineDeviceAvailable}
                  showParticipantPills={sharedChatIsVisible && Boolean(activeSpaceDetail) && !waitingForSpaces}
                  showManageActions={Boolean(activeChatSession) && canManageActiveChat && !waitingForSpaces}
                  hasActiveChatSession={Boolean(activeChatSession)}
                  chatBusy={chatBusy}
                  chatTimelineGroups={chatTimelineGroups}
                  hasMessages={activeChatTimelineMessages.length > 0}
                  composerTitle={waitingForSpaces ? 'Loading chat...' : sharedChatIsVisible ? 'Message the group' : 'Send a message'}
                  composerPlaceholder={
                    waitingForSpaces
                      ? 'Loading your spaces...'
                      : describeChatComposerPlaceholder(
                          activeSpaceCopyContext,
                          Boolean(activeChatSession),
                          sharedChatIsVisible,
                        )
                  }
                  chatDraft={chatDraft}
                  canSend={
                    !waitingForSpaces &&
                    onlineDeviceAvailable &&
                    !chatBusy &&
                    Boolean(activeChatSessionId) &&
                    Boolean(chatDraft.trim())
                  }
                  onBack={closeActiveChatDetail}
                  onEdit={() => activeChatSession && openChatSessionEditor(activeChatSession)}
                  onClear={() => void clearCurrentChatSession()}
                  onDelete={() => void deleteCurrentChatSession()}
                  onRetry={(content) => void submitChatMessage(content)}
                  onChangeDraft={setChatDraft}
                  onSend={() => void submitChatMessage()}
                />
                  </>
                ) : null}
              </>
            ) : null}

            {libraryTabActive ? (
              <LibraryPane
                styles={styles}
                activeSpace={activeSpace}
                activeSpaceKindLabel={activeSpaceKindLabel}
                activeSpaceDetail={activeSpaceDetail}
                activeChatSessionId={activeChatSessionId}
                activeSpaceNameFallback={fileSpace === 'family' ? 'Shared space' : 'Private space'}
                fileSpace={fileSpace}
                taskScope={taskScope}
                onlineDeviceAvailable={onlineDeviceAvailable}
                canCreateTasks={canCreateTasks}
                canManage={canManage}
                canMutateActiveSpaceFiles={canMutateActiveSpaceFiles}
                canMutateActiveSpaceLibrary={canMutateActiveSpaceLibrary}
                libraryBusy={libraryBusy}
                filesBusy={filesBusy}
                tasksBusy={tasksBusy}
                libraryError={libraryError}
                filesError={filesError}
                tasksError={tasksError}
                libraryNotice={libraryNotice}
                filesNotice={filesNotice}
                tasksNotice={tasksNotice}
                currentFilePath={currentFilePath}
                libraryOverviewSections={libraryOverviewSections}
                memories={spaceLibrary.memories}
                summaries={spaceLibrary.summaries}
                photoEntries={photoEntries}
                fileListing={fileListing}
                tasks={tasks}
                homeMembers={homeMembers}
                currentUserId={session.user.id}
                summaryEmptyStateCopy={summaryEmptyStateCopy}
                taskEditorQuickActionsCopy="Use Quick actions above when you want to add a new routine."
                onOpenFileEditor={() => openFileEditor('mkdir')}
                onOpenTaskEditor={() => openTaskEditor()}
                onRefreshLibrary={() => void refreshLibrary()}
                onOpenMemoryEditor={() => openMemoryEditor()}
                onEditMemory={(memory) => openMemoryEditor(memory)}
                onDeleteMemory={(memory) => confirmRemoveMemory(memory)}
                onCaptureSummary={() => void captureActiveSpaceSummary()}
                onSaveSummaryAsMemory={(summary) => saveSummaryAsMemory(summary)}
                onDeleteSummary={(summary) => confirmRemoveSummary(summary)}
                onRefreshPhotos={() => void refreshFiles()}
                onUploadPhotos={() => void pickAndUploadFiles()}
                onDownloadPhoto={(entry) => void downloadFileEntry(entry)}
                onDeletePhoto={(entry) => void deleteFileEntry(entry)}
                canManageFileEntry={canManageFileEntry}
                onRefreshFiles={(path) => void refreshFiles(path)}
                onUploadFiles={() => void pickAndUploadFiles()}
                onDownloadFile={(entry) => void downloadFileEntry(entry)}
                onRenameFile={(entry) => openFileEditor('rename', entry)}
                onDeleteFile={(entry) => void deleteFileEntry(entry)}
                onRefreshTasks={() => void refreshTasks()}
                canEditTask={canEditTask}
                canTriggerTask={canTriggerTask}
                onRunTask={(task) => void runTaskNow(task)}
                onOpenTaskHistory={(task) => void openTaskHistory(task)}
                onEditTask={(task) => openTaskEditor(task)}
                onDeleteTask={(task) => void removeTask(task)}
              />
            ) : null}

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
                      <Text style={styles.primaryButtonText}>Open group chat</Text>
                    </Pressable>
                    {canManage ? (
                      <Pressable style={styles.secondaryButtonSmall} onPress={beginNewDeviceOnboarding}>
                        <Text style={styles.secondaryButtonText}>Set up another device</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                <ViewedSpaceCard
                  styles={styles}
                  activeSpaceName={activeSpace?.name || ''}
                  activeSpaceKindLabel={activeSpaceKindLabel}
                  activeSpaceTemplateLabel={activeSpaceTemplateLabel || 'Shared home'}
                  summaryCopy={
                    activeSpace
                      ? describeCurrentSpaceSummaryCopy(
                          activeSpace.name,
                          activeSpaceKindLabel,
                          activeSpace.kind,
                          activeSpace.threadCount,
                        )
                      : ''
                  }
                  countsCopy={
                    activeSpace
                      ? describeSpaceCounts(activeSpace.kind, activeSpace.threadCount, activeSpace.memberCount)
                      : ''
                  }
                  canManageSharedSpace={canManage && activeSpace?.kind === 'shared'}
                  settingsBusy={settingsBusy}
                  spaceMembersEditorBusy={spaceMembersEditorBusy}
                  onManageMembers={openSpaceMembersEditor}
                  onInviteToSpace={() =>
                    void generateInvite('member', {
                      targetSpaceId: activeSpace?.id,
                      targetSpaceName: activeSpace?.name,
                    })
                  }
                />

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Your account</Text>
                  <Text style={styles.cardCopy}>
                    {session.user.display_name} · {describeHouseholdRole(session.user.role)} access
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
                    {canReprovisionDevice
                      ? 'Change Wi-Fi from here without scanning the device again. Sparkbox stays in your household while the app walks through Wi-Fi setup.'
                      : 'Owners can change Wi-Fi from here. Members can still see which Sparkbox devices are attached to this household.'}
                  </Text>
                    {homeDevices.map((device, deviceIndex) => (
                      <View key={device.device_id} style={styles.deviceRowCard}>
                        <Text style={styles.networkName}>
                          {describeDeviceLabel(device.device_id, deviceIndex, homeDevices.length)}
                        </Text>
                        <Text style={styles.cardCopy}>{describeDeviceStatus(device.status)}</Text>
                      {canReprovisionDevice ? (
                        <View style={styles.inlineActions}>
                          <Pressable
                            style={styles.secondaryButtonSmall}
                            onPress={() => void beginDeviceReprovision(device)}
                          >
                            <Text style={styles.secondaryButtonText}>Change Wi-Fi</Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>

                {canManage ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Manage family apps</Text>
                    <Text style={styles.cardCopy}>
                      Install a family app once on this device, then decide which spaces should actually use it.
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
                              Best for: {formatSpaceTemplateList(app.spaceTemplates) || 'Any space'}
                            </Text>
                            {app.capabilities.length > 0 ? (
                              <Text style={styles.cardCopy}>
                                What it helps with: {formatFamilyAppCapabilities(app.capabilities)}
                              </Text>
                            ) : null}
                            <View style={styles.inlineActions}>
                              <Pressable
                                style={styles.primaryButtonSmall}
                                onPress={() => void installSelectedFamilyApp(app.slug)}
                                disabled={settingsBusy}
                              >
                                <Text style={styles.primaryButtonText}>Install on this device</Text>
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </>
                    ) : null}
                    {installedFamilyApps.length > 0 ? (
                      <>
                        <Text style={styles.selectionLabel}>Installed on this device</Text>
                        {installedFamilyApps.map((app) => (
                          <View key={`installed-${app.slug}`} style={styles.deviceRowCard}>
                            <View style={styles.deviceRowHeadline}>
                              <Text style={styles.networkName}>{app.title}</Text>
                              <Text style={styles.statusTagOnline}>On this device</Text>
                            </View>
                            {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
                            <Text style={styles.cardCopy}>
                              Best for: {formatSpaceTemplateList(app.spaceTemplates) || 'Any space'}
                            </Text>
                            <Text style={styles.cardCopy}>
                              {app.supportsProactiveMessages ? 'Can take initiative' : 'Only speaks when asked'}
                              {app.supportsPrivateRelay ? ' · Can help with private relays' : ''}
                              {app.requiresOwnerConfirmation ? ' · Relays stay owner-approved' : ''}
                            </Text>
                            <View style={styles.inlineActions}>
                              <Pressable
                                style={styles.secondaryButtonSmall}
                                onPress={() => void uninstallInstalledFamilyApp(app.slug)}
                                disabled={settingsBusy}
                              >
                                <Text style={styles.secondaryButtonText}>Remove from this device</Text>
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </>
                    ) : null}
                    <Text style={styles.selectionLabel}>Available for this device</Text>
                    {availableFamilyApps.map((app) => (
                      <View key={`catalog-${app.slug}`} style={styles.deviceRowCard}>
                          <View style={styles.deviceRowHeadline}>
                            <Text style={styles.networkName}>{app.title}</Text>
                            <Text style={styles.tagMuted}>{describeFamilyAppRiskLevel(app.riskLevel)}</Text>
                          </View>
                          {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
                          <Text style={styles.cardCopy}>
                            Best for: {formatSpaceTemplateList(app.spaceTemplates) || 'Any space'}
                          </Text>
                          {app.capabilities.length > 0 ? (
                            <Text style={styles.cardCopy}>
                              What it helps with: {formatFamilyAppCapabilities(app.capabilities)}
                            </Text>
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
                    <Text style={styles.cardTitle}>Device tools</Text>
                    <Text style={styles.cardCopy}>
                      Use these when Sparkbox needs a closer check or recovery.
                    </Text>
                    <View style={styles.scopeRow}>
                      {homeDevices.map((device, deviceIndex) => {
                        const active = ownerDeviceId === device.device_id;
                        return (
                          <Pressable
                            key={`owner-device-${device.device_id}`}
                            style={[styles.scopePill, active ? styles.scopePillActive : null]}
                            onPress={() => setOwnerDeviceId(device.device_id)}
                            disabled={ownerConsoleBusy}
                          >
                            <Text style={[styles.scopePillLabel, active ? styles.scopePillLabelActive : null]}>
                              {describeDeviceLabel(device.device_id, deviceIndex, homeDevices.length)}
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
                        <Text style={styles.secondaryButtonText}>Refresh device</Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void reconnectOwnerDevice()}
                        disabled={!ownerDeviceId || ownerConsoleBusy}
                      >
                        <Text style={styles.secondaryButtonText}>Try to reconnect Sparkbox</Text>
                      </Pressable>
                    </View>
                    {renderOwnerConsoleFeedback('tools')}
                    {ownerStatus ? (
                      <View style={styles.deviceRowCard}>
                        <Text style={styles.networkName}>
                          {describeDeviceLabel(
                            ownerDeviceId,
                            Math.max(
                              0,
                              homeDevices.findIndex((device) => device.device_id === ownerDeviceId),
                            ),
                            homeDevices.length || 1,
                          )}{' '}
                          summary
                        </Text>
                        <Text style={styles.cardCopy}>
                          {describeOwnerConsoleModelStatus(ownerStatus.ollama?.service, ownerStatus.ollama?.api)}
                        </Text>
                        <Text style={styles.cardCopy}>
                          {describeOwnerConsoleRuntimeStatus(
                            ownerStatus.zeroclaw?.components?.daemon?.status,
                            ownerStatus.zeroclaw?.components?.gateway?.status,
                          )}
                        </Text>
                        <Text style={styles.cardCopy}>
                          {describeOwnerConsoleInference(
                            ownerStatus.inference?.queued_requests,
                            ownerStatus.inference?.queue_limit,
                            ownerStatus.inference?.active,
                          )}
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
                    <Text style={styles.cardTitle}>AI service for Sparkbox</Text>
                    <Text style={styles.cardCopy}>
                      Keep one shared AI service and model ready for Sparkbox, then update it here if the sign-in changes.
                    </Text>
                    <Text style={styles.selectionLabel}>Default AI service</Text>
                    <TextInput
                      placeholder="Default AI service"
                      placeholderTextColor="#7e8a83"
                      style={styles.input}
                      value={describeAiProvider(ownerProviderConfig.defaultProvider)}
                      editable={false}
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
                                {describeAiProvider(provider)}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                    <Text style={styles.selectionLabel}>Default model</Text>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="Preferred model"
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
                    <Text style={styles.selectionLabel}>Response timeout</Text>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="number-pad"
                      placeholder="Timeout in seconds"
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
                      <Text style={styles.primaryButtonText}>Save AI setup</Text>
                    </Pressable>
                    {renderOwnerConsoleFeedback('provider')}
                    {ownerModels.length ? (
                      <View style={styles.deviceRowCard}>
                        <Text style={styles.networkName}>Local models on this device</Text>
                        {ownerModels.map((model) => (
                          <Text key={model.name} style={styles.cardCopy}>
                            {model.name}
                            {typeof model.size === 'number' ? ` · ${formatByteSize(model.size)}` : ''}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {canManage ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Add another AI service</Text>
                    <Text style={styles.cardCopy}>
                      Use this when Sparkbox needs to connect to another AI service or refresh its sign-in.
                    </Text>
                    <Text style={styles.selectionLabel}>AI service</Text>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="Service name"
                      placeholderTextColor="#7e8a83"
                      style={styles.input}
                      value={ownerOnboardProvider}
                      onChangeText={setOwnerOnboardProvider}
                    />
                    <Text style={styles.selectionLabel}>Model name</Text>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="Model ID"
                      placeholderTextColor="#7e8a83"
                      style={styles.input}
                      value={ownerOnboardModel}
                      onChangeText={setOwnerOnboardModel}
                    />
                    <Text style={styles.selectionLabel}>Access key</Text>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry
                      placeholder="Access key"
                      placeholderTextColor="#7e8a83"
                      style={styles.input}
                      value={ownerOnboardApiKey}
                      onChangeText={setOwnerOnboardApiKey}
                    />
                    <Text style={styles.selectionLabel}>Service URL (optional)</Text>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="Service URL (optional)"
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
                      <Text style={styles.primaryButtonText}>Connect service</Text>
                    </Pressable>
                    {renderOwnerConsoleFeedback('onboard')}
                    {summarizeOwnerServiceOutput(ownerServiceOutput) ? (
                      <Text style={styles.cardCopy}>{summarizeOwnerServiceOutput(ownerServiceOutput)}</Text>
                    ) : null}
                  </View>
                ) : null}

                {canManage ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Restart and recovery</Text>
                    <Text style={styles.cardCopy}>
                      If Sparkbox gets stuck, you can check activity here and restart its main services.
                    </Text>
                    {ownerInference ? (
                      <View style={styles.deviceRowCard}>
                        <Text style={styles.networkName}>What Sparkbox is doing now</Text>
                        <Text style={styles.cardCopy}>
                          {describeOwnerRuntimeQueueSummary(
                            ownerInference.queued_requests,
                            ownerInference.queue_limit,
                          )}
                        </Text>
                        <Text style={styles.cardCopy}>
                          {describeOwnerRuntimeActiveRequest(ownerInference.active_request?.username)}
                        </Text>
                        {ownerInference.queue.map((item) => (
                          <Text key={item.request_id || `${item.username}-${item.position}`} style={styles.cardCopy}>
                            {describeOwnerRuntimeQueueEntry(item.username, item.position)}
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
                        <Text style={styles.secondaryButtonText}>
                          {describeOwnerServiceActionLabel('ollama', 'restart')}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void runOwnerServiceAction('zeroclaw', 'restart')}
                        disabled={!ownerDeviceId || ownerConsoleBusy}
                      >
                        <Text style={styles.secondaryButtonText}>
                          {describeOwnerServiceActionLabel('zeroclaw', 'restart')}
                        </Text>
                      </Pressable>
                    </View>
                    <View style={styles.inlineActions}>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void runOwnerServiceAction('ollama', 'stop')}
                        disabled={!ownerDeviceId || ownerConsoleBusy}
                      >
                        <Text style={styles.secondaryButtonText}>
                          {describeOwnerServiceActionLabel('ollama', 'stop')}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void runOwnerServiceAction('ollama', 'start')}
                        disabled={!ownerDeviceId || ownerConsoleBusy}
                      >
                        <Text style={styles.secondaryButtonText}>
                          {describeOwnerServiceActionLabel('ollama', 'start')}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void runOwnerServiceAction('zeroclaw', 'stop')}
                        disabled={!ownerDeviceId || ownerConsoleBusy}
                      >
                        <Text style={styles.secondaryButtonText}>
                          {describeOwnerServiceActionLabel('zeroclaw', 'stop')}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void runOwnerServiceAction('zeroclaw', 'start')}
                        disabled={!ownerDeviceId || ownerConsoleBusy}
                      >
                        <Text style={styles.secondaryButtonText}>
                          {describeOwnerServiceActionLabel('zeroclaw', 'start')}
                        </Text>
                      </Pressable>
                    </View>
                    {renderOwnerConsoleFeedback('service')}
                    {summarizeOwnerServiceOutput(ownerServiceOutput) ? (
                      <Text style={styles.cardCopy}>{summarizeOwnerServiceOutput(ownerServiceOutput)}</Text>
                    ) : null}
                  </View>
                ) : null}

                {canManage ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Device health and reset</Text>
                    <Text style={styles.cardCopy}>
                      Owners can inspect Sparkbox health and send it back to setup from here.
                    </Text>
                    {diagnosticsError ? <Text style={styles.errorText}>{diagnosticsError}</Text> : null}
                    {homeDevices.map((device, deviceIndex) => (
                      <View key={`diag-${device.device_id}`} style={styles.deviceRowCard}>
                        <Text style={styles.networkName}>
                          {describeDeviceLabel(device.device_id, deviceIndex, homeDevices.length)}
                        </Text>
                        <Text style={styles.cardCopy}>
                          {describeDiagnosticsNetworkSummary(device.last_health_check_summary || '') ||
                            describeDeviceStatus(device.status)}
                        </Text>
                        <View style={styles.inlineActions}>
                          <Pressable
                            style={styles.secondaryButtonSmall}
                            onPress={() => void loadDiagnostics(device.device_id)}
                            disabled={diagnosticsBusy}
                          >
                            <Text style={styles.secondaryButtonText}>Check Sparkbox now</Text>
                          </Pressable>
                          <Pressable
                            style={styles.secondaryButtonSmall}
                            onPress={() =>
                              Alert.alert(
                                'Reset this Sparkbox?',
                                'This sends the device back to setup and removes it from the household until it is ready again.',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  { text: 'Reset', style: 'destructive', onPress: () => void factoryResetDevice(device) },
                                ],
                              )
                            }
                            disabled={diagnosticsBusy}
                          >
                            <Text style={styles.secondaryButtonText}>Reset Sparkbox</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                    {diagnosticsBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
                    {diagnosticsPayload ? (
                      <View style={styles.deviceRowCard}>
                        <Text style={styles.networkName}>
                          {describeDeviceLabel(
                            diagnosticsDeviceId,
                            Math.max(
                              0,
                              homeDevices.findIndex((device) => device.device_id === diagnosticsDeviceId),
                            ),
                            homeDevices.length || 1,
                          )}{' '}
                          health check
                        </Text>
                        <Text style={styles.cardCopy}>
                          Check source: {describeDiagnosticsSource(diagnosticsPayload.cache?.source || 'live')}
                          {diagnosticsPayload.cache?.summary
                            ? ` · ${describeDiagnosticsNetworkSummary(diagnosticsPayload.cache.summary)}`
                            : ''}
                        </Text>
                        {describeDiagnosticsWifiConnection(
                          diagnosticsPayload.network?.wifi_interface,
                          diagnosticsPayload.network?.wifi_radio,
                        ) ? (
                          <Text style={styles.cardCopy}>
                            {describeDiagnosticsWifiConnection(
                              diagnosticsPayload.network?.wifi_interface,
                              diagnosticsPayload.network?.wifi_radio,
                            )}
                          </Text>
                        ) : null}
                        {diagnosticsPayload.network?.preflight?.reasons?.length ? (
                          <Text style={styles.cardCopy}>
                            Still to check: {describeDiagnosticsPreflightReasons(diagnosticsPayload.network.preflight.reasons)}
                          </Text>
                        ) : null}
                        {diagnosticsPayload.self_heal?.plan?.issues?.length ? (
                          <Text style={styles.cardCopy}>
                            Needs attention now: {describeDiagnosticsIssueReasons(diagnosticsPayload.self_heal.plan.issues)}
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
                  <Text style={styles.cardCopy}>{householdMembersCopy}</Text>
                  {homeMembers.map((member) => {
                    const isSelf = member.id === session.user.id;
                    const canDemoteOrPromote = canChangeMemberRole(
                      homeMembers,
                      member,
                      member.role === 'owner' ? 'member' : 'owner',
                    );
                    const canRemoveMemberEntry = canRemoveHouseholdMember(homeMembers, member);
                    return (
                      <View key={member.id} style={styles.deviceRowCard}>
                        <Text style={styles.networkName}>{member.display_name}</Text>
                        <Text style={styles.cardCopy}>{describeHouseholdRole(member.role)}</Text>
                        {canManage && !isSelf ? (
                          <View style={styles.inlineActions}>
                            <Pressable
                              style={[
                                styles.secondaryButtonSmall,
                                !canDemoteOrPromote ? styles.networkRowDisabled : null,
                              ]}
                              onPress={() => void changeMemberRole(member, member.role === 'owner' ? 'member' : 'owner')}
                              disabled={settingsBusy || !canDemoteOrPromote}
                            >
                              <Text style={styles.secondaryButtonText}>
                                {member.role === 'owner' ? 'Remove owner access' : 'Give owner access'}
                              </Text>
                            </Pressable>
                            <Pressable
                              style={[
                                styles.secondaryButtonSmall,
                                !canRemoveMemberEntry ? styles.networkRowDisabled : null,
                              ]}
                              onPress={() => void removeMember(member)}
                              disabled={settingsBusy || !canRemoveMemberEntry}
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
                      Create a standard join invite or invite another owner here. Space-specific invites add people to this household and the shared space you picked.
                    </Text>
                    <View style={styles.inlineActions}>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void generateInvite('member')}
                        disabled={settingsBusy}
                      >
                        <Text style={styles.secondaryButtonText}>Invite someone</Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => void generateInvite('owner')}
                        disabled={settingsBusy}
                      >
                        <Text style={styles.secondaryButtonText}>Invite co-owner</Text>
                      </Pressable>
                    </View>
                    {homePendingInvites.length === 0 ? (
                      <Text style={styles.cardCopy}>No active invites right now.</Text>
                    ) : (
                      homePendingInvites.map((invite) => (
                        <View key={invite.id} style={styles.deviceRowCard}>
                          <Text style={styles.networkName}>{describeInviteRole(invite.role)} invite</Text>
                          <Text style={styles.cardCopy}>Join code: {invite.invite_code || 'Waiting for a fresh code'}</Text>
                          {invite.space_name ? (
                            <Text style={styles.cardCopy}>Adds them to {invite.space_name}</Text>
                          ) : null}
                          <Text style={styles.cardCopy}>{describeInviteExpiry(invite.expires_at)}</Text>
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

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Recent Activity</Text>
                  {homeRecentActivity.length === 0 ? (
                    <Text style={styles.cardCopy}>No household activity yet.</Text>
                  ) : (
                    homeRecentActivity.slice(0, 5).map((event) => (
                      <View key={event.id} style={styles.deviceRowCard}>
                        <Text style={styles.networkName}>{event.actor_name}</Text>
                        <Text style={styles.cardCopy}>
                          {describeActivityEvent(event.details || '', event.event_type)}
                        </Text>
                        {describeUiDateTime(event.created_at) ? (
                          <Text style={styles.cardCopy}>{describeUiDateTime(event.created_at)}</Text>
                        ) : null}
                      </View>
                    ))
                  )}
                </View>
              </>
            ) : null}
          </ScrollView>

          <SpaceCreatorModal
            visible={spaceCreatorOpen}
            busy={spaceCreatorBusy}
            error={spaceCreatorError}
            spaceName={spaceName}
            selectedTemplateLabel={describeSpaceTemplate(spaceTemplate)}
            templateOptions={SPACE_TEMPLATE_OPTIONS.map((template) => ({
              id: template,
              label: describeSpaceTemplate(template),
              active: spaceTemplate === template,
            }))}
            memberOptions={spaceMemberOptions}
            selectedMemberIds={spaceMemberIds}
            styles={styles}
            onRequestClose={() => setSpaceCreatorOpen(false)}
            onChangeSpaceName={setSpaceName}
            onSelectTemplate={(templateId) => setSpaceTemplate(templateId as Exclude<SpaceTemplate, 'private' | 'household'>)}
            onToggleMember={toggleSpaceMember}
            onSubmit={() => void submitSpaceCreator()}
          />

          <Modal
            animationType="slide"
            transparent
            visible={chatSessionEditorOpen}
            onRequestClose={() => setChatSessionEditorOpen(false)}
          >
            <View style={styles.scannerOverlay}>
              <View style={[styles.card, { width: '100%', maxWidth: 560 }]}>
                <Text style={styles.selectionLabel}>
                  {editingChatSession ? `Edit ${describeChatEditorVerb(activeSpaceDetail, chatScope)}` : describeChatSessionPrimaryActionLabel(activeSpaceDetail, chatScope)}
                </Text>
                <Text style={styles.selectionTitle}>
                  {describeChatEditorTitle(activeSpaceDetail, chatScope, Boolean(editingChatSession))}
                </Text>
                <Text style={styles.selectionCopy}>
                  Give this conversation a clear name so everyone knows what Sparkbox is helping with here.
                </Text>
                <TextInput
                  placeholder={describeChatNamePlaceholder(activeSpaceDetail, chatScope)}
                  placeholderTextColor="#7e8a83"
                  style={styles.input}
                  value={chatSessionName}
                  onChangeText={setChatSessionName}
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
                    {chatBusy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {describeChatEditorPrimaryActionLabel(activeSpaceDetail, chatScope, Boolean(editingChatSession))}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          <SpaceMembersEditorModal
            visible={spaceMembersEditorOpen}
            activeSpaceName={activeSpace?.name || ''}
            ownerDisplayName={session?.user.display_name || 'You'}
            memberOptions={activeSharedSpaceMemberOptions}
            selectedMemberIds={spaceMembersEditorIds}
            error={spaceMembersEditorError}
            busy={spaceMembersEditorBusy}
            settingsBusy={settingsBusy}
            showInviteButton={activeSpace?.kind === 'shared'}
            styles={styles}
            onRequestClose={() => setSpaceMembersEditorOpen(false)}
            onToggleMember={toggleSpaceMembersEditorMember}
            onInviteToSpace={() =>
              void generateInvite('member', {
                targetSpaceId: activeSpace?.id,
                targetSpaceName: activeSpace?.name,
              })
            }
            onSubmit={() => void submitSpaceMembersEditor()}
          />

          <Modal
            animationType="slide"
            transparent
            visible={memoryEditorOpen}
            onRequestClose={closeMemoryEditor}
          >
            <View style={styles.scannerOverlay}>
              <View style={[styles.card, { width: '100%', maxWidth: 560 }]}>
                <Text style={styles.selectionLabel}>{editingMemory ? 'Edit memory' : 'New memory'}</Text>
                <Text style={styles.selectionTitle}>
                  {editingMemory ? 'Update what Sparkbox should remember' : 'Save a new memory for this space'}
                </Text>
                <Text style={styles.selectionCopy}>
                  Memories are the key details Sparkbox should remember for this space.
                </Text>
                <TextInput
                  placeholder="Memory title"
                  placeholderTextColor="#7e8a83"
                  style={styles.input}
                  value={memoryTitle}
                  onChangeText={setMemoryTitle}
                />
                <TextInput
                  placeholder="What should Sparkbox remember?"
                  placeholderTextColor="#7e8a83"
                  style={[styles.input, styles.textArea]}
                  value={memoryContent}
                  onChangeText={setMemoryContent}
                  multiline
                />
                <View style={styles.inlineActions}>
                  <Pressable
                    style={[styles.secondaryButtonSmall, memoryPinned ? styles.scopePillActive : null]}
                    onPress={() => setMemoryPinned((current) => !current)}
                  >
                    <Text style={[styles.secondaryButtonText, memoryPinned ? styles.scopePillLabelActive : null]}>
                      {memoryPinned ? 'Pinned' : 'Pin memory'}
                    </Text>
                  </Pressable>
                </View>
                {libraryError ? <Text style={styles.errorText}>{libraryError}</Text> : null}
                <View style={styles.inlineActions}>
                  <Pressable
                    style={styles.secondaryButtonSmall}
                    onPress={closeMemoryEditor}
                    disabled={libraryBusy}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.primaryButtonSmall}
                    onPress={() => void submitMemoryEditor()}
                    disabled={libraryBusy}
                  >
                    {libraryBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{editingMemory ? 'Save memory' : 'Create memory'}</Text>}
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
                          <Text style={styles.networkName}>{describeTaskRunStatus(run.status)}</Text>
                          <Text
                            style={
                              describeTaskRunStatus(run.status) === 'Completed'
                                ? styles.statusTagOnline
                                : styles.statusTagOffline
                            }
                          >
                            {describeTaskRunStartedAt(run.startedAt)}
                          </Text>
                        </View>
                        {run.finishedAt ? <Text style={styles.cardCopy}>{describeTaskRunFinishedAt(run.finishedAt)}</Text> : null}
                        {describeTaskRunOutput(run.output || '') ? (
                          <Text style={styles.cardCopy}>{describeTaskRunOutput(run.output || '')}</Text>
                        ) : null}
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
                <Text style={styles.selectionTitle}>Have Sparkbox relay it privately</Text>
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
          <Text style={styles.title}>Find it first. Bring it online second.</Text>
          <Text style={styles.subtitle}>
            {claimStepVisible
              ? `Scan the device label, reserve Sparkbox for ${householdName}, then guide it onto home Wi-Fi.`
              : 'Sparkbox is already in your household. Get it ready for Wi-Fi again.'}
          </Text>
        </View>

        {canReturnToShell ? (
          <View style={styles.inlineActions}>
            <Pressable style={styles.secondaryButtonSmall} onPress={returnToShell}>
              <Text style={styles.secondaryButtonText}>Back to household</Text>
            </Pressable>
          </View>
        ) : null}

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
          <AuthSetupCard
            styles={styles}
            authCardTitle={authCardTitle}
            authCardCopy={authCardCopy}
            authMode={authMode}
            email={email}
            displayName={displayName}
            inviteCode={inviteCode}
            password={password}
            invitePreviewBusy={invitePreviewBusy}
            invitePreviewError={invitePreviewError}
            invitePreview={invitePreview}
            authError={authError}
            authBusy={authBusy}
            authSubmitLabel={authSubmitLabel}
            onLayout={(event) => captureStepOffset(1, event)}
            onChangeAuthMode={(mode) => {
              setAuthMode(mode);
              setAuthError('');
            }}
            onChangeEmail={setEmail}
            onChangeDisplayName={setDisplayName}
            onChangeInviteCode={setInviteCode}
            onChangePassword={setPassword}
            onSubmit={() => void submitAuth()}
            renderInvitePreviewSummary={buildInvitePreviewSummary}
          />
        ) : (
          <SignedInSetupCard
            styles={styles}
            displayName={session.user.display_name}
            householdName={session.household.name}
            canReturnToShell={canReturnToShell}
            onLogout={() => void logout()}
            onReturnToShell={returnToShell}
            onResetFlow={resetFlow}
          />
        )}

        {session && claimStepVisible ? (
          <View style={styles.card} onLayout={(event) => captureStepOffset(1, event)}>
            <Text style={styles.cardTitle}>1. Scan the Sparkbox label</Text>
            {step1Collapsed ? (
              <View style={styles.stepSummary}>
                <Text style={styles.stepSummaryTitle}>{describeSetupDeviceLabel(claimPayload?.deviceId)}</Text>
                <Text style={styles.stepSummaryCopy}>
                  Reserved for {householdName}. The app can now guide Sparkbox onto home Wi-Fi.
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
                  placeholder="Paste the Sparkbox setup code or setup link."
                  placeholderTextColor="#7e8a83"
                  style={[styles.input, styles.textArea]}
                  value={claimInput}
                  onChangeText={applyClaimInput}
                />
                {claimPayload ? (
                  <View style={styles.claimPreview}>
                    <Text style={styles.claimPreviewLabel}>Sparkbox found</Text>
                    <Text style={styles.claimPreviewValue}>{describeSetupDeviceLabel(claimPayload.deviceId)}</Text>
                    <Text style={styles.cardCopy}>Your setup code is ready. Wi-Fi comes next.</Text>
                  </View>
                ) : null}
                {claimError ? <Text style={styles.errorText}>{claimError}</Text> : null}
                <View style={styles.inlineActions}>
                  <Pressable style={styles.primaryButtonSmall} onPress={() => void openScanner()}>
                    <Text style={styles.primaryButtonText}>Scan QR</Text>
                  </Pressable>
                  {claimError === CAMERA_PERMISSION_RECOVERY_MESSAGE ? (
                    <Pressable style={styles.secondaryButtonSmall} onPress={() => void Linking.openSettings()}>
                      <Text style={styles.secondaryButtonText}>Open app settings</Text>
                    </Pressable>
                  ) : null}
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => void startClaim()} disabled={claimBusy}>
                    {claimBusy ? <ActivityIndicator color="#0f5132" /> : <Text style={styles.secondaryButtonText}>Get Sparkbox ready</Text>}
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
                <Text style={styles.stepSummaryTitle}>{describeSetupDeviceLabel(setupDeviceId)}</Text>
                <Text style={styles.stepSummaryCopy}>
                  This device is already in your household. You only need to get it ready for Wi-Fi updates.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.cardCopy}>
                  No QR scan is needed. If Sparkbox is in a new place, power it on and wait for{' '}
                  {HOTSPOT_SSID}. If it is still on the old network, use this screen when the hotspot appears.
                </Text>
                <View style={styles.claimPreview}>
                  <Text style={styles.claimPreviewLabel}>Device</Text>
                  <Text style={styles.claimPreviewValue}>{describeSetupDeviceLabel(setupDeviceId)}</Text>
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
                  Your phone reached Sparkbox. Home Wi-Fi setup is next.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.cardCopy}>
                  Sparkbox now shares a temporary setup network. The app will try to switch your phone automatically.
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
                  Sparkbox is already using this choice to leave setup and finish activation.
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
                            {network.support_level === 'warning' ? <Text style={styles.tagWarning}>Sign-in may be required</Text> : null}
                            {unsupported ? <Text style={styles.tagMuted}>Not supported</Text> : null}
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
            {setupPageState?.status ? (
              <Text style={styles.statusText}>Setup progress: {describeActivationStatus(setupPageState.status)}</Text>
            ) : null}
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
                  {describeSetupDeviceLabel(completedDeviceId)} is online in {householdName}. You can now go back to the household app and chat normally.
                </Text>
                {canReturnToShell ? (
                  <View style={styles.inlineActions}>
                    <Pressable style={styles.primaryButtonSmall} onPress={returnToShell}>
                      <Text style={styles.primaryButtonText}>Back to household</Text>
                    </Pressable>
                  </View>
                ) : null}
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
                : 'Create a new folder here so files for this space stay organized.'}
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
                : 'Enter the Wi-Fi password, then Sparkbox will leave setup and join this network.'}
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
              {editingTask
                ? editingTask.name
                : activeSpace
                  ? `${activeSpace.name} routine`
                  : taskScope === 'family'
                    ? 'Shared Sparkbox routine'
                    : 'Private Sparkbox routine'}
            </Text>
            <Text style={styles.selectionCopy}>{taskEditorCopy}</Text>
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
              placeholder="When should this happen?"
              placeholderTextColor="#7e8a83"
              style={styles.input}
              value={taskCronExpr}
              onChangeText={setTaskCronExpr}
            />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={canManage ? 'What should Sparkbox do?' : 'What should Sparkbox do for you?'}
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
                        {kind === 'zeroclaw' ? 'Sparkbox routine' : 'Custom command'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.cardCopy}>Run mode: Sparkbox routine</Text>
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
  chatInboxHeader: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#d6dfd9',
    backgroundColor: '#f7f9f7',
    padding: 16,
    gap: 14,
  },
  chatInboxHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  chatInboxHeaderBody: {
    flex: 1,
    gap: 6,
  },
  chatInboxHeaderTitle: {
    color: '#17352a',
    fontSize: 20,
    fontWeight: '800',
  },
  chatInboxHeaderCopy: {
    color: '#556860',
    fontSize: 14,
    lineHeight: 20,
  },
  chatInboxSpaceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chatInboxSpaceChip: {
    minWidth: 150,
    flexGrow: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d6dfd9',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  chatInboxSpaceChipActive: {
    backgroundColor: '#17352a',
    borderColor: '#17352a',
  },
  chatInboxSpaceChipLabel: {
    color: '#17352a',
    fontSize: 15,
    fontWeight: '800',
  },
  chatInboxSpaceChipLabelActive: {
    color: '#ffffff',
  },
  chatInboxSpaceChipMeta: {
    color: '#61746a',
    fontSize: 12,
    lineHeight: 18,
  },
  chatInboxSpaceChipMetaActive: {
    color: 'rgba(255,255,255,0.82)',
  },
  chatSessionRow: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d6dfd9',
    backgroundColor: '#fff',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  chatSessionRowActive: {
    backgroundColor: '#eef5ef',
    borderColor: '#c4ded1',
  },
  chatSessionAvatarRail: {
    width: 44,
    alignItems: 'center',
    paddingTop: 2,
  },
  chatSessionAvatarBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSessionAvatarBubbleGroup: {
    backgroundColor: '#17352a',
  },
  chatSessionAvatarBubbleShared: {
    backgroundColor: '#eef5ef',
  },
  chatSessionAvatarBubblePrivate: {
    backgroundColor: '#fff1cf',
  },
  chatSessionAvatarLabel: {
    color: '#17352a',
    fontSize: 16,
    fontWeight: '800',
  },
  chatSessionAvatarLabelOnDark: {
    color: '#ffffff',
  },
  chatSessionBody: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  chatSessionTitle: {
    color: '#17352a',
    fontSize: 16,
    fontWeight: '800',
  },
  chatSessionTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  chatSessionMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  chatSessionTimestamp: {
    color: '#61746a',
    fontSize: 12,
    fontWeight: '600',
  },
  chatSessionPreview: {
    color: '#556860',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  chatDetailHeader: {
    gap: 12,
    marginBottom: 12,
  },
  chatDetailHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chatDetailHeaderBody: {
    gap: 6,
  },
  chatDetailTitle: {
    color: '#17352a',
    fontSize: 22,
    fontWeight: '800',
  },
  chatDetailSubtitle: {
    color: '#556860',
    fontSize: 14,
    lineHeight: 21,
  },
  chatDetailParticipants: {
    color: '#4f6b5e',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  chatMessageGroup: {
    gap: 6,
    maxWidth: '88%',
    marginBottom: 8,
  },
  chatMessageGroupUser: {
    alignSelf: 'flex-end',
  },
  chatMessageGroupAssistant: {
    alignSelf: 'flex-start',
  },
  chatStatusNotice: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d6dfd9',
    backgroundColor: '#f7f9f7',
    padding: 14,
    gap: 8,
    marginBottom: 10,
  },
  chatStatusNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  chatStatusNoticeCopy: {
    color: '#17352a',
    fontSize: 14,
    lineHeight: 20,
  },
  chatStatusTimestamp: {
    color: '#61746a',
    fontSize: 12,
    fontWeight: '600',
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
  chatBubbleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
  chatBubbleTimestamp: {
    color: '#61746a',
    fontSize: 12,
    fontWeight: '600',
  },
  chatBubbleTimestampUser: {
    color: 'rgba(255,255,255,0.8)',
  },
  groupParticipantPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d7dfda',
    backgroundColor: '#fffdf8',
  },
  groupParticipantPillSelf: {
    backgroundColor: '#17352a',
    borderColor: '#17352a',
  },
  groupParticipantPillOnline: {
    backgroundColor: '#e8f5ee',
    borderColor: '#c4ded1',
  },
  groupParticipantPillOffline: {
    backgroundColor: '#f8e7df',
    borderColor: '#eccabc',
  },
  groupParticipantLabel: {
    color: '#51665b',
    fontSize: 13,
    fontWeight: '700',
  },
  groupParticipantLabelSelf: {
    color: '#ffffff',
  },
  groupParticipantLabelOnline: {
    color: '#0b6e4f',
  },
  groupParticipantLabelOffline: {
    color: '#7b4630',
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
