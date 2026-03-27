import React from 'react';
import { ActivityIndicator, Alert, Text, TextInput, View } from 'react-native';
import { AnimatedPressable as Pressable } from './AnimatedPressable';
import { decodeChatMessageContent, describeChatMessageTimestamp } from '../appShell';

type ChatTimelineMessage = {
  content: string;
  createdAt?: string | null;
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

type ChatDetailPaneProps = {
  styles: Record<string, any>;
  waitingForSpaces: boolean;
  activeChatTitle: string;
  activeChatSubtitle: string;
  participantSummary: string;
  participantLabels: string[];
  onlineDeviceAvailable: boolean;
  showParticipantPills: boolean;
  showManageActions: boolean;
  hasActiveChatSession: boolean;
  chatBusy: boolean;
  chatTimelineGroups: ChatTimelineGroup[];
  hasMessages: boolean;
  composerTitle: string;
  composerPlaceholder: string;
  chatDraft: string;
  canSend: boolean;
  onBack: () => void;
  onEdit: () => void;
  onClear: () => void;
  onDelete: () => void;
  onRetry: (content?: string) => void;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
};

export function ChatDetailPane({
  styles,
  waitingForSpaces,
  activeChatTitle,
  activeChatSubtitle,
  participantSummary,
  participantLabels,
  onlineDeviceAvailable,
  showParticipantPills,
  showManageActions,
  hasActiveChatSession,
  chatBusy,
  chatTimelineGroups,
  hasMessages,
  composerTitle,
  composerPlaceholder,
  chatDraft,
  canSend,
  onBack,
  onEdit,
  onClear,
  onDelete,
  onRetry,
  onChangeDraft,
  onSend,
}: ChatDetailPaneProps) {
  return (
    <>
      <View style={styles.card}>
        <View style={styles.chatDetailHeader}>
          <View style={styles.chatDetailHeaderTopRow}>
            <Pressable
              style={[styles.secondaryButtonSmall, !hasActiveChatSession ? styles.networkRowDisabled : null]}
              onPress={onBack}
              disabled={!hasActiveChatSession}
            >
              <Text style={styles.secondaryButtonText}>返回聊天列表</Text>
            </Pressable>
            {hasActiveChatSession ? (
              <Text style={onlineDeviceAvailable ? styles.statusTagOnline : styles.statusTagOffline}>
                {onlineDeviceAvailable ? '设备在线' : '设备离线'}
              </Text>
            ) : null}
          </View>
          <View style={styles.chatDetailHeaderBody}>
            <Text style={styles.chatDetailTitle}>{activeChatTitle}</Text>
            <Text style={styles.chatDetailSubtitle}>{activeChatSubtitle}</Text>
            {participantSummary && !waitingForSpaces ? (
              <Text style={styles.chatDetailParticipants}>{participantSummary}</Text>
            ) : null}
          </View>
        </View>
        {waitingForSpaces ? <ActivityIndicator color="#0b6e4f" /> : null}
        {showParticipantPills ? (
          <View style={styles.scopeRow}>
            {participantLabels.map((label) => {
              const isCurrentUser = label === '你';
              return (
                <View
                  key={`shared-chat-member-${label}`}
                  style={[styles.groupParticipantPill, isCurrentUser ? styles.groupParticipantPillSelf : null]}
                >
                  <Text
                    style={[
                      styles.groupParticipantLabel,
                      isCurrentUser ? styles.groupParticipantLabelSelf : null,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
            <View
              style={[
                styles.groupParticipantPill,
                onlineDeviceAvailable ? styles.groupParticipantPillOnline : styles.groupParticipantPillOffline,
              ]}
            >
              <Text
                style={[
                  styles.groupParticipantLabel,
                  onlineDeviceAvailable ? styles.groupParticipantLabelOnline : styles.groupParticipantLabelOffline,
                ]}
              >
                {onlineDeviceAvailable ? 'Sparkbox' : '设备离线'}
              </Text>
            </View>
          </View>
        ) : null}
        {showManageActions ? (
          <View style={styles.inlineActions}>
            <Pressable style={styles.secondaryButtonSmall} onPress={onEdit}>
              <Text style={styles.secondaryButtonText}>编辑设置</Text>
            </Pressable>
            <Pressable style={styles.secondaryButtonSmall} onPress={onClear} disabled={chatBusy}>
              <Text style={styles.secondaryButtonText}>清空消息</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButtonSmall}
              onPress={() =>
                Alert.alert('删除这个聊天？', '聊天历史将被清空且不可恢复。', [
                  { text: '取消', style: 'cancel' },
                  { text: '删除', style: 'destructive', onPress: onDelete },
                ])
              }
              disabled={chatBusy}
            >
              <Text style={styles.secondaryButtonText}>删除聊天</Text>
            </Pressable>
          </View>
        ) : null}
        {!hasMessages ? (
          <Text style={styles.cardCopy}>当前聊天还没有消息。</Text>
        ) : (
          chatTimelineGroups.map((group) =>
            group.kind === 'status' ? (
              <View key={group.id} style={styles.chatStatusNotice}>
                <View style={styles.chatStatusNoticeHeader}>
                  <Text style={styles.selectionLabel}>{group.senderLabel}</Text>
                  {group.message.createdAt ? (
                    <Text style={styles.chatStatusTimestamp}>
                      {describeChatMessageTimestamp(group.message.createdAt)}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.chatStatusNoticeCopy}>
                  {decodeChatMessageContent(group.message.content)}
                </Text>
                <Text style={styles.cardCopy}>{group.statusCopy}</Text>
                {group.message.failed && group.message.errorMessage ? (
                  <Text style={styles.errorText}>{group.message.errorMessage}</Text>
                ) : null}
                {group.message.retryable && group.message.retryContent ? (
                  <View style={styles.inlineActions}>
                    <Pressable
                      style={styles.secondaryButtonSmall}
                      onPress={() => onRetry(group.message.retryContent ?? undefined)}
                      disabled={chatBusy}
                    >
                      <Text style={styles.secondaryButtonText}>重试</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : (
              <View
                key={group.id}
                style={[
                  styles.chatMessageGroup,
                  group.role === 'user' ? styles.chatMessageGroupUser : styles.chatMessageGroupAssistant,
                ]}
              >
                <Text style={styles.selectionLabel}>{group.senderLabel}</Text>
                {group.messages.map((message, index) => (
                  <View
                    key={`${group.id}-${index}-${message.content}`}
                    style={[
                      styles.chatBubble,
                      group.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant,
                    ]}
                  >
                    {message.createdAt ? (
                      <View style={styles.chatBubbleMetaRow}>
                        <Text
                          style={[
                            styles.chatBubbleTimestamp,
                            group.role === 'user' ? styles.chatBubbleTimestampUser : null,
                          ]}
                        >
                          {describeChatMessageTimestamp(message.createdAt)}
                        </Text>
                      </View>
                    ) : null}
                    <Text
                      style={[
                        styles.chatBubbleCopy,
                        group.role === 'user' ? styles.chatBubbleCopyUser : null,
                      ]}
                    >
                      {decodeChatMessageContent(message.content)}
                    </Text>
                  </View>
                ))}
              </View>
            ),
          )
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{composerTitle}</Text>
        <TextInput
          placeholder={composerPlaceholder}
          placeholderTextColor="#7e8a83"
          style={[styles.input, styles.textArea]}
          value={chatDraft}
          onChangeText={onChangeDraft}
          multiline
          numberOfLines={4}
          editable={!waitingForSpaces && onlineDeviceAvailable && !chatBusy && hasActiveChatSession}
        />
        <View style={styles.inlineActions}>
          <Pressable
            style={[styles.primaryButtonSmall, !canSend ? styles.networkRowDisabled : null]}
            onPress={onSend}
            disabled={!canSend}
          >
            {chatBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>发送</Text>}
          </Pressable>
        </View>
      </View>
    </>
  );
}
