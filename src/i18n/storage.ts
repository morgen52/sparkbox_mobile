import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Locale } from './types';

const LOCALE_STORAGE_KEY = 'sparkbox.mobile.locale';

export async function loadStoredLocale(): Promise<Locale> {
  const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === 'en' || stored === 'zh') return stored;
  return 'zh';
}

export async function persistLocale(locale: Locale): Promise<void> {
  await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
}
