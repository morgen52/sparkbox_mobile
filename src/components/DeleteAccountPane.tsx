import React, { useState } from 'react';
import { ActivityIndicator, Modal, Text, TextInput, View } from 'react-native';
import { useT } from '../i18n';
import { AnimatedPressable as Pressable } from './AnimatedPressable';

type DeleteAccountPaneProps = {
  styles: Record<string, any>;
  onlineDeviceAvailable: boolean;
  onDeleteAccount: (password: string) => void;
  deleteAccountBusy: boolean;
};

export function DeleteAccountPane({
  styles,
  onlineDeviceAvailable,
  onDeleteAccount,
  deleteAccountBusy,
}: DeleteAccountPaneProps) {
  const t = useT();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const deleteDisabled = deleteAccountBusy || !onlineDeviceAvailable;

  return (
    <>
      <View style={[styles.settingsCard, { borderColor: deleteDisabled ? '#ccc' : '#991b1b', borderWidth: 1 }]}>
        <Text style={[styles.cardTitle, { color: deleteDisabled ? '#999' : '#991b1b' }]}>{t('deleteAccount.title')}</Text>
        <Text style={styles.cardCopy}>
          {onlineDeviceAvailable
            ? t('deleteAccount.copy.online')
            : t('deleteAccount.copy.offline')}
        </Text>
        <View style={styles.inlineActions}>
          <Pressable
            style={[
              styles.secondaryButtonSmall,
              { borderColor: deleteDisabled ? '#ccc' : '#991b1b' },
            ]}
            onPress={() => { setConfirmPassword(''); setConfirmModalOpen(true); }}
            disabled={deleteDisabled}
          >
            {deleteAccountBusy ? (
              <ActivityIndicator color="#991b1b" size="small" />
            ) : (
              <Text style={[styles.secondaryButtonText, { color: deleteDisabled ? '#999' : '#991b1b' }]}>
                {t('deleteAccount.button')}
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <Modal
        visible={confirmModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '85%', maxWidth: 360 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', marginBottom: 8, color: '#991b1b' }}>
              {t('deleteAccount.modal.title')}
            </Text>
            <Text style={{ fontSize: 14, color: '#555', marginBottom: 16, lineHeight: 20 }}>
              {t('deleteAccount.modal.copy')}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 10,
                fontSize: 15,
                marginBottom: 20,
              }}
              secureTextEntry
              placeholder={t('deleteAccount.modal.placeholder')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <Pressable
                style={[styles.secondaryButtonSmall]}
                onPress={() => setConfirmModalOpen(false)}
              >
                <Text style={styles.secondaryButtonText}>{t('deleteAccount.modal.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryButtonSmall, { borderColor: '#991b1b' }]}
                disabled={!confirmPassword.trim()}
                onPress={() => {
                  setConfirmModalOpen(false);
                  onDeleteAccount(confirmPassword.trim());
                }}
              >
                <Text style={[styles.secondaryButtonText, { color: confirmPassword.trim() ? '#991b1b' : '#999' }]}>
                  {t('deleteAccount.modal.confirm')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
