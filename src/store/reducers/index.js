import { combineReducers } from 'redux'
import posList from './posList'
import cashbox from './cashbox'
import shift from './shift'
import account from './account'
import loader from './loader'
import backendHelpers from './backendHelpers'
import countUnsyncProducts from './countUnsyncProducts'
import settings from './settings'

const allReducers = combineReducers({
	posList,
	cashbox,
	shift,
	account,
	loader,
	backendHelpers,
	countUnsyncProducts,
	settings,
})

export const rootReducer = (state, action) => {
  // when a logout action is dispatched it will reset redux state
  if (action.type === 'USER_LOGGED_OUT') {
    state = undefined;
  }

  return allReducers(state, action);
};

export default rootReducer;