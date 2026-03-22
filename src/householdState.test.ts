import { describe, expect, it } from 'vitest';

import {
  canChangeMemberRole,
  canManageHousehold,
  canRemoveHouseholdMember,
  canReprovisionDeviceFromSettings,
  describeDeviceLabel,
  describeOwnerConsoleInference,
  describeOwnerConsoleModelStatus,
  describeOwnerRuntimeActiveRequest,
  describeOwnerRuntimeQueueEntry,
  describeOwnerRuntimeQueueSummary,
  describeOwnerServiceActionLabel,
  describeOwnerConsoleRuntimeStatus,
  describeDiagnosticsNetworkSummary,
  describeDiagnosticsIssueReasons,
  describeDiagnosticsPreflightReasons,
  describeDiagnosticsWifiConnection,
  describeDeviceStatus,
  describeSetupDeviceLabel,
  describeHouseholdRole,
  hasOnlineDevice,
} from './householdState';

describe('householdState', () => {
  it('detects when any Sparkbox device is online', () => {
    expect(
      hasOnlineDevice([
        { device_id: 'sbx-1', status: 'bound_offline', online: false, claimed: true },
        { device_id: 'sbx-2', status: 'bound_online', online: true, claimed: true },
      ]),
    ).toBe(true);
    expect(hasOnlineDevice([{ device_id: 'sbx-1', status: 'offline', online: false, claimed: true }])).toBe(false);
  });

  it('limits management and reprovision actions to owners', () => {
    expect(canManageHousehold('owner')).toBe(true);
    expect(canManageHousehold('member')).toBe(false);
    expect(canReprovisionDeviceFromSettings('owner')).toBe(true);
    expect(canReprovisionDeviceFromSettings('member')).toBe(false);
  });

  it('formats device statuses into user-facing copy', () => {
    expect(describeDeviceStatus('bound_online')).toBe('Connected and ready');
    expect(describeDeviceStatus('bound_offline')).toBe('Offline right now');
    expect(describeDeviceStatus('claimed')).toBe('Attached to your household');
    expect(describeDeviceStatus('local_setup')).toBe('Ready for setup');
    expect(describeDeviceStatus('setup_ap_active')).toBe('Ready for setup');
  });

  it('falls back to readable words for unknown device statuses', () => {
    expect(describeDeviceStatus('needs_attention')).toBe('Needs attention');
  });

  it('formats raw device ids into friendly labels for settings surfaces', () => {
    expect(describeDeviceLabel('sbx-demo-001', 0, 1)).toBe('Sparkbox device');
    expect(describeDeviceLabel('sbx-demo-002', 1, 2)).toBe('Sparkbox device 2');
    expect(describeDeviceLabel('', 0, 3)).toBe('Sparkbox device 1');
  });

  it('keeps onboarding and activation copy on a friendly Sparkbox device label', () => {
    expect(describeSetupDeviceLabel('sbx-demo-001')).toBe('Sparkbox device');
    expect(describeSetupDeviceLabel('')).toBe('Sparkbox device');
  });

  it('formats owner console status lines into delivery-friendly copy', () => {
    expect(describeOwnerConsoleModelStatus('active', 'ok')).toBe('On-device AI: Ready · Connection OK');
    expect(describeOwnerConsoleRuntimeStatus('ok', 'ok')).toBe('Sparkbox service: Running · Home connection ready');
    expect(describeOwnerConsoleInference(0, 8, false)).toBe('Requests right now: None · Queue room: 8');
    expect(describeOwnerConsoleInference(2, 8, true)).toBe('Requests right now: 2 in line · Sparkbox is busy');
  });

  it('formats runtime queue details into owner-friendly copy', () => {
    expect(describeOwnerRuntimeQueueSummary(0, 8)).toBe('Nothing is waiting right now. Sparkbox still has room for 8 requests.');
    expect(describeOwnerRuntimeQueueSummary(2, 8)).toBe('2 requests are waiting. Sparkbox can hold up to 8 at once.');
    expect(describeOwnerRuntimeActiveRequest(undefined)).toBe('No one is waiting on Sparkbox right now.');
    expect(describeOwnerRuntimeActiveRequest('morgen')).toBe('Sparkbox is helping someone right now.');
    expect(describeOwnerRuntimeQueueEntry('morgen', 1)).toBe('Another request is next.');
    expect(describeOwnerRuntimeQueueEntry('alex', 3)).toBe('Another request is later in line.');
  });

  it('formats owner service actions into delivery-friendly labels', () => {
    expect(describeOwnerServiceActionLabel('ollama', 'restart')).toBe('Restart on-device AI');
    expect(describeOwnerServiceActionLabel('ollama', 'stop')).toBe('Stop on-device AI');
    expect(describeOwnerServiceActionLabel('zeroclaw', 'restart')).toBe('Restart Sparkbox service');
    expect(describeOwnerServiceActionLabel('zeroclaw', 'start')).toBe('Start Sparkbox service');
  });

  it('formats household roles into user-facing labels', () => {
    expect(describeHouseholdRole('owner')).toBe('Owner');
    expect(describeHouseholdRole('member')).toBe('Member');
  });

  it('hides raw wifi interface names in diagnostics copy', () => {
    expect(describeDiagnosticsNetworkSummary('Ready on wlan0')).toBe('Ready on Wi-Fi');
    expect(describeDiagnosticsNetworkSummary('Ready on wlP1p1s0')).toBe('Ready on Wi-Fi');
    expect(describeDiagnosticsWifiConnection('wlP1p1s0', '5 GHz')).toBe('Wi-Fi: Connected · 5 GHz');
    expect(describeDiagnosticsWifiConnection('wlan0', 'unknown')).toBe('Wi-Fi: Connected');
  });

  it('formats diagnostics reason codes into delivery-friendly copy', () => {
    expect(describeDiagnosticsPreflightReasons(['configured_interface_missing', 'wifi_radio_disabled'])).toBe(
      'Sparkbox is configured to use a missing Wi-Fi interface, Sparkbox Wi-Fi radio is currently disabled.',
    );
    expect(describeDiagnosticsIssueReasons([{ service: 'ollama', reason: 'service_failed' }])).toBe(
      'On-device AI needs attention.',
    );
    expect(describeDiagnosticsIssueReasons([{ service: 'zeroclaw', reason: 'service_inactive' }])).toBe(
      'Sparkbox service is not running.',
    );
  });

  it('prevents removing the last owner from the household', () => {
    const members = [
      { id: 'owner-1', display_name: 'qwer', role: 'owner' as const },
      { id: 'member-1', display_name: 'morgen', role: 'member' as const },
    ];

    expect(canRemoveHouseholdMember(members, members[0])).toBe(false);
    expect(canRemoveHouseholdMember(members, members[1])).toBe(true);
  });

  it('prevents demoting the last owner but allows safe owner changes', () => {
    const singleOwner = [
      { id: 'owner-1', display_name: 'qwer', role: 'owner' as const },
      { id: 'member-1', display_name: 'morgen', role: 'member' as const },
    ];
    const twoOwners = [
      { id: 'owner-1', display_name: 'qwer', role: 'owner' as const },
      { id: 'owner-2', display_name: 'alex', role: 'owner' as const },
      { id: 'member-1', display_name: 'morgen', role: 'member' as const },
    ];

    expect(canChangeMemberRole(singleOwner, singleOwner[0], 'member')).toBe(false);
    expect(canChangeMemberRole(twoOwners, twoOwners[0], 'member')).toBe(true);
    expect(canChangeMemberRole(singleOwner, singleOwner[1], 'owner')).toBe(true);
  });
});
