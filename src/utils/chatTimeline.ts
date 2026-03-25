import { describeChatSendPhase, type ChatSendPhase } from '../spaceShell';
import type { HouseholdChatSessionMessage } from '../householdApi';

export type ChatTimelineMessage = HouseholdChatSessionMessage & {
  pending?: boolean;
  failed?: boolean;
  retryable?: boolean;
  retryContent?: string | null;
  errorMessage?: string | null;
};

export type ChatTimelineGroup =
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

function describeTimelineSenderLabel(message: ChatTimelineMessage, chatSendPhase: ChatSendPhase): string {
  if (message.pending) {
    return describeChatSendPhase(chatSendPhase) || 'Sparkbox';
  }
  if (message.role === 'user') {
    return message.senderDisplayName || '你';
  }
  return 'Sparkbox';
}

export function buildChatTimelineGroups(
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
            ? `Sparkbox 正在持续回复${chatPendingIndicator}`
            : `首次回复可能需要 1 到 5 分钟${chatPendingIndicator}`
          : message.errorMessage || '发送失败，请重试。',
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