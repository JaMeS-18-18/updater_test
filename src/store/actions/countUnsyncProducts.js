export function INCREMENT() {
  return {
    type: 'INCREMENT',
  };
}

export function DECREMENT() {
  return {
    type: 'DECREMENT',
  };
}

export function SET_UNSYNC_PRODUCTS(payload) {
  return {
    type: 'SET_UNSYNC_PRODUCTS',
		payload: payload
  };
}

export function RESET() {
  return {
    type: 'RESET',
  };
}