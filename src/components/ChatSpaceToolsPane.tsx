import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useT } from '../i18n';

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
  embedded?: boolean;
  title?: string;
  copy?: string;
  relayNotice: string;
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
  embedded = false,
  title,
  copy,
  relayNotice,
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
  const t = useT();
  return (
    <View style={embedded ? styles.chatTreeEmbeddedPanel : styles.card}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {copy ? <Text style={styles.cardCopy}>{copy}</Text> : null}
      {relayNotice ? <Text style={styles.noticeText}>{relayNotice}</Text> : null}
      {showRelayHelper ? (
        <>
          <Text style={styles.cardCopy}>
            {t('spaceTools.relayCopy')}
          </Text>
          <View style={styles.inlineActions}>
            <Pressable
              style={[styles.primaryButtonSmall, !canOpenRelay ? styles.networkRowDisabled : null]}
              onPress={onOpenRelay}
              disabled={!canOpenRelay}
            >
              <Text style={styles.primaryButtonText}>{t('spaceTools.relayButton')}</Text>
            </Pressable>
          </View>
        </>
      ) : null}
      {privateSideChannelLabel ? (
        <View style={styles.deviceRowCard}>
          <View style={styles.deviceRowHeadline}>
            <Text style={styles.networkName}>{privateSideChannelLabel}</Text>
            <Text style={styles.tagMuted}>{t('spaceTools.privateTag')}</Text>
          </View>
          <Text style={styles.cardCopy}>
            {t('spaceTools.privateCopy')}
          </Text>
          <View style={styles.inlineActions}>
            <Pressable style={styles.primaryButtonSmall} onPress={onOpenPrivateSideChannel}>
              <Text style={styles.primaryButtonText}>{t('spaceTools.privateChat')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {enabledFamilyApps.length ? (
        <>
          <Text style={styles.selectionLabel}>{t('spaceTools.enabledLabel')}</Text>
          {enabledFamilyApps.map((app) => (
            <View key={app.slug} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{app.meta?.entryTitle || app.title}</Text>
                <Text style={styles.statusTagOnline}>{t('spaceTools.appReady')}</Text>
              </View>
              <Text style={styles.cardCopy}>
                {app.meta?.entryCopy || app.meta?.description || t('spaceTools.enabledFallback')}
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
                    <Text style={styles.secondaryButtonText}>{t('spaceTools.disableHere')}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </>
      ) : null}
      {readyInstalledFamilyApps.length ? (
        <>
          <Text style={styles.selectionLabel}>{t('spaceTools.canEnableLabel')}</Text>
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
                  <Text style={styles.primaryButtonText}>{t('spaceTools.enableHere')}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}
