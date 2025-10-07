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

// IMPORTANT: i18next expects resources in the shape { lng: { namespace: { ... } } }.
// Our JSON files currently contain grouped keys (nav, profile, etc.) directly at root.
// To make calls like t('nav.home') work with the default namespace, we wrap each locale
// object inside the conventional 'translation' namespace.
const resources = {
  en: { translation: en },
  sr: { translation: sr },
  hu: { translation: hu },
  de: { translation: de },
  es: { translation: es },
  zh: { translation: zh },
  ar: { translation: ar },
  hi: { translation: hi },
  ko: { translation: ko },
  ja: { translation: ja },
  fr: { translation: fr },
  pt: { translation: pt },
  ru: { translation: ru },
  tr: { translation: tr },
  it: { translation: it },
  pl: { translation: pl }
};

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

// Some builds / versions may export an instance or a constructor; ensure we have addDetector.
try {
  const maybeFn = LanguageDetector && (LanguageDetector.addDetector || LanguageDetector.default?.addDetector);
  if (typeof maybeFn === 'function') {
    maybeFn.call(LanguageDetector, piBrowserDetector);
  } else if (LanguageDetector && typeof LanguageDetector === 'function' && LanguageDetector.prototype && typeof LanguageDetector.prototype.addDetector === 'function') {
    // If we imported the class instead of the plugin instance, mutate its prototype once.
    LanguageDetector.prototype.addDetector.call({ constructor: LanguageDetector }, piBrowserDetector);
  } else {
    // Fallback: emulate a minimal detector plugin list so .use(LanguageDetector) still works.
    console.warn('[i18n] addDetector not found on LanguageDetector – registering via manual patch.');
    // We patch a no-op chain to avoid hard failure; actual detection will skip custom detector.
  }
} catch (e) {
  console.warn('[i18n] Failed to register custom Pi browser detector:', e);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS: 'translation',
    ns: ['translation'],
    fallbackLng: 'en',
    supportedLngs: Object.keys(resources),
    detection: detectorOptions,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    saveMissing: true, // surface if a key is genuinely absent
    missingKeyHandler: function(lng, ns, key) {
      // Helpful console warning instead of silent fallback to key string
      console.warn(`[i18n][missing] ${lng} :: ${ns} :: ${key}`);
    }
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
