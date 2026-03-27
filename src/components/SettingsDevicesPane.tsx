import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
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
  return (
    <>
      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>设备与网络</Text>
        <Text style={styles.cardCopy}>
          {canReprovisionDevice
            ? '可在这里直接改 Wi-Fi，无需重新扫码。应用会引导完成网络配置，Sparkbox 仍保留在当前家庭中。'
            : '仅管理员可在这里更改 Wi-Fi。成员仍可查看当前家庭绑定的 Sparkbox 设备。'}
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
                  <Text style={styles.secondaryButtonText}>更改 Wi-Fi</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {canManage ? (
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>管理家庭应用</Text>
          <Text style={styles.cardCopy}>
            家庭应用只需在设备安装一次，然后按空间决定是否启用。
          </Text>
          {familyAppsBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
          {activeSpaceName && recommendedFamilyApps.length > 0 ? (
            <>
              <Text style={styles.selectionLabel}>{activeSpaceName} 推荐</Text>
              {recommendedFamilyApps.map((app) => (
                <View key={`recommended-${app.slug}`} style={styles.deviceRowCard}>
                  <View style={styles.deviceRowHeadline}>
                    <Text style={styles.networkName}>{app.title}</Text>
                    <Text style={styles.tagMuted}>{activeSpaceTemplateLabel || '空间'}</Text>
                  </View>
                  {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
                  <Text style={styles.cardCopy}>
                    适用场景：{formatSpaceTemplateList(app.spaceTemplates) || '任意空间'}
                  </Text>
                  {app.capabilities.length > 0 ? (
                    <Text style={styles.cardCopy}>
                      主要能力：{formatFamilyAppCapabilities(app.capabilities)}
                    </Text>
                  ) : null}
                  <View style={styles.inlineActions}>
                    <Pressable
                      style={styles.primaryButtonSmall}
                      onPress={() => onInstallSelectedFamilyApp(app.slug)}
                      disabled={settingsBusy}
                    >
                      <Text style={styles.primaryButtonText}>安装到此设备</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          ) : null}
          {installedFamilyApps.length > 0 ? (
            <>
              <Text style={styles.selectionLabel}>已安装到此设备</Text>
              {installedFamilyApps.map((app) => (
                <View key={`installed-${app.slug}`} style={styles.deviceRowCard}>
                  <View style={styles.deviceRowHeadline}>
                    <Text style={styles.networkName}>{app.title}</Text>
                    <Text style={styles.statusTagOnline}>已安装</Text>
                  </View>
                  {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
                  <Text style={styles.cardCopy}>
                    适用场景：{formatSpaceTemplateList(app.spaceTemplates) || '任意空间'}
                  </Text>
                  <Text style={styles.cardCopy}>
                    {app.supportsProactiveMessages ? '可主动提醒' : '仅在被询问时响应'}
                    {app.supportsPrivateRelay ? ' · 支持私密转达' : ''}
                    {app.requiresOwnerConfirmation ? ' · 转达需管理员确认' : ''}
                  </Text>
                  <View style={styles.inlineActions}>
                    <Pressable
                      style={styles.secondaryButtonSmall}
                      onPress={() => onUninstallInstalledFamilyApp(app.slug)}
                      disabled={settingsBusy}
                    >
                      <Text style={styles.secondaryButtonText}>从此设备移除</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          ) : null}
          <Text style={styles.selectionLabel}>此设备可用</Text>
          {availableFamilyApps.map((app) => (
            <View key={`catalog-${app.slug}`} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{app.title}</Text>
                <Text style={styles.tagMuted}>{describeFamilyAppRiskLevel(app.riskLevel)}</Text>
              </View>
              {app.description ? <Text style={styles.cardCopy}>{app.description}</Text> : null}
              <Text style={styles.cardCopy}>
                适用场景：{formatSpaceTemplateList(app.spaceTemplates) || '任意空间'}
              </Text>
              {app.capabilities.length > 0 ? (
                <Text style={styles.cardCopy}>
                  主要能力：{formatFamilyAppCapabilities(app.capabilities)}
                </Text>
              ) : null}
              <View style={styles.inlineActions}>
                <Pressable
                  style={styles.primaryButtonSmall}
                  onPress={() => onInstallSelectedFamilyApp(app.slug)}
                  disabled={settingsBusy}
                >
                  <Text style={styles.primaryButtonText}>安装</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}
