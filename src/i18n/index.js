import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// We will load static JSON resources bundled at build time instead of HTTP backend for simplicity.
// Add resources incrementally; fallback to English.

import en from './locales/en.json';
import sr from './locales/sr.json';
import hu from './locales/hu.json';
import de from './locales/de.json';
import es from './locales/es.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';
import ko from './locales/ko.json';
import ja from './locales/ja.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import tr from './locales/tr.json';
import it from './locales/it.json';
import pl from './locales/pl.json';

const resources = { en, sr, hu, de, es, zh, ar, hi, ko, ja, fr, pt, ru, tr, it, pl };

// Helper: detect Pi Browser locale if available
function detectPiBrowserLocale() {
  try {
    if (window?.Pi?.platform?.locale) {
      const raw = window.Pi.platform.locale; // e.g. 'en_US'
      if (typeof raw === 'string' && raw.length >= 2) return raw.split(/[-_]/)[0];
    }
  } catch {}
  return null;
}

const detectorOptions = {
  // Custom order: localStorage (persisted), piBrowser (custom), navigator, htmlTag
  order: ['localStorage', 'piBrowser', 'navigator', 'htmlTag'],
  lookupLocalStorage: 'appLanguage',
  caches: ['localStorage'],
  // Add custom detector for Pi Browser later via addDetector
};

// Add custom language detector for Pi Browser
const piBrowserDetector = {
  name: 'piBrowser',
  lookup() { return detectPiBrowserLocale(); }
};

LanguageDetector.addDetector(piBrowserDetector);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: Object.keys(resources),
    detection: detectorOptions,
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  });

// Update <html lang> and dir on language change for RTL support
const RTL_LANGS = new Set(['ar', 'fa']);
function applyHtmlLangDir(lng) {
  try {
    const html = document.documentElement;
    html.setAttribute('lang', lng);
    const dir = RTL_LANGS.has(lng) ? 'rtl' : 'ltr';
    html.setAttribute('dir', dir);
  } catch {}
}
applyHtmlLangDir(i18n.language);
i18n.on('languageChanged', applyHtmlLangDir);

export default i18n;
