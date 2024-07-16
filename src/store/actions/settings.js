export function SET_INTERNET(payload) {
  return {
    type: 'SET_INTERNET',
    payload: payload,
  };
}

export function SET_LOCK_SCREEN() {
  return {
    type: 'SET_LOCK_SCREEN',
  };
}

export function SET_UNLOCK_SCREEN() {
  return {
    type: 'SET_UNLOCK_SCREEN',
  };
}

export function SET_SETTINGS(payload) {
  return {
    type: 'SET_SETTINGS',
		payload: payload,
  };
}

export function SET_PRINTER_BROKEN(payload) {
  return {
    type: 'SET_PRINTER_BROKEN',
		payload: payload,
  };
}
