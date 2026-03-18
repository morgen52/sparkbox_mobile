import { describe, expect, it } from 'vitest';

import { matchesSparkboxAdvertisement } from './bleDiscovery';

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
});
