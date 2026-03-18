import { describe, expect, it } from 'vitest';

import { getNearbyDeviceButtonState } from './nearbyDeviceUi';

describe('getNearbyDeviceButtonState', () => {
  it('shows a compact opening state for the device currently being opened', () => {
    expect(getNearbyDeviceButtonState({ id: 'sparkbox-1', probe: false }, 'sparkbox-1')).toEqual({
      disabled: true,
      label: 'Opening…',
      status: 'Opening Sparkbox over Bluetooth…',
    });
  });

  it('shows a compact probing state for unnamed candidates being verified', () => {
    expect(getNearbyDeviceButtonState({ id: 'unknown-1', probe: true }, 'unknown-1')).toEqual({
      disabled: true,
      label: 'Checking…',
      status: 'Checking whether this nearby Bluetooth device is your Sparkbox…',
    });
  });

  it('disables other rows while one connection attempt is already in progress', () => {
    expect(getNearbyDeviceButtonState({ id: 'other-1', probe: false }, 'sparkbox-1')).toEqual({
      disabled: true,
      label: 'Wait',
      status: '',
    });
  });

  it('keeps rows interactive when no connection is running', () => {
    expect(getNearbyDeviceButtonState({ id: 'sparkbox-1', probe: false }, null)).toEqual({
      disabled: false,
      label: 'Connect',
      status: '',
    });
  });
});
