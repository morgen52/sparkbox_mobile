import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useT } from '../i18n';

type MemoryEditorModalProps = {
  styles: Record<string, any>;
  visible: boolean;
  editingMemory: boolean;
  memoryTitle: string;
  memoryContent: string;
  memoryPinned: boolean;
  libraryError: string;
  libraryBusy: boolean;
  onRequestClose: () => void;
  onChangeTitle: (value: string) => void;
  onChangeContent: (value: string) => void;
  onTogglePinned: () => void;
  onSubmit: () => void;
};

export function MemoryEditorModal({
  styles,
  visible,
  editingMemory,
  memoryTitle,
  memoryContent,
  memoryPinned,
  libraryError,
  libraryBusy,
  onRequestClose,
  onChangeTitle,
  onChangeContent,
  onTogglePinned,
  onSubmit,
}: MemoryEditorModalProps) {
  const t = useT();
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.scannerOverlay}>
        <View style={[styles.card, { width: '100%', maxWidth: 560 }]}>
          <Text style={styles.selectionLabel}>{editingMemory ? t('memoryEditor.editLabel') : t('memoryEditor.newLabel')}</Text>
          <Text style={styles.selectionTitle}>
            {editingMemory ? t('memoryEditor.editTitle') : t('memoryEditor.newTitle')}
          </Text>
          <Text style={styles.selectionCopy}>
            {t('memoryEditor.copy')}
          </Text>
          <TextInput
            placeholder={t('memoryEditor.titlePlaceholder')}
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={memoryTitle}
            onChangeText={onChangeTitle}
          />
          <TextInput
            placeholder={t('memoryEditor.contentPlaceholder')}
            placeholderTextColor="#7e8a83"
            style={[styles.input, styles.textArea]}
            value={memoryContent}
            onChangeText={onChangeContent}
            multiline
          />
          <View style={styles.inlineActions}>
            <Pressable
              style={[styles.secondaryButtonSmall, memoryPinned ? styles.scopePillActive : null]}
              onPress={onTogglePinned}
            >
              <Text style={[styles.secondaryButtonText, memoryPinned ? styles.scopePillLabelActive : null]}>
                {memoryPinned ? t('memoryEditor.pinned') : t('memoryEditor.pin')}
              </Text>
            </Pressable>
          </View>
          {libraryError ? <Text style={styles.errorText}>{libraryError}</Text> : null}
          <View style={styles.inlineActions}>
            <Pressable
              style={styles.secondaryButtonSmall}
              onPress={onRequestClose}
              disabled={libraryBusy}
            >
              <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={styles.primaryButtonSmall}
              onPress={onSubmit}
              disabled={libraryBusy}
            >
              {libraryBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {editingMemory ? t('memoryEditor.saveButton') : t('memoryEditor.createButton')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
