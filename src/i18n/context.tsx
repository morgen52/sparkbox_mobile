import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Locale, TranslationDict } from './types';
import { interpolate } from './types';
import { zh } from './zh';
import { en } from './en';
import { loadStoredLocale, persistLocale } from './storage';

const dictionaries: Record<Locale, TranslationDict> = { zh, en };

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue>({
  locale: 'zh',
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadStoredLocale().then((l) => {
      setLocaleState(l);
      setReady(true);
    });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    persistLocale(l);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = dictionaries[locale];
      const template = dict[key] ?? dictionaries.zh[key] ?? key;
      return interpolate(template, params);
    },
    [locale],
  );

  if (!ready) return null;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useT() {
  return useContext(I18nContext).t;
}
