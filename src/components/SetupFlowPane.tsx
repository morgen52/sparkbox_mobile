import React from 'react';
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from 'react-native';
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
  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Sparkbox setup</Text>
        <Text style={styles.title}>Find it first. Bring it online second.</Text>
        <Text style={styles.subtitle}>
          {claimStepVisible
            ? `Scan the device label, reserve Sparkbox for ${householdName}, then guide it onto home Wi-Fi.`
            : 'Sparkbox is already in your household. Get it ready for Wi-Fi again.'}
        </Text>
      </View>

      {canReturnToShell ? (
        <View style={styles.inlineActions}>
          <Pressable style={styles.secondaryButtonSmall} onPress={returnToShell}>
            <Text style={styles.secondaryButtonText}>Back to household</Text>
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

      {!session ? (
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
      ) : (
        <SignedInSetupCard
          styles={styles}
          displayName={session.user.display_name}
          householdName={session.household.name}
          canReturnToShell={canReturnToShell}
          onLogout={logout}
          onReturnToShell={returnToShell}
          onResetFlow={resetFlow}
        />
      )}

      {session && claimStepVisible ? (
        <View style={styles.card} onLayout={(event) => onCaptureStepOffset(1, event)}>
          <Text style={styles.cardTitle}>1. Scan the Sparkbox label</Text>
          {step1Collapsed ? (
            <View style={styles.stepSummary}>
              <Text style={styles.stepSummaryTitle}>{describeSetupDeviceLabel(claimPayload?.deviceId)}</Text>
              <Text style={styles.stepSummaryCopy}>
                Reserved for {householdName}. The app can now guide Sparkbox onto home Wi-Fi.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.cardCopy}>
                This reserves the device for your household immediately. Wi-Fi comes next.
              </Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                numberOfLines={4}
                placeholder="Paste the Sparkbox setup code or setup link."
                placeholderTextColor="#7e8a83"
                style={[styles.input, styles.textArea]}
                value={claimInput}
                onChangeText={onApplyClaimInput}
              />
              {claimPayload ? (
                <View style={styles.claimPreview}>
                  <Text style={styles.claimPreviewLabel}>Sparkbox found</Text>
                  <Text style={styles.claimPreviewValue}>{describeSetupDeviceLabel(claimPayload.deviceId)}</Text>
                  <Text style={styles.cardCopy}>Your setup code is ready. Wi-Fi comes next.</Text>
                </View>
              ) : null}
              {claimError ? <Text style={styles.errorText}>{claimError}</Text> : null}
              <View style={styles.inlineActions}>
                <Pressable style={styles.primaryButtonSmall} onPress={onOpenScanner}>
                  <Text style={styles.primaryButtonText}>Scan QR</Text>
                </Pressable>
                {claimError === cameraPermissionRecoveryMessage ? (
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => void Linking.openSettings()}>
                    <Text style={styles.secondaryButtonText}>Open app settings</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.secondaryButtonSmall} onPress={onStartClaim} disabled={claimBusy}>
                  {claimBusy ? <ActivityIndicator color="#0f5132" /> : <Text style={styles.secondaryButtonText}>Get Sparkbox ready</Text>}
                </Pressable>
              </View>
            </>
          )}
        </View>
      ) : null}

      {session && !claimStepVisible ? (
        <View style={styles.card} onLayout={(event) => onCaptureStepOffset(1, event)}>
          <Text style={styles.cardTitle}>1. Get Sparkbox ready</Text>
          {step1Collapsed ? (
            <View style={styles.stepSummary}>
              <Text style={styles.stepSummaryTitle}>{describeSetupDeviceLabel(setupDeviceId)}</Text>
              <Text style={styles.stepSummaryCopy}>
                This device is already in your household. You only need to get it ready for Wi-Fi updates.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.cardCopy}>
                No QR scan is needed. If Sparkbox is in a new place, power it on and wait for {hotspotSsid}. If it is still on the old network, use this screen when the hotspot appears.
              </Text>
              <View style={styles.claimPreview}>
                <Text style={styles.claimPreviewLabel}>Device</Text>
                <Text style={styles.claimPreviewValue}>{describeSetupDeviceLabel(setupDeviceId)}</Text>
              </View>
              {bleError ? <Text style={styles.errorText}>{bleError}</Text> : null}
            </>
          )}
        </View>
      ) : null}

      {step2Visible ? (
        <View style={styles.card} onLayout={(event) => onCaptureStepOffset(2, event)}>
          <Text style={styles.cardTitle}>2. Connect to Sparkbox</Text>
          {step2Collapsed ? (
            <View style={styles.stepSummary}>
              <Text style={styles.stepSummaryTitle}>{hotspotSsid}</Text>
              <Text style={styles.stepSummaryCopy}>
                Your phone reached Sparkbox. Home Wi-Fi setup is next.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.cardCopy}>
                Sparkbox now shares a temporary setup network. The app will try to switch your phone automatically.
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
                  <Text style={styles.primaryButtonText}>Connect to {hotspotSsid}</Text>
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
                  Open Wi-Fi settings
                </Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}

      {step3Visible ? (
        <View style={styles.card} onLayout={(event) => onCaptureStepOffset(3, event)}>
          <Text style={styles.cardTitle}>3. Choose home Wi-Fi</Text>
          {step3Collapsed ? (
            <View style={styles.stepSummary}>
              <Text style={styles.stepSummaryTitle}>
                {homeWifiTarget?.ssid || selectedSsid || previousInternetSsid || 'Home Wi-Fi selected'}
              </Text>
              <Text style={styles.stepSummaryCopy}>
                Sparkbox is already using this choice to leave setup and finish activation.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.cardCopy}>
                {hotspotStage === 'local_setup'
                  ? `Your phone is on ${hotspotSsid}. Choose the Wi-Fi Sparkbox should join next.`
                  : 'Sparkbox has your Wi-Fi choice and is now using it to finish setup.'}
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
                      {networksBusy ? <ActivityIndicator color="#17352a" /> : <Text style={styles.secondaryButtonText}>Refresh nearby Wi-Fi</Text>}
                    </Pressable>
                    <Pressable
                      style={styles.secondaryButtonSmall}
                      onPress={onOpenManualEntry}
                      disabled={provisionBusy}
                    >
                      <Text style={styles.secondaryButtonText}>Enter manually</Text>
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
                            {network.requires_password ? String(network.security || 'secured').toUpperCase() : 'Open'} · {Math.round(Number(network.signal_percent || 0))}%
                          </Text>
                          {network.support_reason ? <Text style={styles.networkWarning}>{network.support_reason}</Text> : null}
                        </View>
                        <View style={styles.networkTags}>
                          {network.known ? <Text style={styles.tag}>Saved</Text> : null}
                          {network.support_level === 'warning' ? <Text style={styles.tagWarning}>Sign-in may be required</Text> : null}
                          {unsupported ? <Text style={styles.tagMuted}>Not supported</Text> : null}
                          {!unsupported ? (
                            <View style={[styles.rowAction, selected ? null : styles.rowActionDisabled]}>
                              <Text style={[styles.linkText, !selected ? styles.linkTextDisabled : null]}>{selected ? 'Selected' : 'Choose'}</Text>
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
          <Text style={styles.cardTitle}>4. Activation</Text>
          <Text style={styles.cardCopy}>{provisionMessage}</Text>
          {setupPageState?.status ? (
            <Text style={styles.statusText}>Setup progress: {describeActivationStatus(setupPageState.status)}</Text>
          ) : null}
          {provisionBusy && !portalUrl ? <ActivityIndicator color="#0b6e4f" /> : null}
          {portalUrl ? (
            <View style={styles.portalBox}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => void Linking.openURL(portalUrl)}
              >
                <Text style={styles.primaryButtonText}>Open sign-in page</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={onStartCloudVerification}
              >
                <Text style={styles.secondaryButtonText}>Check again after sign-in</Text>
              </Pressable>
            </View>
          ) : null}
          {completedDeviceId ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>Sparkbox is ready</Text>
              <Text style={styles.successCopy}>
                {describeSetupDeviceLabel(completedDeviceId)} is online in {householdName}. You can now go back to the household app and chat normally.
              </Text>
              {canReturnToShell ? (
                <View style={styles.inlineActions}>
                  <Pressable style={styles.primaryButtonSmall} onPress={returnToShell}>
                    <Text style={styles.primaryButtonText}>Back to household</Text>
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
