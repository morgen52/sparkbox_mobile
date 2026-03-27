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
            <Text style={styles.selectionLabel}>新建共享空间</Text>
            <Text style={styles.selectionTitle}>创建新的共享空间</Text>
            <Text style={styles.selectionCopy}>
              先确定这个空间的用途，再起一个清晰名称，并选择成员。你会默认包含在内。
            </Text>
            <TextInput
              placeholder="空间名称"
              placeholderTextColor="#7e8a83"
              style={styles.input}
              value={spaceName}
              onChangeText={onChangeSpaceName}
            />
            <Text style={styles.selectionLabel}>空间类型</Text>
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
            <Text style={styles.selectionCopy}>推荐场景：{selectedTemplateLabel}</Text>
            <Text style={styles.selectionLabel}>成员</Text>
            <Text style={styles.selectionCopy}>
              可以现在就添加成员，也可以先留空，稍后再邀请。
            </Text>
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
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.spaceCreatorFooter}>
            <View style={styles.inlineActions}>
              <Pressable style={styles.secondaryButtonSmall} onPress={onRequestClose} disabled={busy}>
                <Text style={styles.secondaryButtonText}>取消</Text>
              </Pressable>
              <Pressable style={styles.primaryButtonSmall} onPress={onSubmit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>创建空间</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
