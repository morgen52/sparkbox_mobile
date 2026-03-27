import React from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, View } from 'react-native';
import { AnimatedPressable as Pressable } from './AnimatedPressable';

type SharedSpaceMemberOption = {
  id: string;
  display_name: string;
};

type SpaceMembersEditorModalProps = {
  visible: boolean;
  activeSpaceName: string;
  ownerDisplayName: string;
  memberOptions: SharedSpaceMemberOption[];
  selectedMemberIds: string[];
  error: string;
  busy: boolean;
  settingsBusy: boolean;
  showInviteButton: boolean;
  styles: Record<string, any>;
  onRequestClose: () => void;
  onToggleMember: (memberId: string) => void;
  onInviteToSpace: () => void;
  onSubmit: () => void;
};

export function SpaceMembersEditorModal({
  visible,
  activeSpaceName,
  ownerDisplayName,
  memberOptions,
  selectedMemberIds,
  error,
  busy,
  settingsBusy,
  showInviteButton,
  styles,
  onRequestClose,
  onToggleMember,
  onInviteToSpace,
  onSubmit,
}: SpaceMembersEditorModalProps) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onRequestClose}>
      <View style={styles.modalSurface}>
        <View style={styles.spaceCreatorSheet}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.spaceCreatorSheetContent}>
            <Text style={styles.selectionLabel}>管理成员</Text>
            <Text style={styles.selectionTitle}>
              {activeSpaceName ? `${activeSpaceName} 包含哪些成员？` : '更新此共享空间'}
            </Text>
            <Text style={styles.selectionCopy}>
              选择应保留在此共享空间中的家庭成员。你会自动保留在这个空间内。
            </Text>
            <View style={styles.deviceRowCard}>
              <Text style={styles.networkName}>{ownerDisplayName || '你'}</Text>
              <Text style={styles.cardCopy}>管理员 · 始终包含</Text>
            </View>
            {memberOptions.length === 0 ? (
              <Text style={styles.cardCopy}>当前还没有其他成员加入这个家庭。</Text>
            ) : (
              <View style={styles.scopeRow}>
                {memberOptions.map((member) => {
                  const active = selectedMemberIds.includes(member.id);
                  return (
                    <Pressable
                      key={member.id}
                      style={[styles.scopePill, active ? styles.scopePillActive : null]}
                      onPress={() => onToggleMember(member.id)}
                    >
                      <Text style={[styles.scopePillLabel, active ? styles.scopePillLabelActive : null]}>
                        {member.display_name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <Text style={styles.cardCopy}>
              需要先新增成员？先创建家庭邀请，再把对方加入这个共享空间。
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.spaceCreatorFooter}>
            <View style={styles.inlineActions}>
              <Pressable style={styles.secondaryButtonSmall} onPress={onRequestClose} disabled={busy}>
                <Text style={styles.secondaryButtonText}>取消</Text>
              </Pressable>
              {showInviteButton ? (
                <Pressable
                  style={styles.secondaryButtonSmall}
                  onPress={onInviteToSpace}
                  disabled={busy || settingsBusy}
                >
                  <Text style={styles.secondaryButtonText}>邀请加入此空间</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.primaryButtonSmall} onPress={onSubmit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>保存成员</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
