const SPARKBOX_SERVICE_UUID = '7f92f5d8-5d55-4f0d-93fa-1ac4b7811c10';
const SPARKBOX_NAME_PREFIX = 'sparkbox';

export type AdvertisementShape = {
  id?: string | null;
  localName?: string | null;
  name?: string | null;
  serviceUUIDs?: string[] | null;
};

export type ScanCandidate = {
  id: string;
  label: string;
  matched: boolean;
  reason: 'sparkbox-name' | 'sparkbox-service' | 'other-device';
};

export function matchesSparkboxAdvertisement(device: AdvertisementShape): boolean {
  const advertisedName = (device.localName || device.name || '').trim().toLowerCase();
  if (advertisedName.startsWith(SPARKBOX_NAME_PREFIX)) {
    return true;
  }

  const uuids = (device.serviceUUIDs || []).map((uuid) => uuid.toLowerCase());
  return uuids.includes(SPARKBOX_SERVICE_UUID);
}

export function buildScanCandidate(device: AdvertisementShape): ScanCandidate {
  const advertisedName = (device.localName || device.name || '').trim();
  const normalizedName = advertisedName.toLowerCase();
  const uuids = (device.serviceUUIDs || []).map((uuid) => uuid.toLowerCase());
  const matchedByName = normalizedName.startsWith(SPARKBOX_NAME_PREFIX);
  const matchedByService = uuids.includes(SPARKBOX_SERVICE_UUID);

  return {
    id: device.id || advertisedName || 'unknown-device',
    label: advertisedName || 'Unnamed Bluetooth device',
    matched: matchedByName || matchedByService,
    reason: matchedByName ? 'sparkbox-name' : matchedByService ? 'sparkbox-service' : 'other-device',
  };
}
