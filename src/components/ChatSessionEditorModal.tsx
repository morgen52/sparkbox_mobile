import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useT } from '../i18n';
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
  const t = useT();
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalSurface}>
        <View style={styles.spaceCreatorSheet}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.spaceCreatorSheetContent}>
            <Text style={styles.selectionLabel}>
              {editingChatSession
                ? `${t('chatEditor.editPrefix')}${describeChatEditorVerb(activeSpaceDetail, chatScope, t)}`
                : describeChatSessionPrimaryActionLabel(activeSpaceDetail, chatScope, t)}
            </Text>
            <Text style={styles.selectionTitle}>
              {describeChatEditorTitle(activeSpaceDetail, chatScope, editingChatSession, t)}
            </Text>
            <Text style={styles.selectionCopy}>
              {t('chatEditor.nameCopy')}
            </Text>
            <TextInput
              placeholder={describeChatNamePlaceholder(activeSpaceDetail, chatScope, t)}
              placeholderTextColor="#7e8a83"
              style={styles.input}
              value={chatSessionName}
              onChangeText={onChangeName}
            />
            {chatError ? <Text style={styles.errorText}>{chatError}</Text> : null}
          </ScrollView>

          <View style={styles.spaceCreatorFooter}>
            <View style={styles.inlineActions}>
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={onRequestClose}
                disabled={chatBusy}
              >
                <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
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
                    {describeChatEditorPrimaryActionLabel(activeSpaceDetail, chatScope, editingChatSession, t)}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
