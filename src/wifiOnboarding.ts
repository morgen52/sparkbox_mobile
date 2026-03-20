import { NativeModules } from 'react-native';

type NativeWifiOnboarding = {
  connectToSetupHotspot(ssid: string): Promise<{ ssid: string }>;
  connectToHomeWifi(ssid: string, password: string): Promise<{ ssid: string }>;
  getCurrentSsid(): Promise<string | null>;
  openInternetPanel(): Promise<void>;
  clearSessionWifiState(): Promise<void>;
};

function getNativeBridge(): NativeWifiOnboarding {
  const bridge = (NativeModules as { SparkboxWifiOnboarding?: NativeWifiOnboarding }).SparkboxWifiOnboarding;
  if (!bridge) {
    throw new Error('Sparkbox Wi-Fi onboarding is not available on this build.');
  }
  return bridge;
}

export async function connectToSetupHotspot(ssid: string): Promise<{ ssid: string }> {
  return getNativeBridge().connectToSetupHotspot(ssid);
}

export async function connectToHomeWifi(ssid: string, password: string): Promise<{ ssid: string }> {
  return getNativeBridge().connectToHomeWifi(ssid, password);
}

export async function getCurrentSsid(): Promise<string | null> {
  return getNativeBridge().getCurrentSsid();
}

export async function openInternetPanel(): Promise<void> {
  return getNativeBridge().openInternetPanel();
}

export async function clearSessionWifiState(): Promise<void> {
  return getNativeBridge().clearSessionWifiState();
}
