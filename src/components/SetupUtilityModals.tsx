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
            <Text style={styles.selectionLabel}>{fileEditorMode === 'rename' ? 'Rename item' : 'New folder'}</Text>
            <Text style={styles.selectionTitle}>
              {fileEditorMode === 'rename' ? fileTargetEntry?.name || 'Rename' : 'Create folder'}
            </Text>
            <Text style={styles.selectionCopy}>
              {fileEditorMode === 'rename'
                ? 'Use a short, clear name. Sparkbox keeps the item in the same folder.'
                : 'Create a new folder here so files for this space stay organized.'}
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={fileEditorMode === 'rename' ? 'New name' : 'Folder name'}
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
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.primaryButtonSmall}
                onPress={onSubmitFileEditor}
                disabled={filesBusy}
              >
                {filesBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{fileEditorMode === 'rename' ? 'Rename' : 'Create folder'}</Text>}
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
            <Text style={styles.selectionLabel}>{manualEntry || !selectedNetwork ? 'Manual entry' : 'Connect Sparkbox'}</Text>
            <Text style={styles.selectionTitle}>
              {selectedSsid || previousInternetSsid || 'Enter your home Wi-Fi'}
            </Text>
            <Text style={styles.selectionCopy}>
              {selectedNetwork?.known
                ? 'Sparkbox has used this Wi-Fi before. Leave the password blank unless it changed.'
                : 'Enter the Wi-Fi password, then Sparkbox will leave setup and join this network.'}
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Wi-Fi name"
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
                placeholder={selectedNetwork?.known ? 'Password (optional if unchanged)' : 'Wi-Fi password'}
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
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButtonSmall, !canSubmitWifi ? styles.networkRowDisabled : null]}
                onPress={onSubmitWifi}
                disabled={!canSubmitWifi}
              >
                {provisionBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Connect</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
