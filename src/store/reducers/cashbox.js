const cashboxReducer = function (state = {}, action) {
  switch (action.type) {
    case "SET_CASHBOX":
			return state = action.payload;
    default:
      return state;
  }
};

export default cashboxReducer