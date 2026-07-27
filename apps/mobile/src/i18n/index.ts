/**
 * i18next + react-i18next, seeded from the device locale via expo-localization.
 *
 * The chosen language is *not* stored here — it lives on the Realm
 * `UserProfile` row (picked on the first onboarding screen), and
 * `src/app/_layout.tsx` pushes it into i18next once the database is open. This
 * module only decides what to show before that happens.
 */
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import pt from "./locales/pt.json";

export const languages = ["pt", "en"] as const;
export type Language = (typeof languages)[number];

/** Full BCP-47 tags, used for `Intl` date/number formatting. */
export const localeTag: Record<Language, string> = {
  pt: "pt-BR",
  en: "en-US",
};

export function isLanguage(value: string | null | undefined): value is Language {
  return value === "pt" || value === "en";
}

/** The device's language when it is one we ship, English otherwise. */
export function deviceLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  return isLanguage(code) ? code : "en";
}

void i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
  },
  lng: deviceLanguage(),
  fallbackLng: "en",
  // Keys are namespaced by the leading segment ("home.recents"), not by files.
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function changeLanguage(language: Language): void {
  void i18n.changeLanguage(language);
}

/** The active `Intl` locale tag — for `toLocaleDateString` and friends. */
export function currentLocaleTag(): string {
  return isLanguage(i18n.resolvedLanguage) ? localeTag[i18n.resolvedLanguage] : localeTag.en;
}

export default i18n;
