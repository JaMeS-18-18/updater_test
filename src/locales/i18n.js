import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ru from './ru.json';
import uzCyrl from './uzCyrl.json';
import uzLatn from './uzLatn.json';

const resources = {
	"ru": {
    translation: ru,
  },
	"uz-Cyrl-UZ": {
    translation: uzCyrl,
  },
	"uz-Latn-UZ": {
    translation: uzLatn,
  },
}

var lang = "ru"
if(localStorage.getItem('lang')) {
 	lang = localStorage.getItem('lang')
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: lang,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

export default i18n;