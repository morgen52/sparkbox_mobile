import React, { useState } from 'react';
import { ActivityIndicator, Modal, Text, TextInput, View } from 'react-native';
import { AnimatedPressable as Pressable } from './AnimatedPressable';

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
  onDeleteAccount: (password: string) => void;
  deleteAccountBusy: boolean;
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
  onDeleteAccount,
  deleteAccountBusy,
}: SettingsSummaryPaneProps) {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const deleteDisabled = deleteAccountBusy || !onlineDeviceAvailable;

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

      <View style={[styles.settingsCard, { borderColor: deleteDisabled ? '#ccc' : '#dc2626', borderWidth: 1 }]}>
        <Text style={[styles.cardTitle, { color: deleteDisabled ? '#999' : '#dc2626' }]}>危险操作</Text>
        <Text style={styles.cardCopy}>
          {onlineDeviceAvailable
            ? '注销账户将永久删除你的所有数据，包括聊天记录、文件和设置。此操作不可撤销。'
            : '需要先通过「配置新设备」连接到 Sparkbox 设备后，才能注销账户。'}
        </Text>
        <View style={styles.inlineActions}>
          <Pressable
            style={[
              styles.secondaryButtonSmall,
              { borderColor: deleteDisabled ? '#ccc' : '#dc2626' },
            ]}
            onPress={() => { setConfirmPassword(''); setConfirmModalOpen(true); }}
            disabled={deleteDisabled}
          >
            {deleteAccountBusy ? (
              <ActivityIndicator color="#dc2626" size="small" />
            ) : (
              <Text style={[styles.secondaryButtonText, { color: deleteDisabled ? '#999' : '#dc2626' }]}>
                注销账户
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
            <Text style={{ fontSize: 17, fontWeight: '600', marginBottom: 8, color: '#dc2626' }}>
              注销账户
            </Text>
            <Text style={{ fontSize: 14, color: '#555', marginBottom: 16, lineHeight: 20 }}>
              此操作不可撤销。你的所有数据（聊天记录、文件、设置）将被永久删除。{'\n\n'}请输入密码以确认：
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
              placeholder="输入登录密码"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <Pressable
                style={[styles.secondaryButtonSmall]}
                onPress={() => setConfirmModalOpen(false)}
              >
                <Text style={styles.secondaryButtonText}>取消</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryButtonSmall, { borderColor: '#dc2626' }]}
                disabled={!confirmPassword.trim()}
                onPress={() => {
                  setConfirmModalOpen(false);
                  onDeleteAccount(confirmPassword.trim());
                }}
              >
                <Text style={[styles.secondaryButtonText, { color: confirmPassword.trim() ? '#dc2626' : '#999' }]}>
                  确认注销
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
