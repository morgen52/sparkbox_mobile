import { describe, expect, it } from 'vitest';
import {
  buildLocalSetupUrl,
  parseSetupPageMessage,
  type SetupPageMessage,
} from './hotspotSetup';

describe('buildLocalSetupUrl', () => {
  it('builds the embedded setup URL with a deep-link return target', () => {
    expect(
      buildLocalSetupUrl({
        deviceId: 'sbx-demo-001',
        pairingToken: 'pair-123',
        returnTo: 'sparkbox://onboarding/local-return',
        hintSsid: 'REN',
      }),
    ).toBe(
      'http://192.168.4.1:8080/setup?device_id=sbx-demo-001&pairing_token=pair-123&return_to=sparkbox%3A%2F%2Fonboarding%2Flocal-return&embedded=1&hint_ssid=REN',
    );
  });
});

describe('parseSetupPageMessage', () => {
  it('parses valid WebView bridge messages', () => {
    const parsed = parseSetupPageMessage(
      JSON.stringify({
        type: 'portal_required',
        payload: {
          ssid: 'CampusWiFi',
          portal_url: 'http://portal.example/login',
        },
      }),
    );

    expect(parsed).toEqual<SetupPageMessage>({
      type: 'portal_required',
      payload: {
        ssid: 'CampusWiFi',
        portal_url: 'http://portal.example/login',
      },
    });
  });

  it('ignores malformed messages', () => {
    expect(parseSetupPageMessage('not-json')).toBeNull();
    expect(parseSetupPageMessage(JSON.stringify({ nope: true }))).toBeNull();
  });
});
