import { describe, expect, it, vi } from 'vitest';

import {
  connectWithRetry,
  formatBleConnectError,
  isTransientBleConnectError,
} from './bleConnect';

describe('isTransientBleConnectError', () => {
  it('treats cancelled operations as transient', () => {
    expect(isTransientBleConnectError(new Error('Operation was cancelled'))).toBe(true);
  });

  it('treats disconnects while opening as transient', () => {
    expect(isTransientBleConnectError(new Error('Device disconnected during service discovery'))).toBe(true);
  });

  it('does not treat qr mismatches as transient', () => {
    expect(isTransientBleConnectError(new Error('This Sparkbox does not match the QR code you scanned.'))).toBe(
      false,
    );
  });
});

describe('formatBleConnectError', () => {
  it('translates transient failures into a human message', () => {
    expect(formatBleConnectError(new Error('Operation was cancelled'))).toBe(
      'Sparkbox was slow to finish opening over Bluetooth. Keep your phone close and try Connect again.',
    );
  });

  it('passes through non-transient messages', () => {
    expect(formatBleConnectError(new Error('This Sparkbox does not match the QR code you scanned.'))).toBe(
      'This Sparkbox does not match the QR code you scanned.',
    );
  });
});

describe('connectWithRetry', () => {
  it('retries one transient failure before succeeding', async () => {
    const connect = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('Operation was cancelled'))
      .mockResolvedValueOnce('ok');

    await expect(connectWithRetry(connect, { maxAttempts: 2, delayMs: 0 })).resolves.toBe('ok');
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-transient failures', async () => {
    const connect = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('QR mismatch'));

    await expect(connectWithRetry(connect, { maxAttempts: 2, delayMs: 0 })).rejects.toThrow('QR mismatch');
    expect(connect).toHaveBeenCalledTimes(1);
  });
});
