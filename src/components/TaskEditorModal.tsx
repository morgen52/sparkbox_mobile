import React from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useT } from '../i18n';
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
  const t = useT();
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
          <Text style={styles.selectionLabel}>{editingTask ? t('taskEditor.editTitle') : t('taskEditor.newTitle')}</Text>
          <Text style={styles.selectionTitle}>
            {editingTask
              ? editingTask.name
              : activeSpaceName
                ? t('taskEditor.sharedTask', { name: activeSpaceName })
                : taskScope === 'family'
                  ? t('taskEditor.sharedGeneric')
                  : t('taskEditor.privateTask')}
          </Text>
          <Text style={styles.selectionCopy}>{taskEditorCopy}</Text>
          <TextInput
            autoCapitalize="sentences"
            autoCorrect={false}
            placeholder={t('taskEditor.taskName')}
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={taskName}
            onChangeText={onChangeTaskName}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t('taskEditor.whenToRun')}
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={taskCronExpr}
            onChangeText={onChangeTaskCronExpr}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={canManage ? t('taskEditor.whatToDo') : t('taskEditor.whatToDoPlaceholder')}
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
                  {t('taskEditor.routineTask')}
                </Text>
              </Pressable>
              <Pressable
                style={styles.segmentedOption}
                onPress={() => onChangeTaskCommandType('shell')}
              >
                <Text style={[styles.segmentedOptionLabel, commandIndex === 1 ? styles.segmentedOptionLabelActive : null]}>
                  {t('taskEditor.customCommand')}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.cardCopy}>{t('taskEditor.runMode')}</Text>
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
                {t('taskEditor.pause')}
              </Text>
            </Pressable>
            <Pressable
              style={styles.segmentedOption}
              onPress={() => setTaskEnabled(true)}
            >
              <Text style={[styles.segmentedOptionLabel, enabledIndex === 1 ? styles.segmentedOptionLabelActive : null]}>
                {t('taskEditor.enableNow')}
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
              <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={styles.primaryButtonSmall}
              onPress={onSubmit}
              disabled={tasksBusy}
            >
              {tasksBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{editingTask ? t('taskEditor.save') : t('taskEditor.create')}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
