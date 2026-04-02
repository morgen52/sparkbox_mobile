import { afterEach, describe, expect, it } from 'vitest';

function withEnv(key: string, value: string | undefined): void {
  if (typeof value === 'undefined') {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}

afterEach(() => {
  delete process.env.EXPO_PUBLIC_DEV_BYPASS_HOTSPOT_CONNECT;
  delete process.env.EXPO_PUBLIC_LOCAL_SETUP_BASE_URL;
});

describe('dev setup config', () => {
  it('keeps bypass disabled by default', async () => {
    const { isDevOnboardingBypassEnabled } = await import('./devSetupConfig');
    expect(isDevOnboardingBypassEnabled()).toBe(false);
  });

  it('enables bypass only when dev flag is set', async () => {
    withEnv('EXPO_PUBLIC_DEV_BYPASS_HOTSPOT_CONNECT', 'true');
    const { isDevOnboardingBypassEnabled } = await import('./devSetupConfig');
    expect(isDevOnboardingBypassEnabled()).toBe(true);
  });

  it('returns hotspot base URL by default', async () => {
    const { resolveLocalSetupBaseUrl } = await import('./devSetupConfig');
    expect(resolveLocalSetupBaseUrl()).toBe('http://192.168.4.1:8080');
  });

  it('supports local setup base URL override for development', async () => {
    withEnv('EXPO_PUBLIC_LOCAL_SETUP_BASE_URL', 'http://10.0.2.2:8080/');
    const { resolveLocalSetupBaseUrl } = await import('./devSetupConfig');
    expect(resolveLocalSetupBaseUrl()).toBe('http://10.0.2.2:8080');
  });
});
