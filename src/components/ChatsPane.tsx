import React from 'react';
import { ChatDetailPane } from './ChatDetailPane';
import { ChatInboxPane } from './ChatInboxPane';

type ChatsPaneProps = {
  styles: Record<string, any>;
  activeChatSessionId: string | null;
  inboxProps: Record<string, any>;
  toolsProps: Record<string, any>;
  detailProps: Record<string, any>;
};

export function ChatsPane({
  styles,
  activeChatSessionId,
  inboxProps,
  toolsProps,
  detailProps,
}: ChatsPaneProps) {
  // This is the page-level switch for Chats. The detailed fetching and
  // permission rules live above in App; this component only decides whether the
  // user is looking at the inbox stack or one opened conversation.
  return (
    <>
      {!activeChatSessionId ? (
        <ChatInboxPane {...({ styles, ...inboxProps, toolsProps } as any)} />
      ) : null}

      {activeChatSessionId ? <ChatDetailPane {...({ styles, ...detailProps } as any)} /> : null}
    </>
  );
}
