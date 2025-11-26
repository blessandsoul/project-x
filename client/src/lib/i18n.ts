import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'ka', // Force Georgian as default language
    fallbackLng: 'ka',
    supportedLngs: ['ka', 'en', 'ru', 'ar'],
    debug: import.meta.env.DEV,
    
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },

    backend: {
      // versioned query param to force browsers/dev server to refetch updated translation files
      loadPath: '/locales/{{lng}}/translation.json?v=21',
    },

    detection: {
      // Only check localStorage, ignore browser language
      order: ['localStorage'],
      caches: ['localStorage'],
    },
  });

// Handle RTL for Arabic
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

export default i18n;


