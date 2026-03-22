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

    expect(appSource).toContain('AI service for Sparkbox');
    expect(appSource).toContain('Keep one shared AI service and model ready for Sparkbox, then update it here if the sign-in changes.');
    expect(appSource).toContain('Default AI service');
    expect(appSource).toContain('Default model');
    expect(appSource).toContain('Response timeout');
    expect(appSource).toContain('AI service');
    expect(appSource).toContain('Model name');
    expect(appSource).toContain('Access key');
    expect(appSource).toContain('Service URL (optional)');
    expect(appSource).toContain('Add another AI service');
    expect(appSource).toContain('Use this when Sparkbox needs to connect to another AI service or refresh its sign-in.');
    expect(appSource).toContain('Service name');
    expect(appSource).toContain('Model ID');
    expect(appSource).toContain('Timeout in seconds');
    expect(appSource).toContain('Save AI setup');
    expect(appSource).toContain('Local models on this device');
    expect(appSource).toContain('value={describeAiProvider(ownerProviderConfig.defaultProvider)}');
    expect(appSource).toContain('editable={false}');
    expect(appSource).toContain("setOwnerOnboardProvider('');");
    expect(appSource).not.toContain("setOwnerOnboardProvider(providerConfig.defaultProvider || providers[0] || 'ollama');");
    expect(appSource).not.toContain('Connect another AI service');
    expect(appSource).not.toContain('fresh provider credentials or a new endpoint');
    expect(appSource).not.toContain('refresh it here if credentials change');
    expect(appSource).not.toContain('Shared AI setup');
    expect(appSource).not.toContain('placeholder=\"Provider\"');
    expect(appSource).not.toContain('placeholder=\"Model\"');
    expect(appSource).not.toContain('placeholder=\"API key\"');
    expect(appSource).not.toContain('placeholder=\"API URL (optional)\"');
  });

  it('keeps relay messaging copy in a single delivery language', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('Have Sparkbox relay it privately');
    expect(appSource).toContain('The first reply can take 1 to 5 minutes');
    expect(appSource).not.toContain('请 Sparkbox 帮我转述');
    expect(appSource).not.toContain('首次响应可能需要');
    expect(appSource).not.toContain('Sparkbox 正在认真准备');
  });

  it('keeps primary chat entry labels explicit about chats and the shared group thread', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('Chats in this space');
    expect(appSource).toContain('Open group chat');
    expect(appSource).not.toContain('without opening every thread');
    expect(appSource).not.toContain('same thread here');
    expect(appSource).not.toContain('Topic chat');
    expect(appSource).not.toContain('Open chat');
  });

  it('keeps the chats header compact instead of using the old spaces hero card', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('chatInboxHeader');
    expect(appSource).toContain("Viewing ${activeSpace.name} (${activeSpaceKindLabel})");
    expect(appSource).not.toContain('Start with the people first. Every space keeps its own chats, memories, and shared history.');
  });

  it('renders chat list rows as inbox entries with avatar, title, preview, and time', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('chatSessionRow');
    expect(appSource).toContain('chatSessionAvatarRail');
    expect(appSource).toContain('chatSessionTitle');
    expect(appSource).toContain('chatSessionPreview');
    expect(appSource).toContain('chatSessionTimestamp');
  });

  it('renders chat detail with a messenger header and explicit back behavior', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('chatDetailHeader');
    expect(appSource).toContain('Back to chats');
    expect(appSource).toContain('chatDetailParticipants');
    expect(appSource).toContain("hardwareBackPress");
  });

  it('renders grouped chat messages and separate status notices', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('chatMessageGroup');
    expect(appSource).toContain('chatStatusNotice');
  });

  it('swaps the chats tab body between inbox and active chat detail', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('activeChatSessionId ? (');
    expect(appSource).toContain('!activeChatSessionId ? (');
  });

  it('keeps task editor copy free of internal runtime wording', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('Owners can switch to advanced controls when needed.');
    expect(appSource).toContain('Private routines stay simple here, and owners can fine-tune shared ones when needed.');
    expect(appSource).toContain('When should this happen?');
    expect(appSource).toContain('Run mode: Sparkbox routine');
    expect(appSource).toContain('Custom command');
    expect(appSource).toContain('Latest note:');
    expect(appSource).not.toContain('Owners can switch to an advanced runtime when needed.');
    expect(appSource).not.toContain('When should this run? (advanced schedule)');
    expect(appSource).not.toContain('Command type: zeroclaw');
    expect(appSource).not.toContain('Advanced shell');
    expect(appSource).not.toContain('Output:');
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

    expect(appSource).toContain('Check source:');
    expect(appSource).toContain('Still to check:');
    expect(appSource).toContain('Needs attention now:');
    expect(appSource).not.toContain('Source:');
    expect(appSource).not.toContain('Preflight:');
    expect(appSource).not.toContain('Issues:');
  });

  it('keeps library copy away from filesystem and internal IA wording', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('Library overview');
    expect(appSource).toContain('Quick actions');
    expect(appSource).toContain('The creation shortcuts live here so they are always easy to reach.');
    expect(appSource).toContain('New folder');
    expect(appSource).toContain('New task');
    expect(appSource).toContain('android_ripple={{ color: \'rgba(23,53,42,0.14)\' }}');
    expect(appSource).toContain('android_ripple={{ color: \'rgba(255,255,255,0.18)\' }}');
    expect(appSource).toContain('accessibilityRole="button"');
    expect(appSource).toContain("onPress={() => openFileEditor('mkdir')}");
    expect(appSource).toContain('onPress={() => openTaskEditor()}');
    expect(appSource).toContain('Pick a space to browse what Sparkbox has saved there.');
    expect(appSource).toContain('Everything Sparkbox has saved for this space shows up here in one place.');
    expect(appSource).toContain('Viewing folder:');
    expect(appSource).toContain('routines and reminders stay with the right space');
    expect(appSource).toContain('Shared moments and photos saved with this space.');
    expect(appSource).toContain('the key details Sparkbox should remember');
    expect(appSource).not.toContain('long-term facts');
    expect(appSource).not.toContain('keep current');
    expect(appSource).not.toContain('treat as current');
    expect(appSource).toContain('Bring Sparkbox online to browse or update the files for this space.');
    expect(appSource).toContain('Bring Sparkbox online to load or update the routines for this space.');
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
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('Create a new folder here so files for this space stay organized.');
    expect(appSource).not.toContain('Create a new folder in the current file space.');
  });

  it('keeps memory deletion copy away from current-memory jargon', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('Sparkbox will stop using it as a saved memory for this space.');
    expect(appSource).not.toContain('Sparkbox will stop using it as current memory for this space.');
  });

  it('keeps shared-space IA labels away from internal template language', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain("Space you're viewing");
    expect(appSource).toContain('{activeSpaceTemplateLabel || \'Shared home\'}');
    expect(appSource).toContain('Create a new shared space');
    expect(appSource).toContain('Space type');
    expect(appSource).not.toContain('Current shared space');
    expect(appSource).not.toContain('Active space identity');
    expect(appSource).not.toContain('Type: {activeSpaceTemplateLabel || \'Shared home\'}');
    expect(appSource).not.toContain('Template:');
    expect(appSource).not.toContain('>Template<');
    expect(appSource).not.toContain('Household space');
    expect(appSource).not.toContain('Bring Sparkbox into a new relationship space');
  });

  it('keeps owner settings copy away from generic box wording', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('Install them once on this device');
    expect(appSource).toContain('Install a family app once on this device');
    expect(appSource).toContain('Installed on this device');
    expect(appSource).toContain('Available for this device');
    expect(appSource).toContain('enable that behavior on this device');
    expect(appSource).toContain('Install on this device');
    expect(appSource).toContain('removed from this device');
    expect(appSource).toContain('which Sparkbox devices are attached to this household');
    expect(appSource).toContain('Restart and recovery');
    expect(appSource).toContain('What Sparkbox is doing now');
    expect(appSource).toContain('Device health and reset');
    expect(appSource).toContain('Reset Sparkbox');
    expect(appSource).toContain('Device tools');
    expect(appSource).toContain('Refresh device');
    expect(appSource).toContain('Try to reconnect Sparkbox');
    expect(appSource).toContain('Check Sparkbox now');
    expect(appSource).toContain('Connect service');
    expect(appSource).toContain('health check');
    expect(appSource).toContain('summary');
    expect(appSource).not.toContain('Install them once on this Box');
    expect(appSource).not.toContain('Install a family app once on this Box');
    expect(appSource).not.toContain('Installed on this Box');
    expect(appSource).not.toContain('Available for this Box');
    expect(appSource).not.toContain('on this Box');
    expect(appSource).not.toContain('from this Box');
    expect(appSource).not.toContain('Install on this Box');
    expect(appSource).not.toContain('which Boxes are attached to this household');
    expect(appSource).not.toContain('Runtime controls');
    expect(appSource).not.toContain('Current activity');
    expect(appSource).not.toContain('Diagnostics and reset');
    expect(appSource).not.toContain('Factory reset');
    expect(appSource).not.toContain('Owner advanced controls');
    expect(appSource).not.toContain('Refresh advanced status');
    expect(appSource).not.toContain('Refresh connection');
    expect(appSource).not.toContain('Service controls');
    expect(appSource).not.toContain('Activity right now');
    expect(appSource).not.toContain('Device check and reset');
    expect(appSource).not.toContain('Advanced device tools');
    expect(appSource).not.toContain('Refresh device status');
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

    expect(appSource).toContain('Can help with private relays');
    expect(appSource).toContain('Relays stay owner-approved');
    expect(appSource).not.toContain('Helps with private relay');
    expect(appSource).not.toContain('Needs owner confirmation');
  });

  it('keeps household membership actions in plain language', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('adjust who can manage Sparkbox');
    expect(appSource).toContain('Manage members');
    expect(appSource).toContain('Invite to this space');
    expect(appSource).toContain('You stay in this space automatically.');
    expect(appSource).toContain('Give owner access');
    expect(appSource).toContain('Remove owner access');
    expect(appSource).toContain('Invite someone');
    expect(appSource).toContain('Invite co-owner');
    expect(appSource).toContain('describeInviteRole(role)');
    expect(appSource).toContain('describeInviteRole(invite.role)} invite');
    expect(appSource).toContain('Join code:');
    expect(appSource).toContain('Waiting for a fresh code');
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

    expect(invitePreviewSource).toContain('This code joins');
    expect(invitePreviewSource).toContain('and adds you to');
    expect(appSource).toContain('Checking this invite code...');
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

    expect(appSource).toContain("type OwnerConsoleContext = 'tools' | 'provider' | 'onboard' | 'service';");
    expect(appSource).toContain('const reconnect = await reconnectDevice(session.token, ownerDeviceId);');
    expect(appSource).toContain('setOwnerConsoleNotice(reconnect.detail);');
    expect(appSource).toContain('await refreshHouseholdSummary({ silent: true });');
    expect(appSource).toContain("await refreshOwnerConsole(ownerDeviceId, { preserveFeedback: true, context: 'provider' });");
    expect(appSource).toContain("await refreshOwnerConsole(ownerDeviceId, { preserveFeedback: true, context: 'onboard' });");
    expect(appSource).toContain("await refreshOwnerConsole(ownerDeviceId, { preserveFeedback: true, context: 'service' });");
    expect(appSource).toContain("{renderOwnerConsoleFeedback('tools')}");
    expect(appSource).toContain("{renderOwnerConsoleFeedback('provider')}");
    expect(appSource).toContain("{renderOwnerConsoleFeedback('onboard')}");
    expect(appSource).toContain("{renderOwnerConsoleFeedback('service')}");
  });

  it('keeps the signed-in onboarding card free of metadata-style account labels', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain("You're signed in");
    expect(appSource).toContain('{session.user.display_name} · {session.household.name}');
    expect(appSource).not.toContain('Signed in as {session.user.display_name}');
    expect(appSource).not.toContain('Household: {session.household.name}');
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
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('Join household');
    expect(appSource).not.toContain('Join a household');
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

    expect(appSource).toContain('Things Sparkbox remembers for this space.');
    expect(appSource).toContain("activeSpace ? activeSpace.name : 'this space'");
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

    expect(appSource).toContain('Find it first. Bring it online second.');
    expect(appSource).toContain('guide it onto home Wi-Fi');
    expect(appSource).toContain('Scan the device label, reserve Sparkbox for');
    expect(appSource).toContain('Sparkbox is already in your household. Get it ready for Wi-Fi again.');
    expect(appSource).toContain('Get Sparkbox ready');
    expect(appSource).toContain('temporary setup network');
    expect(appSource).toContain('Paste the Sparkbox setup code or setup link.');
    expect(appSource).toContain('Scan the Sparkbox label or paste the setup code first.');
    expect(appSource).toContain('Sign-in may be required');
    expect(appSource).toContain('Not supported');
    expect(appSource).not.toContain('Attach first. Bring it online second.');
    expect(appSource).not.toContain('Sparkbox setup mode');
    expect(appSource).not.toContain('Attach Sparkbox');
    expect(appSource).not.toContain('re-claim');
    expect(appSource).not.toContain('temporary hotspot');
    expect(appSource).not.toContain('claim link');
    expect(appSource).not.toContain('Portal possible');
    expect(appSource).not.toContain('Unsupported');
  });

  it('keeps camera permission recovery actionable in the scan flow', () => {
    const appSource = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('Allow camera access in Settings, or paste the Sparkbox setup code manually.');
    expect(appSource).toContain('Open app settings');
    expect(appSource).not.toContain('Camera permission is required to scan the Sparkbox QR code.');
  });
});
