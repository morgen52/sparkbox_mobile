import React from 'react';
import { ActivityIndicator, Linking, Text, TextInput, View } from 'react-native';
import { AnimatedPressable as Pressable } from './AnimatedPressable';
import type { Session } from '../authFlow';
import { AuthSetupCard, SignedInSetupCard } from './SetupAccountCard';
import { describeActivationStatus } from '../appShell';
import { describeSetupDeviceLabel } from '../householdState';
import type { LocalSetupNetwork } from '../localSetupApi';

type InvitePreview = {
  householdName: string;
  role: 'owner' | 'member';
  spaceName?: string | null;
} | null;

type ClaimPayload = {
  deviceId: string;
  claimCode: string;
  raw: string;
} | null;

type ProvisionStatus = {
  device_id?: string;
  status?: string;
};

type SetupFlowPaneProps = {
  styles: Record<string, any>;
  householdName: string;
  session: Session | null;
  canReturnToShell: boolean;
  returnToShell: () => void;
  resetFlow: () => void;
  logout: () => void;
  claimStepVisible: boolean;
  activeStep: number;
  setupStepLabels: string[];
  step1Collapsed: boolean;
  step2Visible: boolean;
  step2Collapsed: boolean;
  step3Visible: boolean;
  step3Collapsed: boolean;
  step4Visible: boolean;
  authCardTitle: string;
  authCardCopy: string;
  authMode: 'login' | 'register' | 'join';
  email: string;
  displayName: string;
  inviteCode: string;
  password: string;
  invitePreviewBusy: boolean;
  invitePreviewError: string;
  invitePreview: InvitePreview;
  authError: string;
  authBusy: boolean;
  authSubmitLabel: string;
  claimInput: string;
  claimPayload: ClaimPayload;
  claimError: string;
  cameraPermissionRecoveryMessage: string;
  claimBusy: boolean;
  bleError: string;
  setupDeviceId: string;
  hotspotSsid: string;
  hotspotStage: string;
  setupFlowKind: 'first_run' | 'reprovision';
  pairingToken: string;
  provisionBusy: boolean;
  provisionMessage: string;
  homeWifiTarget: { ssid: string; password: string } | null;
  selectedSsid: string;
  previousInternetSsid: string | null;
  networksBusy: boolean;
  networks: LocalSetupNetwork[];
  selectedNetwork: LocalSetupNetwork | null;
  networkSheetOpen: boolean;
  manualEntry: boolean;
  portalUrl: string | null;
  completedDeviceId: string;
  setupPageState: ProvisionStatus | null;
  onCaptureStepOffset: (step: 1 | 2 | 3 | 4, event: any) => void;
  onChangeAuthMode: (mode: 'login' | 'register' | 'join') => void;
  onChangeEmail: (value: string) => void;
  onChangeDisplayName: (value: string) => void;
  onChangeInviteCode: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmitAuth: () => void;
  renderInvitePreviewSummary: (householdName: string, spaceName?: string | null) => string;
  onApplyClaimInput: (value: string) => void;
  onOpenScanner: () => void;
  onStartClaim: () => void;
  onBeginHotspotOnboarding: () => void;
  onOpenInternetPanel: () => void;
  onRefreshNetworks: () => void;
  onOpenManualEntry: () => void;
  onChooseNetwork: (network: LocalSetupNetwork) => void;
  onStartCloudVerification: () => void;
};

export function SetupFlowPane({
  styles,
  householdName,
  session,
  canReturnToShell,
  returnToShell,
  resetFlow,
  logout,
  claimStepVisible,
  activeStep,
  setupStepLabels,
  step1Collapsed,
  step2Visible,
  step2Collapsed,
  step3Visible,
  step3Collapsed,
  step4Visible,
  authCardTitle,
  authCardCopy,
  authMode,
  email,
  displayName,
  inviteCode,
  password,
  invitePreviewBusy,
  invitePreviewError,
  invitePreview,
  authError,
  authBusy,
  authSubmitLabel,
  claimInput,
  claimPayload,
  claimError,
  cameraPermissionRecoveryMessage,
  claimBusy,
  bleError,
  setupDeviceId,
  hotspotSsid,
  hotspotStage,
  setupFlowKind,
  pairingToken,
  provisionBusy,
  provisionMessage,
  homeWifiTarget,
  selectedSsid,
  previousInternetSsid,
  networksBusy,
  networks,
  selectedNetwork,
  networkSheetOpen,
  manualEntry,
  portalUrl,
  completedDeviceId,
  setupPageState,
  onCaptureStepOffset,
  onChangeAuthMode,
  onChangeEmail,
  onChangeDisplayName,
  onChangeInviteCode,
  onChangePassword,
  onSubmitAuth,
  renderInvitePreviewSummary,
  onApplyClaimInput,
  onOpenScanner,
  onStartClaim,
  onBeginHotspotOnboarding,
  onOpenInternetPanel,
  onRefreshNetworks,
  onOpenManualEntry,
  onChooseNetwork,
  onStartCloudVerification,
}: SetupFlowPaneProps) {
  // SetupFlowPane owns only the onboarding presentation. The underlying
  // hotspot/pairing state machine still lives in App so reprovision and
  // first-run claim can share one source of truth.
  if (!session) {
    return (
      <>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>开始使用 Sparkbox</Text>
          <Text style={styles.authLogo}>SparkBox</Text>
        </View>
        <AuthSetupCard
          styles={styles}
          authCardTitle={authCardTitle}
          authCardCopy={authCardCopy}
          authMode={authMode}
          email={email}
          displayName={displayName}
          inviteCode={inviteCode}
          password={password}
          invitePreviewBusy={invitePreviewBusy}
          invitePreviewError={invitePreviewError}
          invitePreview={invitePreview}
          authError={authError}
          authBusy={authBusy}
          authSubmitLabel={authSubmitLabel}
          onLayout={(event) => onCaptureStepOffset(1, event)}
          onChangeAuthMode={onChangeAuthMode}
          onChangeEmail={onChangeEmail}
          onChangeDisplayName={onChangeDisplayName}
          onChangeInviteCode={onChangeInviteCode}
          onChangePassword={onChangePassword}
          onSubmit={onSubmitAuth}
          renderInvitePreviewSummary={renderInvitePreviewSummary}
        />
      </>
    );
  }

  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>设备引导</Text>
        <Text style={styles.title}>绑定设备，完成联网</Text>
        <Text style={styles.subtitle}>
          {claimStepVisible
            ? `先扫描设备标签，将 Sparkbox 绑定到 ${householdName}，再引导它连接家中 Wi-Fi。`
            : '该设备已在你的家庭中，接下来只需重新配置 Wi-Fi。'}
        </Text>
      </View>

      {canReturnToShell ? (
        <View style={styles.inlineActions}>
          <Pressable style={styles.secondaryButtonSmall} onPress={returnToShell}>
            <Text style={styles.secondaryButtonText}>返回家庭首页</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.stepRail}>
        {[1, 2, 3, 4].map((step) => {
          const done = step < activeStep;
          const current = step === activeStep;
          return (
            <View
              key={step}
              style={[
                styles.stepRailItem,
                done ? styles.stepRailItemDone : null,
                current ? styles.stepRailItemCurrent : null,
              ]}
            >
              <Text style={[styles.stepRailNumber, done || current ? styles.stepRailNumberActive : null]}>
                {step}
              </Text>
              <Text style={[styles.stepRailLabel, done || current ? styles.stepRailLabelActive : null]}>
                {setupStepLabels[step - 1]}
              </Text>
            </View>
          );
        })}
      </View>

      <SignedInSetupCard
        styles={styles}
        displayName={session.user.display_name}
        householdName={session.household.name}
        canReturnToShell={canReturnToShell}
        onLogout={logout}
        onResetFlow={resetFlow}
      />

      {session && claimStepVisible ? (
        <View style={styles.card} onLayout={(event) => onCaptureStepOffset(1, event)}>
          <Text style={styles.cardTitle}>1. 扫描设备标签</Text>
          {step1Collapsed ? (
            <View style={styles.stepSummary}>
              <Text style={styles.stepSummaryTitle}>{describeSetupDeviceLabel(claimPayload?.deviceId)}</Text>
              <Text style={styles.stepSummaryCopy}>
                已为 {householdName} 预留，接下来可继续引导设备连接家中 Wi-Fi。
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.cardCopy}>
                该步骤会先将设备预绑定到你的家庭，然后再进行配网。
              </Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                numberOfLines={4}
                placeholder="请粘贴设备配置码或扫码获取"
                placeholderTextColor="#7e8a83"
                style={[styles.input, styles.textArea]}
                value={claimInput}
                onChangeText={onApplyClaimInput}
              />
              {claimPayload ? (
                <View style={styles.claimPreview}>
                  <Text style={styles.claimPreviewLabel}>识别到设备</Text>
                  <Text style={styles.claimPreviewValue}>{describeSetupDeviceLabel(claimPayload.deviceId)}</Text>
                  <Text style={styles.cardCopy}>配置码有效，下一步进入 Wi-Fi 配置。</Text>
                </View>
              ) : null}
              {claimError ? <Text style={styles.errorText}>{claimError}</Text> : null}
              <View style={styles.inlineActions}>
                <Pressable style={styles.primaryButtonSmall} onPress={onOpenScanner}>
                  <Text style={styles.primaryButtonText}>扫码</Text>
                </Pressable>
                {claimError === cameraPermissionRecoveryMessage ? (
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => void Linking.openSettings()}>
                    <Text style={styles.secondaryButtonText}>打开应用设置</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.primaryButtonSmall} onPress={onStartClaim} disabled={claimBusy}>
                  {claimBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>绑定设备</Text>}
                </Pressable>
              </View>
            </>
          )}
        </View>
      ) : null}

      {session && !claimStepVisible ? (
        <View style={styles.card} onLayout={(event) => onCaptureStepOffset(1, event)}>
          <Text style={styles.cardTitle}>1. 准备设备</Text>
          {step1Collapsed ? (
            <View style={styles.stepSummary}>
              <Text style={styles.stepSummaryTitle}>{describeSetupDeviceLabel(setupDeviceId)}</Text>
              <Text style={styles.stepSummaryCopy}>
                该设备已在你的家庭中，只需让它进入可重新配网状态。
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.cardCopy}>
                无需再次扫码。如果设备换了位置，请先通电并等待出现 {hotspotSsid}；若仍在旧网络，请在热点出现后继续本步骤。
              </Text>
              <View style={styles.claimPreview}>
                <Text style={styles.claimPreviewLabel}>设备</Text>
                <Text style={styles.claimPreviewValue}>{describeSetupDeviceLabel(setupDeviceId)}</Text>
              </View>
              {bleError ? <Text style={styles.errorText}>{bleError}</Text> : null}
            </>
          )}
        </View>
      ) : null}

      {step2Visible ? (
        <View style={styles.card} onLayout={(event) => onCaptureStepOffset(2, event)}>
          <Text style={styles.cardTitle}>2. 连接设备热点</Text>
          {step2Collapsed ? (
            <View style={styles.stepSummary}>
              <Text style={styles.stepSummaryTitle}>{hotspotSsid}</Text>
              <Text style={styles.stepSummaryCopy}>
                手机已连上设备热点，下一步配置家中 Wi-Fi。
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.cardCopy}>
                设备已开启临时配置网络，应用会尝试协助你切换到该网络。
              </Text>
              {hotspotStage === 'joining_setup' || provisionBusy ? (
                <View style={styles.row}>
                  <ActivityIndicator color="#0b6e4f" />
                  <Text style={styles.loadingInline}>{provisionMessage}</Text>
                </View>
              ) : null}
              {bleError ? <Text style={styles.errorText}>{bleError}</Text> : null}
              {setupFlowKind === 'reprovision' && hotspotStage === 'idle' ? (
                <Pressable
                  style={styles.primaryButton}
                  onPress={onBeginHotspotOnboarding}
                  disabled={!setupDeviceId}
                >
                  <Text style={styles.primaryButtonText}>连接到 {hotspotSsid}</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={setupFlowKind === 'reprovision' && hotspotStage === 'idle' ? styles.secondaryButton : styles.primaryButton}
                onPress={onOpenInternetPanel}
                disabled={setupFlowKind === 'first_run' && !pairingToken}
              >
                <Text
                  style={
                    setupFlowKind === 'reprovision' && hotspotStage === 'idle'
                      ? styles.secondaryButtonText
                      : styles.primaryButtonText
                  }
                >
                  打开 Wi-Fi 设置
                </Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}

      {step3Visible ? (
        <View style={styles.card} onLayout={(event) => onCaptureStepOffset(3, event)}>
          <Text style={styles.cardTitle}>3. 选择家中 Wi-Fi</Text>
          {step3Collapsed ? (
            <View style={styles.stepSummary}>
              <Text style={styles.stepSummaryTitle}>
                {homeWifiTarget?.ssid || selectedSsid || previousInternetSsid || '已选择家中 Wi-Fi'}
              </Text>
              <Text style={styles.stepSummaryCopy}>
                设备正使用该网络完成退出配置与激活。
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.cardCopy}>
                {hotspotStage === 'local_setup'
                  ? `手机已连接 ${hotspotSsid}，请选择设备要连接的家中 Wi-Fi。`
                  : '设备已收到你的 Wi-Fi 选择，正在完成配置。'}
              </Text>
              {hotspotStage === 'failed' && bleError ? <Text style={styles.errorText}>{bleError}</Text> : null}
              {hotspotStage === 'local_setup' ? (
                <>
                  <View style={styles.inlineActions}>
                    <Pressable
                      style={styles.secondaryButtonSmall}
                      onPress={onRefreshNetworks}
                      disabled={networksBusy || provisionBusy}
                    >
                      {networksBusy ? <ActivityIndicator color="#17352a" /> : <Text style={styles.secondaryButtonText}>刷新附近 Wi-Fi</Text>}
                    </Pressable>
                    <Pressable
                      style={styles.secondaryButtonSmall}
                      onPress={onOpenManualEntry}
                      disabled={provisionBusy}
                    >
                      <Text style={styles.secondaryButtonText}>手动输入</Text>
                    </Pressable>
                  </View>
                  {networks.map((network) => {
                    const unsupported = network.support_level === 'unsupported';
                    const selected = selectedNetwork?.ssid === network.ssid && networkSheetOpen && !manualEntry;
                    return (
                      <Pressable
                        key={network.ssid}
                        style={[
                          styles.networkRow,
                          unsupported ? styles.networkRowDisabled : null,
                          selected ? styles.selectionCard : null,
                        ]}
                        onPress={() => onChooseNetwork(network)}
                        disabled={unsupported || provisionBusy}
                      >
                        <View style={styles.networkLeft}>
                          <Text style={styles.networkName}>{network.ssid}</Text>
                          <Text style={styles.networkMeta}>
                            {network.requires_password ? String(network.security || 'secured').toUpperCase() : '开放网络'} · {Math.round(Number(network.signal_percent || 0))}%
                          </Text>
                          {network.support_reason ? <Text style={styles.networkWarning}>{network.support_reason}</Text> : null}
                        </View>
                        <View style={styles.networkTags}>
                          {network.known ? <Text style={styles.tag}>已保存</Text> : null}
                          {network.support_level === 'warning' ? <Text style={styles.tagWarning}>可能需要网页登录</Text> : null}
                          {unsupported ? <Text style={styles.tagMuted}>暂不支持</Text> : null}
                          {!unsupported ? (
                            <View style={[styles.rowAction, selected ? null : styles.rowActionDisabled]}>
                              <Text style={[styles.linkText, !selected ? styles.linkTextDisabled : null]}>{selected ? '已选择' : '选择'}</Text>
                            </View>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </>
              ) : null}
            </>
          )}
        </View>
      ) : null}

      {step4Visible ? (
        <View style={styles.card} onLayout={(event) => onCaptureStepOffset(4, event)}>
          <Text style={styles.cardTitle}>4. 激活设备</Text>
          <Text style={styles.cardCopy}>{provisionMessage}</Text>
          {setupPageState?.status ? (
            <Text style={styles.statusText}>当前进度：{describeActivationStatus(setupPageState.status)}</Text>
          ) : null}
          {provisionBusy && !portalUrl ? <ActivityIndicator color="#0b6e4f" /> : null}
          {portalUrl ? (
            <View style={styles.portalBox}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => void Linking.openURL(portalUrl)}
              >
                <Text style={styles.primaryButtonText}>打开登录页面</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={onStartCloudVerification}
              >
                <Text style={styles.secondaryButtonText}>登录后重新检查</Text>
              </Pressable>
            </View>
          ) : null}
          {completedDeviceId ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>设备已准备就绪</Text>
              <Text style={styles.successCopy}>
                {describeSetupDeviceLabel(completedDeviceId)} 已在 {householdName} 上线。现在可以返回家庭首页正常使用。
              </Text>
              {canReturnToShell ? (
                <View style={styles.inlineActions}>
                  <Pressable style={styles.primaryButtonSmall} onPress={returnToShell}>
                    <Text style={styles.primaryButtonText}>返回家庭首页</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </>
  );
}
