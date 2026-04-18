import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useT } from '../i18n';
import { AnimatedPressable as Pressable } from './AnimatedPressable';
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
  const t = useT();
  return (
    <>
      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('devices.title')}</Text>
        <Text style={styles.cardCopy}>
          {canReprovisionDevice
            ? t('devices.adminCopy')
            : t('devices.memberCopy')}
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
                  <Text style={styles.secondaryButtonText}>{t('devices.changeWifi')}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {canManage ? (
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>{t('devices.manageFamilyApps')}</Text>
          <Text style={styles.cardCopy}>
            {t('devices.familyAppsCopy')}
          </Text>
          {familyAppsBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
          {activeSpaceName && recommendedFamilyApps.length > 0 ? (
            <>
              <Text style={styles.selectionLabel}>{activeSpaceName} {t('devices.recommended')}</Text>
              {recommendedFamilyApps.map((app) => (
                <View key={`recommended-${app.slug}`} style={styles.deviceRowCard}>
                  <View style={styles.deviceRowHeadline}>
                    <Text style={styles.networkName}>{app.title}</Text>
                    <Text style={styles.tagMuted}>{activeSpaceTemplateLabel || t('devices.space')}</Text>
                  </View>
                  {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
                  <Text style={styles.cardCopy}>
                    {t('devices.suitableFor')}{formatSpaceTemplateList(app.spaceTemplates) || t('devices.anySpace')}
                  </Text>
                  {app.capabilities.length > 0 ? (
                    <Text style={styles.cardCopy}>
                      {t('devices.mainAbility')}{formatFamilyAppCapabilities(app.capabilities)}
                    </Text>
                  ) : null}
                  <View style={styles.inlineActions}>
                    <Pressable
                      style={styles.primaryButtonSmall}
                      onPress={() => onInstallSelectedFamilyApp(app.slug)}
                      disabled={settingsBusy}
                    >
                      <Text style={styles.primaryButtonText}>{t('devices.installToDevice')}</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          ) : null}
          {installedFamilyApps.length > 0 ? (
            <>
              <Text style={styles.selectionLabel}>{t('devices.installedOnDevice')}</Text>
              {installedFamilyApps.map((app) => (
                <View key={`installed-${app.slug}`} style={styles.deviceRowCard}>
                  <View style={styles.deviceRowHeadline}>
                    <Text style={styles.networkName}>{app.title}</Text>
                    <Text style={styles.statusTagOnline}>{t('devices.installed')}</Text>
                  </View>
                  {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
                  <Text style={styles.cardCopy}>
                    {t('devices.suitableFor')}{formatSpaceTemplateList(app.spaceTemplates) || t('devices.anySpace')}
                  </Text>
                  <Text style={styles.cardCopy}>
                    {app.supportsProactiveMessages ? t('devices.canRemind') : t('devices.respondOnly')}
                    {app.supportsPrivateRelay ? ` · ${t('devices.supportsRelay')}` : ''}
                    {app.requiresOwnerConfirmation ? ` · ${t('devices.relayNeedsAdmin')}` : ''}
                  </Text>
                  <View style={styles.inlineActions}>
                    <Pressable
                      style={styles.secondaryButtonSmall}
                      onPress={() => onUninstallInstalledFamilyApp(app.slug)}
                      disabled={settingsBusy}
                    >
                      <Text style={styles.secondaryButtonText}>{t('devices.removeFromDevice')}</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          ) : null}
          <Text style={styles.selectionLabel}>{t('devices.availableOnDevice')}</Text>
          {availableFamilyApps.map((app) => (
            <View key={`catalog-${app.slug}`} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{app.title}</Text>
                <Text style={styles.tagMuted}>{describeFamilyAppRiskLevel(app.riskLevel)}</Text>
              </View>
              {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
              <Text style={styles.cardCopy}>
                {t('devices.suitableFor')}{formatSpaceTemplateList(app.spaceTemplates) || t('devices.anySpace')}
              </Text>
              {app.capabilities.length > 0 ? (
                <Text style={styles.cardCopy}>
                  {t('devices.mainAbility')}{formatFamilyAppCapabilities(app.capabilities)}
                </Text>
              ) : null}
              <View style={styles.inlineActions}>
                <Pressable
                  style={styles.primaryButtonSmall}
                  onPress={() => onInstallSelectedFamilyApp(app.slug)}
                  disabled={settingsBusy}
                >
                  <Text style={styles.primaryButtonText}>{t('devices.install')}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}
