import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { describeFileTimestamp } from '../appShell';
import type { RawWorkFile } from '../householdApi';
import { useT } from '../i18n';
import { MarkdownCardViewer } from './MarkdownCardViewer';
import { AnimatedPressable as Pressable } from './AnimatedPressable';

export type UserToolSection = 'overview' | 'wiki_organize' | 'user_skill' | 'wiki_preview' | 'workspace_manager';

type UserToolsPaneProps = {
  styles: Record<string, any>;
  busy: boolean;
  error: string;
  notice: string;
  onlineDeviceAvailable: boolean;

  // Wiki organize
  wikiOrganizeStatus: {
    jobId: string;
    mode?: string;
    status: string;
    iterations: number;
    durationMs: number;
    processedRecords: number;
    message: string;
  } | null;
  onStartWikiOrganize: () => void;
  onStartWikiQualityOptimize: () => void;
  onRefreshWikiOrganizeStatus: () => void;

  // User skill
  userSkillContent: string;
  userSkillUpdatedAt: string;
  userSkillBusy: boolean;
  onDistillUserSkill: () => void;
  onRefreshUserSkill: () => void;

  // Wiki preview
  wikiPreviewFiles: Array<{ path: string; preview: string; content: string; updatedAt: string }>;
  onRefreshWikiPreview: () => void;

  // Workspace manager (work/ directory)
  workFiles: RawWorkFile[];
  workFileBusy: boolean;
  workFileContent: string;
  workFileActivePath: string;
  workCurrentDir: string;
  onRefreshWorkFiles: (subpath?: string) => void;
  onNavigateWorkDir: (subpath: string) => void;
  onReadWorkFile: (path: string) => void;
  onPromoteWorkFile: (path: string) => void;
  onDeleteWorkFile: (path: string) => void;
  onCloseWorkFileReader: () => void;

  activeSection: UserToolSection;
  onChangeActiveSection: (section: UserToolSection) => void;
};

export function UserToolsPane(props: UserToolsPaneProps) {
  const {
    styles,
    busy,
    error,
    notice,
    onlineDeviceAvailable,
    wikiOrganizeStatus,
    onStartWikiOrganize,
    onStartWikiQualityOptimize,
    onRefreshWikiOrganizeStatus,
    userSkillContent,
    userSkillUpdatedAt,
    userSkillBusy,
    onDistillUserSkill,
    onRefreshUserSkill,
    wikiPreviewFiles,
    onRefreshWikiPreview,
    workFiles,
    workFileBusy,
    workFileContent,
    workFileActivePath,
    workCurrentDir,
    onRefreshWorkFiles,
    onNavigateWorkDir,
    onReadWorkFile,
    onPromoteWorkFile,
    onDeleteWorkFile,
    onCloseWorkFileReader,
    activeSection,
    onChangeActiveSection,
  } = props;

  const t = useT();
  const [activeWikiPreviewPath, setActiveWikiPreviewPath] = React.useState('');

  React.useEffect(() => {
    if (!activeWikiPreviewPath) return;
    if (!wikiPreviewFiles.some((f) => f.path === activeWikiPreviewPath)) {
      setActiveWikiPreviewPath('');
    }
  }, [activeWikiPreviewPath, wikiPreviewFiles]);

  function renderSectionHeader(title: string, copy: string): React.ReactNode {
    return (
      <View style={styles.settingsCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Pressable style={styles.summaryRefreshButton} onPress={() => onChangeActiveSection('overview')}>
            <Text style={styles.summaryRefreshButtonText}>{t('userTools.back')}</Text>
          </Pressable>
        </View>
        <Text style={styles.cardCopy}>{copy}</Text>
      </View>
    );
  }

  function renderOverview(): React.ReactNode {
    return (
      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('userTools.overview.title')}</Text>
        <Text style={styles.cardCopy}>{t('userTools.overview.copy')}</Text>
        <View style={styles.libraryGrid}>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('wiki_organize')}
          >
            <Text style={styles.librarySectionTitle}>{t('userTools.section.wikiOrganize.title')}</Text>
            <Text style={styles.librarySectionCopy}>{t('userTools.section.wikiOrganize.copy')}</Text>
          </Pressable>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('user_skill')}
          >
            <Text style={styles.librarySectionTitle}>{t('userTools.section.userSkill.title')}</Text>
            <Text style={styles.librarySectionCopy}>{t('userTools.section.userSkill.copy')}</Text>
          </Pressable>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('wiki_preview')}
          >
            <Text style={styles.librarySectionTitle}>{t('userTools.section.wikiPreview.title')}</Text>
            <Text style={styles.librarySectionCopy}>{t('userTools.section.wikiPreview.copy')}</Text>
          </Pressable>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('workspace_manager')}
          >
            <Text style={styles.librarySectionTitle}>{t('userTools.section.workManager.title')}</Text>
            <Text style={styles.librarySectionCopy}>{t('userTools.section.workManager.copy')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderWikiOrganizeSection(): React.ReactNode {
    return (
      <>
        {renderSectionHeader(t('userTools.organize.headerTitle'), t('userTools.organize.headerCopy'))}
        <View style={styles.settingsCard}>
          <View style={styles.inlineActions}>
            <Pressable style={styles.primaryButtonSmall} onPress={onStartWikiOrganize} disabled={busy}>
              <Text style={styles.primaryButtonText}>{t('userTools.organize.start')}</Text>
            </Pressable>
            <Pressable style={styles.primaryButtonSmall} onPress={onStartWikiQualityOptimize} disabled={busy}>
              <Text style={styles.primaryButtonText}>{t('userTools.organize.qualityOptimize')}</Text>
            </Pressable>
            <Pressable style={styles.secondaryButtonSmall} onPress={onRefreshWikiOrganizeStatus} disabled={busy}>
              <Text style={styles.secondaryButtonText}>{t('userTools.organize.refreshStatus')}</Text>
            </Pressable>
          </View>
          {wikiOrganizeStatus ? (
            <View style={styles.deviceRowCard}>
              <Text style={styles.networkName}>{t('userTools.organize.recentJob')}</Text>
              {wikiOrganizeStatus.mode ? <Text style={styles.cardCopy}>{t('userTools.organize.mode', { value: wikiOrganizeStatus.mode })}</Text> : null}
              <Text style={styles.cardCopy}>{t('userTools.organize.status', { value: wikiOrganizeStatus.status })}</Text>
              <Text style={styles.cardCopy}>{t('userTools.organize.jobId', { value: wikiOrganizeStatus.jobId || '-' })}</Text>
              <Text style={styles.cardCopy}>{t('userTools.organize.rounds', { value: String(wikiOrganizeStatus.iterations) })}</Text>
              <Text style={styles.cardCopy}>{t('userTools.organize.processed', { value: String(wikiOrganizeStatus.processedRecords) })}</Text>
              <Text style={styles.cardCopy}>{t('userTools.organize.duration', { value: String(Math.max(0, Math.round(wikiOrganizeStatus.durationMs / 1000))) })}</Text>
              <Text style={styles.cardCopy}>{t('userTools.organize.message', { value: wikiOrganizeStatus.message || '-' })}</Text>
            </View>
          ) : (
            <Text style={styles.cardCopy}>{t('userTools.organize.notStarted')}</Text>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
        </View>
      </>
    );
  }

  function renderUserSkillSection(): React.ReactNode {
    return (
      <>
        {renderSectionHeader(t('userTools.skill.headerTitle'), t('userTools.skill.headerCopy'))}
        <View style={styles.settingsCard}>
          <View style={styles.inlineActions}>
            <Pressable
              style={styles.primaryButtonSmall}
              onPress={onDistillUserSkill}
              disabled={userSkillBusy || busy}
            >
              <Text style={styles.primaryButtonText}>{userSkillBusy ? t('userTools.skill.distilling') : t('userTools.skill.distillButton')}</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButtonSmall}
              onPress={onRefreshUserSkill}
              disabled={userSkillBusy}
            >
              <Text style={styles.secondaryButtonText}>{t('userTools.skill.refreshPreview')}</Text>
            </Pressable>
          </View>
          {userSkillUpdatedAt ? (
            <Text style={styles.cardCopy}>{t('userTools.skill.lastUpdated', { value: userSkillUpdatedAt })}</Text>
          ) : null}
          {userSkillContent ? (
            <MarkdownCardViewer markdown={userSkillContent} styles={styles} />
          ) : (
            <Text style={styles.cardCopy}>
              {t('userTools.skill.emptyHint')}
            </Text>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
        </View>
      </>
    );
  }

  function renderWikiPreviewSection(): React.ReactNode {
    const activePreview = wikiPreviewFiles.find((f) => f.path === activeWikiPreviewPath) || null;

    if (activePreview) {
      return (
        <>
          {renderSectionHeader(t('userTools.wikiReader.title'), t('userTools.wikiReader.viewing', { path: activePreview.path }))}
          <View style={styles.settingsCard}>
            <View style={styles.inlineActions}>
              <Pressable style={styles.secondaryButtonSmall} onPress={() => setActiveWikiPreviewPath('')}>
                <Text style={styles.secondaryButtonText}>{t('userTools.wikiReader.backToList')}</Text>
              </Pressable>
              <Pressable style={styles.primaryButtonSmall} onPress={onRefreshWikiPreview} disabled={busy}>
                <Text style={styles.primaryButtonText}>{t('userTools.wikiReader.refresh')}</Text>
              </Pressable>
            </View>
            <Text style={styles.cardCopy}>{t('userTools.wikiReader.updated', { value: describeFileTimestamp(activePreview.updatedAt) })}</Text>
            <MarkdownCardViewer markdown={activePreview.content || activePreview.preview || ''} styles={styles} />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </>
      );
    }

    return (
      <>
        {renderSectionHeader(t('userTools.wikiPreview.headerTitle'), t('userTools.wikiPreview.headerCopy'))}
        <View style={styles.settingsCard}>
          <Pressable style={styles.primaryButtonSmall} onPress={onRefreshWikiPreview} disabled={busy}>
            <Text style={styles.primaryButtonText}>{t('userTools.wikiPreview.refresh')}</Text>
          </Pressable>
          {wikiPreviewFiles.length === 0 ? <Text style={styles.cardCopy}>{t('userTools.wikiPreview.empty')}</Text> : null}
          {wikiPreviewFiles.map((item) => (
            <Pressable
              key={item.path}
              style={styles.deviceRowCard}
              onPress={() => setActiveWikiPreviewPath(item.path)}
              pressFeedback="scale"
            >
              <Text style={styles.networkName}>{item.path}</Text>
              <Text style={styles.cardCopy}>{t('userTools.wikiReader.updated', { value: describeFileTimestamp(item.updatedAt) })}</Text>
              <Text style={styles.cardCopy} numberOfLines={3}>
                {item.preview || t('userTools.wikiPreview.emptyContent')}
              </Text>
              <Text style={styles.noticeText}>{t('userTools.wikiPreview.clickToRead')}</Text>
            </Pressable>
          ))}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </>
    );
  }

  function renderWorkspaceManagerSection(): React.ReactNode {
    const isDocFile = (name: string) => /\.(md|txt|json|toml|yaml|yml|csv|log)$/i.test(name);
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Reading a file
    if (workFileActivePath) {
      return (
        <>
          {renderSectionHeader(t('userTools.work.readTitle'), workFileActivePath)}
          <View style={styles.settingsCard}>
            <View style={styles.inlineActions}>
              <Pressable style={styles.secondaryButtonSmall} onPress={onCloseWorkFileReader}>
                <Text style={styles.secondaryButtonText}>{t('userTools.work.backToList')}</Text>
              </Pressable>
              <Pressable
                style={styles.primaryButtonSmall}
                onPress={() => onPromoteWorkFile(workFileActivePath)}
                disabled={workFileBusy}
              >
                <Text style={styles.primaryButtonText}>{t('userTools.work.promoteToRaw')}</Text>
              </Pressable>
            </View>
            {workFileBusy ? (
              <ActivityIndicator style={{ marginVertical: 12 }} />
            ) : workFileContent ? (
              <MarkdownCardViewer markdown={workFileContent} styles={styles} />
            ) : (
              <Text style={styles.cardCopy}>{t('userTools.work.cannotRead')}</Text>
            )}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
          </View>
        </>
      );
    }

    // File listing
    return (
      <>
        {renderSectionHeader(t('userTools.work.managerTitle'), workCurrentDir ? `work/${workCurrentDir}/` : 'work/')}
        <View style={styles.settingsCard}>
          <View style={styles.inlineActions}>
            <Pressable style={styles.primaryButtonSmall} onPress={() => onRefreshWorkFiles(workCurrentDir || undefined)} disabled={workFileBusy}>
              <Text style={styles.primaryButtonText}>{workFileBusy ? t('userTools.work.refreshing') : t('userTools.work.refreshList')}</Text>
            </Pressable>
            {workCurrentDir ? (
              <Pressable
                style={styles.secondaryButtonSmall}
                onPress={() => {
                  const parent = workCurrentDir.includes('/')
                    ? workCurrentDir.slice(0, workCurrentDir.lastIndexOf('/'))
                    : '';
                  onNavigateWorkDir(parent);
                }}
              >
                <Text style={styles.secondaryButtonText}>{t('userTools.work.goUp')}</Text>
              </Pressable>
            ) : null}
          </View>
          {workFiles.length === 0 && !workFileBusy ? (
            <Text style={styles.cardCopy}>{t('userTools.work.emptyDir')}</Text>
          ) : null}
          {workFiles.map((file) => (
            <View key={file.path || file.name} style={styles.deviceRowCard}>
              <Pressable
                onPress={
                  file.isDir
                    ? () => onNavigateWorkDir(file.path)
                    : isDocFile(file.name)
                      ? () => onReadWorkFile(file.path)
                      : undefined
                }
                disabled={!file.isDir && !isDocFile(file.name)}
                pressFeedback="scale"
              >
                <Text style={styles.networkName}>
                  {file.isDir ? '📁 ' : '📄 '}{file.name}
                </Text>
                {!file.isDir ? (
                  <Text style={styles.cardCopy}>
                    {formatSize(file.size)}　{file.modifiedAt ? describeFileTimestamp(file.modifiedAt) : ''}
                  </Text>
                ) : (
                  <Text style={styles.cardCopy}>{t('userTools.work.clickSubdir')}</Text>
                )}
                {!file.isDir && isDocFile(file.name) ? (
                  <Text style={styles.noticeText}>{t('userTools.work.clickView')}</Text>
                ) : null}
              </Pressable>
              {!file.isDir ? (
                <View style={[styles.inlineActions, { marginTop: 8 }]}>
                  <Pressable
                    style={styles.primaryButtonSmall}
                    onPress={() => onPromoteWorkFile(file.path)}
                    disabled={workFileBusy}
                  >
                    <Text style={styles.primaryButtonText}>{t('userTools.work.promoteToRaw')}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryButtonSmall}
                    onPress={() => onDeleteWorkFile(file.path)}
                    disabled={workFileBusy}
                  >
                    <Text style={styles.secondaryButtonText}>{t('userTools.work.delete')}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
        </View>
      </>
    );
  }

  if (activeSection === 'wiki_organize') return <>{renderWikiOrganizeSection()}</>;
  if (activeSection === 'user_skill') return <>{renderUserSkillSection()}</>;
  if (activeSection === 'wiki_preview') return <>{renderWikiPreviewSection()}</>;
  if (activeSection === 'workspace_manager') return <>{renderWorkspaceManagerSection()}</>;
  return <>{renderOverview()}</>;
}
