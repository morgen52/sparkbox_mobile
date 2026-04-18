import React from 'react';
import { ActivityIndicator, Linking, Text, TextInput, View } from 'react-native';
import { useT } from '../i18n';
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
  const t = useT();

  if (!session) {
    return (
      <>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{t('setup.getStarted')}</Text>
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
        <Text style={styles.eyebrow}>{t('setup.deviceGuide')}</Text>
        <Text style={styles.title}>{t('setup.bindAndConnect')}</Text>
        <Text style={styles.subtitle}>
          {claimStepVisible
            ? t('setup.claimSubtitle', { householdName })
            : t('setup.reprovisionSubtitle')}
        </Text>
      </View>

      {canReturnToShell ? (
        <View style={styles.inlineActions}>
          <Pressable style={styles.secondaryButtonSmall} onPress={returnToShell}>
            <Text style={styles.secondaryButtonText}>{t('setup.returnHome')}</Text>
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
          <Text style={styles.cardTitle}>{t('setup.step1ScanLabel')}</Text>
          {step1Collapsed ? (
            <View style={styles.stepSummary}>
              <Text style={styles.stepSummaryTitle}>{describeSetupDeviceLabel(claimPayload?.deviceId)}</Text>
              <Text style={styles.stepSummaryCopy}>
                {t('setup.claimReserved', { householdName })}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.cardCopy}>
                {t('setup.claimExplain')}
              </Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                numberOfLines={4}
                placeholder={t('setup.claimInputPlaceholder')}
                placeholderTextColor="#7e8a83"
                style={[styles.input, styles.textArea]}
                value={claimInput}
                onChangeText={onApplyClaimInput}
              />
              {claimPayload ? (
                <View style={styles.claimPreview}>
                  <Text style={styles.claimPreviewLabel}>{t('setup.deviceRecognized')}</Text>
                  <Text style={styles.claimPreviewValue}>{describeSetupDeviceLabel(claimPayload.deviceId)}</Text>
                  <Text style={styles.cardCopy}>{t('setup.claimCodeValid')}</Text>
                </View>
              ) : null}
              {claimError ? <Text style={styles.errorText}>{claimError}</Text> : null}
              <View style={styles.inlineActions}>
                <Pressable style={styles.primaryButtonSmall} onPress={onOpenScanner}>
                  <Text style={styles.primaryButtonText}>{t('setup.scan')}</Text>
                </Pressable>
                {claimError === cameraPermissionRecoveryMessage ? (
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => void Linking.openSettings()}>
                    <Text style={styles.secondaryButtonText}>{t('setup.openAppSettings')}</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.primaryButtonSmall} onPress={onStartClaim} disabled={claimBusy}>
                  {claimBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{t('setup.bindDevice')}</Text>}
                </Pressable>
              </View>
            </>
          )}
        </View>
      ) : null}

      {session && !claimStepVisible ? (
        <View style={styles.card} onLayout={(event) => onCaptureStepOffset(1, event)}>
          <Text style={styles.cardTitle}>{t('setup.step1Prepare')}</Text>
          {step1Collapsed ? (
            <View style={styles.stepSummary}>
              <Text style={styles.stepSummaryTitle}>{describeSetupDeviceLabel(setupDeviceId)}</Text>
              <Text style={styles.stepSummaryCopy}>
                {t('setup.reprovisionReady')}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.cardCopy}>
                {t('setup.reprovisionExplain', { hotspotSsid })}
              </Text>
              <View style={styles.claimPreview}>
                <Text style={styles.claimPreviewLabel}>{t('setup.deviceLabel')}</Text>
                <Text style={styles.claimPreviewValue}>{describeSetupDeviceLabel(setupDeviceId)}</Text>
              </View>
              {bleError ? <Text style={styles.errorText}>{bleError}</Text> : null}
            </>
          )}
        </View>
      ) : null}

      {step2Visible ? (
        <View style={styles.card} onLayout={(event) => onCaptureStepOffset(2, event)}>
          <Text style={styles.cardTitle}>{t('setup.step2Hotspot')}</Text>
          {step2Collapsed ? (
            <View style={styles.stepSummary}>
              <Text style={styles.stepSummaryTitle}>{hotspotSsid}</Text>
              <Text style={styles.stepSummaryCopy}>
                {t('setup.hotspotConnectedCopy')}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.cardCopy}>
                {t('setup.hotspotExplain')}
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
                  <Text style={styles.primaryButtonText}>{t('setup.connectToHotspot', { hotspotSsid })}</Text>
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
                  {t('setup.openWifiSettings')}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}

      {step3Visible ? (
        <View style={styles.card} onLayout={(event) => onCaptureStepOffset(3, event)}>
          <Text style={styles.cardTitle}>{t('setup.step3Wifi')}</Text>
          {step3Collapsed ? (
            <View style={styles.stepSummary}>
              <Text style={styles.stepSummaryTitle}>
                {homeWifiTarget?.ssid || selectedSsid || previousInternetSsid || t('setup.wifiSelected')}
              </Text>
              <Text style={styles.stepSummaryCopy}>
                {t('setup.wifiActivating')}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.cardCopy}>
                {hotspotStage === 'local_setup'
                  ? t('setup.localSetupPrompt', { hotspotSsid })
                  : t('setup.wifiConfiguring')}
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
                      {networksBusy ? <ActivityIndicator color="#17352a" /> : <Text style={styles.secondaryButtonText}>{t('setup.refreshWifi')}</Text>}
                    </Pressable>
                    <Pressable
                      style={styles.secondaryButtonSmall}
                      onPress={onOpenManualEntry}
                      disabled={provisionBusy}
                    >
                      <Text style={styles.secondaryButtonText}>{t('setup.manualEntry')}</Text>
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
                            {network.requires_password ? String(network.security || 'secured').toUpperCase() : t('setup.openNetwork')} · {Math.round(Number(network.signal_percent || 0))}%
                          </Text>
                          {network.support_reason ? <Text style={styles.networkWarning}>{network.support_reason}</Text> : null}
                        </View>
                        <View style={styles.networkTags}>
                          {network.known ? <Text style={styles.tag}>{t('setup.saved')}</Text> : null}
                          {network.support_level === 'warning' ? <Text style={styles.tagWarning}>{t('setup.mayNeedPortal')}</Text> : null}
                          {unsupported ? <Text style={styles.tagMuted}>{t('setup.unsupported')}</Text> : null}
                          {!unsupported ? (
                            <View style={[styles.rowAction, selected ? null : styles.rowActionDisabled]}>
                              <Text style={[styles.linkText, !selected ? styles.linkTextDisabled : null]}>{selected ? t('setup.selected') : t('setup.select')}</Text>
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
          <Text style={styles.cardTitle}>{t('setup.step4Activate')}</Text>
          <Text style={styles.cardCopy}>{provisionMessage}</Text>
          {setupPageState?.status ? (
            <Text style={styles.statusText}>{t('setup.currentProgress')}{describeActivationStatus(setupPageState.status)}</Text>
          ) : null}
          {provisionBusy && !portalUrl ? <ActivityIndicator color="#0b6e4f" /> : null}
          {portalUrl ? (
            <View style={styles.portalBox}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => void Linking.openURL(portalUrl)}
              >
                <Text style={styles.primaryButtonText}>{t('setup.openLoginPage')}</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={onStartCloudVerification}
              >
                <Text style={styles.secondaryButtonText}>{t('setup.recheckAfterLogin')}</Text>
              </Pressable>
            </View>
          ) : null}
          {completedDeviceId ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>{t('setup.deviceReady')}</Text>
              <Text style={styles.successCopy}>
                {t('setup.deviceOnline', { deviceLabel: describeSetupDeviceLabel(completedDeviceId), householdName })}
              </Text>
              {canReturnToShell ? (
                <View style={styles.inlineActions}>
                  <Pressable style={styles.primaryButtonSmall} onPress={returnToShell}>
                    <Text style={styles.primaryButtonText}>{t('setup.returnHome')}</Text>
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
