import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type ThreadRow = {
  id: string;
  title: string;
  badge: string;
  copy: string;
};

type EnabledFamilyApp = {
  slug: string;
  title: string;
  config: Record<string, unknown>;
  meta?: {
    entryTitle?: string | null;
    entryCopy?: string | null;
    description?: string | null;
    starterPrompts?: string[];
  } | null;
};

type ReadyInstalledFamilyApp = {
  slug: string;
  title: string;
  entryTitle?: string | null;
  entryCopy?: string | null;
  description?: string | null;
  riskLevel: string;
};

type ChatSpaceToolsPaneProps = {
  styles: Record<string, any>;
  waitingForSpaces: boolean;
  title: string;
  copy: string;
  relayNotice: string;
  threadRows: ThreadRow[];
  emptyThreadCopy: string;
  onOpenThread: (threadId: string) => void;
  showRelayHelper: boolean;
  canOpenRelay: boolean;
  onOpenRelay: () => void;
  privateSideChannelLabel: string;
  onOpenPrivateSideChannel: () => void;
  enabledFamilyApps: EnabledFamilyApp[];
  canManageActiveSpaceFamilyApps: boolean;
  settingsBusy: boolean;
  readyInstalledFamilyApps: ReadyInstalledFamilyApp[];
  describeFamilyAppRiskLevel: (riskLevel: string) => string;
  formatFamilyAppConfigSummary: (config: Record<string, unknown>) => string;
  onOpenFamilyAppStarter: (slug: string, prompt: string) => void;
  onDisableFamilyApp: (slug: string) => void;
  onEnableFamilyApp: (slug: string) => void;
};

export function ChatSpaceToolsPane({
  styles,
  waitingForSpaces,
  title,
  copy,
  relayNotice,
  threadRows,
  emptyThreadCopy,
  onOpenThread,
  showRelayHelper,
  canOpenRelay,
  onOpenRelay,
  privateSideChannelLabel,
  onOpenPrivateSideChannel,
  enabledFamilyApps,
  canManageActiveSpaceFamilyApps,
  settingsBusy,
  readyInstalledFamilyApps,
  describeFamilyAppRiskLevel,
  formatFamilyAppConfigSummary,
  onOpenFamilyAppStarter,
  onDisableFamilyApp,
  onEnableFamilyApp,
}: ChatSpaceToolsPaneProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardCopy}>{copy}</Text>
      {relayNotice ? <Text style={styles.noticeText}>{relayNotice}</Text> : null}
      {waitingForSpaces ? (
        <ActivityIndicator color="#0b6e4f" />
      ) : threadRows.length ? (
        threadRows.map((thread) => (
          <Pressable
            key={thread.id}
            style={styles.deviceRowCard}
            onPress={() => onOpenThread(thread.id)}
          >
            <View style={styles.deviceRowHeadline}>
              <Text style={styles.networkName}>{thread.title}</Text>
              <Text style={styles.tagMuted}>{thread.badge}</Text>
            </View>
            <Text style={styles.cardCopy}>{thread.copy}</Text>
          </Pressable>
        ))
      ) : (
        <Text style={styles.cardCopy}>{emptyThreadCopy}</Text>
      )}
      {showRelayHelper ? (
        <>
          <Text style={styles.cardCopy}>
            如果你不方便直接表达，Sparkbox 可以帮你把内容私下转达给本空间的一位成员。
          </Text>
          <View style={styles.inlineActions}>
            <Pressable
              style={[styles.primaryButtonSmall, !canOpenRelay ? styles.networkRowDisabled : null]}
              onPress={onOpenRelay}
              disabled={!canOpenRelay}
            >
              <Text style={styles.primaryButtonText}>让 Sparkbox 私下转达</Text>
            </Pressable>
          </View>
        </>
      ) : null}
      {privateSideChannelLabel ? (
        <View style={styles.deviceRowCard}>
          <View style={styles.deviceRowHeadline}>
            <Text style={styles.networkName}>{privateSideChannelLabel}</Text>
            <Text style={styles.tagMuted}>私密</Text>
          </View>
          <Text style={styles.cardCopy}>
            当你想先理清思路、再发回共享空间时，可以先在这个私密聊天里和 Sparkbox 沟通。
          </Text>
          <View style={styles.inlineActions}>
            <Pressable style={styles.primaryButtonSmall} onPress={onOpenPrivateSideChannel}>
              <Text style={styles.primaryButtonText}>与 Sparkbox 私聊</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {enabledFamilyApps.length ? (
        <>
          <Text style={styles.selectionLabel}>本空间已启用</Text>
          {enabledFamilyApps.map((app) => (
            <View key={app.slug} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{app.meta?.entryTitle || app.title}</Text>
                <Text style={styles.statusTagOnline}>已就绪</Text>
              </View>
              <Text style={styles.cardCopy}>
                {app.meta?.entryCopy || app.meta?.description || '这个家庭应用已在本空间就绪。'}
              </Text>
              {app.meta?.starterPrompts?.length ? (
                <View style={styles.scopeRow}>
                  {app.meta.starterPrompts.map((prompt) => (
                    <Pressable
                      key={`${app.slug}-${prompt}`}
                      style={styles.scopePill}
                      onPress={() => onOpenFamilyAppStarter(app.slug, prompt)}
                    >
                      <Text style={styles.scopePillLabel}>{prompt}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <Text style={styles.cardCopy}>{formatFamilyAppConfigSummary(app.config)}</Text>
              {canManageActiveSpaceFamilyApps ? (
                <View style={styles.inlineActions}>
                  <Pressable
                    style={styles.secondaryButtonSmall}
                    onPress={() => onDisableFamilyApp(app.slug)}
                    disabled={settingsBusy}
                  >
                    <Text style={styles.secondaryButtonText}>在此停用</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </>
      ) : null}
      {readyInstalledFamilyApps.length ? (
        <>
          <Text style={styles.selectionLabel}>可在本空间启用</Text>
          {readyInstalledFamilyApps.map((app) => (
            <View key={`ready-${app.slug}`} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{app.entryTitle || app.title}</Text>
                <Text style={styles.tagMuted}>{describeFamilyAppRiskLevel(app.riskLevel)}</Text>
              </View>
              <Text style={styles.cardCopy}>{app.entryCopy || app.description}</Text>
              <View style={styles.inlineActions}>
                <Pressable
                  style={styles.primaryButtonSmall}
                  onPress={() => onEnableFamilyApp(app.slug)}
                  disabled={settingsBusy}
                >
                  <Text style={styles.primaryButtonText}>在此空间启用</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}
