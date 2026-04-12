import React from 'react';
import { ChatSessionEditorModal } from './ChatSessionEditorModal';
import { MemoryEditorModal } from './MemoryEditorModal';
import { RelayComposerModal } from './RelayComposerModal';
import { SetupUtilityModals } from './SetupUtilityModals';
import { SpaceCreatorModal } from './SpaceCreatorModal';
import { SpaceMembersEditorModal } from './SpaceMembersEditorModal';
import { TaskEditorModal } from './TaskEditorModal';
import { TaskHistoryModal } from './TaskHistoryModal';

type ShellModalsProps = {
  styles: Record<string, any>;
  spaceCreatorOpen: boolean;
  spaceCreatorBusy: boolean;
  spaceCreatorError: string;
  spaceName: string;
  selectedTemplateLabel: string;
  templateOptions: Array<{ id: string; label: string; active: boolean }>;
  memberOptions: any[];
  selectedMemberIds: string[];
  onCloseSpaceCreator: () => void;
  onChangeSpaceName: (value: string) => void;
  onSelectTemplate: (templateId: string) => void;
  onToggleSpaceMember: (memberId: string) => void;
  onSubmitSpaceCreator: () => void;
  chatSessionEditorOpen: boolean;
  editingChatSession: boolean;
  activeSpaceDetail: any;
  chatScope: string;
  chatSessionName: string;
  chatError: string;
  chatBusy: boolean;
  onCloseChatSessionEditor: () => void;
  onChangeChatSessionName: (value: string) => void;
  onSubmitChatSessionEditor: () => void;
  spaceMembersEditorOpen: boolean;
  activeSpaceName: string;
  ownerDisplayName: string;
  memberEditorOptions: any[];
  selectedEditorMemberIds: string[];
  spaceMembersEditorError: string;
  spaceMembersEditorBusy: boolean;
  settingsBusy: boolean;
  showInviteButton: boolean;
  onCloseSpaceMembersEditor: () => void;
  onToggleSpaceMembersEditorMember: (memberId: string) => void;
  onInviteToSpace: () => void;
  onSubmitSpaceMembersEditor: () => void;
  memoryEditorOpen: boolean;
  editingMemory: boolean;
  memoryTitle: string;
  memoryContent: string;
  memoryPinned: boolean;
  libraryError: string;
  libraryBusy: boolean;
  onCloseMemoryEditor: () => void;
  onChangeMemoryTitle: (value: string) => void;
  onChangeMemoryContent: (value: string) => void;
  onToggleMemoryPinned: () => void;
  onSubmitMemoryEditor: () => void;
  networkSheetOpen: boolean;
  manualEntry: boolean;
  selectedNetwork: any;
  selectedSsid: string;
  previousInternetSsid: string | null;
  wifiPassword: string;
  canSubmitWifi: boolean;
  provisionBusy: boolean;
  onCloseNetworkSheet: () => void;
  onChangeSelectedSsid: (value: string) => void;
  onChangeWifiPassword: (value: string) => void;
  onSubmitWifi: () => void;
  taskEditorOpen: boolean;
  editingTask: any;
  taskScope: 'family' | 'private';
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
  taskHistoryOpen: boolean;
  taskHistoryTask: any;
  taskHistoryRuns: any[];
  onCloseTaskHistory: () => void;
  relayComposerOpen: boolean;
  relayTargets: any[];
  relayTargetUserId: string;
  relayMessage: string;
  relayError: string;
  relayBusy: boolean;
  onCloseRelayComposer: () => void;
  onSelectRelayTarget: (value: string) => void;
  onChangeRelayMessage: (value: string) => void;
  onSubmitRelayMessage: () => void;
};

export function ShellModals(props: ShellModalsProps) {
  return (
    <>
      <SpaceCreatorModal
        visible={props.spaceCreatorOpen}
        busy={props.spaceCreatorBusy}
        error={props.spaceCreatorError}
        spaceName={props.spaceName}
        selectedTemplateLabel={props.selectedTemplateLabel}
        templateOptions={props.templateOptions}
        memberOptions={props.memberOptions}
        selectedMemberIds={props.selectedMemberIds}
        styles={props.styles}
        onRequestClose={props.onCloseSpaceCreator}
        onChangeSpaceName={props.onChangeSpaceName}
        onSelectTemplate={props.onSelectTemplate}
        onToggleMember={props.onToggleSpaceMember}
        onSubmit={props.onSubmitSpaceCreator}
      />

      <ChatSessionEditorModal
        styles={props.styles}
        visible={props.chatSessionEditorOpen}
        editingChatSession={props.editingChatSession}
        activeSpaceDetail={props.activeSpaceDetail}
        chatScope={props.chatScope}
        chatSessionName={props.chatSessionName}
        chatError={props.chatError}
        chatBusy={props.chatBusy}
        onRequestClose={props.onCloseChatSessionEditor}
        onChangeName={props.onChangeChatSessionName}
        onSubmit={props.onSubmitChatSessionEditor}
      />

      <SpaceMembersEditorModal
        visible={props.spaceMembersEditorOpen}
        activeSpaceName={props.activeSpaceName}
        ownerDisplayName={props.ownerDisplayName}
        memberOptions={props.memberEditorOptions}
        selectedMemberIds={props.selectedEditorMemberIds}
        error={props.spaceMembersEditorError}
        busy={props.spaceMembersEditorBusy}
        settingsBusy={props.settingsBusy}
        showInviteButton={props.showInviteButton}
        styles={props.styles}
        onRequestClose={props.onCloseSpaceMembersEditor}
        onToggleMember={props.onToggleSpaceMembersEditorMember}
        onInviteToSpace={props.onInviteToSpace}
        onSubmit={props.onSubmitSpaceMembersEditor}
      />

      <MemoryEditorModal
        styles={props.styles}
        visible={props.memoryEditorOpen}
        editingMemory={props.editingMemory}
        memoryTitle={props.memoryTitle}
        memoryContent={props.memoryContent}
        memoryPinned={props.memoryPinned}
        libraryError={props.libraryError}
        libraryBusy={props.libraryBusy}
        onRequestClose={props.onCloseMemoryEditor}
        onChangeTitle={props.onChangeMemoryTitle}
        onChangeContent={props.onChangeMemoryContent}
        onTogglePinned={props.onToggleMemoryPinned}
        onSubmit={props.onSubmitMemoryEditor}
      />

      <SetupUtilityModals
        styles={props.styles}
        networkSheetOpen={props.networkSheetOpen}
        manualEntry={props.manualEntry}
        selectedNetwork={props.selectedNetwork}
        selectedSsid={props.selectedSsid}
        previousInternetSsid={props.previousInternetSsid}
        wifiPassword={props.wifiPassword}
        canSubmitWifi={props.canSubmitWifi}
        provisionBusy={props.provisionBusy}
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

      <TaskHistoryModal
        styles={props.styles}
        visible={props.taskHistoryOpen}
        taskHistoryTask={props.taskHistoryTask}
        taskHistoryRuns={props.taskHistoryRuns}
        onRequestClose={props.onCloseTaskHistory}
      />

      <RelayComposerModal
        styles={props.styles}
        visible={props.relayComposerOpen}
        relayTargets={props.relayTargets}
        relayTargetUserId={props.relayTargetUserId}
        relayMessage={props.relayMessage}
        relayError={props.relayError}
        relayBusy={props.relayBusy}
        onRequestClose={props.onCloseRelayComposer}
        onSelectRelayTarget={props.onSelectRelayTarget}
        onChangeRelayMessage={props.onChangeRelayMessage}
        onSubmit={props.onSubmitRelayMessage}
      />
    </>
  );
}
