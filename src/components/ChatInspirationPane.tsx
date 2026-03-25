import React from 'react';
import { Pressable, Text, View } from 'react-native';

type EnabledApp = {
  slug: string;
  title: string;
  meta?: {
    entryTitle?: string | null;
    entryCopy?: string | null;
    description?: string | null;
    starterPrompts?: string[];
  } | null;
};

type ReadyInstalledApp = {
  slug: string;
  title: string;
  entryTitle?: string | null;
  entryCopy?: string | null;
  description?: string | null;
};

type ReadyCatalogApp = {
  slug: string;
  title: string;
  description?: string | null;
};

type ChatInspirationPaneProps = {
  styles: Record<string, any>;
  activeSpaceName: string;
  activeSpaceTemplateLabel: string;
  canManage: boolean;
  settingsBusy: boolean;
  enabledApps: EnabledApp[];
  readyInstalledApps: ReadyInstalledApp[];
  readyCatalogApps: ReadyCatalogApp[];
  onOpenFamilyAppStarter: (slug: string, prompt: string) => void;
  onEnableFamilyApp: (slug: string) => void;
  onInstallFamilyApp: (slug: string) => void;
  onOpenAllFamilyApps: () => void;
};

export function ChatInspirationPane({
  styles,
  activeSpaceName,
  activeSpaceTemplateLabel,
  canManage,
  settingsBusy,
  enabledApps,
  readyInstalledApps,
  readyCatalogApps,
  onOpenFamilyAppStarter,
  onEnableFamilyApp,
  onInstallFamilyApp,
  onOpenAllFamilyApps,
}: ChatInspirationPaneProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{activeSpaceName} 的灵感建议</Text>
      <Text style={styles.cardCopy}>
        家庭应用能让 Sparkbox 更贴近日常场景。先在设备上安装，再按需在合适空间中启用。
      </Text>
      {enabledApps.length > 0 ? (
        <>
          <Text style={styles.selectionLabel}>已在这里协助</Text>
          {enabledApps.map((app) => (
            <View key={`chat-enabled-${app.slug}`} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{app.meta?.entryTitle || app.title}</Text>
                <Text style={styles.statusTagOnline}>已就绪</Text>
              </View>
              <Text style={styles.cardCopy}>
                {app.meta?.entryCopy || app.meta?.description || 'Sparkbox 已在此空间启用这个家庭应用。'}
              </Text>
              {app.meta?.starterPrompts?.length ? (
                <View style={styles.scopeRow}>
                  {app.meta.starterPrompts.map((prompt) => (
                    <Pressable
                      key={`chat-spotlight-${app.slug}-${prompt}`}
                      style={styles.scopePill}
                      onPress={() => onOpenFamilyAppStarter(app.slug, prompt)}
                    >
                      <Text style={styles.scopePillLabel}>{prompt}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </>
      ) : null}
      {canManage && readyInstalledApps.length > 0 ? (
        <>
          <Text style={styles.selectionLabel}>可在这里启用</Text>
          {readyInstalledApps.map((app) => (
            <View key={`chat-ready-${app.slug}`} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{app.entryTitle || app.title}</Text>
                <Text style={styles.tagMuted}>已安装到此设备</Text>
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
      {canManage && readyCatalogApps.length > 0 ? (
        <>
          <Text style={styles.selectionLabel}>推荐下一步添加</Text>
          {readyCatalogApps.map((app) => (
            <View key={`chat-catalog-${app.slug}`} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{app.title}</Text>
                <Text style={styles.tagMuted}>{activeSpaceTemplateLabel || '空间'}</Text>
              </View>
              {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
              <View style={styles.inlineActions}>
                <Pressable
                  style={styles.primaryButtonSmall}
                  onPress={() => onInstallFamilyApp(app.slug)}
                  disabled={settingsBusy}
                >
                  <Text style={styles.primaryButtonText}>安装到此设备</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      ) : null}
      <View style={styles.inlineActions}>
        <Pressable style={styles.secondaryButtonSmall} onPress={onOpenAllFamilyApps}>
          <Text style={styles.secondaryButtonText}>查看全部家庭应用</Text>
        </Pressable>
      </View>
    </View>
  );
}
