const DEFAULT_LOCAL_SETUP_BASE_URL = 'http://192.168.4.1:8080';
const RELEASE_BYPASS_ENV = 'EXPO_PUBLIC_RELEASE_BYPASS_HOTSPOT_CONNECT';
const DEV_BYPASS_ENV = 'EXPO_PUBLIC_DEV_BYPASS_HOTSPOT_CONNECT';
const LOCAL_SETUP_BASE_ENV = 'EXPO_PUBLIC_LOCAL_SETUP_BASE_URL';

let runtimeReleaseBypassOverride: boolean | null = null;
let runtimeLocalSetupBaseOverride: string | null = null;

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

function normalizeOptionalBaseUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }
  return normalizeBaseUrl(trimmed);
}

export function initializeSetupRuntimeConfig(config: {
  releaseBypassHotspotConnect?: boolean | null;
  localSetupBaseUrl?: string | null;
}): void {
  runtimeReleaseBypassOverride =
    typeof config.releaseBypassHotspotConnect === 'boolean'
      ? config.releaseBypassHotspotConnect
      : null;
  runtimeLocalSetupBaseOverride = normalizeOptionalBaseUrl(config.localSetupBaseUrl);
}

function isReleaseBypassEnabled(): boolean {
  if (runtimeReleaseBypassOverride !== null) {
    return runtimeReleaseBypassOverride;
  }
  return asEnabledFlag(readEnv(RELEASE_BYPASS_ENV));
}

export function isDevOnboardingBypassEnabled(): boolean {
  if (isDevBuild()) {
    return asEnabledFlag(readEnv(DEV_BYPASS_ENV));
  }
  return isReleaseBypassEnabled();
}

export function resolveLocalSetupBaseUrl(): string {
  if (!isDevBuild() && !isReleaseBypassEnabled()) {
    return DEFAULT_LOCAL_SETUP_BASE_URL;
  }
  if (runtimeLocalSetupBaseOverride) {
    return runtimeLocalSetupBaseOverride;
  }
  const configured = readEnv(LOCAL_SETUP_BASE_ENV);
  if (!configured) {
    return DEFAULT_LOCAL_SETUP_BASE_URL;
  }
  return normalizeBaseUrl(configured);
}
