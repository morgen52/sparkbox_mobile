import {
  buildChatScopeResetState,
  describeChatSessionCreatePermissionError,
  describeChatSessionOpenError,
  type ChatSendPhase,
} from '../spaceShell';
import {
  clearChatSessionMessages,
  createHouseholdChatSession,
  deleteHouseholdChatSession,
  getHouseholdChatSession,
  getHouseholdSpaceDetail,
  openSpaceSideChannel,
  openSpaceThreadSession,
  streamHouseholdChatSessionMessage,
  type ChatSessionScope,
  type HouseholdChatSessionDetail,
  type HouseholdChatSessionSummary,
  type HouseholdSpaceDetail,
  updateHouseholdChatSession,
} from '../householdApi';
import type { Session } from '../authFlow';
import type { Dispatch, SetStateAction } from 'react';
import type { ChatTimelineMessage } from '../utils/chatTimeline';
import { shouldAppendAssistantReply } from '../spaceShell';
import { CHAT_PENDING_FALLBACK } from '../constants/appRuntimeConstants';

type RefreshHouseholdSummary = (options?: { silent?: boolean }) => Promise<void>;

type UseChatControllerOptions = {
  session: Session | null;
  activeSpaceId: string;
  activeSpaceDetail: HouseholdSpaceDetail | null;
  activeChatSpaceId?: string;
  chatScope: ChatSessionScope;
  fetchChatSessions: (
    scope: ChatSessionScope,
    spaceId: string,
    options?: { force?: boolean },
  ) => Promise<HouseholdChatSessionSummary[]>;
  readFreshChatSessionCache: (scope: ChatSessionScope, spaceId: string) => { fetchedAt: number } | null;
  clearChatSessionCache: (scope?: ChatSessionScope, spaceId?: string) => void;
  refreshHouseholdSummary: RefreshHouseholdSummary;
  setChatScope: Dispatch<SetStateAction<ChatSessionScope>>;
  setChatSessions: Dispatch<SetStateAction<HouseholdChatSessionSummary[]>>;
  setActiveChatSessionId: Dispatch<SetStateAction<string>>;
  setActiveChatSession: Dispatch<SetStateAction<HouseholdChatSessionDetail | null>>;
  setChatDraft: Dispatch<SetStateAction<string>>;
  setChatError: Dispatch<SetStateAction<string>>;
  setChatBusy: Dispatch<SetStateAction<boolean>>;
  setChatListRefreshBusy: Dispatch<SetStateAction<boolean>>;
  setChatListSyncSource: Dispatch<SetStateAction<'idle' | 'cache' | 'network'>>;
  setChatListLastSyncedAt: Dispatch<SetStateAction<number>>;
  setSpaceSessionCounts: Dispatch<SetStateAction<Record<string, number>>>;
  setChatSendPhase: Dispatch<SetStateAction<ChatSendPhase>>;
  setChatPendingMessage: Dispatch<SetStateAction<ChatTimelineMessage | null>>;
  setChatPendingNoteIndex: Dispatch<SetStateAction<number>>;
  setActiveSpaceDetail: Dispatch<SetStateAction<HouseholdSpaceDetail | null>>;
  setChatSessionEditorOpen: Dispatch<SetStateAction<boolean>>;
  setEditingChatSession: Dispatch<SetStateAction<HouseholdChatSessionSummary | null>>;
  setChatSessionName: Dispatch<SetStateAction<string>>;
  setChatSessionSystemPrompt: Dispatch<SetStateAction<string>>;
  setChatSessionTemperature: Dispatch<SetStateAction<string>>;
  setChatSessionMaxTokens: Dispatch<SetStateAction<string>>;
};

export function useChatController(options: UseChatControllerOptions) {
  const {
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
  } = options;

  async function refreshChatSessions(refreshOptions?: { force?: boolean }): Promise<void> {
    if (!session?.token) {
      return;
    }
    setChatBusy(true);
    setChatListRefreshBusy(true);
    setChatError('');
    try {
      const sessions = await fetchChatSessions(chatScope, activeChatSpaceId || '', {
        force: refreshOptions?.force === true,
      });
      const cachedEntry = readFreshChatSessionCache(chatScope, activeChatSpaceId || '');
      setChatListSyncSource(refreshOptions?.force ? 'network' : cachedEntry ? 'cache' : 'network');
      setChatListLastSyncedAt(cachedEntry?.fetchedAt ?? Date.now());
      setChatSessions(sessions);
      if (activeChatSpaceId) {
        setSpaceSessionCounts((current) => ({
          ...current,
          [activeChatSpaceId]: sessions.length,
        }));
      }
      setActiveChatSessionId((current) => {
        if (current && sessions.some((item) => item.id === current)) {
          return current;
        }
        return '';
      });
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Could not load chat sessions.');
    } finally {
      setChatBusy(false);
      setChatListRefreshBusy(false);
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
      const sessions = await fetchChatSessions('private', activeSpaceId, {
        force: true,
      });
      setChatSessions(sessions);
      setSpaceSessionCounts((current) => ({
        ...current,
        [activeSpaceId]: sessions.length,
      }));
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Could not open the private chat right now.');
    } finally {
      setChatBusy(false);
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
        fetchChatSessions(opened.scope, activeSpaceId, { force: true }),
        getHouseholdChatSession(session.token, opened.id),
        getHouseholdSpaceDetail(session.token, activeSpaceId),
      ]);
      setChatSessions(sessions);
      setSpaceSessionCounts((current) => ({
        ...current,
        [activeSpaceId]: sessions.length,
      }));
      setActiveChatSession(detail);
      setActiveSpaceDetail(refreshedSpace);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : describeChatSessionOpenError(activeSpaceDetail));
    } finally {
      setChatBusy(false);
    }
  }

  async function clearCurrentChatSession(activeChatSessionId: string): Promise<void> {
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

  async function deleteCurrentChatSession(activeChatSessionId: string): Promise<void> {
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
      clearChatSessionCache(chatScope, activeChatSpaceId);
      await refreshChatSessions({ force: true });
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Could not delete this chat.');
    } finally {
      setChatBusy(false);
    }
  }

  function openChatSessionEditor(
    sessionItem: HouseholdChatSessionSummary | undefined,
    canCreateActiveChat: boolean,
  ): void {
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

  async function submitChatSessionEditor(input: {
    editingChatSession: HouseholdChatSessionSummary | null;
    chatSessionName: string;
    chatSessionSystemPrompt: string;
    chatSessionTemperature: string;
    chatSessionMaxTokens: string;
  }): Promise<void> {
    if (!session?.token) {
      return;
    }
    const trimmedName = input.chatSessionName.trim();
    if (!trimmedName) {
      setChatError('Give this chat a name first.');
      return;
    }
    setChatBusy(true);
    setChatError('');
    try {
      const temperature = Number(input.chatSessionTemperature || '0.7');
      const maxTokens = Number(input.chatSessionMaxTokens || '2048');
      if (input.editingChatSession) {
        const updated = await updateHouseholdChatSession(session.token, input.editingChatSession.id, {
          name: trimmedName,
          systemPrompt: input.chatSessionSystemPrompt,
          temperature,
          maxTokens,
          lastKnownUpdatedAt: input.editingChatSession.updatedAt,
        });
        setActiveChatSessionId(updated.id);
      } else {
        const created = await createHouseholdChatSession(session.token, {
          name: trimmedName,
          scope: chatScope,
          spaceId: activeChatSpaceId,
          systemPrompt: input.chatSessionSystemPrompt,
          temperature,
          maxTokens,
        });
        setActiveChatSessionId(created.id);
      }
      setChatSessionEditorOpen(false);
      clearChatSessionCache(chatScope, activeChatSpaceId);
      await refreshChatSessions({ force: true });
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Could not save this chat.');
    } finally {
      setChatBusy(false);
    }
  }

  async function submitChatMessage(input: {
    activeChatSessionId: string;
    chatDraft: string;
    activeChatSession: HouseholdChatSessionDetail | null;
    overrideContent?: string;
  }): Promise<void> {
    if (!session?.token || !input.activeChatSessionId) {
      return;
    }
    const content = (input.overrideContent ?? input.chatDraft).trim();
    if (!content) {
      return;
    }
    if (!input.overrideContent) {
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
    if (input.activeChatSession) {
      setActiveChatSession({
        ...input.activeChatSession,
        messages: [
          ...input.activeChatSession.messages,
          { role: 'user', content, senderDisplayName: session.user.display_name },
        ],
      });
    }
    let keepPendingBubble = false;
    try {
      let streamedMessage = '';
      const response = await streamHouseholdChatSessionMessage(session.token, input.activeChatSessionId, content, {
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
        const detail = await getHouseholdChatSession(session.token, input.activeChatSessionId);
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
            item.id === input.activeChatSessionId
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

  return {
    refreshChatSessions,
    handleChatScopeChange,
    openCurrentSpaceSideChannel,
    openSpaceThread,
    clearCurrentChatSession,
    deleteCurrentChatSession,
    openChatSessionEditor,
    submitChatSessionEditor,
    submitChatMessage,
  };
}
