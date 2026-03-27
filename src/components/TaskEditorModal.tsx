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
          <Text style={styles.selectionLabel}>{editingTask ? '编辑任务' : '新建任务'}</Text>
          <Text style={styles.selectionTitle}>
            {editingTask
              ? editingTask.name
              : activeSpaceName
                ? `${activeSpaceName} 例行任务`
                : taskScope === 'family'
                  ? '共享 Sparkbox 例行任务'
                  : '私密 Sparkbox 例行任务'}
          </Text>
          <Text style={styles.selectionCopy}>{taskEditorCopy}</Text>
          <TextInput
            autoCapitalize="sentences"
            autoCorrect={false}
            placeholder="任务名称"
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={taskName}
            onChangeText={onChangeTaskName}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="什么时候执行？"
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={taskCronExpr}
            onChangeText={onChangeTaskCronExpr}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={canManage ? '让 Sparkbox 做什么？' : '希望 Sparkbox 帮你做什么？'}
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
                      {kind === 'zeroclaw' ? 'Sparkbox 例行任务' : '自定义命令'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.cardCopy}>运行模式：Sparkbox 例行任务</Text>
          )}
          <Pressable
            style={[styles.scopePill, taskEnabled ? styles.scopePillActive : null]}
            onPress={onToggleTaskEnabled}
          >
            <Text style={[styles.scopePillLabel, taskEnabled ? styles.scopePillLabelActive : null]}>
              {taskEnabled ? '立即启用' : '先暂停'}
            </Text>
          </Pressable>
          {tasksError ? <Text style={styles.errorText}>{tasksError}</Text> : null}
          <View style={styles.inlineActions}>
            <Pressable
              style={styles.secondaryButtonSmall}
              onPress={onRequestClose}
              disabled={tasksBusy}
            >
              <Text style={styles.secondaryButtonText}>取消</Text>
            </Pressable>
            <Pressable
              style={styles.primaryButtonSmall}
              onPress={onSubmit}
              disabled={tasksBusy}
            >
              {tasksBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{editingTask ? '保存' : '创建任务'}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
