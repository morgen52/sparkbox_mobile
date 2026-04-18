import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useT } from '../i18n';

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
  embedded?: boolean;
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
  embedded = false,
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
  const t = useT();
  return (
    <View style={embedded ? styles.chatTreeEmbeddedPanel : styles.card}>
      <Text style={styles.cardTitle}>{t('inspiration.title', { name: activeSpaceName })}</Text>
      <Text style={styles.cardCopy}>
        {t('inspiration.copy')}
      </Text>
      {enabledApps.length > 0 ? (
        <>
          <Text style={styles.selectionLabel}>{t('inspiration.enabledLabel')}</Text>
          {enabledApps.map((app) => (
            <View key={`chat-enabled-${app.slug}`} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{app.meta?.entryTitle || app.title}</Text>
                <Text style={styles.statusTagOnline}>{t('inspiration.ready')}</Text>
              </View>
              <Text style={styles.cardCopy}>
                {app.meta?.entryCopy || app.meta?.description || t('inspiration.enabledFallback')}
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
          <Text style={styles.selectionLabel}>{t('inspiration.canEnableLabel')}</Text>
          {readyInstalledApps.map((app) => (
            <View key={`chat-ready-${app.slug}`} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{app.entryTitle || app.title}</Text>
                <Text style={styles.tagMuted}>{t('inspiration.installedTag')}</Text>
              </View>
              <Text style={styles.cardCopy}>{app.entryCopy || app.description}</Text>
              <View style={styles.inlineActions}>
                <Pressable
                  style={styles.primaryButtonSmall}
                  onPress={() => onEnableFamilyApp(app.slug)}
                  disabled={settingsBusy}
                >
                  <Text style={styles.primaryButtonText}>{t('inspiration.enableHere')}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      ) : null}
      {canManage && readyCatalogApps.length > 0 ? (
        <>
          <Text style={styles.selectionLabel}>{t('inspiration.recommendLabel')}</Text>
          {readyCatalogApps.map((app) => (
            <View key={`chat-catalog-${app.slug}`} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{app.title}</Text>
                <Text style={styles.tagMuted}>{activeSpaceTemplateLabel || t('inspiration.spaceFallback')}</Text>
              </View>
              {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
              <View style={styles.inlineActions}>
                <Pressable
                  style={styles.primaryButtonSmall}
                  onPress={() => onInstallFamilyApp(app.slug)}
                  disabled={settingsBusy}
                >
                  <Text style={styles.primaryButtonText}>{t('inspiration.installToDevice')}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      ) : null}
      <View style={styles.inlineActions}>
        <Pressable style={styles.secondaryButtonSmall} onPress={onOpenAllFamilyApps}>
          <Text style={styles.secondaryButtonText}>{t('inspiration.viewAll')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
