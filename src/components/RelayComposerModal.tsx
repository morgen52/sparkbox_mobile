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
          <Text style={styles.selectionLabel}>Relay message</Text>
          <Text style={styles.selectionTitle}>Have Sparkbox relay it privately</Text>
          <Text style={styles.selectionCopy}>
            Choose one other member in this shared space, then write the note Sparkbox should pass along privately.
          </Text>
          <Text style={styles.selectionLabel}>Send to</Text>
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
            placeholder="Write the message Sparkbox should relay"
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
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButtonSmall, relayTargets.length === 0 ? styles.networkRowDisabled : null]}
              onPress={onSubmit}
              disabled={relayBusy || relayTargets.length === 0}
            >
              {relayBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Relay</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
