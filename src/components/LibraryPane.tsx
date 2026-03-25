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
  // Library is intentionally one pane because memories, summaries, files,
  // photos, and tasks all pivot on the same active-space context and share the
  // same owner/member gating rules.
  const folderLabel = (currentFilePath || activeSpace?.name || activeSpaceNameFallback).replace(/^\/+/, '');

  return (
    <>
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>资料库概览</Text>
        <Text style={styles.cardCopy}>
          {activeSpace
            ? `${activeSpace.name}（${activeSpaceKindLabel}）会把记忆、摘要、照片、文件和任务集中管理。`
            : '先选择一个空间，再查看 Sparkbox 在其中保存的内容。'}
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
          Sparkbox 在这个空间保存的内容都会集中显示在这里。
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>本空间记忆</Text>
        <Text style={styles.cardCopy}>
          记忆是 Sparkbox 需要长期记住的关键信息，适用于{activeSpace?.name || '当前空间'}。
        </Text>
        {!canMutateActiveSpaceLibrary && activeSpace?.kind === 'shared' ? (
          <Text style={styles.cardCopy}>
            共享空间中的记忆和摘要由管理员维护，成员仍可查看此空间资料库中的全部内容。
          </Text>
        ) : null}
        <View style={styles.inlineActions}>
          <TouchableOpacity
            style={[styles.secondaryButtonSmall, !activeSpace ? styles.networkRowDisabled : null]}
            onPress={() => onRefreshLibrary()}
            disabled={!activeSpace || libraryBusy}
          >
            <Text style={styles.secondaryButtonText}>刷新</Text>
          </TouchableOpacity>
          {canMutateActiveSpaceLibrary ? (
            <TouchableOpacity
              style={[styles.primaryButtonSmall, !activeSpace ? styles.networkRowDisabled : null]}
              onPress={onOpenMemoryEditor}
              disabled={!activeSpace || libraryBusy}
            >
              <Text style={styles.primaryButtonText}>新建记忆</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {memories.length === 0 && !libraryBusy ? (
          <Text style={styles.cardCopy}>还没有保存任何记忆。</Text>
        ) : null}
        {memories.map((memory) => (
          <View key={memory.id} style={styles.deviceRowCard}>
            <View style={styles.deviceRowHeadline}>
              <Text style={styles.networkName}>{memory.title}</Text>
              <Text style={memory.pinned ? styles.statusTagOnline : styles.tagMuted}>
                {memory.pinned ? '置顶' : '记忆'}
              </Text>
            </View>
            <Text style={styles.cardCopy}>{memory.content}</Text>
            <Text style={styles.cardCopy}>
              更新于 {describeUiDateTime(memory.updatedAt) || memory.updatedAt}
            </Text>
            {canMutateActiveSpaceLibrary ? (
              <View style={styles.inlineActions}>
                <TouchableOpacity
                  style={styles.secondaryButtonSmall}
                  onPress={() => onEditMemory(memory)}
                  disabled={libraryBusy}
                >
                  <Text style={styles.secondaryButtonText}>编辑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButtonSmall}
                  onPress={() => onDeleteMemory(memory)}
                  disabled={libraryBusy}
                >
                  <Text style={styles.secondaryButtonText}>删除</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>本空间摘要</Text>
        <Text style={styles.cardCopy}>{describeSummarySectionCopy(activeSpaceDetail)}</Text>
        <View style={styles.inlineActions}>
          <TouchableOpacity
            style={[styles.secondaryButtonSmall, !activeSpace ? styles.networkRowDisabled : null]}
            onPress={() => onRefreshLibrary()}
            disabled={!activeSpace || libraryBusy}
          >
            <Text style={styles.secondaryButtonText}>刷新</Text>
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
          <Text style={styles.cardCopy}>暂无摘要。</Text>
        ) : null}
        {summaries.map((summary) => (
          <View key={summary.id} style={styles.deviceRowCard}>
            <View style={styles.deviceRowHeadline}>
              <Text style={styles.networkName}>{summary.title}</Text>
              <Text style={styles.tagMuted}>{summary.sourceLabel || '摘要'}</Text>
            </View>
            <Text style={styles.cardCopy}>{summary.content}</Text>
            <Text style={styles.cardCopy}>
              创建于 {describeUiDateTime(summary.createdAt) || summary.createdAt}
            </Text>
            {canMutateActiveSpaceLibrary ? (
              <View style={styles.inlineActions}>
                <TouchableOpacity
                  style={styles.secondaryButtonSmall}
                  onPress={() => onSaveSummaryAsMemory(summary)}
                  disabled={libraryBusy}
                >
                  <Text style={styles.secondaryButtonText}>存为记忆</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButtonSmall}
                  onPress={() => onDeleteSummary(summary)}
                  disabled={libraryBusy}
                >
                  <Text style={styles.secondaryButtonText}>删除</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>本空间照片</Text>
        <Text style={styles.cardCopy}>
          照片会作为这个空间的共享记录保存，而不仅是普通上传文件。
        </Text>
        {!canMutateActiveSpaceFiles && activeSpace?.kind === 'shared' ? (
          <Text style={styles.cardCopy}>
            共享照片由管理员维护，成员仍可浏览和下载本空间已有照片。
          </Text>
        ) : null}
        <View style={styles.inlineActions}>
          <TouchableOpacity
            style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
            onPress={() => onRefreshPhotos()}
            disabled={!onlineDeviceAvailable || filesBusy}
          >
            <Text style={styles.secondaryButtonText}>刷新照片</Text>
          </TouchableOpacity>
          {canMutateActiveSpaceFiles ? (
            <TouchableOpacity
              style={[styles.primaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
              onPress={onUploadPhotos}
              disabled={!onlineDeviceAvailable || filesBusy}
            >
              <Text style={styles.primaryButtonText}>上传照片</Text>
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
              <Text style={styles.statusTagOnline}>照片</Text>
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
                <Text style={styles.secondaryButtonText}>下载</Text>
              </TouchableOpacity>
              {canManageFileEntry(entry) ? (
                <TouchableOpacity
                  style={styles.secondaryButtonSmall}
                  onPress={() => onDeletePhoto(entry)}
                  disabled={filesBusy}
                >
                  <Text style={styles.secondaryButtonText}>删除</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>本空间文件</Text>
        <Text style={styles.cardCopy}>
          {onlineDeviceAvailable
            ? `文件会保存在${activeSpace ? activeSpace.name : '当前空间'}内，便于不同空间各自管理资料。`
            : '请先让 Sparkbox 在线，再浏览或更新此空间文件。'}
        </Text>
        {!canMutateActiveSpaceFiles && activeSpace?.kind === 'shared' ? (
          <Text style={styles.cardCopy}>
            共享文件与文件夹由管理员维护，成员仍可打开和下载本空间已有内容。
          </Text>
        ) : null}
        {filesNotice ? <Text style={styles.noticeText}>{filesNotice}</Text> : null}
        {filesError ? <Text style={styles.errorText}>{filesError}</Text> : null}
        <Text style={styles.cardCopy}>当前目录：{folderLabel}</Text>
        <View style={styles.inlineActions}>
          <TouchableOpacity
            style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
            onPress={() => onRefreshFiles()}
            disabled={!onlineDeviceAvailable || filesBusy}
          >
            <Text style={styles.secondaryButtonText}>刷新</Text>
          </TouchableOpacity>
          {canMutateActiveSpaceFiles ? (
            <TouchableOpacity
              style={[styles.primaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
              onPress={onUploadFiles}
              disabled={!onlineDeviceAvailable || filesBusy}
            >
              <Text style={styles.primaryButtonText}>上传</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {fileListing?.parent ? (
          <TouchableOpacity style={styles.secondaryButtonSmall} onPress={() => onRefreshFiles(fileListing.parent || '')}>
            <Text style={styles.secondaryButtonText}>返回上级</Text>
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
                {entry.isDir ? '文件夹' : '文件'}
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
                  <Text style={styles.secondaryButtonText}>打开</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.secondaryButtonSmall}
                  onPress={() => onDownloadFile(entry)}
                  disabled={filesBusy}
                >
                  <Text style={styles.secondaryButtonText}>下载</Text>
                </TouchableOpacity>
              )}
              {canManageFileEntry(entry) ? (
                <>
                  <TouchableOpacity
                    style={styles.secondaryButtonSmall}
                    onPress={() => onRenameFile(entry)}
                    disabled={filesBusy}
                  >
                    <Text style={styles.secondaryButtonText}>重命名</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButtonSmall}
                    onPress={() => onDeleteFile(entry)}
                    disabled={filesBusy}
                  >
                    <Text style={styles.secondaryButtonText}>删除</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>本空间任务</Text>
        <Text style={styles.cardCopy}>
          {onlineDeviceAvailable
            ? `任务会绑定在${activeSpace ? activeSpace.name : '当前空间'}，让例行事项和提醒始终归属正确空间。`
            : '请先让 Sparkbox 在线，再加载或更新此空间的例行任务。'}
        </Text>
        {tasksNotice ? <Text style={styles.noticeText}>{tasksNotice}</Text> : null}
        {tasksError ? <Text style={styles.errorText}>{tasksError}</Text> : null}
        <View style={styles.inlineActions}>
          <TouchableOpacity
            style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
            onPress={() => onRefreshTasks()}
            disabled={!onlineDeviceAvailable || tasksBusy}
          >
            <Text style={styles.secondaryButtonText}>刷新</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardCopy}>{taskEditorQuickActionsCopy}</Text>
        {!canManage && taskScope === 'family' ? (
          <Text style={styles.cardCopy}>
            成员可以执行共享例行任务，但仅管理员可创建或编辑。
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
                <Text style={styles.secondaryButtonText}>立即执行</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButtonSmall}
                onPress={() => onOpenTaskHistory(task)}
                disabled={tasksBusy}
              >
                <Text style={styles.secondaryButtonText}>历史记录</Text>
              </TouchableOpacity>
              {canEditTask(task) ? (
                <>
                  <TouchableOpacity
                    style={styles.secondaryButtonSmall}
                    onPress={() => onEditTask(task)}
                    disabled={tasksBusy}
                  >
                    <Text style={styles.secondaryButtonText}>编辑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButtonSmall}
                    onPress={() => onDeleteTask(task)}
                    disabled={tasksBusy}
                  >
                    <Text style={styles.secondaryButtonText}>删除</Text>
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
