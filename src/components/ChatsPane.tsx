import React from 'react';
import { ChatDetailPane } from './ChatDetailPane';
import { ChatInboxPane } from './ChatInboxPane';
import { ChatInspirationPane } from './ChatInspirationPane';
import { ChatSpaceToolsPane } from './ChatSpaceToolsPane';

type ChatsPaneProps = {
  styles: Record<string, any>;
  activeChatSessionId: string | null;
  inboxProps: Record<string, any>;
  toolsProps: Record<string, any>;
  inspirationProps: Record<string, any> | null;
  detailProps: Record<string, any>;
};

export function ChatsPane({
  styles,
  activeChatSessionId,
  inboxProps,
  toolsProps,
  inspirationProps,
  detailProps,
}: ChatsPaneProps) {
  // This is the page-level switch for Chats. The detailed fetching and
  // permission rules live above in App; this component only decides whether the
  // user is looking at the inbox stack or one opened conversation.
  return (
    <>
      {!activeChatSessionId ? (
        <>
          <ChatInboxPane {...({ styles, ...inboxProps } as any)} />
          <ChatSpaceToolsPane {...({ styles, ...toolsProps } as any)} />
          {inspirationProps ? <ChatInspirationPane {...({ styles, ...inspirationProps } as any)} /> : null}
        </>
      ) : null}

      {activeChatSessionId ? <ChatDetailPane {...({ styles, ...detailProps } as any)} /> : null}
    </>
  );
}
