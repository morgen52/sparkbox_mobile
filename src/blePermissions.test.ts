import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = join(__dirname, '..');
const appSource = readFileSync(join(repoRoot, 'App.tsx'), 'utf8');

describe('hotspot-first onboarding shell', () => {
  it('removes the retired BLE onboarding helpers from App.tsx', () => {
    expect(appSource).not.toContain('async function scanNearbySparkboxes(');
    expect(appSource).not.toContain('async function probeNearbySparkbox(');
    expect(appSource).not.toContain('async function connectToSparkbox(');
    expect(appSource).not.toContain('async function requestBlePermissions(');
    expect(appSource).not.toContain('async function waitForBluetoothReady(');
  });
});
