import { describe, expect, it } from 'vitest';
import {
  buildLocalSetupEndpoint,
  isLikelyLocalSetupHandoffError,
} from './localSetupApi';

describe('buildLocalSetupEndpoint', () => {
  it('supports a development override for local setup base URL', () => {
    process.env.EXPO_PUBLIC_LOCAL_SETUP_BASE_URL = 'http://10.0.2.2:8080';
    expect(buildLocalSetupEndpoint('/api/setup/networks')).toBe(
      'http://10.0.2.2:8080/api/setup/networks',
    );
    delete process.env.EXPO_PUBLIC_LOCAL_SETUP_BASE_URL;
  });

  it('builds endpoints against the Jetson hotspot base URL', () => {
    expect(buildLocalSetupEndpoint('/api/setup/networks')).toBe(
      'http://192.168.4.1:8080/api/setup/networks',
    );
    expect(buildLocalSetupEndpoint('api/setup/result')).toBe(
      'http://192.168.4.1:8080/api/setup/result',
    );
  });
});

describe('isLikelyLocalSetupHandoffError', () => {
  it('matches common network handoff failures', () => {
    expect(isLikelyLocalSetupHandoffError(new Error('Network request failed'))).toBe(true);
    expect(isLikelyLocalSetupHandoffError(new Error('Load failed'))).toBe(true);
    expect(isLikelyLocalSetupHandoffError(new Error('Something else'))).toBe(false);
  });
});
