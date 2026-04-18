import React from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { useT } from '../i18n';
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
  const t = useT();
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onRequestClose}>
      <View style={styles.modalSurface}>
        <View style={styles.spaceCreatorSheet}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.spaceCreatorSheetContent}
          >
            <Text style={styles.selectionLabel}>{t('spaceCreator.label')}</Text>
            <Text style={styles.selectionTitle}>{t('spaceCreator.title')}</Text>
            <Text style={styles.selectionCopy}>
              {t('spaceCreator.copy')}
            </Text>
            <TextInput
              placeholder={t('spaceCreator.namePlaceholder')}
              placeholderTextColor="#7e8a83"
              style={styles.input}
              value={spaceName}
              onChangeText={onChangeSpaceName}
            />
            <Text style={styles.selectionLabel}>{t('spaceCreator.typeLabel')}</Text>
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
            <Text style={styles.selectionCopy}>{t('spaceCreator.scenarioPrefix', { label: selectedTemplateLabel })}</Text>
            <Text style={styles.selectionLabel}>{t('spaceCreator.membersLabel')}</Text>
            <Text style={styles.selectionCopy}>
              {t('spaceCreator.membersCopy')}
            </Text>
            {memberOptions.length === 0 ? (
              <Text style={styles.cardCopy}>{t('spaceCreator.noMembers')}</Text>
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
                <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={styles.primaryButtonSmall} onPress={onSubmit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{t('spaceCreator.submit')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
