const SPARKBOX_SERVICE_UUID = '7f92f5d8-5d55-4f0d-93fa-1ac4b7811c10';
const SPARKBOX_NAME_PREFIX = 'sparkbox';

export type AdvertisementShape = {
  localName?: string | null;
  name?: string | null;
  serviceUUIDs?: string[] | null;
};

export function matchesSparkboxAdvertisement(device: AdvertisementShape): boolean {
  const advertisedName = (device.localName || device.name || '').trim().toLowerCase();
  if (advertisedName.startsWith(SPARKBOX_NAME_PREFIX)) {
    return true;
  }

  const uuids = (device.serviceUUIDs || []).map((uuid) => uuid.toLowerCase());
  return uuids.includes(SPARKBOX_SERVICE_UUID);
}
