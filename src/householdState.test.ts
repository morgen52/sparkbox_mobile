import { describe, expect, it } from 'vitest';

import { canManageHousehold, canReprovisionDeviceFromSettings, hasOnlineDevice } from './householdState';

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
});
