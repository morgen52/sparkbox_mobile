import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Session } from '../authFlow';
import type { ClaimPayload } from '../utils/appRuntime';
import type { LocalSetupNetwork } from '../localSetupApi';
import type { HouseholdFileEntry, HouseholdTaskScope, HouseholdTaskSummary } from '../householdApi';
import { SetupFlowPane } from './SetupFlowPane';
import { SetupUtilityModals } from './SetupUtilityModals';
import { TaskEditorModal } from './TaskEditorModal';
import { ScannerOverlay } from './ScannerOverlay';

type InvitePreview = {
  householdName: string;
  role: 'owner' | 'member';
  spaceName?: string | null;
} | null;

type SetupSurfaceProps = {
  styles: Record<string, any>;
  scrollViewRef: React.RefObject<ScrollView | null>;
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
  claimPayload: ClaimPayload | null;
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
  wifiPassword: string;
  previousInternetSsid: string | null;
  networksBusy: boolean;
  networks: LocalSetupNetwork[];
  selectedNetwork: LocalSetupNetwork | null;
  networkSheetOpen: boolean;
  manualEntry: boolean;
  portalUrl: string | null;
  completedDeviceId: string;
  setupPageState: { device_id?: string; status?: string } | null;
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
  fileEditorOpen: boolean;
  fileEditorMode: 'mkdir' | 'rename' | null;
  fileTargetEntry: HouseholdFileEntry | null;
  fileEditorValue: string;
  filesError: string;
  filesBusy: boolean;
  canSubmitWifi: boolean;
  onCloseFileEditor: () => void;
  onChangeFileEditorValue: (value: string) => void;
  onSubmitFileEditor: () => void;
  onCloseNetworkSheet: () => void;
  onChangeSelectedSsid: (value: string) => void;
  onChangeWifiPassword: (value: string) => void;
  onSubmitWifi: () => void;
  taskEditorOpen: boolean;
  editingTask: HouseholdTaskSummary | null;
  activeSpaceName: string;
  taskScope: HouseholdTaskScope;
  taskEditorCopy: string;
  canManage: boolean;
  taskName: string;
  taskCronExpr: string;
  taskCommand: string;
  taskCommandType: 'shell' | 'zeroclaw';
  taskEnabled: boolean;
  tasksError: string;
  tasksBusy: boolean;
  onCloseTaskEditor: () => void;
  onChangeTaskName: (value: string) => void;
  onChangeTaskCronExpr: (value: string) => void;
  onChangeTaskCommand: (value: string) => void;
  onChangeTaskCommandType: (value: 'shell' | 'zeroclaw') => void;
  onToggleTaskEnabled: () => void;
  onSubmitTaskEditor: () => void;
  scannerOpen: boolean;
  onScannerScan: (value: string) => void;
  onCloseScanner: () => void;
};

export function SetupSurface(props: SetupSurfaceProps) {
  return (
    <SafeAreaView style={props.styles.screen}>
      <StatusBar style="dark" />
      <ScrollView ref={props.scrollViewRef} contentContainerStyle={props.styles.content}>
        <SetupFlowPane
          styles={props.styles}
          householdName={props.householdName}
          session={props.session}
          canReturnToShell={props.canReturnToShell}
          returnToShell={props.returnToShell}
          resetFlow={props.resetFlow}
          logout={props.logout}
          claimStepVisible={props.claimStepVisible}
          activeStep={props.activeStep}
          setupStepLabels={props.setupStepLabels}
          step1Collapsed={props.step1Collapsed}
          step2Visible={props.step2Visible}
          step2Collapsed={props.step2Collapsed}
          step3Visible={props.step3Visible}
          step3Collapsed={props.step3Collapsed}
          step4Visible={props.step4Visible}
          authCardTitle={props.authCardTitle}
          authCardCopy={props.authCardCopy}
          authMode={props.authMode}
          email={props.email}
          displayName={props.displayName}
          inviteCode={props.inviteCode}
          password={props.password}
          invitePreviewBusy={props.invitePreviewBusy}
          invitePreviewError={props.invitePreviewError}
          invitePreview={props.invitePreview}
          authError={props.authError}
          authBusy={props.authBusy}
          authSubmitLabel={props.authSubmitLabel}
          claimInput={props.claimInput}
          claimPayload={props.claimPayload}
          claimError={props.claimError}
          cameraPermissionRecoveryMessage={props.cameraPermissionRecoveryMessage}
          claimBusy={props.claimBusy}
          bleError={props.bleError}
          setupDeviceId={props.setupDeviceId}
          hotspotSsid={props.hotspotSsid}
          hotspotStage={props.hotspotStage}
          setupFlowKind={props.setupFlowKind}
          pairingToken={props.pairingToken}
          provisionBusy={props.provisionBusy}
          provisionMessage={props.provisionMessage}
          homeWifiTarget={props.homeWifiTarget}
          selectedSsid={props.selectedSsid}
          previousInternetSsid={props.previousInternetSsid}
          networksBusy={props.networksBusy}
          networks={props.networks}
          selectedNetwork={props.selectedNetwork}
          networkSheetOpen={props.networkSheetOpen}
          manualEntry={props.manualEntry}
          portalUrl={props.portalUrl}
          completedDeviceId={props.completedDeviceId}
          setupPageState={props.setupPageState}
          onCaptureStepOffset={props.onCaptureStepOffset}
          onChangeAuthMode={props.onChangeAuthMode}
          onChangeEmail={props.onChangeEmail}
          onChangeDisplayName={props.onChangeDisplayName}
          onChangeInviteCode={props.onChangeInviteCode}
          onChangePassword={props.onChangePassword}
          onSubmitAuth={props.onSubmitAuth}
          renderInvitePreviewSummary={props.renderInvitePreviewSummary}
          onApplyClaimInput={props.onApplyClaimInput}
          onOpenScanner={props.onOpenScanner}
          onStartClaim={props.onStartClaim}
          onBeginHotspotOnboarding={props.onBeginHotspotOnboarding}
          onOpenInternetPanel={props.onOpenInternetPanel}
          onRefreshNetworks={props.onRefreshNetworks}
          onOpenManualEntry={props.onOpenManualEntry}
          onChooseNetwork={props.onChooseNetwork}
          onStartCloudVerification={props.onStartCloudVerification}
        />
      </ScrollView>

      <SetupUtilityModals
        styles={props.styles}
        fileEditorOpen={props.fileEditorOpen}
        fileEditorMode={props.fileEditorMode}
        fileTargetEntry={props.fileTargetEntry}
        fileEditorValue={props.fileEditorValue}
        filesError={props.filesError}
        filesBusy={props.filesBusy}
        networkSheetOpen={props.networkSheetOpen}
        manualEntry={props.manualEntry}
        selectedNetwork={props.selectedNetwork}
        selectedSsid={props.selectedSsid}
        previousInternetSsid={props.previousInternetSsid}
        wifiPassword={props.wifiPassword}
        canSubmitWifi={props.canSubmitWifi}
        provisionBusy={props.provisionBusy}
        onCloseFileEditor={props.onCloseFileEditor}
        onChangeFileEditorValue={props.onChangeFileEditorValue}
        onSubmitFileEditor={props.onSubmitFileEditor}
        onCloseNetworkSheet={props.onCloseNetworkSheet}
        onChangeSelectedSsid={props.onChangeSelectedSsid}
        onChangeWifiPassword={props.onChangeWifiPassword}
        onSubmitWifi={props.onSubmitWifi}
      />

      <TaskEditorModal
        styles={props.styles}
        visible={props.taskEditorOpen}
        editingTask={props.editingTask}
        activeSpaceName={props.activeSpaceName}
        taskScope={props.taskScope}
        taskEditorCopy={props.taskEditorCopy}
        canManage={props.canManage}
        taskName={props.taskName}
        taskCronExpr={props.taskCronExpr}
        taskCommand={props.taskCommand}
        taskCommandType={props.taskCommandType}
        taskEnabled={props.taskEnabled}
        tasksError={props.tasksError}
        tasksBusy={props.tasksBusy}
        onRequestClose={props.onCloseTaskEditor}
        onChangeTaskName={props.onChangeTaskName}
        onChangeTaskCronExpr={props.onChangeTaskCronExpr}
        onChangeTaskCommand={props.onChangeTaskCommand}
        onChangeTaskCommandType={props.onChangeTaskCommandType}
        onToggleTaskEnabled={props.onToggleTaskEnabled}
        onSubmit={props.onSubmitTaskEditor}
      />

      <ScannerOverlay
        styles={props.styles}
        visible={props.scannerOpen}
        onScan={props.onScannerScan}
        onClose={props.onCloseScanner}
      />
    </SafeAreaView>
  );
}
