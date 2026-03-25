const DEFAULT_CLOUD_API_BASE = 'https://morgen52.site/familyserver';

let cloudApiBase = DEFAULT_CLOUD_API_BASE;

function normalizeCloudApiBase(value: string): string {
  return value.replace(/\/$/, '');
}

export function setCloudApiBase(value: string | null | undefined): void {
  if (!value) {
    cloudApiBase = DEFAULT_CLOUD_API_BASE;
    return;
  }
  cloudApiBase = normalizeCloudApiBase(value);
}

export function getCloudApiBase(): string {
  return cloudApiBase;
}

export function initializeCloudApiBase(value: string | null | undefined): void {
  setCloudApiBase(value ?? DEFAULT_CLOUD_API_BASE);
}
