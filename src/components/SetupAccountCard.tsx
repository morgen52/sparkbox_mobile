import React from 'react';
import { ActivityIndicator, LayoutChangeEvent, Text, TextInput, View } from 'react-native';
import { AnimatedPressable as Pressable } from './AnimatedPressable';
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
  const modeMeta: Record<AuthMode, { modeLabel: string; modeHint: string }> = {
    login: {
      modeLabel: '登录',
      modeHint: '已经有账号了？直接登录吧！',
    },
    register: {
      modeLabel: '注册',
      modeHint: '家人没有账号吗？注册一个新账号，创建家庭并邀请家人加入吧！',
    },
    join: {
      modeLabel: '加入家庭',
      modeHint: '有邀请码吗？使用邀请码加入家人创建的家庭吧！',
    },
  };

  return (
    <View style={styles.card} onLayout={onLayout}>
      <Text style={styles.cardTitle}>{authCardTitle}</Text>
      <Text style={styles.cardCopy}>{authCardCopy}</Text>

      <View style={styles.claimPreview}>
        <Text style={styles.claimPreviewLabel}>第一步</Text>
        <Text style={styles.claimPreviewValue}>账号登录</Text>
        <Text style={styles.cardCopy}>{modeMeta[authMode].modeHint}</Text>
      </View>

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

      <Text style={styles.selectionLabel}>邮箱</Text>
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
        <>
          <Text style={styles.selectionLabel}>昵称</Text>
          <TextInput
            placeholder="昵称"
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={displayName}
            onChangeText={onChangeDisplayName}
          />
        </>
      ) : null}
      {authMode === 'join' ? (
        <>
          <Text style={styles.selectionLabel}>邀请码</Text>
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
      <Text style={styles.selectionLabel}>密码</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
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
      <Text style={styles.cardCopy}>
        Tips：家人有账号吗？有的话直接使用邀请码加入吧！
      </Text>
    </View>
  );
}

export function SignedInSetupCard({
  styles,
  displayName,
  householdName,
  canReturnToShell,
  onLogout,
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
        {!canReturnToShell ? (
          <Pressable style={styles.secondaryButtonSmall} onPress={onResetFlow}>
            <Text style={styles.secondaryButtonText}>重新开始</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
