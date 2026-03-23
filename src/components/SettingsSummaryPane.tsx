import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { ViewedSpaceCard } from './ViewedSpaceCard';

type SettingsSummaryPaneProps = {
  styles: Record<string, any>;
  homeBusy: boolean;
  homeError: string;
  onlineDeviceAvailable: boolean;
  canManage: boolean;
  activeSpaceName: string;
  activeSpaceKindLabel: string;
  activeSpaceTemplateLabel: string;
  activeSpaceSummaryCopy: string;
  activeSpaceCountsCopy: string;
  canManageSharedSpace: boolean;
  settingsBusy: boolean;
  spaceMembersEditorBusy: boolean;
  accountDisplayName: string;
  accountRoleLabel: string;
  settingsNotice: string;
  settingsError: string;
  onOpenChats: () => void;
  onBeginNewDeviceOnboarding: () => void;
  onManageMembers: () => void;
  onInviteToSpace: () => void;
  onLogout: () => void;
};

export function SettingsSummaryPane({
  styles,
  homeBusy,
  homeError,
  onlineDeviceAvailable,
  canManage,
  activeSpaceName,
  activeSpaceKindLabel,
  activeSpaceTemplateLabel,
  activeSpaceSummaryCopy,
  activeSpaceCountsCopy,
  canManageSharedSpace,
  settingsBusy,
  spaceMembersEditorBusy,
  accountDisplayName,
  accountRoleLabel,
  settingsNotice,
  settingsError,
  onOpenChats,
  onBeginNewDeviceOnboarding,
  onManageMembers,
  onInviteToSpace,
  onLogout,
}: SettingsSummaryPaneProps) {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Household overview</Text>
        <Text style={styles.cardCopy}>
          {homeBusy
            ? 'Refreshing your household status...'
            : onlineDeviceAvailable
              ? 'Sparkbox is ready for household chat.'
              : 'Household history stays available even when Sparkbox is offline.'}
        </Text>
        {homeError ? <Text style={styles.errorText}>{homeError}</Text> : null}
        {homeBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
        <View style={styles.inlineActions}>
          <Pressable style={styles.primaryButtonSmall} onPress={onOpenChats}>
            <Text style={styles.primaryButtonText}>Open group chat</Text>
          </Pressable>
          {canManage ? (
            <Pressable style={styles.secondaryButtonSmall} onPress={onBeginNewDeviceOnboarding}>
              <Text style={styles.secondaryButtonText}>Set up another device</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <ViewedSpaceCard
        styles={styles}
        activeSpaceName={activeSpaceName}
        activeSpaceKindLabel={activeSpaceKindLabel}
        activeSpaceTemplateLabel={activeSpaceTemplateLabel}
        summaryCopy={activeSpaceSummaryCopy}
        countsCopy={activeSpaceCountsCopy}
        canManageSharedSpace={canManageSharedSpace}
        settingsBusy={settingsBusy}
        spaceMembersEditorBusy={spaceMembersEditorBusy}
        onManageMembers={onManageMembers}
        onInviteToSpace={onInviteToSpace}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your account</Text>
        <Text style={styles.cardCopy}>
          {accountDisplayName} · {accountRoleLabel} access
        </Text>
        {settingsNotice ? <Text style={styles.noticeText}>{settingsNotice}</Text> : null}
        {settingsError ? <Text style={styles.errorText}>{settingsError}</Text> : null}
        <View style={styles.inlineActions}>
          <Pressable style={styles.secondaryButtonSmall} onPress={onLogout}>
            <Text style={styles.secondaryButtonText}>Sign out</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
