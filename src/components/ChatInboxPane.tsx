import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  PanResponder,
  Platform,
  Pressable,
  Text,
  UIManager,
  View,
} from 'react-native';

type SpaceChip = {
  id: string;
  name: string;
  countsCopy: string;
  active: boolean;
};

type ScopeOption = {
  id: string;
  label: string;
  active: boolean;
};

type ChatInboxSession = {
  id: string;
  name: string;
  preview: string;
  timestamp: string;
  badge: string;
  active: boolean;
  avatarLabel: string;
  avatarTone: 'group' | 'private' | 'shared';
};

type ChatInboxPaneProps = {
  styles: Record<string, any>;
  headerCopy: string;
  singleSpaceMode?: boolean;
  spacesError: string;
  spacesBusy: boolean;
  hasSpaces: boolean;
  canManage: boolean;
  waitingForSpaces: boolean;
  onlineDeviceAvailable: boolean;
  chatSendPhaseCopy: string;
  chatListRefreshing: boolean;
  chatListSyncCopy: string;
  chatError: string;
  scopeOptions: ScopeOption[];
  chatBusy: boolean;
  canCreateChat: boolean;
  createChatLabel: string;
  sessions: ChatInboxSession[];
  emptyStateCopy: string;
  spaceChips: SpaceChip[];
  toolsProps?: Record<string, any>;
  onOpenSpaceCreator: () => void;
  onSelectSpace: (spaceId: string) => void;
  onSelectScope: (scopeId: string) => void;
  onRefresh: () => void;
  onCreateChat: () => void;
  onOpenSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
};

type ThreadRow = {
  id: string;
  title: string;
  badge: string;
  copy: string;
};

const SWIPE_DELETE_WIDTH = 78;

function SwipeToDeleteSessionRow({
  styles,
  session,
  onOpenSession,
  onDeleteSession,
}: {
  styles: Record<string, any>;
  session: ChatInboxSession;
  onOpenSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}) {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const offsetRef = React.useRef(0);

  const animateTo = React.useCallback(
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

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dx) > 6 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderMove: (_event, gestureState) => {
          const next = Math.max(-SWIPE_DELETE_WIDTH, Math.min(0, offsetRef.current + gestureState.dx));
          translateX.setValue(next);
        },
        onPanResponderRelease: (_event, gestureState) => {
          const dragDistance = offsetRef.current + gestureState.dx;
          const shouldOpen = gestureState.vx < -0.2 || dragDistance < -SWIPE_DELETE_WIDTH / 2;
          animateTo(shouldOpen ? -SWIPE_DELETE_WIDTH : 0);
        },
        onPanResponderTerminate: () => {
          animateTo(0);
        },
      }),
    [animateTo, translateX],
  );

  return (
    <View style={styles.chatSessionSwipeContainer}>
      <Pressable
        style={styles.chatSessionDeleteAction}
        onPress={() => {
          animateTo(0);
          onDeleteSession(session.id);
        }}
      >
        <MaterialCommunityIcons name="delete-outline" size={24} color="#ffffff" />
      </Pressable>
      <Animated.View style={[styles.chatSessionSwipeFront, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <Pressable
          style={[
            styles.chatSessionRow,
            styles.chatSessionRowExplorer,
            session.active ? styles.chatSessionRowActive : null,
          ]}
          onPress={() => {
            if (offsetRef.current <= -8) {
              animateTo(0);
              return;
            }
            onOpenSession(session.id);
          }}
        >
          <View style={styles.chatSessionAvatarRail}>
            <View
              style={[
                styles.chatSessionAvatarBubble,
                session.avatarTone === 'group'
                  ? styles.chatSessionAvatarBubbleGroup
                  : session.avatarTone === 'private'
                    ? styles.chatSessionAvatarBubblePrivate
                    : styles.chatSessionAvatarBubbleShared,
              ]}
            >
              <Text
                style={[
                  styles.chatSessionAvatarLabel,
                  session.avatarTone === 'group' ? styles.chatSessionAvatarLabelOnDark : null,
                ]}
              >
                {session.avatarLabel}
              </Text>
            </View>
          </View>
          <View style={styles.chatSessionBody}>
            <Text numberOfLines={1} style={styles.chatSessionTitle}>
              {session.name}
            </Text>
            <Text numberOfLines={2} style={styles.chatSessionPreview}>
              {session.preview}
            </Text>
          </View>
          <View style={styles.chatSessionMeta}>
            {session.timestamp ? <Text style={styles.chatSessionTimestamp}>{session.timestamp}</Text> : null}
            <Text style={session.active ? styles.statusTagOnline : styles.tagMuted}>{session.badge}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function ChatInboxPane({
  styles,
  headerCopy,
  singleSpaceMode = false,
  spacesError,
  spacesBusy,
  hasSpaces,
  canManage,
  waitingForSpaces,
  onlineDeviceAvailable,
  chatSendPhaseCopy,
  chatListRefreshing,
  chatListSyncCopy,
  chatError,
  scopeOptions,
  chatBusy,
  canCreateChat,
  createChatLabel,
  sessions,
  emptyStateCopy,
  spaceChips,
  toolsProps,
  onOpenSpaceCreator,
  onSelectSpace,
  onSelectScope,
  onRefresh,
  onCreateChat,
  onOpenSession,
  onDeleteSession,
}: ChatInboxPaneProps) {
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  type EnabledFamilyApp = {
    slug: string;
    title: string;
    config: Record<string, unknown>;
    meta?: {
      entryTitle?: string | null;
      entryCopy?: string | null;
      description?: string | null;
      starterPrompts?: string[];
    } | null;
  };

  type ReadyInstalledFamilyApp = {
    slug: string;
    title: string;
    entryTitle?: string | null;
    entryCopy?: string | null;
    description?: string | null;
    riskLevel: string;
    spaceTemplates?: string[];
  };

  const enabledFamilyApps = (toolsProps?.enabledFamilyApps || []) as EnabledFamilyApp[];
  const readyInstalledFamilyApps = (toolsProps?.readyInstalledFamilyApps || []) as ReadyInstalledFamilyApp[];
  const activeSpaceTemplate = String(toolsProps?.activeSpaceTemplate || '').trim().toLowerCase();

  const activeSpace = spaceChips.find((space) => space.active) ?? null;
  const privateScopeActive = scopeOptions.some((scope) => scope.id === 'private' && scope.active);
  const [expandedSpaceId, setExpandedSpaceId] = React.useState<string | null>(activeSpace?.id ?? null);
  const [expandedAppLists, setExpandedAppLists] = React.useState<Record<string, boolean>>({});
  const [expandedEnableLists, setExpandedEnableLists] = React.useState<Record<string, boolean>>({});
  const [quickStartPanelOpen, setQuickStartPanelOpen] = React.useState(false);
  const previousActiveSpaceIdRef = React.useRef<string | null>(activeSpace?.id ?? null);
  const onSelectScopeRef = React.useRef(onSelectScope);
  const threadRows = (toolsProps?.threadRows || []) as ThreadRow[];

  React.useEffect(() => {
    onSelectScopeRef.current = onSelectScope;
  }, [onSelectScope]);

  React.useEffect(() => {
    const activeSpaceId = activeSpace?.id ?? null;
    if (activeSpaceId && activeSpaceId !== previousActiveSpaceIdRef.current) {
      setExpandedSpaceId(activeSpaceId);
      setQuickStartPanelOpen(false);
    }
    previousActiveSpaceIdRef.current = activeSpaceId;
  }, [activeSpace?.id]);

  React.useEffect(() => {
    const activeSpaceId = activeSpace?.id ?? null;
    if (activeSpaceTemplate === 'private' && expandedSpaceId === activeSpaceId && !privateScopeActive) {
      onSelectScopeRef.current('private');
    }
  }, [activeSpace?.id, activeSpaceTemplate, expandedSpaceId, privateScopeActive]);

  function toggleSpace(spaceId: string): void {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSpaceId((current) => (current === spaceId ? null : spaceId));
    onSelectSpace(spaceId);
  }

  function toggleAppList(spaceId: string): void {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedAppLists((current) => ({
      ...current,
      [spaceId]: !current[spaceId],
    }));
  }

  function toggleEnableList(spaceId: string): void {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedEnableLists((current) => ({
      ...current,
      [spaceId]: !current[spaceId],
    }));
  }

  function toggleQuickStartPanel(): void {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setQuickStartPanelOpen((current) => !current);
  }

  return (
    <View style={styles.chatExplorerRail}>
      {spacesError ? <Text style={styles.errorText}>{spacesError}</Text> : null}
      {spacesBusy && !hasSpaces ? <ActivityIndicator color="#0b6e4f" /> : null}
      {chatError ? <Text style={styles.errorText}>{chatError}</Text> : null}
      {chatSendPhaseCopy ? <Text style={styles.selectionLabel}>{chatSendPhaseCopy}</Text> : null}

      {(singleSpaceMode ? spaceChips.filter((space) => space.active) : spaceChips).map((space) => {
        const expanded = expandedSpaceId === space.id;
        const forcedExpanded = singleSpaceMode ? true : expanded;
        const appListExpanded = expandedAppLists[space.id] === true;
        const isDefaultPrivateSpace = space.active && activeSpaceTemplate === 'private';
        const showQuickStartButton = space.active && threadRows.length > 0;
        return (
          <View key={space.id} style={[styles.chatTreeFolder, space.active ? styles.chatTreeFolderActive : null]}>
            <Pressable
              style={styles.chatTreeFolderHeader}
              onPress={() => {
                if (!singleSpaceMode) {
                  toggleSpace(space.id);
                }
              }}
            >
              <View style={styles.chatTreeFolderHeaderBody}>
                <Text style={styles.chatTreeFolderTitle}>{space.name}</Text>
                <Text style={styles.chatTreeFolderMeta}>{space.countsCopy}</Text>
              </View>
              <View style={styles.chatTreeFolderHeaderActions}>
                {showQuickStartButton ? (
                  <Pressable
                    style={[styles.chatQuickStartButton, chatBusy ? styles.networkRowDisabled : null]}
                    onPress={(event) => {
                      event.stopPropagation();
                      toggleQuickStartPanel();
                    }}
                    disabled={chatBusy}
                  >
                    <View style={styles.chatQuickStartButtonInner}>
                      <Text style={styles.chatQuickStartButtonText}>快速开始话题</Text>
                      <Text style={styles.chatQuickStartButtonChevron}>{quickStartPanelOpen ? '∧' : '∨'}</Text>
                    </View>
                  </Pressable>
                ) : null}
                {!singleSpaceMode ? <Text style={styles.chatTreeFolderChevron}>{expanded ? '∧' : '∨'}</Text> : null}
              </View>
            </Pressable>

            {forcedExpanded ? (
              <View style={styles.chatTreeFolderBody}>
                <View style={styles.chatTreeSectionDividerCompact} />
                {!space.active ? <Text style={styles.cardCopy}>正在切换到该空间...</Text> : null}
                {forcedExpanded && space.active ? (
                  <>
                    {quickStartPanelOpen ? (
                      <View style={styles.chatQuickStartPopover}>
                        <Text style={styles.chatQuickStartPopoverTitle}>话题入口</Text>
                        {threadRows.map((thread) => (
                          <Pressable
                            key={thread.id}
                            style={styles.chatQuickStartRow}
                            onPress={() => {
                              setQuickStartPanelOpen(false);
                              if (toolsProps?.onOpenThread) {
                                toolsProps.onOpenThread(thread.id);
                              }
                            }}
                          >
                            <View style={styles.chatQuickStartRowBody}>
                              <Text style={styles.chatQuickStartRowTitle}>{thread.title}</Text>
                              <Text style={styles.chatQuickStartRowCopy}>{thread.copy}</Text>
                            </View>
                            <Text style={styles.tagMuted}>{thread.badge}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                    <View style={styles.chatScopeNavRow}>
                      <View style={styles.chatScopeNavTabs}>
                        {isDefaultPrivateSpace ? (
                          <Pressable
                            style={[styles.chatScopeNavTab, styles.chatScopeNavTabLast, styles.chatScopeNavTabActive]}
                            onPress={() => onSelectScope('private')}
                          >
                            <Text style={[styles.chatScopeNavTabLabel, styles.chatScopeNavTabLabelActive]}>仅自己</Text>
                          </Pressable>
                        ) : (
                          scopeOptions.map((scope, index) => (
                            <Pressable
                              key={scope.id}
                              style={[
                                styles.chatScopeNavTab,
                                index === scopeOptions.length - 1 ? styles.chatScopeNavTabLast : null,
                                scope.active ? styles.chatScopeNavTabActive : null,
                              ]}
                              onPress={() => onSelectScope(scope.id)}
                            >
                              <Text
                                style={[
                                  styles.chatScopeNavTabLabel,
                                  scope.active ? styles.chatScopeNavTabLabelActive : null,
                                ]}
                              >
                                {scope.label}
                              </Text>
                            </Pressable>
                          ))
                        )}
                      </View>
                      <Pressable
                        style={[styles.chatScopeRefreshButton, chatBusy ? styles.networkRowDisabled : null]}
                        onPress={onRefresh}
                        disabled={chatBusy}
                      >
                        <Text style={styles.chatScopeRefreshIcon}>↻</Text>
                      </Pressable>
                    </View>
                    {chatListRefreshing ? <Text style={styles.selectionLabel}>正在从云端刷新聊天列表...</Text> : null}
                    {chatListSyncCopy ? <Text style={styles.chatInboxStatusCopy}>{chatListSyncCopy}</Text> : null}
                    {chatBusy && sessions.length === 0 ? <ActivityIndicator color="#0b6e4f" /> : null}
                    {waitingForSpaces ? (
                      <ActivityIndicator color="#0b6e4f" />
                    ) : sessions.length === 0 ? (
                      <Text style={styles.chatEmptyStateCopy}>{emptyStateCopy}</Text>
                    ) : (
                      sessions.map((session) => (
                        <SwipeToDeleteSessionRow
                          key={session.id}
                          styles={styles}
                          session={session}
                          onOpenSession={onOpenSession}
                          onDeleteSession={onDeleteSession}
                        />
                      ))
                    )}
                    <Pressable
                      style={[
                        styles.primaryButton,
                        !onlineDeviceAvailable || !canCreateChat ? styles.networkRowDisabled : null,
                      ]}
                      onPress={onCreateChat}
                      disabled={!onlineDeviceAvailable || chatBusy || !canCreateChat}
                    >
                      <Text style={styles.primaryButtonText}>{createChatLabel}</Text>
                    </Pressable>

                    {toolsProps ? (
                      <>
                        <View style={styles.chatTreeSectionDivider} />
                        <View style={styles.chatTreeAppList}>
                        <Pressable style={styles.chatTreeAppListHeader} onPress={() => toggleAppList(space.id)}>
                          <Text style={styles.selectionLabel}>应用列表</Text>
                          <Text style={styles.chatTreeAppListToggle}>{appListExpanded ? '∧' : '∨'}</Text>
                        </Pressable>

                        {appListExpanded ? (
                          <>
                            {!isDefaultPrivateSpace && toolsProps?.showRelayHelper ? (
                              <View style={styles.chatAppCard}>
                                <View style={styles.chatAppHeader}>
                                  <Text style={styles.chatAppTitle}>私下转达</Text>
                                  <Text style={styles.tagMuted}>沟通辅助</Text>
                                </View>
                                <Text style={styles.chatAppCopy}>当你不方便直接表达时，可让 Sparkbox 私下转达给本空间成员。</Text>
                                {toolsProps?.relayNotice ? <Text style={styles.noticeText}>{toolsProps.relayNotice}</Text> : null}
                                <View style={styles.inlineActions}>
                                  <Pressable
                                    style={[
                                      styles.primaryButtonSmall,
                                      !toolsProps?.canOpenRelay ? styles.networkRowDisabled : null,
                                    ]}
                                    onPress={() => toolsProps?.onOpenRelay && toolsProps.onOpenRelay()}
                                    disabled={!toolsProps?.canOpenRelay}
                                  >
                                    <Text style={styles.primaryButtonText}>让 Sparkbox 私下转达</Text>
                                  </Pressable>
                                </View>
                              </View>
                            ) : null}

                            {enabledFamilyApps.map((app) => (
                              <View key={`enabled-${app.slug}`} style={styles.chatAppCard}>
                                <View style={styles.chatAppHeader}>
                                  <Text style={styles.chatAppTitle}>{app.meta?.entryTitle || app.title}</Text>
                                  <Text style={styles.statusTagOnline}>已启用</Text>
                                </View>
                                <Text style={styles.chatAppCopy}>
                                  {app.meta?.entryCopy || app.meta?.description || '这个应用已在当前 Space 启用。'}
                                </Text>
                                {app.meta?.starterPrompts?.length ? (
                                  <View style={styles.scopeRow}>
                                    {app.meta.starterPrompts.map((prompt) => (
                                      <Pressable
                                        key={`enabled-${app.slug}-${prompt}`}
                                        style={styles.scopePill}
                                        onPress={() =>
                                          toolsProps?.onOpenFamilyAppStarter &&
                                          toolsProps.onOpenFamilyAppStarter(app.slug, prompt)
                                        }
                                      >
                                        <Text style={styles.scopePillLabel}>{prompt}</Text>
                                      </Pressable>
                                    ))}
                                  </View>
                                ) : null}
                                {toolsProps?.formatFamilyAppConfigSummary ? (
                                  <Text style={styles.chatAppCopy}>{toolsProps.formatFamilyAppConfigSummary(app.config)}</Text>
                                ) : null}
                                {toolsProps?.canManageActiveSpaceFamilyApps ? (
                                  <View style={styles.inlineActions}>
                                    <Pressable
                                      style={styles.secondaryButtonSmall}
                                      onPress={() => toolsProps?.onDisableFamilyApp && toolsProps.onDisableFamilyApp(app.slug)}
                                      disabled={toolsProps?.settingsBusy}
                                    >
                                      <Text style={styles.secondaryButtonText}>在此停用</Text>
                                    </Pressable>
                                  </View>
                                ) : null}
                              </View>
                            ))}

                            <View style={styles.chatAppCard}>
                              <Pressable style={styles.chatTreeAppListHeader} onPress={() => toggleEnableList(space.id)}>
                                <Text style={styles.chatAppTitle}>应用启用</Text>
                                <Text style={styles.chatTreeAppListToggle}>
                                  {expandedEnableLists[space.id] ? '∧' : '∨'}
                                </Text>
                              </Pressable>
                              <Text style={styles.chatAppCopy}>管理已安装到设备、但尚未在当前 Space 启用的应用。</Text>
                              {toolsProps?.appActionNotice ? <Text style={styles.noticeText}>{toolsProps.appActionNotice}</Text> : null}
                              {toolsProps?.appActionError ? <Text style={styles.errorText}>{toolsProps.appActionError}</Text> : null}
                              {!toolsProps?.canManageActiveSpaceFamilyApps ? (
                                <Text style={styles.tagMuted}>仅管理员可在此空间启用应用。</Text>
                              ) : null}

                              {expandedEnableLists[space.id] ? (
                                <>
                                  {readyInstalledFamilyApps.length === 0 ? (
                                    <Text style={styles.cardCopy}>当前设备中的家庭应用都已在这个 Space 启用。</Text>
                                  ) : (
                                    readyInstalledFamilyApps.map((app) => (
                                      <View key={`ready-installed-${app.slug}`} style={styles.chatAppCard}>
                                        {(() => {
                                          const activeSpaceTemplate = String(toolsProps?.activeSpaceTemplate || '').trim();
                                          const supportedTemplates = Array.isArray(app.spaceTemplates)
                                            ? app.spaceTemplates.map((item) => String(item))
                                            : [];
                                          const supportsCurrentTemplate =
                                            !activeSpaceTemplate ||
                                            supportedTemplates.length === 0 ||
                                            supportedTemplates.includes(activeSpaceTemplate);
                                          return (
                                            <>
                                        <View style={styles.chatAppHeader}>
                                          <Text style={styles.chatAppTitle}>{app.entryTitle || app.title}</Text>
                                          <Text style={styles.tagMuted}>
                                            {toolsProps?.describeFamilyAppRiskLevel
                                              ? toolsProps.describeFamilyAppRiskLevel(app.riskLevel)
                                              : '可启用'}
                                          </Text>
                                        </View>
                                        <Text style={styles.chatAppCopy}>{app.entryCopy || app.description || '可在此 Space 启用。'}</Text>
                                        {!supportsCurrentTemplate ? (
                                          <Text style={styles.tagMuted}>当前 Space 类型暂不支持此应用。</Text>
                                        ) : null}
                                        <View style={styles.inlineActions}>
                                          <Pressable
                                            style={[
                                              styles.primaryButtonSmall,
                                              !supportsCurrentTemplate ? styles.networkRowDisabled : null,
                                            ]}
                                            onPress={() => toolsProps?.onEnableFamilyApp && toolsProps.onEnableFamilyApp(app.slug)}
                                            disabled={
                                              toolsProps?.settingsBusy ||
                                              !toolsProps?.canManageActiveSpaceFamilyApps ||
                                              !supportsCurrentTemplate
                                            }
                                          >
                                            <Text style={styles.primaryButtonText}>在此空间启用</Text>
                                          </Pressable>
                                        </View>
                                            </>
                                          );
                                        })()}
                                      </View>
                                    ))
                                  )}

                                  <Pressable
                                    style={styles.primaryButton}
                                    onPress={() => toolsProps?.onOpenAllFamilyApps && toolsProps.onOpenAllFamilyApps()}
                                  >
                                    <Text style={styles.primaryButtonText}>更多应用安装与卸载</Text>
                                  </Pressable>
                                </>
                              ) : null}
                            </View>
                          </>
                        ) : null}
                        </View>
                      </>
                    ) : null}
                  </>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}

      {canManage && !singleSpaceMode ? (
        <Pressable style={[styles.primaryButton, spacesBusy ? styles.networkRowDisabled : null]} onPress={onOpenSpaceCreator} disabled={spacesBusy}>
          <Text style={styles.primaryButtonText}>新建 Space</Text>
        </Pressable>
      ) : null}

      {!spaceChips.length && !spacesBusy ? <Text style={styles.cardCopy}>还没有 Space，可先创建一个。</Text> : null}
    </View>
  );
}