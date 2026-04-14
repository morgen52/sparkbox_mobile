import React from 'react';
import { ActivityIndicator, Alert, type LayoutChangeEvent, Modal, ScrollView, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { AnimatedPressable as Pressable } from './AnimatedPressable';
import { decodeChatMessageContent, describeChatMessageTimestamp } from '../appShell';
import { MarkdownRenderer } from './MarkdownRenderer';

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
  chatAttachmentItems: Array<{ index: number; name: string; path: string }>;
  attachmentPickerOpen: boolean;
  attachmentPickerPath: string;
  attachmentPickerBusy: boolean;
  attachmentPickerError: string;
  attachmentPickerEntries: Array<{ path: string; name: string; isDir: boolean; selected: boolean }>;
  saveDocModalOpen: boolean;
  saveDocTitle: string;
  saveDocItems: Array<{ id: string; checked: boolean; sender: string; role: string; content: string }>;
  canSend: boolean;
  onBack: () => void;
  onEdit: () => void;
  onClear: () => void;
  onDelete: () => void;
  onRetry: (content?: string) => void;
  onChangeDraft: (value: string) => void;
  onOpenAttachmentPicker: () => void;
  onCloseAttachmentPicker: () => void;
  onAttachmentPickerOpenPath: (path: string) => void;
  onAttachmentPickerToggleFile: (path: string, name: string) => void;
  onRemoveAttachment: (index: number) => void;
  onOpenSaveDocModal: () => void;
  onCloseSaveDocModal: () => void;
  onChangeSaveDocTitle: (value: string) => void;
  onToggleSaveDocItem: (id: string) => void;
  onConfirmSaveDoc: () => void;
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
  chatAttachmentItems,
  attachmentPickerOpen,
  attachmentPickerPath,
  attachmentPickerBusy,
  attachmentPickerError,
  attachmentPickerEntries,
  saveDocModalOpen,
  saveDocTitle,
  saveDocItems,
  canSend,
  onBack,
  onEdit,
  onClear,
  onDelete,
  onRetry,
  onChangeDraft,
  onOpenAttachmentPicker,
  onCloseAttachmentPicker,
  onAttachmentPickerOpenPath,
  onAttachmentPickerToggleFile,
  onRemoveAttachment,
  onOpenSaveDocModal,
  onCloseSaveDocModal,
  onChangeSaveDocTitle,
  onToggleSaveDocItem,
  onConfirmSaveDoc,
  onSend,
}: ChatDetailPaneProps) {
  const { height: windowHeight } = useWindowDimensions();
  const timelineMaxHeight = Math.max(240, Math.min(560, Math.floor(windowHeight * 0.52)));
  const [markdownEnabled, setMarkdownEnabled] = React.useState(true);
  const [debugBlocks, setDebugBlocks] = React.useState(false);
  const [layoutInfo, setLayoutInfo] = React.useState<Record<string, { w: number; h: number }>>({});
  return (
    <>
      <View style={styles.card}>
        <View style={styles.chatDetailHeader}>
          <View style={styles.chatDetailHeaderTopRow}>
            <Pressable
              style={[
                styles.secondaryButtonSmall,
                styles.chatDetailGhostButton,
                !hasActiveChatSession ? styles.networkRowDisabled : null,
              ]}
              onPress={onBack}
              disabled={!hasActiveChatSession}
            >
              <Text style={styles.secondaryButtonText}>返回聊天列表</Text>
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Pressable onPress={() => setDebugBlocks((d) => !d)}>
                <Text style={{ fontSize: 11, color: debugBlocks ? '#e63946' : '#7e8a83' }}>
                  {markdownEnabled ? (debugBlocks ? 'DBG' : 'MD') : 'TXT'}
                </Text>
              </Pressable>
              <Switch
                value={markdownEnabled}
                onValueChange={setMarkdownEnabled}
                trackColor={{ false: '#ccc', true: '#0b6e4f' }}
                thumbColor="#fff"
                style={{ transform: [{ scale: 0.7 }] }}
              />
            </View>
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
            <Pressable style={[styles.secondaryButtonSmall, styles.chatDetailGhostButton]} onPress={onEdit}>
              <Text style={styles.secondaryButtonText}>编辑设置</Text>
            </Pressable>
            <Pressable style={[styles.secondaryButtonSmall, styles.chatDetailGhostButton]} onPress={onClear} disabled={chatBusy}>
              <Text style={styles.secondaryButtonText}>清空消息</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryButtonSmall, styles.chatDetailGhostButton]}
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
          <ScrollView
            style={[styles.chatTimelineViewport, { maxHeight: timelineMaxHeight }]}
            contentContainerStyle={styles.chatTimelineViewportContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            removeClippedSubviews={false}
          >
            {chatTimelineGroups.map((group) =>
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
                <View style={{ marginTop: 6 }}>
                  {markdownEnabled ? (
                    <MarkdownRenderer
                      markdown={decodeChatMessageContent(group.message.content)}
                      styles={styles}
                      tone="chatAssistant"
                      debug={debugBlocks}
                    />
                  ) : (
                    <Text style={[styles.cardCopy, { color: '#1f2d2a' }]} selectable>{decodeChatMessageContent(group.message.content)}</Text>
                  )}
                </View>
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
                {group.messages.map((message, index) => {
                  const bubbleKey = `${group.id}-${index}`;
                  const decoded = decodeChatMessageContent(message.content);
                  const info = layoutInfo[bubbleKey];
                  return (
                  <View
                    key={`${group.id}-${index}-${message.content}`}
                    style={[
                      styles.chatBubble,
                      group.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant,
                      debugBlocks ? { borderWidth: 2, borderColor: '#e63946', borderStyle: 'dashed' } : null,
                    ]}
                    onLayout={debugBlocks ? (e: LayoutChangeEvent) => {
                      const w = Math.round(e.nativeEvent.layout.width);
                      const h = Math.round(e.nativeEvent.layout.height);
                      setLayoutInfo((prev) => ({ ...prev, [bubbleKey]: { w, h } }));
                    } : undefined}
                  >
                    {debugBlocks ? (
                      <View style={{ backgroundColor: '#000', padding: 4 }}>
                        <Text style={{ fontSize: 9, color: '#0f0', fontFamily: 'monospace' }}>
                          BUBBLE[{index}] layout={info ? `${info.w}x${info.h}` : '...'}
                        </Text>
                      </View>
                    ) : null}
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
                    <View style={message.createdAt ? { marginTop: 8 } : undefined}>
                      {markdownEnabled ? (
                        <MarkdownRenderer
                          markdown={decoded}
                          styles={styles}
                          tone={group.role === 'user' ? 'chatUser' : 'chatAssistant'}
                          debug={debugBlocks}
                        />
                      ) : (
                        <Text
                          style={[styles.cardCopy, { color: group.role === 'user' ? '#ffffff' : '#1f2d2a' }]}
                          selectable
                        >{decoded}</Text>
                      )}
                    </View>
                  </View>
                  );
                })}
                </View>
              ),
            )}
          </ScrollView>
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

        {chatAttachmentItems.length ? (
          <View style={styles.chatAttachmentBadgeRow}>
            {chatAttachmentItems.map((item) => (
              <View key={`chat-attachment-${item.index}-${item.path}`} style={styles.chatAttachmentBadge}>
                <Text style={styles.chatAttachmentBadgeText}>[{item.index}] {item.name}</Text>
                <Pressable onPress={() => onRemoveAttachment(item.index)}>
                  <Text style={styles.chatAttachmentBadgeRemove}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.inlineActions}>
          <Pressable
            style={[styles.secondaryButtonSmall, !hasActiveChatSession ? styles.networkRowDisabled : null]}
            onPress={onOpenAttachmentPicker}
            disabled={!hasActiveChatSession || chatBusy}
          >
            <Text style={styles.secondaryButtonText}>＋ 文件</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryButtonSmall, !hasMessages ? styles.networkRowDisabled : null]}
            onPress={onOpenSaveDocModal}
            disabled={!hasMessages || chatBusy}
          >
            <Text style={styles.secondaryButtonText}>保存为文档</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButtonSmall, !canSend ? styles.networkRowDisabled : null]}
            onPress={onSend}
            disabled={!canSend}
          >
            {chatBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>发送</Text>}
          </Pressable>
        </View>
      </View>

      <Modal visible={attachmentPickerOpen} transparent animationType="slide" onRequestClose={onCloseAttachmentPicker}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>选择原始文件</Text>
            <Text style={styles.cardCopy}>当前路径：raw/{attachmentPickerPath || ''}</Text>
            {attachmentPickerBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
            {attachmentPickerError ? <Text style={styles.errorText}>{attachmentPickerError}</Text> : null}
            <ScrollView style={styles.chatAttachmentPickerList}>
              {attachmentPickerEntries.map((entry) => (
                <Pressable
                  key={`attachment-entry-${entry.path}`}
                  style={styles.chatAttachmentPickerItem}
                  onPress={() => {
                    if (entry.isDir) {
                      onAttachmentPickerOpenPath(entry.path);
                    } else {
                      onAttachmentPickerToggleFile(entry.path, entry.name);
                    }
                  }}
                >
                  <Text style={styles.chatAttachmentPickerItemTitle}>
                    {entry.isDir ? 'DIR' : entry.selected ? '✔' : 'FILE'} · {entry.name}
                  </Text>
                  <Text style={styles.chatAttachmentPickerItemCopy}>{entry.path}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.inlineActions}>
              <Pressable style={styles.secondaryButtonSmall} onPress={() => onAttachmentPickerOpenPath('')}>
                <Text style={styles.secondaryButtonText}>回到根目录</Text>
              </Pressable>
              <Pressable style={styles.primaryButtonSmall} onPress={onCloseAttachmentPicker}>
                <Text style={styles.primaryButtonText}>完成</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={saveDocModalOpen} transparent animationType="slide" onRequestClose={onCloseSaveDocModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>保存聊天为文档</Text>
            <TextInput
              placeholder="文档标题"
              placeholderTextColor="#7e8a83"
              style={styles.input}
              value={saveDocTitle}
              onChangeText={onChangeSaveDocTitle}
            />
            <ScrollView style={styles.chatAttachmentPickerList}>
              {saveDocItems.map((item) => (
                <Pressable
                  key={`save-doc-item-${item.id}`}
                  style={styles.chatAttachmentPickerItem}
                  onPress={() => onToggleSaveDocItem(item.id)}
                >
                  <Text style={styles.chatAttachmentPickerItemTitle}>
                    {item.checked ? '✔' : '○'} {item.sender || '-'} ({item.role})
                  </Text>
                  <Text style={styles.chatAttachmentPickerItemCopy} numberOfLines={3}>{decodeChatMessageContent(item.content)}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.inlineActions}>
              <Pressable style={styles.secondaryButtonSmall} onPress={onCloseSaveDocModal}>
                <Text style={styles.secondaryButtonText}>取消</Text>
              </Pressable>
              <Pressable style={styles.primaryButtonSmall} onPress={onConfirmSaveDoc}>
                <Text style={styles.primaryButtonText}>保存到 raw</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
