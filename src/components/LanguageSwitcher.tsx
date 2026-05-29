'use client';

import { useLocale, LOCALES } from '@/i18n/I18nContext';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map((l) => (
        <button
          key={l.value}
          onClick={() => setLocale(l.value)}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            locale === l.value
              ? 'bg-zinc-900 text-white shadow-sm'
              : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
          }`}
          title={l.label}
        >
          {l.value === 'en' ? 'EN' : '繁'}
        </button>
      ))}
    </div>
  );
}
