import React from 'react';
import { ActivityIndicator, LayoutChangeEvent, Pressable, Text, TextInput, View } from 'react-native';
import type { AuthMode } from '../authFlow';

type InvitePreview = {
  householdName: string;
  role: 'owner' | 'member';
  spaceName?: string | null;
};

type AuthSetupCardProps = {
  styles: Record<string, any>;
  authCardTitle: string;
  authCardCopy: string;
  authMode: AuthMode;
  email: string;
  displayName: string;
  inviteCode: string;
  password: string;
  invitePreviewBusy: boolean;
  invitePreviewError: string;
  invitePreview: InvitePreview | null;
  authError: string;
  authBusy: boolean;
  authSubmitLabel: string;
  onLayout: (event: LayoutChangeEvent) => void;
  onChangeAuthMode: (mode: AuthMode) => void;
  onChangeEmail: (value: string) => void;
  onChangeDisplayName: (value: string) => void;
  onChangeInviteCode: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
  renderInvitePreviewSummary: (householdName: string, spaceName?: string | null) => string;
};

type SignedInSetupCardProps = {
  styles: Record<string, any>;
  displayName: string;
  householdName: string;
  canReturnToShell: boolean;
  onLogout: () => void;
  onReturnToShell: () => void;
  onResetFlow: () => void;
};

export function AuthSetupCard({
  styles,
  authCardTitle,
  authCardCopy,
  authMode,
  email,
  displayName,
  inviteCode,
  password,
  invitePreviewBusy,
  invitePreviewError,
  invitePreview,
  authError,
  authBusy,
  authSubmitLabel,
  onLayout,
  onChangeAuthMode,
  onChangeEmail,
  onChangeDisplayName,
  onChangeInviteCode,
  onChangePassword,
  onSubmit,
  renderInvitePreviewSummary,
}: AuthSetupCardProps) {
  return (
    <View style={styles.card} onLayout={onLayout}>
      <Text style={styles.cardTitle}>{authCardTitle}</Text>
      <Text style={styles.cardCopy}>{authCardCopy}</Text>
      <View style={styles.authModeRow}>
        {([
          { id: 'login', label: '登录' },
          { id: 'register', label: '注册' },
          { id: 'join', label: '加入家庭' },
        ] as Array<{ id: AuthMode; label: string }>).map((modeOption) => {
          const active = authMode === modeOption.id;
          return (
            <Pressable
              key={modeOption.id}
              style={[styles.scopePill, active ? styles.scopePillActive : null]}
              onPress={() => onChangeAuthMode(modeOption.id)}
            >
              <Text style={[styles.scopePillLabel, active ? styles.scopePillLabelActive : null]}>
                {modeOption.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="邮箱"
        placeholderTextColor="#7e8a83"
        style={styles.input}
        value={email}
        onChangeText={onChangeEmail}
      />
      {authMode === 'register' || authMode === 'join' ? (
        <TextInput
          placeholder="昵称"
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={displayName}
          onChangeText={onChangeDisplayName}
        />
      ) : null}
      {authMode === 'join' ? (
        <>
          <TextInput
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="邀请码"
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={inviteCode}
            onChangeText={onChangeInviteCode}
          />
          {invitePreviewBusy ? (
            <Text style={styles.cardCopy}>正在校验邀请码...</Text>
          ) : invitePreview ? (
            <Text style={styles.cardCopy}>
              {renderInvitePreviewSummary(invitePreview.householdName, invitePreview.spaceName)}
            </Text>
          ) : invitePreviewError ? (
            <Text style={styles.errorText}>{invitePreviewError}</Text>
          ) : null}
        </>
      ) : null}
      <TextInput
        secureTextEntry
        placeholder="密码"
        placeholderTextColor="#7e8a83"
        style={styles.input}
        value={password}
        onChangeText={onChangePassword}
      />
      {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
      <Pressable style={styles.primaryButton} onPress={onSubmit} disabled={authBusy}>
        {authBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{authSubmitLabel}</Text>}
      </Pressable>
    </View>
  );
}

export function SignedInSetupCard({
  styles,
  displayName,
  householdName,
  canReturnToShell,
  onLogout,
  onReturnToShell,
  onResetFlow,
}: SignedInSetupCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>你已登录</Text>
      <Text style={styles.cardCopy}>
        {displayName} · {householdName}
      </Text>
      <View style={styles.inlineActions}>
        <Pressable style={styles.primaryButtonSmall} onPress={onLogout}>
          <Text style={styles.primaryButtonText}>退出登录</Text>
        </Pressable>
        {canReturnToShell ? (
          <Pressable style={styles.secondaryButtonSmall} onPress={onReturnToShell}>
            <Text style={styles.secondaryButtonText}>返回家庭首页</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.secondaryButtonSmall} onPress={onResetFlow}>
            <Text style={styles.secondaryButtonText}>重新开始</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
