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
      <Text style={styles.cardTitle}>当前查看空间</Text>
      <Text style={styles.cardCopy}>
        {activeSpaceName
          ? summaryCopy
          : '先在聊天中选择一个空间，资料库和设置会跟随到同一个空间。'}
      </Text>
      {activeSpaceName ? (
        <View style={styles.deviceRowCard}>
          <View style={styles.deviceRowHeadline}>
            <Text style={styles.networkName}>{activeSpaceName}</Text>
            <Text style={styles.tagMuted}>{activeSpaceKindLabel}</Text>
          </View>
          <Text style={styles.cardCopy}>{activeSpaceTemplateLabel || '家庭共享空间'}</Text>
          <Text style={styles.cardCopy}>{countsCopy}</Text>
        </View>
      ) : null}
      {canManageSharedSpace ? (
        <>
          <Text style={styles.cardCopy}>
            在这里调整这个空间的成员。你会自动保留在空间内。
          </Text>
          <View style={styles.inlineActions}>
            <Pressable
              style={styles.secondaryButtonSmall}
              onPress={onManageMembers}
              disabled={spaceMembersEditorBusy}
            >
              <Text style={styles.secondaryButtonText}>管理成员</Text>
            </Pressable>
            <Pressable style={styles.secondaryButtonSmall} onPress={onInviteToSpace} disabled={settingsBusy}>
              <Text style={styles.secondaryButtonText}>邀请加入此空间</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}
