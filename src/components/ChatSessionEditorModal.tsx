import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import {
  describeChatEditorPrimaryActionLabel,
  describeChatEditorTitle,
  describeChatEditorVerb,
  describeChatNamePlaceholder,
  describeChatSessionPrimaryActionLabel,
} from '../spaceShell';

type ChatSessionEditorModalProps = {
  styles: Record<string, any>;
  visible: boolean;
  editingChatSession: boolean;
  activeSpaceDetail: any;
  chatScope: any;
  chatSessionName: string;
  chatError: string;
  chatBusy: boolean;
  onRequestClose: () => void;
  onChangeName: (value: string) => void;
  onSubmit: () => void;
};

export function ChatSessionEditorModal({
  styles,
  visible,
  editingChatSession,
  activeSpaceDetail,
  chatScope,
  chatSessionName,
  chatError,
  chatBusy,
  onRequestClose,
  onChangeName,
  onSubmit,
}: ChatSessionEditorModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.scannerOverlay}>
        <View style={[styles.card, { width: '100%', maxWidth: 560 }]}>
          <Text style={styles.selectionLabel}>
            {editingChatSession
              ? `Edit ${describeChatEditorVerb(activeSpaceDetail, chatScope)}`
              : describeChatSessionPrimaryActionLabel(activeSpaceDetail, chatScope)}
          </Text>
          <Text style={styles.selectionTitle}>
            {describeChatEditorTitle(activeSpaceDetail, chatScope, editingChatSession)}
          </Text>
          <Text style={styles.selectionCopy}>
            Give this conversation a clear name so everyone knows what Sparkbox is helping with here.
          </Text>
          <TextInput
            placeholder={describeChatNamePlaceholder(activeSpaceDetail, chatScope)}
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={chatSessionName}
            onChangeText={onChangeName}
          />
          {chatError ? <Text style={styles.errorText}>{chatError}</Text> : null}
          <View style={styles.inlineActions}>
            <Pressable
              style={styles.secondaryButtonSmall}
              onPress={onRequestClose}
              disabled={chatBusy}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.primaryButtonSmall}
              onPress={onSubmit}
              disabled={chatBusy}
            >
              {chatBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {describeChatEditorPrimaryActionLabel(activeSpaceDetail, chatScope, editingChatSession)}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
