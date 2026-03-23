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
      <Text style={styles.selectionLabel}>Quick actions</Text>
      <Text style={styles.cardCopy}>
        The creation shortcuts live here so they are always easy to reach.
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
            <Text style={styles.secondaryButtonText}>New folder</Text>
          </Pressable>
        ) : null}
        <Pressable
          android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
          accessibilityRole="button"
          style={[styles.primaryButtonSmall, (!onlineDeviceAvailable || !canCreateTasks) ? styles.networkRowDisabled : null]}
          onPress={onOpenTaskEditor}
          disabled={!onlineDeviceAvailable || !canCreateTasks}
        >
          <Text style={styles.primaryButtonText}>New task</Text>
        </Pressable>
      </View>
    </View>
  );
}
