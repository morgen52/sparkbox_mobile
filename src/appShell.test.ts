import { describe, expect, it } from 'vitest';

import {
  buildSetupFlowResetState,
  describeActivityEvent,
  describeAiProvider,
  describeActivationStatus,
  decodeChatMessageContent,
  describeDeviceActionNotice,
  describeChatListTimestamp,
  describeChatMessageTimestamp,
  describeDiagnosticsSource,
  describeTaskRunFinishedAt,
  describeTaskRunOutput,
  describeTaskRunStartedAt,
  describeTaskRunStatus,
  summarizeOwnerServiceOutput,
  describeServiceAvailabilityError,
  describeFileTimestamp,
  describeFileUploader,
  describeLibraryFileListEmptyState,
  describeLibraryFileListTitle,
  describeLibraryPhotoEmptyState,
  describeLibraryTaskListEmptyState,
  describeLibraryTaskListTitle,
  describeInviteExpiry,
  describeTaskEnabledState,
  describeTaskExecution,
  describeTaskSchedule,
  describeUiDateTime,
  describeShellSubtitle,
  formatByteSize,
  PHASE_ONE_TABS,
  resolvePhaseOneSurface,
} from './appShell';

describe('buildSetupFlowResetState', () => {
  it('resets onboarding state without encoding any shell tab fallback', () => {
    expect(buildSetupFlowResetState()).toEqual({
      setupFlowKind: 'first_run',
      reprovisionDeviceId: '',
      claimInput: '',
      pairingToken: '',
      claimError: '',
      bleError: '',
      selectedSsid: '',
      wifiPassword: '',
      manualEntry: false,
      networkSheetOpen: false,
      provisionBusy: false,
      provisionMessage: 'Scan the QR code to get Sparkbox ready for Wi-Fi.',
      portalUrl: null,
      completedDeviceId: '',
      hotspotStage: 'idle',
      inviteCode: '',
      previousInternetSsid: null,
      setupPageState: null,
      setupNetworksLoaded: false,
    });
  });
});

describe('resolvePhaseOneSurface', () => {
  it('uses the space-first shell tabs', () => {
    expect(PHASE_ONE_TABS.map((tab) => tab.key)).toEqual(['chats', 'library', 'settings']);
  });

  it('keeps signed-out users in onboarding', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: false,
        setupFlowRequested: false,
        onboardingInProgress: false,
        activationComplete: false,
        householdLoaded: false,
        hasAnyDevice: false,
        skipOnboardingWhenNoDevice: false,
      }),
    ).toBe('onboarding');
  });

  it('moves into the shell after onboarding completes', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: true,
        setupFlowRequested: false,
        onboardingInProgress: false,
        activationComplete: true,
        householdLoaded: false,
        hasAnyDevice: false,
        skipOnboardingWhenNoDevice: false,
      }),
    ).toBe('shell');
  });

  it('returns to the shell after reprovisioning activation completes', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: true,
        setupFlowRequested: true,
        onboardingInProgress: false,
        activationComplete: true,
        householdLoaded: true,
        hasAnyDevice: true,
        skipOnboardingWhenNoDevice: false,
      }),
    ).toBe('shell');
  });

  it('resumes the shell for an existing signed-in household session', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: true,
        setupFlowRequested: false,
        onboardingInProgress: false,
        activationComplete: false,
        householdLoaded: true,
        hasAnyDevice: true,
        skipOnboardingWhenNoDevice: false,
      }),
    ).toBe('shell');
  });

  it('keeps signed-in users in the shell while household state is still loading', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: true,
        setupFlowRequested: false,
        onboardingInProgress: false,
        activationComplete: false,
        householdLoaded: false,
        hasAnyDevice: false,
        skipOnboardingWhenNoDevice: false,
      }),
    ).toBe('shell');
  });

  it('stays in onboarding while setup is still in progress', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: true,
        setupFlowRequested: false,
        onboardingInProgress: true,
        activationComplete: false,
        householdLoaded: true,
        hasAnyDevice: true,
        skipOnboardingWhenNoDevice: false,
      }),
    ).toBe('onboarding');
  });

  it('routes a signed-in household with no devices into onboarding by default', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: true,
        setupFlowRequested: false,
        onboardingInProgress: false,
        activationComplete: false,
        householdLoaded: true,
        hasAnyDevice: false,
        skipOnboardingWhenNoDevice: false,
      }),
    ).toBe('onboarding');
  });

  it('allows users to stay in shell after manually skipping onboarding with no devices', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: true,
        setupFlowRequested: false,
        onboardingInProgress: false,
        activationComplete: false,
        householdLoaded: true,
        hasAnyDevice: false,
        skipOnboardingWhenNoDevice: true,
      }),
    ).toBe('shell');
  });

  it('stays in onboarding when an existing device starts the reprovision flow', () => {
    expect(
      resolvePhaseOneSurface({
        sessionPresent: true,
        setupFlowRequested: true,
        onboardingInProgress: false,
        activationComplete: false,
        householdLoaded: true,
        hasAnyDevice: true,
        skipOnboardingWhenNoDevice: false,
      }),
    ).toBe('onboarding');
  });
});

describe('describeShellSubtitle', () => {
  it('keeps the space-picker prompt in chats until a space is active', () => {
    expect(describeShellSubtitle({ shellTab: 'chats', activeSpaceName: '', activeSpaceKindLabel: '' })).toBe(
      "Choose a space first, then move into that space's chats.",
    );
  });

  it('switches chats to current-space guidance once a space is active', () => {
    expect(
      describeShellSubtitle({
        shellTab: 'chats',
        activeSpaceName: "qwer's Household",
        activeSpaceKindLabel: 'Shared space',
        spacesReady: true,
      }),
    ).toBe("Viewing qwer's Household (Shared space). Open that space's chats below.");
  });

  it('keeps chats in a loading state instead of prompting for a space while spaces are still restoring', () => {
    expect(
      describeShellSubtitle({
        shellTab: 'chats',
        activeSpaceName: '',
        activeSpaceKindLabel: '',
        spacesReady: false,
      }),
    ).toBe('Loading your spaces...');
  });

  it('keeps library and settings subtitles unchanged', () => {
    expect(describeShellSubtitle({ shellTab: 'library', activeSpaceName: '', activeSpaceKindLabel: '', spacesReady: false })).toBe(
      "See what each space has saved, then manage files and routines there.",
    );
    expect(describeShellSubtitle({ shellTab: 'settings', activeSpaceName: '', activeSpaceKindLabel: '', spacesReady: false })).toBe(
      "Manage Sparkbox, the space you're viewing, family apps, and your account.",
    );
  });
});

describe('formatByteSize', () => {
  it('formats bytes into human-readable sizes', () => {
    expect(formatByteSize(999)).toBe('999 B');
    expect(formatByteSize(1536)).toBe('1.5 KB');
    expect(formatByteSize(13793441244)).toBe('12.8 GB');
  });

  it('returns an empty string for invalid sizes', () => {
    expect(formatByteSize(-1)).toBe('');
    expect(formatByteSize(Number.NaN)).toBe('');
  });
});

describe('describeAiProvider', () => {
  it('maps internal provider ids to friendly labels', () => {
    expect(describeAiProvider('azure-openai')).toBe('Azure OpenAI');
    expect(describeAiProvider('baidu-qianfan')).toBe('Baidu Qianfan');
    expect(describeAiProvider('xai')).toBe('xAI');
    expect(describeAiProvider('fireworks')).toBe('Fireworks AI');
  });

  it('falls back to readable words for unknown providers', () => {
    expect(describeAiProvider('my-custom-provider')).toBe('My custom provider');
  });
});

describe('describeInviteExpiry', () => {
  it('formats invite expiries into readable dates', () => {
    expect(describeInviteExpiry('2026-03-20T10:00:00Z')).toBe('Expires on Mar 20, 2026');
  });

  it('falls back gracefully for invalid invite expiries', () => {
    expect(describeInviteExpiry('')).toBe('Expires soon');
    expect(describeInviteExpiry('not-a-date')).toBe('Expires soon');
  });
});

describe('describeActivationStatus', () => {
  it('maps raw setup states to delivery-ready copy', () => {
    expect(describeActivationStatus('setup_ap_active')).toBe('Ready for setup');
    expect(describeActivationStatus('pairing_in_progress')).toBe('Connecting to your household');
  });

  it('falls back to readable words for unknown setup states', () => {
    expect(describeActivationStatus('waiting_for_owner')).toBe('Waiting for owner');
    expect(describeActivationStatus('')).toBe('');
  });
});

describe('describeServiceAvailabilityError', () => {
  it('maps raw household files and tasks availability errors to delivery-ready copy', () => {
    expect(describeServiceAvailabilityError('No online Sparkbox is ready for household files')).toBe(
      'Bring Sparkbox online to work with files in this space.',
    );
    expect(describeServiceAvailabilityError('No online Sparkbox is ready for household tasks')).toBe(
      'Bring Sparkbox online to work with routines in this space.',
    );
    expect(describeServiceAvailabilityError('Invalid or missing token')).toBe('Please sign in again.');
  });

  it('leaves unrelated errors unchanged', () => {
    expect(describeServiceAvailabilityError('Could not download this file.')).toBe('Could not download this file.');
  });

  it('hides unknown backend-style errors behind generic product copy', () => {
    expect(describeServiceAvailabilityError('provider_reconfigured')).toBe(
      'Sparkbox hit a temporary issue. Try again in a moment.',
    );
  });
});

describe('owner device notices', () => {
  it('keeps owner console notices free of raw device ids and service ids', () => {
    expect(describeDeviceActionNotice('provider_saved')).toBe('Saved AI service settings for this device.');
    expect(describeDeviceActionNotice('re_onboard_finished')).toBe('Finished refreshing AI service settings for this device.');
    expect(describeDeviceActionNotice('service_requested', 'ollama', 'restart')).toBe('Restart on-device AI requested.');
    expect(describeDeviceActionNotice('reset_ready')).toBe('This Sparkbox is ready for setup again.');
  });
});

describe('diagnostics source copy', () => {
  it('maps raw diagnostics sources into user-facing labels', () => {
    expect(describeDiagnosticsSource('cached')).toBe('latest saved check');
    expect(describeDiagnosticsSource('live')).toBe('live check');
  });

  it('falls back safely for unknown diagnostics sources', () => {
    expect(describeDiagnosticsSource('remote_cache')).toBe('Remote cache');
    expect(describeDiagnosticsSource('')).toBe('live check');
  });
});

describe('owner service output', () => {
  it('turns raw service output into a concise mobile note', () => {
    expect(summarizeOwnerServiceOutput('Restarted zeroclaw successfully\\nJob finished.')).toBe(
      'Latest service note: Restarted Sparkbox service successfully',
    );
    expect(summarizeOwnerServiceOutput('   ')).toBe('');
  });
});

describe('task run history copy', () => {
  it('formats raw task run statuses into mobile-friendly copy', () => {
    expect(describeTaskRunStatus('success')).toBe('Completed');
    expect(describeTaskRunStatus('succeeded')).toBe('Completed');
    expect(describeTaskRunStatus('failed')).toBe('Needs attention');
  });

  it('formats task run timestamps into readable labels', () => {
    expect(describeTaskRunStartedAt('2026-03-20T10:00:00Z')).toBe('Started Mar 20, 2026');
    expect(describeTaskRunFinishedAt('2026-03-20T11:00:00Z')).toBe('Finished Mar 20, 2026');
  });

  it('summarizes raw task run output into a readable note', () => {
    expect(describeTaskRunOutput('Laundry reset finished\\nexit code 0')).toBe(
      'Latest note: Laundry reset finished',
    );
    expect(describeTaskRunOutput('')).toBe('');
  });
});

describe('describeUiDateTime', () => {
  it('formats ISO timestamps into readable dates', () => {
    expect(describeUiDateTime('2026-03-20T10:00:00Z')).toBe('Mar 20, 2026');
  });

  it('returns an empty string for invalid timestamps', () => {
    expect(describeUiDateTime('')).toBe('');
    expect(describeUiDateTime('not-a-date')).toBe('');
  });

  it('formats chat list timestamps like a messaging app', () => {
    const now = new Date('2026-03-22T12:00:00Z');
    expect(describeChatListTimestamp('2026-03-22T10:05:00Z', now)).toBe('10:05 AM');
    expect(describeChatListTimestamp('2026-03-21T23:00:00Z', now)).toBe('Yesterday');
    expect(describeChatListTimestamp('2026-03-18T10:00:00Z', now)).toBe('Mar 18');
    expect(describeChatListTimestamp('2025-12-31T10:00:00Z', now)).toBe('Dec 31, 2025');
  });

  it('formats chat bubble timestamps with time-first delivery copy', () => {
    const now = new Date('2026-03-22T12:00:00Z');
    expect(describeChatMessageTimestamp('2026-03-22T10:05:00Z', now)).toBe('10:05 AM');
    expect(describeChatMessageTimestamp('2026-03-20T10:05:00Z', now)).toBe('Mar 20 · 10:05 AM');
    expect(describeChatMessageTimestamp('2025-12-31T10:05:00Z', now)).toBe('Dec 31, 2025 · 10:05 AM');
    expect(describeChatMessageTimestamp('', now)).toBe('');
  });
});

describe('describeTaskSchedule', () => {
  it('formats common cron schedules into readable labels', () => {
    expect(describeTaskSchedule('0 19 * * *')).toBe('Repeats daily at 7:00 PM');
    expect(describeTaskSchedule('30 8 * * 1-5')).toBe('Repeats on weekdays at 8:30 AM');
    expect(describeTaskSchedule('0 * * * *')).toBe('Repeats every hour');
  });

  it('falls back safely for custom cron schedules', () => {
    expect(describeTaskSchedule('15 9 1 * *')).toBe('Repeats on a custom schedule');
  });
});

describe('describeTaskExecution', () => {
  it('formats task execution metadata into user-facing copy', () => {
    expect(describeTaskExecution('zeroclaw', 'family')).toBe('Handled by Sparkbox · Shared space');
    expect(describeTaskExecution('shell', 'private')).toBe('Runs on this device · Just you');
  });
});

describe('describeTaskEnabledState', () => {
  it('turns task state flags into delivery-ready labels', () => {
    expect(describeTaskEnabledState(true)).toBe('Ready');
    expect(describeTaskEnabledState(false)).toBe('Paused');
  });
});

describe('describeFileTimestamp', () => {
  it('formats modified timestamps into readable file metadata', () => {
    expect(describeFileTimestamp('2026-03-20T10:00:00Z')).toBe('Updated Mar 20, 2026');
  });

  it('falls back safely when file timestamps are missing or invalid', () => {
    expect(describeFileTimestamp('')).toBe('Stored on Sparkbox');
    expect(describeFileTimestamp('not-a-date')).toBe('Stored on Sparkbox');
  });
});

describe('describeFileUploader', () => {
  it('uses friendly uploader labels instead of raw ids', () => {
    expect(
      describeFileUploader('member-1', 'owner-1', [
        { id: 'owner-1', display_name: 'qwer' },
        { id: 'member-1', display_name: 'morgen' },
      ]),
    ).toBe('Uploaded by morgen');
    expect(
      describeFileUploader('owner-1', 'owner-1', [
        { id: 'owner-1', display_name: 'qwer' },
      ]),
    ).toBe('Uploaded by you');
  });

  it('falls back gracefully when the uploader is unknown', () => {
    expect(describeFileUploader('missing-user', 'owner-1', [{ id: 'owner-1', display_name: 'qwer' }])).toBe(
      'Uploaded by another household member',
    );
  });
});

describe('library empty-state copy', () => {
  it('keeps library section titles and empty states delivery-ready', () => {
    expect(describeLibraryPhotoEmptyState('family')).toBe('No photos saved in this folder yet.');
    expect(describeLibraryPhotoEmptyState('private')).toBe('No photos saved here yet.');
    expect(describeLibraryFileListTitle('family')).toBe('Files saved in this space');
    expect(describeLibraryFileListTitle('private')).toBe('Files saved just for you');
    expect(describeLibraryFileListEmptyState('family')).toBe('No files saved in this folder yet.');
    expect(describeLibraryFileListEmptyState('private')).toBe('No files saved here yet.');
    expect(describeLibraryTaskListTitle('family')).toBe('Routines in this space');
    expect(describeLibraryTaskListTitle('private')).toBe('Routines just for you');
    expect(describeLibraryTaskListEmptyState('family')).toBe('No routines saved for this space yet.');
    expect(describeLibraryTaskListEmptyState('private')).toBe('No routines saved just for you yet.');
  });
});

describe('describeActivityEvent', () => {
  it('uses details when available', () => {
    expect(describeActivityEvent('Member invite code generated', 'invite_created')).toBe(
      'Member invite code generated',
    );
  });

  it('keeps co-owner invite activity aligned with the settings wording', () => {
    expect(describeActivityEvent('Owner invite code generated', 'invite_created')).toBe(
      'Co-owner invite code generated',
    );
  });

  it('sanitizes raw shared-space ids out of activity details', () => {
    expect(describeActivityEvent('Created family task for space_4be2e504730f', 'task_created')).toBe(
      'Created a shared routine',
    );
  });

  it('maps role transitions into readable member access copy', () => {
    expect(describeActivityEvent('owner → member', 'member_updated')).toBe(
      'Changed a household role to member access',
    );
    expect(describeActivityEvent('member -> owner', 'member_updated')).toBe(
      'Changed a household role to owner access',
    );
  });

  it('maps setup-mode wifi reset activity into delivery-ready copy', () => {
    expect(describeActivityEvent('Sent into setup mode to change Wi-Fi', 'device_reprovisioned')).toBe(
      'Started Wi-Fi setup again',
    );
  });

  it('falls back to readable event types', () => {
    expect(describeActivityEvent('', 'device_added')).toBe('Device added');
  });
});

describe('decodeChatMessageContent', () => {
  it('decodes numeric html entities inside chat replies', () => {
    expect(decodeChatMessageContent('Hello&#10;&#128075;')).toBe('Hello\n👋');
    expect(decodeChatMessageContent('Smile &#x1F604;')).toBe('Smile 😄');
  });

  it('leaves normal chat text unchanged', () => {
    expect(decodeChatMessageContent('Plain text from Sparkbox')).toBe('Plain text from Sparkbox');
  });
});
