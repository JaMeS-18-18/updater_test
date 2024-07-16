const accountReducer = function (state = {}, action) {
  switch (action.type) {
    case "SET_ACCOUNT":
			return state = action.payload;
    default:
      return state;
  }
};

export default accountReducer