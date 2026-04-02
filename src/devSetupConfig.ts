const DEFAULT_LOCAL_SETUP_BASE_URL = 'http://192.168.4.1:8080';

function isDevBuild(): boolean {
  if (typeof __DEV__ !== 'undefined') {
    return Boolean(__DEV__);
  }
  return process.env.NODE_ENV !== 'production';
}

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    return '';
  }
  return String(value).trim();
}

function asEnabledFlag(value: string): boolean {
  const normalized = value.toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, '');
}

export function isDevOnboardingBypassEnabled(): boolean {
  if (!isDevBuild()) {
    return false;
  }
  return asEnabledFlag(readEnv('EXPO_PUBLIC_DEV_BYPASS_HOTSPOT_CONNECT'));
}

export function resolveLocalSetupBaseUrl(): string {
  if (!isDevBuild()) {
    return DEFAULT_LOCAL_SETUP_BASE_URL;
  }
  const configured = readEnv('EXPO_PUBLIC_LOCAL_SETUP_BASE_URL');
  if (!configured) {
    return DEFAULT_LOCAL_SETUP_BASE_URL;
  }
  return normalizeBaseUrl(configured);
}
