import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';

type RelayTarget = {
  id: string;
  displayName: string;
};

type RelayComposerModalProps = {
  styles: Record<string, any>;
  visible: boolean;
  relayTargets: RelayTarget[];
  relayTargetUserId: string;
  relayMessage: string;
  relayError: string;
  relayBusy: boolean;
  onRequestClose: () => void;
  onSelectRelayTarget: (userId: string) => void;
  onChangeRelayMessage: (value: string) => void;
  onSubmit: () => void;
};

export function RelayComposerModal({
  styles,
  visible,
  relayTargets,
  relayTargetUserId,
  relayMessage,
  relayError,
  relayBusy,
  onRequestClose,
  onSelectRelayTarget,
  onChangeRelayMessage,
  onSubmit,
}: RelayComposerModalProps) {
  return (
    <Modal
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.networkSheetBackdrop}>
        <View style={styles.networkSheetCard}>
          <Text style={styles.selectionLabel}>转达消息</Text>
          <Text style={styles.selectionTitle}>让 Sparkbox 私下转达</Text>
          <Text style={styles.selectionCopy}>
            选择本共享空间中的一位成员，再填写要由 Sparkbox 私下转达的内容。
          </Text>
          <Text style={styles.selectionLabel}>发送给</Text>
          <View style={styles.scopeRow}>
            {relayTargets.map((member) => {
              const active = relayTargetUserId === member.id;
              return (
                <Pressable
                  key={member.id}
                  style={[styles.scopePill, active ? styles.scopePillActive : null]}
                  onPress={() => onSelectRelayTarget(member.id)}
                >
                  <Text style={[styles.scopePillLabel, active ? styles.scopePillLabelActive : null]}>
                    {member.displayName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            autoCapitalize="sentences"
            autoCorrect={false}
            multiline
            numberOfLines={4}
            placeholder="输入要由 Sparkbox 转达的内容"
            placeholderTextColor="#7e8a83"
            style={[styles.input, styles.textArea]}
            value={relayMessage}
            onChangeText={onChangeRelayMessage}
          />
          {relayError ? <Text style={styles.errorText}>{relayError}</Text> : null}
          <View style={styles.inlineActions}>
            <Pressable
              style={styles.secondaryButtonSmall}
              onPress={onRequestClose}
              disabled={relayBusy}
            >
              <Text style={styles.secondaryButtonText}>取消</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButtonSmall, relayTargets.length === 0 ? styles.networkRowDisabled : null]}
              onPress={onSubmit}
              disabled={relayBusy || relayTargets.length === 0}
            >
              {relayBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>转达</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
