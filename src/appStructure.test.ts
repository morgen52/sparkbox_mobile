import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('App structure', () => {
  it('keeps the settings tab behind a single top-level render branch', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const matches = appSource.match(/shellTab === 'settings'/g) ?? [];

    expect(matches).toHaveLength(1);
  });

  it('keeps the library tab behind a single top-level render branch', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const matches = appSource.match(/shellTab === 'library'/g) ?? [];

    expect(matches).toHaveLength(1);
  });

  it('keeps visible labels for owner AI settings fields', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const ownerSettingsSource = readFileSync(resolve(__dirname, './components/OwnerSettingsPane.tsx'), 'utf8');

    expect(appSource).toContain('OwnerSettingsPane');
    expect(ownerSettingsSource).toContain('AI service for Sparkbox');
    expect(ownerSettingsSource).toContain('Keep one shared AI service and model ready for Sparkbox, then update it here if the sign-in changes.');
    expect(ownerSettingsSource).toContain('Default AI service');
    expect(ownerSettingsSource).toContain('Default model');
    expect(ownerSettingsSource).toContain('Response timeout');
    expect(ownerSettingsSource).toContain('AI service');
    expect(ownerSettingsSource).toContain('Model name');
    expect(ownerSettingsSource).toContain('Access key');
    expect(ownerSettingsSource).toContain('Service URL (optional)');
    expect(ownerSettingsSource).toContain('Add another AI service');
    expect(ownerSettingsSource).toContain('Use this when Sparkbox needs to connect to another AI service or refresh its sign-in.');
    expect(ownerSettingsSource).toContain('Service name');
    expect(ownerSettingsSource).toContain('Model ID');
    expect(ownerSettingsSource).toContain('Timeout in seconds');
    expect(ownerSettingsSource).toContain('Save AI setup');
    expect(ownerSettingsSource).toContain('Local models on this device');
    expect(ownerSettingsSource).toContain('value={describeAiProvider(ownerProviderConfig.defaultProvider)}');
    expect(ownerSettingsSource).toContain('editable={false}');
    expect(appSource).toContain("setOwnerOnboardProvider('');");
    expect(appSource).not.toContain("setOwnerOnboardProvider(providerConfig.defaultProvider || providers[0] || 'ollama');");
    expect(ownerSettingsSource).not.toContain('Connect another AI service');
    expect(ownerSettingsSource).not.toContain('fresh provider credentials or a new endpoint');
    expect(ownerSettingsSource).not.toContain('refresh it here if credentials change');
    expect(ownerSettingsSource).not.toContain('Shared AI setup');
    expect(ownerSettingsSource).not.toContain('placeholder=\"Provider\"');
    expect(ownerSettingsSource).not.toContain('placeholder=\"Model\"');
    expect(ownerSettingsSource).not.toContain('placeholder=\"API key\"');
    expect(ownerSettingsSource).not.toContain('placeholder=\"API URL (optional)\"');
  });

  it('keeps relay messaging copy in a single delivery language', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const relaySource = readFileSync(resolve(__dirname, './components/RelayComposerModal.tsx'), 'utf8');

    expect(relaySource).toContain('Have Sparkbox relay it privately');
    expect(appSource).toContain('The first reply can take 1 to 5 minutes');
    expect(relaySource).not.toContain('请 Sparkbox 帮我转述');
    expect(relaySource).not.toContain('首次响应可能需要');
    expect(relaySource).not.toContain('Sparkbox 正在认真准备');
  });

  it('keeps primary chat entry labels explicit about chats and the shared group thread', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const chatInboxSource = readFileSync(resolve(__dirname, './components/ChatInboxPane.tsx'), 'utf8');

    expect(chatInboxSource).toContain('Chats in this space');
    expect(appSource).toContain('Open group chat');
    expect(appSource).not.toContain('without opening every thread');
    expect(appSource).not.toContain('same thread here');
    expect(appSource).not.toContain('Topic chat');
    expect(appSource).not.toContain('Open chat');
  });

  it('keeps the chats header compact instead of using the old spaces hero card', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const chatInboxSource = readFileSync(resolve(__dirname, './components/ChatInboxPane.tsx'), 'utf8');

    expect(chatInboxSource).toContain('chatInboxHeader');
    expect(appSource).toContain("Viewing ${activeSpace.name} (${activeSpaceKindLabel})");
    expect(appSource).not.toContain('Start with the people first. Every space keeps its own chats, memories, and shared history.');
  });

  it('renders chat list rows as inbox entries with avatar, title, preview, and time', () => {
    const chatInboxSource = readFileSync(resolve(__dirname, './components/ChatInboxPane.tsx'), 'utf8');

    expect(chatInboxSource).toContain('chatSessionRow');
    expect(chatInboxSource).toContain('chatSessionAvatarRail');
    expect(chatInboxSource).toContain('chatSessionTitle');
    expect(chatInboxSource).toContain('chatSessionPreview');
    expect(chatInboxSource).toContain('chatSessionTimestamp');
  });

  it('renders chat detail with a messenger header and explicit back behavior', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const chatDetailSource = readFileSync(resolve(__dirname, './components/ChatDetailPane.tsx'), 'utf8');

    expect(chatDetailSource).toContain('chatDetailHeader');
    expect(chatDetailSource).toContain('Back to chats');
    expect(chatDetailSource).toContain('chatDetailParticipants');
    expect(appSource).toContain("hardwareBackPress");
  });

  it('renders grouped chat messages and separate status notices', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const chatDetailSource = readFileSync(resolve(__dirname, './components/ChatDetailPane.tsx'), 'utf8');

    expect(chatDetailSource).toContain('chatMessageGroup');
    expect(chatDetailSource).toContain('chatStatusNotice');
    expect(appSource).toContain('buildChatTimelineGroups');
  });

  it('swaps the chats tab body between inbox and active chat detail', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('activeChatSessionId ? (');
    expect(appSource).toContain('!activeChatSessionId ? (');
  });

  it('keeps task editor copy free of internal runtime wording', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const taskEditorSource = readFileSync(resolve(__dirname, './components/TaskEditorModal.tsx'), 'utf8');
    const libraryPaneSource = readFileSync(resolve(__dirname, './components/LibraryPane.tsx'), 'utf8');

    expect(appSource).toContain('Owners can switch to advanced controls when needed.');
    expect(appSource).toContain('Private routines stay simple here, and owners can fine-tune shared ones when needed.');
    expect(taskEditorSource).toContain('When should this happen?');
    expect(taskEditorSource).toContain('Run mode: Sparkbox routine');
    expect(taskEditorSource).toContain('Custom command');
    expect(libraryPaneSource).toContain('Latest note:');
    expect(appSource).not.toContain('Owners can switch to an advanced runtime when needed.');
    expect(taskEditorSource).not.toContain('When should this run? (advanced schedule)');
    expect(taskEditorSource).not.toContain('Command type: zeroclaw');
    expect(taskEditorSource).not.toContain('Advanced shell');
    expect(appSource).not.toContain('Output:');
  });

  it('keeps task history review copy in its own modal component', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const taskHistorySource = readFileSync(resolve(__dirname, './components/TaskHistoryModal.tsx'), 'utf8');

    expect(appSource).toContain('TaskHistoryModal');
    expect(taskHistorySource).toContain('Review recent runs, their status, and any captured output without leaving the task tab.');
    expect(taskHistorySource).toContain('No runs yet.');
    expect(taskHistorySource).toContain('describeTaskRunStatus(run.status)');
    expect(taskHistorySource).toContain('describeTaskRunStartedAt(run.startedAt)');
    expect(taskHistorySource).toContain('describeTaskRunFinishedAt(run.finishedAt)');
  });

  it('keeps summaries guidance role-aware for members', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const spaceShellSource = readFileSync(resolve(__dirname, './spaceShell.ts'), 'utf8');

    expect(appSource).toContain('describeSummaryEmptyStateCopy');
    expect(spaceShellSource).toContain(
      'Owners can capture chat snapshots from Chats. You can still read every summary saved for this space.',
    );
  });

  it('keeps diagnostics labels in delivery-friendly language', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const ownerSettingsSource = readFileSync(resolve(__dirname, './components/OwnerSettingsPane.tsx'), 'utf8');

    expect(ownerSettingsSource).toContain('Check source:');
    expect(ownerSettingsSource).toContain('Still to check:');
    expect(ownerSettingsSource).toContain('Needs attention now:');
    expect(ownerSettingsSource).not.toContain('Preflight:');
    expect(ownerSettingsSource).not.toContain('Issues:');
  });

  it('keeps library copy away from filesystem and internal IA wording', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const libraryPaneSource = readFileSync(resolve(__dirname, './components/LibraryPane.tsx'), 'utf8');

    expect(libraryPaneSource).toContain('Library overview');
    expect(libraryPaneSource).toContain('Quick actions');
    expect(libraryPaneSource).toContain('The creation shortcuts live here so they are always easy to reach.');
    expect(libraryPaneSource).toContain('New folder');
    expect(libraryPaneSource).toContain('New task');
    expect(libraryPaneSource).toContain('android_ripple={{ color: \'rgba(23,53,42,0.14)\' }}');
    expect(libraryPaneSource).toContain('android_ripple={{ color: \'rgba(255,255,255,0.18)\' }}');
    expect(libraryPaneSource).toContain('accessibilityRole="button"');
    expect(libraryPaneSource).toContain('Pick a space to browse what Sparkbox has saved there.');
    expect(libraryPaneSource).toContain('Everything Sparkbox has saved for this space shows up here in one place.');
    expect(libraryPaneSource).toContain('Viewing folder:');
    expect(libraryPaneSource).toContain('routines and reminders stay with the right space');
    expect(libraryPaneSource).toContain('the key details Sparkbox should remember');
    expect(appSource).not.toContain('long-term facts');
    expect(appSource).not.toContain('keep current');
    expect(appSource).not.toContain('treat as current');
    expect(libraryPaneSource).toContain('Bring Sparkbox online to browse or update the files for this space.');
    expect(libraryPaneSource).toContain('Bring Sparkbox online to load or update the routines for this space.');
    expect(appSource).not.toContain('Space library');
    expect(appSource).not.toContain('Pick a space to browse its accumulated Sparkbox context.');
    expect(appSource).not.toContain('one shared library');
    expect(appSource).not.toContain('Location: /');
    expect(appSource).not.toContain('Current folder:');
    expect(appSource).not.toContain('wrong people context');
    expect(appSource).not.toContain('visual context saved with this space');
    expect(appSource).not.toContain('Sparkbox needs to be online before files can be browsed or changed.');
    expect(appSource).not.toContain('Sparkbox needs to be online before tasks can be loaded or changed.');
    expect(appSource).not.toContain('Shared space files');
    expect(appSource).not.toContain('Private space files');
    expect(appSource).not.toContain('Shared space routines');
    expect(appSource).not.toContain('Private space routines');
    expect(appSource).not.toContain('No shared Sparkbox tasks yet.');
    expect(appSource).not.toContain('No private Sparkbox tasks yet.');
    expect(appSource).not.toContain('No shared photos detected in the current folder yet.');
    expect(appSource).not.toContain('Nothing is stored here yet.');
  });

  it('keeps file editor copy away from current-file-space jargon', () => {
    const setupUtilitySource = readFileSync(resolve(__dirname, './components/SetupUtilityModals.tsx'), 'utf8');

    expect(setupUtilitySource).toContain('Create a new folder here so files for this space stay organized.');
    expect(setupUtilitySource).not.toContain('Create a new folder in the current file space.');
  });

  it('keeps memory deletion copy away from current-memory jargon', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('Sparkbox will stop using it as a saved memory for this space.');
    expect(appSource).not.toContain('Sparkbox will stop using it as current memory for this space.');
  });

  it('keeps shared-space IA labels away from internal template language', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const spaceCreatorSource = readFileSync(resolve(__dirname, './components/SpaceCreatorModal.tsx'), 'utf8');
    const viewedSpaceCardSource = readFileSync(resolve(__dirname, './components/ViewedSpaceCard.tsx'), 'utf8');

    expect(viewedSpaceCardSource).toContain("Space you're viewing");
    expect(viewedSpaceCardSource).toContain("{activeSpaceTemplateLabel || 'Shared home'}");
    expect(spaceCreatorSource).toContain('Create a new shared space');
    expect(spaceCreatorSource).toContain('Space type');
    expect(viewedSpaceCardSource).not.toContain('Current shared space');
    expect(viewedSpaceCardSource).not.toContain('Active space identity');
    expect(viewedSpaceCardSource).not.toContain("Type: {activeSpaceTemplateLabel || 'Shared home'}");
    expect(appSource).not.toContain('Template:');
    expect(appSource).not.toContain('>Template<');
    expect(appSource).not.toContain('Household space');
    expect(appSource).not.toContain('Bring Sparkbox into a new relationship space');
  });

  it('keeps owner settings copy away from generic box wording', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const ownerSettingsSource = readFileSync(resolve(__dirname, './components/OwnerSettingsPane.tsx'), 'utf8');
    const settingsDevicesSource = readFileSync(resolve(__dirname, './components/SettingsDevicesPane.tsx'), 'utf8');

    expect(appSource).toContain('Install them once on this device');
    expect(appSource).toContain('SettingsDevicesPane');
    expect(settingsDevicesSource).toContain('Install a family app once on this device');
    expect(settingsDevicesSource).toContain('Installed on this device');
    expect(settingsDevicesSource).toContain('Available for this device');
    expect(appSource).toContain('enable that behavior on this device');
    expect(settingsDevicesSource).toContain('Install on this device');
    expect(appSource).toContain('removed from this device');
    expect(settingsDevicesSource).toContain('which Sparkbox devices are attached to this household');
    expect(appSource).toContain('OwnerSettingsPane');
    expect(ownerSettingsSource).toContain('Restart and recovery');
    expect(ownerSettingsSource).toContain('What Sparkbox is doing now');
    expect(ownerSettingsSource).toContain('Device health and reset');
    expect(ownerSettingsSource).toContain('Reset Sparkbox');
    expect(ownerSettingsSource).toContain('Device tools');
    expect(ownerSettingsSource).toContain('Refresh device');
    expect(ownerSettingsSource).toContain('Try to reconnect Sparkbox');
    expect(ownerSettingsSource).toContain('Check Sparkbox now');
    expect(ownerSettingsSource).toContain('Connect service');
    expect(ownerSettingsSource).toContain('health check');
    expect(ownerSettingsSource).toContain('summary');
    expect(appSource).not.toContain('Install them once on this Box');
    expect(settingsDevicesSource).not.toContain('Install a family app once on this Box');
    expect(settingsDevicesSource).not.toContain('Installed on this Box');
    expect(settingsDevicesSource).not.toContain('Available for this Box');
    expect(appSource).not.toContain('on this Box');
    expect(appSource).not.toContain('from this Box');
    expect(appSource).not.toContain('Install on this Box');
    expect(appSource).not.toContain('which Boxes are attached to this household');
    expect(ownerSettingsSource).not.toContain('Runtime controls');
    expect(ownerSettingsSource).not.toContain('Current activity');
    expect(ownerSettingsSource).not.toContain('Diagnostics and reset');
    expect(ownerSettingsSource).not.toContain('Factory reset');
    expect(ownerSettingsSource).not.toContain('Owner advanced controls');
    expect(ownerSettingsSource).not.toContain('Refresh advanced status');
    expect(ownerSettingsSource).not.toContain('Refresh connection');
    expect(ownerSettingsSource).not.toContain('Service controls');
    expect(ownerSettingsSource).not.toContain('Activity right now');
    expect(ownerSettingsSource).not.toContain('Device check and reset');
    expect(ownerSettingsSource).not.toContain('Advanced device tools');
    expect(ownerSettingsSource).not.toContain('Refresh device status');
  });

  it('keeps family app cards away from raw config dumps and raw risk labels', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('formatFamilyAppConfigSummary(app.config)');
    expect(appSource).toContain('describeFamilyAppRiskLevel(app.riskLevel)');
    expect(appSource).not.toContain('Object.entries(app.config)');
    expect(appSource).not.toContain('{app.riskLevel}');
  });

  it('keeps family-app status badges and sections in delivery-friendly language', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('On in this space');
    expect(appSource).toContain('Ready here');
    expect(appSource).toContain('On this device');
    expect(appSource).not.toContain('Enabled in this space');
    expect(appSource).not.toContain('>enabled<');
    expect(appSource).not.toContain('>installed<');
  });

  it('keeps family-app help text away from relay capability jargon', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const settingsDevicesSource = readFileSync(resolve(__dirname, './components/SettingsDevicesPane.tsx'), 'utf8');

    expect(settingsDevicesSource).toContain('Can help with private relays');
    expect(settingsDevicesSource).toContain('Relays stay owner-approved');
    expect(settingsDevicesSource).not.toContain('Helps with private relay');
    expect(settingsDevicesSource).not.toContain('Needs owner confirmation');
  });

  it('keeps household membership actions in plain language', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const viewedSpaceCardSource = readFileSync(resolve(__dirname, './components/ViewedSpaceCard.tsx'), 'utf8');
    const spaceMembersModalSource = readFileSync(resolve(__dirname, './components/SpaceMembersEditorModal.tsx'), 'utf8');
    const householdPeopleSource = readFileSync(resolve(__dirname, './components/HouseholdPeoplePane.tsx'), 'utf8');

    expect(appSource).toContain('adjust who can manage Sparkbox');
    expect(viewedSpaceCardSource).toContain('Manage members');
    expect(viewedSpaceCardSource).toContain('Invite to this space');
    expect(viewedSpaceCardSource).toContain('You stay in this space automatically.');
    expect(spaceMembersModalSource).toContain('Manage members');
    expect(spaceMembersModalSource).toContain('Need someone new first? Create a household invite');
    expect(householdPeopleSource).toContain('Give owner access');
    expect(householdPeopleSource).toContain('Remove owner access');
    expect(householdPeopleSource).toContain('Invite someone');
    expect(householdPeopleSource).toContain('Invite co-owner');
    expect(appSource).toContain('describeInviteRole(role)');
    expect(householdPeopleSource).toContain('describeInviteRole(invite.role)} invite');
    expect(householdPeopleSource).toContain('Join code:');
    expect(householdPeopleSource).toContain('Waiting for a fresh code');
    expect(appSource).not.toContain('promote, demote');
    expect(appSource).not.toContain('Make member');
    expect(appSource).not.toContain('Make owner');
    expect(appSource).not.toContain('Invite member');
    expect(appSource).not.toContain('Invite owner');
    expect(appSource).not.toContain("'Owner invite ready'");
    expect(appSource).not.toContain('Invite code:');
    expect(appSource).not.toContain('Share code:');
  });

  it('shows join-code previews for household and target shared space', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const invitePreviewSource = readFileSync(resolve(__dirname, './invitePreview.ts'), 'utf8');
    const accountCardSource = readFileSync(resolve(__dirname, './components/SetupAccountCard.tsx'), 'utf8');

    expect(invitePreviewSource).toContain('This code joins');
    expect(invitePreviewSource).toContain('and adds you to');
    expect(accountCardSource).toContain('Checking this invite code...');
  });

  it('keeps account copy away from metadata-style role labels', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('Your account');
    expect(appSource).toContain('{session.user.display_name} · {describeHouseholdRole(session.user.role)} access');
    expect(appSource).not.toContain('Signed in as {session.user.display_name}. Role: {describeHouseholdRole(session.user.role)}.');
  });

  it('keeps household members guidance role-aware for members', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('Ask an owner if someone needs to join, needs owner access, or should be removed.');
  });

  it('keeps owner console feedback attached to the action that triggered it', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const ownerSettingsSource = readFileSync(resolve(__dirname, './components/OwnerSettingsPane.tsx'), 'utf8');

    expect(appSource).toContain("type OwnerConsoleContext = 'tools' | 'provider' | 'onboard' | 'service';");
    expect(appSource).toContain('const reconnect = await reconnectDevice(session.token, ownerDeviceId);');
    expect(appSource).toContain('setOwnerConsoleNotice(reconnect.detail);');
    expect(appSource).toContain('await refreshHouseholdSummary({ silent: true });');
    expect(appSource).toContain("await refreshOwnerConsole(ownerDeviceId, { preserveFeedback: true, context: 'provider' });");
    expect(appSource).toContain("await refreshOwnerConsole(ownerDeviceId, { preserveFeedback: true, context: 'onboard' });");
    expect(appSource).toContain("await refreshOwnerConsole(ownerDeviceId, { preserveFeedback: true, context: 'service' });");
    expect(ownerSettingsSource).toContain("{renderOwnerConsoleFeedback('tools')}");
    expect(ownerSettingsSource).toContain("{renderOwnerConsoleFeedback('provider')}");
    expect(ownerSettingsSource).toContain("{renderOwnerConsoleFeedback('onboard')}");
    expect(ownerSettingsSource).toContain("{renderOwnerConsoleFeedback('service')}");
  });

  it('keeps the signed-in onboarding card free of metadata-style account labels', () => {
    const accountCardSource = readFileSync(resolve(__dirname, './components/SetupAccountCard.tsx'), 'utf8');

    expect(accountCardSource).toContain("You're signed in");
    expect(accountCardSource).toContain('{displayName} · {householdName}');
    expect(accountCardSource).not.toContain('Signed in as {displayName}');
    expect(accountCardSource).not.toContain('Household: {householdName}');
  });

  it('keeps the settings subtitle free of session jargon', () => {
    const appSource = readFileSync(resolve(__dirname, '../src/appShell.ts'), 'utf8');

    expect(appSource).toContain("Manage Sparkbox, the space you're viewing, family apps, and your account.");
    expect(appSource).not.toContain('Manage Sparkbox, the current space, family apps, and your account.');
    expect(appSource).not.toContain('the active space');
    expect(appSource).not.toContain('your signed-in session');
  });

  it('keeps invite instructions aligned with the join CTA label', () => {
    const spaceMembersSource = readFileSync(resolve(__dirname, './spaceMembers.ts'), 'utf8');
    const accountCardSource = readFileSync(resolve(__dirname, './components/SetupAccountCard.tsx'), 'utf8');

    expect(accountCardSource).toContain('Join household');
    expect(accountCardSource).not.toContain('Join a household');
    expect(spaceMembersSource).toContain('open Sparkbox, choose Join household, and enter this code');
    expect(spaceMembersSource).not.toContain('open Sparkbox, choose Join, and enter this code');
  });

  it('keeps family-app state copy away from active-space jargon', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const shellSource = readFileSync(resolve(__dirname, './spaceShell.ts'), 'utf8');

    expect(appSource).toContain('This family app is ready in this space.');
    expect(appSource).toContain('Sparkbox is already using this family app in this space.');
    expect(appSource).not.toContain('This family app is enabled in the active space.');
    expect(appSource).not.toContain('Sparkbox is already using this family app in the active space.');
    expect(shellSource).toContain('Ready in this space');
    expect(shellSource).not.toContain('Enabled for this space');
  });

  it('keeps family-app failure copy away from active-space jargon', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('Could not turn on this family app in this space.');
    expect(appSource).toContain('Could not turn off this family app in this space.');
    expect(appSource).not.toContain('Could not enable this family app in the active space.');
    expect(appSource).not.toContain('Could not disable this family app in the active space.');
  });

  it('keeps library fallback copy away from active-space jargon', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const libraryPaneSource = readFileSync(resolve(__dirname, './components/LibraryPane.tsx'), 'utf8');

    expect(appSource).toContain('Things Sparkbox remembers for this space.');
    expect(libraryPaneSource).toContain("activeSpace?.name || 'this space'");
    expect(appSource).not.toContain('Things Sparkbox remembers for the active space.');
    expect(appSource).not.toContain('Files stay inside the active space');
    expect(appSource).not.toContain('Tasks stay attached to the active space');
  });

  it('keeps chats body copy away from current-space status jargon', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('Viewing ${activeSpace.name} (${activeSpaceKindLabel})');
    expect(appSource).not.toContain('Current space: ${activeSpace.name} (${activeSpaceKindLabel})');
  });

  it('keeps shell scroll content forwarding taps to inline action buttons', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('<ScrollView keyboardShouldPersistTaps="handled" removeClippedSubviews={false} contentContainerStyle={styles.content}>');
  });

  it('keeps Android shell scroll content attached for touch targets after scrolling', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('<ScrollView keyboardShouldPersistTaps="handled" removeClippedSubviews={false} contentContainerStyle={styles.content}>');
  });

  it('keeps Android release builds on the stable architecture path', () => {
    const gradleProps = readFileSync(resolve(__dirname, '../android/gradle.properties'), 'utf8');

    expect(gradleProps).toContain('newArchEnabled=false');
  });

  it('keeps chat copy away from context-engine jargon', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const shellSource = readFileSync(resolve(__dirname, './spaceShell.ts'), 'utf8');

    expect(appSource).toContain('chatDetailParticipants');
    expect(appSource).not.toContain('shared context');
    expect(shellSource).toContain('Sparkbox helping everyone stay in sync.');
    expect(shellSource).toContain('This chat keeps Sparkbox focused on');
    expect(shellSource).not.toContain('running context');
  });

  it('keeps auth copy free of cloud-account jargon', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('Use the same account that owns Sparkbox.');
    expect(appSource).toContain('Create the first owner account for this Sparkbox household.');
    expect(appSource).not.toContain('Use the same cloud account that owns Sparkbox.');
    expect(appSource).not.toContain('claim and set up Sparkbox first');
  });

  it('keeps onboarding copy away from provisioning jargon', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const setupFlowSource = readFileSync(resolve(__dirname, './components/SetupFlowPane.tsx'), 'utf8');

    expect(appSource).toContain('SetupFlowPane');
    expect(setupFlowSource).toContain('Find it first. Bring it online second.');
    expect(setupFlowSource).toContain('guide it onto home Wi-Fi');
    expect(setupFlowSource).toContain('Scan the device label, reserve Sparkbox for');
    expect(setupFlowSource).toContain('Sparkbox is already in your household. Get it ready for Wi-Fi again.');
    expect(setupFlowSource).toContain('Get Sparkbox ready');
    expect(setupFlowSource).toContain('temporary setup network');
    expect(setupFlowSource).toContain('Paste the Sparkbox setup code or setup link.');
    expect(appSource).toContain('Scan the Sparkbox label or paste the setup code first.');
    expect(setupFlowSource).toContain('Sign-in may be required');
    expect(setupFlowSource).toContain('Not supported');
    expect(setupFlowSource).not.toContain('Attach first. Bring it online second.');
    expect(setupFlowSource).not.toContain('Sparkbox setup mode');
    expect(setupFlowSource).not.toContain('Attach Sparkbox');
    expect(setupFlowSource).not.toContain('re-claim');
    expect(setupFlowSource).not.toContain('temporary hotspot');
    expect(setupFlowSource).not.toContain('claim link');
    expect(setupFlowSource).not.toContain('Portal possible');
    expect(setupFlowSource).not.toContain('Unsupported');
  });

  it('keeps camera permission recovery actionable in the scan flow', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const setupFlowSource = readFileSync(resolve(__dirname, './components/SetupFlowPane.tsx'), 'utf8');

    expect(appSource).toContain('Allow camera access in Settings, or paste the Sparkbox setup code manually.');
    expect(setupFlowSource).toContain('Open app settings');
    expect(setupFlowSource).not.toContain('Camera permission is required to scan the Sparkbox QR code.');
  });

  it('keeps scanner copy in its own overlay component', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const scannerSource = readFileSync(resolve(__dirname, './components/ScannerOverlay.tsx'), 'utf8');

    expect(appSource).toContain('ScannerOverlay');
    expect(scannerSource).toContain('Scan the Sparkbox QR label');
    expect(scannerSource).toContain('Point your phone at the printed code on the device or the shipping card.');
    expect(scannerSource).toContain('Close scanner');
    expect(scannerSource).toContain("barcodeTypes: ['qr']");
    expect(scannerSource).toContain('onBarcodeScanned');
  });

  it('keeps chat and memory editors in their own modal components', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const chatEditorSource = readFileSync(resolve(__dirname, './components/ChatSessionEditorModal.tsx'), 'utf8');
    const memoryEditorSource = readFileSync(resolve(__dirname, './components/MemoryEditorModal.tsx'), 'utf8');

    expect(appSource).toContain('ChatSessionEditorModal');
    expect(appSource).toContain('MemoryEditorModal');
    expect(chatEditorSource).toContain('Give this conversation a clear name so everyone knows what Sparkbox is helping with here.');
    expect(chatEditorSource).toContain('describeChatEditorTitle');
    expect(chatEditorSource).toContain('describeChatNamePlaceholder');
    expect(memoryEditorSource).toContain('Save a new memory for this space');
    expect(memoryEditorSource).toContain('Memories are the key details Sparkbox should remember for this space.');
    expect(memoryEditorSource).toContain('Pin memory');
  });
});
