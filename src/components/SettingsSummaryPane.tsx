import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import type { Locale } from '../i18n';
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
  const { locale, setLocale, t } = useI18n();

  // Keep the top of Settings lightweight: household status, the currently
  // viewed space, and the signed-in account. Deeper owner/member controls live
  // in the dedicated settings panes below.
  return (
    <>
      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('settingsSummary.householdTitle')}</Text>
        <Text style={styles.cardCopy}>
          {homeBusy
            ? t('settingsSummary.loading')
            : onlineDeviceAvailable
              ? t('settingsSummary.online')
              : t('settingsSummary.offline')}
        </Text>
        {homeError ? <Text style={styles.errorText}>{homeError}</Text> : null}
        {homeBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
        <View style={styles.inlineActions}>
          {canManage ? (
            <Pressable style={styles.secondaryButtonSmall} onPress={onBeginNewDeviceOnboarding}>
              <Text style={styles.secondaryButtonText}>{t('settingsSummary.configNewDevice')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('settingsSummary.accountTitle')}</Text>
        <Text style={styles.cardCopy}>
          {t('settingsSummary.accountCopy', { name: accountDisplayName, role: accountRoleLabel })}
        </Text>
        {settingsNotice ? <Text style={styles.noticeText}>{settingsNotice}</Text> : null}
        {settingsError ? <Text style={styles.errorText}>{settingsError}</Text> : null}
        <View style={styles.inlineActions}>
          <Pressable style={styles.secondaryButtonSmall} onPress={onLogout}>
            <Text style={styles.secondaryButtonText}>{t('settingsSummary.logout')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('settings.language.title')}</Text>
        <View style={styles.inlineActions}>
          {(['zh', 'en'] as Locale[]).map((l) => (
            <Pressable
              key={l}
              style={[styles.scopePill, locale === l ? styles.scopePillActive : null]}
              onPress={() => setLocale(l)}
            >
              <Text style={locale === l ? styles.scopePillLabelActive : styles.scopePillLabel}>
                {t(`settings.language.${l}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </>
  );
}
