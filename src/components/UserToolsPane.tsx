import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { describeFileTimestamp } from '../appShell';
import type { RawWorkFile } from '../householdApi';
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
            <Text style={styles.summaryRefreshButtonText}>返回</Text>
          </Pressable>
        </View>
        <Text style={styles.cardCopy}>{copy}</Text>
      </View>
    );
  }

  function renderOverview(): React.ReactNode {
    return (
      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>个人工具</Text>
        <Text style={styles.cardCopy}>这些功能属于你个人，不依赖于某个具体空间。</Text>
        <View style={styles.libraryGrid}>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('wiki_organize')}
          >
            <Text style={styles.librarySectionTitle}>个人画像与Wiki整理</Text>
            <Text style={styles.librarySectionCopy}>后台多轮整理未归档 raw 并写入 wiki。</Text>
          </Pressable>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('user_skill')}
          >
            <Text style={styles.librarySectionTitle}>用户 Skill</Text>
            <Text style={styles.librarySectionCopy}>提炼你的思维画像与认知模型。</Text>
          </Pressable>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('wiki_preview')}
          >
            <Text style={styles.librarySectionTitle}>Wiki 预览</Text>
            <Text style={styles.librarySectionCopy}>浏览 wiki 下的 Markdown 内容。</Text>
          </Pressable>
          <Pressable
            style={styles.librarySectionCard}
            onPress={() => onChangeActiveSection('workspace_manager')}
          >
            <Text style={styles.librarySectionTitle}>工作区管理</Text>
            <Text style={styles.librarySectionCopy}>浏览 work/ 目录文件，可转入 raw 触发整理。</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderWikiOrganizeSection(): React.ReactNode {
    return (
      <>
        {renderSectionHeader('个人画像与Wiki整理', '后台运行多轮任务，整理素材并优化 Wiki 文档质量与结构。')}
        <View style={styles.settingsCard}>
          <View style={styles.inlineActions}>
            <Pressable style={styles.primaryButtonSmall} onPress={onStartWikiOrganize} disabled={busy}>
              <Text style={styles.primaryButtonText}>启动整理</Text>
            </Pressable>
            <Pressable style={styles.primaryButtonSmall} onPress={onStartWikiQualityOptimize} disabled={busy}>
              <Text style={styles.primaryButtonText}>Wiki质量优化</Text>
            </Pressable>
            <Pressable style={styles.secondaryButtonSmall} onPress={onRefreshWikiOrganizeStatus} disabled={busy}>
              <Text style={styles.secondaryButtonText}>刷新状态</Text>
            </Pressable>
          </View>
          {wikiOrganizeStatus ? (
            <View style={styles.deviceRowCard}>
              <Text style={styles.networkName}>最近整理任务</Text>
              {wikiOrganizeStatus.mode ? <Text style={styles.cardCopy}>任务模式：{wikiOrganizeStatus.mode}</Text> : null}
              <Text style={styles.cardCopy}>状态：{wikiOrganizeStatus.status}</Text>
              <Text style={styles.cardCopy}>任务ID：{wikiOrganizeStatus.jobId || '-'}</Text>
              <Text style={styles.cardCopy}>轮数：{wikiOrganizeStatus.iterations}</Text>
              <Text style={styles.cardCopy}>处理记录：{wikiOrganizeStatus.processedRecords}</Text>
              <Text style={styles.cardCopy}>耗时：{Math.max(0, Math.round(wikiOrganizeStatus.durationMs / 1000))} 秒</Text>
              <Text style={styles.cardCopy}>信息：{wikiOrganizeStatus.message || '-'}</Text>
            </View>
          ) : (
            <Text style={styles.cardCopy}>尚未启动整理任务。</Text>
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
        {renderSectionHeader('用户 Skill', '基于你的文件、对话和画像，提炼你的思维模型与认知框架。')}
        <View style={styles.settingsCard}>
          <View style={styles.inlineActions}>
            <Pressable
              style={styles.primaryButtonSmall}
              onPress={onDistillUserSkill}
              disabled={userSkillBusy || busy}
            >
              <Text style={styles.primaryButtonText}>{userSkillBusy ? '提炼中…' : '提炼用户 Skill'}</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButtonSmall}
              onPress={onRefreshUserSkill}
              disabled={userSkillBusy}
            >
              <Text style={styles.secondaryButtonText}>刷新预览</Text>
            </Pressable>
          </View>
          {userSkillUpdatedAt ? (
            <Text style={styles.cardCopy}>上次更新：{userSkillUpdatedAt}</Text>
          ) : null}
          {userSkillContent ? (
            <MarkdownCardViewer markdown={userSkillContent} styles={styles} />
          ) : (
            <Text style={styles.cardCopy}>
              尚未提炼用户 Skill。点击「提炼用户 Skill」按钮，系统将分析你的文件和对话记录，
              生成个人思维画像（心智模型、决策启发式等）。
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
          {renderSectionHeader('Wiki 阅读器', `正在查看 ${activePreview.path}`)}
          <View style={styles.settingsCard}>
            <View style={styles.inlineActions}>
              <Pressable style={styles.secondaryButtonSmall} onPress={() => setActiveWikiPreviewPath('')}>
                <Text style={styles.secondaryButtonText}>返回文件列表</Text>
              </Pressable>
              <Pressable style={styles.primaryButtonSmall} onPress={onRefreshWikiPreview} disabled={busy}>
                <Text style={styles.primaryButtonText}>刷新预览</Text>
              </Pressable>
            </View>
            <Text style={styles.cardCopy}>更新：{describeFileTimestamp(activePreview.updatedAt)}</Text>
            <MarkdownCardViewer markdown={activePreview.content || activePreview.preview || ''} styles={styles} />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </>
      );
    }

    return (
      <>
        {renderSectionHeader('Wiki 预览', '每个 Wiki 文件都是一个条目，点击进入 Markdown 阅读器。')}
        <View style={styles.settingsCard}>
          <Pressable style={styles.primaryButtonSmall} onPress={onRefreshWikiPreview} disabled={busy}>
            <Text style={styles.primaryButtonText}>刷新预览</Text>
          </Pressable>
          {wikiPreviewFiles.length === 0 ? <Text style={styles.cardCopy}>暂无可预览的 Wiki 文件。</Text> : null}
          {wikiPreviewFiles.map((item) => (
            <Pressable
              key={item.path}
              style={styles.deviceRowCard}
              onPress={() => setActiveWikiPreviewPath(item.path)}
              pressFeedback="scale"
            >
              <Text style={styles.networkName}>{item.path}</Text>
              <Text style={styles.cardCopy}>更新：{describeFileTimestamp(item.updatedAt)}</Text>
              <Text style={styles.cardCopy} numberOfLines={3}>
                {item.preview || '（空内容）'}
              </Text>
              <Text style={styles.noticeText}>点击进入阅读器</Text>
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
          {renderSectionHeader('工作区文件阅读', workFileActivePath)}
          <View style={styles.settingsCard}>
            <View style={styles.inlineActions}>
              <Pressable style={styles.secondaryButtonSmall} onPress={onCloseWorkFileReader}>
                <Text style={styles.secondaryButtonText}>返回文件列表</Text>
              </Pressable>
              <Pressable
                style={styles.primaryButtonSmall}
                onPress={() => onPromoteWorkFile(workFileActivePath)}
                disabled={workFileBusy}
              >
                <Text style={styles.primaryButtonText}>转入 raw</Text>
              </Pressable>
            </View>
            {workFileBusy ? (
              <ActivityIndicator style={{ marginVertical: 12 }} />
            ) : workFileContent ? (
              <MarkdownCardViewer markdown={workFileContent} styles={styles} />
            ) : (
              <Text style={styles.cardCopy}>（无法读取文件内容）</Text>
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
        {renderSectionHeader('工作区管理', workCurrentDir ? `work/${workCurrentDir}/` : 'work/')}
        <View style={styles.settingsCard}>
          <View style={styles.inlineActions}>
            <Pressable style={styles.primaryButtonSmall} onPress={() => onRefreshWorkFiles(workCurrentDir || undefined)} disabled={workFileBusy}>
              <Text style={styles.primaryButtonText}>{workFileBusy ? '刷新中…' : '刷新列表'}</Text>
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
                <Text style={styles.secondaryButtonText}>↑ 返回上级</Text>
              </Pressable>
            ) : null}
          </View>
          {workFiles.length === 0 && !workFileBusy ? (
            <Text style={styles.cardCopy}>当前目录为空。</Text>
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
                  <Text style={styles.cardCopy}>点击进入子目录</Text>
                )}
                {!file.isDir && isDocFile(file.name) ? (
                  <Text style={styles.noticeText}>点击查看内容</Text>
                ) : null}
              </Pressable>
              {!file.isDir ? (
                <View style={[styles.inlineActions, { marginTop: 8 }]}>
                  <Pressable
                    style={styles.primaryButtonSmall}
                    onPress={() => onPromoteWorkFile(file.path)}
                    disabled={workFileBusy}
                  >
                    <Text style={styles.primaryButtonText}>转入 raw</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryButtonSmall}
                    onPress={() => onDeleteWorkFile(file.path)}
                    disabled={workFileBusy}
                  >
                    <Text style={styles.secondaryButtonText}>删除</Text>
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
