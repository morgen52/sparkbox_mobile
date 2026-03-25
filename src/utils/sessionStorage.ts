import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '../authFlow';
import { STORAGE_KEY } from '../constants/appRuntimeConstants';

export async function loadStoredSession(): Promise<Session | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }
  return JSON.parse(stored) as Session;
}

export async function persistStoredSession(nextSession: Session | null): Promise<void> {
  if (nextSession) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}