import React from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import {
  describeFileTimestamp,
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

export type LibrarySectionKey =
  | 'wiki'
  | 'overview'
  | 'memories'
  | 'summaries'
  | 'photos'
  | 'tasks'
  | 'wiki_upload_file'
  | 'wiki_upload_image'
  | 'wiki_upload_text';

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
  libraryOverviewSections: SectionCard[];
  memories: SpaceMemory[];
  summaries: SpaceSummary[];
  photoEntries: HouseholdFileEntry[];
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
  wikiBusy: boolean;
  wikiError: string;
  wikiNotice: string;
  wikiSourceTitle: string;
  wikiSourceContent: string;
  wikiPages: Array<{ id: string; title: string; summary: string; tags: string[] }>;
  wikiLastIngest: {
    operationId: string;
    pageId: string;
    title: string;
    summary: string;
    sourceType: string;
    directoryMode?: string;
    directoryFallbackReason?: string | null;
    directoryModelBudgetSeconds?: number;
    directoryProvider?: string;
    directoryModel?: string;
    directoryProviderTimeoutSeconds?: number;
  } | null;
  wikiDirectoryLastUpdatedAt: string;
  wikiRawFileCount: number;
  wikiUploadSourceType: 'note' | 'document' | 'image';

  onChangeActiveSection: (section: LibrarySectionKey) => void;
  onChangeWikiSourceTitle: (value: string) => void;
  onChangeWikiSourceContent: (value: string) => void;
  onRunWikiIngest: () => void;
  onRunWikiDirectoryConsistencyCheck: () => void;
  onRefreshWikiPages: () => void;
  onPickAndIngestWikiUploads: () => void;
  onRefreshWikiDirectory: () => void;
  onRenameWikiRawRecord: (rawPath: string, newName: string) => void;
  onDeleteWikiRawRecord: (rawPath: string) => void;
  onChangeWikiUploadSourceType: (value: 'note' | 'document' | 'image') => void;

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
    libraryOverviewSections,
    memories,
    summaries,
    photoEntries,
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
    wikiBusy,
    wikiError,
    wikiNotice,
    wikiSourceTitle,
    wikiSourceContent,
    wikiPages,
    wikiLastIngest,
    wikiDirectoryLastUpdatedAt,
    wikiRawFileCount,
    wikiUploadSourceType,

    onChangeActiveSection,
    onChangeWikiSourceTitle,
    onChangeWikiSourceContent,
    onRunWikiIngest,
    onRunWikiDirectoryConsistencyCheck,
    onRefreshWikiPages,
    onPickAndIngestWikiUploads,
    onRefreshWikiDirectory,
    onRenameWikiRawRecord,
    onDeleteWikiRawRecord,
    onChangeWikiUploadSourceType,

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



  function resolveOverviewSectionKey(title: string): LibrarySectionKey | null {
    const normalized = title.trim().toLowerCase();
    if (normalized === 'wiki' || normalized === 'llm wiki' || normalized === '资料库') {
      return 'wiki';
    }
    if (normalized === 'memories' || normalized === '记忆') {
      return 'memories';
    }
    if (normalized === 'summaries' || normalized === '摘要') {
      return 'summaries';
    }
    if (normalized === 'photos' || normalized === '照片') {
      return 'photos';
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
            ? `${activeSpace.name}（${activeSpaceKindLabel}）现在采用 LLM Wiki 范式管理资料。`
            : '先选择一个空间，再查看 Sparkbox 在其中保存的内容。'}
        </Text>
        <View style={styles.libraryGrid}>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('wiki_upload_file')}
            disabled={!activeSpace}
          >
            <Text style={styles.librarySectionTitle}>文件上传</Text>
            <Text style={styles.librarySectionCopy}>上传文档并自动导入到 Wiki raw。</Text>
          </Pressable>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('wiki_upload_image')}
            disabled={!activeSpace}
          >
            <Text style={styles.librarySectionTitle}>图片上传</Text>
            <Text style={styles.librarySectionCopy}>上传图片并自动进入 Wiki 索引。</Text>
          </Pressable>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('wiki_upload_text')}
            disabled={!activeSpace}
          >
            <Text style={styles.librarySectionTitle}>文本上传</Text>
            <Text style={styles.librarySectionCopy}>填写 Raw 标题和内容后直接导入。</Text>
          </Pressable>

        </View>
      </View>
    );
  }

  function renderWiki(): React.ReactNode {
    return (
      <View style={styles.settingsCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>LLM Wiki（按空间）</Text>
          <Pressable style={styles.summaryRefreshButton} onPress={() => onChangeActiveSection('overview')}>
            <Text style={styles.summaryRefreshButtonText}>返回概览</Text>
          </Pressable>
        </View>
        <Text style={styles.cardCopy}>
          {activeSpace
            ? `当前空间：${activeSpace.name}。所有 Wiki 素材和页面都归属这个空间。`
            : '请先选择一个空间，再使用 Wiki。'}
        </Text>

        <View style={styles.libraryGrid}>
          <Pressable style={styles.librarySectionCard} onPress={() => onChangeActiveSection('wiki_upload_file')} disabled={!activeSpace}>
            <Text style={styles.librarySectionTitle}>文件上传</Text>
            <Text style={styles.librarySectionCopy}>上传文档并导入到 raw。</Text>
          </Pressable>
          <Pressable style={styles.librarySectionCard} onPress={() => onChangeActiveSection('wiki_upload_image')} disabled={!activeSpace}>
            <Text style={styles.librarySectionTitle}>图片上传</Text>
            <Text style={styles.librarySectionCopy}>上传图片并纳入索引。</Text>
          </Pressable>
          <Pressable style={styles.librarySectionCard} onPress={() => onChangeActiveSection('wiki_upload_text')} disabled={!activeSpace}>
            <Text style={styles.librarySectionTitle}>文本上传</Text>
            <Text style={styles.librarySectionCopy}>通过 Raw 标题+内容上传。</Text>
          </Pressable>

        </View>

        <Text style={styles.selectionLabel}>上传即导入（Ingest）</Text>
        <View style={styles.inlineActions}>
          <Pressable
            style={[styles.scopePill, wikiUploadSourceType === 'note' ? styles.scopePillActive : null]}
            onPress={() => onChangeWikiUploadSourceType('note')}
            disabled={!activeSpace || wikiBusy}
          >
            <Text style={[styles.scopePillLabel, wikiUploadSourceType === 'note' ? styles.scopePillLabelActive : null]}>笔记</Text>
          </Pressable>
          <Pressable
            style={[styles.scopePill, wikiUploadSourceType === 'document' ? styles.scopePillActive : null]}
            onPress={() => onChangeWikiUploadSourceType('document')}
            disabled={!activeSpace || wikiBusy}
          >
            <Text style={[styles.scopePillLabel, wikiUploadSourceType === 'document' ? styles.scopePillLabelActive : null]}>文档</Text>
          </Pressable>
          <Pressable
            style={[styles.scopePill, wikiUploadSourceType === 'image' ? styles.scopePillActive : null]}
            onPress={() => onChangeWikiUploadSourceType('image')}
            disabled={!activeSpace || wikiBusy}
          >
            <Text style={[styles.scopePillLabel, wikiUploadSourceType === 'image' ? styles.scopePillLabelActive : null]}>图片</Text>
          </Pressable>
        </View>
        <Pressable style={styles.primaryButtonSmall} onPress={onPickAndIngestWikiUploads} disabled={!activeSpace || wikiBusy}>
          <Text style={styles.primaryButtonText}>上传并导入到 raw</Text>
        </Pressable>

        <Text style={styles.selectionLabel}>Raw 标题</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="例如：家庭周计划讨论记录"
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={wikiSourceTitle}
          onChangeText={onChangeWikiSourceTitle}
        />
        <Text style={styles.selectionLabel}>Raw 内容</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          numberOfLines={6}
          placeholder="粘贴这次空间相关资料"
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={wikiSourceContent}
          onChangeText={onChangeWikiSourceContent}
        />

        <View style={styles.inlineActions}>
          <Pressable
            style={styles.primaryButtonSmall}
            onPress={onRunWikiIngest}
            disabled={!activeSpace || wikiBusy}
          >
            <Text style={styles.primaryButtonText}>导入并编译</Text>
          </Pressable>
        </View>

        <View style={styles.inlineActions}>
          <Pressable
            style={styles.secondaryButtonSmall}
            onPress={onRefreshWikiPages}
            disabled={!activeSpace || wikiBusy}
          >
            <Text style={styles.secondaryButtonText}>刷新页面列表</Text>
          </Pressable>
        </View>

        {wikiNotice ? <Text style={styles.noticeText}>{wikiNotice}</Text> : null}
        {wikiError ? <Text style={styles.errorText}>{wikiError}</Text> : null}
        {wikiBusy ? <ActivityIndicator color="#0b6e4f" /> : null}

        {wikiLastIngest ? (
          <View style={styles.deviceRowCard}>
            <Text style={styles.networkName}>最近导入结果</Text>
            <Text style={styles.cardCopy}>标题：{wikiLastIngest.title}</Text>
            <Text style={styles.cardCopy}>类型：{wikiLastIngest.sourceType}</Text>
            <Text style={styles.cardCopy}>页面ID：{wikiLastIngest.pageId}</Text>
            <Text style={styles.cardCopy}>操作ID：{wikiLastIngest.operationId}</Text>
            <Text style={styles.cardCopy}>摘要：{wikiLastIngest.summary}</Text>
            {wikiLastIngest.directoryMode ? (
              <Text style={styles.cardCopy}>directory 生成模式：{wikiLastIngest.directoryMode}</Text>
            ) : null}
            {(wikiLastIngest.directoryProvider || wikiLastIngest.directoryModel) ? (
              <Text style={styles.cardCopy}>
                provider/model：{wikiLastIngest.directoryProvider || '-'} / {wikiLastIngest.directoryModel || '-'}
              </Text>
            ) : null}
            {wikiLastIngest.directoryModelBudgetSeconds ? (
              <Text style={styles.cardCopy}>
                预算超时阈值：{wikiLastIngest.directoryModelBudgetSeconds}s（provider超时：{wikiLastIngest.directoryProviderTimeoutSeconds || 0}s）
              </Text>
            ) : null}
            {wikiLastIngest.directoryMode === 'deterministic' ? (
              <Text style={styles.errorText}>
                directory 回退已触发：{wikiLastIngest.directoryFallbackReason || 'model_unavailable'}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.deviceRowCard}>
          <Text style={styles.networkName}>directory 目录管理器（可视化）</Text>
          <Text style={styles.cardCopy}>
            最近更新时间：{wikiDirectoryLastUpdatedAt || '尚未加载'} · raw文件数：{wikiRawFileCount}
          </Text>
          <View style={styles.inlineActions}>
            <Pressable style={styles.secondaryButtonSmall} onPress={onRefreshWikiDirectory} disabled={!activeSpace || wikiBusy}>
              <Text style={styles.secondaryButtonText}>刷新目录</Text>
            </Pressable>
          </View>
        </View>

        {wikiPages.length ? (
          <View style={styles.deviceRowCard}>
            <Text style={styles.networkName}>本空间 Wiki 页面</Text>
            {wikiPages.slice(0, 8).map((page) => (
              <Text key={page.id} style={styles.cardCopy}>
                {page.title} · {(page.tags || []).slice(0, 3).join(', ') || '无 tags'}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  function renderWikiUploadFile(): React.ReactNode {
    return (
      <>
        {renderSectionHeader('文件上传', '选择文件并导入到当前空间 Wiki。')}
        <View style={styles.settingsCard}>
          <Text style={styles.cardCopy}>该页面只处理文档文件上传。</Text>
          <Pressable
            style={styles.primaryButtonSmall}
            onPress={() => {
              onChangeWikiUploadSourceType('document');
              onPickAndIngestWikiUploads();
            }}
            disabled={!activeSpace || wikiBusy}
          >
            <Text style={styles.primaryButtonText}>选择文件并上传</Text>
          </Pressable>
          {wikiNotice ? <Text style={styles.noticeText}>{wikiNotice}</Text> : null}
          {wikiError ? <Text style={styles.errorText}>{wikiError}</Text> : null}
        </View>
      </>
    );
  }

  function renderWikiUploadImage(): React.ReactNode {
    return (
      <>
        {renderSectionHeader('图片上传', '选择图片并导入到当前空间 Wiki。')}
        <View style={styles.settingsCard}>
          <Text style={styles.cardCopy}>该页面只处理图片上传。</Text>
          <Pressable
            style={styles.primaryButtonSmall}
            onPress={() => {
              onChangeWikiUploadSourceType('image');
              onPickAndIngestWikiUploads();
            }}
            disabled={!activeSpace || wikiBusy}
          >
            <Text style={styles.primaryButtonText}>选择图片并上传</Text>
          </Pressable>
          {wikiNotice ? <Text style={styles.noticeText}>{wikiNotice}</Text> : null}
          {wikiError ? <Text style={styles.errorText}>{wikiError}</Text> : null}
        </View>
      </>
    );
  }

  function renderWikiUploadText(): React.ReactNode {
    return (
      <>
        {renderSectionHeader('文本上传', '通过 Raw 标题和内容直接导入文本。')}
        <View style={styles.settingsCard}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Raw 标题"
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={wikiSourceTitle}
            onChangeText={onChangeWikiSourceTitle}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            numberOfLines={6}
            placeholder="Raw 内容"
            placeholderTextColor="#7e8a83"
            style={styles.input}
            value={wikiSourceContent}
            onChangeText={onChangeWikiSourceContent}
          />
          <Pressable
            style={styles.primaryButtonSmall}
            onPress={() => {
              onChangeWikiUploadSourceType('note');
              onRunWikiIngest();
            }}
            disabled={!activeSpace || wikiBusy}
          >
            <Text style={styles.primaryButtonText}>导入文本</Text>
          </Pressable>
          {wikiNotice ? <Text style={styles.noticeText}>{wikiNotice}</Text> : null}
          {wikiError ? <Text style={styles.errorText}>{wikiError}</Text> : null}
        </View>
      </>
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

  if (activeSection === 'wiki') {
    return <>{renderWiki()}</>;
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
  if (activeSection === 'wiki_upload_file') {
    return <>{renderWikiUploadFile()}</>;
  }
  if (activeSection === 'wiki_upload_image') {
    return <>{renderWikiUploadImage()}</>;
  }
  if (activeSection === 'wiki_upload_text') {
    return <>{renderWikiUploadText()}</>;
  }
  return <>{renderWiki()}</>;
}
