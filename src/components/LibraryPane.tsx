import React from 'react';
import { ActivityIndicator, Pressable, Text, TouchableOpacity, View } from 'react-native';
import {
  describeFileTimestamp,
  describeFileUploader,
  describeLibraryFileListEmptyState,
  describeLibraryFileListTitle,
  describeLibraryPhotoEmptyState,
  describeLibraryTaskListEmptyState,
  describeLibraryTaskListTitle,
  describeTaskEnabledState,
  describeTaskExecution,
  describeTaskSchedule,
  describeUiDateTime,
  formatByteSize,
} from '../appShell';
import type {
  HouseholdFileEntry,
  HouseholdFileListing,
  HouseholdMemberSummary,
  HouseholdSpaceDetail,
  HouseholdSpaceSummary,
  HouseholdTaskSummary,
  SpaceMemory,
  SpaceSummary,
} from '../householdApi';
import { describeCaptureSummaryActionLabel, describeSummarySectionCopy } from '../spaceShell';

type SectionCard = {
  title: string;
  copy: string;
};

type LibraryPaneProps = {
  styles: Record<string, any>;
  activeSpace: HouseholdSpaceSummary | null;
  activeSpaceKindLabel: string;
  activeSpaceDetail: HouseholdSpaceDetail | null;
  activeChatSessionId: string;
  activeSpaceNameFallback: string;
  fileSpace: 'family' | 'private';
  taskScope: 'family' | 'private';
  onlineDeviceAvailable: boolean;
  canCreateTasks: boolean;
  canManage: boolean;
  canMutateActiveSpaceFiles: boolean;
  canMutateActiveSpaceLibrary: boolean;
  libraryBusy: boolean;
  filesBusy: boolean;
  tasksBusy: boolean;
  libraryError: string;
  filesError: string;
  tasksError: string;
  libraryNotice: string;
  filesNotice: string;
  tasksNotice: string;
  currentFilePath: string;
  libraryOverviewSections: SectionCard[];
  memories: SpaceMemory[];
  summaries: SpaceSummary[];
  photoEntries: HouseholdFileEntry[];
  fileListing: HouseholdFileListing | null;
  tasks: HouseholdTaskSummary[];
  homeMembers: HouseholdMemberSummary[];
  currentUserId: string;
  summaryEmptyStateCopy: string;
  taskEditorQuickActionsCopy: string;
  onOpenFileEditor: () => void;
  onOpenTaskEditor: () => void;
  onRefreshLibrary: () => void;
  onOpenMemoryEditor: () => void;
  onEditMemory: (memory: SpaceMemory) => void;
  onDeleteMemory: (memory: SpaceMemory) => void;
  onCaptureSummary: () => void;
  onSaveSummaryAsMemory: (summary: SpaceSummary) => void;
  onDeleteSummary: (summary: SpaceSummary) => void;
  onRefreshPhotos: () => void;
  onUploadPhotos: () => void;
  onDownloadPhoto: (entry: HouseholdFileEntry) => void;
  onDeletePhoto: (entry: HouseholdFileEntry) => void;
  canManageFileEntry: (entry: HouseholdFileEntry) => boolean;
  onRefreshFiles: (path?: string) => void;
  onUploadFiles: () => void;
  onDownloadFile: (entry: HouseholdFileEntry) => void;
  onRenameFile: (entry: HouseholdFileEntry) => void;
  onDeleteFile: (entry: HouseholdFileEntry) => void;
  onRefreshTasks: () => void;
  canEditTask: (task: HouseholdTaskSummary) => boolean;
  canTriggerTask: (task: HouseholdTaskSummary) => boolean;
  onRunTask: (task: HouseholdTaskSummary) => void;
  onOpenTaskHistory: (task: HouseholdTaskSummary) => void;
  onEditTask: (task: HouseholdTaskSummary) => void;
  onDeleteTask: (task: HouseholdTaskSummary) => void;
};

export function LibraryPane({
  styles,
  activeSpace,
  activeSpaceKindLabel,
  activeSpaceDetail,
  activeChatSessionId,
  activeSpaceNameFallback,
  fileSpace,
  taskScope,
  onlineDeviceAvailable,
  canCreateTasks,
  canManage,
  canMutateActiveSpaceFiles,
  canMutateActiveSpaceLibrary,
  libraryBusy,
  filesBusy,
  tasksBusy,
  libraryError,
  filesError,
  tasksError,
  libraryNotice,
  filesNotice,
  tasksNotice,
  currentFilePath,
  libraryOverviewSections,
  memories,
  summaries,
  photoEntries,
  fileListing,
  tasks,
  homeMembers,
  currentUserId,
  summaryEmptyStateCopy,
  taskEditorQuickActionsCopy,
  onOpenFileEditor,
  onOpenTaskEditor,
  onRefreshLibrary,
  onOpenMemoryEditor,
  onEditMemory,
  onDeleteMemory,
  onCaptureSummary,
  onSaveSummaryAsMemory,
  onDeleteSummary,
  onRefreshPhotos,
  onUploadPhotos,
  onDownloadPhoto,
  onDeletePhoto,
  canManageFileEntry,
  onRefreshFiles,
  onUploadFiles,
  onDownloadFile,
  onRenameFile,
  onDeleteFile,
  onRefreshTasks,
  canEditTask,
  canTriggerTask,
  onRunTask,
  onOpenTaskHistory,
  onEditTask,
  onDeleteTask,
}: LibraryPaneProps) {
  const folderLabel = (currentFilePath || activeSpace?.name || activeSpaceNameFallback).replace(/^\/+/, '');

  return (
    <>
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Library overview</Text>
        <Text style={styles.cardCopy}>
          {activeSpace
            ? `${activeSpace.name} (${activeSpaceKindLabel}) keeps its memories, summaries, photos, files, and tasks together.`
            : 'Pick a space to browse what Sparkbox has saved there.'}
        </Text>
        {libraryNotice ? <Text style={styles.noticeText}>{libraryNotice}</Text> : null}
        {libraryError ? <Text style={styles.errorText}>{libraryError}</Text> : null}
        {libraryBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
        <View style={styles.libraryGrid}>
          {libraryOverviewSections.map((section) => (
            <View key={section.title} style={styles.librarySectionCard}>
              <Text style={styles.librarySectionTitle}>{section.title}</Text>
              <Text style={styles.librarySectionCopy}>{section.copy}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.cardCopy}>
          Everything Sparkbox has saved for this space shows up here in one place.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Memories in this space</Text>
        <Text style={styles.cardCopy}>
          Memories are the key details Sparkbox should remember for {activeSpace?.name || 'this space'}.
        </Text>
        {!canMutateActiveSpaceLibrary && activeSpace?.kind === 'shared' ? (
          <Text style={styles.cardCopy}>
            Owners update the shared memories and summaries here. Members can still read everything in this space library.
          </Text>
        ) : null}
        <View style={styles.inlineActions}>
          <TouchableOpacity
            style={[styles.secondaryButtonSmall, !activeSpace ? styles.networkRowDisabled : null]}
            onPress={() => onRefreshLibrary()}
            disabled={!activeSpace || libraryBusy}
          >
            <Text style={styles.secondaryButtonText}>Refresh</Text>
          </TouchableOpacity>
          {canMutateActiveSpaceLibrary ? (
            <TouchableOpacity
              style={[styles.primaryButtonSmall, !activeSpace ? styles.networkRowDisabled : null]}
              onPress={onOpenMemoryEditor}
              disabled={!activeSpace || libraryBusy}
            >
              <Text style={styles.primaryButtonText}>New memory</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {memories.length === 0 && !libraryBusy ? (
          <Text style={styles.cardCopy}>Nothing has been saved to Memories yet.</Text>
        ) : null}
        {memories.map((memory) => (
          <View key={memory.id} style={styles.deviceRowCard}>
            <View style={styles.deviceRowHeadline}>
              <Text style={styles.networkName}>{memory.title}</Text>
              <Text style={memory.pinned ? styles.statusTagOnline : styles.tagMuted}>
                {memory.pinned ? 'pinned' : 'memory'}
              </Text>
            </View>
            <Text style={styles.cardCopy}>{memory.content}</Text>
            <Text style={styles.cardCopy}>
              Updated {describeUiDateTime(memory.updatedAt) || memory.updatedAt}
            </Text>
            {canMutateActiveSpaceLibrary ? (
              <View style={styles.inlineActions}>
                <TouchableOpacity
                  style={styles.secondaryButtonSmall}
                  onPress={() => onEditMemory(memory)}
                  disabled={libraryBusy}
                >
                  <Text style={styles.secondaryButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButtonSmall}
                  onPress={() => onDeleteMemory(memory)}
                  disabled={libraryBusy}
                >
                  <Text style={styles.secondaryButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Summaries in this space</Text>
        <Text style={styles.cardCopy}>{describeSummarySectionCopy(activeSpaceDetail)}</Text>
        <View style={styles.inlineActions}>
          <TouchableOpacity
            style={[styles.secondaryButtonSmall, !activeSpace ? styles.networkRowDisabled : null]}
            onPress={() => onRefreshLibrary()}
            disabled={!activeSpace || libraryBusy}
          >
            <Text style={styles.secondaryButtonText}>Refresh</Text>
          </TouchableOpacity>
          {canMutateActiveSpaceLibrary ? (
            <TouchableOpacity
              style={[styles.primaryButtonSmall, !activeChatSessionId ? styles.networkRowDisabled : null]}
              onPress={onCaptureSummary}
              disabled={!activeChatSessionId || libraryBusy}
            >
              <Text style={styles.primaryButtonText}>{describeCaptureSummaryActionLabel(activeSpaceDetail)}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.cardCopy}>{summaryEmptyStateCopy}</Text>
        {summaries.length === 0 && !libraryBusy ? (
          <Text style={styles.cardCopy}>No summaries yet.</Text>
        ) : null}
        {summaries.map((summary) => (
          <View key={summary.id} style={styles.deviceRowCard}>
            <View style={styles.deviceRowHeadline}>
              <Text style={styles.networkName}>{summary.title}</Text>
              <Text style={styles.tagMuted}>{summary.sourceLabel || 'summary'}</Text>
            </View>
            <Text style={styles.cardCopy}>{summary.content}</Text>
            <Text style={styles.cardCopy}>
              Created {describeUiDateTime(summary.createdAt) || summary.createdAt}
            </Text>
            {canMutateActiveSpaceLibrary ? (
              <View style={styles.inlineActions}>
                <TouchableOpacity
                  style={styles.secondaryButtonSmall}
                  onPress={() => onSaveSummaryAsMemory(summary)}
                  disabled={libraryBusy}
                >
                  <Text style={styles.secondaryButtonText}>Save as memory</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButtonSmall}
                  onPress={() => onDeleteSummary(summary)}
                  disabled={libraryBusy}
                >
                  <Text style={styles.secondaryButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Photos in this space</Text>
        <Text style={styles.cardCopy}>
          Photos belong to this space as shared moments, not just as generic uploads.
        </Text>
        {!canMutateActiveSpaceFiles && activeSpace?.kind === 'shared' ? (
          <Text style={styles.cardCopy}>
            Owners manage shared photos here. Members can still browse and download what is already in this space.
          </Text>
        ) : null}
        <View style={styles.inlineActions}>
          <TouchableOpacity
            style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
            onPress={() => onRefreshPhotos()}
            disabled={!onlineDeviceAvailable || filesBusy}
          >
            <Text style={styles.secondaryButtonText}>Refresh photos</Text>
          </TouchableOpacity>
          {canMutateActiveSpaceFiles ? (
            <TouchableOpacity
              style={[styles.primaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
              onPress={onUploadPhotos}
              disabled={!onlineDeviceAvailable || filesBusy}
            >
              <Text style={styles.primaryButtonText}>Upload photos</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {photoEntries.length === 0 && !filesBusy ? (
          <Text style={styles.cardCopy}>{describeLibraryPhotoEmptyState(fileSpace)}</Text>
        ) : null}
        {photoEntries.map((entry) => (
          <View key={`photo-${entry.path}`} style={styles.deviceRowCard}>
            <View style={styles.deviceRowHeadline}>
              <Text style={styles.networkName}>{entry.name}</Text>
              <Text style={styles.statusTagOnline}>photo</Text>
            </View>
            <Text style={styles.cardCopy}>
              {describeFileTimestamp(entry.modified || '')}
              {typeof entry.size === 'number' ? ` · ${formatByteSize(entry.size)}` : ''}
            </Text>
            <View style={styles.inlineActions}>
              <TouchableOpacity
                style={styles.secondaryButtonSmall}
                onPress={() => onDownloadPhoto(entry)}
                disabled={filesBusy}
              >
                <Text style={styles.secondaryButtonText}>Download</Text>
              </TouchableOpacity>
              {canManageFileEntry(entry) ? (
                <TouchableOpacity
                  style={styles.secondaryButtonSmall}
                  onPress={() => onDeletePhoto(entry)}
                  disabled={filesBusy}
                >
                  <Text style={styles.secondaryButtonText}>Delete</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Files in this space</Text>
        <Text style={styles.cardCopy}>
          {onlineDeviceAvailable
            ? `Files stay inside ${activeSpace ? activeSpace.name : 'this space'} so each space can keep its own working materials separate.`
            : 'Bring Sparkbox online to browse or update the files for this space.'}
        </Text>
        {!canMutateActiveSpaceFiles && activeSpace?.kind === 'shared' ? (
          <Text style={styles.cardCopy}>
            Owners manage shared files and folders here. Members can still open and download what is already in this space.
          </Text>
        ) : null}
        {filesNotice ? <Text style={styles.noticeText}>{filesNotice}</Text> : null}
        {filesError ? <Text style={styles.errorText}>{filesError}</Text> : null}
        <Text style={styles.cardCopy}>Viewing folder: {folderLabel}</Text>
        <View style={styles.inlineActions}>
          <TouchableOpacity
            style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
            onPress={() => onRefreshFiles()}
            disabled={!onlineDeviceAvailable || filesBusy}
          >
            <Text style={styles.secondaryButtonText}>Refresh</Text>
          </TouchableOpacity>
          {canMutateActiveSpaceFiles ? (
            <TouchableOpacity
              style={[styles.primaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
              onPress={onUploadFiles}
              disabled={!onlineDeviceAvailable || filesBusy}
            >
              <Text style={styles.primaryButtonText}>Upload</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {fileListing?.parent ? (
          <TouchableOpacity style={styles.secondaryButtonSmall} onPress={() => onRefreshFiles(fileListing.parent || '')}>
            <Text style={styles.secondaryButtonText}>Go up</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{describeLibraryFileListTitle(fileSpace)}</Text>
        {filesBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
        {!filesBusy && (fileListing?.entries.length ?? 0) === 0 ? (
          <Text style={styles.cardCopy}>{describeLibraryFileListEmptyState(fileSpace)}</Text>
        ) : null}
        {fileListing?.entries.map((entry) => (
          <View key={entry.path} style={styles.deviceRowCard}>
            <View style={styles.deviceRowHeadline}>
              <Text style={styles.networkName}>{entry.name}</Text>
              <Text style={entry.isDir ? styles.statusTagOnline : styles.statusTagOffline}>
                {entry.isDir ? 'folder' : 'file'}
              </Text>
            </View>
            <Text style={styles.cardCopy}>
              {describeFileTimestamp(entry.modified || '')}
              {typeof entry.size === 'number' ? ` · ${formatByteSize(entry.size)}` : ''}
            </Text>
            {fileSpace === 'family' && entry.uploadedByUserId ? (
              <Text style={styles.cardCopy}>
                {describeFileUploader(entry.uploadedByUserId, currentUserId, homeMembers)}
              </Text>
            ) : null}
            <View style={styles.inlineActions}>
              {entry.isDir ? (
                <TouchableOpacity
                  style={styles.secondaryButtonSmall}
                  onPress={() => onRefreshFiles(entry.path)}
                >
                  <Text style={styles.secondaryButtonText}>Open</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.secondaryButtonSmall}
                  onPress={() => onDownloadFile(entry)}
                  disabled={filesBusy}
                >
                  <Text style={styles.secondaryButtonText}>Download</Text>
                </TouchableOpacity>
              )}
              {canManageFileEntry(entry) ? (
                <>
                  <TouchableOpacity
                    style={styles.secondaryButtonSmall}
                    onPress={() => onRenameFile(entry)}
                    disabled={filesBusy}
                  >
                    <Text style={styles.secondaryButtonText}>Rename</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButtonSmall}
                    onPress={() => onDeleteFile(entry)}
                    disabled={filesBusy}
                  >
                    <Text style={styles.secondaryButtonText}>Delete</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tasks in this space</Text>
        <Text style={styles.cardCopy}>
          {onlineDeviceAvailable
            ? `Tasks stay attached to ${activeSpace ? activeSpace.name : 'this space'} so routines and reminders stay with the right space.`
            : 'Bring Sparkbox online to load or update the routines for this space.'}
        </Text>
        {tasksNotice ? <Text style={styles.noticeText}>{tasksNotice}</Text> : null}
        {tasksError ? <Text style={styles.errorText}>{tasksError}</Text> : null}
        <View style={styles.inlineActions}>
          <TouchableOpacity
            style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
            onPress={() => onRefreshTasks()}
            disabled={!onlineDeviceAvailable || tasksBusy}
          >
            <Text style={styles.secondaryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardCopy}>{taskEditorQuickActionsCopy}</Text>
        {!canManage && taskScope === 'family' ? (
          <Text style={styles.cardCopy}>
            Members can run shared routines here, but only owners can create or edit them.
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{describeLibraryTaskListTitle(taskScope)}</Text>
        {tasksBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
        {!tasksBusy && tasks.length === 0 ? (
          <Text style={styles.cardCopy}>{describeLibraryTaskListEmptyState(taskScope)}</Text>
        ) : null}
        {tasks.map((task) => (
          <View key={task.id} style={styles.deviceRowCard}>
            <View style={styles.deviceRowHeadline}>
              <Text style={styles.networkName}>{task.name}</Text>
              <Text style={task.enabled ? styles.statusTagOnline : styles.statusTagOffline}>
                {describeTaskEnabledState(task.enabled)}
              </Text>
            </View>
            <Text style={styles.cardCopy}>{describeTaskSchedule(task.cronExpr)}</Text>
            <Text style={styles.cardCopy}>
              {describeTaskExecution(task.commandType, task.scope)}
            </Text>
            {task.lastStatus ? (
              <Text style={styles.cardCopy}>
                Last run: {task.lastStatus}
                {task.lastRunAt ? ` · ${describeUiDateTime(task.lastRunAt) || task.lastRunAt}` : ''}
              </Text>
            ) : null}
            {task.lastOutput ? (
              <Text numberOfLines={3} style={styles.cardCopy}>
                Latest note: {task.lastOutput}
              </Text>
            ) : null}
            <View style={styles.inlineActions}>
              <TouchableOpacity
                style={[styles.secondaryButtonSmall, !canTriggerTask(task) ? styles.networkRowDisabled : null]}
                onPress={() => onRunTask(task)}
                disabled={!canTriggerTask(task) || tasksBusy}
              >
                <Text style={styles.secondaryButtonText}>Run now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButtonSmall}
                onPress={() => onOpenTaskHistory(task)}
                disabled={tasksBusy}
              >
                <Text style={styles.secondaryButtonText}>History</Text>
              </TouchableOpacity>
              {canEditTask(task) ? (
                <>
                  <TouchableOpacity
                    style={styles.secondaryButtonSmall}
                    onPress={() => onEditTask(task)}
                    disabled={tasksBusy}
                  >
                    <Text style={styles.secondaryButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButtonSmall}
                    onPress={() => onDeleteTask(task)}
                    disabled={tasksBusy}
                  >
                    <Text style={styles.secondaryButtonText}>Delete</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </>
  );
}
