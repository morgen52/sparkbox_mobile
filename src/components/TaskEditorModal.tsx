import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import type { HouseholdTaskSummary } from '../householdApi';

type TaskEditorModalProps = {
  styles: Record<string, any>;
  visible: boolean;
  editingTask: HouseholdTaskSummary | null;
  activeSpaceName: string;
  taskScope: 'family' | 'private';
  taskEditorCopy: string;
  canManage: boolean;
  taskName: string;
  taskCronExpr: string;
  taskCommand: string;
  taskCommandType: 'shell' | 'zeroclaw';
  taskEnabled: boolean;
  tasksError: string;
  tasksBusy: boolean;
  onRequestClose: () => void;
  onChangeTaskName: (value: string) => void;
  onChangeTaskCronExpr: (value: string) => void;
  onChangeTaskCommand: (value: string) => void;
  onChangeTaskCommandType: (value: 'shell' | 'zeroclaw') => void;
  onToggleTaskEnabled: () => void;
  onSubmit: () => void;
};

export function TaskEditorModal({
  styles,
  visible,
  editingTask,
  activeSpaceName,
  taskScope,
  taskEditorCopy,
  canManage,
  taskName,
  taskCronExpr,
  taskCommand,
  taskCommandType,
  taskEnabled,
  tasksError,
  tasksBusy,
  onRequestClose,
  onChangeTaskName,
  onChangeTaskCronExpr,
  onChangeTaskCommand,
  onChangeTaskCommandType,
  onToggleTaskEnabled,
  onSubmit,
}: TaskEditorModalProps) {
  return (
    <Modal
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.networkSheetBackdrop}>
        <View style={styles.networkSheetCard}>
          <Text style={styles.selectionLabel}>{editingTask ? 'Edit task' : 'New task'}</Text>
          <Text style={styles.selectionTitle}>
            {editingTask
              ? editingTask.name
              : activeSpaceName
                ? `${activeSpaceName} routine`
                : taskScope === 'family'
                  ? 'Shared Sparkbox routine'
                  : 'Private Sparkbox routine'}
          </Text>
          <Text style={styles.selectionCopy}>{taskEditorCopy}</Text>
          <TextInput
            autoCapitalize="sentences"
            autoCorrect={false}
            placeholder="Task name"
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={taskName}
            onChangeText={onChangeTaskName}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="When should this happen?"
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={taskCronExpr}
            onChangeText={onChangeTaskCronExpr}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={canManage ? 'What should Sparkbox do?' : 'What should Sparkbox do for you?'}
            placeholderTextColor="#7e8a83"
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            value={taskCommand}
            onChangeText={onChangeTaskCommand}
          />
          {canManage ? (
            <View style={styles.scopeRow}>
              {(['zeroclaw', 'shell'] as const).map((kind) => {
                const active = taskCommandType === kind;
                return (
                  <Pressable
                    key={kind}
                    style={[styles.scopePill, active ? styles.scopePillActive : null]}
                    onPress={() => onChangeTaskCommandType(kind)}
                  >
                    <Text style={[styles.scopePillLabel, active ? styles.scopePillLabelActive : null]}>
                      {kind === 'zeroclaw' ? 'Sparkbox routine' : 'Custom command'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.cardCopy}>Run mode: Sparkbox routine</Text>
          )}
          <Pressable
            style={[styles.scopePill, taskEnabled ? styles.scopePillActive : null]}
            onPress={onToggleTaskEnabled}
          >
            <Text style={[styles.scopePillLabel, taskEnabled ? styles.scopePillLabelActive : null]}>
              {taskEnabled ? 'Enabled immediately' : 'Start paused'}
            </Text>
          </Pressable>
          {tasksError ? <Text style={styles.errorText}>{tasksError}</Text> : null}
          <View style={styles.inlineActions}>
            <Pressable
              style={styles.secondaryButtonSmall}
              onPress={onRequestClose}
              disabled={tasksBusy}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.primaryButtonSmall}
              onPress={onSubmit}
              disabled={tasksBusy}
            >
              {tasksBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{editingTask ? 'Save' : 'Create task'}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
