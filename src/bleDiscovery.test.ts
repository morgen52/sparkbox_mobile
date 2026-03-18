import { describe, expect, it } from 'vitest';

import { buildScanCandidate, matchesSparkboxAdvertisement } from './bleDiscovery';

describe('matchesSparkboxAdvertisement', () => {
  it('accepts Jetson advertisements that only expose the Sparkbox local name', () => {
    expect(
      matchesSparkboxAdvertisement({
        localName: 'Sparkbox 001',
        name: null,
        serviceUUIDs: null,
      }),
    ).toBe(true);
  });

  it('accepts advertisements that include the Sparkbox service uuid', () => {
    expect(
      matchesSparkboxAdvertisement({
        localName: null,
        name: null,
        serviceUUIDs: ['7f92f5d8-5d55-4f0d-93fa-1ac4b7811c10'],
      }),
    ).toBe(true);
  });

  it('rejects unrelated bluetooth devices', () => {
    expect(
      matchesSparkboxAdvertisement({
        localName: 'HUAWEI FreeBuds',
        name: null,
        serviceUUIDs: ['180f'],
      }),
    ).toBe(false);
  });

  it('builds a visible scan candidate for unrelated devices so the debug panel can show what the phone actually sees', () => {
    expect(
      buildScanCandidate({
        id: 'dev-1',
        localName: 'HUAWEI FreeBuds',
        name: null,
        serviceUUIDs: ['180f'],
      }),
    ).toEqual({
      id: 'dev-1',
      label: 'HUAWEI FreeBuds',
      matched: false,
      reason: 'other-device',
    });
  });
});
