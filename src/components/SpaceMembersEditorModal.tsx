import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';

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
            <Text style={styles.selectionLabel}>Manage members</Text>
            <Text style={styles.selectionTitle}>
              {activeSpaceName ? `Who belongs in ${activeSpaceName}?` : 'Update this shared space'}
            </Text>
            <Text style={styles.selectionCopy}>
              Pick the household members who should stay in this shared space. You stay in this space automatically.
            </Text>
            <View style={styles.deviceRowCard}>
              <Text style={styles.networkName}>{ownerDisplayName || 'You'}</Text>
              <Text style={styles.cardCopy}>Owner · Always included</Text>
            </View>
            {memberOptions.length === 0 ? (
              <Text style={styles.cardCopy}>No one else has joined this household yet.</Text>
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
              Need someone new first? Create a household invite, then bring them back into this shared space.
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.spaceCreatorFooter}>
            <View style={styles.inlineActions}>
              <Pressable style={styles.secondaryButtonSmall} onPress={onRequestClose} disabled={busy}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              {showInviteButton ? (
                <Pressable
                  style={styles.secondaryButtonSmall}
                  onPress={onInviteToSpace}
                  disabled={busy || settingsBusy}
                >
                  <Text style={styles.secondaryButtonText}>Invite to this space</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.primaryButtonSmall} onPress={onSubmit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Save members</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
