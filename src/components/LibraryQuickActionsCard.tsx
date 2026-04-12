import React from 'react';
import { Text, View } from 'react-native';
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
  return (
    <View style={styles.settingsCard}>
      <Text style={styles.selectionLabel}>快捷操作</Text>
      <Text style={styles.cardCopy}>
        常用创建入口都放在这里，方便随时使用。
      </Text>
      <View style={styles.inlineActions}>
        <Pressable
          accessibilityRole="button"
          style={[styles.primaryButtonSmall, (!onlineDeviceAvailable || !canCreateTasks) ? styles.networkRowDisabled : null]}
          onPress={onOpenTaskEditor}
          disabled={!onlineDeviceAvailable || !canCreateTasks}
        >
          <Text style={styles.primaryButtonText}>新建任务</Text>
        </Pressable>
      </View>
    </View>
  );
}
