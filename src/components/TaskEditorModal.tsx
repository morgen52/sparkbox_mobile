import React from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, Text, TextInput, View } from 'react-native';
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
  const commandSliderX = React.useRef(new Animated.Value(0)).current;
  const enabledSliderX = React.useRef(new Animated.Value(0)).current;
  const [commandSegmentWidth, setCommandSegmentWidth] = React.useState(0);
  const [enabledSegmentWidth, setEnabledSegmentWidth] = React.useState(0);

  const commandOptionWidth = commandSegmentWidth > 0 ? commandSegmentWidth / 2 : 0;
  const enabledOptionWidth = enabledSegmentWidth > 0 ? enabledSegmentWidth / 2 : 0;
  const commandIndex = taskCommandType === 'zeroclaw' ? 0 : 1;
  const enabledIndex = taskEnabled ? 1 : 0;

  React.useEffect(() => {
    if (commandOptionWidth <= 0) {
      return;
    }
    Animated.timing(commandSliderX, {
      toValue: commandIndex * commandOptionWidth,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [commandIndex, commandOptionWidth, commandSliderX]);

  React.useEffect(() => {
    if (enabledOptionWidth <= 0) {
      return;
    }
    Animated.timing(enabledSliderX, {
      toValue: enabledIndex * enabledOptionWidth,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [enabledIndex, enabledOptionWidth, enabledSliderX]);

  function setTaskEnabled(nextEnabled: boolean): void {
    if (nextEnabled !== taskEnabled) {
      onToggleTaskEnabled();
    }
  }

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
            <View
              style={styles.segmentedControl}
              onLayout={(event) => setCommandSegmentWidth(event.nativeEvent.layout.width)}
            >
              {commandOptionWidth > 0 ? (
                <Animated.View
                  style={[
                    styles.segmentedSlider,
                    {
                      width: commandOptionWidth,
                      transform: [{ translateX: commandSliderX }],
                    },
                  ]}
                />
              ) : null}
              <Pressable
                style={styles.segmentedOption}
                onPress={() => onChangeTaskCommandType('zeroclaw')}
              >
                <Text style={[styles.segmentedOptionLabel, commandIndex === 0 ? styles.segmentedOptionLabelActive : null]}>
                  Sparkbox 例行任务
                </Text>
              </Pressable>
              <Pressable
                style={styles.segmentedOption}
                onPress={() => onChangeTaskCommandType('shell')}
              >
                <Text style={[styles.segmentedOptionLabel, commandIndex === 1 ? styles.segmentedOptionLabelActive : null]}>
                  自定义命令
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.cardCopy}>运行模式：Sparkbox 例行任务</Text>
          )}
          <View
            style={styles.segmentedControl}
            onLayout={(event) => setEnabledSegmentWidth(event.nativeEvent.layout.width)}
          >
            {enabledOptionWidth > 0 ? (
              <Animated.View
                style={[
                  styles.segmentedSlider,
                  {
                    width: enabledOptionWidth,
                    transform: [{ translateX: enabledSliderX }],
                  },
                ]}
              />
            ) : null}
            <Pressable
              style={styles.segmentedOption}
              onPress={() => setTaskEnabled(false)}
            >
              <Text style={[styles.segmentedOptionLabel, enabledIndex === 0 ? styles.segmentedOptionLabelActive : null]}>
                先暂停
              </Text>
            </Pressable>
            <Pressable
              style={styles.segmentedOption}
              onPress={() => setTaskEnabled(true)}
            >
              <Text style={[styles.segmentedOptionLabel, enabledIndex === 1 ? styles.segmentedOptionLabelActive : null]}>
                立即启用
              </Text>
            </Pressable>
          </View>
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
