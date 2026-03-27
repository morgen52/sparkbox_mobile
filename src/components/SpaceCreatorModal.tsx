import React from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { AnimatedPressable as Pressable } from './AnimatedPressable';

type SpaceTemplateOption = {
  id: string;
  label: string;
  active: boolean;
};

type SpaceMemberOption = {
  id: string;
  display_name: string;
};

type SpaceCreatorModalProps = {
  visible: boolean;
  busy: boolean;
  error: string;
  spaceName: string;
  selectedTemplateLabel: string;
  templateOptions: SpaceTemplateOption[];
  memberOptions: SpaceMemberOption[];
  selectedMemberIds: string[];
  styles: Record<string, any>;
  onRequestClose: () => void;
  onChangeSpaceName: (value: string) => void;
  onSelectTemplate: (templateId: string) => void;
  onToggleMember: (memberId: string) => void;
  onSubmit: () => void;
};

export function SpaceCreatorModal({
  visible,
  busy,
  error,
  spaceName,
  selectedTemplateLabel,
  templateOptions,
  memberOptions,
  selectedMemberIds,
  styles,
  onRequestClose,
  onChangeSpaceName,
  onSelectTemplate,
  onToggleMember,
  onSubmit,
}: SpaceCreatorModalProps) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onRequestClose}>
      <View style={styles.modalSurface}>
        <View style={styles.spaceCreatorSheet}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.spaceCreatorSheetContent}
          >
            <Text style={styles.selectionLabel}>New shared space</Text>
            <Text style={styles.selectionTitle}>Create a new shared space</Text>
            <Text style={styles.selectionCopy}>
              Pick what this space is for, give it a clear name, and choose who belongs in it. You are always included.
            </Text>
            <TextInput
              placeholder="Space name"
              placeholderTextColor="#7e8a83"
              style={styles.input}
              value={spaceName}
              onChangeText={onChangeSpaceName}
            />
            <Text style={styles.selectionLabel}>Space type</Text>
            <View style={styles.scopeRow}>
              {templateOptions.map((template) => (
                <Pressable
                  key={template.id}
                  style={[styles.scopePill, template.active ? styles.scopePillActive : null]}
                  onPress={() => onSelectTemplate(template.id)}
                >
                  <Text style={[styles.scopePillLabel, template.active ? styles.scopePillLabelActive : null]}>
                    {template.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.selectionCopy}>Best for: {selectedTemplateLabel}</Text>
            <Text style={styles.selectionLabel}>Members</Text>
            <Text style={styles.selectionCopy}>
              Add people now or leave this empty and invite them later.
            </Text>
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
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.spaceCreatorFooter}>
            <View style={styles.inlineActions}>
              <Pressable style={styles.secondaryButtonSmall} onPress={onRequestClose} disabled={busy}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButtonSmall} onPress={onSubmit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Create space</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
