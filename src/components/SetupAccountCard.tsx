import React from 'react';
import { ActivityIndicator, LayoutChangeEvent, Text, TextInput, View } from 'react-native';
import { useT } from '../i18n';
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
  const t = useT();
  const modeMeta: Record<AuthMode, { modeLabel: string; modeHint: string }> = {
    login: {
      modeLabel: t('setupAccount.login'),
      modeHint: t('setupAccount.loginCopy'),
    },
    register: {
      modeLabel: t('setupAccount.register'),
      modeHint: t('setupAccount.registerCopy'),
    },
    join: {
      modeLabel: t('setupAccount.joinHousehold'),
      modeHint: t('setupAccount.joinCopy'),
    },
  };

  return (
    <View style={styles.card} onLayout={onLayout}>
      <Text style={styles.cardTitle}>{authCardTitle}</Text>
      <Text style={styles.cardCopy}>{authCardCopy}</Text>

      <View style={styles.claimPreview}>
        <Text style={styles.claimPreviewLabel}>{t('setupAccount.step1')}</Text>
        <Text style={styles.claimPreviewValue}>{t('setupAccount.accountLogin')}</Text>
        <Text style={styles.cardCopy}>{modeMeta[authMode].modeHint}</Text>
      </View>

      <View style={styles.authModeRow}>
        {([
          { id: 'login', label: t('setupAccount.loginLabel') },
          { id: 'register', label: t('setupAccount.registerLabel') },
          { id: 'join', label: t('setupAccount.joinLabel') },
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

      <Text style={styles.selectionLabel}>{t('setupAccount.email')}</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder={t('setupAccount.emailPlaceholder')}
        placeholderTextColor="#7e8a83"
        style={styles.input}
        value={email}
        onChangeText={onChangeEmail}
      />
      {authMode === 'register' || authMode === 'join' ? (
        <>
          <Text style={styles.selectionLabel}>{t('setupAccount.nickname')}</Text>
          <TextInput
            placeholder={t('setupAccount.nicknamePlaceholder')}
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={displayName}
            onChangeText={onChangeDisplayName}
          />
        </>
      ) : null}
      {authMode === 'join' ? (
        <>
          <Text style={styles.selectionLabel}>{t('setupAccount.inviteCode')}</Text>
          <TextInput
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={t('setupAccount.inviteCodePlaceholder')}
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={inviteCode}
            onChangeText={onChangeInviteCode}
          />
          {invitePreviewBusy ? (
            <Text style={styles.cardCopy}>{t('setupAccount.validatingCode')}</Text>
          ) : invitePreview ? (
            <Text style={styles.cardCopy}>
              {renderInvitePreviewSummary(invitePreview.householdName, invitePreview.spaceName)}
            </Text>
          ) : invitePreviewError ? (
            <Text style={styles.errorText}>{invitePreviewError}</Text>
          ) : null}
        </>
      ) : null}
      <Text style={styles.selectionLabel}>{t('setupAccount.password')}</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        placeholder={t('setupAccount.passwordPlaceholder')}
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
        {t('setupAccount.tip')}
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
  const t = useT();
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('setupAccount.loggedIn')}</Text>
      <Text style={styles.cardCopy}>
        {displayName} · {householdName}
      </Text>
      <View style={styles.inlineActions}>
        <Pressable style={styles.primaryButtonSmall} onPress={onLogout}>
          <Text style={styles.primaryButtonText}>{t('setupAccount.logout')}</Text>
        </Pressable>
        {!canReturnToShell ? (
          <Pressable style={styles.secondaryButtonSmall} onPress={onResetFlow}>
            <Text style={styles.secondaryButtonText}>{t('setupAccount.restart')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
