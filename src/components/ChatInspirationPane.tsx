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
      <Text style={styles.cardTitle}>Inspiration for {activeSpaceName}</Text>
      <Text style={styles.cardCopy}>
        Family apps help Sparkbox feel more useful in everyday life. Install them once on this device, then turn them on only in the spaces where they fit.
      </Text>
      {enabledApps.length > 0 ? (
        <>
          <Text style={styles.selectionLabel}>Already helping here</Text>
          {enabledApps.map((app) => (
            <View key={`chat-enabled-${app.slug}`} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{app.meta?.entryTitle || app.title}</Text>
                <Text style={styles.statusTagOnline}>Ready here</Text>
              </View>
              <Text style={styles.cardCopy}>
                {app.meta?.entryCopy || app.meta?.description || 'Sparkbox is already using this family app in this space.'}
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
          <Text style={styles.selectionLabel}>Ready to turn on here</Text>
          {readyInstalledApps.map((app) => (
            <View key={`chat-ready-${app.slug}`} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{app.entryTitle || app.title}</Text>
                <Text style={styles.tagMuted}>On this device</Text>
              </View>
              <Text style={styles.cardCopy}>{app.entryCopy || app.description}</Text>
              <View style={styles.inlineActions}>
                <Pressable
                  style={styles.primaryButtonSmall}
                  onPress={() => onEnableFamilyApp(app.slug)}
                  disabled={settingsBusy}
                >
                  <Text style={styles.primaryButtonText}>Turn on in this space</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      ) : null}
      {canManage && readyCatalogApps.length > 0 ? (
        <>
          <Text style={styles.selectionLabel}>Worth adding next</Text>
          {readyCatalogApps.map((app) => (
            <View key={`chat-catalog-${app.slug}`} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{app.title}</Text>
                <Text style={styles.tagMuted}>{activeSpaceTemplateLabel || 'space'}</Text>
              </View>
              {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
              <View style={styles.inlineActions}>
                <Pressable
                  style={styles.primaryButtonSmall}
                  onPress={() => onInstallFamilyApp(app.slug)}
                  disabled={settingsBusy}
                >
                  <Text style={styles.primaryButtonText}>Install on this device</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      ) : null}
      <View style={styles.inlineActions}>
        <Pressable style={styles.secondaryButtonSmall} onPress={onOpenAllFamilyApps}>
          <Text style={styles.secondaryButtonText}>Open all family apps</Text>
        </Pressable>
      </View>
    </View>
  );
}
