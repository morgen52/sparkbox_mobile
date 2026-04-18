import React from 'react';
import { ActivityIndicator, Modal, Text, TextInput, View } from 'react-native';
import { useT } from '../i18n';
import { AnimatedPressable as Pressable } from './AnimatedPressable';
import type { LocalSetupNetwork } from '../localSetupApi';

type SetupUtilityModalsProps = {
  styles: Record<string, any>;
  networkSheetOpen: boolean;
  manualEntry: boolean;
  selectedNetwork: LocalSetupNetwork | null;
  selectedSsid: string;
  previousInternetSsid: string | null;
  wifiPassword: string;
  canSubmitWifi: boolean;
  provisionBusy: boolean;
  onCloseNetworkSheet: () => void;
  onChangeSelectedSsid: (value: string) => void;
  onChangeWifiPassword: (value: string) => void;
  onSubmitWifi: () => void;
};

export function SetupUtilityModals({
  styles,
  networkSheetOpen,
  manualEntry,
  selectedNetwork,
  selectedSsid,
  previousInternetSsid,
  wifiPassword,
  canSubmitWifi,
  provisionBusy,
  onCloseNetworkSheet,
  onChangeSelectedSsid,
  onChangeWifiPassword,
  onSubmitWifi,
}: SetupUtilityModalsProps) {
  const t = useT();
  return (
    <>
      <Modal
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent
        visible={networkSheetOpen}
        onRequestClose={onCloseNetworkSheet}
      >
        <View style={styles.networkSheetBackdrop}>
          <View style={styles.networkSheetCard}>
            <Text style={styles.selectionLabel}>{manualEntry || !selectedNetwork ? t('setupWifi.manualLabel') : t('setupWifi.connectLabel')}</Text>
            <Text style={styles.selectionTitle}>
              {selectedSsid || previousInternetSsid || t('setupWifi.defaultTitle')}
            </Text>
            <Text style={styles.selectionCopy}>
              {selectedNetwork?.known
                ? t('setupWifi.knownCopy')
                : t('setupWifi.newCopy')}
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t('setupWifi.ssidPlaceholder')}
              placeholderTextColor="#7e8a83"
              style={styles.input}
              value={selectedSsid}
              onChangeText={onChangeSelectedSsid}
              editable={manualEntry || !selectedNetwork}
            />
            {(selectedNetwork?.requires_password ?? true) || manualEntry || !selectedNetwork ? (
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                placeholder={selectedNetwork?.known ? t('setupWifi.knownPasswordPlaceholder') : t('setupWifi.passwordPlaceholder')}
                placeholderTextColor="#7e8a83"
                style={styles.input}
                value={wifiPassword}
                onChangeText={onChangeWifiPassword}
              />
            ) : null}
            <View style={styles.inlineActions}>
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={onCloseNetworkSheet}
                disabled={provisionBusy}
              >
                <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButtonSmall, !canSubmitWifi ? styles.networkRowDisabled : null]}
                onPress={onSubmitWifi}
                disabled={!canSubmitWifi}
              >
                {provisionBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{t('setupWifi.connect')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
