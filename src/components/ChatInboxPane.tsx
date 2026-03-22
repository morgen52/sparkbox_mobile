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
  return (
    <>
      <View style={styles.chatInboxHeader}>
        <View style={styles.chatInboxHeaderTopRow}>
          <View style={styles.chatInboxHeaderBody}>
            <Text style={styles.chatInboxHeaderTitle}>Chats</Text>
            <Text style={styles.chatInboxHeaderCopy}>{headerCopy}</Text>
          </View>
          {canManage ? (
            <Pressable style={styles.secondaryButtonSmall} onPress={onOpenSpaceCreator} disabled={spacesBusy}>
              <Text style={styles.secondaryButtonText}>Create shared space</Text>
            </Pressable>
          ) : null}
        </View>
        {spacesError ? <Text style={styles.errorText}>{spacesError}</Text> : null}
        {spacesBusy && !hasSpaces ? <ActivityIndicator color="#0b6e4f" /> : null}
        <View style={styles.chatInboxSpaceRow}>
          {spaceChips.map((space) => (
            <Pressable
              key={space.id}
              style={[styles.chatInboxSpaceChip, space.active ? styles.chatInboxSpaceChipActive : null]}
              onPress={() => onSelectSpace(space.id)}
            >
              <Text
                style={[
                  styles.chatInboxSpaceChipLabel,
                  space.active ? styles.chatInboxSpaceChipLabelActive : null,
                ]}
              >
                {space.name}
              </Text>
              <Text
                style={[
                  styles.chatInboxSpaceChipMeta,
                  space.active ? styles.chatInboxSpaceChipMetaActive : null,
                ]}
              >
                {space.countsCopy}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Chats in this space</Text>
        <Text style={styles.cardCopy}>{activeSpaceBodyCopy}</Text>
        {chatSendPhaseCopy ? <Text style={styles.selectionLabel}>{chatSendPhaseCopy}</Text> : null}
        {chatError ? <Text style={styles.errorText}>{chatError}</Text> : null}
        {waitingForSpaces ? (
          <ActivityIndicator color="#0b6e4f" />
        ) : (
          <>
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
                <Text style={styles.secondaryButtonText}>Refresh</Text>
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
            {sessions.length === 0 ? (
              <Text style={styles.cardCopy}>{emptyStateCopy}</Text>
            ) : (
              sessions.map((session) => (
                <Pressable
                  key={session.id}
                  style={[styles.chatSessionRow, session.active ? styles.chatSessionRowActive : null]}
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
        )}
      </View>
    </>
  );
}
