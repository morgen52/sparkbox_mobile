import React from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import {
  describeFileTimestamp,
  describeFileUploader,
  describeLibraryFileListEmptyState,
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
  ChatSessionScope,
  HouseholdChatSessionSummary,
  HouseholdFileEntry,
  HouseholdFileListing,
  HouseholdMemberSummary,
  HouseholdSpaceDetail,
  HouseholdSpaceSummary,
  HouseholdTaskSummary,
  SpaceMemory,
  SpaceSummary,
} from '../householdApi';
import { AnimatedPressable as Pressable } from './AnimatedPressable';
import { describeCaptureSummaryActionLabel, describeSummarySectionCopy } from '../spaceShell';

type SectionCard = {
  title: string;
  copy: string;
};

export type LibrarySectionKey = 'overview' | 'memories' | 'summaries' | 'photos' | 'files' | 'tasks';

type LibraryPaneProps = {
  styles: Record<string, any>;
  activeSpace: HouseholdSpaceSummary | null;
  activeSpaceKindLabel: string;
  activeSpaceDetail: HouseholdSpaceDetail | null;
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
  summaryError: string;
  filesError: string;
  tasksError: string;
  libraryNotice: string;
  summaryNotice: string;
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
  summaryCaptureSessions: HouseholdChatSessionSummary[];
  summaryCaptureSessionsBusy: boolean;
  summaryCapturePickerOpen: boolean;
  selectedSummaryCaptureSessionId: string;
  taskEditorQuickActionsCopy: string;
  activeSection: LibrarySectionKey;
  onChangeActiveSection: (section: LibrarySectionKey) => void;
  onOpenFileEditor: () => void;
  onOpenTaskEditor: () => void;
  onRefreshLibrary: () => void;
  onOpenMemoryEditor: () => void;
  onEditMemory: (memory: SpaceMemory) => void;
  onDeleteMemory: (memory: SpaceMemory) => void;
  onRefreshSummary: () => void;
  onToggleSummaryCapturePicker: () => void;
  onSelectSummaryCaptureSession: (sessionId: string) => void;
  onCaptureSummary: () => void;
  onSaveSummaryAsMemory: (summary: SpaceSummary) => void;
  onDeleteSummary: (summary: SpaceSummary) => void;
  onRefreshPhotos: () => void;
  onUploadPhotos: () => void;
  onDownloadPhoto: (entry: HouseholdFileEntry) => void;
  onDeletePhoto: (entry: HouseholdFileEntry) => void;
  canManageFileEntry: (entry: HouseholdFileEntry) => boolean;
  onRefreshFiles: (path?: string, force?: boolean) => void;
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

export function LibraryPane(props: LibraryPaneProps) {
  const {
    styles,
    activeSpace,
    activeSpaceKindLabel,
    activeSpaceDetail,
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
    summaryError,
    filesError,
    tasksError,
    libraryNotice,
    summaryNotice,
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
    summaryCaptureSessions,
    summaryCaptureSessionsBusy,
    summaryCapturePickerOpen,
    selectedSummaryCaptureSessionId,
    taskEditorQuickActionsCopy,
    activeSection,
    onChangeActiveSection,
    onOpenFileEditor,
    onOpenTaskEditor,
    onRefreshLibrary,
    onOpenMemoryEditor,
    onEditMemory,
    onDeleteMemory,
    onRefreshSummary,
    onToggleSummaryCapturePicker,
    onSelectSummaryCaptureSession,
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
  } = props;

  const selectedSummarySession = summaryCaptureSessions.find((item) => item.id === selectedSummaryCaptureSessionId) ?? null;
  const summarySessionScopeLabel: Record<ChatSessionScope, string> = {
    family: '共享聊天',
    private: '私密聊天',
  };

  const normalizedPath = (currentFilePath || '').replace(/^\/+|\/+$/g, '');
  const pathSegments = normalizedPath ? normalizedPath.split('/') : [];
  const orderedEntries = [...(fileListing?.entries ?? [])].sort((left, right) => {
    if (left.isDir !== right.isDir) {
      return left.isDir ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
  });
  const [fileActionsOpen, setFileActionsOpen] = React.useState(false);
  const [fileActionsEntry, setFileActionsEntry] = React.useState<HouseholdFileEntry | null>(null);

  function closeFileActionsModal(): void {
    setFileActionsOpen(false);
    setFileActionsEntry(null);
  }

  function resolveOverviewSectionKey(title: string): LibrarySectionKey | null {
    const normalized = title.trim().toLowerCase();
    if (normalized === 'memories' || normalized === '记忆') {
      return 'memories';
    }
    if (normalized === 'summaries' || normalized === '摘要') {
      return 'summaries';
    }
    if (normalized === 'photos' || normalized === '照片') {
      return 'photos';
    }
    if (normalized === 'files' || normalized === '文件') {
      return 'files';
    }
    if (normalized === 'tasks' || normalized === '任务') {
      return 'tasks';
    }
    return null;
  }

  function renderSectionHeader(title: string, copy: string): React.ReactNode {
    return (
      <View style={styles.settingsCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Pressable style={styles.summaryRefreshButton} onPress={() => onChangeActiveSection('overview')}>
            <Text style={styles.summaryRefreshButtonText}>返回概览</Text>
          </Pressable>
        </View>
        <Text style={styles.cardCopy}>{copy}</Text>
      </View>
    );
  }

  function renderOverview(): React.ReactNode {
    return (
      <View style={styles.settingsCard}>
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
          {libraryOverviewSections.map((section) => {
            const target = resolveOverviewSectionKey(section.title);
            return (
              <Pressable
                key={section.title}
                style={styles.librarySectionCard}
                onPress={() => target && onChangeActiveSection(target)}
                disabled={!target}
              >
              <Text style={styles.librarySectionTitle}>{section.title}</Text>
              <Text style={styles.librarySectionCopy}>{section.copy}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function renderMemories(): React.ReactNode {
    return (
      <>
        {renderSectionHeader('记忆', `记忆是 Sparkbox 需要长期记住的关键信息，适用于${activeSpace?.name || '当前空间'}。`)}
        <View style={styles.settingsCard}>
          {!canMutateActiveSpaceLibrary && activeSpace?.kind === 'shared' ? (
            <Text style={styles.cardCopy}>共享空间中的记忆由管理员维护，成员仍可查看全部内容。</Text>
          ) : null}
          <View style={styles.inlineActions}>
            <Pressable
              style={[styles.secondaryButtonSmall, !activeSpace ? styles.networkRowDisabled : null]}
              onPress={() => onRefreshLibrary()}
              disabled={!activeSpace || libraryBusy}
            >
              <Text style={styles.secondaryButtonText}>刷新</Text>
            </Pressable>
            {canMutateActiveSpaceLibrary ? (
              <Pressable
                style={[styles.primaryButtonSmall, !activeSpace ? styles.networkRowDisabled : null]}
                onPress={onOpenMemoryEditor}
                disabled={!activeSpace || libraryBusy}
              >
                <Text style={styles.primaryButtonText}>新建记忆</Text>
              </Pressable>
            ) : null}
          </View>
          {memories.length === 0 && !libraryBusy ? <Text style={styles.cardCopy}>还没有保存任何记忆。</Text> : null}
          {memories.map((memory) => (
            <View key={memory.id} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{memory.title}</Text>
                <Text style={memory.pinned ? styles.statusTagOnline : styles.tagMuted}>{memory.pinned ? '置顶' : '记忆'}</Text>
              </View>
              <Text style={styles.cardCopy}>{memory.content}</Text>
              <Text style={styles.cardCopy}>更新于 {describeUiDateTime(memory.updatedAt) || memory.updatedAt}</Text>
              {canMutateActiveSpaceLibrary ? (
                <View style={styles.inlineActions}>
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => onEditMemory(memory)} disabled={libraryBusy}>
                    <Text style={styles.secondaryButtonText}>编辑</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => onDeleteMemory(memory)} disabled={libraryBusy}>
                    <Text style={styles.secondaryButtonText}>删除</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </>
    );
  }

  function renderSummaries(): React.ReactNode {
    return (
      <>
        {renderSectionHeader('摘要', describeSummarySectionCopy(activeSpaceDetail))}
        <View style={styles.settingsCard}>
          <View style={styles.inlineActions}>
            <Pressable
              style={[styles.secondaryButtonSmall, !activeSpace ? styles.networkRowDisabled : null]}
              onPress={() => onRefreshSummary()}
              disabled={!activeSpace || libraryBusy}
            >
              <Text style={styles.secondaryButtonText}>刷新</Text>
            </Pressable>
          </View>
          <Pressable
            style={[styles.summarySessionPickerButton, summaryCaptureSessionsBusy ? styles.networkRowDisabled : null]}
            onPress={onToggleSummaryCapturePicker}
            disabled={summaryCaptureSessionsBusy || summaryCaptureSessions.length === 0}
          >
            <View style={styles.summarySessionPickerInner}>
              <Text style={styles.summarySessionPickerText}>
                {selectedSummarySession ? `已选聊天：${selectedSummarySession.name}` : '选择用于生成摘要的聊天'}
              </Text>
              <Text style={styles.summarySessionPickerChevron}>{summaryCapturePickerOpen ? '˄' : '˅'}</Text>
            </View>
          </Pressable>
          {summaryCapturePickerOpen ? (
            <View style={styles.summarySessionPickerPopover}>
              <Text style={styles.summarySessionPickerPopoverTitle}>本空间聊天列表</Text>
              {summaryCaptureSessions.map((sessionItem) => {
                const selected = sessionItem.id === selectedSummaryCaptureSessionId;
                const ownSession = sessionItem.ownerUserId === currentUserId;
                return (
                  <Pressable
                    key={sessionItem.id}
                    style={styles.summarySessionPickerRow}
                    onPress={() => onSelectSummaryCaptureSession(sessionItem.id)}
                  >
                    <View style={styles.summarySessionPickerRowBody}>
                      <Text style={styles.summarySessionPickerRowTitle}>{sessionItem.name}</Text>
                      <Text style={styles.summarySessionPickerRowCopy}>
                        {summarySessionScopeLabel[sessionItem.scope]} · {ownSession ? '你创建' : '空间成员创建'}
                      </Text>
                    </View>
                    <Text style={selected ? styles.statusTagOnline : styles.tagMuted}>
                      {selected ? '已选中' : canMutateActiveSpaceLibrary ? '可生成摘要' : '仅管理员可生成摘要'}
                    </Text>
                  </Pressable>
                );
              })}
              {summaryCaptureSessions.length === 0 ? <Text style={styles.cardCopy}>当前空间还没有可用聊天。</Text> : null}
            </View>
          ) : null}
          {summaryNotice ? <Text style={styles.noticeText}>{summaryNotice}</Text> : null}
          {summaryError ? <Text style={styles.errorText}>{summaryError}</Text> : null}
          {summaryCaptureSessionsBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
          {canMutateActiveSpaceLibrary ? (
            <Pressable
              style={[styles.primaryButtonSmall, !selectedSummaryCaptureSessionId ? styles.networkRowDisabled : null]}
              onPress={onCaptureSummary}
              disabled={!selectedSummaryCaptureSessionId || libraryBusy || summaryCaptureSessionsBusy}
            >
              <Text style={styles.primaryButtonText}>{describeCaptureSummaryActionLabel(activeSpaceDetail)}</Text>
            </Pressable>
          ) : null}
          <Text style={styles.cardCopy}>{summaryEmptyStateCopy}</Text>
          {summaries.length === 0 && !libraryBusy ? <Text style={styles.cardCopy}>暂无摘要。</Text> : null}
          {summaries.map((summary) => (
            <View key={summary.id} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{summary.title}</Text>
                <Text style={styles.tagMuted}>{summary.sourceLabel || '摘要'}</Text>
              </View>
              <Text style={styles.cardCopy}>{summary.content}</Text>
              <Text style={styles.cardCopy}>创建于 {describeUiDateTime(summary.createdAt) || summary.createdAt}</Text>
              {canMutateActiveSpaceLibrary ? (
                <View style={styles.inlineActions}>
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => onSaveSummaryAsMemory(summary)} disabled={libraryBusy}>
                    <Text style={styles.secondaryButtonText}>存为记忆</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => onDeleteSummary(summary)} disabled={libraryBusy}>
                    <Text style={styles.secondaryButtonText}>删除</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </>
    );
  }

  function renderPhotos(): React.ReactNode {
    return (
      <>
        {renderSectionHeader('照片', '照片会作为这个空间的共享记录保存，而不仅是普通上传文件。')}
        <View style={styles.settingsCard}>
          {!canMutateActiveSpaceFiles && activeSpace?.kind === 'shared' ? (
            <Text style={styles.cardCopy}>共享照片由管理员维护，成员仍可浏览和下载本空间已有照片。</Text>
          ) : null}
          <View style={styles.inlineActions}>
            <Pressable
              style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
              onPress={() => onRefreshPhotos()}
              disabled={!onlineDeviceAvailable || filesBusy}
            >
              <Text style={styles.secondaryButtonText}>刷新照片</Text>
            </Pressable>
            {canMutateActiveSpaceFiles ? (
              <Pressable
                style={[styles.primaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
                onPress={onUploadPhotos}
                disabled={!onlineDeviceAvailable || filesBusy}
              >
                <Text style={styles.primaryButtonText}>上传照片</Text>
              </Pressable>
            ) : null}
          </View>
          {photoEntries.length === 0 && !filesBusy ? <Text style={styles.cardCopy}>{describeLibraryPhotoEmptyState(fileSpace)}</Text> : null}
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
                <Pressable style={styles.secondaryButtonSmall} onPress={() => onDownloadPhoto(entry)} disabled={filesBusy}>
                  <Text style={styles.secondaryButtonText}>下载</Text>
                </Pressable>
                {canManageFileEntry(entry) ? (
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => onDeletePhoto(entry)} disabled={filesBusy}>
                    <Text style={styles.secondaryButtonText}>删除</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </>
    );
  }

  function renderFiles(): React.ReactNode {
    function openFileEntryActions(entry: HouseholdFileEntry): void {
      setFileActionsEntry(entry);
      setFileActionsOpen(true);
    }

    return (
      <>
        <Modal
          animationType="slide"
          presentationStyle="overFullScreen"
          transparent
          visible={fileActionsOpen}
          onRequestClose={closeFileActionsModal}
        >
          <View style={styles.networkSheetBackdrop}>
            <View style={styles.networkSheetCard}>
              <Text style={styles.selectionLabel}>{fileActionsEntry?.isDir ? '文件夹操作' : '文件操作'}</Text>
              <Text style={styles.selectionTitle}>{fileActionsEntry?.name || '当前条目'}</Text>
              <Text style={styles.selectionCopy}>选择你要执行的操作。</Text>

              <View style={styles.inlineActions}>
                {!fileActionsEntry?.isDir ? (
                  <Pressable
                    style={styles.secondaryButtonSmall}
                    onPress={() => {
                      const entry = fileActionsEntry;
                      closeFileActionsModal();
                      if (entry) {
                        onDownloadFile(entry);
                      }
                    }}
                    disabled={filesBusy}
                  >
                    <Text style={styles.secondaryButtonText}>下载</Text>
                  </Pressable>
                ) : null}

                {fileActionsEntry && canManageFileEntry(fileActionsEntry) ? (
                  <Pressable
                    style={styles.secondaryButtonSmall}
                    onPress={() => {
                      const entry = fileActionsEntry;
                      closeFileActionsModal();
                      if (entry) {
                        onRenameFile(entry);
                      }
                    }}
                    disabled={filesBusy}
                  >
                    <Text style={styles.secondaryButtonText}>重命名</Text>
                  </Pressable>
                ) : null}

                {fileActionsEntry && canManageFileEntry(fileActionsEntry) ? (
                  <Pressable
                    style={styles.secondaryButtonSmall}
                    onPress={() => {
                      const entry = fileActionsEntry;
                      closeFileActionsModal();
                      if (entry) {
                        onDeleteFile(entry);
                      }
                    }}
                    disabled={filesBusy}
                  >
                    <Text style={styles.secondaryButtonText}>删除</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.inlineActions}>
                <Pressable
                  style={styles.secondaryButtonSmall}
                  onPress={closeFileActionsModal}
                  disabled={filesBusy}
                >
                  <Text style={styles.secondaryButtonText}>取消</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.settingsCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>文件资源管理器</Text>
            <Pressable style={styles.summaryRefreshButton} onPress={() => onChangeActiveSection('overview')}>
              <Text style={styles.summaryRefreshButtonText}>返回概览</Text>
            </Pressable>
          </View>
          <Text style={styles.cardCopy}>
            {onlineDeviceAvailable
              ? `浏览 ${activeSpace ? activeSpace.name : '当前空间'} 的文件夹结构。`
              : '请先让 Sparkbox 在线，再浏览或更新此空间文件。'}
          </Text>
          {filesNotice ? <Text style={styles.noticeText}>{filesNotice}</Text> : null}
          {filesError ? <Text style={styles.errorText}>{filesError}</Text> : null}

          <View style={styles.inlineActions}>
            <Pressable
              style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
              onPress={() => onRefreshFiles(undefined, true)}
              disabled={!onlineDeviceAvailable || filesBusy}
            >
              <Text style={styles.secondaryButtonText}>刷新</Text>
            </Pressable>
            {canMutateActiveSpaceFiles ? (
              <>
                <Pressable
                  style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
                  onPress={onOpenFileEditor}
                  disabled={!onlineDeviceAvailable || filesBusy}
                >
                  <Text style={styles.secondaryButtonText}>新建文件夹</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
                  onPress={onUploadFiles}
                  disabled={!onlineDeviceAvailable || filesBusy}
                >
                  <Text style={styles.primaryButtonText}>上传文件</Text>
                </Pressable>
              </>
            ) : null}
          </View>

        </View>

        <View style={styles.settingsCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>目录内容</Text>
            <Pressable
              style={[styles.summaryRefreshButton, !fileListing?.parent ? styles.networkRowDisabled : null]}
              onPress={() => onRefreshFiles(fileListing?.parent || '')}
              disabled={!fileListing?.parent || filesBusy}
            >
              <Text style={styles.summaryRefreshButtonText}>上级目录</Text>
            </Pressable>
          </View>
          <Text style={styles.cardCopy}>当前目录：{pathSegments.length ? `/${pathSegments.join('/')}` : '/'}</Text>
          {filesBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
          {!filesBusy && orderedEntries.length === 0 ? (
            <Text style={styles.cardCopy}>{describeLibraryFileListEmptyState(fileSpace)}</Text>
          ) : null}
          {orderedEntries.map((entry) => (
            <Pressable
              key={entry.path}
              style={[styles.libraryExplorerRow, entry.isDir ? styles.libraryExplorerRowFolder : null]}
              onPress={entry.isDir ? () => onRefreshFiles(entry.path) : undefined}
              disabled={!entry.isDir || filesBusy}
              pressFeedback={entry.isDir ? 'scale' : 'none'}
            >
              <View style={styles.libraryExplorerRowMain}>
                <Text style={styles.libraryExplorerIcon}>{entry.isDir ? '[DIR]' : '[FILE]'}</Text>
                <View style={styles.libraryExplorerMeta}>
                  <Text style={styles.networkName}>{entry.name}</Text>
                  <Text style={styles.cardCopy}>
                    {describeFileTimestamp(entry.modified || '')}
                    {typeof entry.size === 'number' ? ` · ${formatByteSize(entry.size)}` : ''}
                  </Text>
                  {fileSpace === 'family' && entry.uploadedByUserId ? (
                    <Text style={styles.cardCopy}>{describeFileUploader(entry.uploadedByUserId, currentUserId, homeMembers)}</Text>
                  ) : null}
                </View>
              </View>
              <Pressable
                style={styles.libraryExplorerMenuButton}
                onPress={() => openFileEntryActions(entry)}
                disabled={filesBusy}
                pressFeedback="fade"
              >
                <Text style={styles.libraryExplorerMenuButtonText}>⋯</Text>
              </Pressable>
            </Pressable>
          ))}
        </View>
      </>
    );
  }

  function renderTasks(): React.ReactNode {
    return (
      <>
        {renderSectionHeader('任务', onlineDeviceAvailable
          ? `任务会绑定在${activeSpace ? activeSpace.name : '当前空间'}，让例行事项和提醒始终归属正确空间。`
          : '请先让 Sparkbox 在线，再加载或更新此空间的例行任务。')}
        <View style={styles.settingsCard}>
          {tasksNotice ? <Text style={styles.noticeText}>{tasksNotice}</Text> : null}
          {tasksError ? <Text style={styles.errorText}>{tasksError}</Text> : null}
          <View style={styles.inlineActions}>
            <Pressable
              style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
              onPress={() => onRefreshTasks()}
              disabled={!onlineDeviceAvailable || tasksBusy}
            >
              <Text style={styles.secondaryButtonText}>刷新</Text>
            </Pressable>
            {canCreateTasks ? (
              <Pressable
                style={[styles.primaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
                onPress={() => onOpenTaskEditor()}
                disabled={!onlineDeviceAvailable || tasksBusy}
              >
                <Text style={styles.primaryButtonText}>新建任务</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.cardCopy}>{taskEditorQuickActionsCopy}</Text>
          {!canManage && taskScope === 'family' ? (
            <Text style={styles.cardCopy}>成员可以执行共享例行任务，但仅管理员可创建或编辑。</Text>
          ) : null}
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>{describeLibraryTaskListTitle(taskScope)}</Text>
          {tasksBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
          {!tasksBusy && tasks.length === 0 ? <Text style={styles.cardCopy}>{describeLibraryTaskListEmptyState(taskScope)}</Text> : null}
          {tasks.map((task) => (
            <View key={task.id} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{task.name}</Text>
                <Text style={task.enabled ? styles.statusTagOnline : styles.statusTagOffline}>{describeTaskEnabledState(task.enabled)}</Text>
              </View>
              <Text style={styles.cardCopy}>{describeTaskSchedule(task.cronExpr)}</Text>
              <Text style={styles.cardCopy}>{describeTaskExecution(task.commandType, task.scope)}</Text>
              {task.lastStatus ? (
                <Text style={styles.cardCopy}>
                  最近执行：{task.lastStatus}
                  {task.lastRunAt ? ` · ${describeUiDateTime(task.lastRunAt) || task.lastRunAt}` : ''}
                </Text>
              ) : null}
              {task.lastOutput ? (
                <Text numberOfLines={3} style={styles.cardCopy}>最近输出：{task.lastOutput}</Text>
              ) : null}
              <View style={styles.inlineActions}>
                <Pressable
                  style={[styles.secondaryButtonSmall, !canTriggerTask(task) ? styles.networkRowDisabled : null]}
                  onPress={() => onRunTask(task)}
                  disabled={!canTriggerTask(task) || tasksBusy}
                >
                  <Text style={styles.secondaryButtonText}>立即执行</Text>
                </Pressable>
                <Pressable style={styles.secondaryButtonSmall} onPress={() => onOpenTaskHistory(task)} disabled={tasksBusy}>
                  <Text style={styles.secondaryButtonText}>历史记录</Text>
                </Pressable>
                {canEditTask(task) ? (
                  <>
                    <Pressable style={styles.secondaryButtonSmall} onPress={() => onEditTask(task)} disabled={tasksBusy}>
                      <Text style={styles.secondaryButtonText}>编辑</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButtonSmall} onPress={() => onDeleteTask(task)} disabled={tasksBusy}>
                      <Text style={styles.secondaryButtonText}>删除</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </>
    );
  }

  if (activeSection === 'overview') {
    return <>{renderOverview()}</>;
  }
  if (activeSection === 'memories') {
    return <>{renderMemories()}</>;
  }
  if (activeSection === 'summaries') {
    return <>{renderSummaries()}</>;
  }
  if (activeSection === 'photos') {
    return <>{renderPhotos()}</>;
  }
  if (activeSection === 'files') {
    return <>{renderFiles()}</>;
  }
  return <>{renderTasks()}</>;
}
