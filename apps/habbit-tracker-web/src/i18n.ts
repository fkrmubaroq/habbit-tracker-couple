import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationID from "./locales/id.json";
import translationEN from "./locales/en.json";

const resources = {
  id: {
    translation: translationID,
  },
  en: {
    translation: translationEN,
  },
};

// Check localStorage for preferred language, fallback to 'id'
const savedLanguage = localStorage.getItem("language") || "id";

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: "id",
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
