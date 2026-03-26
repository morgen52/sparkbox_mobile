import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type SettingsSummaryPaneProps = {
  styles: Record<string, any>;
  homeBusy: boolean;
  homeError: string;
  onlineDeviceAvailable: boolean;
  canManage: boolean;
  accountDisplayName: string;
  accountRoleLabel: string;
  settingsNotice: string;
  settingsError: string;
  onBeginNewDeviceOnboarding: () => void;
  onLogout: () => void;
};

export function SettingsSummaryPane({
  styles,
  homeBusy,
  homeError,
  onlineDeviceAvailable,
  canManage,
  accountDisplayName,
  accountRoleLabel,
  settingsNotice,
  settingsError,
  onBeginNewDeviceOnboarding,
  onLogout,
}: SettingsSummaryPaneProps) {
  // Keep the top of Settings lightweight: household status, the currently
  // viewed space, and the signed-in account. Deeper owner/member controls live
  // in the dedicated settings panes below.
  return (
    <>
      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>家庭概览</Text>
        <Text style={styles.cardCopy}>
          {homeBusy
            ? '正在刷新家庭状态...'
            : onlineDeviceAvailable
              ? 'Sparkbox 已就绪，可进行家庭聊天。'
              : '即使 Sparkbox 离线，家庭历史记录仍可查看。'}
        </Text>
        {homeError ? <Text style={styles.errorText}>{homeError}</Text> : null}
        {homeBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
        <View style={styles.inlineActions}>
          {canManage ? (
            <Pressable style={styles.secondaryButtonSmall} onPress={onBeginNewDeviceOnboarding}>
              <Text style={styles.secondaryButtonText}>配置新设备</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>你的账号</Text>
        <Text style={styles.cardCopy}>
          {accountDisplayName} · {accountRoleLabel}权限
        </Text>
        {settingsNotice ? <Text style={styles.noticeText}>{settingsNotice}</Text> : null}
        {settingsError ? <Text style={styles.errorText}>{settingsError}</Text> : null}
        <View style={styles.inlineActions}>
          <Pressable style={styles.secondaryButtonSmall} onPress={onLogout}>
            <Text style={styles.secondaryButtonText}>退出登录</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
