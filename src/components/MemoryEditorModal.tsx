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
          <Text style={styles.selectionLabel}>{editingMemory ? '编辑记忆' : '新建记忆'}</Text>
          <Text style={styles.selectionTitle}>
            {editingMemory ? '更新 Sparkbox 需要记住的内容' : '为此空间保存一条新记忆'}
          </Text>
          <Text style={styles.selectionCopy}>
            记忆是 Sparkbox 需要长期记住的关键信息。
          </Text>
          <TextInput
            placeholder="记忆标题"
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={memoryTitle}
            onChangeText={onChangeTitle}
          />
          <TextInput
            placeholder="希望 Sparkbox 记住什么？"
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
                {memoryPinned ? '已置顶' : '置顶记忆'}
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
              <Text style={styles.secondaryButtonText}>取消</Text>
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
                  {editingMemory ? '保存记忆' : '创建记忆'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
