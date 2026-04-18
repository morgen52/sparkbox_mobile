import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import { useT } from '../i18n';
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
import { MarkdownCardViewer } from './MarkdownCardViewer';
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
  | 'raw_browser'
  | 'external_import'
  | 'link_import'
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

  rawBrowserFiles: HouseholdFileEntry[];
  rawBrowserBusy: boolean;
  rawBrowserContent: string;
  rawBrowserActivePath: string;
  rawBrowserCurrentDir: string;
  externalMounts: Array<{ id: string; label: string; path: string }>;
  externalEntries: Array<{
    name: string;
    path: string;
    sourcePath: string;
    isDir: boolean;
    size: number;
    modifiedAt: string;
  }>;
  externalImportBusy: boolean;
  externalImportRootPath: string;
  externalImportCurrentPath: string;
  selectedExternalImportPaths: string[];
  onRefreshRawBrowser: (subpath?: string) => void;
  onNavigateRawBrowserDir: (subpath: string) => void;
  onReadRawBrowserFile: (path: string) => void;
  onCloseRawBrowserReader: () => void;
  onRefreshExternalDevices: () => void;
  onBrowseExternalStorage: (rootPath: string, subpath?: string) => void;
  onToggleExternalSelection: (sourcePath: string) => void;
  onClearExternalSelection: () => void;
  onImportSelectedExternalItems: () => void;

  linkImportUrl: string;
  linkPreview: {
    platform: string;
    sourceUrl: string;
    title: string;
    author: string;
    contentMarkdown: string;
    contentText: string;
    images: string[];
    error: string | null;
  } | null;
  linkPreviewBusy: boolean;
  linkImportBusy: boolean;
  linkPreviewError: string;
  onChangeLinkImportUrl: (url: string) => void;
  onPreviewLink: (url: string) => void;
  onConfirmLinkImport: () => void;
  onCancelLinkImport: () => void;

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

    rawBrowserFiles,
    rawBrowserBusy,
    rawBrowserContent,
    rawBrowserActivePath,
    rawBrowserCurrentDir,
    externalMounts,
    externalEntries,
    externalImportBusy,
    externalImportRootPath,
    externalImportCurrentPath,
    selectedExternalImportPaths,
    onRefreshRawBrowser,
    onNavigateRawBrowserDir,
    onReadRawBrowserFile,
    onCloseRawBrowserReader,
    onRefreshExternalDevices,
    onBrowseExternalStorage,
    onToggleExternalSelection,
    onClearExternalSelection,
    onImportSelectedExternalItems,

    linkImportUrl,
    linkPreview,
    linkPreviewBusy,
    linkImportBusy,
    linkPreviewError,
    onChangeLinkImportUrl,
    onPreviewLink,
    onConfirmLinkImport,
    onCancelLinkImport,

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
  const t = useT();
  const summarySessionScopeLabel: Record<ChatSessionScope, string> = {
    family: t('library.sharedChat'),
    private: t('library.privateChat'),
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
            <Text style={styles.summaryRefreshButtonText}>{t('library.backToOverview')}</Text>
          </Pressable>
        </View>
        <Text style={styles.cardCopy}>{copy}</Text>
      </View>
    );
  }

  function renderOverview(): React.ReactNode {
    return (
      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('library.overview')}</Text>
        <Text style={styles.cardCopy}>
          {activeSpace
            ? t('library.wikiModeCopy', { name: activeSpace.name, kind: activeSpaceKindLabel })
            : t('library.selectSpaceFirst')}
        </Text>
        <View style={styles.libraryGrid}>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('wiki_upload_file')}
            disabled={!activeSpace}
          >
            <Text style={styles.librarySectionTitle}>{t('library.fileUpload')}</Text>
            <Text style={styles.librarySectionCopy}>{t('library.fileUploadCopy')}</Text>
          </Pressable>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('wiki_upload_image')}
            disabled={!activeSpace}
          >
            <Text style={styles.librarySectionTitle}>{t('library.imageUpload')}</Text>
            <Text style={styles.librarySectionCopy}>{t('library.imageUploadCopy')}</Text>
          </Pressable>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('wiki_upload_text')}
            disabled={!activeSpace}
          >
            <Text style={styles.librarySectionTitle}>{t('library.textUpload')}</Text>
            <Text style={styles.librarySectionCopy}>{t('library.textUploadCopy')}</Text>
          </Pressable>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('raw_browser')}
            disabled={!activeSpace}
          >
            <Text style={styles.librarySectionTitle}>{t('library.rawBrowseTitle')}</Text>
            <Text style={styles.librarySectionCopy}>{t('library.rawBrowseCopy')}</Text>
          </Pressable>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('external_import')}
            disabled={!activeSpace}
          >
            <Text style={styles.librarySectionTitle}>{t('library.externalImport')}</Text>
            <Text style={styles.librarySectionCopy}>{t('library.externalImportCopy')}</Text>
          </Pressable>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('link_import')}
            disabled={!activeSpace}
          >
            <Text style={styles.librarySectionTitle}>{t('library.linkImport')}</Text>
            <Text style={styles.librarySectionCopy}>{t('library.linkImportCopy')}</Text>
          </Pressable>

        </View>
      </View>
    );
  }

  function renderRawBrowser(): React.ReactNode {
    const isDocFile = (name: string) => /\.(md|txt|json|toml|yaml|yml|csv|log)$/i.test(name);

    // Reading a file
    if (rawBrowserActivePath) {
      return (
        <>
          {renderSectionHeader(t('library.rawFileRead'), rawBrowserActivePath)}
          <View style={styles.settingsCard}>
            <View style={styles.inlineActions}>
              <Pressable style={styles.secondaryButtonSmall} onPress={onCloseRawBrowserReader}>
                <Text style={styles.secondaryButtonText}>{t('library.backToFileList')}</Text>
              </Pressable>
            </View>
            {rawBrowserBusy ? (
              <ActivityIndicator style={{ marginVertical: 12 }} />
            ) : rawBrowserContent ? (
              <MarkdownCardViewer markdown={rawBrowserContent} styles={styles} />
            ) : (
              <Text style={styles.cardCopy}>{t('library.cannotRead')}</Text>
            )}
            {libraryError ? <Text style={styles.errorText}>{libraryError}</Text> : null}
          </View>
        </>
      );
    }

    // File listing
    return (
      <>
        {renderSectionHeader(t('library.rawBrowseTitle'), rawBrowserCurrentDir ? `raw/${rawBrowserCurrentDir}/` : 'raw/')}
        <View style={styles.settingsCard}>
          <View style={styles.inlineActions}>
            <Pressable
              style={styles.primaryButtonSmall}
              onPress={() => onRefreshRawBrowser(rawBrowserCurrentDir || undefined)}
              disabled={rawBrowserBusy}
            >
              <Text style={styles.primaryButtonText}>{rawBrowserBusy ? t('library.refreshing') : t('library.refreshList')}</Text>
            </Pressable>
            {rawBrowserCurrentDir ? (
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={() => {
                  const parent = rawBrowserCurrentDir.includes('/')
                    ? rawBrowserCurrentDir.slice(0, rawBrowserCurrentDir.lastIndexOf('/'))
                    : '';
                  onNavigateRawBrowserDir(parent);
                }}
              >
                <Text style={styles.secondaryButtonText}>↑ {t('library.goUp')}</Text>
              </Pressable>
            ) : null}
          </View>
          {rawBrowserFiles.length === 0 && !rawBrowserBusy ? (
            <Text style={styles.cardCopy}>{t('library.emptyDir')}</Text>
          ) : null}
          {rawBrowserFiles.map((entry) => {
            const displayName = entry.name || entry.path.split('/').pop() || entry.path;
            const relativePath = rawBrowserCurrentDir
              ? `${rawBrowserCurrentDir}/${displayName}`
              : displayName;
            return (
              <View key={entry.path} style={styles.deviceRowCard}>
                <Pressable
                  onPress={
                    entry.isDir
                      ? () => onNavigateRawBrowserDir(relativePath)
                      : isDocFile(displayName)
                        ? () => onReadRawBrowserFile(relativePath)
                        : undefined
                  }
                  disabled={!entry.isDir && !isDocFile(displayName)}
                  pressFeedback="scale"
                >
                  <Text style={styles.networkName}>
                    {entry.isDir ? '📁 ' : '📄 '}{displayName}
                  </Text>
                  {!entry.isDir && typeof entry.size === 'number' ? (
                    <Text style={styles.cardCopy}>
                      {formatByteSize(entry.size)}
                      {entry.modified ? `　${describeFileTimestamp(entry.modified)}` : ''}
                    </Text>
                  ) : entry.isDir ? (
                    <Text style={styles.cardCopy}>{t('library.enterSubdir')}</Text>
                  ) : null}
                  {!entry.isDir && isDocFile(displayName) ? (
                    <Text style={styles.noticeText}>{t('library.viewContent')}</Text>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
          {libraryError ? <Text style={styles.errorText}>{libraryError}</Text> : null}
        </View>
      </>
    );
  }

  function renderWiki(): React.ReactNode {
    return (
      <View style={styles.settingsCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>{t('library.wikiBySpace')}</Text>
          <Pressable style={styles.summaryRefreshButton} onPress={() => onChangeActiveSection('overview')}>
            <Text style={styles.summaryRefreshButtonText}>{t('library.backToOverview')}</Text>
          </Pressable>
        </View>
        <Text style={styles.cardCopy}>
          {activeSpace
            ? t('library.wikiCurrentSpace', { name: activeSpace.name })
            : t('library.wikiSelectSpace')}
        </Text>

        <View style={styles.libraryGrid}>
          <Pressable style={styles.librarySectionCard} onPress={() => onChangeActiveSection('wiki_upload_file')} disabled={!activeSpace}>
            <Text style={styles.librarySectionTitle}>{t('library.fileUpload')}</Text>
            <Text style={styles.librarySectionCopy}>{t('library.wikiFileUploadCopy')}</Text>
          </Pressable>
          <Pressable style={styles.librarySectionCard} onPress={() => onChangeActiveSection('wiki_upload_image')} disabled={!activeSpace}>
            <Text style={styles.librarySectionTitle}>{t('library.imageUpload')}</Text>
            <Text style={styles.librarySectionCopy}>{t('library.wikiImageUploadCopy')}</Text>
          </Pressable>
          <Pressable style={styles.librarySectionCard} onPress={() => onChangeActiveSection('wiki_upload_text')} disabled={!activeSpace}>
            <Text style={styles.librarySectionTitle}>{t('library.textUpload')}</Text>
            <Text style={styles.librarySectionCopy}>{t('library.wikiTextUploadCopy')}</Text>
          </Pressable>

        </View>

        <Text style={styles.selectionLabel}>{t('library.uploadIngest')}</Text>
        <View style={styles.inlineActions}>
          <Pressable
            style={[styles.scopePill, wikiUploadSourceType === 'note' ? styles.scopePillActive : null]}
            onPress={() => onChangeWikiUploadSourceType('note')}
            disabled={!activeSpace || wikiBusy}
          >
            <Text style={[styles.scopePillLabel, wikiUploadSourceType === 'note' ? styles.scopePillLabelActive : null]}>{t('library.notes')}</Text>
          </Pressable>
          <Pressable
            style={[styles.scopePill, wikiUploadSourceType === 'document' ? styles.scopePillActive : null]}
            onPress={() => onChangeWikiUploadSourceType('document')}
            disabled={!activeSpace || wikiBusy}
          >
            <Text style={[styles.scopePillLabel, wikiUploadSourceType === 'document' ? styles.scopePillLabelActive : null]}>{t('library.documents')}</Text>
          </Pressable>
          <Pressable
            style={[styles.scopePill, wikiUploadSourceType === 'image' ? styles.scopePillActive : null]}
            onPress={() => onChangeWikiUploadSourceType('image')}
            disabled={!activeSpace || wikiBusy}
          >
            <Text style={[styles.scopePillLabel, wikiUploadSourceType === 'image' ? styles.scopePillLabelActive : null]}>{t('library.images')}</Text>
          </Pressable>
        </View>
        <Pressable style={styles.primaryButtonSmall} onPress={onPickAndIngestWikiUploads} disabled={!activeSpace || wikiBusy}>
          <Text style={styles.primaryButtonText}>{t('library.uploadAndImport')}</Text>
        </Pressable>

        <Text style={styles.selectionLabel}>{t('library.rawTitle')}</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={t('library.titlePlaceholder')}
          placeholderTextColor="#7e8a83"
          style={styles.input}
          value={wikiSourceTitle}
          onChangeText={onChangeWikiSourceTitle}
        />
        <Text style={styles.selectionLabel}>{t('library.rawContent')}</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          numberOfLines={6}
          placeholder={t('library.contentPlaceholder')}
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
            <Text style={styles.primaryButtonText}>{t('library.importAndCompile')}</Text>
          </Pressable>
        </View>

        <View style={styles.inlineActions}>
          <Pressable
            style={styles.secondaryButtonSmall}
            onPress={onRefreshWikiPages}
            disabled={!activeSpace || wikiBusy}
          >
            <Text style={styles.secondaryButtonText}>{t('library.refreshPages')}</Text>
          </Pressable>
        </View>

        {wikiNotice ? <Text style={styles.noticeText}>{wikiNotice}</Text> : null}
        {wikiError ? <Text style={styles.errorText}>{wikiError}</Text> : null}
        {wikiBusy ? <ActivityIndicator color="#0b6e4f" /> : null}

        {wikiLastIngest ? (
          <View style={styles.deviceRowCard}>
            <Text style={styles.networkName}>{t('library.recentImport')}</Text>
            <Text style={styles.cardCopy}>{t('library.importTitle')}{wikiLastIngest.title}</Text>
            <Text style={styles.cardCopy}>{t('library.importType')}{wikiLastIngest.sourceType}</Text>
            <Text style={styles.cardCopy}>{t('library.importPageId')}{wikiLastIngest.pageId}</Text>
            <Text style={styles.cardCopy}>{t('library.importOpId')}{wikiLastIngest.operationId}</Text>
            <Text style={styles.cardCopy}>{t('library.importSummary')}{wikiLastIngest.summary}</Text>
            {wikiLastIngest.directoryMode ? (
              <Text style={styles.cardCopy}>{t('library.directoryMode')}{wikiLastIngest.directoryMode}</Text>
            ) : null}
            {(wikiLastIngest.directoryProvider || wikiLastIngest.directoryModel) ? (
              <Text style={styles.cardCopy}>
                provider/model：{wikiLastIngest.directoryProvider || '-'} / {wikiLastIngest.directoryModel || '-'}
              </Text>
            ) : null}
            {wikiLastIngest.directoryModelBudgetSeconds ? (
              <Text style={styles.cardCopy}>
                {t('library.budgetTimeout')}{wikiLastIngest.directoryModelBudgetSeconds}s{t('library.providerTimeout')}{wikiLastIngest.directoryProviderTimeoutSeconds || 0}s）
              </Text>
            ) : null}
            {wikiLastIngest.directoryMode === 'deterministic' ? (
              <Text style={styles.errorText}>
                {t('library.directoryFallback')}{wikiLastIngest.directoryFallbackReason || 'model_unavailable'}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.deviceRowCard}>
          <Text style={styles.networkName}>{t('library.directoryManager')}</Text>
          <Text style={styles.cardCopy}>
            {t('library.lastUpdated')}{wikiDirectoryLastUpdatedAt || t('library.notLoaded')} · {t('library.rawCount')}{wikiRawFileCount}
          </Text>
          <View style={styles.inlineActions}>
            <Pressable style={styles.secondaryButtonSmall} onPress={onRefreshWikiDirectory} disabled={!activeSpace || wikiBusy}>
              <Text style={styles.secondaryButtonText}>{t('library.refreshDirectory')}</Text>
            </Pressable>
          </View>
        </View>

        {wikiPages.length ? (
          <View style={styles.deviceRowCard}>
            <Text style={styles.networkName}>{t('library.wikiPages')}</Text>
            {wikiPages.slice(0, 8).map((page) => (
              <Text key={page.id} style={styles.cardCopy}>
                {page.title} · {(page.tags || []).slice(0, 3).join(', ') || t('library.noTags')}
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
        {renderSectionHeader(t('library.fileUpload'), t('library.fileUploadPageCopy'))}
        <View style={styles.settingsCard}>
          <Text style={styles.cardCopy}>{t('library.fileUploadOnly')}</Text>
          <Pressable
            style={styles.primaryButtonSmall}
            onPress={() => {
              onChangeWikiUploadSourceType('document');
              onPickAndIngestWikiUploads();
            }}
            disabled={!activeSpace || wikiBusy}
          >
            <Text style={styles.primaryButtonText}>{t('library.selectFileUpload')}</Text>
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
        {renderSectionHeader(t('library.imageUpload'), t('library.imageUploadPageCopy'))}
        <View style={styles.settingsCard}>
          <Text style={styles.cardCopy}>{t('library.imageUploadOnly')}</Text>
          <Pressable
            style={styles.primaryButtonSmall}
            onPress={() => {
              onChangeWikiUploadSourceType('image');
              onPickAndIngestWikiUploads();
            }}
            disabled={!activeSpace || wikiBusy}
          >
            <Text style={styles.primaryButtonText}>{t('library.selectImageUpload')}</Text>
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
        {renderSectionHeader(t('library.textUpload'), t('library.textUploadPageCopy'))}
        <View style={styles.settingsCard}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t('library.rawTitleLabel')}
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
            placeholder={t('library.rawContentLabel')}
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
            <Text style={styles.primaryButtonText}>{t('library.importText')}</Text>
          </Pressable>
          {wikiNotice ? <Text style={styles.noticeText}>{wikiNotice}</Text> : null}
          {wikiError ? <Text style={styles.errorText}>{wikiError}</Text> : null}
        </View>
      </>
    );
  }

  function renderExternalImport(): React.ReactNode {
    const currentFolderLabel = externalImportCurrentPath ? t('library.enteredDir', { path: externalImportCurrentPath }) : t('library.selectStorage');
    const hasSelection = selectedExternalImportPaths.length > 0;

    return (
      <>
        {renderSectionHeader(t('library.externalStorageImport'), currentFolderLabel)}
        <View style={styles.settingsCard}>
          <View style={styles.inlineActions}>
            <Pressable
              style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
              onPress={onRefreshExternalDevices}
              disabled={!onlineDeviceAvailable || externalImportBusy}
            >
              <Text style={styles.secondaryButtonText}>{externalImportBusy ? t('library.scanning') : t('library.scanDevices')}</Text>
            </Pressable>
            {externalImportRootPath ? (
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={() => {
                  const parent = externalImportCurrentPath.includes('/')
                    ? externalImportCurrentPath.slice(0, externalImportCurrentPath.lastIndexOf('/'))
                    : '';
                  onBrowseExternalStorage(externalImportRootPath, parent || undefined);
                }}
                disabled={externalImportBusy}
              >
                <Text style={styles.secondaryButtonText}>↑ {t('library.goUp')}</Text>
              </Pressable>
            ) : null}
            {hasSelection ? (
              <Pressable style={styles.secondaryButtonSmall} onPress={onClearExternalSelection} disabled={externalImportBusy}>
                <Text style={styles.secondaryButtonText}>{t('library.clearSelection')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.primaryButtonSmall, (!onlineDeviceAvailable || !hasSelection) ? styles.networkRowDisabled : null]}
              onPress={onImportSelectedExternalItems}
              disabled={!onlineDeviceAvailable || !hasSelection || externalImportBusy}
            >
              <Text style={styles.primaryButtonText}>{externalImportBusy ? t('library.importing') : t('library.importSelected', { count: hasSelection ? selectedExternalImportPaths.length : 0 })}</Text>
            </Pressable>
          </View>
          {!onlineDeviceAvailable ? (
            <Text style={styles.cardCopy}>{t('library.needOnline')}</Text>
          ) : null}
          {!externalImportRootPath ? (
            externalMounts.length === 0 && !externalImportBusy ? (
              <Text style={styles.cardCopy}>{t('library.noDevices')}</Text>
            ) : (
              externalMounts.map((mount) => (
                <View key={mount.id} style={styles.deviceRowCard}>
                  <Text style={styles.networkName}>💾 {mount.label}</Text>
                  <Text style={styles.cardCopy}>{mount.path}</Text>
                  <View style={styles.inlineActions}>
                    <Pressable style={styles.primaryButtonSmall} onPress={() => onBrowseExternalStorage(mount.path)}>
                      <Text style={styles.primaryButtonText}>{t('library.browseContent')}</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )
          ) : (
            <>
              <Text style={styles.cardCopy}>{t('library.importFlowCopy')}</Text>
              {externalEntries.length === 0 && !externalImportBusy ? (
                <Text style={styles.cardCopy}>{t('library.emptyDir')}</Text>
              ) : null}
              {externalEntries.map((entry) => {
                const selected = selectedExternalImportPaths.includes(entry.sourcePath);
                return (
                  <View
                    key={entry.sourcePath}
                    style={[
                      styles.deviceRowCard,
                      selected ? { borderColor: '#0b6e4f', backgroundColor: '#f3fbf7' } : null,
                    ]}
                  >
                    <Pressable onPress={() => onToggleExternalSelection(entry.sourcePath)} pressFeedback="scale">
                      <Text style={styles.networkName}>
                        {selected ? '☑ ' : '☐ '}{entry.isDir ? '📁 ' : '📄 '}{entry.name}
                      </Text>
                      <Text style={styles.cardCopy}>
                        {entry.isDir ? t('library.folder') : formatByteSize(entry.size || 0)}
                        {entry.modifiedAt ? ` · ${describeFileTimestamp(entry.modifiedAt)}` : ''}
                      </Text>
                    </Pressable>
                    <View style={styles.inlineActions}>
                      {entry.isDir ? (
                        <Pressable
                          style={styles.secondaryButtonSmall}
                          onPress={() => onBrowseExternalStorage(externalImportRootPath, entry.path)}
                        >
                          <Text style={styles.secondaryButtonText}>{t('library.enter')}</Text>
                        </Pressable>
                      ) : null}
                      <Pressable style={styles.secondaryButtonSmall} onPress={() => onToggleExternalSelection(entry.sourcePath)}>
                        <Text style={styles.secondaryButtonText}>{selected ? t('library.uncheck') : t('library.checkImport')}</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </View>
      </>
    );
  }

  const [linkPlatform, setLinkPlatform] = useState<'wechat' | 'zhihu'>('wechat');

  function renderLinkImport(): React.ReactNode {
    const platformMeta: Record<string, { label: string; icon: string; placeholder: string; desc: string }> = {
      wechat: {
        label: t('library.wechat'),
        icon: '💬',
        placeholder: t('library.wechatPlaceholder'),
        desc: t('library.wechatCopy'),
      },
      zhihu: {
        label: t('library.zhihu'),
        icon: '📘',
        placeholder: t('library.zhihuPlaceholder'),
        desc: t('library.zhihuCopy'),
      },
    };
    const meta = platformMeta[linkPlatform];

    const hasPlatformLabel = (p: string): string => {
      return platformMeta[p]?.label ?? p;
    };

    return (
      <>
        {renderSectionHeader(t('library.linkImport'), t('library.linkImportTitleCopy'))}

        {/* Platform toggle */}
        <View style={[styles.settingsCard, { flexDirection: 'row', gap: 8, paddingVertical: 8, paddingHorizontal: 12 }]}>
          {(Object.keys(platformMeta) as Array<'wechat' | 'zhihu'>).map((key) => {
            const pm = platformMeta[key];
            const active = linkPlatform === key;
            return (
              <Pressable
                key={key}
                onPress={() => { setLinkPlatform(key); onCancelLinkImport(); }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: active ? '#3f7d5f' : '#e5e7eb',
                  backgroundColor: active ? '#f0f5f1' : '#ffffff',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 18, marginBottom: 2 }}>{pm.icon}</Text>
                <Text style={{
                  fontSize: 13,
                  fontWeight: active ? '700' : '500',
                  color: active ? '#3f7d5f' : '#6b7280',
                }}>{pm.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.settingsCard}>
          {!onlineDeviceAvailable ? (
            <Text style={styles.cardCopy}>{t('library.needOnlineLink')}</Text>
          ) : null}

          {/* URL input */}
          {!linkPreview ? (
            <View>
              <View style={{
                borderWidth: 2,
                borderColor: '#c7d6cc',
                borderRadius: 12,
                backgroundColor: '#f0f5f1',
                padding: 12,
                marginBottom: 10,
              }}>
                <Text style={{ fontSize: 12, color: '#3f7d5f', fontWeight: '700', marginBottom: 6 }}>
                  {meta.icon}  {meta.label}{t('library.linkSuffix')}
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    padding: 12,
                    fontSize: 14,
                    color: '#1f2937',
                    minHeight: 52,
                    textAlignVertical: 'top',
                  }}
                  placeholder={meta.placeholder}
                  placeholderTextColor="#9ca3af"
                  value={linkImportUrl}
                  onChangeText={onChangeLinkImportUrl}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!linkPreviewBusy}
                />
              </View>
              <Text style={[styles.cardCopy, { fontSize: 11, color: '#9ca3af', marginBottom: 8 }]}>{meta.desc}</Text>
              {linkPreviewError ? (
                <Text style={[styles.cardCopy, { color: '#b91c1c', marginBottom: 8 }]}>{linkPreviewError}</Text>
              ) : null}
              <View style={styles.inlineActions}>
                <Pressable
                  style={[
                    styles.primaryButtonSmall,
                    (!onlineDeviceAvailable || !linkImportUrl.trim()) ? { backgroundColor: '#9ca3af' } : null,
                  ]}
                  onPress={() => onPreviewLink(linkImportUrl.trim())}
                  disabled={!onlineDeviceAvailable || !linkImportUrl.trim() || linkPreviewBusy}
                >
                  <Text style={styles.primaryButtonText}>{linkPreviewBusy ? t('library.fetching') : t('library.fetchPreview')}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* Preview */}
          {linkPreview ? (
            <View>
              <View style={[styles.deviceRowCard, { borderColor: '#c7d6cc', backgroundColor: '#f0f5f1' }]}>
                <Text style={[styles.networkName, { fontSize: 16, marginBottom: 4 }]}>{linkPreview.title}</Text>
                {linkPreview.author ? (
                  <Text style={[styles.cardCopy, { marginBottom: 4, fontWeight: '600' }]}>
                    {hasPlatformLabel(linkPreview.platform)} · {linkPreview.author}
                  </Text>
                ) : null}
                <Text style={[styles.cardCopy, { marginBottom: 2, color: '#6b7280', fontSize: 11 }]}>
                  {linkPreview.sourceUrl}
                </Text>
              </View>

              {/* Content preview */}
              <View style={[styles.settingsCard, { maxHeight: 300, overflow: 'hidden', marginTop: 8 }]}>
                <Text style={[styles.cardCopy, { fontWeight: '600', marginBottom: 4 }]}>{t('library.contentPreview')}</Text>
                <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
                  <Text style={[styles.cardCopy, { fontSize: 13, lineHeight: 20 }]}>
                    {linkPreview.contentText || t('library.noTextContent')}
                  </Text>
                </ScrollView>
              </View>

              {/* Action buttons */}
              <View style={[styles.inlineActions, { marginTop: 12 }]}>
                <Pressable
                  style={[styles.primaryButtonSmall, linkImportBusy ? { backgroundColor: '#9ca3af' } : null]}
                  onPress={onConfirmLinkImport}
                  disabled={linkImportBusy}
                >
                  <Text style={styles.primaryButtonText}>{linkImportBusy ? t('library.importing') : t('library.confirmImport')}</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryButtonSmall}
                  onPress={onCancelLinkImport}
                  disabled={linkImportBusy}
                >
                  <Text style={styles.secondaryButtonText}>{t('library.cancelImport')}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </>
    );
  }

  function renderMemories(): React.ReactNode {
    return (
      <>
        {renderSectionHeader(t('library.memoriesTitle'), t('library.memoriesCopy', { spaceName: activeSpace?.name || t('library.currentSpace') }))}
        <View style={styles.settingsCard}>
          {!canMutateActiveSpaceLibrary && activeSpace?.kind === 'shared' ? (
            <Text style={styles.cardCopy}>{t('library.memoriesAdminNote')}</Text>
          ) : null}
          <View style={styles.inlineActions}>
            <Pressable
              style={[styles.secondaryButtonSmall, !activeSpace ? styles.networkRowDisabled : null]}
              onPress={() => onRefreshLibrary()}
              disabled={!activeSpace || libraryBusy}
            >
              <Text style={styles.secondaryButtonText}>{t('library.refresh')}</Text>
            </Pressable>
            {canMutateActiveSpaceLibrary ? (
              <Pressable
                style={[styles.primaryButtonSmall, !activeSpace ? styles.networkRowDisabled : null]}
                onPress={onOpenMemoryEditor}
                disabled={!activeSpace || libraryBusy}
              >
                <Text style={styles.primaryButtonText}>{t('library.newMemory')}</Text>
              </Pressable>
            ) : null}
          </View>
          {memories.length === 0 && !libraryBusy ? <Text style={styles.cardCopy}>{t('library.noMemories')}</Text> : null}
          {memories.map((memory) => (
            <View key={memory.id} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{memory.title}</Text>
                <Text style={memory.pinned ? styles.statusTagOnline : styles.tagMuted}>{memory.pinned ? t('library.pinnedTag') : t('library.memoryTag')}</Text>
              </View>
              <Text style={styles.cardCopy}>{memory.content}</Text>
              <Text style={styles.cardCopy}>{t('library.updatedAt')} {describeUiDateTime(memory.updatedAt) || memory.updatedAt}</Text>
              {canMutateActiveSpaceLibrary ? (
                <View style={styles.inlineActions}>
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => onEditMemory(memory)} disabled={libraryBusy}>
                    <Text style={styles.secondaryButtonText}>{t('library.edit')}</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => onDeleteMemory(memory)} disabled={libraryBusy}>
                    <Text style={styles.secondaryButtonText}>{t('library.delete')}</Text>
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
        {renderSectionHeader(t('library.summariesTitle'), describeSummarySectionCopy(activeSpaceDetail))}
        <View style={styles.settingsCard}>
          <View style={styles.inlineActions}>
            <Pressable
              style={[styles.secondaryButtonSmall, !activeSpace ? styles.networkRowDisabled : null]}
              onPress={() => onRefreshSummary()}
              disabled={!activeSpace || libraryBusy}
            >
              <Text style={styles.secondaryButtonText}>{t('library.refresh')}</Text>
            </Pressable>
          </View>
          <Pressable
            style={[styles.summarySessionPickerButton, summaryCaptureSessionsBusy ? styles.networkRowDisabled : null]}
            onPress={onToggleSummaryCapturePicker}
            disabled={summaryCaptureSessionsBusy || summaryCaptureSessions.length === 0}
          >
            <View style={styles.summarySessionPickerInner}>
              <Text style={styles.summarySessionPickerText}>
                {selectedSummarySession ? t('library.selectedChat', { name: selectedSummarySession.name }) : t('library.selectChatForSummary')}
              </Text>
              <Text style={styles.summarySessionPickerChevron}>{summaryCapturePickerOpen ? '˄' : '˅'}</Text>
            </View>
          </Pressable>
          {summaryCapturePickerOpen ? (
            <View style={styles.summarySessionPickerPopover}>
              <Text style={styles.summarySessionPickerPopoverTitle}>{t('library.spaceChatList')}</Text>
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
                        {summarySessionScopeLabel[sessionItem.scope]} · {ownSession ? t('library.youCreated') : t('library.memberCreated')}
                      </Text>
                    </View>
                    <Text style={selected ? styles.statusTagOnline : styles.tagMuted}>
                      {selected ? t('library.selectedTag') : canMutateActiveSpaceLibrary ? t('library.canGenerate') : t('library.adminOnlyGenerate')}
                    </Text>
                  </Pressable>
                );
              })}
              {summaryCaptureSessions.length === 0 ? <Text style={styles.cardCopy}>{t('library.noChatsYet')}</Text> : null}
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
          {summaries.length === 0 && !libraryBusy ? <Text style={styles.cardCopy}>{t('library.noSummaries')}</Text> : null}
          {summaries.map((summary) => (
            <View key={summary.id} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{summary.title}</Text>
                <Text style={styles.tagMuted}>{summary.sourceLabel || t('library.summaryTag')}</Text>
              </View>
              <Text style={styles.cardCopy}>{summary.content}</Text>
              <Text style={styles.cardCopy}>{t('library.createdAt')} {describeUiDateTime(summary.createdAt) || summary.createdAt}</Text>
              {canMutateActiveSpaceLibrary ? (
                <View style={styles.inlineActions}>
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => onSaveSummaryAsMemory(summary)} disabled={libraryBusy}>
                    <Text style={styles.secondaryButtonText}>{t('library.saveAsMemory')}</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => onDeleteSummary(summary)} disabled={libraryBusy}>
                    <Text style={styles.secondaryButtonText}>{t('library.delete')}</Text>
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
        {renderSectionHeader(t('library.photosTitle'), t('library.photosCopy'))}
        <View style={styles.settingsCard}>
          {!canMutateActiveSpaceFiles && activeSpace?.kind === 'shared' ? (
            <Text style={styles.cardCopy}>{t('library.photosAdminNote')}</Text>
          ) : null}
          <View style={styles.inlineActions}>
            <Pressable
              style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
              onPress={() => onRefreshPhotos()}
              disabled={!onlineDeviceAvailable || filesBusy}
            >
              <Text style={styles.secondaryButtonText}>{t('library.refreshPhotos')}</Text>
            </Pressable>
            {canMutateActiveSpaceFiles ? (
              <Pressable
                style={[styles.primaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
                onPress={onUploadPhotos}
                disabled={!onlineDeviceAvailable || filesBusy}
              >
                <Text style={styles.primaryButtonText}>{t('library.uploadPhoto')}</Text>
              </Pressable>
            ) : null}
          </View>
          {photoEntries.length === 0 && !filesBusy ? <Text style={styles.cardCopy}>{describeLibraryPhotoEmptyState(fileSpace, t)}</Text> : null}
          {photoEntries.map((entry) => (
            <View key={`photo-${entry.path}`} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{entry.name}</Text>
                <Text style={styles.statusTagOnline}>{t('library.photoTag')}</Text>
              </View>
              <Text style={styles.cardCopy}>
                {describeFileTimestamp(entry.modified || '')}
                {typeof entry.size === 'number' ? ` · ${formatByteSize(entry.size)}` : ''}
              </Text>
              <View style={styles.inlineActions}>
                <Pressable style={styles.secondaryButtonSmall} onPress={() => onDownloadPhoto(entry)} disabled={filesBusy}>
                  <Text style={styles.secondaryButtonText}>{t('library.download')}</Text>
                </Pressable>
                {canManageFileEntry(entry) ? (
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => onDeletePhoto(entry)} disabled={filesBusy}>
                    <Text style={styles.secondaryButtonText}>{t('library.delete')}</Text>
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
        {renderSectionHeader(t('library.tasksTitle'), onlineDeviceAvailable
          ? t('library.tasksCopy', { spaceName: activeSpace ? activeSpace.name : t('library.currentSpace') })
          : t('library.tasksOfflineNote'))}
        <View style={styles.settingsCard}>
          {tasksNotice ? <Text style={styles.noticeText}>{tasksNotice}</Text> : null}
          {tasksError ? <Text style={styles.errorText}>{tasksError}</Text> : null}
          <View style={styles.inlineActions}>
            <Pressable
              style={[styles.secondaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
              onPress={() => onRefreshTasks()}
              disabled={!onlineDeviceAvailable || tasksBusy}
            >
              <Text style={styles.secondaryButtonText}>{t('library.refresh')}</Text>
            </Pressable>
            {canCreateTasks ? (
              <Pressable
                style={[styles.primaryButtonSmall, !onlineDeviceAvailable ? styles.networkRowDisabled : null]}
                onPress={() => onOpenTaskEditor()}
                disabled={!onlineDeviceAvailable || tasksBusy}
              >
                <Text style={styles.primaryButtonText}>{t('library.newTask')}</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.cardCopy}>{taskEditorQuickActionsCopy}</Text>
          {!canManage && taskScope === 'family' ? (
            <Text style={styles.cardCopy}>{t('library.memberTaskNote')}</Text>
          ) : null}
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>{describeLibraryTaskListTitle(taskScope, t)}</Text>
          {tasksBusy ? <ActivityIndicator color="#0b6e4f" /> : null}
          {!tasksBusy && tasks.length === 0 ? <Text style={styles.cardCopy}>{describeLibraryTaskListEmptyState(taskScope, t)}</Text> : null}
          {tasks.map((task) => (
            <View key={task.id} style={styles.deviceRowCard}>
              <View style={styles.deviceRowHeadline}>
                <Text style={styles.networkName}>{task.name}</Text>
                <Text style={task.enabled ? styles.statusTagOnline : styles.statusTagOffline}>{describeTaskEnabledState(task.enabled, t)}</Text>
              </View>
              <Text style={styles.cardCopy}>{describeTaskSchedule(task.cronExpr)}</Text>
              <Text style={styles.cardCopy}>{describeTaskExecution(task.commandType, task.scope, t)}</Text>
              {task.lastStatus ? (
                <Text style={styles.cardCopy}>
                  {t('library.lastRun')}{task.lastStatus}
                  {task.lastRunAt ? ` · ${describeUiDateTime(task.lastRunAt) || task.lastRunAt}` : ''}
                </Text>
              ) : null}
              {task.lastOutput ? (
                <Text numberOfLines={3} style={styles.cardCopy}>{t('library.lastOutput')}{task.lastOutput}</Text>
              ) : null}
              <View style={styles.inlineActions}>
                <Pressable
                  style={[styles.secondaryButtonSmall, !canTriggerTask(task) ? styles.networkRowDisabled : null]}
                  onPress={() => onRunTask(task)}
                  disabled={!canTriggerTask(task) || tasksBusy}
                >
                  <Text style={styles.secondaryButtonText}>{t('library.runNow')}</Text>
                </Pressable>
                <Pressable style={styles.secondaryButtonSmall} onPress={() => onOpenTaskHistory(task)} disabled={tasksBusy}>
                  <Text style={styles.secondaryButtonText}>{t('library.history')}</Text>
                </Pressable>
                {canEditTask(task) ? (
                  <>
                    <Pressable style={styles.secondaryButtonSmall} onPress={() => onEditTask(task)} disabled={tasksBusy}>
                      <Text style={styles.secondaryButtonText}>{t('library.edit')}</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButtonSmall} onPress={() => onDeleteTask(task)} disabled={tasksBusy}>
                      <Text style={styles.secondaryButtonText}>{t('library.delete')}</Text>
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
  if (activeSection === 'raw_browser') {
    return <>{renderRawBrowser()}</>;
  }
  if (activeSection === 'external_import') {
    return <>{renderExternalImport()}</>;
  }
  if (activeSection === 'link_import') {
    return <>{renderLinkImport()}</>;
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
