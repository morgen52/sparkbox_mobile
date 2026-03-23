import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';

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
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.scannerOverlay}>
        <View style={[styles.card, { width: '100%', maxWidth: 560 }]}>
          <Text style={styles.selectionLabel}>{editingMemory ? 'Edit memory' : 'New memory'}</Text>
          <Text style={styles.selectionTitle}>
            {editingMemory ? 'Update what Sparkbox should remember' : 'Save a new memory for this space'}
          </Text>
          <Text style={styles.selectionCopy}>
            Memories are the key details Sparkbox should remember for this space.
          </Text>
          <TextInput
            placeholder="Memory title"
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={memoryTitle}
            onChangeText={onChangeTitle}
          />
          <TextInput
            placeholder="What should Sparkbox remember?"
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
                {memoryPinned ? 'Pinned' : 'Pin memory'}
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
              <Text style={styles.secondaryButtonText}>Cancel</Text>
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
                  {editingMemory ? 'Save memory' : 'Create memory'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
