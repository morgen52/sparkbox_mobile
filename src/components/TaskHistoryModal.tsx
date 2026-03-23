import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { HouseholdTaskRunSummary, HouseholdTaskSummary } from '../householdApi';
import {
  describeTaskRunFinishedAt,
  describeTaskRunOutput,
  describeTaskRunStartedAt,
  describeTaskRunStatus,
} from '../appShell';

type TaskHistoryModalProps = {
  styles: Record<string, any>;
  visible: boolean;
  taskHistoryTask: HouseholdTaskSummary | null;
  taskHistoryRuns: HouseholdTaskRunSummary[];
  onRequestClose: () => void;
};

export function TaskHistoryModal({
  styles,
  visible,
  taskHistoryTask,
  taskHistoryRuns,
  onRequestClose,
}: TaskHistoryModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.scannerOverlay}>
        <View style={[styles.card, { width: '100%', maxWidth: 560, maxHeight: '80%' }]}>
          <Text style={styles.selectionLabel}>Run history</Text>
          <Text style={styles.selectionTitle}>{taskHistoryTask?.name || 'Task history'}</Text>
          <Text style={styles.selectionCopy}>
            Review recent runs, their status, and any captured output without leaving the task tab.
          </Text>
          <ScrollView style={{ maxHeight: 360 }}>
            {taskHistoryRuns.length === 0 ? (
              <Text style={styles.cardCopy}>No runs yet.</Text>
            ) : (
              taskHistoryRuns.map((run) => (
                <View key={run.id} style={styles.deviceRowCard}>
                  <View style={styles.deviceRowHeadline}>
                    <Text style={styles.networkName}>{describeTaskRunStatus(run.status)}</Text>
                    <Text
                      style={
                        describeTaskRunStatus(run.status) === 'Completed'
                          ? styles.statusTagOnline
                          : styles.statusTagOffline
                      }
                    >
                      {describeTaskRunStartedAt(run.startedAt)}
                    </Text>
                  </View>
                  {run.finishedAt ? <Text style={styles.cardCopy}>{describeTaskRunFinishedAt(run.finishedAt)}</Text> : null}
                  {describeTaskRunOutput(run.output || '') ? (
                    <Text style={styles.cardCopy}>{describeTaskRunOutput(run.output || '')}</Text>
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>
          <View style={styles.inlineActions}>
            <Pressable style={styles.secondaryButtonSmall} onPress={onRequestClose}>
              <Text style={styles.secondaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
