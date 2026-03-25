import React from 'react';
import { Pressable, Text, View } from 'react-native';

type LibraryQuickActionsCardProps = {
  styles: Record<string, any>;
  canMutateActiveSpaceFiles: boolean;
  onlineDeviceAvailable: boolean;
  filesBusy: boolean;
  canCreateTasks: boolean;
  onOpenFileEditor: () => void;
  onOpenTaskEditor: () => void;
};

export function LibraryQuickActionsCard({
  styles,
  canMutateActiveSpaceFiles,
  onlineDeviceAvailable,
  filesBusy,
  canCreateTasks,
  onOpenFileEditor,
  onOpenTaskEditor,
}: LibraryQuickActionsCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.selectionLabel}>快捷操作</Text>
      <Text style={styles.cardCopy}>
        常用创建入口都放在这里，方便随时使用。
      </Text>
      <View style={styles.inlineActions}>
        {canMutateActiveSpaceFiles ? (
          <Pressable
            android_ripple={{ color: 'rgba(23,53,42,0.14)' }}
            accessibilityRole="button"
            style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
            onPress={onOpenFileEditor}
            disabled={!onlineDeviceAvailable || filesBusy}
          >
            <Text style={styles.secondaryButtonText}>新建文件夹</Text>
          </Pressable>
        ) : null}
        <Pressable
          android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
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
