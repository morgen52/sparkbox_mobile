import React from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, View } from 'react-native';
import { useT } from '../i18n';
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
  const t = useT();
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onRequestClose}>
      <View style={styles.modalSurface}>
        <View style={styles.spaceCreatorSheet}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.spaceCreatorSheetContent}>
            <Text style={styles.selectionLabel}>{t('membersEditor.label')}</Text>
            <Text style={styles.selectionTitle}>
              {activeSpaceName ? t('membersEditor.title', { name: activeSpaceName }) : t('membersEditor.titleFallback')}
            </Text>
            <Text style={styles.selectionCopy}>
              {t('membersEditor.copy')}
            </Text>
            <View style={styles.deviceRowCard}>
              <Text style={styles.networkName}>{ownerDisplayName || t('membersEditor.ownerFallback')}</Text>
              <Text style={styles.cardCopy}>{t('membersEditor.ownerNote')}</Text>
            </View>
            {memberOptions.length === 0 ? (
              <Text style={styles.cardCopy}>{t('membersEditor.noMembers')}</Text>
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
              {t('membersEditor.addMemberHint')}
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.spaceCreatorFooter}>
            <View style={styles.inlineActions}>
              <Pressable style={styles.secondaryButtonSmall} onPress={onRequestClose} disabled={busy}>
                <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
              </Pressable>
              {showInviteButton ? (
                <Pressable
                  style={styles.secondaryButtonSmall}
                  onPress={onInviteToSpace}
                  disabled={busy || settingsBusy}
                >
                  <Text style={styles.secondaryButtonText}>{t('membersEditor.invite')}</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.primaryButtonSmall} onPress={onSubmit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{t('membersEditor.submit')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
