
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import enMessages from "../../messages/en.json";
import siMessages from "../../messages/si.json";
import taMessages from "../../messages/ta.json";

const resources = {
  en: {
    translation: enMessages,
  },
  si: {
    translation: siMessages,
  },
  ta: {
    translation: taMessages,
  },
};

const i18n = i18next.createInstance();

i18n.use(initReactI18next);

if (!i18n.isInitialized) {
  void i18n.init({
    resources,
    lng: "en",
    fallbackLng: "en",
    supportedLngs: ["en", "si", "ta"],
    defaultNS: "translation",
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });
}

export default i18n;
