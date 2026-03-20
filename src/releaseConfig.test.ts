import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = join(__dirname, '..');

const appConfig = JSON.parse(readFileSync(join(repoRoot, 'app.json'), 'utf8'));
const easConfig = JSON.parse(readFileSync(join(repoRoot, 'eas.json'), 'utf8'));
const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const buildGradle = readFileSync(join(repoRoot, 'android', 'app', 'build.gradle'), 'utf8');
const androidManifest = readFileSync(
  join(repoRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
  'utf8',
);
const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');

describe('release config', () => {
  it('pins OTA updates to the Expo project runtime', () => {
    expect(appConfig.expo.runtimeVersion).toEqual({ policy: 'appVersion' });
    expect(appConfig.expo.updates.url).toBe(
      'https://u.expo.dev/aeabd579-045e-45bd-9ccd-fd00cdfc1369',
    );
  });

  it('declares stable EAS Update channels for preview and production builds', () => {
    expect(easConfig.build.development.channel).toBe('preview');
    expect(easConfig.build.preview.channel).toBe('preview');
    expect(easConfig.build.production.channel).toBe('production');
  });

  it('exposes scripts for OTA publishing and preview builds', () => {
    expect(packageJson.scripts['build:preview']).toBe('npx eas-cli build --profile preview');
    expect(packageJson.scripts['update:preview']).toBe('npx eas-cli update --channel preview');
    expect(packageJson.scripts['build:android:local']).toBe('./scripts/build-android-local.sh release');
  });

  it('supports a dedicated Android release keystore instead of only the debug signing config', () => {
    expect(buildGradle).toContain('SPARKBOX_UPLOAD_STORE_FILE');
    expect(buildGradle).toContain('signingConfigs.release');
  });

  it('documents the hotspot-first unified native app instead of the retired BLE-only flow', () => {
    expect(readme).toContain('Home / Chat / Files / Tasks / Settings');
    expect(readme).toContain('hotspot');
    expect(readme).not.toContain('BLE-first replacement');
  });

  it('does not require bluetooth permissions or plugins for the hotspot-first app shell', () => {
    const permissions = appConfig.expo.android.permissions as string[];
    expect(permissions).not.toContain('android.permission.BLUETOOTH_SCAN');
    expect(permissions).not.toContain('android.permission.BLUETOOTH_CONNECT');
    expect(permissions).not.toContain('android.permission.BLUETOOTH');
    expect(permissions).not.toContain('android.permission.BLUETOOTH_ADMIN');
    expect(appConfig.expo.plugins).not.toContain('react-native-ble-plx');
    expect(appConfig.expo.ios.infoPlist?.NSBluetoothAlwaysUsageDescription).toBeUndefined();
    expect(androidManifest).not.toContain('android.permission.BLUETOOTH_SCAN');
    expect(androidManifest).not.toContain('android.permission.BLUETOOTH_CONNECT');
    expect(androidManifest).not.toContain('android.permission.BLUETOOTH');
    expect(androidManifest).not.toContain('android.permission.BLUETOOTH_ADMIN');
    expect(androidManifest).not.toContain('android.permission.ACCESS_FINE_LOCATION');
    expect(androidManifest).not.toContain('android.permission.ACCESS_COARSE_LOCATION');
  });
});
