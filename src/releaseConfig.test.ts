import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = join(__dirname, '..');

const appConfig = JSON.parse(readFileSync(join(repoRoot, 'app.json'), 'utf8'));
const easConfig = JSON.parse(readFileSync(join(repoRoot, 'eas.json'), 'utf8'));
const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));

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
  });
});
