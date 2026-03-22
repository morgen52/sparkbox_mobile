import { beforeEach, describe, expect, it, vi } from 'vitest';

const nativeModules = vi.hoisted(() => ({
  NativeModules: {},
}));

vi.mock('react-native', () => nativeModules);

describe('wifiOnboarding bridge', () => {
  beforeEach(() => {
    nativeModules.NativeModules = {};
  });

  it('falls back to unsupported when no native bridge is installed', async () => {
    const { connectToSetupHotspot } = await import('./wifiOnboarding');

    await expect(connectToSetupHotspot('Sparkbox-Setup')).rejects.toThrow(
      'This phone cannot switch Wi-Fi automatically right now. Open Wi-Fi settings and join Sparkbox-Setup manually.',
    );
  });

  it('forwards connect requests to the native bridge', async () => {
    const connectToSetupHotspot = vi.fn().mockResolvedValue({ ssid: 'Sparkbox-Setup' });
    nativeModules.NativeModules = {
      SparkboxWifiOnboarding: {
        connectToSetupHotspot,
      },
    };
    const { connectToSetupHotspot: connect } = await import('./wifiOnboarding');

    await expect(connect('Sparkbox-Setup')).resolves.toEqual({ ssid: 'Sparkbox-Setup' });
    expect(connectToSetupHotspot).toHaveBeenCalledWith('Sparkbox-Setup');
  });
});
