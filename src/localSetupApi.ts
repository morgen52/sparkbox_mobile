import { resolveLocalSetupBaseUrl } from './devSetupConfig';

export type LocalSetupNetwork = {
  ssid: string;
  signal_percent?: number;
  requires_password?: boolean;
  known?: boolean;
  security?: string;
  support_level?: string;
  support_reason?: string;
};

export type LocalSetupNetworksResponse = {
  networks: LocalSetupNetwork[];
  scan_mode?: string;
  scan_error?: string;
  cached_networks_scanned_at?: string;
};

export type LocalSetupStatus = {
  status?: string;
  wifi?: {
    ssid?: string;
    connection_name?: string;
    network_apply_mode?: string;
    portal_url?: string | null;
    last_error?: string;
  };
  pairing?: {
    device_id?: string;
    pending_pairing_token?: boolean;
    device_proof_status?: string;
    last_error?: string;
  };
  last_command?: {
    ok?: boolean;
    type?: string;
    message?: string;
  };
};

export function buildLocalSetupEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${resolveLocalSetupBaseUrl()}${cleanPath}`;
}

export async function listLocalSetupNetworks(): Promise<LocalSetupNetworksResponse> {
  return localSetupJson<LocalSetupNetworksResponse>('/api/setup/networks', {
    method: 'GET',
  });
}

export async function submitLocalSetupNetwork({
  ssid,
  password,
  pairingToken,
}: {
  ssid: string;
  password: string;
  pairingToken?: string;
}): Promise<LocalSetupStatus> {
  return localSetupJson<LocalSetupStatus>('/api/setup/network', {
    method: 'POST',
    body: JSON.stringify({
      ssid,
      password,
      pairing_token: pairingToken,
    }),
  });
}

export async function readLocalSetupResult(): Promise<LocalSetupStatus> {
  return localSetupJson<LocalSetupStatus>('/api/setup/result', {
    method: 'GET',
  });
}

async function localSetupJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(buildLocalSetupEndpoint(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = `Local setup request failed: ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === 'string' && body.detail.trim()) {
        detail = body.detail.trim();
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  return (await response.json()) as T;
}

export function isLikelyLocalSetupHandoffError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error || '').toLowerCase();
  return (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed')
  );
}
