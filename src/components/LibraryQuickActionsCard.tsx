import React from 'react';
import { Text, View } from 'react-native';
import { useT } from '../i18n';
import { AnimatedPressable as Pressable } from './AnimatedPressable';

type LibraryQuickActionsCardProps = {
  styles: Record<string, any>;
  onlineDeviceAvailable: boolean;
  canCreateTasks: boolean;
  onOpenTaskEditor: () => void;
};

export function LibraryQuickActionsCard({
  styles,
  onlineDeviceAvailable,
  canCreateTasks,
  onOpenTaskEditor,
}: LibraryQuickActionsCardProps) {
  const t = useT();
  return (
    <View style={styles.settingsCard}>
      <Text style={styles.selectionLabel}>{t('quickActions.title')}</Text>
      <Text style={styles.cardCopy}>
        {t('quickActions.copy')}
      </Text>
      <View style={styles.inlineActions}>
        <Pressable
          accessibilityRole="button"
          style={[styles.primaryButtonSmall, (!onlineDeviceAvailable || !canCreateTasks) ? styles.networkRowDisabled : null]}
          onPress={onOpenTaskEditor}
          disabled={!onlineDeviceAvailable || !canCreateTasks}
        >
          <Text style={styles.primaryButtonText}>{t('quickActions.newTask')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
