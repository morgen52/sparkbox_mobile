import React from 'react';
import { Pressable, Text, View } from 'react-native';
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
  const [toolsExpanded, setToolsExpanded] = React.useState(false);
  const [inspirationExpanded, setInspirationExpanded] = React.useState(false);

  // This is the page-level switch for Chats. The detailed fetching and
  // permission rules live above in App; this component only decides whether the
  // user is looking at the inbox stack or one opened conversation.
  return (
    <>
      {!activeChatSessionId ? (
        <View style={styles.chatExplorerRail}>
          <ChatInboxPane {...({ styles, ...inboxProps } as any)} />
          <View style={styles.chatTreeFolder}>
            <Pressable style={styles.chatTreeFolderHeader} onPress={() => setToolsExpanded((current) => !current)}>
              <View style={styles.chatTreeFolderHeaderBody}>
                <Text style={styles.chatTreeFolderTitle}>{toolsProps.title || '空间工具'}</Text>
                <Text style={styles.chatTreeFolderMeta}>{toolsProps.copy || '展开后可查看线程和协作工具'}</Text>
              </View>
              <Text style={styles.chatTreeFolderChevron}>{toolsExpanded ? '∧' : '∨'}</Text>
            </Pressable>
            {toolsExpanded ? (
              <View style={styles.chatTreeFolderBody}>
                <ChatSpaceToolsPane {...({ styles, ...toolsProps, embedded: true } as any)} />
              </View>
            ) : null}
          </View>

          {inspirationProps ? (
            <View style={styles.chatTreeFolder}>
              <Pressable
                style={styles.chatTreeFolderHeader}
                onPress={() => setInspirationExpanded((current) => !current)}
              >
                <View style={styles.chatTreeFolderHeaderBody}>
                  <Text style={styles.chatTreeFolderTitle}>灵感与家庭应用</Text>
                  <Text style={styles.chatTreeFolderMeta}>展开后可直接启用、安装并快速发起聊天</Text>
                </View>
                <Text style={styles.chatTreeFolderChevron}>{inspirationExpanded ? '∧' : '∨'}</Text>
              </Pressable>
              {inspirationExpanded ? (
                <View style={styles.chatTreeFolderBody}>
                  <ChatInspirationPane {...({ styles, ...inspirationProps, embedded: true } as any)} />
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {activeChatSessionId ? <ChatDetailPane {...({ styles, ...detailProps } as any)} /> : null}
    </>
  );
}
