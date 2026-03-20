export type SetupPageMessage = {
  type: string;
  payload: Record<string, unknown>;
};

const LOCAL_SETUP_BASE_URL = 'http://192.168.4.1:8080/setup';

export function buildLocalSetupUrl({
  deviceId,
  pairingToken,
  returnTo,
  hintSsid,
}: {
  deviceId: string;
  pairingToken: string;
  returnTo: string;
  hintSsid?: string | null;
}): string {
  const query = new URLSearchParams({
    device_id: deviceId,
    pairing_token: pairingToken,
    return_to: returnTo,
    embedded: '1',
  });
  if (hintSsid && hintSsid.trim()) {
    query.set('hint_ssid', hintSsid.trim());
  }
  return `${LOCAL_SETUP_BASE_URL}?${query.toString()}`;
}

export function parseSetupPageMessage(raw: string): SetupPageMessage | null {
  try {
    const parsed = JSON.parse(raw) as { type?: unknown; payload?: unknown };
    if (typeof parsed.type !== 'string') {
      return null;
    }
    return {
      type: parsed.type,
      payload: isRecord(parsed.payload) ? parsed.payload : {},
    };
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
