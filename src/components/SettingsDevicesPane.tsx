import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { DeviceSummary, FamilyAppInstallation } from '../householdApi';
import { describeDeviceLabel, describeDeviceStatus } from '../householdState';
import {
  describeFamilyAppRiskLevel,
  formatFamilyAppCapabilities,
  formatSpaceTemplateList,
} from '../spaceShell';

type SettingsDevicesPaneProps = {
  styles: Record<string, any>;
  canManage: boolean;
  canReprovisionDevice: boolean;
  settingsBusy: boolean;
  familyAppsBusy: boolean;
  activeSpaceName: string;
  activeSpaceTemplateLabel: string;
  homeDevices: DeviceSummary[];
  recommendedFamilyApps: FamilyAppInstallation[];
  installedFamilyApps: FamilyAppInstallation[];
  availableFamilyApps: FamilyAppInstallation[];
  onBeginDeviceReprovision: (device: DeviceSummary) => void;
  onInstallSelectedFamilyApp: (slug: string) => void;
  onUninstallInstalledFamilyApp: (slug: string) => void;
};

export function SettingsDevicesPane({
  styles,
  canManage,
  canReprovisionDevice,
  settingsBusy,
  familyAppsBusy,
  activeSpaceName,
  activeSpaceTemplateLabel,
  homeDevices,
  recommendedFamilyApps,
  installedFamilyApps,
  availableFamilyApps,
  onBeginDeviceReprovision,
  onInstallSelectedFamilyApp,
  onUninstallInstalledFamilyApp,
}: SettingsDevicesPaneProps) {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Devices and Network</Text>
        <Text style={styles.cardCopy}>
          {canReprovisionDevice
            ? 'Change Wi-Fi from here without scanning the device again. Sparkbox stays in your household while the app walks through Wi-Fi setup.'
            : 'Owners can change Wi-Fi from here. Members can still see which Sparkbox devices are attached to this household.'}
        </Text>
        {homeDevices.map((device, deviceIndex) => (
          <View key={device.device_id} style={styles.deviceRowCard}>
            <Text style={styles.networkName}>
              {describeDeviceLabel(device.device_id, deviceIndex, homeDevices.length)}
            </Text>
            <Text style={styles.cardCopy}>{describeDeviceStatus(device.status)}</Text>
            {canReprovisionDevice ? (
              <View style={styles.inlineActions}>
                <Pressable
                  style={styles.secondaryButtonSmall}
                  onPress={() => onBeginDeviceReprovision(device)}
                >
                  <Text style={styles.secondaryButtonText}>Change Wi-Fi</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {canManage ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Manage family apps</Text>
          <Text style={styles.cardCopy}>
            Install a family app once on this device, then decide which spaces should actually use it.
          </Text>
          {familyAppsBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
          {activeSpaceName && recommendedFamilyApps.length > 0 ? (
            <>
              <Text style={styles.selectionLabel}>Recommended for {activeSpaceName}</Text>
              {recommendedFamilyApps.map((app) => (
                <View key={`recommended-${app.slug}`} style={styles.deviceRowCard}>
                  <View style={styles.deviceRowHeadline}>
                    <Text style={styles.networkName}>{app.title}</Text>
                    <Text style={styles.tagMuted}>{activeSpaceTemplateLabel || 'space'}</Text>
                  </View>
                  {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
                  <Text style={styles.cardCopy}>
                    Best for: {formatSpaceTemplateList(app.spaceTemplates) || 'Any space'}
                  </Text>
                  {app.capabilities.length > 0 ? (
                    <Text style={styles.cardCopy}>
                      What it helps with: {formatFamilyAppCapabilities(app.capabilities)}
                    </Text>
                  ) : null}
                  <View style={styles.inlineActions}>
                    <Pressable
                      style={styles.primaryButtonSmall}
                      onPress={() => onInstallSelectedFamilyApp(app.slug)}
                      disabled={settingsBusy}
                    >
                      <Text style={styles.primaryButtonText}>Install on this device</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          ) : null}
          {installedFamilyApps.length > 0 ? (
            <>
              <Text style={styles.selectionLabel}>Installed on this device</Text>
              {installedFamilyApps.map((app) => (
                <View key={`installed-${app.slug}`} style={styles.deviceRowCard}>
                  <View style={styles.deviceRowHeadline}>
                    <Text style={styles.networkName}>{app.title}</Text>
                    <Text style={styles.statusTagOnline}>On this device</Text>
                  </View>
                  {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
                  <Text style={styles.cardCopy}>
                    Best for: {formatSpaceTemplateList(app.spaceTemplates) || 'Any space'}
                  </Text>
                  <Text style={styles.cardCopy}>
                    {app.supportsProactiveMessages ? 'Can take initiative' : 'Only speaks when asked'}
                    {app.supportsPrivateRelay ? ' · Can help with private relays' : ''}
                    {app.requiresOwnerConfirmation ? ' · Relays stay owner-approved' : ''}
                  </Text>
                  <View style={styles.inlineActions}>
                    <Pressable
                      style={styles.secondaryButtonSmall}
                      onPress={() => onUninstallInstalledFamilyApp(app.slug)}
                      disabled={settingsBusy}
                    >
                      <Text style={styles.secondaryButtonText}>Remove from this device</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          ) : null}
          <Text style={styles.selectionLabel}>Available for this device</Text>
          {availableFamilyApps.map((app) => (
            <View key={`catalog-${app.slug}`} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{app.title}</Text>
                <Text style={styles.tagMuted}>{describeFamilyAppRiskLevel(app.riskLevel)}</Text>
              </View>
              {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
              <Text style={styles.cardCopy}>
                Best for: {formatSpaceTemplateList(app.spaceTemplates) || 'Any space'}
              </Text>
              {app.capabilities.length > 0 ? (
                <Text style={styles.cardCopy}>
                  What it helps with: {formatFamilyAppCapabilities(app.capabilities)}
                </Text>
              ) : null}
              <View style={styles.inlineActions}>
                <Pressable
                  style={styles.primaryButtonSmall}
                  onPress={() => onInstallSelectedFamilyApp(app.slug)}
                  disabled={settingsBusy}
                >
                  <Text style={styles.primaryButtonText}>Install</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}
