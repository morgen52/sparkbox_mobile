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
  reason: 'sparkbox-name' | 'sparkbox-service' | 'probe-candidate' | 'other-device';
};

function normalizedAdvertisementName(device: AdvertisementShape): string {
  return (device.localName || device.name || '').trim().toLowerCase();
}

function isGenericBluetoothName(name: string): boolean {
  return name === '' || name === 'unnamed bluetooth device' || name === 'unknown device';
}

export function matchesSparkboxAdvertisement(device: AdvertisementShape): boolean {
  const advertisedName = normalizedAdvertisementName(device);
  if (advertisedName.startsWith(SPARKBOX_NAME_PREFIX)) {
    return true;
  }

  const uuids = (device.serviceUUIDs || []).map((uuid) => uuid.toLowerCase());
  return uuids.includes(SPARKBOX_SERVICE_UUID);
}

export function shouldProbeSparkboxAdvertisement(device: AdvertisementShape): boolean {
  if (matchesSparkboxAdvertisement(device)) {
    return false;
  }
  if (!device.id) {
    return false;
  }
  return isGenericBluetoothName(normalizedAdvertisementName(device));
}

export function buildScanCandidate(device: AdvertisementShape): ScanCandidate {
  const advertisedName = (device.localName || device.name || '').trim();
  const normalizedName = advertisedName.toLowerCase();
  const uuids = (device.serviceUUIDs || []).map((uuid) => uuid.toLowerCase());
  const matchedByName = normalizedName.startsWith(SPARKBOX_NAME_PREFIX);
  const matchedByService = uuids.includes(SPARKBOX_SERVICE_UUID);
  const probeCandidate = shouldProbeSparkboxAdvertisement(device);

  return {
    id: device.id || advertisedName || 'unknown-device',
    label: advertisedName || 'Unnamed Bluetooth device',
    matched: matchedByName || matchedByService,
    reason: matchedByName
      ? 'sparkbox-name'
      : matchedByService
        ? 'sparkbox-service'
        : probeCandidate
          ? 'probe-candidate'
          : 'other-device',
  };
}
