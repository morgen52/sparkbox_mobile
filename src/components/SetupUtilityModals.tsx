import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import type { HouseholdFileEntry } from '../householdApi';
import type { LocalSetupNetwork } from '../localSetupApi';

type SetupUtilityModalsProps = {
  styles: Record<string, any>;
  fileEditorOpen: boolean;
  fileEditorMode: 'mkdir' | 'rename' | null;
  fileTargetEntry: HouseholdFileEntry | null;
  fileEditorValue: string;
  filesError: string;
  filesBusy: boolean;
  networkSheetOpen: boolean;
  manualEntry: boolean;
  selectedNetwork: LocalSetupNetwork | null;
  selectedSsid: string;
  previousInternetSsid: string | null;
  wifiPassword: string;
  canSubmitWifi: boolean;
  provisionBusy: boolean;
  onCloseFileEditor: () => void;
  onChangeFileEditorValue: (value: string) => void;
  onSubmitFileEditor: () => void;
  onCloseNetworkSheet: () => void;
  onChangeSelectedSsid: (value: string) => void;
  onChangeWifiPassword: (value: string) => void;
  onSubmitWifi: () => void;
};

export function SetupUtilityModals({
  styles,
  fileEditorOpen,
  fileEditorMode,
  fileTargetEntry,
  fileEditorValue,
  filesError,
  filesBusy,
  networkSheetOpen,
  manualEntry,
  selectedNetwork,
  selectedSsid,
  previousInternetSsid,
  wifiPassword,
  canSubmitWifi,
  provisionBusy,
  onCloseFileEditor,
  onChangeFileEditorValue,
  onSubmitFileEditor,
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
        visible={fileEditorOpen}
        onRequestClose={onCloseFileEditor}
      >
        <View style={styles.networkSheetBackdrop}>
          <View style={styles.networkSheetCard}>
            <Text style={styles.selectionLabel}>{fileEditorMode === 'rename' ? '重命名项目' : '新建文件夹'}</Text>
            <Text style={styles.selectionTitle}>
              {fileEditorMode === 'rename' ? fileTargetEntry?.name || '重命名' : '创建文件夹'}
            </Text>
            <Text style={styles.selectionCopy}>
              {fileEditorMode === 'rename'
                ? '建议使用简短清晰的名称。Sparkbox 会保持该项目在原目录不变。'
                : '在这里创建新文件夹，便于整理这个空间的文件。'}
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={fileEditorMode === 'rename' ? '新名称' : '文件夹名称'}
              placeholderTextColor="#7e8a83"
              style={styles.input}
              value={fileEditorValue}
              onChangeText={onChangeFileEditorValue}
            />
            {filesError ? <Text style={styles.errorText}>{filesError}</Text> : null}
            <View style={styles.inlineActions}>
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={onCloseFileEditor}
                disabled={filesBusy}
              >
                <Text style={styles.secondaryButtonText}>取消</Text>
              </Pressable>
              <Pressable
                style={styles.primaryButtonSmall}
                onPress={onSubmitFileEditor}
                disabled={filesBusy}
              >
                {filesBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{fileEditorMode === 'rename' ? '重命名' : '创建文件夹'}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
