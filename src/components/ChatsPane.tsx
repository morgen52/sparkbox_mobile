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
