import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useT } from '../i18n';

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
  const t = useT();
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
          <Text style={styles.selectionLabel}>{t('relay.label')}</Text>
          <Text style={styles.selectionTitle}>{t('relay.title')}</Text>
          <Text style={styles.selectionCopy}>
            {t('relay.copy')}
          </Text>
          <Text style={styles.selectionLabel}>{t('relay.sendToLabel')}</Text>
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
            placeholder={t('relay.placeholder')}
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
              <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButtonSmall, relayTargets.length === 0 ? styles.networkRowDisabled : null]}
              onPress={onSubmit}
              disabled={relayBusy || relayTargets.length === 0}
            >
              {relayBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{t('relay.submit')}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
