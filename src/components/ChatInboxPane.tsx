import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

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
  spacesError: string;
  spacesBusy: boolean;
  hasSpaces: boolean;
  canManage: boolean;
  waitingForSpaces: boolean;
  onlineDeviceAvailable: boolean;
  activeSpaceBodyCopy: string;
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
  onOpenSpaceCreator: () => void;
  onSelectSpace: (spaceId: string) => void;
  onSelectScope: (scopeId: string) => void;
  onRefresh: () => void;
  onCreateChat: () => void;
  onOpenSession: (sessionId: string) => void;
};

export function ChatInboxPane({
  styles,
  headerCopy,
  spacesError,
  spacesBusy,
  hasSpaces,
  canManage,
  waitingForSpaces,
  onlineDeviceAvailable,
  activeSpaceBodyCopy,
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
  onOpenSpaceCreator,
  onSelectSpace,
  onSelectScope,
  onRefresh,
  onCreateChat,
  onOpenSession,
}: ChatInboxPaneProps) {
  const activeSpace = spaceChips.find((space) => space.active) ?? null;
  const [expandedSpaceId, setExpandedSpaceId] = React.useState<string | null>(activeSpace?.id ?? null);
  const previousActiveSpaceIdRef = React.useRef<string | null>(activeSpace?.id ?? null);

  React.useEffect(() => {
    const activeSpaceId = activeSpace?.id ?? null;
    if (activeSpaceId && activeSpaceId !== previousActiveSpaceIdRef.current) {
      setExpandedSpaceId(activeSpaceId);
    }
    previousActiveSpaceIdRef.current = activeSpaceId;
  }, [activeSpace?.id]);

  function toggleSpace(spaceId: string): void {
    setExpandedSpaceId((current) => (current === spaceId ? null : spaceId));
    onSelectSpace(spaceId);
  }

  return (
    <View style={styles.chatExplorerRail}>
      <View style={styles.chatInboxHeader}>
        <View style={styles.chatInboxHeaderTopRow}>
          <View style={styles.chatInboxHeaderBody}>
            <Text style={styles.chatInboxHeaderTitle}>聊天目录</Text>
            <Text style={styles.chatInboxHeaderCopy}>{headerCopy}</Text>
          </View>
          {canManage ? (
            <Pressable style={styles.secondaryButtonSmall} onPress={onOpenSpaceCreator} disabled={spacesBusy}>
              <Text style={styles.secondaryButtonText}>新建 Space</Text>
            </Pressable>
          ) : null}
        </View>
        {spacesError ? <Text style={styles.errorText}>{spacesError}</Text> : null}
        {spacesBusy && !hasSpaces ? <ActivityIndicator color="#0b6e4f" /> : null}
        {chatListRefreshing ? <Text style={styles.selectionLabel}>正在从云端刷新聊天列表...</Text> : null}
        {chatListSyncCopy ? <Text style={styles.chatInboxStatusCopy}>{chatListSyncCopy}</Text> : null}
        {chatError ? <Text style={styles.errorText}>{chatError}</Text> : null}
        {chatSendPhaseCopy ? <Text style={styles.selectionLabel}>{chatSendPhaseCopy}</Text> : null}
      </View>

      {spaceChips.map((space) => {
        const expanded = expandedSpaceId === space.id;
        const ready = expanded && space.active;
        return (
          <View
            key={space.id}
            style={[styles.chatTreeFolder, space.active ? styles.chatTreeFolderActive : null]}
          >
            <Pressable style={styles.chatTreeFolderHeader} onPress={() => toggleSpace(space.id)}>
              <View style={styles.chatTreeFolderHeaderBody}>
                <Text style={styles.chatTreeFolderTitle}>{space.name}</Text>
                <Text style={styles.chatTreeFolderMeta}>{space.countsCopy}</Text>
              </View>
              <Text style={styles.chatTreeFolderChevron}>{expanded ? '∧' : '∨'}</Text>
            </Pressable>

            {expanded ? (
              <View style={styles.chatTreeFolderBody}>
                {!space.active ? <Text style={styles.cardCopy}>正在切换到该空间...</Text> : null}
                {ready ? (
                  <>
                    <Text style={styles.cardCopy}>{activeSpaceBodyCopy}</Text>
                    <View style={styles.scopeRow}>
                      {scopeOptions.map((scope) => (
                        <Pressable
                          key={scope.id}
                          style={[styles.scopePill, scope.active ? styles.scopePillActive : null]}
                          onPress={() => onSelectScope(scope.id)}
                        >
                          <Text style={[styles.scopePillLabel, scope.active ? styles.scopePillLabelActive : null]}>
                            {scope.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={styles.inlineActions}>
                      <Pressable style={styles.secondaryButtonSmall} onPress={onRefresh} disabled={chatBusy}>
                        <Text style={styles.secondaryButtonText}>刷新聊天</Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.primaryButtonSmall,
                          !onlineDeviceAvailable || !canCreateChat ? styles.networkRowDisabled : null,
                        ]}
                        onPress={onCreateChat}
                        disabled={!onlineDeviceAvailable || chatBusy || !canCreateChat}
                      >
                        <Text style={styles.primaryButtonText}>{createChatLabel}</Text>
                      </Pressable>
                    </View>
                    {chatBusy && sessions.length === 0 ? <ActivityIndicator color="#0b6e4f" /> : null}
                    {waitingForSpaces ? (
                      <ActivityIndicator color="#0b6e4f" />
                    ) : sessions.length === 0 ? (
                      <Text style={styles.cardCopy}>{emptyStateCopy}</Text>
                    ) : (
                      sessions.map((session) => (
                        <Pressable
                          key={session.id}
                          style={[
                            styles.chatSessionRow,
                            styles.chatSessionRowExplorer,
                            session.active ? styles.chatSessionRowActive : null,
                          ]}
                          onPress={() => onOpenSession(session.id)}
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
                      ))
                    )}
                  </>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}

      {!spaceChips.length && !spacesBusy ? <Text style={styles.cardCopy}>还没有 Space，可先创建一个。</Text> : null}
    </View>
  );
}
