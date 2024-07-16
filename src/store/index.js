import { createStore } from 'redux';
import { loadState } from './localStorage'
import { rootReducer } from './reducers/index';

const persistedState = loadState();

export const store = createStore(
	rootReducer,
	persistedState,
	window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);