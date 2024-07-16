const shiftReducer = function (state = {}, action) {
  switch (action.type) {
    case "SET_SHIFT":
			return state = action.payload;
    default:
      return state;
  }
};

export default shiftReducer