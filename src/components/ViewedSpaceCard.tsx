import React from 'react';
import { Pressable, Text, View } from 'react-native';

type ViewedSpaceCardProps = {
  styles: Record<string, any>;
  activeSpaceName: string;
  activeSpaceKindLabel: string;
  activeSpaceTemplateLabel: string;
  summaryCopy: string;
  countsCopy: string;
  canManageSharedSpace: boolean;
  settingsBusy: boolean;
  spaceMembersEditorBusy: boolean;
  onManageMembers: () => void;
  onInviteToSpace: () => void;
};

export function ViewedSpaceCard({
  styles,
  activeSpaceName,
  activeSpaceKindLabel,
  activeSpaceTemplateLabel,
  summaryCopy,
  countsCopy,
  canManageSharedSpace,
  settingsBusy,
  spaceMembersEditorBusy,
  onManageMembers,
  onInviteToSpace,
}: ViewedSpaceCardProps) {
  return (
    <View style={styles.settingsCard}>
      <Text style={styles.cardTitle}>Space you're viewing</Text>
      <Text style={styles.cardCopy}>
        {activeSpaceName
          ? summaryCopy
          : 'Pick a space in Chats so Library and Settings stay on that same space.'}
      </Text>
      {activeSpaceName ? (
        <View style={styles.deviceRowCard}>
          <View style={styles.deviceRowHeadline}>
            <Text style={styles.networkName}>{activeSpaceName}</Text>
            <Text style={styles.tagMuted}>{activeSpaceKindLabel}</Text>
          </View>
          <Text style={styles.cardCopy}>{activeSpaceTemplateLabel || 'Shared home'}</Text>
          <Text style={styles.cardCopy}>{countsCopy}</Text>
        </View>
      ) : null}
      {canManageSharedSpace ? (
        <>
          <Text style={styles.cardCopy}>
            Adjust who belongs in this space here. You stay in this space automatically.
          </Text>
          <View style={styles.inlineActions}>
            <Pressable
              style={styles.secondaryButtonSmall}
              onPress={onManageMembers}
              disabled={spaceMembersEditorBusy}
            >
              <Text style={styles.secondaryButtonText}>Manage members</Text>
            </Pressable>
            <Pressable style={styles.secondaryButtonSmall} onPress={onInviteToSpace} disabled={settingsBusy}>
              <Text style={styles.secondaryButtonText}>Invite to this space</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}
