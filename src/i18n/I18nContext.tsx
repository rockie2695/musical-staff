'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { Locale, Messages } from './messages';
import { getMessages, LOCALES } from './messages';

const LOCALE_COOKIE = 'staff-locale';

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'zh-TW';
  // Check cookie
  const match = document.cookie.match(new RegExp(`(^| )${LOCALE_COOKIE}=([^;]+)`));
  if (match) {
    const val = match[2] as Locale;
    if (val === 'en' || val === 'zh-TW') return val;
  }
  // Check browser language
  const lang = navigator.language || '';
  if (lang.startsWith('zh')) return 'zh-TW';
  return 'en';
}

interface I18nContextValue {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** Deep key access, e.g. "app.title" */
function resolvePath(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? getInitialLocale());

  const setLocale = useCallback((loc: Locale) => {
    setLocaleState(loc);
    document.cookie = `${LOCALE_COOKIE}=${loc};path=/;max-age=31536000`;
    // Also update html lang
    document.documentElement.lang = loc;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const messages = getMessages(locale);

  const t = useCallback(
    (path: string) => resolvePath(messages as unknown as Record<string, unknown>, path),
    [messages],
  );

  return (
    <I18nContext.Provider value={{ locale, messages, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useLocale must be used within I18nProvider');
  return ctx;
}

export { LOCALE_COOKIE, LOCALES };
export type { I18nContextValue };
