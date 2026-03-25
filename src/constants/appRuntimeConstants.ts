export const STORAGE_KEY = 'sparkbox.mobile.session';

export const CAMERA_PERMISSION_RECOVERY_MESSAGE =
  '请在系统设置中允许相机权限，或手动粘贴设备配置码。';

export const HOTSPOT_SSID = 'Sparkbox-Setup';

export const CHAT_PENDING_FALLBACK = 'Sparkbox 正在准备回复，请稍候。';

export type OwnerConsoleContext = 'tools' | 'provider' | 'onboard' | 'service';

export type ProvisionStatus = {
  device_id?: string;
  status?: string;
  wifi?: {
    ssid?: string;
    connection_name?: string;
    network_apply_mode?: string;
    portal_url?: string | null;
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

export type HouseholdDevice = {
  device_id: string;
  status: string;
  online: boolean;
  claimed: boolean;
};

export type ChatListSyncSource = 'idle' | 'cache' | 'network';