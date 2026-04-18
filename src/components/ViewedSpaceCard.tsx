import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useT } from '../i18n';

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
  const t = useT();
  return (
    <View style={styles.settingsCard}>
      <Text style={styles.cardTitle}>{t('viewedSpace.title')}</Text>
      <Text style={styles.cardCopy}>
        {activeSpaceName
          ? summaryCopy
          : t('viewedSpace.noSpaceCopy')}
      </Text>
      {activeSpaceName ? (
        <View style={styles.deviceRowCard}>
          <View style={styles.deviceRowHeadline}>
            <Text style={styles.networkName}>{activeSpaceName}</Text>
            <Text style={styles.tagMuted}>{activeSpaceKindLabel}</Text>
          </View>
          <Text style={styles.cardCopy}>{activeSpaceTemplateLabel || t('viewedSpace.defaultTemplate')}</Text>
          <Text style={styles.cardCopy}>{countsCopy}</Text>
        </View>
      ) : null}
      {canManageSharedSpace ? (
        <>
          <Text style={styles.cardCopy}>
            {t('viewedSpace.membersCopy')}
          </Text>
          <View style={styles.inlineActions}>
            <Pressable
              style={styles.secondaryButtonSmall}
              onPress={onManageMembers}
              disabled={spaceMembersEditorBusy}
            >
              <Text style={styles.secondaryButtonText}>{t('viewedSpace.manageMembers')}</Text>
            </Pressable>
            <Pressable style={styles.secondaryButtonSmall} onPress={onInviteToSpace} disabled={settingsBusy}>
              <Text style={styles.secondaryButtonText}>{t('viewedSpace.inviteToSpace')}</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}
