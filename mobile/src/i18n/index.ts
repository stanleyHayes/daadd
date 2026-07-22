import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import enTranslation from './locales/en.json';
import esTranslation from './locales/es.json';
import frTranslation from './locales/fr.json';
import deTranslation from './locales/de.json';
import ptTranslation from './locales/pt.json';
import svTranslation from './locales/sv.json';

export const LANGUAGE_STORAGE_KEY = 'daadd-language';

export const languages: Record<string, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇺🇸' },
  es: { name: 'Español', flag: '🇪🇸' },
  fr: { name: 'Français', flag: '🇫🇷' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  pt: { name: 'Português', flag: '🇵🇹' },
  sv: { name: 'Svenska', flag: '🇸🇪' },
};

const resources = {
  en: { translation: enTranslation },
  es: { translation: esTranslation },
  fr: { translation: frTranslation },
  de: { translation: deTranslation },
  pt: { translation: ptTranslation },
  sv: { translation: svTranslation },
};

function getDeviceLanguage(): string {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return code in languages ? code : 'en';
}

// Synchronous init with the device language so the first render is localized.
// The user's manual choice (AsyncStorage) is applied afterwards by initI18n().
i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

/**
 * Loads the user's manually selected language from AsyncStorage.
 * A manual choice always wins over the device language.
 */
export async function initI18n(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && saved in languages && saved !== i18n.language) {
      await i18n.changeLanguage(saved);
    }
  } catch {
    // Ignore storage errors — keep the device language.
  }
}

/** Switches the language and persists the choice. */
export async function setLanguage(code: string): Promise<void> {
  if (!(code in languages)) return;
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    // Language still switched in-memory if persistence fails.
  }
}

export default i18n;
