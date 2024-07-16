const loaderReducer = function (state = 0, action) {
  switch (action.type) {
    case "INCREMENT":
      return state + 1;
		case "DECREMENT":
				return state - 1;
		case "SET_UNSYNC_PRODUCTS":
			return state = action.payload;
    case "RESET":
      return state = 0;
    default:
      return state;
  }
};

export default loaderReducer