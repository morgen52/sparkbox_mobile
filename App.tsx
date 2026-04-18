import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Buffer } from 'buffer';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  LayoutChangeEvent,
  PanResponder,
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
import { UserToolsPane } from './src/components/UserToolsPane';
import type { UserToolSection } from './src/components/UserToolsPane';
import { OwnerSettingsPane } from './src/components/OwnerSettingsPane';
import { SettingsDevicesPane } from './src/components/SettingsDevicesPane';
import { SpaceCreatorModal } from './src/components/SpaceCreatorModal';
import { SetupSurface } from './src/components/SetupSurface';
import { ShellModals } from './src/components/ShellModals';
import { SettingsSummaryPane } from './src/components/SettingsSummaryPane';
import { DeleteAccountPane } from './src/components/DeleteAccountPane';
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
  describeLibraryPhotoEmptyState,
  describeLibraryTaskListEmptyState,
  describeLibraryTaskListTitle,
  describeFileTimestamp,
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
  buildPhaseOneTabs,
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
  deleteHouseholdSpace,
  deleteSpaceMemory,
  deleteSpaceSummary,
  deleteHouseholdPath,
  deleteHouseholdTask,
  disableSpaceFamilyApp,
  enableSpaceFamilyApp,
  fileBackChatTranscript,
  getWikiOrganizeStatus,
  getWikiPreview,
  getWikiDirectory,
  getDeviceConfigStatus,
  getDeviceDiagnostics,
  getDeviceInferenceDetail,
  getFamilyAppCatalog,
  ingestWikiRaw,
  ingestWikiUploads,
  listWikiPages,
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
  runWikiDirectoryConsistencyCheck,
  startWikiOrganize,
  startWikiQualityOptimize,
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
  type WikiDirectoryConsistencyResult,
  type WikiDirectoryPayload,
  type WikiOrganizeStatusResult,
  distillUserSkill,
  getUserSkill,
  listRawWorkFiles,
  readRawWorkFile,
  promoteRawWorkFile,
  deleteRawWorkFile,
  readHouseholdFileText,
  listExternalStorageDevices,
  browseExternalStorage,
  importExternalStorageItems,
  fetchLinkPreview,
  importFromLink,
  type ExternalStorageEntry,
  type ExternalStorageMount,
  type LinkPreview,
  type RawWorkFile,
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
import { authenticateSession, revokeSession, deleteAccount as deleteAccountApi } from './src/utils/authApi';
import { I18nProvider, useT } from './src/i18n';


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
const SWIPE_SPACE_DELETE_WIDTH = 78;

function SwipeToDeleteSpaceRow({
  space,
  onOpenSpace,
  onDeleteSpace,
}: {
  space: HouseholdSpaceSummary;
  onOpenSpace: (spaceId: string) => void;
  onDeleteSpace: (space: HouseholdSpaceSummary) => void;
}) {
  const t = useT();
  const translateX = useRef(new Animated.Value(0)).current;
  const pressOverlayOpacity = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef(0);
  const movedRef = useRef(false);

  const animatePressOverlay = useCallback(
    (pressed: boolean) => {
      Animated.timing(pressOverlayOpacity, {
        toValue: pressed ? 1 : 0,
        duration: pressed ? 90 : 120,
        useNativeDriver: true,
      }).start();
    },
    [pressOverlayOpacity],
  );

  const animateTo = useCallback(
    (toValue: number) => {
      offsetRef.current = toValue;
      Animated.spring(translateX, {
        toValue,
        useNativeDriver: true,
        bounciness: 0,
        speed: 18,
      }).start();
    },
    [translateX],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dx) > 6 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderGrant: () => {
          movedRef.current = false;
          animatePressOverlay(false);
        },
        onPanResponderMove: (_event, gestureState) => {
          if (!movedRef.current && (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3)) {
            movedRef.current = true;
          }
          const next = Math.max(-SWIPE_SPACE_DELETE_WIDTH, Math.min(0, offsetRef.current + gestureState.dx));
          translateX.setValue(next);
        },
        onPanResponderRelease: (_event, gestureState) => {
          const dragDistance = offsetRef.current + gestureState.dx;
          const shouldOpen = gestureState.vx < -0.2 || dragDistance < -SWIPE_SPACE_DELETE_WIDTH / 2;
          animateTo(shouldOpen ? -SWIPE_SPACE_DELETE_WIDTH : 0);
        },
        onPanResponderTerminate: () => {
          movedRef.current = true;
          animatePressOverlay(false);
          animateTo(0);
        },
      }),
    [animatePressOverlay, animateTo, translateX],
  );

  return (
    <View style={styles.spaceSwipeContainer}>
      <Pressable
        style={styles.spaceDeleteAction}
        onPress={() => {
          animateTo(0);
          onDeleteSpace(space);
        }}
      >
        <MaterialCommunityIcons name="delete-outline" size={24} color="#ffffff" />
      </Pressable>
      <Animated.View
        style={[styles.chatSessionSwipeFront, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={styles.chatTreeFolder}
          pressFeedback="none"
          onPressIn={() => animatePressOverlay(true)}
          onPressOut={() => animatePressOverlay(false)}
          onPress={() => {
            if (movedRef.current) {
              movedRef.current = false;
              return;
            }
            if (offsetRef.current <= -8) {
              animateTo(0);
              return;
            }
            onOpenSpace(space.id);
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={[styles.spaceRowPressOverlay, { opacity: pressOverlayOpacity }]}
          />
          <View style={styles.chatTreeFolderHeader}>
            <View style={styles.chatTreeFolderHeaderBody}>
              <Text style={styles.chatTreeFolderTitle}>{space.name}</Text>
              <Text style={styles.chatTreeFolderMeta}>
                {describeSpaceSessionCountCopy(space.threadCount, space.memberCount)}
              </Text>
            </View>
            <View style={styles.spaceListCardRightRail}>
              <Text style={styles.spaceTemplateBadge}>{describeSpaceTemplate(space.template, t)}</Text>
              <Text style={styles.chatTreeFolderChevron}>›</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function App() {
  const t = useT();
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
  const [deleteAccountBusy, setDeleteAccountBusy] = useState(false);

  // Shell state fans out into presentational panes, but the coordination
  // between tabs, spaces, chats, files, tasks, and owner tooling still lives
  // here so cross-surface resets happen in one place.
  const [shellTab, setShellTab] = useState<ShellTab>('chats');
  const [spaceHomeMode, setSpaceHomeMode] = useState<'list' | 'inside'>('list');
  const [spaceListViewMode, setSpaceListViewMode] = useState<'spaces' | 'global-settings' | 'user-tools'>('spaces');
  const [userToolsSection, setUserToolsSection] = useState<UserToolSection>('overview');
  const [workFiles, setWorkFiles] = useState<RawWorkFile[]>([]);
  const [workFileBusy, setWorkFileBusy] = useState(false);
  const [workFileContent, setWorkFileContent] = useState('');
  const [workFileActivePath, setWorkFileActivePath] = useState('');
  const [workCurrentDir, setWorkCurrentDir] = useState('');
  const [rawBrowserFiles, setRawBrowserFiles] = useState<HouseholdFileEntry[]>([]);
  const [rawBrowserBusy, setRawBrowserBusy] = useState(false);
  const [rawBrowserContent, setRawBrowserContent] = useState('');
  const [rawBrowserActivePath, setRawBrowserActivePath] = useState('');
  const [rawBrowserCurrentDir, setRawBrowserCurrentDir] = useState('');
  const [externalMounts, setExternalMounts] = useState<ExternalStorageMount[]>([]);
  const [externalEntries, setExternalEntries] = useState<ExternalStorageEntry[]>([]);
  const [externalImportBusy, setExternalImportBusy] = useState(false);
  const [externalImportRootPath, setExternalImportRootPath] = useState('');
  const [externalImportCurrentPath, setExternalImportCurrentPath] = useState('');
  const [selectedExternalImportPaths, setSelectedExternalImportPaths] = useState<string[]>([]);
  const [linkImportUrl, setLinkImportUrl] = useState('');
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [linkPreviewBusy, setLinkPreviewBusy] = useState(false);
  const [linkImportBusy, setLinkImportBusy] = useState(false);
  const [linkPreviewError, setLinkPreviewError] = useState('');
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
  const [chatAttachmentPickerOpen, setChatAttachmentPickerOpen] = useState(false);
  const [chatAttachmentPickerPath, setChatAttachmentPickerPath] = useState('');
  const [chatAttachmentPickerListing, setChatAttachmentPickerListing] = useState<HouseholdFileListing | null>(null);
  const [chatAttachmentPickerBusy, setChatAttachmentPickerBusy] = useState(false);
  const [chatAttachmentPickerError, setChatAttachmentPickerError] = useState('');
  const [chatAttachedFiles, setChatAttachedFiles] = useState<Record<string, { path: string; name: string }>>({});
  const [chatSaveDocModalOpen, setChatSaveDocModalOpen] = useState(false);
  const [chatSaveDocTitle, setChatSaveDocTitle] = useState('');
  const [chatSaveDocSelection, setChatSaveDocSelection] = useState<Record<string, boolean>>({});
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
  const [fileListingCache, setFileListingCache] = useState<Record<string, HouseholdFileListing>>({});
  const [filesBusy, setFilesBusy] = useState(false);
  const [filesError, setFilesError] = useState('');
  const [filesNotice, setFilesNotice] = useState('');
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
  const [wikiSourceTitle, setWikiSourceTitle] = useState('');
  const [wikiSourceContent, setWikiSourceContent] = useState('');
  const [wikiPages, setWikiPages] = useState<Array<{ id: string; title: string; summary: string; tags: string[] }>>([]);
  const [wikiLastIngest, setWikiLastIngest] = useState<{
    operationId: string;
    pageId: string;
    title: string;
    summary: string;
    sourceType: string;
    directoryMode?: string;
    directoryFallbackReason?: string | null;
    directoryModelBudgetSeconds?: number;
    directoryProvider?: string;
    directoryModel?: string;
    directoryProviderTimeoutSeconds?: number;
  } | null>(null);
  const [wikiDirectoryLastUpdatedAt, setWikiDirectoryLastUpdatedAt] = useState('');
  const [wikiRawFileCount, setWikiRawFileCount] = useState(0);
  const [wikiUploadSourceType, setWikiUploadSourceType] = useState<'note' | 'document' | 'image'>('note');
  const [wikiOrganizeStatus, setWikiOrganizeStatus] = useState<WikiOrganizeStatusResult | null>(null);
  const [wikiPreviewFiles, setWikiPreviewFiles] = useState<Array<{ path: string; preview: string; content: string; updatedAt: string }>>([]);
  const [userSkillContent, setUserSkillContent] = useState('');
  const [userSkillUpdatedAt, setUserSkillUpdatedAt] = useState('');
  const [userSkillBusy, setUserSkillBusy] = useState(false);
  const [wikiPreviewCacheBySpace, setWikiPreviewCacheBySpace] = useState<
    Record<string, Array<{ path: string; preview: string; content: string; updatedAt: string }>>
  >({});
  const [wikiPreviewCacheLoadedAt, setWikiPreviewCacheLoadedAt] = useState<Record<string, number>>({});
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
  const isSystemManagedSpace = useCallback(
    (space: HouseholdSpaceSummary | null | undefined): boolean => {
      if (!space) {
        return false;
      }
      if (space.kind === 'private') {
        return true;
      }
      return space.template === 'household' || space.template === 'private';
    },
    [],
  );
  const activeSpace = spaces.find((space) => space.id === activeSpaceId) ?? null;
  const canDeleteActiveSpace = canManage && activeSpace?.kind === 'shared' && !isSystemManagedSpace(activeSpace);
  const activeWikiSpaceId = activeSpace?.kind === 'shared' ? activeSpace.id : '';
  const activeWikiPreviewCacheKey = activeSpace ? `${activeSpace.kind}:${activeSpace.id}` : '';
  const activeChatMessages: HouseholdChatSessionMessage[] = activeChatSession?.messages ?? [];
  const chatAttachmentItems = useMemo(() => {
    const items = Object.values(chatAttachedFiles).sort((a, b) => a.path.localeCompare(b.path));
    return items.map((item, index) => ({ index: index + 1, name: item.name, path: item.path }));
  }, [chatAttachedFiles]);
  const chatSaveDocItems = useMemo(
    () =>
      activeChatMessages.map((message, index) => ({
        id: String(index),
        checked: chatSaveDocSelection[String(index)] === true,
        sender: message.role === 'user' ? message.senderDisplayName || t('chat.sender.you') : 'Sparkbox',
        role: message.role,
        content: message.content,
      })),
    [activeChatMessages, chatSaveDocSelection, t],
  );
  const relayTargets = getRelayTargets(activeSpaceDetail, session?.user.id);
  const currentFilePath = fileListing?.path ?? '';
  const photoEntries = (fileListing?.entries ?? []).filter((entry) => !entry.isDir && /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(entry.name));
  const canCreateTasks = canManage || taskScope === 'private';
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
  const activeSpaceKindLabel = activeSpace ? describeSpaceKind(activeSpace.kind, t) : '';
  const activeSpaceTemplateLabel = activeSpace?.template ? describeSpaceTemplate(activeSpace.template, t) : '';
  const waitingForSpaces =
    Boolean(session?.token) &&
    shellSurface === 'shell' &&
    shellTab === 'chats' &&
    !activeSpace &&
    spaces.length === 0 &&
    !spacesError &&
    (!activeSpaceStorageKey || loadedActiveSpaceStorageKey === activeSpaceStorageKey);
  const householdMembersCopy = canManage
    ? t('members.copy.admin')
    : t('members.copy.member');
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
      title: t('library.section.files.title'),
      copy: t('library.section.files.copy'),
    },
    {
      title: t('library.section.tasks.title'),
      copy: t('library.section.tasks.copy'),
    },
    {
      title: t('library.section.memories.title'),
      copy: activeSpace ? t('library.section.memories.copyWithName', { name: activeSpace.name }) : t('library.section.memories.copyGeneric'),
    },
    {
      title: t('library.section.photos.title'),
      copy: t('library.section.photos.copy'),
    },
    {
      title: t('library.section.summaries.title'),
      copy: t('library.section.summaries.copy'),
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
      ? t('auth.title.login')
      : authMode === 'register'
        ? t('auth.title.register')
        : t('auth.title.joinByInvite');
  const authCardCopy =
    authMode === 'login'
      ? t('auth.copy.login')
      : authMode === 'register'
        ? t('auth.copy.register')
        : t('auth.copy.joinByInvite');
  const authSubmitLabel =
    authMode === 'login' ? t('auth.submit.login') : authMode === 'register' ? t('auth.submit.register') : t('auth.submit.joinByInvite');
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

  function normalizeDisplayFilePath(path: string | null | undefined): string {
    return (path || '')
      .replace(/\\+/g, '/')
      .replace(/^\/+|\/+$/g, '');
  }

  function sanitizeWikiFileName(fileName: string): string {
    const trimmed = (fileName || '').trim().replace(/[\\/]+/g, '');
    const normalized = trimmed.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff]+/g, '_');
    return normalized.slice(0, 160);
  }

  async function renameWikiRawRecord(rawPath: string, newName: string): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      return;
    }
    const source = (rawPath || '').trim();
    const sanitized = sanitizeWikiFileName(newName);
    if (!source || !sanitized) {
      setLibraryError(t('raw.rename.invalidName'));
      return;
    }
    const sourceParts = source.split('/').filter(Boolean);
    const currentName = sourceParts[sourceParts.length - 1] || source;
    const sourceDir = sourceParts.slice(0, -1).join('/');

    let finalName = sanitized;
    if (!finalName.includes('.') && currentName.includes('.')) {
      const suffix = currentName.slice(currentName.lastIndexOf('.'));
      finalName = `${finalName}${suffix}`;
    }
    const destination = sourceDir ? `${sourceDir}/${finalName}` : finalName;
    if (destination === source) {
      setLibraryNotice(t('raw.rename.unchanged'));
      return;
    }

    setLibraryBusy(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      await renameHouseholdPath(
        session.token,
        fileSpace,
        toDeviceFilePath(`.wiki/raw/${source}`),
        toDeviceFilePath(`.wiki/raw/${destination}`),
        { spaceId: activeFileSpaceId || undefined },
      );
      setLibraryNotice(t('raw.rename.success', { source, destination }));
      await refreshWikiDirectory();
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : t('raw.rename.error'));
    } finally {
      setLibraryBusy(false);
    }
  }

  async function deleteWikiRawRecord(rawPath: string): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      return;
    }
    const target = (rawPath || '').trim();
    if (!target) {
      return;
    }
    setLibraryBusy(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      await deleteHouseholdPath(
        session.token,
        fileSpace,
        toDeviceFilePath(`.wiki/raw/${target}`),
        { spaceId: activeFileSpaceId || undefined },
      );
      setLibraryNotice(t('raw.delete.success', { target }));
      await refreshWikiDirectory();
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : t('raw.delete.error'));
    } finally {
      setLibraryBusy(false);
    }
  }

  function buildFileListingCacheKey(path: string): string {
    return `${fileSpace}:${activeFileSpaceId || 'private'}:${path || '__root__'}`;
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
      setSummaryError(error instanceof Error ? error.message : t('summary.refreshError'));
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
        title: `${selectedSession?.name || t('summary.fallbackSessionName')} snapshot`,
      });
      setSummaryNotice(t('summary.captureSuccess', { name: selectedSession?.name || t('summary.fallbackSessionName') }));
      await refreshSummaryLibrary();
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : t('summary.captureError'));
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
      setSummaryNotice(t('summary.saveAsMemorySuccess', { title: summary.title }));
      await refreshSummaryLibrary();
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : t('summary.saveAsMemoryError'));
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
      setSummaryNotice(t('summary.deleteSuccess', { title }));
      await refreshSummaryLibrary();
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : t('summary.deleteError'));
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
      setRawBrowserFiles([]);
      setRawBrowserContent('');
      setRawBrowserActivePath('');
      setRawBrowserCurrentDir('');
      setFileListing(null);
      setFileListingCache({});
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
      setWikiSourceTitle('');
      setWikiSourceContent('');
      setWikiPages([]);
      setWikiLastIngest(null);
      setWikiDirectoryLastUpdatedAt('');
      setWikiRawFileCount(0);
      setWikiUploadSourceType('note');
      setWikiOrganizeStatus(null);
      setWikiPreviewFiles([]);
      setWikiPreviewCacheBySpace({});
      setWikiPreviewCacheLoadedAt({});
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
    setWikiSourceTitle('');
    setWikiSourceContent('');
    setWikiPages([]);
    setWikiLastIngest(null);
    setWikiDirectoryLastUpdatedAt('');
    setWikiRawFileCount(0);
    setWikiOrganizeStatus(null);
    setWikiPreviewFiles([]);
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
          setSummaryError(t('summary.loadSessionsError'));
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        setSummaryError(error instanceof Error ? error.message : t('summary.loadSessionsError'));
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
    if (shellSurface !== 'shell' || shellTab !== 'library' || !session?.token || !activeSpaceId) {
      return;
    }
    void refreshWikiDirectory();
  }, [session?.token, shellSurface, shellTab, activeSpaceId]);

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

  async function handleDeleteAccount(password: string): Promise<void> {
    if (!session?.token) return;
    setDeleteAccountBusy(true);
    try {
      await deleteAccountApi(session.token, password);
      setSession(null);
      setSpaceHomeMode('list');
      setSpaceListViewMode('spaces');
      setSkipOnboardingWhenNoDevice(false);
      await persistSession(null);
      resetFlow();
      Alert.alert(t('account.deleteSuccess.title'), t('account.deleteSuccess.message'));
    } catch (err: any) {
      const msg = err?.message || t('account.deleteError.fallback');
      Alert.alert(t('account.deleteError.title'), msg);
    } finally {
      setDeleteAccountBusy(false);
    }
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
      setSettingsError(t('auth.error.sessionExpired'));
      setChatAppActionError(t('auth.error.sessionExpired'));
      return;
    }
    if (!canManage) {
      setSettingsError(t('familyApps.error.adminOnly'));
      setChatAppActionError(t('familyApps.error.adminOnly'));
      return;
    }
    if (!activeSpaceId || !activeSpace) {
      setSettingsError(t('spaces.error.noSpaceForApp'));
      setChatAppActionError(t('spaces.error.noSpaceForApp'));
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

  function requestDeleteChatSession(sessionId: string): void {
    const targetSession = chatSessions.find((sessionItem) => sessionItem.id === sessionId);
    Alert.alert(
      t('chat.deleteSession.alertTitle'),
      t('chat.deleteSession.alertMessage', { name: targetSession?.name || '' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirmDelete'),
          style: 'destructive',
          onPress: () => {
            void runDeleteCurrentChatSession(sessionId);
          },
        },
      ],
    );
  }

  function requestDeleteSpace(targetSpace: HouseholdSpaceSummary): void {
    if (!session?.token || !canManage) {
      return;
    }
    if (targetSpace.kind !== 'shared' || isSystemManagedSpace(targetSpace)) {
      setSettingsError(t('spaces.delete.systemSpaceError'));
      return;
    }

    Alert.alert(
      t('spaces.delete.alertTitle'),
      t('spaces.delete.alertMessage', { name: targetSpace.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirmDelete'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSettingsBusy(true);
              setSettingsNotice('');
              setSettingsError('');
              try {
                await deleteHouseholdSpace(session.token, targetSpace.id);
                setSettingsNotice('');
                if (activeSpaceId === targetSpace.id || spaceHomeMode !== 'list') {
                  returnToSpaceList();
                }
                await Promise.all([
                  refreshHouseholdSummary({ silent: true }),
                  refreshSpaces({ silent: true }),
                ]);
                await runRefreshChatSessions({ force: true });
              } catch (error) {
                setSettingsError(error instanceof Error ? error.message : t('spaces.delete.error'));
              } finally {
                setSettingsBusy(false);
              }
            })();
          },
        },
      ],
    );
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
    setFileListingCache({});
    setFilesBusy(false);
    setFilesError('');
    setFilesNotice('');
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
    const content = (overrideContent ?? chatDraft).trim();
    if (!content) {
      return;
    }
    const attached = chatAttachmentItems;
    const promptWithAttachmentContext =
      overrideContent || attached.length === 0
        ? content
        : [
            '[ATTACHED_FILES]',
            ...attached.map((item) => `[${item.index}] ${item.name} | path=${item.path}`),
            '[USER_MESSAGE]',
            content,
          ].join('\n');

    await runSubmitChatMessage({
      activeChatSessionId,
      chatDraft,
      activeChatSession,
      overrideContent: promptWithAttachmentContext,
    });
    if (!overrideContent) {
      setChatDraft('');
      if (attached.length) {
        setChatAttachedFiles({});
      }
    }
  }

  async function refreshChatAttachmentPicker(path: string): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      return;
    }
    const chatAttachmentSpace: HouseholdFileSpace = activeSpace?.kind === 'shared' ? 'family' : 'private';
    const chatAttachmentSpaceId = activeSpace?.kind === 'shared' ? activeSpace.id : undefined;
    setChatAttachmentPickerBusy(true);
    setChatAttachmentPickerError('');
    try {
      // Browse raw/ directory directly
      const devicePath = path ? `raw/${path}` : 'raw';
      const listing = await getHouseholdFiles(
        session.token,
        chatAttachmentSpace,
        devicePath,
        { spaceId: chatAttachmentSpaceId },
      );
      const mapped = mapListingToActiveSpace(listing);
      // Strip the raw/ prefix for display
      const displayPath = normalizeDisplayFilePath(
        (mapped.path || '').replace(/^raw\/?/, ''),
      );
      const displayEntries = mapped.entries.map((entry) => ({
        ...entry,
        path: `raw/${normalizeDisplayFilePath(entry.path).replace(/^raw\/?/, '')}`.replace(/\/$/, ''),
      }));
      setChatAttachmentPickerListing({
        ...mapped,
        path: displayPath,
        parent: displayPath ? displayPath.split('/').slice(0, -1).join('/') || '' : '',
        entries: displayEntries,
      });
      setChatAttachmentPickerPath(displayPath);
    } catch (error) {
      setChatAttachmentPickerError(error instanceof Error ? error.message : t('chat.attachmentPicker.error'));
    } finally {
      setChatAttachmentPickerBusy(false);
    }
  }

  function toggleChatAttachment(path: string, name: string): void {
    setChatAttachedFiles((current) => {
      if (current[path]) {
        const next = { ...current };
        delete next[path];
        return next;
      }
      return {
        ...current,
        [path]: { path, name },
      };
    });
  }

  function removeChatAttachmentByIndex(index: number): void {
    const target = chatAttachmentItems.find((item) => item.index === index);
    if (!target) {
      return;
    }
    setChatAttachedFiles((current) => {
      const next = { ...current };
      delete next[target.path];
      return next;
    });
  }

  function openChatAttachmentPicker(): void {
    setChatAttachmentPickerOpen(true);
    setChatAttachmentPickerPath('');
    void refreshChatAttachmentPicker('');
  }

  function openChatSaveDocModal(): void {
    if (!activeChatMessages.length) {
      return;
    }
    const defaultSelection: Record<string, boolean> = {};
    activeChatMessages.forEach((_, index) => {
      defaultSelection[String(index)] = true;
    });
    setChatSaveDocSelection(defaultSelection);
    setChatSaveDocTitle(t('chat.saveDoc.defaultTitle', { date: new Date().toISOString().slice(0, 10) }));
    setChatSaveDocModalOpen(true);
  }

  async function saveSelectedChatAsDocument(): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      return;
    }
    const title = chatSaveDocTitle.trim();
    if (!title) {
      setChatError(t('chat.saveDoc.noTitle'));
      return;
    }
    const entries = activeChatMessages
      .map((message, index) => ({ message, index }))
      .filter(({ index }) => chatSaveDocSelection[String(index)] === true)
      .map(({ message }) => ({
        role: message.role,
        sender: message.role === 'user' ? message.senderDisplayName || t('chat.sender.you') : 'Sparkbox',
        content: message.content,
        createdAt: message.createdAt || undefined,
      }));

    if (!entries.length) {
      setChatError(t('chat.saveDoc.noSelection'));
      return;
    }
    setChatBusy(true);
    setChatError('');
    try {
      const saved = await fileBackChatTranscript(session.token, {
        title,
        entries,
        spaceId: activeWikiSpaceId || undefined,
      });
      setChatSaveDocModalOpen(false);
      Alert.alert(t('chat.saveDoc.successTitle'), t('chat.saveDoc.successMessage', { path: saved.rawPath }));
      await refreshWikiDirectory();
    } catch (error) {
      setChatError(error instanceof Error ? error.message : t('chat.saveDoc.error'));
    } finally {
      setChatBusy(false);
    }
  }

  async function clearCurrentChatSession(): Promise<void> {
    await runClearCurrentChatSession(activeChatSessionId);
  }

  async function deleteCurrentChatSession(): Promise<void> {
    if (!activeChatSessionId) {
      return;
    }
    requestDeleteChatSession(activeChatSessionId);
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
        if (spaceListViewMode === 'user-tools') {
          if (userToolsSection !== 'overview') {
            // If viewing a work file, go back to file list first
            if (userToolsSection === 'workspace_manager' && workFileActivePath) {
              setWorkFileActivePath('');
              setWorkFileContent('');
              return true;
            }
            if (userToolsSection === 'workspace_manager' && workCurrentDir) {
              const parent = workCurrentDir.includes('/')
                ? workCurrentDir.slice(0, workCurrentDir.lastIndexOf('/'))
                : '';
              navigateWorkDir(parent);
              return true;
            }
            setUserToolsSection('overview');
            return true;
          }
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
        if (libraryActiveSection === 'raw_browser') {
          if (rawBrowserActivePath) {
            setRawBrowserActivePath('');
            setRawBrowserContent('');
            return true;
          }
          if (rawBrowserCurrentDir) {
            const parent = rawBrowserCurrentDir.includes('/')
              ? rawBrowserCurrentDir.slice(0, rawBrowserCurrentDir.lastIndexOf('/'))
              : '';
            navigateRawBrowserDir(parent);
            return true;
          }
        }
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

  async function refreshFiles(nextPath?: string, options: { force?: boolean } = {}): Promise<void> {
    if (!session?.token) {
      return;
    }
    const targetPath = normalizeDisplayFilePath(nextPath ?? currentFilePath);
    const cacheKey = buildFileListingCacheKey(targetPath);
    const cachedListing = fileListingCache[cacheKey];
    if (!options.force && cachedListing) {
      setFileListing(cachedListing);
      setFilesError('');
      return;
    }
    setFilesBusy(true);
    setFilesError('');
    try {
      const listing = await getHouseholdFiles(
        session.token,
        fileSpace,
        toDeviceFilePath(targetPath),
        { spaceId: activeFileSpaceId || undefined },
      );
      const mapped = mapListingToActiveSpace(listing);
      setFileListing(mapped);
      setFileListingCache((current) => ({
        ...current,
        [cacheKey]: mapped,
      }));
    } catch (error) {
      setFilesError(error instanceof Error ? describeServiceAvailabilityError(error.message) : 'Could not load files right now.');
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
      await refreshFiles(undefined, { force: true });
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
      const uploads = result.assets.map((asset, index) => ({
        name: asset.name || `upload-${index + 1}`,
        mimeType: asset.mimeType || 'application/octet-stream',
        uri: asset.uri,
      }));
      const response = await uploadHouseholdFiles(
        session.token,
        fileSpace,
        toDeviceFilePath(currentFilePath),
        uploads,
        { spaceId: activeFileSpaceId || undefined },
      );
      setFilesNotice(`Uploaded ${response.saved.map((item) => item.name).join(', ')}.`);
      await refreshFiles(undefined, { force: true });
    } catch (error) {
      console.error('Household file upload failed', error);
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

  async function runWikiIngest(): Promise<void> {
    if (!session?.token) {
      return;
    }
    if (!activeSpaceId) {
      setLibraryError(t('spaces.error.noSpaceForWikiIngest'));
      setLibraryNotice('');
      return;
    }
    const title = wikiSourceTitle.trim();
    const content = wikiSourceContent.trim();
    if (!title || !content) {
      setLibraryError(t('wiki.ingest.noContent'));
      setLibraryNotice('');
      return;
    }
    setLibraryBusy(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      const result = await ingestWikiRaw(session.token, {
        title,
        content,
        sourceType: 'note',
        spaceId: activeWikiSpaceId || undefined,
      });
      setLibraryNotice(t('wiki.ingest.success', { title: result.title }));
      setWikiLastIngest({
        operationId: result.operationId,
        pageId: result.pageId,
        title: result.title,
        summary: result.summary,
        sourceType: 'note',
        directoryMode: result.directoryMode,
        directoryFallbackReason: result.directoryFallbackReason,
        directoryModelBudgetSeconds: result.directoryModelBudgetSeconds,
        directoryProvider: result.directoryProvider,
        directoryModel: result.directoryModel,
        directoryProviderTimeoutSeconds: result.directoryProviderTimeoutSeconds,
      });
      if (result.directoryMode === 'deterministic') {
        setLibraryNotice(t('wiki.ingest.successWithFallback', { title: result.title, reason: result.directoryFallbackReason || 'model_unavailable' }));
      }
      const pages = await listWikiPages(session.token, { spaceId: activeWikiSpaceId || undefined });
      setWikiPages(pages.map((item) => ({ id: item.id, title: item.title, summary: item.summary, tags: item.tags })));
      const directoryPayload = await getWikiDirectory(session.token, { spaceId: activeWikiSpaceId || undefined });
      setWikiDirectoryLastUpdatedAt(String((directoryPayload.directory.updated_at as string) || ''));
      setWikiRawFileCount(directoryPayload.rawFiles.length);
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : t('wiki.ingest.error'));
    } finally {
      setLibraryBusy(false);
    }
  }

  async function runWikiDirectoryConsistencyCheckAction(): Promise<void> {
    if (!session?.token) {
      return;
    }
    if (!activeSpaceId) {
      setFilesError(t('spaces.error.noSpaceForConsistencyCheck'));
      setFilesNotice('');
      return;
    }
    setFilesBusy(true);
    setFilesError('');
    setFilesNotice('');
    setLibraryNotice('');
    try {
      const result: WikiDirectoryConsistencyResult = await runWikiDirectoryConsistencyCheck(session.token, {
        spaceId: activeWikiSpaceId || undefined,
      });
      const extraCount = result.initialExtra.length;
      const lackCount = result.initialLack.length;
      if (result.directoryMode === 'deterministic') {
        setFilesNotice(
          t('wiki.consistency.successWithFallback', { extra: String(extraCount), lack: String(lackCount), reason: result.directoryFallbackReason || 'model_unavailable' }),
        );
      } else {
        setFilesNotice(t('wiki.consistency.success', { extra: String(extraCount), lack: String(lackCount) }));
      }
      const directoryPayload = await getWikiDirectory(session.token, { spaceId: activeWikiSpaceId || undefined });
      setWikiDirectoryLastUpdatedAt(String((directoryPayload.directory.updated_at as string) || ''));
      setWikiRawFileCount(directoryPayload.rawFiles.length);
    } catch (error) {
      setFilesError(error instanceof Error ? error.message : t('wiki.consistency.error'));
    } finally {
      setFilesBusy(false);
    }
  }

  async function refreshWikiPages(): Promise<void> {
    if (!session?.token) {
      return;
    }
    if (!activeSpaceId) {
      setLibraryError(t('spaces.error.noSpaceForWikiRefresh'));
      setLibraryNotice('');
      return;
    }
    setLibraryBusy(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      const pages = await listWikiPages(session.token, { spaceId: activeWikiSpaceId || undefined });
      setWikiPages(pages.map((item) => ({ id: item.id, title: item.title, summary: item.summary, tags: item.tags })));
      setLibraryNotice(t('wiki.refreshPages.success', { count: String(pages.length) }));
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : t('wiki.refreshPages.error'));
    } finally {
      setLibraryBusy(false);
    }
  }

  async function openWikiRawRoot(): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      setLibraryError(t('spaces.error.noActiveSpace'));
      setLibraryNotice('');
      return;
    }

    const targetPath = 'raw';
    setFilesBusy(true);
    setFilesError('');
    try {
      await createHouseholdDirectory(session.token, fileSpace, toDeviceFilePath('raw'), {
        spaceId: activeFileSpaceId || undefined,
      }).catch(() => null);
      setLibraryNotice(t('wiki.rawRoot.success', { path: targetPath }));
      setLibraryError('');
      setLibraryActiveSection('wiki');
      await refreshFiles(targetPath, { force: true });
    } catch (error) {
      setFilesError(error instanceof Error ? error.message : t('wiki.rawRoot.error'));
    } finally {
      setFilesBusy(false);
    }
  }

  async function refreshWikiDirectory(): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      setLibraryError(t('spaces.error.noSpaceForDirectory'));
      setLibraryNotice('');
      return;
    }
    setLibraryBusy(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      const payload: WikiDirectoryPayload = await getWikiDirectory(session.token, { spaceId: activeWikiSpaceId || undefined });
      setWikiDirectoryLastUpdatedAt(String((payload.directory.updated_at as string) || ''));
      setWikiRawFileCount(payload.rawFiles.length);
      setLibraryNotice(t('wiki.directory.refreshSuccess', { count: String(payload.rawFiles.length) }));
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : t('wiki.directory.refreshError'));
    } finally {
      setLibraryBusy(false);
    }
  }

  async function startPersonalWikiOrganize(): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      setLibraryError(t('spaces.error.noSpaceForOrganize'));
      setLibraryNotice('');
      return;
    }
    setLibraryBusy(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      const started = await startWikiOrganize(session.token, { spaceId: activeWikiSpaceId || undefined, maxRounds: 10 });
      setWikiOrganizeStatus({
        jobId: started.jobId,
        mode: started.mode || 'organize',
        status: started.status,
        iterations: 0,
        durationMs: 0,
        processedRecords: 0,
        startedAt: started.startedAt,
        finishedAt: null,
        message: 'organize running',
      });
      setLibraryNotice(t('wiki.organize.started'));
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : t('wiki.organize.startError'));
    } finally {
      setLibraryBusy(false);
    }
  }

  async function startWikiQualityOptimizeAction(): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      setLibraryError(t('spaces.error.noSpaceForQualityOptimize'));
      setLibraryNotice('');
      return;
    }
    setLibraryBusy(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      const started = await startWikiQualityOptimize(session.token, {
        spaceId: activeWikiSpaceId || undefined,
        maxRounds: 10,
      });
      setWikiOrganizeStatus({
        jobId: started.jobId,
        mode: started.mode || 'quality_optimize',
        status: started.status,
        iterations: 0,
        durationMs: 0,
        processedRecords: 0,
        startedAt: started.startedAt,
        finishedAt: null,
        message: 'wiki quality optimize running',
      });
      setLibraryNotice(t('wiki.qualityOptimize.started'));
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : t('wiki.qualityOptimize.startError'));
    } finally {
      setLibraryBusy(false);
    }
  }

  async function startUserSkillDistill(): Promise<void> {
    if (!session?.token) {
      setLibraryError(t('userSkill.error.notLoggedIn'));
      return;
    }
    setUserSkillBusy(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      const result = await distillUserSkill(session.token);
      if (result.ok) {
        setLibraryNotice(t('userSkill.distill.success'));
        await refreshUserSkill();
      } else {
        setLibraryError(result.error || t('userSkill.distill.error'));
      }
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : t('userSkill.distill.error'));
    } finally {
      setUserSkillBusy(false);
    }
  }

  async function refreshUserSkill(): Promise<void> {
    if (!session?.token) return;
    try {
      const result = await getUserSkill(session.token);
      setUserSkillContent(result.content);
      setUserSkillUpdatedAt(result.updatedAt);
    } catch {
      // Silently ignore — skill may not exist yet
    }
  }

  async function refreshPersonalWikiOrganizeStatus(): Promise<void> {
    if (!session?.token) {
      return;
    }
    const jobId = wikiOrganizeStatus?.jobId;
    if (!jobId) {
      setLibraryError(t('organize.noJob'));
      setLibraryNotice('');
      return;
    }
    setLibraryBusy(true);
    setLibraryError('');
    try {
      const next = await getWikiOrganizeStatus(session.token, jobId);
      setWikiOrganizeStatus(next);
      if (next.status === 'completed') {
        setLibraryNotice(t('organize.completed', { iterations: String(next.iterations), seconds: String(Math.round(next.durationMs / 1000)) }));
        await refreshWikiDirectory();
      } else if (next.status === 'failed') {
        setLibraryError(next.message || t('organize.failed'));
      } else {
        setLibraryNotice(t('organize.running'));
      }
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : t('organize.statusError'));
    } finally {
      setLibraryBusy(false);
    }
  }

  async function refreshWikiPreviewData(options?: { silent?: boolean }): Promise<void> {
    const silent = Boolean(options?.silent);
    if (!session?.token || !activeSpaceId) {
      if (!silent) {
        setLibraryError(t('spaces.error.noSpaceForWikiPreview'));
        setLibraryNotice('');
      }
      return;
    }
    if (!silent) {
      setLibraryBusy(true);
      setLibraryError('');
    }
    try {
      const preview = await getWikiPreview(session.token, { spaceId: activeWikiSpaceId || undefined });
      setWikiPreviewFiles(preview.wikiFiles);
      if (activeWikiPreviewCacheKey) {
        setWikiPreviewCacheBySpace((current) => ({
          ...current,
          [activeWikiPreviewCacheKey]: preview.wikiFiles,
        }));
        setWikiPreviewCacheLoadedAt((current) => ({
          ...current,
          [activeWikiPreviewCacheKey]: Date.now(),
        }));
      }
      if (!silent) {
        setLibraryNotice(t('wiki.preview.refreshSuccess', { count: String(preview.wikiFiles.length) }));
      }
    } catch (error) {
      if (!silent) {
        setLibraryError(error instanceof Error ? error.message : t('wiki.preview.refreshError'));
      }
    } finally {
      if (!silent) {
        setLibraryBusy(false);
      }
    }
  }

  // ── Work directory management ──────────────────────────────
  async function refreshWorkFiles(subpath?: string): Promise<void> {
    if (!session?.token) {
      setLibraryError(t('userSkill.error.notLoggedInShort'));
      return;
    }
    setWorkFileBusy(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      const files = await listRawWorkFiles(session.token, subpath);
      setWorkFiles(files);
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : t('work.list.error'));
    } finally {
      setWorkFileBusy(false);
    }
  }

  function navigateWorkDir(subpath: string): void {
    setWorkCurrentDir(subpath);
    void refreshWorkFiles(subpath || undefined);
  }

  async function openWorkFile(path: string): Promise<void> {
    if (!session?.token) return;
    setWorkFileBusy(true);
    setLibraryError('');
    try {
      const result = await readRawWorkFile(session.token, path);
      setWorkFileContent(result.content || '');
      setWorkFileActivePath(path);
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : t('work.read.error'));
    } finally {
      setWorkFileBusy(false);
    }
  }

  async function promoteWorkFile(path: string): Promise<void> {
    if (!session?.token) return;
    setWorkFileBusy(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      const result = await promoteRawWorkFile(session.token, {
        path,
        // Always promote to user's private space (no spaceId → private)
      });
      if (result.ok) {
        setLibraryNotice(t('work.promote.success', { path, filename: result.filename }));
        // If we were reading this file, go back to list
        if (workFileActivePath === path) {
          setWorkFileActivePath('');
          setWorkFileContent('');
        }
        // Refresh list
        void refreshWorkFiles(workCurrentDir || undefined);
      } else {
        setLibraryError(t('work.promote.error'));
      }
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : t('work.promote.error'));
    } finally {
      setWorkFileBusy(false);
    }
  }

  async function deleteWorkFile(path: string): Promise<void> {
    if (!session?.token) return;
    setWorkFileBusy(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      await deleteRawWorkFile(session.token, path);
      setLibraryNotice(t('work.delete.success', { path }));
      if (workFileActivePath === path) {
        setWorkFileActivePath('');
        setWorkFileContent('');
      }
      void refreshWorkFiles(workCurrentDir || undefined);
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : t('work.delete.error'));
    } finally {
      setWorkFileBusy(false);
    }
  }

  // ── Raw browser (per-space raw/ file explorer) ─────────────
  async function refreshRawBrowser(subpath?: string): Promise<void> {
    if (!session?.token || !activeSpaceId) return;
    const space: HouseholdFileSpace = activeSpace?.kind === 'shared' ? 'family' : 'private';
    const spaceId = activeSpace?.kind === 'shared' ? activeSpace.id : undefined;
    setRawBrowserBusy(true);
    setLibraryError('');
    try {
      const devicePath = subpath ? `raw/${subpath}` : 'raw';
      const listing = await getHouseholdFiles(session.token, space, devicePath, { spaceId });
      setRawBrowserFiles(listing.entries);
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : t('raw.list.error'));
      setRawBrowserFiles([]);
    } finally {
      setRawBrowserBusy(false);
    }
  }

  function navigateRawBrowserDir(subpath: string): void {
    setRawBrowserCurrentDir(subpath);
    void refreshRawBrowser(subpath || undefined);
  }

  async function openRawBrowserFile(filePath: string): Promise<void> {
    if (!session?.token || !activeSpaceId) return;
    const space: HouseholdFileSpace = activeSpace?.kind === 'shared' ? 'family' : 'private';
    const spaceId = activeSpace?.kind === 'shared' ? activeSpace.id : undefined;
    setRawBrowserBusy(true);
    setLibraryError('');
    try {
      const content = await readHouseholdFileText(session.token, space, `raw/${filePath}`, { spaceId });
      setRawBrowserContent(content);
      setRawBrowserActivePath(filePath);
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : t('raw.read.error'));
    } finally {
      setRawBrowserBusy(false);
    }
  }

  async function refreshExternalDevices(): Promise<void> {
    if (!session?.token) return;
    setExternalImportBusy(true);
    setLibraryError('');
    try {
      const result = await listExternalStorageDevices(session.token);
      setExternalMounts(result.mounts);
      if (result.mounts.length === 0) {
        setLibraryNotice(t('external.noDevices'));
      }
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : t('external.scanError'));
      setExternalMounts([]);
    } finally {
      setExternalImportBusy(false);
    }
  }

  async function browseExternalImportPath(rootPath: string, subpath?: string): Promise<void> {
    if (!session?.token) return;
    setExternalImportBusy(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      const result = await browseExternalStorage(session.token, rootPath, subpath);
      setExternalImportRootPath(result.rootPath);
      setExternalImportCurrentPath(result.currentPath);
      setExternalEntries(result.entries);
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : t('external.browseError'));
      setExternalEntries([]);
    } finally {
      setExternalImportBusy(false);
    }
  }

  function toggleExternalImportSelection(sourcePath: string): void {
    setSelectedExternalImportPaths((current) =>
      current.includes(sourcePath)
        ? current.filter((item) => item !== sourcePath)
        : [...current, sourcePath],
    );
  }

  async function importSelectedExternalEntries(): Promise<void> {
    if (!session?.token || !activeSpace) {
      setLibraryError(t('spaces.error.noSpaceForExternalImport'));
      return;
    }
    if (selectedExternalImportPaths.length === 0) {
      setLibraryError(t('external.noSelection'));
      return;
    }

    setExternalImportBusy(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      const result = await importExternalStorageItems(session.token, {
        sourcePaths: selectedExternalImportPaths,
        spaceId: activeSpace.kind === 'shared' ? activeSpace.id : undefined,
        owners: [session.user.id],
      });
      setLibraryNotice(t('external.importSuccess', { count: String(result.count) }));
      setSelectedExternalImportPaths([]);
      void refreshRawBrowser();
      void refreshWikiDirectory();
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : t('external.importError'));
    } finally {
      setExternalImportBusy(false);
    }
  }

  async function previewLinkImport(url: string): Promise<void> {
    if (!session?.token) return;
    setLinkPreviewBusy(true);
    setLinkPreviewError('');
    setLinkPreview(null);
    try {
      const result = await fetchLinkPreview(session.token, url);
      if (result.error) {
        setLinkPreviewError(result.error);
      } else {
        setLinkPreview(result);
      }
    } catch (err) {
      setLinkPreviewError(err instanceof Error ? err.message : t('linkImport.previewError'));
    } finally {
      setLinkPreviewBusy(false);
    }
  }

  async function confirmLinkImport(): Promise<void> {
    if (!session?.token || !linkPreview || !activeSpace) {
      setLibraryError(t('spaces.error.noSpaceForLinkImport'));
      return;
    }
    setLinkImportBusy(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      await importFromLink(session.token, {
        url: linkPreview.sourceUrl,
        title: linkPreview.title,
        contentMarkdown: linkPreview.contentMarkdown,
        sourcePlatform: linkPreview.platform,
        spaceId: activeSpace.kind === 'shared' ? activeSpace.id : undefined,
        owners: [session.user.id],
      });
      setLibraryNotice(t('linkImport.success', { title: linkPreview.title }));
      setLinkPreview(null);
      setLinkImportUrl('');
      void refreshRawBrowser();
      void refreshWikiDirectory();
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : t('linkImport.error'));
    } finally {
      setLinkImportBusy(false);
    }
  }

  function cancelLinkImport(): void {
    setLinkPreview(null);
    setLinkPreviewError('');
  }

  useEffect(() => {
    if (!session?.token) {
      return;
    }
    if (!wikiOrganizeStatus?.jobId || wikiOrganizeStatus.status !== 'running') {
      return;
    }
    const timer = setInterval(() => {
      void refreshPersonalWikiOrganizeStatus();
    }, 3000);
    return () => clearInterval(timer);
  }, [session?.token, wikiOrganizeStatus?.jobId, wikiOrganizeStatus?.status]);

  useEffect(() => {
    if (spaceListViewMode !== 'user-tools' || userToolsSection !== 'wiki_preview') {
      return;
    }
    if (!session?.token) {
      return;
    }

    const cached = wikiPreviewCacheBySpace[activeWikiPreviewCacheKey] || [];
    const lastLoadedAt = wikiPreviewCacheLoadedAt[activeWikiPreviewCacheKey] || 0;
    const staleMs = 90 * 1000;
    const isStale = Date.now() - lastLoadedAt > staleMs;

    if (cached.length > 0) {
      setWikiPreviewFiles(cached);
      if (isStale) {
        void refreshWikiPreviewData({ silent: true });
      }
      return;
    }

    void refreshWikiPreviewData();
  }, [
    spaceListViewMode,
    userToolsSection,
    session?.token,
    activeSpaceId,
    activeWikiPreviewCacheKey,
    wikiPreviewCacheBySpace,
    wikiPreviewCacheLoadedAt,
  ]);

  // Auto-load work files when entering workspace_manager section
  useEffect(() => {
    if (spaceListViewMode !== 'user-tools' || userToolsSection !== 'workspace_manager') {
      return;
    }
    if (!session?.token) return;
    if (workFiles.length === 0) {
      void refreshWorkFiles(workCurrentDir || undefined);
    }
  }, [spaceListViewMode, userToolsSection, session?.token]);

  // Auto-load raw files when entering raw_browser section
  useEffect(() => {
    if (libraryActiveSection !== 'raw_browser') return;
    if (!session?.token || !activeSpaceId) return;
    if (rawBrowserFiles.length === 0) {
      void refreshRawBrowser(rawBrowserCurrentDir || undefined);
    }
  }, [libraryActiveSection, session?.token, activeSpaceId]);

  useEffect(() => {
    if (libraryActiveSection !== 'external_import') return;
    if (!session?.token || !activeSpaceId) return;
    if (externalMounts.length === 0) {
      void refreshExternalDevices();
    }
  }, [libraryActiveSection, session?.token, activeSpaceId]);

  async function pickAndIngestWikiRawFiles(forcedSourceType?: 'note' | 'document' | 'image'): Promise<void> {
    if (!session?.token || !activeSpaceId) {
      setLibraryError(t('spaces.error.noSpaceForUpload'));
      setLibraryNotice('');
      return;
    }
    const ingestSourceType = forcedSourceType || wikiUploadSourceType;
    setLibraryBusy(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) {
        return;
      }
      const uploads = result.assets.map((asset, index) => ({
        name: asset.name || `upload-${index + 1}`,
        mimeType: asset.mimeType || 'application/octet-stream',
        uri: asset.uri,
      }));
      const ingested = await ingestWikiUploads(session.token, uploads, {
        spaceId: activeWikiSpaceId || undefined,
        sourceType: ingestSourceType,
      });
      setLibraryNotice(t('wiki.upload.success', { count: String(ingested.saved.length) }));
      setWikiLastIngest({
        operationId: ingested.operationId,
        pageId: '',
        title: t('wiki.upload.batchTitle', { count: String(ingested.saved.length) }),
        summary: ingested.saved.map((item) => item.name).slice(0, 4).join('、'),
        sourceType: ingestSourceType,
        directoryMode: ingested.directoryMode,
        directoryFallbackReason: ingested.directoryFallbackReason,
        directoryModelBudgetSeconds: ingested.directoryModelBudgetSeconds,
        directoryProvider: ingested.directoryProvider,
        directoryModel: ingested.directoryModel,
        directoryProviderTimeoutSeconds: ingested.directoryProviderTimeoutSeconds,
      });
      if (ingested.directoryMode === 'deterministic') {
        setLibraryNotice(
          t('wiki.upload.successWithFallback', { count: String(ingested.saved.length), reason: ingested.directoryFallbackReason || 'model_unavailable' }),
        );
      }
      await Promise.all([refreshWikiPages(), refreshWikiDirectory()]);
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : t('wiki.upload.error'));
    } finally {
      setLibraryBusy(false);
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
          <Text style={styles.loadingText}>{t('loading.bootingDevice')}</Text>
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
          <Text style={styles.loadingText}>{t('loading.openingHousehold', { name: session.household.name })}</Text>
          <Text style={styles.cardCopy}>{t('loading.loadingSpaces')}</Text>
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
                <Text style={styles.title}>{t('spaces.title')}</Text>
                <Text style={styles.subtitle}>{householdName}</Text>
              </View>
              <Pressable
                style={styles.headerBackButton}
                onPress={() => {
                  if (spaceListViewMode === 'spaces') {
                    setSpaceListViewMode('global-settings');
                  } else {
                    setSpaceListViewMode('spaces');
                    setUserToolsSection('overview');
                  }
                }}
              >
                <Text style={styles.headerBackButtonText}>
                  {spaceListViewMode === 'spaces' ? t('spaces.globalSettings') : t('spaces.backToSpaces')}
                </Text>
              </Pressable>
            </View>

            {spaceListViewMode === 'spaces' ? (
              <ScrollView keyboardShouldPersistTaps="handled" removeClippedSubviews={false} contentContainerStyle={styles.chatContent}>
                {spaces.map((space) => (
                  canManage && space.kind === 'shared' && !isSystemManagedSpace(space) ? (
                    <SwipeToDeleteSpaceRow
                      key={space.id}
                      space={{
                        ...space,
                        threadCount: spaceSessionCounts[space.id] ?? space.threadCount,
                      }}
                      onOpenSpace={openSpaceHome}
                      onDeleteSpace={requestDeleteSpace}
                    />
                  ) : (
                    <Pressable
                      key={space.id}
                      style={styles.chatTreeFolder}
                      pressFeedback="none"
                      onPress={() => openSpaceHome(space.id)}
                    >
                      <View style={styles.chatTreeFolderHeader}>
                        <View style={styles.chatTreeFolderHeaderBody}>
                          <Text style={styles.chatTreeFolderTitle}>{space.name}</Text>
                          <Text style={styles.chatTreeFolderMeta}>
                            {describeSpaceSessionCountCopy(spaceSessionCounts[space.id] ?? space.threadCount, space.memberCount)}
                          </Text>
                        </View>
                        <View style={styles.spaceListCardRightRail}>
                          <Text style={styles.spaceTemplateBadge}>{describeSpaceTemplate(space.template, t)}</Text>
                          <Text style={styles.chatTreeFolderChevron}>›</Text>
                        </View>
                      </View>
                    </Pressable>
                  )
                ))}
                {canManage ? (
                  <Pressable style={[styles.primaryButton, spacesBusy ? styles.networkRowDisabled : null]} onPress={openSpaceCreator} disabled={spacesBusy}>
                    <Text style={styles.primaryButtonText}>{t('spaces.createButton')}</Text>
                  </Pressable>
                ) : null}
                {!spaces.length && !spacesBusy ? <Text style={styles.cardCopy}>{t('spaces.emptyState')}</Text> : null}
                {spacesBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
                {spacesError ? <Text style={styles.errorText}>{spacesError}</Text> : null}
                <Pressable
                  style={styles.chatTreeFolder}
                  pressFeedback="none"
                  onPress={() => {
                    setSpaceListViewMode('user-tools');
                    setUserToolsSection('overview');
                  }}
                >
                  <View style={styles.chatTreeFolderHeader}>
                    <View style={styles.chatTreeFolderHeaderBody}>
                      <Text style={styles.chatTreeFolderTitle}>{t('userTools.title')}</Text>
                      <Text style={styles.chatTreeFolderMeta}>{t('userTools.subtitle')}</Text>
                    </View>
                    <View style={styles.spaceListCardRightRail}>
                      <Text style={styles.spaceTemplateBadge}>{t('userTools.badge')}</Text>
                      <Text style={styles.chatTreeFolderChevron}>›</Text>
                    </View>
                  </View>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => void logout()}>
                  <Text style={styles.secondaryButtonText}>{t('auth.logout')}</Text>
                </Pressable>
              </ScrollView>
            ) : spaceListViewMode === 'user-tools' ? (
              <ScrollView keyboardShouldPersistTaps="handled" removeClippedSubviews={false} contentContainerStyle={styles.chatContent}>
                <UserToolsPane
                  styles={styles}
                  busy={libraryBusy}
                  error={libraryError}
                  notice={libraryNotice}
                  onlineDeviceAvailable={onlineDeviceAvailable}
                  wikiOrganizeStatus={
                    wikiOrganizeStatus
                      ? {
                          jobId: wikiOrganizeStatus.jobId,
                          mode: wikiOrganizeStatus.mode,
                          status: wikiOrganizeStatus.status,
                          iterations: wikiOrganizeStatus.iterations,
                          durationMs: wikiOrganizeStatus.durationMs,
                          processedRecords: wikiOrganizeStatus.processedRecords,
                          message: wikiOrganizeStatus.message,
                        }
                      : null
                  }
                  onStartWikiOrganize={() => void startPersonalWikiOrganize()}
                  onStartWikiQualityOptimize={() => void startWikiQualityOptimizeAction()}
                  onRefreshWikiOrganizeStatus={() => void refreshPersonalWikiOrganizeStatus()}
                  userSkillContent={userSkillContent}
                  userSkillUpdatedAt={userSkillUpdatedAt}
                  userSkillBusy={userSkillBusy}
                  onDistillUserSkill={() => void startUserSkillDistill()}
                  onRefreshUserSkill={() => void refreshUserSkill()}
                  wikiPreviewFiles={wikiPreviewFiles}
                  onRefreshWikiPreview={() => void refreshWikiPreviewData()}
                  workFiles={workFiles}
                  workFileBusy={workFileBusy}
                  workFileContent={workFileContent}
                  workFileActivePath={workFileActivePath}
                  workCurrentDir={workCurrentDir}
                  onRefreshWorkFiles={(sub?: string) => void refreshWorkFiles(sub)}
                  onNavigateWorkDir={navigateWorkDir}
                  onReadWorkFile={(path: string) => void openWorkFile(path)}
                  onPromoteWorkFile={(path: string) => void promoteWorkFile(path)}
                  onDeleteWorkFile={(path: string) => void deleteWorkFile(path)}
                  onCloseWorkFileReader={() => { setWorkFileActivePath(''); setWorkFileContent(''); }}
                  activeSection={userToolsSection}
                  onChangeActiveSection={setUserToolsSection}
                />
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

                <DeleteAccountPane
                  styles={styles}
                  onlineDeviceAvailable={onlineDeviceAvailable}
                  onDeleteAccount={handleDeleteAccount}
                  deleteAccountBusy={deleteAccountBusy}
                />
              </ScrollView>
            )}

            <SpaceCreatorModal
              visible={spaceCreatorOpen}
              busy={spaceCreatorBusy}
              error={spaceCreatorError}
              spaceName={spaceName}
              selectedTemplateLabel={describeSpaceTemplate(spaceTemplate, t)}
              templateOptions={SPACE_TEMPLATE_OPTIONS.map((template) => ({
                id: template,
                label: describeSpaceTemplate(template, t),
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
            backToListLabel={t('spaces.backToList')}
            onBackToList={returnToSpaceList}
            tabs={buildPhaseOneTabs(t).map((tab) => ({
              id: tab.key,
              label: tab.label,
              active: tab.key === shellTab,
            }))}
            onSelectTab={handleShellTabSelect}
          />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
            nestedScrollEnabled
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
                    activeSpaceKindLabel: activeSpaceKindLabel || t('spaces.kindFallback'),
                    spacesReady: !waitingForSpaces,
                  }, t),
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
                            ? t('chat.sync.fromCache')
                            : chatListSyncSource === 'network'
                              ? t('chat.sync.fromNetwork')
                              : t('chat.sync.ready')
                        } · ${t('chat.sync.lastSyncPrefix')} ${formatChatSyncDateTime(chatListLastSyncedAt)}`
                      : '',
                  chatError,
                  scopeOptions: (['family', 'private'] as ChatSessionScope[]).map((scope) => ({
                    id: scope,
                    label: describeChatAccess(scope, t),
                    active: chatScope === scope,
                  })),
                  chatBusy,
                  canCreateChat: canCreateActiveChat,
                  createChatLabel: describeChatSessionPrimaryActionLabel(activeSpaceCopyContext, chatScope, t),
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
                  emptyStateCopy: describeChatSessionEmptyStateCopy(activeSpaceCopyContext, chatScope, t),
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
                  onDeleteSession: (sessionId: string) => requestDeleteChatSession(sessionId),
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
                  chatAttachmentItems,
                  attachmentPickerOpen: chatAttachmentPickerOpen,
                  attachmentPickerPath: chatAttachmentPickerPath,
                  attachmentPickerBusy: chatAttachmentPickerBusy,
                  attachmentPickerError: chatAttachmentPickerError,
                  attachmentPickerEntries: (chatAttachmentPickerListing?.entries || []).map((entry) => ({
                    path: entry.path,
                    name: entry.name,
                    isDir: entry.isDir,
                    selected: Boolean(chatAttachedFiles[entry.path]),
                  })),
                  saveDocModalOpen: chatSaveDocModalOpen,
                  saveDocTitle: chatSaveDocTitle,
                  saveDocItems: chatSaveDocItems,
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
                  onOpenAttachmentPicker: openChatAttachmentPicker,
                  onCloseAttachmentPicker: () => setChatAttachmentPickerOpen(false),
                  onAttachmentPickerOpenPath: (path: string) => void refreshChatAttachmentPicker(path),
                  onAttachmentPickerToggleFile: (path: string, name: string) => toggleChatAttachment(path, name),
                  onRemoveAttachment: (index: number) => removeChatAttachmentByIndex(index),
                  onOpenSaveDocModal: openChatSaveDocModal,
                  onCloseSaveDocModal: () => setChatSaveDocModalOpen(false),
                  onChangeSaveDocTitle: setChatSaveDocTitle,
                  onToggleSaveDocItem: (id: string) =>
                    setChatSaveDocSelection((current) => ({ ...current, [id]: !current[id] })),
                  onConfirmSaveDoc: () => void saveSelectedChatAsDocument(),
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
                libraryOverviewSections={libraryOverviewSections}
                memories={spaceLibrary.memories}
                summaries={spaceLibrary.summaries}
                photoEntries={photoEntries}
                tasks={tasks}
                homeMembers={homeMembers}
                currentUserId={session.user.id}
                summaryEmptyStateCopy={summaryEmptyStateCopy}
                summaryCaptureSessions={summaryCaptureSessions}
                summaryCaptureSessionsBusy={summaryCaptureSessionsBusy}
                summaryCapturePickerOpen={summaryCapturePickerOpen}
                selectedSummaryCaptureSessionId={selectedSummaryCaptureSessionId}
                activeSection={libraryActiveSection}
                wikiBusy={libraryBusy}
                wikiError={libraryError}
                wikiNotice={libraryNotice}
                wikiSourceTitle={wikiSourceTitle}
                wikiSourceContent={wikiSourceContent}
                wikiPages={wikiPages}
                wikiLastIngest={wikiLastIngest}
                wikiDirectoryLastUpdatedAt={wikiDirectoryLastUpdatedAt}
                wikiRawFileCount={wikiRawFileCount}
                wikiUploadSourceType={wikiUploadSourceType}
                rawBrowserFiles={rawBrowserFiles}
                rawBrowserBusy={rawBrowserBusy}
                rawBrowserContent={rawBrowserContent}
                rawBrowserActivePath={rawBrowserActivePath}
                rawBrowserCurrentDir={rawBrowserCurrentDir}
                externalMounts={externalMounts}
                externalEntries={externalEntries}
                externalImportBusy={externalImportBusy}
                externalImportRootPath={externalImportRootPath}
                externalImportCurrentPath={externalImportCurrentPath}
                selectedExternalImportPaths={selectedExternalImportPaths}
                onRefreshRawBrowser={(sub?: string) => void refreshRawBrowser(sub)}
                onNavigateRawBrowserDir={navigateRawBrowserDir}
                onReadRawBrowserFile={(path: string) => void openRawBrowserFile(path)}
                onCloseRawBrowserReader={() => { setRawBrowserActivePath(''); setRawBrowserContent(''); }}
                onRefreshExternalDevices={() => void refreshExternalDevices()}
                onBrowseExternalStorage={(rootPath, subpath) => void browseExternalImportPath(rootPath, subpath)}
                onToggleExternalSelection={toggleExternalImportSelection}
                onClearExternalSelection={() => setSelectedExternalImportPaths([])}
                onImportSelectedExternalItems={() => void importSelectedExternalEntries()}
                linkImportUrl={linkImportUrl}
                linkPreview={linkPreview}
                linkPreviewBusy={linkPreviewBusy}
                linkImportBusy={linkImportBusy}
                linkPreviewError={linkPreviewError}
                onChangeLinkImportUrl={setLinkImportUrl}
                onPreviewLink={(url: string) => void previewLinkImport(url)}
                onConfirmLinkImport={() => void confirmLinkImport()}
                onCancelLinkImport={cancelLinkImport}
                onChangeActiveSection={setLibraryActiveSection}
                onChangeWikiSourceTitle={setWikiSourceTitle}
                onChangeWikiSourceContent={setWikiSourceContent}
                onRunWikiIngest={() => void runWikiIngest()}
                onRunWikiDirectoryConsistencyCheck={() => void runWikiDirectoryConsistencyCheckAction()}
                onRefreshWikiPages={() => void refreshWikiPages()}
                onPickAndIngestWikiUploads={() => void pickAndIngestWikiRawFiles()}
                onRefreshWikiDirectory={() => void refreshWikiDirectory()}
                onRenameWikiRawRecord={(rawPath, newName) => void renameWikiRawRecord(rawPath, newName)}
                onDeleteWikiRawRecord={(rawPath) => void deleteWikiRawRecord(rawPath)}
                onChangeWikiUploadSourceType={setWikiUploadSourceType}
                taskEditorQuickActionsCopy={t('tasks.quickActionsCopy')}
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
                          t,
                        )
                      : t('spaces.selectSpaceHint')
                  }
                  countsCopy={
                    activeSpace
                      ? describeSpaceCounts(activeSpace.kind, activeSpace.threadCount, activeSpace.memberCount, t)
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

                <View style={styles.settingsCard}>
                  <Text style={styles.cardTitle}>{t('spaces.delete.title')}</Text>
                  <Text style={styles.cardCopy}>
                    {t('spaces.delete.copy')}
                  </Text>
                  <Pressable
                    style={[
                      styles.secondaryButtonSmall,
                      styles.spaceDeleteButton,
                      !canDeleteActiveSpace || settingsBusy ? styles.networkRowDisabled : null,
                    ]}
                    onPress={() => {
                      if (activeSpace) {
                        requestDeleteSpace(activeSpace);
                      }
                    }}
                    disabled={!canDeleteActiveSpace || settingsBusy}
                  >
                    <Text style={[styles.secondaryButtonText, styles.spaceDeleteButtonText]}>{t('spaces.delete.button')}</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </ScrollView>

          <ShellModals
            styles={styles}
            spaceCreatorOpen={spaceCreatorOpen}
            spaceCreatorBusy={spaceCreatorBusy}
            spaceCreatorError={spaceCreatorError}
            spaceName={spaceName}
            selectedTemplateLabel={describeSpaceTemplate(spaceTemplate, t)}
            templateOptions={SPACE_TEMPLATE_OPTIONS.map((template) => ({
              id: template,
              label: describeSpaceTemplate(template, t),
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
            networkSheetOpen={false}
            manualEntry={false}
            selectedNetwork={null}
            selectedSsid=""
            previousInternetSsid={null}
            wifiPassword=""
            canSubmitWifi={false}
            provisionBusy={false}
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
      canSubmitWifi={canSubmitWifi}
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

function AppWithProviders() {
  return (
    <I18nProvider>
      <App />
    </I18nProvider>
  );
}

export default AppWithProviders;
