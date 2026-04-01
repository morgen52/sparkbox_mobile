import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { Buffer } from 'buffer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  LayoutChangeEvent,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AnimatedPressable as Pressable } from './src/components/AnimatedPressable';
import { ChatsPane } from './src/components/ChatsPane';
import { HouseholdPeoplePane } from './src/components/HouseholdPeoplePane';
import { LibraryPane } from './src/components/LibraryPane';
import type { LibrarySectionKey } from './src/components/LibraryPane';
import { OwnerSettingsPane } from './src/components/OwnerSettingsPane';
import { SettingsDevicesPane } from './src/components/SettingsDevicesPane';
import { SpaceCreatorModal } from './src/components/SpaceCreatorModal';
import { SetupSurface } from './src/components/SetupSurface';
import { ShellModals } from './src/components/ShellModals';
import { SettingsSummaryPane } from './src/components/SettingsSummaryPane';
import { ShellHeader } from './src/components/ShellHeader';
import { ViewedSpaceCard } from './src/components/ViewedSpaceCard';
import { styles } from './src/styles/appStyles';
import { type AuthMode, type Session } from './src/authFlow';
import {
  describeActivityEvent,
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
  describeShellSubtitle,
  PHASE_ONE_TABS,
  resolvePhaseOneSurface,
  type PhaseOneSurface,
} from './src/appShell';
import {
  clearChatSessionMessages,
  controlDeviceService,
  buildHouseholdFileDownloadUrl,
  captureSpaceSummaryFromSession,
  createHouseholdSpace,
  createHouseholdDirectory,
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
  type SpaceLibrary,
  type SpaceMemory,
  type SpaceSummary,
  type ChatSessionScope,
  type HouseholdChatSessionDetail,
  type HouseholdChatSessionSummary,
  triggerHouseholdTask,
  uninstallFamilyApp,
  updateHouseholdSpaceMembers,
  updateSpaceMemory,
  updateDeviceProviderConfig,
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
  describeHouseholdRole,
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
  describeChatSessionEmptyStateCopy,
  describeChatSessionOpenError,
  describeChatSessionPrimaryActionLabel,
  describeChatSessionPreview,
  describeChatSessionPurpose,
  describeChatAccess,
  describeChatComposerPlaceholder,
  describeChatSendPhase,
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
import { openInternetPanel } from './src/wifiOnboarding';
import { initializeCloudApiBase } from './src/cloudApiBase';
import { buildInvitePreviewSummary, shouldLoadInvitePreview } from './src/invitePreview';
import {
  buildActiveSpaceStorageKey,
  describeSpaceSessionCountCopy,
  formatChatSyncDateTime,
} from './src/utils/appRuntime';
import { useChatSessionCache } from './src/hooks/useChatSessionCache';
import { useSetupController } from './src/hooks/useSetupController';
import { useChatController } from './src/hooks/useChatController';
import {
  buildChatTimelineGroups,
  type ChatTimelineMessage,
} from './src/utils/chatTimeline';
import { apiJson } from './src/utils/cloudJson';
import {
  CAMERA_PERMISSION_RECOVERY_MESSAGE,
  HOTSPOT_SSID,
  type ChatListSyncSource,
  type OwnerConsoleContext,
} from './src/constants/appRuntimeConstants';
import { loadStoredSession, persistStoredSession } from './src/utils/sessionStorage';
import { authenticateSession, revokeSession } from './src/utils/authApi';


const globalWithBuffer = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
if (!globalWithBuffer.Buffer) {
  globalWithBuffer.Buffer = Buffer;
}

initializeCloudApiBase(Constants.expoConfig?.extra?.cloudApiBase as string | undefined);

const SPACE_TEMPLATE_OPTIONS: Array<Exclude<SpaceTemplate, 'private' | 'household'>> = [
  'partner',
  'parents',
  'child',
  'household_ops',
];

function App() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Auth + onboarding state stays in App because the shell can hand back into
  // setup at any time for first-run claim, reprovision, or post-setup recovery.
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

  // Shell state fans out into presentational panes, but the coordination
  // between tabs, spaces, chats, files, tasks, and owner tooling still lives
  // here so cross-surface resets happen in one place.
  const [shellTab, setShellTab] = useState<ShellTab>('chats');
  const [spaceHomeMode, setSpaceHomeMode] = useState<'list' | 'inside'>('list');
  const [spaceListViewMode, setSpaceListViewMode] = useState<'spaces' | 'global-settings'>('spaces');
  const [shellSurface, setShellSurface] = useState<PhaseOneSurface>('onboarding');
  const [skipOnboardingWhenNoDevice, setSkipOnboardingWhenNoDevice] = useState(false);
  const [homeBusy, setHomeBusy] = useState(false);
  const [homeLoaded, setHomeLoaded] = useState(false);
  const [homeError, setHomeError] = useState('');
  const {
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
  } = useSetupController({
    session,
    cameraPermission: cameraPermission ?? null,
    requestCameraPermission: async () => {
      const result = await requestCameraPermission();
      return { granted: result.granted };
    },
    onResetInviteCode: () => setInviteCode(''),
    setSkipOnboardingWhenNoDevice,
    setHomeError,
    setShellSurface,
  });
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
  const [spaceSessionCounts, setSpaceSessionCounts] = useState<Record<string, number>>({});
  const [activeChatSessionId, setActiveChatSessionId] = useState('');
  const [activeChatSession, setActiveChatSession] = useState<HouseholdChatSessionDetail | null>(null);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatListRefreshBusy, setChatListRefreshBusy] = useState(false);
  const [chatListSyncSource, setChatListSyncSource] = useState<ChatListSyncSource>('idle');
  const [chatListLastSyncedAt, setChatListLastSyncedAt] = useState(0);
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
  const [summaryError, setSummaryError] = useState('');
  const [summaryNotice, setSummaryNotice] = useState('');
  const [summaryCaptureSessions, setSummaryCaptureSessions] = useState<HouseholdChatSessionSummary[]>([]);
  const [summaryCaptureSessionsBusy, setSummaryCaptureSessionsBusy] = useState(false);
  const [summaryCapturePickerOpen, setSummaryCapturePickerOpen] = useState(false);
  const [selectedSummaryCaptureSessionId, setSelectedSummaryCaptureSessionId] = useState('');
  const [libraryActiveSection, setLibraryActiveSection] = useState<LibrarySectionKey>('overview');
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
  const [chatAppActionError, setChatAppActionError] = useState('');
  const [chatAppActionNotice, setChatAppActionNotice] = useState('');
  const [familyAppsBusy, setFamilyAppsBusy] = useState(false);
  const [familyAppsCatalog, setFamilyAppsCatalog] = useState<FamilyAppInstallation[]>([]);
  const [installedFamilyApps, setInstalledFamilyApps] = useState<FamilyAppInstallation[]>([]);

  const scrollViewRef = useRef<ScrollView | null>(null);
  const stepOffsetsRef = useRef<Record<number, number>>({});
  const step1Collapsed = Boolean(session) && activeStep > 1;
  const step2Collapsed = step2Visible && activeStep > 2;
  const step3Collapsed = step3Visible && activeStep > 3;
  const activeSpaceStorageKey = buildActiveSpaceStorageKey(session);
  const {
    readFreshChatSessionCache,
    fetchChatSessions,
    clearChatSessionCache,
  } = useChatSessionCache(session?.token);

  // Derived permission/copy state is centralized here so the pane components
  // can stay mostly presentational and avoid re-implementing role logic.
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
        const storedSession = await loadStoredSession();
        if (storedSession) {
          setSession(storedSession);
        }
      } finally {
        setBooting(false);
      }
    })();
  }, []);

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
    ? '管理员可在这里邀请成员、调整管理员权限并移除成员。系统会始终保留至少一位管理员。'
    : '你可以在这里查看家庭成员。如需邀请、调整管理员权限或移除成员，请联系管理员处理。';
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
  const {
    refreshChatSessions: runRefreshChatSessions,
    handleChatScopeChange: runHandleChatScopeChange,
    openCurrentSpaceSideChannel: runOpenCurrentSpaceSideChannel,
    openSpaceThread: runOpenSpaceThread,
    clearCurrentChatSession: runClearCurrentChatSession,
    deleteCurrentChatSession: runDeleteCurrentChatSession,
    openChatSessionEditor: runOpenChatSessionEditor,
    submitChatSessionEditor: runSubmitChatSessionEditor,
    submitChatMessage: runSubmitChatMessage,
  } = useChatController({
    session,
    activeSpaceId,
    activeSpaceDetail,
    activeChatSpaceId,
    chatScope,
    fetchChatSessions,
    readFreshChatSessionCache,
    clearChatSessionCache,
    refreshHouseholdSummary,
    setChatScope,
    setChatSessions,
    setActiveChatSessionId,
    setActiveChatSession,
    setChatDraft,
    setChatError,
    setChatBusy,
    setChatListRefreshBusy,
    setChatListSyncSource,
    setChatListLastSyncedAt,
    setSpaceSessionCounts,
    setChatSendPhase,
    setChatPendingMessage,
    setChatPendingNoteIndex,
    setActiveSpaceDetail,
    setChatSessionEditorOpen,
    setEditingChatSession,
    setChatSessionName,
    setChatSessionSystemPrompt,
    setChatSessionTemperature,
    setChatSessionMaxTokens,
  });
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
  const enabledFamilyAppCards =
    activeSpaceDetail?.enabledFamilyApps
      .filter((enabled) => installedFamilyAppsBySlug.has(enabled.slug))
      .map((enabled) => ({
        ...enabled,
        meta:
          installedFamilyAppsBySlug.get(enabled.slug) ??
          familyAppsCatalog.find((item) => item.slug === enabled.slug) ??
          null,
      })) ?? [];
  const installedFamilyAppsAvailableForActiveSpace = activeSpace
    ? installedFamilyApps.filter(
        (app) =>
          !activeSpaceDetail?.enabledFamilyApps.some((enabled) => enabled.slug === app.slug),
      )
    : [];
  const recommendedFamilyApps = activeSpace
    ? availableFamilyApps.filter((app) => app.spaceTemplates.includes(activeSpace.template))
    : [];
  const summaryEmptyStateCopy = describeSummaryEmptyStateCopy(
    activeSpaceDetail,
    canMutateActiveSpaceLibrary,
    activeChatSession?.name || '',
  );
  const authCardTitle =
    authMode === 'login'
      ? '欢迎回来'
      : authMode === 'register'
        ? '创建你的家庭'
        : '输入邀请码加入家庭';
  const authCardCopy =
    authMode === 'login'
      ? '使用你之前绑定 Sparkbox 的账号登录即可继续使用。'
      : authMode === 'register'
        ? '首次使用请先创建家庭，并成为首位管理员。'
        : '请粘贴管理员分享的邀请码，系统会自动识别可加入的家庭。';
  const authSubmitLabel =
    authMode === 'login' ? '登录并进入' : authMode === 'register' ? '创建并进入' : '加入并进入';
  const spaceMemberOptions = homeMembers.filter((member) => member.id !== session?.user.id);
  const activeSharedSpaceMemberOptions =
    activeSpace?.kind === 'shared' ? homeMembers.filter((member) => member.id !== session?.user.id) : [];
  const canReturnToShell = Boolean(session) && homeLoaded;
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
    setSkipOnboardingWhenNoDevice(true);
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

  async function refreshSummaryLibrary(): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      return;
    }
    setLibraryBusy(true);
    setSummaryError('');
    try {
      const nextLibrary = await getSpaceLibrary(session.token, activeSpaceId);
      setSpaceLibrary(nextLibrary);
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : '暂时无法刷新本空间摘要。');
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

  async function captureActiveSpaceSummary(sessionId?: string): Promise<void> {
    const targetSessionId = (sessionId || selectedSummaryCaptureSessionId || activeChatSessionId).trim();
    if (!session?.token || !activeSpaceId || !targetSessionId) {
      setSummaryError(describeSpaceSummaryCaptureMissingChatCopy(activeSpaceDetail));
      return;
    }
    if (!canMutateActiveSpaceLibrary) {
      setSummaryError('Only owners can change shared memories and summaries.');
      return;
    }
    const selectedSession = summaryCaptureSessions.find((item) => item.id === targetSessionId);
    setLibraryBusy(true);
    setSummaryError('');
    try {
      await captureSpaceSummaryFromSession(session.token, activeSpaceId, {
        chatSessionId: targetSessionId,
        title: `${selectedSession?.name || '当前聊天'} snapshot`,
      });
      setSummaryNotice(`已从「${selectedSession?.name || '当前聊天'}」生成摘要。`);
      await refreshSummaryLibrary();
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : '暂时无法生成摘要。');
    } finally {
      setLibraryBusy(false);
    }
  }

  async function saveSummaryAsMemory(summary: SpaceSummary): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      return;
    }
    if (!canMutateActiveSpaceLibrary) {
      setSummaryError('Only owners can change shared memories and summaries.');
      return;
    }
    setLibraryBusy(true);
    setSummaryError('');
    try {
      await createSpaceMemory(session.token, activeSpaceId, {
        title: summary.title,
        content: summary.content,
      });
      setSummaryNotice(`已将「${summary.title}」保存为记忆。`);
      await refreshSummaryLibrary();
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : '无法将该摘要保存为记忆。');
    } finally {
      setLibraryBusy(false);
    }
  }

  async function removeSpaceSummary(summaryId: string, title: string): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      return;
    }
    if (!canMutateActiveSpaceLibrary) {
      setSummaryError('Only owners can change shared memories and summaries.');
      return;
    }
    setLibraryBusy(true);
    setSummaryError('');
    try {
      await deleteSpaceSummary(session.token, activeSpaceId, summaryId);
      setSummaryNotice(`已删除摘要「${title}」。`);
      await refreshSummaryLibrary();
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : '无法删除该摘要。');
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
    // shellSurface is the top-level router between onboarding and the daily-use
    // shell. Keep it derived from source-of-truth state instead of letting
    // individual screens mutate it ad hoc.
    setShellSurface(
      resolvePhaseOneSurface({
        sessionPresent: Boolean(session),
        setupFlowRequested,
        onboardingInProgress,
        activationComplete: Boolean(completedDeviceId),
        householdLoaded: homeLoaded,
        hasAnyDevice: homeDevices.length > 0,
        skipOnboardingWhenNoDevice,
      }),
    );
  }, [
    completedDeviceId,
    homeDevices.length,
    homeLoaded,
    onboardingInProgress,
    session,
    setupFlowRequested,
    skipOnboardingWhenNoDevice,
  ]);

  useEffect(() => {
    if (!session?.token) {
      clearChatSessionCache();
      setHomeDevices([]);
      setHomeMembers([]);
      setHomePendingInvites([]);
      setHomeRecentActivity([]);
      setSpaces([]);
      setSpaceSessionCounts({});
      setActiveSpaceId('');
      setSpaceHomeMode('list');
      setSpaceListViewMode('spaces');
      setPreferredActiveSpaceId('');
      setLoadedActiveSpaceStorageKey('');
      setActiveSpaceDetail(null);
      setChatSessions([]);
      setChatListRefreshBusy(false);
      setChatListSyncSource('idle');
      setChatListLastSyncedAt(0);
      setActiveChatSessionId('');
      setActiveChatSession(null);
      setSpaceLibrary({ memories: [], summaries: [] });
      setLibraryError('');
      setLibraryNotice('');
      setSummaryError('');
      setSummaryNotice('');
      setSummaryCaptureSessions([]);
      setSummaryCaptureSessionsBusy(false);
      setSummaryCapturePickerOpen(false);
      setSelectedSummaryCaptureSessionId('');
      setLibraryActiveSection('overview');
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

    // Once auth is ready and setup no longer blocks, hydrate the shell-level
    // summary first. Downstream panes fetch their own detail from this base.
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
    if (spaceHomeMode === 'inside' && !activeSpaceId) {
      setSpaceHomeMode('list');
    }
  }, [activeSpaceId, spaceHomeMode]);

  useEffect(() => {
    if (!activeSpaceStorageKey || loadedActiveSpaceStorageKey !== activeSpaceStorageKey || !activeSpaceId) {
      return;
    }
    // Persist the user's last viewed space per household + user so owner/member
    // sessions do not fight over the same restored tab state.
    setPreferredActiveSpaceId((current) => (current === activeSpaceId ? current : activeSpaceId));
    void AsyncStorage.setItem(activeSpaceStorageKey, activeSpaceId).catch(() => undefined);
  }, [activeSpaceId, activeSpaceStorageKey, loadedActiveSpaceStorageKey]);

  useEffect(() => {
    if (!activeSpace) {
      setActiveSpaceDetail(null);
      return;
    }

    // Space selection drives the legacy family/private scope split that file,
    // task, and chat APIs still use internally.
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
    // Space detail is the bridge between the summary list and all
    // space-specific panes. Chat/library/settings all read from this snapshot.
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
    // Crossing spaces should feel like entering a different room. Reset the
    // per-space chat/library/task UI state here so one space never leaks into
    // another.
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
    setSummaryError('');
    setSummaryNotice('');
    setSummaryCapturePickerOpen(false);
    setSelectedSummaryCaptureSessionId('');
    setLibraryActiveSection('overview');
    setChatAppActionError('');
    setChatAppActionNotice('');
  }, [activeSpaceId]);

  const refreshSpaceSessionTotal = useCallback(
    async (
      spaceId: string,
      options?: {
        force?: boolean;
        knownScope?: ChatSessionScope;
        knownCount?: number;
      },
    ): Promise<void> => {
      if (!spaceId) {
        return;
      }
      const counts: Partial<Record<ChatSessionScope, number>> = {};
      if (options?.knownScope && typeof options.knownCount === 'number') {
        counts[options.knownScope] = options.knownCount;
      }
      const pendingScopes = (['family', 'private'] as ChatSessionScope[]).filter(
        (scope) => counts[scope] === undefined,
      );
      const loaded = await Promise.all(
        pendingScopes.map(async (scope) => {
          const sessions = await fetchChatSessions(scope, spaceId, { force: options?.force === true });
          return [scope, sessions.length] as const;
        }),
      );
      loaded.forEach(([scope, count]) => {
        counts[scope] = count;
      });
      const totalCount = (counts.family ?? 0) + (counts.private ?? 0);
      setSpaceSessionCounts((current) => ({
        ...current,
        [spaceId]: totalCount,
      }));
    },
    [fetchChatSessions],
  );

  useEffect(() => {
    if (shellSurface !== 'shell' || shellTab !== 'chats' || !session?.token || spaces.length === 0) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const entries = await Promise.all(
          spaces.map(async (space) => {
            const [familySessions, privateSessions] = await Promise.all([
              fetchChatSessions('family', space.id, { force: false }),
              fetchChatSessions('private', space.id, { force: false }),
            ]);
            return [space.id, familySessions.length + privateSessions.length] as const;
          }),
        );
        if (cancelled) {
          return;
        }
        const nextCounts = Object.fromEntries(entries) as Record<string, number>;
        setSpaceSessionCounts((current) => ({
          ...current,
          ...nextCounts,
        }));
      } catch {
        if (!cancelled) {
          // Keep existing counts if one of the background loads fails.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchChatSessions, session?.token, shellSurface, shellTab, spaces]);

  useEffect(() => {
    if (shellSurface !== 'shell' || shellTab !== 'chats' || !session?.token) {
      return;
    }
    // Chat session summaries are tab-scoped and space-scoped. Refresh them when
    // either the space or the family/private scope changes.
    const cached = readFreshChatSessionCache(chatScope, activeChatSpaceId || '');
    if (cached) {
      setChatError('');
      setChatListRefreshBusy(false);
      setChatListSyncSource('cache');
      setChatListLastSyncedAt(cached.fetchedAt);
      setChatSessions(cached.sessions);
      if (activeChatSpaceId) {
        void refreshSpaceSessionTotal(activeChatSpaceId, {
          force: false,
          knownScope: chatScope,
          knownCount: cached.sessions.length,
        }).catch(() => undefined);
      }
      setActiveChatSessionId((current) => {
        if (current && cached.sessions.some((sessionItem) => sessionItem.id === current)) {
          return current;
        }
        return '';
      });
      return;
    }

    let cancelled = false;
    setChatBusy(true);
    setChatListRefreshBusy(true);
    setChatError('');
    void (async () => {
      try {
        const sessions = await fetchChatSessions(chatScope, activeChatSpaceId || '', { force: true });
        if (cancelled) {
          return;
        }
        const cachedEntry = readFreshChatSessionCache(chatScope, activeChatSpaceId || '');
        setChatListSyncSource('network');
        setChatListLastSyncedAt(cachedEntry?.fetchedAt ?? Date.now());
        setChatSessions(sessions);
        if (activeChatSpaceId) {
          void refreshSpaceSessionTotal(activeChatSpaceId, {
            force: true,
            knownScope: chatScope,
            knownCount: sessions.length,
          }).catch(() => undefined);
        }
        setActiveChatSessionId((current) => {
          if (current && sessions.some((sessionItem) => sessionItem.id === current)) {
            return current;
          }
          return '';
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setChatError(error instanceof Error ? error.message : 'Could not load chat sessions.');
      } finally {
        if (!cancelled) {
          setChatBusy(false);
          setChatListRefreshBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeChatSpaceId, chatScope, refreshSpaceSessionTotal, session?.token, shellSurface, shellTab]);

  useEffect(() => {
    if (shellSurface !== 'shell' || shellTab !== 'chats' || !session?.token || !activeChatSessionId) {
      setActiveChatSession(null);
      return;
    }
    // Detail fetch stays separate from the session list so the inbox can stay
    // light while the opened conversation keeps streaming or retry metadata.
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
      setSummaryCaptureSessions([]);
      setSelectedSummaryCaptureSessionId('');
      setSummaryCapturePickerOpen(false);
      return;
    }
    // Library data is owned per active space, not per tab instance. Reload when
    // the viewed space changes or the user re-enters the Library tab.
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
    if (shellSurface !== 'shell' || shellTab !== 'library' || !session?.token || !activeSpaceId) {
      setSummaryCaptureSessions([]);
      setSummaryCaptureSessionsBusy(false);
      setSelectedSummaryCaptureSessionId('');
      return;
    }
    let cancelled = false;
    setSummaryCaptureSessionsBusy(true);
    setSummaryError('');
    void (async () => {
      try {
        const [familyResult, privateResult] = await Promise.allSettled([
          fetchChatSessions('family', activeSpaceId, { force: true }),
          fetchChatSessions('private', activeSpaceId, { force: true }),
        ]);
        if (cancelled) {
          return;
        }

        const merged = new Map<string, HouseholdChatSessionSummary>();
        if (familyResult.status === 'fulfilled') {
          familyResult.value.forEach((sessionItem) => merged.set(sessionItem.id, sessionItem));
        }
        if (privateResult.status === 'fulfilled') {
          privateResult.value.forEach((sessionItem) => merged.set(sessionItem.id, sessionItem));
        }

        const nextSessions = Array.from(merged.values()).sort((left, right) =>
          (right.updatedAt || '').localeCompare(left.updatedAt || ''),
        );
        setSummaryCaptureSessions(nextSessions);
        setSelectedSummaryCaptureSessionId((current) => {
          if (current && nextSessions.some((sessionItem) => sessionItem.id === current)) {
            return current;
          }
          if (activeChatSessionId && nextSessions.some((sessionItem) => sessionItem.id === activeChatSessionId)) {
            return activeChatSessionId;
          }
          return nextSessions[0]?.id ?? '';
        });

        if (
          familyResult.status === 'rejected' &&
          privateResult.status === 'rejected'
        ) {
          setSummaryError('无法加载当前空间聊天列表，请稍后重试。');
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        setSummaryError(error instanceof Error ? error.message : '无法加载当前空间聊天列表，请稍后重试。');
      } finally {
        if (!cancelled) {
          setSummaryCaptureSessionsBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeChatSessionId, activeSpaceId, fetchChatSessions, session?.token, shellSurface, shellTab]);

  useEffect(() => {
    if (shellSurface !== 'shell' || shellTab !== 'library' || !session?.token) {
      return;
    }
    // Tasks still use the legacy family/private scope split underneath, so this
    // fetch follows taskScope rather than just activeSpaceId.
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
    await persistStoredSession(nextSession);
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
    setSkipOnboardingWhenNoDevice(false);
    try {
      const nextSession = await authenticateSession(authMode, { email, password, displayName, inviteCode });
      setSession(nextSession);
      await persistSession(nextSession);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not sign in.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function logout(): Promise<void> {
    await revokeSession(session?.token);
    setSession(null);
    setSpaceHomeMode('list');
    setSpaceListViewMode('spaces');
    setSkipOnboardingWhenNoDevice(false);
    await persistSession(null);
    resetFlow();
  }

  function openSpaceHome(spaceId: string): void {
    setActiveSpaceId(spaceId);
    setShellTab('chats');
    setActiveChatSessionId('');
    setActiveChatSession(null);
    setSpaceHomeMode('inside');
    setSpaceListViewMode('spaces');
  }

  function returnToSpaceList(): void {
    setShellTab('chats');
    setActiveChatSessionId('');
    setActiveChatSession(null);
    setSpaceHomeMode('list');
    setSpaceListViewMode('spaces');
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
    if (!session?.token) {
      setSettingsError('登录已过期，请重新登录后再试。');
      setChatAppActionError('登录已过期，请重新登录后再试。');
      return;
    }
    if (!canManage) {
      setSettingsError('仅管理员可以在空间中启用家庭应用。');
      setChatAppActionError('仅管理员可以在空间中启用家庭应用。');
      return;
    }
    if (!activeSpaceId || !activeSpace) {
      setSettingsError('请先选择一个 Space，再启用应用。');
      setChatAppActionError('请先选择一个 Space，再启用应用。');
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
    setChatAppActionError('');
    setChatAppActionNotice('');
    try {
      await enableSpaceFamilyApp(session.token, activeSpaceId, slug, {
        cadence: 'gentle',
        entryCard: true,
        confirmed,
      });
      const detail = await getHouseholdSpaceDetail(session.token, activeSpaceId);
      setActiveSpaceDetail(detail);
      const nextNotice = `${app?.title || slug} is now enabled in ${activeSpace.name}.`;
      setSettingsNotice(nextNotice);
      setChatAppActionNotice(nextNotice);
    } catch (error) {
      const nextError = error instanceof Error ? error.message : 'Could not turn on this family app in this space.';
      setSettingsError(nextError);
      setChatAppActionError(nextError);
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
              setChatAppActionError('');
              setChatAppActionNotice('');
              try {
                await disableSpaceFamilyApp(session.token!, activeSpaceId, slug);
                const detail = await getHouseholdSpaceDetail(session.token!, activeSpaceId);
                setActiveSpaceDetail(detail);
                const nextNotice = `${app?.title || slug} is no longer active in ${activeSpace.name}.`;
                setSettingsNotice(nextNotice);
                setChatAppActionNotice(nextNotice);
              } catch (error) {
                const nextError =
                  error instanceof Error ? error.message : 'Could not turn off this family app in this space.';
                setSettingsError(nextError);
                setChatAppActionError(nextError);
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
              setChatAppActionError('');
              setChatAppActionNotice('');
              try {
                const allSpaces = await getHouseholdSpaces(session.token!);
                await Promise.allSettled(
                  allSpaces.map((space) => disableSpaceFamilyApp(session.token!, space.id, slug)),
                );
                await uninstallFamilyApp(session.token!, slug);
                setInstalledFamilyApps((current) => current.filter((item) => item.slug !== slug));
                setActiveSpaceDetail((current) =>
                  current
                    ? {
                        ...current,
                        enabledFamilyApps: current.enabledFamilyApps.filter((enabled) => enabled.slug !== slug),
                      }
                    : current,
                );
                await refreshSpaces({ silent: true });
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

  function resetShellState(): void {
    // Full shell reset for logout and hard flow transitions. The pane
    // components are intentionally stateless enough that this can remain the
    // single place that clears cross-surface UI state.
    const resetState = buildSpaceScopedResetState();
    setSettingsBusy(false);
    setSettingsError('');
    setSettingsNotice('');
    setChatAppActionError('');
    setChatAppActionNotice('');
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
    setSummaryError('');
    setSummaryNotice('');
    setSummaryCaptureSessions([]);
    setSummaryCaptureSessionsBusy(false);
    setSummaryCapturePickerOpen(false);
    setSelectedSummaryCaptureSessionId('');
    setLibraryActiveSection('overview');
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
  }

  function resetFlow(): void {
    setSkipOnboardingWhenNoDevice(false);
    resetSetupFlowState();
    resetShellState();
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
    runOpenChatSessionEditor(sessionItem, canCreateActiveChat);
  }

  async function submitChatSessionEditor(): Promise<void> {
    await runSubmitChatSessionEditor({
      editingChatSession,
      chatSessionName,
      chatSessionSystemPrompt,
      chatSessionTemperature,
      chatSessionMaxTokens,
    });
  }

  async function submitChatMessage(overrideContent?: string): Promise<void> {
    await runSubmitChatMessage({
      activeChatSessionId,
      chatDraft,
      activeChatSession,
      overrideContent,
    });
  }

  async function clearCurrentChatSession(): Promise<void> {
    await runClearCurrentChatSession(activeChatSessionId);
  }

  async function deleteCurrentChatSession(): Promise<void> {
    await runDeleteCurrentChatSession(activeChatSessionId);
  }

  function closeActiveChatDetail(): void {
    setActiveChatSessionId('');
    setChatError('');
  }

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (shellSurface !== 'shell') {
        if (networkSheetOpen) {
          setNetworkSheetOpen(false);
          return true;
        }
        if (scannerOpen) {
          setScannerOpen(false);
          return true;
        }
        // In non-shell flows we still intercept back to prevent accidental app exit.
        return true;
      }

      if (spaceHomeMode === 'list') {
        if (spaceCreatorOpen) {
          setSpaceCreatorOpen(false);
          return true;
        }
        if (spaceListViewMode === 'global-settings') {
          setSpaceListViewMode('spaces');
          return true;
        }
        // Space list root: allow Android to exit.
        return false;
      }

      if (relayComposerOpen) {
        setRelayComposerOpen(false);
        return true;
      }
      if (taskHistoryOpen) {
        setTaskHistoryOpen(false);
        return true;
      }
      if (taskEditorOpen) {
        setTaskEditorOpen(false);
        return true;
      }
      if (fileEditorOpen) {
        setFileEditorOpen(false);
        return true;
      }
      if (memoryEditorOpen) {
        closeMemoryEditor();
        return true;
      }
      if (spaceMembersEditorOpen) {
        setSpaceMembersEditorOpen(false);
        return true;
      }
      if (chatSessionEditorOpen) {
        setChatSessionEditorOpen(false);
        return true;
      }
      if (spaceCreatorOpen) {
        setSpaceCreatorOpen(false);
        return true;
      }

      if (shellTab === 'library' && libraryActiveSection !== 'overview') {
        setLibraryActiveSection('overview');
        return true;
      }

      if (shellTab === 'chats' && activeChatSessionId) {
        closeActiveChatDetail();
        return true;
      }

      returnToSpaceList();
      return true;
    });
    return () => subscription.remove();
  }, [
    activeChatSessionId,
    chatSessionEditorOpen,
    fileEditorOpen,
    libraryActiveSection,
    memoryEditorOpen,
    networkSheetOpen,
    relayComposerOpen,
    scannerOpen,
    shellSurface,
    shellTab,
    spaceCreatorOpen,
    spaceHomeMode,
    spaceListViewMode,
    spaceMembersEditorOpen,
    taskEditorOpen,
    taskHistoryOpen,
  ]);

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

  function handleShellTabSelect(tabId: ShellTab): void {
    setShellTab(tabId);
    if (tabId === 'chats') {
      setActiveChatSessionId('');
      setActiveChatSession(null);
    }
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.centered}>
          <ActivityIndicator color="#0b6e4f" />
          <Text style={styles.loadingText}>正在准备设备引导…</Text>
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
          <Text style={styles.loadingText}>正在打开 {session.household.name}…</Text>
          <Text style={styles.cardCopy}>正在加载空间、聊天和设备状态。</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (shellSurface === 'shell' && session) {
    if (spaceHomeMode === 'list') {
      return (
        <SafeAreaView style={styles.screen}>
          <StatusBar style="dark" />
          <View style={styles.shellScreen}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTextWrap}>
                <Text style={styles.eyebrow}>Sparkbox</Text>
                <Text style={styles.title}>我的空间</Text>
                <Text style={styles.subtitle}>{householdName}</Text>
              </View>
              <Pressable
                style={styles.headerBackButton}
                onPress={() => setSpaceListViewMode((current) => (current === 'spaces' ? 'global-settings' : 'spaces'))}
              >
                <Text style={styles.headerBackButtonText}>
                  {spaceListViewMode === 'spaces' ? '全局设置' : '返回我的空间'}
                </Text>
              </Pressable>
            </View>

            {spaceListViewMode === 'spaces' ? (
              <ScrollView keyboardShouldPersistTaps="handled" removeClippedSubviews={false} contentContainerStyle={styles.chatContent}>
                {spaces.map((space) => (
                  <Pressable key={space.id} style={styles.chatTreeFolder} onPress={() => openSpaceHome(space.id)}>
                    <View style={styles.chatTreeFolderHeader}>
                      <View style={styles.chatTreeFolderHeaderBody}>
                        <Text style={styles.chatTreeFolderTitle}>{space.name}</Text>
                        <Text style={styles.chatTreeFolderMeta}>
                          {describeSpaceSessionCountCopy(spaceSessionCounts[space.id] ?? space.threadCount, space.memberCount)}
                        </Text>
                      </View>
                      <View style={styles.spaceListCardRightRail}>
                        <Text style={styles.spaceTemplateBadge}>{describeSpaceTemplate(space.template)}</Text>
                        <Text style={styles.chatTreeFolderChevron}>›</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
                {canManage ? (
                  <Pressable style={[styles.primaryButton, spacesBusy ? styles.networkRowDisabled : null]} onPress={openSpaceCreator} disabled={spacesBusy}>
                    <Text style={styles.primaryButtonText}>新建 Space</Text>
                  </Pressable>
                ) : null}
                {!spaces.length && !spacesBusy ? <Text style={styles.cardCopy}>还没有 Space，可先创建一个。</Text> : null}
                {spacesBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
                {spacesError ? <Text style={styles.errorText}>{spacesError}</Text> : null}
                <Pressable style={styles.secondaryButton} onPress={() => void logout()}>
                  <Text style={styles.secondaryButtonText}>退出登录</Text>
                </Pressable>
              </ScrollView>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" removeClippedSubviews={false} contentContainerStyle={styles.chatContent}>
                <SettingsSummaryPane
                  styles={styles}
                  homeBusy={homeBusy}
                  homeError={homeError}
                  onlineDeviceAvailable={onlineDeviceAvailable}
                  canManage={canManage}
                  accountDisplayName={session.user.display_name}
                  accountRoleLabel={describeHouseholdRole(session.user.role)}
                  settingsNotice={settingsNotice}
                  settingsError={settingsError}
                  onBeginNewDeviceOnboarding={beginNewDeviceOnboarding}
                  onLogout={() => void logout()}
                />

                <SettingsDevicesPane
                  styles={styles}
                  canManage={canManage}
                  canReprovisionDevice={canReprovisionDevice}
                  settingsBusy={settingsBusy}
                  familyAppsBusy={familyAppsBusy}
                  activeSpaceName=""
                  activeSpaceTemplateLabel=""
                  homeDevices={homeDevices}
                  recommendedFamilyApps={[]}
                  installedFamilyApps={installedFamilyApps}
                  availableFamilyApps={availableFamilyApps}
                  onBeginDeviceReprovision={(device) => void beginDeviceReprovision(device)}
                  onInstallSelectedFamilyApp={(slug) => void installSelectedFamilyApp(slug)}
                  onUninstallInstalledFamilyApp={(slug) => void uninstallInstalledFamilyApp(slug)}
                />

                <OwnerSettingsPane
                  styles={styles}
                  canManage={canManage}
                  homeDevices={homeDevices}
                  ownerDeviceId={ownerDeviceId}
                  ownerConsoleBusy={ownerConsoleBusy}
                  ownerStatus={ownerStatus}
                  ownerProviders={ownerProviders}
                  ownerModels={ownerModels}
                  ownerProviderConfig={ownerProviderConfig}
                  ownerInference={ownerInference}
                  ownerOnboardProvider={ownerOnboardProvider}
                  ownerOnboardModel={ownerOnboardModel}
                  ownerOnboardApiKey={ownerOnboardApiKey}
                  ownerOnboardApiUrl={ownerOnboardApiUrl}
                  ownerServiceOutput={ownerServiceOutput}
                  diagnosticsBusy={diagnosticsBusy}
                  diagnosticsError={diagnosticsError}
                  diagnosticsPayload={diagnosticsPayload}
                  diagnosticsDeviceId={diagnosticsDeviceId}
                  renderOwnerConsoleFeedback={renderOwnerConsoleFeedback}
                  describeDiagnosticsSource={describeDiagnosticsSource}
                  onSelectOwnerDevice={setOwnerDeviceId}
                  onRefreshOwnerConsole={() => void refreshOwnerConsole()}
                  onReconnectOwnerDevice={() => void reconnectOwnerDevice()}
                  onChangeDefaultProvider={(provider) =>
                    setOwnerProviderConfig((current) => ({
                      ...current,
                      defaultProvider: provider,
                    }))
                  }
                  onChangeDefaultModel={(value) =>
                    setOwnerProviderConfig((current) => ({
                      ...current,
                      defaultModel: value,
                    }))
                  }
                  onChangeProviderTimeout={(value) =>
                    setOwnerProviderConfig((current) => ({
                      ...current,
                      providerTimeoutSecs: Number.parseInt(value || '0', 10) || 0,
                    }))
                  }
                  onSaveOwnerProviderSettings={() => void saveOwnerProviderSettings()}
                  onChangeOnboardProvider={setOwnerOnboardProvider}
                  onChangeOnboardModel={setOwnerOnboardModel}
                  onChangeOnboardApiKey={setOwnerOnboardApiKey}
                  onChangeOnboardApiUrl={setOwnerOnboardApiUrl}
                  onRunOwnerOnboard={() => void runOwnerOnboard()}
                  onRunOwnerServiceAction={(serviceName, action) =>
                    void runOwnerServiceAction(serviceName, action)
                  }
                  onLoadDiagnostics={(deviceId) => void loadDiagnostics(deviceId)}
                  onFactoryResetDevice={(device) => void factoryResetDevice(device)}
                />

                <HouseholdPeoplePane
                  styles={styles}
                  canManage={canManage}
                  settingsBusy={settingsBusy}
                  currentUserId={session.user.id}
                  householdMembersCopy={householdMembersCopy}
                  homeMembers={homeMembers}
                  pendingInvites={homePendingInvites}
                  recentActivity={homeRecentActivity}
                  onChangeMemberRole={(member, nextRole) => void changeMemberRole(member, nextRole)}
                  onRemoveMember={(member) => void removeMember(member)}
                  onGenerateInvite={(role) => void generateInvite(role)}
                  onRevokeInvite={(invite) => void revokeInvite(invite)}
                />
              </ScrollView>
            )}

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
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.shellScreen}>
          <ShellHeader
            styles={styles}
            householdName={activeSpace?.name || householdName}
            backToListLabel="返回空间列表"
            onBackToList={returnToSpaceList}
            tabs={PHASE_ONE_TABS.map((tab) => ({
              id: tab.key,
              label: tab.label,
              active: tab.key === shellTab,
            }))}
            onSelectTab={handleShellTabSelect}
          />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
            contentContainerStyle={shellTab === 'chats' || shellTab === 'library' || shellTab === 'settings' ? styles.chatContent : styles.content}
          >
            {shellTab === 'chats' ? (
              <ChatsPane
                styles={styles}
                activeChatSessionId={activeChatSessionId}
                inboxProps={{
                  headerCopy: describeShellSubtitle({
                    shellTab: 'chats',
                    activeSpaceName: activeSpace?.name || '',
                    activeSpaceKindLabel: activeSpaceKindLabel || '空间',
                    spacesReady: !waitingForSpaces,
                  }),
                  singleSpaceMode: true,
                  spacesError,
                  spacesBusy,
                  hasSpaces: spaces.length > 0,
                  canManage,
                  waitingForSpaces,
                  onlineDeviceAvailable,
                  chatSendPhaseCopy: chatSendPhase !== 'idle' ? describeChatSendPhase(chatSendPhase) : '',
                  chatListRefreshing: chatListRefreshBusy,
                  chatListSyncCopy:
                    chatListLastSyncedAt > 0
                      ? `${
                          chatListSyncSource === 'cache'
                            ? '已从本地缓存读取'
                            : chatListSyncSource === 'network'
                              ? '已与云端同步'
                              : '聊天列表已就绪'
                        } · 最近同步 ${formatChatSyncDateTime(chatListLastSyncedAt)}`
                      : '',
                  chatError,
                  scopeOptions: (['family', 'private'] as ChatSessionScope[]).map((scope) => ({
                    id: scope,
                    label: describeChatAccess(scope),
                    active: chatScope === scope,
                  })),
                  chatBusy,
                  canCreateChat: canCreateActiveChat,
                  createChatLabel: describeChatSessionPrimaryActionLabel(activeSpaceCopyContext, chatScope),
                  sessions: chatSessions.map((sessionItem) => {
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
                  }),
                  emptyStateCopy: describeChatSessionEmptyStateCopy(activeSpaceCopyContext, chatScope),
                  spaceChips: spaces.map((space) => ({
                    id: space.id,
                    name: space.name,
                    countsCopy: describeSpaceSessionCountCopy(
                      spaceSessionCounts[space.id] ?? space.threadCount,
                      space.memberCount,
                    ),
                    active: space.id === activeSpaceId,
                  })),
                  onOpenSpaceCreator: openSpaceCreator,
                  onSelectSpace: setActiveSpaceId,
                  onSelectScope: (scopeId: string) => runHandleChatScopeChange(scopeId as ChatSessionScope),
                  onRefresh: () => void runRefreshChatSessions({ force: true }),
                  onCreateChat: () => openChatSessionEditor(),
                  onOpenSession: setActiveChatSessionId,
                  onDeleteSession: (sessionId: string) => void runDeleteCurrentChatSession(sessionId),
                }}
                toolsProps={{
                  waitingForSpaces,
                  title: waitingForSpaces ? 'Chats in this space' : describeSpaceThreadSectionTitle(activeSpaceCopyContext),
                  copy: waitingForSpaces ? 'Loading your spaces...' : describeSpaceThreadSectionCopy(activeSpaceCopyContext),
                  relayNotice,
                  threadRows:
                    activeSpaceDetail?.threads.map((thread) => ({
                      id: thread.id,
                      title: thread.title,
                      badge: describeSpaceThreadRowBadge(
                        activeSpaceCopyContext,
                        thread.title,
                        Boolean(thread.chatSessionId),
                        thread.chatSessionId === activeChatSessionId,
                      ),
                      copy: describeSpaceThreadRowCopy(
                        activeSpaceCopyContext,
                        thread.title,
                        Boolean(thread.chatSessionId),
                        thread.chatSessionId === activeChatSessionId,
                      ),
                    })) || [],
                  emptyThreadCopy: describeSpaceThreadEmptyStateCopy(activeSpaceCopyContext),
                  onOpenThread: (threadId: string) => void runOpenSpaceThread(threadId),
                  showRelayHelper: activeSpaceDetail?.kind === 'shared',
                  canOpenRelay: relayTargets.length > 0,
                  onOpenRelay: openRelayComposer,
                  privateSideChannelLabel:
                    activeSpaceDetail?.privateSideChannel?.available
                      ? activeSpaceDetail.privateSideChannel.label
                      : '',
                  onOpenPrivateSideChannel: () => {
                    void runOpenCurrentSpaceSideChannel();
                  },
                  enabledFamilyApps: enabledFamilyAppCards,
                  canManageActiveSpaceFamilyApps,
                  activeSpaceTemplate: activeSpace?.template || '',
                  settingsBusy,
                  readyInstalledFamilyApps: installedFamilyAppsAvailableForActiveSpace,
                  describeFamilyAppRiskLevel,
                  formatFamilyAppConfigSummary,
                  onOpenFamilyAppStarter: (slug: string, prompt: string) => void openFamilyAppStarter(slug, prompt),
                  onDisableFamilyApp: (slug: string) => void disableFamilyAppForActiveSpace(slug),
                  onEnableFamilyApp: (slug: string) => void enableInstalledFamilyAppForActiveSpace(slug),
                  onOpenAllFamilyApps: () => setShellTab('settings'),
                  appActionError: chatAppActionError,
                  appActionNotice: chatAppActionNotice,
                }}
                detailProps={{
                  waitingForSpaces,
                  activeChatTitle:
                    waitingForSpaces
                      ? 'Loading chat...'
                      : activeChatSession?.name || describeActiveChatFallbackTitle(activeSpaceCopyContext),
                  activeChatSubtitle:
                    waitingForSpaces
                      ? 'Loading your spaces...'
                      : activeChatSession
                        ? describeActiveChatSessionCopy(activeChatSession.name, activeSpaceCopyContext, sharedChatIsVisible)
                        : describeActiveChatEmptyStateCopy(activeSpaceCopyContext),
                  participantSummary:
                    sharedChatIsVisible && activeSharedChatParticipantSummary && !waitingForSpaces
                      ? activeSharedChatParticipantSummary
                      : '',
                  participantLabels: activeSharedChatParticipantLabels,
                  onlineDeviceAvailable,
                  showParticipantPills: sharedChatIsVisible && Boolean(activeSpaceDetail) && !waitingForSpaces,
                  showManageActions: Boolean(activeChatSession) && canManageActiveChat && !waitingForSpaces,
                  hasActiveChatSession: Boolean(activeChatSession),
                  chatBusy,
                  chatTimelineGroups,
                  hasMessages: activeChatTimelineMessages.length > 0,
                  composerTitle: waitingForSpaces ? 'Loading chat...' : sharedChatIsVisible ? 'Message the group' : 'Send a message',
                  composerPlaceholder:
                    waitingForSpaces
                      ? 'Loading your spaces...'
                      : describeChatComposerPlaceholder(
                          activeSpaceCopyContext,
                          Boolean(activeChatSession),
                          sharedChatIsVisible,
                        ),
                  chatDraft,
                  canSend:
                    !waitingForSpaces &&
                    onlineDeviceAvailable &&
                    !chatBusy &&
                    Boolean(activeChatSessionId) &&
                    Boolean(chatDraft.trim()),
                  onBack: closeActiveChatDetail,
                  onEdit: () => activeChatSession && openChatSessionEditor(activeChatSession),
                  onClear: () => void clearCurrentChatSession(),
                  onDelete: () => void deleteCurrentChatSession(),
                  onRetry: (content: string) => void submitChatMessage(content),
                  onChangeDraft: setChatDraft,
                  onSend: () => void submitChatMessage(),
                }}
              />
            ) : null}

            {libraryTabActive ? (
              <LibraryPane
                styles={styles}
                activeSpace={activeSpace}
                activeSpaceKindLabel={activeSpaceKindLabel}
                activeSpaceDetail={activeSpaceDetail}
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
                summaryError={summaryError}
                filesError={filesError}
                tasksError={tasksError}
                libraryNotice={libraryNotice}
                summaryNotice={summaryNotice}
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
                summaryCaptureSessions={summaryCaptureSessions}
                summaryCaptureSessionsBusy={summaryCaptureSessionsBusy}
                summaryCapturePickerOpen={summaryCapturePickerOpen}
                selectedSummaryCaptureSessionId={selectedSummaryCaptureSessionId}
                activeSection={libraryActiveSection}
                onChangeActiveSection={setLibraryActiveSection}
                taskEditorQuickActionsCopy="需要新增例行任务时，请使用上方快捷操作。"
                onOpenFileEditor={() => openFileEditor('mkdir')}
                onOpenTaskEditor={() => openTaskEditor()}
                onRefreshLibrary={() => void refreshLibrary()}
                onOpenMemoryEditor={() => openMemoryEditor()}
                onEditMemory={(memory) => openMemoryEditor(memory)}
                onDeleteMemory={(memory) => confirmRemoveMemory(memory)}
                onRefreshSummary={() => void refreshSummaryLibrary()}
                onToggleSummaryCapturePicker={() => setSummaryCapturePickerOpen((current) => !current)}
                onSelectSummaryCaptureSession={(sessionId) => {
                  setSelectedSummaryCaptureSessionId(sessionId);
                  setSummaryCapturePickerOpen(false);
                }}
                onCaptureSummary={() => void captureActiveSpaceSummary(selectedSummaryCaptureSessionId)}
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
                      : '请先在“我的空间”中选择一个空间。'
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

                {settingsNotice ? (
                  <View style={styles.settingsCard}>
                    <Text style={styles.noticeText}>{settingsNotice}</Text>
                  </View>
                ) : null}
                {settingsError ? (
                  <View style={styles.settingsCard}>
                    <Text style={styles.errorText}>{settingsError}</Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </ScrollView>

          <ShellModals
            styles={styles}
            spaceCreatorOpen={spaceCreatorOpen}
            spaceCreatorBusy={spaceCreatorBusy}
            spaceCreatorError={spaceCreatorError}
            spaceName={spaceName}
            selectedTemplateLabel={describeSpaceTemplate(spaceTemplate)}
            templateOptions={SPACE_TEMPLATE_OPTIONS.map((template) => ({
              id: template,
              label: describeSpaceTemplate(template),
              active: spaceTemplate === template,
            }))}
            memberOptions={spaceMemberOptions}
            selectedMemberIds={spaceMemberIds}
            onCloseSpaceCreator={() => setSpaceCreatorOpen(false)}
            onChangeSpaceName={setSpaceName}
            onSelectTemplate={(templateId) => setSpaceTemplate(templateId as Exclude<SpaceTemplate, 'private' | 'household'>)}
            onToggleSpaceMember={toggleSpaceMember}
            onSubmitSpaceCreator={() => void submitSpaceCreator()}
            chatSessionEditorOpen={chatSessionEditorOpen}
            editingChatSession={Boolean(editingChatSession)}
            activeSpaceDetail={activeSpaceDetail}
            chatScope={chatScope}
            chatSessionName={chatSessionName}
            chatError={chatError}
            chatBusy={chatBusy}
            onCloseChatSessionEditor={() => setChatSessionEditorOpen(false)}
            onChangeChatSessionName={setChatSessionName}
            onSubmitChatSessionEditor={() => void submitChatSessionEditor()}
            spaceMembersEditorOpen={spaceMembersEditorOpen}
            activeSpaceName={activeSpace?.name || ''}
            ownerDisplayName={session?.user.display_name || 'You'}
            memberEditorOptions={activeSharedSpaceMemberOptions}
            selectedEditorMemberIds={spaceMembersEditorIds}
            spaceMembersEditorError={spaceMembersEditorError}
            spaceMembersEditorBusy={spaceMembersEditorBusy}
            settingsBusy={settingsBusy}
            showInviteButton={activeSpace?.kind === 'shared'}
            onCloseSpaceMembersEditor={() => setSpaceMembersEditorOpen(false)}
            onToggleSpaceMembersEditorMember={toggleSpaceMembersEditorMember}
            onInviteToSpace={() =>
              void generateInvite('member', {
                targetSpaceId: activeSpace?.id,
                targetSpaceName: activeSpace?.name,
              })
            }
            onSubmitSpaceMembersEditor={() => void submitSpaceMembersEditor()}
            memoryEditorOpen={memoryEditorOpen}
            editingMemory={Boolean(editingMemory)}
            memoryTitle={memoryTitle}
            memoryContent={memoryContent}
            memoryPinned={memoryPinned}
            libraryError={libraryError}
            libraryBusy={libraryBusy}
            onCloseMemoryEditor={closeMemoryEditor}
            onChangeMemoryTitle={setMemoryTitle}
            onChangeMemoryContent={setMemoryContent}
            onToggleMemoryPinned={() => setMemoryPinned((current) => !current)}
            onSubmitMemoryEditor={() => void submitMemoryEditor()}
            fileEditorOpen={fileEditorOpen}
            fileEditorMode={fileEditorMode}
            fileTargetEntry={fileTargetEntry}
            fileEditorValue={fileEditorValue}
            filesError={filesError}
            filesBusy={filesBusy}
            networkSheetOpen={false}
            manualEntry={false}
            selectedNetwork={null}
            selectedSsid=""
            previousInternetSsid={null}
            wifiPassword=""
            canSubmitWifi={false}
            provisionBusy={false}
            onCloseFileEditor={() => setFileEditorOpen(false)}
            onChangeFileEditorValue={setFileEditorValue}
            onSubmitFileEditor={() => void submitFileEditor()}
            onCloseNetworkSheet={() => undefined}
            onChangeSelectedSsid={() => undefined}
            onChangeWifiPassword={() => undefined}
            onSubmitWifi={() => undefined}
            taskEditorOpen={taskEditorOpen}
            editingTask={editingTask}
            taskScope={taskScope}
            taskEditorCopy={taskEditorCopy}
            canManage={canManage}
            taskName={taskName}
            taskCronExpr={taskCronExpr}
            taskCommand={taskCommand}
            taskCommandType={taskCommandType}
            taskEnabled={taskEnabled}
            tasksError={tasksError}
            tasksBusy={tasksBusy}
            onCloseTaskEditor={() => setTaskEditorOpen(false)}
            onChangeTaskName={setTaskName}
            onChangeTaskCronExpr={setTaskCronExpr}
            onChangeTaskCommand={setTaskCommand}
            onChangeTaskCommandType={setTaskCommandType}
            onToggleTaskEnabled={() => setTaskEnabled((current) => !current)}
            onSubmitTaskEditor={() => void submitTaskEditor()}
            taskHistoryOpen={taskHistoryOpen}
            taskHistoryTask={taskHistoryTask}
            taskHistoryRuns={taskHistoryRuns}
            onCloseTaskHistory={() => setTaskHistoryOpen(false)}
            relayComposerOpen={relayComposerOpen}
            relayTargets={relayTargets}
            relayTargetUserId={relayTargetUserId}
            relayMessage={relayMessage}
            relayError={relayError}
            relayBusy={relayBusy}
            onCloseRelayComposer={() => setRelayComposerOpen(false)}
            onSelectRelayTarget={setRelayTargetUserId}
            onChangeRelayMessage={setRelayMessage}
            onSubmitRelayMessage={() => void submitRelayMessage()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SetupSurface
      styles={styles}
      scrollViewRef={scrollViewRef}
      householdName={householdName}
      session={session}
      canReturnToShell={canReturnToShell}
      returnToShell={returnToShell}
      resetFlow={resetFlow}
      logout={() => void logout()}
      claimStepVisible={claimStepVisible}
      activeStep={activeStep}
      setupStepLabels={setupStepLabels}
      step1Collapsed={step1Collapsed}
      step2Visible={step2Visible}
      step2Collapsed={step2Collapsed}
      step3Visible={step3Visible}
      step3Collapsed={step3Collapsed}
      step4Visible={step4Visible}
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
      claimInput={claimInput}
      claimPayload={claimPayload}
      claimError={claimError}
      cameraPermissionRecoveryMessage={CAMERA_PERMISSION_RECOVERY_MESSAGE}
      claimBusy={claimBusy}
      bleError={bleError}
      setupDeviceId={setupDeviceId}
      hotspotSsid={HOTSPOT_SSID}
      hotspotStage={hotspotStage}
      setupFlowKind={setupFlowKind}
      pairingToken={pairingToken}
      provisionBusy={provisionBusy}
      provisionMessage={provisionMessage}
      homeWifiTarget={homeWifiTarget}
      selectedSsid={selectedSsid}
      wifiPassword={wifiPassword}
      previousInternetSsid={previousInternetSsid}
      networksBusy={networksBusy}
      networks={networks}
      selectedNetwork={selectedNetwork}
      networkSheetOpen={networkSheetOpen}
      manualEntry={manualEntry}
      portalUrl={portalUrl}
      completedDeviceId={completedDeviceId}
      setupPageState={setupPageState}
      onCaptureStepOffset={captureStepOffset}
      onChangeAuthMode={(mode) => {
        setAuthMode(mode);
        setAuthError('');
      }}
      onChangeEmail={setEmail}
      onChangeDisplayName={setDisplayName}
      onChangeInviteCode={setInviteCode}
      onChangePassword={setPassword}
      onSubmitAuth={() => void submitAuth()}
      renderInvitePreviewSummary={buildInvitePreviewSummary}
      onApplyClaimInput={applyClaimInput}
      onOpenScanner={() => void openScanner()}
      onStartClaim={() => void startClaim()}
      onBeginHotspotOnboarding={() => void beginHotspotOnboarding(setupDeviceId || '')}
      onOpenInternetPanel={() => void openInternetPanel()}
      onRefreshNetworks={() => void refreshNetworks()}
      onOpenManualEntry={openManualEntry}
      onChooseNetwork={chooseNetwork}
      onStartCloudVerification={() => void startCloudVerification()}
      fileEditorOpen={fileEditorOpen}
      fileEditorMode={fileEditorMode}
      fileTargetEntry={fileTargetEntry}
      fileEditorValue={fileEditorValue}
      filesError={filesError}
      filesBusy={filesBusy}
      canSubmitWifi={canSubmitWifi}
      onCloseFileEditor={() => setFileEditorOpen(false)}
      onChangeFileEditorValue={setFileEditorValue}
      onSubmitFileEditor={() => void submitFileEditor()}
      onCloseNetworkSheet={() => setNetworkSheetOpen(false)}
      onChangeSelectedSsid={setSelectedSsid}
      onChangeWifiPassword={setWifiPassword}
      onSubmitWifi={() => {
        setNetworkSheetOpen(false);
        void submitWifi();
      }}
      taskEditorOpen={taskEditorOpen}
      editingTask={editingTask}
      activeSpaceName={activeSpace?.name || ''}
      taskScope={taskScope}
      taskEditorCopy={taskEditorCopy}
      canManage={canManage}
      taskName={taskName}
      taskCronExpr={taskCronExpr}
      taskCommand={taskCommand}
      taskCommandType={taskCommandType}
      taskEnabled={taskEnabled}
      tasksError={tasksError}
      tasksBusy={tasksBusy}
      onCloseTaskEditor={() => setTaskEditorOpen(false)}
      onChangeTaskName={setTaskName}
      onChangeTaskCronExpr={setTaskCronExpr}
      onChangeTaskCommand={setTaskCommand}
      onChangeTaskCommandType={setTaskCommandType}
      onToggleTaskEnabled={() => setTaskEnabled((current) => !current)}
      onSubmitTaskEditor={() => void submitTaskEditor()}
      scannerOpen={scannerOpen}
      onScannerScan={(value) => {
        applyClaimInput(value);
        setScannerOpen(false);
      }}
      onCloseScanner={() => setScannerOpen(false)}
    />
  );
}

export default App;
