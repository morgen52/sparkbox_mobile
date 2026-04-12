import React from 'react';
import { ActivityIndicator, Modal, Text, TextInput, View } from 'react-native';
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
            <Text style={styles.selectionLabel}>{manualEntry || !selectedNetwork ? '手动输入' : '连接 Sparkbox'}</Text>
            <Text style={styles.selectionTitle}>
              {selectedSsid || previousInternetSsid || '输入家庭 Wi-Fi'}
            </Text>
            <Text style={styles.selectionCopy}>
              {selectedNetwork?.known
                ? 'Sparkbox 之前连过这个 Wi-Fi。如密码未变，可留空。'
                : '输入 Wi-Fi 密码后，Sparkbox 将退出配置模式并接入该网络。'}
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Wi-Fi 名称"
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
                placeholder={selectedNetwork?.known ? '密码（未变可选填）' : 'Wi-Fi 密码'}
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
                <Text style={styles.secondaryButtonText}>取消</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButtonSmall, !canSubmitWifi ? styles.networkRowDisabled : null]}
                onPress={onSubmitWifi}
                disabled={!canSubmitWifi}
              >
                {provisionBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>连接</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
