import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
/* REDUX AND STORE IT TO LOCALSTORAGE */
import { store } from './store'
import { Provider }  from 'react-redux'
import { saveState } from './store/localStorage'
import { throttle } from 'lodash';
import './locales/i18n';
import { clearTemporaryStorage } from 'helpers/helpers'

import { registerLocale, setDefaultLocale } from  "react-datepicker";
import ru from 'date-fns/locale/ru';

if(process.env.NODE_ENV === 'production') {
	if(!window.location.href.includes('index.html#/')) {
		clearTemporaryStorage()
	}
}

if(localStorage.getItem('lang') === null || localStorage.getItem('lang') === undefined) {
	localStorage.setItem('lang', 'ru')
}

store.subscribe(throttle(() => {
  saveState(store.getState())
}, 100));

registerLocale('ru', ru)
setDefaultLocale ('ru', ru)

ReactDOM.render(
  // <React.StrictMode>
  //   <App />
  // </React.StrictMode>,
	<Provider store={store}>
		<App />
	</Provider>,
  document.getElementById('root')
);
